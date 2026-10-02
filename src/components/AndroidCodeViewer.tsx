import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AndroidFile {
  name: string;
  path: string;
  category: string;
  code: string;
}

const ANDROID_FILES: AndroidFile[] = [
  {
    name: 'HomeScreen.kt',
    path: 'app/src/main/java/com/indiantv/live/ui/screens/HomeScreen.kt',
    category: 'Home Page & Featured Carousels',
    code: `package com.indiantv.live.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.indiantv.live.data.model.Channel
import com.indiantv.live.ui.theme.SaffronPrimary
import com.indiantv.live.ui.viewmodel.ChannelViewModel

@Composable
fun HomeScreen(
    viewModel: ChannelViewModel,
    onChannelClick: (Channel) -> Unit,
    onNavigateToCategory: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Featured Hero Broadcast
        item {
            FeaturedHeroBanner(channel = featuredChannel, onWatchClick = { onChannelClick(featuredChannel) })
        }

        // Quick Category Cards (News, Music, Favorites)
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CategoryQuickCard("News", Icons.Default.Newspaper) { onNavigateToCategory("News") }
                CategoryQuickCard("Music", Icons.Default.MusicNote) { onNavigateToCategory("Music") }
                CategoryQuickCard("Favorites", Icons.Default.Star) { onNavigateToCategory("Favorites") }
            }
        }

        // Curated News & Music Channels Horizontal Carousels
        item {
            ChannelHorizontalRow(title = "Live News & Current Affairs", channels = newsList, onChannelClick)
        }
        item {
            ChannelHorizontalRow(title = "Music & Entertainment Hits", channels = musicList, onChannelClick)
        }
    }
}`,
  },
  {
    name: 'PlayerScreen.kt',
    path: 'app/src/main/java/com/indiantv/live/ui/screens/PlayerScreen.kt',
    category: 'Jetpack Compose UI & Media3 ExoPlayer',
    code: `package com.indiantv.live.ui.screens

import android.app.Activity
import android.content.pm.ActivityInfo
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.indiantv.live.data.model.Channel
import com.indiantv.live.ui.theme.AccentLiveRed
import com.indiantv.live.ui.theme.SaffronPrimary

@OptIn(UnstableApi::class)
@Composable
fun PlayerScreen(
    channel: Channel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity

    var isPlaying by remember { mutableStateOf(true) }
    var isBuffering by remember { mutableStateOf(true) }
    var playbackError by remember { mutableStateOf<String?>(null) }
    var isFullscreen by remember { mutableStateOf(false) }
    var areControlsVisible by remember { mutableStateOf(true) }
    var resizeMode by remember { mutableStateOf(AspectRatioFrameLayout.RESIZE_MODE_FIT) }

    // AndroidX Media3 ExoPlayer instance for HLS (.m3u8) video streaming
    val exoPlayer = remember(channel.url) {
        ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.Builder()
                .setUri(Uri.parse(channel.url))
                .setMimeType(MimeTypes.APPLICATION_M3U8)
                .build()

            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true

            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    when (state) {
                        Player.STATE_BUFFERING -> { isBuffering = true; playbackError = null }
                        Player.STATE_READY -> { isBuffering = false; playbackError = null }
                        else -> { isBuffering = false }
                    }
                }
                override fun onIsPlayingChanged(playing: Boolean) { isPlaying = playing }
                override fun onPlayerError(error: PlaybackException) {
                    isBuffering = false
                    playbackError = "Live stream offline or geo-restricted: \${error.message}"
                }
            })
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    Scaffold(containerColor = Color.Black, modifier = modifier) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        player = exoPlayer
                        useController = false
                        this.resizeMode = resizeMode
                        layoutParams = FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    }
                },
                update = { view ->
                    view.player = exoPlayer
                    view.resizeMode = resizeMode
                },
                modifier = Modifier.fillMaxSize().clickable {
                    areControlsVisible = !areControlsVisible
                }
            )

            // Compose overlay controls (Play/Pause, Fullscreen, Back, Aspect Ratio)
            // ...
        }
    }
}`,
  },
  {
    name: 'ChannelListScreen.kt',
    path: 'app/src/main/java/com/indiantv/live/ui/screens/ChannelListScreen.kt',
    category: 'LazyVerticalGrid & SearchBar',
    code: `package com.indiantv.live.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.indiantv.live.data.model.Channel
import com.indiantv.live.ui.viewmodel.ChannelUiState
import com.indiantv.live.ui.viewmodel.ChannelViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChannelListScreen(
    viewModel: ChannelViewModel,
    onChannelClick: (Channel) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredChannels by viewModel.filteredChannels.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("BharatTV Live") },
                actions = {
                    IconButton(onClick = { viewModel.retry() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.onSearchQueryChange(it) },
                placeholder = { Text("Search Indian TV channels...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
            )

            // Category Chips Row
            // ...

            // LazyVerticalGrid displaying channels as cards with their respective logos and names
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 160.dp),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredChannels, key = { it.id + it.url }) { channel ->
                    ChannelCard(
                        channel = channel,
                        isFavorite = false,
                        onFavoriteClick = {},
                        onClick = { onChannelClick(channel) }
                    )
                }
            }
        }
    }
}`,
  },
  {
    name: 'M3uParser.kt',
    path: 'app/src/main/java/com/indiantv/live/data/parser/M3uParser.kt',
    category: 'Data Parser',
    code: `package com.indiantv.live.data.parser

import com.indiantv.live.data.model.Channel
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.UUID

object M3uParser {
    private val TVG_ID_REGEX = Regex("""tvg-id="([^"]*)"""", RegexOption.IGNORE_CASE)
    private val TVG_NAME_REGEX = Regex("""tvg-name="([^"]*)"""", RegexOption.IGNORE_CASE)
    private val TVG_LOGO_REGEX = Regex("""tvg-logo="([^"]*)"""", RegexOption.IGNORE_CASE)
    private val TVG_LANG_REGEX = Regex("""tvg-language="([^"]*)"""", RegexOption.IGNORE_CASE)
    private val GROUP_TITLE_REGEX = Regex("""group-title="([^"]*)"""", RegexOption.IGNORE_CASE)

    fun parse(inputStream: InputStream, defaultLanguage: String = "Hindi"): List<Channel> {
        val channels = mutableListOf<Channel>()
        val reader = BufferedReader(InputStreamReader(inputStream))
        var line: String? = reader.readLine()

        var currentId = ""
        var currentName = ""
        var currentLogo = ""
        var currentGroup = "General"
        var currentLang = defaultLanguage

        while (line != null) {
            val trimmed = line.trim()
            if (trimmed.startsWith("#EXTINF:", ignoreCase = true)) {
                val info = trimmed.substring(8)
                val commaIndex = info.lastIndexOf(',')
                val tags = if (commaIndex != -1) info.substring(0, commaIndex) else info
                val title = if (commaIndex != -1) info.substring(commaIndex + 1).trim() else ""

                currentId = TVG_ID_REGEX.find(tags)?.groupValues?.get(1) ?: UUID.randomUUID().toString()
                currentName = title.ifEmpty { TVG_NAME_REGEX.find(tags)?.groupValues?.get(1) ?: "Indian Channel" }
                currentLogo = TVG_LOGO_REGEX.find(tags)?.groupValues?.get(1) ?: ""
                currentGroup = GROUP_TITLE_REGEX.find(tags)?.groupValues?.get(1)?.ifEmpty { "General" } ?: "General"
                currentLang = TVG_LANG_REGEX.find(tags)?.groupValues?.get(1)?.ifEmpty { defaultLanguage } ?: defaultLanguage
            } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                if (currentName.isNotEmpty()) {
                    channels.add(
                        Channel(
                            id = currentId.ifEmpty { "ch_\${channels.size + 1}" },
                            name = currentName,
                            logo = currentLogo,
                            url = trimmed,
                            group = currentGroup,
                            language = currentLang
                        )
                    )
                    currentName = ""
                }
            }
            line = reader.readLine()
        }
        return channels
    }
}`,
  },
  {
    name: 'ChannelViewModel.kt',
    path: 'app/src/main/java/com/indiantv/live/ui/viewmodel/ChannelViewModel.kt',
    category: 'State Management (ViewModel)',
    code: `package com.indiantv.live.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiantv.live.data.model.Channel
import com.indiantv.live.data.repository.ChannelRepository
import com.indiantv.live.data.repository.PlaylistSource
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface ChannelUiState {
    object Loading : ChannelUiState
    data class Success(val channels: List<Channel>, val categories: List<String>, val totalCount: Int) : ChannelUiState
    data class Error(val message: String) : ChannelUiState
}

class ChannelViewModel(
    private val repository: ChannelRepository = ChannelRepository()
) : ViewModel() {
    private val _currentSource = MutableStateFlow(PlaylistSource.INDIA)
    val currentSource: StateFlow<PlaylistSource> = _currentSource.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _rawChannels = MutableStateFlow<List<Channel>>(emptyList())
    private val _isLoading = MutableStateFlow(true)
    private val _errorMessage = MutableStateFlow<String?>(null)

    val uiState: StateFlow<ChannelUiState> = combine(_rawChannels, _isLoading, _errorMessage) { channels, loading, error ->
        when {
            loading -> ChannelUiState.Loading
            error != null -> ChannelUiState.Error(error)
            else -> ChannelUiState.Success(channels, listOf("All") + channels.map { it.group }.distinct().sorted(), channels.size)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ChannelUiState.Loading)

    val filteredChannels: StateFlow<List<Channel>> = combine(_rawChannels, _searchQuery, _selectedCategory) { channels, query, cat ->
        channels.filter { ch ->
            (query.isBlank() || ch.name.contains(query, true) || ch.group.contains(query, true)) &&
            (cat == "All" || ch.group.equals(cat, true))
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        loadChannels(_currentSource.value)
    }

    fun loadChannels(source: PlaylistSource, forceRefresh: Boolean = false) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = repository.getChannels(source, forceRefresh)
            result.onSuccess { _rawChannels.value = it; _isLoading.value = false }
                  .onFailure { _errorMessage.value = it.localizedMessage; _isLoading.value = false }
        }
    }

    fun onSearchQueryChange(query: String) { _searchQuery.value = query }
    fun onCategorySelect(category: String) { _selectedCategory.value = category }
    fun retry() { loadChannels(_currentSource.value, forceRefresh = true) }
}`,
  },
  {
    name: 'ChannelRepository.kt',
    path: 'app/src/main/java/com/indiantv/live/data/repository/ChannelRepository.kt',
    category: 'Network & Repository',
    code: `package com.indiantv.live.data.repository

import com.indiantv.live.data.model.Channel
import com.indiantv.live.data.parser.M3uParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

enum class PlaylistSource(val title: String, val primaryUrl: String, val fallbackUrl: String) {
    INDIA("All India", "https://iptv-org.gitlab.io/iptv/countries/in.m3u", "https://iptv-org.github.io/iptv/countries/in.m3u"),
    HINDI("Hindi Channels", "https://iptv-org.gitlab.io/iptv/languages/hin.m3u", "https://iptv-org.github.io/iptv/languages/hin.m3u")
}

class ChannelRepository(private val client: OkHttpClient = OkHttpClient()) {
    private val cache = mutableMapOf<PlaylistSource, List<Channel>>()

    suspend fun getChannels(source: PlaylistSource, forceRefresh: Boolean = false): Result<List<Channel>> =
        withContext(Dispatchers.IO) {
            if (!forceRefresh && cache.containsKey(source)) {
                return@withContext Result.success(cache[source] ?: emptyList())
            }

            for (url in listOf(source.primaryUrl, source.fallbackUrl)) {
                try {
                    val req = Request.Builder().url(url).build()
                    client.newCall(req).execute().use { resp ->
                        if (resp.isSuccessful) {
                            val channels = M3uParser.parse(resp.body!!.byteStream())
                            if (channels.isNotEmpty()) {
                                cache[source] = channels
                                return@withContext Result.success(channels)
                            }
                        }
                    }
                } catch (_: Exception) {}
            }
            Result.failure(Exception("Could not fetch playlist"))
        }
}`,
  },
  {
    name: 'app/build.gradle.kts',
    path: 'app/build.gradle.kts',
    category: 'Gradle Build Configuration',
    code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.indiantv.live"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.indiantv.live"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
}

dependencies {
    // AndroidX Media3 (ExoPlayer + HLS + UI)
    val media3 = "1.3.1"
    implementation("androidx.media3:media3-exoplayer:$media3")
    implementation("androidx.media3:media3-exoplayer-hls:$media3")
    implementation("androidx.media3:media3-ui:$media3")

    // Coil Image Loading
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Networking: OkHttp & Retrofit
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")

    // Jetpack Compose & Navigation
    val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
}`,
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'Android Manifest',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".IndianTvApp"
        android:label="@string/app_name"
        android:theme="@style/Theme.IndianTvLive"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize"
            android:supportsPictureInPicture="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
  },
];

export const AndroidCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/download-android-zip');
      if (!res.ok) throw new Error('Zip download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BharatTV-Live-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Downloading project files...');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0F14] text-white">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/5 bg-[#161922]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3DDC84] to-[#138808] flex items-center justify-center text-black font-bold shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Native Android Studio Project</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                Kotlin & Jetpack Compose
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Ready-to-compile Gradle project with AndroidX Media3 ExoPlayer, Coil & OkHttp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied File' : 'Copy Kotlin Code'}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#e68a2e] hover:from-[#ffaa4d] hover:to-[#f0953a] text-black font-bold text-xs shadow-md shadow-[#FF9933]/20 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Preparing Zip...' : 'Download Project (.zip)'}
          </button>
        </div>
      </div>

      {/* Main Split View: File Tree + Code Editor */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-white/5 bg-[#12141C] p-3 overflow-y-auto shrink-0 space-y-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#FF9933]" />
            Project Structure
          </div>

          {ANDROID_FILES.map((file) => {
            const isSelected = selectedFile.name === file.name;
            return (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition ${
                  isSelected
                    ? 'bg-[#FF9933]/15 border border-[#FF9933]/50 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileCode
                  className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#FF9933]' : 'text-gray-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate flex items-center justify-between">
                    <span>{file.name}</span>
                    {isSelected && <ChevronRight className="w-3 h-3 text-[#FF9933]" />}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">{file.category}</div>
                </div>
              </button>
            );
          })}

          <div className="mt-6 p-3 rounded-xl bg-[#161922] border border-white/5 text-[11px] text-gray-400 space-y-2">
            <div className="font-semibold text-gray-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
              Android Studio Instructions:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Click &quot;Download Project (.zip)&quot;</li>
              <li>Extract into your projects folder</li>
              <li>Open Android Studio &gt; Open Folder</li>
              <li>Let Gradle sync &amp; click Run!</li>
            </ol>
          </div>
        </div>

        {/* Right Code Display */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0A0C10] overflow-hidden">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#12141C]">
            <div className="flex items-center gap-2 font-mono text-xs text-gray-300 truncate">
              <span className="text-[#FF9933] font-semibold">{selectedFile.name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 truncate text-[11px]">{selectedFile.path}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
              Kotlin / Gradle
            </span>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-gray-200 select-text">
            <pre className="whitespace-pre">{selectedFile.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
