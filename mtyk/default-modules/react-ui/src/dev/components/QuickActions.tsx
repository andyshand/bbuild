import React, { useContext } from 'react'
import ButtonGroup from '../../core/components/ButtonGroup'
import { DevButton } from '../../core/components/DevButton'
import {
  ActionContext,
  CommandMenuContext,
  CommandMenuContextType,
  Option,
} from '../hooks/useRegisterCommands'
import DevtoolsSection from './Devtools/DevtoolsSection'

const QuickActions: React.FunctionComponent = () => {
  const { availableOptions } =
    useContext<CommandMenuContextType>(CommandMenuContext)

  const quickActions = availableOptions.filter((option) => option.isQuickAction)

  const handleActionClick = async (action: Option['action']) => {
    const context: ActionContext = {
      repl: async (command: string) => {
        // Implement your REPL function here
        return command
      },
    }
    await action(context, {})
  }

  return (
    <DevtoolsSection heading="Quick Actions">
      <ButtonGroup>
        {quickActions.map((action, index) => (
          <DevButton
            key={index}
            action={() => handleActionClick(action.action)}
          >
            {action.label}
          </DevButton>
        ))}
      </ButtonGroup>
    </DevtoolsSection>
  )
}

export default QuickActions
