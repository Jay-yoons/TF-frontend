<template>
  <div class="seat-counter">
    <label class="seat-label">예약 좌석 수</label>
    <div class="counter-container">
      <button 
        @click="decrease" 
        :disabled="modelValue <= 1"
        class="counter-btn decrease"
      >
        −
      </button>
      
      <div class="counter-display">
        <span class="seat-number">{{ modelValue }}</span>
        <span class="seat-unit">석</span>
      </div>
      
      <button 
        @click="increase" 
        :disabled="modelValue >= maxSeats"
        class="counter-btn increase"
      >
        +
      </button>
    </div>
    
    <div class="seat-info">
      <div class="available-seats">
        <i class="seat-icon">🪑</i>
        <span>최대 {{ maxSeats }}석까지 예약 가능</span>
      </div>
      <div v-if="modelValue > maxSeats" class="error-message">
        <i class="error-icon">⚠️</i>
        <span>예약 가능한 좌석 수를 초과했습니다</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SeatCounter',
  props: {
    modelValue: {
      type: Number,
      default: 1
    },
    maxSeats: {
      type: Number,
      default: 10
    },
    minSeats: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const increase = () => {
      if (props.modelValue < props.maxSeats) {
        emit('update:modelValue', props.modelValue + 1);
      }
    };

    const decrease = () => {
      if (props.modelValue > props.minSeats) {
        emit('update:modelValue', props.modelValue - 1);
      }
    };

    return {
      increase,
      decrease
    };
  }
};
</script>

<style scoped>
.seat-counter {
  width: 100%;
}

.seat-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #777;
  margin-bottom: 12px;
}

.counter-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 16px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.counter-container:hover {
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.counter-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #ff5722;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
}

.counter-btn:hover:not(:disabled) {
  background: #e64a19;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
}

.counter-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.counter-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.counter-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  padding: 8px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.seat-number {
  font-size: 32px;
  font-weight: bold;
  color: #ff5722;
  line-height: 1;
}

.seat-unit {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.seat-info {
  margin-top: 12px;
  text-align: center;
}

.available-seats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.seat-icon {
  font-size: 16px;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #f44336;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

.error-icon {
  font-size: 14px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .counter-container {
    gap: 12px;
    padding: 12px;
  }
  
  .counter-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .counter-display {
    min-width: 60px;
    padding: 6px 12px;
  }
  
  .seat-number {
    font-size: 24px;
  }
  
  .seat-unit {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .counter-container {
    gap: 8px;
    padding: 8px;
  }
  
  .counter-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .counter-display {
    min-width: 50px;
    padding: 4px 8px;
  }
  
  .seat-number {
    font-size: 20px;
  }
}
</style>
