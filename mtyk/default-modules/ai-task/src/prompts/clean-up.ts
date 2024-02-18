import principles from './principles'

const cleanup = (opts: { input: string }) => {
  return principles({
    principles: ['DRY', 'KISS', 'YAGNI', 'SOLID'],
    noun: `a file`,
    preamble: `I am an expert react developer who has been tasked with cleaning up code.`,
    input: opts.input,
  })
}

export default cleanup
