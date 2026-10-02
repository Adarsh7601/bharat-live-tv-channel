package com.indiantv.live.data.network

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Url

interface PlaylistApiService {

    @GET
    suspend fun getPlaylistRaw(@Url url: String): Response<ResponseBody>
}
