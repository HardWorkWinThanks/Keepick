package com.ssafy.keepick.global.utils;


import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;

import java.util.Set;
import java.util.UUID;

@Slf4j
public class FileUtils {

    private static final Set<String> SUPPORTED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    public static boolean isSupportedImageType(String contentType) {
        return contentType != null && SUPPORTED_IMAGE_TYPES.contains(contentType.toLowerCase());
    }

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    public static String guessContentType(String objectKey) {
        String key = objectKey.toLowerCase();
        if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
        if (key.endsWith(".png")) return "image/png";
        if (key.endsWith(".gif")) return "image/gif";
        if (key.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public static String generatePublicUrl(String bucketName, String region, String objectKey) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, objectKey);
    }

    public static String generateUniqueFileName(String originalFileName) {
        String uuid = UUID.randomUUID().toString();
        String fileExtension = getFileExtension(originalFileName);
        String baseName = getBaseName(originalFileName);
        return String.format("%s_%s%s", baseName, uuid, fileExtension);
    }

    public static String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }

    public static String getBaseName(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    }

    public static String extractFileName(String objectKey) {
        return objectKey.substring(objectKey.lastIndexOf('/') + 1);
    }

    public static String extractImageNumber(String objectKey) {
        String[] parts = objectKey.split("/");
        if (parts.length >= 2) {
            return parts[1];
        }
        log.error("objectKey 형식이 잘못되었습니다: {}", objectKey);
        throw new BaseException(ErrorCode.INVALID_FILE);
    }

    public static void validateContentType(String contentType, String fileName) {
        if (contentType == null || !SUPPORTED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            log.error("지원하지 않는 파일 형식입니다: {} (파일: {})", contentType, fileName);
            throw new BaseException(ErrorCode.INVALID_FILE);
        }
    }

    public static void validateFileSize(long fileSize, String fileName) {
        if (fileSize > MAX_FILE_SIZE) {
            log.error("파일 크기가 너무 큽니다: {} (최대 {}MB)", fileName, MAX_FILE_SIZE / 1024 / 1024);
            throw new BaseException(ErrorCode.INVALID_FILE);
        }
    }

    public static void validateFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            log.error("파일명이 비어있습니다.");
            throw new BaseException(ErrorCode.INVALID_FILE);
        }
        if (fileName.contains("..")) {
            log.error("허용되지 않는 문자가 포함된 파일명입니다: {}", fileName);
            throw new BaseException(ErrorCode.INVALID_FILE);
        }
    }
}
