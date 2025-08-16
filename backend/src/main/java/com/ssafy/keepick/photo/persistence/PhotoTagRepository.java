package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.photo.domain.PhotoTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PhotoTagRepository extends JpaRepository<PhotoTag, Long> {

    List<PhotoTag> findAllByPhotoId(Long photoId);

    @Query("SELECT DISTINCT pt.tag " +
            "FROM PhotoTag pt JOIN pt.photo p " +
            "WHERE p.deletedAt IS NULL " +
            "AND p.group.id = :groupId")
    List<String> findTagsByGroupId(Long groupId);
}
