<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="p-8 text-center text-blue-500">
            로그인 처리 중... 잠시만 기다려 주세요.
        </div>
    </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore'; // userStore import

export default {
    name: 'CallbackPage',
    setup() {
        const route = useRoute();
        const router = useRouter();
        const userStore = useUserStore(); // userStore 사용

        const handleCallback = async () => {
            const code = route.query.code;
            const state = route.query.state;
            const error = route.query.error;
            const errorDescription = route.query.error_description;

            // URL 파라미터 디버깅
            console.log('Callback URL 파라미터:', {
                code: code ? '존재함' : '없음',
                state: state ? '존재함' : '없음',
                error: error || '없음',
                errorDescription: errorDescription || '없음',
                fullQuery: route.query
            });

            // AWS Cognito 오류 처리
            if (error) {
                console.error('AWS Cognito 오류:', error, errorDescription);
                // 모달로 오류 메시지 표시 (App.vue의 모달 사용)
                window.showLoginErrorModal = true;
                window.loginErrorMessage = `로그인 실패: ${errorDescription || error}`;
                router.push('/');
                return;
            }

            // 인증 코드와 상태 값 확인
            if (!code || !state) {
                console.error('인증 코드 또는 상태 값이 없습니다.');
                console.log('현재 URL:', window.location.href);
                console.log('URL 파라미터:', route.query);
                
                // 더 명확한 오류 메시지
                const message = '로그인 플로우가 올바르지 않습니다. 메인 페이지에서 로그인 버튼을 클릭해주세요.';
                // 모달로 오류 메시지 표시
                window.showLoginErrorModal = true;
                window.loginErrorMessage = message;
                router.push('/');
                return;
            }

            try {
                // 로그아웃 플로우 감지 및 처리
                const isLogoutFlow = sessionStorage.getItem('logoutInProgress');
                if (isLogoutFlow === 'true') {
                    console.log('로그아웃 플로우 감지. 로그인 처리 중단.');
                    sessionStorage.removeItem('logoutInProgress');
                    router.push('/');
                    return;
                }
                
                // 로그인 전 기존 데이터 완전 정리
                userStore.clearAllData();
                
                // 브라우저 캐시 강제 삭제
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            caches.delete(name);
                        });
                    });
                }
                
                // 모든 쿠키 강제 삭제 (더 강력한 방법)
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                // 추가적인 쿠키 삭제 (도메인별)
                document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Cognito 관련 쿠키 삭제 (더 포괄적으로)
                document.cookie = "CognitoIdentityServiceProvider=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "AWSELB=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "AWSELBCORS=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // 모든 도메인에서 쿠키 삭제
                document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=talkingpotato.shop;";
                document.cookie = "idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=talkingpotato.shop;";
                document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=talkingpotato.shop;";
                
                // 세션 스토리지 완전 삭제
                sessionStorage.clear();
                
                // 로컬 스토리지도 완전 삭제
                localStorage.clear();
                
                // userStore의 handleCognitoCallback 액션 호출
                await userStore.handleCognitoCallback(code, state);

                if (userStore.isAuthenticated) {
                    // 모달로 성공 메시지 표시
                    window.showLoginSuccessModal = true;
                    router.push('/');
                } else {
                    throw new Error('로그인에 실패했습니다.');
                }
            } catch (error) {
                console.error('로그인 콜백 처리 실패:', error);
                // 모달로 오류 메시지 표시
                window.showLoginErrorModal = true;
                window.loginErrorMessage = `로그인 실패: ${error.message}`;
                router.push('/');
            }
        };

        onMounted(() => {
            handleCallback();
        });

        return {};
    },
};
</script>