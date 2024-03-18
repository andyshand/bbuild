import { observable } from '@legendapp/state'
import { ComponentType } from 'react'

// Quick fix for duplicate packages...
let windowVar = '__reactUIState'
let _observable = observable({
  modal: {
    component: null as ComponentType<any> | null,
    props: null as any,
  },
})
if (typeof window !== 'undefined') {
  window[windowVar] = window[windowVar] || {}
  if (window[windowVar]?.observable) {
    _observable = window[windowVar]?.observable
  }
  window[windowVar].observable = _observable
}

export default _observable
