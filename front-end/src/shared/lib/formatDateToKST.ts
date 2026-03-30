export const formatDateToKST = (dateStr: string) => {
  // [1차 방어] 데이터가 null, undefined, 빈 문자열인 경우
  if (!dateStr) return '-';

  // [2차 방어] 포맷 정규화
  // "2026-03-30 00:45:31" 처럼 공백이 있으면 'T'로 변경
  let safeDateStr = dateStr.replace(' ', 'T');

  // 만약 끝에 'Z'가 없고, '+09:00' 같은 타임존 정보도 없다면 UTC로 간주하고 'Z'를 붙여줌
  if (!safeDateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(safeDateStr)) {
    safeDateStr += 'Z';
  }

  // Date 객체 생성
  const date = new Date(safeDateStr);

  // [3차 방어] Date 객체는 만들어졌지만, 실제로는 유효하지 않은 날짜인 경우 (예: "가나다라")
  if (isNaN(date.getTime())) return 'Invalid Date'; // 또는 '-' 로 반환하셔도 됩니다.

  // 정상적으로 한국 시간으로 변환
  return date
    .toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\. /g, '-')
    .replace(/\./g, '');
};