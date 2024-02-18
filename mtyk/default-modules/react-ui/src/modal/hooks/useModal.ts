import reactUIState$ from '../../core/observables/reactUIState$'

export default function useModal<T = any>() {
  return {
    openModal: <U>(component: React.ComponentType<U>, props: U) => {
      reactUIState$.modal.assign({
        component,
        props,
      })
    },
    closeModal: () => {
      reactUIState$.modal.assign({
        component: null,
        props: null,
      })
    },
  }
}
