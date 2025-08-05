package com.ssafy.keepick.image.domain;

import lombok.Getter;

@Getter
public enum Tag {
    FOOD("음식"),
    SCENERY("풍경");

    private final String name;

    Tag(String name) {
        this.name = name;
    }
}
