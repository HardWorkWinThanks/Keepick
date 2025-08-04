package com.ssafy.keepick.friend.application;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.persistence.FriendshipRepository;
import com.ssafy.keepick.member.persistence.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final MemberRepository memberRepository;

    public List<FriendshipDto> getFriendList(Long loginMemberId, FriendStatus status) {
        return switch (status) {
            case FriendStatus.FRIEND -> getMyFriendList(loginMemberId);
            case FriendStatus.SENT -> getSentFriendList(loginMemberId);
            case FriendStatus.RECEIVED -> getReceivedFriendList(loginMemberId);
        };
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
