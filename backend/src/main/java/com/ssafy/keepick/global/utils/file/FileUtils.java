package com.ssafy.keepick.global.utils.file;


import java.util.Set;
import java.util.UUID;

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

    public static void validateContentType(String contentType, String fileName) {
        if (contentType == null || !SUPPORTED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(String.format(
                    "지원하지 않는 파일 형식입니다: %s (파일: %s)", contentType, fileName));
        }
    }

    public static void validateFileSize(long fileSize, String fileName) {
        if (fileSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(String.format(
                    "파일 크기가 너무 큽니다: %s (최대 %dMB)", fileName, MAX_FILE_SIZE / 1024 / 1024));
        }
    }

    public static void validateFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new IllegalArgumentException("파일명이 비어있습니다.");
        }
        if (fileName.contains("..") || fileName.contains("/")) {
            throw new IllegalArgumentException(
                    String.format("허용되지 않는 문자가 포함된 파일명입니다: %s", fileName));
        }
    }
}
