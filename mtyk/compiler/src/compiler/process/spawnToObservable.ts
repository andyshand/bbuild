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
  const flatMapped = data
    .filter((_l) => {
      const l = String(_l);
      return l.trim() !== "";
    })
    .flatMap((line) => {
      const formattedItem = formatItem(line);
      if (typeof formattedItem === "string" && formattedItem.includes("\n")) {
        return formattedItem
          .split("\n")
          .map(
            (subLine) =>
              chalk.hex(color)(createNameString(name, cmd)) + ` ${subLine}`
          );
      } else {
        return [
          chalk.hex(color)(createNameString(name, cmd)) + ` ${formattedItem}`,
        ];
      }
    });

  return [flatMapped.join("\n")];
}

export function spawnToObservable(
  child: { onData: (cb: (data: string) => void) => void },
  /**
   * @deprecated are we using this?
   */
  filter: RegExp[] = [],
  color: string,
  name: string,
  cmd: string,
  quiet?: boolean
) {
  return merge(
    IEventToObservable(child.onData).pipe(map((data) => data.split("\n")))
  );
}
