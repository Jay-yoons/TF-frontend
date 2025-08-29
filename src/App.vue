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
  </div>
</template>

<script>
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import axios from '@/api/axios';
import MessageModal from '@/components/MessageModal.vue';

export default {
  name: 'App',
  components: {
    MessageModal
  },
  setup() {
    const userStore = useUserStore();

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

    // 전역 모달 이벤트 리스너
    const handleGlobalModalEvents = () => {
      // 로그인 성공 모달
      if (window.showLoginSuccessModal) {
        showMessageModal(
          '로그인 완료',
          '로그인이 성공적으로 완료되었습니다!',
          '확인'
        );
        window.showLoginSuccessModal = false;
      }

      // 로그인 오류 모달
      if (window.showLoginErrorModal) {
        showMessageModal(
          '로그인 오류',
          window.loginErrorMessage || '로그인 중 오류가 발생했습니다.',
          '확인'
        );
        window.showLoginErrorModal = false;
        window.loginErrorMessage = '';
      }

      if (window.showLogoutSuccessModal) {
        showMessageModal(
          '로그아웃 완료',
          '성공적으로 로그아웃되었습니다.',
          '확인'
        );
        window.showLogoutSuccessModal = false;
      }
    };

    // 주기적으로 전역 모달 이벤트 확인
    setInterval(handleGlobalModalEvents, 100);

    const login = async () => {
      try {
        const response = await axios.get('/api/users/login/url');
        const loginUrl = response.data.url;
        window.location.href = loginUrl;
      } catch (err) {
        console.error('로그인 URL을 불러오는 데 실패했습니다.', err);
        showMessageModal(
          '로그인 오류',
          '로그인 페이지로 이동할 수 없습니다. 다시 시도해주세요.',
          '확인'
        );
      }
    };

    const logout = () => {
      userStore.logout();
      // userStore.logout()에서 이미 홈페이지로 리다이렉트되므로 
      // 여기서는 추가 작업이 필요하지 않습니다
    };

    return {
      userStore,
      login,
      logout,
      showModal,
      modalTitle,
      modalMessage,
      modalButtonText,
      closeModal
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