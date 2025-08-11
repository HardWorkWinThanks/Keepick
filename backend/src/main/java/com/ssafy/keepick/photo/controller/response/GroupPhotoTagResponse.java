package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.PhotoTagDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoTagResponse {

    @Schema(description = "사진 태그 목록", example = "[동물, 음식]")
    private List<String> tags;
    
    @Schema(description = "사진 태그 회원 닉네임 목록", example = "[가가, 나나]")
    private List<String> memberNicknames;

    public static GroupPhotoTagResponse from(PhotoTagDto dto) {
        return GroupPhotoTagResponse.builder()
                .tags(dto.getTags())
                .memberNicknames(dto.getMemberNicknames())
                .build();
    }
}
