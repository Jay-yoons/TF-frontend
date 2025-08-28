import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import axios from '@/api/axios';
import { useUserStore } from '@/stores/userStore';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

const userStore = useUserStore();

// Axios 인터셉터 설정 - 모든 요청에 인증 토큰 자동 추가
axios.interceptors.request.use(
  (config) => {
    const idToken = localStorage.getItem('idToken');

    // 특정 경로는 Authorization 안 붙이게
    const isPublicPath = config.url.includes('/bookings/seats/') || config.url.includes('/health');

    if (!isPublicPath && idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
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
      router.push('/');
    }
    return Promise.reject(error);
  }
);

app.use(router);


// =========================
// 💥 전역 차단기: Cognito /login?…&logout_uri=… 로의 상위창 이동 완전 봉쇄
//  - a 태그 클릭
//  - window.open
//  - location.assign / location.replace
// =========================
(function blockCognitoLoginRedirects() {
  const re = /https:\/\/[^/]*\.auth\.[^/]*\.amazoncognito\.com\/login\?.*logout_uri=/i;

  // 1) a 태그 클릭 가로채기 (캡처 단계)
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (re.test(href)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
          router.push({ name: 'Logout' });
        } catch (err) {
          try { router.push('/logout'); } catch (_) { /* noop */ }
        }
      }
    },
    true
  );

  // 2) window.open 차단
  try {
    const _open = window.open;
    window.open = function (url, ...rest) {
      if (typeof url === 'string' && re.test(url)) return null;
      return _open.call(window, url, ...rest);
    };
  } catch (e) { void 0; }

  // 3) location.assign 차단
  try {
    const _assign = window.location.assign.bind(window.location);
    window.location.assign = (url) => {
      if (typeof url === 'string' && re.test(url)) return;
      return _assign(url);
    };
  } catch (e) { void 0; }

  // 4) location.replace 차단
  try {
    const _replace = window.location.replace.bind(window.location);
    window.location.replace = (url) => {
      if (typeof url === 'string' && re.test(url)) return;
      return _replace(url);
    };
  } catch (e) { void 0; }
})();

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