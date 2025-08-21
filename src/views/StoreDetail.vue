<template>
  <div class="container">
    <div v-if="loading" class="status-message">
      가게 정보를 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>
    <div v-else-if="store" class="store-card">
      <button
        v-if="userStore.isAuthenticated"
        @click="toggleFavorite"
        :class="['favorite-icon', {'is-favorite': isFavorite}]"
      >
        <span v-if="isFavorite">★</span>
        <span v-else>☆</span>
      </button>

      <h1 class="store-name">{{ store.storeName }}</h1>

      <div class="store-info-list">
        <div class="info-item">
          <strong>위치:</strong>
          <span>{{ store.storeLocation }}</span>
        </div>
        <div class="info-item">
          <strong>영업시간:</strong>
          <span>{{ store.serviceTime }}</span>
        </div>
        <div class="info-item">
          <strong>전체 좌석:</strong>
          <span>{{ store.seatNum }}석</span>
        </div>
        <div class="info-item">
          <strong>잔여 좌석:</strong>
          <span>{{ store.availableSeats }}석</span>
        </div>
        <div class="info-item">
          <strong>리뷰 개수:</strong>
          <span>{{ store.reviewCount || 0 }}개</span>
        </div>
      </div>
      
      <div class="action-buttons-row">
        <router-link
          v-if="userStore.isAuthenticated"
          :to="{ name: 'BookingPage', params: { storeId: store.storeId } }"
          class="action-button booking-button"
        >
          예약하기
        </router-link>

        <router-link
          :to="{ name: 'ReviewList', params: { storeId: store.storeId } }"
          class="action-button review-button"
        >
          리뷰 보기
        </router-link>

        <router-link
          v-if="userStore.isAuthenticated"
          :to="{ name: 'MyReviewsInStore', params: { storeId: store.storeId } }"
          class="action-button my-review-button"
        >
          내 리뷰
        </router-link>
      </div>

    </div>
    <div v-else class="status-message">
      가게 정보를 찾을 수 없습니다.
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

export default {
  name: 'StoreDetail',
  setup() {
    const route = useRoute();
    const userStore = useUserStore();
    const store = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isFavorite = ref(false);

    const fetchStoreDetail = async () => {
      try {
        const storeId = route.params.storeId;
        
        // 병렬로 가게 정보와 리뷰 정보 동시 조회
        const [storeResponse, reviewsResponse] = await Promise.all([
          axios.get(`/api/stores/${storeId}`),
          axios.get(`/api/reviews/stores/${storeId}`)
        ]);
        
        // 가게 정보에 리뷰 정보 추가
        store.value = {
          ...storeResponse.data,
          reviews: reviewsResponse.data,
          reviewCount: reviewsResponse.data.length
        };
        
        console.log('가게 정보 조회 성공:', store.value.storeName);
        console.log('리뷰 개수:', store.value.reviewCount);
        
      } catch (e) {
        error.value = `가게 정보를 불러오는 데 실패했습니다: ${e.message}`;
        console.error('가게 정보 조회 실패:', e);
      } finally {
        loading.value = false;
      }
    };
    
    const checkFavoriteStatus = async () => {
      if (!userStore.isAuthenticated) {
        isFavorite.value = false;
        return;
      }
      try {
        const storeId = route.params.storeId;
        const idToken = localStorage.getItem('idToken');
        
        const response = await axios.get(`/api/favorites/status`, {
          params: { storeId: storeId },
          headers: { Authorization: `Bearer ${idToken}` }
        });
        isFavorite.value = response.data.isFavorite;
      } catch (e) {
        console.error("즐겨찾기 상태 확인 실패:", e);
      }
    };

    const toggleFavorite = async () => {
        if (!userStore.isAuthenticated) {
            alert("즐겨찾기 기능을 이용하려면 로그인이 필요합니다.");
            return;
        }
        try {
            const storeId = route.params.storeId;
            const idToken = localStorage.getItem('idToken');
            
            if (isFavorite.value) {
                await axios.delete(`/api/favorites`, {
                  params: { storeId: storeId },
                  headers: { Authorization: `Bearer ${idToken}` }
                });
                alert('즐겨찾기에서 삭제되었습니다.');
            } else {
                await axios.post(`/api/favorites`, null, {
                  params: { storeId: storeId },
                  headers: { Authorization: `Bearer ${idToken}` }
                });
                alert('즐겨찾기에 추가되었습니다.');
            }
            isFavorite.value = !isFavorite.value;
        } catch (e) {
            console.error("즐겨찾기 토글 실패:", e);
            alert('즐겨찾기 처리 중 오류가 발생했습니다.');
        }
    };

    onMounted(async () => {
      await fetchStoreDetail();
      await checkFavoriteStatus();
    });

    return {
      store,
      loading,
      error,
      isFavorite,
      toggleFavorite,
      userStore
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

.status-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}
.text-red {
    color: #ff5722;
}

.store-card {
  position: relative; /* 즐겨찾기 버튼 배치를 위한 기준점 */
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 즐겨찾기 아이콘 스타일 */
.favorite-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc; /* 기본(비활성) 상태 */
  transition: color 0.2s ease;
}

.favorite-icon.is-favorite {
  color: #ffc107; /* 활성 상태 (노란색) */
}

/* 하단 버튼들 스타일 */
.action-buttons-row {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.action-button {
  flex: 1; /* 두 버튼이 동일한 너비를 가짐 */
  display: block;
  text-align: center;
  font-weight: bold;
  padding: 15px 24px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}

/* 예약하기 버튼 */
.booking-button {
  background-color: #ff5722;
  color: #ffffff;
}
.booking-button:hover {
  background-color: #e64a19;
}

/* 리뷰 보기 버튼 */
.review-button {
  background-color: #f0f0f0;
  color: #555;
}
.review-button:hover {
  background-color: #e0e0e0;
}

/* 내 리뷰 버튼 */
.my-review-button {
  background-color: #4caf50;
  color: #ffffff;
}
.my-review-button:hover {
  background-color: #45a049;
}
</style>