import { depFn, zodDep } from 'modules/deps/index'
import { z } from 'zod'
import { Deps } from '../../../Deps'
import { WorkflowSession } from '../WorkflowSession'

export default depFn(
  {
    entityManager: Deps.entityManagerDep,
    opts: zodDep(
      z.object({
        workflowId: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            input: z.record(z.any()).default({}),
          }),
        ),
      }),
    ),
  },
  async function runWorkflow({ opts, entityManager }) {
    const newSession = await entityManager.create(WorkflowSession, {
      nodes: opts.nodes ?? ([] as any),
      workflow: opts.workflowId,
    })
    await newSession.start({})
    return newSession
  },
)
