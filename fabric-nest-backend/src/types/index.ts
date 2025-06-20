// Organization types
export enum OrganizationType {
    STUDENT = 'STUDENT',
    STUDENT_COUNCIL = 'STUDENT_COUNCIL',
  }
  
  export enum MembershipStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
  }
  
  export interface MembershipRequest {
    id: string;
    applicantId: string;
    applicantName: string;
    organizationType: OrganizationType;
    status: MembershipStatus;
    approvals: string[];
    rejections: string[];
    timestamp: number;
    expiryTime?: number;
  }
  
  export interface StudentMember {
    id: string;
    name: string;
    joinedAt: number;
  }
  
  export interface CouncilMember {
    id: string;
    name: string;
    role: string;
    joinedAt: number;
  }
  
  // Ledger types
  export enum LedgerEntryType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
  }
  
  export enum LedgerEntryStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
  }
  
  export interface LedgerEntry {
    id: string;
    theme: string;
    amount: number;
    entryType: LedgerEntryType;
    status: LedgerEntryStatus;
    approvedBy?: string;
    createdBy: string;
    creatorName: string;
    timestamp: number;
    description: string;
    approvals: string[];
    rejections: string[];
    documentURL?: string;
  }

  // LedgerEntry 인터페이스 (지출 전용)
export interface WithdrawLedgerEntry {
  id: string;
  theme: string;
  amount: number;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  approvedBy: string;
  createdBy: string;
  creatorName: string;
  timestamp: number;
  expiryTime: number;          // 지출은 1시간 유효기간 있음
  description: string;
  approvals: string[];         // 학생들의 승인 투표
  rejections: string[];        // 학생들의 거부 투표
  documentURL?: string;
}
  
  export interface ThemeBalance {
    theme: string;
    totalDeposit: number;
    totalWithdraw: number;
    currentBalance: number;
    lastUpdated: number;
  }
  
  export interface WithdrawVoteResult {
    entryId: string;
    totalVotes: number;
    approvals: number;
    rejections: number;
    result: LedgerEntryStatus
    processedAt: number; // Unix timestamp
  }
  
  // Firebase types
  export interface UserCredentials {
    credentials: {
      certificate: string;
      privateKey: string;
    };
    mspId: string;
    type: string;
  }
  
  export interface UserInfo {
    userId: string;
    name: string;
    orgType: OrganizationType;
    orgMSP: string;
    registeredAt: string;
    createdAt?: any; // Firestore timestamp
    updatedAt?: any; // Firestore timestamp
  }
  
  // Redis message types
  export interface MembershipApprovalMessage {
    requestId: string;
    approverId: string;
  }
  
  export interface MembershipRejectionMessage {
    requestId: string;
    rejectorId: string;
  }
  
  export interface DepositApprovalMessage {
    ledgerEntryId: string;
    approverId: string;
  }
  
  export interface DepositRejectionMessage {
    ledgerEntryId: string;
    rejectorId: string;
  }
  
  export interface WithdrawVoteMessage {
    ledgerEntryId: string;
    voterId: string;
    vote: 'approve' | 'reject';
  }
  
  export interface WithdrawFinalizeMessage {
    ledgerEntryId: string;
    finalizerId: string;
  }
  
  // Response types
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
  }

  export interface RegisterCache {
    id: string,
    userId: string,
    name: string,
    orgType: OrganizationType,
    status: MembershipStatus,
    timestamp: any
  }