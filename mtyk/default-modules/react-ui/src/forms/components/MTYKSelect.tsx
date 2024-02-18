import Select from 'react-select'
import { ComponentProps } from 'react'

function flatten(arr) {
  return arr.reduce(
    (acc, val) =>
      Array.isArray(val.options)
        ? acc.concat(flatten(val.options))
        : acc.concat(val),
    []
  )
}
const clean = (x) => x.trim()
const toArray = (str) =>
  Array.isArray(str) ? str : (str ?? '').split(',').map(clean)

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
  const defaultValue = getValue(
    fullOptions,
    simpleDefault,
    getOptionValue,
    isMulti
  )

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
        // Menu: (propsInner) => (
        //   <div
        //     className={`bg-gray-800 ${menu?.className ?? ''}`}
        //     onWheelCapture={(e) => {
        //       e.stopPropagation()
        //     }}
        //   >
        //     {propsInner.children}
        //   </div>
        // ),
        MenuList: (propsInner) => (
          <div
            className={`bg-gray-800 overflow-y-auto ${menu?.className ?? ''}`}
            onWheelCapture={(e) => {
              e.stopPropagation()
            }}
          >
            {propsInner.children}
          </div>
        ),
        // Option: (props) => (
        //   <div className="option-container">{props.children}</div>
        // ),
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
      styles={{
        control(base, props) {
          return {
            ...base,
            minWidth: 'max-content',
            backgroundColor: '#F9FAFB',
            minHeight: '42px',
          }
        },
      }}
    />
  )
}

export default MTYKSelect
