async function loadNews(amount) {
  const newses = await (await fetch("./newsData.json")).json();
  let embedHtml = `<div class="newsTitle">ニュース</div><hr />`;
  //pinned
  const { id, title, date, content } = newses.pinned.at(-1);
  embedHtml += `
    <a href="./news.html?newsId=${id}">
    <span class="newsTitle">${title}</span><br />
    ${content}<br />
    <span style="text-align: right;">${date}</span></a>
    <hr />`;

  //not pinned
  for (let i = 1; i < amount; i++) {
    const { id, title, date, content } = newses.regular.at(-i);
    embedHtml += `
    <a href="./news.html?newsId=${id}">
    <span class="newsTitle">${title}</span><br />
    ${content}<br />
    ${date}</a>
    <hr />`;
  }

  embedHtml += `<a href="./news.html" class="showMore">もっと見る</a>`;
  const newsContainer = document.getElementById("newsContainer");
  newsContainer.innerHTML = embedHtml;
}

loadNews(3);
