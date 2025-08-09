package com.ssafy.keepick.external.visionai;

import com.ssafy.keepick.external.visionai.request.BlurDetectionRequest;
import com.ssafy.keepick.external.visionai.request.SimilarGroupingRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionAIService {
    private final WebClient webClient;

    @Value("${app.vision-ai.url}")
    private String url;

    public Mono<String> postBlurRequest(String jobId, BlurDetectionRequest request) {
        return webClient.post()
                .uri(url + "/api/blur_detection")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> postSimilarityRequest(String jobId, SimilarGroupingRequest request) {
        return webClient.post()
                .uri(url + "/api/similar_grouping")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class);
    }
}
