---
name: hareruya-message-inventory
description: Build the Hareruya message inventory (メッセージ一覧) by deterministically extracting UI messages (flash / form validation / JS dialogs) from the ec-cube-enterprise source, resolving them against the Japanese locale, mapping each to a function, and embedding stable message IDs into the 表示メッセージ tables of the HTML/Markdown design documents. Reviews are codex-only, run as a two-stage adversarial audit followed by a reverse-bias verification pass.
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

3. codex レビュー（ハーネス経由）。未解決（変数 `$message` / 連結）文言の確定、
   `トリガー（条件）`・`後続処理`・`要素` 列の確定、JS行の機能紐付けを、実ソース読取で行う。
   Workflow ハーネスは `.codex/message_inventory.js`
   （機能単位に CodexResolve → AdversarialAudit → VerifyFixes の3段。すべて codex 読取専用）。

3b. `要ソース確認` の解消（列別・**フラグを消すのではなく結論を書く**）:

```bash
S=.codex/skills/hareruya-message-inventory/scripts
# A系(API): 画面を持たないため『どこに』『要素』は確定値。ExceptionListener→JsonResponse(code,errors) が根拠
python3 $S/resolve_api_display_position.py --dry-run   # → --apply
# 『根拠』列に散文で残った要ソース確認を、実ソース再検証の結論へ置換
python3 $S/resolve_evidence_notes.py --dry-run         # → --apply
# 『要素/要素(表示)/どこに/トリガー/後続処理』を codex 読取専用で確定 → 正本へ統合
python3 $S/codex_meta_driver.py --fids <fids.json> --out <dir>   # 4並列・disjointスライス推奨
python3 $S/merge_meta_results.py --results <dir> --dry-run       # → --apply
# 表セルは正本から同期（表単位・列数不変）
python3 $S/sync_doc_tables.py --dry-run                # → --apply
python3 $S/generate_message_list.py                    # MESSAGE_LIST.tsv/md 再生成
```

`merge_meta_results.py` は**現在値が `要ソース確認` の列だけ**を更新し、確定済みセルは不可侵。
codex が確定できなかった項目は据え置く（推測で埋めない）。

4. 設計書への ID 埋め込み（決定的部分）＋ codex による残差の追記:

```bash
python3 .codex/skills/hareruya-message-inventory/scripts/embed_message_ids.py --all
```

5. **検証ゲート（4本すべて通ること）**:

```bash
S=.codex/skills/hareruya-message-inventory/scripts
python3 $S/validate_messages.py --check-embed   # 捏造ゼロ(部分一致)＋ID整合
python3 $S/check_literal_strict.py              # 断片でないか(境界付き一致)
python3 $S/check_en_pairing.py                  # 英語が同一キーの対か（--apply で是正）
python3 $S/check_evidence_anchor.py             # 根拠が指す場所に文言/キーがあるか
```

**`validate_messages.py` だけでは不十分**。捏造検証は `grep -F` の**部分一致**なので、
より長い正しい文言の断片が PASS する。実際に切り詰め破損が1件すり抜けていた
（`admin.event.entry.paying_mem` ← 実キー `...paying_member_customer_not_registered`）。
`check_literal_strict.py`（境界付き一致）まで通して初めて捏造ゼロと言える。

6. **敵対的監査 → 逆バイアス二次検証**（内容の質を上げる段。ハーネス `.codex/message_inventory.js`）:

```bash
# 監査: 「捏造を摘発せよ」のバイアスで摘発（過剰検出を許容する）
python3 $S/codex_fabrication_audit_driver.py --slices <dir> --out <dir>
# 二次検証: 既定 refuted の逆バイアスで反証。反証できなかったものだけ是正値つきで確定
python3 $S/codex_meta_verify_driver.py --slices <dir> --out <dir>
python3 $S/apply_meta_fixes.py --results <dir> --dry-run --rejected rej.tsv   # → --apply
```

**監査結果をそのまま適用してはならない。** 実績で
fabrication 2件中1件 / wrong_en 37件中28件 / wrong_meta 187件中55件が偽陽性だった。
`apply_meta_fixes.py` は confirmed でも次を自動却下する:
内部用語の混入（利用者視点の規約を壊す。ただしその語が当該行の文言に実在するなら許可）/
多候補行の表示条件を列挙なしに一般化する提案 / 文言(ja/en)の変更提案。

## 正本の読み方（必ず守る）

正本 `message_inventory.tsv` は `"\t".join(cells)` の**生タブ区切り**で RFC4180 ではない。
`csv.DictReader` で読むと `"` 始まりの値（例 `"admin.hareruyamtg.com" is not allowed.`）の
引用符が食われ、**実データと違う文字列を検証してしまう**（2026-07-27 に5セルで実害を確認）。
読むときは必ず `lib_messages.read_master_rows()` を使うこと。

## 不変条件（レビューで守るもの）

- **捏造ゼロ**: `メッセージ内容` の固定リテラル部分は必ず実ソースに存在する。存在しなければ FAIL。
- **根拠必須**: 全行が `file:line` を持つ。
- **ID安定**: `メッセージID` は機能ID接頭（例 `M04-31-MSG-001`）または未割当 `EE-<area>-MSG-###`。再生成で不変。
- **抜け漏れ可視化**: 機能未割当・未解決は破棄せず `要ソース確認` / `EE-*` として明示（サイレント欠落禁止）。
- **`要ソース確認` は未調査フラグ**: 調査の結果「実行時可変につき一意特定不能」「ロケール未定義キーがそのまま描画」
  「デッドルートで到達不能」等の**結論が出た項目に残してはいけない**（結論を書く）。
  同様に、方針説明の散文で `要ソース確認` の語を使うと grep ゲートの偽陽性になるため使わない。
- **埋め込み一致**: docに埋めた ID は一覧に実在し、行の日本語文言と一致する。
  設計書mdに**退役IDを文字列で書かない**（`--check-embed` が [D] で FAIL する）。
- **英語は同一キーの対**: ja が複数ロケールキーに一致する行で**別キーの英語を流用**する事故が起きる。
  grep ゲートは「どこかに存在する」ので通ってしまう。`check_en_pairing.py` で機械検出する。
- **多候補行の表示条件は全候補を覆う**: 文言が「候補A ／ 候補B」形式の行で、
  1つの候補しか覆わない条件は誤り（元の値・codex提案の双方でこの誤りが実際に起きた）。
- **レビューは codex のみ**（2026-07-21 ユーザー指示。fable5 は使わない）。

詳細な観点は `references/CHECKLIST.md`。
