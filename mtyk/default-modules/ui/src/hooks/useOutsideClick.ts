import { useEffect } from 'react'

export default function useOutsideClick(element: any, onClickOut: () => void) {
  useEffect(() => {
    const onClick = ({ target }: any) =>
      !element?.contains(target) && onClickOut?.()
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [element])
}
