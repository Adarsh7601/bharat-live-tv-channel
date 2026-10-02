package com.indiantv.live.data.repository

import com.indiantv.live.data.model.Channel
import com.indiantv.live.data.parser.M3uParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

enum class PlaylistSource(val title: String, val primaryUrl: String, val fallbackUrl: String) {
    INDIA(
        title = "All India",
        primaryUrl = "https://iptv-org.gitlab.io/iptv/countries/in.m3u",
        fallbackUrl = "https://iptv-org.github.io/iptv/countries/in.m3u"
    ),
    HINDI(
        title = "Hindi Channels",
        primaryUrl = "https://iptv-org.gitlab.io/iptv/languages/hin.m3u",
        fallbackUrl = "https://iptv-org.github.io/iptv/languages/hin.m3u"
    )
}

class ChannelRepository(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()
) {

    private val cache = mutableMapOf<PlaylistSource, List<Channel>>()

    suspend fun getChannels(source: PlaylistSource, forceRefresh: Boolean = false): Result<List<Channel>> =
        withContext(Dispatchers.IO) {
            if (!forceRefresh && cache.containsKey(source)) {
                return@withContext Result.success(cache[source] ?: emptyList())
            }

            val urlsToTry = listOf(source.primaryUrl, source.fallbackUrl)
            var lastException: Exception? = null

            for (url in urlsToTry) {
                try {
                    val request = Request.Builder()
                        .url(url)
                        .header("User-Agent", "BharatTV-Live/1.0 (Android-JetpackCompose)")
                        .build()

                    client.newCall(request).execute().use { response ->
                        if (!response.isSuccessful) {
                            throw IOException("HTTP ${response.code}: ${response.message}")
                        }
                        val body = response.body ?: throw IOException("Empty response body")
                        val defaultLang = if (source == PlaylistSource.HINDI) "Hindi" else "Indian"
                        val channels = M3uParser.parse(body.byteStream(), defaultLang)
                        if (channels.isNotEmpty()) {
                            cache[source] = channels
                            return@withContext Result.success(channels)
                        }
                    }
                } catch (e: Exception) {
                    lastException = e
                }
            }

            // If offline or network failed, return curated fallback list so app always functions
            val fallback = getCuratedChannels()
            if (fallback.isNotEmpty()) {
                return@withContext Result.success(fallback)
            }

            Result.failure(lastException ?: IOException("Failed to load channel playlist"))
        }

    private fun getCuratedChannels(): List<Channel> = listOf(
        Channel(
            id = "dd-news",
            name = "DD News HD",
            logo = "https://upload.wikimedia.org/wikipedia/commons/2/22/DD_News_Logo.png",
            url = "https://d224bopvch527.cloudfront.net/out/v1/a2da19fefda2411e858db1b9c1d044fa/index.m3u8",
            group = "News",
            language = "Hindi",
            resolution = "1080p FHD"
        ),
        Channel(
            id = "aaj-tak",
            name = "Aaj Tak HD",
            logo = "https://upload.wikimedia.org/wikipedia/commons/e/ec/Aaj_tak_logo.png",
            url = "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8",
            group = "News",
            language = "Hindi",
            resolution = "1080p FHD"
        ),
        Channel(
            id = "india-today",
            name = "India Today HD",
            logo = "https://upload.wikimedia.org/wikipedia/commons/d/da/India_Today_logo.png",
            url = "https://feeds.intoday.in/livetv/indiatoday/master.m3u8",
            group = "News",
            language = "English",
            resolution = "1080p FHD"
        ),
        Channel(
            id = "sansad-tv-1",
            name = "Sansad TV 1 HD",
            logo = "https://upload.wikimedia.org/wikipedia/en/3/3b/Sansad_TV_logo.png",
            url = "https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0414e727910ff640fb3687343548a8a60f295374/SansadTV1_Live/28c11bb3-e578-43e3-8531-bc5716bc59bf/0.m3u8",
            group = "Legislative",
            language = "Hindi",
            resolution = "1080p FHD"
        ),
        Channel(
            id = "9x-jalwa",
            name = "9X Jalwa",
            logo = "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_9X_JALWA/images/LOGO_HD/image.png",
            url = "https://wiselp.wiseplayout.com/9X_JALWA/master.m3u8",
            group = "Music",
            language = "Hindi",
            resolution = "1080p FHD"
        ),
        Channel(
            id = "9xm",
            name = "9XM",
            logo = "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_9XM/images/LOGO_HD/image.png",
            url = "https://9xjio.wiseplayout.com/9XM/master.m3u8",
            group = "Music",
            language = "Hindi",
            resolution = "1080p FHD"
        )
    )
}
