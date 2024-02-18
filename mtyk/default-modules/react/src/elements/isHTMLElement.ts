import { ReactNode, ReactElement } from 'react'

export function isHTMLElement(element?: ReactNode): element is ReactElement {
  return (
    element != null &&
    typeof element === 'object' &&
    'type' in element &&
    typeof element.type === 'string'
  )
}

export function isHTMLElementOfType(
  element?: ReactNode,
  type?: string
): element is ReactElement {
  return isHTMLElement(element) && element.type === type
}
