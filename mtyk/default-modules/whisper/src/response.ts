export class WhisperResponse {
  public readonly content: string;

  constructor(public readonly lines: ITranscriptLine[]) {
    this.content = this.buildContent(lines);
  }

  toString(): string {
    return this.content;
  }

  private buildContent(lines: ITranscriptLine[]) {
    return lines.map((line) => line.speech).join("");
  }
}

export type ITranscriptLine = {
  start: string;
  end: string;
  speech: string;
};

export function parseTranscript(vtt: string): WhisperResponse {
  const lines = vtt.split("\n");
  lines.shift();

  const mappedLines = lines
    .filter((line) => line != "" && line != undefined)
    .map((line) => {
      let timestamp = line.substring(1, 30).trim();
      let speech = line.substring(33);
      const [start, end] = timestamp.split(" --> ");

      return { start, end, speech };
    });

  return new WhisperResponse(mappedLines);
}
