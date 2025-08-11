package com.ssafy.keepick.album.tier.controller.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TierPhotoUploadRequest {

    @NotNull
    @Size(max = 20, message = "이미지는 최대 20장까지 업로드 가능합니다.")
    private List<Long> photoIds;

}
