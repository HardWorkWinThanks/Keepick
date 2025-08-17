package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PhotoMemberRepository extends JpaRepository<PhotoMember, Long> {

    @Query("SELECT pm " +
            "FROM PhotoMember pm " +
            "JOIN FETCH pm.member m " +
            "WHERE pm.photo.id = :photoId " +
            "AND m IN (" +
            "    SELECT gm.member " +
            "    FROM GroupMember gm " +
            "    WHERE gm.group.id = :groupId " +
            "    AND gm.status = GroupMemberStatus.ACCEPTED" +
            ")")
    List<PhotoMember> findAllByPhotoId(Long groupId, Long photoId);

    @Query("SELECT DISTINCT pm.member " +
            "FROM PhotoMember pm " +
            "JOIN pm.member m " +
            "JOIN pm.photo p " +
            "WHERE p.deletedAt IS NULL " +
            "AND p.group.id = :groupId " +
            "AND m IN (" +
            "    SELECT gm.member " +
            "    FROM GroupMember gm " +
            "    WHERE gm.group.id = :groupId " +
            "    AND gm.status = GroupMemberStatus.ACCEPTED" +
            ")")
    List<Member> findMembersByGroupId(Long groupId);

    void deleteAllByPhoto(Photo photo);
}
