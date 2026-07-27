#!/usr/bin/env python3
"""文言が「切り出された断片」でないかを境界付き一致で検査する（部分文字列一致の穴を塞ぐ）。

## 背景（codex敵対的レビュー 2026-07-27 で発覚）
`validate_messages.py` の捏造検証は `grep -rqF`＝**部分文字列一致**である。そのため
**より長い文言の一部を切り取った断片が PASS してしまう**。実際に2件すり抜けていた:
  - `admin.event.entry.paying_mem` … `admin.event.entry.paying_member` の前方部分一致で PASS
  - （同種の切り詰め破損は ja/en 両列で同じ位置に出る）

## 判定
候補文言 c がソース中に出現する各箇所について、**直前・直後の文字**を見る。
両隣とも「メッセージを構成しうる文字」(日本語/英数字/`_`/`.`/`-`) でなければ
**独立した一値として実在**とみなす（yaml値・クォート済みリテラル・twig本文テキストを一様に扱える）。
境界付き一致が1件も無い＝より長い文言の断片としてしか存在しない＝**FRAGMENT**（捏造候補）。

走査範囲は validate_messages.py と同一（src/Eccube・app・html＋vendor/symfony の翻訳）。
vendor の Symfony 標準訳も実表示される正当なソースである点に注意（例「整数で入力してください。」は
`vendor/symfony/*/Resources/translations/*.xlf` の `<target>` に完全一致で実在する＝捏造ではない）。

使い方:
  python3 check_literal_strict.py [--out suspects.tsv]
終了コード非0で FRAGMENT あり（CIゲート用）。
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys

import lib_messages as L

EE = L.EE_ROOT
TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
# 「メッセージを構成しうる文字」＝ここに挟まれていたら断片とみなす
BODY = re.compile(r"[0-9A-Za-z_.\-぀-ヿ㐀-鿿ｦ-ﾟ]")
SKIP = {"", "（英訳なし）", "—", "-"}


def targets() -> list[str]:
    t = [str(EE / "src/Eccube"), str(EE / "app"), str(EE / "html")]
    t += [str(p) for p in sorted(EE.glob("vendor/symfony/*/Resources/translations")) if p.is_dir()]
    return t


def standalone(text: str) -> bool:
    """text がどこかで独立した一値として出現するか（境界付き一致）。"""
    if not text:
        return True
    r = subprocess.run(["grep", "-rhoF", "-A0", "--", text, *targets()],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return False  # そもそも部分一致すら無い（validate_messages.py が捕捉する領域）
    # 行全体が必要なので改めて行単位で取得する
    r = subprocess.run(["grep", "-rhF", "--", text, *targets()], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        start = 0
        while (i := line.find(text, start)) != -1:
            prev = line[i - 1] if i > 0 else ""
            nxt = line[i + len(text)] if i + len(text) < len(line) else ""
            if not (prev and BODY.match(prev)) and not (nxt and BODY.match(nxt)):
                return True
            start = i + 1
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    args = ap.parse_args()

    rows = L.read_master_rows(TSV)
    checked = frag = 0
    suspects: list[dict] = []
    cache: dict[str, bool] = {}

    for r in rows:
        for col in ("メッセージ内容", "メッセージ内容(英語)"):
            for c in [x.strip() for x in re.split(r"／", r[col]) if x.strip() not in SKIP]:
                # 改行入り文言は、ソース上 `\n` を含む1行のリテラル（JS/twig）として書かれている
                # ことが多い。まず原文のまま試し、駄目なら実改行で分割した各行を個別に試す。
                probes = [c] if len(c) >= 3 else []
                if "\\n" in c:
                    probes += [s.strip() for s in c.replace("\\n", "\n").split("\n") if len(s.strip()) >= 3]
                if not probes:
                    continue
                checked += 1
                for probe in probes:
                    if probe not in cache:
                        cache[probe] = standalone(probe)
                if not any(cache[p] for p in probes):
                    frag += 1
                    suspects.append({"メッセージID": r["メッセージID"], "列": col, "候補": c,
                                     "根拠(file:line)": r["根拠(file:line)"][:150]})

    ids = sorted({s["メッセージID"] for s in suspects})
    print(f"候補文言 {checked}件 / FRAGMENT={frag} （{len(ids)}行）")
    for s in suspects:
        print(f"  {s['メッセージID']:18s} {s['列']:20s} {s['候補'][:60]}")
    if args.out and suspects:
        with open(args.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(suspects[0]), delimiter="\t")
            w.writeheader()
            w.writerows(suspects)
        print(f"→ {args.out}")
    return 1 if suspects else 0


if __name__ == "__main__":
    sys.exit(main())
