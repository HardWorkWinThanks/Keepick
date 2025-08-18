"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, UserPlus, User, AlertCircle } from "lucide-react"
import { getProfilePlaceholder } from "@/shared/constants/placeholders"
import { Input } from "@/shared/ui/shadcn/input"
import { InteractiveHoverButton } from "@/shared/ui/composite/InteractiveHoverButton"
import { useFriends } from "../model/useFriends"
import { useAppSelector } from "@/shared/config/hooks"

export function FriendSearch() {
  const { useSearchUser, useSendFriendRequest } = useFriends()
  const { currentUser } = useAppSelector((state) => state.user)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [friendRequestSuccess, setFriendRequestSuccess] = useState(false)
  const [friendRequestError, setFriendRequestError] = useState<string>("")

  // 검색 실행 여부
  const shouldSearch = hasSearched && searchQuery.trim().length > 0
  
  const { data: searchResult, isLoading: isSearching, error: searchError } = useSearchUser(
    searchQuery.trim(), 
    shouldSearch
  )

  const { mutate: sendFriendRequest, isPending: isSending } = useSendFriendRequest()

  // 검색 실행
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true)
    }
  }

  // 검색어 변경 시 검색 상태 리셋
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    setHasSearched(false)
    setFriendRequestSuccess(false)
    setFriendRequestError("")
  }

  // 친구 요청 성공 메시지 자동 숨김
  useEffect(() => {
    if (friendRequestSuccess) {
      const timer = setTimeout(() => {
        setFriendRequestSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [friendRequestSuccess])

  // 친구 요청 보내기
  const handleSendRequest = () => {
    if (!searchResult) return

    setFriendRequestError("")
    sendFriendRequest(
      { friendId: searchResult.memberId },
      {
        onSuccess: () => {
          setFriendRequestSuccess(true)
          setSearchQuery("")
          setHasSearched(false)
        },
        onError: (error: any) => {
          console.error("친구 요청 실패:", error)
          setFriendRequestError(
            error?.response?.data?.message || 
            "친구 요청을 보내는데 실패했습니다."
          )
        }
      }
    )
  }

  // 본인인지 확인
  const isCurrentUser = searchResult?.memberId === currentUser?.memberId

  return (
    <div className="space-y-6">
      {/* 검색 입력 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-[#FE7A25]" />
          <span className="text-white font-keepick-primary">닉네임으로 친구 찾기</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
          <InteractiveHoverButton
            variant="ghost"
            size="md"
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="px-4 py-2"
          >
            {isSearching ? "검색 중..." : "검색"}
          </InteractiveHoverButton>
        </div>
      </div>

      {/* 성공/에러 메시지 */}
      {friendRequestSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400 text-sm font-keepick-primary">
            ✓ 친구 요청을 성공적으로 보냈습니다!
          </p>
        </div>
      )}

      {friendRequestError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm font-keepick-primary">
            ✗ {friendRequestError}
          </p>
        </div>
      )}

      {/* 검색 결과 */}
      {hasSearched && (
        <div className="border-t border-gray-700 pt-6">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 font-keepick-primary">검색 중...</div>
            </div>
          )}

          {searchError && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle size={48} className="text-gray-600 mb-4" />
              <h3 className="text-gray-400 font-keepick-primary text-lg mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 text-sm text-center">
                입력한 닉네임의 사용자를 찾을 수 없어요
              </p>
            </div>
          )}

          {searchResult && !isSearching && (
            <div className="space-y-4">
              <h3 className="text-white font-keepick-primary text-lg">검색 결과</h3>
              
              <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                {/* 프로필 이미지 */}
                <Image
                  src={getProfilePlaceholder(searchResult.profileUrl)}
                  alt={`${searchResult.nickname} 프로필`}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border border-gray-600"
                />

                {/* 사용자 정보 */}
                <div className="flex-1">
                  <h4 className="text-white font-keepick-primary font-medium text-lg">
                    {searchResult.nickname}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    멤버 ID: {searchResult.memberId}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div>
                  {isCurrentUser ? (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-400 text-sm font-keepick-primary">본인</span>
                    </div>
                  ) : (
                    <InteractiveHoverButton
                      variant="primary"
                      size="md"
                      onClick={handleSendRequest}
                      disabled={isSending}
                      className="px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus size={16} />
                        {isSending ? "요청 중..." : "친구 추가"}
                      </div>
                    </InteractiveHoverButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}