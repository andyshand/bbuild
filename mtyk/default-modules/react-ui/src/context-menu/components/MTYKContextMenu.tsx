import { useContext } from 'react'
import { ContextMenuItem, ContextMenuContext } from './initialContextMenuState'
import OutsideClickHandler from '../../misc/components/OutsideClickHandler'

export const MTYKContextMenu = () => {
  const { state, closeContextMenu } = useContext(ContextMenuContext)

  const renderSubMenu = (option: ContextMenuItem) =>
    option.subMenu && (
      <div className="bg-white shadow-md rounded px-3 py-2">
        {option.subMenu.map((subOption, index) => (
          <div
            key={index}
            onClick={() => {
              subOption.action(state.extra)
              closeContextMenu()
            }}
            className="cursor-pointer hover:bg-gray-200 px-2 py-1"
          >
            {subOption.label}
          </div>
        ))}
      </div>
    )

  return (
    state.isOpen && (
      <OutsideClickHandler onOutsideClick={closeContextMenu}>
        <div
          style={{
            position: 'absolute',
            top: state.position.y + 10,
            left: state.position.x,
          }}
          className="bg-white shadow-md rounded  user-select-none"
        >
          {state.options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                option.action(state.extra)
                closeContextMenu()
              }}
              className="cursor-pointer hover:bg-gray-200 px-2 py-1 text-[.92rem]"
            >
              {option.label}
              {renderSubMenu(option)}
            </div>
          ))}
        </div>
      </OutsideClickHandler>
    )
  )
}
