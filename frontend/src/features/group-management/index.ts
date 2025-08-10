// API
export { GroupManagementApi } from './api/groupManagementApi'

// Hooks & Models  
export {
  useGroupManagement,
  useMyGroups,
  useGroupInfo,
  useGroupMembers,
  groupQueryKeys
} from './model/useGroupManagement'

// UI Components
export { default as CreateGroupModal } from './ui/CreateGroupModal'
export { default as LeaveGroupModal } from './ui/LeaveGroupModal'

// Re-export from entities for convenience
export type { 
  Group, 
  GroupListItem, 
  GroupMember, 
  CreateGroupFormData, 
  UpdateGroupFormData 
} from '@/entities/group'