const json = (message: string): any | null => {
  try {
    // Remove any leading trailing spaces, backticks and language specifier for markdown

    let claned = message
    const regex = /```[a-z]*/g
    // const regex = /`{1,3}[a-z]*/g
    while (claned.split(regex).length > 3) {
      // only keep the last code block
      claned = claned.split(regex).slice(1).join('`').trim()
    }
    if (claned.split(/```/).length > 1) {
      claned = claned.split(regex)[1].trim().replace(regex, '').trim()
    }

    return JSON.parse(
      claned
        .replace(/^`{1,3}/, '')
        .replace(/`{1,3}$/, '')
        .trim()
    )
  } catch (e) {
    console.error(e, message)
  }

  return null
}
const code = (message: string): any | null => {
  try {
    // Remove any leading trailing spaces, backticks and language specifier for markdown

    let claned = message
    const regex = /```[a-z]*/g
    // const regex = /`{1,3}[a-z]*/g
    while (claned.split(regex).length > 3) {
      // only keep the last code block
      claned = claned.split(regex).slice(1).join('`').trim()
    }
    if (claned.split(/```/).length > 1) {
      claned = claned.split(regex)[1].trim().replace(regex, '').trim()
    }

    return claned
    // return JSON.parse(claned)
  } catch (e) {
    console.error(e, message)
  }

  return null
}

export const ParseMessage = {
  json,
  code,
}
