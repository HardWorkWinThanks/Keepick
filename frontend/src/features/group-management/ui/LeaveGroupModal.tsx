'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/shared/ui/modal/Modal'
import { Button } from '@/shared/ui/shadcn/button'
import { Alert, AlertDescription } from '@/shared/ui/shadcn/alert'
import { useGroupManagement } from '../model/useGroupManagement'
import type { GroupListItem } from '@/entities/group'

interface LeaveGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: GroupListItem
}

export default function LeaveGroupModal({ isOpen, onClose, group }: LeaveGroupModalProps) {
  const { deleteGroup } = useGroupManagement()

  const handleLeaveGroup = async () => {
    try {
      await deleteGroup.mutateAsync(group.groupId)
      onClose()
    } catch (error) {
      // 에러는 useGroupManagement에서 이미 처리됨 (토스트 메시지 표시)
      console.error('그룹 탈퇴 실패:', error)
    }
  }

  const handleClose = () => {
    if (deleteGroup.isPending) return
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="md">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {group.name} 그룹을 탈퇴하시겠습니까?
          </h2>
        </ModalHeader>
        
        <ModalBody>
          <Alert variant="destructive" className="bg-red-900/20 border-red-400/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              탈퇴 시 다시 초대받기 전까지는 그룹에 들어올 수 없으며, 
              기존 그룹에 있던 앨범/사진도 확인이 불가합니다.
            </AlertDescription>
          </Alert>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteGroup.isPending}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            취소
          </Button>
          <Button
            onClick={handleLeaveGroup}
            disabled={deleteGroup.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteGroup.isPending ? '탈퇴 중...' : '확인'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}