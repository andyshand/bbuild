import React, { useCallback, useEffect, useState } from 'react'
import useEntitiesHooks from '../../hooks/useEntitiesHooks'
import DevtoolsSection from './DevtoolsSection'
import { HoverableComponent } from './HoverableComponent'
import { ParentHierarchy } from './ParentHierarchy'
import { SelectedComponentObjs } from './SelectedComponentObjs'
import MTYKSelect from '../../../forms/components/MTYKSelect'
import { observer } from '@legendapp/state/react'

interface ComponentListProps {
  components: ParentHierarchy[]
}

const TextareaComponent = observer(({ value, onChange, selectedComponents }: {
  value: string, onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void, selectedComponents: string[]
}): any => {
  const [loading, setLoading] = useState(false);
  const { useEntities } = useEntitiesHooks()
  const [componentEditWf] = useEntities('Workflow', {
    name: 'DC Component Edit'
  }) as any[] // todo type
  const inputNodes = componentEditWf?.nodes.filter((n) => n.type === 'input') ?? []
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedInputId && inputNodes?.length) {
      setSelectedInputId(inputNodes[0].id)
    }
  }, [inputNodes?.length, componentEditWf?.id])

  const handleSubmit = () => {
    setLoading(true);
    // Submit the request here
    const session = componentEditWf?.run({
      nodes: [{ id: selectedInputId, input: value }]
    })
  }

  const handleCancel = () => {
    // Cancel the request here
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={onChange}
          className={`mt-4 w-full rounded p-2 text-sm ${loading ? 'bg-gray-200' : ''} resize-none dark:bg-gray-800`}
          placeholder="Change request..."
          disabled={loading}
          autoFocus
          rows={10}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              handleSubmit()
            }
          }}
        />
        <p className="text-xs p-3" style={{ position: 'absolute', bottom: 0, right: 0 }}>Cmd+Enter to submit</p>
      </div>
      {selectedComponents.length > 1 && (
        <div className="flex flex-row items-center flex-wrap gap-2">
          {selectedComponents.map((id) => (

            <div key={id} className="px-2 py-0.5 bg-gray-400 text-white rounded-full text-xs dark:bg-gray-700 font-medium" title={id}>
              {id.split('/').slice(-1)[0]}
            </div>
          ))}
        </div>
      )}
      <MTYKSelect options={inputNodes?.map((n) => (n?.data as any).name ?? n.id)} singleValue={selectedInputId}
        onSingleChange={(value) => {
          setSelectedInputId(value)
        }}
      />
      <button onClick={handleSubmit} disabled={loading}>Submit</button>
      <button onClick={handleCancel} disabled={loading}>Cancel</button>
    </div>
  )
})

export const ComponentList = observer(({ components }: {
  components: any[]
}): any => {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [textareaValue, setTextareaValue] = useState<string>('')
  const { useEntities } = useEntitiesHooks()
  const [componentEditWf] = useEntities('Workflow', {
    name: 'DC Component Edit'
  })

  console.log({ componentEditWf })

  const handleClick = useCallback(
    (id: string, shift: boolean) => {
      if (shift) {
        setSelectedComponents((prevSelected) =>
          prevSelected.includes(id)
            ? prevSelected.filter((item) => item !== id)
            : [...prevSelected, id]
        )
      } else {
        setSelectedComponents((prevSelected) =>
          prevSelected.includes(id)
            ? prevSelected.filter((item) => item !== id)
            : [id]
        )
      }
    },
    [setSelectedComponents]
  )

  const handleTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextareaValue(event.target.value)
    },
    []
  )

  const renderComponents = (index: number): JSX.Element | null => {
    if (index >= components.length) {
      return null
    }

    const { parent, fiberProp, id, debugSource } = components[index]
    const boundingBox = parent?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    const vsCodeLink = `vscode://file/${debugSource.fileName}:${debugSource.lineNumber}:${debugSource.columnNumber}`
    const isSelected = selectedComponents.includes(id)
    const fileName = debugSource.fileName.split('/').slice(-1)

    return (
      <HoverableComponent key={id} boundingBox={boundingBox} name={fileName}>
        <a
          href={vsCodeLink}
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault()
              handleClick(id, e.shiftKey)
            }
          }}
          target="_blank"
          rel="noopener noreferrer"
          className={`block hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded ${isSelected ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
        >
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {debugSource.fileName.split('/').slice(-1)}
          </div>
          <div
            className="text-xs text-gray-600 dark:text-gray-400 truncate"
            style={{
              maxWidth: '60em',
            }}
          >
            {debugSource.fileName
              .replace(
                '/Users/andrewshand/Documents/Github/design-cloud-github/',
                ''
              )
              .replace('/Volumes/SSD/Github/design-cloud/', '')}
            {'@'}
            {debugSource.lineNumber}:{debugSource.columnNumber}
          </div>
        </a>
        <div className="ml-4">{renderComponents(index + 1)}</div>
      </HoverableComponent>
    )
  }

  const selectedComponentObjs = components.filter((c) => true)

  return (
    <DevtoolsSection heading="Components">
      {renderComponents(0)}
      {selectedComponents.length > 0 && (
        <TextareaComponent value={textareaValue} onChange={handleTextareaChange} selectedComponents={selectedComponents} />
      )}
      <SelectedComponentObjs selectedComponentObjs={selectedComponentObjs} />
    </DevtoolsSection>
  )
})
