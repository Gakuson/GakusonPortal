const $ = (e) => document.getElementById(e);
const currTimeE = $("currentTime");
const cpBarE = $("classProgressBar");
const cpValE = $("classProgressVal");
const cpParE1 = $("classProgressParCurr");
const cpParE2 = $("classProgressParNext");

// 変則授業日・休校日 (MMDD | {start, end})
const exHolidays = [
    112, // 成人
    116, // 共テ準備
    { start: 121, end: 122 }, // 不明
    { start: 202, end: 403 }, // 春
    { start: 503, end: 506 }, // GW
    528, // 予備日
    703, // 上南戦
    { start: 801, end: 915 }, // 夏
    923, // 秋分
    { start: 1030, end: 1103 }, // 学祭
    1105, // 授業予備日
    { start: 1223, end: 106 }, // 冬
];
const exWorkdays = [];

const classTimes = [
    { start: 910, end: 1050 },
    { start: 1105, end: 1245 },
    { start: 1335, end: 1515 },
    { start: 1530, end: 1710 },
    { start: 1725, end: 1905 },
];

const dayThreshold = hhmmToMin(300);
const eveningStart = hhmmToMin(2000);
const eveningMidnightThreshold = hhmmToMin(30);

function hhmmToMin(hhmm) {
    const h = Math.floor(hhmm / 100);
    const m = hhmm % 100;
    return h * 60 + m;
}

function mmddIncludes(mmdd, list) {
    for (const item of list) {
        if (typeof item === "number") {
            if (item === mmdd) return true;
            continue;
        }
        if (!item || typeof item !== "object") continue;
        const { start, end } = item;
        if (typeof start !== "number" || typeof end !== "number") continue;

        if (start <= end) return mmdd >= start && mmdd <= end;
        else return mmdd >= start || mmdd <= end;
    }
    return false;
}

const classTimesParsed = classTimes.map(({ start, end }) => ({
    start: hhmmToMin(start),
    end: hhmmToMin(end),
}));

function isInRange(now, st, end) {
    if (st <= end) return now >= st && now < end;
    return now >= st || now < end;
}

function findSchedulePhase(nowMinutes) {
    const first = classTimesParsed[0];
    const last = classTimesParsed[classTimesParsed.length - 1];

    if (nowMinutes >= dayThreshold && nowMinutes < first.start) {
        return {
            type: "before_first_class",
            nextClassIndex: 0,
            boundaryMin: first.start,
        };
    }

    for (let i = 0; i < classTimesParsed.length; i++) {
        const current = classTimesParsed[i];
        const next = classTimesParsed[i + 1];

        if (nowMinutes >= current.start && nowMinutes < current.end) {
            return {
                type: "in_class",
                currentClassIndex: i,
                boundaryMin: current.end,
                nextClassIndex: next ? i + 1 : null,
                nextStartMin: next ? next.start : null,
            };
        }

        if (next && nowMinutes >= current.end && nowMinutes < next.start) {
            return {
                type: "break",
                currentClassIndex: i,
                nextClassIndex: i + 1,
                boundaryMin: next.start,
            };
        }
    }

    if (nowMinutes >= last.end && nowMinutes < eveningStart) {
        return { type: "after_last_class" };
    }

    return { type: "exception" };
}

function calcRemainingMinutes(nowSeconds, boundaryMinutes) {
    const boundarySeconds = boundaryMinutes * 60;
    const diffSeconds = boundarySeconds - nowSeconds;
    if (diffSeconds <= 0) return 0;
    return Math.ceil(diffSeconds / 60);
}

function calcProgressPercent(nowSeconds, startMinutes, endMinutes) {
    const startSeconds = startMinutes * 60;
    const endSeconds = endMinutes * 60;
    const totalSeconds = endSeconds - startSeconds;
    const elapsedSeconds = nowSeconds - startSeconds;
    if (totalSeconds <= 0) return 0;
    if (elapsedSeconds <= 0) return 0;
    if (elapsedSeconds >= totalSeconds) return 100;
    return Math.floor((elapsedSeconds / totalSeconds) * 100);
}

