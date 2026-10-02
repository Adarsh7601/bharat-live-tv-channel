package com.indiantv.live.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.indiantv.live.data.model.Channel
import com.indiantv.live.ui.theme.AccentLiveRed
import com.indiantv.live.ui.theme.SaffronPrimary
import com.indiantv.live.ui.viewmodel.ChannelUiState
import com.indiantv.live.ui.viewmodel.ChannelViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: ChannelViewModel,
    onChannelClick: (Channel) -> Unit,
    onNavigateToCategory: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val favorites by viewModel.favoriteIds.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(AccentLiveRed)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "BharatTV Live",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.retry() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { paddingValues ->
        when (val state = uiState) {
            is ChannelUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = SaffronPrimary)
                }
            }
            is ChannelUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                }
            }
            is ChannelUiState.Success -> {
                val allChannels = state.channels
                val featuredChannel = allChannels.firstOrNull {
                    it.name.contains("aaj tak", ignoreCase = true) ||
                    it.name.contains("dd news", ignoreCase = true) ||
                    it.name.contains("9xm", ignoreCase = true)
                } ?: allChannels.firstOrNull()

                val sportsChannels = allChannels.filter {
                    it.group.contains("sport", ignoreCase = true) ||
                    it.name.contains("sport", ignoreCase = true) ||
                    it.name.contains("cricket", ignoreCase = true)
                }.ifEmpty {
                    listOf(
                        Channel(
                            id = "dd-sports",
                            name = "DD Sports HD",
                            logo = "https://dtil.tmsimg.com/assets/s158255_ld_h15_aa.png?lock=720x540",
                            url = "https://mumbai-edge.smartplaytv.in/DDSportsHD/index.m3u8",
                            group = "Sports",
                            language = "Hindi",
                            resolution = "720p HD"
                        )
                    )
                }

                val newsChannels = allChannels.filter {
                    it.group.contains("news", ignoreCase = true) ||
                    it.name.contains("news", ignoreCase = true)
                }.take(10)

                val musicChannels = allChannels.filter {
                    it.group.contains("music", ignoreCase = true) ||
                    it.name.contains("music", ignoreCase = true) ||
                    it.name.contains("9x", ignoreCase = true)
                }.take(10)

                val devotionalChannels = allChannels.filter {
                    it.group.contains("devotional", ignoreCase = true) ||
                    it.group.contains("religious", ignoreCase = true) ||
                    it.name.contains("bhakti", ignoreCase = true)
                }.take(10)

                LazyColumn(
                    contentPadding = PaddingValues(bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Hero Featured Channel Banner
                    if (featuredChannel != null) {
                        item {
                            FeaturedHeroBanner(
                                channel = featuredChannel,
                                onWatchClick = { onChannelClick(featuredChannel) }
                            )
                        }
                    }

                    // Quick Category Cards
                    item {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                        ) {
                            CategoryQuickCard(
                                title = "Sports",
                                icon = Icons.Default.EmojiEvents,
                                color = Color(0xFF10B981),
                                modifier = Modifier.weight(1f),
                                onClick = { onNavigateToCategory("Sports") }
                            )
                            CategoryQuickCard(
                                title = "News",
                                icon = Icons.Default.Newspaper,
                                color = AccentLiveRed,
                                modifier = Modifier.weight(1f),
                                onClick = { onNavigateToCategory("News") }
                            )
                            CategoryQuickCard(
                                title = "Music",
                                icon = Icons.Default.MusicNote,
                                color = SaffronPrimary,
                                modifier = Modifier.weight(1f),
                                onClick = { onNavigateToCategory("Music") }
                            )
                            CategoryQuickCard(
                                title = "Favorites",
                                icon = Icons.Default.Star,
                                color = Color(0xFFFFD700),
                                modifier = Modifier.weight(1f),
                                onClick = { onNavigateToCategory("Favorites") }
                            )
                        }
                    }

                    // Sports Channels Row
                    if (sportsChannels.isNotEmpty()) {
                        item {
                            ChannelHorizontalRow(
                                title = "Live Sports & Cricket Action",
                                channels = sportsChannels,
                                onChannelClick = onChannelClick,
                                onViewAllClick = { onNavigateToCategory("Sports") }
                            )
                        }
                    }

                    // News Channels Row
                    if (newsChannels.isNotEmpty()) {
                        item {
                            ChannelHorizontalRow(
                                title = "Live News & Current Affairs",
                                channels = newsChannels,
                                onChannelClick = onChannelClick,
                                onViewAllClick = { onNavigateToCategory("News") }
                            )
                        }
                    }

                    // Music Channels Row
                    if (musicChannels.isNotEmpty()) {
                        item {
                            ChannelHorizontalRow(
                                title = "Music & Entertainment Hits",
                                channels = musicChannels,
                                onChannelClick = onChannelClick,
                                onViewAllClick = { onNavigateToCategory("Music") }
                            )
                        }
                    }

                    // Devotional Channels Row
                    if (devotionalChannels.isNotEmpty()) {
                        item {
                            ChannelHorizontalRow(
                                title = "Devotional & Spiritual",
                                channels = devotionalChannels,
                                onChannelClick = onChannelClick,
                                onViewAllClick = { onNavigateToCategory("Devotional") }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FeaturedHeroBanner(
    channel: Channel,
    onWatchClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF222634),
                            Color(0xFF161922)
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(AccentLiveRed)
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "FEATURED LIVE",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Text(
                        text = "${channel.language} • ${channel.resolution}",
                        style = MaterialTheme.typography.labelSmall,
                        color = SaffronPrimary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = channel.cleanName,
                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 24.sp),
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Free 24x7 live streaming broadcast with high definition HLS video.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onWatchClick,
                    colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Watch Live Now", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun CategoryQuickCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier.clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(12.dp)
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                title,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                maxLines = 1
            )
        }
    }
}

@Composable
fun ChannelHorizontalRow(
    title: String,
    channels: List<Channel>,
    onChannelClick: (Channel) -> Unit,
    onViewAllClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            TextButton(onClick = onViewAllClick) {
                Text("View All", color = SaffronPrimary, fontSize = 12.sp)
            }
        }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(channels, key = { it.id + it.url }) { channel ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier
                        .width(140.dp)
                        .clickable { onChannelClick(channel) }
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(80.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            if (channel.logo.isNotBlank()) {
                                AsyncImage(
                                    model = ImageRequest.Builder(LocalContext.current)
                                        .data(channel.logo)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = null,
                                    contentScale = ContentScale.Fit,
                                    modifier = Modifier.fillMaxSize().padding(6.dp)
                                )
                            } else {
                                Icon(Icons.Default.LiveTv, contentDescription = null, tint = SaffronPrimary)
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            channel.cleanName,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            channel.group,
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}
