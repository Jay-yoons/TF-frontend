import { defineStore } from 'pinia';
import axios from '@/api/axios';

// ==== [수정] Cognito 설정 & URL 빌더 (반드시 encode) ====
const COGNITO = Object.freeze({
  domain: 'ap-northeast-2bdkxgjghs.auth.ap-northeast-2.amazoncognito.com',
  clientId: 'k2q60p4rkctc3mpon0dui3v8h',
  redirectUri: 'https://talkingpotato.shop/callback', // 로그인 완료 후 돌아올 곳
  signoutUri: 'https://talkingpotato.shop/'           // 로그아웃 완료 후 돌아올 곳
});

// 로그인 URL 빌더
const buildLoginUrl = () =>
  `https://${COGNITO.domain}/login` +
  `?client_id=${COGNITO.clientId}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}` +
  `&scope=openid+email+profile`;

// 로그아웃 URL 빌더
const buildLogoutUrl = () =>
  `https://${COGNITO.domain}/logout` +
  `?client_id=${COGNITO.clientId}` +
  `&logout_uri=${encodeURIComponent(COGNITO.signoutUri)}`; // <-- '?signedout=1' 파라미터 제거

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    favorites: [],
    favoriteCount: 0,
    isAuthenticated: false,
    loading: false,
    error: null,
    accessToken: null,
    refreshToken: null,
    idToken: null,
  }),
  actions: {
    // ==== [수정] 불필요한 /logout 리디렉션 제거 ====
    async initializeStore() {
      // 기존의 `/logout` 리디렉션 로직을 제거하여 불필요한 이동 방지
      // 로그아웃 후 자동 로그인 방지를 위한 추가 검증
      const isLogoutFlow = sessionStorage.getItem('logoutInProgress');

      if (isLogoutFlow === 'true') {
        console.log('로그아웃 플로우 감지. 자동 로그인 방지.');
        sessionStorage.removeItem('logoutInProgress');
        this.clearAllData();
        return;
      }

      this.accessToken = localStorage.getItem('accessToken');
      this.idToken = localStorage.getItem('idToken');
      this.refreshToken = localStorage.getItem('refreshToken');

      if (this.idToken && this.accessToken) {
        try {
          await this.fetchMyInfo();
          if (this.isAuthenticated && this.user) {
            console.log('토큰이 유효합니다. 사용자:', this.user.userName);
          } else {
            console.log('토큰이 유효하지 않습니다. 로그아웃 처리 중...');
            this.clearAllData();
          }
        } catch (error) {
          console.error('토큰 검증 실패:', error);
          this.clearAllData();
        }
      } else {
        this.isAuthenticated = false;
        this.user = null;
      }
    },

    clearAllData({ keepLogoutFlag = false } = {}) {
      this.user = null;
      this.isAuthenticated = false;
      this.favorites = [];
      this.favoriteCount = 0;
      this.accessToken = null;
      this.refreshToken = null;
      this.idToken = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');

      if (!keepLogoutFlag) {
        sessionStorage.removeItem('logoutInProgress');
      }
    },

    async fetchMyInfo() {
      if (!this.idToken) {
        this.isAuthenticated = false;
        this.user = null;
        return;
      }

      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('/api/users/me');
        this.user = response.data;
        this.isAuthenticated = true;
      } catch (e) {
        if (e.response && e.response.status === 401) {
          console.log("Authentication error (401). Clearing data without logout message.");
          this.clearAllData();
        } else {
          this.error = 'Failed to fetch user information.';
          console.error(e);
        }
      } finally {
        this.loading = false;
      }
    },

    async getLoginUrl() {
      try {
        return buildLoginUrl();
      } catch (e) {
        this.error = 'Failed to get login URL.';
        return null;
      }
    },

    async handleCognitoCallback(code, state) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('/api/users/login/callback', { code, state });
        this.accessToken = response.data.accessToken;
        this.idToken = response.data.idToken;
        this.refreshToken = response.data.refreshToken;
        this.isAuthenticated = true;

        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('idToken', this.idToken);
        localStorage.setItem('refreshToken', this.refreshToken);

        sessionStorage.removeItem('logoutInProgress');

        await this.fetchMyInfo();
      } catch (e) {
        this.error = 'Error during login process.';
        this.user = null;
        this.isAuthenticated = false;
        this.favorites = [];
        this.favoriteCount = 0;
        this.accessToken = null;
        this.refreshToken = null;
        this.idToken = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
      } finally {
        this.loading = false;
      }
    },

    // ==== [수정] 로그아웃 로직 정리 및 단순화 ====
    async logout() {
      this.loading = true;
      sessionStorage.setItem('logoutInProgress', 'true');

      try {
        // 백엔드 로그아웃 API 호출 (accessToken이 있다면)
        if (this.accessToken) {
          await axios.post('/api/users/logout', null, {
            headers: { Authorization: `Bearer ${this.accessToken}` }
          });
        }

        // 로컬 상태 및 저장소 초기화
        this.clearAllData({ keepLogoutFlag: true });

        // 브라우저 캐시 및 쿠키 삭제
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });

        // AWS Cognito 세션 종료를 위한 강제 리디렉션
        window.location.href = buildLogoutUrl();

      } catch (e) {
        console.error('로그아웃 중 오류:', e);
        this.error = '로그아웃 중 문제가 발생했지만 클라이언트 상태는 초기화되었습니다.';
        this.clearAllData({ keepLogoutFlag: true });
        this.loading = false;
        // 오류 발생 시에도 Cognito 로그아웃 URL로 이동하여 세션 종료 시도
        window.location.href = buildLogoutUrl();
      }
    },

    // =============================================================================
    // 즐겨찾기 API - FavoriteController.java에 맞춰 수정
    // =============================================================================

    async fetchFavorites() {
      if (!this.idToken) return;
      this.loading = true;
      this.error = null;
      try {
        // ✨ 변경: FavoriteController의 /api/favorites/me 엔드포인트 사용
        const response = await axios.get('/api/favorites/me');
        this.favorites = response.data;
      } catch (e) {
        this.error = 'Failed to fetch favorites list.';
      } finally {
        this.loading = false;
      }
    },

    async fetchFavoriteCount() {
      if (!this.idToken) return;
      this.loading = true;
      this.error = null;
      try {
        // ✨ 변경: FavoriteController에 개수 조회 엔드포인트가 없으므로 목록을 불러와서 개수 반환
        const favorites = await this.fetchFavorites();
        this.favoriteCount = favorites ? favorites.length : 0;
      } catch (e) {
        this.error = 'Failed to fetch favorite count.';
      } finally {
        this.loading = false;
      }
    },

    async addFavorite(storeId) {
      if (!this.idToken) return;
      try {
        // ✨ 변경: FavoriteController의 POST /api/favorites 엔드포인트 사용, storeId를 쿼리 파라미터로 전달
        await axios.post('/api/favorites', null, {
          params: { storeId: storeId }
        });
        await this.fetchFavorites();
        // this.fetchFavoriteCount();
      } catch (e) {
        console.error('즐겨찾기 추가 실패:', e);
        this.error = 'Failed to add favorite.';
      }
    },

    async removeFavorite(storeId) {
      if (!this.idToken) return;
      try {
        // ✨ 변경: FavoriteController의 DELETE /api/favorites 엔드포인트 사용, storeId를 쿼리 파라미터로 전달
        await axios.delete('/api/favorites', {
          params: { storeId: storeId }
        });
        await this.fetchFavorites();
        // this.fetchFavoriteCount();
      } catch (e) {
        console.error('즐겨찾기 제거 실패:', e);
        this.error = 'Failed to remove favorite.';
      }
    },

    async isFavoriteStore(storeId) {
      if (!this.idToken) return false;
      try {
        // ✨ 변경: FavoriteController의 GET /api/favorites/status 엔드포인트 사용
        const response = await axios.get('/api/favorites/status', {
          params: { storeId: storeId }
        });
        return response.data.isFavorite;
      } catch (e) {
        console.error('즐겨찾기 상태 확인 실패:', e);
        this.error = 'Failed to check favorite status.';
        return false;
      }
    }
  },
});
