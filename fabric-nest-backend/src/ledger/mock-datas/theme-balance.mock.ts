import { ThemeBalance } from "src/types";

// 현재 시간 기준
const currentTime = Math.floor(Date.now() / 1000);

// 다양한 테마별 잔액 예시들

// 1. 동아리 활동비 - 활발한 거래가 있는 테마
export const mockThemeBalanceClubActivity: ThemeBalance = {
  theme: '동아리 활동비',
  totalDeposit: 850000,      // 85만원 입금
  totalWithdraw: 320000,     // 32만원 지출
  currentBalance: 530000,    // 53만원 잔액
  lastUpdated: currentTime - 3600, // 1시간 전 업데이트
};

// 2. 행사비 - 큰 금액이 오가는 테마
export const mockThemeBalanceEvent: ThemeBalance = {
  theme: '행사비',
  totalDeposit: 2500000,     // 250만원 입금
  totalWithdraw: 1800000,    // 180만원 지출
  currentBalance: 700000,    // 70만원 잔액
  lastUpdated: currentTime - 1800, // 30분 전 업데이트
};

// 3. 장학금 - 높은 금액, 적은 거래
export const mockThemeBalanceScholarship: ThemeBalance = {
  theme: '장학금',
  totalDeposit: 5000000,     // 500만원 입금
  totalWithdraw: 3000000,    // 300만원 지출
  currentBalance: 2000000,   // 200만원 잔액
  lastUpdated: currentTime - 7200, // 2시간 전 업데이트
};

// 4. 복리후생비 - 중간 규모의 거래
export const mockThemeBalanceWelfare: ThemeBalance = {
  theme: '복리후생비',
  totalDeposit: 600000,      // 60만원 입금
  totalWithdraw: 450000,     // 45만원 지출
  currentBalance: 150000,    // 15만원 잔액
  lastUpdated: currentTime - 900, // 15분 전 업데이트
};

// 5. 시설비 - 균형잡힌 입출금
export const mockThemeBalanceFacility: ThemeBalance = {
  theme: '시설비',
  totalDeposit: 1200000,     // 120만원 입금
  totalWithdraw: 800000,     // 80만원 지출
  currentBalance: 400000,    // 40만원 잔액
  lastUpdated: currentTime - 5400, // 1시간 30분 전 업데이트
};

// 6. 교육비 - 적은 거래량
export const mockThemeBalanceEducation: ThemeBalance = {
  theme: '교육비',
  totalDeposit: 300000,      // 30만원 입금
  totalWithdraw: 180000,     // 18만원 지출
  currentBalance: 120000,    // 12만원 잔액
  lastUpdated: currentTime - 10800, // 3시간 전 업데이트
};

// 7. 사무용품비 - 소액 거래가 많은 테마
export const mockThemeBalanceOfficeSupplies: ThemeBalance = {
  theme: '사무용품비',
  totalDeposit: 200000,      // 20만원 입금
  totalWithdraw: 150000,     // 15만원 지출
  currentBalance: 50000,     // 5만원 잔액
  lastUpdated: currentTime - 2700, // 45분 전 업데이트
};

// 8. 잔액이 0인 테마 (모든 금액이 지출됨)
export const mockThemeBalanceZeroBalance: ThemeBalance = {
  theme: '특별활동비',
  totalDeposit: 500000,      // 50만원 입금
  totalWithdraw: 500000,     // 50만원 지출
  currentBalance: 0,         // 0원 잔액
  lastUpdated: currentTime - 14400, // 4시간 전 업데이트
};

// 9. 입금만 있고 지출이 없는 테마
export const mockThemeBalanceOnlyDeposit: ThemeBalance = {
  theme: '기부금',
  totalDeposit: 1000000,     // 100만원 입금
  totalWithdraw: 0,          // 지출 없음
  currentBalance: 1000000,   // 100만원 잔액
  lastUpdated: currentTime - 21600, // 6시간 전 업데이트
};

