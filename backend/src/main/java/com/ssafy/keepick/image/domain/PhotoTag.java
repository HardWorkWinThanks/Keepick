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

    private Tag tag;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;
}
