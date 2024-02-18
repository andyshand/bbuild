#!/bin/bash

# To be run upon container startup
echo "Running MTYK container initialisation..."

echo "Defining bbuild command..."
function bbuild() {
    node --experimental-specifier-resolution=node /mtyk/compiler/dist/esm/compiler/index.js "$@"
}


echo "Creating /root/.config/universe.yml"

# Define the YAML content
yaml_content=$(cat <<EOF
repositories:
  - /mtyk/default-modules
nodeBinPath: /usr/local/bin/node
EOF
)

# For all modules in default-modules, copy content into /mtyk/app/modules
# If the folder already exists, don't do anything, but show a warning message "This module already exists"
for module in /mtyk/default-modules/*; do
    module_name=$(basename $module)

    if [ -d "/mtyk/app/modules/$module_name" ]; then # If the module already exists
        echo "Module $module_name already exists, skipping..."
        continue
    else
        echo "Copying $module to /mtyk/app/modules/$module_name"
        mkdir -p /mtyk/app/modules/$module_name
        cp -r $module /mtyk/app/modules
    fi
done

# Give permissions to all users
chmod -R 777 /mtyk/app
chmod g+s /mtyk/app

# Create the directory if it doesn't exist
mkdir -p /root/.config

# Echo the YAML content and save it to universe.yml
echo "$yaml_content" > /root/.config/universe.yml

echo "Changing directory to /mtyk/app"
cd /mtyk/app

echo "Running bbuild dev"
bbuild dev

