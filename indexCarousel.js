window.onload = async () => {
    const $ = (e) => document.querySelector(e);
    const $$ = (e) => document.querySelectorAll(e);

    const res = await fetch("/kkContents.html");
    $(".kkBox").innerHTML = await res.text();

    const todayStr = new Date().toLocaleDateString("sv-SE");
    $$(".kkContent").forEach((e) => {
        const from = e.getAttribute("from");
        const to = e.getAttribute("to");
        if (from && todayStr < from) {
            e.remove();
            return;
        }
        if (to && todayStr > to) {
            e.remove();
            return;
        }
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
