<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <Transition name="toast">
    <div v-if="show" :class="['toast', type]" @click="hide">
      <div class="toast-content">
        <div class="toast-icon">
          <span v-if="type === 'success'">✓</span>
          <span v-else-if="type === 'error'">✕</span>
          <span v-else-if="type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-message">{{ message }}</div>
        <button class="toast-close" @click="hide">×</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// eslint-disable-next-line vue/multi-word-component-names

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
});

const emit = defineEmits(['hide']);

const hide = () => {
  emit('hide');
};


</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  color: white;
  position: relative;
}

.toast-icon {
  font-size: 18px;
  margin-right: 12px;
  font-weight: bold;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.toast-close:hover {
  opacity: 1;
}

/* 토스트 타입별 스타일 */
.toast.success {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-left: 4px solid #2E7D32;
}

.toast.error {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border-left: 4px solid #C62828;
}

.toast.warning {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  border-left: 4px solid #E65100;
}

.toast.info {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-left: 4px solid #1565C0;
}

/* 토스트 애니메이션 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
  
  .toast-content {
    padding: 14px 16px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}
</style>
