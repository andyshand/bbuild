import { Observable } from 'rxjs'
import https from 'https'

export function getCompletion(prompt: string, settings?: any) {
  console.log('hello', prompt)
  // import dotenv from "dotenv-flow";
  // dotenv.config({
  //   node_env: process.env.APP_ENV || process.env.NODE_ENV || "development",
  //   silent: true,
  // });
  return new Observable(observer => {
    let complted = false
    const req = https.request(
      {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        },
      },
      function (res) {
        res.on('data', chunk => {
          // console.log('BODY: ' + chunk)

          let d = chunk.toString().replace('data: ', '').trim()
          if (d === '[DONE]' || !d.length) {
            if (!complted) {
              complted = true
              observer.complete()
            }
            return
          }
          console.log(d)
          try {
            const asJSON = JSON.parse(d)
            observer.next(asJSON.choices[0].text)
          } catch (e) {
            console.error(e)
          }
        })
        res.on('end', () => {
          if (!complted) {
            complted = true
            observer.complete()
          }
          // console.log('No more data in response.')
        })
      }
    )
    // setTimeout(() => req.destroy(), 1500)
    // req.end()

    const body = JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 1.0,
      frequency_penalty: 0.5,
      presence_penalty: 0.7,
      stream: true,
      ...settings,
    })

    req.on('error', e => {
      console.error('problem with request:' + e.message)
    })

    req.write(body)
    req.end()
  })
}
