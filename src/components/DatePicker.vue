<template>
  <div class="date-picker">
    <div class="date-input" @click="toggleCalendar" :class="{ 'focused': isOpen }">
      <div class="date-display">
        <i class="calendar-icon">📅</i>
        <span class="date-text">{{ displayDate }}</span>
        <i class="arrow-icon" :class="{ 'rotated': isOpen }">▼</i>
      </div>
    </div>
    
    <div v-if="isOpen" class="calendar-dropdown" :class="{ 'show': isOpen }">
      <div class="calendar-header">
        <button @click="previousMonth" class="nav-button">‹</button>
        <h3 class="month-year">{{ currentMonthYear }}</h3>
        <button @click="nextMonth" class="nav-button">›</button>
      </div>
      
      <div class="calendar-grid">
        <div class="day-header" v-for="day in dayHeaders" :key="day">{{ day }}</div>
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'disabled': day.isDisabled,
            'weekend': day.isWeekend
          }"
          @click="selectDate(day)"
        >
          {{ day.day }}
        </div>
      </div>
      
      <div class="calendar-footer">
        <button @click="selectToday" class="today-button">오늘</button>
        <button @click="closeCalendar" class="close-button">닫기</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
  name: 'DatePicker',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: ''
    },
    maxDate: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '날짜를 선택하세요'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const currentDate = ref(new Date());
    const selectedDate = ref(props.modelValue ? new Date(props.modelValue) : null);

    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];

    const displayDate = computed(() => {
      if (selectedDate.value) {
        return selectedDate.value.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        });
      }
      return props.placeholder;
    });

    const currentMonthYear = computed(() => {
      return currentDate.value.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long'
      });
    });

    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      const today = new Date();
      const minDateObj = props.minDate ? new Date(props.minDate) : null;
      const maxDateObj = props.maxDate ? new Date(props.maxDate) : null;

      // 현재 월의 첫 번째 날
      const firstDay = new Date(year, month, 1);
      
      // 달력에 표시할 시작 날짜 (이전 달의 일부 포함)
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const current = new Date(startDate);
      
      // 6주 * 7일 = 42일
      for (let i = 0; i < 42; i++) {
        const isCurrentMonth = current.getMonth() === month;
        const isToday = current.toDateString() === today.toDateString();
        const isSelected = selectedDate.value && current.toDateString() === selectedDate.value.toDateString();
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
        
        let isDisabled = false;
        if (minDateObj && current < minDateObj) isDisabled = true;
        if (maxDateObj && current > maxDateObj) isDisabled = true;
        if (current < today && !isToday) isDisabled = true;

        // 로컬 시간대 기준으로 날짜 문자열 생성
        const currentYear = current.getFullYear();
        const currentMonth = String(current.getMonth() + 1).padStart(2, '0');
        const currentDay = String(current.getDate()).padStart(2, '0');
        const dateString = `${currentYear}-${currentMonth}-${currentDay}`;

        days.push({
          date: dateString,
          day: current.getDate(),
          isCurrentMonth,
          isToday,
          isSelected,
          isDisabled,
          isWeekend
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return days;
    });

    const toggleCalendar = () => {
      isOpen.value = !isOpen.value;
    };

    const closeCalendar = () => {
      isOpen.value = false;
    };

    const selectDate = (day) => {
      if (day.isDisabled) return;
      
      selectedDate.value = new Date(day.date);
      emit('update:modelValue', day.date);
      closeCalendar();
    };

    const selectToday = () => {
      const today = new Date();
      // 로컬 시간대 기준으로 날짜 문자열 생성
      const todayYear = today.getFullYear();
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
      
      if (props.minDate && todayString < props.minDate) return;
      if (props.maxDate && todayString > props.maxDate) return;
      
      selectedDate.value = today;
      emit('update:modelValue', todayString);
      closeCalendar();
    };

    const previousMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
    };

    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker')) {
        closeCalendar();
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      if (props.modelValue) {
        selectedDate.value = new Date(props.modelValue);
        currentDate.value = new Date(props.modelValue);
      }
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      currentDate,
      selectedDate,
      dayHeaders,
      displayDate,
      currentMonthYear,
      calendarDays,
      toggleCalendar,
      closeCalendar,
      selectDate,
      selectToday,
      previousMonth,
      nextMonth
    };
  }
};
</script>

<style scoped>
.date-picker {
  position: relative;
  width: 100%;
}

.date-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-input:hover {
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.date-input.focused {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.2);
}

.date-display {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #333;
}

.calendar-icon {
  font-size: 18px;
}

.date-text {
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

.calendar-dropdown {
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
}

.calendar-dropdown.show {
  opacity: 1;
  transform: translateY(0);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #ff5722, #ff7043);
  color: white;
}

.nav-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.month-year {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #f0f0f0;
  padding: 16px;
}

.day-header {
  padding: 12px 8px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  color: #666;
  background: #f8f9fa;
}

.calendar-day {
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: white;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 1px;
}

.calendar-day:hover:not(.disabled) {
  background: #fff3e0;
  transform: scale(1.05);
}

.calendar-day.other-month {
  color: #ccc;
  background: #fafafa;
}

.calendar-day.today {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: bold;
}

.calendar-day.selected {
  background: #ff5722;
  color: white;
  font-weight: bold;
  transform: scale(1.1);
}

.calendar-day.disabled {
  color: #ccc;
  cursor: not-allowed;
  background: #f5f5f5;
}

.calendar-day.weekend:not(.disabled):not(.selected) {
  color: #ff5722;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.today-button,
.close-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.today-button {
  background: #4caf50;
  color: white;
}

.today-button:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.close-button {
  background: #666;
  color: white;
}

.close-button:hover {
  background: #555;
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .calendar-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .calendar-dropdown.show {
    transform: translate(-50%, -50%);
  }
  
  .calendar-grid {
    padding: 12px;
  }
  
  .calendar-day {
    padding: 10px 6px;
    font-size: 13px;
  }
  
  .day-header {
    padding: 10px 6px;
    font-size: 13px;
  }
}
</style>
