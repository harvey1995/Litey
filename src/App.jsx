import React, { useState, useEffect, useRef } from 'react';
import { Utensils, RefreshCw, Flame, Calendar, Clock, Trophy, CheckCircle2, X, Download, Upload, ZoomIn, ZoomOut, Type, Search, Pin } from 'lucide-react';

// --- 数据配置区 (默认根据140斤左右体型调整，增加蔬菜和蛋白质分量) ---
const STAPLES = [
  { name: '全麦意面', emoji: '🍝', portion: '1小把(干面约70g)' },
  { name: '全麦面包', emoji: '🍞', portion: '2-3片' },
  { name: '杂粮粥', emoji: '🥣', portion: '1大碗' },
  { name: '水煮南瓜', emoji: '🎃', portion: '半个到1个(约250g)' },
  { name: '水煮土豆', emoji: '🥔', portion: '1-2个中等大小' },
  { name: '水煮玉米', emoji: '🌽', portion: '1大根' },
  { name: '燕麦片', emoji: '🥣', portion: '50g(泡水/奶)' },
  { name: '糙米饭', emoji: '🍚', portion: '1小碗(约150g)' },
  { name: '紫薯', emoji: '🍠', portion: '1个大(约200g)' },
  { name: '红薯', emoji: '🍠', portion: '1大块(约200g)' },
  { name: '荞麦面', emoji: '🍜', portion: '1大碗(干面约60-80g)' },
  { name: '藜麦饭', emoji: '🍚', portion: '1小碗(约150g)' }
];

const VEGGIES = [
  { name: '凉拌木耳', emoji: '🥗', portion: '1大盘(约250g)' },
  { name: '凉拌黄瓜', emoji: '🥒', portion: '1-2大根' },
  { name: '水煮小白菜', emoji: '🥬', portion: '1大盘(约300g)' },
  { name: '水煮胡萝卜', emoji: '🥕', portion: '2根' },
  { name: '水煮菠菜', emoji: '🥬', portion: '1大盘(约300g，别喝焯的水)' },
  { name: '水煮西兰花', emoji: '🥦', portion: '1大盘(约300g)' },
  { name: '清炒油麦菜', emoji: '🥬', portion: '1大盘(约300g)' },
  { name: '清炒西葫芦', emoji: '🥒', portion: '1大盘(约300g)' },
  { name: '烤/煎芦笋', emoji: '🥗', portion: '1大把' },
  { name: '生菜沙拉', emoji: '🥗', portion: '1大盆(少沙拉酱)' },
  { name: '金针菇拌黄瓜', emoji: '🥗', portion: '1盘(约250g)' },
  { name: '鲜切番茄', emoji: '🍅', portion: '2个大番茄' }
];

const PROTEINS = [
  { name: '凉拌嫩豆腐', emoji: '🧊', portion: '1大盒(约300g)' },
  { name: '卤护心肉', emoji: '🍖', portion: '1小盘(约150g)' },
  { name: '卤牛腱子', emoji: '🥩', portion: '7-8片(约150g)' },
  { name: '无糖希腊酸奶', emoji: '🥛', portion: '1大杯(约200g)配坚果' },
  { name: '水煮蛋', emoji: '🥚', portion: '2-3个' },
  { name: '清炒虾仁', emoji: '🍤', portion: '1盘(约150g)' },
  { name: '清蒸鲈鱼', emoji: '🐟', portion: '1条(约250g)' },
  { name: '炖牛腩肉', emoji: '🍲', portion: '1小碗(约150g，少喝汤)' },
  { name: '煎牛排', emoji: '🥩', portion: '1整块(约150-200g)' },
  { name: '白灼虾', emoji: '🍤', portion: '12-15只' },
  { name: '香煎三文鱼', emoji: '🍣', portion: '1块(约150g)' },
  { name: '香煎鸡胸肉', emoji: '🍗', portion: '1大块(约150-200g)' }
];

