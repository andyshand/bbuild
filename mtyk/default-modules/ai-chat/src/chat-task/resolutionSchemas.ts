import { z } from "zod";

const InstallPackageResolution = z.object({
  type: z.literal("install-package"),
  package: z.string(),
});

const EditFileResolution = z.object({
  type: z.literal("edit-file"),
  edit: z.union([
    z.object({
      path: z.string(),
      content: z.string(),
    }),
    z.object({
      path: z.string(),
      remove: z.string(),
    }),
    z.object({
      path: z.string(),
      add: z.string(),
    })
  ]),
});

const CreateFileResolution = z.object({
  type: z.literal("create-file"),
  file: z.string(),
  content: z.string(),
});

const Resolutions = {
  installPackage: InstallPackageResolution,
  editFile: EditFileResolution,
  createFile: CreateFileResolution,
};

type ResolutionType = {
  [K in keyof typeof Resolutions]: z.infer<typeof Resolutions[K]>;
}[keyof typeof Resolutions];

export default Resolutions;
export const ResolutionArrSchema = z.array(z.union([Resolutions.createFile, Resolutions.editFile, Resolutions.installPackage]));



const EditFileComplete = z.object({
  type: z.literal("edit-file"),
  edit: z.object({
    path: z.string(),
    content: z.string(),
  })
});

export const CompleteResolutions = {
  EditFileComplete,
  InstallPackage: InstallPackageResolution,
}

export const CompleteResolutionArrSchema = z.array(z.union([CompleteResolutions.EditFileComplete, CompleteResolutions.InstallPackage]));

export type CompleteResolutionType = {
  [K in keyof typeof CompleteResolutions]: z.infer<typeof CompleteResolutions[K]>;
}[keyof typeof CompleteResolutions];

export { ResolutionType };
