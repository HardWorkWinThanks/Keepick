package com.ssafy.keepick.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // 기본 에러
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.", "B001"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다.", "B002"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다.", "B003"),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다.", "B004"),
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "중복된 리소스입니다.", "B005"),

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다.", "M001"),

    // Group
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 그룹입니다.", "G001"),

    // Group Member
    INVITATION_FORBIDDEN(HttpStatus.FORBIDDEN, "초대 요청을 처리할 권한이 없습니다.", "GM001"),
    INVITATION_NOT_FOUND(HttpStatus.FORBIDDEN, "그룹 초대 요청을 찾을 수 없습니다", "GM002"),
    INVITATION_TOKEN_NOT_FOUND(HttpStatus.FORBIDDEN, "유효하지 않거나 만료된 링크입니다.", "GM003"),
    INVITATION_TOKEN_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "그룹 초대 링크 생성 중 오류가 발생했습니다.", "GM004"),

    // Auth
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다.", "A001"),
    OAUTH2_AUTHENTICATION_FAILED(HttpStatus.UNAUTHORIZED, "OAuth2 인증에 실패했습니다.", "A002"),
    UNSUPPORTED_OAUTH2_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 OAuth2 제공자입니다.", "A003"),
    
    // Refresh Token
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "리프레시 토큰이 존재하지 않거나 만료되었습니다.", "A004"),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "이미 사용된 리프레시 토큰입니다.", "A005"),
    REFRESH_TOKEN_REVOKED(HttpStatus.UNAUTHORIZED, "폐기된 리프레시 토큰입니다.", "A006"),

    // Friend
    FRIENDSHIP_FORBIDDEN(HttpStatus.FORBIDDEN, "친구 요청을 처리할 권한이 없습니다", "F001"),
    FRIENDSHIP_NOT_FOUND(HttpStatus.NOT_FOUND, "친구 요청을 찾을 수 없습니다", "F002"),
    FRIENDSHIP_DUPLICATE(HttpStatus.CONFLICT, "이미 친구인 회원입니다.", "F003"),
    FRIENDSHIP_INCONSISTENT_STATE(HttpStatus.INTERNAL_SERVER_ERROR, "친구 요청 처리 중 오류가 발생했습니다.", "F004"),

    // Photo
    INVALID_FILE(HttpStatus.BAD_REQUEST, "처리할 수 없는 이미지 파일입니다.", "P001"),
    PRESIGNED_URL_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "presigned url 생성에 실패했습니다.", "P002"),
    PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 사진입니다.", "P003"),

    // Album
    ALBUM_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 앨범입니다.", "AB001"),
    ALBUM_PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "앨범에 존재하지 않는 사진입니다.", "AB002"),
    ALBUM_FORBIDDEN(HttpStatus.NOT_FOUND, "앨범을 처리할 권한이 없습니다.", "AB003"),
    ALBUM_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 앨범이 생성되었습니다.", "AB004"),

    //HIGHLIGHT ALBUM
    NO_SCREENSHOTS_FOUND(HttpStatus.BAD_REQUEST, "저장된 스크린샷이 없습니다.", "HAB001"),

    // 시스템 에러
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다.", "S001"),
    INTERNAL_S3_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3 서버에서 발생한 오류입니다.", "S002"),
    INTERNAL_VISION_PARSE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 분석 값을 파싱하는데 실패했습니다.", "S003");

    private final HttpStatus status;
    private final String message;
    private final String code;

}
