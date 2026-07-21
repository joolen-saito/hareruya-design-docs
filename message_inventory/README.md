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
| `slices/<FID>.tsv` | 機能単位の入力スライス（codex/fable5 レビュー用） |
| `slices/<FID>.resolved.tsv` | codex 実ソース確定＋fable5 批判レビュー後の確定版 |

## 9列グレイン

```
メッセージID  画面  要素  トリガー（条件）  種別  どこに  要素(表示)  メッセージ内容  後続処理
```

末尾補助列: `根拠(file:line)` `解決状態` `機能候補(要検証)`。

## 現在の棚卸状況（決定的抽出＝Stage1）

- 総メッセージ数: **1,023**
  - フラッシュメッセージ 815 / フォームバリデーション 101 / JS(確認18・警告89) 107
- 種別: エラー 538 / インフォ(成功) 246 / 警告 107 / バリデーション 101 / 確認 18 / インフォ 13
- 機能割当済 **605** / 未割当(EE-*) 418（うち機能候補ヒント付 203）
- 未解決（`$message` 等の変数・連結。**codex が実ソースで確定**）: 234
- **捏造ゼロ検証: PASS**（解決済み 789 件すべて実ソースに逐語存在。`validate_messages.py`）

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
<機能ID>-MSG-<3桁>    例: M04-31-MSG-001, F06-14-MSG-003  … 設計書へ埋め込む
EE-<クラス名>-MSG-<3桁> 例: EE-JS-MSG-020, EE-BLOCK-MSG-002 … 機能未割当（codex が確定後に再採番）
```

連番は `根拠(file:line)` 昇順で安定採番。再生成で不変。
