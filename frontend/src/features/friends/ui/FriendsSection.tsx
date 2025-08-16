"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs"
import { FriendsList } from "./FriendsList"
import { FriendSearch } from "./FriendSearch"
import { FriendRequests } from "./FriendRequests"

export function FriendsSection() {
  return (
    <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700">
          <TabsTrigger 
            value="friends" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            My Friends
          </TabsTrigger>
          <TabsTrigger 
            value="search" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            Find Friends
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            Received
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white text-gray-300 font-keepick-primary"
          >
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <FriendsList />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <FriendSearch />
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <FriendRequests type="received" />
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <FriendRequests type="sent" />
        </TabsContent>
      </Tabs>
    </div>
  )
}