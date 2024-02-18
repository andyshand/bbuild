import { useCallback, useState } from 'react'
import { CommandMenuContext, Option } from '../hooks/useRegisterCommands'
import CommandPrompt from './CommandPrompt'

export function CommandMenuProvider(props: { children: any }) {
  const [components, setComponents] = useState<{ [key: string]: Option[] }>({})

  const registerOptions = useCallback(
    (options: Option[], componentId: string) => {
      setComponents((prevComponents) => ({
        ...prevComponents,
        [componentId]: [...(prevComponents[componentId] ?? []), ...options],
      }))
    },
    []
  )

  const unregisterOptions = useCallback((componentId: string) => {
    setComponents((prevComponents) => {
      const { [componentId]: removed, ...newComponents } = prevComponents
      return newComponents
    })
  }, [])

  const availableOptions = Object.values(components).flat()

  return (
    <CommandMenuContext.Provider
      value={{ availableOptions, registerOptions, unregisterOptions }}
    >
      {props.children}
      <CommandPrompt />
    </CommandMenuContext.Provider>
  )
}

export default CommandMenuProvider
