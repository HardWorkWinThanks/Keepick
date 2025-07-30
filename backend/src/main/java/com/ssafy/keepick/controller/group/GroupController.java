package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.common.response.ApiResponse;
import com.ssafy.keepick.service.group.GroupCommand;
import com.ssafy.keepick.service.group.GroupResult;
import com.ssafy.keepick.service.group.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping("")
    public ApiResponse<?> create(
            @Valid @RequestBody GroupRequest.Create request) {
        GroupCommand.Create command = request.toCommand(1L);
        GroupResult.GroupInfo result = groupService.createGroup(command);
        return ApiResponse.created(GroupResponse.Creation.from(result));
    }

}
