#!/usr/bin/env bash

# Raw API URL for Finicity's OpenAPI YAML file
# Extracted from https://docs.finicity.com/#generate-an-api-client-library
API_RAW_URL=https://raw.githubusercontent.com/Finicity-Mastercard/finicity-openapi/main/finicity.yaml

# SDK directory path, relative to root
PACKAGE_DIR=sdks/finicity

# Path to output directory, relative to scripts
OUTPUT_DIR="../$PACKAGE_DIR"

# OpenAPI Generator package name
# Used for downloading OpenAPI Generator if it is not already installed for the user
OPENAPI_GENERATOR_PACKAGE=@openapitools/openapi-generator-cli

enter_to_exit() {
  # shellcheck disable=SC2162
  read -p "Press [Enter] to exit..."
  exit
}

# Check if the output directory already exists
if [[ -d $OUTPUT_DIR ]]; then
  echo "The directory ${OUTPUT_DIR} already exists."
  read -r -p "Would you like to remove it (y/n)? " SHOULD_REMOVE
  SHOULD_REMOVE=$(echo "$SHOULD_REMOVE" | tr '[:upper:]' '[:lower:]')

  if [[ "$SHOULD_REMOVE" == "y" ]]; then
    rm -rf $OUTPUT_DIR
  else
    enter_to_exit
  fi
fi

# Check if both Node and pnpm are installed
if ! which node >/dev/null || ! which pnpm >/dev/null; then
  echo "Both Node and pnpm must be installed in order to execute this script..."
  enter_to_exit
fi

# Create a new directory and cd into it
mkdir -p $OUTPUT_DIR
cd $OUTPUT_DIR || exit

# Download Finicity API from GitHub
curl -L -o finicity-api.yaml $API_RAW_URL

# Check if OpenAPI Generator is already installed
pnpm list --depth 0 -g | grep -q $OPENAPI_GENERATOR_PACKAGE
IS_OPENAPI_GENERATOR_INSTALLED=$?

# If OpenAPI wasn't previously installed, install it
if [[ "$IS_OPENAPI_GENERATOR_INSTALLED" == 1 ]]; then
  pnpm add -g $OPENAPI_GENERATOR_PACKAGE
fi

# Generate the SDK using OpenAPI Generator
openapi-generator-cli generate -g typescript-axios \
  --additional-properties=npmName=@finicity/node-sdk,withInterfaces=true,withNodeImports=true \
  -i ./*.yaml \
  -o ./

# Remove old SDK, if one was present
cd ../../
pnpm remove @finicity/node-sdk

# Build new SDK
cd $PACKAGE_DIR || exit
pnpm install

# CD back to project root and symlink new SDK
cd ../../
pnpm add "./$PACKAGE_DIR"

# If the script installed OpenAPI Generator, uninstall it
if [[ "$IS_OPENAPI_GENERATOR_INSTALLED" == 1 ]]; then
  pnpm remove -g $OPENAPI_GENERATOR_PACKAGE
fi
