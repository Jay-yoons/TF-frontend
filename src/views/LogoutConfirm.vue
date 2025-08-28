<template>
  <!-- 배경은 그대로 두고, 모달만 띄움 -->
  <div class="backdrop"></div>
  <div class="modal">
    <div class="modal-header">
      <strong>로그아웃 완료</strong>
      <button class="x" aria-label="close" @click="goHome">×</button>
    </div>
    <p class="body">안전하게 로그아웃되었습니다.</p>
    <div class="actions">
      <button class="primary" @click="goHome">확인</button>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore'

export default {
  name: 'LogoutConfirm',
  mounted() {
    // 1) 로컬 인증상태/토큰 정리 (프로젝트에 맞게 조정)
    try {
      const user = useUserStore()
      user?.clear?.()              // Pinia 액션이 있으면 호출
      localStorage.removeItem('access_token')
      localStorage.removeItem('id_token')
      sessionStorage.clear()
    } catch {}

    // 2) Cognito Hosted UI 로그아웃을 '숨은 iframe'으로 호출 (화면에 안 보임)
    const domain =
      (import.meta && import.meta.env && import.meta.env.VITE_COGNITO_DOMAIN) ||
      process.env.VUE_APP_COGNITO_DOMAIN
    const clientId =
      (import.meta && import.meta.env && import.meta.env.VITE_COGNITO_CLIENT_ID) ||
      process.env.VUE_APP_COGNITO_CLIENT_ID
    const redirect =
      (import.meta && import.meta.env && import.meta.env.VITE_LOGOUT_REDIRECT) ||
      process.env.VUE_APP_LOGOUT_REDIRECT ||
      (window.location.origin + '/')

    if (domain && clientId) {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.referrerPolicy = 'no-referrer'
      iframe.src = `${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(redirect)}`
      document.body.appendChild(iframe)
      // 너무 오래 남아있지 않게 정리
      setTimeout(() => { try { document.body.removeChild(iframe) } catch {} }, 3000)
    }
  },
  methods: {
    goHome() {
      this.$router.replace({ name: 'HomePage' })
    }
  }
}
</script>

<style scoped>
.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(2px);}
.modal{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);
  width:360px;background:#fff;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,.18);
  padding:22px 24px;}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.body{margin:8px 0 18px;color:#333}
.actions{display:flex;justify-content:center}
.primary{background:#ff5a2f;color:#fff;border:0;border-radius:10px;padding:10px 20px;cursor:pointer}
.x{background:transparent;border:0;font-size:20px;cursor:pointer;line-height:1}
</style>
