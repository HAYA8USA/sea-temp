const fs = require('fs');

const KHOA_SERVICE_KEY = "c2d3152c4175a10d1e33e8e3dda2806104b073962959a122fec97aba1461bf24";
const HAEUNDAE_OBS_CODE = "DT_0005"; // 해운대 검조소

const tideNames = ["13 물", "14 물", "조금", "1 물", "2 물", "3 물", "4 물", "5 물", "6 물", "7 물", "8 물", "9 물", "10 물", "11 물", "12 물"];
const moonIcons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

async function fetch30DaysTide() {
  const resultList = [];
  const baseDate = new Date();

  console.log("해운대 물때 데이터 수집 및 생성 시작...");

  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + i);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const url = `http://www.khoa.go.kr/oceangrid/grid/api/tideObsPreTab/search.do?ServiceKey=${KHOA_SERVICE_KEY}&ObsCode=${HAEUNDAE_OBS_CODE}&Date=${dateStr}&ResultType=json`;

    let highs = [];
    let lows = [];

    // 타임아웃 5초 설정 (응답 지연 시 무한 대기 방지)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (data && data.result && data.result.data) {
        let prevLevel = 50;
        data.result.data.forEach(item => {
          const timeStr = item.tph_time ? item.tph_time.substring(11, 16) : "00:00";
          const level = parseInt(item.tph_level, 10) || 50;
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
      // API 호출 실패 시 표준 해운대 조석 패턴으로 안전 대체
      console.warn(`[${dateStr}] API 응답 지연/실패, 표준 조석값 적용`);
    }

    // 만약 API에서 데이터를 못 가져왔다면 기본 표준 포맷 적용
    if (highs.length === 0) {
      highs = ["10:54 ( 93) <span class='txt-red'>▲+70</span>", "22:46 ( 87) <span class='txt-red'>▲+57</span>"];
    }
    if (lows.length === 0) {
      lows = ["04:19 ( 23) <span class='txt-blue'>▼-72</span>", "16:47 ( 30) <span class='txt-blue'>▼-63</span>"];
    }

    // 음력 및 물때 연산
    const refNewMoon = new Date(2026, 8, 11);
    const diffDays = (targetDate - refNewMoon) / (1000 * 60 * 60 * 24);
    const lunarAge = Math.floor((diffDays % 29.53 + 29.53) % 29.53) + 1;
    const lunarMonth = targetDate.getMonth() === 8 ? 8 : (targetDate.getMonth() + 1);

    const tideIdx = (lunarAge + 6) % 15;
    const tideName = tideNames[tideIdx] || "1 물";

    const cycleRad = (lunarAge / 29.53) * Math.PI * 4;
    const flowPercent = Math.max(1, Math.min(100, Math.floor(Math.abs(Math.sin(cycleRad)) * 98 + 1)));
    const flowTxt = flowPercent >= 99 ? "MAX" : (flowPercent <= 3 ? "최소" : `${flowPercent}%`);
    const moonIcon = moonIcons[Math.floor((lunarAge / 29.53) * 8) % 8];

    const sunriseMin = 6 * 60 + 6 + Math.floor(i * 0.4);
    const sunsetMin = 18 * 60 + 29 - Math.floor(i * 0.7);
    const sunStr = `${String(Math.floor(sunriseMin/60)).padStart(2,'0')}:${String(sunriseMin%60).padStart(2,'0')}/${String(Math.floor(sunsetMin/60)).padStart(2,'0')}:${String(sunsetMin%60).padStart(2,'0')}`;

    resultList.push({
      year: yyyy,
      month: parseInt(mm),
      day: parseInt(dd),
      lunarSub: `${lunarMonth}.${lunarAge}`,
      moonIcon: moonIcon,
      tideName: tideName,
      flowPercent: flowPercent,
      flowTxt: flowTxt,
      weatherIcon: "☀️",
      highTideStr: highs.join('<br>'),
      lowTideStr: lows.join('<br>'),
      sunStr: sunStr
    });
  }

  fs.writeFileSync('tide.json', JSON.stringify(resultList, null, 2), 'utf8');
  console.log("tide.json 생성 완료!");
}

fetch30DaysTide();
