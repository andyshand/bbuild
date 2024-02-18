import React, { ChangeEvent, useCallback } from 'react'
import { Option } from '../hooks/useRegisterCommands'

type ParametersFormProps = {
  value: any
  onChange: (value: any) => void
  option: Option
}

const CommandParametersForm: React.FC<ParametersFormProps> = ({
  value,
  onChange,
  option,
}) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, fieldName: string) => {
      onChange({
        ...value,
        [fieldName]: event.target.value,
      })
    },
    [value, onChange]
  )

  if (!option.parametersSchema || option.parametersSchema.type !== 'object') {
    return null
  }

  const properties = option.parametersSchema.properties

  return (
    <form className="bg-white p-2 dark:bg-gray-800">
      {Object.entries(properties ?? {}).map(
        ([fieldName, fieldSchema]: [string, any]) => (
          <div key={fieldName} className="mb-4">
            <label
              htmlFor={fieldName}
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {fieldSchema.description || fieldName}
            </label>
            <input
              type={fieldSchema.type === 'number' ? 'number' : 'text'}
              id={fieldName}
              value={value[fieldName] || ''}
              onChange={(event) => handleChange(event, fieldName)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        )
      )}
    </form>
  )
}

export default CommandParametersForm
