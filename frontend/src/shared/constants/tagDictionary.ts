/**
 * 영어 태그를 한글로 번역하는 딕셔너리
 * AI가 생성한 영어 태그들을 사용자 친화적인 한글로 변환
 */

export const TAG_DICTIONARY = {
  // 세계 문화유산
  'Coliseum': '콜로세움',
  'Machu_Picchu': '마추픽추',
  'Statue of Liberty': '자유의여신상',
  'Stonehenge': '스톤헨지',
  'tajimahal': '타지마할',
  'bruj-khalifa': '브루즈할리파',
  'eiffel_tower': '에펠탑',
  'pyramid': '피라미드',

  // 한국 문화유산
  'gyungbokgung': '경복궁',
  'ddp': 'DDP',
  'lottetower': '롯데타워',
  'k-gung': '창덕궁',
  'Yisunshin': '이순신',
  'chumsungdae': '첨성대',

  // 동물
  'Tiger': '호랑이',
  'cat': '고양이',
  'dog': '개',
  'bird': '새',
  'lion': '사자',

  // 운동
  'baseball': '야구',
  'basketball': '농구',
  'football': '축구',
  'skateboard': '스케이트보드',
  'skis': '스키',
  'snowboard': '스노보드',
  'bicycle': '자전거',

  // 음식
  'soju': '소주',
  'beer': '맥주',
  'wine glass': '와인',
  'sushi': '초밥',
  'takoyaki': '타코야끼',
  'bibimbap': '비빔밥',
  'bread': '빵',
  'ramen-noodle': '라멘',
  'udon-noodle': '우동',
  'samgyeopsal': '삼겹살',
  'unagi': '장어',
  'gimbap': '김밥',
  'spaghetti': '스파게티',
  'ganjang-gejang': '간장게장',
  'fried-noodle': '야끼소바',
} as const

// 타입 안전성을 위한 타입 정의
export type EnglishTag = keyof typeof TAG_DICTIONARY
export type KoreanTag = typeof TAG_DICTIONARY[EnglishTag]

// 태그 카테고리별 분류 (선택적 기능)
export const TAG_CATEGORIES = {
  '세계 문화유산': ['Coliseum', 'Machu_Picchu', 'Statue of Liberty', 'Stonehenge', 'tajimahal', 'bruj-khalifa', 'eiffel_tower', 'pyramid'],
  '한국 문화유산': ['gyungbokgung', 'ddp', 'lottetower', 'k-gung', 'Yisunshin', 'chumsungdae'],
  '동물': ['Tiger', 'cat', 'dog', 'bird', 'lion'],
  '운동': ['baseball', 'basketball', 'football', 'skateboard', 'skis', 'snowboard', 'bicycle'],
  '음식': ['soju', 'beer', 'wine glass', 'sushi', 'takoyaki', 'bibimbap', 'bread', 'ramen-noodle', 'udon-noodle', 'samgyeopsal', 'unagi', 'gimbap', 'spaghetti', 'ganjang-gejang', 'fried-noodle'],
} as const