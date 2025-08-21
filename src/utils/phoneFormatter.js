/**
 * 전화번호 포맷팅 유틸리티
 * 사용자가 xxxxxxxxxx 형식으로 입력하면 +82 xxx xxx xxxx 형식으로 변환
 */

/**
 * 전화번호를 국제 형식으로 변환
 * @param {string} phoneNumber - 입력된 전화번호 (예: 01012345678)
 * @returns {string} - 포맷된 전화번호 (예: +82 10 1234 5678)
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 한국 전화번호 형식 확인 (10-11자리)
  if (cleaned.length === 10 || cleaned.length === 11) {
    // 010으로 시작하는 경우
    if (cleaned.startsWith('010')) {
      return `+82 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}`;
    }
    // 02로 시작하는 경우 (서울 지역번호)
    else if (cleaned.startsWith('02')) {
      return `+82 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
    }
    // 기타 지역번호 (031, 032, 033 등)
    else {
      return `+82 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
    }
  }
  
  // 이미 +82 형식인 경우 그대로 반환
  if (phoneNumber.startsWith('+82')) {
    return phoneNumber;
  }
  
  // 형식에 맞지 않는 경우 원본 반환
  return phoneNumber;
}

/**
 * 전화번호 입력 시 실시간 포맷팅
 * @param {string} value - 입력값
 * @returns {string} - 포맷된 값
 */
export function formatPhoneInput(value) {
  if (!value) return '';
  
  // +01, +02 등 잘못된 형식 자동 수정
  if (value.startsWith('+0')) {
    value = value.substring(2); // +0 제거
  }
  
  // 숫자만 추출
  const cleaned = value.replace(/\D/g, '');
  
  // 11자리 초과 시 잘라내기
  if (cleaned.length > 11) {
    return cleaned.substring(0, 11);
  }
  
  // 실시간 포맷팅 (입력 중일 때는 간단한 형식)
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  } else {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  }
}

/**
 * 전화번호 유효성 검사
 * @param {string} phoneNumber - 검사할 전화번호
 * @returns {boolean} - 유효성 여부
 */
export function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // +01, +02 등 잘못된 형식 검사
  if (phoneNumber.startsWith('+0')) {
    return false;
  }
  
  // 한국 전화번호 형식 검사
  const patterns = [
    /^010\d{8}$/, // 휴대폰
    /^02\d{7,8}$/, // 서울
    /^0[3-9]\d{7,8}$/, // 지역번호
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * 전화번호 표시용 포맷팅 (읽기 전용)
 * @param {string} phoneNumber - 표시할 전화번호
 * @returns {string} - 포맷된 전화번호
 */
export function displayPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // 이미 +82 형식인 경우 한국 형식으로 변환
  if (phoneNumber.startsWith('+82')) {
    const cleaned = phoneNumber.replace('+82', '').replace(/\s/g, '');
    if (cleaned.startsWith('10')) {
      return `010-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.startsWith('2')) {
      return `02-${cleaned.substring(1, 5)}-${cleaned.substring(5)}`;
    } else {
      return `0${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
  }
  
  // 일반 형식인 경우 그대로 반환
  return phoneNumber;
}
