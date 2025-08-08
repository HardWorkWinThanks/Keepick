package com.ssafy.keepick.external.visionai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionAIService {
    private final WebClient webClient;

    @Value("${app.vision-ai.url}")
    private String url;

    public void get() {
        webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class);
    }
}
