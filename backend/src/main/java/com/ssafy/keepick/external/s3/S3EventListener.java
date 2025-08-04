package com.ssafy.keepick.external.s3;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.global.utils.file.FileUtils;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;


@Slf4j
@Component
@RequiredArgsConstructor
public class S3EventListener {

    private final ThumbnailService thumbnailService;
    private final ObjectMapper objectMapper;
    private final RedisService redisService;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.aws.s3.originals-prefix}")
    private String originalsPrefix;

    /**
     * SQS 메시지 수신 및 처리
     */
    @SqsListener("${app.aws.sqs.queue-name}")
    public void receiveS3Event(String message) {
        try {
            log.info("Received SQS message: {}", message);

            // JSON 메시지 파싱
            JsonNode messageJson = objectMapper.readTree(message);

            // SNS를 통해 전달된 경우 Message 필드에서 실제 S3 이벤트 추출
            String s3EventMessage = extractS3EventMessage(messageJson);
            JsonNode s3Event = objectMapper.readTree(s3EventMessage);

            // S3 이벤트 레코드 처리
            JsonNode records = s3Event.get("Records");
            if (records != null && records.isArray()) {
                for (JsonNode record : records) {
                    processS3EventRecord(record);
                }
            }

        } catch (Exception e) {
            log.error("Failed to process SQS message: {}", message, e);
            // 메시지 처리 실패 시 예외를 던져서 SQS에서 재시도하도록 함
            throw new RuntimeException("SQS 메시지 처리 실패", e);
        }
    }

    /**
     * SNS 메시지에서 S3 이벤트 메시지 추출
     */
    private String extractS3EventMessage(JsonNode messageJson) {
        // SNS를 통해 전달된 경우
        if (messageJson.has("Message")) {
            return messageJson.get("Message").asText();
        }
        // 직접 SQS로 전달된 경우
        return messageJson.toString();
    }

    /**
     * 개별 S3 이벤트 레코드 처리
     */
    private void processS3EventRecord(JsonNode record) {
        try {
            // 이벤트 정보 추출
            String eventName = record.get("eventName").asText();
            String bucketNameFromEvent = record.get("s3").get("bucket").get("name").asText();
            String objectKey = URLDecoder.decode(
                    record.get("s3").get("object").get("key").asText(),
                    StandardCharsets.UTF_8
            );
            long objectSize = record.get("s3").get("object").get("size").asLong();

            log.info("Processing S3 event: eventName={}, bucket={}, key={}, size={}",
                    eventName, bucketNameFromEvent, objectKey, objectSize);

            // 버킷명 확인
            if (!bucketName.equals(bucketNameFromEvent)) {
                log.warn("Event from different bucket ignored: expected={}, actual={}",
                        bucketName, bucketNameFromEvent);
                return;
            }

            // PUT 이벤트만 처리
            if (!eventName.startsWith("ObjectCreated:PUT")) {
                log.debug("Ignoring non-create event: {}", eventName);
                return;
            }

            // originals 폴더의 파일만 처리
            if (!objectKey.startsWith(originalsPrefix)) {
                log.debug("Ignoring file outside originals prefix: {}", objectKey);
                return;
            }

            // 중복 처리 방지
            String messageId = generateMessageId(eventName, bucketNameFromEvent, objectKey);
            if (isDuplicate(messageId)) {
                log.warn("Duplicate message ignored: {}", messageId);
                return;
            }


            // 비동기로 썸네일 생성 처리
            CompletableFuture<Void> thumbnailFuture = thumbnailService.processImageIfSupported(
                    objectKey,
                    FileUtils.guessContentType(objectKey)
            );

            // 썸네일 처리 결과 로깅 (논블로킹)
            thumbnailFuture.whenComplete((result, throwable) -> {
                if (throwable != null) {
                    log.error("Thumbnail processing failed for {}: {}", objectKey, throwable.getMessage());
                } else {
                    log.info("Thumbnail processing completed for: {}", objectKey);
                }
            });

        } catch (Exception e) {
            log.error("Failed to process S3 event record: {}", record, e);
            throw new RuntimeException("S3 이벤트 레코드 처리 실패", e);
        }
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

    /**
     * 메시지 중복 처리 방지를 위한 고유 ID 생성
     */
    private String generateMessageId(String eventName, String bucketName, String objectKey) {
        return String.format("%s:%s:%s", eventName, bucketName, objectKey);
    }
}