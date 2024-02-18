#!/bin/bash

output=$(node ./cli/populateEnv.js)
echo $output
eval $output
