import { IFlagTypes, WhisperCommand, WhisperShell } from "./whisper-shell";
import { parseTranscript, WhisperResponse } from "./response";
import { AudioConverter } from "./audio-converter";
import { WhisperModel } from "./types/types";
import { modelSizes, ModelStatistics } from "./model-size";
import path from "path";
import { ModelService } from "./model-service";
import { keys } from "./utility/keys";
import { ShellOptions } from "./utility/shell";

interface IOptions {
  modelName?: WhisperModel;
  whisperOptions?: IFlagTypes;
  shellOptions?: ShellOptions;
}

const whisperPath = path.join(__dirname, "..", "..", "native");

const audioConverter = AudioConverter.default();
const modelService = ModelService.create(whisperPath);
const whisperShell = WhisperShell.create(whisperPath, modelService);

export const transcribeAudio = async (
  filePath: string,
  options?: IOptions
): Promise<WhisperResponse> => {
  try {
    console.log("[whisper] Converting:", filePath, "\n");

    const convertedFilepath = await audioConverter.resampleAudioFile(filePath);

    console.log("[whisper] Transcribing:", convertedFilepath, "\n");

    const command = new WhisperCommand(
      convertedFilepath,
      options?.modelName,
      options?.whisperOptions
    );

    const transcript = await whisperShell.execute(
      command,
      options?.shellOptions
    );

    return parseTranscript(transcript);
  } catch (error) {
    console.log("[whisper] Problem:", error);
    throw Error();
  }
};

export const getModelStatistics = async (): Promise<ModelStatistics> => {
  const downloadedModels = await modelService.synchronizeModels();

  return keys(modelSizes).map((model) => ({
    name: model,
    size: modelSizes[model],
    downloaded: downloadedModels.has(model),
  }));
};

export const downloadModel = async (model: WhisperModel): Promise<void> => {
  return modelService.downloadModel(model);
};

export { WhisperModel };
