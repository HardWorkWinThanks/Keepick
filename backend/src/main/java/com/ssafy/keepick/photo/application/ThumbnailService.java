package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.global.utils.file.FileUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThumbnailService {

    private final ImageService s3Service;

    @Value("${app.thumbnail.width}")
    private int thumbnailWidth;

    @Value("${app.thumbnail.quality}")
    private double thumbnailQuality;

    @Value("${app.thumbnail.format}")
    private String thumbnailFormat;

    /**
     * 비동기로 썸네일 생성 및 업로드
     */
    @Async("thumbnailExecutor")
    public CompletableFuture<Void> generateAndUploadThumbnail(String objectKey) {
        try {
            // S3에서 원본 이미지 다운로드
            byte[] originalImageData = s3Service.downloadFile(objectKey);

            // 썸네일 생성
            byte[] thumbnailData = generateThumbnail(originalImageData);

            // S3에 썸네일 업로드
            s3Service.uploadThumbnail(objectKey, thumbnailData);

            log.info("썸네일 이미지 생성 성공: {}", objectKey);
            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            throw new RuntimeException("썸네일 생성 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 이미지 데이터로부터 썸네일 생성
     */
    public byte[] generateThumbnail(byte[] originalImageData) {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(originalImageData);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Thumbnails.of(inputStream)
                    .width(thumbnailWidth)
                    .outputQuality(thumbnailQuality)
                    .outputFormat(thumbnailFormat)
                    .toOutputStream(outputStream);

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("썸네일 생성 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 썸네일 생성 가능 여부 확인 및 처리
     */
    @Async("thumbnailExecutor")
    public CompletableFuture<Void> processImageIfSupported(String objectKey, String contentType) {
        try {
            if (!validateOriginImage(objectKey, contentType)) {
                return CompletableFuture.completedFuture(null);
            }

            return generateAndUploadThumbnail(objectKey);

        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }

    private boolean validateOriginImage(String objectKey, String contentType) {
        // Content-Type이 없으면 파일 확장자로 추정
        String actualContentType = contentType != null ? contentType : FileUtils.guessContentType(objectKey);

        if (!FileUtils.isSupportedImageType(actualContentType)) {
            log.warn("Unsupported image type for thumbnail generation: {} ({})", objectKey, actualContentType);
            return false;
        }

        if (!s3Service.fileExists(objectKey)) {
            log.warn("File does not exist in S3: {}", objectKey);
            return false;
        }

        return true;
    }
}