export const Checkbox = ({ className, ...rest }) => {
  return (
    <input
      type="checkbox"
      className={`${className} border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
      {...rest}
    />
  )
}
