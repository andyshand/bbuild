process.env.ONE_CONFIG_SILENT = 'true'
import * as config from '..'

const showSecrets = process.argv.includes('--show-secrets')

export default function populateEnv() {
  const entire = config._getEntireConfig()
  let bashScript = ``

  function isValueSecretIsh(value, key) {
    const secretishKeys = ['password', 'secret', 'token', 'key']
    const lowercaseKey = key.toLowerCase()
    const jwtRegex = /^eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*$/
    const valueLooksLikeSecret = jwtRegex.test(value)
    return (
      secretishKeys.some((secretishKey) =>
        lowercaseKey.includes(secretishKey)
      ) || valueLooksLikeSecret
    )
  }
  const longestKeyLength = Object.keys(entire).reduce(
    (longest, key) => Math.max(longest, key.length),
    0
  )
  for (const key of Object.keys(entire).sort((a, b) => a.localeCompare(b))) {
    const outputvalue =
      isValueSecretIsh(entire[key], key) && !showSecrets
        ? '********'
        : entire[key]
    const spacing = ' '.repeat(longestKeyLength - key.length)
    bashScript += `${key}="${entire[key]}";echo \"${key}: ${spacing}${outputvalue}\";\n`
  }

  process.stdout.write(bashScript)
}

populateEnv()
