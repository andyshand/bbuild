import { runPromptChain } from '../runPrompt'
import { promptGPT3, ts } from '../transform'
import trimCode from '../util/trimCode'

const splitStrIntoChunks = (str: string, length: number) => {
  const size = Math.ceil(str.length / length)
  const r = Array(size)
    .fill('')
    .map((_, i) => str.slice(i * length, (i + 1) * length))
  return r
}

export default async function (opts: { input: string }) {
  const { input: _input } = opts
  const input = trimCode(_input)
  const breif = `You are an expert typescript/react programmer. 
  
  I need you to extract a general outline from a typescript file so that I can understand its structure as a whole. However, I can only send you the file in pages.
  
  For each page I send, I need you to extract a high-level representation of what you see. For example, instead of copying a whole function verbatim, you should just include the function name, and the type of its arguments and return value.
  
  For any code that wraps onto another page, I need you to extract this content exactly as-is, so that you can use it to perform a complete extraction on the next page. I need you to be smart about this so that you don't make assumptions too early about content you haven't seen yet.`

  const chunks = splitStrIntoChunks(input, 2048)
  let overflow = ''
  const structures: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chain = `${breif} 
    
    ${overflow ? `Overflow from previous page:\n${ts(overflow)}` : ''}

    Page ${i + 1}/${chunks.length}:    
    ${ts(chunk)}
    
    ${
      overflow
        ? `Q: Do you now have enough context to complete the trailing code from page ${i}?\nA:${promptGPT3(
            { key: 'completed' + i }
          )}`
        : ''
    }
   
    Q: What incomplete code, if any, is at the end of page ${
      i + 1
    }?\nA: ${promptGPT3({ key: 'incomplete' + i })}

    Q: What is the high-level structure of page ${i + 1}?\nA:\n${ts(
      promptGPT3({ key: 'structure' + i })
    )}
    `
    const out = await runPromptChain([chain])
    const { outputsByKey } = out
    const completed = outputsByKey['completed' + i]
    const structure = outputsByKey['structure' + i]

    console.log(out)
    structures.push(structure)

    // const answer = await getCompletionNoStream(prompt)
  }

  console.log(`Complete code:\n${ts(structures.join('\n'))}`)
  // const pages = split
}
