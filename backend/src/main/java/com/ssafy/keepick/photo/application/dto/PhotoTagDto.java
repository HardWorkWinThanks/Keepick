package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.photo.domain.PhotoTag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class PhotoTagDto {

    private List<String> tags;
    private List<String> memberNames;

    public static PhotoTagDto from(List<PhotoTag> photoTags, List<PhotoMember> members) {
        return PhotoTagDto.builder()
                .tags(photoTags.stream().map(PhotoTag::getTag).collect(Collectors.toList()))
                .memberNames(members.stream().map(member -> member.getMember().getNickname()).collect(Collectors.toList()))
                .build();
    }
}
