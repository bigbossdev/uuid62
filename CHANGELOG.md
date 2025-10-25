# Changelog

## [1.1.2]

- Improved CI/CD workflow and yarn consistency
- Updated package.json scripts and dependencies

## [1.1.1]

- Updated README.md examples to use consistent UUID/Base62 values that match actual encoding/decoding results

## [1.1.0]

- Base62 character set order changed from `0-9A-Za-z` to `0-9a-zA-Z` (lowercase before uppercase)
- `encode()` function now returns fixed 22-character strings with zero-padding

## [1.0.0] - REMOVED

**Note**: This version has been removed from the NPM registry.

- Initial release
- UUID to Base62 encoding/decoding
- TypeScript support
- Zero dependencies
- Node.js 16+ only