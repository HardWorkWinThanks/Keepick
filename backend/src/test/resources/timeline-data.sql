INSERT INTO "group"(id, name) VALUES(100, '테스트그룹');

INSERT INTO timeline_album (
    id, name, description, thumbnail_url, original_url, "group_id",
    start_date, end_date, photo_count,
    created_at, updated_at, deleted_at
) VALUES (
    1, '제주도 수학여행', '3박 4일 간의 추억이 담긴 앨범입니다.',
    'https://example.com/thumb1.jpg',
    'https://example.com/original1.jpg',
    100,
    '2025-04-10', '2025-04-13', 4,
    '2025-04-14 10:00:00', '2025-04-14 11:00:00', NULL
);

INSERT INTO timeline_section (
    id, album_id, name, description, start_date, end_date, sequence
) VALUES
    (1, 1, '1일차 - 도착', '공항 도착 후 해변 산책', '2025-04-10', '2025-04-10', 1),
    (2, 1, '2일차 - 관광', '성산일출봉, 우도 방문', '2025-04-11', '2025-04-11', 2);

INSERT INTO photo (
    id, width, height, original_url, thumbnail_url, "group_id"
) VALUES
    (1, 1920, 1080, 'https://example.com/photo1.jpg', 'https://example.com/thumb1_1.jpg', 100),
    (2, 1920, 1080, 'https://example.com/photo2.jpg', 'https://example.com/thumb1_2.jpg', 100),
    (3, 1920, 1080, 'https://example.com/photo3.jpg', 'https://example.com/thumb2_1.jpg', 100),
    (4, 1920, 1080, 'https://example.com/photo4.jpg', 'https://example.com/thumb2_2.jpg', 100);

INSERT INTO timeline_section_photo (
    id, section_id, photo_id, sequence
) VALUES
    (1, 1, 1, 1),
    (2, 1, 2, 2),
    (3, 2, 3, 1),
    (4, 2, 4, 2);
