import type { Container } from 'dockerode';
import { depFn, globalDepContext, keyDep } from 'modules/deps/index';
import { Entity, EntityField } from 'modules/entities';
import { publicInvariant } from 'modules/errors/index';
import parseArgs from 'string-argv';
import { ZodType, z } from 'zod';
import { Deps } from '../Deps';
import { ChatEntity } from '../entities/ChatEntity';
import { ParseMessage } from '../formattings/parseMessage';
import { getProjectDirs, getProjectTasks } from '../project/util/projectInfo';
import zodSchemaToTypeString from "../zodSchemaToTypeString";
import { createPortMappingsConfig } from './createPortMappings';
import Errors, { AllErrorSchemas, TypedErrorValue } from './errorSchemas';
import Resolutions, { CompleteResolutionArrSchema, CompleteResolutions, ResolutionArrSchema, ResolutionType } from './resolutionSchemas';
const Ignore = require('ignore');

const usedPorts = new Set<number>();
const provideSingle = <T = any>(key: string) => Object.values(globalDepContext.provideSync({ [key]: keyDep(key) }))[0] as T
class CheckTrigger {
  interval: number;
  charFreq: number;
  handleOutputChunks: (chunks: { chunk: string, bufferName: string }[]) => void;
  outputBuffers: { [name: string]: string };
  timer: NodeJS.Timeout | null;

  constructor({ interval, charFreq: charLimit, handleOutputChunks }: { interval; charFreq; handleOutputChunks: (chunks: { chunk: string; bufferName: string; }[]) => void; }) {
    this.interval = interval;
    this.charFreq = charLimit;
    this.handleOutputChunks = handleOutputChunks;
    this.outputBuffers = {};
    this.start()
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  start() {
    this.stop();
    // this.timer = setInterval(() => {
    //   this.flush()
    // }, this.interval);
  }


  check(output: string, bufferName: string) {
    if (!this.outputBuffers[bufferName]) {
      this.outputBuffers[bufferName] = '';
    }
    this.outputBuffers[bufferName] += output;
    if (this.outputBuffers[bufferName].length >= this.charFreq) {
      this.flush(bufferName);
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush(bufferName);
        this.timer = null;
      }, this.interval);
    }
  }

  manualTrigger(bufferName) {
    this.flush(bufferName);
  }

  flush(bufferName = '') {
    // this.handleOutputChunk(this.outputBuffers[bufferName], bufferName);
    // this.outputBuffers[bufferName] = '';

    // for now flush all buffers
    this.handleOutputChunks(Object.entries(this.outputBuffers).map(([bufferName, chunk]) => ({ chunk, bufferName })));
  }
}



const getDocker = () => provideSingle<typeof import('dockerode')>('Docker');
const newDocker = () => new (getDocker())();
const getPath = () => provideSingle<typeof import('path')>('path');
const getFs = () => provideSingle<typeof import('fs')>('fs');
const getFse = () => provideSingle<typeof import('fs-extra')>('fs-extra');
const getTarStream = () => provideSingle<typeof import('tar-stream')>('tar');
const getTar = () => provideSingle<typeof import('tar')>('tarr');
const getTarFS = () => provideSingle<typeof import('tar-fs')>('tar-fs');

const genDockerFile = ({ cwd }: { cwd?: string }) => `
FROM node:18.16.1

WORKDIR /app

COPY . .

${cwd ? `WORKDIR ${cwd}` : ''}

RUN yarn
`

function findUnusedPort() {
  const start = 5001;
  const end = 6000;
  for (let i = start; i < end; i++) {
    if (!usedPorts.has(i)) {
      usedPorts.add(i);
      return i;
    }
  }
  throw new Error(`No unused ports between ${start} and ${end}`);
}

const getContainerOpts = () => {
  return {
    Cmd: ['sh'],
    Tty: false,
    AttachStdout: true,
    OpenStdin: true,
    Labels: {
      [ourLabel]: 'true',
    },
    HostConfig: {
      // Limit to 512mb RAM
      Memory: 1024 * 1024 * 1024 * 0.5,
      // Limit to 50% of one CPU core
      CpuShares: 512,
    }
  }
}

const ourLabel = 'ai-chat-task';

async function killAndRemoveContainersWithLabel(label = ourLabel) {
  const docker = newDocker();
  docker.listContainers({ all: true, filters: { label: [label] } }, function (err, containers) {
    if (err) {
      console.error('Error listing containers:', err);
      return;
    }

    containers?.forEach(function (containerInfo) {
      var container = docker.getContainer(containerInfo.Id);

      container.stop(function (err, data) {
        if (err) {
          console.error('Error stopping container:', err);
          return;
        }

        container.remove(function (err, data) {
          if (err) {
            console.error('Error removing container:', err);
            return;
          }

          console.log('Container removed:', containerInfo.Id);
        });
      });
    });
  });
}
setTimeout(() => {
  killAndRemoveContainersWithLabel().then(() => { }).catch(e => console.error(e));
}, 1000)

