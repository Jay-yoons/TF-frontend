// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import axios from '@/api/axios';
import { useUserStore } from '@/stores/userStore';

/* ============================================
   💥 전역 차단기 #1: "앱 내부" /logout 으로의 이동 완전 봉쇄
   - a태그 클릭, window.open, location.assign/replace,
     history.pushState/replaceState 까지 차단
   ============================================ */
(function blockAppLogoutPath() {
  const isLogoutUrl = (url) => {
    try {
      const u = typeof url === 'string' ? new URL(url, window.location.href) : url;
      return u.origin === window.location.origin &&
             u.pathname.replace(/\/+$/, '') === '/logout';
    } catch { return false; }
  };

  // a 태그 클릭 차단 (캡처 단계)
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (isLogoutUrl(href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      // 곧바로 홈으로
      history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, true);

  // window.open 차단
  try {
    const _open = window.open;
    window.open = function (url, ...rest) {
      if (typeof url === 'string' && isLogoutUrl(url)) return null;
      return _open.call(window, url, ...rest);
    };
  } catch (e) { void 0; }

  // location.assign / replace 차단
  try {
    const _assign = window.location.assign.bind(window.location);
    window.location.assign = (url) => {
      if (typeof url === 'string' && isLogoutUrl(url)) {
        history.replaceState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      return _assign(url);
    };
  } catch (e) { void 0; }
  try {
    const _replace = window.location.replace.bind(window.location);
    window.location.replace = (url) => {
      if (typeof url === 'string' && isLogoutUrl(url)) {
        history.replaceState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      return _replace(url);
    };
  } catch (e) { void 0; }

  // history.pushState / replaceState 차단
  try {
    const _push = history.pushState.bind(history);
    history.pushState = (state, title, url) => {
      if (isLogoutUrl(url)) return _push(state, title, '/');
      return _push(state, title, url);
    };
    const _histReplace = history.replaceState.bind(history);
    history.replaceState = (state, title, url) => {
      if (isLogoutUrl(url)) return _histReplace(state, title, '/');
      return _histReplace(state, title, url);
    };
  } catch (e) { void 0; }
})();

(function blockCognitoLoginRedirects() {
  const re = /https:\/\/[^/]*\.auth\.[^/]*\.amazoncognito\.com\/login\?.*logout_uri=/i;
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (re.test(href)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  try {
    const _assign = window.location.assign.bind(window.location);
    window.location.assign = (url) => (typeof url === 'string' && re.test(url)) ? void 0 : _assign(url);
  } catch (e) { void 0; }
  try {
    const _replace = window.location.replace.bind(window.location);
    window.location.replace = (url) => (typeof url === 'string' && re.test(url)) ? void 0 : _replace(url);
  } catch (e) { void 0; }
})();

// ============================
// 앱/스토어/라우터 초기화
// ============================
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

const userStore = useUserStore();

// ============================
// Axios 인터셉터 - 인증 토큰 자동 부착
// ============================
axios.interceptors.request.use(
  (config) => {
    const idToken = localStorage.getItem('idToken');
    const isPublicPath =
      config.url.includes('/bookings/seats/') || config.url.includes('/health');
    if (!isPublicPath && idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 응답 시 자동 로그아웃
axios.interceptors.response.use(
  (response) => response,
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

// ============================
// 라우터 가드
// ============================
router.beforeEach(async (to, from, next) => {
  // 로컬 토큰이 있는데 스토어가 초기화 전이면 초기화
  if (!userStore.isAuthenticated && localStorage.getItem('idToken')) {
    await userStore.initializeStore();
  }

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
