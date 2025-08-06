package com.ssafy.keepick.testconfig;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
public class RedisTestContainer {

    static final String REDIS_IMAGE = "redis:6-alpine";

    @Container
    static final GenericContainer<?> redisContainer = new GenericContainer<>(REDIS_IMAGE)
            .withExposedPorts(6379)
            .withReuse(true);

    static {
        redisContainer.start();
    }

    @DynamicPropertySource
    public static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.redis.host", redisContainer::getHost);
        registry.add("spring.redis.port", () -> redisContainer.getMappedPort(6379));
    }

    public static String getHost() {
        return redisContainer.getHost();
    }

    public static int getPort() {
        return redisContainer.getMappedPort(6379);
    }

}
