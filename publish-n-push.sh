#!/bin/bash

cd ./installer
echo "Building @mtyk/bbuild..."
pnpm run build

echo "Bumping @mtyk/bbuild version..."
npm version patch

if [ -z "$LOCAL_ONLY" ]
then
echo "Publishing @mtyk/bbuild to npm..."
npm publish --access public
fi

echo "Pushing bbuild:latest to Dockerhub"
cd ../mtyk
./push.sh

#Check if TEST env var present
if [ -z "$TEST" ]
then
    echo "Done?"
else
    echo "TEST env var present, running test-project"
    cd ../test-project
    rm -rf modules
    node ../installer/dist/index.js
fi