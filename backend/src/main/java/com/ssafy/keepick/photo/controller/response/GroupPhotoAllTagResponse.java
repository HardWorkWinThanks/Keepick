package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoTagDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoAllTagResponse {
    private List<String> tags;
    private List<Member> members;

    @Getter
    @Builder
    public static class Member {
        private Long memberId;
        private String nickname;

        public static Member from(GroupPhotoTagDto.MemberDto dto) {
            return Member.builder()
                    .memberId(dto.getMemberId())
                    .nickname(dto.getNickname())
                    .build();
        }
    }

    public static GroupPhotoAllTagResponse from(GroupPhotoTagDto tags) {
        return GroupPhotoAllTagResponse.builder()
                .tags(tags.getTags().stream().map(String::toString).toList())
                .members(tags.getMemberTags().stream().map(Member::from).toList())
                .build();
    }
}
