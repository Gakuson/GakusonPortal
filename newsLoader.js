const container = document.getElementById("news-container");

(async () => {
    try {
        const res = await fetch("./newsData.json");
        const data = await res.json();
        container.innerHTML = "";

        const allNews = [...[...data.pinned].reverse().map((n) => ({ ...n, isPinned: true })), ...[...data.regular].reverse().map((n) => ({ ...n, isPinned: false }))].slice(0, 3);

        for (const news of allNews) {
            const newsDiv = document.createElement("div");
            newsDiv.className = "news";

            // ニュース個別ページへのリンク
            const link = document.createElement("a");
            link.href = `news.html?newsId=${encodeURIComponent(news.id)}`;

            const titleEl = document.createElement("div");
            titleEl.className = "title";
            titleEl.textContent = news.title;
            if (news.isPinned) titleEl.innerHTML = `<span style="color: red">HOT</span> ${news.title}`;

            const dateEl = document.createElement("div");
            dateEl.className = "date";
            dateEl.textContent = news.date;

            const contentEl = document.createElement("div");
            contentEl.className = "content";
            contentEl.textContent = news.content;

            link.appendChild(titleEl);
            link.appendChild(contentEl);
            link.appendChild(dateEl);

            newsDiv.appendChild(link);
            container.appendChild(newsDiv);
        }
    } catch (err) {
        container.innerHTML = "プレビューの読み込みに失敗しました。";
        console.error(err);
    }
})();
