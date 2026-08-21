#!/usr/bin/env python3
"""0203 型への書き直しが規準を満たすかを機械検査する（捏造・欠落・様式の3観点）。

書き直しは文章を作り替える作業なので、**元に無い事実を書く／必要な行を落とす**事故が起きうる。
人の目視だけに頼らず、次を機械で見る。

1. 欠落: メッセージID が書き直し前（git HEAD もしくは指定の比較元）から減っていないか。
2. 欠落: 画面上の文言（メッセージ表の3列目）が書き直し前の集合から消えていないか。
3. 様式: H2 が「業務ロジック / 入出力 / 表示メッセージ」だけか。
4. 様式: 実装手段・内部識別子（クラス名/メソッド/イベント/セッションキー/翻訳キー）が残っていないか。
5. 様式: DB物理名（dtb_/mtb_/plg_）が残っていないか。
6. 様式: メッセージ表が5列か。

使い方:
    python3 check_rewrite_quality.py --book 0204
    python3 check_rewrite_quality.py --docs functions/pf-eccube3/m03-01_*.md
終了コードは違反があれば 1。
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ALLOWED_H2 = {"業務ロジック", "入出力", "表示メッセージ"}
# `## 出典` は設計書の本文ではなく、正典の裏取りを書き手が申告する付録である
# （[[REGENERATION_RUNBOOK]] の「出典」。h2 が3種以外なので HTML には出力されない）。
# 本文の様式検査（3分類・実装用語）を出典節に掛けると、出典のファイルパスが
# 実装用語として引っ掛かり、規約どおり書いた文書が落ちる。検査前に切り離す。
CITATION_H2 = "出典"
MSG_ID_RE = re.compile(r"[A-Z]\d{2}-\d{2}-MSG-\d+")
IMPL_PATTERNS = [
    (re.compile(r"`[A-Za-z][A-Za-z0-9_]*::[A-Za-z0-9_]+`"), "メソッド参照"),
    (re.compile(r"`[A-Z][A-Za-z0-9]+Type`"), "フォーム型名"),
    (re.compile(r"`[a-z][a-z0-9_]*(?:\.[a-z0-9_]+){2,}`"), "セッション/翻訳キー"),
    (re.compile(r"`[A-Z][A-Z0-9_]{5,}`"), "定数名"),
    (re.compile(r"\b(?:Repository|Controller|EntityManager|Twig|Doctrine|Symfony)\b"), "実装クラス層"),
    (re.compile(r"\b(?:handleRequest|dispatch|flush|persist|fputcsv|set_time_limit)\b"), "実装メソッド"),
    (re.compile(r"\b(?:dtb|mtb|plg)_[a-z0-9_]+"), "DB物理名"),
]


def default_rev() -> str:
    """比較元の既定。書き直しの前を指すリビジョンが記録されていればそれを使う。

    HEAD 固定にすると、書き直しで本文を捨てた版が既にコミットされている場合に
    欠落検査が空振りする（2026-08-21 実測: タイトル1行に削られたファイルで検査が無効化されていた）。
    """
    ledger = ROOT / "functions" / "REWRITE_BASELINE.md"
    if ledger.is_file():
        m = re.search(r"\b[0-9a-f]{40}\b", ledger.read_text(encoding="utf-8"))
        if m:
            return m.group(0)
    return "HEAD"


def baseline_text(path: Path, rev: str = "HEAD") -> str | None:
    """比較元の内容。取得できなければ None。"""
    rel = path.relative_to(ROOT).as_posix()
    try:
        out = subprocess.run(
            ["git", "show", f"{rev}:{rel}"], cwd=ROOT, capture_output=True, text=True, check=False
        )
        return out.stdout if out.returncode == 0 else None
    except OSError:
        return None


TEXT_COLUMNS = ("画面上の文言", "表示文言（日本語）", "表示文言", "文言")
# 実装参照・翻訳キーだけのセルは書き直しで意図的に落とす。比較対象から外す。
# 実装参照・翻訳キーだけのセル、および実装識別子を含む散文説明のセルは、書き直しで
# 意図的に落とす。メッセージ棚卸の規約（message_inventory/README.md）でも、文言列に
# 書けるのは「実ソースに逐語で存在する固定リテラル」か「要ソース確認」だけで、
# 散文説明（例: 日付形式の検証エラー（Symfony `DateType` 既定 `invalid_message`））は違反である。
IMPL_CELL_RE = re.compile(
    r"^`?[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+`?\.?$"
    r"|\.php:|getMessage\(\)|設定キー|メッセージキー"
    r"|`[A-Za-z_][A-Za-z0-9_]*`"          # 実装識別子をバッククォートで含む散文説明
    r"|Symfony|Doctrine|Twig"
)


def message_texts(text: str) -> set[str]:
    """メッセージ表の「画面上の文言」列だけを、表ごとのヘッダを見て取り出す。

    備考列・表示位置列まで比べると、書き直しで意図的に落とした実装参照（翻訳キー・
    file:line・セレクタ）を「文言が消えた」と誤検知する。列を特定して文言だけ見る。
    """
    out: set[str] = set()
    index: int | None = None
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped.startswith("|"):
            index = None
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if set("".join(cells)) <= set("-: "):
            continue
        if any(c in TEXT_COLUMNS for c in cells):
            index = next(i for i, c in enumerate(cells) if c in TEXT_COLUMNS)
            continue
        if index is None or index >= len(cells):
            continue
        if not MSG_ID_RE.match(cells[0] or "") and cells[0] != "—":
            continue
        cell = cells[index]
        if not cell or cell == "—" or IMPL_CELL_RE.search(cell):
            continue
        out.add(re.sub(r"\s+", "", cell))
    return out


def strip_citation_section(text: str) -> str:
    """`## 出典` 節を取り除いた本文を返す（次の h2 の手前まで）。"""
    out, skipping = [], False
    for line in text.split("\n"):
        m = re.match(r"^## (.+)$", line)
        if m:
            skipping = m.group(1).strip().startswith(CITATION_H2)
        if not skipping:
            out.append(line)
    return "\n".join(out)


def check(path: Path, rev: str = "HEAD") -> list[str]:
    text = strip_citation_section(path.read_text(encoding="utf-8"))
    problems: list[str] = []
    body = strip_citation_section(text)

    h2 = {m.strip() for m in re.findall(r"^## (.+)$", body, flags=re.M)}
    extra = h2 - ALLOWED_H2
    if extra:
        problems.append(f"3分類の外の節: {sorted(extra)}")

    for pattern, label in IMPL_PATTERNS:
        hits = pattern.findall(body)
        if hits:
            problems.append(f"{label}が残っている: {sorted(set(hits))[:4]}")

    for line in text.split("\n"):
        if line.strip().startswith("|") and MSG_ID_RE.match(line.strip().strip("|").split("|")[0].strip()):
            cells = line.strip().strip("|").split("|")
            if len(cells) != 5:
                problems.append(f"メッセージ表が5列でない（{len(cells)}列）: {line.strip()[:50]}")
                break

    base = baseline_text(path, rev)
    if base:
        base = strip_citation_section(base)
        lost_ids = set(MSG_ID_RE.findall(base)) - set(MSG_ID_RE.findall(text))
        if lost_ids:
            problems.append(f"メッセージIDが減った: {sorted(lost_ids)}")
        lost_msg = message_texts(base) - message_texts(text)
        if lost_msg:
            problems.append(f"画面上の文言が消えた: {sorted(lost_msg)[:3]}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docs", nargs="*", type=Path, default=[])
    parser.add_argument("--book", default="")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--rev", default=None,
                        help="比較元のリビジョン。既定は functions/REWRITE_BASELINE.md の記録、無ければ HEAD")
    args = parser.parse_args()

    docs = [p if p.is_absolute() else ROOT / p for p in args.docs]
    if args.book:
        html = next((ROOT / "excel_to_html" / "output").glob(f"{args.book}_*.html"))
        docs = [
            ROOT / s
            for s in sorted(
                set(re.findall(r'data-source="(functions/[^"]+)"', html.read_text(encoding="utf-8")))
            )
        ]
    if not docs:
        print("対象がありません", file=sys.stderr)
        return 1

    rev = args.rev or default_rev()
    bad = 0
    for path in sorted(docs):
        problems = check(path, rev)
        if problems:
            bad += 1
            print(f"NG {path.name}")
            for p in problems:
                print(f"    - {p}")
        elif not args.quiet:
            print(f"OK {path.name}")
    print(f"\n合計 {len(docs)}本 / 合格 {len(docs) - bad} / 違反 {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
