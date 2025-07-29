package com.ssafy.keepick.member.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "profile_url")
    private String profileUrl;

    @Column(nullable = false)
    private String provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "identification_url")
    private String identificationUrl;

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
    
    /**
     * 소셜 로그인 시 프로필 정보 업데이트
     * @param name 최신 이름
     * @param profileUrl 최신 프로필 이미지 URL
     * @return 업데이트가 발생했는지 여부
     */
    public boolean updateSocialProfile(String name, String profileUrl) {
        boolean updated = false;
        
        if (name != null && !name.equals(this.name)) {
            this.name = name;
            updated = true;
        }
        
        if (!isEqual(this.profileUrl, profileUrl)) {
            this.profileUrl = profileUrl;
            updated = true;
        }
        
        return updated;
    }
    
    /**
     * 두 문자열이 같은지 null-safe하게 비교
     */
    private boolean isEqual(String str1, String str2) {
        if (str1 == null && str2 == null) return true;
        if (str1 == null || str2 == null) return false;
        return str1.equals(str2);
    }
}
