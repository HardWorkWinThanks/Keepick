package com.ssafy.keepick.album.common.application.dto;

import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AlbumDto {

    private List<TimelineAlbumDto> timelineAlbumDtoList;
    private List<TierAlbumDto> tierAlbumDtoList;
    private List<HighlightAlbumDto> highlightAlbumDtoList;

    public static AlbumDto of(
            List<TimelineAlbumDto> timelineAlbumDtoList,
            List<TierAlbumDto> tierAlbumDtoList,
            List<HighlightAlbumDto> highlightAlbumDtoList
    ) {
        return AlbumDto.builder()
                .timelineAlbumDtoList(timelineAlbumDtoList)
                .tierAlbumDtoList(tierAlbumDtoList)
                .highlightAlbumDtoList(highlightAlbumDtoList)
                .build();
    }

}
