package com.ssafy.keepick.friend.application;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.persistence.FriendshipRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

import static com.ssafy.keepick.global.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public FriendshipDto createFriendRequest(@Valid FriendCreateRequest request, long loginMemberId) {
        Member sender = memberRepository.findById(loginMemberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Member receiver = memberRepository.findById(request.getFriendId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Friendship friendship = Friendship.createFriendship(sender, receiver);
        friendshipRepository.save(friendship);
        FriendshipDto dto = FriendshipDto.from(friendship);
        return dto;
    }

    public FriendshipDto acceptFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = friendshipRepository.findById(requestId).orElseThrow(() -> new BaseException(FRIENDSHIP_NOT_FOUND));
        validateFriendship(friendship, loginMemberId);
        friendship.accept();
        FriendshipDto dto = FriendshipDto.from(friendship);
        return dto;
    }

    private void validateFriendship(Friendship friendship, Long loginMemberId) {
        if (!Objects.equals(friendship.getReceiver().getId(), loginMemberId)) {
            throw new BaseException(FRIENDSHIP_FORBIDDEN);
        }
    }
}
