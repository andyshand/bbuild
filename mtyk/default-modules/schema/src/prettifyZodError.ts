import { get } from 'modules/dash'
import { colorize } from 'modules/format-terminal'
import { ZodError } from 'zod'

export function prettifyZodError(error: ZodError, input?: any, name?: string): string {
  let prettyError = ''

  // Check it's a zod error first
  if (!error.issues || !Array.isArray(error.issues)) {
    return error.message
  }

  error.issues.forEach((issue) => {
    // prettyError += bold(colorize.red(`Issue: ${issue.code}\n`))
    // prettyError += colorize.green(`Path: ${issue.path.join('.')}\n`)
    // switch (issue.code) {
    //   case 'invalid_type':
    //     prettyError += colorize.yellow(
    //       `Expected ${issue.expected}, Received: ${issue.received}\n`
    //     )
    //     break
    //   case 'unrecognized_keys':
    //     prettyError += colorize.yellow(
    //       `Unrecognized Keys: ${issue.keys.join(', ')}\n`
    //     )
    //     break
    //   case 'invalid_union':
    //   case 'invalid_arguments':
    //   // case 'invalid_return_type':
    //   //   prettyError += colorize.yellow(
    //   //     `Union/Arguments/Return Type Errors: ${issue.unionErrors
    //   //       .map(prettifyZodError)
    //   //       .join('\n')}\n`
    //   //   )
    //   //   break
    //   // case 'invalid_enum_value':
    //   //   prettyError += colorize.yellow(
    //   //     `Valid Enum Options: ${issue.options.join(', ')}\n`
    //   //   )
    //   //   break
    //   case 'too_small':
    //   // case 'too_big':
    //   //   prettyError += colorize.yellow(
    //   //     `Type: ${issue.type}, Minimum: ${issue.minimum}, Maximum: ${issue.maximum}, Inclusive: ${issue.inclusive}\n`
    //   //   )
    //   //   break
    //   // case 'not_multiple_of':
    //   //   prettyError += colorize.yellow(
    //   //     `Should be multiple of: ${issue.multipleOf}\n`
    //   //   )
    //   //   break
    //   case 'custom':
    //     prettyError += colorize.yellow(
    //       `Custom Error Params: ${JSON.stringify(issue.params)}\n`
    //     )
    //     break
    //   default:
    //     break
    // }
    prettyError += `${colorize.red(`${issue.code} "${issue.message}"`)} ${colorize.blue(
      '@' + (name ? name + '.' : '') + issue.path.join('.'),
    )} \n`
    if (input) {
      prettyError += colorize.yellow(`Received: ${JSON.stringify(get(input, issue.path))}\n`)
    }
    // prettyError += '\n'
  })

  return prettyError
}
