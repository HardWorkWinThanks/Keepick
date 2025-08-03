package com.ssafy.keepick.friend.application;

import com.ssafy.keepick.friend.application.dto.FriendDto;
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

    public List<FriendDto> getFriendList(Long loginMemberId, FriendRequestStatus status) {
        List<FriendDto> dtos = processFriendList(loginMemberId, status);
        return dtos;
    }

    @Transactional
    public FriendshipDto createFriendRequest(@Valid FriendCreateRequest request, long loginMemberId) {
        Member sender = memberRepository.findById(loginMemberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Member receiver = memberRepository.findById(request.getFriendId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Friendship friendship = Friendship.createFriendship(sender, receiver);
        friendshipRepository.save(friendship);
        FriendshipDto dto = FriendshipDto.from(friendship);
        return dto;
    }

    @Transactional
    public FriendshipDto acceptFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = friendshipRepository.findByIdWithSender(requestId).orElseThrow(() -> new BaseException(FRIENDSHIP_NOT_FOUND));
        validateFriendship(friendship, loginMemberId);
        friendship.accept();
        FriendshipDto dto = FriendshipDto.fromWithSenderOnly(friendship);
        return dto;
    }

    @Transactional
    public FriendshipDto rejectFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = friendshipRepository.findByIdWithSender(requestId).orElseThrow(() -> new BaseException(FRIENDSHIP_NOT_FOUND));
        validateFriendship(friendship, loginMemberId);
        friendship.reject();
        FriendshipDto dto = FriendshipDto.fromWithSenderOnly(friendship);
        return dto;
    }

    private void validateFriendship(Friendship friendship, Long loginMemberId) {
        if (!Objects.equals(friendship.getReceiver().getId(), loginMemberId)) {
            throw new BaseException(FRIENDSHIP_FORBIDDEN);
        }
    }

    private List<FriendDto> processFriendList(Long memberId, FriendRequestStatus status) {
        if (status.equals(FriendRequestStatus.FRIENDS)) return getMyFriendList(memberId);
        else if (status.equals(FriendRequestStatus.SENT)) return getSentFriendList(memberId);
        else return getReceivedFriendList(memberId); // RECEIVED
    }

    private List<FriendDto> getMyFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAcceptedAllByMemberId(memberId);
        List<FriendDto> dtos = friendships
                .stream()
                .map(friendship -> {
                    Member friend = friendship.getSender().getId().equals(memberId) ? friendship.getReceiver() : friendship.getSender();
                    return FriendDto.from(friendship, friend);
                })
                .toList();
        return dtos;
    }

    private List<FriendDto> getSentFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAllWithReceiverBySenderId(memberId);
        List<FriendDto> dtos = friendships.stream().map(friendship -> FriendDto.from(friendship, friendship.getReceiver())).toList();
        return dtos;
    }

    private List<FriendDto> getReceivedFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAllWithSenderByReceiverId(memberId);
        List<FriendDto> dtos = friendships.stream().map(friendship -> FriendDto.from(friendship, friendship.getSender())).toList();
        return dtos;
    }

}
