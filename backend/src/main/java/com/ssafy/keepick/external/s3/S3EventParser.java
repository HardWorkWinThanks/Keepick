package com.ssafy.keepick.external.s3;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Component
@RequiredArgsConstructor
class S3EventParser {

    private final ObjectMapper objectMapper;

    public JsonNode parse(String message) throws IOException {
        JsonNode json = objectMapper.readTree(message);
        if (json.has("Message")) {
            return objectMapper.readTree(json.get("Message").asText());
        }
        return json;
    }

    public List<JsonNode> extractRecords(JsonNode s3Event) {
        JsonNode records = s3Event.get("Records");
        if (records != null && records.isArray()) {
            return StreamSupport.stream(records.spliterator(), false).collect(Collectors.toList());
        }
        return Collections.emptyList();
    }
}