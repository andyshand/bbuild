import { ButtonHTMLAttributes } from 'react'

type ButtonProps = {
  action: () => Promise<void> | void
} & ButtonHTMLAttributes<HTMLButtonElement>

export function DevButton({
  action,
  className,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`hover:bg-gray-200 bg-gray-100 text-sm text-gray-600 font-semibold py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${className}`}
      onClick={action}
      {...props}
    >
      {props.children}
    </button>
  )
}
