package com.ssafy.keepick.service.group;

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

}
