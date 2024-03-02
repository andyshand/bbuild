import { observer } from '@legendapp/state/react'
import { ComponentProps, createElement } from 'react'
import { ContextMenuProvider } from '../../context-menu/components/ContextMenuProvider'
import CommandMenuProvider from '../../dev/components/CommandMenuProvider'
import WhatsNew from '../../misc/components/WhatsNew'
import { ToastProvider } from '../../toasts/components/ToastProvider'
import reactUIState$ from '../observables/reactUIState$'

const ModalRenderer = observer(function ModalRenderer(props: {}) {
  const { component, props: props2 } = reactUIState$.modal.get()

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
  // If staging.designcloud.app, redirect to staging2.designcloud.app
  // if (location.hostname === 'staging.designcloud.app') {
  // useEffect(() => {
  //   const doIt = async () => {
  //     try {
  //       const d = await fetch(
  //         `/api/error?url=${encodeURIComponent(location.href)}`
  //       )
  //       const json = await d.json()
  //       const { webapp } = json as any

  //       if (window.location.href !== webapp) {
  //         window.location.href = webapp
  //       }
  //     } catch (e) {
  //       /* no-op */
  //     }
  //   }
  //   doIt()
  // }, [])

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
