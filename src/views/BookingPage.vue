<template>
  <div class="container">
    <div v-if="loading" class="loading-state">
      예약 처리 중...
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-else-if="store" class="booking-card">
      <div class="store-info-card">
        <h2>{{ store.storeName }} 예약</h2>
        <p><strong>잔여 좌석:</strong> <span>{{ store.availableSeats }}</span>석</p>
      </div>

      <div class="booking-form">
        <div class="form-group">
          <label for="reservationDate">예약 날짜</label>
          <input
            id="reservationDate"
            type="date"
            v-model="reservationDate"
            :min="today"
          />
        </div>

        <div class="form-group">
          <label for="reservationTime">예약 시간</label>
          <input
            id="reservationTime"
            type="time"
            v-model="reservationTime"
          />
        </div>

        <div class="form-group">
          <label for="seatCount">예약 좌석 수</label>
          <input
            id="seatCount"
            type="number"
            v-model.number="count"
            min="1"
            :max="store.availableSeats"
          />
        </div>
      </div>

      <button
        @click="createBooking"
        class="booking-button"
        :disabled="!reservationDate || !reservationTime || count < 1 || count > store.availableSeats"
      >
        예약 확정
      </button>
    </div>
    <div v-else class="empty-state">
      <p>가게 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { getCurrentUserId } from '@/utils/auth';

export default {
  name: 'BookingPage',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = ref(null);
    const storeId = ref(route.params.storeId);
    const count = ref(1);
    const loading = ref(true);
    const error = ref(null);
    const reservationDate = ref('');
    const reservationTime = ref('');

    const today = computed(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const fetchStoreDetail = async () => {
      try {
        const response = await axios.get(`/api/stores/${storeId.value}`);
        store.value = response.data;
      } catch (e) {
        error.value = `가게 정보를 불러오는 데 실패했습니다: ${e.message}`;
      } finally {
        loading.value = false;
      }
    };

    const createBooking = async () => {
      loading.value = true;
      error.value = null;

      try {
        const userId = getCurrentUserId();
        const accessToken = localStorage.getItem('accessToken');

        if (!userId || !accessToken) {
          alert('예약을 위해 로그인이 필요합니다.');
          loading.value = false;
          return;
        }

        if (!reservationDate.value || !reservationTime.value) {
          alert('예약 날짜와 시간을 모두 선택해주세요.');
          loading.value = false;
          return;
        }

        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        const bookingDate = `${reservationDate.value}T${reservationTime.value}`;

        const bookingRequest = {
          storeId: storeId.value,
          userId: userId,
          count: count.value,
          bookingDate: bookingDate,
          state: 'CONFIRMED',
        };

        // 1. 예약 생성 API 호출
        const bookingResponse = await axios.post('/api/bookings/new', bookingRequest, { headers });
        console.log('예약 성공:', bookingResponse.data);

        // 2. 예약 성공 후 좌석 증가 API 호출
        const incrementSeatResponse = await axios.post(`/api/stores/${storeId.value}/seats/increment?count=${count.value}`, null, { headers });
        console.log('좌석 증가 성공:', incrementSeatResponse.data);

        const bookingNum = bookingResponse.data.bookingNum;

        if (bookingNum) {
          router.push({ name: 'BookingDetail', params: { bookingNum } });
        } else {
          throw new Error('API 응답에 예약 번호가 없습니다.');
        }
      } catch (e) {
        console.error('예약 또는 좌석 증가 실패:', e);
        error.value = `작업 실패: ${e.response?.data?.message || e.message}`;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchStoreDetail();
    });

    return {
      store,
      storeId,
      count,
      loading,
      error,
      reservationDate,
      reservationTime,
      today,
      createBooking,
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

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

/* 로딩/에러 메시지 스타일 */
.loading-state, .error-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}

.store-info-card {
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  text-align: center;
}

.store-info-card h2 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.store-info-card p {
  font-size: 16px;
  color: #555;
}

.store-info-card strong {
  color: #ff5722;
  font-weight: bold;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #777;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.2);
}

.booking-button {
  width: 100%;
  padding: 15px;
  background-color: #ff5722;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.booking-button:hover:not(:disabled) {
  background-color: #e64a19;
}

.booking-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}
</style>