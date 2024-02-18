import { css } from '@emotion/react'
import React, { useState, useEffect, useRef } from 'react'

const Input = React.forwardRef<HTMLInputElement, any>(
  ({ placeholders, onContentChange, ...props }, ref) => {
    const [content, setContent] = useState(props.value || '')

    const contentRef = useRef<any>(null)
    useEffect(() => {
      setContent(props.value || '')
    }, [props.value])

    const handleContentEditableChange = () => {
      const textContent = contentRef.current?.textContent || ''
      setContent(textContent)
      if (onContentChange) {
        onContentChange(textContent)
      }
    }

    const valueParts = (content?.trim() ?? '') === '' ? [] : content.split(' ')
    const placeholdersToShow = placeholders?.slice(valueParts.length)

    return (
      <div className="relative flex flex-row flex-wrap gap-1 p-2 text-base items-center dark:bg-gray-800">
        <div
          contentEditable
          className={'border-none outline-none'}
          style={{
            outline: 'none',
          }}
          ref={(element) => {
            contentRef.current = element
            let reff = ref as any
            if (reff) {
              if (typeof reff === 'function') {
                reff(element)
              } else {
                reff.current = element
              }
            }
            // set content of div to value
            if (element) {
              element.textContent = content
            }
          }}
          onInput={handleContentEditableChange}
          {...props}
        />

        {placeholdersToShow?.map((placeholder, index) => (
          <div
            key={index}
            className="text-gray-500 text-xs bg-white px-1 rounded"
          >
            {placeholder}
          </div>
        ))}
      </div>
    )
  }
)

export default Input
