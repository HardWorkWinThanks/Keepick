package com.ssafy.keepick.highlight.presistence;

import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighlightAlbumPhotoRepository extends JpaRepository<HighlightAlbumPhoto, Long> {
    List<HighlightAlbumPhoto> findAllByChatSessionId(String chatSessionId);
}
