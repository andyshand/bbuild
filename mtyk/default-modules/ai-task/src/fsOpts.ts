import fs from 'fs/promises'
import fse from 'fs-extra'
import z from 'zod'

export const fsOpts = {
  object: 'fs',
  actions: [
    {
      name: 'readDir',
      params: [
        {
          name: 'path',
          type: 'string',
        },
      ],
      run: async (params: { path: string }) => {
        const { path } = params
        const dir = await fs.readdir(path)
        return {
          success: true,
          result: dir,
        }
      },
    },
    {
      name: 'exists',
      params: [
        {
          name: 'path',
          type: 'string',
        },
      ],
      run: async (params: { path: string }) => {
        const { path } = params
        const exists = fse.existsSync(path)
        return {
          success: true,
          result: exists,
        }
      },
    },
    {
      name: 'readFile',
      params: [
        {
          name: 'path',
          type: 'string',
        },
        {
          name: 'page',
          type: 'number',
          optional: true,
        },
      ],
      tags: ['read', 'file', 'contents', 'filesystem', 'fs'],
      run: async (params: { path: string; page?: number }) => {
        const { path } = params
        try {
          const result = await fs.readFile(path)
          const str = result.toString()
          const page = params.page ?? 0
          const pageSize = 500
          const returnned = str.slice(page * pageSize, (page + 1) * pageSize)
          return {
            success: true,
            result: returnned,
          }
        } catch (e) {
          console.error(e)
          return {
            success: false,
            result: e.message,
          }
        }
      },
    },
    {
      name: 'writeFile',
      params: [
        {
          name: 'path',
          type: 'string',
        },
        {
          name: 'contents',
          type: 'string',
        },
        {
          name: 'page',
          type: 'number',
          optional: true,
        },
      ],
      tags: ['write', 'file', 'contents', 'filesystem', 'fs'],
      run: async (params: {
        path: string
        page?: number
        contents: string
      }) => {
        const { path, contents } = z
          .object({
            path: z.string(),
            page: z.number().optional(),
            contents: z.string(),
          })
          .parse(params)
        try {
          await fs.writeFile(path, contents)
          return {
            success: true,
            result: contents,
          }
        } catch (e) {
          console.error(e)
          return {
            success: false,
            result: e.message,
          }
        }
      },
    },
  ],
}
