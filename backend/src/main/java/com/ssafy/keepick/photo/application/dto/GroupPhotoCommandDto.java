package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.global.utils.file.FileUtils;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoCommandDto {
    private final Long imageId;
    private final String fileName;
    private final String contentType;
    private final Long fileSize;

    public static GroupPhotoCommandDto from(Long ImageId, GroupPhotoUploadRequest.ImageFileRequest request) {
        return GroupPhotoCommandDto.builder()
                .imageId(ImageId)
                .fileName(request.getFileName())
                .contentType(request.getContentType())
                .fileSize(request.getFileSize())
                .build();
    }

    public void validate() {
        FileUtils.validateContentType(this.contentType, this.fileName);
        FileUtils.validateFileSize(this.fileSize, this.fileName);
        FileUtils.validateFileName(this.fileName);
    }
}
