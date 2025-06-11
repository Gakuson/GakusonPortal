const msgTexts = ["学校からはあきらめよう&emsp;", "学校からは急げば間に合う", "学校からは歩いて間に合う"];
const timeThreshold = {
  meidai: [8, 12],
  nisseki: [11, 17],
};

const dateBasedHolidays = [
  { m: 3, d: 20 }, // 春分
  { m: 9, d: 23 }, // 秋分
  { m: 1, d: 1 }, //  元日
  { m: 1, d: 2 }, //  年始
  { m: 1, d: 3 }, //  年始
  { m: 2, d: 11 }, // 建国
  { m: 2, d: 23 }, // 天皇
  { m: 4, d: 29 }, // 昭和
  { m: 5, d: 3 }, //  憲法
  { m: 5, d: 4 }, //  みどり
  { m: 5, d: 5 }, //  こども
  { m: 8, d: 11 }, // 山
  { m: 8, d: 13 }, // お盆
  { m: 8, d: 14 }, // お盆
  { m: 8, d: 15 }, // お盆
  { m: 11, d: 3 }, // 文化
  { m: 11, d: 23 }, //勤労
  { m: 12, d: 28 }, //年末
  { m: 12, d: 29 }, //年末
  { m: 12, d: 30 }, //年末
  { m: 12, d: 31 }, //年末
];
const weekNoBasedHolidays = [
  // m月第w月曜日
  { m: 1, w: 2 }, // 成人の日
  { m: 7, w: 3 }, // 海の日
  { m: 9, w: 3 }, // 敬老の日
  { m: 10, w: 2 }, // スポーツの日
];

const getElem = (e) => document.getElementById(e);
const getAllElems = (e) => document.querySelectorAll(e);
const currentTimeElems = getAllElems(".currTime");
const diaElems = getAllElems(".telop");
const operationElem = getElem("operationStatus");

(async () => {
  try {
    //運行情報処理
    const url = "https://www.kotsu.city.nagoya.jp/jp/datas/latest_traffic.json";

    const lineId = {
      S_LINE: "桜通線",
      K_LINE: "上飯田線",
      T_LINE: "鶴舞線",
      M_LINE: "名城線, 名港線",
      H_LINE: "東山線",
      B_LINE: "市バス",
    };

    const data = await (await fetch(url, { cache: "no-store" })).json();
    data.forEach((obj, _i) => {
      const stat = obj.traffic_title;
      let cause = stat == "平常運行" ? "" : `${obj.traffic_cause.replace("による", "")}により${obj.traffic_section}で`;
      // 「平常運行」「車両点検により全線で遅延」など
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${lineId[obj.rosen_id]}</td><td>${cause}${stat}</td>`;
      operationElem.appendChild(tr);
    });

    //時刻表処理
    const todayDate = new Date();
    const isHoliday = todayDate.getDay() == 0 || todayDate.getDay() == 6 || checkHolidayByDate(todayDate);

    const meidaiLeft = await (
      await fetch(`./subwayTimetable/meidai-left-${isHoliday ? "weekend" : "regular"}.json`)
    ).json();
    const meidaiRight = await (
      await fetch(`./subwayTimetable/meidai-right-${isHoliday ? "weekend" : "regular"}.json`)
    ).json();
    const nissekiLeft = await (
      await fetch(`./subwayTimetable/nisseki-left-${isHoliday ? "weekend" : "regular"}.json`)
    ).json();
    const nissekiRight = await (
      await fetch(`./subwayTimetable/nisseki-right-${isHoliday ? "weekend" : "regular"}.json`)
    ).json();
    const timetables = {
      meidai: { left: meidaiLeft, right: meidaiRight },
      nisseki: { left: nissekiLeft, right: nissekiRight },
    };
    setInterval(() => {
      //現在時刻
      const now = new Date();
      const h = String(now.getHours());
      const mm = String(now.getMinutes()).padStart(2, "0");
      for (const e of currentTimeElems) {
        e.innerHTML = `${h}:${mm}`;
      }
      //平休表示
      for (const e of diaElems) {
        e.innerHTML = `今日は${isHoliday ? "休日" : "平日"}ダイヤです`;
      }
      //次列車
      for (let i = 0; i < 12; i++) {
        const station = i < 6 ? "meidai" : "nisseki"; //0123名大, 4567日赤
        const direction = i % 6 > 2 ? "right" : "left"; //0145左、2367右
        const nthTrain = i % 3;
        const [diff, dest] = getDeparture(timetables[station][direction], nthTrain);
        const comm = (() => {
          if (!diff) return "まもなく発車";
          if (diff < timeThreshold[station][0]) return msgTexts[0];
          if (diff < timeThreshold[station][1]) return msgTexts[1];
          return msgTexts[2];
        })();
        getElem(`${station}-${direction}-${nthTrain}-time`).innerHTML = `${diff ? `${diff}分後` : "現在"}`;
        getElem(`${station}-${direction}-${nthTrain}-dest`).innerHTML = dest;
        getElem(`${station}-${direction}-${nthTrain}-comm`).innerHTML = comm;
      }
    }, 1000);
  } catch (error) {
    console.error("エラー:", error);
  }
})();

function getDeparture(timeTable, nth) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcomingToday = timeTable.filter((entry) => {
    const [time] = entry.split(" ");
    const [hour, minute] = time.split(":").map(Number);
    const entryMinutes = hour * 60 + minute;
    return entryMinutes > nowMinutes;
  });
  if (nth < upcomingToday.length) {
    const target = upcomingToday[nth];
    const [time, dest] = target.split(" ");
    const [hour, minute] = time.split(":").map(Number);
    const targetMinutes = hour * 60 + minute;
    const diff = targetMinutes - nowMinutes - 1;
    return [Math.floor(diff), dest];
  } else {
    const indexInNextDay = nth - upcomingToday.length;
    const target = timeTable[indexInNextDay];
    const [time, dest] = target.split(" ");
    const [hour, minute] = time.split(":").map(Number);
    const targetMinutes = hour * 60 + minute;
    const diff = 24 * 60 - nowMinutes + targetMinutes - 1; // 翌日扱いで24時間加算
    return [Math.floor(diff), dest];
  }
}

function checkHolidayByDate(date, sys = false) {
  //定義された祝日
  const isSameDate = (d, m, day) => d.getMonth() + 1 === m && d.getDate() === day;
  for (const h of dateBasedHolidays) {
    if (isSameDate(date, h.m, h.d)) return true;
  }
  const isMonday = date.getDay() === 1;
  const weekNo = Math.floor((date.getDate() - 1) / 7) + 1;
  for (const h of weekNoBasedHolidays) {
    if (date.getMonth() + 1 === h.m && weekNo === h.w && isMonday) return true;
  }
  if (sys) return false;
  //国民の休日
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  const yHoliday = checkHolidayByDate(yesterday, true);
  const tHoliday = checkHolidayByDate(tomorrow, true);
  if (yHoliday && tHoliday) return true;
  //振替休日
  let nDaysAgo = new Date(date);
  while (true) {
    nDaysAgo.setDate(nDaysAgo.getDate() - 1);
    if (!checkHolidayByDate(nDaysAgo, true)) return false;
    if (nDaysAgo.getDay() === 0) return true;
  }
}
