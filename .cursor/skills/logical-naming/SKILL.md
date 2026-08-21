---
name: logical-naming
description: テストケース・オラクル・E2Eハーネスの記述で、翻訳キー・セッションキー・ルート名などの内部識別子とDB物理名を使わず、論理名（メッセージID＋表示文言、業務名）で表現する規約。物理名の併記も禁止し、対応は論理名対応表で管理する。混入は機械監査で検出する。
---

# 論理名規約（物理名を書かない）

## 目的

テストケース（顧客納品物）・オラクル・E2Eハーネスの記述は、**読み手が業務として読める語**で書く。実装内部でしか意味を持たない識別子（翻訳キー・セッションキー）や、DBの物理名は、読み手にとって参照先が無く、実装のリネームで意味を失う。

```
避ける: 処理フロー#6「セッション eccube.admin.order.search からクエリ」
書く  : 処理フロー#6「受注検索条件（セッション保持の検索条件）からクエリ」

避ける: 文言 admin.product.date_range_error を表示すること
書く  : 日付範囲エラー M05-01-MSG-012「終了日時は、開始日時より大きく設定してください」を表示すること

避ける: dtb_order.order_no が採番されること
書く  : 受注テーブルの受注番号が採番されること
```

## 対象

| 種別 | 物理名の例 | 論理名の作り方 |
| --- | --- | --- |
| 翻訳キー（メッセージ） | `admin.product.date_range_error` | 論理名対応表のメッセージID＋画面上の文言 |
| セッションキー | `eccube.admin.order.search` | そのセッションが保持する業務データ名（受注検索条件 など） |
| フラッシュキー | `eccube.admin.success` | 表示区分の業務名（成功フラッシュメッセージ） |
| ルート名（bind名） | `admin_order_export` | 画面名・操作名（受注CSV出力） |
| DBテーブル | `dtb_order` | 業務名（受注テーブル） |
| DBカラム | `dtb_order.order_no` | 業務名（受注テーブルの受注番号） |

## 対象外（物理のまま書く）

論理名を持たず、位置情報・実行値としてしか使えないもの。置き換えると実行できなくなる。

- HTMLセレクタ・フォーム項目のid/name（`#admin_search_order_order_datetime_start`）
- ソースの出典 `file:line`（`SearchOrderType.php:363`）
- HTTPパス・HTTPメソッド、コンソールコマンド名、環境変数名
- 実行されるSQL文、シード定義（`e2e/seed/`、`e2e/db/`）とスキーマ定義
- **Excel基本設計仕様書（正本）のセル文言**。変換器はExcel正本を忠実に写すのが役割で、HTML側で言い換えると正本とHTMLが食い違い、セル座標照合の前提が崩れる（2026-08-19 ユーザー決定。実例: `0203:表紙!B12`・`0203:納品書印刷（日本語）!Z96` の `dtb_base_info`）。物理名を消したい場合はExcel正本そのものを改訂する。
- ~~機能設計書の**DB定義節**~~（2026-08-19 廃止）。物理テーブル・列を列挙するDB関連の記述は機能設計書に書かない方針へ変更した。正本Markdownから外して `functions/_archive/` へ退避する。規約は [[output-exclusion-policy]] を正本とする。
- **物理名の差異そのものが仕様内容になっている箇所**（例: 保存側と読取側でセッションキーの接頭辞が違う＝不具合候補）。置き換えると事実が消えるため、`keep.tsv` に理由付きで登録して残す。

## 原則

- **併記も禁止**。「日付範囲エラー（実装キー: admin.product.date_range_error）」のような括弧書きも書かない。物理名との対応は論理名対応表 `e2e/config/logical-names.tsv` だけで管理する。
- **論理名を捏造しない**。対応表に無い物理名は、まず対応表へ出典付きで行を足して論理名を確定させる。確定できないものは `要確認` とし、テスト側は観測できる事実（「検索が実行されない」など）で判定を書く。
- **翻訳キーが未定義で画面に生キーが出る**場合は、その事実を不具合候補として書く。生キー文字列そのものを期待値に据えない（対応表では `状態=要確認`・`表示文言が未定義` として出る）。
- **オラクル独立性を壊さない**。論理名化は表現の規約であり、期待値の出どころ（設計書・観点表）は変えない。
- **既存資産は一括是正しない**。規約は新規・改修分に適用し、既存の混入はベースラインで棚卸しする（下記）。

