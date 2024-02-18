import {addWSFunction} from 'modules/rpc-ws/server'
import fse from 'fs-extra';
import path from "path";
import {homedir} from "os";
import { Buffer } from "buffer";



addWSFunction('audio.saveAudio', async (arg) => {
  const audioData = arg.audioData;

  // Update to use a temp dir with a generated uuid (TODO)
  const targetDirectory = path.join(homedir(), ".universe", "temp");
  await fse.ensureDir(targetDirectory);
  const _path = path.join(targetDirectory, "temporary-file.wav");

  const buffer = Buffer.from(audioData, 'base64');

  await fse.writeFile(
      _path,
      buffer
  )

  return _path;
})


