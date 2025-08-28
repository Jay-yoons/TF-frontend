<template>
  <div class="container">
    <div v-if="loading" class="status-message">
      가게 목록을 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>
    <div v-else>
      <h1 class="title">가게 목록</h1>
      
      <div class="category-filter">
        <button 
          :class="['category-btn', { active: selectedCategory === 'all' }]" 
          @click="selectedCategory = 'all'"
        >
          전체
        </button>
        <button 
          :class="['category-btn', { active: selectedCategory === 1 }]" 
          @click="selectedCategory = 1"
        >
          한식
        </button>
        <button 
          :class="['category-btn', { active: selectedCategory === 2 }]" 
          @click="selectedCategory = 2"
        >
          일식
        </button>
        <button 
          :class="['category-btn', { active: selectedCategory === 3 }]" 
          @click="selectedCategory = 3"
        >
          양식
        </button>
        <button 
          :class="['category-btn', { active: selectedCategory === 4 }]" 
          @click="selectedCategory = 4"
        >
          중식
        </button>
        <button 
          :class="['category-btn', { active: selectedCategory === 5 }]" 
          @click="selectedCategory = 5"
        >
          카페
        </button>
      </div>
      
      <div class="view-toggle">
        <button 
          :class="['toggle-btn', { active: viewMode === 'list' }]" 
          @click="viewMode = 'list'"
        >
          목록 보기
        </button>
        <button 
          :class="['toggle-btn', { active: viewMode === 'map' }]" 
          @click="viewMode = 'map'"
        >
          지도 보기
        </button>
      </div>

      <div v-if="viewMode === 'list'" class="list-view">
        <div v-if="filteredStores.length > 0" class="stores-grid">
          <div v-for="store in filteredStores" :key="store.storeId" class="store-card">
            <router-link :to="{ name: 'StoreDetail', params: { storeId: store.storeId } }" class="store-link">
              <h3 class="store-name">{{ store.storeName }}</h3>
              <p class="store-location">{{ store.storeLocation }}</p>
                          <div class="store-info">
              <span class="info-item">영업시간: {{ formatBusinessHours(store.openTime, store.closeTime) }}</span>
              <span class="info-item">총 좌석: {{ store.seatNum }}석</span>
              <span class="info-item">카테고리: {{ getCategoryName(store.categoryCode) }}</span>
              <span class="info-item">
                <span :class="['status-badge', { 'open': store.openNow, 'closed': !store.openNow }]">
                  {{ store.openStatus }}
                </span>
              </span>
            </div>
            <div class="store-actions">
              <span class="view-details">상세보기 →</span>
            </div>
            </router-link>
          </div>
        </div>
        <div v-else class="status-message">
          {{ selectedCategory === 'all' ? '등록된 가게가 없습니다.' : '선택한 카테고리의 가게가 없습니다.' }}
        </div>
      </div>

      <div v-else-if="viewMode === 'map'" class="map-view">
        <div id="map" class="map-container"></div>
        <div class="map-sidebar">
          <h3>가게 목록</h3>
          <div class="map-store-list">
            <div 
              v-for="store in filteredStores" 
              :key="store.storeId" 
              class="map-store-item"
              @click="moveToStore(store)"
            >
              <h4>{{ store.storeName }}</h4>
              <p>{{ store.storeLocation }}</p>
              <p class="business-hours">영업시간: {{ formatBusinessHours(store.openTime, store.closeTime) }}</p>
              <span class="store-category">{{ getCategoryName(store.categoryCode) }}</span>
              <span :class="['status-badge', { 'open': store.openNow, 'closed': !store.openNow }]">
                {{ store.openStatus }}
              </span>
                          <div class="map-store-actions">
              <button @click.stop="openStoreModal(store)" class="action-btn primary">상세 정보</button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedStore" class="modal-overlay" @click="closeStoreModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedStore.storeName }}</h2>
            <button @click="closeStoreModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-store-image-container">
              <img 
                :src="selectedStore.imageUrl" 
                :alt="selectedStore.storeName"
                class="modal-store-image"
                @error="handleImageError"
              />
            </div>
            
            <div class="store-details">
              <p><strong>위치:</strong> {{ selectedStore.storeLocation }}</p>
              <p><strong>영업시간:</strong> {{ formatBusinessHours(selectedStore.openTime, selectedStore.closeTime) }}</p>
              <p><strong>영업상태:</strong> 
                <span :class="['status-badge', { 'open': selectedStore.openNow, 'closed': !selectedStore.openNow }]">
                  {{ selectedStore.openStatus }}
                </span>
              </p>
              <p><strong>총 좌석:</strong> {{ selectedStore.seatNum }}석</p>
              <p><strong>카테고리:</strong> {{ getCategoryName(selectedStore.categoryCode) }}</p>
            </div>
            
            <div v-if="userStore.isAuthenticated" class="store-actions-modal">
              <div class="action-buttons">
                <button @click="goToBooking" class="action-btn primary">예약하기</button>
                <button v-if="hasBooking" @click="goToReview" class="action-btn">리뷰 작성</button>
                <button 
                  @click="toggleFavorite" 
                  :class="['action-btn', { 'favorite': isFavorite }]"
                >
                  {{ isFavorite ? '♥ 즐겨찾기 해제' : '♡ 즐겨찾기 추가' }}
                </button>
              </div>
            </div>
            <div v-else class="auth-notice">
              <p>예약, 리뷰, 즐겨찾기 기능을 사용하려면 로그인이 필요합니다.</p>
              <router-link to="/login" class="login-link">로그인하기</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/api/axios';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();
