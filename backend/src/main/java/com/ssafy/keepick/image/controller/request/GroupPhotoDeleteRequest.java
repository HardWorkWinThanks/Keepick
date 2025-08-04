package com.ssafy.keepick.image.controller.request;

import lombok.Getter;

import java.util.List;

@Getter
public class GroupPhotoDeleteRequest {
    List<Long> photoIds;
}
