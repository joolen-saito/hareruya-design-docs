#!/usr/bin/env python3
"""『根拠(file:line)』が指す**その場所**に文言(またはそのキー)が実在するかを検査する。

validate_messages.py は「文言がソースツリーのどこかに逐語存在するか」しか見ないため、
**別ファイルの同一文言を流用していても PASS する**（例: 「保存しました」はソース中に多数ある）。
本スクリプトは根拠の file:line を実際に開き、その周辺に
  - 文言そのもの（改行やプレースホルダを含む逐語）
  - または文言を解決するロケールキー
のいずれかが存在するかを検査する。存在しなければ「根拠が指す場所に無い」＝要精査とする。

判定は3値:
  OK       : 根拠位置に文言 or キーが実在
  KEY_ONLY : 根拠位置にはキーのみ（yaml/xlf 側に文言実在）。正常系
  MISS     : 根拠位置に文言もキーも無い ← 敵対的レビューの対象

## 既知の限界（MISS が必ずしもデータ欠陥ではない）
- 根拠が **ベアファイル名**（例 `OrderController.php:867`）だと、同名ファイルが複数あるため
  パス解決に失敗して MISS になる。根拠側にリポジトリ相対パスを書けば解消する。
- `addError('文言')` のように**引数へ直書き**された文言は、正規化の差（句読点・エスケープ）で
  取りこぼすことがある。
MISS は「要精査リスト」であって FAIL ではない。中身を見て判断すること。

使い方:
  python3 check_evidence_anchor.py                 # 全行
  python3 check_evidence_anchor.py --out miss.tsv  # MISS のみTSV出力
"""
from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
WINDOW = 12  # file:line の前後何行まで見るか

FILE_LINE = re.compile(r"([\w./-]+\.(?:php|twig|yaml|yml|xlf|js))[: ](\d+)(?:-(\d+))?")
_cache: dict[Path, list[str]] = {}


def read(path: Path) -> list[str]:
    if path not in _cache:
        try:
            _cache[path] = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            _cache[path] = []
    return _cache[path]


def resolve(rel: str) -> Path | None:
    # 根拠は "ec-cube-enterprise/src/..." のようにリポジトリ名を含むことがある
    rel = re.sub(r"^(?:\./)?ec-cube-enterprise/", "", rel)
    for base in (EE, EE / "src/Eccube/Resource/locale", EE / "src/Eccube/Resource/template",
                 EE / "src/Eccube/Resource/template/admin", EE / "src/Eccube/Resource/template/default"):
        p = base / rel
        if p.is_file():
            return p
    # 末尾一致で探す（根拠がファイル名だけのことがある）
    for pat in (f"src/**/{Path(rel).name}", f"html/**/{Path(rel).name}",
                f"app/**/{Path(rel).name}", f"vendor/symfony/**/{Path(rel).name}"):
        hits = [h for h in EE.glob(pat) if h.is_file()]
        if len(hits) == 1:
            return hits[0]
    return None


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s.replace("\\n", "").replace("<br>", ""))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    args = ap.parse_args()

    trans = {}
    for loc in ("ja", "en"):
        trans[loc] = L.load_translations(loc)
    ja2key = {}
    for k, v in trans["ja"].items():
        ja2key.setdefault(norm(v), []).append(k)

    rows = L.read_master_rows(TSV)
    stats = {"OK": 0, "KEY_ONLY": 0, "MISS": 0, "NO_EVIDENCE_PATH": 0}
    misses = []

    for r in rows:
        content = r["メッセージ内容"]
        ev = r["根拠(file:line)"]
        # 候補併記（規約: 「／」区切り）は各候補を許容
        cands = [c.strip() for c in content.split("／") if c.strip()]
        keys = {k for c in cands for k in ja2key.get(norm(c), [])} | {
            c for c in cands if re.fullmatch(r"[a-z][\w.]*\.[\w.]+", c)
        }

        refs = FILE_LINE.findall(ev)
        if not refs:
            stats["NO_EVIDENCE_PATH"] += 1
            continue

        found_text = found_key = False
        for rel, a, b in refs:
            p = resolve(rel)
            if not p:
                continue
            lines = read(p)
            lo = max(0, int(a) - 1 - WINDOW)
            hi = min(len(lines), (int(b) if b else int(a)) + WINDOW)
            blob = norm("\n".join(lines[lo:hi]))
            if any(norm(c) and norm(c) in blob for c in cands):
                found_text = True
            if any(k in blob for k in keys):
                found_key = True

        if found_text:
            stats["OK"] += 1
        elif found_key:
            stats["KEY_ONLY"] += 1
        else:
            stats["MISS"] += 1
            misses.append(r)

    print(f"検査 {len(rows)}行: " + " / ".join(f"{k}={v}" for k, v in stats.items()))
    if args.out and misses:
        cols = ["メッセージID", "画面", "種別", "メッセージ内容", "メッセージ内容(英語)",
                "根拠(file:line)", "解決状態"]
        with open(args.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, delimiter="\t")
            w.writerow(cols)
            for r in misses:
                w.writerow([r[c] for c in cols])
        print(f"MISS を {args.out} へ出力")


if __name__ == "__main__":
    main()
