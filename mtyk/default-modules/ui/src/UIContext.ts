import React from 'react'

type OneComponent<Props> = React.ComponentType<Props>

export interface ActionableComponentProps {
  action: () => Promise<void> | void
}

export interface FormComponentProps<T> {
  onChange: (event: any) => void
  value?: T
  defaultValue?: T
}

export interface OneUIContext {
  Button: OneComponent<ActionableComponentProps>
  Input: OneComponent<FormComponentProps<string | number>>
  TextArea: OneComponent<FormComponentProps<string>>
}
