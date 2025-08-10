package com.ssafy.keepick.timeline.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TimelinePhotoRequest {

    @Schema(description = "앨범에 추가 혹은 삭제할 사진 ID 목록")
    @NotNull(message = "사진이 1개 이상 필요합니다.")
    private List<Long> photoIds;

}
