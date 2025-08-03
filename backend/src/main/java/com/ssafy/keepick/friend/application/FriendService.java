package com.ssafy.keepick.friend.application;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
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
import java.util.Optional;

import static com.ssafy.keepick.global.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final MemberRepository memberRepository;

    public List<FriendshipDto> getFriendList(Long loginMemberId, FriendStatus status) {
        List<FriendshipDto> dtos = processFriendList(loginMemberId, status);
        return dtos;
    }

    @Transactional
    public FriendshipDto createFriendRequest(@Valid FriendCreateRequest request, long loginMemberId) {
        Member sender = memberRepository.findById(loginMemberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Member receiver = memberRepository.findById(request.getFriendId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        // 선행 요청 있는지 확인 -> 있으면 상대방 혹은 내가 요청한 것이므로 accept
        Optional<Friendship> friendship = friendshipRepository.findBySenderIdAndReceiverId(sender.getId(), receiver.getId());
        Optional<Friendship> reverseFriendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId());
        if (friendship.isPresent()) {
           friendship.get().accept();
           if (reverseFriendship.get().getStatus().equals(FriendshipStatus.ACCEPTED)) return FriendshipDto.from(friendship.get(), receiver, FriendStatus.FRIEND);
           if (reverseFriendship.get().getStatus().equals(FriendshipStatus.REJECTED)) reverseFriendship.get().request();
           else return FriendshipDto.from(friendship.get(), receiver, FriendStatus.SENT);
        }
        // 새로운 요청 생성
        Friendship senderFriendship = Friendship.createFriendship(sender, receiver); senderFriendship.accept();
        Friendship receiverFriendship = Friendship.createFriendship(sender, receiver);
        friendshipRepository.save(senderFriendship);
        friendshipRepository.save(receiverFriendship);
        FriendshipDto dto = FriendshipDto.from(senderFriendship, receiver, FriendStatus.SENT);
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

    private List<FriendshipDto> processFriendList(Long memberId, FriendStatus status) {
        if (status.equals(FriendStatus.FRIEND)) return getMyFriendList(memberId);
        else if (status.equals(FriendStatus.SENT)) return getSentFriendList(memberId);
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
