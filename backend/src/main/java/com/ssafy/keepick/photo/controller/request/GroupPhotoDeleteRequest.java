package com.ssafy.keepick.photo.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoDeleteRequest {
    List<Long> photoIds;
}
