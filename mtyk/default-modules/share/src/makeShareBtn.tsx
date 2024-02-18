// import { Flex, Txt } from 'asdfasdfamodules/frontend/core/components'
// import { useRouter } from 'next/router'
// import { ComponentProps, ReactNode } from 'react'
// import { getSharePropsForPlatform } from './index'

// export const makeShareBtn = ({
//   title,
//   children,
//   platform,
//   tags,
//   ...rest
// }: {
//   title: string
//   /**
//    * For twitter. Do not include a leading "#"
//    */
//   tags?: string[]
//   children?: ReactNode
//   href: string
//   platform: 'Twitter' | 'Linkedin'
// } & Partial<ComponentProps<typeof Flex>>) => {
//   const router = useRouter()
//   const propsForPlatform = getSharePropsForPlatform({
//     router,
//     title,
//     tags,
//     platform,
//   })

//   return (
//     <Flex
//       gap=".2em"
//       size=".9em"
//       onClick={propsForPlatform.action}
//       {...rest}
//       style={{
//         alignSelf: 'flex-start',
//         cursor: 'pointer',
//         padding: '.35em 1em',
//         background: propsForPlatform.bgColor ?? '#eaeaea',
//         borderRadius: '1000px',
//         border: '1px solid #aaa',
//         ...rest.style,
//       }}
//     >
//       <Flex row gap=".3em" alignItems="center">
//         {propsForPlatform.icon}
//         <Txt
//           size=".9em"
//           style={{ textDecoration: 'underline', color: 'black' }}
//         >
//           {children ?? `Share to ${platform}`}
//         </Txt>
//       </Flex>
//     </Flex>
//   )
// }
