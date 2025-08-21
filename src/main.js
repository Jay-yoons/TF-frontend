import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

const userStore = useUserStore();

// Axios 인터셉터 설정 - 모든 요청에 인증 토큰 자동 추가
axios.interceptors.request.use(
  (config) => {
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 자동 로그아웃
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('401 에러 감지. 자동 로그아웃 처리.');
      userStore.clearAllData();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

app.use(router);

router.beforeEach(async (to, from, next) => {
    // Check localStorage for idToken to initialize the store and authentication state.
    if (!userStore.isAuthenticated && localStorage.getItem('idToken')) {
        await userStore.initializeStore();
    }

    // Redirect to login if a protected route is accessed without being authenticated.
    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
        console.log('User is not authenticated. Redirecting to login page.');
        next({ name: 'Login' });
    } else {
        next();
    }
});

router.isReady().then(() => {
  app.mount('#app');
});