<template>
  <div class="booking-detail">
    <div v-if="booking">
      <h1>예약 상세 정보</h1>
      <div class="detail-card">
        <div><strong>예약 번호:</strong> {{ booking.bookingNum }}</div>
        <div>
          <strong>매장 이름:</strong>
          <router-link
            :to="{ name: 'StoreDetail', params: { storeId: booking.storeId } }"
            class="store-link"
          >
            {{ storeName }}
          </router-link>
        </div>
        <div><strong>예약 날짜:</strong> {{ formatDateTime(booking.bookingDate) }}</div>
        <div><strong>예약 상태:</strong> {{ booking.bookingState }}</div>
        <div><strong>좌석 수:</strong> {{ booking.count }}</div>
      </div>
      <div v-if="booking.bookingState === 'CONFIRMED'">
        <button @click="cancelBooking" class="cancel-button">예약 취소</button>
      </div>
      <div v-else-if="booking.bookingState === 'COMPLETED'">
        <router-link
          :to="{ name: 'ReviewCreate', params: { storeId: booking.storeId, bookingNum: booking.bookingNum } }"
          class="review-button"
        >
          리뷰 작성
        </router-link>
      </div>
      <p v-else>취소 또는 리뷰 작성할 수 없는 예약입니다.</p>
    </div>
    <div v-else>
      <p>예약 정보를 불러오는 중입니다...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const booking = ref(null);
const storeName = ref('불러오는 중...'); // 가게 이름을 저장할 ref 추가
const route = useRoute();

// 날짜와 시간을 포맷하는 함수 추가
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '날짜 정보 없음';
  const [date, time] = dateTimeStr.split('T');
  if (!time) return date;
  const formattedTime = time.substring(0, 5); // '13:00:00' -> '13:00'
  return `${date} ${formattedTime}`;
};

// 예약 상세 정보를 가져오는 함수
const fetchBookingDetail = async (bookingNum) => {
  const accessToken = localStorage.getItem('accessToken');
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  try {
    const response = await axios.get(`/api/bookings/${bookingNum}`, { headers });
    booking.value = response.data;
    
    // 예약 정보가 성공적으로 로드되면 가게 이름을 추가로 가져옵니다.
    if (booking.value && booking.value.storeId) {
      await fetchStoreName(booking.value.storeId);
    }
  } catch (error) {
    console.error('예약 상세 정보를 가져오는 데 실패했습니다.', error);
  }
};

// 가게 이름을 가져오는 함수
const fetchStoreName = async (storeId) => {
  try {
    const response = await axios.get(`/api/stores/${storeId}/name`);
    storeName.value = response.data; // 서버에서 반환된 가게 이름을 저장
  } catch (error) {
    console.error('가게 이름을 가져오는 데 실패했습니다.', error);
    storeName.value = '이름을 찾을 수 없습니다';
  }
};

// 예약 취소 함수
const cancelBooking = async () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    alert('예약을 취소하려면 로그인이 필요합니다.');
    return;
  }
  const headers = { Authorization: `Bearer ${accessToken}` };
  
  try {
    const cancelBookingResponse = await axios.patch(
      `/api/bookings/${booking.value.bookingNum}`,
      null,
      { headers }
    );
    console.log('예약 취소 성공:', cancelBookingResponse.data);

    alert('예약이 성공적으로 취소되었습니다');

    fetchBookingDetail(booking.value.bookingNum);
  } catch (error) {
    console.error('예약 취소 작업 실패:', error);
    alert(`예약 취소에 실패했습니다: ${error.message}`);
  }
};

// 컴포넌트가 마운트될 때 예약 정보 가져오기
onMounted(() => {
  fetchBookingDetail(route.params.bookingNum);
});
</script>

<style scoped>
.booking-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  font-family: 'Noto Sans KR', sans-serif; /* 캐치테이블과 유사한 폰트 적용 */
}

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.detail-card {
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* 그림자 효과를 더 강하게 */
  display: flex;
  flex-direction: column;
  gap: 15px; /* 항목 간 간격 */
}

.detail-card div {
  display: flex;
  justify-content: space-between; /* 좌우 정렬 */
  font-size: 16px;
  color: #555;
  border-bottom: 1px solid #eee; /* 구분선 추가 */
  padding-bottom: 10px;
}

.detail-card div:last-child {
  border-bottom: none; /* 마지막 항목의 구분선 제거 */
  padding-bottom: 0;
}

.detail-card strong {
  color: #333;
  font-weight: 500;
}

.store-link {
  color: #ff5722; /* 캐치테이블의 주황색 계열 */
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s ease;
}

.store-link:hover {
  color: #e64a19; /* 호버 시 색상 변경 */
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.cancel-button, .review-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px; /* 둥근 모서리 */
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
  text-decoration: none;
  display: inline-block;
}

.cancel-button {
  background-color: #ffffff; /* 흰색 배경 */
  color: #ff5722; /* 붉은색 글씨 */
  border: 1px solid #ff5722; /* 붉은색 테두리 */
}

.cancel-button:hover {
  background-color: #fff2e6; /* 호버 시 연한 주황색 배경 */
}

.review-button {
  background-color: #ff5722; /* 주황색 배경 */
  color: #ffffff; /* 흰색 글씨 */
}

.review-button:hover {
  background-color: #e64a19; /* 호버 시 어두운 주황색 */
}

.status-text {
  text-align: center;
  color: #777;
  margin-top: 20px;
  font-size: 14px;
}
</style>