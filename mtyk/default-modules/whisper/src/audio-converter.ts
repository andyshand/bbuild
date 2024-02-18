import ffmpegPath from "ffmpeg-static";
import { exec as execute } from "shelljs";
import _temp from "temp";
import { v4 as uuid } from "uuid";
import path from "path";

// TODO - can we apply streaming input too? Write stream to temp file -> convert?

type MediaType = "wav" | "mp3";

export class AudioConverter {
  private temp = _temp.track();
  private targetDirectory?: string;

  constructor(
    private audioSamplingRate: number,
    private audioChannels: number,
    private output: MediaType
  ) {}

  static default(): AudioConverter {
    return new AudioConverter(16000, 1, "wav");
  }

  async resampleAudioFile(audioFilePath: string): Promise<string> {
    // store using uuid
    const targetDirectory = await this.getOrInitializeTargetDirectory();
    const targetFileName = `${uuid()}.${this.output}`;
    const targetOutput = path.join(targetDirectory, targetFileName);

    // Should probably return the path of the new file
    const command = `${ffmpegPath} -hide_banner -loglevel error -i ${audioFilePath} -ar ${this.audioSamplingRate} -ac ${this.audioChannels} -c:a pcm_s16le ${targetOutput}`;

    return new Promise((resolve, reject) =>
      execute(command, {}, (code, stdout, stderr) => {
        if (code === 0) {
          resolve(targetOutput);
        } else {
          reject(stderr);
        }
      })
    );
  }

  private async getOrInitializeTargetDirectory() {
    if (!this.targetDirectory) {
      this.targetDirectory = await this.temp.mkdir();
    }

    return this.targetDirectory;
  }
}
