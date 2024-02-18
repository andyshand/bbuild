import { useContext } from 'react'
import { ToastContext } from '../components/ToastContext'

export default function useToast() {
  const toast = useContext(ToastContext)

  return toast
}
