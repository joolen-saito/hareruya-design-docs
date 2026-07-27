# メッセージ一覧（ec-cube-enterprise UI メッセージ棚卸）

ec-cube-enterprise 実装に存在する画面メッセージ（フラッシュ / フォームバリデーション /
JS 確認・警告ダイアログ）を抜け漏れ・捏造ゼロで棚卸し、機能へ紐付け、安定 ID を付与して
設計書『表示メッセージ』表へ埋め込むための成果物。

生成・レビュー手順は `.codex/skills/hareruya-message-inventory/`（スキル）と
`.codex/message_inventory.js`（codex+fable5 ハーネス）を参照。

## 成果物

| ファイル | 内容 |
|----------|------|
| `message_inventory.tsv` | 9列メッセージ一覧（+ 根拠/解決状態/機能候補）。**主成果物** |
| `raw_messages.jsonl` | 抽出した全メッセージの中間データ（1行=1メッセージ、file:line 付き） |
| `MESSAGE_LIST.tsv` / `.md` | 正本∖`EE-*` の確定メッセージ一覧（`generate_message_list.py` で再生成） |
| `unconfirmed_messages.tsv` | 単一の逐語文言に確定できず**意図的に一覧から除外**した行の退避先（監査用） |
| `slices/<FID>.tsv` | 機能単位の入力スライス（codex/fable5 レビュー用） |
| `slices/<FID>.resolved.tsv` | codex 実ソース確定＋fable5 批判レビュー後の確定版 |

> `slices/` と `unconfirmed_messages.tsv` は**当時の作業記録**であり、正本ではない。
> 正本の各列を後段で確定させても遡って書き換えない（監査証跡のため）。
> したがって `slices/` には確定前の `要ソース確認` が残る。
> **`merge_slices.py` を古いスライスに対して再実行しないこと**（正本を退行させる）。

## 9列グレイン

```
メッセージID  画面  要素  トリガー（条件）  種別  どこに  要素(表示)  メッセージ内容  後続処理
```

末尾補助列: `根拠(file:line)` `解決状態` `機能候補(要検証)`。

## 現在の棚卸状況（2026-07-27）

- 総メッセージ数: **1,516**（割当済 **1,245** / 未割当 `EE-*` **271**）
  - 収録クラス: フラッシュ / フォームバリデーション / JS（confirm・alert・data-confirm/data-message・
    モーダル注入・トースト）/ twig `|trans` 直描画 / エラー系（PHP例外・JsonResponse直書き・twigハードコード）
- `MESSAGE_LIST`: **1,245件 / 193機能**（英訳 770件）
- **捏造ゼロ検証: PASS（非在 0 件）** — `validate_messages.py --check-embed` が exit 0
- **`要ソース確認` 残 0 件**（正本 `message_inventory.tsv` の全列・全成果物）

### `要ソース確認` の扱い（重要）

`要ソース確認` は「**これから実ソースを調べる**」ことを示す未調査フラグである。
調査の結果として次のような**結論**が出た項目に残してはならない（結論を書く）:

- 実行時可変で単一の逐語文言に確定できない → 候補を「／」区切りで全列挙、または本一覧から除外
- ロケール未定義キーがそのまま描画される → 表示文言＝キー文字列で確定
- デッドルート／到達不能ハンドラ・モーダル → 「該当なし（到達不能）＋根拠」
- 画面要素を持たないAPI・状態メッセージ → 「該当なし＋理由」
- 設計書が存在せず割当先が無い（`EE-*`） → 「未割当（理由）」

方針を説明する散文の中でもこの語を使わない（grep ゲートの偽陽性になる）。

### メッセージ内容列の唯一のルール

`メッセージ内容` に書けるのは次の二択だけ。

1. **実ソースに逐語で存在する固定リテラル**（`%name%` 等のプレースホルダは原文のまま保持）
2. **`要ソース確認`**（変数・例外由来・分岐で単一文言に確定できない場合）

散文説明（「例外由来の可変文言」等）・要約・敬体化・実行時値への差し替え
（`%maxRecord%` → `5010`）はすべて違反。散文の候補や理由は `解決状態` 列へ退避する。

## 捏造ゼロの担保

`メッセージ内容` の固定リテラルは必ず ec-cube-enterprise 実ソース
（`messages.ja.yaml` / `validators.ja.yaml` / 生文字列 / Twig）に逐語で存在する。
`validate_messages.py` が全解決済み行を grep 照合し、非在（言い換え・敬体化・要約・創作）を
FAIL とする。未解決（変数）は破棄せず `要ソース確認` として残し、codex/fable5 が確定する
（サイレント欠落・推測穴埋めの禁止）。

## 再生成手順

```bash
cd /home/y-saito/Developments/hareruya-design-docs
S=.codex/skills/hareruya-message-inventory/scripts
python3 $S/extract_messages.py          # 実ソース → raw_messages.jsonl
python3 $S/build_inventory.py           # → message_inventory.tsv（9列＋補助）
python3 $S/validate_messages.py         # 捏造ゼロ検証（必須ゲート）
python3 $S/embed_message_ids.py --all   # 設計書『表示メッセージ』表へ ID 列を付与（冪等）
python3 $S/validate_messages.py --check-embed  # 埋め込み整合＋捏造ゼロ
```

codex+fable5 による未解決確定・機能割当・列補完・欠落追記は Workflow ハーネスで:

```
Workflow({ scriptPath: ".codex/message_inventory.js", args: { fids: ["m04-31", "m11-01", ...] } })
```

## メッセージID体系

```
<機能ID>-MSG-<3桁>    例: M04-31-MSG-001, F06-14-MSG-002  … 設計書へ埋め込む
EE-<クラス名>-MSG-<3桁> 例: EE-JS-MSG-020, EE-BLOCK-MSG-002 … 機能未割当（codex が確定後に再採番）
```

連番は `根拠(file:line)` 昇順で安定採番。再生成で不変。
