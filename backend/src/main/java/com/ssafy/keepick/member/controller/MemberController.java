package com.ssafy.keepick.member.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import com.ssafy.keepick.member.controller.response.MemberSearchResponse;
import com.ssafy.keepick.member.controller.response.NicknameCheckResponse;

import lombok.RequiredArgsConstructor;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController implements MemberApiSpec {

    private final MemberService memberService;

    /**
     * 현재 로그인된 사용자의 정보를 조회합니다.
     * 
     * @return 사용자 정보 응답
     */
    @GetMapping("/me")
    @Override
    public ApiResponse<MemberInfoResponse> getCurrentMemberInfo() {
        MemberDto memberDto = memberService.getCurrentMemberInfo();
        MemberInfoResponse response = MemberInfoResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
    
    /**
     * 현재 로그인된 사용자의 정보를 수정합니다.
     * 
     * @param request 수정할 정보 (닉네임, 프로필 이미지 URL, 신분증 이미지 URL 중 최소 하나)
     * @return 수정된 사용자 정보 응답
     */
    @PatchMapping("/me")
    @Override
    public ApiResponse<MemberInfoResponse> updateCurrentMemberInfo(@RequestBody MemberUpdateRequest request) {
        MemberDto memberDto = memberService.updateCurrentMemberInfo(request);
        MemberInfoResponse response = MemberInfoResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
    
    /**
     * 닉네임으로 사용자를 검색합니다.
     * 
     * @param nickname 검색할 닉네임 (쿼리 파라미터, 선택사항)
     * @return 검색된 사용자 정보
     */
    @GetMapping
    @Override
    public ApiResponse<MemberSearchResponse> searchMemberByNickname(
        @RequestParam(required = false, defaultValue = "") String nickname
    ) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER, "닉네임은 필수입니다.");
        }
        
        MemberDto memberDto = memberService.searchMemberByNickname(nickname);
        MemberSearchResponse response = MemberSearchResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
    
    /**
     * 닉네임 중복검사를 수행합니다.
     * 
     * @param nickname 검사할 닉네임 (쿼리 파라미터, 필수)
     * @return 닉네임 사용 가능 여부
     */
    @GetMapping("/check-nickname")
    @Override
    public ApiResponse<NicknameCheckResponse> checkNicknameAvailability(
        @RequestParam String nickname
    ) {
        boolean isAvailable = memberService.checkNicknameAvailability(nickname);
        NicknameCheckResponse response = NicknameCheckResponse.of(nickname, isAvailable);
        return ApiResponse.ok(response);
    }
}