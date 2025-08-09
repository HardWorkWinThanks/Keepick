package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.global.utils.FileUtils;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoCommandDto {
    private final String fileName;
    private final String contentType;
    private final Long fileSize;

    public static GroupPhotoCommandDto from(Long photoId, GroupPhotoUploadRequest.ImageFileRequest request) {
        return GroupPhotoCommandDto.builder()
                .fileName(photoId+"/"+request.getFileName())
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
