package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.external.visionai.response.CompositeAnalysisResponse;
import com.ssafy.keepick.external.visionai.response.SimilarGroupingResponse;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.photo.persistence.PhotoMemberRepository;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.photo.persistence.PhotoTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoAnalysisResultService {
    private final PhotoRepository photoRepository;
    private final PhotoTagRepository photoTagRepository;
    private final MemberRepository memberRepository;
    private final PhotoMemberRepository photoMemberRepository;

    @Transactional
    public void saveGroupingResult(SimilarGroupingResponse response) {
        // 1. 모든 photoId 한 번에 수집
        Set<Long> photoIds = response.getGroups().stream()
                .flatMap(group -> group.getImages().stream())
                .collect(Collectors.toSet());

        // 2. 한번에 조회 후 Map 캐싱
        Map<Long, Photo> photoMap = photoRepository.findAllById(photoIds).stream()
                .collect(Collectors.toMap(Photo::getId, p -> p));

        // 3. clusterId 매핑
        for (SimilarGroupingResponse.Group group : response.getGroups()) {
            Long clusterId = Long.valueOf(group.getGroupId());
            for (Long photoId : group.getImages()) {
                Photo photo = photoMap.get(photoId);
                if (photo == null) throw new BaseException(ErrorCode.NOT_FOUND);
                photo.updateClusterId(clusterId);
            }
        }
        log.info("유사 이미지 분석 내용 데이터베이스 저장 완료");
    }


    @Transactional
    public void saveAnalysisResult(CompositeAnalysisResponse response) {
        Map<Long, Photo> photoMap = loadPhotos(response);
        Map<Long, Member> memberMap = loadMembers(response);

        List<PhotoMember> photoMembers = new ArrayList<>();
        List<PhotoTag> photoTags = new ArrayList<>();

        for (CompositeAnalysisResponse.Result result : response.getResults()) {
            Photo photo = photoMap.get(result.getImageName());
            if (photo == null) throw new BaseException(ErrorCode.NOT_FOUND);

            handleBlur(photo, result);
            handleFaces(photo, result, memberMap, photoMembers);
            handleObjects(photo, result, photoTags);
        }

        if (!photoMembers.isEmpty()) photoMemberRepository.saveAll(photoMembers);
        if (!photoTags.isEmpty()) photoTagRepository.saveAll(photoTags);

        log.info("종합 이미지 분석 내용 데이터베이스 저장 완료");
    }

    private Map<Long, Photo> loadPhotos(CompositeAnalysisResponse response) {
        Set<Long> photoIds = response.getResults().stream()
                .map(CompositeAnalysisResponse.Result::getImageName)
                .collect(Collectors.toSet());

        return photoRepository.findAllById(photoIds).stream()
                .collect(Collectors.toMap(Photo::getId, p -> p));
    }

    private Map<Long, Member> loadMembers(CompositeAnalysisResponse response) {
        Set<Long> memberIds = response.getResults().stream()
                .filter(CompositeAnalysisResponse.Result::isHasFace)
                .flatMap(r -> r.getFoundFaces().stream())
                .map(CompositeAnalysisResponse.FoundFace::getPersonName)
                .collect(Collectors.toSet());

        return memberRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(Member::getId, m -> m));
    }

    private void handleBlur(Photo photo, CompositeAnalysisResponse.Result result) {
        if (result.isBlur()) {
            photo.updateBlurred();
        }
    }

    private void handleFaces(Photo photo, CompositeAnalysisResponse.Result result,
                             Map<Long, Member> memberMap, List<PhotoMember> photoMembers) {
        if (!(result.isHasFace() && result.getFoundFaces() != null && !result.getFoundFaces().isEmpty())) {
            return;
        }

        for (Long memberId : result.getFoundFaces().stream()
                .map(CompositeAnalysisResponse.FoundFace::getPersonName)
                .toList()) {
            Member member = memberMap.get(memberId);
            if (member == null) throw new BaseException(ErrorCode.NOT_FOUND);
            photoMembers.add(PhotoMember.of(photo, member));
        }
    }

    private void handleObjects(Photo photo, CompositeAnalysisResponse.Result result,
                               List<PhotoTag> photoTags) {
        if (result.getObjects() == null || result.getObjects().isEmpty()) {
            return;
        }
        Set<String> uniqueLabels = result.getObjects().stream()
                .map(CompositeAnalysisResponse.ObjectInfo::getLabel)
                .collect(Collectors.toSet());

        for (String label : uniqueLabels) {
            photoTags.add(PhotoTag.of(photo, label));
        }
    }
}
