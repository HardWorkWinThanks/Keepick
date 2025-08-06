package com.ssafy.keepick.album.tier.application.dto;

import java.util.List;

import com.ssafy.keepick.global.response.PagingResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TierAlbumListDto {
    private List<TierAlbumDto> albums;
    private PagingResponse.PageInfo pageInfo;
    
    public static TierAlbumListDto from(List<TierAlbumDto> albums) {
        return TierAlbumListDto.builder()
            .albums(albums)
            .build();
    }
    
    public static TierAlbumListDto from(List<TierAlbumDto> albums, int page, int size, long totalElements) {
        PagingResponse.PageInfo pageInfo = PagingResponse.PageInfo.builder()
            .page(page)
            .size(size)
            .totalElement(totalElements)
            .totalPage((int) Math.ceil((double) totalElements / size))
            .hasNext(page < (int) Math.ceil((double) totalElements / size) - 1)
            .build();
            
        return TierAlbumListDto.builder()
            .albums(albums)
            .pageInfo(pageInfo)
            .build();
    }
}
