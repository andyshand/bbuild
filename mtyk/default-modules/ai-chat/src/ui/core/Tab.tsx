import { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';

export interface TabProps {
  icon: ReactNode;
  name: string;
  onClose?: () => void;
  onClick?: () => void;
  isActive?: boolean;
  dirty: boolean;
}

export default function Tab({ icon, name, onClose, isActive, dirty, onClick }: TabProps) {
  const tabClasses = `text-white flex items-center justify-center px-5 py-2 text-sm font-medium cursor-pointer rounded-t-lg 
    ${isActive ? 'bg-blue-500' : 'bg-gray-200'}
    ${dirty ? 'bg-red-500' : ''}
  `;

  return (
    <div className={tabClasses} onClick={onClick}>
      <span className="mr-2">{icon}</span>
      <span>{name}</span>
      {onClose && <button className="ml-auto" onClick={onClose}>
        <FaTimes />
      </button>}
    </div>
  );
}