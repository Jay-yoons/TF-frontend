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
      <!-- 메인 액션 카드 -->
      <section class="main-actions">
        <div class="card-grid">
          <router-link to="/stores" class="action-card">
            <div class="icon-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 class="card-title">가게 목록 보기</h2>
          </router-link>
        </div>
      </section>
    </main>

    <!-- 토스트 알림 -->
    <div v-if="toast.show" :class="['toast', toast.type]" @click="hideToast">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 반응형 데이터
const toast = ref({ show: false, message: '', type: 'success' });

// 토스트 알림 숨기기
const hideToast = () => {
  toast.value.show = false;
};
</script>

<style scoped>
.home-page-container {
  padding: 20px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

.home-header {
  margin-bottom: 40px;
  margin-top: 20px;
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
  max-width: 1200px;
  margin: 0 auto;
}

/* 섹션 공통 스타일 */
.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: left;
}

/* 메인 액션 카드 */
.main-actions {
  margin-top: 40px;
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

/* 토스트 알림 */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #4caf50;
}

.toast.error {
  background: #f44336;
}

.toast.info {
  background: #2196f3;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .home-title {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .home-page-container {
    padding: 15px;
  }

  .section-title {
    font-size: 20px;
  }
}
</style>