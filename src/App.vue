<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-left">
        <router-link to="/" class="navbar-home-button">
          지역가게예약서비스
        </router-link>
      </div>
      <div class="navbar-right">
        <div v-if="userStore.isAuthenticated" class="navbar-authenticated-links">
          <router-link to="/mypage" class="navbar-link">
            마이페이지
          </router-link>
          <router-link to="/bookings" class="navbar-link">
            예약 목록
          </router-link>
          <button @click="logout" class="navbar-link navbar-logout-button">
            로그아웃
          </button>
        </div>
        <div v-else>
          <button @click="login" class="navbar-link navbar-login-button">
            로그인
          </button>
        </div>
      </div>
    </nav>
    <main class="main-content-container">
      <router-view></router-view>
    </main>

    <!-- 메시지 모달 -->
    <MessageModal :is-visible="showModal" :title="modalTitle" :message="modalMessage" :button-text="modalButtonText"
      @close="closeModal" />
    
    <!-- 토스트 알림 -->
    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      :duration="toast.duration"
      @hide="hideToast" 
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/composables/useToast';
import axios from '@/api/axios';
import MessageModal from '@/components/MessageModal.vue';
import Toast from '@/components/Toast.vue';

export default {
  name: 'App',
  components: {
    MessageModal,
    Toast
  },
  setup() {
    const userStore = useUserStore();
    const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

    // 모달 상태 관리
    const showModal = ref(false);
    const modalTitle = ref('');
    const modalMessage = ref('');
    const modalButtonText = ref('확인');

    const showMessageModal = (title, message, buttonText = '확인') => {
      modalTitle.value = title;
      modalMessage.value = message;
      modalButtonText.value = buttonText;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    // 전역 토스트 이벤트 리스너
    const handleGlobalToastEvents = () => {
      // 로그인 성공 토스트
      if (window.showLoginSuccessToast) {
        showSuccess('로그인이 성공적으로 완료되었습니다!');
        window.showLoginSuccessToast = false;
      }

      // 로그인 오류 토스트
      if (window.showLoginErrorToast) {
        showError(window.loginErrorMessage || '로그인 중 오류가 발생했습니다.');
        window.showLoginErrorToast = false;
        window.loginErrorMessage = '';
      }

      // 로그아웃 성공 토스트
      if (window.showLogoutSuccessToast) {
        showInfo('성공적으로 로그아웃되었습니다.');
        window.showLogoutSuccessToast = false;
      }

      // 일반 성공 토스트
      if (window.showSuccessToast) {
        showSuccess(window.successMessage || '성공적으로 처리되었습니다.');
        window.showSuccessToast = false;
        window.successMessage = '';
      }

      // 일반 오류 토스트
      if (window.showErrorToast) {
        showError(window.errorMessage || '오류가 발생했습니다.');
        window.showErrorToast = false;
        window.errorMessage = '';
      }
    };

    // 주기적으로 전역 토스트 이벤트 확인
    setInterval(handleGlobalToastEvents, 100);

    const login = async () => {
      try {
        const response = await axios.get('/api/users/login/url');
        const loginUrl = response.data.url;
        window.location.href = loginUrl;
      } catch (err) {
        console.error('로그인 URL을 불러오는 데 실패했습니다.', err);
        showError('로그인 페이지로 이동할 수 없습니다. 다시 시도해주세요.');
      }
    };

    const logout = () => {
      userStore.logout();
      showInfo('로그아웃되었습니다.');
    };

    return {
      userStore,
      login,
      logout,
      showModal,
      modalTitle,
      modalMessage,
      modalButtonText,
      closeModal,
      toast,
      hideToast
    };
  },
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Noto Sans KR', sans-serif;
  color: #2c3e50;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main-content-container {
  padding: 20px;
}

.navbar {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-left {
  font-size: 18px;
  font-weight: bold;
}

.navbar-home-button {
  text-decoration: none;
  color: #ff5722;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.navbar-authenticated-links {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.navbar-link {
  text-decoration: none;
  color: #777;
  font-weight: 500;
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.navbar-link:hover {
  color: #ff5722;
}
</style>