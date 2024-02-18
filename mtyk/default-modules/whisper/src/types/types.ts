export type WhisperConfig = {
    url: string,
}

const whisperModels = [
    "tiny",
    "tiny.en",
    "base",
    "base.en",
    "small",
    "small.en",
    "medium",
    "medium.en",
    "large-v1",
    "large"
] as const;


export const isWhisperModel = (model: any): model is WhisperModel => {
    return whisperModels.indexOf(model) >= 0;
}

export type WhisperModel = typeof whisperModels[number];
    /*
    "tiny"
    | "tiny.en"
    | "base"
    | "base.en"
    | "small"
    | "small.en"
    | "medium"
    | "medium.en"
    | "large-v1"
    | "large";

     */