setInterval(() => {
    const CSS_vars = document.documentElement;
    const CSS_root = getComputedStyle(CSS_vars);
    const CSS_bgColorVal = CSS_root.getPropertyValue("--bgColor").trim();

    //const now = new Date("2025-01-01 18:13:14") // デバッグ用の任意の時刻
    const now = new Date(); // 本番環境用
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    currTimeE.innerHTML = `<p id="currentTime">現在時刻 <span class="larger">${hh}:${mm}</span><span style="margin-left:0.14em;font-size:130%">${ss}</span></p>`;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // 共通で一度初期化
    cpParE1.style.display = "block";
    cpParE2.style.display = "block";

    // 深夜帯（20:00-00:30, 00:30-03:00）は専用メッセージ
    if (isInRange(nowMinutes, eveningStart, eveningMidnightThreshold)) {
        cpBarE.style.display = "none";
        cpValE.innerHTML = "";
        cpParE1.innerHTML = "夜の自由時間です<br>一日お疲れさまでした";
        cpParE2.style.display = "none";
        return;
    }

    if (isInRange(nowMinutes, eveningMidnightThreshold, dayThreshold)) {
        cpBarE.style.display = "none";
        cpValE.innerHTML = "";
        cpParE1.innerHTML = "深夜の時間帯です<br>明日に備えてゆっくり休みましょう";
        cpParE2.style.display = "none";
        return;
    }

    // ここから先は日中〜夕方の表示
    const phase = findSchedulePhase(nowMinutes);

    // 休校日判定
    const mmdd = (now.getMonth() + 1) * 100 + now.getDate();
    const dayOfWeek = now.getDay();
    let isHoliday = dayOfWeek === 0;
    if (mmddIncludes(mmdd, exHolidays)) isHoliday = true;
    if (mmddIncludes(mmdd, exWorkdays)) isHoliday = false;

    if (phase.type === "before_first_class") {
        cpBarE.style.display = "none";
        cpValE.innerHTML = "";
        cpParE1.innerHTML = "おはようございます<br>一日の始まり";

        if (isHoliday) {
            // 休校日の朝
            cpParE2.innerHTML = "今日は休校日です";
        } else {
            // 授業日の朝
            const remainingMin = calcRemainingMinutes(nowSeconds, phase.boundaryMin);
            cpParE2.innerHTML = `<span class="larger">1</span>限開始まで<span class="larger">${remainingMin}</span>分`;
        }
        return;
    }

    if (phase.type === "after_last_class" || phase.type === "exception") {
        cpBarE.style.display = "none";
        cpValE.innerHTML = "";

        if (isHoliday) {
            // 休校日の夕方〜
            cpParE1.innerHTML = "今日は休校日でした<br>一日お疲れさまでした";
        } else {
            // 授業日の夕方〜
            cpParE1.innerHTML = "本日の授業終了！<br>お疲れ様でした";
        }
        cpParE2.style.display = "none";
        return;
    }

    const lastIndex = classTimesParsed.length - 1;

    if (phase.type === "in_class") {
        if (isHoliday) {
            // 休校日の日中（時刻としては授業コマの時間帯）
            cpBarE.style.display = "none";
            cpValE.innerHTML = "";
            cpParE1.innerHTML = "今日は休校日です";
            cpParE2.style.display = "none";
            return;
        }
        updateProgressBarColor("orange", CSS_bgColorVal);
        cpBarE.style.display = "inline-block";

        const classInfo = classTimesParsed[phase.currentClassIndex];
        const classPercent = calcProgressPercent(nowSeconds, classInfo.start, classInfo.end);
        cpBarE.value = classPercent;
        cpValE.innerHTML = `${classPercent}%`;

        const remainingMinToEnd = calcRemainingMinutes(nowSeconds, phase.boundaryMin);
        const currClassNo = phase.currentClassIndex + 1;
        cpParE1.innerHTML = `<span class="larger">${currClassNo}</span>限終了まで<span class="larger">${remainingMinToEnd}</span>分`;

        if (phase.currentClassIndex === lastIndex) {
            cpParE2.innerHTML = `今日の授業はこれで最後！<br>夕方までお疲れ様です`;
        } else if (phase.nextClassIndex != null && phase.nextStartMin != null) {
            const remainingMinToNext = calcRemainingMinutes(nowSeconds, phase.nextStartMin);
            const nextClassNo = phase.nextClassIndex + 1;
            cpParE2.innerHTML = `<span class="larger">${nextClassNo}</span>限開始まで<span class="larger">${remainingMinToNext}</span>分`;
        }
        return;
    }

    if (phase.type === "break") {
        if (isHoliday) {
            // 休校日の日中（休み時間相当の時間帯）
            cpBarE.style.display = "none";
            cpValE.innerHTML = "";
            cpParE1.innerHTML = "今日は休校日です";
            cpParE2.style.display = "none";
            return;
        }
        updateProgressBarColor("lime", CSS_bgColorVal);
        cpBarE.style.display = "inline-block";

        const current = classTimesParsed[phase.currentClassIndex];
        const next = classTimesParsed[phase.nextClassIndex];
        const breakPercent = calcProgressPercent(nowSeconds, current.end, next.start);
        cpBarE.value = breakPercent;
        cpValE.innerHTML = `${breakPercent}%`;

        const soonClassNo = phase.nextClassIndex + 1;
        const remainingMinToNext = calcRemainingMinutes(nowSeconds, phase.boundaryMin);
        cpParE1.innerHTML = `<span class="larger">${soonClassNo}</span>限開始まで<span class="larger">${remainingMinToNext}</span>分`;

        if (phase.nextClassIndex === lastIndex) {
            cpParE2.innerHTML = `今日の授業は次で最後！<br>夕方までお疲れ様です`;
        } else {
            const followingIndex = phase.nextClassIndex + 1;
            const following = classTimesParsed[followingIndex];
            if (following) {
                const remainingMinToFollowing = calcRemainingMinutes(nowSeconds, following.start);
                const nextClassNo = followingIndex + 1;
                cpParE2.innerHTML = `<span class="larger">${nextClassNo}</span>限開始まで<span class="larger">${remainingMinToFollowing}</span>分`;
            }
        }
        return;
    }
}, 500);

function updateProgressBarColor(barColor, bgColor) {
    const style = $("dynamicProgressStyle");
    if (style) style.remove();
    const newStyle = document.createElement("style");
    newStyle.id = "dynamicProgressStyle";
    newStyle.textContent = `
  ::-webkit-progress-bar   {background-color: ${bgColor}}
  ::-webkit-progress-value {background-color: ${barColor}}
  ::-moz-progress-bar       {background-color: ${barColor}}`;
    document.head.appendChild(newStyle);
}
