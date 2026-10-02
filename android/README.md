# BharatTV Live - Indian TV Streamer (Android Jetpack Compose)

A modern, native Android application built with **Kotlin**, **Jetpack Compose (Material 3)**, and **AndroidX Media3 (ExoPlayer)** that streams free, live Indian television channels directly from open-source IPTV-org playlists.

## Features
- **IPTV-org Integration**: Automatically fetches and parses M3U playlists:
  - All India: `https://iptv-org.gitlab.io/iptv/countries/in.m3u`
  - Hindi channels: `https://iptv-org.gitlab.io/iptv/languages/hin.m3u`
- **M3U Parser**: Robust regex-based streaming parser extracting channel names, logos (`tvg-logo`), groups, languages, and `.m3u8` stream URLs.
- **AndroidX Media3 ExoPlayer**: Native HLS (`.m3u8`) streaming with custom playback controls, buffering state, live badge, aspect ratio zoom/fit toggle, and error recovery.
- **Jetpack Compose UI**:
  - `LazyVerticalGrid` responsive adaptive card grid.
  - Live Search bar with instant channel name filtering.
  - Horizontal filter chips for channel categories (News, Entertainment, Music, Devotional, etc.) and Favorites.
  - Native Material 3 Dark Mode & dynamic theming support.
  - Dedicated Player Screen with standard controls, full-screen toggle, and back button.
  - Picture-in-Picture (PiP) support when leaving the app.
- **MVVM Architecture**: `ChannelViewModel` with Kotlin Coroutines and `StateFlow` preserving state across device orientation changes.

## Prerequisites & Building
1. Open this `android/` directory in **Android Studio Hedgehog (2023.1.1) or newer**.
2. Ensure JDK 17 is selected in **Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK**.
3. Sync Gradle and click **Run** (or `Shift + F10`) to deploy to an Android phone, tablet, or Android TV emulator (API 24+).

### Command Line Build
```bash
# Build Debug APK
./gradlew assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
```
