"use client"

import { GroupSpaceView } from "@/features/group-space"
import { FriendsTab } from "@/features/friend-management"
import type { Group } from "@/entities/group"

interface GroupSpaceWidgetProps {
  group: Group
  showSidebar?: boolean
}

export default function GroupSpaceWidget({ group, showSidebar = false }: GroupSpaceWidgetProps) {
  return (
    <div className="flex min-h-screen bg-[#222222]">
      {/* Main Group Space */}
      <div className={`${showSidebar ? 'flex-1' : 'w-full'}`}>
        <GroupSpaceView group={group} />
      </div>

      
    </div>
  )
}