package com.ssafy.keepick.image.application.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ImageDto {
    private final String fileName;
    private final String contentType;
    private final Long fileSize;
}
