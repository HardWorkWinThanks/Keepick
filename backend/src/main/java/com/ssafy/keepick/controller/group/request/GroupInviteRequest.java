package com.ssafy.keepick.controller.group.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GroupInviteRequest {
    @NotNull
    private List<Long> inviteeIds;
}
