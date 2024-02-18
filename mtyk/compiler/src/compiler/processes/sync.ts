import { prebuild } from "./prebuild";

export default async function sync() {
  await prebuild();
}
