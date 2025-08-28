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

  // 현재 URL이 /logout인 경우 즉시 홈으로 리다이렉트
  if (window.location.pathname.replace(/\/+$/, '') === '/logout') {
    console.log('🚫 /logout 경로 감지! 즉시 홈으로 리다이렉트');
    history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // 모든 URL 변경을 감지하여 /logout 차단
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(state, title, url) {
    if (url && url.toString().includes('/logout')) {
      console.log('🚫 pushState에서 /logout 차단:', url);
      url = '/';
    }
    return originalPushState.call(this, state, title, url);
  };
  
  history.replaceState = function(state, title, url) {
    if (url && url.toString().includes('/logout')) {
      console.log('🚫 replaceState에서 /logout 차단:', url);
      url = '/';
    }
    return originalReplaceState.call(this, state, title, url);
  };

  // a 태그 클릭 차단 (캡처 단계)
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (isLogoutUrl(href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      console.log('🚫 a태그 /logout 클릭 차단');
      // 곧바로 홈으로
      history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, true);

  // window.open 차단
  try {
    const _open = window.open;
    window.open = function (url, ...rest) {
      if (typeof url === 'string' && isLogoutUrl(url)) {
        console.log('🚫 window.open /logout 차단');
        return null;
      }
      return _open.call(window, url, ...rest);
    };
  } catch (e) { void 0; }

  // location.assign / replace 차단
  try {
    const _assign = window.location.assign.bind(window.location);
    window.location.assign = (url) => {
      if (typeof url === 'string' && isLogoutUrl(url)) {
        console.log('🚫 location.assign /logout 차단');
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
        console.log('🚫 location.replace /logout 차단');
        history.replaceState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      return _replace(url);
    };
  } catch (e) { void 0; }

  // popstate 이벤트에서도 /logout 체크
  window.addEventListener('popstate', () => {
    if (window.location.pathname.replace(/\/+$/, '') === '/logout') {
      console.log('🚫 popstate에서 /logout 감지! 홈으로 리다이렉트');
      history.replaceState(null, '', '/');
    }
  });

  // URL 변경 감지 (MutationObserver 사용)
  const observer = new MutationObserver(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/logout') {
      console.log('🚫 MutationObserver에서 /logout 감지! 홈으로 리다이렉트');
      history.replaceState(null, '', '/');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('🚫 /logout 경로 차단기 활성화 완료');
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

router.isReady().then(() => {
  app.mount('#app');
});
