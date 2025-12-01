let d = document;
let $ = (e) => d.getElementById(e);

let b = d.querySelector(".kkContainer");
let c = d.querySelectorAll(".kkContent");
let n = $("indicator");

let i = 0;
let l = c.length;
let t;

function u() {
    b.style.transform = `translateX(-${i * 100}%)`;
    n.textContent = `${i + 1} / ${l}`;
    clearInterval(t);
    t = setInterval(n, 5e3);
}

function n() {
    i = (i + 1) % l;
    u();
}

function p() {
    i = (i - 1 + l) % l;
    u();
}

$("nextBtn").addEventListener("click", n);
$("prevBtn").addEventListener("click", p);

u();