const stores = ref([]);
const loading = ref(true);
const error = ref(null);
const viewMode = ref('list');
const map = ref(null);
const markers = ref([]);
const selectedStore = ref(null);
const isFavorite = ref(false);
const hasBooking = ref(false);
const selectedCategory = ref('all');
const mapBounds = ref(null); // 지도 범위를 추적하는 반응형 변수

// 필터링된 가게 목록
const filteredStores = computed(() => {
  let filtered = stores.value;
  
  // 카테고리 필터링
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(store => store.categoryCode === selectedCategory.value);
  }
  
  // 지도 보기 모드일 때 지도 범위 내 가게만 필터링
  if (viewMode.value === 'map' && mapBounds.value) {
    filtered = filtered.filter(store => {
      if (!store.latitude || !store.longitude) return false;
      const position = {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude)
      };
      return mapBounds.value.contains(position);
    });
  }
  
  return filtered;
});

const fetchStores = async () => {
  try {
    const response = await axios.get('/api/stores');
    
    // API 응답이 HTML인지 확인
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('API가 HTML을 반환했습니다. 백엔드 서비스에 문제가 있을 수 있습니다.');
      error.value = '서버에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      return;
    }
    
    stores.value = response.data;
    console.log('가게 목록 조회 성공:', stores.value.length, '개');
    console.log('가게 데이터:', stores.value);
  } catch (err) {
    console.error('가게 목록 조회 실패:', err);
    error.value = '가게 목록을 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

const getCategoryName = (categoryCode) => {
  const categories = {
    1: '한식',
    2: '일식', 
    3: '양식',
    4: '중식',
    5: '카페'
  };
  return categories[categoryCode] || '기타';
};

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

const initMap = () => {
  console.log('지도 초기화 시작');
  
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return;
  }

  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Map element not found');
    return;
  }

  // 모바일 디바이스 감지
  const isMobile = window.innerWidth <= 768;
  console.log('모바일 디바이스:', isMobile);

  // 서울 중심 좌표
  const seoul = { lat: 37.5665, lng: 126.9780 };
  
  const mapOptions = {
    center: seoul,
    zoom: isMobile ? 11 : 12, // 모바일에서는 더 넓은 줌 레벨
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ],
    // 모바일 최적화 설정
    gestureHandling: 'greedy', // 모바일에서 터치 제스처 개선
    zoomControl: true,
    zoomControlOptions: {
      position: isMobile ? window.google.maps.ControlPosition.RIGHT_BOTTOM : window.google.maps.ControlPosition.RIGHT_TOP
    }
  };
  
  map.value = new window.google.maps.Map(mapElement, mapOptions);

  console.log('지도 생성 완료');

  // 지도 이벤트 리스너 추가
  map.value.addListener('bounds_changed', () => {
    // 지도 범위가 변경되면 가게 목록 업데이트
    console.log('지도 범위 변경됨');
    // 지도 범위 업데이트
    mapBounds.value = map.value.getBounds();
    // 지도 범위 변경 시 마커 다시 그리기
    updateMapMarkers();
  });

  // 초기 지도 범위 설정
  mapBounds.value = map.value.getBounds();
  
  // 기존 마커들 제거
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];

  // 가게 마커 추가 (필터링된 가게들만)
  filteredStores.value.forEach((store, index) => {
    console.log(`가게 ${index + 1}:`, store);
    
    if (store.latitude && store.longitude) {
      const position = {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude)
      };

      console.log(`마커 위치 ${index + 1}:`, position);

      const marker = new window.google.maps.Marker({
        position: position,
        map: map.value,
        title: store.storeName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(isMobile ? 24 : 32, isMobile ? 24 : 32)
        }
      });

      // 정보창 추가
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px;">${store.storeName}</h3>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${store.storeLocation}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #888;">${formatBusinessHours(store.openTime, store.closeTime)}</p>
            <p style="margin: 0; font-size: 12px; color: ${store.openNow ? '#4caf50' : '#f44336'};">
              ${store.openStatus}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.value, marker);
      });

      markers.value.push(marker);
      console.log(`마커 ${index + 1} 추가 완료`);
    } else {
      console.log(`가게 ${index + 1} 좌표 없음:`, store.latitude, store.longitude);
    }
  });

  console.log('총 마커 개수:', markers.value.length);
};

