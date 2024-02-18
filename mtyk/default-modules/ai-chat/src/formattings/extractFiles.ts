import MarkdownIt from 'markdown-it';
import { EnhancedMessage } from '../EnhancedMessage';
import { ChatEntity } from '../entities/ChatEntity';

const markdownParser = new MarkdownIt();

function processCodeBlock(token: any, message: EnhancedMessage, source: string, fileName: string) {
  const content = token.content.trim() as string;

  return {
    fileName: /\.tsx?$/.test(fileName.trim()) ? fileName.trim() : '',
    content,
    message,
    createdAt: message.createdAt ?? new Date(),
    source,
  };
}

type FileVersionInfo = ReturnType<typeof processCodeBlock> & { chat: string }

function processMessage(message: EnhancedMessage, chat: string) {
  const versions: { [fileName: string]: FileVersionInfo[] } = {};
  if (message.content) {
    let tokens;
    try {
      tokens = markdownParser.parse(message.content, {});
    } catch (error) {
      console.error('Failed to parse markdown:', error);
      return versions;
    }

    let fileName = '';
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'fence') {
        if (!fileName && Object.keys(versions).length > 0) {
          fileName = Object.keys(versions)[0];
        }
        versions[fileName] = versions[fileName] ?? [] as FileVersionInfo[]
        versions[fileName].push({ ...processCodeBlock(tokens[i], message, message.role, fileName), chat });
        fileName = '';
      }
      if (tokens[i].type === 'inline' && tokens[i].content.includes('.tsx')) {
        fileName = /([a-zA-Z0-9_-]+\.tsx?)/.exec(tokens[i].content)?.[1] ?? '';
      }
    }
  }
  return versions;
}

export default function extractFiles(this: ChatEntity, threads: ChatEntity[] = []) {
  const fileVersions: Record<string, FileVersionInfo[]> = {};

  this.messages.forEach((message) => {
    const newVersions: any = processMessage(message, this.id);
    Object.keys(newVersions).forEach(fileName => {
      fileVersions[fileName] = fileVersions[fileName] || [];
      fileVersions[fileName].push(...newVersions[fileName]);
    });
  });

  threads.forEach((thread) => {
    const threadFiles = extractFiles.apply(thread, []);
    Object.keys(threadFiles).forEach((fileName) => {
      fileVersions[fileName] = fileVersions[fileName] || [];
      fileVersions[fileName].push(...threadFiles[fileName]);
    });
  });

  Object.keys(fileVersions).forEach((fileName) => {
    fileVersions[fileName].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  return fileVersions;
}
