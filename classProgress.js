const getElem = (e) => document.getElementById(e);
const currentTimeElem = getElem("currentTime");
const classProgressParCurrElem = getElem("classProgressParCurr");
const classProgressBarElem = getElem("classProgressBar");
const classProgressValElem = getElem("classProgressVal");
const classProgressParNextElem = getElem("classProgressParNext");

const classTimes_hhmm = [910, 1050, 1105, 1245, 1335, 1515, 1530, 1710, 1725, 1905, 2400];
setInterval(() => {
  const CSS_vars = document.documentElement;
  const CSS_root = getComputedStyle(CSS_vars);
  const CSS_bgColorVal = CSS_root.getPropertyValue("--bgColor").trim();

  //const now = new Date("2025-01-01 11:13:14") //デバッグ用の任意の時刻
  const now = new Date(); //本番環境用
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  currentTimeElem.innerHTML = `<p id="currentTime">現在時刻 <span class="larger">${hh}:${mm}</span><span style="margin-left:0.14em;font-size:130%">${ss}</span></p>`;
  const now_hhmm = now.getHours() * 100 + now.getMinutes();
  //1限前は0, 1限中は1, ... 5限中は9, 5限後は10
  let now_grid = 0;
  while (true) {
    if (now_hhmm < classTimes_hhmm[now_grid]) break;
    now_grid++;
  }
  const remaining_h = Math.floor(classTimes_hhmm[now_grid] / 100) - Math.floor(now_hhmm / 100);
  const remaining_m = (classTimes_hhmm[now_grid] % 100) - (now_hhmm % 100);
  const remaining_min = remaining_h * 60 + remaining_m;
  const remaining_secp = (60 - ss) / 60;
  classProgressBarElem.style.display = "inline-block";
  classProgressParCurrElem.style.display = "block";
  if (now_grid == 0) {
    classProgressBarElem.style.display = "none";
    classProgressValElem.innerHTML = "";
    classProgressParCurrElem.innerHTML = "おはようございます<br>一日の始まり";
    manageNextgrid: {
      const tillNext_h = Math.floor(classTimes_hhmm[now_grid] / 100) - Math.floor(now_hhmm / 100);
      const tillNext_m = (classTimes_hhmm[now_grid] % 100) - (now_hhmm % 100);
      const tillNext_min = tillNext_h * 60 + tillNext_m;
      classProgressParNextElem.innerHTML = `<span class="larger">1</span>限開始まで<span class="larger">${tillNext_min}</span>分`;
    }
  } else if (now_grid == 10) {
    classProgressBarElem.style.display = "none";
    classProgressValElem.innerHTML = "";
    classProgressParCurrElem.innerHTML = "本日の授業終了！<br>お疲れ様でした";
    classProgressParNextElem.style.display = "none";
  } else if (now_grid % 2) {
    updateProgressBarColor("orange", CSS_bgColorVal);
    manageCurrGrid: {
      const classDur_min = 100;
      const classProgrPercent = Math.floor(((classDur_min - remaining_min + 1 - remaining_secp) / classDur_min) * 100);
      classProgressBarElem.value = classProgrPercent;
      classProgressValElem.innerHTML = `${classProgrPercent}%`;
      const currClassNo = Math.ceil(now_grid / 2);
      classProgressParCurrElem.innerHTML = `<span class="larger">${currClassNo}</span>限終了まで<span class="larger">${remaining_min}</span>分`;
    }
    manageNextgrid: {
      if (now_grid == 9) {
        classProgressParNextElem.innerHTML = `今日の授業はこれで最後！<br>夕方までお疲れ様です`;
        break manageNextgrid;
      }
      const tillNext_h = Math.floor(classTimes_hhmm[now_grid + 1] / 100) - Math.floor(now_hhmm / 100);
      const tillNext_m = (classTimes_hhmm[now_grid + 1] % 100) - (now_hhmm % 100);
      const tillNext_min = tillNext_h * 60 + tillNext_m;
      const nextClassNo = Math.ceil(now_grid / 2) + 1;
      classProgressParNextElem.innerHTML = `<span class="larger">${nextClassNo}</span>限開始まで<span class="larger">${tillNext_min}</span>分`;
    }
  } else {
    updateProgressBarColor("lime", CSS_bgColorVal);
    manageCurrGrid: {
      const breakDur_min = now_grid == 4 ? 50 : 15;
      const breakProgrPercent = Math.floor(((breakDur_min - remaining_min + 1 - remaining_secp) / breakDur_min) * 100);
      classProgressBarElem.value = breakProgrPercent;
      classProgressValElem.innerHTML = `${breakProgrPercent}%`;
      const soonClassNo = now_grid / 2 + 1;
      classProgressParCurrElem.innerHTML = `<span class="larger">${soonClassNo}</span>限開始まで<span class="larger">${remaining_min}</span>分`;
    }
    manageNextgrid: {
      if (now_grid == 8) {
        classProgressParNextElem.innerHTML = `今日の授業は次で最後！<br>夕方までお疲れ様です`;
        break manageNextgrid;
      }
      const tillNext_h = Math.floor(classTimes_hhmm[now_grid + 2] / 100) - Math.floor(now_hhmm / 100);
      const tillNext_m = (classTimes_hhmm[now_grid + 2] % 100) - (now_hhmm % 100);
      const tillNext_min = tillNext_h * 60 + tillNext_m;
      const nextClassNo = now_grid / 2 + 2;
      classProgressParNextElem.innerHTML = `<span class="larger">${nextClassNo}</span>限開始まで<span class="larger">${tillNext_min}</span>分`;
    }
  }
}, 500);

function updateProgressBarColor(barColor, bgColor) {
  const style = getElem("dynamicProgressStyle");
  if (style) style.remove();
  const newStyle = document.createElement("style");
  newStyle.id = "dynamicProgressStyle";
  newStyle.textContent = `
  ::-webkit-progress-bar   {background-color: ${bgColor}}
  ::-webkit-progress-value {background-color: ${barColor}}
  ::-moz-progress-bar       {background-color: ${barColor}}`;
  document.head.appendChild(newStyle);
}
