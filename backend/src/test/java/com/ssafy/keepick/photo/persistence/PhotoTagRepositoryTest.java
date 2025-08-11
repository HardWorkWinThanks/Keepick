package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.support.BaseRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class PhotoTagRepositoryTest extends BaseRepositoryTest {

    @Autowired PhotoRepository photoRepository;
    @Autowired PhotoTagRepository photoTagRepository;

    @DisplayName("사진의 태그를 조회합니다.")
    @Test
    void findAllByPhotoIdTest() {
        // given
        Photo photo = photoRepository.save(Photo.builder().build());

        photoTagRepository.save(PhotoTag.of(photo, "태그1"));
        photoTagRepository.save(PhotoTag.of(photo, "태그2"));
        photoTagRepository.save(PhotoTag.of(photo, "태그3"));

        // when
        List<PhotoTag> photoTags = photoTagRepository.findAllByPhotoId(photo.getId());

        // then
        assertThat(photoTags.size()).isEqualTo(3);
        assertThat(photoTags).extracting("tag").containsExactly("태그1", "태그2", "태그3");
    }


}