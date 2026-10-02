package com.indiantv.live.data.parser

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

    /**
     * Parses an M3U playlist InputStream into a list of Channel objects.
     */
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
                val lineWithoutPrefix = trimmed.substring(8)
                val commaIndex = lineWithoutPrefix.lastIndexOf(',')

                val tagsPart: String
                val titlePart: String
                if (commaIndex != -1) {
                    tagsPart = lineWithoutPrefix.substring(0, commaIndex)
                    titlePart = lineWithoutPrefix.substring(commaIndex + 1).trim()
                } else {
                    tagsPart = lineWithoutPrefix
                    titlePart = ""
                }

                currentId = TVG_ID_REGEX.find(tagsPart)?.groupValues?.get(1) ?: UUID.randomUUID().toString()
                val parsedName = TVG_NAME_REGEX.find(tagsPart)?.groupValues?.get(1)?.trim()
                currentName = if (!titlePart.isEmpty()) titlePart else parsedName ?: "Indian Channel"
                currentLogo = TVG_LOGO_REGEX.find(tagsPart)?.groupValues?.get(1) ?: ""
                currentGroup = GROUP_TITLE_REGEX.find(tagsPart)?.groupValues?.get(1)?.ifEmpty { "General" } ?: "General"
                currentLang = TVG_LANG_REGEX.find(tagsPart)?.groupValues?.get(1)?.ifEmpty { defaultLanguage } ?: defaultLanguage

            } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                if (currentName.isNotEmpty()) {
                    val resolution = when {
                        currentName.contains("1080p", ignoreCase = true) -> "1080p FHD"
                        currentName.contains("720p", ignoreCase = true) -> "720p HD"
                        currentName.contains("576p", ignoreCase = true) -> "576p SD"
                        currentName.contains("hd", ignoreCase = true) -> "HD"
                        else -> "SD"
                    }

                    channels.add(
                        Channel(
                            id = currentId.ifEmpty { "ch_${channels.size + 1}" },
                            name = currentName,
                            logo = currentLogo,
                            url = trimmed,
                            group = currentGroup,
                            language = currentLang,
                            resolution = resolution
                        )
                    )
                    // Reset for next channel
                    currentId = ""
                    currentName = ""
                    currentLogo = ""
                    currentGroup = "General"
                    currentLang = defaultLanguage
                }
            }
            line = reader.readLine()
        }
        return channels
    }

    /**
     * Parses from a raw M3U String directly.
     */
    fun parseString(content: String, defaultLanguage: String = "Hindi"): List<Channel> {
        return parse(content.byteInputStream(Charsets.UTF_8), defaultLanguage)
    }
}
