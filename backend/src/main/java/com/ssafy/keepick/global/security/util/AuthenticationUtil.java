package com.ssafy.keepick.global.security.util;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuthenticationUtil {
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }

        CustomOAuth2Member userDetails = (CustomOAuth2Member) authentication.getPrincipal();
        return userDetails.getMemberId();
    }
}
