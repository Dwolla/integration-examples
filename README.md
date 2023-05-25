# Dwolla Integration Examples

This repository contains end-to-end example applications that showcase how Dwolla can integrate with other providers, such as Plaid, to provide automatic funding source verification. 

Each application makes use of the latest technologies by building itself on top of NextJS/React and TypeScript, as well as demonstrating best practices regarding error handling, token management, and more.

## Getting Started

Before getting started, please note that many of our example apps share common dependencies—e.g., ESLint, Prettier, and TypeScript. As such, their configurations are held within the root project, with each app referencing its respective root file. This means that before you can use any of the example apps, you must first run `pnpm install` in the project root directory.

## Example Applications

You can find an exhaustive list of all example apps that this repository contains below.

To get more information on installing and running a specific app, please click on its name, which will redirect you to its respective README.

* [Finicity](https://github.com/Dwolla/integration-examples/tree/main/packages/finicity-token-exchange#readme)
* [Plaid](https://github.com/Dwolla/integration-examples/tree/main/packages/plaid-funding-source#readme)
* [MX](https://github.com/Dwolla/integration-examples/tree/main/packages/mx-token-exchange#readme)
* [Flinks](https://github.com/Dwolla/integration-examples/tree/main/packages/flinks-token-exchange#readme)