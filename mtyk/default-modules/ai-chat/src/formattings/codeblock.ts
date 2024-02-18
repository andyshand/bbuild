const markdown = (str: string | object, language?: string, opts = {}) => {
  return `\`\`\`${language || ''}
${typeof str === 'string' ? str : JSON.stringify(str, null, 2)}
\`\`\``
}

export const CodeBlock = {
  markdown,
  ts: (str: string | object) => markdown(str, 'typescript'),
  json: (str: string | object) => markdown(str, 'json'),
}
