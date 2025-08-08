package com.ssafy.keepick.highlight.presistence;

import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HighlightAlbumRepository extends JpaRepository<HighlightAlbum, Long> {
    boolean existsByChatSessionId(String chatSessionId);

    @Query("SELECT ha " +
            "FROM HighlightAlbum ha " +
            "WHERE ha.group.id = :groupId " +
            "AND ha.deletedAt IS NULL")
    List<HighlightAlbum> findAllByGroupId(Long groupId);

    @Query("SELECT a " +
            "FROM HighlightAlbum a " +
            "LEFT JOIN FETCH a.photos p " +
            "WHERE a.id = :albumId " +
            "AND a.deletedAt IS NULL " +
            "AND (p.deletedAt IS NULL OR p IS NULL)")
    Optional<HighlightAlbum> findWithPhotosByIdAndDeletedAtIsNull(Long albumId);

    List<HighlightAlbum> findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long groupId);

}
