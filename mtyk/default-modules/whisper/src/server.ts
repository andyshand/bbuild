import { addWSFunction } from "modules/rpc-ws/server";
import {
  downloadModel,
  getModelStatistics,
  transcribeAudio,
  WhisperModel,
} from "./index";
import { isWhisperModel } from "./types/types";

// dependency on rpc-ws

addWSFunction("whisper.getModels", async () => {
  return await getModelStatistics();
});

addWSFunction("whisper.installModel", async (arg) => {
  if (!isWhisperModel(arg.model)) {
    throw new Error(`Invalid whisper model ${arg.model} provided.`);
  }
  const model: WhisperModel = arg.model;
  return downloadModel(model);
});

addWSFunction("whisper.transcribeAudio", async (arg) => {
  if (!isWhisperModel(arg.model)) {
    throw new Error(`Invalid whisper model ${arg.model} provided.`);
  }
  const model: WhisperModel = arg.model;

  const file: string = arg.fileName;

  const transcription = await transcribeAudio(file, { modelName: model });

  return transcription.content;
});
