// import prompts from 'prompts';
import { ActionT } from './ActionT';

export const message = {
  object: 'message',
  actions: [
    {
      name: 'send',
      params: [
        {
          name: 'success',
          type: 'boolean',
          optional: true,
        },
        {
          name: 'message',
          type: 'string',
        },
      ],
      run: async (params: { success: boolean; message: string }) => {
        const { success, message } = params
        // const response = await prompts({
        //   type: 'text',
        //   name: 'value',
        //   message: `success?: ${success} ${message}`,
        // })
        return {
          success: false,
          result: false,
        }
      },
    },
  ],
} as ActionT
