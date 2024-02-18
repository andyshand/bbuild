import React, { cloneElement } from 'react'

/**
 * Also merges styles
 */
export default function cloneAndAddProps(child, props) {
  return (
    <>
      {cloneElement(child, {
        ...child.props,
        ...props,
        style: {
          ...(child.props.style ?? {}),
          ...(props.style ?? {}),
        },
      })}
    </>
  )
}
