# bbuild 

bbuild is a CLI tool for compiling, running and building Typescript projects. 

The primary purpose of the tool is to provide a unified way to run all of our projects, without having to learn individual setup for each.

Easily running a project also has benefits for AI, where AI will be able to run arbritrary projects and make changes, monitoring for errors using our logging pipelines etc...

### 1. Compile the CLI

```bash
cd mtyk/compiler
pnpm i 
pnpm run watch # or just build
```

### 2. Setup global bash/zsh alias, eg:
```bash
function bbuild() {
 node --experimental-specifier-resolution=node /Users/andrewshand/Documents/Github/build-2/mtyk/compiler/dist/esm/compiler/index.js "$@"
}
```

### 3. Add ~/.config/universe.yml file
```yml
# Location of your global node binary
nodeBinPath: /Users/andrewshand/.nvm/versions/node/v18.16.1/bin
```

### 4. Test via test-project 🤞
```bash
cd test-project
bbuild dev
```

Expect it to be ugly af, just a barebones test modules are being symlinked/compiled etc.