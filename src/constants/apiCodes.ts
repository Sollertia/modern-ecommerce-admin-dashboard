// API 응답 코드 상수 - 실무 표준

// 성공 코드
export const API_CODES = {
  // 성공
  OK: 'OK',
  CREATED: 'CREATED',

  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 계정 관련
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  ACCOUNT_REJECTED: 'ACCOUNT_REJECTED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // 유효성 검증
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',

  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  HAS_RELATED_DATA: 'HAS_RELATED_DATA',

  // 서버 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// 에러 메시지 매핑
export const API_MESSAGES: Record<string, string> = {
  [API_CODES.OK]: '요청이 성공적으로 처리되었습니다.',
  [API_CODES.CREATED]: '리소스가 성공적으로 생성되었습니다.',

  [API_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
  [API_CODES.FORBIDDEN]: '권한이 없습니다.',
  [API_CODES.TOKEN_EXPIRED]: '토큰이 만료되었습니다.',
  [API_CODES.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',

  [API_CODES.ACCOUNT_PENDING]: '계정 승인 대기 중입니다.',
  [API_CODES.ACCOUNT_REJECTED]: '계정 신청이 거부되었습니다.',
  [API_CODES.ACCOUNT_SUSPENDED]: '정지된 계정입니다.',
  [API_CODES.ACCOUNT_INACTIVE]: '비활성화된 계정입니다.',
  [API_CODES.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',

  [API_CODES.VALIDATION_ERROR]: '입력값 검증에 실패했습니다.',
  [API_CODES.DUPLICATE_EMAIL]: '이미 사용 중인 이메일입니다.',
  [API_CODES.INVALID_EMAIL]: '올바른 이메일 형식이 아닙니다.',
  [API_CODES.INVALID_PASSWORD]: '비밀번호가 올바르지 않습니다.',

  [API_CODES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [API_CODES.ALREADY_EXISTS]: '이미 존재하는 리소스입니다.',
  [API_CODES.HAS_RELATED_DATA]: '연관된 데이터가 존재하여 삭제할 수 없습니다.',

  [API_CODES.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
  [API_CODES.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
};
