// DOM要素取得
const adContainer = document.querySelector(".adContainer");
const adContents = document.querySelectorAll(".adContent");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const indicator = document.getElementById("indicator");

let currentIndex = 0; // 現在のページ
const total = adContents.length;
const interval = 5000; // クールタイム(ms)
let timer;

// 表示更新
function updateCarousel() {
  // コンテナを移動
  adContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
  // インジケータ更新
  indicator.textContent = `${currentIndex + 1} / ${total}`;
}

// 次へ移動
function next() {
  currentIndex = (currentIndex + 1) % total;
  updateCarousel();
  resetTimer();
}

// 前へ移動
function prev() {
  currentIndex = (currentIndex - 1 + total) % total;
  updateCarousel();
  resetTimer();
}

// タイマーリセット
function resetTimer() {
  clearInterval(timer);
  timer = setInterval(next, interval);
}

// イベント設定
nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);

// 初期表示 & 自動スライド開始
updateCarousel();
resetTimer();