## 論理名対応表

`e2e/config/logical-names.tsv`（6列: 物理名 / 種別 / 論理名 / 機能ID / 出典 / 状態）。

- メッセージキー行は `message_inventory/`（`raw_messages.jsonl` × `id_map.tsv` × `MESSAGE_LIST.tsv`）の結合で**決定的に生成**する。手編集しない。

  ```bash
  python3 .cursor/skills/logical-naming/scripts/build_logical_name_map.py --repo .
  ```

- セッションキー・ルート名・DB物理名の行は自動で決まらないため、`出典`（`file:line` または設計書のExcel座標）付きで追記する。出典の無い行は監査で落ちる。
- 同じ物理名が複数の論理名を持つのは正常（1つの翻訳キーを複数画面が使う）。機能IDで読み分ける。

## 既存文書の置き換え（apply）

対応表だけを根拠に、機能設計書Markdownの物理名を論理名へ置き換える。

```bash
python3 .cursor/skills/logical-naming/scripts/apply_logical_names.py --repo . \
  --docs-from-html "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html" \
  --keep .cursor/skills/logical-naming/keep.tsv --dry-run --report /tmp/apply.tsv
```

- `--docs-from-html` はExcel HTMLに埋め込まれている設計書だけを対象にする（ブック単位で進められる）。
- 対応表に無い物理名は**置き換えず未解決として報告**する。先に対応表へ出典付きで行を足す。
- 「翻訳キー `x`」のように物理名を指す語ごと言い換える形も扱う（→「メッセージ「…」」）。
- **捏造ゼロゲート**: 置換は (開始, 終了, 置換後) のスパンとして記録し、スパンを原文へ戻すと元のバイト列に完全一致することを検査する。一致しなければ書き出さず非ゼロ終了。差し替えた原文が物理名でない場合も落とす。
- 置き換え後は、その設計書を埋め込んでいるExcel HTMLを再統合する（`integrate_function_docs_into_excel_html.py`）。

## 監査（ハーネスに組み込み済み）

```bash
python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --selftest
python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo .
python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo . --report /tmp/naming.tsv
python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo . \
  --summary .cursor/skills/logical-naming/INVENTORY.md
cd e2e && npm run audit:naming        # 監査だけ
cd e2e && npm run selfcheck           # ハーネス自己検査（到達台帳＋論理名）
```

- 走査対象は `integration_test/`・`scenario_test/`・`e2e/`・`functions/`（`node_modules`・`test-results`・`playwright-report`・`reports`・シード/スキーマ・DB定義節・対応表そのものは除外）。Excel正本とその変換HTML（`excel_to_html/`）は改変禁止のため対象外。
- **ベースライン方式**: `.cursor/skills/logical-naming/baseline.tsv` に既存の混入を (ファイル, 物理名, 件数) で棚卸ししてある。監査はこれを超えた分＝**新規に増えた物理名だけ**を違反とし、非ゼロ終了する。
- 既存混入の内訳は [INVENTORY.md](INVENTORY.md)（`--summary` で再生成）。是正の着手順を決める材料に使う。
- 既存ファイルを是正して物理名が減った場合は `--update-baseline` で棚卸しを縮める（増やす方向に使わない）。
- 検出器の境界（セレクタ・`file:line`・SQLを誤検出しないこと）は `--selftest` で固定してある。仕様を変えるときは先にセルフテストへケースを足す。

## 適用範囲

このスキルが規約の正本。次から参照する。

- テストケース: [[e2e-test-cases]] / [[integration-test-cases]] / `hareruya-integration-test-cases` / `hareruya-scenario-test-cases`
- E2Eハーネス: `hareruya-playwright-standard-tests`（`e2e/pages`・`e2e/spec`・`e2e/helpers`・`e2e/fixtures`）

機能設計書（`functions/**/*.md`、[[reverse-design]] 系の生成物）は**本文が対象**で、DB定義節だけが例外（2026-08-13 ユーザー決定）。既存は一括是正せず、Excel設計書のブック単位で置き換えを進める。適用済み: 0203（受注管理）の27本。

Excel設計書（`excel_to_html/input/*.xlsx` とその変換HTML）は正本であり対象外。変換は原本の文言を改変しない規約（セル値カバレッジ100%を検証）なので、正本に物理名があってもそのまま出る。
