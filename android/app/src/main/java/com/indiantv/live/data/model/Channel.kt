package com.indiantv.live.data.model

import java.io.Serializable

/**
 * Represents an Indian television channel extracted from an M3U playlist.
 */
data class Channel(
    val id: String,
    val name: String,
    val logo: String,
    val url: String,
    val group: String = "General",
    val language: String = "Hindi",
    val country: String = "IN",
    val resolution: String = "HD"
) : Serializable {
    val cleanName: String
        get() = name.replace(Regex("\\s*\\(\\d+p\\)", RegexOption.IGNORE_CASE), "").trim()
}
