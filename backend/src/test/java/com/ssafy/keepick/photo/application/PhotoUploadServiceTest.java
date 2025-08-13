package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.external.s3.dto.S3ImagePathDto;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.application.dto.GroupPhotoCommandDto;
import com.ssafy.keepick.photo.application.dto.GroupPhotoUploadDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

@ExtendWith(MockitoExtension.class)
class PhotoUploadServiceTest extends BaseTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private GroupPhotoService groupService; // Assuming the method is in GroupService

    private Long groupId;
    private Group group;
    private GroupPhotoUploadRequest request;
    private List<String> expectedUrls;
    private List<S3ImagePathDto> expectedS3ImagePathDtos;

    @BeforeEach
    void setUp() {
        groupId = 1L;
        group = Group.createGroup("Test Group", null); // Assuming Group has a constructor

        GroupPhotoUploadRequest.ImageFileRequest fileRequest1 = new GroupPhotoUploadRequest.ImageFileRequest("파일이름","image", 100L, 100, 200, LocalDateTime.now());
        GroupPhotoUploadRequest.ImageFileRequest fileRequest2 = new GroupPhotoUploadRequest.ImageFileRequest("파일이름","image", 100L, 300, 400, LocalDateTime.now());
        request = new GroupPhotoUploadRequest(List.of(fileRequest1, fileRequest2));

        expectedUrls = List.of("http://presigned.url/1", "http://presigned.url/2");
        expectedS3ImagePathDtos = List.of(S3ImagePathDto.of("http://presigned.url/1", "http://public.url/1"), S3ImagePathDto.of("http://presigned.url/2", "http://public.url/2"));
    }

    @Test
    @DisplayName("그룹 사진 2장 업로드 테스트")
    void testUploadGroupPhoto_Success() {
        // Given
        Photo photo1 = Photo.createPhoto(request.getFiles().get(0).getTakenAt(), request.getFiles().get(0).getWidth(), request.getFiles().get(0).getHeight(), group);

        Photo photo2 = Photo.createPhoto(request.getFiles().get(1).getTakenAt(), request.getFiles().get(1).getWidth(), request.getFiles().get(1).getHeight(), group);

        List<Photo> initialPhotos = List.of(photo1, photo2);

        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(photoRepository.saveAll(anyList())).thenReturn(initialPhotos);
        when(imageService.generatePresignedUrls(anyList())).thenReturn(expectedS3ImagePathDtos);

        // When
        List<GroupPhotoUploadDto> actualUrls = groupService.uploadGroupPhoto(groupId, request);

        // Then
        assertEquals(expectedUrls, actualUrls.stream().map(GroupPhotoUploadDto::getPresignedUrl).toList());

        // 메소드 호출 테스트
        verify(groupRepository).findById(groupId);

        // saveAll이 두 번 호출되었는지 확인
        ArgumentCaptor<List<Photo>> photoCaptor = ArgumentCaptor.forClass(List.class);
        verify(photoRepository, times(2)).saveAll(photoCaptor.capture());

        List<List<Photo>> capturedLists = photoCaptor.getAllValues();
        assertEquals(2, capturedLists.size());

        // 첫 번째 saveAll 호출 (originalUrl이 설정되지 않은, 초기 Photo 객체들)
        assertEquals(2, capturedLists.get(0).size());

        // 두 번째 saveAll 호출 (originalUrl이 설정된 Photo 객체들)
        assertEquals(2, capturedLists.get(1).size());
        assertEquals(expectedS3ImagePathDtos.get(0).getPublicUrl(), capturedLists.get(1).get(0).getOriginalUrl());
        assertEquals(expectedS3ImagePathDtos.get(1).getPublicUrl(), capturedLists.get(1).get(1).getOriginalUrl());

        ArgumentCaptor<List<GroupPhotoCommandDto>> dtoCaptor = ArgumentCaptor.forClass(List.class);
        verify(imageService).generatePresignedUrls(dtoCaptor.capture());

        List<GroupPhotoCommandDto> capturedDtos = dtoCaptor.getValue();
        assertEquals(2, capturedDtos.size());
    }

    @Test
    @DisplayName("존재하지 않는 그룹에 업로드 요청 시 실패 테스트")
    void testUploadGroupPhoto_GroupNotFound_ThrowsException() {
        // Given
        when(groupRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        BaseException exception = assertThrows(BaseException.class, () ->
                groupService.uploadGroupPhoto(groupId, request)
        );

        assertEquals(ErrorCode.GROUP_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("요청 목록이 비어 있는 경우 빈 배열 반환 테스트")
    void testUploadGroupPhoto_EmptyFileList_ReturnsEmptyList() {
        // Given
        GroupPhotoUploadRequest emptyRequest = new GroupPhotoUploadRequest(Collections.emptyList());
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));

        // When
        List<GroupPhotoUploadDto> actualUrls = groupService.uploadGroupPhoto(groupId, emptyRequest);

        // Then
        assertEquals(Collections.emptyList(), actualUrls);
        verify(photoRepository, times(0)).saveAll(Collections.emptyList());
        verify(imageService, times(0)).generatePresignedUrls(Collections.emptyList());
    }
}