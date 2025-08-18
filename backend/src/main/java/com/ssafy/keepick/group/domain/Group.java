package com.ssafy.keepick.group.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.Objects;

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

    private Group(String name, Member creator) {
        this.name = name;
        this.creator = creator;
    }

    private Group(String name, String description, String groupThumbnailUrl, Member creator) {
        this.name = name;
        this.description = description;
        this.groupThumbnailUrl = groupThumbnailUrl;
        this.creator = creator;
    }

    public static Group createGroup(String name, Member creator) {
        return new Group(name, creator);
    }

    public static Group createGroup(String name, String description, String groupThumbnailUrl, Member creator) {
        return new Group(name, description, groupThumbnailUrl, creator);
    }

    public void increaseMemberCount() {
        this.memberCount++;
    }

    public void decreaseMemberCount() {
        if(memberCount == 0) throw new IllegalStateException();
        this.memberCount--;
    }

    public void update(String name, String description, String groupThumbnailUrl) {
        if (!Objects.equals(this.name, name)) {
            this.name = name;
        }
        if (!Objects.equals(this.description, description)) {
            this.description = description;
        }
        if (!Objects.equals(this.groupThumbnailUrl, groupThumbnailUrl)) {
            this.groupThumbnailUrl = groupThumbnailUrl;
        }
    }

}

