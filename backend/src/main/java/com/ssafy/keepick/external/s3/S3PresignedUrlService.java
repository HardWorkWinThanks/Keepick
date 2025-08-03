package com.ssafy.keepick.external.s3;

import com.ssafy.keepick.image.application.dto.ImageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3PresignedUrlService {

    private final S3Presigner s3Presigner;
    private final FileNameGenerator fileNameGenerator;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.aws.s3.originals-prefix}")
    private String originalsPrefix;

    @Value("${app.aws.s3.presigned-url-expiration}")
    private long presignedUrlExpiration;

    /**
     * Presigned URL 생성 (PUT 방식)
     */
    public String generatePresignedUrl(String fileName, String contentType) {
        try {
            String uniqueFileName = fileNameGenerator.generateUniqueFileName(fileName);
            String objectKey = originalsPrefix + uniqueFileName;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(presignedUrlExpiration))
                    .putObjectRequest(putObjectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            String presignedUrl = presignedRequest.url().toString();

            log.info("Generated presigned URL for file: {} -> {}", fileName, objectKey);
            return presignedUrl;

        } catch (Exception e) {
            log.error("Failed to generate presigned URL for file: {}", fileName, e);
            throw new RuntimeException("Presigned URL 생성 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 여러 파일에 대한 Presigned URL 배열 생성
     */
    public List<String> generatePresignedUrls(List<ImageDto> fileInfos) {
        return fileInfos.stream()
                .map(info -> generatePresignedUrl(info.getFileName(), info.getContentType()))
                .toList();
    }
}