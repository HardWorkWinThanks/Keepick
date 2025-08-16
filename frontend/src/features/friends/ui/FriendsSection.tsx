"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs"
import { FriendsList } from "./FriendsList"
import { FriendSearch } from "./FriendSearch"
import { FriendRequests } from "./FriendRequests"

export function FriendsSection() {
  return (
    <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 h-[548px]">
      <Tabs defaultValue="friends" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700 flex-shrink-0">
          <TabsTrigger 
            value="friends" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            친구 목록
          </TabsTrigger>
          <TabsTrigger 
            value="search" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            친구 찾기
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            받은 친구 신청
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            보낸 친구 신청
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-6">
          <TabsContent value="friends" className="h-full m-0">
            <FriendsList />
          </TabsContent>

          <TabsContent value="search" className="h-full m-0">
            <FriendSearch />
          </TabsContent>

          <TabsContent value="received" className="h-full m-0">
            <FriendRequests type="received" />
          </TabsContent>

          <TabsContent value="sent" className="h-full m-0">
            <FriendRequests type="sent" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}