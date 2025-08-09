package com.ssafy.keepick.photo.application;
import com.ssafy.keepick.external.s3.S3FileOperationService;
import com.ssafy.keepick.external.s3.S3PresignedUrlService;
import com.ssafy.keepick.external.s3.dto.S3ImagePathDto;
import com.ssafy.keepick.photo.application.dto.GroupPhotoCommandDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final S3PresignedUrlService presignedUrlService;
    private final S3FileOperationService fileOperationService;

    // Presigned URL 관련 메서드들
    public S3ImagePathDto generatePresignedUrl(String fileName, String contentType) {
        return presignedUrlService.generatePresignedUrl(fileName, contentType);
    }

    public List<S3ImagePathDto> generatePresignedUrls(List<GroupPhotoCommandDto> groupPhotoCommandDtoList) {
        groupPhotoCommandDtoList.forEach(GroupPhotoCommandDto::validate);
        return presignedUrlService.generatePresignedUrls(groupPhotoCommandDtoList);
    }

    // 파일 작업 관련 메서드들
    public byte[] downloadFile(String objectKey) {
        return fileOperationService.downloadFile(objectKey);
    }

    public void uploadFile(String objectKey, byte[] fileContent, String contentType) {
        fileOperationService.uploadFile(objectKey, fileContent, contentType);
    }

    public String uploadThumbnail(String originalObjectKey, byte[] thumbnailContent) {
        return fileOperationService.uploadThumbnail(originalObjectKey, thumbnailContent);
    }

    public boolean fileExists(String objectKey) {
        return fileOperationService.fileExists(objectKey);
    }
}