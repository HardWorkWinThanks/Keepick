"use client"

import Image from "next/image"
import { Users, UserCheck } from "lucide-react"
import { useFriends } from "../model/useFriends"

export function FriendsList() {
  const { useFriendsList } = useFriends()
  const { data: friends, isLoading, error } = useFriendsList("FRIEND")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 font-keepick-primary">친구 목록을 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400 font-keepick-primary">친구 목록을 불러오는데 실패했습니다.</div>
      </div>
    )
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users size={48} className="text-gray-600 mb-4" />
        <h3 className="text-gray-400 font-keepick-primary text-lg mb-2">아직 친구가 없어요</h3>
        <p className="text-gray-500 text-sm text-center">
           친구 찾기 탭에서 친구를 검색해보세요!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck size={20} className="text-[#FE7A25]" />
        <span className="text-white font-keepick-primary">
          친구 {friends.length}명
        </span>
      </div>

      <div className="grid gap-3">
        {friends.map((friend) => (
          <div
            key={friend.friendshipId}
            className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors"
          >
            {/* 프로필 이미지 */}
            <Image
              src={friend.profileUrl || "/placeholder/basic_profile.webp"}
              alt={`${friend.nickname} 프로필`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover border border-gray-600"
            />

            {/* 친구 정보 */}
            <div className="flex-1">
              <h4 className="text-white font-keepick-primary font-medium">
                {friend.nickname}
              </h4>
              <p className="text-gray-400 text-sm">
                {friend.name}
              </p>
            </div>

            {/* 친구 상태 */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-sm font-keepick-primary">친구</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}