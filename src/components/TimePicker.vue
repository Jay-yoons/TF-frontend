<template>
  <div class="time-picker">
    <div class="time-input" @click="!disabled && toggleDropdown()" :class="{ 'focused': isOpen, 'disabled': disabled }">
      <div class="time-display">
        <i class="clock-icon">🕐</i>
        <span class="time-text">{{ displayTime || placeholder }}</span>
        <i class="arrow-icon" :class="{ 'rotated': isOpen }">▼</i>
      </div>
    </div>
    
    <div v-if="isOpen" class="time-dropdown" :class="{ 'show': isOpen }">
      <div class="time-header">
        <h3>예약 시간 선택</h3>
        <button @click="closeDropdown" class="close-btn">×</button>
      </div>
      
      <div class="time-grid">
        <div 
          v-for="time in timeOptions" 
          :key="time"
          class="time-option"
          :class="{ 'selected': time === modelValue, 'disabled': isTimeDisabled(time) }"
          @click="selectTime(time)"
        >
          <span class="time-value">{{ time }}</span>
          <span class="time-label">{{ getTimeLabel(time) }}</span>
        </div>
      </div>
      
      <div class="time-footer">
        <div class="time-info">
          <i class="info-icon">ℹ️</i>
          <span>2시간 단위로 예약 가능합니다</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
  name: 'TimePicker',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    timeOptions: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '시간을 선택하세요'
    },
    disabledTimes: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);

    const displayTime = computed(() => {
      if (!props.modelValue) return '';
      return props.modelValue;
    });

    const getTimeLabel = (time) => {
      const hour = parseInt(time.split(':')[0]);
      if (hour < 12) return '오전';
      if (hour === 12) return '정오';
      if (hour < 18) return '오후';
      return '저녁';
    };

    const isTimeDisabled = (time) => {
      return props.disabledTimes.includes(time);
    };

    const toggleDropdown = () => {
      if (props.disabled) return;
      isOpen.value = !isOpen.value;
    };

    const closeDropdown = () => {
      isOpen.value = false;
    };

    const selectTime = (time) => {
      if (isTimeDisabled(time)) return;
      emit('update:modelValue', time);
      closeDropdown();
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.time-picker')) {
        closeDropdown();
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      displayTime,
      getTimeLabel,
      isTimeDisabled,
      toggleDropdown,
      closeDropdown,
      selectTime
    };
  }
};
</script>

<style scoped>
.time-picker {
  position: relative;
  width: 100%;
}

.time-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.time-input:hover {
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.time-input.focused {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.2);
}

.time-input.disabled {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.6;
}

.time-input.disabled:hover {
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #333;
}

.clock-icon {
  font-size: 18px;
}

.time-text {
  flex: 1;
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
  color: #666;
}

.arrow-icon.rotated {
  transform: rotate(180deg);
}

.time-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid #ff5722;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  max-height: 300px;
  overflow-y: auto;
}

.time-dropdown.show {
  opacity: 1;
  transform: translateY(0);
}

.time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ff5722, #ff7043);
  color: white;
}

.time-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.time-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.time-option {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  background: #fff;
}

.time-option:hover:not(.disabled) {
  border-color: #ff5722;
  background: #fff3e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2);
}

.time-option.selected {
  border-color: #ff5722;
  background: #ff5722;
  color: white;
  transform: scale(1.05);
}

.time-option.disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.time-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.time-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.time-footer {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.info-icon {
  font-size: 14px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .time-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 70vh;
  }
  
  .time-dropdown.show {
    transform: translate(-50%, -50%);
  }
  
  .time-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
  }
  
  .time-option {
    padding: 10px 12px;
  }
  
  .time-value {
    font-size: 14px;
  }
  
  .time-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
