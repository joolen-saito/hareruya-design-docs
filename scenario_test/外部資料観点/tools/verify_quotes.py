"""抜き出した TSV の「原文抜粋」が、指定ファイルの指定ページに実在するかを照合する。
使い方: verify_quotes.py <txtルート> <TSV>...
空白・改行・CID復号の区切り「?」を除いて比較する。ページが違っても本文中に在れば「ページ違い」と報告する。
"""
import csv
import os
import re
import sys

root = sys.argv[1]
WS = re.compile("[\\s\u3000\ufeff\u200b?\uff1f]+")


def norm(s):
    return WS.sub("", s)


cache = {}


def load(fname):
    if fname in cache:
        return cache[fname]
    path = None
    for d, _, files in os.walk(root):
        if fname in files:
            path = os.path.join(d, fname)
            break
    if path is None:
        cache[fname] = None
        return None
    text = open(path, encoding="utf-8").read()
    pages = {}
    for chunk in text.split("=====PAGE ")[1:]:
        head, _, body = chunk.partition("=====")
        try:
            pages[int(head.strip())] = norm(body)
        except ValueError:
            pass
    cache[fname] = pages
    return pages


total = ok = 0
problems = []
for tsv in sys.argv[2:]:
    with open(tsv, encoding="utf-8") as f:
        rows = list(csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
    header, body = rows[0], rows[1:]
    for n, r in enumerate(body, start=2):
        if len(r) < 6:
            problems.append((tsv, n, "列不足", "|".join(r)[:80]))
            continue
        total += 1
        quote, fname, page = r[3], r[4].strip(), r[5].strip()
        pages = load(fname)
        if pages is None:
            problems.append((tsv, n, "ファイル不明", fname))
            continue
        q = norm(quote)
        if len(q) < 8:
            problems.append((tsv, n, "抜粋が短すぎる", quote))
            continue
        try:
            p = int(re.match(r"\d+", page).group())
        except Exception:
            p = None
        if p is not None and q in pages.get(p, ""):
            ok += 1
            continue
        # 前後ページにまたがる引用
        if p is not None and q in pages.get(p, "") + pages.get(p + 1, ""):
            ok += 1
            continue
        hits = [k for k, v in pages.items() if q in v]
        if hits:
            problems.append((tsv, n, f"ページ違い(実際{hits[:3]})", quote[:60]))
        else:
            problems.append((tsv, n, "原文に無い", quote[:80]))

print(f"照合 {total} 件 / 一致 {ok} 件 / 問題 {len(problems)} 件")
for p in problems:
    print("\t".join(str(x) for x in p))
