<template>
  <div class="home-page-container">
    <header class="home-header">
      <h1 class="home-title">
        <span class="accent">맛의</span> 미로를 <span class="accent">탐험</span>하세요
      </h1>
      <p class="home-subtitle">
        고객님의 취향에 맞는 다양한 레스토랑을 찾아드립니다
      </p>
    </header>

    <main class="main-content">
      <div class="card-grid">
        <router-link to="/stores" class="action-card">
          <div class="icon-placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 class="card-title">가게 목록 보기</h2>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore';
import axios from '@/api/axios';

export default {
  name: 'HomePage',
  setup() {
    const userStore = useUserStore();

    const login = async () => {
      try {
        const response = await axios.get('/api/users/login/url');
        const loginUrl = response.data.url;
        window.location.href = loginUrl;
      } catch (err) {
        console.error('로그인 URL을 불러오는 데 실패했습니다.', err);
        alert('로그인 페이지로 이동할 수 없습니다. 다시 시도해주세요.');
      }
    };

    return {
      login,
      userStore,
    };
  },
};
</script>

<style scoped>
.home-page-container {
  padding: 20px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.home-header {
  margin-bottom: 40px;
}

.home-title {
  font-size: 36px;
  font-weight: 800;
  color: #333;
  margin-bottom: 10px;
}

.home-title .accent {
  color: #ff5722;
}

.home-subtitle {
  font-size: 16px;
  color: #777;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.card-grid {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.action-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 40px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 250px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.icon-placeholder {
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
  color: #ff5722;
}

.action-card .card-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
</style>