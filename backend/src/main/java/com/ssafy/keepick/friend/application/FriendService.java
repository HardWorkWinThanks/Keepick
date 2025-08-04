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
        if (status.equals(FriendStatus.FRIEND)) return getMyFriendList(loginMemberId);
        else if (status.equals(FriendStatus.SENT)) return getSentFriendList(loginMemberId);
        else return getReceivedFriendList(loginMemberId); // RECEIVED
    }

    @Transactional
    public FriendshipDto createFriendRequest(@Valid FriendCreateRequest request, long loginMemberId) {
        // 자신에게 친구 요청인 경우
        validateMyself(loginMemberId, request.getFriendId());

        // 회원 조회
        Member sender = memberRepository.findById(loginMemberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Member receiver = memberRepository.findById(request.getFriendId()).orElseThrow(() -> new BaseException(NOT_FOUND));

        // 이미 친구 관계인지 검증
        validateAlreadyFriend(sender, receiver);

        // 이미 친구 요청이 존재하는 경우
        FriendshipDto existingDto = handleExistingFriendship(sender, receiver);
        if(existingDto != null) return existingDto;

        // 새 친구 요청 생성 (양방향으로 관계 저장)
        FriendshipDto newDto = handleNewFriendship(sender, receiver);
        return newDto;
    }

    @Transactional
    public FriendshipDto acceptFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = findAndValidateFriendship(requestId, loginMemberId);
        friendship.accept();
        FriendshipDto dto = FriendshipDto.from(friendship, friendship.getSender(), FriendStatus.FRIEND);
        return dto;
    }

    @Transactional
    public FriendshipDto rejectFriendRequest(Long requestId, Long loginMemberId) {
        Friendship friendship = findAndValidateFriendship(requestId, loginMemberId);
        friendship.reject();
        FriendshipDto dto = FriendshipDto.from(friendship, friendship.getSender(), FriendStatus.RECEIVED);
        return dto;
    }

    private void validateMyself(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) throw new BaseException(INVALID_PARAMETER);
    }

    private void validateAlreadyFriend(Member sender, Member receiver) {
        // 양방향으로 친구 관계가 있는지 확인
        if (friendshipRepository.existsAcceptedFriendshipBetween(sender.getId(), receiver.getId())
                && friendshipRepository.existsAcceptedFriendshipBetween(receiver.getId(), sender.getId()))
            throw new BaseException(FRIENDSHIP_DUPLICATE);
    }

    private FriendshipDto handleExistingFriendship(Member sender, Member receiver) {
        Optional<Friendship> optionalFriendship = friendshipRepository.findBySenderIdAndReceiverId(sender.getId(), receiver.getId());
        // 기존 친구 요청이 있는지 확인
        if (optionalFriendship.isPresent()) {
            // sender -> receiver 요청 수락
            Friendship friendship = optionalFriendship.get();
            friendship.accept();
            
            // receiver -> sender 요청 처리
            Friendship reverseFriendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId())
                    .orElseThrow(() -> new BaseException(FRIENDSHIP_INCONSISTENT_STATE)); // 역방향 친구 관계가 없을 경우 오류
            // sender <-> receiver 상호 수락이면 친구 상태로 반환
            if(reverseFriendship.getStatus().equals(FriendshipStatus.ACCEPTED))
                return FriendshipDto.from(friendship, receiver, FriendStatus.FRIEND);
            // 거절이면 요청 상태로 바꿔서 반환
            if(reverseFriendship.getStatus().equals(FriendshipStatus.REJECTED))
                reverseFriendship.request();
            return FriendshipDto.from(friendship, receiver, FriendStatus.SENT);
        }
        return null;
    }

    private FriendshipDto handleNewFriendship(Member sender, Member receiver) {
        // sender -> receiver로 요청 생성 & 수락
        Friendship senderFriendship = Friendship.createFriendship(sender, receiver);
        senderFriendship.accept();

        // receiver -> sender로 요청 생성
        Friendship receiverFriendship = Friendship.createFriendship(receiver, sender);

        friendshipRepository.save(senderFriendship);
        friendshipRepository.save(receiverFriendship);

        // 친구 요청함 상태로 반환
        return FriendshipDto.from(senderFriendship, receiver, FriendStatus.SENT);
    }

    private Friendship findAndValidateFriendship(Long requestId, Long memberId) {
        Friendship friendship = friendshipRepository.findWithSenderById(requestId).orElseThrow(() -> new BaseException(FRIENDSHIP_NOT_FOUND));
        // 로그인한 회원이 받은 친구 요청인지 확인
        if (!Objects.equals(friendship.getSender().getId(), memberId)) {
            throw new BaseException(FRIENDSHIP_FORBIDDEN);
        }
        return friendship;
    }

    private List<FriendshipDto> getMyFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findAcceptedAllByMemberId(memberId);
        List<FriendshipDto> dtos = friendships.stream().map(friendship -> FriendshipDto.from(friendship, friendship.getSender(), FriendStatus.FRIEND)).toList();
        return dtos;
    }

    private List<FriendshipDto> getSentFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findSentAllByMemberId(memberId);
        List<FriendshipDto> dtos = friendships.stream().map(friendship -> FriendshipDto.from(friendship, friendship.getSender(), FriendStatus.SENT)).toList();
        return dtos;
    }

    private List<FriendshipDto> getReceivedFriendList(Long memberId) {
        List<Friendship> friendships = friendshipRepository.findReceivedAllByMemberId(memberId);
        List<FriendshipDto> dtos = friendships.stream().map(friendship -> FriendshipDto.from(friendship, friendship.getReceiver(), FriendStatus.RECEIVED)).toList();
        return dtos;
    }

}
