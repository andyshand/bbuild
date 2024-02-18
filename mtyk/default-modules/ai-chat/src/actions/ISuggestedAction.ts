export type StringInputSource = {
  type: 'string'
  value: string
}

export type FileInputSource = {
  type: 'file'
  value: string
}

export type InputSource = StringInputSource | FileInputSource

export type TrimTransform = {
  type: 'trim'
  start: number
  end?: number
}

export type Transform = TrimTransform

export type InputSourceWithTransform = {
  source: InputSource
  transform?: Transform
}

export interface ISuggestedAction {
  action: string
  parameterSuggestions: {
    [key: string]: string[]
  }[]
}

export interface ActionLogMessage {
  type: 'info' | 'error' | 'warning'
  message: string
}
