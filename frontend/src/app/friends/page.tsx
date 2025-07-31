"use client"

import { useState } from "react"
import Header from "@/components/layout/header"

export default function FriendsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const friends = [
    { id: 1, name: "김지민", status: "온라인", avatar: "JM", color: "bg-purple-500" },
    { id: 2, name: "이수현", status: "오프라인", avatar: "LS", color: "bg-green-500" },
    { id: 3, name: "박건우", status: "온라인", avatar: "PK", color: "bg-orange-500" },
    { id: 4, name: "최진우", status: "온라인", avatar: "CJ", color: "bg-blue-500" },
    { id: 5, name: "강하늘", status: "오프라인", avatar: "KH", color: "bg-red-500" },
    { id: 6, name: "한선아", status: "온라인", avatar: "HS", color: "bg-[var(--primary-color)]" },
    { id: 7, name: "윤기찬", status: "온라인", avatar: "YK", color: "bg-purple-500" },
  ]

  const groups = [
    { id: 1, name: "가족 모임", members: 5, avatar: "가", color: "bg-green-500" },
    { id: 2, name: "대학 친구들", members: 8, avatar: "대", color: "bg-orange-500" },
    { id: 3, name: "회사 동료", members: 12, avatar: "회", color: "bg-blue-500" },
    { id: 4, name: "스터디 그룹", members: 4, avatar: "스", color: "bg-red-500" },
    { id: 5, name: "여행 동호회", members: 7, avatar: "여", color: "bg-[var(--primary-color)]" },
    { id: 6, name: "취미 모임", members: 6, avatar: "취", color: "bg-purple-500" },
  ]

  const handleSearch = () => {
    console.log("Searching for:", searchTerm)
  }

  const handleAddFriend = () => {
    console.log("Adding friend")
  }

  const handleDeleteFriend = (friendId: number) => {
    console.log("Deleting friend:", friendId)
  }

  const handleInviteToGroup = (groupId: number) => {
    console.log("Inviting to group:", groupId)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] p-6 flex flex-col gap-6">
      <Header variant="app" currentPage="friends" />

      <div className="flex gap-6 flex-1">
        {/* Friends Section */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 flex flex-col">
          <h2 className="font-montserrat text-2xl font-bold text-[var(--text-dark)] mb-6 pb-2 border-b-2 border-[var(--border-color)]">
            친구 관리
          </h2>

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="친구 닉네임 또는 이메일 검색"
                className="flex-1 border border-[var(--border-color)] rounded-2xl px-4 py-3 text-base outline-none focus:border-[var(--primary-color)] transition-colors"
              />
              <button
                onClick={handleSearch}
                className="bg-[var(--primary-color)] text-white px-5 py-3 rounded-2xl font-semibold hover:bg-[#34b09b] transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span className="text-lg">🔍</span>
                검색
              </button>
            </div>
            <button
              onClick={handleAddFriend}
              className="bg-[var(--primary-color)] text-white px-5 py-3 rounded-2xl font-semibold hover:bg-[#34b09b] transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className="text-lg">👥</span>
              친구 추가
            </button>
          </div>

          <h2 className="font-montserrat text-2xl font-bold text-[var(--text-dark)] mb-6 pb-2 border-b-2 border-[var(--border-color)]">
            내 친구 목록
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center p-3 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--card-bg)] transition-colors"
              >
                <div
                  className={`w-11 h-11 ${friend.color} rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4`}
                >
                  {friend.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-[var(--text-dark)] mb-1">{friend.name}</div>
                  <div className="text-sm text-gray-600">{friend.status}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="text-red-500 border border-red-500 px-3 py-2 rounded-2xl text-sm hover:bg-red-500 hover:text-white transition-all hover:-translate-y-0.5 flex items-center gap-1"
                  >
                    <span>❌</span>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups Section */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 flex flex-col">
          <h2 className="font-montserrat text-2xl font-bold text-[var(--text-dark)] mb-6 pb-2 border-b-2 border-[var(--border-color)]">
            내 그룹 목록
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center p-3 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--card-bg)] transition-colors"
              >
                <div
                  className={`w-11 h-11 ${group.color} rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4`}
                >
                  {group.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-[var(--text-dark)] mb-1">{group.name}</div>
                  <div className="text-sm text-gray-600">멤버 {group.members}명</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInviteToGroup(group.id)}
                    className="bg-[var(--primary-color)] text-white border border-[var(--primary-color)] px-3 py-2 rounded-2xl text-sm hover:bg-[#34b09b] transition-all hover:-translate-y-0.5 flex items-center gap-1"
                  >
                    <span>➕</span>
                    초대
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
