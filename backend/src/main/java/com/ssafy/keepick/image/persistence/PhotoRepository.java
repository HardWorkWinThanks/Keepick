package com.ssafy.keepick.image.persistence;

import com.ssafy.keepick.image.domain.Photo;
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

    @Query("SELECT p " +
            "FROM Photo p " +
            "JOIN GroupMember gm ON p.group = gm.group " +
            "WHERE gm.member.id = :memberId " +
            "AND p.deletedAt is null " +
            "ORDER BY p.createdAt DESC " +
            "LIMIT :size")
    List<Photo> findRandomByMemberId(@Param("memberId") Long memberId, @Param("size")  int size);
}
