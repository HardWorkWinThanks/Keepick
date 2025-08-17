package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.member.domain.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoTagDto {
    private List<String> tags;
    private List<MemberDto> memberTags;

    @Getter
    @Builder
    public static class MemberDto {
        private Long memberId;
        private String nickname;

        public static MemberDto from(Member member) {
            return MemberDto.builder()
                    .memberId(member.getId())
                    .nickname(member.getNickname())
                    .build();
        }
    }

    public static GroupPhotoTagDto of(List<String> tags, List<Member> members) {
        return GroupPhotoTagDto.builder()
                .tags(tags)
                .memberTags(members.stream().map(MemberDto::from).toList())
                .build();
    }
}
