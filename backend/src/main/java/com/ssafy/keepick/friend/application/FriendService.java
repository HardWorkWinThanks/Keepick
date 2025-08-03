package com.ssafy.keepick.friend.application;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.controller.request.FriendRequestStatus;
import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.persistence.FriendshipRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

import static com.ssafy.keepick.global.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final MemberRepository memberRepository;

    public List<FriendshipDto> getFriendList(Long loginMemberId, FriendRequestStatus status) {
        List<FriendshipDto> dtos = processFriendList(loginMemberId, status);
        return dtos;
    }

    @Transactional
    public FriendshipDto createFriendRequest(@Valid FriendCreateRequest request, long loginMemberId) {
        Member sender = memberRepository.findById(loginMemberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Member receiver = memberRepository.findById(request.getFriendId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Friendship friendship = Friendship.createFriendship(sender, receiver);
        friendshipRepository.save(friendship);
        FriendshipDto dto = FriendshipDto.from(friendship, friendship.getReceiver());
        return dto;
    }

    @Transactional
    public FriendshipDto acceptFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = findAndValidateFriendship(requestId, loginMemberId);
        friendship.accept();
        FriendshipDto dto = FriendshipDto.from(friendship, friendship.getSender());
        return dto;
    }

    @Transactional
    public FriendshipDto rejectFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = findAndValidateFriendship(requestId, loginMemberId);
        friendship.reject();
        FriendshipDto dto = FriendshipDto.from(friendship, friendship.getSender());
        return dto;
    }

    private Friendship findAndValidateFriendship(Long requestId, Long memberId) {
        Friendship friendship = friendshipRepository.findByIdWithSender(requestId).orElseThrow(() -> new BaseException(FRIENDSHIP_NOT_FOUND));
        // 로그인한 회원이 받은 친구 요청인지 확인
        if (!Objects.equals(friendship.getReceiver().getId(), memberId)) {
            throw new BaseException(FRIENDSHIP_FORBIDDEN);
        }
        return friendship;
    }

    private List<FriendshipDto> processFriendList(Long memberId, FriendRequestStatus status) {
        if (status.equals(FriendRequestStatus.FRIENDS)) return getMyFriendList(memberId);
        else if (status.equals(FriendRequestStatus.SENT)) return getSentFriendList(memberId);
        else return getReceivedFriendList(memberId); // RECEIVED
    }

    private List<FriendshipDto> getMyFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAcceptedAllByMemberId(memberId);
        List<FriendshipDto> dtos = friendships
                .stream()
                .map(friendship -> {
                    Member friend = friendship.getSender().getId().equals(memberId) ? friendship.getReceiver() : friendship.getSender();
                    return FriendshipDto.from(friendship, friend);
                })
                .toList();
        return dtos;
    }

    private List<FriendshipDto> getSentFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAllWithReceiverBySenderId(memberId);
        List<FriendshipDto> dtos = friendships.stream().map(friendship -> FriendshipDto.from(friendship, friendship.getReceiver())).toList();
        return dtos;
    }

    private List<FriendshipDto> getReceivedFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAllWithSenderByReceiverId(memberId);
        List<FriendshipDto> dtos = friendships.stream().map(friendship -> FriendshipDto.from(friendship, friendship.getSender())).toList();
        return dtos;
    }

}
