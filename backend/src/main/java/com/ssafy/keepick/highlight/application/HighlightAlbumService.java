package com.ssafy.keepick.highlight.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import com.ssafy.keepick.highlight.controller.request.HighlightAlbumCreateRequest;
import com.ssafy.keepick.highlight.controller.request.HighlightScreenshotSaveRequest;
import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumPhotoRepository;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HighlightAlbumService {
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;
    private final HighlightAlbumPhotoRepository highlightAlbumPhotoRepository;
    private final HighlightAlbumRepository highlightAlbumRepository;

    @Transactional
    public HighlightAlbumPhotoDto saveHighlightScreenshot(Long groupId, HighlightScreenshotSaveRequest request) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        Long memberId = AuthenticationUtil.getCurrentUserId();
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_FOUND));

        HighlightAlbumPhoto highlightAlbumPhoto = request.toEntity(member);
        highlightAlbumPhotoRepository.save(highlightAlbumPhoto);
        return HighlightAlbumPhotoDto.from(highlightAlbumPhoto);
    }

    @Transactional
    public HighlightAlbumDto createHighlightAlbum(Long groupId, HighlightAlbumCreateRequest request) {
        // 1. 그룹 확인
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        // 2. 해당 화상 채팅의 스크린샷 가져오기
        List<HighlightAlbumPhoto> photoList = highlightAlbumPhotoRepository.findAllByChatSessionId(request.getChatSessionId());

        // 3. 사진 개수가 0이면 앨범을 만들지 않음
        if (photoList.isEmpty()) {
            throw new BaseException(ErrorCode.NO_SCREENSHOTS_FOUND);
        }

        // 4. 해당 화상회의에서 앨범 생성 요청이 이미 들어온 경우
        String chatSessionId = request.getChatSessionId();
        if (highlightAlbumRepository.existsByChatSessionId(chatSessionId)) {
            throw new BaseException(ErrorCode.ALBUM_ALREADY_EXISTS);
        }

        // 5. 앨범을 만듦
        HighlightAlbum album = HighlightAlbum.builder()
                .chatSessionId(chatSessionId)
                .group(group)
                .name(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .photoCount(photoList.size())
                .build();
        // 6. 스크린샷을 앨범에 포함해서 저장
        album.addPhotos(photoList);
        highlightAlbumRepository.save(album);

        return HighlightAlbumDto.from(album);
    }
}
