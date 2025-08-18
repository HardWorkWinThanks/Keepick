"use client"

import { useState } from "react"
import type { Friend, FriendRequest } from "@/entities/friend"

export function useFriends() {
  const [expandedFriends, setExpandedFriends] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<Friend | null>(null)
  const [notificationTab, setNotificationTab] = useState<"received" | "sent">("received")

  const friends: Friend[] = [
    { id: 1, name: "김철수" },
    { id: 2, name: "이영희" },
    { id: 3, name: "박민수" },
    { id: 4, name: "정수진" },
    { id: 5, name: "최영호" },
    { id: 6, name: "한미영" },
    { id: 7, name: "조성민" },
    { id: 8, name: "윤지혜" },
  ]

  const receivedRequests: FriendRequest[] = [
    { id: 1, name: "신동현", timestamp: "2시간 전" },
    { id: 2, name: "배수지", timestamp: "1일 전" },
  ]

  const sentRequests: FriendRequest[] = [
    { id: 1, name: "강호동", timestamp: "3시간 전" },
    { id: 2, name: "유재석", timestamp: "2일 전" },
  ]

  const toggleFriend = (friendId: number) => {
    setExpandedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchResult({ id: 999, name: searchQuery })
    }
  }

  const handleFriendRequest = (userId: number) => {
    console.log(`친구 요청 보내기: ${userId}`)
    setSearchResult(null)
    setSearchQuery("")
  }

  const handleAcceptRequest = (requestId: number) => {
    console.log(`친구 요청 승인: ${requestId}`)
  }

  const handleRejectRequest = (requestId: number) => {
    console.log(`친구 요청 거절: ${requestId}`)
  }

  return {
    friends,
    receivedRequests,
    sentRequests,
    expandedFriends,
    searchQuery,
    setSearchQuery,
    searchResult,
    notificationTab,
    setNotificationTab,
    toggleFriend,
    handleSearchSubmit,
    handleFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
  }
}