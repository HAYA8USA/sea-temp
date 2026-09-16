const fs = require('fs');
const cheerio = require('cheerio');

async function scrapeBadatime() {
  console.log("바다타임 해운대(52.html) HTML 크롤링 및 파싱 시작...");

  try {
    const url = "https://www.badatime.com/52.html";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP 에러 발생: ${response.status}`);
    }

    // 바다타임은 EUC-KR 인코딩을 사용하므로 ArrayBuffer를 받아 디코딩
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const htmlText = decoder.decode(arrayBuffer);

    const $ = cheerio.load(htmlText);
    const resultList = [];

    // 바다타임의 물때표 본문 테이블 행(tr) 추출
    // 보통 날짜별 데이터는 테이블 내 특정 구조로 나열되어 있습니다.
    // 구조에 맞추어 tr 요소를 순회하며 데이터를 추출합니다.
    
    // 예시 구조 탐색 및 파싱 로직
    $('table tr').each((index, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 7) {
        // 날짜 컬럼 텍스트 정제
        const dateText = $(tds[0]).text().trim();
        const matchDate = dateText.match(/(\d+)/);
        
        if (matchDate) {
          const dayVal = parseInt(matchDate[1], 10);
          const lunarText = $(tds[0]).find('.lunar, span').text().trim() || "8.6";
          const moonIcon = $(tds[1]).text().trim() || "🌓";
          const tideName = $(tds[2]).text().trim() || "1 물";
          
          // 물흐름 퍼센트 추출
          const flowBarText = $(tds[3]).text().trim();
          const flowMatch = flowBarText.match(/(\d+)/);
          const flowPercent = flowMatch ? parseInt(flowMatch[1], 10) : 50;
          const flowTxt = flowBarText.includes("MAX") ? "MAX" : `${flowPercent}%`;

          const weatherIcon = $(tds[4]).text().trim() || "☀️";
          const highText = $(tds[5]).html() ? $(tds[5]).html().replace(/<br\s*[\/]?>/gi, '<br>') : "";
          const lowText = $(tds[6]).html() ? $(tds[6]).html().replace(/<br\s*[\/]?>/gi, '<br>') : "";
          const sunText = tds.length > 7 ? $(tds[7]).text().trim() : "06:06/18:29";

          // 현재 연도/월 기준 객체 생성
          const now = new Date();
          let year = now.getFullYear();
          let month = now.getMonth() + 1;

          resultList.push({
            year: year,
            month: month,
            day: dayVal,
            lunarSub: lunarText,
            moonIcon: moonIcon,
            tideName: tideName,
            flowPercent: flowPercent,
            flowTxt: flowTxt,
            weatherIcon: weatherIcon,
            highTideStr: highText,
            lowTideStr: lowText,
            sunStr: sunText
          });
        }
      }
    });

    // 만약 파싱된 데이터가 없을 경우를 대비한 방어 코드
    if (resultList.length === 0) {
      throw new Error("HTML 구조에서 물때표 데이터를 찾지 못했습니다.");
    }

    fs.writeFileSync('tide.json', JSON.stringify(resultList, null, 2), 'utf8');
    console.log(`tide.json 크롤링 성공! 총 ${resultList.length}일치 데이터 저장됨.`);

  } catch (error) {
    console.error("바다타임 크롤링 실패:", error.message);
    process.exit(1);
  }
}

scrapeBadatime();
