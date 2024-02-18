import { useContext } from 'react';
import { ContextMenuItem, ContextMenuContext } from '../components/initialContextMenuState';

export const useContextMenu = ({ options }: { options: ContextMenuItem[] }) => {
  const { openContextMenu } = useContext(ContextMenuContext);

  return {
    onContextMenu: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      openContextMenu(event.clientX, event.clientY, options, { event });
    },
  };
};
