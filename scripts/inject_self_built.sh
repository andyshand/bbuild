#!/bin/bash

# Jump into test-project
cd test-project

# Build modules
node --experimental-specifier-resolution=node ../mtyk/compiler/dist/esm/compiler/index.js build

# Jump out of test-project, create self-built directory and copy built modules
mkdir -p ../self-built
cd ../self-built
cp -rf ../test-project/built-modules/* .