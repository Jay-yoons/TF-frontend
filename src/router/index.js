/* eslint-env browser */

import { createRouter, createWebHistory } from 'vue-router';

// 🔒 Pinia 의존 제거: CI에서 경로/미사용 변수로 실패하는 경우가 많아 일단 불러오지 않습니다.
// import { useUserStore } from '@/stores/userStore';

import HomePage from '../views/HomePage.vue';
import BookingList from '../views/BookingList.vue';
import BookingDetail from '../views/BookingDetail.vue';
import StoreList from '../views/StoreList.vue';
import StoreDetail from '../views/StoreDetail.vue';
import BookingPage from '../views/BookingPage.vue';
import ReviewList from '../views/ReviewList.vue';
import ReviewDetail from '../views/ReviewDetail.vue';
import ReviewCreate from '../views/ReviewCreate.vue';
import CallbackPage from '../views/CallbackPage.vue';
import MyPage from '../views/MyPage.vue';
import MyReviewsInStore from '../views/MyReviewsInStore.vue';

const routes = [
  { path: '/', name: 'HomePage', component: HomePage },
  { path: '/bookings', name: 'BookingList', component: BookingList },
  { path: '/bookings/:bookingNum', name: 'BookingDetail', component: BookingDetail },
  { path: '/stores', name: 'StoreList', component: StoreList },
  { path: '/stores/:storeId', name: 'StoreDetail', component: StoreDetail },
  { path: '/stores/:storeId/book', name: 'BookingPage', component: BookingPage },
  { path: '/stores/:storeId/reviews', name: 'ReviewList', component: ReviewList },
  { path: '/reviews/:id', name: 'ReviewDetail', component: ReviewDetail },
  { path: '/reviews/new/:storeId/:bookingNum', name: 'ReviewCreate', component: ReviewCreate, props: true },
  { path: '/callback', name: 'Callback', component: CallbackPage },
  { path: '/mypage', name: 'MyPage', component: MyPage, meta: { requiresAuth: true } },
  { path: '/stores/:storeId/my-reviews', name: 'MyReviewsInStore', component: MyReviewsInStore, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * 1) /logout 흡수 가드 (항상 먼저 실행)
 *   - /logout(또는 /logout/) 진입 시 즉시 홈으로 이동 (히스토리에 남기지 않음)
 *   - 세션 플래그는 스토어에서 참고할 수 있도록 남김
 */
router.beforeEach((to, from, next) => {
  const path = (to.path || '').replace(/\/+$/, '').toLowerCase();
  if (path === '/logout') {
    try { sessionStorage.setItem('logoutInProgress', 'true'); } catch (_) {}
    return next({ path: '/', replace: true });
  }
  next();
});

/**
 * 2) 인증 필요한 라우트 보호 가드 (Pinia 의존 없음)
 *   - localStorage의 idToken만 확인 (초기화 순서 이슈 방지)
 *   - Login 라우트가 없다면 안전하게 홈(/)로 보냄
 */
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta && to.meta.requiresAuth;
  let isAuthenticated = false;

  if (typeof window !== 'undefined' && window.localStorage) {
    try { isAuthenticated = !!window.localStorage.getItem('idToken'); } catch (_) {}
  }

  if (requiresAuth && !isAuthenticated) {
    return next({ path: '/' });
  }
  next();
});

export default router;
