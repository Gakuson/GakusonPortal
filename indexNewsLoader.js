let N = document.getElementById("news-container");
let _ = (e) => document.createElement(e);
let v = "div";
(async () => {
    try {
        let r = await fetch("./newsData.json");
        let d = await r.json();
        N.innerHTML = "";
        let ns = [...[...d.pinned].reverse().map((n) => ({ ...n, isPinned: true })), ...[...d.regular].reverse().map((n) => ({ ...n, isPinned: false }))].slice(0, 3);
        for (let n of ns) {
            let e = _(v);
            e.className = "news";
            let l = _("a");
            l.href = `news.html?newsId=${encodeURIComponent(n.id)}`;
            let t = _(v);
            t.className = "title";
            t.textContent = n.title;
            if (n.isPinned) t.innerHTML = `<span style="color:red">HOT</span> ${n.title}`;
            let d = _(v);
            d.className = "date";
            d.textContent = n.date;
            let c = _(v);
            c.className = "content";
            c.textContent = n.content;
            l.append(t, c, d);
            e.append(l);
            N.append(e);
        }
    } catch (E) {
        N.innerHTML = "プレビューの読み込みに失敗しました";
        console.error(E);
    }
})();
