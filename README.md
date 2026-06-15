# Gakuson Portal

Gakuson Portal は、南山大学生向けの静的ポータルサイトです。

PORTA、WebClass、講義資料、図書館、交通、地図、ニュースなど、大学生活で日常的に使う導線を 1 つの入口にまとめています。学生団体「がくそん」が運営するサービスで、時期によって GA4 MAU は 3,000 から 4,000 人台規模で推移しています。

## User Value

南山大学の学生生活では、授業、履修、通学、連絡、学内情報の確認に複数のサイトを行き来する必要があります。Gakuson Portal は、その日常的な移動コストを下げるために、スマートフォンから短い操作で必要な情報へ届くことを重視しています。

- よく使う大学システムへの入口を集約する
- 授業時間、地下鉄、地図などの小さな不便を軽くする
- ニュースや告知を静的な JSON で更新しやすくする
- アカウント登録やバックエンドなしで利用できる状態を保つ

## Main Features

- **Quick link dashboard**: PORTA、WebClass、講義資料、Proself、Outlook、シラバス、図書館、大学 HP などへのショートカット。
- **Class progress display**: 南山大学の授業時間に合わせ、現在時刻と授業終了・開始までの残り時間を表示。
- **News page**: `newsData.json` をもとに、固定表示を含むニュース一覧と詳細導線を表示。
- **Campus map**: `mapAssets/nodes.json` の建物データを使い、キャンパスマップ上にピンを表示。
- **Subway helper**: `subwayTimetable/` 配下の時刻表 JSON と交通情報を使い、キャンパス周辺駅の発車時刻確認を補助。
- **Personal timetable table**: Cookie を使い、ブラウザ内に簡易時間割を保存。
- **Circle search**: `clubList.json` を使い、サークル種別、規模、活動頻度、人数、部費などで絞り込み・並べ替え。
- **Responsive navigation and theme toggle**: 共通 header / footer、モバイル表示、light / dark theme の切り替え。
- **Static hosting config**: `.htaccess`、sitemap、403 / 404 ページなど、公開運用に必要な静的ホスティング設定。

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- JSON
- Browser Cookie
- Apache `.htaccess`
- Shell script

package manager、build framework、database、backend service は使わず、静的ファイルだけで運用できる構成にしています。

## Project Structure

```text
.
|-- index.html                 # トップページと quick link dashboard
|-- about.html                 # サービス・団体紹介
|-- allLinks.html              # 追加リンク集
|-- calendar.html              # 年間予定表
|-- classesTable.html          # Cookie 保存の簡易時間割
|-- circleSearch.html          # サークル検索ページ
|-- map.html                   # キャンパスマップ
|-- news.html                  # ニュース一覧
|-- next-subway.html           # 地下鉄発車時刻の補助表示
|-- header.html / footer.html  # 共通パーツ
|-- style.css                  # 共通スタイル
|-- circleSearch.css           # サークル検索用スタイル
|-- classProgress.js           # 授業時間の進捗表示
|-- circleSearch.js            # サークル検索の絞り込み・並べ替え
|-- indexCarousel.js           # トップページのカルーセル表示
|-- newsLoader.js              # ニュース表示
|-- next-subway.js             # 地下鉄時刻表ロジック
|-- theme.js                   # theme 切り替え
|-- newsData.json              # ニュースデータ
|-- clubList.json              # サークル検索データ
|-- mapAssets/                 # 地図画像と建物データ
|-- subwayTimetable/           # 地下鉄時刻表 JSON
|-- img/                       # 画像素材
|-- icon/                      # quick link などのアイコン
|-- errorPage/                 # 403 / 404 ページ
|-- .htaccess                  # Apache hosting 設定
|-- generate.sh                # sitemap 生成補助
```

## Local Preview

共通 header / footer や JSON を `fetch()` で読み込み、`/header.html` のような root-relative path も使うため、ファイルを直接開くのではなく、repository root から HTTP server で確認します。

```powershell
cd C:\Users\yuuki\Documents\programming\GakusonPortal
python -m http.server 8000
```

その後、次の URL を開きます。

```text
http://localhost:8000/
```

VS Code Live Server を使う場合も、repository root が配信 root になるようにします。

## Maintenance Notes

- ニュースは `newsData.json` を更新する。
- サークル検索データは `clubList.json` を更新する。
- キャンパスマップのピンは `mapAssets/nodes.json` を更新する。
- 地下鉄時刻表は `subwayTimetable/` 配下の JSON を更新する。
- sitemap を更新する必要がある場合は、Unix-like shell で `generate.sh` を実行する。
- 問い合わせ先、SNS、告知、協賛表示などの公開情報は、がくそんの運営判断と一致させる。

## Author Role and Ownership

この repository は、実利用されている学生向けポータルの Web 実装・保守実績を示すものです。静的サイト構成、responsive UI、共通パーツ、JSON ベースの情報表示、ブラウザ内状態管理、小さな utility 機能を扱っています。

作者の担当範囲は、がくそんの representative / organizer としての企画・運営、および Web implementation and maintenance です。一方で、サービス名、公開告知、問い合わせ導線、SNS、協賛表示、運営上の意思決定は学生団体「がくそん」の成果であり、個人の単独所有物として扱うべきではありません。

## Privacy and Public Content

この README は、公開 repository と公開サイトから説明できる範囲に限定しています。メンバー個人情報、未公開の運営情報、内部連絡先、未公開の営業・協賛情報は含めません。
