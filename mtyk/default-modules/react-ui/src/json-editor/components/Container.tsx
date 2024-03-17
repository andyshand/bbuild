import { ReactNode } from 'react'
import { BsFillCaretDownFill, BsFillCaretUpFill } from 'react-icons/bs'
import { usePathErrors } from './usePathErrors'

export function Container({
  label,
  type,
  path,
  children,
  topLevel,
  className,
  collapsed,
  setCollapsed,
  ...rest
}: {
  label: string
  type: string
  collapsed?: boolean
  path: (string | number)[]
  className?: string
  topLevel?: boolean
  children: ReactNode
  setCollapsed: (collapsed: boolean) => void
}) {
  const pathErrors = usePathErrors(path)
  return (
    <div
      className={`${className} ${
        topLevel
          ? ''
          : 'border ' +
            (path.length > 0 && pathErrors.length
              ? `border-red-500`
              : `border-gray-300 dark:border-gray-700`)
      } rounded-lg`}
      {...rest}
    >
      {!topLevel && (
        <div
          className="select-none flex flex-row cursor-pointer items-center justify-between rounded-md bg-gray-100 px-2 py-1 text-[.8em] font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 "
          onClick={() => {
            setCollapsed?.(!collapsed)
          }}
        >
          {label}
          <div className="flex-grow" />
          {/* <div className="text-xs text-gray-400 mr-2 px-1.5 py-[.3em] rounded-md bg-gray-300 ">
                      {type}
                    </div> */}
          <div>{collapsed ? <BsFillCaretDownFill /> : <BsFillCaretUpFill />}</div>
        </div>
      )}
      {!collapsed && <div className="mt-2 mb-2 content px-2 py-1">{children}</div>}
    </div>
  )
}
