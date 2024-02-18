import { provideDepsSync } from 'modules/deps'
import React, { useContext } from 'react'

export const DepContext = React.createContext(null)

export function useDeps(specMap: any, extra?: any) {
  const ctx = useContext(DepContext)
  return provideDepsSync(specMap, extra, ctx ?? undefined)
}
