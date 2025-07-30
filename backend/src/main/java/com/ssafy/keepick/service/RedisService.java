package com.ssafy.keepick.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    public void setValue(String key, String value) {
        stringRedisTemplate.opsForValue().set(key, value, Duration.ofDays(1));
    }

    public String getValue(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

}
