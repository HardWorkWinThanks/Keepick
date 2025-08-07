package com.ssafy.keepick.highlight.domain;

import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
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

    private String photoUrl;

    private HighlightType type;

    // TODO: 인덱스 설정
    private String chatSessionId;

}