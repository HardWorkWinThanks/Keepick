package com.ssafy.keepick.album.common.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.ssafy.keepick.album.common.application.AlbumService;
import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.global.exception.GlobalExceptionHandler;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.support.BaseTest;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AlbumControllerTest extends BaseTest  {

    private MockMvc mockMvc;

    @Mock
    private AlbumService albumService;

    @InjectMocks
    private AlbumController albumController;

    private ObjectMapper objectMapper;

    private TimelineAlbumDto timelineAlbumDto;
    private TierAlbumDto tierAlbumDto;
    private HighlightAlbumDto highlightAlbumDto;


    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(albumController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, false);
    }

    @Test
    @DisplayName("앨범 목록 조회 API 테스트")
    void getAllAlbums() throws Exception {
        // given
        Long groupId = 1L;

        TimelineAlbumDto timelineAlbumDto = TimelineAlbumDto.builder().albumId(1L).name("TLA").build();
        TierAlbumDto tierAlbumDto = TierAlbumDto.builder().id(2L).name("TA").build();
        HighlightAlbumDto highlightAlbumDto = HighlightAlbumDto.builder().albumId(3L).name("HA").build();

        AlbumDto albumDto = AlbumDto.builder()
                .timelineAlbumDtoList(List.of(timelineAlbumDto))
                .tierAlbumDtoList(List.of(tierAlbumDto))
                .highlightAlbumDtoList(List.of(highlightAlbumDto))
                .build();

        given(albumService.getAllAlbumList(groupId)).willReturn(albumDto);

        // when & then
        mockMvc.perform(get("/api/groups/{groupId}/albums", groupId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.timelineAlbumList").isArray())
                .andExpect(jsonPath("$.data.tierAlbumList").isArray())
                .andExpect(jsonPath("$.data.highlightAlbumList").isArray());
    }
}