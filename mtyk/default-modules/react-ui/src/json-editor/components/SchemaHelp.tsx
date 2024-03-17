export function SchemaHelp({ schema }: { schema: any }) {
  const description = schema._def?.description
  if (!description) return null

  return null // TODO
}
