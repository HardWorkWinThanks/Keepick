package com.ssafy.keepick.external.s3;

import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class FileNameGenerator {

    /**
     * 고유한 파일명 생성
     */
    public String generateUniqueFileName(String originalFileName) {
        String uuid = UUID.randomUUID().toString();
        String fileExtension = getFileExtension(originalFileName);
        String baseName = getBaseName(originalFileName);

        return String.format("%s_%s%s", baseName, uuid, fileExtension);
    }

    /**
     * 파일 확장자 추출
     */
    public String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }

    /**
     * 파일 기본명 추출 (확장자 제외)
     */
    public String getBaseName(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    }

    /**
     * Object Key에서 파일명 추출
     */
    public String extractFileName(String objectKey) {
        return objectKey.substring(objectKey.lastIndexOf('/') + 1);
    }
}