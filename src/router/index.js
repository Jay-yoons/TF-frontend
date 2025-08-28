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
  // router.beforeEach는 'app.use(pinia)'가 실행되기 전에 호출될 수 있으므로,
  // 여기서 'useUserStore()'를 직접 호출하면 오류가 발생합니다.
  // 이 문제를 해결하기 위해 'router.isReady()'를 사용합니다.
  if (router.isReady()) {
    const userStore = useUserStore();

    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
      // AWS Cognito 로그인 URL을 가져와서 리다이렉트
      try {
        const response = await fetch('/api/users/login/url');
        if (response.ok) {
          const { loginUrl } = await response.json();
          window.location.href = loginUrl;
          return;
        }
      } catch (error) {
        console.error('로그인 URL 가져오기 실패:', error);
      }
      
      // 로그인 URL 가져오기 실패 시 홈페이지로 리다이렉트
      next({ name: 'HomePage' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
