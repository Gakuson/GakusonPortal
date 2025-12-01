const msgTexts = ["学校からはあきらめよう&emsp;", "学校からは急げば間に合う", "学校からは歩いて間に合う"];
const timeThreshold = { m: [8, 12], n: [11, 17] };

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
    { m: 1, w: 2 }, // 成人
    { m: 7, w: 3 }, // 海
    { m: 9, w: 3 }, // 敬老
    { m: 10, w: 2 }, // スポ
];

const $ = (e) => document.getElementById(e);
const $$ = (e) => document.querySelectorAll(e);
const currentTimeElems = $$(".currTime");
const diaElems = $$(".telop");
const operationElem = $("operationStatus");

(async () => {
    try {
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
        data.forEach((e) => {
            const stat = e.traffic_title;
            let cause = stat == "平常運行" ? "" : `${e.traffic_cause.replace("による", "")}により${e.traffic_section}で`;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${lineId[e.rosen_id]}</td><td>${cause}${stat}</td>`;
            operationElem.appendChild(tr);
        });

        const todayDate = new Date();
        const isHoliday = isDayoff(todayDate);

        const mL = await (await fetch(`./subwayTimetable/meidai-left-${isHoliday ? "weekend" : "regular"}.json`)).json();
        const mR = await (await fetch(`./subwayTimetable/meidai-right-${isHoliday ? "weekend" : "regular"}.json`)).json();
        const nL = await (await fetch(`./subwayTimetable/nisseki-left-${isHoliday ? "weekend" : "regular"}.json`)).json();
        const nR = await (await fetch(`./subwayTimetable/nisseki-right-${isHoliday ? "weekend" : "regular"}.json`)).json();
        const timetables = {
            m: { L: mL, R: mR },
            n: { L: nL, R: nR },
        };
        setInterval(() => {
            const now = new Date();
            const h = String(now.getHours());
            const mm = String(now.getMinutes()).padStart(2, "0");
            for (const e of currentTimeElems) e.innerHTML = `${h}:${mm}`;
            for (const e of diaElems) e.innerHTML = `今日は${isHoliday ? "休日" : "平日"}ダイヤです`;
            for (let i = 0; i < 12; i++) {
                const sta = i < 6 ? "m" : "n";
                const dir = i % 6 > 2 ? "R" : "L";
                const nth = i % 3;
                const [diff, dest] = getDeparture(timetables[sta][dir], nth);
                const comm = (() => {
                    if (!diff) return "まもなく発車";
                    if (diff < timeThreshold[sta][0]) return msgTexts[0];
                    if (diff < timeThreshold[sta][1]) return msgTexts[1];
                    return msgTexts[2];
                })();
                $(`${sta}-${dir}-${nth}-time`).innerHTML = `${diff ? `${diff}分後` : "現在"}`;
                $(`${sta}-${dir}-${nth}-dest`).innerHTML = dest;
                $(`${sta}-${dir}-${nth}-comm`).innerHTML = comm;
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

// FIXME: 国民の休日に未対応
function isDayoff(date) {
    return isSaturday(date) || isSunday(date) || isDefinedHoliday(date) || isAlternateHoliday(date);
}

function isSaturday(date) {
    return date.getDay() === 6;
}

function isSunday(date) {
    return date.getDay() === 0;
}

// 当日の月日または月週が一致するなら、定義祝日
function isDefinedHoliday(date) {
    const isSameDate = (d, m, day) => d.getMonth() + 1 === m && d.getDate() === day;
    for (const h of dateBasedHolidays) {
        if (isSameDate(date, h.m, h.d)) return true;
    }
    const isMonday = date.getDay() === 1;
    const weekNo = Math.floor((date.getDate() - 1) / 7) + 1;
    for (const h of weekNoBasedHolidays) {
        if (date.getMonth() + 1 === h.m && weekNo === h.w && isMonday) return true;
    }
    return false;
}

// 前日が日曜かつ定義祝日なら、振替休日
function isAlternateHoliday(date) {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - 1);
    return isDefinedHoliday(prevDate) && prevDate.getDay() === 0;
}

// 前日と翌日の両方が日曜または定義祝日なら、国民の休日
// FIXME: 振替休日と定義祝日に挟まれた日はどうなのか？(国民の休日の定義が曖昧)
function isCitizenHoliday(date) {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - 1);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    return (isDefinedHoliday(prevDate) || isSunday(prevDate)) && (isDefinedHoliday(nextDate) || isSunday(nextDate));
}