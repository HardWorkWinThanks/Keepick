package com.ssafy.keepick.photo.persistence;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import com.ssafy.keepick.photo.domain.Photo;

import static com.ssafy.keepick.photo.domain.QPhoto.*;

import com.ssafy.keepick.photo.domain.QPhoto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class PhotoQueryFactoryImpl implements PhotoQueryFactory {
    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public Page<Photo> findAllPhotosByGroupIdAndOption(Pageable pageable, Long groupId, List<Long> memberIds, List<String> tags, LocalDate startDate, LocalDate endDate) {
        List<Photo> photos = jpaQueryFactory
                .selectFrom(photo)
                .where(
                        groupIdEq(groupId),
                        memberIdIn(memberIds),
                        tagIn(tags),
                        takenAtGoe(startDate),
                        takenAtLoe(endDate),
                        notDeleted()
                )
                .orderBy(photo.takenAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // total count
        Long total = jpaQueryFactory
                .select(photo.count())
                .from(photo)
                .where(
                        groupIdEq(groupId),
                        memberIdIn(memberIds),
                        tagIn(tags),
                        takenAtGoe(startDate),
                        takenAtLoe(endDate),
                        notDeleted()
                )
                .fetchOne();

        return new PageImpl<>(photos, pageable, total != null ? total : 0);
    }
    @Override
    public Page<PhotoClusterDto> findSimilarClusters(Long groupId, Pageable pageable) {
        QPhoto photo = QPhoto.photo;
        QPhoto photoSub = new QPhoto("photoSub");

        // 유사한 사진 클러스터 대표 사진 ID 서브쿼리
        JPQLQuery<Long> thumbnailPhotoIdSubquery = JPAExpressions
                .select(photoSub.id.min())
                .from(photoSub)
                .where(photoSub.clusterId.eq(photo.clusterId));

        // 유사한 사진 클러스터 대표 사진 썸네일 서브쿼리
        JPQLQuery<String> thumbnailPhotoUrlSubquery = JPAExpressions
                .select(photoSub.thumbnailUrl)
                .from(photoSub)
                .where(photoSub.id.eq(thumbnailPhotoIdSubquery));

        // 유사한 사진 클러스터 조회
        List<PhotoClusterDto> photos = jpaQueryFactory
                .select(Projections.constructor(
                        PhotoClusterDto.class,
                        photo.clusterId,
                        thumbnailPhotoIdSubquery,
                        thumbnailPhotoUrlSubquery,
                        photo.count().longValue()
                ))
                .from(photo)
                .where(
                        groupIdEq(groupId),
                        clustered(),
                        notDeleted()
                )
                .groupBy(photo.clusterId)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 유사한 사진 클러스터 개수
        Long total = jpaQueryFactory
                .select(photo.clusterId.countDistinct())
                .from(photo)
                .where(
                        groupIdEq(groupId),
                        clustered(),
                        notDeleted()
                )
                .fetchOne();

        return new PageImpl<>(photos, pageable, total != null ? total : 0);
    }

    private BooleanExpression groupIdEq(Long groupId) {
        return photo.group.id.eq(groupId);
    }

    private BooleanExpression memberIdIn(List<Long> memberIds) {
        return memberIds != null && !memberIds.isEmpty()
                ? photo.members.any().member.id.in(memberIds)
                : null;
    }

    private BooleanExpression tagIn(List<String> tags) {
        return tags != null && !tags.isEmpty()
                ? photo.tags.any().tag.in(tags)
                : null;
    }

    private BooleanExpression takenAtGoe(LocalDate startDate) {
        return startDate != null
                ? photo.takenAt.goe(startDate.atStartOfDay())
                : null;
    }

    private BooleanExpression takenAtLoe(LocalDate endDate) {
        return endDate != null
                ? photo.takenAt.loe(endDate.atTime(LocalTime.MAX))
                : null;
    }

    private BooleanExpression notDeleted() {
        return photo.deletedAt.isNull();
    }

    private BooleanExpression clustered() {
        return photo.clusterId.isNotNull();
    }
}
