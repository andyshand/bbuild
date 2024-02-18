import { ts, promptGPT3, transformOut } from '../transform'
import { runPrompt } from '../runPrompt'

const theprompt = ({
  input,
  principles,
  preamble,
  noun,
}: {
  input: string
  principles: string[]
  preamble: string
  noun?: string
}) => `${preamble}

My principles are as follows:
${principles.map(p => `- ${p}`).join('\n')}

The following is an example of ${
  noun ?? 'a component'
} that does not meet my criteria:
${ts(input)}

My principles have been broken in the following ways:
${promptGPT3({ gpt: { stop: '\n\n' } })}

Thinking step-by-step, to fix these issues, I need to:
- ${promptGPT3({ gpt: { stop: '\n\n' } })}

I will now present the transformed code with these changes applied below:
${ts(promptGPT3({ key: 'output', transformOut: transformOut.cleanCode }))}
`

export default theprompt

export enum Preambles {
  ExpertReact = 'I am an expert React programmer who is highly opinionated on coding style and conventions.',
}

export enum Principles {
  PrimitiveComponents = 'Primitive components such as "div" should be limited to use in child components. Child components are those we create to form the core of our application such as "Input", "Table" and others that abstract details away from parent components.',
  PrimitiveMore = 'Further to point 1, we should not include any styling or attributes related to styling such as "style", "className" and "css". The appearance of our components should be controlled by our own custom props.',
  RepeatingComponents = 'Repeating components verbatim should be avoided. Instead, we should use arrays containing the information we wish to repeat, and use ".map" to programmatically generate repeated information.',
}

const refine = async (
  makePrompt: (input: string) => string,
  startingWith: string,
  steps = 3
) => {
  let innput: string = startingWith

  for (let i = 0; i < steps; i++) {
    const thisout = await runPrompt(makePrompt(innput))
    const { output } = thisout.outputsByKey
    innput = output
    console.log('out', innput)
  }

  console.log('innput', innput)
  return innput
}

// setTimeout(() => {
//   // Do stuff
//   runPrompt(
//     theprompt({
//       code: `<divclassName="flexjustify-endmb-4">\n<divclassName="mr-2py-3px-4bg-sky-200rounded-bl-3xlrounded-tl-3xlrounded-tr-xltext-black">\nWelcometogroupeveryone!\n</div>\n<UserChatIcon/>\n</div>\n<divclassName="flexjustify-startmb-4">\n<UserChatIcon/>\n<divclassName="ml-2py-3px-4bg-gray-100rounded-br-3xlrounded-tr-3xlrounded-tl-xltext-black">\nLoremipsumdolorsitametconsectetur\nadipisicingelit.Quaeratatpraesentium,\nautullamdelectusodioerrorsitrem.\nArchitectonulladoloribuslaborumillorem\nenimdolorodiosaepe,consequaturquas?\n</div>\n</div>\n<divclassName="flexjustify-endmb-4">\n<div>\n<divclassName="mr-2py-3px-4bg-sky-200rounded-bl-3xlrounded-tl-3xlrounded-tr-xltext-black">\nLoremipsumdolor,sitametconsectetur\nadipisicingelit.Magnam,repudiandae.\n</div>\n\n<divclassName="mt-4mr-2py-3px-4bg-sky-200rounded-bl-3xlrounded-tl-3xlrounded-tr-xltext-black">\nLoremipsumdolorsitametconsectetur\nadipisicingelit.Debitis,reiciendis!\n</div>\n</div>\n<UserChatIcon/>\n</div>`,
//       principles: [
//         // 'We want '
//         // Principles.PrimitiveComponents,
//         // Principles.FurtherTo1,
//         Principles.RepeatingComponents,
//       ],
//       preamble: Preambles.ExpertReact,
//     })
//   )
// }, 2000)
