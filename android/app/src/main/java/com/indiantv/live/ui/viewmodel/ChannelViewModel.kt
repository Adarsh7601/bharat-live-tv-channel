package com.indiantv.live.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiantv.live.data.model.Channel
import com.indiantv.live.data.repository.ChannelRepository
import com.indiantv.live.data.repository.PlaylistSource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface ChannelUiState {
    object Loading : ChannelUiState
    data class Success(
        val channels: List<Channel>,
        val categories: List<String>,
        val totalCount: Int
    ) : ChannelUiState
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
    private val _favoriteIds = MutableStateFlow<Set<String>>(emptySet())
    val favoriteIds: StateFlow<Set<String>> = _favoriteIds.asStateFlow()

    private val _selectedChannel = MutableStateFlow<Channel?>(null)
    val selectedChannel: StateFlow<Channel?> = _selectedChannel.asStateFlow()

    val uiState: StateFlow<ChannelUiState> = combine(
        _rawChannels,
        _isLoading,
        _errorMessage
    ) { channels, loading, error ->
        when {
            loading -> ChannelUiState.Loading
            error != null -> ChannelUiState.Error(error)
            else -> {
                val categories = listOf("All") + channels
                    .map { it.group }
                    .filter { it.isNotBlank() }
                    .distinct()
                    .sorted()
                ChannelUiState.Success(
                    channels = channels,
                    categories = categories,
                    totalCount = channels.size
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ChannelUiState.Loading)

    // Filtered list based on search and category
    val filteredChannels: StateFlow<List<Channel>> = combine(
        _rawChannels,
        _searchQuery,
        _selectedCategory,
        _favoriteIds
    ) { channels, query, category, favorites ->
        channels.filter { channel ->
            val matchesQuery = query.isBlank() ||
                    channel.name.contains(query, ignoreCase = true) ||
                    channel.group.contains(query, ignoreCase = true) ||
                    channel.language.contains(query, ignoreCase = true)

            val matchesCategory = when (category) {
                "All" -> true
                "Favorites" -> favorites.contains(channel.id)
                else -> channel.group.equals(category, ignoreCase = true)
            }

            matchesQuery && matchesCategory
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        loadChannels(_currentSource.value)
    }

    fun loadChannels(source: PlaylistSource, forceRefresh: Boolean = false) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            _currentSource.value = source

            val result = repository.getChannels(source, forceRefresh)
            result.onSuccess { channels ->
                _rawChannels.value = channels
                _isLoading.value = false
            }.onFailure { exception ->
                _errorMessage.value = exception.localizedMessage ?: "Failed to load channels"
                _isLoading.value = false
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun onCategorySelect(category: String) {
        _selectedCategory.value = category
    }

    fun toggleFavorite(channelId: String) {
        val current = _favoriteIds.value.toMutableSet()
        if (current.contains(channelId)) {
            current.remove(channelId)
        } else {
            current.add(channelId)
        }
        _favoriteIds.value = current
    }

    fun selectChannel(channel: Channel?) {
        _selectedChannel.value = channel
    }

    fun retry() {
        loadChannels(_currentSource.value, forceRefresh = true)
    }
}
