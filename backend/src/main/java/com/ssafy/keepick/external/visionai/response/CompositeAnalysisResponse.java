package com.ssafy.keepick.external.visionai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompositeAnalysisResponse {
    @JsonProperty("distance_threshold")
    private double distanceThreshold;
    @JsonProperty("results")
    private List<Result> results;
    @JsonProperty("status")
    private String status;
    @JsonProperty("summary")
    private Summary summary;
    @JsonProperty("tagged_images")
    private Map<String, List<String>> taggedImages;
    @JsonProperty("tagged_images_by_person")
    private Map<String, List<String>> taggedImagesByPerson;
    @JsonProperty("target_persons")
    private List<String> targetPersons;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Result {
        @JsonProperty("found_faces")
        private List<FoundFace> foundFaces;
        @JsonProperty("has_face")
        private boolean hasFace;
        @JsonProperty("image_name")
        private Long imageName;
        @JsonProperty("is_blur")
        private boolean isBlur;
        @JsonProperty("laplacian_variance")
        private double laplacianVariance;
        private List<ObjectInfo> objects;
        @JsonProperty("tagged_image_filename")
        private String taggedImageFilename;
        @JsonProperty("tagged_image_path")
        private String taggedImagePath;
        @JsonProperty("total_faces")
        private int totalFaces;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoundFace {
        private List<Integer> bbox; // [x1, y1, x2, y2]
        private double distance;
        @JsonProperty("person_name")
        private Long personName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObjectInfo {
        private List<Integer> bbox; // [x1, y1, x2, y2]
        private double conf;
        private String label;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        @JsonProperty("images_with_faces")
        private int imagesWithFaces;
        @JsonProperty("total_matched_faces")
        private int totalMatchedFaces;
        @JsonProperty("total_images")
        private int total_source_images;
    }
}
