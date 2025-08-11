package com.ssafy.keepick.album.tier.controller.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TierPhotoDeleteRequest {

    @NotNull
    private List<Long> photoIds;

}
