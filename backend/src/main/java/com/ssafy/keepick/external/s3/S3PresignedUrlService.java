package com.ssafy.keepick.external.s3;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.utils.file.FileUtils;
import com.ssafy.keepick.photo.application.dto.ImageDto;
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
            String uniqueFileName = FileUtils.generateUniqueFileName(fileName);
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

            log.debug("Presigned URL 생성: {} -> {}", fileName, objectKey);
            return presignedUrl;

        } catch (Exception e) {
            log.error("Presigned URL 생성 실패: {}", fileName, e);
            throw new BaseException(ErrorCode.PRESIGNED_URL_GENERATION_FAILED);
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