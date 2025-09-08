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
        <p><strong>잔여 좌석:</strong> <span>{{ availableSeats !== null ? availableSeats : '확인 중...' }}</span>석</p>
      </div>

      <div class="booking-form">
        <div class="form-group">
          <label for="reservationDate">예약 날짜</label>
          <DatePicker 
            v-model="reservationDate" 
            :min-date="today" 
            :max-date="maxDate"
            placeholder="예약 날짜를 선택하세요"
            @update:modelValue="updateAvailableSeats"
          />
        </div>

        <div class="form-group">
          <label for="reservationTime">예약 시간</label>
          <TimePicker 
            v-model="reservationTime" 
            :time-options="timeOptions"
            :disabled="!reservationDate"
            placeholder="예약 시간을 선택하세요"
            @update:modelValue="updateAvailableSeats"
          />
        </div>

        <div class="form-group">
          <SeatCounter 
            v-model="count" 
            :max-seats="availableSeats || 10"
            :min-seats="1"
            @update:modelValue="onSeatCountChange"
          />
        </div>
      </div>

      <button @click="createBooking" class="booking-button" :disabled="!isBookingValid || loading">
        <div class="button-content">
          <i v-if="!loading" class="button-icon">📅</i>
          <i v-else class="loading-spinner">⏳</i>
          <span class="button-text">{{ loading ? '예약 처리 중...' : '예약 확정' }}</span>
        </div>
      </button>
    </div>
    <div v-else class="empty-state">
      <p>가게 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/api/axios';
import { getCurrentUserId, getCurrentUserIdFromSub } from '@/utils/auth';
import DatePicker from '@/components/DatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import SeatCounter from '@/components/SeatCounter.vue';

