# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](https://github.com/onderceylan/pwa-asset-generator/compare/v1.3.1...v2.0.0) (2019-10-25)


### Bug Fixes

* **browser:** added error handling for chrome-launcher ([c6ed23a](https://github.com/onderceylan/pwa-asset-generator/commit/c6ed23a06e6e9cdbeeb8aba4837fa28f138c7bee)), closes [#50](https://github.com/onderceylan/pwa-asset-generator/issues/50)
* **package:** suppressed security warning by changing pkg v strategy ([9987e39](https://github.com/onderceylan/pwa-asset-generator/commit/9987e395888260e245c06a5f1c1f2d7a736854d5)), closes [#53](https://github.com/onderceylan/pwa-asset-generator/issues/53)


### Features

* **file:** avoided saving a shell html file ([b96d545](https://github.com/onderceylan/pwa-asset-generator/commit/b96d5453cbcaa950f21864f3b1cd494726f3cbc9)), closes [#52](https://github.com/onderceylan/pwa-asset-generator/issues/52)
* **icon:** added optional favicon generation ([699686a](https://github.com/onderceylan/pwa-asset-generator/commit/699686a39df2502a8ebd18ecc4d8b6b96a199196)), closes [#47](https://github.com/onderceylan/pwa-asset-generator/issues/47)
* **main:** added dark mode support for iOS ([f4aca1c](https://github.com/onderceylan/pwa-asset-generator/commit/f4aca1c3ec9768596b97e405485b2c446e89c40d)), closes [#51](https://github.com/onderceylan/pwa-asset-generator/issues/51)
* **pptr:** switched over puppeteer-core to avoid chromium install ([05edb2e](https://github.com/onderceylan/pwa-asset-generator/commit/05edb2ee19c68b700963c513766c10deff11334c)), closes [#50](https://github.com/onderceylan/pwa-asset-generator/issues/50)
* **pwa:** added single quotes option for generated HTML tags ([351a3cc](https://github.com/onderceylan/pwa-asset-generator/commit/351a3cc92d292d9ec5215fae1d120933e4357808)), closes [#49](https://github.com/onderceylan/pwa-asset-generator/issues/49)


### BREAKING CHANGES

* **main:** generateImages method from the module API now returns HTMLMeta object with the
chunks of HTML content, instead of one big HTML string

## [1.3.1](https://github.com/onderceylan/pwa-asset-generator/compare/v1.3.0...v1.3.1) (2019-09-26)


### Bug Fixes

* **file:** fixed relative path to input file that is not resolving ([19cc7c4](https://github.com/onderceylan/pwa-asset-generator/commit/19cc7c4)), closes [#45](https://github.com/onderceylan/pwa-asset-generator/issues/45)

# [1.3.0](https://github.com/onderceylan/pwa-asset-generator/compare/v1.2.0...v1.3.0) (2019-09-25)


### Features

* **core:** migrated to TypeScript and reduced node dep to 6.4.0 ([cfc1657](https://github.com/onderceylan/pwa-asset-generator/commit/cfc1657)), closes [#6](https://github.com/onderceylan/pwa-asset-generator/issues/6)

# [1.2.0](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.7...v1.2.0) (2019-09-12)


### Features

* **main:** added option to provide path prefix to generated href links ([268c671](https://github.com/onderceylan/pwa-asset-generator/commit/268c671)), closes [#31](https://github.com/onderceylan/pwa-asset-generator/issues/31)
* **main:** added option to provide path prefix to generated href links ([1e18466](https://github.com/onderceylan/pwa-asset-generator/commit/1e18466)), closes [#31](https://github.com/onderceylan/pwa-asset-generator/issues/31)
* **main:** exposed private API via main.js ([afce4af](https://github.com/onderceylan/pwa-asset-generator/commit/afce4af)), closes [#5](https://github.com/onderceylan/pwa-asset-generator/issues/5)
* **main:** exposed private API via main.js ([d3367ad](https://github.com/onderceylan/pwa-asset-generator/commit/d3367ad)), closes [#5](https://github.com/onderceylan/pwa-asset-generator/issues/5)
* **main:** refactored main and added index.d.ts ([72a7fe4](https://github.com/onderceylan/pwa-asset-generator/commit/72a7fe4)), closes [#5](https://github.com/onderceylan/pwa-asset-generator/issues/5)
* **main:** refactored main and added index.d.ts ([1ab1c3e](https://github.com/onderceylan/pwa-asset-generator/commit/1ab1c3e)), closes [#5](https://github.com/onderceylan/pwa-asset-generator/issues/5)

## [1.1.7](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.6...v1.1.7) (2019-08-30)


### Bug Fixes

* **file.js, pwa.js, package.json:** fix Windows backslash paths being added to icon and html content ([24fef99](https://github.com/onderceylan/pwa-asset-generator/commit/24fef99)), closes [#36](https://github.com/onderceylan/pwa-asset-generator/issues/36)

## [1.1.6](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.5...v1.1.6) (2019-08-29)


### Bug Fixes

* **cli:** add icon code output for ios icons ([c768fb6](https://github.com/onderceylan/pwa-asset-generator/commit/c768fb6)), closes [#26](https://github.com/onderceylan/pwa-asset-generator/issues/26)
* **puppets:** increased timeout for generating images ([3191560](https://github.com/onderceylan/pwa-asset-generator/commit/3191560)), closes [#28](https://github.com/onderceylan/pwa-asset-generator/issues/28)

## [1.1.5](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.4...v1.1.5) (2019-08-22)


### Bug Fixes

* **cli:** calculated relative path of generated content to the reference output file ([b76e9d2](https://github.com/onderceylan/pwa-asset-generator/commit/b76e9d2)), closes [#21](https://github.com/onderceylan/pwa-asset-generator/issues/21)
* **cli:** use relative path when output is not provided ([ec991ec](https://github.com/onderceylan/pwa-asset-generator/commit/ec991ec)), closes [#20](https://github.com/onderceylan/pwa-asset-generator/issues/20)

## [1.1.4](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.3...v1.1.4) (2019-08-19)


### Bug Fixes

* **cli:** fixed wrong url on help text ([6cc6e22](https://github.com/onderceylan/pwa-asset-generator/commit/6cc6e22)), closes [#11](https://github.com/onderceylan/pwa-asset-generator/issues/11)
* fixed iPad 12.9" specs being stripped out and added orientation key to the media queries ([59a891a](https://github.com/onderceylan/pwa-asset-generator/commit/59a891a)), closes [#18](https://github.com/onderceylan/pwa-asset-generator/issues/18)
* **puppets:** fixed the check where scraping result is evaluated ([b584be0](https://github.com/onderceylan/pwa-asset-generator/commit/b584be0))

## [1.1.3](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.2...v1.1.3) (2019-08-18)


### Bug Fixes

* **cli:** fixed wrong url on help text ([03775bf](https://github.com/onderceylan/pwa-asset-generator/commit/03775bf)), closes [#11](https://github.com/onderceylan/pwa-asset-generator/issues/11)

## [1.1.2](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.1...v1.1.2) (2019-08-16)


### Bug Fixes

* **readme:** fixed wrong link on examples ([35152f3](https://github.com/onderceylan/pwa-asset-generator/commit/35152f3))

## [1.1.1](https://github.com/onderceylan/pwa-asset-generator/compare/v1.1.0...v1.1.1) (2019-08-16)


### Bug Fixes

* **readme:** fixed broken link on readme ([5d6e0b4](https://github.com/onderceylan/pwa-asset-generator/commit/5d6e0b4))

# [1.1.0](https://github.com/onderceylan/pwa-asset-generator/compare/v1.0.2...v1.1.0) (2019-08-15)


### Features

* **cli:** added --portrait-only and --landscape-only flags ([1fb1ecb](https://github.com/onderceylan/pwa-asset-generator/commit/1fb1ecb)), closes [#4](https://github.com/onderceylan/pwa-asset-generator/issues/4)
* **cli:** added --splash-only and --icon-only flags ([20f39e0](https://github.com/onderceylan/pwa-asset-generator/commit/20f39e0)), closes [#3](https://github.com/onderceylan/pwa-asset-generator/issues/3)
* **cli:** added --type and --quality flags ([c0c1565](https://github.com/onderceylan/pwa-asset-generator/commit/c0c1565)), closes [#2](https://github.com/onderceylan/pwa-asset-generator/issues/2)
* **cli:** create output folder if it doesn't exist ([4eebf34](https://github.com/onderceylan/pwa-asset-generator/commit/4eebf34)), closes [#9](https://github.com/onderceylan/pwa-asset-generator/issues/9)

## [1.0.2](https://github.com/onderceylan/pwa-asset-generator/compare/v1.0.1...v1.0.2) (2019-08-14)


### Bug Fixes

* **npm:** ignored static files to keep the tarball clean ([6de2a39](https://github.com/onderceylan/pwa-asset-generator/commit/6de2a39))

## [1.0.1](https://github.com/onderceylan/pwa-asset-generator/compare/v1.0.0...v1.0.1) (2019-08-14)


### Bug Fixes

* **cli:** fixed the issue when output is not provided ([b7102e7](https://github.com/onderceylan/pwa-asset-generator/commit/b7102e7)), closes [#1](https://github.com/onderceylan/pwa-asset-generator/issues/1)
