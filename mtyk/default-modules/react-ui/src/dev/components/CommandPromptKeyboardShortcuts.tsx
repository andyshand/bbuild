import { useContext, useEffect } from "react"
import { CommandMenuContext } from "../hooks/useRegisterCommands"

export default function CommandPromptKeyboardShortcuts({ }) {
  const { availableOptions: options } = useContext(CommandMenuContext)

  useEffect(() => {
    // Listen for keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if any of the options have a matching shortcut
      options.forEach(option => {
        if (option.shortcut) {
          const keys = option.shortcut.split("+")
          const hasCtrl = keys.includes("ctrl")
          const hasShift = keys.includes("shift")
          const hasAlt = keys.includes("alt")
          const hasMeta = keys.includes("meta")
          const hasKey = keys[keys.length - 1]
          if (
            (hasCtrl !== event.ctrlKey) ||
            (hasShift !== event.shiftKey) ||
            (hasAlt !== event.altKey) ||
            (hasMeta !== event.metaKey) ||
            (hasKey.toLowerCase() !== event.key.toLowerCase())
          ) {
            return
          }
          // Trigger the action for the matching option
          option.action({ repl: async () => "" }, {}).then(result => {
            // do something with result?
          })
        }
      })
    }
    window.addEventListener("keydown", handleKeyDown)

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [options])

  return null
}