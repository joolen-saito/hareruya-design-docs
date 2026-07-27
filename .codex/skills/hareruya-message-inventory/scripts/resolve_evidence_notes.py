#!/usr/bin/env python3
"""『根拠(file:line)』列に散文で残った「要ソース確認」を、実ソース再検証の結論へ置換する。

いずれも「未確認」ではなく **調査済みで確定した結論**（可変文言につき一意特定不能／
ロケール未定義キーがそのまま描画／デッドルートで到達不能 等）であり、
未解決フラグとしての「要ソース確認」を残すのは事実に反する。本スクリプトは
各行を実ソース根拠つきの断定文へ置き換える（冪等・メッセージ内容列は不変）。

再検証した実ソース（2026-07-27）:
  M04-01-MSG-009  StockListController.php:435-452 / stock_list_index.twig:478-479,795-813
                  → ルート admin_stock_list_bulk_edit_dispatch は twig/js 参照0件のデッドルート
  M04-13-MSG-045  admin.stock.split_join.destination_already_exists は locale 定義0件
                  → Symfony はキー文字列をそのまま描画（表示文言＝キー文字列で確定）
  M04-24-MSG-021  StockMoveInstructionDetailType.php:38-40 は Assert\\Length(max) のみで
                  maxMessage 未上書き、ee validators.ja.yaml に上書き0件
                  → vendor/symfony/.../validators.ja.xlf:79 が実効（M10-11-MSG-003 と同一根拠）
  他             catch した $e->getMessage() / $msg / $warning が実行時可変
                  → MESSAGE_LIST の既定規約どおり候補を「／」区切りで全列挙（各候補はソース逐語）

使い方:
  python3 resolve_evidence_notes.py --dry-run
  python3 resolve_evidence_notes.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

VARIABLE_NOTE = (
    "実行時可変のため単一の逐語文言を一意に特定できず、発生し得る候補を「／」区切りで全列挙する"
    "（各候補はソース逐語・実行時はいずれか1つのみ表示）"
)

# メッセージID -> (置換対象の部分文字列, 置換後)
FIXES: dict[str, tuple[str, str]] = {
    "M04-01-MSG-009": (
        "stock_list_index.twigの在庫一括編集はadmin_stock_bulk_approval_newへPOSTし空選択はJSでreturnするため(:795-813)当該dispatchルートに結び付く実UIは要ソース確認",
        "到達性=デッドルートで確定: ルート admin_stock_list_bulk_edit_dispatch は twig/js からの参照が非在"
        "（grep 0件）。一覧の #bulkEditBtn は data-url=path('admin_stock_bulk_approval_new') へ直接POSTし"
        "（stock_list_index.twig:478-479, :795-813）、空選択は JS が早期 return するため、"
        "現行UIから本メッセージへ到達する経路は存在しない",
    ),
    "M04-13-MSG-035": (
        "$e->getMessage()は可変のため要ソース確認",
        f"catch した $e->getMessage() をそのまま表示するため、{VARIABLE_NOTE}",
    ),
    "M04-13-MSG-045": (
        "admin.stock.split_join.destination_already_existsはmessages.ja.yaml未定義のため要ソース確認",
        "キー admin.stock.split_join.destination_already_exists は messages.ja.yaml／validators.ja.yaml とも"
        "定義0件（同キーは StockSplitController.php:422,433 でも使用）。未定義キーは Symfony が"
        "キー文字列をそのまま描画するため、表示文言＝キー文字列自体で確定する",
    ),
    "M04-13-MSG-054": (
        "例外メッセージキーが複数のため要ソース確認",
        f"例外メッセージキーが複数経路から発生するため、{VARIABLE_NOTE}",
    ),
    "M04-23-MSG-007": (
        "$msgは複数候補のため要ソース確認",
        f"$msg が複数候補を取るため、{VARIABLE_NOTE}",
    ),
    "M04-23-MSG-014": (
        "$msgは複数候補のため要ソース確認",
        f"$msg が複数候補を取るため、{VARIABLE_NOTE}",
    ),
    "M04-24-MSG-021": (
        "要ソース確認: src側でmessage未上書きのためSymfony標準訳が適用される見込み・実機未確認。",
        "確定: src側は Assert\\Length(['max' => 255]) のみで maxMessage を未上書き"
        "（StockMoveInstructionDetailType.php:38-40）、かつ ee 側 validators.ja.yaml に同キーの上書きが"
        "非在（grep 0件）のため vendor の Symfony 標準訳が実効。M10-11-MSG-003 と同一根拠。",
    ),
    "M05-18-MSG-003": (
        "$e->getMessage()は変数を含む例外文言のため要ソース確認。",
        "$e->getMessage() は sprintf で実行時値を埋める例外文言のため、%s を原文プレースホルダのまま保持し"
        "実行時値へは置換しない。",
    ),
    "M15-01-MSG-009": (
        "codex: 要ソース確認: DeckStoreAction.php:146-148およびDeckValidationService.php:62-82は複数の実行時警告を配列で返し、DeckController.php:319-325が変数$warningを表示する",
        "DeckStoreAction.php:146-148 および DeckValidationService.php:62-82 が複数の実行時警告を配列で返し、"
        f"DeckController.php:319-325 が変数 $warning を表示するため、{VARIABLE_NOTE}",
    ),
    "EE-JS-MSG-051": (
        "後続処理の「印刷予約・ステータス更新は行われない」断定はタイムアウト時にサーバ側更新が完走し得るため要ソース確認へ差し戻し",
        "後続処理の「印刷予約・ステータス更新は行われない」断定はタイムアウト時にサーバ側更新が完走し得るため撤回し、"
        "本行の後続処理は子ウィンドウ側の挙動（alert 表示後 window.close()）のみを記載する",
    ),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    i_evid = header.index("根拠(file:line)")

    out, changed, skipped = [lines[0]], 0, 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        fix = FIXES.get(row[0])
        if fix:
            old, new = fix
            if old in row[i_evid]:
                row[i_evid] = row[i_evid].replace(old, new)
                changed += 1
                print(f"{row[0]}: 置換")
            elif new in row[i_evid]:
                skipped += 1
            else:
                raise SystemExit(f"想定外: {row[0]} の根拠が既定の文面と一致しません")
            out.append("\t".join(row))
        else:
            out.append(line)

    残 = sum(1 for l in out[1:] if "要ソース確認" in l.split("\t")[i_evid])
    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"置換{changed} / 冪等skip{skipped} / 根拠列の残要ソース確認={残}"
          + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()
