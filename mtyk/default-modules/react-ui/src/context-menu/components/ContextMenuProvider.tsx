import { ReactNode, useState } from 'react';
import { initialContextMenuState, ContextMenuItem, ContextMenuContext } from './initialContextMenuState';
import { MTYKContextMenu } from './MTYKContextMenu';

export const ContextMenuProvider = ({ children }: { children: ReactNode; }) => {
  const [state, setState] = useState(initialContextMenuState);

  const openContextMenu = (x: number, y: number, options: ContextMenuItem[], extra) => {
    setState({ isOpen: true, position: { x, y }, options, extra: extra });
  };

  const closeContextMenu = () => {
    setState({ ...state, isOpen: false });
  };

  return (
    <ContextMenuContext.Provider value={{ state, openContextMenu, closeContextMenu }}>
      {children}
      <MTYKContextMenu />
    </ContextMenuContext.Provider>
  );
};
