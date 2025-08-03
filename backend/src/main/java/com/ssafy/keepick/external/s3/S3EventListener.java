package com.ssafy.keepick.external.s3;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class S3EventListener {

    private final ThumbnailService thumbnailService;
    private final ObjectMapper objectMapper;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.aws.s3.originals-prefix}")
    private String originalsPrefix;

    // 중복 처리 방지를 위한 처리된 메시지 ID 저장
    private final Set<String> processedMessages = new HashSet<>();

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
            if (!eventName.startsWith("s3:ObjectCreated:")) {
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
            if (processedMessages.contains(messageId)) {
                log.warn("Duplicate message ignored: {}", messageId);
                return;
            }

            // 처리된 메시지로 마킹 (메모리 기반, 실제 운영에서는 Redis 등 사용 권장)
            processedMessages.add(messageId);

            // 메시지 ID 캐시 크기 제한 (메모리 누수 방지)
            if (processedMessages.size() > 1000) {
                processedMessages.clear();
                log.info("Cleared processed messages cache");
            }

            // 비동기로 썸네일 생성 처리
            CompletableFuture<Void> thumbnailFuture = thumbnailService.processImageIfSupported(
                    objectKey,
                    guessContentTypeFromKey(objectKey)
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

    /**
     * 메시지 중복 처리 방지를 위한 고유 ID 생성
     */
    private String generateMessageId(String eventName, String bucketName, String objectKey) {
        return String.format("%s:%s:%s", eventName, bucketName, objectKey);
    }

    /**
     * Object Key로부터 Content-Type 추정
     */
    private String guessContentTypeFromKey(String objectKey) {
        String lowerKey = objectKey.toLowerCase();

        if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerKey.endsWith(".png")) {
            return "image/png";
        } else if (lowerKey.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerKey.endsWith(".webp")) {
            return "image/webp";
        }

        return null; // 알 수 없는 형식
    }
}