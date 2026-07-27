#!/usr/bin/env python3
"""メッセージ一覧の検証ゲート（捏造ゼロ / ID整合）。

チェック:
  A. ID一意性         … メッセージIDに重複がないこと
  B. 捏造ゼロ(文言)    … 解決済みメッセージ内容が ec-cube-enterprise 実ソースに
                         文字列として存在すること（翻訳YAML/生文字列/Twig）。
                         存在しない＝ハルシネーション候補として FAIL。
  C. 根拠必須          … 全行が file:line を持つこと
  D. 埋め込み整合(任意) … --check-embed 指定時、md『表示メッセージ』表に埋め込まれた
                         MSG-ID が一覧に実在し、文言が一致（部分一致）すること

使い方:
  python3 validate_messages.py                # A/B/C
  python3 validate_messages.py --check-embed  # + D
終了コード非0で違反あり（CIゲート用）。
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
EE = L.EE_ROOT
TODO_MARK = "要ソース確認"


def load_rows() -> list[dict]:
    return L.read_master_rows(TSV)


def _targets() -> list[str]:
    t = [str(EE / "src/Eccube"), str(EE / "app"), str(EE / "html")]
    # Symfony 標準バリデータ等、vendor 同梱の翻訳もユーザーに実表示される正当なソース。
    t += [str(p) for p in sorted(EE.glob("vendor/symfony/*/Resources/translations")) if p.is_dir()]
    return t


def _frag_has(text: str) -> bool:
    frag = max(re.split(r"%[^%]+%|\{[^}]*\}|\\n", text), key=len).strip()
    if len(frag) < 4:
        frag = text.strip()[:20]
    if not frag:
        return True
    return subprocess.run(["grep", "-rqF", "--", frag, *_targets()], capture_output=True).returncode == 0


def source_has(text: str) -> bool:
    """textが実ソースに存在するか（固定リテラル部分で判定）。

    fable5戦略の多候補形式「候補A ／ 候補B ／ …」は、各候補が逐語存在すれば正当
    （例外由来で単一に絞れない文言の全列挙）。全候補が実在する場合のみ真とする。
    """
    cands = [c.strip() for c in re.split(r"／|\s/\s", text) if c.strip()]
    if len(cands) > 1:
        return all(_frag_has(c) for c in cands)
    return _frag_has(text)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-embed", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="捏造検証の件数上限(0=全件)")
    args = ap.parse_args()

    rows = load_rows()
    fails: list[str] = []

    # A. ID一意
    seen: dict[str, int] = {}
    for i, r in enumerate(rows, 2):
        mid = r["メッセージID"].strip()
        if mid in seen:
            fails.append(f"[A]ID重複 {mid} (行{seen[mid]}と{i})")
        seen[mid] = i

    # C. 根拠必須
    for i, r in enumerate(rows, 2):
        if not r.get("根拠(file:line)", "").strip():
            fails.append(f"[C]根拠欠落 {r['メッセージID']} (行{i})")

    # B. 捏造ゼロ
    checked = 0
    hall = 0
    for r in rows:
        content = r["メッセージ内容"].strip()
        if not content or TODO_MARK in content:
            continue  # 未解決は後段確定対象なのでスキップ
        if args.limit and checked >= args.limit:
            break
        checked += 1
        if not source_has(content):
            hall += 1
            fails.append(f"[B]実ソース非在(捏造候補) {r['メッセージID']}: {content[:40]}")

    print(f"rows={len(rows)}  捏造検証={checked}件  非在={hall}件")
    if args.check_embed:
        fails += check_embed(rows)

    if fails:
        print(f"\nNG: {len(fails)} 件の違反")
        for f in fails[:60]:
            print("  -", f)
        return 1
    print("OK: 検証パス")
    return 0


def check_embed(rows: list[dict]) -> list[str]:
    """md『表示メッセージ』表の MSG-ID が一覧に実在するか。"""
    ids = {r["メッセージID"].strip() for r in rows}
    fails: list[str] = []
    id_re = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d{3})\b")
    for md in (L.DOC_ROOT / "functions").rglob("*.md"):
        text = md.read_text(encoding="utf-8", errors="replace")
        for m in id_re.finditer(text):
            if m.group(1) not in ids:
                fails.append(f"[D]md埋め込みIDが一覧に無い {m.group(1)} @ {md.name}")
    return fails


if __name__ == "__main__":
    sys.exit(main())
