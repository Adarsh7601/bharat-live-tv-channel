package com.indiantv.live.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Home")
    object ChannelList : Screen("channel_list", "Channels")
    object Favorites : Screen("favorites", "Favorites")
    object Player : Screen("player", "Player")
}
