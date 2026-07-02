# 第2パイロット報告: M04-03 在庫一括編集（カスタマイズ）

実施日: 2026-06-19 / 目的: 非標準（カスタマイズ）機能で、分類別ソースマージ手順とソース↔設計書 網羅性チェックリストを実証する。

## 対象と分類別ルートの実証

| 項目 | 内容 |
|------|------|
| 機能 | M04-03 在庫一括編集（管理画面・在庫管理） |
| カスタマイズ区分 | カスタマイズ |
| 挙動の正（現行リポ） | `pf-eccube3`（HareruyaEc プラグイン、直接更新型） |
| DB操作の正 | **ec-cube-enterprise**（承認ワークフロー型） ← ユーザー指示「DB操作はeceを正」 |
| Excel基本設計 | 0202 在庫管理機能（重複項目はExcel優先=1b-1） |
| 正本 | `functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md` |

これにより、login（標準＝ec-cube-enterprise のみ）では通らなかった **現行リポ基準＋Excel優先＋DB=ec-cube-enterprise正典** の経路を実証した。

## チェックリスト適用で検出した重大ギャップ（DB=ece）

`SOURCE-COVERAGE-CHECKLIST.md` の B/D を適用した結果、**設計書のDB操作が実装(ece)と構造的に不一致**であることを検出した。

- 旧記述（直接更新型）: 送信時に全対象規格の `dtb_product_class.stock` / `dtb_product_stock.stock` を即時更新し、`dtb_stock_history` を都度作成 ＝ これは現行(pf-eccube3)の挙動。
- ec-cube-enterprise 実装（承認ワークフロー型、`StockBulkApprovalStoreAction.php`）:
  - 登録時に `dtb_stock_edit_approval`／`dtb_stock_edit_approval_detail`／`dtb_stock_approval_list` を作成（approval_status=未承認、history_source_type_id=STOCK_BULK_EDIT=2）。**在庫は即時更新しない。**
  - L133「廃棄の場合のみ、在庫情報の更新を行う」→ 廃棄区分のときだけ `dtb_product_stock` を即時更新し `dtb_stock_history` を作成（STOCK_EDIT）。
  - 検証根拠: `StockBulkApprovalStoreAction.php:58-100,133`、`Entity/DtbStockEditApproval.php`他、`Master/MtbStockHistorySourceType.php:28`。

## 是正内容

- 「リニューアル移行時の扱い」に **永続化モデル差異**（直接更新型→承認ワークフロー型）の行と解説を追加。
- DBカラム表に承認系3テーブルを追加。`dtb_stock_history` は移行先では「廃棄時のみ作成」と明記。
- **`### DB操作` 節を新設**（ec-cube-enterprise 正典＝承認ワークフロー）。現行(pf-eccube3)の直接更新型は補足として併記。
- 調査補助に ec-cube-enterprise のソース索引（file:line）を追加。

## 再生成・検証

- 機能詳細HTML再生成（`function_spec_html_preview/pf-eccube3/m04-03_...html`）。
- Excel統合再生成 → `0202_...html` に承認ワークフロー記述が反映（確認済み）。
- IT cases再生成（`--only m04-03`）: 90行、`format_tsv --check` exit 0、DB書込観点(IT-23/26) 32件。
- 混入: 実タブ0・識別ID0。

## 結論と横展開

手順は非標準機能でも有効に機能し、**DB=ece ルールが実装との重大な構造差（承認ワークフロー）を検出・是正できる**ことを実証した。残作業:

- 在庫管理モジュールの他の現行踏襲/カスタマイズ機能（M04-03のほか8件: M04-05/11/16/17/18/19 等）への同手順適用。
- 各機能で `SOURCE-COVERAGE-CHECKLIST.md` を実施し、DB操作はec-cube-enterprise（在庫は承認ワークフローが広く該当する可能性が高い）を確認すること。
