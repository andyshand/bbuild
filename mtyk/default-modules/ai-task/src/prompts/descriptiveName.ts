import trimCode from '../util/trimCode'
import { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'

export default async function descriptiveName({ input }: { input: string }) {
  const code = trimCode(input, {})
  const out = await extractKeyValsAsObj({
    input: code,
    examples: [
      objToKeyVals({
        input: trimCode(`
        const booleanLocation = () => {
            if (['AMBULANCE', 'WALKIN'].includes(locationType)) {
                return true;
            } else {
                return false;
            }
        };
    `),
        output: trimCode(
          `const isAmbulanceOrWalkin = () => {
            if (['AMBULANCE', 'WALKIN'].includes(locationType)) {
                return true;
            } else {
                return false;
            }
        };`
        ),
      }),
    ],
  })

  process.stdout.write(out.output)
}
