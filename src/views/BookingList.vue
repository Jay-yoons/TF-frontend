<template>
  <div class="booking-list">
    <h1>예약 목록</h1>
    <ul v-if="bookings.length > 0" class="booking-items">
      <li v-for="booking in bookings" :key="booking.bookingNum">
        <div class="booking-card">
          <div class="card-header">
            <strong>예약 번호</strong>
            <span>{{ booking.bookingNum }}</span>
          </div>
          <div class="card-body">
            <div>
              <strong>매장명</strong>
              <span>{{ booking.storeName || '불러오는 중...' }}</span>
            </div>
            <div>
              <strong>예약 날짜</strong>
              <span>{{ booking.bookingDate }}</span>
            </div>
            <div>
              <strong>예약 상태</strong>
              <span>{{ booking.bookingState }}</span>
            </div>
          </div>
          <div class="card-actions">
            <router-link
              :to="{ name: 'BookingDetail', params: { bookingNum: booking.bookingNum } }"
              class="detail-button"
            >
              예약 상세
            </router-link>
          </div>
        </div>
      </li>
    </ul>
    <p v-else-if="loading" class="loading-state">예약 목록을 불러오는 중입니다...</p>
    <p v-else-if="error" class="error-message">{{ error }}</p>
    <p v-else class="empty-list">예약 목록이 없습니다.</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { getCurrentUserId } from '@/utils/auth';

export default {
  name: 'BookingList',
  setup() {
    const bookings = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchBookings = async () => {
      try {
        const userId = getCurrentUserId();
        const accessToken = localStorage.getItem('accessToken');

        const response = await axios.get(`/api/bookings/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        const bookingList = response.data;
        
        const fetchStoreNames = bookingList.map(async booking => {
          try {
            const storeNameResponse = await axios.get(`/api/stores/${booking.storeId}/name`);
            return { ...booking, storeName: storeNameResponse.data };
          } catch (e) {
            console.error(`가게 이름(${booking.storeId})을 불러오는 데 실패했습니다.`, e);
            return { ...booking, storeName: '알 수 없음' };
          }
        });
        
        bookings.value = await Promise.all(fetchStoreNames);

      } catch (e) {
        error.value = `예약 목록을 불러오는 데 실패했습니다: ${e.message}`;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchBookings();
    });

    return {
      bookings,
      loading,
      error,
    };
  },
};
</script>

<style scoped>
.booking-items {
  list-style-type: none; /* 점 제거 */
  padding: 0; /* 기본 패딩 제거 */
  margin: 0; /* 기본 마진 제거 */
}

.booking-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  font-family: 'Noto Sans KR', sans-serif;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.booking-card {
  background-color: #f8f8f8;
  border-radius: 12px;
  margin-bottom: 15px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.card-header strong {
  font-weight: 500;
  color: #333;
}

.card-body div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 16px;
  color: #555;
  border-bottom: 1px dashed #eee;
  padding-bottom: 10px;
}

.card-body div:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.card-body strong {
  color: #333;
  font-weight: 500;
}

.card-actions {
  margin-top: 20px;
  text-align: right; /* 버튼을 오른쪽으로 정렬 */
}

.detail-button {
  display: inline-block; /* 버튼이 콘텐츠 크기만큼만 공간 차지 */
  padding: 10px 20px;
  background-color: #ff5722;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  text-align: center;
  text-decoration: none;
  font-size: 16px; /* 폰트 크기 조정 */
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap; /* 텍스트가 줄바꿈되지 않도록 */
}

.detail-button:hover {
  background-color: #e64a19;
}

.empty-list, .loading-state, .error-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}
</style>