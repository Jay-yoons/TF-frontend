<template>
  <div class="container">
    <!-- 뒤로가기 버튼 -->
    <button @click="goBack" class="back-button">
      ← 뒤로가기
    </button>

    <div v-if="loading" class="status-message">
      가게 목록을 불러오는 중...
    </div>
    <div v-else-if="error" class="status-message text-red">
      {{ error }}
    </div>
    <div v-else>
      <h1 class="title">가게 목록</h1>
      
      <!-- 검색바 -->
      <div class="search-section">
        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="가게명 또는 위치로 검색..."
            class="search-input"
            @input="handleSearch"
          />
          <button @click="clearSearch" class="clear-search-btn" v-if="searchQuery">
            ×
          </button>
        </div>
        <div class="search-filters">
          <label class="filter-label">
            <input
              v-model="filters.openOnly"
              type="checkbox"
              @change="applyFilters"
            />
            영업중인 가게만
          </label>
          <label class="filter-label">
            <input
              v-model="filters.hasSeats"
              type="checkbox"
              @change="applyFilters"
            />
            예약 가능한 가게만
          </label>
        </div>
      </div>
      
      <!-- 인기 가게 섹션 -->
      <section class="popular-stores-section">
        <h2 class="section-title">인기 가게</h2>
        <div v-if="loadingPopularStores" class="skeleton-grid">
          <div v-for="i in 3" :key="i" class="store-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text short"></div>
            </div>
          </div>
        </div>
        <div v-else-if="popularStores.length > 0" class="popular-stores-grid">
          <div 
            v-for="store in popularStores.slice(0, 3)" 
            :key="store.storeId" 
            class="popular-store-card"
            @click="goToStore(store.storeId)"
          >
            <div class="store-image">
              <img 
                :src="store.imageUrl || '/default-store.jpg'" 
                :alt="store.storeName"
                @error="handleImageError"
              />
            </div>
                         <div class="store-info">
               <h3 class="store-name">{{ store.storeName }}</h3>
               <p class="store-location">{{ store.storeLocation }}</p>
               <div class="store-meta">
                 <span class="store-category">{{ getCategoryName(store.categoryCode) }}</span>
                 <span :class="['status-badge', { 'open': store.openNow, 'closed': !store.openNow }]">
                   {{ store.openStatus }}
                 </span>
               </div>
               <div class="popularity-info">
                 <div class="rating-info">
                   <span class="stars">
                     <span v-for="i in Math.floor(store.averageRating)" :key="i" class="star">★</span>
                     <span v-for="i in (5 - Math.floor(store.averageRating))" :key="i" class="star empty">☆</span>
                   </span>
                   <span class="rating-text">{{ store.averageRating.toFixed(1) }} ({{ store.reviewCount }}개)</span>
                 </div>
                 <div class="stats-info">
                   <span class="stat-item">예약 {{ store.bookingCount }}회</span>
                   <span class="stat-item">♥ {{ store.favoriteCount }}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>인기 가게를 불러오는 중...</p>
        </div>
      </section>
      
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
         <!-- 모바일용 오버레이 목록 -->
         <div :class="['mobile-store-overlay', { 'open': mobileOverlayOpen }]">
           <div class="mobile-store-header">
             <h3>가게 목록 ({{ filteredStores.length }}개)</h3>
             <button class="close-overlay-btn" @click="toggleMobileOverlay">×</button>
           </div>
           <div class="mobile-store-list">
             <div 
               v-for="store in filteredStores" 
               :key="store.storeId" 
               class="mobile-store-item"
               @click="moveToStore(store)"
             >
               <div class="mobile-store-info">
                 <h4>{{ store.storeName }}</h4>
                 <p>{{ store.storeLocation }}</p>
                 <p class="business-hours">영업시간: {{ formatBusinessHours(store.openTime, store.closeTime) }}</p>
                 <div class="mobile-store-badges">
                   <span class="store-category">{{ getCategoryName(store.categoryCode) }}</span>
                   <span :class="['status-badge', { 'open': store.openNow, 'closed': !store.openNow }]">
                     {{ store.openStatus }}
                   </span>
                 </div>
               </div>
               <div class="mobile-store-actions">
                 <button @click.stop="openStoreModal(store)" class="action-btn primary">상세</button>
               </div>
             </div>
           </div>
         </div>
         <!-- 모바일용 목록 토글 버튼 -->
         <button class="mobile-list-toggle" @click="toggleMobileOverlay">
           <span class="toggle-icon">📋</span>
           <span class="toggle-text">가게 목록</span>
         </button>
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

    <!-- 토스트 알림 -->
    <div v-if="toast.show" :class="['toast', toast.type]" @click="hideToast">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
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
const mobileOverlayOpen = ref(false); // 모바일 오버레이 상태

