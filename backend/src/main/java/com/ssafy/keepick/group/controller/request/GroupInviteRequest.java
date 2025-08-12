package com.ssafy.keepick.group.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GroupInviteRequest {

    @Schema(description = "그룹에 초대할 회원들의 ID 목록", example = "[101, 102, 103]")
    @NotNull(message = "초대 회원 ID 목록은 필수입니다.")
    private List<Long> inviteeIds;
}
