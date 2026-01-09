/**
 * 날짜를 yyyy-mm-dd 형식으로 포맷팅합니다.
 * @param date - Date 객체, ISO 문자열, 또는 날짜 문자열
 * @returns yyyy-mm-dd 형식의 문자열
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Invalid Date 체크
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    return '-';
  }
};

/**
 * 날짜 문자열이 이미 yyyy-mm-dd 형식인 경우 그대로 반환하고,
 * 그렇지 않으면 포맷팅합니다.
 */
export const ensureDateFormat = (date: string | undefined | null): string => {
  if (!date) return '-';

  // 이미 yyyy-mm-dd 형식인 경우 (예: "2024-12-20")
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(date)) {
    return date;
  }

  // 그렇지 않으면 포맷팅
  return formatDate(date);
};