// 검색 및 필터 관련 상태
const searchQuery = ref('');
const filters = ref({
  openOnly: false,
  hasSeats: false
});
const toast = ref({ show: false, message: '', type: 'success' });

// 인기 가게 관련 상태
const popularStores = ref([]);
const loadingPopularStores = ref(false);

// 필터링된 가게 목록
const filteredStores = computed(() => {
  let filtered = stores.value;
  
  // 검색어 필터링
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(store => 
      store.storeName.toLowerCase().includes(query) ||
      store.storeLocation.toLowerCase().includes(query)
    );
  }
  
  // 카테고리 필터링
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(store => store.categoryCode === selectedCategory.value);
  }
  
  // 영업중인 가게만 필터링
  if (filters.value.openOnly) {
    filtered = filtered.filter(store => store.openNow);
  }
  
  // 예약 가능한 가게만 필터링
  if (filters.value.hasSeats) {
    filtered = filtered.filter(store => store.seatNum > 0);
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

// 인기 가게 불러오기
const fetchPopularStores = async () => {
  loadingPopularStores.value = true;
  try {
    const response = await axios.get('/api/stores');
    
    // 각 가게의 상세 정보를 가져와서 복합 점수 계산
    const storesWithScores = await Promise.all(
      response.data
        .filter(store => store.openNow) // 영업중인 가게만
        .map(async (store) => {
          try {
            // 가게별 리뷰 정보 가져오기 (전체 리뷰에서 필터링)
            const allReviewsResponse = await axios.get('/api/reviews');
            const allReviews = allReviewsResponse.data || [];
            const storeReviews = allReviews.filter(review => review.storeId === store.storeId);
            
            // 가게별 예약 정보 가져오기 (전체 예약에서 필터링)
            const allBookingsResponse = await axios.get('/api/bookings');
            const allBookings = allBookingsResponse.data || [];
            const storeBookings = allBookings.filter(booking => booking.storeId === store.storeId);
            
            // 가게별 즐겨찾기 수 가져오기 (전체 즐겨찾기에서 필터링)
            const allFavoritesResponse = await axios.get('/api/favorites');
            const allFavorites = allFavoritesResponse.data || [];
            const storeFavorites = allFavorites.filter(favorite => favorite.storeId === store.storeId);
            
            // 복합 점수 계산
            const score = calculatePopularityScore(storeReviews, storeBookings, storeFavorites);
            
            return {
              ...store,
              popularityScore: score,
              reviewCount: storeReviews.length,
              averageRating: storeReviews.length > 0 
                ? storeReviews.reduce((sum, review) => sum + review.score, 0) / storeReviews.length 
                : 0,
              bookingCount: storeBookings.filter(b => b.bookingStateCode === 2).length, // 완료된 예약만
              favoriteCount: storeFavorites.length
            };
          } catch (error) {
            console.error(`가게 ${store.storeId} 정보 가져오기 실패:`, error);
            // 에러가 발생한 경우 기본 점수 부여
            return {
              ...store,
              popularityScore: 0,
              reviewCount: 0,
              averageRating: 0,
              bookingCount: 0,
              favoriteCount: 0
            };
          }
        })
    );
    
    // 복합 점수로 정렬하여 상위 6개 선택
    popularStores.value = storesWithScores
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 6);
      
  } catch (error) {
    console.error('인기 가게 불러오기 실패:', error);
    showToast('인기 가게를 불러오는데 실패했습니다.', 'error');
  } finally {
    loadingPopularStores.value = false;
  }
};

