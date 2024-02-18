import chalk from "chalk";
import { Observable, map, merge } from "rxjs";

function IEventToObservable<T>(event: (cb: (data: T) => void) => void) {
  return new Observable<T>((subscriber) => {
    event((data) => subscriber.next(data));
  });
}

export function formatConsole(
  data: string[],
  color: string,
  name: string,
  cmd: string
): string[] {
  return data
    .filter((_l) => {
      const l = String(_l);
      if (l.trim() === "") {
        return false;
      }
      return true;
    })
    .map(
      (line) => chalk.hex(color)(`[${chalk.bold(name ?? cmd)}]`) + ` ${line}`
    );
}

export function spawnToObservable(
  child: { onData: (cb: (data: string) => void) => void },
  filter: RegExp[] = [],
  color: string,
  name: string,
  cmd: string,
  quiet?: boolean
) {
  return merge(
    IEventToObservable(child.onData).pipe(map((data) => data.split("\n")))
  ).pipe(
    map((data) => formatConsole(data, color, name, cmd)),
    map((data) => data.join("\n"))
  );
}
