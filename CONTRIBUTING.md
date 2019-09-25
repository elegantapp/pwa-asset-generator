# Contribution Guide

Thank you for considering contribution for `pwa-asset-generator`. Before jumping into code, please go through this guide carefully for a successful contribution.

## Code of conduct

First of all, please read [__Code of Conduct__](https://github.com/onderceylan/pwa-asset-generator/blob/master/CODE_OF_CONDUCT.md) carefully. Once you start contributing, you agree on all terms in code of conduct without any exception.

## Where to start

You can contribute to this project in many aspects. Some are; reporting bugs, submitting feature requests, improving documentation, adding new test scenarios, implementation of bug fixes, implementation of feature requests and etc. A good issue candidate for you to start with, is an issue with `good first issue` or `help wanted` labels. For all other issues, please contact one of the core contributors before working on them to prevent duplicate work.

Please note that if any of the issues has an assignee or is `In Progress` within projects, it means it's assigned to a specific contributor and it's in progress already. You can see the milestones and road map under [projects](https://github.com/onderceylan/pwa-asset-generator/projects) section.

## Code style

* This project uses an opinionated code style via [prettier](https://github.com/prettier/prettier).
* Every time you commit, eslint prettier plugin fixes any formatting issues via git commit hooks to keep the code style consistent across the project. Please do not disable commit hooks while committing.
* To enable commit message linting via git hooks, please run `npm install` before committing any change.

## Commit messages and continuous deployment

This project uses [husky](https://github.com/typicode/husky) w [commitizen](https://github.com/commitizen/cz-cli) and [semantic-release](https://github.com/semantic-release/semantic-release) for conventional changelog and continuous deployment.

When you run `npm install` before introducing any change, all the necessary packages for this workflow will be installed on your local clone. 

You should commit your changes without providing a custom message via `git commit -m` ❌, but instead using `npm run commit` ✅. 
After running `npm run commit`, commitizen CLI will initialize and it will help you through. All you commit messages will be linted by `commitlint` to make sure they're conventional.

Please note that your commit message has a direct impact on the deployment of a new release. When your PR is merged to `master`, any changes in your PR with;

*  commit(s) of type `fix` will trigger a new `patch` release, e.g. +`0.0.1`
*  commit(s) of type `feat` will trigger a new `minor` release, e.g. +`0.1.0`
*  commit(s) with `BREAKING CHANGE` in body or footer of the message will trigger a new `major` release, e.g. +`1.0.0`

You can read more about it on [commitizen](https://github.com/commitizen/cz-cli), [semver](https://semver.org), and [semantic-release](https://github.com/semantic-release/semantic-release).

All other commit types will trigger no new release.

## Working with TypeScript

Project is written with TypeScript language, meaning that an additional compilation step is required.

### Development

You can run TypeScript compiler - tsc in watch mode by executing `npm start`. Once you run `npm start` for the first time, tsc will create compiled JS files in /dist folder and it will watch for all TS files in /src folder, updating corresponding JS files when there's a change. 

To functionally test cli over compiled cli.js code in /dist folder, you can execute the binary located in `bin` folder via your command line. Simply execute `./bin/cli [args]` in your command line to test cli functionality in development. 

### Build

Run `npm run build` to compile TypeScript source to JavaScript. JS files will be created in `/dist` folder and this is the folder being published on npm during automated deployment.

## Testing

* The project uses [jest](https://jestjs.io) for unit and integration testing. 
* Tests run with `npm test` command.
* You can utilize jest's handy [snapshot testing](https://jestjs.io/docs/en/snapshot-testing) feature while testing feature integration specifically, please see [cli.test.ts](https://github.com/onderceylan/pwa-asset-generator/blob/master/src/cli.test.ts) file and [snapshots](https://github.com/onderceylan/pwa-asset-generator/tree/master/src/__snapshots__) folder for examples. 
* You can update the snapshots with `npm run test:update` command when needed.

> Please apply any of your code changes alongside with unit tests. 

## Continuous integration

When you create a PR for this project, it will automatically trigger a new build. You can track the build status within your PR on GitHub. You should make sure that all checks pass.
