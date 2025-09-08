<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop :class="modalType">
      <div class="modal-header">
        <div class="modal-icon">
          <i v-if="type === 'success'" class="success-icon">✅</i>
          <i v-else-if="type === 'error'" class="error-icon">❌</i>
          <i v-else-if="type === 'warning'" class="warning-icon">⚠️</i>
          <i v-else-if="type === 'info'" class="info-icon">ℹ️</i>
          <i v-else class="default-icon">📢</i>
        </div>
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button class="modal-button" @click="closeModal" :class="buttonType">
          <span class="button-text">{{ buttonText }}</span>
          <i class="button-icon">→</i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '알림'
    },
    message: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: '확인'
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info', 'default'].includes(value)
    }
  },
  emits: ['close'],
  computed: {
    modalType() {
      return `modal-${this.type}`;
    },
    buttonType() {
      return `button-${this.type}`;
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.4s ease;
}

.modal-content {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 90%;
  animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff5722, #ff7043, #ff9800);
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 24px 24px 16px 24px;
  position: relative;
}

.modal-icon {
  margin-right: 16px;
  font-size: 32px;
  animation: bounce 0.6s ease;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.modal-close {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.modal-body {
  padding: 0 24px 20px 24px;
}

.modal-message {
  margin: 0;
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  text-align: center;
  font-weight: 500;
}

.modal-footer {
  padding: 0 24px 24px 24px;
  display: flex;
  justify-content: center;
}

.modal-button {
  background: linear-gradient(135deg, #ff5722, #ff7043);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.modal-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.modal-button:hover::before {
  left: 100%;
}

.modal-button:hover {
  background: linear-gradient(135deg, #e64a19, #ff5722);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
}

.modal-button:active {
  transform: translateY(0);
}

.button-text {
  position: relative;
  z-index: 1;
}

.button-icon {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.modal-button:hover .button-icon {
  transform: translateX(4px);
}

/* 타입별 스타일 */
.modal-success {
  border-left: 4px solid #4caf50;
}

.modal-success::before {
  background: linear-gradient(90deg, #4caf50, #66bb6a, #81c784);
}

.modal-error {
  border-left: 4px solid #f44336;
}

.modal-error::before {
  background: linear-gradient(90deg, #f44336, #ef5350, #e57373);
}

.modal-warning {
  border-left: 4px solid #ff9800;
}

.modal-warning::before {
  background: linear-gradient(90deg, #ff9800, #ffb74d, #ffcc02);
}

.modal-info {
  border-left: 4px solid #2196f3;
}

.modal-info::before {
  background: linear-gradient(90deg, #2196f3, #42a5f5, #64b5f6);
}

/* 버튼 타입별 스타일 */
.button-success {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.button-success:hover {
  background: linear-gradient(135deg, #45a049, #4caf50);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.button-error {
  background: linear-gradient(135deg, #f44336, #ef5350);
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3);
}

.button-error:hover {
  background: linear-gradient(135deg, #d32f2f, #f44336);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.button-warning {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
}

.button-warning:hover {
  background: linear-gradient(135deg, #f57c00, #ff9800);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.button-info {
  background: linear-gradient(135deg, #2196f3, #42a5f5);
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3);
}

.button-info:hover {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 90%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 20px 20px 16px 20px;
  }
  
  .modal-body {
    padding: 0 20px 16px 20px;
  }
  
  .modal-footer {
    padding: 0 20px 20px 20px;
  }
  
  .modal-icon {
    font-size: 28px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-message {
    font-size: 15px;
  }
}
</style>