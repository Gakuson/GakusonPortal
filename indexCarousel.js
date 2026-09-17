window.onload = async () => {
    const $ = (e) => document.querySelector(e);
    const $$ = (e) => document.querySelectorAll(e);

    const res = await fetch("/kkContents.json");
    const kkContents = await res.json();

    const todayStr = new Date().toLocaleDateString("sv-SE");

    const kkContentsFiltered = kkContents.filter((e) => {
        if (e.from && e.from > todayStr) return false; // 開始日より前
        if (e.to && e.to < todayStr) return false; // 終了日より後
        return true; // 表示対象
    });

    kkContentsFiltered.forEach((e) => {
        const kkContentElem = document.createElement("div");
        kkContentElem.className = "kkContent";
        if (e.from) kkContentElem.setAttribute("from", e.from);
        if (e.to) kkContentElem.setAttribute("to", e.to);
        kkContentElem.innerHTML = `
            <a target="_blank" href="${e.href}" data-ga4="${e.ga4}">
                <img src="${e.img}" alt="${e.alt}" width="100%" />
            </a>
        `;
        $(".kkContainer").appendChild(kkContentElem);
    });

    const containerElem = $(".kkContainer");
    const contentElems = $$(".kkContent");
    const indElem = $("#indicator");

    let currentIndex = 0;
    const totalItems = contentElems.length;
    if (!totalItems) {
        indElem.textContent = "0 / 0";
        return;
    }

    let autoPlayTimer;

    function updateCarousel() {
        containerElem.style.transform = `translateX(-${currentIndex * 100}%)`;
        indElem.textContent = `${currentIndex + 1} / ${totalItems}`;
        clearInterval(autoPlayTimer);
        autoPlayTimer = setInterval(showNextSlide, 5000);
    }

    function showNextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
    }

    function showPrevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
    }

    $("#nextBtn").addEventListener("click", showNextSlide);
    $("#prevBtn").addEventListener("click", showPrevSlide);

    updateCarousel();

    $$("[data-ga-click]").forEach((e) => {
        e.addEventListener("click", () => {
            gtag("event", "custom_click", { click_target: e.dataset.gaClick });
        });
    });
};
