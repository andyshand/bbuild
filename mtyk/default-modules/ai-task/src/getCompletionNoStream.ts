import axios from "axios";
import fs from "fs-extra";
import countTokens from "openai-gpt-token-counter";
import os from "os";
const cacheDir = os.homedir() + "/.openai-cache";
fs.ensureDirSync(cacheDir);

export enum Model {
  Davinci1 = "text-davinci-001",
  Davinci2 = "text-davinci-002",
  Davinci3 = "text-davinci-003",
  Babbage = "text-babbage-001",
  Ada = "text-ada-001",
  ChatGPT = "gpt-3.5-turbo",
  GPT4 = "gpt-4",
  Curie = "text-curie-001",
}

export async function getCompletionNoStream(
  prompt: string,
  settings?: Partial<{
    model: Model;
    temperature?: number;
    stop?: string[];
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  }>,
  ownSettings?: { tries?: number; responseTokens?: number }
) {
  // See if we have a cached version
  const cacheFile =
    cacheDir +
    "/" +
    prompt.replace(/[^a-z0-9]/gi, "_").slice(0, 100) +
    prompt.replace(/[^a-z0-9]/gi, "_").slice(-100) +
    ".txt";
  // if (fs.existsSync(cacheFile)) {
  //   return fs.readFileSync(cacheFile, 'utf8').toString()
  // }

  // req.end()

  const modelSettings = {
    model: Model.Davinci3,
    prompt: prompt,
    temperature: 0.55,
    max_tokens: 2048,
    ...settings,
  };

  const tokensForModel =
    {
      [Model.Davinci1]: 2048,
      [Model.Davinci2]: 2048,
      [Model.Davinci3]: 4096,
    }[modelSettings.model] ?? 2048;

  const tokensLeftAfterPrompt = tokensForModel - (countTokens as any)(prompt);
  let max_tokens = Math.max(
    Math.min(
      modelSettings.max_tokens,
      tokensLeftAfterPrompt,
      ownSettings?.responseTokens ?? tokensLeftAfterPrompt
    ),
    0
  );
  if (!max_tokens) {
    max_tokens = tokensForModel[modelSettings.model] ?? 2048;
  }

  const body = JSON.stringify({
    ...modelSettings,
    max_tokens,
  });
  // console.log(`Sending prompt to OpenAI: ${prompt}`)

  let tries = 0;
  while (tries < (ownSettings?.tries ?? 6)) {
    try {
      const res = await axios("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        },
        data: body,
        timeout: 30000,
      });

      const txt = res.data.choices[0].text;

      // Cache
      // fs.writeFileSync(cacheFile, txt)
      return txt;
    } catch (e) {
      console.error(e.response?.data?.error?.message || e.message);
      tries++;
    }
  }

  throw new Error("Used up all tries");
}
