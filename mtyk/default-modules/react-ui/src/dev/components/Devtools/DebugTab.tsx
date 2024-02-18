// import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ComponentList } from './ComponentList'
import { getParentHierarchy } from './getParentHierarchy'

export function DebugTab() {
  const [parentHierarchy, setParentHierarchy] = useState<any[]>([])
  const [MetaPressed, setMetaPressed] = useState(false)

  // const router = useRouter()
  const currentPage = `/Volumes/SSD/Github/design-cloud/webapp/pages${'tempfix'}.tsx`

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey) {
        setMetaPressed(true)
      }
    }

    const handleKeyUp = (event) => {
      if (event.key === 'Meta') {
        setMetaPressed(false)
      }
    }

    const handleMouseMove = (event) => {
      if (MetaPressed) {
        const parents = getParentHierarchy(event.target)
        if (parents) {
          if (parents.length) {
            setParentHierarchy([
              {
                debugSource: {
                  fileName: currentPage,
                  lineNumber: 0,
                  columnNumber: 0,
                },
              },
              ...parents,
            ])
          }
        } else {
          setParentHierarchy([])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [MetaPressed])

  return (
    <div className="flex flex-col">
      hi
      <ComponentList components={parentHierarchy} />
    </div>
  )
}
