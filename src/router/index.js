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
import LogoutConfirm form '../views/LogoutConfirm.vue';

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
  },
  {
    path: '/logout',
    name: 'Logout',
    component: LogoutConfirm
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // NOTE: 라우트에 'Login'이 없으므로 존재하는 'HomePage'로 보냅니다.
    next({ name: 'HomePage' });
  } else {
    next();
  }
});

export default router;
