package com.ssafy.keepick.external.visionai;

import com.ssafy.keepick.external.visionai.request.CompositeAnalysisRequest;
import com.ssafy.keepick.external.visionai.request.ProfileValidateRequest;
import com.ssafy.keepick.external.visionai.request.SimilarGroupingRequest;
import com.ssafy.keepick.external.visionai.response.CompositeAnalysisResponse;
import com.ssafy.keepick.external.visionai.response.ProfileValidateResponse;
import com.ssafy.keepick.external.visionai.response.SimilarGroupingResponse;
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

    public Mono<SimilarGroupingResponse> postSimilarityRequest(SimilarGroupingRequest request) {
        return webClient.post()
                .uri(url + "/api/similar_grouping")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SimilarGroupingResponse.class);
    }

    public Mono<CompositeAnalysisResponse> postFaceTaggingRequest(CompositeAnalysisRequest request) {
        return webClient.post()
                .uri(url + "/api/tag_and_detect")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(CompositeAnalysisResponse.class);
    }

    public ProfileValidateResponse  postProfileValidateRequest(ProfileValidateRequest request) {
        return webClient.post()
                .uri(url + "/api/face/validate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ProfileValidateResponse.class)
                .block();
    }
}
