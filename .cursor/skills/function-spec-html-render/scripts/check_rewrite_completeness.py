#!/usr/bin/env python3
"""0203型への書き直しで**本文が捨てられていないか**を機械検査する。

`check_rewrite_quality.py` はメッセージIDと画面文言の保存しか見ない。そのため
「メッセージ表だけ残して業務ロジックと入出力を丸ごと落とす」書き直しが素通りする
（2026-08-21 実測: 274行→11行の m04-12、329行を失って1行になった m04-22 がいずれも合格した）。
本書はその穴を塞ぐ。書き直しは要約であって削除ではない、という一点だけを見る。

検査:
  1. 必須節: 「業務ロジック」と「入出力」があること。
     除外台帳（superseded / phase2 / csv-format-only）に載る機能は免除する。
  2. 本文量: 比較元（既定は git HEAD）の本文がほぼ丸ごと消えていないこと。
     比較元からは除外規約で落としてよい節（概要・本書で扱うこと・改訂履歴など）を先に除く。

較正の記録（2026-08-21）: 縮小率と情報語の保存率は、良い要約と削除を区別できない。
正しく書き直せた m11-01 は 5,467字→1,225字（22%）で、消えた語は「エラーフラッシュ」「セレクト」
「スクリプト」など**規約が意図的に落とす実装用語**だった。要約は元の7〜8割を捨てるのが正常である。
したがって落とす基準は「必須節が無い」と「本文がほぼ全消し」に絞り、
それ以外の縮小は警告として出すだけにする（人が抜き取りで見るための手掛かり）。

使い方:
    python3 check_rewrite_completeness.py --book 0202
    python3 check_rewrite_completeness.py --all
    python3 check_rewrite_completeness.py --docs functions/pf-eccube3/m03-01_*.md
終了コードは違反があれば 1。
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]

REQUIRED_SECTIONS = ("業務ロジック", "入出力")

# 比較元から先に落とす節。出力除外規約で「設計書に書かない」と決めたもの、
# および書き直しで意図的に畳む定型の枠組み。ここを残したまま量を比べると、
# 正しい書き直しまで「減った」と判定してしまう。
DROPPABLE_SECTIONS = (
    "文書情報", "改訂履歴", "概要", "機能の目的と役割",
    "本書で扱うこと", "本書で扱わないこと", "前提", "用語",
    "関連設計への接続点", "リニューアル移行時の扱い", "参照ソース",
    "実装差分追補", "ec-cube-enterprise実装との差分追記",
    "ログ・監査", "ログに出してはいけないもの", "権限・認可",
    "セッション", "Cookie", "排他制御・トランザクション", "試行制限",
    "DBカラム", "テーブル", "エンドポイント", "利用者視点の入口",
    "利用者視点の入口（エンドポイント）",
)

# 情報語。事実の担い手になる語だけを拾う。ひらがなを混ぜると「が送出する実行時例外型」のような
# 文ごと切り出した語ができ、要約すれば当然消えるので保存率が意味を失う。漢字とカタカナの塊に限る。
TERM_RE = re.compile(r"[一-龥]{2,}|[ァ-ヴ][ァ-ヴー]{2,}|\d{2,}(?:[.,]\d+)?")
# 文章の骨組みでどの文書にも出る語。保存率の分母から外す。
STOPWORDS = {
    "する", "した", "して", "される", "された", "できる", "できない", "ない", "ある",
    "とき", "こと", "もの", "ため", "場合", "とする", "とし", "および", "または",
    "この", "その", "これ", "それ", "以下", "以上", "本書", "本節", "上記", "下記",
}

# 「メッセージ表だけ残して本文を捨てる」を量として数えないため、表示メッセージ節を落として比べる。
# 表の行そのものは落とさない。0203型は項目表・判定順序表に事実を載せるので、
# 表を除くと正しい書き直しまで「本文が減った」ことになってしまう。
MESSAGE_SECTIONS = ("表示メッセージ", "フラッシュメッセージ", "メッセージ")


def _ledger_ids() -> set[str]:
    """廃止・Ph2・CSV項目のみ、として登録済みの機能ID。"""
    ids: set[str] = set()
    for name in ("superseded_specs.json", "phase2_specs.json"):
        p = ROOT / "functions" / name
        if p.is_file():
            ids |= set(re.findall(r"[mbfa]\d{2}-\d{2}", p.read_text(encoding="utf-8")))
    csv_only = ROOT / "functions" / "csv-format-only.tsv"
    if csv_only.is_file():
        for line in csv_only.read_text(encoding="utf-8").splitlines():
            if line.startswith("#") or not line.strip():
                continue
            ids |= set(re.findall(r"[mbfa]\d{2}-\d{2}", line))
    return ids


def baseline_text(path: Path, rev: str) -> str | None:
    rel = path.relative_to(ROOT).as_posix()
    r = subprocess.run(["git", "-C", str(ROOT), "show", f"{rev}:{rel}"],
                       capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def strip_sections(text: str, titles: tuple[str, ...]) -> str:
    """指定した見出しの節（見出しレベルを問わない）を本文ごと落とす。"""
    out, skip_level = [], None
    for line in text.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            level, title = len(m.group(1)), m.group(2).strip()
            if skip_level is not None and level <= skip_level:
                skip_level = None
            if skip_level is None and any(title.startswith(t) for t in titles):
                skip_level = level
                continue
        if skip_level is None:
            out.append(line)
    return "\n".join(out)


def body_of(text: str) -> str:
    """表示メッセージ節と見出し行を除いた本文。表の行は事実を載せるので残す。"""
    text = strip_sections(text, MESSAGE_SECTIONS)
    return "\n".join(l for l in text.splitlines() if not l.startswith("#"))


def terms(text: str) -> set[str]:
    return {t for t in TERM_RE.findall(text) if t not in STOPWORDS and len(t) >= 2}


def check(path: Path, rev: str, min_ratio: float, warn_ratio: float, min_coverage: float,
          ledger: set[str], warnings: list[str]) -> list[str]:
    cur = path.read_text(encoding="utf-8")
    fid = path.name[:6]
    violations: list[str] = []

    exempt = fid in ledger
    missing = [s for s in REQUIRED_SECTIONS if f"## {s}" not in cur]
    if missing and not exempt:
        violations.append(f"必須節が無い: {' / '.join(missing)}"
                          "（意図した非出力なら superseded / phase2 / csv-format-only へ登録する）")

    base = baseline_text(path, rev)
    if base is None:
        return violations  # 新規追加のファイルは比較元が無い

    base_body = body_of(strip_sections(base, DROPPABLE_SECTIONS))
    cur_body = body_of(cur)
    b_chars, c_chars = len(base_body.strip()), len(cur_body.strip())
    if b_chars >= 200:
        ratio = c_chars / b_chars
        if ratio < min_ratio and not exempt:
            violations.append(f"本文がほぼ消えている: {ratio:.0%}"
                              f"（比較元 {b_chars}字 → {c_chars}字）")
        elif ratio < warn_ratio and not exempt:
            warnings.append(f"本文が{ratio:.0%}（{b_chars}字→{c_chars}字）。"
                            "要約として妥当か抜き取りで確かめる")
        bt = terms(base_body)
        if len(bt) >= 30 and not exempt:
            cov = len(bt & terms(cur_body)) / len(bt)
            if cov < min_coverage:
                lost = sorted(bt - terms(cur_body))[:10]
                warnings.append(f"情報語の保存率 {cov:.0%}（消えた語の例: {' '.join(lost)}）")
    return violations


def collect(args) -> list[Path]:
    if args.docs:
        return [Path(d).resolve() for d in args.docs]
    paths = sorted((ROOT / "functions").glob("*/*.md"))
    if args.book:
        m: dict[str, set[str]] = {}
        for line in (ROOT / "functions" / "function-sheet-map.tsv").read_text(
                encoding="utf-8").splitlines()[1:]:
            c = line.split("\t")
            if len(c) > 4 and c[3] == args.book:
                m.setdefault(args.book, set()).add(c[0][:3].lower())
        pres = m.get(args.book, set())
        paths = [p for p in paths if p.name[:3] in pres]
    return paths


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--book")
    ap.add_argument("--docs", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--rev", default="HEAD", help="比較元のリビジョン（既定 HEAD）")
    ap.add_argument("--min-ratio", type=float, default=0.08,
                    help="本文がこの比率を下回ったら違反＝ほぼ全消し（既定 0.08）")
    ap.add_argument("--warn-ratio", type=float, default=0.15,
                    help="この比率を下回ったら警告（既定 0.15）")
    ap.add_argument("--min-coverage", type=float, default=0.20,
                    help="情報語の保存率がこれを下回ったら警告（既定 0.20）")
    ap.add_argument("--show-warnings", action="store_true", help="警告も表示する")
    args = ap.parse_args()

    ledger = _ledger_ids()
    paths = collect(args)
    ng = warn_n = 0
    for p in paths:
        warnings: list[str] = []
        v = check(p, args.rev, args.min_ratio, args.warn_ratio, args.min_coverage,
                  ledger, warnings)
        if v:
            ng += 1
            print(f"NG {p.relative_to(ROOT)}")
            for x in v:
                print(f"   - {x}")
        elif warnings:
            warn_n += 1
            if args.show_warnings:
                print(f"warn {p.relative_to(ROOT)}")
                for x in warnings:
                    print(f"   - {x}")
    print(f"\n合計 {len(paths)}本 / 合格 {len(paths) - ng} / 違反 {ng} / 警告 {warn_n}")
    sys.exit(1 if ng else 0)


if __name__ == "__main__":
    main()