// 복합 점수 계산 함수
const calculatePopularityScore = (reviews, bookings, favorites) => {
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, review) => sum + review.score, 0) / reviewCount 
    : 0;
  const completedBookings = bookings.filter(b => b.bookingStateCode === 2).length; // 완료된 예약만
  const favoriteCount = favorites.length;
  
  // 각 요소별 점수 계산 (가중치 적용)
  const ratingScore = averageRating * 20; // 평점 * 20 (최대 100점)
  const reviewScore = Math.min(reviewCount * 2, 50); // 리뷰 수 * 2 (최대 50점)
  const bookingScore = Math.min(completedBookings * 3, 30); // 완료 예약 수 * 3 (최대 30점)
  const favoriteScore = Math.min(favoriteCount * 5, 20); // 즐겨찾기 수 * 5 (최대 20점)
  
  // 최소 리뷰 수 조건 (리뷰가 3개 미만이면 점수 감점)
  const reviewPenalty = reviewCount < 3 ? -20 : 0;
  
  const totalScore = ratingScore + reviewScore + bookingScore + favoriteScore + reviewPenalty;
  
  return Math.max(totalScore, 0); // 음수 방지
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

  // 강남 중심 좌표
  const gangnam = { lat: 37.496667, lng: 127.0275 };
  
  // 모바일에서 줌 레벨 조정
  const isMobile = window.innerWidth <= 768;
  const initialZoom = isMobile ? 13 : 12;
  
  map.value = new window.google.maps.Map(mapElement, {
    center: gangnam,
    zoom: initialZoom,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

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

      // 모바일에서 마커 크기 조정
      const isMobile = window.innerWidth <= 768;
      const markerSize = isMobile ? 24 : 32;
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: map.value,
        title: store.storeName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(markerSize, markerSize)
        }
      });

      // 모바일에서 정보창 크기 조정
      const infoWindowMaxWidth = isMobile ? '150px' : '200px';
      const titleFontSize = isMobile ? '12px' : '14px';
      const textFontSize = isMobile ? '10px' : '12px';
      
      // 정보창 추가
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: ${infoWindowMaxWidth};">
            <h3 style="margin: 0 0 4px 0; font-size: ${titleFontSize}; font-weight: bold;">${store.storeName}</h3>
            <p style="margin: 0 0 4px 0; font-size: ${textFontSize}; color: #666;">${store.storeLocation}</p>
            <p style="margin: 0 0 4px 0; font-size: ${textFontSize}; color: #888;">${formatBusinessHours(store.openTime, store.closeTime)}</p>
            <p style="margin: 0; font-size: ${textFontSize}; color: ${store.openNow ? '#4caf50' : '#f44336'}; font-weight: bold;">
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
    
    // 모바일에서 줌 레벨 조정
    const isMobile = window.innerWidth <= 768;
    const zoomLevel = isMobile ? 16 : 15;
    map.value.setZoom(zoomLevel);
  }
};

// 지도 마커 업데이트 함수
const updateMapMarkers = () => {
  if (!map.value) return;
  
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
      
      // 모바일에서 마커 크기 조정
      const isMobile = window.innerWidth <= 768;
      const markerSize = isMobile ? 24 : 32;
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: map.value,
        title: store.storeName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(markerSize, markerSize)
        }
      });

      // 모바일에서 정보창 크기 조정
      const infoWindowMaxWidth = isMobile ? '150px' : '200px';
      const titleFontSize = isMobile ? '12px' : '14px';
      const textFontSize = isMobile ? '10px' : '12px';
      
      // 정보창 추가
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: ${infoWindowMaxWidth};">
            <h3 style="margin: 0 0 4px 0; font-size: ${titleFontSize}; font-weight: bold;">${store.storeName}</h3>
            <p style="margin: 0 0 4px 0; font-size: ${textFontSize}; color: #666;">${store.storeLocation}</p>
            <p style="margin: 0 0 4px 0; font-size: ${textFontSize}; color: #888;">${formatBusinessHours(store.openTime, store.closeTime)}</p>
            <p style="margin: 0; font-size: ${textFontSize}; color: ${store.openNow ? '#4caf50' : '#f44336'}; font-weight: bold;">
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
    
    console.log('예약 상태 확인:', hasBooking.value);
  } catch (e) {
    console.error("예약 상태 확인 실패:", e);
    hasBooking.value = false;
  }
};

// 이미지 로드 실패 시 처리 함수
const handleImageError = (event) => {
  // 기본 이미지로 대체
  event.target.src = 'https://fog-object.s3.ap-northeast-2.amazonaws.com/store/default-store.png';
};

// 인기 가게로 이동
const goToStore = (storeId) => {
  router.push({ name: 'StoreDetail', params: { storeId } });
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

// 모바일 오버레이 토글 함수
const toggleMobileOverlay = () => {
  mobileOverlayOpen.value = !mobileOverlayOpen.value;
};

// 뒤로가기 함수
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};

// 검색 처리 함수
const handleSearch = () => {
  // 검색어가 변경될 때마다 자동으로 필터링됨 (computed에서 처리)
  if (searchQuery.value.trim()) {
    showToast(`"${searchQuery.value}" 검색 결과: ${filteredStores.value.length}개`, 'info');
  }
};

// 검색어 초기화
const clearSearch = () => {
  searchQuery.value = '';
  showToast('검색어가 초기화되었습니다.', 'info');
};

// 필터 적용
const applyFilters = () => {
  const activeFilters = [];
  if (filters.value.openOnly) activeFilters.push('영업중');
  if (filters.value.hasSeats) activeFilters.push('예약가능');
  
  if (activeFilters.length > 0) {
    showToast(`${activeFilters.join(', ')} 필터 적용: ${filteredStores.value.length}개`, 'info');
  }
};

// 토스트 알림 표시
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    hideToast();
  }, 3000);
};

// 토스트 알림 숨기기
const hideToast = () => {
  toast.value.show = false;
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
  fetchPopularStores();
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
  position: relative;
}

