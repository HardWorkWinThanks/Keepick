package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.photo.domain.Photo;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo,Long>, PhotoQueryFactory {

    @Modifying
    @Query("UPDATE Photo p " +
            "SET p.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE p.id IN :ids")
    void softDeleteAllById(@Param("ids") List<Long> ids);

    @Query(value = "SELECT p.* " +
            "FROM photo p " +
            "JOIN group_member gm ON p.group_id = gm.group_id " +
            "WHERE gm.member_id = :memberId " +
            "AND p.deleted_at IS NULL " +
            "ORDER BY p.created_at DESC " +
            "LIMIT :size OFFSET :offset", nativeQuery = true)
    List<Photo> findRandomByMemberId(@Param("memberId") Long memberId, @Param("size")  int size, @Param("offset") int offset);

    @Query("SELECT COUNT(*) " +
            "FROM Photo p " +
            "JOIN GroupMember gm ON p.group = gm.group " +
            "WHERE gm.member.id = :memberId " +
            "  AND p.deletedAt IS NULL")
    Integer countByMemberId(@Param("memberId") Long memberId);
}
