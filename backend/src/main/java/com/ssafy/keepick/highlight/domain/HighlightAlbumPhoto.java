package com.ssafy.keepick.highlight.domain;

import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "`highlight_album_photo`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HighlightAlbumPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private HighlightAlbum album;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    private LocalDateTime takenAt;

    private String description;

    private LocalDateTime deletedAt;

    @Column(length = 500)
    private String photoUrl;

    private HighlightType type;

    // TODO: 인덱스 설정
    private String chatSessionId;

    @Builder
    private HighlightAlbumPhoto(Member member, LocalDateTime takenAt, String photoUrl, HighlightType type, String chatSessionId) {
        this.member = member;
        this.takenAt = takenAt;
        this.photoUrl = photoUrl;
        this.type = type;
        this.chatSessionId = chatSessionId;
    }

    public void addScreenshotToAlbum(HighlightAlbum album) {
        this.album = album;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

}