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

}
