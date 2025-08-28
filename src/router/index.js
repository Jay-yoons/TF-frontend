/* eslint-env browser */

import { createRouter, createWebHistory } from 'vue-router';
// eslint-disable-next-line no-unused-vars
import { useUserStore } from '@/stores/userStore'; // 유지 원하신다고 하셔서 남겨두되, 가드에서는 미사용

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
 *   - /logout(또는 /logout/) 진입 시 즉시 홈으로 돌립니다.
 *   - 히스토리에 /logout 안 남도록 replace 사용.
 *   - 세션 플래그를 남겨서 초기 진입 시 자동 로그인/재리다이렉트 루프 방지.
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
 * 2) 인증 필요한 라우트 보호 가드
 *   - Pinia 초기화 순서 이슈 피하려고 localStorage만 사용.
 *   - 필요 시 'idToken' 대신 'accessToken'으로 바꿔도 됩니다.
 *   - 'Login' 라우트가 없다면 홈(/)로 돌리는 게 안전합니다.
 */
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta && to.meta.requiresAuth;
  let isAuthenticated = false;
  if (typeof window !== 'undefined') {
    try { isAuthenticated = !!window.localStorage.getItem('idToken'); } catch (_) {}
  }

  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }
  next();
});

export default router;
