import { ZodType, z } from "zod";
import { keyDep } from "./tokenDep";

export const zodDep = <
  T extends ZodType<any>,
  Optional extends boolean = false,
  Token extends string = string
>(
  schema: T,
  opts: {
    token?: Token;
    optional?: Optional;
  } = {}
) => {
  const dep = keyDep<z.infer<T>, Optional, Token>(opts.token, opts);
  return { ...dep, runtimeType: "zod", schema };
};
