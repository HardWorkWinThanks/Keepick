package com.ssafy.keepick.photo.domain;

import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "`photo_member`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    private PhotoMember(Photo photo, Member member) {
        this.photo = photo;
        this.member = member;
    }

    public static PhotoMember of(Photo photo, Member member) {
        return new PhotoMember(photo, member);
    }
}
