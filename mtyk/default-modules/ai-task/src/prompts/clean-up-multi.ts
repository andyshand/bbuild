import { principles } from '.'
import findDeclarationByName from '../babel/findDeclarationByName'
import { getCompletionNoStream } from '../getCompletionNoStream'
import { runPrompt } from '../runPrompt'
import { ts } from '../transform'
import { Preambles, Principles } from './principles'
import { whichComponents } from './whichComponents'

const cleanup = async (opts: { input: string; component?: string }) => {
  const trimmedInput = opts.input.replace(/^(\s+)/gm, '')
  const { all: list, imported } = await whichComponents(
    trimmedInput,
    opts.component
  )

  for (const l of list) {
    const htmlTags = new Set([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'div',
      'table',
      'tr',
      'th',
      'td',
      'span',
      'select',
      'option',
      'button',
      'input',
      'textarea',
      'label',
      'a',
    ])
    const importedSet = new Set(imported)
    if (htmlTags.has(l) || importedSet.has(l)) {
      continue
    }

    const found = findDeclarationByName(trimmedInput, l)

    const cCode = found ?? trimmedInput
    const p = `The below code shows the ${l} component. 
    ${ts(cCode)}

     The below code is transforms the component to its most essential parts using minimal pseudo-code:\`\`\`\n`
    const o = await getCompletionNoStream(p)
    console.log(p, o)
    const out = await runPrompt(
      principles({
        input: o,
        principles: [
          Principles.PrimitiveComponents,
          Principles.RepeatingComponents,
        ],
        preamble: Preambles.ExpertReact,
      })
    )

    const prompt2 = `I have simplified the following code:
${ts(cCode)} 

Into this:
${ts(out.outputsByKey['output'])}

Now I will add back the required classNames and styles so the component displays looks the same:\n${'```typescript'}\n`
    const out2 = await getCompletionNoStream(prompt2)
    console.log(prompt2, out2)

    const out3 = await runPrompt(
      principles({
        input: out2,
        principles: ['All props should have typescript types'],
        preamble: Preambles.ExpertReact,
      })
    )

    console.log(out3)
  }

  // console.log(out)

  // return principles({
  //   principles: ['DRY', 'KISS', 'YAGNI', 'SOLID'],
  //   noun: `a file`,
  //   preamble: `I am an expert react developer who has been tasked with cleaning up code.`,
  //   input: opts.input,
  // })
}

export default cleanup
