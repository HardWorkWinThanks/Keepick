package com.ssafy.keepick.external.s3;

import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;



@Slf4j
@Component
@RequiredArgsConstructor
public class S3EventListener {

    private final S3EventParser s3EventParser;
    private final S3EventProcessor s3EventProcessor;

    @SqsListener("${app.aws.sqs.queue-name}")
    public void receiveS3Event(String message) {
        try {
            log.info("Received SQS message: {}", message);

            JsonNode s3Event = s3EventParser.parse(message);
            List<JsonNode> records = s3EventParser.extractRecords(s3Event);

            for (JsonNode record : records) {
                s3EventProcessor.handle(record);
            }

        } catch (Exception e) {
            log.error("Error processing SQS message", e);
            throw new RuntimeException("S3 event processing failed", e);
        }
    }
}