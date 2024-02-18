import React, { useId, useMemo } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { Option, useRegisterCommands } from '../../hooks/useRegisterCommands'
type Props = {
  tabs: { label: string; component: React.ComponentType<any> }[]
  tabProps?: any

  /**
   * If present, will save in local storage under this key
   */
  id?: string
}

const Tabs: React.FC<Props> = ({ tabs, tabProps, id }) => {
  const componentId = useId()
  const [selectedTab, setSelectedTab] = useLocalStorage(
    `tab-${id}` ?? componentId,
    0
  )
  const SelectedComponent = tabs[selectedTab]?.component as any

  const commands = useMemo(
    () =>
      tabs.map(
        (t, i) =>
          ({
            label: `Switch to tab ${i} (${t.label})`,
            action: async () => {
              setSelectedTab(i)
            },
            id: `switch-tab-${componentId}+${i + 1}`,
            shortcut: `meta+shift+${i + 1}`,
          } as Option)
      ),
    [tabs.length]
  )
  useRegisterCommands(commands)

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      <div className="flex space-x-8 h-fit flex-shrink-0 whitespace-nowrap overflow-x-auto mx-5 border-b dark:border-gray-700 ">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`font-medium text-sm py-4 px-4 dark:text-gray-200 select-none ${
              selectedTab === index
                ? 'text-blue-500 border-b border-blue-500'
                : 'border-b border-transparent hover:border-gray-300 text-gray-500 dark:text-gray-200'
            }`}
            onClick={() => setSelectedTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-grow flex-shrink-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col">
          {SelectedComponent && <SelectedComponent {...(tabProps ?? {})} />}
        </div>
      </div>
    </div>
  )
}

export default Tabs
