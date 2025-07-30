package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.service.group.GroupCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class GroupRequest {
    @Getter
    @Builder
    @AllArgsConstructor
    public static class Create {
        @NotBlank
        private String name;
        private List<Long> members;

        public GroupCommand.Create toCommand(Long memberId) {
            return new GroupCommand.Create(memberId, name, members);
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Update {
        @NotBlank
        private String name;
        private String description;
        private String thumbnailUrl;

        public GroupCommand.Update toCommand(Long groupId) {
            return new GroupCommand.Update(groupId, name, description, thumbnailUrl);
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Invite {
        @NotNull
        private List<Long> members;

        public GroupCommand.Invite toCommand(Long groupId) {
            return new GroupCommand.Invite(groupId, members);
        }
    }


}
