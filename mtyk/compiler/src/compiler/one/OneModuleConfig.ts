import { z } from "zod";

const pluginSchema = z.object({
  name: z.string(),
  options: z.unknown().optional(),
});

const nextPlatformSchema = z.object({
  config: z.string().optional(),
});

const OneModuleConfigSchema = z.object({
  clientImports: z.array(z.string()),
  serverImports: z.array(z.string()),
  plugins: z.array(pluginSchema).optional(),
  platforms: z
    .object({
      next: nextPlatformSchema.optional(),
    })
    .optional(),
});

export { OneModuleConfigSchema };

export type OneModuleConfig = z.infer<typeof OneModuleConfigSchema>;
