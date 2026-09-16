const fs = require('fs');

const KHOA_SERVICE_KEY = "c2d3152c4175a10d1e33e8e3dda2806104b073962959a122fec97aba1461bf24";
const HAEUNDAE_OBS_CODE = "DT_0005"; // 해운대 검조소

const tideNames = ["13 물", "14 물", "조금", "1 물", "2 물", "3 물", "4 물", "5 물", "6 물", "7 물", "8 물", "9 물", "10 물", "11 물", "12 물"];
const moonIcons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

async function fetch30DaysTide() {
  const resultList = [];
  const baseDate = new Date();

  console.log("국립해양조사원(KHOA) HTTPS API 실시간 수집 시작...");

  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + i);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    // 핵심 수정: http:// 를 https:// 로 변경하여 보안 차단 우회
    const url = `https://www.khoa.go.kr/oceangrid/grid/api/tideObsPreTab/search.do?ServiceKey=${KHOA_SERVICE_KEY}&ObsCode=${HAEUNDAE_OBS_CODE}&Date=${dateStr}&ResultType=json`;

    let highs = [];
    let lows = [];

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.result && data.result.data) {
        let prevLevel = 50;
        data.result.data.forEach(item => {
          const timeStr = item.tph_time ? item.tph_time.substring(11, 16) : "--:--";
          const level = parseInt(item.tph_level, 10) || 0;
          const diff = level - prevLevel;
          const diffStr = diff >= 0 ? `▲+${diff}` : `▼${diff}`;

          if (item.hl_code === '고조' || item.hl_code === '만조') {
            highs.push(`${timeStr} ( ${level}) <span class="txt-red">${diffStr}</span>`);
          } else if (item.hl_code === '저조' || item.hl_code === '간조') {
            lows.push(`${timeStr} ( ${level}) <span class="txt-blue">${diffStr}</span>`);
          }
          prevLevel = level;
        });
      }
    } catch (err) {
      console.error(`[${dateStr}] KHOA API 호출 실패:`, err.message);
    }

    // 음력 및 물때 연산
    const refNewMoon = new Date(2026, 8, 11);
    const diffDays = (targetDate - refNewMoon) / (1000 * 60 * 60 * 24);
    const lunarAge = Math.floor((diffDays % 29.53 + 29.53) % 29.53) + 1;
    const lunarMonth = parseInt(mm, 10);

    const tideIdx = (lunarAge + 6) % 15;
    const tideName = tideNames[tideIdx] || "1 물";

    const cycleRad = (lunarAge / 29.53) * Math.PI * 4;
    const flowPercent = Math.max(1, Math.min(100, Math.floor(Math.abs(Math.sin(cycleRad)) * 98 + 1)));
    const flowTxt = flowPercent >= 99 ? "MAX" : (flowPercent <= 3 ? "최소" : `${flowPercent}%`);
    const moonIcon = moonIcons[Math.floor((lunarAge / 29.53) * 8) % 8];

    // 일출/일몰
    const sunriseMin = 6 * 60 + 6 + Math.floor(i * 0.4);
    const sunsetMin = 18 * 60 + 29 - Math.floor(i * 0.7);
    const sunStr = `${String(Math.floor(sunriseMin/60)).padStart(2,'0')}:${String(sunriseMin%60).padStart(2,'0')}/${String(Math.floor(sunsetMin/60)).padStart(2,'0')}:${String(sunsetMin%60).padStart(2,'0')}`;

    resultList.push({
      year: yyyy,
      month: parseInt(mm, 10),
      day: parseInt(dd, 10),
      lunarSub: `${lunarMonth}.${lunarAge}`,
      moonIcon: moonIcon,
      tideName: tideName,
      flowPercent: flowPercent,
      flowTxt: flowTxt,
      weatherIcon: "☀️",
      highTideStr: highs.length > 0 ? highs.join('<br>') : "--",
      lowTideStr: lows.length > 0 ? lows.join('<br>') : "--",
      sunStr: sunStr
    });
  }

  fs.writeFileSync('tide.json', JSON.stringify(resultList, null, 2), 'utf8');
  console.log("tide.json HTTPS 실시간 데이터 저장 완료!");
}

fetch30DaysTide();