// 隐藏福利：大于等于6天解锁的欺骗餐 (避开酒类)
const CHEAT_MEALS = [
  { name: '东北小烧烤', emoji: '🍢', portion: '肉串15串+菜卷(避开大肥肉)' },
  { name: '四川麻辣烫', emoji: '🥘', portion: '1大碗(多瘦肉蔬菜，清水涮过更佳)' },
  { name: '汉堡', emoji: '🍔', portion: '双层牛肉饼生菜包+零度可乐' },
  { name: '海鲜自助', emoji: '🦀', portion: '敞开吃海鲜(少吃高糖点心和主食)' },
  { name: '清汤牛肉火锅', emoji: '🍲', portion: '适量鲜牛肉+大量蔬菜+不喝汤' },
  { name: '炸鸡', emoji: '🍗', portion: '2块吮指原味鸡(去皮)+零度可乐' },
  { name: '烤冷面', emoji: '🌮', portion: '1大份(少酱少糖)' },
  { name: '黄焖鸡', emoji: '🥘', portion: '1份(去皮鸡肉，多吃菜少拌汤)' }
];

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐'];

// 这里去掉了 export default，解决重复导出报错
function App() {
  const [history, setHistory] = useState([]);
  const [generatedMeal, setGeneratedMeal] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [fontZoom, setFontZoom] = useState(1);
  const [lockedItems, setLockedItems] = useState({ staple: false, veg: false, protein: false });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('fatloss_meal_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("加载记录失败", e);
      }
    }

    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fatloss_meal_history', JSON.stringify(history));
  }, [history]);

  const distinctDays = new Set(history.map(item => item.date)).size;
  const cheatRecords = history.filter(r => r.meal.isCheat);
  let isCheatUnlocked = false;

  if (cheatRecords.length === 0) {
    isCheatUnlocked = distinctDays >= 6;
  } else {
    const latestCheatDate = cheatRecords.sort((a, b) => b.timestamp - a.timestamp)[0].date;
    const distinctDaysAfterCheat = new Set(
      history.filter(r => r.date > latestCheatDate).map(r => r.date)
    ).size;
    isCheatUnlocked = distinctDaysAfterCheat >= 14;
  }

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowMealSelector(false);

    let count = 0;
    const maxCount = 15;
    
    const interval = setInterval(() => {
      setGeneratedMeal(prev => {
        const current = prev || {};
        // 锁定后该卡片数据不再更新，也就不会播放闪烁更换的动画
        return {
          staple: lockedItems.staple && current.staple ? current.staple : STAPLES[Math.floor(Math.random() * STAPLES.length)],
          veg: lockedItems.veg && current.veg ? current.veg : VEGGIES[Math.floor(Math.random() * VEGGIES.length)],
          protein: lockedItems.protein && current.protein ? current.protein : PROTEINS[Math.floor(Math.random() * PROTEINS.length)],
          isCheat: false
        };
      });
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        
        const hasLocks = lockedItems.staple || lockedItems.veg || lockedItems.protein;
        const rollCheat = !hasLocks && isCheatUnlocked && Math.random() < 0.15;
        
        if (rollCheat) {
          setGeneratedMeal({
            isCheat: true,
            cheatData: CHEAT_MEALS[Math.floor(Math.random() * CHEAT_MEALS.length)]
          });
        }
        setIsSpinning(false);
      }
    }, 80);
  };

  const confirmMeal = (mealType) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      date: dateStr,
      timeOfDay: mealType,
      meal: generatedMeal
    };

    setHistory([newRecord, ...history]);
    setGeneratedMeal(null);
    setShowMealSelector(false);
    setLockedItems({ staple: false, veg: false, protein: false });
  };

  const clearHistory = () => {
    if(window.confirm('确定要清空所有记录吗？天数也会重置哦！')) {
      setHistory([]);
      setGeneratedMeal(null);
      setLockedItems({ staple: false, veg: false, protein: false });
    }
  }

  const exportExcel = () => {
    if (!window.XLSX) return alert('Excel组件未加载成功，请刷新页面重试！');
    if (history.length === 0) return alert('暂无记录可导出！');

    const exportData = history.map(item => ({
      '日期': item.date,
      '时段': item.timeOfDay,
      '是否奖励': item.meal.isCheat ? '是' : '否',
      '主食': item.meal.isCheat ? item.meal.cheatData.name : item.meal.staple.name,
      '蔬菜': item.meal.isCheat ? '-' : item.meal.veg.name,
      '蛋白质': item.meal.isCheat ? '-' : item.meal.protein.name,
      '记录时间': new Date(item.timestamp).toLocaleString('zh-CN', { hour12: false })
    }));

    const ws = window.XLSX.utils.json_to_sheet(exportData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "记录");
    window.XLSX.writeFile(wb, "今天吃什么_打卡记录.xlsx");
  };

  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.XLSX) return alert('Excel组件未加载成功，请刷新页面重试！');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = window.XLSX.utils.sheet_to_json(ws);

        const newHistory = data.map(row => {
          let mealData = {};
          const isCheat = row['是否奖励'] === '是';

          if (isCheat) {
            const cheat = CHEAT_MEALS.find(c => c.name === row['主食']) || { name: row['主食'], emoji: '🍽️', portion: '未知用量' };
            mealData = { isCheat: true, cheatData: cheat };
          } else {
            const staple = STAPLES.find(s => s.name === row['主食']) || { name: row['主食'], emoji: '🍚', portion: '未知' };
            const veg = VEGGIES.find(v => v.name === row['蔬菜']) || { name: row['蔬菜'], emoji: '🥬', portion: '未知' };
            const protein = PROTEINS.find(p => p.name === row['蛋白质']) || { name: row['蛋白质'], emoji: '🥩', portion: '未知' };
            mealData = { isCheat: false, staple, veg, protein };
          }

          return {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            timestamp: new Date(row['记录时间']).getTime() || Date.now(),
            date: row['日期'],
            timeOfDay: row['时段'],
            meal: mealData
          };
        });

        newHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(newHistory);
        alert('导入成功！');
      } catch (err) {
        console.error(err);
        alert('解析失败，请确保导入的是正确的打卡记录文件。');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const groupedHistory = history.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="min-h-screen bg-green-50 font-sans text-gray-800 p-4 md:p-8 flex flex-col items-center">
      <header className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Flame className="text-green-600 w-8 h-8 md:w-10 md:h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            今天吃什么？
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-sm md:text-base font-medium text-green-700 bg-green-100 px-4 py-1.5 rounded-full">
          <Trophy className="w-4 h-4" />
          <span>已打卡: {distinctDays} 天</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-green-100 flex flex-col h-[60vh] min-h-[500px] lg:h-[calc(100vh-12rem)]">
          <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 relative overflow-y-auto transition-all">
            {!generatedMeal ? (
              <div className="text-center text-gray-400">
                <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">点击下方按钮，生成一份今天的科学餐单</p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-4">
                {generatedMeal.isCheat ? (
                  <div className="bg-gradient-to-br from-orange-100 to-red-50 border-2 border-orange-300 rounded-2xl p-6 text-center transform transition-all scale-100 shadow-md">
                    <div className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                      🎉 隐藏触发：一顿丰盛的奖励餐
                    </div>
                    <div className="text-6xl mb-4">{generatedMeal.cheatData.emoji}</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{generatedMeal.cheatData.name}</h3>
                    <p className="text-sm text-gray-600 bg-white/60 inline-block px-3 py-1 rounded-lg">
                      建议用量: {generatedMeal.cheatData.portion}
                    </p>
                  </div>
                ) : (
                  // 外层加了 isSpinning 时的统一个模糊过渡效果
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isSpinning ? 'opacity-50 blur-[2px]' : 'opacity-100 blur-0'} transition-all duration-75`}>
                    
                    {/* 主食 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative">
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md mb-2 w-full">主食 (碳水)</span>
                      <span className="text-4xl mb-2">{generatedMeal.staple.emoji}</span>
                      <span className="font-bold text-gray-700">{generatedMeal.staple.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{generatedMeal.staple.portion}</span>
                      
                      {/* 上下布局的分隔 */}
                      <div className="flex flex-col gap-2 mt-4 w-full border-t border-amber-200/50 pt-3">
                        <a 
                          href={`https://baike.sogou.com/v249658.htm?fromTitle=${encodeURIComponent(generatedMeal.staple.name)}&from=searchbox&noresult=0`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full flex items-center justify-center text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors py-1"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" /> 查看科普
                        </a>
                        <div className="h-px w-full bg-amber-200/50"></div>
                        <button 
                          disabled={isSpinning}
                          onClick={() => setLockedItems(p => ({ ...p, staple: !p.staple }))}
                          className={`w-full flex items-center justify-center text-xs font-medium transition-colors py-1 ${lockedItems.staple ? 'text-amber-700' : 'text-amber-600 hover:text-amber-800'}`}
                        >
                          <Pin className={`w-3.5 h-3.5 mr-1 ${lockedItems.staple ? 'fill-current' : ''}`} /> 
                          {lockedItems.staple ? '已锁定' : '锁定主食'}
                        </button>
                      </div>
                    </div>

                    {/* 蔬菜 */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative">
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md mb-2 w-full">蔬菜 (纤维)</span>
                      <span className="text-4xl mb-2">{generatedMeal.veg.emoji}</span>
                      <span className="font-bold text-gray-700">{generatedMeal.veg.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{generatedMeal.veg.portion}</span>
                      
                      {/* 上下布局的分隔 */}
                      <div className="flex flex-col gap-2 mt-4 w-full border-t border-green-200/50 pt-3">
                        <a 
                          href={`https://baike.sogou.com/v249658.htm?fromTitle=${encodeURIComponent(generatedMeal.veg.name)}&from=searchbox&noresult=0`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full flex items-center justify-center text-xs font-medium text-green-600 hover:text-green-800 transition-colors py-1"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" /> 查看科普
                        </a>
                        <div className="h-px w-full bg-green-200/50"></div>
                        <button 
                          disabled={isSpinning}
                          onClick={() => setLockedItems(p => ({ ...p, veg: !p.veg }))}
                          className={`w-full flex items-center justify-center text-xs font-medium transition-colors py-1 ${lockedItems.veg ? 'text-green-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          <Pin className={`w-3.5 h-3.5 mr-1 ${lockedItems.veg ? 'fill-current' : ''}`} /> 
                          {lockedItems.veg ? '已锁定' : '锁定蔬菜'}
                        </button>
                      </div>
                    </div>

                    {/* 蛋白质 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md mb-2 w-full">蛋白质</span>
                      <span className="text-4xl mb-2">{generatedMeal.protein.emoji}</span>
                      <span className="font-bold text-gray-700">{generatedMeal.protein.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{generatedMeal.protein.portion}</span>
                      
                      {/* 上下布局的分隔 */}
                      <div className="flex flex-col gap-2 mt-4 w-full border-t border-blue-200/50 pt-3">
                        <a 
                          href={`https://baike.sogou.com/v249658.htm?fromTitle=${encodeURIComponent(generatedMeal.protein.name)}&from=searchbox&noresult=0`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full flex items-center justify-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors py-1"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" /> 查看科普
                        </a>
                        <div className="h-px w-full bg-blue-200/50"></div>
                        <button 
                          disabled={isSpinning}
                          onClick={() => setLockedItems(p => ({ ...p, protein: !p.protein }))}
                          className={`w-full flex items-center justify-center text-xs font-medium transition-colors py-1 ${lockedItems.protein ? 'text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          <Pin className={`w-3.5 h-3.5 mr-1 ${lockedItems.protein ? 'fill-current' : ''}`} /> 
                          {lockedItems.protein ? '已锁定' : '锁定蛋白'}
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 w-full flex flex-col md:flex-row gap-4 justify-center h-[56px]">
            {!generatedMeal ? (
              <button
                onClick={spin}
                disabled={isSpinning}
                className="w-full md:w-2/3 h-full rounded-full font-bold text-xl text-white shadow-lg bg-green-500 hover:bg-green-600 transform transition-all active:scale-95 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 disabled:text-gray-200 flex items-center justify-center"
              >
                开始生成今天吃什么
              </button>
            ) : (
              <>
                <button
                  onClick={spin}
                  disabled={isSpinning}
                  className="flex-1 h-full rounded-full font-bold text-lg text-green-600 bg-green-100 border border-green-200 hover:bg-green-200 transform transition-all active:scale-95 flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${isSpinning ? 'animate-spin' : ''}`} /> 
                  再随一个
                </button>
                
                <div className="flex-1 relative h-full">
                  {!showMealSelector ? (
                    <button
                      onClick={() => setShowMealSelector(true)}
                      disabled={isSpinning}
                      className="w-full h-full rounded-full font-bold text-lg text-white bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg transform transition-all active:scale-95 flex items-center justify-center disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 disabled:text-gray-200"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      就吃这个
                    </button>
                  ) : (
                    <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in slide-in-from-bottom-2 z-20">
                      <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">这是哪一顿？</span>
                        <button onClick={() => setShowMealSelector(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {MEAL_TYPES.map(type => (
                          <button 
                            key={type}
                            onClick={() => confirmMeal(type)}
                            className="bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-600 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-6 flex flex-col h-[60vh] min-h-[500px] lg:h-[calc(100vh-12rem)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 flex-wrap gap-y-2">
            <h2 className="text-xl font-bold text-gray-700 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              记录
            </h2>
            <div className="flex items-center space-x-2">
              
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <span className="px-2 text-xs font-medium text-gray-400 bg-gray-100 border-r border-gray-200 hidden sm:block">
                  字号
                </span>
                <button 
                  onClick={() => setFontZoom(prev => Math.max(prev - 0.1, 0.7))}
                  className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors px-2.5 py-1.5 hover:bg-gray-100"
                  title="缩小字体"
                >
                  <Type className="w-3 h-3 mr-0.5" />-
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button 
                  onClick={() => setFontZoom(prev => Math.min(prev + 0.1, 1.5))}
                  className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors px-2.5 py-1.5 hover:bg-gray-100"
                  title="放大字体"
                >
                  <Type className="w-3.5 h-3.5 mr-0.5" />+
                </button>
              </div>
              
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
              >
                <Upload className="w-3 h-3 mr-1" /> 导入
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={importExcel} 
                className="hidden" 
                accept=".xlsx, .xls" 
              />
              <button 
                onClick={exportExcel}
                className="flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100"
              >
                <Download className="w-3 h-3 mr-1" /> 导出
              </button>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <Clock className="w-12 h-12 opacity-30" />
                <p>还没有记录哦，今天吃点什么好呢？</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map(date => (
                  <div key={date} className="relative">
                    <div className="sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 flex items-center mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                      <span className="font-bold text-gray-600" style={{ fontSize: `${0.875 * fontZoom}rem` }}>{date}</span>
                    </div>
                    
                    <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-1">
                      {groupedHistory[date].map(record => (
                        <div key={record.id} className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white bg-green-500 px-2 py-0.5 rounded" style={{ fontSize: `${0.75 * fontZoom}rem` }}>
                              {record.timeOfDay}
                            </span>
                            <span className="text-gray-400" style={{ fontSize: `${0.75 * fontZoom}rem` }}>
                              {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {record.meal.isCheat ? (
                            <div className="flex items-center text-gray-700" style={{ fontSize: `${0.875 * fontZoom}rem` }}>
                              <span className="mr-2" style={{ fontSize: `${1.125 * fontZoom}rem` }}>{record.meal.cheatData.emoji}</span>
                              <span className="font-bold text-orange-600">[奖励餐] {record.meal.cheatData.name}</span>
                            </div>
                          ) : (
                            <div className="text-gray-700 leading-relaxed" style={{ fontSize: `${0.875 * fontZoom}rem` }}>
                              <div className="flex items-center mb-1">
                                <span className="mr-1" style={{ fontSize: `${1 * fontZoom}rem` }}>{record.meal.staple.emoji}</span> <span className="font-bold">{record.meal.staple.name}</span>
                              </div>
                              <div className="flex items-center mb-1">
                                <span className="mr-1" style={{ fontSize: `${1 * fontZoom}rem` }}>{record.meal.veg.emoji}</span> <span className="font-bold">{record.meal.veg.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1" style={{ fontSize: `${1 * fontZoom}rem` }}>{record.meal.protein.emoji}</span> <span className="font-bold">{record.meal.protein.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
};

export default App;