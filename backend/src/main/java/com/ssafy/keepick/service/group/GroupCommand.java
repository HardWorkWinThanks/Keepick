package com.ssafy.keepick.service.group;

import com.ssafy.keepick.entity.GroupMemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class GroupCommand {

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Create {
        private Long memberId;
        private String name;
        private List<Long> members;
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class MyGroup {
        private Long memberId;
        private GroupMemberStatus status;
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Update {
        private Long groupId;
        private String name;
        private String description;
        private String thumbnailUrl;
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Leave {
        private Long groupId;
        private Long memberId;
    }

}
