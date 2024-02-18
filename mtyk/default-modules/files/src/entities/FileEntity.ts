import { Entity, EntityField, EntityFunction } from 'modules/entities'
import { getS3 } from '../registerR2'
import aws from 'aws-sdk'
import { keyDep } from 'modules/deps/tokenDep'
import { globalDepContext } from 'modules/deps/createDepContext'

const port = 5123

export default class FileEntity extends Entity {
  @EntityField()
  contentType: string
  @EntityField()
  fileName: string
  @EntityField()
  size: number
  @EntityField()
  reference: string
  @EntityField()
  author: string
  @EntityField()
  created: string
  @EntityField()
  uploaded: boolean

  generateUrl() {
    return `http://localhost:${port}/file/${this.reference}`
  }
}

if (typeof window === 'undefined') {
  const startExpress = async () => {
    // dynamically import express
    const { express } = globalDepContext.provideSync({ express: keyDep('npm:express') })
    const app = express()

    app.get('/file/:id', async (req, res) => {
      try {
        const params = {
          Bucket: 'andyshand',
          Key: req.params.id,
        }

        getS3().getObject(params).createReadStream().pipe(res)
      } catch (e) {
        console.log(e)
        res.status(404).send('Not found')
      }
    })

    app.listen(port, () => {
      console.log(`File server is running on port ${port}`)
    })
  }
  setTimeout(() => {
    startExpress()
  }, 1000)
}
