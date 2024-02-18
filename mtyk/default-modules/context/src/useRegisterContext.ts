import { createContext, useContext, useEffect, useRef } from 'react'
import { UniverseContextItem } from './UniverseEntityContextItem'

export type RegisterContextType = {
  availableContextItems: UniverseContextItem[]
  registerContextItems: (
    contextItems: UniverseContextItem[],
    componentId: string
  ) => void
  unregisterContextItems: (componentId: string) => void
}

export const ContextRegisterContext = createContext<RegisterContextType>({
  availableContextItems: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerContextItems: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unregisterContextItems: () => {},
})

let nextId = 0

export function useRegisterContextItems(
  contextItems: UniverseContextItem[],
  deps: any[] = []
) {
  const id = useRef(++nextId)
  const { registerContextItems, unregisterContextItems } = useContext(
    ContextRegisterContext
  )

  useEffect(() => {
    // Register the context items when the component mounts
    registerContextItems(contextItems, id.current.toString())

    // Unregister the context items when the component unmounts
    return () => {
      unregisterContextItems(id.current.toString())
    }
  }, [id, contextItems, registerContextItems, unregisterContextItems, ...deps])
}
