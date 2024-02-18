import { HiCheck, HiExclamation, HiX } from 'react-icons/hi'

export function BaseToast({ icon, bgColor, textColor, children }) {
  return (
    <div className="flex flex-row items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
      <div
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgColor} ${textColor}`}
      >
        {icon}
      </div>
      <div className="ml-3 text-sm font-medium dark:text-white">{children}</div>
    </div>
  )
}

export function SuccessToast({ children }) {
  const icon = <HiCheck className="h-5 w-5" />
  const bgColor = 'bg-green-100 dark:bg-green-800'
  const textColor = 'text-green-500 dark:text-green-200'

  return (
    <BaseToast icon={icon} bgColor={bgColor} textColor={textColor}>
      {children}
    </BaseToast>
  )
}

export function ErrorToast({ children }) {
  const icon = <HiX className="h-5 w-5" />
  const bgColor = 'bg-red-100 dark:bg-red-800'
  const textColor = 'text-red-500 dark:text-red-200'

  return (
    <BaseToast icon={icon} bgColor={bgColor} textColor={textColor}>
      {children}
    </BaseToast>
  )
}

export function WarningToast({ children }) {
  const icon = <HiExclamation className="h-5 w-5" />
  const bgColor = 'bg-orange-100 dark:bg-orange-700'
  const textColor = 'text-orange-500 dark:text-orange-200'

  return (
    <BaseToast icon={icon} bgColor={bgColor} textColor={textColor}>
      {children}
    </BaseToast>
  )
}
