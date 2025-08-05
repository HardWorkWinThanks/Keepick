package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.group.domain.Group;
import jakarta.persistence.*;
import lombok.*;

@ToString(exclude = "group")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
// 임시 Photo 클래스
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer width;
    private Integer height;

    private String originalUrl;
    private String thumbnailUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

}
