<template>
  <div class="home-page-container">
    <!-- 뒤로가기 버튼 -->
    <button v-if="showBackButton" @click="goBack" class="back-button">
      ← 뒤로가기
    </button>

    <header class="home-header">
      <h1 class="home-title">
        <span class="accent">맛의</span> 미로를 <span class="accent">탐험</span>하세요
      </h1>
      <p class="home-subtitle">
        고객님의 취향에 맞는 다양한 레스토랑을 찾아드립니다
      </p>
    </header>

    <main class="main-content">
      <!-- 카테고리별 빠른 접근 -->
      <section class="category-section">
        <h2 class="section-title">카테고리별 보기</h2>
        <div class="category-grid">
          <router-link 
            v-for="category in categories" 
            :key="category.code"
            :to="{ name: 'StoreList', query: { category: category.code } }" 
            class="category-card"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <span class="category-name">{{ category.name }}</span>
          </router-link>
        </div>
      </section>

      <!-- 인기 가게 섹션 -->
      <section class="popular-stores-section">
        <h2 class="section-title">인기 가게</h2>
        <div v-if="loadingStores" class="skeleton-grid">
          <div v-for="i in 3" :key="i" class="store-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text short"></div>
            </div>
          </div>
        </div>
        <div v-else-if="popularStores.length > 0" class="popular-stores-grid">
          <div 
            v-for="store in popularStores.slice(0, 3)" 
            :key="store.storeId" 
            class="store-card"
            @click="goToStore(store.storeId)"
          >
            <div class="store-image">
              <img 
                :src="store.imageUrl || '/default-store.jpg'" 
                :alt="store.storeName"
                @error="handleImageError"
              />
            </div>
            <div class="store-info">
              <h3 class="store-name">{{ store.storeName }}</h3>
              <p class="store-location">{{ store.storeLocation }}</p>
              <div class="store-meta">
                <span class="store-category">{{ getCategoryName(store.categoryCode) }}</span>
                <span :class="['status-badge', { 'open': store.openNow, 'closed': !store.openNow }]">
                  {{ store.openStatus }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>인기 가게를 불러오는 중...</p>
        </div>
        <router-link to="/stores" class="view-all-button">
          모든 가게 보기 →
        </router-link>
      </section>

      <!-- 최근 리뷰 섹션 -->
      <section class="recent-reviews-section">
        <h2 class="section-title">최근 리뷰</h2>
        <div v-if="loadingReviews" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="review-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        </div>
        <div v-else-if="recentReviews.length > 0" class="recent-reviews-list">
          <div 
            v-for="review in recentReviews.slice(0, 3)" 
            :key="review.reviewId" 
            class="review-item"
            @click="goToReview(review.reviewId)"
          >
            <div class="review-header">
              <span class="reviewer-name">{{ review.userName }}</span>
              <div class="rating-stars">
                <span v-for="i in review.score" :key="i" class="star">★</span>
                <span v-for="i in (5 - review.score)" :key="i" class="star empty">☆</span>
              </div>
            </div>
            <p class="review-comment">{{ truncateText(review.comment, 50) }}</p>
            <span class="store-name">{{ review.storeName }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>최근 리뷰가 없습니다.</p>
        </div>
      </section>

      <!-- 메인 액션 카드 -->
      <section class="main-actions">
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
      </section>
    </main>

    <!-- 토스트 알림 -->
    <div v-if="toast.show" :class="['toast', toast.type]" @click="hideToast">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import axios from '@/api/axios';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 반응형 데이터
const popularStores = ref([]);
const recentReviews = ref([]);
const loadingStores = ref(false);
const loadingReviews = ref(false);
const toast = ref({ show: false, message: '', type: 'success' });

// 카테고리 데이터
const categories = [
  { code: 1, name: '한식', icon: '🍚' },
  { code: 2, name: '일식', icon: '🍣' },
  { code: 3, name: '양식', icon: '🍝' },
  { code: 4, name: '중식', icon: '🥢' },
  { code: 5, name: '카페', icon: '☕' }
];

// 뒤로가기 버튼 표시 여부
const showBackButton = computed(() => {
  return route.name !== 'HomePage' || document.referrer.includes(window.location.origin);
});

// 카테고리명 가져오기
const getCategoryName = (categoryCode) => {
  const category = categories.find(cat => cat.code === categoryCode);
  return category ? category.name : '기타';
};

// 텍스트 자르기
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 이미지 에러 처리
const handleImageError = (event) => {
  event.target.src = '/default-store.jpg';
};

// 인기 가게 불러오기
const fetchPopularStores = async () => {
  loadingStores.value = true;
  try {
    const response = await axios.get('/api/stores');
    // 영업중인 가게를 우선으로 정렬
    popularStores.value = response.data
      .filter(store => store.openNow)
      .slice(0, 6);
  } catch (error) {
    console.error('인기 가게 불러오기 실패:', error);
    showToast('인기 가게를 불러오는데 실패했습니다.', 'error');
  } finally {
    loadingStores.value = false;
  }
};

// 최근 리뷰 불러오기
const fetchRecentReviews = async () => {
  loadingReviews.value = true;
  try {
    const response = await axios.get('/api/reviews');
    recentReviews.value = response.data.slice(0, 6);
  } catch (error) {
    console.error('최근 리뷰 불러오기 실패:', error);
    showToast('최근 리뷰를 불러오는데 실패했습니다.', 'error');
  } finally {
    loadingReviews.value = false;
  }
};

// 가게 상세 페이지로 이동
const goToStore = (storeId) => {
  router.push({ name: 'StoreDetail', params: { storeId } });
};

// 리뷰 상세 페이지로 이동
const goToReview = (reviewId) => {
  router.push({ name: 'ReviewDetail', params: { id: reviewId } });
};

// 뒤로가기
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};

// 토스트 알림 표시
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    hideToast();
  }, 3000);
};

// 토스트 알림 숨기기
const hideToast = () => {
  toast.value.show = false;
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchPopularStores();
  fetchRecentReviews();
});
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

/* 뒤로가기 버튼 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #f5f5f5;
  border-color: #ccc;
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

/* 카테고리 섹션 */
.category-section {
  margin-bottom: 40px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.category-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.category-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 인기 가게 섹션 */
.popular-stores-section {
  margin-bottom: 40px;
}

.popular-stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.store-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.store-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.store-image {
  height: 200px;
  overflow: hidden;
}

.store-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-info {
  padding: 15px;
}

.store-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.store-location {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.store-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-category {
  background: #ff5722;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.open {
  background: #4caf50;
  color: white;
}

.status-badge.closed {
  background: #f44336;
  color: white;
}

.view-all-button {
  display: inline-block;
  background: #ff5722;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s ease;
}

.view-all-button:hover {
  background: #e64a19;
}

/* 최근 리뷰 섹션 */
.recent-reviews-section {
  margin-bottom: 40px;
}

.recent-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.review-item {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: left;
}

.review-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ffd700;
  font-size: 14px;
}

.star.empty {
  color: #ddd;
}

.review-comment {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.store-name {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

/* 스켈레톤 UI */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.store-skeleton {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 15px;
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 10px;
  border-radius: 4px;
}

.skeleton-text {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 8px;
  border-radius: 4px;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.review-skeleton {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
  
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .popular-stores-grid {
    grid-template-columns: 1fr;
  }
  
  .back-button {
    top: 10px;
    left: 10px;
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .home-page-container {
    padding: 15px;
  }
  
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-title {
    font-size: 20px;
  }
}
</style>