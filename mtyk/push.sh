#!/bin/bash

# Docker image details
imagename="bbuild"

DOCKER_USERNAME="andrewshand94"

# Read the current version number
version=$(cat version.txt)

# Increment the version number
version=$((version + 1))

# Write the new version number back to the file
echo $version > version.txt

if [[ -z "$LOCAL_ONLY" ]]; then
    # Push the Docker image to Docker Hub
    docker build -t "$DOCKER_USERNAME"/"$imagename":"$version" -t "$DOCKER_USERNAME"/"$imagename":latest -t "$imagename":latest .
    docker push "$DOCKER_USERNAME"/"$imagename":"$version"
    docker push "$DOCKER_USERNAME"/"$imagename":"latest"
else
    docker build -t "$imagename":latest .
fi