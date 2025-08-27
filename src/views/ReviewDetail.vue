<template>
  <div class="container">
    <div v-if="loading" class="status-message">
      리뷰 정보를 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>

    <div v-else-if="review" class="review-card">
      <h1 class="font-bold text-center text-2xl mb-4">리뷰 상세 정보</h1>

      <div class="review-details">
        <div class="detail-item">
          <span class="detail-label">가게 이름:</span>
          <span class="detail-value">{{ storeName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">작성자:</span>
          <span class="detail-value">{{ userName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">별점:</span>
          <div class="rating-stars">
            <span v-for="i in review.score" :key="'star-' + i">★</span>
            <span v-for="i in (5 - review.score)" :key="'empty-star-' + i" class="empty-star">☆</span>
          </div>
        </div>
      </div>

      <p class="review-comment">{{ review.comment }}</p>

      <div v-if="isAuthor" class="action-buttons">
        <button @click="showEditModal = true" class="action-button edit-button">
          수정
        </button>
        <button @click="deleteReview" class="action-button delete-button">
          삭제
        </button>
      </div>
    </div>

    <div v-else class="status-message">
      리뷰 정보를 찾을 수 없습니다.
    </div>

    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">리뷰 수정</h2>
        <div class="modal-form-group">
          <label>내용:</label>
          <textarea v-model="editedComment" rows="4"></textarea>
        </div>
        <div class="modal-form-group">
          <label>점수 (1-5):</label>
          <input type="number" v-model.number="editedScore" min="1" max="5">
        </div>
        <div class="modal-actions">
          <button @click="showEditModal = false" class="modal-button cancel-modal-button">
            취소
          </button>
          <button @click="updateReview" class="modal-button update-modal-button">
            수정 완료
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/api/axios';
import { jwtDecode } from 'jwt-decode';

const route = useRoute();
const router = useRouter();
const review = ref(null);
const loading = ref(true);
const error = ref(null);
const showEditModal = ref(false);
const editedComment = ref('');
const editedScore = ref(0);

const userName = ref('불러오는 중...');
const storeName = ref('불러오는 중...');

const isAuthor = computed(() => {
  if (!review.value) {
    return false;
  }
  const idToken = localStorage.getItem('idToken');
  if (!idToken) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(idToken);
    const currentUserId = decodedToken.sub;
    return review.value.userId === currentUserId;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return false;
  }
});

const fetchReviewDetail = async () => {
  const reviewId = route.params.id;
  const idToken = localStorage.getItem('idToken');

  try {
    const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
    const response = await axios.get(`/api/reviews/${reviewId}`, { headers });
    review.value = response.data;
    editedComment.value = review.value.comment;
    editedScore.value = review.value.score;

    if (review.value && review.value.userId) {
      await fetchUserName(review.value.userId);
    }

    if (review.value && review.value.storeId) {
      await fetchStoreName(review.value.storeId);
    }
  } catch (e) {
    error.value = `리뷰 상세 정보를 불러오는 데 실패했습니다: ${e.message}`;
  } finally {
    loading.value = false;
  }
};

const fetchUserName = async (userId) => {
  try {
    const response = await axios.get(`/api/users/${userId}/name`);
    userName.value = response.data;
  } catch (e) {
    console.error("Failed to fetch user name:", e);
    userName.value = '알 수 없음';
  }
};

const fetchStoreName = async (storeId) => {
  try {
    const response = await axios.get(`/api/stores/${storeId}/name`);
    storeName.value = response.data;
  } catch (e) {
    console.error("Failed to fetch store name:", e);
    storeName.value = '알 수 없음';
  }
};

const updateReview = async () => {
  const idToken = localStorage.getItem('idToken');
  const reviewId = review.value.reviewId;

  try {
    const updatedReviewData = {
      comment: editedComment.value,
      score: editedScore.value,
    };

    await axios.put(`/api/reviews/${reviewId}`, updatedReviewData, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    alert('리뷰가 성공적으로 수정되었습니다.');

    showEditModal.value = false;
    await fetchReviewDetail();
  } catch (e) {
    console.error('리뷰 수정 실패:', e);
    alert(`리뷰 수정에 실패했습니다: ${e.response?.data?.message || e.message}`);
  }
};

const deleteReview = async () => {
  if (confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
    const idToken = localStorage.getItem('idToken');
    const reviewId = review.value.reviewId;

    try {
      await axios.delete(`/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      alert('리뷰가 성공적으로 삭제되었습니다.');

      router.push({ name: 'ReviewList', params: { storeId: review.value.storeId } });
    } catch (e) {
      console.error('리뷰 삭제 실패:', e);
      alert(`리뷰 삭제에 실패했습니다: ${e.message}`);
    }
  }
};

onMounted(() => {
  fetchReviewDetail();
});
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

.review-card {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.review-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: bold;
  color: #333;
  width: 80px;
  margin-right: 10px;
  text-align: left;
  flex-shrink: 0;
}

.detail-value {
  color: #555;
  text-align: left;
  flex-grow: 1;
}

.rating-stars {
  font-size: 24px;
  color: #ff5722;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
}

.rating-stars .empty-star {
  color: #ccc;
}

.review-comment {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
}

.action-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
}

.edit-button {
  background-color: #ffffff;
  color: #333;
  border: 1px solid #ddd;
}

.edit-button:hover {
  background-color: #f0f0f0;
}

.delete-button {
  background-color: #ff5722;
  color: #ffffff;
}

.delete-button:hover {
  background-color: #e64a19;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.modal-form-group {
  margin-bottom: 20px;
}

.modal-form-group label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.modal-form-group textarea,
.modal-form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.cancel-modal-button {
  background-color: #ccc;
  color: #333;
}

.cancel-modal-button:hover {
  background-color: #bbb;
}

.update-modal-button {
  background-color: #ff5722;
  color: #ffffff;
}

.update-modal-button:hover {
  background-color: #e64a19;
}
</style>