# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [2.0.1] - 2026-11-11

### Changed

- Only pages on `wall.moonetix.com` stay inside the offerwall screen. Every other host opens outside the app.
- The top bar logo loads only from `moonetix.com` and `wall.moonetix.com`.
- Neutral source paths in the binary and its debug symbols.
- Swift Package Manager `from: "2.0.1"`, CocoaPods from `https://moonetix.com/ios/2.0.1/MoonetixOfferwall.podspec`.
- `MoonetixOfferwall-2.0.1.xcframework.zip` has the SHA-256 `03cd07f6d72c2e30722bcc950286207c3dfd494c39a9a6546389f87cb8da42fd`.

## [2.0.0] - 2026-11-06

### Changed

- First release under the Moonetix name. The previous package stays published and keeps working.
- Module `MoonetixOfferwall`, class `Moonetix`. Swift Package Manager from `https://moonetix.com/ios/moonetix-ios.git`, CocoaPods from `https://moonetix.com/ios/2.0.0/MoonetixOfferwall.podspec`.
- `MoonetixOfferwall-2.0.0.xcframework.zip` has the SHA-256 `d7d359a9fee6d44e96377e5669cc1146ac229d039b98e9ea9b6ff8d0d76ca6a0`.
- Accessibility identifiers `moonetix.close` and `moonetix.title` for UI tests.
- The offerwall opens on `wall.moonetix.com`.

### Added

- `token-endpoint/`: the session token endpoint for every Moonetix SDK, in Node.js with tests and in PHP.
- `Sample/MoonetixSample/`: a minimal SwiftUI sample.
