package com.ssafy.keepick.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String nickname;
    private String profileUrl;
    private String identificationUrl;
    private String provider;
    private String providerId;

    private LocalDateTime deletedAt;

    @Builder
    public Member(String name, String email, String nickname, String profileUrl,
                  String provider, String providerId, String identificationUrl) {
        this.name = name;
        this.email = email;
        this.nickname = nickname;
        this.profileUrl = profileUrl;
        this.provider = provider;
        this.providerId = providerId;
        this.identificationUrl = identificationUrl;
    }

}
