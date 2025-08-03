package com.ssafy.keepick.image.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// S3 이벤트 메시지 DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class S3EventResponse {
    private String eventName;
    private String bucketName;
    private String objectKey;
    private Long objectSize;
    private String eventTime;
}