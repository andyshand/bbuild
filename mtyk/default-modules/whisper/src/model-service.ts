import { DownloaderHelper } from "node-downloader-helper";
import { WhisperModel } from "./types/types";
import { readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { keys } from "./utility/keys";

export class ModelService {
  private readonly modelDownloadLocation: string;

  // Should look into hosting copies of our own models here
  private modelBaseUrl: string =
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

  private downloadedModels = new Set<WhisperModel>();

  private downloadedModelFileNames: { [key in WhisperModel]: string } = {
    tiny: "ggml-tiny.bin",
    "tiny.en": "ggml-tiny.en.bin",
    base: "ggml-base.bin",
    "base.en": "ggml-base.en.bin",
    small: "ggml-small.bin",
    "small.en": "ggml-small.en.bin",
    medium: "ggml-medium.bin",
    "medium.en": "ggml-medium.en.bin",
    "large-v1": "ggml-large-v1.bin",
    large: "ggml-large.bin",
  };

  private synchronised: boolean = false;

  private static instance: ModelService;

  private constructor(whisperPath: string) {
    this.modelDownloadLocation = path.join(whisperPath, "models");
  }

  static create(whisperPath: string): ModelService {
    if (ModelService.instance != undefined) {
      return ModelService.instance;
    }

    return new ModelService(whisperPath);
  }

  async ensureModel(model: WhisperModel) {
    if (!this.synchronised) {
      await this.synchronizeModels();
    }

    if (this.downloadedModels.has(model)) {
      return;
    }

    await this.downloadModel(model);
  }

  /*
    The names of downloaded models are referenced in memory for synchronous lookup.
   */
  async synchronizeModels(): Promise<Set<WhisperModel>> {
    for (const model of keys(this.downloadedModelFileNames)) {
      const exists = await this.verifyModel(model);

      if (exists) {
        this.downloadedModels.add(model);
      }
    }

    return this.downloadedModels;
  }

  async downloadModel(model: WhisperModel): Promise<void> {
    console.log(this.modelDownloadLocation);
    const modelFileName = this.getModelFileName(model);
    const url = `${this.modelBaseUrl}/${modelFileName}`;
    console.log(`Downloading model: ${model} from ${url}`);
    await this.download(url, this.modelDownloadLocation);

    if (!(await this.verifyModel(model))) {
      throw new Error(
        `Successfully downloaded model: ${modelFileName} but unable to verify model installation location.`
      );
    }

    this.downloadedModels.add(model);
  }

  getModelPath(model: WhisperModel): string {
    return path.join(this.modelDownloadLocation, this.getModelFileName(model));
  }

  private async verifyModel(model: WhisperModel): Promise<boolean> {
    return await this.exists(this.getModelPath(model));
  }

  private getModelFileName(model: WhisperModel): string {
    return this.downloadedModelFileNames[model];
  }

  private async exists(file: string) {
    try {
      const fileStats = await stat(file);
      fileStats.isFile();
      return true;
    } catch {
      return false;
    }
  }

  private async updateJsonFile(newModel: WhisperModel): Promise<void> {
    const jsonPath = path.join(this.modelDownloadLocation, "models.json");
    const modelLocation = path.join(
      this.modelDownloadLocation,
      this.getModelFileName(newModel)
    );

    const file = JSON.parse(await readFile(jsonPath, { encoding: "utf-8" }));
    const models = file.models;

    const existsAt = models.findIndex((model) => model.name === newModel);

    const amendedModels =
      existsAt == 1
        ? [...models, { name: newModel, location: modelLocation }]
        : [
            ...models.splice(existsAt, 1),
            { name: newModel, location: modelLocation },
          ];

    await writeFile(jsonPath, amendedModels);
  }

  private async initializeEmptyJsonFile() {
    const jsonPath = path.join(this.modelDownloadLocation, "models.json");
    const initialObject = {
      models: [],
    };
    await writeFile(jsonPath, JSON.stringify(initialObject));
  }

  private download(url: string, saveDirectory: string): Promise<void> {
    const downloader = new DownloaderHelper(url, saveDirectory);

    return new Promise((resolve, reject) => {
      downloader.on("end", () => resolve());
      downloader.on("error", (err) => reject(err));
      downloader.on("progress.throttled", (downloadEvents) => {
        const percentageComplete =
          downloadEvents.progress < 100
            ? downloadEvents.progress.toPrecision(2)
            : 100;
        console.log(`Downloaded: ${percentageComplete}%`);
      });
      downloader.start();
    });
  }
}
