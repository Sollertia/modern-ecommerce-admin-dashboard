import { http, HttpResponse } from 'msw';
import { ROLES, USER_STATUS, CUSTOMER_STATUS, ORDER_STATUS, PRODUCT_STATUS, PRODUCT_CATEGORIES } from '../constants/roles';
import { API_CODES, API_MESSAGES } from '../constants/apiCodes';
import type { User, Customer, Product, Order, Review, OrderStatus } from '../types';
import { generateMockToken, verifyMockToken, extractTokenFromHeader } from '../utils/jwt';

// --- Helper Functions for Data Generation ---
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 패스워드 제외 헬퍼 함수
function excludePassword<T extends { password?: string }>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj;
  return rest;
}

function excludePasswordFromArray<T extends { password?: string }>(arr: T[]): Omit<T, 'password'>[] {
  return arr.map(item => excludePassword(item));
}

const START_DATE = new Date('2025-01-01');
const END_DATE = new Date();

// --- Helper Functions for Amount ---
const parseAmount = (amount: string) => parseInt(amount.replace(/[^0-9]/g, '')) || 0;
const formatAmount = (amount: number) => `${amount.toLocaleString()}원`;

// --- Base Data Definitions ---
let users: User[] = [
  { id: '0', name: 'admin', email: 'admin@sparta.com', password: 'sparta1234', phone: '010-0000-0000', role: 'SUPER_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '1', name: '김운영', email: 'operation@sparta.com', password: 'password123', phone: '010-1111-1111', role: 'OPERATION_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '2', name: '이고객', email: 'cs@sparta.com', password: 'password123', phone: '010-2222-2222', role: 'CS_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '3', name: '박대기', email: 'pending@sparta.com', password: 'password123', phone: '010-3333-3333', role: 'CS_ADMIN', status: USER_STATUS.PENDING, requestMessage: 'CS부서 박대기입니다. CS 관리자 승인 부탁드립니다.' },
  { id: '4', name: '최거부', email: 'rejected@sparta.com', password: 'password123', phone: '010-4444-4444', role: 'OPERATION_ADMIN', status: USER_STATUS.REJECTED, requestMessage: '운영 관리자로 지원합니다.', rejectionReason: '경력 부족' },
  { id: '5', name: '정정지', email: 'suspended@sparta.com', password: 'password123', phone: '010-5555-5555', role: 'CS_ADMIN', status: USER_STATUS.SUSPENDED },
  { id: '6', name: '김철수', email: 'kim@sparta.com', password: 'password123', phone: '010-6666-6666', role: 'OPERATION_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '7', name: '이영희', email: 'lee@sparta.com', password: 'password123', phone: '010-7777-7777', role: 'CS_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '8', name: '박민수', email: 'park@sparta.com', password: 'password123', phone: '010-8888-8888', role: 'OPERATION_ADMIN', status: USER_STATUS.ACTIVE },
  { id: '9', name: '정수연', email: 'jung@sparta.com', password: 'password123', phone: '010-9999-9999', role: 'CS_ADMIN', status: USER_STATUS.INACTIVE },
  { id: '10', name: '최동욱', email: 'choi@sparta.com', password: 'password123', phone: '010-1010-1010', role: 'OPERATION_ADMIN', status: USER_STATUS.ACTIVE },
].map(u => ({ ...u, createdAt: '', approvedAt: '', rejectedAt: '' }));

let customers: Customer[] = [
  { id: 'C001', name: '최원빈', email: 'wonbin@example.com', password: 'customer123', phone: '010-1111-2222', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C002', name: '이영희', email: 'younghee@example.com', password: 'customer123', phone: '010-2222-3333', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C003', name: '박준영', email: 'junyoung@example.com', password: 'customer123', phone: '010-3333-4444', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C004', name: '최지은', email: 'sujin@example.com', password: 'customer123', phone: '010-4444-5555', status: CUSTOMER_STATUS.INACTIVE },
  { id: 'C005', name: '강준규', email: 'junkyu@example.com', password: 'customer123', phone: '010-5555-6666', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C006', name: '강태우', email: 'taewoo@example.com', password: 'customer123', phone: '010-6666-7777', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C007', name: '윤지원', email: 'jiwon@example.com', password: 'customer123', phone: '010-7777-8888', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C008', name: '송민재', email: 'minjae@example.com', password: 'customer123', phone: '010-8888-9999', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C009', name: '한서연', email: 'seoyeon@example.com', password: 'customer123', phone: '010-9999-0000', status: CUSTOMER_STATUS.SUSPENDED },
  { id: 'C010', name: 'VIP 고객', email: 'vip@example.com', password: 'customer123', phone: '010-0000-1111', status: CUSTOMER_STATUS.INACTIVE },
  { id: 'C011', name: '정유미', email: 'yumi@example.com', password: 'customer123', phone: '010-1234-0001', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C012', name: '김도윤', email: 'doyoon@example.com', password: 'customer123', phone: '010-1234-0002', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C013', name: '박서준', email: 'seojoon@example.com', password: 'customer123', phone: '010-1234-0003', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C014', name: '이서아', email: 'seoa@example.com', password: 'customer123', phone: '010-1234-0004', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C015', name: '최은우', email: 'eunwoo@example.com', password: 'customer123', phone: '010-1234-0005', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C016', name: '강하윤', email: 'hayoon@example.com', password: 'customer123', phone: '010-1234-0006', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C017', name: '조민준', email: 'minjoon@example.com', password: 'customer123', phone: '010-1234-0007', status: CUSTOMER_STATUS.INACTIVE },
  { id: 'C018', name: '윤지아', email: 'jia@example.com', password: 'customer123', phone: '010-1234-0008', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C019', name: '임도현', email: 'dohyun@example.com', password: 'customer123', phone: '010-1234-0009', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C020', name: '한지우', email: 'jiwoo@example.com', password: 'customer123', phone: '010-1234-0010', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C021', name: '신서연', email: 'seoyeon2@example.com', password: 'customer123', phone: '010-1234-0011', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C022', name: '권유준', email: 'yujun@example.com', password: 'customer123', phone: '010-1234-0012', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C023', name: '황하은', email: 'haeun@example.com', password: 'customer123', phone: '010-1234-0013', status: CUSTOMER_STATUS.SUSPENDED },
  { id: 'C024', name: '송지호', email: 'jiho@example.com', password: 'customer123', phone: '010-1234-0014', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C025', name: '오수아', email: 'sua@example.com', password: 'customer123', phone: '010-1234-0015', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C026', name: '배서아', email: 'seoa2@example.com', password: 'customer123', phone: '010-1234-0016', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C027', name: '석지민', email: 'jimin@example.com', password: 'customer123', phone: '010-1234-0017', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C028', name: '정시우', email: 'siwoo@example.com', password: 'customer123', phone: '010-1234-0018', status: CUSTOMER_STATUS.INACTIVE },
  { id: 'C029', name: '홍예준', email: 'yejun@example.com', password: 'customer123', phone: '010-1234-0019', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C030', name: '백하준', email: 'hajun@example.com', password: 'customer123', phone: '010-1234-0020', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C031', name: '문채원', email: 'chaewon@example.com', password: 'customer123', phone: '010-1234-0021', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C032', name: '손서윤', email: 'seoyoon@example.com', password: 'customer123', phone: '010-1234-0022', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C033', name: '양지후', email: 'jihoo@example.com', password: 'customer123', phone: '010-1234-0023', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C034', name: '허지호', email: 'jiho2@example.com', password: 'customer123', phone: '010-1234-0024', status: CUSTOMER_STATUS.SUSPENDED },
  { id: 'C035', name: '노은서', email: 'eunseo@example.com', password: 'customer123', phone: '010-1234-0025', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C036', name: '서예준', email: 'yejun2@example.com', password: 'customer123', phone: '010-1234-0026', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C037', name: '유하린', email: 'harin@example.com', password: 'customer123', phone: '010-1234-0027', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C038', name: '채아윤', email: 'ayoon@example.com', password: 'customer123', phone: '010-1234-0028', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C039', name: '진이준', email: 'ijun@example.com', password: 'customer123', phone: '010-1234-0029', status: CUSTOMER_STATUS.INACTIVE },
  { id: 'C040', name: '천수현', email: 'soohyun@example.com', password: 'customer123', phone: '010-1234-0030', status: CUSTOMER_STATUS.ACTIVE },
  { id: 'C041', name: '최삭제', email: 'delete-test@example.com', password: 'customer123', phone: '010-9999-9999', status: CUSTOMER_STATUS.ACTIVE },
].map(c => ({ ...c, createdAt: '', totalOrders: 0, totalSpent: '0원' }));

let products: Product[] = [
  // Electronics (13)
  { id: 'P001', name: '노트북', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '1,500,000원', stock: 15, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P002', name: '스마트폰', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '950,000원', stock: 32, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P003', name: '태블릿', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '680,000원', stock: 28, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P004', name: '무선이어폰', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '89,000원', stock: 45, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P005', name: '블루투스 스피커', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '125,000원', stock: 23, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P006', name: '기계식 키보드', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '159,000원', stock: 3, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P007', name: '게이밍 마우스', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '78,000원', stock: 56, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P008', name: '27인치 모니터', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '350,000원', stock: 18, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P009', name: '웹캠', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '95,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P010', name: '고속충전기', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '35,000원', stock: 89, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P011', name: '스마트워치', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '450,000원', stock: 25, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P012', name: '외장하드 1TB', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '89,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P013', name: '그래픽 카드', category: PRODUCT_CATEGORIES.ELECTRONICS, price: '890,000원', stock: 10, status: PRODUCT_STATUS.AVAILABLE },

  // Fashion (13)
  { id: 'P014', name: '기본 티셔츠', category: PRODUCT_CATEGORIES.FASHION, price: '25,000원', stock: 120, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P015', name: '청바지', category: PRODUCT_CATEGORIES.FASHION, price: '79,000원', stock: 45, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P016', name: '운동화', category: PRODUCT_CATEGORIES.FASHION, price: '129,000원', stock: 38, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P017', name: '백팩', category: PRODUCT_CATEGORIES.FASHION, price: '89,000원', stock: 52, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P018', name: '볼캡', category: PRODUCT_CATEGORIES.FASHION, price: '29,000원', stock: 78, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P019', name: '양말 세트', category: PRODUCT_CATEGORIES.FASHION, price: '15,000원', stock: 95, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P020', name: '후드티', category: PRODUCT_CATEGORIES.FASHION, price: '59,000원', stock: 2, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P021', name: '맨투맨', category: PRODUCT_CATEGORIES.FASHION, price: '49,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P022', name: '슬랙스', category: PRODUCT_CATEGORIES.FASHION, price: '69,000원', stock: 60, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P023', name: '가죽 자켓', category: PRODUCT_CATEGORIES.FASHION, price: '199,000원', stock: 15, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P024', name: '코트', category: PRODUCT_CATEGORIES.FASHION, price: '259,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P025', name: '패딩', category: PRODUCT_CATEGORIES.FASHION, price: '299,000원', stock: 30, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P026', name: '목도리', category: PRODUCT_CATEGORIES.FASHION, price: '39,000원', stock: 50, status: PRODUCT_STATUS.AVAILABLE },

  // Food (12)
  { id: 'P027', name: '프리미엄 커피 원두', category: PRODUCT_CATEGORIES.FOOD, price: '28,000원', stock: 67, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P028', name: '녹차 티백', category: PRODUCT_CATEGORIES.FOOD, price: '12,000원', stock: 85, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P029', name: '견과류 믹스', category: PRODUCT_CATEGORIES.FOOD, price: '18,000원', stock: 43, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P030', name: '에너지바', category: PRODUCT_CATEGORIES.FOOD, price: '15,000원', stock: 92, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P031', name: '과일잼 세트', category: PRODUCT_CATEGORIES.FOOD, price: '22,000원', stock: 34, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P032', name: '올리브오일', category: PRODUCT_CATEGORIES.FOOD, price: '35,000원', stock: 28, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P033', name: '꿀 선물세트', category: PRODUCT_CATEGORIES.FOOD, price: '45,000원', stock: 1, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P034', name: '다크초콜릿', category: PRODUCT_CATEGORIES.FOOD, price: '8,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P035', name: '프로틴바', category: PRODUCT_CATEGORIES.FOOD, price: '25,000원', stock: 100, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P036', name: '유기농 샐러드', category: PRODUCT_CATEGORIES.FOOD, price: '9,900원', stock: 50, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P037', name: '냉동 닭가슴살', category: PRODUCT_CATEGORIES.FOOD, price: '19,900원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P038', name: '수제 소시지', category: PRODUCT_CATEGORIES.FOOD, price: '15,900원', stock: 40, status: PRODUCT_STATUS.AVAILABLE },

  // Living (12)
  { id: 'P039', name: '호텔 수건 세트', category: PRODUCT_CATEGORIES.LIVING, price: '38,000원', stock: 45, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P040', name: '베개', category: PRODUCT_CATEGORIES.LIVING, price: '45,000원', stock: 32, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P041', name: '물티슈 대용량', category: PRODUCT_CATEGORIES.LIVING, price: '18,000원', stock: 100, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P042', name: '손세정제 세트', category: PRODUCT_CATEGORIES.LIVING, price: '25,000원', stock: 68, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P043', name: '주방세제 세트', category: PRODUCT_CATEGORIES.LIVING, price: '12,000원', stock: 88, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P044', name: '행주 세트', category: PRODUCT_CATEGORIES.LIVING, price: '9,000원', stock: 76, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P045', name: '방향제', category: PRODUCT_CATEGORIES.LIVING, price: '15,000원', stock: 4, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P046', name: 'LED 스탠드', category: PRODUCT_CATEGORIES.LIVING, price: '42,000원', stock: 25, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P047', name: '무선 청소기', category: PRODUCT_CATEGORIES.LIVING, price: '299,000원', stock: 15, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P048', name: '공기청정기', category: PRODUCT_CATEGORIES.LIVING, price: '199,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P049', name: '가습기', category: PRODUCT_CATEGORIES.LIVING, price: '79,000원', stock: 30, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P050', name: '전기포트', category: PRODUCT_CATEGORIES.LIVING, price: '49,000원', stock: 50, status: PRODUCT_STATUS.AVAILABLE },

  // Sports (12)
  { id: 'P051', name: '요가매트', category: PRODUCT_CATEGORIES.SPORTS, price: '39,000원', stock: 54, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P052', name: '아령 세트', category: PRODUCT_CATEGORIES.SPORTS, price: '65,000원', stock: 22, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P053', name: '런닝화', category: PRODUCT_CATEGORIES.SPORTS, price: '159,000원', stock: 18, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P054', name: '운동복 세트', category: PRODUCT_CATEGORIES.SPORTS, price: '89,000원', stock: 35, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P055', name: '수영 고글', category: PRODUCT_CATEGORIES.SPORTS, price: '32,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P056', name: '자전거 헬멧', category: PRODUCT_CATEGORIES.SPORTS, price: '78,000원', stock: 27, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P057', name: '탁구채 세트', category: PRODUCT_CATEGORIES.SPORTS, price: '55,000원', stock: 2, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P058', name: '배드민턴 라켓', category: PRODUCT_CATEGORIES.SPORTS, price: '95,000원', stock: 31, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P059', name: '축구공', category: PRODUCT_CATEGORIES.SPORTS, price: '29,000원', stock: 60, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P060', name: '농구공', category: PRODUCT_CATEGORIES.SPORTS, price: '32,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P061', name: '등산 스틱', category: PRODUCT_CATEGORIES.SPORTS, price: '89,000원', stock: 25, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P062', name: '캠핑 의자', category: PRODUCT_CATEGORIES.SPORTS, price: '45,000원', stock: 40, status: PRODUCT_STATUS.AVAILABLE },

  // Beauty (13)
  { id: 'P063', name: '수분크림', category: PRODUCT_CATEGORIES.BEAUTY, price: '45,000원', stock: 48, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P064', name: '선크림', category: PRODUCT_CATEGORIES.BEAUTY, price: '28,000원', stock: 65, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P065', name: '립스틱 세트', category: PRODUCT_CATEGORIES.BEAUTY, price: '52,000원', stock: 37, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P066', name: '마스카라', category: PRODUCT_CATEGORIES.BEAUTY, price: '23,000원', stock: 71, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P067', name: '클렌징 오일', category: PRODUCT_CATEGORIES.BEAUTY, price: '32,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P068', name: '토너', category: PRODUCT_CATEGORIES.BEAUTY, price: '35,000원', stock: 42, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P069', name: '향수', category: PRODUCT_CATEGORIES.BEAUTY, price: '89,000원', stock: 19, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P070', name: '핸드크림 세트', category: PRODUCT_CATEGORIES.BEAUTY, price: '18,000원', stock: 3, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P071', name: '헤어 에센스', category: PRODUCT_CATEGORIES.BEAUTY, price: '25,000원', stock: 60, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P072', name: '바디 로션', category: PRODUCT_CATEGORIES.BEAUTY, price: '19,000원', stock: 80, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P073', name: '아이섀도우 팔레트', category: PRODUCT_CATEGORIES.BEAUTY, price: '48,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P074', name: '쿠션 파운데이션', category: PRODUCT_CATEGORIES.BEAUTY, price: '38,000원', stock: 50, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P075', name: '네일 폴리시 세트', category: PRODUCT_CATEGORIES.BEAUTY, price: '29,000원', stock: 40, status: PRODUCT_STATUS.AVAILABLE },

  // Books (13)
  { id: 'P076', name: '베스트셀러 소설', category: PRODUCT_CATEGORIES.BOOKS, price: '16,800원', stock: 58, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P077', name: '자기계발서', category: PRODUCT_CATEGORIES.BOOKS, price: '18,900원', stock: 45, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P078', name: 'IT 전문서적', category: PRODUCT_CATEGORIES.BOOKS, price: '35,000원', stock: 24, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P079', name: '요리책', category: PRODUCT_CATEGORIES.BOOKS, price: '25,000원', stock: 38, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P080', name: '경제경영서', category: PRODUCT_CATEGORIES.BOOKS, price: '22,000원', stock: 51, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P081', name: '에세이', category: PRODUCT_CATEGORIES.BOOKS, price: '14,500원', stock: 67, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P082', name: '어린이 동화책', category: PRODUCT_CATEGORIES.BOOKS, price: '12,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P083', name: '만화책 세트', category: PRODUCT_CATEGORIES.BOOKS, price: '48,000원', stock: 1, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P084', name: '역사책', category: PRODUCT_CATEGORIES.BOOKS, price: '28,000원', stock: 30, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P085', name: '과학 교양서', category: PRODUCT_CATEGORIES.BOOKS, price: '21,000원', stock: 40, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P086', name: '여행 가이드북', category: PRODUCT_CATEGORIES.BOOKS, price: '19,800원', stock: 25, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P087', name: '외국어 학습서', category: PRODUCT_CATEGORIES.BOOKS, price: '24,000원', stock: 50, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P088', name: '잡지', category: PRODUCT_CATEGORIES.BOOKS, price: '9,900원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },

  // Toys (12)
  { id: 'P089', name: '레고 세트', category: PRODUCT_CATEGORIES.TOYS, price: '89,000원', stock: 32, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P090', name: '직소 퍼즐', category: PRODUCT_CATEGORIES.TOYS, price: '25,000원', stock: 46, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P091', name: '보드게임', category: PRODUCT_CATEGORIES.TOYS, price: '45,000원', stock: 28, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P092', name: '프라모델', category: PRODUCT_CATEGORIES.TOYS, price: '38,000원', stock: 35, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P093', name: '인형', category: PRODUCT_CATEGORIES.TOYS, price: '32,000원', stock: 52, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P094', name: 'RC카', category: PRODUCT_CATEGORIES.TOYS, price: '125,000원', stock: 15, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P095', name: '드론', category: PRODUCT_CATEGORIES.TOYS, price: '280,000원', stock: 2, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P096', name: '전동킥보드', category: PRODUCT_CATEGORIES.TOYS, price: '450,000원', stock: 8, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P097', name: '액션 피규어', category: PRODUCT_CATEGORIES.TOYS, price: '59,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
  { id: 'P098', name: '슬라임 세트', category: PRODUCT_CATEGORIES.TOYS, price: '19,000원', stock: 60, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P099', name: '미니카 트랙', category: PRODUCT_CATEGORIES.TOYS, price: '75,000원', stock: 25, status: PRODUCT_STATUS.AVAILABLE },
  { id: 'P100', name: '인형의 집', category: PRODUCT_CATEGORIES.TOYS, price: '150,000원', stock: 0, status: PRODUCT_STATUS.SOLD_OUT },
].map((p, index) => ({
  ...p,
  createdAt: '',
  createdBy: index % 2 === 0 ? '0' : '1', // SUPER_ADMIN과 OPERATION_ADMIN 교대로
  createdByName: index % 2 === 0 ? 'admin' : '김운영',
  createdByEmail: index % 2 === 0 ? 'admin@sparta.com' : 'operation@sparta.com'
}));

let orders: Order[] = [];
let reviews: Review[] = [];

// --- Data Generation and Sanitization ---

// 1. Generate Dates for Users, Customers, Products
users.forEach(user => {
    const createdAt = randomDate(START_DATE, END_DATE);
    user.createdAt = formatDate(createdAt);

    if (user.status !== USER_STATUS.PENDING && user.status !== USER_STATUS.REJECTED) {
        const approvedAt = new Date(createdAt);
        approvedAt.setDate(approvedAt.getDate() + Math.floor(Math.random() * 7) + 1);
        if (approvedAt < END_DATE) {
            user.approvedAt = formatDate(approvedAt);
        } else {
            user.approvedAt = formatDate(createdAt);
        }
    }
    if (user.status === USER_STATUS.REJECTED) {
        const rejectedAt = new Date(createdAt);
        rejectedAt.setDate(rejectedAt.getDate() + Math.floor(Math.random() * 3) + 1);
        if (rejectedAt < END_DATE) {
            user.rejectedAt = formatDate(rejectedAt);
        }
    }
});

customers.forEach(customer => {
    const createdAt = randomDate(START_DATE, END_DATE);
    customer.createdAt = formatDate(createdAt);
});

products.forEach(product => {
    product.createdAt = formatDate(randomDate(START_DATE, END_DATE));
});

// 2. Generate Orders with controlled status distribution
const orderCount = 100;
const deliveredCount = Math.floor(orderCount * 0.75);
const shippingCount = Math.floor(orderCount * 0.15);
const preparingCount = orderCount - deliveredCount - shippingCount;

const shippingStartDate = new Date(END_DATE);
shippingStartDate.setDate(END_DATE.getDate() - 10);
const preparingStartDate = new Date(END_DATE);
preparingStartDate.setDate(END_DATE.getDate() - 3);

const generatedOrders: Order[] = [];

// 주문 생성에서 제외할 고객들 (삭제 테스트용)
const customersForOrders = customers.filter(c => c.id !== 'C041');

// Generate DELIVERED orders
for (let i = 0; i < deliveredCount; i++) {
    const orderDate = randomDate(START_DATE, shippingStartDate);
    const randomCustomer = customersForOrders[Math.floor(Math.random() * customersForOrders.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1~3개
    const unitPrice = parseAmount(randomProduct.price);
    const totalAmount = formatAmount(unitPrice * quantity);
    generatedOrders.push({
        id: '', // Will be assigned later
        orderNo: '', // Will be assigned later
        customerId: randomCustomer.id,
        customer: randomCustomer.name,
        customerEmail: randomCustomer.email,
        productId: randomProduct.id,
        product: randomProduct.name,
        quantity: quantity,
        amount: totalAmount,
        date: formatDate(orderDate),
        status: ORDER_STATUS.DELIVERED,
    });
}

// Generate SHIPPING orders
for (let i = 0; i < shippingCount; i++) {
    const orderDate = randomDate(shippingStartDate, preparingStartDate);
    const randomCustomer = customersForOrders[Math.floor(Math.random() * customersForOrders.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1~3개
    const unitPrice = parseAmount(randomProduct.price);
    const totalAmount = formatAmount(unitPrice * quantity);
    generatedOrders.push({
        id: '',
        orderNo: '',
        customerId: randomCustomer.id,
        customer: randomCustomer.name,
        customerEmail: randomCustomer.email,
        productId: randomProduct.id,
        product: randomProduct.name,
        quantity: quantity,
        amount: totalAmount,
        date: formatDate(orderDate),
        status: ORDER_STATUS.SHIPPING,
    });
}

// Generate PREPARING orders (일부는 CS 주문으로 생성)
for (let i = 0; i < preparingCount; i++) {
    const orderDate = randomDate(preparingStartDate, END_DATE);
    const randomCustomer = customersForOrders[Math.floor(Math.random() * customersForOrders.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1~3개
    const unitPrice = parseAmount(randomProduct.price);
    const totalAmount = formatAmount(unitPrice * quantity);

    // 30% 확률로 CS 주문으로 생성
    const isCSOrder = Math.random() < 0.3;
    const csAdmin = isCSOrder ? users.find(u => u.role === ROLES.CS_ADMIN) : null;

    generatedOrders.push({
        id: '',
        orderNo: '',
        customerId: randomCustomer.id,
        customer: randomCustomer.name,
        customerEmail: randomCustomer.email,
        productId: randomProduct.id,
        product: randomProduct.name,
        quantity: quantity,
        amount: totalAmount,
        date: formatDate(orderDate),
        status: ORDER_STATUS.PREPARING,
        ...(csAdmin && {
            createdByAdminId: csAdmin.id,
            createdByAdminName: csAdmin.name,
            createdByAdminEmail: csAdmin.email,
            createdByAdminRole: csAdmin.role,
        }),
    });
}

// Shuffle and assign unique IDs
generatedOrders.sort(() => Math.random() - 0.5);

const ordersPerDay: { [key: string]: number } = {};
let orderCounter = 1;
orders = generatedOrders.map(order => {
    const daySeq = (ordersPerDay[order.date] || 0) + 1;
    ordersPerDay[order.date] = daySeq;
    order.id = `ORDER-${String(orderCounter++).padStart(4, '0')}`; // 내부 ID
    order.orderNo = `${order.date.replace(/-/g, '')}-${String(daySeq).padStart(3, '0')}`; // 주문번호
    return order;
});

// Force today's orders
const todayStr = formatDate(new Date());
const todayOrders = orders.filter(o => o.date === todayStr);
if (todayOrders.length === 0) {
    // If no orders for today, force the last few orders to be today
    for (let i = 0; i < 3; i++) {
        if (orders[i]) {
            orders[i].date = todayStr;
            orders[i].status = ORDER_STATUS.PREPARING;
            const daySeq = (ordersPerDay[todayStr] || 0) + 1;
            ordersPerDay[todayStr] = daySeq;
            orders[i].orderNo = `${todayStr.replace(/-/g, '')}-${String(daySeq).padStart(3, '0')}`;
        }
    }
}

orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


// 3. Sanitize and Recalculate Data
products.forEach(p => {
  if (p.stock === 0) p.status = PRODUCT_STATUS.SOLD_OUT;
});

orders.forEach(order => {
  const customer = customers.find(c => c.id === order.customerId);
  const product = products.find(p => p.id === order.productId);
  if (customer) order.customer = customer.name;
  if (product) {
    order.product = product.name;
    // amount는 이미 생성 시 총 금액(단가 × 수량)으로 계산되어 있으므로 덮어쓰지 않음
  }
});

customers.forEach(customer => {
  // 취소되지 않은 주문만 통계에 포함
  const customerOrders = orders.filter(o => o.customerId === customer.id && o.status !== ORDER_STATUS.CANCELLED);
  customer.totalOrders = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, order) => sum + parseAmount(order.amount), 0);
  customer.totalSpent = formatAmount(totalSpent);
});

// 4. Generate Reviews from Sanitized Orders
const deliveredOrders = orders.filter(o => o.status === ORDER_STATUS.DELIVERED);
let reviewIdCounter = 1;
for (let i = 0; i < deliveredOrders.length; i++) {
    const order = deliveredOrders[i];
    
    // Realistic rating distribution (J-curve)
    const rand = Math.random();
    let rating;
    if (rand < 0.5) rating = 5;       // 50%
    else if (rand < 0.8) rating = 4;  // 30%
    else if (rand < 0.9) rating = 3;  // 10%
    else if (rand < 0.95) rating = 2; // 5%
    else rating = 1;                  // 5%

    let comment = '';
    switch (rating) {
        case 5: 
            const comments5 = [
                '정말 만족스러운 구매였습니다! 품질이 훌륭해요.',
                '배송도 빠르고 상품도 마음에 듭니다.',
                '가성비 최고입니다. 강력 추천해요!',
                '재구매 의사 100%입니다.',
                '선물용으로 샀는데 너무 좋아하네요.'
            ];
            comment = comments5[Math.floor(Math.random() * comments5.length)];
            break;
        case 4: 
            const comments4 = [
                '전반적으로 좋아요. 배송도 빨랐어요.',
                '가격 대비 괜찮은 제품입니다.',
                '생각보다 퀄리티가 좋네요.',
                '만족합니다. 잘 쓸게요.',
                '포장이 꼼꼼해서 좋았습니다.'
            ];
            comment = comments4[Math.floor(Math.random() * comments4.length)];
            break;
        case 3: 
            const comments3 = [
                '보통이에요. 그냥 쓸만해요.',
                '가격만큼 하는 것 같아요.',
                '배송은 빨랐는데 상품은 평범해요.',
                '나쁘지 않아요.',
                '화면이랑 색상이 조금 다르네요.'
            ];
            comment = comments3[Math.floor(Math.random() * comments3.length)];
            break;
        case 2: 
            const comments2 = [
                '기대했던 것보다 별로예요. 포장이 아쉬워요.',
                '마감이 조금 미흡하네요.',
                '배송이 너무 늦었어요.',
                '생각보다 별로네요.',
                '재구매는 안 할 것 같아요.'
            ];
            comment = comments2[Math.floor(Math.random() * comments2.length)];
            break;
        case 1: 
            const comments1 = [
                '불량품이 왔어요. 환불 원합니다.',
                '최악이에요. 절대 사지 마세요.',
                '배송도 늦고 상품도 별로입니다.',
                '돈 아까워요.',
                '고객센터 연결도 안 되고 답답하네요.'
            ];
            comment = comments1[Math.floor(Math.random() * comments1.length)];
            break;
    }
    const orderDate = new Date(order.date);
    orderDate.setDate(orderDate.getDate() + 3);
    const reviewDate = formatDate(orderDate > END_DATE ? END_DATE : orderDate);

    reviews.push({
        id: `R${String(reviewIdCounter++).padStart(3, '0')}`,
        orderId: order.id,
        productId: order.productId,
        customerId: order.customerId,
        customer: order.customer,
        customerEmail: order.customerEmail || '',
        product: order.product,
        rating: rating,
        comment: comment,
        date: reviewDate,
    });
}

// --- MSW Handlers ---

const authenticateRequest = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) return { authenticated: false, user: null, code: API_CODES.UNAUTHORIZED, message: API_MESSAGES[API_CODES.UNAUTHORIZED] };
  const payload = verifyMockToken(token);
  if (!payload) return { authenticated: false, user: null, code: API_CODES.INVALID_TOKEN, message: API_MESSAGES[API_CODES.INVALID_TOKEN] };
  return { authenticated: true, user: payload, code: null, message: null };
};

const parseQueryParams = (request: Request) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const sortBy = url.searchParams.get('sortBy') || '';
  const sortOrder = (url.searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  return { search, page, limit, sortBy, sortOrder, params: url.searchParams };
};

const parseAmountValue = (value: any) => {
  if (typeof value === 'string') {
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  }
  return value;
};

const processData = <T extends Record<string, any>>(
  data: T[],
  options: {
    search?: string;
    searchFields?: (keyof T)[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, string>;
  }
) => {
  let result = [...data];
  if (options.search && options.searchFields && options.searchFields.length > 0) {
    const searchLower = options.search.toLowerCase();
    result = result.filter(item =>
      options.searchFields!.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      })
    );
  }
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value) result = result.filter(item => item[key] === value);
    });
  }
  if (options.sortBy) {
    result.sort((a, b) => {
      let aVal = a[options.sortBy!];
      let bVal = b[options.sortBy!];

      if (typeof aVal === 'string' && (aVal.includes('원') || options.sortBy === 'price' || options.sortBy === 'totalSpent' || options.sortBy === 'amount')) {
          aVal = parseAmountValue(aVal);
          bVal = parseAmountValue(bVal);
      }

      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  const total = result.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedData = result.slice(startIndex, startIndex + limit);
  return { items: paginatedData, pagination: { page, limit, total, totalPages } };
};

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return HttpResponse.json({ success: false, code: API_CODES.INVALID_CREDENTIALS, message: API_MESSAGES[API_CODES.INVALID_CREDENTIALS] }, { status: 401 });
    if (user.status === USER_STATUS.PENDING) return HttpResponse.json({ success: false, code: API_CODES.ACCOUNT_PENDING, message: '계정 승인 대기 중입니다. 슈퍼 관리자의 승인을 기다려주세요.' }, { status: 403 });
    if (user.status === USER_STATUS.REJECTED) return HttpResponse.json({ success: false, code: API_CODES.ACCOUNT_REJECTED, message: `계정 신청이 거부되었습니다. 사유: ${user.rejectionReason || '미기재'}` }, { status: 403 });
    if (user.status === USER_STATUS.SUSPENDED) return HttpResponse.json({ success: false, code: API_CODES.ACCOUNT_SUSPENDED, message: API_MESSAGES[API_CODES.ACCOUNT_SUSPENDED] }, { status: 403 });
    if (user.status === USER_STATUS.INACTIVE) return HttpResponse.json({ success: false, code: API_CODES.ACCOUNT_INACTIVE, message: API_MESSAGES[API_CODES.ACCOUNT_INACTIVE] }, { status: 403 });
    // user.lastLoginAt = formatDate(new Date()); // lastLoginAt 제거
    const token = generateMockToken(user.id, user.name, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { user: userWithoutPassword, token } });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json() as Omit<User, 'id' | 'createdAt' | 'status'>;
    if (users.some(u => u.email === userData.email)) return HttpResponse.json({ success: false, code: API_CODES.DUPLICATE_EMAIL, message: API_MESSAGES[API_CODES.DUPLICATE_EMAIL] }, { status: 400 });
    const newUser: User = { ...userData, id: `${Date.now()}`, createdAt: formatDate(new Date()), status: USER_STATUS.PENDING };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    return HttpResponse.json({ success: true, code: API_CODES.CREATED, message: '회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.', data: userWithoutPassword }, { status: 201 });
  }),

  http.get('/api/users/me', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const user = users.find(u => u.id === auth.user!.userId);
    if (!user) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: userWithoutPassword });
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { name, email, phone } = await request.json() as { name: string; email: string; phone: string };
    const userIndex = users.findIndex(u => u.id === auth.user!.userId);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    if (users.some(u => u.email === email && u.id !== auth.user!.userId)) return HttpResponse.json({ success: false, code: API_CODES.DUPLICATE_EMAIL, message: API_MESSAGES[API_CODES.DUPLICATE_EMAIL] }, { status: 400 });
    users[userIndex] = { ...users[userIndex], name, email, phone };
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return HttpResponse.json({ success: true, code: API_CODES.OK, message: '프로필이 성공적으로 업데이트되었습니다.', data: userWithoutPassword });
  }),

  http.put('/api/auth/password', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { currentPassword, newPassword } = await request.json() as { currentPassword: string; newPassword: string };
    const userIndex = users.findIndex(u => u.id === auth.user!.userId);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    const user = users[userIndex];
    if (user.password !== currentPassword) return HttpResponse.json({ success: false, code: API_CODES.INVALID_PASSWORD, message: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    if (newPassword.length < 8) return HttpResponse.json({ success: false, code: API_CODES.VALIDATION_ERROR, message: '새 비밀번호는 최소 8자 이상이어야 합니다.' }, { status: 400 });
    users[userIndex].password = newPassword;
    return HttpResponse.json({ success: true, code: API_CODES.OK, message: '비밀번호가 성공적으로 변경되었습니다.' });
  }),

  http.get('/api/users', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const { search, page, limit, sortBy, sortOrder, params } = parseQueryParams(request);
    const filters = { status: params.get('status') || '', role: params.get('role') || '' };
    const result = processData(users, { search, searchFields: ['name', 'email', 'phone'], page, limit, sortBy, sortOrder, filters });
    // 패스워드 제외
    const sanitizedData = excludePasswordFromArray(result.items);
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { items: sanitizedData, pagination: result.pagination } });
  }),

  http.get('/api/users/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const user = users.find(u => u.id === params.id);
    if (!user) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(user) });
  }),

  http.post('/api/users', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const userData = await request.json() as Omit<User, 'id'>;
    if (users.some(u => u.email === userData.email)) return HttpResponse.json({ success: false, code: API_CODES.DUPLICATE_EMAIL, message: API_MESSAGES[API_CODES.DUPLICATE_EMAIL] }, { status: 400 });
    const newUser: User = { ...userData, id: `${Date.now()}`, createdAt: formatDate(new Date()) };
    users.push(newUser);
    return HttpResponse.json({ success: true, code: API_CODES.CREATED, data: excludePassword(newUser) }, { status: 201 });
  }),

  // PUT: 관리자 기본 정보 업데이트 (이름, 이메일, 전화번호만)
  http.put('/api/users/:id', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });

    const updates = await request.json() as Pick<User, 'name' | 'email' | 'phone'>;
    const userIndex = users.findIndex(u => u.id === params.id);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    // 기본 정보만 업데이트 (역할, 상태는 유지)
    users[userIndex] = {
      ...users[userIndex],
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
    };

    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(users[userIndex]) });
  }),

  // PATCH: 관리자 역할만 변경
  http.patch('/api/users/:id/role', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: '역할 변경 권한이 없습니다. 슈퍼 관리자만 가능합니다.' }, { status: 403 });

    const { role } = await request.json() as { role: string };
    const userIndex = users.findIndex(u => u.id === params.id);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    users[userIndex] = { ...users[userIndex], role };
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(users[userIndex]) });
  }),

  // PATCH: 관리자 상태만 변경
  http.patch('/api/users/:id/status', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: '상태 변경 권한이 없습니다. 슈퍼 관리자만 가능합니다.' }, { status: 403 });

    const { status } = await request.json() as { status: string };
    const userIndex = users.findIndex(u => u.id === params.id);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    users[userIndex] = { ...users[userIndex], status };
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(users[userIndex]) });
  }),

  http.delete('/api/users/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const initialLength = users.length;
    users = users.filter(u => u.id !== params.id);
    return users.length < initialLength ? HttpResponse.json({ success: true, code: API_CODES.OK, message: '사용자가 삭제되었습니다.' }, { status: 200 }) : HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }),

  http.post('/api/users/:id/approve', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    
    const userIndex = users.findIndex(u => u.id === params.id);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    
    // 승인자 정보 없이 상태와 승인일만 업데이트
    users[userIndex] = { ...users[userIndex], status: USER_STATUS.ACTIVE, approvedAt: formatDate(new Date()) };
    return HttpResponse.json({ success: true, code: API_CODES.OK, message: '관리자가 승인되었습니다.', data: excludePassword(users[userIndex]) });
  }),

  http.post('/api/users/:id/reject', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || auth.user!.role !== ROLES.SUPER_ADMIN) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    
    const { rejectionReason } = await request.json() as { rejectionReason: string };
    const userIndex = users.findIndex(u => u.id === params.id);
    if (userIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    
    // 거부자 정보 없이 상태, 거부일, 거부 사유만 업데이트
    users[userIndex] = { ...users[userIndex], status: USER_STATUS.REJECTED, rejectedAt: formatDate(new Date()), rejectionReason };
    return HttpResponse.json({ success: true, code: API_CODES.OK, message: '관리자 신청이 거부되었습니다.', data: excludePassword(users[userIndex]) });
  }),

  http.get('/api/products', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { search, page, limit, sortBy, sortOrder, params } = parseQueryParams(request);
    const filters = { category: params.get('category') || '', status: params.get('status') || '' };
    const result = processData(products, { search, searchFields: ['name', 'category'], page, limit, sortBy, sortOrder, filters });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { items: result.items, pagination: result.pagination } });
  }),

  http.get('/api/products/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const product = products.find(p => p.id === params.id);
    if (!product) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });

    // 하이브리드 방식: 리뷰 요약 정보와 최근 리뷰 자동 포함
    const productReviews = reviews.filter(r => r.productId === params.id);

    // 리뷰 요약 계산
    const reviewSummary = {
      averageRating: productReviews.length > 0
        ? parseFloat((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
        : 0,
      totalReviews: productReviews.length,
      fiveStarCount: productReviews.filter(r => r.rating === 5).length,
      fourStarCount: productReviews.filter(r => r.rating === 4).length,
      threeStarCount: productReviews.filter(r => r.rating === 3).length,
      twoStarCount: productReviews.filter(r => r.rating === 2).length,
      oneStarCount: productReviews.filter(r => r.rating === 1).length,
    };

    // 최근 리뷰 3개 가져오기
    const recentReviews = productReviews
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { ...product, reviewSummary, recentReviews } });
  }),

  http.post('/api/products', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const requestData = await request.json();
    const newProduct: Product = {
      name: requestData.name,
      category: requestData.category,
      price: requestData.price,
      stock: requestData.stock,
      status: requestData.status,
      image: requestData.image,
      id: `P${String(products.length + 1).padStart(3, '0')}`,
      createdAt: formatDate(new Date()),
      createdBy: auth.user!.userId,
      createdByName: auth.user!.name,
      createdByEmail: auth.user!.email
    };
    products.unshift(newProduct);
    return HttpResponse.json({ success: true, code: API_CODES.CREATED, data: newProduct }, { status: 201 });
  }),

  // PUT: 상품 기본 정보 업데이트 (이름, 카테고리, 가격만)
  http.put('/api/products/:id', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });

    const updates = await request.json() as Pick<Product, 'name' | 'category' | 'price'>;
    const productIndex = products.findIndex(p => p.id === params.id);
    if (productIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });

    // 기본 정보만 업데이트 (재고, 상태는 유지)
    products[productIndex] = {
      ...products[productIndex],
      name: updates.name,
      category: updates.category,
      price: updates.price,
    };

    return HttpResponse.json({ success: true, code: API_CODES.OK, data: products[productIndex] });
  }),

  // PATCH: 상품 재고만 변경
  http.patch('/api/products/:id/stock', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: '재고 변경 권한이 없습니다.' }, { status: 403 });

    const { stock } = await request.json() as { stock: number };
    const productIndex = products.findIndex(p => p.id === params.id);
    if (productIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });

    products[productIndex] = { ...products[productIndex], stock };

    // 단종 상태가 아닌 경우에만 재고에 따라 상태 자동 변경
    if (products[productIndex].status !== PRODUCT_STATUS.DISCONTINUED) {
      if (stock === 0) {
        products[productIndex].status = PRODUCT_STATUS.SOLD_OUT;
      } else if (stock > 0 && products[productIndex].status === PRODUCT_STATUS.SOLD_OUT) {
        products[productIndex].status = PRODUCT_STATUS.AVAILABLE;
      }
    }

    return HttpResponse.json({ success: true, code: API_CODES.OK, data: products[productIndex] });
  }),

  // PATCH: 상품 상태만 변경
  http.patch('/api/products/:id/status', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: '상태 변경 권한이 없습니다.' }, { status: 403 });

    const { status } = await request.json() as { status: string };
    const productIndex = products.findIndex(p => p.id === params.id);
    if (productIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });

    products[productIndex] = { ...products[productIndex], status };
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: products[productIndex] });
  }),

  http.delete('/api/products/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });

    // 상품 존재 여부 확인
    const product = products.find(p => p.id === params.id);
    if (!product) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });

    // 주문된 상품인지 확인
    const hasOrders = orders.some(o => o.productId === params.id);
    if (hasOrders) {
      return HttpResponse.json({
        success: false,
        code: API_CODES.HAS_RELATED_DATA,
        message: '해당 상품은 주문 내역이 존재하여 삭제할 수 없습니다.'
      }, { status: 400 });
    }

    const initialLength = products.length;
    products = products.filter(p => p.id !== params.id);
    return products.length < initialLength ? HttpResponse.json({ success: true, code: API_CODES.OK, message: '상품이 삭제되었습니다.' }, { status: 200 }) : HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }),

  http.get('/api/orders', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { search, page, limit, sortBy, sortOrder, params } = parseQueryParams(request);
    const filters = { status: params.get('status') || '' };
    const result = processData(orders, { search, searchFields: ['orderNo', 'customer', 'product'], page, limit, sortBy, sortOrder, filters });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { items: result.items, pagination: result.pagination } });
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const order = orders.find(o => o.id === params.id);
    if (!order) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '주문을 찾을 수 없습니다.' }, { status: 404 });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: order });
  }),

  http.post('/api/orders', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const orderData = await request.json() as Omit<Order, 'id'>;

    // 1. 고객 유효성 검증
    let customer = customers.find(c => c.id === orderData.customerId);
    if (!customer && orderData.customer) {
      customer = customers.find(c => c.name === orderData.customer);
    }
    if (!customer) {
      return HttpResponse.json({
        success: false,
        code: 'CUSTOMER_NOT_FOUND',
        message: '고객을 찾을 수 없습니다. 유효한 고객을 선택해주세요.'
      }, { status: 404 });
    }

    // 2. 상품 유효성 검증
    let product = products.find(p => p.id === orderData.productId);
    if (!product && orderData.product) {
      product = products.find(p => p.name === orderData.product);
    }
    if (!product) {
      return HttpResponse.json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: '상품을 찾을 수 없습니다. 유효한 상품을 선택해주세요.'
      }, { status: 404 });
    }

    // 3. 상품 상태 확인 (단종 상태)
    if (product.status === PRODUCT_STATUS.DISCONTINUED) {
      return HttpResponse.json({
        success: false,
        code: 'PRODUCT_DISCONTINUED',
        message: '단종된 상품은 주문할 수 없습니다.'
      }, { status: 400 });
    }

    // 4. 상품 상태 확인 (품절 상태)
    if (product.status === PRODUCT_STATUS.SOLD_OUT) {
      return HttpResponse.json({
        success: false,
        code: 'PRODUCT_SOLD_OUT',
        message: '품절된 상품은 주문할 수 없습니다.'
      }, { status: 400 });
    }

    // 5. 재고 확인
    const requestedQuantity = orderData.quantity || 1;
    if (product.stock < requestedQuantity) {
      return HttpResponse.json({
        success: false,
        code: 'INSUFFICIENT_STOCK',
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개, 요청 수량: ${requestedQuantity}개)`
      }, { status: 400 });
    }

    // 6. 재고 감소
    const productIndex = products.findIndex(p => p.id === product!.id);
    products[productIndex].stock -= requestedQuantity;

    // 7. 재고 상태 업데이트 (단종 상태가 아닐 때만)
    if (products[productIndex].status !== PRODUCT_STATUS.DISCONTINUED) {
      if (products[productIndex].stock === 0) {
        products[productIndex].status = PRODUCT_STATUS.SOLD_OUT;
      }
    }

    // 8. 주문 생성
    const today = new Date();
    const dateStr = formatDate(today).replace(/-/g, '');
    const todayOrderNos = orders.filter(o => o.orderNo.startsWith(dateStr));
    const newSeq = (todayOrderNos.length + 1).toString().padStart(3, '0');
    const newOrderNo = `${dateStr}-${newSeq}`;

    // 내부 ID 생성 (현재 최대 ID 번호 + 1)
    const maxIdNum = orders.reduce((max, o) => {
      const num = parseInt(o.id.replace('ORDER-', ''));
      return num > max ? num : max;
    }, 0);
    const newInternalId = `ORDER-${String(maxIdNum + 1).padStart(4, '0')}`;

    // 관리자 정보 조회 (JWT 페이로드의 userId 사용)
    const adminUser = users.find(u => u.id === auth.user!.userId);

    const newOrder: Order = {
      ...orderData,
      id: newInternalId,
      orderNo: newOrderNo,
      customerId: customer.id,
      customer: customer.name,
      customerEmail: customer.email,
      productId: product.id,
      product: product.name,
      quantity: requestedQuantity,
      date: formatDate(today),
      createdByAdminId: adminUser?.id,
      createdByAdminName: adminUser?.name,
      createdByAdminEmail: adminUser?.email,
      createdByAdminRole: adminUser?.role,
    };
    orders.unshift(newOrder);

    // 9. 고객 통계 업데이트 (취소된 주문 제외)
    const customerIndex = customers.findIndex(c => c.id === customer!.id);
    const customerOrders = orders.filter(o => o.customerId === customer!.id && o.status !== ORDER_STATUS.CANCELLED);
    customers[customerIndex].totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + parseAmount(order.amount), 0);
    customers[customerIndex].totalSpent = formatAmount(totalSpent);

    return HttpResponse.json({ success: true, code: API_CODES.CREATED, data: newOrder }, { status: 201 });
  }),

  http.patch('/api/orders/:id/status', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { status, cancellationReason } = await request.json() as { status: OrderStatus; cancellationReason?: string };
    const orderIndex = orders.findIndex(o => o.id === params.id);
    if (orderIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '주문을 찾을 수 없습니다.' }, { status: 404 });

    const previousOrder = { ...orders[orderIndex] };

    // 주문 취소는 준비중 상태에서만 허용
    if (status === ORDER_STATUS.CANCELLED && previousOrder.status !== ORDER_STATUS.PREPARING) {
      return HttpResponse.json({
        success: false,
        code: 'INVALID_STATUS_CHANGE',
        message: '주문 취소는 준비중 상태에서만 가능합니다.'
      }, { status: 400 });
    }

    orders[orderIndex] = { ...orders[orderIndex], status, ...(cancellationReason && { cancellationReason }) };

    // 주문이 취소(CANCELLED)로 변경되었고, 이전에 취소 상태가 아니었다면 재고 복구
    if (status === ORDER_STATUS.CANCELLED && previousOrder.status !== ORDER_STATUS.CANCELLED) {
      const product = products.find(p => p.id === previousOrder.productId);
      if (product) {
        const productIndex = products.findIndex(p => p.id === product.id);
        // 재고 복구 (주문 수량만큼 증가)
        products[productIndex].stock += previousOrder.quantity;

        // 재고가 복구되면 상태 변경 (단종 상태가 아닐 때만)
        if (products[productIndex].status !== PRODUCT_STATUS.DISCONTINUED) {
          if (products[productIndex].stock > 0 && products[productIndex].status === PRODUCT_STATUS.SOLD_OUT) {
            products[productIndex].status = PRODUCT_STATUS.AVAILABLE;
          }
        }
      }

      // 고객 통계 업데이트 (취소된 주문 제외)
      const customer = customers.find(c => c.id === previousOrder.customerId);
      if (customer) {
        const customerIndex = customers.findIndex(c => c.id === customer.id);
        const customerOrders = orders.filter(o => o.customerId === customer.id && o.status !== ORDER_STATUS.CANCELLED);
        customers[customerIndex].totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, o) => sum + parseAmount(o.amount), 0);
        customers[customerIndex].totalSpent = formatAmount(totalSpent);
      }
    }

    return HttpResponse.json({ success: true, code: API_CODES.OK, data: orders[orderIndex] });
  }),

  http.delete('/api/orders/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });

    const order = orders.find(o => o.id === params.id);
    if (!order) {
      return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 재고 복구 (취소되지 않은 주문만)
    if (order.status !== ORDER_STATUS.CANCELLED) {
      const product = products.find(p => p.id === order.productId);
      if (product) {
        const productIndex = products.findIndex(p => p.id === product.id);
        products[productIndex].stock += order.quantity;

        // 재고가 복구되면 상태 변경 (단종 상태가 아닐 때만)
        if (products[productIndex].status !== PRODUCT_STATUS.DISCONTINUED) {
          if (products[productIndex].stock > 0 && products[productIndex].status === PRODUCT_STATUS.SOLD_OUT) {
            products[productIndex].status = PRODUCT_STATUS.AVAILABLE;
          }
        }
      }
    }

    // 주문 삭제
    const initialLength = orders.length;
    orders = orders.filter(o => o.id !== params.id);

    // 고객 통계 업데이트 (취소된 주문 제외)
    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      const customerIndex = customers.findIndex(c => c.id === customer.id);
      const customerOrders = orders.filter(o => o.customerId === customer.id && o.status !== ORDER_STATUS.CANCELLED);
      customers[customerIndex].totalOrders = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, o) => sum + parseAmount(o.amount), 0);
      customers[customerIndex].totalSpent = formatAmount(totalSpent);
    }

    return orders.length < initialLength ? HttpResponse.json({ success: true, code: API_CODES.OK, message: '주문이 삭제되었습니다.' }, { status: 200 }) : HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }),

  http.get('/api/reviews', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { search, page, limit, sortBy, sortOrder, params } = parseQueryParams(request);
    const filters = {
      rating: params.get('rating') || '',
      productId: params.get('productId') || '',
      customerId: params.get('customerId') || ''
    };
    const result = processData(reviews, { search, searchFields: ['customer', 'product', 'comment'], page, limit, sortBy, sortOrder, filters });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { items: result.items, pagination: result.pagination } });
  }),

  http.get('/api/reviews/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const review = reviews.find(r => r.id === params.id);
    if (!review) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: review });
  }),

  http.post('/api/reviews', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const reviewData = await request.json() as Omit<Review, 'id'>;
    const newReview: Review = { ...reviewData, id: `${Date.now()}`, date: formatDate(new Date()) };
    reviews.push(newReview);
    return HttpResponse.json({ success: true, code: API_CODES.CREATED, data: newReview }, { status: 201 });
  }),

  http.delete('/api/reviews/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || (auth.user!.role !== ROLES.SUPER_ADMIN && auth.user!.role !== ROLES.OPERATION_ADMIN)) return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: API_MESSAGES[API_CODES.FORBIDDEN] }, { status: 403 });
    const initialLength = reviews.length;
    reviews = reviews.filter(r => r.id !== params.id);
    return reviews.length < initialLength ? HttpResponse.json({ success: true, code: API_CODES.OK, message: '리뷰가 삭제되었습니다.' }, { status: 200 }) : HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
  }),

  http.get('/api/customers', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { search, page, limit, sortBy, sortOrder, params } = parseQueryParams(request);
    const filters = { status: params.get('status') || '' };
    const result = processData(customers, { search, searchFields: ['name', 'email', 'phone'], page, limit, sortBy, sortOrder, filters });
    // 패스워드 제외
    const sanitizedData = excludePasswordFromArray(result.items);
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { items: sanitizedData, pagination: result.pagination } });
  }),

  http.get('/api/customers/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const customer = customers.find(c => c.id === params.id);
    if (!customer) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(customer) });
  }),

  http.post('/api/customers', async ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const customerData = await request.json() as Omit<Customer, 'id'>;
    if (customers.some(c => c.email === customerData.email)) return HttpResponse.json({ success: false, code: API_CODES.DUPLICATE_EMAIL, message: API_MESSAGES[API_CODES.DUPLICATE_EMAIL] }, { status: 400 });
    const newCustomer: Customer = { ...customerData, id: `C${Date.now()}`, createdAt: formatDate(new Date()), lastLoginAt: formatDate(new Date()), totalOrders: 0, totalSpent: '0원' };
    customers.push(newCustomer);
    return HttpResponse.json({ success: true, code: API_CODES.CREATED, data: excludePassword(newCustomer) }, { status: 201 });
  }),

  http.put('/api/customers/:id', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const updates = await request.json() as Partial<Customer>;
    const customerIndex = customers.findIndex(c => c.id === params.id);
    if (customerIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });

    // 이메일 중복 체크 (자기 자신 제외)
    if (updates.email && customers.some(c => c.email === updates.email && c.id !== params.id)) {
      return HttpResponse.json({ success: false, code: API_CODES.DUPLICATE_EMAIL, message: API_MESSAGES[API_CODES.DUPLICATE_EMAIL] }, { status: 400 });
    }

    customers[customerIndex] = { ...customers[customerIndex], ...updates };
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(customers[customerIndex]) });
  }),

  http.patch('/api/customers/:id', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const updates = await request.json() as Partial<Customer>;
    const customerIndex = customers.findIndex(c => c.id === params.id);
    if (customerIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });
    customers[customerIndex] = { ...customers[customerIndex], ...updates };
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: excludePassword(customers[customerIndex]) });
  }),

  http.patch('/api/customers/:id/status', async ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const { status } = await request.json() as { status: string };
    const customerIndex = customers.findIndex(c => c.id === params.id);
    if (customerIndex === -1) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });
    customers[customerIndex] = { ...customers[customerIndex], status };
    return HttpResponse.json({ success: true, code: API_CODES.OK, message: '고객 상태가 업데이트되었습니다.', data: excludePassword(customers[customerIndex]) });
  }),

  http.delete('/api/customers/:id', ({ request, params }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });

    // 권한 체크: SUPER_ADMIN만 고객 삭제 가능
    if (auth.user!.role !== ROLES.SUPER_ADMIN) {
      return HttpResponse.json({ success: false, code: API_CODES.FORBIDDEN, message: '고객 삭제 권한이 없습니다. 슈퍼 관리자만 가능합니다.' }, { status: 403 });
    }

    // 고객 존재 여부 확인
    const customer = customers.find(c => c.id === params.id);
    if (!customer) return HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });

    // 주문 내역이 있는지 확인
    const hasOrders = orders.some(o => o.customerId === params.id);
    if (hasOrders) {
      return HttpResponse.json({
        success: false,
        code: API_CODES.HAS_RELATED_DATA,
        message: '해당 고객은 주문 내역이 존재하여 삭제할 수 없습니다.'
      }, { status: 400 });
    }

    // 리뷰를 작성한 적이 있는지 확인
    const hasReviews = reviews.some(r => r.customerId === params.id);
    if (hasReviews) {
      return HttpResponse.json({
        success: false,
        code: API_CODES.HAS_RELATED_DATA,
        message: '해당 고객은 작성한 리뷰가 존재하여 삭제할 수 없습니다.'
      }, { status: 400 });
    }

    const initialLength = customers.length;
    customers = customers.filter(c => c.id !== params.id);
    return customers.length < initialLength ? HttpResponse.json({ success: true, code: API_CODES.OK, message: '고객이 삭제되었습니다.' }, { status: 200 }) : HttpResponse.json({ success: false, code: API_CODES.NOT_FOUND, message: '고객을 찾을 수 없습니다.' }, { status: 404 });
  }),

  http.get('/api/dashboard/stats', ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return HttpResponse.json({ success: false, code: auth.code!, message: auth.message! }, { status: 401 });
    const today = formatDate(new Date());
    const summary = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === USER_STATUS.ACTIVE).length,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === CUSTOMER_STATUS.ACTIVE).length,
      totalProducts: products.length,
      lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= 5).length,
      totalOrders: orders.filter(o => o.status !== ORDER_STATUS.CANCELLED).length,
      todayOrders: orders.filter(o => o.date === today && o.status !== ORDER_STATUS.CANCELLED).length,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
    };
    const widgets = {
      totalRevenue: orders.filter(o => o.status !== ORDER_STATUS.CANCELLED).reduce((sum, order) => sum + parseAmount(order.amount), 0),
      todayRevenue: orders.filter(o => o.date === today && o.status !== ORDER_STATUS.CANCELLED).reduce((sum, order) => sum + parseAmount(order.amount), 0),
      preparingOrders: orders.filter(o => o.status === ORDER_STATUS.PREPARING).length,
      shippingOrders: orders.filter(o => o.status === ORDER_STATUS.SHIPPING).length,
      completedOrders: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length,
      lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= 5).length,
      outOfStockProducts: products.filter(p => p.status === PRODUCT_STATUS.SOLD_OUT || p.stock === 0).length,
    };
    const charts = {
      reviewRating: [1, 2, 3, 4, 5].map(rating => ({ rating, count: reviews.filter(r => r.rating === rating).length })),
      customerStatus: Object.values(CUSTOMER_STATUS).map(status => ({ status, count: customers.filter(c => c.status === status).length })).filter(item => item.count > 0),
      productCategory: (() => {
        const categoryMap = new Map<string, number>();
        products.forEach(product => {
          const category = product.category || '기타';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
      })(),
    };
    const recentOrders = orders.slice(0, 10);
    return HttpResponse.json({ success: true, code: API_CODES.OK, data: { summary, widgets, charts, recentOrders } });
  }),
];
