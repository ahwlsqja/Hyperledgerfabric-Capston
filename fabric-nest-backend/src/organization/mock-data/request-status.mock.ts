import { MembershipRequest, MembershipStatus, OrganizationType, RegisterCache } from "src/types";


// 학생 조직 가입 요청 - PENDING 상태
export const mockStudentPendingRequest: MembershipRequest = {
  id: 'REQ_STUDENT_1640995200_student123',
  applicantId: 'student123',
  applicantName: '김철수',
  organizationType: OrganizationType.STUDENT,
  status: MembershipStatus.PENDING,
  approvals: [],
  rejections: [],
  timestamp: 1640995200,
};

// 학생회 가입 요청 - PENDING 상태 (만료시간 포함)
export const mockCouncilPendingRequest: MembershipRequest = {
  id: 'REQ_COUNCIL_1640995200_student456',
  applicantId: 'student456',
  applicantName: '이영희',
  organizationType: OrganizationType.STUDENT_COUNCIL,
  status: MembershipStatus.PENDING,
  approvals: [],
  rejections: [],
  timestamp: 1640995200,
  expiryTime: 1641081600, // 24시간 후
};

// 학생 조직 가입 요청 - APPROVED 상태
export const mockStudentApprovedRequest: MembershipRequest = {
  id: 'REQ_STUDENT_1640995200_student789',
  applicantId: 'student789',
  applicantName: '박민수',
  organizationType: OrganizationType.STUDENT,
  status: MembershipStatus.APPROVED,
  approvals: ['council_president_001'],
  rejections: [],
  timestamp: 1640995200,
};

// 학생회 가입 요청 - APPROVED 상태
export const mockCouncilApprovedRequest: MembershipRequest = {
  id: 'REQ_COUNCIL_1640995200_student999',
  applicantId: 'student999',
  applicantName: '최지원',
  organizationType: OrganizationType.STUDENT_COUNCIL,
  status: MembershipStatus.APPROVED,
  approvals: ['council_president_001'],
  rejections: [],
  timestamp: 1640995200,
  expiryTime: 1641081600,
};

// 학생 조직 가입 요청 - REJECTED 상태
export const mockStudentRejectedRequest: MembershipRequest = {
  id: 'REQ_STUDENT_1640995200_student111',
  applicantId: 'student111',
  applicantName: '정수진',
  organizationType: OrganizationType.STUDENT,
  status: MembershipStatus.REJECTED,
  approvals: [],
  rejections: ['council_member_002'],
  timestamp: 1640995200,
};

// 학생회 가입 요청 - REJECTED 상태
export const mockCouncilRejectedRequest: MembershipRequest = {
  id: 'REQ_COUNCIL_1640995200_student222',
  applicantId: 'student222',
  applicantName: '한민석',
  organizationType: OrganizationType.STUDENT_COUNCIL,
  status: MembershipStatus.REJECTED,
  approvals: [],
  rejections: ['council_member_003'],
  timestamp: 1640995200,
  expiryTime: 1641081600,
};

// 학생회 가입 요청 - EXPIRED 상태
export const mockCouncilExpiredRequest: MembershipRequest = {
  id: 'REQ_COUNCIL_1640995200_student333',
  applicantId: 'student333',
  applicantName: '오서연',
  organizationType: OrganizationType.STUDENT_COUNCIL,
  status: MembershipStatus.EXPIRED,
  approvals: [],
  rejections: [],
  timestamp: 1640995200,
  expiryTime: 1641081600,
};

// 복수 승인자가 있는 케이스 (실제로는 한 명만 승인해도 되지만, 데이터 예시용)
export const mockMultipleApprovalsRequest: MembershipRequest = {
  id: 'REQ_STUDENT_1640995200_student444',
  applicantId: 'student444',
  applicantName: '송태희',
  organizationType: OrganizationType.STUDENT,
  status: MembershipStatus.APPROVED,
  approvals: ['council_president_001', 'council_member_004'],
  rejections: [],
  timestamp: 1640995200,
};

export const mockRequestRegister: RegisterCache = {
  id: 'REQ_STUDENT_1640995200_student123',
  userId: 'student123',
  name: '김철수',
  orgType: OrganizationType.STUDENT,
  status: MembershipStatus.APPROVED,
  timestamp: '2024-01-01T09:30:00.000Z',
}