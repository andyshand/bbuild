import * as Babel from '@babel/core'

export default function extractImportedNames(sourceCode: string) {
  const importedNames: string[] = []
  const visitor = {
    ImportDeclaration(path: any) {
      const { node } = path
      const { specifiers } = node
      for (const specifier of specifiers) {
        const { imported } = specifier
        if (imported) {
          importedNames.push(imported.name)
        } else if (specifier.local?.name) {
          importedNames.push(specifier.local.name)
        }
      }
    },
  }
  Babel.transformSync(sourceCode, {
    // presets: ['@babel/preset-react'],
    // plugins: ['@babel/plugin-syntax-jsx', { visitor }],
    plugins: [
      ['@babel/plugin-syntax-typescript', { isTSX: true }],
      { visitor },
    ],
  })
  return importedNames
}
