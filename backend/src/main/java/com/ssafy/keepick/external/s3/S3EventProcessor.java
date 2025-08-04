package com.ssafy.keepick.external.s3;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.global.utils.file.FileUtils;
import com.ssafy.keepick.image.application.ThumbnailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;


@Slf4j
@Component
@RequiredArgsConstructor
class S3EventProcessor {
    private final RedisService  redisService;
    private final ThumbnailService thumbnailService;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.aws.s3.originals-prefix}")
    private String originalsPrefix;

    public void handle(JsonNode record) {
        String eventName = record.get("eventName").asText();
        String eventBucket = record.get("s3").get("bucket").get("name").asText();
        String objectKey = URLDecoder.decode(
                record.get("s3").get("object").get("key").asText(),
                StandardCharsets.UTF_8
        );

        // bucket 이름이 잘못된 경우
        if (!bucketName.equals(eventBucket)) return;
        // put 이벤트가 아닌 경우
        if (!eventName.startsWith("ObjectCreated:PUT")) return;
        // original 이미지가 아닌 경우
        if (!objectKey.startsWith(originalsPrefix)) return;

        String messageId = String.format("%s:%s:%s", eventName, eventBucket, objectKey);
        if (isDuplicate(messageId)) return;

        CompletableFuture<Void> future = thumbnailService.processImageIfSupported(
                objectKey,
                FileUtils.guessContentType(objectKey)
        );

        future.whenComplete((res, ex) -> {
            if (ex != null) {
                log.error("썸네일 생성 실패: {}", ex.getMessage());
            } else {
                log.info("썸네일 생성 성공: {}", objectKey);
            }
        });
    }

    public boolean isDuplicate(String messageId) {
        // Redis에 key가 남아있다면 중복
        if (redisService.getValue(messageId) != null) {
            return true;
        }
        // 없으면 등록 (TTL: 10분)
        redisService.setValue(messageId, "1", Duration.ofMinutes(10));
        return false;
    }
}
