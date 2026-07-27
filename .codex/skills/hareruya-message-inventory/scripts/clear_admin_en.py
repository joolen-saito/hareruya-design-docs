#!/usr/bin/env python3
"""管理画面(M系)メッセージの英語列を「（英訳なし）」へ統一する（冪等）。

## 根拠: 管理画面は日本語固定で英訳は画面に出ない
- `app/config/eccube/routes.yaml` の `admin_controllers` には `prefix: /{_locale}` も
  `_locale` の requirements/defaults も無い（front_controllers / block_controllers には
  `prefix: /{_locale}{_shop}` がある）。
- `src/Eccube/EventListener/InvalidLocaleRedirectListener.php:72-74` が管理画面パスを
  明示的にスキップする（「ルートパス、管理画面の場合は何もしない」）。
- 管理画面ルートに `_locale` セグメントを持つものは0件。管理画面に言語切替UIも無い。
→ `_locale` が設定されないため既定ロケールで解決され、**管理画面の画面メッセージに英語は出ない**。

`messages.en.yaml` 等に定義自体は実在するが、列名が『画面上の文言(英語)』である以上、
画面に出ない訳を載せているのは誤り。よって既存の慣例値「（英訳なし）」へ統一する
（ユーザー決定 2026-07-27）。除去した値は監査用に退避する（ロケール定義は実ソースから再取得可能）。

## 例外ガード
管理画面でも**英語帳票**は存在する（`admin_shipping_standby_print_delivery_slips` 等が
`{lang}` を `ja|en` で受け `@admin/ShippingStandby/delivery_slips.{lang}.twig` を描画する）。
根拠が `.en.twig` / `delivery_slips` / `{lang}` を参照する行は**対象外**とする。
※ 2026-07-27 時点で該当行は0件（m05-10 / m05-23 にメッセージ行が無い）。

使い方:
  python3 clear_admin_en.py --dry-run
  python3 clear_admin_en.py --apply
"""
from __future__ import annotations

import argparse
import csv
import re

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
BACKUP = L.DOC_ROOT / "message_inventory" / "admin_en_removed.tsv"
NO_EN = "（英訳なし）"
SKIP_VALUES = {"", NO_EN, "—", "-"}
ADMIN_ID = re.compile(r"^M\d")
# 英語帳票の経路を指す根拠は対象外
EN_DOC = re.compile(r"\.en\.twig|delivery_slips|\{lang\}")
MARKER = " / 管理画面のため英語列を非収録へ統一"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    i_en, i_ev, i_state = ic["メッセージ内容(英語)"], ic["根拠(file:line)"], ic["解決状態"]

    out, cleared, guarded, skipped = [lines[0]], 0, [], 0
    removed: list[dict] = []
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        if not ADMIN_ID.match(row[0]):
            out.append(line)
            continue
        cur = row[i_en].strip()
        if cur in SKIP_VALUES:
            skipped += 1
            out.append(line)
            continue
        if EN_DOC.search(row[i_ev]):
            guarded.append(row[0])
            out.append(line)
            continue
        removed.append({"メッセージID": row[0], "画面上の文言": row[ic["メッセージ内容"]][:80],
                        "除去した英語": cur, "根拠(file:line)": row[i_ev][:120]})
        row[i_en] = NO_EN
        if MARKER not in row[i_state]:
            row[i_state] = row[i_state] + MARKER
        cleared += 1
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
        if removed:
            with open(BACKUP, "w", encoding="utf-8", newline="") as fh:
                w = csv.DictWriter(fh, fieldnames=list(removed[0]), delimiter="\t")
                w.writeheader()
                w.writerows(removed)
            print(f"退避 {len(removed)}件 → {BACKUP.name}")

    print(f"M系の英語列: 統一{cleared} / 既に非収録{skipped} / 英語帳票ガード{len(guarded)}"
          + ("  (dry-run)" if not args.apply else ""))
    if guarded:
        print("  ガードした行:", ", ".join(guarded))


if __name__ == "__main__":
    main()
