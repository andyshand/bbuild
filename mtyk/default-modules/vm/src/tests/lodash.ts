import { run } from '../run'

export default function testLodashTransformations() {
  return run({
    type: 'node',
    packages: [{ name: 'lodash' }],
    files: {
      type: 'directory',
      name: '/',
      files: [
        // Create an index.js that uses lodash for various transformations
        {
          type: 'file',
          name: 'index.js',
          content: `
            const _ = require('lodash')
            const array = [1, 2, 3, 4, 5]
            const doubled = _.map(array, num => num * 2)
            const filtered = _.filter(doubled, num => num > 5)
            const sum = _.reduce(filtered, (total, num) => total + num, 0)
            console.log(sum)
          `,
        },
      ],
    },
  })
}
