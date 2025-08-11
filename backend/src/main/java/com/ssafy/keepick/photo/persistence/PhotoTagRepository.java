package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.photo.domain.PhotoTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoTagRepository extends JpaRepository<PhotoTag, Long> {

    List<PhotoTag> findAllByPhotoId(Long photoId);
}
