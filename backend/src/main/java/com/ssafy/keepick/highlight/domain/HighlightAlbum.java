package com.ssafy.keepick.highlight.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "`highlight_album`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HighlightAlbum extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String chatSessionId;

    private String description;

    private int photoCount;

    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    @OneToMany(mappedBy = "album", cascade = CascadeType.REMOVE)
    private List<HighlightAlbumPhoto>  photos = new ArrayList<>();

    @Builder
    private HighlightAlbum(String name, String chatSessionId, int photoCount, Group group) {
        this.name = name;
        this.chatSessionId = chatSessionId;
        this.photoCount = photoCount;
        this.group = group;
    }


    public void addPhotos(List<HighlightAlbumPhoto> photos) {
        for (HighlightAlbumPhoto photo : photos) {
            photo.addScreenshotToAlbum(this);
            this.photos.add(photo);
        }
    }
}
