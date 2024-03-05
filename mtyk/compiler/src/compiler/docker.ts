import { debounce } from "@/util/dash";
import { exec, spawn } from "child_process";
import chokidar from "chokidar";
import path from "path";
import { getDockerInfo } from "./processes/DevConfig";

export default async function docker() {
  const dockerInfo = await getDockerInfo();
  let progressLogs: Record<
    string,
    {
      stop: () => void;
      progress: number;
    }
  > = {};

  for (const d of dockerInfo) {
    const { args, name, image: _image, env, dockerfile } = d;
    const cwd = process.cwd();

    if (!progressLogs[name]) {
      progressLogs[name] = { progress: 0, stop: () => {} };
    }

    let building = false;
    const onChange = debounce(async () => {
      if (building) {
        return;
      }
      building = true;
      if (progressLogs[name]?.stop) {
        progressLogs[name].stop();
      }

      let childProcess;

      progressLogs[name] = {
        progress: 0,
        stop: () => {
          if (childProcess && !childProcess.killed) {
            childProcess.kill();
          }
        },
      };

      const buildArgs = Object.entries(args ?? {})
        .map(([k, v]) => {
          const value = v.startsWith("$") ? env[v.slice(1)] : v;
          return `--build-arg ${k}=${value}`;
        })
        .join(" ");

      // const dockerfilePath = path.join(cwd, dockerfile);
      const image = _image ?? name;
      const buildCmd =
        `/usr/local/bin/docker build ${buildArgs} -f ${dockerfile} -t ${image} .`.split(
          " "
        );

      try {
        childProcess = spawn(buildCmd[0], buildCmd.slice(1), {
          cwd,
          env,
          stdio: "inherit",
        });

        childProcess.on("close", (code) => {
          if (code === 0) {
            onBuildImageFinished(null, name);
          } else {
            onBuildImageFinished(
              new Error(`Docker build exited with code ${code}`),
              null
            );
          }
        });
      } catch (error) {
        onBuildImageFinished(error, null);
      } finally {
        building = false;
      }
    }, 1000);

    chokidar.watch(dockerfile).on("change", onChange);
    onChange();

    async function onBuildImageFinished(err, imageName) {
      if (err) {
        console.error(err);
        return;
      }

      // Stop existing container
      try {
        await exec(`docker container stop ${imageName}`);
        await exec(`docker container rm ${imageName}`);
      } catch (error) {
        console.log(`No running container with name ${imageName} found.`);
      }

      // Start new container
      try {
        await exec(`docker run --name ${imageName} -d ${image}`);
      } catch (error) {
        console.error(`Failed to start container ${imageName}: ${error}`);
      }
    }
  }
}
