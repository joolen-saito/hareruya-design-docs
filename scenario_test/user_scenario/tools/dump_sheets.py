"""設計書HTMLをシートごとの文字ファイルにする（読み取り用）。

使い方: python dump_sheets.py <設計書HTML> <出力フォルダ>
出力: <出力フォルダ>/<設計書の番号>_sheet-<n>_<シート名>.txt
巨大なHTMLを丸ごと読まずに、必要なシートだけ grep・sed で読むために使う。
"""
import html
import os
import re
import sys

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
t = open(src, encoding="utf-8").read()
t = re.sub(r"<(script|style|svg)\b.*?</\1>", "", t, flags=re.S)
t = re.sub(r"<img[^>]*>", "", t)
parts = re.split(r'<section class="sheet-panel[^"]*" id="(sheet-\d+)">', t)
base = os.path.basename(src)[:4]
for i in range(1, len(parts), 2):
    sid, body = parts[i], parts[i + 1]
    m = re.search(r"<h2[^>]*>([^<]*)", body)
    title = m.group(1).strip() if m else ""
    body = re.sub(r"</(tr|p|div|h\d|li|br)>|<br\s*/?>", "\n", body)
    body = re.sub(r"</t[dh]>", " | ", body)
    txt = html.unescape(re.sub(r"<[^>]+>", "", body))
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n\s*\n+", "\n", txt)
    fn = f"{out}/{base}_{sid}_{title.replace('/', '_')[:30]}.txt"
    open(fn, "w", encoding="utf-8").write(txt)
