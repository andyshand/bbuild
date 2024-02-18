import { useRegisterCommands } from "modules/react-ui/dev/hooks/useRegisterCommands"
import type { MTYKSelectProps } from "modules/react-ui/forms/components/MTYKSelect"
import MTYKSelect from "modules/react-ui/forms/components/MTYKSelect"
import { forwardRef, useMemo } from "react"
import useEngines from "../hooks/useEngines"

const getEngineByDirection = (engines: string[], currentValue: string, direction: number) => {
	let index = engines.findIndex((e) => e === currentValue)
	if (index === -1) {
		index = direction === 1 ? -1 : 1
	}
	index = (index + direction + engines.length) % engines.length
	return engines[index]
}

const EngineSelect = forwardRef(<T extends string = string>(props: Omit<MTYKSelectProps<T>, "options">, ref: any) => {
	const engines = useEngines()
	const options = useMemo(
		() => [
			{
				action: async (ctx: any, params: any) => {
					if (props.value) {
						props.onChange?.([getEngineByDirection(engines, props.value[0], 1)] as T[])
					}
				},
				id: `engine-select-next`,
				label: `Select next engine`,
				shortcut: `ctrl+shift+ArrowRight`,
			},
			{
				action: async (ctx, params) => {
					if (props.value) {
						props.onChange?.([getEngineByDirection(engines, props.value[0], -1)] as T[])
					}
				},

				id: `engine-select-previous`,
				label: `Select previous engine`,
				shortcut: `ctrl+shift+ArrowLeft`,
			},
		],
		[engines.join(""), JSON.stringify(props.value)],
	)

	useRegisterCommands(options)

	return (
		<>
			<MTYKSelect options={engines} ref={ref} {...props} />
		</>
	)
})

export default EngineSelect
