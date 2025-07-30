package com.ssafy.keepick.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Entity
@Table(name = "`group`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Group extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;
    private String groupThumbnailUrl;

    @ColumnDefault("0")
    private Integer memberCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member creator;

    public Group(String name) {
        this.name = name;
    }

    public Group(String name, Member member) {
        this.name = name;
        this.creator = member;
    }

    public void increaseMemberCount() {
        this.memberCount++;
    }

    public void decreaseMemberCount() {
        this.memberCount--;
    }

    public void update(String name, String description, String groupThumbnailUrl) {
        this.name = name;
        this.description = description;
        this.groupThumbnailUrl = groupThumbnailUrl;
    }

}

