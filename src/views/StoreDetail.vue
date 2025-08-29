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

      <div class="store-image-container">
        <img 
          :src="store.imageUrl" 
          :alt="store.storeName"
          class="store-image"
          @error="handleImageError"
        />
      </div>

      <div class="store-info-list">
        <div class="info-item">
          <strong>위치:</strong>
          <span>{{ store.storeLocation }}</span>
        </div>
        <div class="info-item">
          <strong>영업시간:</strong>
          <span>{{ formatBusinessHours(store.openTime, store.closeTime) }}</span>
        </div>
        <div class="info-item">
          <strong>영업상태:</strong>
          <span :class="['status-badge', { 'open': isStoreOpen(store.openTime, store.closeTime), 'closed': !isStoreOpen(store.openTime, store.closeTime) }]">
            {{ isStoreOpen(store.openTime, store.closeTime) ? '영업중' : '영업종료' }}
          </span>
        </div>
        <div class="info-item">
          <strong>전체 좌석:</strong>
          <span>{{ store.seatNum }}석</span>
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
          v-if="userStore.isAuthenticated && hasBooking && !hasReview"
          :to="{ name: 'ReviewCreate', params: { storeId: store.storeId } }"
          class="action-button review-create-button"
        >
          리뷰 작성
        </router-link>
        
        <div
          v-if="userStore.isAuthenticated && hasBooking && hasReview"
          class="action-button review-create-button disabled"
          style="background-color: #ccc; cursor: not-allowed;"
        >
          리뷰 작성 완료
        </div>

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
import axios from '@/api/axios';
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
    const hasBooking = ref(false);
    const hasReview = ref(false);

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

    const checkBookingStatus = async () => {
      if (!userStore.isAuthenticated) {
        hasBooking.value = false;
        return;
      }
      try {
        const storeId = route.params.storeId;
        const idToken = localStorage.getItem('idToken');
        
        // 사용자의 예약 목록에서 해당 가게의 예약이 있는지 확인
        const response = await axios.get(`/api/bookings/users/current`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        
        // 해당 가게의 예약이 있는지 확인 (완료된 예약 포함)
        const userBookings = response.data;
        hasBooking.value = userBookings.some(booking => 
          booking.storeId === storeId && 
          (booking.bookingStateCode === 1 || booking.bookingStateCode === 2) // CONFIRMED 또는 COMPLETED
        );
        
        console.log('예약 상태 확인:', hasBooking.value);
      } catch (e) {
        console.error("예약 상태 확인 실패:", e);
        hasBooking.value = false;
      }
    };

    const checkReviewStatus = async () => {
      if (!userStore.isAuthenticated) {
        hasReview.value = false;
        return;
      }
      try {
        const storeId = route.params.storeId;
        const idToken = localStorage.getItem('idToken');
        
        // 사용자가 해당 가게에서 작성한 리뷰가 있는지 확인
        const response = await axios.get(`/api/reviews/my/stores/${storeId}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        
        // 리뷰가 있으면 true, 없으면 false
        hasReview.value = response.data.length > 0;
        
        console.log('리뷰 작성 상태 확인:', hasReview.value);
      } catch (e) {
        console.error("리뷰 상태 확인 실패:", e);
        hasReview.value = false;
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
      await checkBookingStatus();
      await checkReviewStatus();
    });

    // 영업시간 포맷팅 함수
    const formatBusinessHours = (openTime, closeTime) => {
      if (!openTime || !closeTime) return '영업시간 정보 없음';
      
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const time = timeStr.split(':');
        if (time.length >= 2) {
          const hour = parseInt(time[0]);
          const minute = time[1];
          return `${hour.toString().padStart(2, '0')}:${minute}`;
        }
        return timeStr;
      };
      
      return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
    };

    // 영업중 여부 확인 함수
    const isStoreOpen = (openTime, closeTime) => {
      if (!openTime || !closeTime) return false;
      
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      
      const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const time = timeStr.split(':');
        if (time.length >= 2) {
          return parseInt(time[0]) * 100 + parseInt(time[1]);
        }
        return 0;
      };
      
      const openTimeNum = parseTime(openTime);
      const closeTimeNum = parseTime(closeTime);
      
      // 자정을 넘어가는 경우 (예: 22:00 - 02:00)
      if (closeTimeNum < openTimeNum) {
        return currentTime >= openTimeNum || currentTime <= closeTimeNum;
      }
      
      return currentTime >= openTimeNum && currentTime <= closeTimeNum;
    };
    
    // 이미지 로드 실패 시 처리 함수
    const handleImageError = (event) => {
      // 기본 이미지로 대체
      event.target.src = 'https://fog-object.s3.ap-northeast-2.amazonaws.com/store/S005.png';
    };

    return {
      store,
      loading,
      error,
      isFavorite,
      hasBooking,
      hasReview,
      toggleFavorite,
      userStore,
      formatBusinessHours,
      isStoreOpen,
      handleImageError
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

/* 가게 이미지 스타일 */
.store-image-container {
  margin: 20px 0;
  text-align: center;
}

.store-image {
  max-width: 100%;
  width: 400px;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.store-image:hover {
  transform: scale(1.02);
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

/* 리뷰 작성 버튼 */
.review-create-button {
  background-color: #2196f3;
  color: #ffffff;
}
.review-create-button:hover {
  background-color: #1976d2;
}

/* 영업상태 배지 스타일 */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.open {
  background-color: #4caf50;
  color: white;
}

.status-badge.closed {
  background-color: #f44336;
  color: white;
}
</style>