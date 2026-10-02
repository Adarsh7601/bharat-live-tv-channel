package com.indiantv.live

import android.app.PictureInPictureParams
import android.os.Build
import android.os.Bundle
import android.util.Rational
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material3.*
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.indiantv.live.ui.navigation.Screen
import com.indiantv.live.ui.screens.ChannelListScreen
import com.indiantv.live.ui.screens.HomeScreen
import com.indiantv.live.ui.screens.PlayerScreen
import com.indiantv.live.ui.theme.IndianTvTheme
import com.indiantv.live.ui.theme.SaffronPrimary
import com.indiantv.live.ui.viewmodel.ChannelViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: ChannelViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            IndianTvTheme {
                val navController = rememberNavController()
                val selectedChannel by viewModel.selectedChannel.collectAsState()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                Scaffold(
                    bottomBar = {
                        // Only show bottom navigation if we are not on the full-screen player
                        if (currentRoute != Screen.Player.route) {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface,
                                contentColor = MaterialTheme.colorScheme.onSurface
                            ) {
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                                    label = { Text("Home") },
                                    selected = currentRoute == Screen.Home.route,
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = SaffronPrimary,
                                        selectedTextColor = SaffronPrimary,
                                        indicatorColor = SaffronPrimary.copy(alpha = 0.15f)
                                    ),
                                    onClick = {
                                        navController.navigate(Screen.Home.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                )
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Tv, contentDescription = "Channels") },
                                    label = { Text("Channels") },
                                    selected = currentRoute == Screen.ChannelList.route,
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = SaffronPrimary,
                                        selectedTextColor = SaffronPrimary,
                                        indicatorColor = SaffronPrimary.copy(alpha = 0.15f)
                                    ),
                                    onClick = {
                                        navController.navigate(Screen.ChannelList.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                )
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Star, contentDescription = "Favorites") },
                                    label = { Text("Favorites") },
                                    selected = currentRoute == Screen.Favorites.route,
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = SaffronPrimary,
                                        selectedTextColor = SaffronPrimary,
                                        indicatorColor = SaffronPrimary.copy(alpha = 0.15f)
                                    ),
                                    onClick = {
                                        viewModel.onCategorySelect("Favorites")
                                        navController.navigate(Screen.ChannelList.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                        }
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Home.route,
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable(Screen.Home.route) {
                            HomeScreen(
                                viewModel = viewModel,
                                onChannelClick = { channel ->
                                    viewModel.selectChannel(channel)
                                    navController.navigate(Screen.Player.route)
                                },
                                onNavigateToCategory = { category ->
                                    viewModel.onCategorySelect(category)
                                    navController.navigate(Screen.ChannelList.route)
                                }
                            )
                        }

                        composable(Screen.ChannelList.route) {
                            ChannelListScreen(
                                viewModel = viewModel,
                                onChannelClick = { channel ->
                                    viewModel.selectChannel(channel)
                                    navController.navigate(Screen.Player.route)
                                }
                            )
                        }

                        composable(Screen.Player.route) {
                            selectedChannel?.let { channel ->
                                PlayerScreen(
                                    channel = channel,
                                    onBackClick = {
                                        navController.popBackStack()
                                    }
                                )
                            } ?: run {
                                navController.popBackStack()
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && viewModel.selectedChannel.value != null) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            enterPictureInPictureMode(params)
        }
    }
}
