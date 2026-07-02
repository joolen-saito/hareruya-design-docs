#!/usr/bin/env bash
# 揮発フィクスチャ生成（gitignore対象）。
#   - oversize.csv     : eccube_csv_size(=5MB) を超える大きさ → #1 サイズ超過
#   - invalid_mime.png : 許可MIME外（PNG） → #1 MIME不正
# 判定順序 #1 の異常系で使う。実行時に生成し、コミットしない。
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/card_csv_import"
mkdir -p "$DIR"

# 6MB のダミーCSV（ヘッダ＋巨大な1セル）。5MB上限を確実に超える。
{
  printf 'name_jp,name_en,rarity,layout,image_en\n'
  printf 'E2E Oversize,E2E Oversize,Common,Normal,'
  head -c $((6 * 1024 * 1024)) /dev/zero | tr '\0' 'a'
  printf '\n'
} > "$DIR/oversize.csv"

# 最小PNG（1x1）をMIME不正ケース用に生成。
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n\x2d\xb4\x00\x00\x00\x00IEND\xaeB\x60\x82' > "$DIR/invalid_mime.png"

echo "generated: $DIR/oversize.csv ($(du -h "$DIR/oversize.csv" | cut -f1)), $DIR/invalid_mime.png"
