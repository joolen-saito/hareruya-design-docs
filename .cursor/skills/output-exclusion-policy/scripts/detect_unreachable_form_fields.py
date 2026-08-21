#!/usr/bin/env python3
"""フォームに定義があるのに画面へ描画されない項目を洗い出す。

不機能仕様の類型のうち「画面に入力欄が無い条件」を機械で検出する。
規約は .cursor/skills/output-exclusion-policy/SKILL.md の 2.7 を参照。

    detect_unreachable_form_fields.py --form <PHP> [--form <PHP> ...] --template <twig>

検出したものはそのまま除外せず、functions/dead-spec-register.tsv へ根拠付きで登録してから
詳細設計書から落とすこと。
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# ->add('name', ...) / ->create('name', ...)
FIELD_RE = re.compile(r"->(?:add|create)\(\s*'([a-z0-9_]+)'")
# searchForm.name / form.name
RENDER_RE = re.compile(r"(?:[A-Za-z_]+)\.([a-z0-9_]+)")
# attribute(searchForm, 'name') は描画済み。ただし 'name' ~ num のような連結は
# 接頭辞にすぎず、その名前の項目を描画したことにはならない（例: 'buy_product_name' ~ num は
# buy_product_name1..3 を描画するが、buy_product_name そのものは描画しない）。
ATTR_RE = re.compile(r"attribute\(\s*[A-Za-z_]+\s*,\s*'([a-z0-9_]+)'(?!\s*~)")

# 検索条件ではない、または動的生成で拾えない既知の項目
SKIP = {"_token", "vars", "value", "children", "parent"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--form", action="append", required=True, type=Path,
                    help="フォーム定義のPHP。拡張がある場合は複数指定する")
    ap.add_argument("--template", action="append", required=True, type=Path,
                    help="描画するtwig。部品を読み込む場合は複数指定する")
    ap.add_argument("--dynamic", action="append", default=[],
                    help="ループ等で動的生成する項目名。描画済みとして扱う")
    a = ap.parse_args()

    fields: set[str] = set()
    for f in a.form:
        if not f.is_file():
            print(f"読めない: {f}", file=sys.stderr)
            return 2
        fields |= set(FIELD_RE.findall(f.read_text(encoding="utf-8")))

    rendered: set[str] = set(a.dynamic)
    for t in a.template:
        if not t.is_file():
            print(f"読めない: {t}", file=sys.stderr)
            return 2
        text = t.read_text(encoding="utf-8")
        rendered |= set(RENDER_RE.findall(text))
        rendered |= set(ATTR_RE.findall(text))

    unreachable = sorted(f for f in fields if f not in rendered and f not in SKIP)

    print(f"フォーム定義 {len(fields)} 項目 / 画面描画と一致 {len(fields & rendered)} 項目")
    if not unreachable:
        print("画面に入力欄が無い項目: なし")
        return 0

    print(f"画面に入力欄が無い項目: {len(unreachable)} 件")
    for f in unreachable:
        print(f"  - {f}")
    print()
    print("そのまま除外せず functions/dead-spec-register.tsv へ根拠付きで登録すること。")
    print("動的に描画している項目は --dynamic で除外できる。")
    return 1


if __name__ == "__main__":
    sys.exit(main())
