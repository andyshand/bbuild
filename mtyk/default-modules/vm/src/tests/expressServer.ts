import { run } from '../run'

export default function testExpressServer() {
  const port = 3000
  return run({
    type: 'node',
    packages: [{ name: 'express' }],
    files: {
      type: 'directory',
      name: '/',
      files: [
        // Create an index.js with a simple express server
        {
          type: 'file',
          name: 'index.js',
          content: `
            const express = require('express')
            const app = express()
            const port = ${port}

            app.get('/', (req, res) => {
              res.send('Hello World!')
            })

            app.listen(port, () => {
              console.log(\`Server is running at http://localhost:${port}\`)
            })
          `,
        },
      ],
    },
  })
}
