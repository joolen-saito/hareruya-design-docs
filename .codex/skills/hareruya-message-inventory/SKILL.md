---
name: hareruya-message-inventory
description: Build the Hareruya message inventory (メッセージ一覧) by deterministically extracting UI messages (flash / form validation / JS dialogs) from the ec-cube-enterprise source, resolving them against the Japanese locale, mapping each to a function, and embedding stable message IDs into the 表示メッセージ tables of the HTML/Markdown design documents. Uses codex + fable5 as critical, hallucination-guarding reviewers.
---

# Hareruya Message Inventory（メッセージ一覧）

## 目的

ec-cube-enterprise 実装に存在する **画面メッセージ**（フラッシュ / フォームバリデーション /
JS確認・警告ダイアログ）を抜け漏れ・捏造ゼロで一覧化し、各メッセージに安定IDを付与して、
対応する機能の HTML/Markdown 設計書の『表示メッセージ』表へ **間違いなく埋め込む**。

正本は常に `/home/y-saito/Developments/ec-cube-enterprise` の実ソース。文言は
`messages.ja.yaml` / `validators.ja.yaml` / 生文字列 / Twig 由来のみを使い、推測で埋めない。

## 出力

- `message_inventory/raw_messages.jsonl` … 抽出した全メッセージ（1行=1メッセージ、file:line付き）
- `message_inventory/message_inventory.tsv` … 9列メッセージ一覧（下記グレイン）
- 各機能docの `## 表示メッセージ` 表に付与された `メッセージID` 列

### 9列グレイン

```
メッセージID  画面  要素  トリガー（条件）  種別  どこに  要素(表示)  メッセージ内容  後続処理
```

補助列として `根拠(file:line)` `解決状態` を末尾に持つ。詳細は `references/TEMPLATE.md`。

## 種別・語彙の対応

`references/TERMINOLOGY.md` を参照（addSuccess→インフォ(成功) / addError・addDanger→エラー /
addWarning→警告 / addInfo→インフォ / constraint→エラー(バリデーション) / confirm→確認 / alert→警告）。

## ワークフロー

1. 決定的抽出（捏造ゼロの土台）:

```bash
cd /home/y-saito/Developments/hareruya-design-docs
python3 .codex/skills/hareruya-message-inventory/scripts/extract_messages.py           # → raw_messages.jsonl
python3 .codex/skills/hareruya-message-inventory/scripts/build_inventory.py             # → message_inventory.tsv
python3 .codex/skills/hareruya-message-inventory/scripts/extract_messages.py --stats    # 統計確認
```

2. 捏造ゼロ検証ゲート（**必須**。解決済み文言が実ソースに実在するか grep 照合）:

```bash
python3 .codex/skills/hareruya-message-inventory/scripts/validate_messages.py
```

3. codex + fable5 レビュー（ハーネス経由）。未解決（変数 `$message` / 連結）文言の確定、
   `トリガー（条件）`・`後続処理`・`要素` 列の確定、JS行の機能紐付けを、実ソース読取で行う。
   Workflow ハーネスは `.codex/message_inventory.js`（機能単位に codex 読取専用 → fable5 批判レビュー）。

4. 設計書への ID 埋め込み（決定的部分）＋ codex による残差の追記:

```bash
python3 .codex/skills/hareruya-message-inventory/scripts/embed_message_ids.py --all
```

5. 埋め込み整合＋捏造ゼロの再検証:

```bash
python3 .codex/skills/hareruya-message-inventory/scripts/validate_messages.py --check-embed
```

## 不変条件（レビューで守るもの）

- **捏造ゼロ**: `メッセージ内容` の固定リテラル部分は必ず実ソースに存在する。存在しなければ FAIL。
- **根拠必須**: 全行が `file:line` を持つ。
- **ID安定**: `メッセージID` は機能ID接頭（例 `M04-31-MSG-001`）または未割当 `EE-<area>-MSG-###`。再生成で不変。
- **抜け漏れ可視化**: 機能未割当・未解決は破棄せず `要ソース確認` / `EE-*` として明示（サイレント欠落禁止）。
- **埋め込み一致**: docに埋めた ID は一覧に実在し、行の日本語文言と一致する。

詳細な観点は `references/CHECKLIST.md`。
