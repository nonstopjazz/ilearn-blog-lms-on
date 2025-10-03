const { startOfYear, endOfYear, startOfWeek, addWeeks, differenceInWeeks, getWeek, format } = require('date-fns');
const { zhTW } = require('date-fns/locale');

// 測試 2025 年的週數計算
const selectedYear = 2025;
const yearStart = startOfYear(new Date(selectedYear, 0, 1));
const yearStartWeek = startOfWeek(yearStart, { locale: zhTW });

console.log('=== 2025年週數計算測試 ===');
console.log('年初日期:', format(yearStart, 'yyyy-MM-dd', { locale: zhTW }));
console.log('年初所在週的週一:', format(yearStartWeek, 'yyyy-MM-dd', { locale: zhTW }));

// 生成52週並檢查每個月的第一週
console.log('\n=== 各月份第一週的週數 ===');
const weeks = [];
for (let i = 0; i < 52; i++) {
  const weekStart = addWeeks(yearStartWeek, i);
  weeks.push(weekStart);
}

// 檢查每個月的第一週
for (let month = 0; month < 12; month++) {
  const monthStart = new Date(selectedYear, month, 1);
  const monthWeekStart = startOfWeek(monthStart, { locale: zhTW });

  // 使用修復後的計算方式
  const weekDiff = Math.floor(differenceInWeeks(monthWeekStart, yearStartWeek)) + 1;
  const weekNum = Math.max(1, Math.min(52, weekDiff));

  // 使用舊的計算方式比較
  const oldWeekNum = getWeek(monthStart, { locale: zhTW });

  console.log(`${month + 1}月 - 修復後週數: ${weekNum}, 舊計算週數: ${oldWeekNum}, 月初日期: ${format(monthStart, 'yyyy-MM-dd')}`);
}

// 檢查第36週對應的月份
console.log('\n=== 第36週是幾月 ===');
const week36 = addWeeks(yearStartWeek, 35); // 第36週 (0-based)
console.log('第36週開始日期:', format(week36, 'yyyy-MM-dd', { locale: zhTW }));
console.log('第36週所在月份:', format(week36, 'MMMM', { locale: zhTW }));

// 檢查第52週
console.log('\n=== 第52週是幾月 ===');
const week52 = addWeeks(yearStartWeek, 51); // 第52週 (0-based)
console.log('第52週開始日期:', format(week52, 'yyyy-MM-dd', { locale: zhTW }));
console.log('第52週所在月份:', format(week52, 'MMMM', { locale: zhTW }));