import path from "path";
import { ModelService } from "./model-service";
import { WhisperModel } from "./types/types";
import { execute, ShellOptions, which } from "./utility/shell";

//TODO - sanitise input
/**
 * Specific shelljs instance to interact with whisper.cpp
 * Ensures that commands are executed in the correct directory & path on the local system
 */

export class WhisperShell {
  /*
      Whether `make` has been run on whisper.cpp & the executable created.
     */
  private executableCreated: boolean = false;

  private defaultOptions: ShellOptions = {
    silent: true,
    async: false,
  };

  private static instance: WhisperShell;

  private constructor(
    private readonly whisperPath: string,
    private readonly modelService: ModelService
  ) {}

  // Potentially should specify model too as a separate param
  public async execute(
    command: WhisperCommand,
    options: ShellOptions = this.defaultOptions
  ): Promise<any> {
    await this.modelService.ensureModel(command.model);

    if (!this.checkInitialization()) {
      await this.initialize();
    }

    const toExecute = path.join(
      this.whisperPath,
      this.buildCommandString(command)
    );

    return execute(toExecute, options);
  }

  static create(whisperPath: string, modelService: ModelService): WhisperShell {
    if (WhisperShell.instance != undefined) {
      return WhisperShell.instance;
    }

    return new WhisperShell(whisperPath, modelService);
  }

  /*
      Runs 'make' to build executables for whisper.cpp.
      Marks as updated to prevent the need for subsequent executions to perform the same check.
    */
  public async initialize(): Promise<void> {
    await execute(`(cd ${this.whisperPath} && make)`, this.defaultOptions);

    this.executableCreated = true;
  }

  /**
   * Checks whether the whisper.cpp executable has been built.
   * Firstly, by checking whether it has been set by another execution of the library.
   * Secondly, by checking whether the `main` executable exists within the whisper.cpp path.
   * @private
   */
  private checkInitialization(): boolean {
    return (
      this.executableCreated || !!which(path.join(this.whisperPath, "./main"))
    );
  }

  private buildCommandString(command: WhisperCommand): string {
    return `./main ${command.getFlags()} -m ${this.modelService.getModelPath(
      command.model
    )} -f ${command.filePath}`;
  }
}

export class WhisperCommand {
  public readonly filePath: string;

  public readonly model: WhisperModel;

  constructor(
    filePath: string,
    modelName: WhisperModel | undefined,
    private flags: IFlagTypes = { word_timestamps: true }
  ) {
    this.filePath = path.normalize(filePath);

    if (modelName == null || !this.isWhisperModel(modelName)) {
      throw new Error(
        "Unable to build Whisper command. Provided model isn't a possible Whisper model."
      );
    }

    this.model = modelName;
  }

  // https://github.com/ggerganov/whisper.cpp/blob/master/README.md?plain=1#L91
  getFlags(): string {
    const flags = this.flags;
    let s = "";

    // output files
    if (flags["gen_file_txt"]) s += " -otxt";
    if (flags["gen_file_subtitle"]) s += " -osrt";
    if (flags["gen_file_vtt"]) s += " -ovtt";
    // timestamps
    if (flags["timestamp_size"]) s += " -ml " + flags["timestamp_size"];
    if (flags["word_timestamps"]) s += " -ml 1";

    return s;
  }

  private isWhisperModel(model: string | undefined): model is WhisperModel {
    // TODO - remove duplication
    return true;
  }
}

export type IFlagTypes = {
  gen_file_txt?: boolean;
  gen_file_subtitle?: boolean;
  gen_file_vtt?: boolean;
  timestamp_size?: number;
  word_timestamps?: boolean;
};