// 10. 최근에 생성된 테마 (거래 내역이 적음)
export const mockThemeBalanceNewTheme: ThemeBalance = {
  theme: '신규활동비',
  totalDeposit: 100000,      // 10만원 입금
  totalWithdraw: 20000,      // 2만원 지출
  currentBalance: 80000,     // 8만원 잔액
  lastUpdated: currentTime - 300, // 5분 전 업데이트
};

// 11. 마이너스 잔액 (오류 상황 - 실제로는 발생하지 않아야 함)
export const mockThemeBalanceNegative: ThemeBalance = {
  theme: '테스트테마',
  totalDeposit: 100000,      // 10만원 입금
  totalWithdraw: 150000,     // 15만원 지출 (오류 상황)
  currentBalance: -50000,    // -5만원 잔액
  lastUpdated: currentTime - 86400, // 24시간 전 업데이트
};

// 12. 새로운 테마 (아직 거래 내역이 없음) - 초기 상태
export const mockThemeBalanceEmpty: ThemeBalance = {
  theme: '새테마',
  totalDeposit: 0,           // 입금 없음
  totalWithdraw: 0,          // 지출 없음
  currentBalance: 0,         // 0원 잔액
  lastUpdated: currentTime,  // 방금 생성됨
};


// 모든 테마 잔액 데이터 (실제 운영에서 나올 수 있는 다양한 테마들)
export const mockAllThemeBalances: ThemeBalance[] = [
  // 1. 동아리 활동비 - 가장 활발한 테마
  {
    theme: '동아리 활동비',
    totalDeposit: 2580000,      // 258만원
    totalWithdraw: 1320000,     // 132만원
    currentBalance: 1260000,    // 126만원
    lastUpdated: currentTime - 900, // 15분 전
  },
  
  // 2. 행사비 - 큰 금액이 오가는 테마
  {
    theme: '행사비',
    totalDeposit: 4500000,      // 450만원
    totalWithdraw: 2800000,     // 280만원
    currentBalance: 1700000,    // 170만원
    lastUpdated: currentTime - 3600, // 1시간 전
  },
  
  // 3. 장학금 - 높은 금액, 신중한 지출
  {
    theme: '장학금',
    totalDeposit: 8000000,      // 800만원
    totalWithdraw: 3500000,     // 350만원
    currentBalance: 4500000,    // 450만원 (가장 큰 잔액)
    lastUpdated: currentTime - 7200, // 2시간 전
  },
  
  // 4. 복리후생비 - 중간 규모
  {
    theme: '복리후생비',
    totalDeposit: 1200000,      // 120만원
    totalWithdraw: 850000,      // 85만원
    currentBalance: 350000,     // 35만원
    lastUpdated: currentTime - 1800, // 30분 전
  },
  
  // 5. 시설비 - 꾸준한 거래
  {
    theme: '시설비',
    totalDeposit: 1800000,      // 180만원
    totalWithdraw: 1200000,     // 120만원
    currentBalance: 600000,     // 60만원
    lastUpdated: currentTime - 5400, // 1시간 30분 전
  },
  
  // 6. 교육비 - 계획적인 지출
  {
    theme: '교육비',
    totalDeposit: 950000,       // 95만원
    totalWithdraw: 520000,      // 52만원
    currentBalance: 430000,     // 43만원
    lastUpdated: currentTime - 10800, // 3시간 전
  },
  
  // 7. 사무용품비 - 소액 다빈도 거래
  {
    theme: '사무용품비',
    totalDeposit: 480000,       // 48만원
    totalWithdraw: 420000,      // 42만원
    currentBalance: 60000,      // 6만원
    lastUpdated: currentTime - 2700, // 45분 전
  },
  
  // 8. 스포츠비 - 계절성 있는 테마
  {
    theme: '스포츠비',
    totalDeposit: 650000,       // 65만원
    totalWithdraw: 380000,      // 38만원
    currentBalance: 270000,     // 27만원
    lastUpdated: currentTime - 14400, // 4시간 전
  },
  
  // 9. 문화활동비 - 정기적인 지출
  {
    theme: '문화활동비',
    totalDeposit: 720000,       // 72만원
    totalWithdraw: 590000,      // 59만원
    currentBalance: 130000,     // 13만원
    lastUpdated: currentTime - 4500, // 1시간 15분 전
  },
  
  // 10. 봉사활동비 - 가끔 사용되는 테마
  {
    theme: '봉사활동비',
    totalDeposit: 300000,       // 30만원
    totalWithdraw: 180000,      // 18만원
    currentBalance: 120000,     // 12만원
    lastUpdated: currentTime - 21600, // 6시간 전
  },
  
  // 11. 기부금 - 입금만 있고 지출 없음
  {
    theme: '기부금',
    totalDeposit: 1500000,      // 150만원
    totalWithdraw: 0,           // 지출 없음
    currentBalance: 1500000,    // 150만원
    lastUpdated: currentTime - 86400, // 24시간 전
  },
  
  // 12. 비상기금 - 비축 목적
  {
    theme: '비상기금',
    totalDeposit: 2000000,      // 200만원
    totalWithdraw: 100000,      // 10만원 (최소 지출)
    currentBalance: 1900000,    // 190만원
    lastUpdated: currentTime - 172800, // 48시간 전
  },
  
  // 13. 홍보비 - 정기적이지만 적은 금액
  {
    theme: '홍보비',
    totalDeposit: 400000,       // 40만원
    totalWithdraw: 320000,      // 32만원
    currentBalance: 80000,      // 8만원
    lastUpdated: currentTime - 7200, // 2시간 전
  },
  
  // 14. 특별활동비 - 모든 금액이 소진됨
  {
    theme: '특별활동비',
    totalDeposit: 800000,       // 80만원
    totalWithdraw: 800000,      // 80만원 (전액 지출)
    currentBalance: 0,          // 0원
    lastUpdated: currentTime - 43200, // 12시간 전
  },
  
  // 15. 연구비 - 새롭게 시작된 테마
  {
    theme: '연구비',
    totalDeposit: 250000,       // 25만원
    totalWithdraw: 50000,       // 5만원
    currentBalance: 200000,     // 20만원
    lastUpdated: currentTime - 1200, // 20분 전
  },
  
  // 16. 도서구입비 - 소규모 테마
  {
    theme: '도서구입비',
    totalDeposit: 180000,       // 18만원
    totalWithdraw: 120000,      // 12만원
    currentBalance: 60000,      // 6만원
    lastUpdated: currentTime - 9000, // 2시간 30분 전
  },
  
  // 17. 교통비 - 실용적 테마
  {
    theme: '교통비',
    totalDeposit: 350000,       // 35만원
    totalWithdraw: 280000,      // 28만원
    currentBalance: 70000,      // 7만원
    lastUpdated: currentTime - 6300, // 1시간 45분 전
  },
  
  // 18. 급식비 - 정기적 지출
  {
    theme: '급식비',
    totalDeposit: 1100000,      // 110만원
    totalWithdraw: 950000,      // 95만원
    currentBalance: 150000,     // 15만원
    lastUpdated: currentTime - 3900, // 1시간 5분 전
  },
  
  // 19. 신입생환영비 - 계절성 테마
  {
    theme: '신입생환영비',
    totalDeposit: 600000,       // 60만원
    totalWithdraw: 580000,      // 58만원
    currentBalance: 20000,      // 2만원 (거의 소진)
    lastUpdated: currentTime - 259200, // 72시간 전
  },
  
  // 20. 졸업준비비 - 계절성 테마
  {
    theme: '졸업준비비',
    totalDeposit: 450000,       // 45만원
    totalWithdraw: 400000,      // 40만원
    currentBalance: 50000,      // 5만원
    lastUpdated: currentTime - 129600, // 36시간 전
  },
];