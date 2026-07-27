#!/usr/bin/env python3
"""codex が確定できず据え置いた『要素』を、実ソース再検証の結論で確定する（冪等）。

いずれも「未調査」ではなく **操作要素が実在しないことを確認した** 4件。
利用者が操作する画面要素が無いこと自体が結論なので「該当なし＋理由」を記す。

再検証した実ソース（2026-07-27）:
  M05-01-MSG-023  admin/Order/index.twig:1330 に #bulkDeleteModal 定義があるが、同ファイル・
                  admin配下とも data-bs-target="#bulkDeleteModal" も #btn_bulk_delete の
                  ハンドラも非在（他画面 Product/index.twig:497 等には実在）→ 到達不能モーダル
  M04-09-MSG-096  admin/Stock/move_complete.twig:137 完了画面の明細0件時に描画される状態メッセージ
  F03-01-MSG-001  default/Product/list.twig:586-589 / ProductController.php:140-145
                  存在しないカテゴリIDを含むURLでの一覧表示時に描画される状態メッセージ
  M03-01-MSG-002  admin/Product/index.twig:158-176 の alert('Failed')。ハンドラは
                  `table.table button[data-class-url]` への委譲だが、`data-class-url` 属性を持つ
                  要素が src/app/html のどこにも存在しない（grep はハンドラ2箇所のみ）→ 到達不能
  F07-04-MSG-001  default/Event/payment_cancel.twig:24。EventEntryController.php:255-269 が
                  外部決済(SLNLink)の EncryptValue 空 / ResponseCd != 'OK' で本画面へリダイレクト
                  → 操作は外部決済サイト側で行われ ee 内に操作要素は存在しない

使い方:
  python3 resolve_residual_elements.py --dry-run
  python3 resolve_residual_elements.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

FIXES: dict[str, str] = {
    "M05-01-MSG-023": (
        "該当なし（到達不能モーダル）: admin/Order/index.twig:1330 に #bulkDeleteModal の定義はあるが、"
        "同ファイル・admin配下とも data-bs-target=\"#bulkDeleteModal\" および #btn_bulk_delete の"
        "ハンドラが非在のため、本モーダルを開く操作要素が存在しない"
    ),
    "M04-09-MSG-096": (
        "該当なし（状態メッセージ）: 在庫移動完了画面（admin/Stock/move_complete.twig:135-139）の"
        "表示時に明細0件で描画されるため、利用者が操作する要素は存在しない"
    ),
    "F03-01-MSG-001": (
        "該当なし（状態メッセージ）: 存在しないカテゴリIDを含むURLで商品一覧を開いたときに"
        "描画される（default/Product/list.twig:586-589 / ProductController.php:140-145）ため、"
        "利用者が操作する要素は存在しない"
    ),
    "M03-01-MSG-002": (
        "規格確認ボタン（委譲セレクタ table.table button[data-class-url]、#productClassesModal 用）"
        "※ただし当該属性を持つ要素は src/app/html のいずれにも描画されない"
        "（grep はハンドラ定義2箇所のみ）＝到達不能で、この alert('Failed') を発火させる操作要素は実在しない"
    ),
    "F07-04-MSG-001": (
        "該当なし（外部サイト起点）: 外部決済(SLNLink)からの復帰時に EncryptValue 空または "
        "ResponseCd != 'OK' で本画面へリダイレクトされる（EventEntryController.php:255-269）ため、"
        "ec-cube-enterprise 内に操作要素は存在しない"
    ),
}
MARKER = " / 要素=該当なし確定(実ソース再検証)"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    i_elem = header.index("要素")
    i_state = header.index("解決状態")

    out, changed, skipped = [lines[0]], 0, 0
    seen = set()
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        new = FIXES.get(row[0])
        if new:
            seen.add(row[0])
            if "要ソース確認" in row[i_elem]:
                row[i_elem] = new
                if MARKER not in row[i_state]:
                    row[i_state] = row[i_state] + MARKER
                changed += 1
                print(f"{row[0]}: 要素を確定")
            elif row[i_elem] == new:
                skipped += 1
            else:
                raise SystemExit(f"想定外: {row[0]} の要素が既定値でない -> {row[i_elem][:60]}")
            out.append("\t".join(row))
        else:
            out.append(line)

    missing = set(FIXES) - seen
    if missing:
        raise SystemExit(f"正本に不在のID: {sorted(missing)}")
    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"確定{changed} / 冪等skip{skipped}" + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()
