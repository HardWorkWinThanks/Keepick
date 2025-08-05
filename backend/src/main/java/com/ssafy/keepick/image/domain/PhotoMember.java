package com.ssafy.keepick.image.domain;

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
}
