export function mergeConfigs(...configs: any[]) {
  return configs.reduce((acc, config) => {
    for (const key in config) {
      if (config[key] !== undefined || acc[key] === undefined) {
        acc[key] = config[key]
      }
    }
    return acc
  }, {})
}
