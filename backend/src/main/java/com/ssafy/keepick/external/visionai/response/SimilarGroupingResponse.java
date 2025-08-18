package com.ssafy.keepick.external.visionai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarGroupingResponse {
    @JsonProperty("groups")
    private List<Group> groups;
    @JsonProperty("similarity_threshold")
    private double similarityThreshold;
    @JsonProperty("status")
    private String status;
    @JsonProperty("summary")
    private Summary summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Group {
        @JsonProperty("group_id")
        private String groupId;
        @JsonProperty("images")
        private List<Long> images;
        @JsonProperty("similarities")
        private List<Similarity> similarities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Similarity {
        @JsonProperty("image1")
        private String image1;
        @JsonProperty("image2")
        private String image2;
        @JsonProperty("similarity")
        private double similarity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        @JsonProperty("grouped_images")
        private int groupedImages;
        @JsonProperty("total_groups")
        private int totalGroups;
        @JsonProperty("total_images")
        private int totalImages;
    }
}
