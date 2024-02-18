import { createContext } from 'react';

export interface ContextMenuItem {
  label: string;
  action: (opts: { event?: any }) => void;
  subMenu?: ContextMenuItem[];
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number; };
  options: ContextMenuItem[];
  extra: { event?: any };
}
export const initialContextMenuState: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  options: [],
  extra: {}
};

export const ContextMenuContext = createContext<{
  state: ContextMenuState;
  openContextMenu: (x: number, y: number, options: ContextMenuItem[], extra: { event?: any }) => void;
  closeContextMenu: () => void;
}>({
  state: initialContextMenuState,
  openContextMenu: () => { },
  closeContextMenu: () => { }
});
