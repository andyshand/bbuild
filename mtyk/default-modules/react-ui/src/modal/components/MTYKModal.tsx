import OutsideClickHandler from "../../misc/components/OutsideClickHandler"
import useModal from "../hooks/useModal";
import Select from 'react-select/async';
import { useEffect, useState } from 'react';
export default function MTYKModal({ children, className, ...rest }: {
  children: React.ReactNode
  className?: string
}) {
  const { closeModal } = useModal()
  // Add window on keydown listener for escape that will close the modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeModal])
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(2px)'

    }} {...rest}>
      <OutsideClickHandler onOutsideClick={() => {
        closeModal()
      }}>
        <div className={`bg-white rounded-lg ${className}`}>
          {children}
        </div>
      </OutsideClickHandler>
    </div>
  );
}
export function MTYKSelectModal({ loadOptions, onConfirm, ...props }: {
  loadOptions: any
  onConfirm: any
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  return (
    <MTYKModal>
      <Select
        loadOptions={loadOptions}
        onChange={setSelectedOption}
        {...props}
      />
      <button onClick={() => {
        onConfirm(selectedOption)
      }}>Close</button>
    </MTYKModal>
  );
}