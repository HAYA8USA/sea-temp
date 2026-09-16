const fs = require('fs');

const tideNames = ["13 물", "14 물", "조금", "1 물", "2 물", "3 물", "4 물", "5 물", "6 물", "7 물", "8 물", "9 물", "10 물", "11 물", "12 물"];
const moonIcons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

function generateTideJson() {
  console.log("해운대 30일 물때 데이터 생성 시작...");
  const resultList = [];
  const baseDate = new Date();

  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + i);

    const yyyy = targetDate.getFullYear();
    const mm = targetDate.getMonth() + 1;
    const dd = targetDate.getDate();

    // 월령 및 물때 계산
    const refNewMoon = new Date(2026, 8, 11);
    const diffDays = (targetDate - refNewMoon) / (1000 * 60 * 60 * 24);
    const lunarAge = Math.floor((diffDays % 29.53 + 29.53) % 29.53) + 1;
    
    const tideIdx = (lunarAge + 6) % 15;
    const tideName = tideNames[tideIdx] || "1 물";

    const cycleRad = (lunarAge / 29.53) * Math.PI * 4;
    const flowPercent = Math.max(5, Math.min(100, Math.floor(Math.abs(Math.sin(cycleRad)) * 95 + 5)));
    const flowTxt = flowPercent >= 99 ? "MAX" : (flowPercent <= 5 ? "최소" : `${flowPercent}%`);
    const moonIcon = moonIcons[Math.floor((lunarAge / 29.53) * 8) % 8];

    // 날짜별 조석 시각 시뮬레이션 (매일 약 49분씩 이동)
    const shiftMin = (i * 49) % (12 * 60);
    
    const h1Min = (10 * 60 + 54 + shiftMin) % (24 * 60);
    const h2Min = (h1Min + 12 * 60 + 25) % (24 * 60);
    const l1Min = (4 * 60 + 19 + shiftMin) % (24 * 60);
    const l2Min = (l1Min + 12 * 60 + 25) % (24 * 60);

    const fmt = (min) => {
      const h = String(Math.floor(min / 60)).padStart(2, '0');
      const m = String(min % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    const highStr = `${fmt(h1Min)} (${90 + (i % 10)}) <span class='txt-red'>▲+${65 + (i % 15)}</span><br>${fmt(h2Min)} (${85 + (i % 8)}) <span class='txt-red'>▲+${55 + (i % 12)}</span>`;
    const lowStr = `${fmt(l1Min)} (${15 + (i % 10)}) <span class='txt-blue'>▼-${68 + (i % 10)}</span><br>${fmt(l2Min)} (${20 + (i % 8)}) <span class='txt-blue'>▼-${60 + (i % 10)}</span>`;

    resultList.push({
      year: yyyy,
      month: mm,
      day: dd,
      lunarSub: `${mm}.${lunarAge}`,
      moonIcon: moonIcon,
      tideName: tideName,
      flowPercent: flowPercent,
      flowTxt: flowTxt,
      weatherIcon: "☀️",
      highTideStr: highStr,
      lowTideStr: lowStr,
      sunStr: "06:06/18:29"
    });
  }

  fs.writeFileSync('tide.json', JSON.stringify(resultList, null, 2), 'utf8');
  console.log("tide.json 생성 완료!");
}

generateTideJson();
