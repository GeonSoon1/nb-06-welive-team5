export const formatPhoneNum = (phone: string | undefined | null): string => {
  // 1. 방어 코드: phone이 없거나 문자열이 아니면 빈 문자열 반환
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const cleaned = phone.replace(/[^0-9]/g, '');

  // 2. 02 지역번호 (서울)
  if (cleaned.startsWith('02')) {
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
  }

  // 3. 휴대폰 번호 (010, 011 등) 및 일반 지역번호 (031, 051 등)
  // 대부분의 한국 전화번호는 10자리(3-3-4) 또는 11자리(3-4-4)입니다.
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 4. 형식에 맞지 않는 경우 원본 또는 숫자만 있는 값 반환
  return cleaned || phone;
};