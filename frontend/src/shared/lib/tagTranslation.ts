/**
 * 태그 번역 유틸리티 함수들
 * 영어 태그를 한글로 번역하고 태그 관련 기능을 제공
 */

import { TAG_DICTIONARY, TAG_CATEGORIES } from '../constants/tagDictionary'

/**
 * 영어 태그를 한글로 번역
 * @param englishTag - 번역할 영어 태그
 * @param ignoreUntranslatable - 번역되지 않는 태그는 null 반환 (기본값: false)
 * @returns 한글 번역된 태그 (번역이 없으면 원본 반환 또는 null)
 */
export const translateTag = (englishTag: string, ignoreUntranslatable: boolean = false): string | null => {
  // 정확한 매칭 시도
  if (englishTag in TAG_DICTIONARY) {
    return TAG_DICTIONARY[englishTag as keyof typeof TAG_DICTIONARY]
  }
  
  // 대소문자 무시하고 매칭 시도
  const lowerCaseTag = englishTag.toLowerCase()
  for (const [key, value] of Object.entries(TAG_DICTIONARY)) {
    if (key.toLowerCase() === lowerCaseTag) {
      return value
    }
  }
  
  // 부분 매칭 시도 (예: "wine glass"와 "wine" 매칭)
  for (const [key, value] of Object.entries(TAG_DICTIONARY)) {
    if (key.toLowerCase().includes(lowerCaseTag) || lowerCaseTag.includes(key.toLowerCase())) {
      return value
    }
  }
  
  // 번역이 없을 때 처리
  return ignoreUntranslatable ? null : englishTag
}

/**
 * 태그 배열을 한글로 번역
 * @param englishTags - 영어 태그 배열
 * @param ignoreUntranslatable - 번역되지 않는 태그는 제외 (기본값: false)
 * @returns 한글로 번역된 태그 배열 (번역되지 않는 태그 제외 가능)
 */
export const translateTags = (englishTags: string[], ignoreUntranslatable: boolean = false): string[] => {
  return englishTags
    .map(tag => translateTag(tag, ignoreUntranslatable))
    .filter((tag): tag is string => tag !== null)
}

/**
 * 태그가 번역 가능한지 확인
 * @param tag - 확인할 태그
 * @returns 번역 가능 여부
 */
export const isTranslatable = (tag: string): boolean => {
  return tag in TAG_DICTIONARY || 
         Object.keys(TAG_DICTIONARY).some(key => 
           key.toLowerCase() === tag.toLowerCase()
         )
}

/**
 * 태그의 카테고리 찾기
 * @param englishTag - 영어 태그
 * @returns 해당 태그의 카테고리 (없으면 null)
 */
export const getTagCategory = (englishTag: string): string | null => {
  for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
    if ((tags as readonly string[]).includes(englishTag)) {
      return category
    }
  }
  return null
}

/**
 * 카테고리별로 태그들을 그룹화
 * @param englishTags - 영어 태그 배열
 * @returns 카테고리별로 그룹화된 태그 객체
 */
export const groupTagsByCategory = (englishTags: string[]): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {}
  
  englishTags.forEach(tag => {
    const translatedTag = translateTag(tag, false) // 명시적으로 무시하지 않음
    const category = getTagCategory(tag) || '기타'
    if (!grouped[category]) {
      grouped[category] = []
    }
    // translateTag(tag, false)는 항상 string을 반환하므로 타입 단언 사용
    grouped[category].push(translatedTag as string)
  })
  
  return grouped
}

/**
 * 번역된 태그에서 원본 영어 태그 찾기 (역변환)
 * @param koreanTag - 한글 태그
 * @returns 원본 영어 태그 (찾지 못하면 한글 태그 그대로 반환)
 */
export const findEnglishTag = (koreanTag: string): string => {
  for (const [englishTag, korean] of Object.entries(TAG_DICTIONARY)) {
    if (korean === koreanTag) {
      return englishTag
    }
  }
  return koreanTag
}

/**
 * 딕셔너리에 있는 태그만 번역해서 반환 (번역 불가능한 태그는 무시)
 * @param englishTag - 영어 태그
 * @returns 한글 번역된 태그 또는 null
 */
export const translateTagOrIgnore = (englishTag: string): string | null => {
  return translateTag(englishTag, true)
}

/**
 * 딕셔너리에 있는 태그들만 번역해서 반환 (번역 불가능한 태그들은 제외)
 * @param englishTags - 영어 태그 배열
 * @returns 번역 가능한 태그들만 한글로 번역된 배열
 */
export const translateTagsAndFilter = (englishTags: string[]): string[] => {
  return translateTags(englishTags, true)
}