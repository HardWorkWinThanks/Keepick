'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/shared/ui/modal/Modal'
import { Input } from '@/shared/ui/shadcn/input'
import { Button } from '@/shared/ui/shadcn/button'
import { GroupCreateApi } from '../api/groupCreateApi'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      setError('그룹 이름을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newGroup = await GroupCreateApi.createGroup({
        name: groupName.trim()
      })

      // 성공 시 그룹 페이지로 이동
      router.push(`/group/${newGroup.groupId}`)
      
      // 모달 초기화
      setGroupName('')
      onClose()
    } catch (error) {
      console.error('그룹 생성 실패:', error)
      setError('그룹 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setGroupName('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="top-center" size="md">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold text-white">새 그룹 만들기</h2>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              추억을 공유하고 싶은 사람들과 함께 하세요!
            </p>
            
            <div className="space-y-2">
              <label htmlFor="groupName" className="text-sm font-medium text-gray-300">
                그룹 이름 지정
              </label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                maxLength={50}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSubmit()
                  }
                }}
              />
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !groupName.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? '생성 중...' : '확인'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}