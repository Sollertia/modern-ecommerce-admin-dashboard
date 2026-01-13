/**
 * 숫자를 통화 형식으로 포맷팅
 * @param amount - 포맷팅할 금액 (숫자)
 * @param currency - 통화 기호 (기본값: '원')
 * @returns 포맷팅된 문자열 (예: "1,000원")
 */
export function formatCurrency(amount: number | undefined | null, currency: string = '원'): string {
  if (amount === undefined || amount === null) {
    return '-';
  }

  // 숫자를 천 단위로 콤마 추가
  const formatted = amount.toLocaleString('ko-KR');
  return `${formatted}${currency}`;
}

/**
 * 숫자를 천 단위 콤마로 포맷팅 (통화 기호 없이)
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "1,000")
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return '-';
  }

  return num.toLocaleString('ko-KR');
}
