package com.ssafy.keepick.member.application;

import com.ssafy.keepick.external.visionai.VisionAIService;
import com.ssafy.keepick.external.visionai.request.ProfileValidateRequest;
import com.ssafy.keepick.external.visionai.response.ProfileValidateResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {
    
    private final MemberRepository memberRepository;
    private final VisionAIService  visionAIService;
    
    /**
     * 현재 로그인된 사용자의 정보를 조회합니다.
     * @return 사용자 정보 응답 DTO
     */
    public MemberDto getCurrentMemberInfo() {
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        
        Member member = memberRepository.findById(currentUserId)
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_FOUND));
        
        return MemberDto.from(member);
    }
    
    /**
     * 현재 로그인된 사용자의 정보를 수정합니다.
     * AI 식별용 이미지 검증에 실패한 경우 오류를 반환합니다.
     * @param request 수정할 정보
     * @return 수정된 사용자 정보 응답 DTO
     */
    public MemberDto updateCurrentMemberInfo(MemberUpdateRequest request) {
        if (!request.hasAnyUpdate()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        // 트랜잭션 밖: 이미지 검증
        if (request.getProfileUrl() != null && !request.getProfileUrl().isEmpty()) {
            ProfileValidateRequest validateRequest = ProfileValidateRequest.of(request.getIdentificationUrl(), currentUserId.toString());
            ProfileValidateResponse response = visionAIService.postProfileValidateRequest(validateRequest);
            if (!response.isValid()) {
                throw new BaseException(ErrorCode.INVALID_MEMBER_IMAGE, response.getMessage());
            }
        }

        // 트랜잭션 안: DB 업데이트
        return updateMemberInfoTransactional(request);
    }

    @Transactional
    protected MemberDto updateMemberInfoTransactional(MemberUpdateRequest request) {
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        
        Member member = memberRepository.findById(currentUserId)
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_FOUND));
        
        member.updateProfile(request.getNickname(), request.getProfileUrl(), request.getIdentificationUrl());
        
        return MemberDto.from(member);
    }
    
    /**
     * 닉네임으로 사용자를 검색합니다.
     * @param nickname 검색할 닉네임
     * @return 검색된 사용자 정보
     */
    public MemberDto searchMemberByNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        
        Member member = memberRepository.findByNickname(nickname.trim())
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_FOUND));
        
        return MemberDto.from(member);
    }
    
    /**
     * 닉네임 중복검사를 수행합니다.
     * @param nickname 검사할 닉네임
     * @return 사용 가능 여부 (true: 사용 가능, false: 이미 사용 중)
     */
    public boolean checkNicknameAvailability(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        
        // 닉네임이 존재하지 않으면 사용 가능
        return !memberRepository.findByNickname(nickname.trim()).isPresent();
    }
}