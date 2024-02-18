export default function useCopyToClipboard(
  value: string,
  onCopied?: () => void
) {
  const copy = () => {
    navigator.clipboard.writeText(value)
    onCopied?.()
  }

  return { copy }
}
