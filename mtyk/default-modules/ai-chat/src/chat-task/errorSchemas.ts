import { z } from "zod";

const ErrorBase = z.object({
  file: z.string().optional(),
  line: z.number().optional(),
  message: z.string(),
  stackTrace: z.string().optional(),
});

// Schema for missingPackage error
const MissingPackageError = ErrorBase.extend({
  packageName: z.string(),
}).transform(data => ({ ...data, type: "missing-package" }));

// Schema for typeError
const TypeError = ErrorBase.transform(data => ({ ...data, type: "type-error" }));

// Schema for runtimeError
const RunTimeError = ErrorBase.transform(data => ({ ...data, type: "runtime-error" }));

// Schema for expoMetroError
const ExpoMetroError = ErrorBase.transform(data => ({ ...data, type: "expo-metro-error" }));

// Schema for importResolutionError
const ImportResolutionError = ErrorBase.transform(data => ({ ...data, type: "import-resolution-error" }));

// Schema for undeclaredVariable
const UndeclaredVariable = ErrorBase.transform(data => ({ ...data, type: "undeclared-variable" }));

// Schema for other errors
const OtherError = ErrorBase.transform(data => ({ ...data, type: "other" }));

// Schema for the Errors object
const Errors = z.object({
  'missing-package': z.array(MissingPackageError).optional(),
  'type-error': z.array(TypeError).optional(),
  'runtime-error': z.array(RunTimeError).optional(),
  'expo-metro-error': z.array(ExpoMetroError).optional(),
  'import-resolution-error': z.array(ImportResolutionError).optional(),
  'undeclared-variable': z.array(UndeclaredVariable).optional(),
  'other': z.array(OtherError).optional(),
});

export type ErrorsType = z.infer<typeof Errors>;
export type TypedErrorValue = Array<ErrorsType[keyof ErrorsType]>[number] & {
  type: keyof ErrorsType;
}

export const AllErrorSchemas = z.union([MissingPackageError, TypeError, RunTimeError, ExpoMetroError, ImportResolutionError, UndeclaredVariable, OtherError]);

export default Errors;