package com.ssafy.keepick.member.application;

import com.ssafy.keepick.external.visionai.VisionAIService;
import com.ssafy.keepick.external.visionai.request.ProfileValidateRequest;
import com.ssafy.keepick.external.visionai.response.ProfileValidateResponse;
import java.util.List;
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
    @Transactional
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

    public MemberDto updateMemberInfoTransactional(MemberUpdateRequest request) {
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        
        Member member = memberRepository.findById(currentUserId)
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_FOUND));
        
        member.updateProfile(request.getNickname(), request.getProfileUrl(), request.getIdentificationUrl());
        memberRepository.save(member);
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
    
    /**
     * 이메일에서 고유한 닉네임을 생성합니다.
     * 기존 닉네임이 있으면 뒤에 순차적으로 증가하는 숫자를 붙여서 고유성을 보장합니다.
     * @param email 이메일 주소
     * @return 고유한 닉네임
     */
    @Transactional
    public String generateUniqueNicknameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }

        String baseNickname = email.substring(0, email.indexOf("@"));
        
        if (baseNickname.trim().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }

        // 기본 닉네임이 사용 가능한지 확인
        if (checkNicknameAvailability(baseNickname)) {
            return baseNickname;
        }

        // 기본 닉네임이 이미 사용 중이면 순차적으로 증가하는 숫자를 붙여서 고유한 닉네임 생성
        List<Member> existingMembers = memberRepository.findByNicknameStartingWith(baseNickname);
        
        // 이미 존재하는 닉네임들에서 숫자 부분을 추출하여 사용 가능한 최소 숫자 찾기
        int nextNumber = 1;
        for (Member member : existingMembers) {
            String existingNickname = member.getNickname();
            if (existingNickname.startsWith(baseNickname)) {
                String suffix = existingNickname.substring(baseNickname.length());
                if (suffix.matches("\\d+")) {
                    int existingNumber = Integer.parseInt(suffix);
                    nextNumber = Math.max(nextNumber, existingNumber + 1);
                }
            }
        }

        // 최대 9999까지 시도 (4자리 숫자)
        int maxNumber = 9999;
        String uniqueNickname;
        
        for (int i = nextNumber; i <= maxNumber; i++) {
            uniqueNickname = baseNickname + i;
            if (checkNicknameAvailability(uniqueNickname)) {
                return uniqueNickname;
            }
        }

        // 모든 숫자를 시도했는데도 사용할 수 없는 경우 타임스탬프 사용
        long timestamp = System.currentTimeMillis() % 10000;
        uniqueNickname = baseNickname + timestamp;
        
        // 타임스탬프도 중복될 수 있으므로 추가 확인
        if (!checkNicknameAvailability(uniqueNickname)) {
            uniqueNickname = baseNickname + (timestamp + 1) % 10000;
        }
        
        return uniqueNickname;
    }
}