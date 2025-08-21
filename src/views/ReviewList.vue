<template>
  <div class="container">
    <div v-if="loading" class="status-message">
      리뷰를 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>
    <div v-else-if="reviews.length > 0">
      <h1 class="title">리뷰 목록</h1>
      <router-link
        v-for="review in reviews"
        :key="review.reviewId"
        :to="{ name: 'ReviewDetail', params: { id: review.reviewId } }"
        class="review-card-link"
      >
        <div class="review-card">
          <div class="card-header">
            <p class="user-name">{{ review.userName || '알 수 없음' }}</p>
            <div class="rating-stars">
              <span v-for="i in review.score" :key="'star-' + review.reviewId + '-' + i">★</span>
              <span v-for="i in (5 - review.score)" :key="'empty-star-' + review.reviewId + '-' + i" class="empty-star">☆</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
        </div>
      </router-link>
    </div>
    <div v-else class="status-message">
      아직 작성된 리뷰가 없습니다.
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

export default {
  name: 'ReviewList',
  setup() {
    const route = useRoute();
    const reviews = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const userNames = new Map();

    const fetchUserNames = async (userIds) => {
      const uniqueUserIds = [...new Set(userIds)];
      const fetchPromises = uniqueUserIds.map(async userId => {
        if (!userNames.has(userId)) {
          try {
            const response = await axios.get(`/api/users/${userId}/name`);
            userNames.set(userId, response.data);
          } catch (e) {
            console.error(`Failed to fetch user name for ID ${userId}:`, e);
            userNames.set(userId, '알 수 없음');
          }
        }
      });
      await Promise.all(fetchPromises);
    };

    const fetchStoreReviews = async () => {
      try {
        const storeId = route.params.storeId;
        
        // 병렬로 리뷰와 가게 정보 동시 조회
        const [reviewsResponse, storeResponse] = await Promise.all([
          axios.get(`/api/reviews/stores/${storeId}`),
          axios.get(`/api/stores/${storeId}`)
        ]);
        
        reviews.value = reviewsResponse.data;
        
        // 가게 이름을 페이지 제목에 사용
        document.title = `${storeResponse.data.storeName} - 리뷰 목록`;
        
        if (reviews.value.length > 0) {
          const userIds = reviews.value.map(review => review.userId);
          await fetchUserNames(userIds);
          
          reviews.value = reviews.value.map(review => ({
            ...review,
            userName: userNames.get(review.userId)
          }));
        }
        
        console.log('리뷰 목록 조회 성공:', reviews.value.length, '개');
      } catch (e) {
        error.value = `리뷰 목록을 불러오는 데 실패했습니다: ${e.message}`;
        console.error("Error fetching reviews:", e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchStoreReviews();
    });

    return {
      reviews,
      loading,
      error,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
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

.review-card-link {
  text-decoration: none;
  color: inherit;
}

.review-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.review-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.rating-stars {
  font-size: 20px;
  color: #ff5722;
  letter-spacing: 2px;
}

.rating-stars .empty-star {
  color: #ccc;
}

.review-comment {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}
</style>