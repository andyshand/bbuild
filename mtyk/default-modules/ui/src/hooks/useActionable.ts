import { ActionProps } from '../hoc/makeActionable'

export default function useActionable<T>(props: ActionProps<T>) {
  const { label, id: _id, action, disabled } = props

  const id = _id ?? label?.toLowerCase().replace(/\s/g, '-') ?? ''
  if (!id) {
    // console.warn('useActionable: id is required')
  }
  const extraProps = {
    'data-testid': id,
    'aria-label': label,
    onClick: (event) => {
      event.stopPropagation()
      if (disabled) {
        return
      }
      async function doIt() {
        const asAsync = async (val) => val
        await asAsync(action())
      }
      doIt()
    },
    style: {
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      ...props.style,
    },
  }

  return { props: extraProps }
}
