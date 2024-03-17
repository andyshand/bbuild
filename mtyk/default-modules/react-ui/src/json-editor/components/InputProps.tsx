import { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'> & {
  textarea?: boolean
}

export function Input(props: InputProps) {
  const { className, ...rest } = props

  const Component = props.textarea ? 'textarea' : ('input' as any)
  return (
    <Component
      className={`${className} min-w-fit w-full rounded-md text-sm px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 border-gray-300`}
      {...rest}
    />
  )
}