const moveToStore = (store) => {
  if (map.value && store.latitude && store.longitude) {
    const position = {
      lat: parseFloat(store.latitude),
      lng: parseFloat(store.longitude)
    };
    map.value.setCenter(position);
    map.value.setZoom(15);
  }
};

// 지도 마커 업데이트 함수
const updateMapMarkers = () => {
  if (!map.value) return;
  
  // 모바일 디바이스 감지
  const isMobile = window.innerWidth <= 768;
  
  // 기존 마커들 제거
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];
  
  // 필터링된 가게들에 대해 마커 추가
  filteredStores.value.forEach((store) => {
    if (store.latitude && store.longitude) {
      const position = {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude)
      };
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: map.value,
        title: store.storeName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(isMobile ? 24 : 32, isMobile ? 24 : 32)
        }
      });

      // 정보창 추가
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px;">${store.storeName}</h3>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${store.storeLocation}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #888;">${formatBusinessHours(store.openTime, store.closeTime)}</p>
            <p style="margin: 0; font-size: 12px; color: ${store.openNow ? '#4caf50' : '#f44336'};">
              ${store.openStatus}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.value, marker);
      });

      markers.value.push(marker);
    }
  });
};

const openStoreModal = async (store) => {
  selectedStore.value = store;
  // 즐겨찾기 상태 확인
  if (userStore.isAuthenticated) {
    isFavorite.value = await userStore.isFavoriteStore(store.storeId);
    await checkBookingStatus(store.storeId);
  } else {
    hasBooking.value = false;
  }
};

const closeStoreModal = () => {
  selectedStore.value = null;
  isFavorite.value = false;
  hasBooking.value = false;
};

const checkBookingStatus = async (storeId) => {
  if (!userStore.isAuthenticated) {
    hasBooking.value = false;
    return;
  }
  try {
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
    
    // 리뷰 작성 여부도 확인
    if (hasBooking.value) {
      await checkReviewStatus(storeId);
    }
    
    console.log('예약 상태 확인:', hasBooking.value);
  } catch (e) {
    console.error("예약 상태 확인 실패:", e);
    hasBooking.value = false;
  }
};

