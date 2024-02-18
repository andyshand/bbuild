import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  ActionContext,
  CommandMenuContext,
  Option,
  Result,
} from '../hooks/useRegisterCommands'
import CommandParametersForm from './CommandParametersForm'
import CommandPromptKeyboardShortcuts from './CommandPromptKeyboardShortcuts'
import {
  BoxWrapper,
  CommandContainer,
  Container,
  FormContainer,
  List,
  LoadingIndicator,
  ResultWrapper,
} from './Container'
import Input from './Input'
import { ListItemComponent } from './ListItemComponent'

export type CommandPromptProps = {}

const CommandPrompt: React.FC<CommandPromptProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedOption, setSelectedOption] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [_actionParameters, setActionParameters] = useState<{
    [action: string]: any
  }>({})

  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const { availableOptions: _options } = useContext(CommandMenuContext)
  const actions = {}

  const options = _options.concat(
    Object.keys(actions ?? {}).map((key: any) => {
      const { deps } = actions[key] ?? { deps: {} }

      // Create a json schema for the deps, if it has a type
      let outputSchema: any = null
      for (const [key, val] of Object.entries(deps ?? {})) {
        const value = val as any
        if (value.type) {
          outputSchema = {
            ...outputSchema,
            [key]: {
              type: value.type,
              title: value.title,
              description: value.description,
            },
          }
        } else {
          // Assume it's a string
          outputSchema = {
            ...outputSchema,
            [key]: {
              type: 'string',
              title: key,
              description: key,
            },
          }
        }
      }

      return {
        label: key,
        id: key,
        parametersSchema: { type: 'object', properties: outputSchema },
        action: async (): Promise<any> => {
          // return runAction(key)(actionParameters)
        },
      }
    }) as any
  )

  const filteredOptions = options.filter(
    (option) => option.label.toLowerCase().indexOf(query.toLowerCase()) > -1
  )

  const selected = filteredOptions[selectedOption]
  const actionParameters = _actionParameters[selected?.label ?? ''] ?? {}

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault() // Prevent the default "print" popup
        setIsOpen(true)
      } else if (event.key === 'ArrowUp' && !isLoading) {
        setSelectedOption((prevSelected) => Math.max(prevSelected - 1, 0))
      } else if (event.key === 'ArrowDown' && !isLoading) {
        setSelectedOption((prevSelected) =>
          Math.min(prevSelected + 1, filteredOptions.length - 1)
        )
      }
      inputRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [filteredOptions.length, isLoading])

  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[
        selectedOption
      ] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedOption])

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Escape') {
      if (!isLoading) {
        setIsOpen(false)
        setQuery('')
        setSelectedOption(0)
        setResult(null)
      }
    } else if (event.key === 'Enter' && !isLoading) {
      if (filteredOptions[selectedOption]) {
        await handleSelectOption(filteredOptions[selectedOption])
      }
    }
  }

  const handleSelectOption = (option: Option) => {
    if (option.parametersSchema) {
      executeOption(option, _actionParameters[option.id] ?? {})
    } else {
      executeOption(option, {})
    }
  }

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoading && event.target === event.currentTarget) {
      setIsOpen(false)
      setQuery('')
      setSelectedOption(0)
      setResult(null)
    }
  }

  const executeOption = async (option: Option, parameters: any) => {
    setIsLoading(true)
    const actionContext: ActionContext = {
      repl: async (command: string) => {
        // const res = await axios.post("/dev/repl", {
        // cmd: command,
        // });
        // return res.data?.output;
        return null as any
      },
    }
    const res = await option.action(actionContext, parameters)
    if (res) {
      setResult(res)
    }
    setIsLoading(false)
    inputRef.current?.focus()
  }
  const selectedd = filteredOptions[selectedOption]

  const container = (
    <Container onClick={handleClickOutside}>
      <BoxWrapper className="dark:bg-gray-900 text-black dark:text-white">
        <CommandContainer>
          <Input
            placeholders={
              selectedd?.cliParams
                ? [
                    '', // represents the command itself
                    ...selected.cliParams!.schema.map(
                      (p, i) => p.label ?? `Argument ${i + 1}`
                    ),
                  ]
                : ['Search commands...']
            }
            autoComplete={'none'}
            spellCheck={false}
            autoFocus
            ref={inputRef}
            value={query}
            onContentChange={(v) => setQuery(v)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {isLoading && <LoadingIndicator />}
          {!isLoading && (
            <List ref={listRef}>
              {filteredOptions.map((option, index) => (
                <ListItemComponent
                  option={option}
                  key={option.id}
                  index={index}
                  selectedOption={selectedOption}
                  handleSelectOption={handleSelectOption}
                  isLoading={isLoading}
                />
              ))}
            </List>
          )}
        </CommandContainer>
        <FormContainer>
          {selectedOption > -1 && filteredOptions[selectedOption] && (
            <div>
              <div>{selectedd.label}</div>
              <CommandParametersForm
                option={filteredOptions[selectedOption]}
                onChange={() => {
                  setActionParameters((prev) => ({
                    ...prev,
                    [filteredOptions[selectedOption].id]: {},
                  }))
                }}
                value={actionParameters ?? {}}
              />
            </div>
          )}
        </FormContainer>
      </BoxWrapper>
      <ResultWrapper className="dark:bg-gray-800">
        {result && result.element}
      </ResultWrapper>
    </Container>
  )

  const shortcuts = <CommandPromptKeyboardShortcuts />
  if (!isOpen) {
    return <>{shortcuts}</>
  }

  return (
    <>
      {container}
      {shortcuts}
    </>
  )
}

export default CommandPrompt
