# Experimental Whisper Wrapper for Node.js 


Node.js integration for OpenAI's Whisper.

Provides out the box integration to access a locally deployed instance of OpenAI's Whisper.
Designed to work in zero configuration mode, can be installed as a node module and works out-the-box.

## Features

- Add as a dependency to Node.js projects to transcribe audio using OpenAI's Whisper.
- Uses a highly optimized Whisper implementation under-the-hood: https://github.com/ggerganov/whisper.cpp.
- Outputs both general transcribed content and line-by-line timestamped transcriptions. 
- Automatic model management. Handles downloading and organising Whisper models. Will automatically download any missing models.       
- Audio pre-processing. Provides pre-processing on the audio input to make it compatible with the Whisper implementation.
- Automated integration tests.
- Both filepath and stream based API (In progress feature)


## Aims

- Designed to work out-the-box with zero mandatory configuration. 
- Runs entirely using the Node.js environment. Without any external non-ecosystem dependencies.
- Automatically manage model downloads and underlying framework interactions. No requirements to run terminal commands or to preinstall non-Node packages to build the AI model.
- Can be easily integrated within any existing Node.js application. 
- Provide a foundation for a more general-purpose Node/GenAI integration framework. See [here](#general-purpose-framework) for further details.




## Installation


### Installation as a dependency


```text
npm install node-whisper-experimental
```
This isn't published to the public NPM registry as it is private until further notice.
However, installation from a private NPM server would look like the above.

### bbuild Installation

Coming soon...


### Local Installation


```shell
git clone github.com/domdinnes/node-whisper-experimental --recursive
```
This requires a recursive clone to install the underlying framework.
This will be handled automatically when downloading from the NPM registry.

### 

## Usage

```typescript
import { transcribeAudio } from "node-whisper-experimental";

const transcription = await transcribeAudio(
    "./samples/noemi-1.ogg",
    {modelName: "base.en"}
);

console.log(transcription);
```

### Output (JSON)

```json
{
    "content": "Can you please get me some water?",
    "lines": [
        {"start": "00:00:13.750", "end": "00:00:14.300", "speech": " Can"},
        {"start": "00:00:14.300", "end": "00:00:14.840", "speech": " you"},
        {"start": "00:00:14.840", "end": "00:00:15.910", "speech": " please"},
        {"start": "00:00:15.910", "end": "00:00:16.720", "speech": " get"},
        {"start": "00:00:16.720", "end": "00:00:16.810", "speech": " me"},
        {"start": "00:00:16.810", "end": "00:00:17.540", "speech": " some"},
        {"start": "00:00:17.540", "end": "00:00:19.230", "speech": " water"},
        {"start": "00:00:19.230", "end": "00:00:19.320", "speech": "?"}
    ]
}
```

### Usage with Additional Options

```javascript
import { transcribeAudio } from "node-whisper-experimental";


const options = {
  modelName: "medium.en",
  whisperOptions: {
    gen_file_txt: false,
    gen_file_subtitle: false,
    gen_file_vtt: false,
    timestamp_size: 10,
    word_timestamps: true
  }
}

const transcription = await transcribeAudio(
    "./samples/noemi-1.ogg",
    options
);

const transcript = await whisper(filePath, options);
```

## General Purpose Framework
### Generic Node/GenAI Integration Framework

This library begins the groundwork of a 'generic pattern' for Node.js/AI integration. 
The generic pattern will have a few components and facets:

- It will be a single repository or group of repositories for AI interactivity.
- Handle framework installation (the c++ file for say whisper, llama or some other gpt)
- Handle model downloading (connections with huggingface and dedicated model repo)
- API to proxy calls to this
- Handle sample downloading for integration testing
- Unified unit/integration tests to prevent regressions
- Standardised way of calling the underlying implementations (QoL enhancements for interacting with general C++ packages) 
- Automatic preprocessing on input. Some models restrict the content type that they can receive. 
- Adapter for return types


## Roadmap

- Add streaming API - enabling the receiving of files over http
- Improve logging - add some guidance explaining what is happening
    - Remove underlying implementation specific logging
    - Logging should include when the cache has been hit/downloads
    - Include noisy/silent mode
- Find node.js alternative to 'make'. This is the only remaining possible external dependency. Should already be pre-installed on Mac.
- Further integration tests
- Post-install script to initialize framework