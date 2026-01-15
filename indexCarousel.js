window.onload = async () => {
    let D = document;
    let $ = (e) => D.querySelector(e);
    let $$ = (e) => D.querySelectorAll(e);

    let R = await fetch("/kkContents.html");
    $(".bannerLeft").innerHTML = await R.text();

    let b = $(".kkContainer");
    let c = $$(".kkContent");
    let n = $("#indicator");

    let i = 0;
    let l = c.length;
    let t;

    function u() {
        b.style.transform = `translateX(-${i * 100}%)`;
        n.textContent = `${i + 1} / ${l}`;
        clearInterval(t);
        t = setInterval(p, 5e3);
    }

    function p() {
        i = (i + 1) % l;
        u();
    }

    function m() {
        i = (i - 1 + l) % l;
        u();
    }

    $("#nextBtn").addEventListener("click", p);
    $("#prevBtn").addEventListener("click", m);

    u();

    $$("[data-ga-click]").forEach((e) => {
        e.addEventListener("click", () => {
            gtag("event", "custom_click", { click_target: e.dataset.gaClick });
        });
    });
};
