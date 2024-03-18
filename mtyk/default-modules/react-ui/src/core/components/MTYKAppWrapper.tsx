'use client'
import { observer, useSelector } from '@legendapp/state/react'
import { ComponentProps, createElement } from 'react'
import { ContextMenuProvider } from '../../context-menu/components/ContextMenuProvider'
import CommandMenuProvider from '../../dev/components/CommandMenuProvider'
import WhatsNew from '../../misc/components/WhatsNew'
import { ToastProvider } from '../../toasts/components/ToastProvider'
import reactUIState$ from '../observables/reactUIState$'

const ModalRenderer = observer(function ModalRenderer(props: {}) {
  const { component, props: props2 } = useSelector(reactUIState$.modal)

  if (!component) {
    return null
  }

  return (<>{createElement(component, props2)}</>) as any
})

const MTYKAppWrapper = observer(function MTYKAppWrapper({
  children,
  whatsNewProps,
}: {
  children: React.ReactNode
  whatsNewProps?: ComponentProps<typeof WhatsNew>
}) {
  return (
    <>
      <CommandMenuProvider>
        <ToastProvider>
          <ContextMenuProvider>{children}</ContextMenuProvider>
          <ModalRenderer />
          {whatsNewProps && <WhatsNew {...whatsNewProps} />}
        </ToastProvider>
      </CommandMenuProvider>
    </>
  )
} as any)

export default MTYKAppWrapper
