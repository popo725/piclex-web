# PicLex Web: Windows + Android packaging

This fork packages the **original** Vite/React Web application without replacing its learning modules.
The source remains under its original MIT license; **third-party photographs, movie stills,
songs, voices and decks are not automatically covered by MIT** (see ASSET_LICENSES.md).

## Build outputs

- Windows Setup EXE (NSIS installer)
- Windows Portable EXE (does not require installation)
- Android debug APK (installable for testing; not a signed production release)

Files are built from the repository itself by GitHub Actions. Find them at the
**Actions -> Build PicLex desktop and Android -> workflow run -> Artifacts** page.
Artifacts are ZIP downloads containing the EXE or APK. A green workflow alone does
not establish that microphone, camera, offline media or backups have been tested on
real devices; perform the manual smoke tests below.

## What is bundled

The workflow performs `npm ci`, `npm run content:build`, and `npm run build`.
It places the generated `dist/` into both the Windows installation and APK.
Static content can be read offline once the package is installed; automatic AI
card generation, third-party subscriptions, remote voices and WebDAV require network
access, correct credentials and compatible CORS/server policies.

Windows serves its bundled files through an ephemeral **127.0.0.1** HTTP endpoint
to preserve a trustworthy browser origin, camera/microphone permission handling and
browser storage. This server is only accessible on the local computer, and is shut
down when the app closes. Android uses AndroidX WebViewAssetLoader for an internal
**https://appassets.androidplatform.net/piclex-web/** origin; no external website
is loaded for the initial application shell.

## Windows local build

1. Install Node.js 24 (or another compatible Node >=22.12).
2. At repository root: `npm ci && npm run content:build && npm run build`.
3. In `desktop/`: `npm install`, then `npm run build:win` on Windows.
4. Find EXEs under `desktop/release/`.

The EXE is unsigned; Windows SmartScreen may warn about an unknown publisher.
Do not bypass warnings for packages downloaded from untrusted sources.

## Android local build

1. Install JDK 17, Android SDK platform 35/build-tools, and Gradle 8.11.1.
2. Build Web assets as above.
3. Copy the **contents** of `dist/` into `android/app/src/main/assets/`.
4. Run `gradle -p android :app:assembleDebug`.
5. Find APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

Debug APKs are signed using each builder's debug key. Different CI runs may use
different keys, so **do not uninstall or overwrite the app without exporting study
data first**. To ship commercial updates, configure a persistent private signing
key and a release signing pipeline; do not commit a keystore to Git.

## Mandatory checks before public release

1. Windows installer starts and opens original learning, settings and game screens.
2. Windows portable version starts, saves progress, restarts without losing it.
3. Android can open lessons, type, hear audio, record microphone and use the camera
   after permissions are granted; test real OPPO and other devices.
4. Android's file chooser can import .piclexdeck and JPEG/PNG.
5. Test photo/video export and backup/restore. **Android WebView blob downloads,
   OPFS capacity, large ZIP backups and WebDAV CORS are not guaranteed by this
   first packaging adapter and may need dedicated native integration.**
6. Verify links, external APIs, exact media rights and offline versus online behavior.
7. Configure a privacy notice explaining the AI photo-upload service and API-key
   handling. Self-provided model API keys currently live in browser storage without
   encryption as noted by the upstream project.

## Limitations

- Windows target: x64, installer and portable EXE. Not yet built for ARM64 or Mac.
- Android: testing APK, not Play Store signed AAB or production release.
- iPhone: upstream provides its own native App Store app, not generated here.
- Installation packages are **not** yet code-signed for public commercial release.
- Project routes remain rooted at `/piclex-web/`; changing Vite's base without also
  updating game boot-manifest and internal asset routes will break the packaged app.
