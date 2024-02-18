import { AsyncLocalStorage } from "async_hooks";
import { formatConsole } from "../process/spawnToObservable";
import { getColorForTag } from "../task";

let originalConsoleLog = console.log;
let originalConsoleError = console.error;
let originalConsoleWarn = console.warn;
let originalConsoleDebug = console.debug;
let originalConsoleInfo = console.info;

const globalObj = typeof window === "undefined" ? global : window;
globalObj.console = new Proxy(console, {
  get(target, prop) {
    if (
      prop === "log" ||
      prop === "error" ||
      prop === "warn" ||
      prop === "debug" ||
      prop === "info"
    ) {
      return (...args: any[]) => {
        Logger[prop](...args);
      };
    }
    return target[prop];
  },
});

export class Logger {
  private level: number;
  private static asyncLocalStorage = new AsyncLocalStorage<Logger>();

  constructor(private name: string, level?: number) {
    this.level = level || 0;
  }
  private static lastLogGroup: string | null = null;

  private printMessage(args: string[], level: number) {
    const asciiHeader = (name: string) => `|${"-".repeat(2 * level)} ${name}`;
    if (this.name !== Logger.lastLogGroup) {
      if (Logger.lastLogGroup !== null) {
        // originalConsoleLog(
        //   `${" ".repeat(level * 2)}${asciiHeader("/" + Logger.lastLogGroup)}`
        // );
      }
      // originalConsoleLog(`${" ".repeat(level * 2)}${asciiHeader(this.name)}`);
      Logger.lastLogGroup = this.name;
    }
    if (this.name === "root") {
      originalConsoleLog(
        ...formatConsole(args, getColorForTag("bbuild"), "bbuild", "bbuild")
      );
    } else {
      originalConsoleLog(
        ...formatConsole(args, getColorForTag(this.name), this.name, this.name)
      );
    }
  }

  public log(...args: string[]) {
    this.printMessage(args, this.level);
  }

  public group(name: string) {
    if (this.name === "root") {
      return new Logger(name, this.level + 1);
    }
    return new Logger(`${this.name}/${name}`, this.level + 1);
  }

  public static withLogGroup(
    name: string,
    fn: (opts: {
      console: ReturnType<typeof createConsole>;
    }) => void | Promise<void>
  ) {
    const parentLogger = Logger.asyncLocalStorage.getStore() || Logger.root;
    const logger = parentLogger.group(name);
    const console = createConsole(logger);
    return Logger.asyncLocalStorage.run(logger, () => fn({ console }));
  }

  public static root = new Logger("root");

  private static logWithLogger(level: string, ...args: any[]) {
    const logger = Logger.asyncLocalStorage.getStore() || Logger.root;
    logger.log(...args);
  }

  public static log(...args: any[]) {
    Logger.logWithLogger("log", ...args);
  }

  public static error(...args: any[]) {
    Logger.logWithLogger("error", ...args);
  }

  public static warn(...args: any[]) {
    Logger.logWithLogger("warn", ...args);
  }

  public static debug(...args: any[]) {
    Logger.logWithLogger("debug", ...args);
  }

  public static info(...args: any[]) {
    Logger.logWithLogger("info", ...args);
  }
}

function createConsole(logger: Logger) {
  const logLevels = ["log", "error", "warn", "debug", "info"];
  const consoleObj = {};

  logLevels.forEach((level) => {
    consoleObj[level] = (...args: any[]) => {
      logger.log(...args);
    };
  });

  return consoleObj as typeof console;
}
