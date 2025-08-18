'use client'

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { ChevronRight, ChevronDown, Search, Plus, Check, X, User } from 'lucide-react'
import { useMainFriends } from "@/features/main-integration/model/useMainFriends"

interface Friend {
  id: number
  name: string
  avatar?: string
}

interface FriendRequest {
  id: number
  name: string
  avatar?: string
  timestamp: string
}

interface TabItem {
  id: string
  title: string
  content: React.ReactNode
  color: string
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.98,
    position: "absolute" as const,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    position: "absolute" as const,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.98,
    position: "absolute" as const,
  }),
}

const transition = {
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1],
}

export default function FriendsTabWidget() {
  const [selected, setSelected] = React.useState<string>("friends")
  const [direction, setDirection] = React.useState(0)
  const [dimensions, setDimensions] = React.useState({ width: 0, left: 0 })
  const [expandedFriends, setExpandedFriends] = React.useState<number[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResult, setSearchResult] = React.useState<Friend | null>(null)
  const [notificationTab, setNotificationTab] = React.useState<"received" | "sent">("received")

  const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map())
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Keepick 연결 훅 사용
  const {
    friends,
    receivedRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useMainFriends()

  const toggleFriend = (friendId: number) => {
    setExpandedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  // 검색 핸들러를 별도로 분리
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchResult({ id: 999, name: searchQuery })
    }
  }

  const handleFriendRequest = (userId: number) => {
    sendFriendRequest(userId)
    setSearchResult(null)
    setSearchQuery("")
  }

  const handleAcceptRequest = (requestId: number) => {
    acceptFriendRequest(requestId)
  }

  const handleRejectRequest = (requestId: number) => {
    rejectFriendRequest(requestId)
  }

  // 친구 목록 콘텐츠
  const FriendsListContent = () => (
    <div className="h-full overflow-y-auto p-2">
      <div className="space-y-1">
        {friends.map((friend) => (
          <div key={friend.id} className="space-y-1">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-semibold">
                  {friend.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-300">{friend.name}</span>
              </div>
              <button
                onClick={() => toggleFriend(friend.id)}
                className="p-1 rounded hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                {expandedFriends.includes(friend.id) ? (
                  <ChevronDown size={14} className="text-gray-400" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400" />
                )}
              </button>
            </div>

            {/* 드롭다운 */}
            <div className={`ml-11 transition-all duration-200 ease-in-out ${
              expandedFriends.includes(friend.id) 
                ? 'max-h-12 opacity-100' 
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300">
                그룹 초대
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 닉네임 검색 콘텐츠
  const SearchContent = () => (
    <div className="h-full p-3 overflow-y-auto">
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            <Search size={16} className="text-white" />
          </button>
        </form>

        {searchResult && (
          <div className="border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                  {searchResult.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-300">{searchResult.name}</span>
              </div>
              <button
                onClick={() => handleFriendRequest(searchResult.id)}
                className="p-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              >
                <Plus size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // 알림 콘텐츠
  const NotificationContent = () => (
    <div className="h-full p-2 overflow-y-auto">
      {/* 서브 탭 */}
      <div className="flex border-b border-gray-700 mb-3">
        <button
          onClick={() => setNotificationTab("received")}
          className={`flex-1 px-3 py-2 text-xs transition-colors ${
            notificationTab === "received" 
              ? "text-orange-500 border-b-2 border-orange-500" 
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          받은 요청
        </button>
        <button
          onClick={() => setNotificationTab("sent")}
          className={`flex-1 px-3 py-2 text-xs transition-colors ${
            notificationTab === "sent" 
              ? "text-orange-500 border-b-2 border-orange-500" 
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          보낸 요청
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="h-[calc(100%-60px)] overflow-y-auto pr-2">
        {notificationTab === "received" ? (
          <div className="space-y-2">
            {receivedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {request.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">{request.name}</div>
                    <div className="text-xs text-gray-500">{request.timestamp}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="p-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    <Check size={12} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                  {request.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-gray-300">{request.name}</div>
                  <div className="text-xs text-gray-500">{request.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const tabs: TabItem[] = [
    {
      id: "friends",
      title: "👥",
      color: "bg-blue-500",
      content: <FriendsListContent />
    },
    {
      id: "search",
      title: "🔍",
      color: "bg-green-500",
      content: <SearchContent />
    },
    {
      id: "notifications",
      title: "🔔",
      color: "bg-orange-500",
      content: <NotificationContent />
    }
  ]

  // 탭 변경 핸들러
  const handleTabClick = (tabId: string) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === selected)
    const newIndex = tabs.findIndex((tab) => tab.id === tabId)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setSelected(tabId)
  }

  // 선택된 탭 정보
  const selectedTab = tabs.find((tab) => tab.id === selected)

  // 탭 버튼 크기 업데이트
  React.useLayoutEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const containerWidth = containerRect.width - 8 // padding 제외
        const tabWidth = containerWidth / 3 // 정확히 3등분
        const selectedIndex = tabs.findIndex(tab => tab.id === selected)
        
        setDimensions({
          width: tabWidth,
          left: selectedIndex * tabWidth + 4, // padding 4px 추가
        })
      }
    }

    requestAnimationFrame(() => {
      updateDimensions()
    })

    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [selected, tabs])

  return (
    <div className="flex flex-col h-full">
      {/* 탭 바 (상단) */}
      <div
        ref={containerRef}
        className="flex items-center justify-between gap-1 p-1 mb-3 relative bg-gray-800/50 rounded-lg"
      >
        {/* 슬라이딩 배경 */}
        <motion.div
          className={cn("absolute rounded-md z-[1]", selectedTab?.color)}
          initial={false}
          animate={{
            width: dimensions.width - 8,
            x: dimensions.left + 4,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          style={{ height: "calc(100% - 8px)", top: "4px" }}
        />

        <div className="flex w-full gap-1 relative z-[2]">
          {tabs.map((tab) => {
            const isSelected = selected === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) buttonRefs.current.set(tab.id, el)
                  else buttonRefs.current.delete(tab.id)
                }}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center justify-center rounded-md px-3 py-2 flex-1",
                  "text-lg font-medium transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "truncate",
                  isSelected
                    ? "text-white"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
                )}
              >
                <span className="truncate">{tab.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 콘텐츠 영역 (하단) - 애니메이션 제거하고 단순화 */}
      <div className="flex-1 bg-gray-900/20 rounded-lg overflow-hidden">
        <div className="w-full h-full">
          {selectedTab?.content}
        </div>
      </div>
    </div>
  )
}