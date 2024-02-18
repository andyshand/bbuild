import { assertIsDefined } from 'modules/errors'
import { AiFillLinkedin, AiOutlineTwitter } from 'react-icons/ai'
import { makeShareUrl } from './makeShareUrl'
import { makeWebappLink } from './makeWebappLink'

export function getSharePropsForPlatform(opts: {
  router: any
  title: string
  urlToShare?: string
  tags?: string[]
  platform: 'Twitter' | 'Linkedin'
}) {
  const { router, title, tags, platform, ...restOpts } = opts
  const openUrl = (url: string) => {
    const win = window.open(url, '_blank')
    win?.focus()
  }

  const urlToShare = restOpts.urlToShare ?? makeWebappLink()
  const propsForPlatform = {
    Twitter: {
      icon: <AiOutlineTwitter color={'#4DA7E6'} />,
      bgColor: '#4DA7E6',
      href: makeShareUrl('https://twitter.com/intent/tweet', urlToShare, {
        title,
        tags,
        via: 'tokenblogs',
      }),
      action: () => openUrl(propsForPlatform.href),
    },
    Linkedin: {
      icon: <AiFillLinkedin color="#2E64BC" />,
      bgColor: '#2E64BC',
      href: makeShareUrl(
        `https://www.linkedin.com/sharing/share-offsite/?`,
        urlToShare,
        {
          title,
          source: makeWebappLink().replace('https://', ''),
          mini: 'true',
        }
      ),
      action: () => openUrl(propsForPlatform.href),
    },
  }[platform]!
  assertIsDefined(propsForPlatform)

  return propsForPlatform
}