/* 뒤로가기 버튼 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;
}

.back-button:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* 검색 섹션 */
.search-section {
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  max-width: 500px;
  margin: 0 auto 15px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #ddd;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.search-filters {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.filter-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #ff5722;
}

/* 토스트 알림 */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  max-width: 300px;
  word-wrap: break-word;
}

.toast.success {
  background: #4caf50;
}

.toast.error {
  background: #f44336;
}

.toast.info {
  background: #2196f3;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
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

/* 인기 가게 섹션 */
.popular-stores-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: left;
}

.popular-stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.popular-store-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.popular-store-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.popular-store-card .store-image {
  height: 200px;
  overflow: hidden;
}

.popular-store-card .store-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popular-store-card .store-info {
  padding: 15px;
}

.popular-store-card .store-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.popular-store-card .store-location {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.popular-store-card .store-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popular-store-card .store-category {
  background: #ff5722;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.popular-store-card .status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.popular-store-card .status-badge.open {
  background: #4caf50;
  color: white;
}

.popular-store-card .status-badge.closed {
  background: #f44336;
  color: white;
}

/* 인기도 정보 스타일 */
.popularity-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  color: #ffd700;
  font-size: 12px;
}

.star.empty {
  color: #ddd;
}

.rating-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.stats-info {
  display: flex;
  gap: 12px;
}

.stat-item {
  font-size: 11px;
  color: #888;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 8px;
}

/* 스켈레톤 UI */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.store-skeleton {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 15px;
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 10px;
  border-radius: 4px;
}

.skeleton-text {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 8px;
  border-radius: 4px;
}

.skeleton-text.short {
  width: 60%;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
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

/* 모바일 오버레이 스타일 */
.mobile-store-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  display: none;
}

.mobile-store-overlay.open {
  transform: translateY(0);
}

.mobile-store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #ff5722;
  color: white;
  border-radius: 12px 12px 0 0;
}

.mobile-store-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.close-overlay-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-store-list {
  padding: 15px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.mobile-store-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-store-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mobile-store-info {
  flex: 1;
}

.mobile-store-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.mobile-store-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.mobile-store-badges {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.mobile-store-actions {
  margin-left: 10px;
}

.mobile-list-toggle {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
  display: none;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 50;
  transition: all 0.3s ease;
}

.mobile-list-toggle:hover {
  background: #e64a19;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 87, 34, 0.4);
}

.toggle-icon {
  font-size: 16px;
}

.toggle-text {
  display: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .back-button {
    top: 10px;
    left: 10px;
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .search-filters {
    gap: 15px;
  }
  
  .filter-label {
    font-size: 13px;
  }
  
  .map-view {
    position: relative;
    flex-direction: column;
    height: auto;
    gap: 10px;
  }
  
  .map-container {
    height: 300px;
    min-height: 250px;
    border-radius: 8px;
    position: relative;
  }
  
  .map-sidebar {
    display: none; /* 데스크톱 사이드바 숨김 */
  }
  
  .mobile-store-overlay {
    display: block;
  }
  
  .mobile-store-overlay.open {
    transform: translateY(0);
  }
  
  .mobile-list-toggle {
    display: flex;
  }
  
  .toggle-text {
    display: inline;
  }
  
  .stores-grid {
    grid-template-columns: 1fr;
  }
  
  .popular-stores-grid {
    grid-template-columns: 1fr;
  }
  
  .toggle-buttons {
    margin-bottom: 15px;
  }
  
  .toggle-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}

/* 작은 모바일 화면 */
@media (max-width: 480px) {
  .container {
    padding: 15px;
  }
  
  .search-input {
    padding: 10px 35px 10px 14px;
    font-size: 14px;
  }
  
  .search-filters {
    gap: 10px;
  }
  
  .filter-label {
    font-size: 12px;
  }
  
  .map-container {
    height: 250px;
    min-height: 200px;
  }
  
  .mobile-store-overlay {
    background: rgba(255, 255, 255, 0.98);
  }
  
  .mobile-store-header {
    padding: 12px 15px;
  }
  
  .mobile-store-header h3 {
    font-size: 14px;
  }
  
  .mobile-store-list {
    padding: 12px;
    max-height: calc(100vh - 180px);
  }
  
  .mobile-store-item {
    padding: 10px;
    margin-bottom: 8px;
  }
  
  .mobile-store-info h4 {
    font-size: 13px;
  }
  
  .mobile-store-info p {
    font-size: 11px;
  }
  
  .mobile-store-badges {
    gap: 6px;
    margin-top: 4px;
  }
  
  .store-category {
    font-size: 9px;
    padding: 1px 6px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .mobile-list-toggle {
    bottom: 15px;
    right: 15px;
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .toggle-text {
    display: none; /* 작은 화면에서는 아이콘만 표시 */
  }
  
  .detail-link {
    font-size: 11px;
  }
}
</style>