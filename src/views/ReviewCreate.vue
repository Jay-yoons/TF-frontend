<template>
  <div class="review-create">
    <div v-if="loading" class="loading-message">
      예약 정보를 확인하는 중...
    </div>
    <div v-else-if="!hasBooking" class="error-message">
      리뷰를 작성하려면 해당 가게에서 예약을 완료해야 합니다.
    </div>
    <div v-else>
      <h1>리뷰 작성</h1>
      <div class="review-form">
      <form @submit.prevent="submitReview">
        <div class="form-group">
          <label>별점 (1-5)</label>
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="score = n" :class="{ 'filled-star': n <= score }">★</span>
          </div>
        </div>
        <div class="form-group">
          <label for="comment">리뷰 내용</label>
          <textarea id="comment" v-model="comment" rows="5" required></textarea>
        </div>
        <button type="submit" class="submit-button">리뷰 제출</button>
      </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/api/axios';

export default {
  name: 'ReviewCreate',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const score = ref(0);
    const comment = ref('');
    const hasBooking = ref(false);
    const loading = ref(true);

    const submitReview = async () => {
    // 이전처럼 'idToken'을 사용하도록 수정
    const idToken = localStorage.getItem('idToken');
    
    if (!idToken) {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }
    if (score.value === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    
    const reviewRequestDto = {
      storeId: route.params.storeId,
      comment: comment.value,
      score: score.value,
    };
    
    console.log("전송 데이터:", reviewRequestDto);

    try {
      const headers = { Authorization: `Bearer ${idToken}` };
      const response = await axios.post('/api/reviews', reviewRequestDto, { headers });
      
      alert('리뷰가 성공적으로 작성되었습니다.');
      
      router.push({ name: 'ReviewDetail', params: { id: response.data.reviewId } });

    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      alert(`리뷰 작성에 실패했습니다: ${error.message}`);
    }
};

    // 예약 여부 확인 함수
    const checkBookingStatus = async () => {
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        alert('리뷰를 작성하려면 로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      // try {
      //   const storeId = route.params.storeId;
        
      //   // 사용자의 예약 목록에서 해당 가게의 예약이 있는지 확인
      //   const response = await axios.get(`/api/bookings/users/current`, {
      //     headers: { Authorization: `Bearer ${idToken}` }
      //   });
        
      //   // 해당 가게의 예약이 있는지 확인 (완료된 예약 포함)
      //   const userBookings = response.data;
      //   hasBooking.value = userBookings.some(booking => 
      //     booking.storeId === storeId && 
      //     (booking.bookingStateCode === 2) // CONFIRMED 또는 COMPLETED
      //   );
        
      //   if (!hasBooking.value) {
      //     alert('리뷰를 작성하려면 해당 가게에서 예약을 완료해야 합니다.');
      //     router.push({ name: 'StoreDetail', params: { storeId: storeId } });
      //     return;
      //   }
        hasBooking.value=true;
        loading.value = false;
      // } catch (e) {
      //   console.error("예약 상태 확인 실패:", e);
      //   alert('예약 정보를 확인할 수 없습니다.');
      //   router.push({ name: 'StoreDetail', params: { storeId: route.params.storeId } });
      // }
    };

    // 페이지 로드 시 예약 여부 확인
    checkBookingStatus();

    return {
      score,
      comment,
      submitReview,
      hasBooking,
      loading
    };
  },
};
</script>

<style scoped>
.review-create {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
  text-align: center;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.loading-message,
.error-message {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.error-message {
  color: #f44336;
}

.review-form {
  margin-top: 20px;
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 25px;
  text-align: left;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #777;
  margin-bottom: 10px;
  font-size: 14px;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.2);
}

.rating {
  font-size: 36px;
  cursor: pointer;
  color: #ccc;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.rating span {
  transition: color 0.2s ease;
}

.rating .filled-star {
  color: #ff5722;
}

.submit-button {
  width: 100%;
  padding: 15px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.submit-button:hover {
  background-color: #e64a19;
}
</style>