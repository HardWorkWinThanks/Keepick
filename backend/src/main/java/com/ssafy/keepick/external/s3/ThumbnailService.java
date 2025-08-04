package com.ssafy.keepick.external.s3;

import com.ssafy.keepick.global.utils.file.FileUtils;
import com.ssafy.keepick.image.application.ImageService;
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
            log.info("Starting thumbnail generation for: {}", objectKey);

            // S3에서 원본 이미지 다운로드
            byte[] originalImageData = s3Service.downloadFile(objectKey);

            // 썸네일 생성
            byte[] thumbnailData = generateThumbnail(originalImageData);

            // S3에 썸네일 업로드
            s3Service.uploadThumbnail(objectKey, thumbnailData);

            log.info("Successfully generated and uploaded thumbnail for: {}", objectKey);
            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            log.error("Failed to generate thumbnail for: {}", objectKey, e);
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

            byte[] thumbnailData = outputStream.toByteArray();

            log.debug("Generated thumbnail: original size={}, thumbnail size={}",
                    originalImageData.length, thumbnailData.length);

            return thumbnailData;

        } catch (IOException e) {
            log.error("Failed to generate thumbnail from image data", e);
            throw new RuntimeException("썸네일 생성 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 썸네일 생성 가능 여부 확인 및 처리
     */
    @Async("thumbnailExecutor")
    public CompletableFuture<Void> processImageIfSupported(String objectKey, String contentType) {
        try {
            // Content-Type이 없으면 파일 확장자로 추정
            String actualContentType = contentType != null ? contentType : FileUtils.guessContentType(objectKey);

            if (!FileUtils.isSupportedImageType(actualContentType)) {
                log.warn("Unsupported image type for thumbnail generation: {} ({})", objectKey, actualContentType);
                return CompletableFuture.completedFuture(null);
            }

            // 파일이 실제로 존재하는지 확인
            if (!s3Service.fileExists(objectKey)) {
                log.warn("File does not exist in S3: {}", objectKey);
                return CompletableFuture.completedFuture(null);
            }

            return generateAndUploadThumbnail(objectKey);

        } catch (Exception e) {
            log.error("Error processing image: {}", objectKey, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}