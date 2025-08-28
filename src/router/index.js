import { createRouter, createWebHistory } from 'vue-router';
// 'useUserStore'를 여기서 직접 import 하는 것은 유지합니다.
import { useUserStore } from '@/stores/userStore';

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

router.beforeEach(async (to, from, next) => {
  // 1) /logout 접근은 언제나 홈으로 우회 (강화된 차단)
  if (to.path.replace(/\/+$/, '') === '/logout') {
    console.log('🚫 [ROUTER] /logout 경로 접근 차단! 홈으로 우회');
    console.log('🚫 [ROUTER] from:', from.path, 'to:', to.path);
    return next({ path: '/', replace: true });
  }

  // 2) URL에 /logout이 포함된 모든 경로 차단
  if (to.fullPath.includes('/logout')) {
    console.log('🚫 [ROUTER] URL에 /logout 포함 감지! 홈으로 우회');
    console.log('🚫 [ROUTER] 문제가 된 URL:', to.fullPath);
    return next({ path: '/', replace: true });
  }

  // 3) 스토어 초기화(토큰만 있고 아직 미인증인 경우)
  const userStore = useUserStore();
  if (!userStore.isAuthenticated && localStorage.getItem('idToken')) {
    try { await userStore.initializeStore(); } catch { /* noop */ }
  }

  // 4) 인증 필요한 라우트면 홈으로
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next({ name: 'HomePage' });
  }

  next();
});
export default router;
