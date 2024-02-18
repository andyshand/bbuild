import { ZodAny } from "zod"
import { deserialiseZodSchema, serialiseZodSchema } from "./serialise"

export function setObjectSchema(input: any, { schema, name }: { schema: ZodAny; name: string }) {
	return {
		...input,
		_schema: { schema: serialiseZodSchema(schema), name },
	}
}

export function getObjectSchema(input: any) {
	if (typeof input === "object" && input !== null) {
		if (input._schema) {
			return { schema: deserialiseZodSchema(input._schema.schema), name: input._schema.name }
		}
	}
	return null
}
