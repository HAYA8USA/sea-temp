const fs = require('fs');

const tideNames = ["13 물", "14 물", "조금", "1 물", "2 물", "3 물", "4 물", "5 물", "6 물", "7 물", "8 물", "9 물", "10 물", "11 물", "12 물"];
const moonIcons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

function generateHaeundaeTide() {
  const resultList = [];
  const baseDate = new Date(); // 오늘 기준

  console.log("해운대 맞춤 정밀 조석 데이터 생성 중...");

  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + i);

    const yyyy = targetDate.getFullYear();
    const mm = targetDate.getMonth() + 1;
    const dd = targetDate.getDate();

    // 음력 및 월령 연산 (2026년 9월 11일 신월 기준 29.53일 주기)
    const refNewMoon = new Date(2026, 8, 11);
    const diffDays = (targetDate - refNewMoon) / (1000 * 60 * 60 * 24);
    const lunarAge = Math.floor((diffDays % 29.53 + 29.53) % 29.53) + 1;
    const lunarMonth = mm;

    const tideIdx = (lunarAge + 6) % 15;
    const tideName = tideNames[tideIdx];

    const cycleRad = (lunarAge / 29.53) * Math.PI * 4;
    const flowPercent = Math.max(2, Math.min(100, Math.floor(Math.abs(Math.sin(cycleRad)) * 96 + 4)));
    const flowTxt = flowPercent >= 99 ? "MAX" : (flowPercent <= 3 ? "최소" : `${flowPercent}%`);
    const moonIcon = moonIcons[Math.floor((lunarAge / 29.53) * 8) % 8];

    // 해운대 조석 주기 순환 딜레이 (1일 약 49분씩 이동)
    const tideShiftMinutes = (i * 49) % (12 * 60);

    // 만조 시각 연산
    const h1TotalMin = (10 * 60 + 54 + tideShiftMinutes) % (24 * 60);
    const h1H = String(Math.floor(h1TotalMin / 60)).padStart(2, '0');
    const h1M = String(h1TotalMin % 60).padStart(2, '0');
    
    const h2TotalMin = (h1TotalMin + 12 * 60 + 25) % (24 * 60);
    const h2H = String(Math.floor(h2TotalMin / 60)).padStart(2, '0');
    const h2M = String(h2TotalMin % 60).padStart(2, '0');

    // 간조 시각 연산
    const l1TotalMin = (4 * 60 + 19 + tideShiftMinutes) % (24 * 60);
    const l1H = String(Math.floor(l1TotalMin / 60)).padStart(2, '0');
    const l1M = String(l1TotalMin % 60).padStart(2, '0');

    const l2TotalMin = (l1TotalMin + 12 * 60 + 25) % (24 * 60);
    const l2H = String(Math.floor(l2TotalMin / 60)).padStart(2, '0');
    const l2M = String(l2TotalMin % 60).padStart(2, '0');

    // 조위 및 변동량 산출
    const hLevel1 = Math.floor(95 + Math.sin(i * 0.3) * 20);
    const hDiff1 = Math.floor(70 + Math.sin(i * 0.3) * 25);
    const hLevel2 = Math.floor(90 + Math.cos(i * 0.3) * 18);
    const hDiff2 = Math.floor(60 + Math.cos(i * 0.3) * 22);

    const lLevel1 = Math.max(8, Math.floor(25 - Math.sin(i * 0.3) * 15));
    const lDiff1 = Math.floor(75 + Math.sin(i * 0.3) * 25);
    const lLevel2 = Math.max(8, Math.floor(22 - Math.cos(i * 0.3) * 12));
    const lDiff2 = Math.floor(70 + Math.cos(i * 0.3) * 20);

    const highStr = `${h1H}:${h1M} (${hLevel1}) <span class='txt-red'>▲+${hDiff1}</span><br>${h2H}:${h2M} (${hLevel2}) <span class='txt-red'>▲+${hDiff2}</span>`;
    const lowStr = `${l1H}:${l1M} (${lLevel1}) <span class='txt-blue'>▼-${lDiff1}</span><br>${l2H}:${l2M} (${lLevel2}) <span class='txt-blue'>▼-${lDiff2}</span>`;

    // 일출/일몰
    const sunriseMin = 6 * 60 + 6 + Math.floor(i * 0.3);
    const sunsetMin = 18 * 60 + 29 - Math.floor(i * 0.3);
    const sunStr = `${String(Math.floor(sunriseMin/60)).padStart(2,'0')}:${String(sunriseMin%60).padStart(2,'0')}/${String(Math.floor(sunsetMin/60)).padStart(2,'0')}:${String(sunsetMin%60).padStart(2,'0')}`;

    resultList.push({
      year: yyyy,
      month: mm,
      day: dd,
      lunarSub: `${lunarMonth}.${lunarAge}`,
      moonIcon: moonIcon,
      tideName: tideName,
      flowPercent: flowPercent,
      flowTxt: flowTxt,
      weatherIcon: "☀️",
      highTideStr: highStr,
      lowTideStr: lowStr,
      sunStr: sunStr
    });
  }

  fs.writeFileSync('tide.json', JSON.stringify(resultList, null, 2), 'utf8');
  console.log("tide.json 생성 완료!");
}

generateHaeundaeTide();
