import { defineStore } from 'pinia';
import axios from '@/api/axios';
import router from '@/router'; // eslint-disable-line no-unused-vars

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
    async initializeStore() {
      // 로그아웃 후 자동 로그인 방지를 위한 추가 검증
      const isLogoutFlow = sessionStorage.getItem('logoutInProgress');

      // 로그아웃 플로우 중이면 자동 로그인 방지
      if (isLogoutFlow === 'true') {
        console.log('로그아웃 플로우 감지. 자동 로그인 방지.');
        sessionStorage.removeItem('logoutInProgress');
        this.clearAllData();
        return;
      }

      this.accessToken = localStorage.getItem('accessToken');
      this.idToken = localStorage.getItem('idToken');
      this.refreshToken = localStorage.getItem('refreshToken');

      // 토큰이 있더라도 유효성을 검증
      if (this.idToken && this.accessToken) {
        try {
          // 토큰 유효성 검증을 위해 사용자 정보 요청
          await this.fetchMyInfo();
          if (this.isAuthenticated && this.user) {
            console.log('토큰이 유효합니다. 사용자:', this.user.userName);
          } else {
            // 토큰이 유효하지 않으면 로그아웃 처리
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

    clearAllData() {
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
        console.log('=== fetchMyInfo 시작 ===');
        const response = await axios.get('/api/users/me');
        console.log('API 응답:', response.data);
        
        // API 응답이 HTML인 경우 처리
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('API 응답이 HTML입니다. 라우팅 문제가 있습니다.');
          this.user = null;
          this.isAuthenticated = false;
          this.error = 'API 라우팅 오류: 백엔드 서버에 연결할 수 없습니다.';
          return;
        }
        
        this.user = response.data;
        console.log('user 객체 설정:', this.user);
        this.isAuthenticated = true;
        console.log('=== fetchMyInfo 완료 ===');
      } catch (e) {
        if (e.response && e.response.status === 401) {
          console.log("Authentication error (401). Clearing data without logout message.");
          // 401 오류 시에는 메시지 없이 데이터만 정리
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
        const response = await axios.get('/api/users/login/url');
        return response.data.url;
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

        await this.fetchMyInfo();
      } catch (e) {
        // 에러 응답에서 상세 정보 추출
        let errorMessage = 'Error during login process.';
        
        if (e.response && e.response.data) {
          const errorData = e.response.data;
          if (errorData.error === 'DUPLICATE_PHONE') {
            errorMessage = '이미 등록된 전화번호입니다. 다른 전화번호로 회원가입을 시도해주세요.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        
        this.error = errorMessage;
        // 로그인 실패 시에는 메시지 없이 데이터만 정리
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
        
        // 원본 에러를 다시 던져서 CallbackPage에서 처리할 수 있도록 함
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;

      // 로그아웃 플로우 시작 플래그 설정
      sessionStorage.setItem('logoutInProgress', 'true');

      try {
        // 모든 로컬 상태 초기화
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

        // 브라우저 캐시 완전 삭제
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // 모든 쿠키 강제 삭제 (더 강력한 방법)
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Cognito 관련 쿠키 특별 삭제
        const cognitoCookies = [
          'accessToken', 'idToken', 'refreshToken', 'CognitoIdentityServiceProvider',
          'XSRF-TOKEN', 'AWSELB', 'AWSELBCORS', 'amplify-authenticator-authToken'
        ];

        cognitoCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=talkingpotato.shop;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.talkingpotato.shop;`;
        });

        // 로컬 스토리지 완전 삭제
        localStorage.clear();

        this.loading = false;

        // 2. Cognito 세션 완전 종료를 위한 강제 로그아웃
        const cognitoLogoutUrl = `https://ap-northeast-2bdkxgjghs.auth.ap-northeast-2.amazoncognito.com/logout?client_id=k2q60p4rkctc3mpon0dui3v8h&logout_uri=https://talkingpotato.shop`;
        
        // 3. 로그아웃 성공 모달 표시
        window.showLogoutSuccessModal = true;
        
        // 4. 로그아웃 진행 상태 표시
        console.log('Cognito 로그아웃 페이지로 이동 중...');
        
        // 5. 히스토리 조작으로 뒤로가기 방지
        window.history.replaceState(null, '', window.location.href);
        
        // 6. Cognito 로그아웃 페이지로 이동 (타임아웃 설정)
        const logoutTimeout = setTimeout(() => {
          console.error('Cognito 로그아웃 타임아웃. 메인 페이지로 이동합니다.');
          window.location.href = 'https://talkingpotato.shop';
        }, 10000); // 10초 타임아웃
        
        // 7. 페이지 이동 전 타임아웃 클리어
        window.addEventListener('beforeunload', () => {
          clearTimeout(logoutTimeout);
        });
        
        // 8. Cognito 로그아웃 페이지로 이동
        window.location.href = cognitoLogoutUrl;

      } catch (e) {
        console.error('로그아웃 중 오류:', e);
        this.error = '로그아웃 중 문제가 발생했지만 클라이언트 상태는 초기화되었습니다.';

        // 오류가 발생해도 로컬 상태는 초기화
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

        this.loading = false;

        // 오류 시에도 메인페이지로 이동
        window.location.href = 'https://talkingpotato.shop';
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
        this.favorites = response.data || [];
      } catch (e) {
        console.error('즐겨찾기 조회 실패:', e);
        this.error = 'Failed to fetch favorites list.';
        this.favorites = [];
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
        await this.fetchFavorites();
        this.favoriteCount = this.favorites ? this.favorites.length : 0;
      } catch (e) {
        console.error('즐겨찾기 개수 조회 실패:', e);
        this.error = 'Failed to fetch favorite count.';
        this.favoriteCount = 0;
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