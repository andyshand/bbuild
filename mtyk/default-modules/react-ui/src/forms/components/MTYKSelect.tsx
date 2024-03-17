import { ComponentProps } from 'react'
import Select from 'react-select'
import { BsChevronDown } from 'react-icons/bs'
function flatten(arr) {
  return arr.reduce(
    (acc, val) =>
      Array.isArray(val.options) ? acc.concat(flatten(val.options)) : acc.concat(val),
    []
  )
}
const clean = (x) => x.trim()
const toArray = (str) => (Array.isArray(str) ? str : (str ?? '').split(',').map(clean))

function getValue(opts, val, getOptVal, isMulti) {
  if (val === undefined) return undefined

  const options = flatten(opts)
  const value = options.filter((o) => toArray(val).includes(getOptVal(o)))

  return value
}

const defaultGetOptionValue = (opt) => opt?.value

export interface MTYKSelectProps<T extends any = string> {
  defaultValue?: T[]
  getOptionValue?: (opt: any) => any
  isMulti?: boolean
  options: any[] | T[]
  menu?: {
    className?: string
  }
  value?: T[]
  singleValue?: T
  className?: string
  onChange?: (val: T[]) => void
  onSingleChange?: (val: T | null) => void
}

const MTYKSelect = <T = string,>({
  defaultValue: simpleDefault,
  getOptionValue = defaultGetOptionValue,
  isMulti = false,
  options,
  menu,
  value: simpleValue,
  singleValue,
  ...rest
}: MTYKSelectProps<T> & ComponentProps<typeof Select>) => {
  const fullOptions = options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option }
    }
    return option
  })

  const value = getValue(
    fullOptions,
    (typeof singleValue !== 'undefined' && singleValue !== null
      ? [singleValue]
      : simpleValue) ?? [],
    getOptionValue,
    isMulti
  )
  const defaultValue = getValue(fullOptions, simpleDefault, getOptionValue, isMulti)

  const props = {
    defaultValue,
    getOptionValue,
    isMulti,
    options: fullOptions,
    value,
    ...rest,
  }

  return (
    <Select
      {...props}
      className={`my-react-select-container ${props.className ?? ''}`}
      classNamePrefix="my-react-select"
      components={{
        Menu: (propsInner) => (
          <div
            // include default styles
            style={{
              ...(propsInner.getStyles('menu', propsInner) as any),
              backgroundColor: 'transparent',
            }}
            className={`${menu?.className ?? ''}`}
            onWheelCapture={(e) => {
              e.stopPropagation()
            }}
          >
            {propsInner.children}
          </div>
        ),
        MenuList: (propsInner) => (
          <div
            className={`overflow-y-auto ${menu?.className ?? ''}`}
            onWheelCapture={(e) => {
              e.stopPropagation()
            }}
          >
            {propsInner.children}
          </div>
        ),
        Option: (props) => (
          <div
            className="text-black dark:text-white p-1 hover:bg-gray-700 cursor-pointer px-3 py-1 first:rounded-t-md last:rounded-b-md bg-gray-800 dark:bg-gray-900"
            onClick={() => {
              props.selectOption(props.data)
            }}
          >
            {props.label}
          </div>
        ),
        ValueContainer: (props) => (
          <div
            className="flex flex-wrap items-center gap-1 w-[10em] "
            onClick={() => {
              props.selectProps.onMenuOpen()
            }}
          >
            {props.children}
          </div>
        ),
        IndicatorSeparator: () => null,
        IndicatorsContainer: (props) => (
          <div
            className="pr-0"
            onClick={() => {
              props.selectProps.onMenuOpen()
            }}
          >
            {props.children}
          </div>
        ),
        DropdownIndicator: (props) => (
          <div
            className="cursor-pointer pr-0"
            onClick={() => {
              props.selectProps.onMenuOpen()
            }}
          >
            <BsChevronDown />
            {/* {props.children} */}
          </div>
        ),
        Input: (props) => null,
        SingleValue: (props) => (
          <div
            className="text-black dark:text-white truncate"
            onClick={() => {
              props.selectOption(props.data)
            }}
          >
            {props.children}
          </div>
        ),
        Control: (props) => (
          <div
            className="flex items-center bg-gray-800 dark:bg-gray-900 cursor-pointer rounded-md border border-gray-600 dark:border-gray-700 py-1 px-3 inline-flex"
            {...props}
            onClick={(e) => {
              // open menu
              props.selectProps.onMenuOpen()
            }}
          >
            {props.children}
          </div>
        ),
      }}
      onChange={(selected) => {
        if (rest.onChange) {
          if (isMulti) {
            rest.onChange(selected.map(getOptionValue))
          } else {
            if (selected === null) {
              rest.onChange([])
            } else {
              rest.onChange([getOptionValue(selected)])
            }
          }
        }
        if (rest.onSingleChange) {
          if (selected === null) {
            rest.onSingleChange(null)
          } else {
            rest.onSingleChange(getOptionValue(selected))
          }
        }
      }}
    />
  )
}

export default MTYKSelect
