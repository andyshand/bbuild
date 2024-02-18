#!/usr/bin/env node
import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const __dirname = require("path")
  .dirname(import.meta.url)
  .replace("file://", "");

const compiler = path.join(__dirname, "../dist/esm/compiler/index.js");
const passedArgs = process.argv.slice(2);
const args = `--experimental-specifier-resolution=node ${compiler} ${passedArgs.join(
  " "
)}`;

spawn("node", args.split(" "), { stdio: "inherit" });
