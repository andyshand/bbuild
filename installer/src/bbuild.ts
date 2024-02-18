import Docker from "dockerode";
import fs from "fs";
import yaml from "js-yaml";
import os from "os";
import path from "path";
import stream from "stream";

const docker = new Docker();

const removeOldContainers = async (imageName: string) => {
  const containers = (await docker.listContainers({ all: true })).filter(
    (c) => c.Image === imageName
  );

  console.log("Removing old container(s)..");

  await Promise.all(containers.map((c) => docker.getContainer(c.Id).remove()));
};

const runDockerContainer = async () => {
  const projectDir = path.normalize(process.cwd());
  console.debug(`Project directory: ${projectDir}`);

  const imageName = "bbuild";

  // await createImage(imageName);
  await removeOldContainers(imageName);

  console.debug(`Docker image specifier: ${imageName}`);

  // Read dev.yml file
  const devYaml = yaml.load(
    fs.readFileSync(path.join(projectDir, ".universe", "dev.yml"), "utf8")
  );

  const { tasks } = devYaml;

  const allPorts = tasks.reduce((acc: string[], task: any) => {
    if (task.env && "PORT" in task.env) {
      return [...acc, parseInt(task.env.PORT, 10)];
    }
    return acc;
  }, [] as number[]);
  console.debug(`Ports: ${allPorts.join(", ")}`);

  // Kill any existing bbuild containers
  console.debug(`Killing existing bbuild containers...`);
  await docker.listContainers({ all: true }).then(async (containers) => {
    await Promise.all(
      containers.map((containerInfo) => {
        if (
          containerInfo.Image.includes("bbuild") ||
          containerInfo.Labels?.bbuild
        ) {
          return new Promise((resolve) => {
            console.debug(`Killing container ${containerInfo.Id}...`);
            docker.getContainer(containerInfo.Id).kill((err) => {
              if (!err) {
                docker.getContainer(containerInfo.Id).remove();
              }
              resolve(null);
            });
          });
        } else {
          return Promise.resolve(null);
        }
      })
    );
  });

  if (process.env.CLEANUP) {
    // Remove any old bbuild images
    console.debug(`Removing old bbuild images...`);
    docker.listImages().then((images) => {
      images.forEach((imageInfo) => {
        if (
          imageInfo.RepoTags &&
          imageInfo.RepoTags.includes("bbuild:latest")
        ) {
          docker.getImage(imageInfo.Id).remove();
        }
      });
    });
  }

  const portBindings = allPorts.reduce((acc: any, port: number) => {
    acc[port + "/tcp"] = [{ HostPort: `${port}`, HostIp: "0.0.0.0" }];
    return acc;
  }, {});

  const exposedPorts = allPorts.reduce((acc: any, port: number) => {
    acc[port + "/tcp"] = {};
    return acc;
  }, {});

  const container = await docker.createContainer({
    Image: imageName,
    OpenStdin: true,
    Volumes: {
      "/mtyk/app": {},
    },
    Env: [
      // Add real folder path to the container
      `BBUILD_REAL_PATH=${projectDir}`,
      `BBUILD_PROJECT_NAME=${path.basename(projectDir)}`,
    ],
    ExposedPorts: exposedPorts,
    HostConfig: {
      Binds: [`${projectDir}:/mtyk/app`],
      PortBindings: portBindings,
    },
    // Add tags to the container
    Labels: {
      bbuild: "true",
    },
    platform: os.arch() === "arm64" ? "linux/arm64" : "linux/amd64",
  });

  const containerStream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
  });

  const demuxStream = new stream.PassThrough();
  container.modem.demuxStream(containerStream, demuxStream, process.stderr);
  demuxStream.pipe(process.stdout);

  process.stdin.setRawMode(true);
  process.stdin.pipe(containerStream);

  // Start the container, echoing logs to the console
  await container.start();

  const cleanup = () => {
    console.log("Stopping container...");
    // Kill the container forcefully
    container.kill((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Container stopped");
      }
      // Remove the container
      container.remove((err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Container removed");
        }
        process.exit(0);
      });
    });
  };

  // If this process is exited, kill the container
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  //Listen for ctrl+c manually
  process.stdin.on("data", (data) => {
    if (data.toString() === "\u0003") {
      cleanup();
    }
  });

  await container.wait();
};

runDockerContainer().catch(console.error);
