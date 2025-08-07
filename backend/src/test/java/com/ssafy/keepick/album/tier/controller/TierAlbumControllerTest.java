package com.ssafy.keepick.album.tier.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.keepick.album.tier.application.TierAlbumService;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.controller.request.CreateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.global.response.PagingResponse;

@ExtendWith(MockitoExtension.class)
class TierAlbumControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TierAlbumService tierAlbumService;

    @InjectMocks
    private TierAlbumController tierAlbumController;

    private ObjectMapper objectMapper;

    private TierAlbumDto tierAlbumDto;
    private TierAlbumDetailDto tierAlbumDetailDto;
    private TierAlbumListDto tierAlbumListDto;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tierAlbumController).build();
        objectMapper = new ObjectMapper();
        
        // 테스트 데이터 설정
        tierAlbumDto = TierAlbumDto.builder()
            .id(1L)
            .name("테스트 앨범")
            .description("테스트 설명")
            .thumbnailUrl("https://test.com/thumb.jpg")
            .originalUrl("https://test.com/original.jpg")
            .photoCount(2)
            .createdAt(LocalDateTime.of(2024, 1, 15, 10, 30))
            .updatedAt(LocalDateTime.of(2024, 1, 15, 14, 45))
            .build();

        tierAlbumDetailDto = TierAlbumDetailDto.builder()
            .title("테스트 앨범")
            .description("테스트 설명")
            .thumbnailUrl("https://test.com/thumb.jpg")
            .originalUrl("https://test.com/original.jpg")
            .photoCount(2)
            .photos(new HashMap<>())
            .build();

        List<TierAlbumDto> albums = Arrays.asList(tierAlbumDto);
        PagingResponse.PageInfo pageInfo = PagingResponse.PageInfo.builder()
            .page(0)
            .size(10)
            .totalElement(1L)
            .totalPage(1)
            .hasNext(false)
            .build();

        tierAlbumListDto = TierAlbumListDto.builder()
            .albums(albums)
            .pageInfo(pageInfo)
            .build();
    }

    @Test
    @DisplayName("티어 앨범 생성 API 성공")
    void createTierAlbum_Success() throws Exception {
        // given
        Long groupId = 1L;
        CreateTierAlbumRequest request = CreateTierAlbumRequest.builder()
            .photoIds(Arrays.asList(1L, 2L))
            .build();

        when(tierAlbumService.createTierAlbum(eq(groupId), anyList()))
            .thenReturn(tierAlbumDto);

        // when & then
        mockMvc.perform(post("/api/groups/{groupId}/tier-albums", groupId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.name").value("테스트 앨범"));
    }

    @Test
    @DisplayName("티어 앨범 생성 API 실패 - 빈 사진 리스트")
    void createTierAlbum_Fail_EmptyPhotoList() throws Exception {
        // given
        Long groupId = 1L;
        CreateTierAlbumRequest request = CreateTierAlbumRequest.builder()
            .photoIds(Arrays.asList())
            .build();

        // when & then
        mockMvc.perform(post("/api/groups/{groupId}/tier-albums", groupId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 API 성공")
    void getTierAlbumList_Success() throws Exception {
        // given
        Long groupId = 1L;
        int page = 0;
        int size = 10;

        when(tierAlbumService.getTierAlbumListWithPaging(eq(groupId), eq(page), eq(size)))
            .thenReturn(tierAlbumListDto);

        // when & then
        mockMvc.perform(get("/api/groups/{groupId}/tier-albums", groupId)
                .param("page", String.valueOf(page))
                .param("size", String.valueOf(size)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.content").isArray())
            .andExpect(jsonPath("$.data.content[0].id").value(1))
            .andExpect(jsonPath("$.data.content[0].name").value("테스트 앨범"))
            .andExpect(jsonPath("$.data.content[0].photoCount").value(2))
            .andExpect(jsonPath("$.data.content[0].createdAt").exists())
            .andExpect(jsonPath("$.data.content[0].updatedAt").exists())
            .andExpect(jsonPath("$.data.pageInfo.page").value(0))
            .andExpect(jsonPath("$.data.pageInfo.size").value(10))
            .andExpect(jsonPath("$.data.pageInfo.totalElement").value(1))
            .andExpect(jsonPath("$.data.pageInfo.totalPage").value(1))
            .andExpect(jsonPath("$.data.pageInfo.hasNext").value(false));
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 API - 기본값 테스트")
    void getTierAlbumList_DefaultValues() throws Exception {
        // given
        Long groupId = 1L;

        when(tierAlbumService.getTierAlbumListWithPaging(eq(groupId), eq(0), eq(10)))
            .thenReturn(tierAlbumListDto);

        // when & then (파라미터 없이 호출)
        mockMvc.perform(get("/api/groups/{groupId}/tier-albums", groupId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 API - 빈 결과")
    void getTierAlbumList_EmptyResult() throws Exception {
        // given
        Long groupId = 1L;
        int page = 0;
        int size = 10;

        // 빈 결과를 위한 DTO 생성
        TierAlbumListDto emptyListDto = TierAlbumListDto.builder()
            .albums(Arrays.asList())
            .pageInfo(PagingResponse.PageInfo.builder()
                .page(0)
                .size(10)
                .totalElement(0L)
                .totalPage(0)
                .hasNext(false)
                .build())
            .build();

        when(tierAlbumService.getTierAlbumListWithPaging(eq(groupId), eq(page), eq(size)))
            .thenReturn(emptyListDto);

        // when & then
        mockMvc.perform(get("/api/groups/{groupId}/tier-albums", groupId)
                .param("page", String.valueOf(page))
                .param("size", String.valueOf(size)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.content").isArray())
            .andExpect(jsonPath("$.data.content").isEmpty())
            .andExpect(jsonPath("$.data.pageInfo.totalElement").value(0));
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 API 성공")
    void getTierAlbum_Success() throws Exception {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;

        when(tierAlbumService.getTierAlbumDetail(eq(tierAlbumId)))
            .thenReturn(tierAlbumDetailDto);

        // when & then
        mockMvc.perform(get("/api/groups/{groupId}/tier-albums/{tierAlbumId}", groupId, tierAlbumId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.title").value("테스트 앨범"))
            .andExpect(jsonPath("$.data.photoCount").value(2));
    }

    @Test
    @DisplayName("티어 앨범 수정 API 성공")
    void updateTierAlbum_Success() throws Exception {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        Map<String, List<Long>> photos = new HashMap<>();
        photos.put("S", Arrays.asList(1L));
        photos.put("A", Arrays.asList(2L));
        
        UpdateTierAlbumRequest request = UpdateTierAlbumRequest.builder()
            .name("수정된 앨범")
            .description("수정된 설명")
            .thumbnailId(1L)
            .photos(photos)
            .build();

        when(tierAlbumService.updateTierAlbum(eq(tierAlbumId), any(UpdateTierAlbumRequest.class)))
            .thenReturn(tierAlbumDto);

        // when & then
        mockMvc.perform(put("/api/groups/{groupId}/tier-albums/{tierAlbumId}", groupId, tierAlbumId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("티어 앨범 수정 API 실패 - 빈 이름")
    void updateTierAlbum_Fail_EmptyName() throws Exception {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        UpdateTierAlbumRequest request = UpdateTierAlbumRequest.builder()
            .name("")
            .build();

        // when & then
        mockMvc.perform(put("/api/groups/{groupId}/tier-albums/{tierAlbumId}", groupId, tierAlbumId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("티어 앨범 삭제 API 성공")
    void deleteTierAlbum_Success() throws Exception {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;

        doNothing().when(tierAlbumService).deleteTierAlbum(eq(tierAlbumId));

        // when & then
        mockMvc.perform(delete("/api/groups/{groupId}/tier-albums/{tierAlbumId}", groupId, tierAlbumId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200));

        verify(tierAlbumService).deleteTierAlbum(tierAlbumId);
    }
}
