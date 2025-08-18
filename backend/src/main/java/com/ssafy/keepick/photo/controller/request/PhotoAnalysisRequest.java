package com.ssafy.keepick.photo.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoAnalysisRequest {
    private List<Long>  photoIds;
}
