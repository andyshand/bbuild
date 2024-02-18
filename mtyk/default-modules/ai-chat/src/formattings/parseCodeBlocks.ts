import MarkdownIt from 'markdown-it';
import { MessageCodeBlock } from '../EnhancedMessage';

const markdownParser = new MarkdownIt();

function processCodeBlock(token: any, message: string, filename: string): Omit<MessageCodeBlock, 'index'> {
	const content = token.content.trim() as string;
	return {
		fileName: /\.tsx?$/.test(filename.trim()) ? filename.trim() : '',
		content,
	};
}

function processMessage(message: string) {
	const versions: { [filename: string]: MessageCodeBlock[] } = {};
	if (message) {
		let tokens;
		try {
			tokens = markdownParser.parse(message, {});
		} catch (error) {
			console.error('Failed to parse markdown:', error);
			return versions;
		}

		let filename = '';
		for (let i = 0; i < tokens.length; i++) {
			if (tokens[i].type === 'fence') {
				if (!filename && Object.keys(versions).length > 0) {
					filename = Object.keys(versions)[0];
				}
				versions[filename] = versions[filename] || [];
				versions[filename].push({
					...processCodeBlock(tokens[i], message, filename),
					index: i,
				});
				filename = '';
			}
			if (tokens[i].type === 'inline' && tokens[i].content.includes('.tsx')) {
				filename = /([a-zA-Z0-9_-]+\.tsx?)/.exec(tokens[i].content)?.[1] ?? '';
			}
		}
	}
	return versions;
}

export default function parseCodeBlocks(message: string): MessageCodeBlock[] {
	const versions = processMessage(message)
	return Object.values(versions).flat()
}