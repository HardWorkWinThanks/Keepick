package com.ssafy.keepick.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    public static class PageInfo {
        private final boolean hasNext;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private final Integer page;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private final Integer size;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private final Integer totalPage;
        @JsonInclude(JsonInclude.Include.NON_NULL)
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