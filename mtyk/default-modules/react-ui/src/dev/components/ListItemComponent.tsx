import { ListItem, LoadingIndicator } from './Container'
import { BsLightningChargeFill } from 'react-icons/bs'
import { IoReturnDownBackSharp } from 'react-icons/io5'
export function ListItemComponent({
  option,
  index,
  selectedOption,
  handleSelectOption,
  isLoading,
}) {
  const Icon = option.Icon ?? BsLightningChargeFill
  return (
    <ListItem
      className={`hover:bg-gray-700 hover:text-white dark:hover:bg-gray-700 ${
        index === selectedOption
          ? 'bg-gray-700 dark:bg-gray-500 text-white'
          : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'
      }`}
      key={index}
      isSelected={index === selectedOption}
      onClick={() => handleSelectOption(option)}
    >
      <div className="flex w-full flex-row gap-2 items-center">
        <div className="text-[.7rem]">
          <Icon />
        </div>
        <span className="truncate">{option.label}</span>
        {option.provider && (
          <span className="text-gray-700">{option.provider}</span>
        )}
        <div className="flex-grow" />
        {option.shortcut ? (
          <div className="ml-2 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 bg-gray-300 dark:bg-gray-700 text-[.92em]">
            {option.shortcut}
          </div>
        ) : null}
      </div>
      {option.tags}
      {selectedOption === index && (
        <div className="text-sm mt-1 flex flex-row justify-end items-center gap-2">
          <span className="text-gray-500">Run</span>
          <div className="bg-gray-800 text-white rounded-md px-2 py-0.5">
            <IoReturnDownBackSharp className="mr-1" />
          </div>
        </div>
      )}
      {isLoading && (
        <div>
          loading
          <LoadingIndicator />
        </div>
      )}
    </ListItem>
  )
}
