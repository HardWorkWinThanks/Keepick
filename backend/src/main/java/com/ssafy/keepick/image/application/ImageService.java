package com.ssafy.keepick.image.application;
import com.ssafy.keepick.external.s3.S3FileOperationService;
import com.ssafy.keepick.external.s3.S3PresignedUrlService;
import com.ssafy.keepick.image.application.dto.ImageDto;
import com.ssafy.keepick.image.controller.dto.ImageUploadRequest;
import com.ssafy.keepick.image.controller.dto.PresignedUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final S3PresignedUrlService presignedUrlService;
    private final S3FileOperationService fileOperationService;

    // Presigned URL 관련 메서드들
    public String generatePresignedUrl(String fileName, String contentType) {
        return presignedUrlService.generatePresignedUrl(fileName, contentType);
    }

    public PresignedUrlResponse generatePresignedUrls(ImageUploadRequest fileInfos) {
        List<ImageDto> imageDtos = fileInfos.toDto();
        List<String> presignedUrls = presignedUrlService.generatePresignedUrls(imageDtos);
        return PresignedUrlResponse.of(presignedUrls);
    }

    // 파일 작업 관련 메서드들
    public byte[] downloadFile(String objectKey) {
        return fileOperationService.downloadFile(objectKey);
    }

    public void uploadFile(String objectKey, byte[] fileContent, String contentType) {
        fileOperationService.uploadFile(objectKey, fileContent, contentType);
    }

    public void uploadThumbnail(String originalObjectKey, byte[] thumbnailContent) {
        fileOperationService.uploadThumbnail(originalObjectKey, thumbnailContent);
    }

    public boolean fileExists(String objectKey) {
        return fileOperationService.fileExists(objectKey);
    }
}