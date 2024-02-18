import { ReactNode, createContext, useContext, useEffect, useRef } from 'react'

export type ActionContext = {
  repl: (command: string) => Promise<string>
}
type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'

type JsonSchemaProperty = {
  type: JsonSchemaType
  description?: string
  format?: string
  label?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: any[]
  items?: JsonSchema
  properties?: { [key: string]: JsonSchemaProperty }
  required?: string[]
}

type JsonSchema = {
  type: JsonSchemaType
  properties: { [key: string]: JsonSchemaProperty }
  label?: string
  required?: string[]
}
export type Option = {
  isQuickAction?: boolean
  label: string
  id: string
  shortcut?: string
  provider?: string
  tags?: ReactNode
  action: (
    context: ActionContext,
    parameters: any
  ) => Promise<Result | undefined | void>
  parametersSchema?: JsonSchema
  cliParams?: {
    schema: JsonSchema[]
    map: (params: any) => any
  }
}

export type Result = {
  element?: React.ReactNode
}

export type CommandMenuContextType = {
  availableOptions: Option[]
  registerOptions: (options: Option[], componentId: string) => void
  unregisterOptions: (componentId: string) => void
}

export const CommandMenuContext = createContext<CommandMenuContextType>({
  availableOptions: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOptions: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unregisterOptions: () => {},
})

let nextId = 0

export function useRegisterCommands(options: Option[], deps: any[] = []) {
  const id = useRef(++nextId)
  const { registerOptions, unregisterOptions } = useContext(CommandMenuContext)

  useEffect(() => {
    // Register the options when the component mounts
    registerOptions(options, id.current.toString())

    // Unregister the options when the component unmounts
    return () => {
      unregisterOptions(id.current.toString())
    }
  }, [id, options, registerOptions, unregisterOptions, ...deps])
}
