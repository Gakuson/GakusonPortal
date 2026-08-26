#!/bin/sh

SITE_ROOT="$(pwd)"
BASE_URL="https://gakuson.com"
OUTPUT="${SITE_ROOT}/sitemap.xml"

# 除外したいパス (正規表現)
EXCLUDE_DIRS="403|404|header.html|footer.html|kkContents.html"

# ===== 処理開始 =====
echo '<?xml version="1.0" encoding="UTF-8"?>' > "$OUTPUT"
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' >> "$OUTPUT"

find "$SITE_ROOT" -type f -name "*.html" \
  | grep -Ev "$EXCLUDE_DIRS" \
  | while read -r file; do

    # ファイルパス → URL へ変換
    url=$(echo "$file" \
      | sed "s|$SITE_ROOT||" \
      | sed 's|index.html$||')

    # 最終更新日 (ISO 8601)
    lastmod=$(date -u -r "$file" +"%Y-%m-%dT%H:%M:%SZ")

    echo "  <url>" >> "$OUTPUT"
    echo "    <loc>${BASE_URL}${url}</loc>" >> "$OUTPUT"
    echo "    <lastmod>${lastmod}</lastmod>" >> "$OUTPUT"
    echo "  </url>" >> "$OUTPUT"
done

echo '</urlset>' >> "$OUTPUT"

echo "sitemap.xml を生成しました: $OUTPUT"
