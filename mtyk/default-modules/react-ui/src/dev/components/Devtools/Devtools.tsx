import _ReactSplit, { SplitDirection } from '@devbookhq/splitter'
import { useEffect } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import TabbedContent from './TabbedContent'
import Tabs from './Tabs'
import { DebugTab } from './DebugTab'
const ReactSplit = _ReactSplit as any

interface HoverInfoProps {
  children: React.ReactNode
}

const isLocalhost =
  typeof window !== 'undefined' && window.location.href.includes('localhost')

const Devtools = ({ children }: HoverInfoProps) => {
  const [isOpen, setIsOpen] = useLocalStorage('devtoolsOpen', false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey && event.shiftKey && event.altKey) {
        if (!isOpen) {
          if (!isLocalhost) {
            return
          }
        }
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!isOpen) {
    return <>{children}</>
  }

  return (
    <div className={`flex ${isOpen ? '' : 'w-full'} h-screen overflow-hidden`}>
      <ReactSplit direction={SplitDirection.Horizontal} initialSizes={[60, 40]}>
        <div className="h-screen">{children}</div>
        {isOpen && (
          <div className="popup bg-white dark:bg-black rounded p-2 shadow h-screen overflow-y-scroll">
            <TabbedContent>
              <Tabs
                id="debug"
                tabs={[
                  {
                    label: 'Debug',
                    component: DebugTab,
                  },
                ].filter(Boolean)}
              />
            </TabbedContent>
          </div>
        )}
      </ReactSplit>
    </div>
  )
}

export default Devtools
