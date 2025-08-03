package com.ssafy.keepick.external.s3;

import com.ssafy.keepick.image.controller.dto.ImageUploadRequest;

import java.util.List;
import java.util.Set;

public class FileValidator {
    // 허용되는 이미지 Content-Type
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    // 최대 파일 크기 (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    /**
     * 파일 정보 검증
     */
    public void validate(List<ImageUploadRequest.FileInfo> files) {
        for (ImageUploadRequest.FileInfo file : files) {
            // Content-Type 검증
            if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType().toLowerCase())) {
                throw new IllegalArgumentException(
                        String.format("지원하지 않는 파일 형식입니다: %s (파일: %s)",
                                file.getContentType(), file.getFileName()));
            }

            // 파일 크기 검증
            if (file.getFileSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException(
                        String.format("파일 크기가 너무 큽니다: %s (최대 %dMB)",
                                file.getFileName(), MAX_FILE_SIZE / 1024 / 1024));
            }

            // 파일명 검증
            if (file.getFileName().trim().isEmpty()) {
                throw new IllegalArgumentException("파일명이 비어있습니다.");
            }

            // 파일명에 특수문자 제한 (필요시 추가)
            if (file.getFileName().contains("..") || file.getFileName().contains("/")) {
                throw new IllegalArgumentException(
                        String.format("허용되지 않는 문자가 포함된 파일명입니다: %s", file.getFileName()));
            }
        }
    }
}
