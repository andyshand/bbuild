import { z } from "zod"

const LocationPathSchema = z.object({
	path: z.string(),
	fullPath: z.string().optional(),
})

const LocationSchema = LocationPathSchema
const ContentsSchema = z.union([z.string(), z.number()])

const EditFileSchema = z.object({
	type: z.literal("edit-file"),
	location: LocationSchema,
	contents: ContentsSchema,
})

const CreateFileSchema = z.object({
	type: z.literal("create-file"),
	location: LocationSchema,
	contents: ContentsSchema,
})

const DirectorySchema = z.object({
	path: z.string(),
	children: z.array(z.union([z.lazy(() => DirectorySchema), z.string()])),
})

const FileTreeSchema = z.record(z.union([z.lazy(() => FileTreeSchema), z.null()]))

const CreateFilesSchema = z.object({
	type: z.literal("create-files"),
	tree: FileTreeSchema,
	location: LocationSchema.optional(),
})

const InstallPackageSchema = z.object({
	type: z.literal("install-package"),
	package: z.string(),
	args: z.array(z.string()).optional(),
})

const UninstallPackageSchema = z.object({
	type: z.literal("uninstall-package"),
	package: z.string(),
})

const EvalCodeSchema = z.object({
	type: z.literal("eval-code"),
	language: z.string(),
	version: z.string(),
	code: z.string(),
})

const UpdateCreationSchema = z.object({
	type: z.literal("update-creation"),
	creationId: z.string(),
	prompt: z.string(),
})

const FindRelatedFiles = z.object({
	type: z.literal("find-related-files"),
	path: z.string(),
})

const RunCommandSchema = z.object({
	type: z.literal("run-command"),
	command: z.string(),
	cwd: z.string().optional(),
	env: z.record(z.string()).optional(),
})

const ActionSchema = z.union([
	EditFileSchema,
	CreateFileSchema,
	CreateFilesSchema,
	InstallPackageSchema,
	UninstallPackageSchema,
	EvalCodeSchema,
	UpdateCreationSchema,
	RunCommandSchema,
	FindRelatedFiles,
])

export {
	LocationSchema,
	ContentsSchema,
	EditFileSchema,
	CreateFileSchema,
	DirectorySchema,
	FileTreeSchema,
	CreateFilesSchema,
	InstallPackageSchema,
	UninstallPackageSchema,
	EvalCodeSchema,
	UpdateCreationSchema,
	RunCommandSchema,
	ActionSchema,
	FindRelatedFiles,
}

export type Location = z.infer<typeof LocationSchema>
export type Contents = z.infer<typeof ContentsSchema>
export type EditFile = z.infer<typeof EditFileSchema>
export type CreateFile = z.infer<typeof CreateFileSchema>
export type Directory = z.infer<typeof DirectorySchema>
export type FileTree = z.infer<typeof FileTreeSchema>
export type CreateFiles = z.infer<typeof CreateFilesSchema>
export type InstallPackage = z.infer<typeof InstallPackageSchema>
export type UninstallPackage = z.infer<typeof UninstallPackageSchema>
export type EvalCode = z.infer<typeof EvalCodeSchema>
export type UpdateCreation = z.infer<typeof UpdateCreationSchema>
export type RunCommand = z.infer<typeof RunCommandSchema>
export type FindRelatedFiles = z.infer<typeof FindRelatedFiles>
export type Action = z.infer<typeof ActionSchema>
