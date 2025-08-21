<template>
  <div class="container">
    <div v-if="loading" class="status-message">
      내 리뷰를 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>
    <div v-else>
      <div class="header">
        <h1 class="title">{{ storeName }}에서 내가 작성한 리뷰</h1>
        <router-link :to="{ name: 'StoreDetail', params: { storeId: storeId } }" class="back-link">
          ← 가게 정보로 돌아가기
        </router-link>
      </div>
      
      <div v-if="myReviews.length > 0" class="reviews-container">
        <div v-for="review in myReviews" :key="review.reviewId" class="review-card">
          <div class="review-header">
            <div class="rating-stars">
              <span v-for="i in review.score" :key="'star-' + review.reviewId + '-' + i">★</span>
              <span v-for="i in (5 - review.score)" :key="'empty-star-' + review.reviewId + '-' + i" class="empty-star">☆</span>
            </div>
            <div class="review-date">
              {{ formatDate(review.createdAt) }}
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
          <div class="review-actions">
            <router-link :to="{ name: 'ReviewDetail', params: { id: review.reviewId } }" class="action-link">
              상세보기
            </router-link>
          </div>
        </div>
      </div>
      <div v-else class="status-message">
        <p>이 가게에서 작성한 리뷰가 없습니다.</p>
        <router-link :to="{ name: 'ReviewCreate', params: { storeId: storeId, bookingNum: 'new' } }" class="create-review-link">
          리뷰 작성하기
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const storeId = route.params.storeId;
const myReviews = ref([]);
const loading = ref(true);
const error = ref(null);
const storeName = ref('가게');

const fetchMyReviewsInStore = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    
    // Store Service에서 특정 가게의 내 리뷰 조회
    const response = await axios.get(`/api/reviews/my/stores/${storeId}`, { headers });
    myReviews.value = response.data;
    
    // 가게 이름 조회
    if (myReviews.value.length > 0) {
      const storeResponse = await axios.get(`/api/stores/${storeId}`);
      storeName.value = storeResponse.data.storeName;
    }
    
    console.log('내 리뷰 조회 성공:', myReviews.value.length, '개');
  } catch (err) {
    console.error('내 리뷰 조회 실패:', err);
    error.value = '리뷰를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

onMounted(() => {
  fetchMyReviewsInStore();
});
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.header {
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.back-link {
  text-decoration: none;
  color: #ff5722;
  font-size: 14px;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #e64a19;
}

.status-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}

.text-red {
  color: #ff5722;
}

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rating-stars {
  font-size: 20px;
  color: #ff5722;
  letter-spacing: 2px;
}

.rating-stars .empty-star {
  color: #ccc;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.review-comment {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
  word-break: break-word;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
}

.action-link {
  text-decoration: none;
  color: #ff5722;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.action-link:hover {
  color: #e64a19;
}

.create-review-link {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #ff5722;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.create-review-link:hover {
  background-color: #e64a19;
}
</style>
