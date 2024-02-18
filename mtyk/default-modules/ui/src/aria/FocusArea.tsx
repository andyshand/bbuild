import React from 'react'

export interface FocusAreaProps {
  children: React.ReactNode
}

export default function FocusArea({ children }: FocusAreaProps) {
  return <>{children}</>
}
