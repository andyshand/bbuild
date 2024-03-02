import chalk from "chalk";
import { spawn } from "child_process";
import { Logger } from "./logging";

export async function exec(
  command: string,
  args: string[],
  opts = { cwd: process.cwd() }
) {
  console.log(
    `Running "${chalk.blue(command)} ${
      args.length ? " " + chalk.blue(args.join(" ")) : ""
    }" in cwd ${chalk.yellow(opts?.cwd)}`
  );
  await Logger.withLogGroup(
    `${command}${args.length ? " " + args.join(" ") : ""}`,
    async ({ console }) => {
      return new Promise<any>((resolve, reject) => {
        const child = spawn(command, [...args], {
          ...opts,
          stdio: "pipe",
        });
        child.stdout?.on("data", (data) => {
          console.log(data.toString());
        });
        child.on("error", reject);
        child.on("exit", resolve);
      });
    }
  );
}

/** Trims off trailing slash if it exists */
const bash = async (strings: TemplateStringsArray, ...rest: any) => {
  const cmd = strings.map((str, i) => str + (rest[i] ?? "")).join("");

  await exec("bash", ["-c", cmd]);
};

export default bash;
