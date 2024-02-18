import React, { Context, useContext } from 'react'
import { contextName } from './contextName'

export function useExpectedContext<T extends Context<any>>(
  context: T
): React.ContextType<T> {
  const value = useContext(context)
  if (!value) {
    throw new Error(
      `Expected context ${contextName(
        context
      )} to be available. Are you missing a provider component?`
    )
  }
  return value
}
