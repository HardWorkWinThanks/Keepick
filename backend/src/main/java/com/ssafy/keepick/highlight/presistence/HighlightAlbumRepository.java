package com.ssafy.keepick.highlight.presistence;

import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HighlightAlbumRepository extends JpaRepository<HighlightAlbum, Long> {
    boolean existsByChatSessionId(String chatSessionId);
}
