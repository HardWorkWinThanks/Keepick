package com.ssafy.keepick.image.application.dto;

import com.ssafy.keepick.global.utils.file.FileUtils;
import com.ssafy.keepick.image.controller.dto.ImageUploadRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class ImageDto {
    private final String fileName;
    private final String contentType;
    private final Long fileSize;

    public static List<ImageDto> from(ImageUploadRequest request) {
        return request.getFiles().stream()
                .map(file -> ImageDto.builder()
                        .fileName(file.getFileName())
                        .contentType(file.getContentType())
                        .fileSize(file.getFileSize())
                        .build())
                .collect(Collectors.toList());
    }

    public void validate() {
        FileUtils.validateContentType(this.contentType, this.fileName);
        FileUtils.validateFileSize(this.fileSize, this.fileName);
        FileUtils.validateFileName(this.fileName);
    }
}
