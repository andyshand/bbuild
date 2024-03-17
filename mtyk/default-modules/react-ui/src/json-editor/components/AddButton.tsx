import { BsFillCaretDownFill } from 'react-icons/bs'

export const AddButton = ({ className, ...rest }) => {
  return (
    <button
      className={`${className} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`}
      {...rest}
    >
      <BsFillCaretDownFill />
    </button>
  )
}
