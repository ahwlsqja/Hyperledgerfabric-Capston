import { LedgerEntryStatus, WithdrawVoteResult } from "src/types";

export const mockVoteStatusAfterFirstApproval: WithdrawVoteResult = {
  entryId: 'LEDGER_1640995200_council001',
  totalVotes: 1,
  approvals: 1,
  rejections: 0,
  result: LedgerEntryStatus.PENDING,
  processedAt: 1640995800,
};

const currentTime = Math.floor(Date.now() / 1000);

// 다양한 투표 상태의 WithdrawVoteResult 예시들

// 1. 투표가 아직 없는 상태 (방금 생성됨)
export const mockVoteStatusNoVotes: WithdrawVoteResult = {
  entryId: 'LEDGER_1640995200_council001',
  totalVotes: 0,
  approvals: 0,
  rejections: 0,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 2. 승인 투표만 있는 상태
export const mockVoteStatusOnlyApprovals: WithdrawVoteResult = {
  entryId: 'LEDGER_1640996000_council002',
  totalVotes: 3,
  approvals: 3,
  rejections: 0,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 3. 거부 투표만 있는 상태
export const mockVoteStatusOnlyRejections: WithdrawVoteResult = {
  entryId: 'LEDGER_1640996800_council003',
  totalVotes: 2,
  approvals: 0,
  rejections: 2,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 4. 승인이 더 많은 상태
export const mockVoteStatusMoreApprovals: WithdrawVoteResult = {
  entryId: 'LEDGER_1640997600_council004',
  totalVotes: 7,
  approvals: 5,
  rejections: 2,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 5. 거부가 더 많은 상태
export const mockVoteStatusMoreRejections: WithdrawVoteResult = {
  entryId: 'LEDGER_1640998400_council005',
  totalVotes: 6,
  approvals: 2,
  rejections: 4,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 6. 동점인 상태
export const mockVoteStatusTied: WithdrawVoteResult = {
  entryId: 'LEDGER_1640999200_council006',
  totalVotes: 6,
  approvals: 3,
  rejections: 3,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 7. 최종 승인된 상태 (FinalizeWithdrawVote 호출 후)
export const mockVoteStatusFinalApproved: WithdrawVoteResult = {
  entryId: 'LEDGER_1641000000_council007',
  totalVotes: 9,
  approvals: 6,
  rejections: 3,
  result: LedgerEntryStatus.APPROVED,
  processedAt: currentTime - 300, // 5분 전에 처리됨
};

// 8. 최종 거부된 상태 (FinalizeWithdrawVote 호출 후)
export const mockVoteStatusFinalRejected: WithdrawVoteResult = {
  entryId: 'LEDGER_1641000800_council008',
  totalVotes: 8,
  approvals: 3,
  rejections: 5,
  result: LedgerEntryStatus.REJECTED,
  processedAt: currentTime - 600, // 10분 전에 처리됨
};

// 9. 투표 기간 만료된 상태 (투표가 있었지만 만료됨)
export const mockVoteStatusExpiredWithVotes: WithdrawVoteResult = {
  entryId: 'LEDGER_1641001600_council009',
  totalVotes: 2,
  approvals: 1,
  rejections: 1,
  result: LedgerEntryStatus.EXPIRED,
  processedAt: currentTime - 900, // 15분 전에 만료됨
};

// 10. 투표 없이 만료된 상태
export const mockVoteStatusExpiredNoVotes: WithdrawVoteResult = {
  entryId: 'LEDGER_1641002400_council010',
  totalVotes: 0,
  approvals: 0,
  rejections: 0,
  result: LedgerEntryStatus.EXPIRED,
  processedAt: currentTime - 1200, // 20분 전에 만료됨
};

// 11. 매우 활발한 투표 상태 (많은 참여)
export const mockVoteStatusHighParticipation: WithdrawVoteResult = {
  entryId: 'LEDGER_1641003200_council011',
  totalVotes: 20,
  approvals: 12,
  rejections: 8,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 12. 근소한 차이로 승인이 앞선 상태
export const mockVoteStatusCloseApproval: WithdrawVoteResult = {
  entryId: 'LEDGER_1641004000_council012',
  totalVotes: 11,
  approvals: 6,
  rejections: 5,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};

// 13. 근소한 차이로 거부가 앞선 상태
export const mockVoteStatusCloseRejection: WithdrawVoteResult = {
  entryId: 'LEDGER_1641004800_council013',
  totalVotes: 9,
  approvals: 4,
  rejections: 5,
  result: LedgerEntryStatus.PENDING,
  processedAt: currentTime,
};