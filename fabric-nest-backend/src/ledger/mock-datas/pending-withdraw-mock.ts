import { LedgerEntryStatus, LedgerEntryType, WithdrawLedgerEntry } from "src/types";

// 현재 시간 기준 (예시용)
const currentTime = Math.floor(Date.now() / 1000);
const oneHourLater = currentTime + 3600; // 1시간 후

// 보류 중인 지출 내역들 (학생회 구성원이 작성, 아직 만료되지 않음)
export const mockPendingWithdrawEntries: WithdrawLedgerEntry[] = [
  {
    id: 'LEDGER_1640995200_council001',
    theme: '동아리 활동비',
    amount: 80000,
    entryType: LedgerEntryType.WITHDRAW,
    status: LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council001',
    creatorName: '학생회장 김철수',
    timestamp: currentTime - 1800, // 30분 전 생성
    expiryTime: currentTime + 1800, // 30분 후 만료
    description: '밴드 동아리 악기 렌탈비',
    approvals: ['student001', 'student002'], // 2명 승인
    rejections: ['student003'], // 1명 거부
    documentURL: 'https://s3.example.com/withdraw_receipt001.pdf',
  },
  {
    id: 'LEDGER_1640996000_council002',
    theme: '행사비',
    amount: 150000,
    entryType: LedgerEntryType.WITHDRAW,
    status: LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council002',
    creatorName: '부학생회장 이영희',
    timestamp: currentTime - 1200, // 20분 전 생성
    expiryTime: currentTime + 2400, // 40분 후 만료
    description: '신입생 환영회 케이터링 비용',
    approvals: ['student004', 'student005', 'student006'], // 3명 승인
    rejections: [], // 거부 없음
    documentURL: 'https://s3.example.com/withdraw_receipt002.pdf',
  },
  {
    id: 'LEDGER_1640996800_council003',
    theme: '복리후생비',
    amount: 60000,
    entryType: LedgerEntryType.WITHDRAW,
    status:LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council003',
    creatorName: '총무 박민수',
    timestamp: currentTime - 900, // 15분 전 생성
    expiryTime: currentTime + 2700, // 45분 후 만료
    description: '학생 휴게실 간식 구입',
    approvals: ['student007'], // 1명 승인
    rejections: ['student008', 'student009'], // 2명 거부
    documentURL: 'https://s3.example.com/withdraw_receipt003.pdf',
  },
  {
    id: 'LEDGER_1640997600_council004',
    theme: '장학금',
    amount: 200000,
    entryType: LedgerEntryType.WITHDRAW,
    status: LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council004',
    creatorName: '학생회 서기 정수진',
    timestamp: currentTime - 600, // 10분 전 생성
    expiryTime: currentTime + 3000, // 50분 후 만료
    description: '학업우수 장학금 지급',
    approvals: ['student010', 'student011', 'student012', 'student013'], // 4명 승인
    rejections: ['student014'], // 1명 거부
    documentURL: 'https://s3.example.com/withdraw_receipt004.pdf',
  },
  {
    id: 'LEDGER_1640998400_council005',
    theme: '시설비',
    amount: 120000,
    entryType: LedgerEntryType.WITHDRAW,
    status: LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council005',
    creatorName: '학생회 회계 한민석',
    timestamp: currentTime - 300, // 5분 전 생성
    expiryTime: currentTime + 3300, // 55분 후 만료
    description: '학습실 의자 교체',
    approvals: [], // 아직 투표 없음
    rejections: [],
    documentURL: 'https://s3.example.com/withdraw_receipt005.pdf',
  },
  {
    id: 'LEDGER_1640999200_council006',
    theme: '교육비',
    amount: 90000,
    entryType: LedgerEntryType.WITHDRAW,
    status: LedgerEntryStatus.PENDING,
    approvedBy: '',
    createdBy: 'council006',
    creatorName: '홍보부장 오서연',
    timestamp: currentTime - 120, // 2분 전 생성
    expiryTime: currentTime + 3480, // 58분 후 만료
    description: '프로그래밍 워크샵 강사비',
    approvals: ['student015', 'student016'], // 2명 승인
    rejections: [],
    documentURL: 'https://s3.example.com/withdraw_receipt006.pdf',
  },
];