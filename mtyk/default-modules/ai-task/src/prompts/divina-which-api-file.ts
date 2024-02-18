import { extractList } from './extract'

export default async function divinaWhichApi(file: string) {
  const apiCallInfo: any[] = []

  const prompt = `The following is the content for the file ${file}:`

  const q = await extractList({
    input: `Out of the following API calls, the following 5 I believe would most likely be relevant to this code (format METHOD /past):\n1.`,
    assertion: '',
  })

  const matching = apiCallInfo.filter(a => a)
  const docs = `Here is the documentation for the API calls I believe would be relevant to this code. 

  ${JSON.stringify(
    apiCallInfo.filter(a => a),
    null,
    2
  )}
  
Now that I understand the API calls, I believe the following 5 API calls would be most relevant to this code:\n1.`
}
