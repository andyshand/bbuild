import ask, { pagedAsk } from './ask'
import path from 'path'
import { trimCode } from '../util/trimCode'
import { Model } from '../getCompletionNoStream'
import extract from './extract'
import cacheWithKey from '../util/cacheWithKey'

const fse = require('fs-extra')
const glob = require('glob')

const forF = async (f: string) => {
  const contents = fse.readFileSync(f, 'utf8').toString()
  const methodpath = await extract({
    input: contents,
    model: Model.Davinci2,
    assertion:
      'the following API method is called (formatted as METHOD /path):',
  })
  const [method, path] = methodpath.split(' ')
  const documentation = await extract({
    input: contents,
    model: Model.Davinci3,
    assertion:
      'the below documentation explains the usage of this method, including example use cases:\n',
  })
  console.log({ method, path, documentation })
  return { method, path, documentation }
}
export const describeApiCalls = async () => {
  const oldApiDir = `/Users/andrewshand/Github/react-frontend/frontend/src/logic/api`
  const apiFiles = glob.sync(`${oldApiDir}/**/*.js`)

  let out: { method: string; path: string; documentation: string }[] = []
  for (const f of apiFiles) {
    const ff = await cacheWithKey(path.basename(f) + '-docs', () => forF(f))
    out.push(ff)
  }
  return out.map(o => ({
    method: o.method,
    path: (o.path ?? '').split('\n')[0],
    documentation: o.documentation,
  }))
}

export default async function DivinaPage() {
  const newDir = `/Volumes/andrewshand/Github/frontend-virtual-ER/emergency-room`

  const apiCalls = await describeApiCalls()
  const oldDir = `/Volumes/andrewshand/Github/react-frontend`

  // For each .tsx file under src/pages, load the file

  const pages = glob.sync(`${newDir}/src/pages/**/*.tsx`)

  // For each page, check to see if it's connected to the API
  for (const page of pages) {
    const content = trimCode(fse.readFileSync(page, 'utf8').toString())
    // const connected = await pagedAsk({
    //   input: content,
    //   assertion: 'this code uses mock data or is using data from the API',
    //   asQuestion: `does this code use mock data or is it using real data from the API?`,
    // })
    const connected = await pagedAsk({
      input: content,
      task: `find out whether this code would need to make any API calls`,
      // assertion: 'what data, if any, does this code display API',
      eachPage: `Is it likely this page needs to make API calls? If the page appears to include mock data in place of real data, I should answer yes. I will write my answer below:\n`,
      asQuestion: `did any pages need to make API calls?`,
      model: Model.Davinci3,
      stop: '\n\n',
    })

    const notRequired = /false|no|nah|untrue/.test(
      connected.output.toLowerCase()
    )
    if (notRequired) {
      // Emoji for "no"
      console.log('👎🏻', { connected, page })
    } else {
      // Emoji for "yes"
      console.log('👍🏻', { connected, page })
    }

    // Check to see if it's connected to the API

    // Check the old repo for the old page, see which API method was called

    // Now hook up the new page to the same API method, using the new API client
  }
}
