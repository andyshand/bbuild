export function makeShareUrl(sharerBaseUrl: string, toShare: string, params) {
  const shareURL = new URL(sharerBaseUrl)
  const search = new URLSearchParams({
    ...params,
    url: toShare,
  }).toString()
  shareURL.search = search
  const url = shareURL.href
  return url
}
