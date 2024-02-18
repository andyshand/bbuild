import { promises as fs } from 'fs'
import path from 'path'
import Docker from 'dockerode'

interface FileTree {
  [filename: string]: string | FileTree
}

const docker = new Docker()

async function writeFiles(fileTree: FileTree, rootDir: string): Promise<void> {
  for (const [filename, content] of Object.entries(fileTree)) {
    const filePath = path.join(rootDir, filename)
    if (typeof content === 'string') {
      await fs.writeFile(filePath, content)
    } else {
      await fs.mkdir(filePath, { recursive: true })
      await writeFiles(content, filePath)
    }
  }
}

async function runNodeProject(fileTree: FileTree): Promise<void> {
  // Create temp dir for project
  const rootDir = await fs.mkdtemp('node-project-')

  // Write files to file system
  await writeFiles(fileTree, rootDir)

  // Create Docker container
  const container = await docker.createContainer({
    Image: 'node',
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: ['node', 'index.js'],
    HostConfig: {
      Binds: [`${path.resolve(rootDir)}:/app`],
      AutoRemove: true,
    },
  })

  // Start Docker container
  await container.start()

  // Wait for Docker container to finish
  const stream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
  })

  // Log Docker container output to console
  container.modem.demuxStream(stream, process.stdout, process.stderr)

  // Wait for Docker container to exit
  const { StatusCode } = await container.wait()

  if (StatusCode !== 0) {
    console.log(`Process exited with code ${StatusCode}`)
  }

  // Remove Docker container
  await container.remove()

  // Delete the temp dir
  await fs.rmdir(rootDir, { recursive: true })
}

// // Usage
// runNodeProject({
//   'index.js': 'console.log("Hello, world!");',
//   'package.json': JSON.stringify({
//     name: 'my-project',
//     version: '1.0.0',
//     main: 'index.js',
//   }),
// }).catch(console.error)