async function copyFilesToContainer(filePaths: { path: string; content?: string | Buffer }[], container: Container) {
  const tar = getTarStream()
  const pack = tar.pack()

  for (const filePath of filePaths) {
    const { path, content } = filePath;
    const entry = pack.entry({ name: path }, content);
  }

  pack.finalize();

  return new Promise((resolve, reject) => {
    container.putArchive(pack, { path: '/app' }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}


// Function to create a Docker container
async function createContainer({ dir, cwd, env, containerOpts, puppeteer, url }: { dir: string, cwd?: string, env?: Record<string, any>, puppeteer?: boolean, url?: string, containerOpts?: any }) {
  const path = getPath();
  const fs = getFs();
  const ignore = Ignore();

  let customDockerFileName = 'AIDockerfile';
  const docker = newDocker();

  // If puppeteer is true, create a Dockerfile for a barebones node project
  if (puppeteer) {
    customDockerFileName = 'Dockerfile';
    dir = `/Users/andrewshand/Downloads/puppeteer-in-docker-in-m1-main` // not needed anymore but this is the path to the repo
    const container = await docker.createContainer({
      Image: `puppeteerm1:latest`,
      ...getContainerOpts(),
      ...containerOpts,
    })

    await copyFilesToContainer([
      {
        path: 'index.js', content: `
      const getBrowser = require('./puppeteer');
      (async () => {
        const browser = await getBrowser()
        const page = await browser.newPage();
        await page.goto('${url ?? 'http://localhost:3000'}');
        await page.screenshot({ path: 'example.png' });
        await browser.close();
      })();
    ` },

    ], container);
    return container;

  } else {
    const gitignoreContent = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    ignore.add(gitignoreContent.split('\n'));

    // Add custom dockerfile to dir
    const dockerfile = path.join(dir, customDockerFileName);
    fs.writeFileSync(dockerfile, genDockerFile({ cwd }));
  }

  const tarFs = getTarFS();

  const tarStream = tarFs.pack(dir, {
    ignore: (name: string) => {
      const relativeStr = path.relative(dir, name);
      return ignore.ignores(relativeStr);
    },
  })


  // Ensure we have the node:latest image first
  await docker.pull('node');

  const imageName = puppeteer ? 'puppeteer' : 'node-ai';
  const image = await docker.buildImage(tarStream, { t: imageName, dockerfile: customDockerFileName, ...(puppeteer ? { platform: 'linux/amd64' } : {}) });
  await new Promise((resolve, reject) => {
    image.pipe(process.stdout);
    image.on('end', resolve);
    image.on('error', reject);
  });

  const port = findUnusedPort();
  const container = await docker.createContainer({
    Image: imageName,
    ...getContainerOpts(),
    ...containerOpts
  });

  return container;
}



async function createCloneContainer(container: Container, opts) {
  // Commit the changes in the container to a new image
  const docker = newDocker();
  const image = await container.commit();

  // Create a new container from the new image
  const cloneContainer = await docker.createContainer({
    Image: image.Id,
    ...getContainerOpts(),
    ...opts
  });

  return cloneContainer;
}

// Function to start a Docker container
async function startContainer(container) {
  await container.start();
}

// Function to create a tar stream with project code
function createTarStream() {
  const fs = getFs();
  const tar = getTarStream();
  const pack = tar.pack();
  // pack.entry({ name: 'index.js' }, fs.readFileSync('./index.js'));
  // Add other necessary files to the tar stream using pack.entry
  pack.finalize();

  return pack;
}

type SubtaskResult = {
  buffers: Record<string, string>,
  exitCode: number,

}



// Function to execute a command inside a Docker container and retrieve the output stream
async function executeCommand(container: Container, command: string) {
  const exec = await container.exec({
    Cmd: parseArgs(command),
    AttachStdout: true,
    AttachStderr: true,
  });


  // const stream = await exec.start({});
  const stream = await (exec as any).start();
  // typescript says we need the object, but do we?

  return stream;
}

// Function to remove a Docker container
async function removeContainer(container) {
  await container.remove({ force: true });
}
async function stopContainer(container) {
  return new Promise<void>((resolve, reject) => {
    container.stop((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


type ResultAction = {
  type: 'install-package',
  packageName: string
  version?: string
}

/**
 * Represents a result from a previous parent task or something
 */
interface Result {
  errors: Record<string, any>[]
  actions: ResultAction[]
  name: string
}

async function startTask(container: Container, cmd: string, onOutput: (output: string) => void

) {
  const stream = await executeCommand(container, cmd);
  let output = '';

  stream.on('data', (chunk: Buffer) => {
    const asStr = chunk.toString();
    output += asStr;
    onOutput(asStr);
  });

  const promise = new Promise<string>(resolve => {
    stream.on('end', () => {
      console.log(`Task ${cmd} completed successfully`);
      resolve(output);
    });
  });

  return { stream, output, promise };
}

async function runTask(container: Container, cmd: string) {
  const { promise, output } = await startTask(container, cmd, () => { });
  const out = await promise
  return out
}

export class ChatTaskEntity extends Entity {

  @EntityField()
  chat: string;
  @EntityField({ defaultValue: [] })
  resolutions: ResolutionType[] = []

  @EntityField()
  results: Result[]

  @EntityField()
  parentTask?: string;

  get depth() {
    return this.results.length
  }

  getCompletion(...args: any[]) {
    const { getCompletion } = globalDepContext.provideSync({ getCompletion: Deps.getCompletion });
    return getCompletion.call(this, ...args);
  }

  async getZodCompletion<T extends ZodType<any, any>>({ schema, name }: { schema: T, name: string }, prompt: string, ...rest: any[]): Promise<z.infer<T>> {
    const type = zodSchemaToTypeString(schema, name);

    let tries = 0
    const maxtries = 3

    const { getCompletion } = globalDepContext.provideSync({ getCompletion: Deps.getCompletion });
    const amendedPrompt = `${prompt}
    
Format your response as JSON conforming to the following type:
${type}

Do not include any explanation or other text in your response, only the JSON. No other response will be accepted.`

    while (tries < maxtries) {
      tries++
      const result = await getCompletion.call(this, amendedPrompt, ...rest);

      // try parse
      try {
        const parsed = ParseMessage.json(result);
        const validated = schema.parse(parsed);
        return validated;
      } catch (e) {
        console.log(e)
        console.log('Invalid JSON, try again')
      }
    }

    throw new Error(`Invalid JSON after ${maxtries} tries`)
  }

  projectInfo: {
    dir: string
    cwd?: string,
    cmd: string
  }
  containers: { type: 'puppeteer' | 'main', container: Container }[] = [];
  run = depFn({
    container: keyDep<Container>('container', { optional: true })
  }, async ({ container: existingContainer }) => {
    const chat = await this.manager.read(ChatEntity, this.chat);
    const { category } = chat;
    const [task] = getProjectTasks(category ?? '');
    const [dir] = getProjectDirs(category ?? '');
    publicInvariant(!!task, `No task found for category ${category}`);

    const { cmd, env, cwd } = task;
    this.projectInfo = { dir, cwd, cmd }
    const port = task.port ?? 3000
    const puppeteerCmd = 'node index.js';

    const checkTrigger = new CheckTrigger({
      interval: 5000,
      charFreq: 1000,
      handleOutputChunks: async (chunks) => {
        // for (const chunk of chunks) {
        //   console.log('Chunk:', chunk.bufferName, chunk.chunk.toString());
        // }
        try {
          const d = chunks.map(c => c.chunk).join('\n')
          const data = chunks.join('\n')
          if (d.trim().length) {
            await this.handleOutputChunk(chunks.map(c => `${c.bufferName}: ${c.chunk}`).join('\n'))
          }
        } catch (e) {
          console.error('Error handling output chunk', e)
        }
      }
    });

    let container;
    let result: SubtaskResult = {
      buffers: checkTrigger.outputBuffers,
      exitCode: -999,
    }

    const hostPort = findUnusedPort()

    try {
      const portConfig = createPortMappingsConfig({ [port]: hostPort });
      container = existingContainer ?? await createContainer({ dir, cwd, env, containerOpts: portConfig });
      this.containers.push({ type: 'main', container });
      await startContainer(container);

      await this.maybeApplyResolutions({ container })

      const mainTask = await startTask(container, cmd, (output) => {
        checkTrigger.check(output, 'backend');
      });

      const containerAddress = await new Promise((resolve, reject) => {
        container.inspect((err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.NetworkSettings.IPAddress);
          }
        });
      });

      // wait for the server to start
      // TODO better way of doing this
      await new Promise(res => setTimeout(res, 5000));

      // Create a separate container for running Puppeteer
      const puppeteerContainer = await createContainer({ cwd, env, dir, url: `http://${containerAddress}:${port}`, puppeteer: true })
      this.containers.push({ type: 'puppeteer', container: puppeteerContainer });
      await startContainer(puppeteerContainer);
      const puppeteerTask = await startTask(puppeteerContainer, puppeteerCmd, (output) => {
        checkTrigger.check(output, 'frontend');
      });

      await Promise.all([mainTask.promise, puppeteerTask.promise]);
      result.exitCode = mainTask.stream.exitCode;

      console.log('Backend output:', checkTrigger.outputBuffers['backend']);
      console.log('Frontend output:', checkTrigger.outputBuffers['frontend']);
    } catch (error) {
      console.error('Error executing command:', error);
      result.exitCode = -1;
    } finally {
      await this.stopAndRemoveContainers()
    }

    checkTrigger.stop()
    return result;
  });


  async stopAndRemoveContainers() {
    for (const { container } of this.containers) {
      try {
        await stopContainer(container);
        console.log(`Stopped container ${container.id}`);
        await removeContainer(container);
        console.log(`Removed container ${container.id}`);
      } catch (error) {
        console.error(`Error stopping/removing container ${container.id}:`, error);
      }
    }
  }


  async handleOutputChunk(chunk: string) {
    const prompt = `You are a sophisicated software error-catching tool. Your job is to classify errors into one of the following categories: 
  
Missing NPM Package, Typescript Compiler Error, Runtime Error, Expo/Metro Error, Import/Resolution Error, Undeclared Variable, Other. 

Here is the output I need you to classify:
---- START OF OUTPUT ----
${chunk}
---- END OF OUTPUT ----

It is acceptable to respond with an empty object if you don't find any errors.

Do not include messages that are not errors. This includes warnings, logs, and other status messages such as 'App started' or 'Done in 1.23s'.`
    const gptsErrors = await this.getZodCompletion({ name: 'Errors', schema: Errors }, prompt, { model: 'gpt-3.5-turbo-16k' })


    for (const errorType in gptsErrors) {
      const errorsOfType = gptsErrors[errorType] ?? []
      for (const error of errorsOfType) {
        console.log({ error })
        // this[errorType](error)

        if (errorType === 'other') {
          continue
        }

        // Is it an error we've already processed (AND fixed)?

        const fixed = await this.checkFixed({ error })
        if (fixed) {
          continue
        }


        // if fixed, continue
        // if not fixed, should we try fix it again? likely that it will attempt the same fix, so probably not

        // Get the location of the error


        const { file, fileContents: ctx, line } = await this.getErrorFileContext({ error })

        const prompt = `You are a sophisicated software bug-fixing assistant. Your job is to fix the following error:
  
Error type: ${errorType}
Error: ${JSON.stringify({ ...error, file, line })}

${ctx ? `Here is the context of the error:
${file}
\`\`\`
${ctx}
\`\`\`` : ''}

What course of action would you recommend for fixing this error? Be as specific as possible, and try your best not to give general advice.`

        const advice = await this.getCompletion(prompt, { model: 'gpt-3.5-turbo' })
        const categorised = await this.categoriseResolution({ ctx, resolution: advice, error, availableResolutions: Object.keys(Resolutions) })
        if (categorised.length) {
          this.attemptResolutions({ error, resolutions: categorised })
        }
      }
      // TODO Also see if there's a solution to all the errors at once, a higher-level solution
    }
  }


  async getErrorFileContext({ error, fixedAttempt }: { error: TypedErrorValue, fixedAttempt?: boolean }) {
    try {
      if ('file' in error && error.file) {
        // First, let's do some sanity checking on the file path

        let fixed: TypedErrorValue = error
        if (fixedAttempt) {
          fixed = await this.getZodCompletion({ name: 'Error', schema: AllErrorSchemas }, `I need you to do some sanity-checking on the file path in the following error object. 
      
Ideally, the path should correspond to user code, not a library. Specifically the file that is closest to the error shown in the stack trace (if present).

If you believe the path is correct, just respond with the same object. If you believe it is incorrect, please correct it.
\`\`\`json
${JSON.stringify(error)}
\`\`\`
`, { model: 'gpt-3.5-turbo' }) as any as TypedErrorValue
        }

        const { file, line } = fixed as any as { file: string, line?: number }

        const fs = getFs()
        const path = getPath()
        const projectPath = path.join(this.projectInfo.dir, this.projectInfo.cwd ?? '/', file)
        if (fs.existsSync(projectPath)) {
          let fileContents = fs.readFileSync(projectPath, 'utf8')

          return { fileContents, file, line }
          // For now, the below is pointless because nextjs shows the wrong line attached to the tsx file. Shows
          // different result in two outputs. So we'll just show the whole file for now.
          // if (typeof line === 'number') {

          //   return fileContents.split('\n').slice(line - 5, line + 5).join('\n')
          // } else {
          //   return fileContents
          // }
        }
        else {
          throw new Error(`File ${projectPath} does not exist`)
        }
      }
    } catch (e) {
      if (!fixedAttempt) {
        return this.getErrorFileContext({ error, fixedAttempt: true })
      }
      console.error(e)
    }

    return null
  }


  @EntityField({ defaultValue: {} })
  subtaskResults: Record<string, Result> = {};


  checkFixed = async function checkFixed({ error }: { error: TypedErrorValue }) {
    // TODO
    return false
  }



  runSubtask = async ({ resolutions }: { resolutions: ResolutionType[] }) => {
    const mainContainers = this.containers.filter(({ type }) => type === 'main');
    const containerSrc = mainContainers[mainContainers.length - 1]?.container;
    publicInvariant(!!containerSrc, 'No container found');

    // TODO when creating clone conatiner, pass through same port config? or create new port config
    const clonedContainer = await createCloneContainer(containerSrc, {})

    const subtaskEntity = await this.manager.create(ChatTaskEntity, {
      chat: this.chat,
      parentTask: this.id,
      resolutions
    })

    const subtaskResult = await subtaskEntity.run({ container: clonedContainer });
    this.subtaskResults = { ...this.subtaskResults, [subtaskEntity.id]: subtaskResult } as any;
  }

  attemptResolutions(opts: { error: Error, resolutions: ResolutionType[] }) {
    const { error, resolutions } = opts;
    this.runSubtask({ resolutions })
  }

  async categoriseResolution(opts: { ctx: string, resolution: string, error: Error, availableResolutions: string[] }) {
    const { resolution, error } = opts;

    const prompt = `You are a sophisicated software bug-fixing assistant. Your job is to categorise error resolution into one of the following resolution types:

${opts.availableResolutions.map(type => zodSchemaToTypeString(Resolutions[type], type)).join('\n')}

Here is the resolution for the error that has been suggested:
----- START OF RESOLUTION -----
${resolution}
----- END OF RESOLUTION -----

Your response should be an array containing one or more objects that match the type definitions above. Some errors may have a resolution that requires multiple steps, for example.

You must only respond with a JSON array. Do not include any additional explanation before or after the JSON value. This will not be accepted.`

    const result = await this.getCompletion(prompt, { model: 'gpt-3.5-turbo' })
    const parsed = ParseMessage.json(result);

    const prompt2 = `A draft resolution array has been generated in order to fix the following error:
\`\`\`json
${JSON.stringify(error)}
\`\`\`

Here is the resolution object that has been generated:
\`\`\`json
${JSON.stringify(parsed)}
\`\`\`

I need you to fully populate all objects in this resolution array into a final version that can be applied to the error.

You must only respond with an array of the following objects:
${Object.keys(CompleteResolutions).map(type => zodSchemaToTypeString(CompleteResolutions[type], type)).join('\n')}

Resolution context:
\`\`\`
${opts.ctx}
\`\`\`

You must only respond with a JSON array. Do not include any additional explanation before or after the JSON value. This will not be accepted.`

    const result2 = await this.getCompletion(prompt2, { model: 'gpt-4' })
    const parsed2 = ParseMessage.json(result2);

    return CompleteResolutionArrSchema.parse(parsed2);
  }

  async maybeApplyResolutions(opts: { container: Container }) {
    const resolutions: ResolutionType[] = this.resolutions ?? [];

    for (const resolution of resolutions) {
      switch (resolution.type) {
        case 'install-package':
          await applyInstallPackage(resolution, opts.container);
          break;
        case 'edit-file':
          await applyEditFile(resolution, opts.container);
          break;
        case 'create-file':
          await applyCreateFile(resolution, opts.container);
          break;
      }
    }

    async function applyInstallPackage(resolution: typeof Resolutions['installPackage']['_type'], container: Container) {
      const packageName = resolution.package;
      // Run the install-package resolution
      return runTask(container, 'yarn add ' + packageName);
    }

    async function applyEditFile(resolution: typeof Resolutions['editFile']['_type'], container: Container) {
      const { edit } = resolution;
      return copyFilesToContainer([{ path: edit.path, content: 'content' in edit ? edit.content : 'partialContent' in edit ? edit.partialContent as any : '' }], container);
    }

    async function applyCreateFile(resolution: typeof Resolutions['createFile']['_type'], container: Container) {
      const { file, content } = resolution;
      // return applyEditFile({ edit: { path: file, content } }, container);
    }
  }


}
