const d = document;
function getCookie(k) {
    const value = `; ${d.cookie}`;
    const parts = value.split(`; ${k}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}
function setCookie(k, v, d) {
    const e = new Date(Date.now() + d * 864e5).toUTCString();
    d.cookie = `${k}=${v}; expires=${e}; path=/`;
}
function applyTheme(t) {
    d.documentElement.setAttribute("data-theme", t);
}
(() => {
    let t = getCookie("theme");
    if (!t) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        t = prefersDark ? "dark" : "light";
        setCookie("theme", t, 30);
    }
    applyTheme(t);
})();
function toggleTheme() {
    const tOld = d.documentElement.getAttribute("data-theme");
    const tNew = tOld === "dark" ? "light" : "dark";
    applyTheme(tNew);
    setCookie("theme", tNew, 30);
}
