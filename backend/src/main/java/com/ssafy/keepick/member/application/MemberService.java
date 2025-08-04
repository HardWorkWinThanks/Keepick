package com.ssafy.keepick.member.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {
    
    private final MemberRepository memberRepository;
    
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
}