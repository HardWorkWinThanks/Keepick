package com.ssafy.keepick.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Getter
@Builder
@AllArgsConstructor
public class PagingResponse<T> {
    private final List<T> list;
    private final PageInfo pageInfo;

    @Getter
    @Builder
    @AllArgsConstructor
    @Schema(description = "페이징 정보")
    public static class PageInfo {
        @Schema(description = "다음 페이지 존재 여부", example = "false")
        private final boolean hasNext;
        
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "현재 페이지 번호 (0부터 시작)", example = "0")
        private final Integer page;
        
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "페이지당 항목 수", example = "10")
        private final Integer size;
        
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "전체 페이지 수", example = "1")
        private final Integer totalPage;
        
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "전체 항목 수", example = "1")
        private final Long totalElement;
    }


    public static <U, T> PagingResponse<T> from(Page<U> data, Function<U, T> converter) {
        return PagingResponse.<T>builder()
                .list(data.getContent().stream().map(converter).toList())
                .pageInfo(PageInfo.builder()
                        .page(data.getNumber())
                        .size(data.getSize())
                        .totalPage(data.getTotalPages())
                        .totalElement(data.getTotalElements())
                        .hasNext(data.hasNext())
                        .build())
                .build();
    }
}