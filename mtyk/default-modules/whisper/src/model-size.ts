import { WhisperModel } from "./types/types";

export type ModelSize = {
  diskSpace: { unit: string; amount: number };
  ram: { unit: string; amount: number };
};

export type ModelStatistic = {
  name: WhisperModel;
  size: ModelSize;
  downloaded: boolean;
};

export type ModelStatistics = ModelStatistic[];

export const modelSizes: { [key in WhisperModel]: ModelSize } = {
  tiny: {
    diskSpace: { unit: "MB", amount: 75 },
    ram: { unit: "MB", amount: 390 },
  },
  "tiny.en": {
    diskSpace: { unit: "MB", amount: 75 },
    ram: { unit: "MB", amount: 390 },
  },
  base: {
    diskSpace: { unit: "MB", amount: 142 },
    ram: { unit: "MB", amount: 500 },
  },
  "base.en": {
    diskSpace: { unit: "MB", amount: 142 },
    ram: { unit: "MB", amount: 500 },
  },
  small: {
    diskSpace: { unit: "MB", amount: 466 },
    ram: { unit: "GB", amount: 1.0 },
  },
  "small.en": {
    diskSpace: { unit: "MB", amount: 466 },
    ram: { unit: "GB", amount: 1.0 },
  },
  medium: {
    diskSpace: { unit: "GB", amount: 1.5 },
    ram: { unit: "GB", amount: 2.6 },
  },
  "medium.en": {
    diskSpace: { unit: "GB", amount: 1.5 },
    ram: { unit: "GB", amount: 2.6 },
  },
  "large-v1": {
    diskSpace: { unit: "GB", amount: 2.9 },
    ram: { unit: "GB", amount: 4.7 },
  },
  large: {
    diskSpace: { unit: "GB", amount: 2.9 },
    ram: { unit: "GB", amount: 4.7 },
  },
};