export default {
  name: 'BookingPage',
  components: {
    DatePicker,
    TimePicker,
    SeatCounter
  },
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
    const availableSeats = ref(null);
    let eventSource = null;

    const today = computed(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const maxDate = computed(() => {
      const now = new Date();
      now.setDate(now.getDate() + 7);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const timeOptions = computed(() => {
      if (!store.value) return [];
      const openTime = store.value.openTime.split(':');
      const closeTime = store.value.closeTime.split(':');
      const options = [];

      let currentHour = parseInt(openTime[0], 10);
      let closeHour = parseInt(closeTime[0], 10);
      let closeMinute = parseInt(closeTime[1], 10);

      const now = new Date();
      const currentHours = now.getHours();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;

      if (closeHour === 0 && closeMinute === 0) closeHour = 24;

      while (currentHour < closeHour) {
        const hour = String(currentHour).padStart(2, '0');
        const optionTime = `${hour}:00`;

        if (reservationDate.value === currentDate) {
          if (currentHour > currentHours) options.push(optionTime);
        } else {
          options.push(optionTime);
        }

        currentHour += 2;
      }

      return options;
    });

    const isBookingValid = computed(() => {
      return reservationDate.value && reservationTime.value && count.value > 0 && count.value <= availableSeats.value;
    });

    const fetchStoreDetail = async () => {
      try {
        const response = await axios.get(`/api/stores/${storeId.value}`);
        store.value = response.data;
        availableSeats.value = store.value.seatNum;
      } catch (e) {
        error.value = `가게 정보를 불러오는 데 실패했습니다: ${e.message}`;
      } finally {
        loading.value = false;
      }
    };

    const updateAvailableSeats = async () => {
      if (!reservationDate.value || !reservationTime.value) {
        availableSeats.value = store.value?.seatNum ?? 0;
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        const dateTime = `${reservationDate.value}T${reservationTime.value}`;
        const response = await axios.get(`/api/bookings/seats/${storeId.value}`, {
          params: { dateTime },
          headers: { Authorization: undefined }
        });

        const bookedSeats = response.data;
        availableSeats.value = store.value.seatNum - bookedSeats;

        // 사용자가 선택한 좌석 수를 강제로 변경하지 않음
        // 대신 SeatCounter에서 maxSeats로 제한하도록 함
      } catch (e) {
        console.error('잔여 좌석 조회 실패:', e);
        error.value = `잔여 좌석 정보를 불러오는 데 실패했습니다: ${e.response?.data?.message || e.message}`;
        availableSeats.value = 0;
      } finally {
        loading.value = false;
      }
    };

    const onSeatCountChange = (newCount) => {
      console.log('좌석 수 변경:', newCount, '최대 가능:', availableSeats.value);
      // 좌석 수가 변경되었을 때 추가 로직이 필요하면 여기에 추가
    };

    const setupSSE = () => {
      const userId = getCurrentUserIdFromSub();
      console.log('userId for SSE:', userId);
      const accessToken = localStorage.getItem('accessToken');
      if (!userId || !accessToken) return;

      if (eventSource) eventSource.close();

      eventSource = new EventSource(`${axios.defaults.baseURL}/api/bookings/booking-status/${userId}?token=${accessToken}`);

      eventSource.addEventListener('connect', (e) => {
        console.log('SSE 연결 확인:', e.data);
      });

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 커스텀 모달로 알림 표시
        if (data.status === 'success') {
          window.showBookingSuccessModal = true;
          window.bookingSuccessMessage = data.message;
        } else if (data.status === 'failure') {
          window.showBookingErrorModal = true;
          window.bookingErrorMessage = data.message;
        }

        if (eventSource) eventSource.close();
        loading.value = false;

        if (data.status === 'success' && data.bookingId) {
          router.push({ name: 'BookingDetail', params: { bookingNum: data.bookingId } });
        } else if (data.status === 'failure') {
          error.value = data.message;
        }
      };

      eventSource.onerror = (e) => {
        console.error('SSE 연결 실패:', e);
        loading.value = false;
        error.value = '예약 SSE 연결 실패';
        if (eventSource) eventSource.close();
      };

      window.addEventListener('beforeunload', () => {
        if (eventSource) eventSource.close();
      });
    };

    const createBooking = async () => {
      error.value = null;

      const userId = getCurrentUserId();
      const accessToken = localStorage.getItem('accessToken');

      if (!userId || !accessToken) {
        window.showBookingLoginErrorModal = true;
        window.bookingLoginErrorMessage = '예약을 위해 로그인이 필요합니다.';
        return;
      }

      if (!reservationDate.value || !reservationTime.value) {
        window.showBookingDateErrorModal = true;
        window.bookingDateErrorMessage = '예약 날짜와 시간을 모두 선택해주세요.';
        return;
      }

      if (count.value < 1 || count.value > availableSeats.value) {
        window.showBookingSeatErrorModal = true;
        window.bookingSeatErrorMessage = `예약 가능한 좌석 수는 ${availableSeats.value}석 입니다.`;
        return;
      }

      loading.value = true; // 예약 요청 시작 → 로딩 ON

      const bookingDate = `${reservationDate.value}T${reservationTime.value}:00`;
      const bookingRequest = {
        storeId: storeId.value,
        userId: userId,
        count: count.value,
        bookingDate: bookingDate,
        seats: store.value.seatNum,
      };

      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        await axios.post('/api/bookings/new', bookingRequest, { headers });

        // 요청은 성공 → SSE 응답 기다림
      } catch (e) {
        console.error('예약 요청 실패:', e);
        error.value = `예약 요청 실패: ${e.response?.data?.message || e.message}`;
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchStoreDetail();
      setupSSE();
    });

    watch([reservationDate, reservationTime], () => {
      updateAvailableSeats();
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
      maxDate,
      timeOptions,
      availableSeats,
      isBookingValid,
      createBooking,
      onSeatCountChange,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  min-height: 100vh;
  border-radius: 0;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

/* 로딩/에러 메시지 스타일 */
.loading-state,
.error-message {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}

.store-info-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  margin-bottom: 24px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.store-info-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
  50% {
    transform: translateX(100%) translateY(100%) rotate(30deg);
  }
}

.store-info-card h2 {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.store-info-card p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
  z-index: 1;
}

.store-info-card strong {
  color: #ffeb3b;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.booking-form {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.2);
}

.booking-button {
  width: 100%;
  padding: 18px 24px;
  background: linear-gradient(135deg, #ff5722, #ff7043);
  color: #ffffff;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.3);
  position: relative;
  overflow: hidden;
}

.booking-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.booking-button:hover:not(:disabled)::before {
  left: 100%;
}

.booking-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #e64a19, #ff5722);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
}

.booking-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
}

.booking-button:disabled {
  background: linear-gradient(135deg, #ccc, #bbb);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.button-icon {
  font-size: 20px;
  animation: bounce 2s infinite;
}

.loading-spinner {
  font-size: 20px;
  animation: spin 1s linear infinite;
}

.button-text {
  font-size: 18px;
  font-weight: bold;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-2px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  color: #777;
  font-size: 16px;
  margin-top: 50px;
}
</style>