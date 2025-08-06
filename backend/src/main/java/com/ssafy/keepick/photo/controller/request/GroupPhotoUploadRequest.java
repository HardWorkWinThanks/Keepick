package com.ssafy.keepick.photo.controller.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.annotations.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPhotoUploadRequest {

    @NotNull
    @Size(min = 1, max = 20, message = "파일은 1개 이상 20개 이하로 선택해주세요")
    private List<ImageFileRequest> files;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageFileRequest {

        @NotBlank(message = "파일명은 필수입니다")
        private String fileName;

        @NotBlank(message = "Content-Type은 필수입니다")
        private String contentType;

        @NotNull
        @Positive(message = "파일 크기는 양수여야 합니다")
        private Long fileSize;

        private Integer width;

        private Integer height;

        private LocalDateTime takenAt;
    }
}
