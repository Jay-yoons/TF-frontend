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
          <label for="comment">리뷰 내용 (최대 50자)</label>
          <textarea 
            id="comment" 
            v-model="comment" 
            rows="5" 
            required
            maxlength="50"
            @input="checkCharacterLimit"
            :class="{ 'error': isOverLimit }"
          ></textarea>
          <div class="character-count" :class="{ 'error': isOverLimit }">
            {{ comment.length }}/50
          </div>
        </div>
        <button type="submit" class="submit-button" :disabled="isOverLimit">리뷰 제출</button>
      </form>
      </div>
    </div>

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>알림</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p>{{ modalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="modal-btn">확인</button>
        </div>
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
    const isOverLimit = ref(false);
    const showModal = ref(false);
    const modalMessage = ref('');

    const submitReview = async () => {
      // 이전처럼 'idToken'을 사용하도록 수정
      const idToken = localStorage.getItem('idToken');
      
      if (!idToken) {
        showModalMessage('리뷰를 작성하려면 로그인이 필요합니다.');
        return;
      }
      if (score.value === 0) {
        showModalMessage('별점을 선택해주세요.');
        return;
      }
      if (isOverLimit.value) {
        showModalMessage('리뷰 내용이 50자를 초과했습니다. 내용을 줄여주세요.');
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
        await axios.post('/api/reviews', reviewRequestDto, { headers });
        
        showModalMessage('리뷰가 성공적으로 작성되었습니다!');
        
        // 잠시 후 가게 상세 페이지로 이동 (리뷰 목록을 볼 수 있도록)
        setTimeout(() => {
          router.push({ name: 'StoreDetail', params: { storeId: route.params.storeId } });
        }, 1500);

      } catch (error) {
        console.error('리뷰 작성 실패:', error);
        if (error.response?.status === 409) {
          showModalMessage('이미 해당 예약에 대한 리뷰를 작성하셨습니다.');
        } else {
          showModalMessage(`리뷰 작성에 실패했습니다: ${error.response?.data?.message || error.message}`);
        }
      }
    };

    // 글자 수 제한 확인 함수
    const checkCharacterLimit = () => {
      isOverLimit.value = comment.value.length > 50;
      // 모달은 한 번만 표시하도록 수정 (너무 자주 뜨지 않도록)
      if (isOverLimit.value && comment.value.length === 51) {
        showModalMessage('리뷰 내용은 최대 50자까지 입력 가능합니다.');
      }
    };

    // 모달 메시지 표시 함수
    const showModalMessage = (message) => {
      modalMessage.value = message;
      showModal.value = true;
    };

    // 모달 닫기 함수
    const closeModal = () => {
      showModal.value = false;
      modalMessage.value = '';
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
      loading,
      isOverLimit,
      showModal,
      modalMessage,
      checkCharacterLimit,
      showModalMessage,
      closeModal
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

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.submit-button:disabled:hover {
  background-color: #ccc;
}

/* 글자 수 카운터 스타일 */
.character-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.character-count.error {
  color: #f44336;
}

/* 에러 상태 텍스트 영역 */
textarea.error {
  border-color: #f44336;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.2);
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body p {
  margin: 0;
  color: #333;
  font-size: 16px;
  line-height: 1.5;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.modal-btn {
  padding: 10px 20px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.modal-btn:hover {
  background-color: #e64a19;
}
</style>