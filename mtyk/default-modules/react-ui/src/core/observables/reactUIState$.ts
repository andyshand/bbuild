import { observable } from '@legendapp/state'
import { ComponentType } from 'react'

export default observable({
  modal: {
    component: null as ComponentType<any> | null,
    props: null as any,
  },
})
