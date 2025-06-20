import { MembershipRequest, MembershipStatus, OrganizationType } from "src/types";

// 보류 중인 학생 조직 가입 요청들
export const mockPendingStudentRequests: MembershipRequest[] = [
  {
    id: 'REQ_STUDENT_1640995200_student001',
    applicantId: 'student001',
    applicantName: '김철수',
    organizationType: OrganizationType.STUDENT,
    status: MembershipStatus.PENDING,
    approvals: [],
    rejections: [],
    timestamp: 1640995200,
  },
  {
    id: 'REQ_STUDENT_1640998800_student002',
    applicantId: 'student002',
    applicantName: '이영희',
    organizationType: OrganizationType.STUDENT,
    status: MembershipStatus.PENDING,
    approvals: [],
    rejections: [],
    timestamp: 1640998800,
  },
  {
    id: 'REQ_STUDENT_1641002400_student003',
    applicantId: 'student003',
    applicantName: '박민수',
    organizationType: OrganizationType.STUDENT,
    status: MembershipStatus.PENDING,
    approvals: [],
    rejections: [],
    timestamp: 1641002400,
  },
  {
    id: 'REQ_STUDENT_1641006000_student004',
    applicantId: 'student004',
    applicantName: '정수진',
    organizationType: OrganizationType.STUDENT,
    status: MembershipStatus.PENDING,
    approvals: [],
    rejections: [],
    timestamp: 1641006000,
  }
];