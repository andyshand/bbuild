import chalk from "chalk";
import { Observable, map, merge } from "rxjs";
import util from "util";

function IEventToObservable<T>(event: (cb: (data: T) => void) => void) {
  return new Observable<T>((subscriber) => {
    event((data) => subscriber.next(data));
  });
}
function createNameString(name: string, cmd: string): string {
  return `[${name ?? cmd}]`.padEnd(12, " ");
}

export function formatConsole(
  data: any[],
  color: string,
  name: string,
  cmd: string
): [string] {
  const formatItem = (line: any) => {
    if (
      // easily printable types
      typeof line === "string" ||
      typeof line === "number" ||
      typeof line === "boolean"
    ) {
      return line;
    }
    return util.inspect(line, { depth: 5, colors: true });
  };
  const formatLine = (line: string) => {
    // Handle different file path formats differently

    // If, modules/**/file.ts, file directly to file
    const isModuleFilePath = line.match(/^(modules\/.*\/[^\s]+)$/);
    if (isModuleFilePath) {
      // If ends in .ts or .tsx, link directly to file
      return (
        chalk.hex(color)(createNameString(name, cmd)) +
        ` \u001b]8;;${isModuleFilePath[0]}\u0007${line}\u001b]8;;\u0007`
      );
    } else {
      // // Else if .js, find the .ts file and link to that
      // const isJsFilePath = line.match(/^(.*\/[^\s]+\.js)$/);
      // if (isJsFilePath) {
      //   const tsFilePath = isJsFilePath[1].replace(/\.js$/, ".ts");
      //   return (
      //     chalk.hex(color)(createNameString(name, cmd)) +
      //     ` \u001b]8;;${tsFilePath}\u0007${line}\u001b]8;;\u0007`
      //   );
      // }
    }

    // Else
    const isFilePath = line.match(/^(.*\/[^\s]+)$/);
    if (isFilePath) {
      return (
        chalk.hex(color)(createNameString(name, cmd)) +
        ` \u001b]8;;${isFilePath[0]}\u0007${line}\u001b]8;;\u0007`
      );
    } else {
      return chalk.hex(color)(createNameString(name, cmd)) + ` ${line}`;
    }
  };

  const flatMapped = data
    .filter((_l) => {
      const l = String(_l);
      return l.trim() !== "";
    })
    .flatMap((line) => {
      const formattedItem = formatItem(line);
      if (typeof formattedItem === "string" && formattedItem.includes("\n")) {
        return formattedItem.split("\n").map(formatLine);
      } else {
        return [formatLine(String(formattedItem))];
      }
    });

  return [flatMapped.join("\n")];
}
export function observableFromSpawn(child: {
  onData: (cb: (data: string) => void) => void;
}) {
  return merge(
    IEventToObservable(child.onData).pipe(map((data) => data.split("\n")))
  );
}
