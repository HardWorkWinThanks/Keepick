"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { UserCheck, UserX, Clock, Send, Inbox } from "lucide-react"
import { InteractiveHoverButton } from "@/shared/ui/composite/InteractiveHoverButton"
import { useFriends } from "../model/useFriends"

interface FriendRequestsProps {
  type: "received" | "sent"
}

export function FriendRequests({ type }: FriendRequestsProps) {
  const { useFriendsList, useAcceptFriendRequest, useRejectFriendRequest } = useFriends()
  
  const status = type === "received" ? "RECEIVED" : "SENT"
  const { data: requests, isLoading, error } = useFriendsList(status)
  
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest()
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectFriendRequest()

  const [actionSuccess, setActionSuccess] = useState<string>("")
  const [actionError, setActionError] = useState<string>("")

  // 성공 메시지 자동 숨김
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [actionSuccess])

  // 수락 핸들러
  const handleAccept = (friendshipId: number) => {
    setActionError("")
    acceptRequest(friendshipId, {
      onSuccess: () => {
        setActionSuccess("친구 요청을 수락했습니다.")
      },
      onError: (error: any) => {
        console.error("친구 요청 수락 실패:", error)
        setActionError(
          error?.response?.data?.message || 
          "친구 요청 수락에 실패했습니다."
        )
      }
    })
  }

  // 거절 핸들러
  const handleReject = (friendshipId: number) => {
    setActionError("")
    rejectRequest(friendshipId, {
      onSuccess: () => {
        setActionSuccess("친구 요청을 거절했습니다.")
      },
      onError: (error: any) => {
        console.error("친구 요청 거절 실패:", error)
        setActionError(
          error?.response?.data?.message || 
          "친구 요청 거절에 실패했습니다."
        )
      }
    })
  }

  const isReceived = type === "received"
  const title = isReceived ? "받은 친구 요청" : "보낸 친구 요청"
  const emptyMessage = isReceived 
    ? "받은 친구 요청이 없습니다" 
    : "보낸 친구 요청이 없습니다"
  const Icon = isReceived ? Inbox : Send

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 font-keepick-primary">요청 목록을 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400 font-keepick-primary">요청 목록을 불러오는데 실패했습니다.</div>
      </div>
    )
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Icon size={48} className="text-gray-600 mb-4" />
        <h3 className="text-gray-400 font-keepick-primary text-lg mb-2">{emptyMessage}</h3>
        <p className="text-gray-500 text-sm text-center">
          {isReceived 
            ? "새로운 친구 요청이 오면 여기에 표시됩니다" 
            : "다른 사용자에게 친구 요청을 보내보세요"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-[#FE7A25]" />
        <span className="text-white font-keepick-primary">
          {title} {requests.length}개
        </span>
      </div>

      {/* 성공/에러 메시지 */}
      {actionSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400 text-sm font-keepick-primary">
            ✓ {actionSuccess}
          </p>
        </div>
      )}

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm font-keepick-primary">
            ✗ {actionError}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {requests.map((request) => (
          <div
            key={request.friendshipId}
            className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
          >
            {/* 프로필 이미지 */}
            <Image
              src={request.profileUrl || "/placeholder/basic_profile.webp"}
              alt={`${request.nickname} 프로필`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover border border-gray-600"
            />

            {/* 사용자 정보 */}
            <div className="flex-1">
              <h4 className="text-white font-keepick-primary font-medium">
                {request.nickname}
              </h4>
              <p className="text-gray-400 text-sm">
                {request.name}
              </p>
              <p className="text-gray-500 text-xs">
                {new Date(request.requestedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* 상태/액션 */}
            <div className="flex items-center gap-2">
              {isReceived ? (
                // 받은 요청: 수락/거절 버튼
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request.friendshipId)}
                    disabled={isAccepting}
                    className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                    title="수락"
                  >
                    <UserCheck size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleReject(request.friendshipId)}
                    disabled={isRejecting}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                    title="거절"
                  >
                    <UserX size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                // 보낸 요청: 상태 표시
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-yellow-500" />
                  <span className="text-yellow-400 text-sm font-keepick-primary">대기 중</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}