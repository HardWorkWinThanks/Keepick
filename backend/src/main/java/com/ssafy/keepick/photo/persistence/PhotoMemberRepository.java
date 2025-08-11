package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.photo.domain.PhotoMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoMemberRepository extends JpaRepository<PhotoMember, Long> {

    @EntityGraph(attributePaths = {"member"})
    List<PhotoMember> findAllByPhotoId(Long photoId);
}
