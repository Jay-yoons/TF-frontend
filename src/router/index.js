import { createRouter, createWebHistory } from 'vue-router';
// 'useUserStore'를 여기서 직접 import 하는 것은 유지합니다.
//import { useUserStore } from '@/stores/userStore';

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
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/bookings',
    name: 'BookingList',
    component: BookingList
  },
  {
    path: '/bookings/:bookingNum',
    name: 'BookingDetail',
    component: BookingDetail
  },
  {
    path: '/stores',
    name: 'StoreList',
    component: StoreList,
  },
  {
    path: '/stores/:storeId',
    name: 'StoreDetail',
    component: StoreDetail
  },
  {
    path: '/stores/:storeId/book',
    name: 'BookingPage',
    component: BookingPage
  },
  {
    path: '/stores/:storeId/reviews',
    name: 'ReviewList',
    component: ReviewList,
  },
  {
    path: '/reviews/:id',
    name: 'ReviewDetail',
    component: ReviewDetail,
  },
  {
    path: '/reviews/new/:storeId/:bookingNum',
    name: 'ReviewCreate',
    component: ReviewCreate,
    props: true,
  },
  {
    path: '/callback',
    name: 'Callback',
    component: CallbackPage
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: MyPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/stores/:storeId/my-reviews',
    name: 'MyReviewsInStore',
    component: MyReviewsInStore,
    meta: {
      requiresAuth: true
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * 1) /logout 흡수 가드 (항상 맨 위에 등록!)
 * - 스토어 접근 없이 동작하므로 Pinia 설치 순서와 무관
 */
router.beforeEach((to, from, next) => {
  const path = (to.path || '').replace(/\/+$/, '').toLowerCase();
  if (path === '/logout') {
    // 홈으로 강제 이동, 히스토리에 /logout 남기지 않음
    return next({ path: '/', replace: true });
  }
  next();
});

/**
 * 2) 인증 필요 라우트 보호 가드
 * - 간단히 localStorage의 idToken으로 인증 여부 확인
 *   (Pinia가 아직 활성 아니어도 안전하게 동작)
 */
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta && to.meta.requiresAuth;
  const isAuthenticated = typeof window !== 'undefined' && !!window.localStorage.getItem('idToken'); // 또는 accessToken
  if (requiresAuth && !isAuthenticated) {
    return next({ path: '/' }); // 라우트 이름 'Login'이 실제로 존재해야 함
  }
  next();
});

export default router;
