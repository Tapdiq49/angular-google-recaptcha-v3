# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2026-06-22

### Fixed
- **Publishing**: Fixed an NPM Provenance signature error (`Missing SourceRepositoryRef`) by updating the `repository` URL format to use the `git+https` protocol and `.git` extension.

## [1.0.7] - 2026-06-22

### Added
- **Detailed Error Handling**: Introduced explicit typed error classes (`RecaptchaLoadError`, `RecaptchaConfigurationError`, `RecaptchaExecuteError`) extending a base `RecaptchaError` class for fine-grained catch blocks.
- **Playground Error Tester**: Added an "Error Handling" interactive tab to the demo playground, demonstrating how to simulate and catch custom Google reCAPTCHA errors.

### Changed
- **Error Propagation**: Modified `RecaptchaLoaderService` and `RecaptchaV3Service` to throw specific custom error instances instead of generic `Error` instances, retaining original messages but classifying the root cause reliably.

## [1.0.6] - 2026-06-18

### Added
- **Playground**: Implemented a structured SCSS architecture (`_variables.scss`, `_mixins.scss`) for the demo application, extracting and organizing legacy inline HTML styles.
- **Type Safety**: Introduced explicit ambient interfaces (`WindowWithRecaptcha`, `WindowWithGrecaptcha`) to fully eliminate the use of `any` across the core services (`loader.service.ts`, `recaptcha-v3.service.ts`).

### Changed
- **Testing Setup**: Upgraded unit test bootstrapping to use modern Angular `BrowserTestingModule` and `platformBrowserTesting()`, migrating away from the deprecated `platform-browser-dynamic/testing` module.
- **TypeScript Config**: Updated `tsconfig.json` paths mapping to use explicit relative paths (`./`) resolving TypeScript 6.0+ deprecations where `baseUrl` is no longer supported.
- **Styles**: Modernized SCSS mixins to resolve Dart Sass 3.0.0 deprecation warnings by replacing legacy `rgba(red(...))` functions with modern `color.change()` from `sass:color`.
- **Error Handling**: Improved error catching mechanisms in RxJS streams and async Promises to properly type-check `unknown` objects using `instanceof Error` instead of casting to `any`.

### Removed
- **Legacy Configs**: Removed `baseUrl`, `downlevelIteration`, and `ignoreDeprecations: "6.0"` from `tsconfig.json` to enforce strict TS 6.0 standards.