// 리뷰 작성 여부 확인 함수
const checkReviewStatus = async (storeId) => {
  try {
    const idToken = localStorage.getItem('idToken');
    
    // 리뷰 작성 여부 확인
    const reviewResponse = await axios.get(`/api/reviews/store/${storeId}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    
    const userReviews = reviewResponse.data;
    const userReviewCount = userReviews.filter(review => 
      review.userId === userStore.user?.userId
    ).length;
    
    // 이미 리뷰를 작성했다면 버튼 비활성화
    if (userReviewCount > 0) {
      hasBooking.value = false;
      console.log('이미 리뷰를 작성했습니다:', userReviewCount, '개 리뷰');
    } else {
      hasBooking.value = true;
      console.log('리뷰 작성 가능');
    }
    
  } catch (e) {
    console.error("리뷰 상태 확인 실패:", e);
    // 에러가 발생해도 예약 상태는 유지
  }
};

// 이미지 로드 실패 시 처리 함수
const handleImageError = (event) => {
  // 기본 이미지로 대체
  event.target.src = 'https://fog-object.s3.ap-northeast-2.amazonaws.com/store/default-store.png';
};

const goToBooking = () => {
  if (selectedStore.value) {
    router.push({ name: 'BookingPage', params: { storeId: selectedStore.value.storeId } });
  }
};

const goToReview = () => {
  if (selectedStore.value) {
    // 리뷰 작성 페이지로 이동 (bookingNum은 임시로 0 사용)
    router.push({ name: 'ReviewCreate', params: { storeId: selectedStore.value.storeId, bookingNum: 0 } });
  }
};

const toggleFavorite = async () => {
  if (!selectedStore.value || !userStore.isAuthenticated) return;
  
  try {
    if (isFavorite.value) {
      await userStore.removeFavorite(selectedStore.value.storeId);
    } else {
      await userStore.addFavorite(selectedStore.value.storeId);
    }
    isFavorite.value = !isFavorite.value;
  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error);
  }
};

const watchViewMode = async () => {
  console.log('viewMode 변경:', viewMode.value);
  if (viewMode.value === 'map') {
    await nextTick();
    setTimeout(() => {
      initMap();
    }, 100);
  }
};

onMounted(() => {
  fetchStores();
  
  // 모바일에서 화면 크기 변경 시 지도 조정
  const handleResize = () => {
    if (viewMode.value === 'map' && map.value) {
      // 지도 리사이즈 트리거
      window.google.maps.event.trigger(map.value, 'resize');
      // 지도 다시 중앙 정렬
      const seoul = { lat: 37.5665, lng: 126.9780 };
      map.value.setCenter(seoul);
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // 컴포넌트 언마운트 시 이벤트 리스너 제거
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});

// viewMode 변경 감지
watch(viewMode, watchViewMode);

// 카테고리 변경 감지 - 지도 모드일 때만 지도 다시 초기화
watch(selectedCategory, () => {
  if (viewMode.value === 'map') {
    setTimeout(() => {
      initMap();
    }, 100);
  }
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 30px;
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

/* 카테고리 필터 스타일 */
.category-filter {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 14px;
}

.category-btn:hover {
  border-color: #ff5722;
  color: #ff5722;
}

.category-btn.active {
  background: #ff5722;
  color: white;
  border-color: #ff5722;
}

/* 토글 버튼 스타일 */
.view-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
}

.toggle-btn {
  padding: 10px 20px;
  border: 2px solid #ff5722;
  background: white;
  color: #ff5722;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: #ff5722;
  color: white;
}

.toggle-btn.active {
  background: #ff5722;
  color: white;
}

/* 목록 보기 스타일 */
.list-view {
  width: 100%;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.store-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.store-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.store-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.store-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.store-location {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 15px;
}

.info-item {
  font-size: 12px;
  color: #888;
}

.store-actions {
  display: flex;
  justify-content: flex-end;
}

.view-details {
  font-size: 14px;
  color: #ff5722;
  font-weight: 500;
}

/* 지도 보기 스타일 */
.map-view {
  display: flex;
  height: 600px;
  gap: 20px;
}

.map-container {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.map-sidebar {
  width: 300px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}

.map-sidebar h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.map-store-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.map-store-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.map-store-item:hover {
  border-color: #ff5722;
  background: #fff5f5;
}

.map-store-item h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.map-store-item p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.store-category {
  display: inline-block;
  padding: 2px 8px;
  background: #ff5722;
  color: white;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.map-store-actions {
  margin-top: 8px;
}

.detail-link {
  color: #ff5722;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
}

.detail-link:hover {
  text-decoration: underline;
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
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
}

/* 모달 내 가게 이미지 스타일 */
.modal-store-image-container {
  margin-bottom: 20px;
  text-align: center;
}

.modal-store-image {
  max-width: 100%;
  width: 250px;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.store-details p {
  margin: 8px 0;
  color: #666;
}

.store-details strong {
  color: #333;
}

.store-actions-modal {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 12px 20px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 14px;
}

.action-btn:hover {
  border-color: #ff5722;
  color: #ff5722;
}

.action-btn.primary {
  background: #ff5722;
  color: white;
  border-color: #ff5722;
}

.action-btn.primary:hover {
  background: #e64a19;
  border-color: #e64a19;
}

.action-btn.favorite {
  background: #ff5722;
  color: white;
  border-color: #ff5722;
}

.auth-notice {
  margin-top: 20px;
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

/* 지도 사이드바 영업시간 스타일 */
.business-hours {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
}

/* 가게 카드 영업상태 스타일 */
.store-info .status-badge {
  margin-left: 8px;
}

.auth-notice {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.auth-notice p {
  margin: 0 0 10px 0;
  color: #666;
}

.login-link {
  color: #ff5722;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .title {
    font-size: 24px;
    margin-bottom: 15px;
  }
  
  .category-filter {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
  }
  
  .category-btn {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 20px;
  }
  
  .view-toggle {
    margin-bottom: 15px;
  }
  
  .toggle-btn {
    padding: 10px 16px;
    font-size: 14px;
    border-radius: 20px;
  }
  
  /* 지도 보기 모바일 최적화 */
  .map-view {
    flex-direction: column;
    height: auto;
    gap: 10px;
  }
  
  .map-container {
    height: 350px;
    min-height: 300px;
    width: 100%;
  }
  
  .map-sidebar {
    width: 100%;
    max-height: 300px;
    padding: 15px;
  }
  
  .map-store-list {
    gap: 10px;
  }
  
  .map-store-item {
    padding: 12px;
  }
  
  .map-store-item h4 {
    font-size: 13px;
  }
  
  .map-store-item p {
    font-size: 11px;
  }
  
  /* 목록 보기 모바일 최적화 */
  .stores-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .store-card {
    padding: 15px;
  }
  
  .store-name {
    font-size: 16px;
  }
  
  .store-location {
    font-size: 13px;
  }
  
  .info-item {
    font-size: 11px;
  }
}

/* 태블릿 반응형 디자인 */
@media (min-width: 769px) and (max-width: 1024px) {
  .map-view {
    height: 500px;
    gap: 15px;
  }
  
  .map-sidebar {
    width: 250px;
    padding: 15px;
  }
  
  .stores-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

/* 작은 모바일 화면 */
@media (max-width: 480px) {
  .container {
    padding: 8px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .category-filter {
    gap: 6px;
  }
  
  .category-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .map-container {
    height: 300px;
  }
  
  .map-sidebar {
    max-height: 250px;
    padding: 12px;
  }
  
  .store-card {
    padding: 12px;
  }
}
</style>