import lowercaseMatch from '../util/lowercaseMatch'
import { extractListSimple } from './extract'

const paths = [
  '/Users/andrewshand/.cache/ai-task/PatientObservationsGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/AgreementGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/AgreementPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/base.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/BloodOrderGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/BloodOrderPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ChatGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ClassesGetAPI.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ClassGetStatisticApiCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ClassPutCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/CloseClassApiCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ConfirmUserPost.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ContactPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/CreateClassPost.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/createUser.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/dfn.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DiagnosisGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DiagnosisPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DischargeFormGet.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DischargeFormPost.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DocumentationGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DocumentPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DrugChartGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DrugChartPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/DrugChartPutCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ExamPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/FeedbackGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/fullPatient.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/GameSessionListGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/InvestigationOrderGetCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/InvestigationOrderPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/login.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/PatientListApiCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/PatientObservationsPostCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/PatientScoreGet.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ResetPasswordCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/ResetPasswordNewPasswordCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/RoomMovePutCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionApiCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionGetReviewDetailsCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionPutLock.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionTokenCall.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionTurnsGet.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/SessionTurnsPut.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/UserDetailsGet.js-docs.json',
  '/Users/andrewshand/.cache/ai-task/UserDetailsPut.js-docs.json',
]

export default async function divinaWhichApi(opts: { purpose?: string }) {
  const purpose = opts.purpose ?? 'update the number of session turns'
  // const apiCallInfo: any[] = []
  const apiCallInfo = await Promise.all(
    paths.map(async p => {
      const { default: apiCallInfo } = await import(p)
      return { ...apiCallInfo, path: apiCallInfo.path.split('\n')[0] }
    })
  )

  const info = `${apiCallInfo.map(a => a.path).join(', ')}`
  const q = await extractListSimple({
    input: `I am a highly skilled react programmer and I want to ${purpose}. I have a list of possible API calls as follows:\n${info}
    
I believe the following 7 are most likely allow me to ${purpose} (format METHOD /path):\n1.`,
  })
  const asMethodPath = q.map(a => a.split(' '))

  const matching = apiCallInfo.filter(a =>
    asMethodPath.find(
      b => lowercaseMatch(b[0], a.method) && lowercaseMatch(b[1], a.path)
    )
  )
  const docs = `Here is the documentation for the API calls I believe would be relevant to this code. 
  ${JSON.stringify(
    matching.filter(a => a),
    null,
    2
  )}
  
Now that I understand the API calls, I have compiled what I believe to be the most relevant, with a brief accompanying explanation of my reasoning. I have sorted them by most-relevant first:\n1.`

  const q2 = await extractListSimple({
    input: docs,
  })
  console.log(q2)
}
