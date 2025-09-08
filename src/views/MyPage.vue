<template>
  <div class="my-page-container">
    <div v-if="userStore.loading" class="status-message">
      데이터 불러오는 중...
    </div>
    <div v-else-if="userStore.error" class="status-message text-red">
      오류: {{ userStore.error }}
    </div>

    <div v-if="userStore.isAuthenticated && user">
      <section class="mb-8">
        <h2 class="section-title">내 정보</h2>
        <div class="info-card">
          <p>이름: {{ user.userInfo.userName || '정보 없음' }}</p>
          <p>전화번호: {{ user.userInfo.formattedPhoneNumber || displayPhoneNumber(user.userInfo.phoneNumber) || '정보 없음' }}</p>
          <p>주소: {{ user.userInfo.userLocation || '정보 없음' }}</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="section-title">즐겨찾기 가게 목록 ({{ userStore.favorites.length }})</h2>
        <div v-if="userStore.favorites.length" class="space-y-4">
          <div v-for="favorite in userStore.favorites" :key="favorite.favStoreId" class="favorite-item">
            <router-link :to="{ name: 'StoreDetail', params: { storeId: favorite.storeId } }" class="favorite-link">
              {{ favorite.storeName }}
            </router-link>
            <button @click="userStore.removeFavorite(favorite.storeId)" class="remove-button">
              삭제
            </button>
          </div>
        </div>
        <div v-else class="status-message">
          즐겨찾기한 가게가 없습니다.
        </div>
      </section>

      <section>
        <h2 class="section-title">내가 작성한 리뷰 ({{ myReviews.length }})</h2>
        <div v-if="loadingReviews" class="status-message">
          리뷰를 불러오는 중...
        </div>
        <div v-else-if="myReviews.length" class="space-y-4">
          <div v-for="review in myReviews" :key="review.reviewId" class="review-item">
            <div class="review-header">
              <router-link :to="{ name: 'StoreDetail', params: { storeId: review.storeId } }" class="store-link">
                {{ review.storeName }}
              </router-link>
              <div class="rating-stars">
                <span v-for="i in review.score" :key="'star-' + review.reviewId + '-' + i">★</span>
                <span v-for="i in (5 - review.score)" :key="'empty-star-' + review.reviewId + '-' + i" class="empty-star">☆</span>
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
          작성한 리뷰가 없습니다.
        </div>
      </section>
    </div>
    <div v-else class="status-message">
      <p>로그인이 필요합니다.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { displayPhoneNumber } from '@/utils/phoneFormatter';
import axios from '@/api/axios';

const userStore = useUserStore();
const user = ref(null);
const myReviews = ref([]);
const loadingReviews = ref(false);

const fetchMyReviews = async () => {
  loadingReviews.value = true;
  try {
    const accessToken = localStorage.getItem('accessToken');
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    
    // Store Service에서 직접 내 리뷰 조회
    const response = await axios.get('/api/reviews/my', { headers });
    myReviews.value = response.data;
    
    console.log('내 리뷰 조회 성공:', myReviews.value.length, '개');
  } catch (error) {
    console.error('내 리뷰 조회 실패:', error);
    myReviews.value = [];
  } finally {
    loadingReviews.value = false;
  }
};

onMounted(async () => {
  try {
    console.log('=== MyPage onMounted 시작 ===');
    await userStore.fetchMyInfo();
    console.log('userStore.user:', userStore.user);
    if (userStore.user) {
      user.value = userStore.user;
      console.log('user.value 설정:', user.value);
    }

    // 즐겨찾기 관련 데이터는 병렬로 처리
    await Promise.all([
      userStore.fetchFavorites(),
      userStore.fetchFavoriteCount(),
      fetchMyReviews()
    ]);
    console.log('=== MyPage onMounted 완료 ===');
  } catch (error) {
    console.error('마이페이지 데이터 로딩 중 오류:', error);
  }
});
</script>

<style scoped>
.my-page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 2px solid #ff5722;
  display: inline-block;
}

.status-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}

.info-card {
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card p {
  font-size: 16px;
  color: #555;
  border-bottom: 1px dashed #ddd;
  padding-bottom: 10px;
}

.info-card p:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.favorite-item {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favorite-link {
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 16px;
  transition: color 0.2s ease;
}

.favorite-link:hover {
  color: #ff5722;
}

.remove-button {
  background: none;
  border: 1px solid #ff5722;
  color: #ff5722;
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.remove-button:hover {
  background-color: #ff5722;
  color: #ffffff;
}

.text-red {
  color: #ff5722;
}

.mb-8 {
  margin-bottom: 32px;
}

.space-y-4>*:not(:last-child) {
  margin-bottom: 16px;
}

/* 리뷰 아이템 스타일 */
.review-item {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.store-link {
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 16px;
  transition: color 0.2s ease;
}

.store-link:hover {
  color: #ff5722;
}

.rating-stars {
  font-size: 18px;
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
  margin-bottom: 12px;
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
</style>