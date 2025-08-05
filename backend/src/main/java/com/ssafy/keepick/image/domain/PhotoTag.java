package com.ssafy.keepick.image.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "`photo_tag`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tag;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;

    private PhotoTag(Photo photo, String tag) {
        this.photo = photo;
        this.tag = tag;
    }

    public static PhotoTag of(Photo photo, String tag) {
        return new PhotoTag(photo, tag);
    }
}
