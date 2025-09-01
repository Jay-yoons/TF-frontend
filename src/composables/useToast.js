import { ref } from 'vue';

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  duration: 3000
});

let timeoutId = null;

export function useToast() {
  const showToast = (message, type = 'info', duration = 3000) => {
    // 기존 토스트가 있다면 제거
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 새 토스트 표시
    toast.value = {
      show: true,
      message,
      type,
      duration
    };
    
    // 자동 숨김 설정
    timeoutId = setTimeout(() => {
      hideToast();
    }, duration);
  };
  
  const hideToast = () => {
    toast.value.show = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  const showSuccess = (message, duration = 3000) => {
    showToast(message, 'success', duration);
  };
  
  const showError = (message, duration = 4000) => {
    showToast(message, 'error', duration);
  };
  
  const showWarning = (message, duration = 3500) => {
    showToast(message, 'warning', duration);
  };
  
  const showInfo = (message, duration = 3000) => {
    showToast(message, 'info', duration);
  };
  
  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
