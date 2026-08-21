---
name: integration-test-cases
description: >-
  Builds integration test cases as tab-separated tables; output saves under .cursor/design/integration_test/ from reverse-design Markdown under .cursor/design/functions/ and viewpoints in .cursor/docs/テスト観点.md. TSV columns I/FID=関連ID and テスト観点=観点 column from that file (not IF-xxx or I/F種別). Expectations are one judgment per row; test item names are specific per row. Produces Excel or Google Sheets paste-ready TSV. Use when the user asks for 結合試験, integration tests, IT cases, test perspectives mapped to cases, or TSV test matrices from design docs.
disable-model-invocation: true
---

# 結合試験テストケース TSV 出力

リバース詳細設計書とテスト観点を入力とし、結合試験用のテストケースを Markdown にまとめる。設計書はスコープ整理・用語の参照に使い、**期待結果は「設計書の記載どおり」ではなく観測可能な挙動・試験計画・要件合意・実装確認値で書く**（[TERMINOLOGY.md](TERMINOLOGY.md)）。

## 正典

- 用語・**1行1判定**のルールは [TERMINOLOGY.md](TERMINOLOGY.md) に合わせる（「期待結果とテスト項目名」節を必ず読む）。
- 出力の骨格は [TEMPLATE.md](TEMPLATE.md) に従う。
- 網羅とセルフチェックは [CHECKLIST.md](CHECKLIST.md) をすべて確認する。
- TSV のクォート・10列整合は [scripts/format_tsv.py](scripts/format_tsv.py)。**期待結果の行分割**は [scripts/expand_expect_rows.py](scripts/expand_expect_rows.py)。**テスト項目名の具体化**は [scripts/refine_test_item_names.py](scripts/refine_test_item_names.py)。
- 設計書の粒度・禁止事項は reverse-design の [SKILL.md](../reverse-design/SKILL.md) を参照。本 Skill は設計書を書き換えない。

## TSV 列（10列・1行目ヘッダ）

| 列名 | 内容の正 |
|------|----------|
| 機能名 | 元設計の表示名（例 `管理画面_認証機能`）。各データ行の先頭列に同一値を入れる |
| テストID | 機能内で一意（例 `IT-ADMIN-LOGIN-001`）。行分割後は通し採番し直す |
| I/FID | `.cursor/docs/テスト観点.md` の **関連ID**（例 `IT-04`） |
| テスト観点 | 同ファイルの **観点** 列をそのまま（TSV 列名は `テスト観点`） |
| 優先度 | `P1`／`P2`／`P3` のみ |
| テスト項目名 | 当該行の判定が分かる一文（[TERMINOLOGY.md](TERMINOLOGY.md)） |
| 期待結果／レスポンス | **1行1判定**。観測・判定可能な一文 |

本 Skill の TSV には **テストレベル列を出力しない**（Gherkin エクスポートの IT1/IT2 は `.cursor/test/stock/` を参照）。

## 手順

1. 入力を確認する。通常は `functions/todo-list.md` の各行にある機能No付きHTMLリンクと `integration_test/integration-test-viewpoints.md`。出力は `integration_test/<機能No小文字>_<機能識別子>_it_cases.md`。`excel_to_html/output/*.html` のような親Excel HTMLからは生成しない。
2. 機能境界と対象外観点を分ける。関連ID・観点はテスト観点.md から選び、「関連ID対応概要」に一覧する。
3. 初稿 TSV を書く（複数期待を1セルにまとめてもよいが、次工程で分割する）。
4. **期待結果の行分割**（[TERMINOLOGY.md](TERMINOLOGY.md) の分割／非分割表に従い目視調整）:
   - 機械分割: `expand_expect_rows.py`（文末 `・` 境界。UI要素の並列は手で追加行化）
   - 分割後はテストIDを `001` から通し採番。旧→新対応表は作らない（トレース表の ID は手で更新）
5. **テスト項目名の具体化**: `refine_test_item_names.py` のあと、不自然な行は `MANUAL` 相当で手直し。
6. `format_tsv.py` で整形し、`format_tsv.py --check` で検証。
7. [CHECKLIST.md](CHECKLIST.md) を確認。トレース表の証跡 ID を新しい `テストID` に合わせる。

## 期待結果の書き方（要約）

| 書き方 | 推奨 |
|--------|:----:|
| 1データ行に期待結果1つ | ◎ |
| 複数期待を1セルに `・` や改行で列挙 | × |
| 画面・HTTP・DB・遷移は別行 | ◎ |
| ログインID欄／パスワード欄／送信ボタンなど独立UI確認は別行 | ◎ |
| 名詞並列のみの「ログインID・パスワード」（1観測） | 1行で可 |

## スクリプト

リポジトリルートで実行する。順序は **expand → refine → format → check**。

```bash
# 期待結果を行分割（--dry-run で件数確認）
python3 .cursor/skills/integration-test-cases/scripts/expand_expect_rows.py \
  .cursor/design/integration_test/<機能>_it_cases.md --dry-run
python3 .cursor/skills/integration-test-cases/scripts/expand_expect_rows.py \
  .cursor/design/integration_test/<機能>_it_cases.md

# テスト項目名を期待結果に合わせて具体化
python3 .cursor/skills/integration-test-cases/scripts/refine_test_item_names.py \
  .cursor/design/integration_test/<機能>_it_cases.md

# TSV 整形・検証
python3 .cursor/skills/integration-test-cases/scripts/format_tsv.py \
  .cursor/design/integration_test/<機能>_it_cases.md
python3 .cursor/skills/integration-test-cases/scripts/format_tsv.py \
  .cursor/design/integration_test/<機能>_it_cases.md --check
```

I/FID・テスト観点列の一括整合（既知マッピングがある場合）:

```bash
python3 .cursor/skills/integration-test-cases/scripts/align_viewpoint_columns.py \
  .cursor/design/integration_test/<機能>_it_cases.md
```

対象は Markdown 内の最初の ` ```tsv ` フェンスのみ。

## 項目書 Markdown の定型文

[TEMPLATE.md](TEMPLATE.md) の「テストケース TSV」節にある説明文を、各 `*_it_cases.md` の TSV 直前に置く。少なくとも次を含める。

- 期待結果は **1行1判定**
- テスト項目名は行ごとに具体化。分割行は前提・操作を繰り返してよい
- 手編集後は `format_tsv.py --check`

## 追加リソース

- [[logical-naming]]（物理名を書かない・論理名対応表・混入監査）
- [TERMINOLOGY.md](TERMINOLOGY.md)
- [TEMPLATE.md](TEMPLATE.md)
- [CHECKLIST.md](CHECKLIST.md)

## Hareruya設計書リポジトリでの生成方針

- `functions/todo-list.md` の `詳細設計書` 列にある `[html](...)` リンクを正とし、機能Noに対応するHTMLから生成する。
- 生成ファイル名は `m01_01_..._it_cases.md` のように機能Noを小文字化し、ハイフンをアンダースコアへ変換した接頭辞で始める。
- `case_*_it_cases.md` は、機能Noを特定できない親HTMLや日本語ファイル名HTMLから生成されたフォールバック名であり、正規成果物として残さない。
- `excel_to_html/output/*.html` は基本設計書グループの閲覧HTMLであり、個別機能の結合試験ケース生成入力にしない。
- 決定論ジェネレータ本体は `.codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py`。生成ルール（DB書込み観点の本文・`### DB操作` 検出、通知/WebSocketの除外、`--only` 部分再生成）は同 SKILL.md を正とする。本 Skill の `expand_expect_rows.py`／`refine_test_item_names.py`／`format_tsv.py` は生成後の整形・検証に用いる。
- ケースの網羅性は設計書の網羅性に依存する。生成前提として、元設計書が `.cursor/skills/reverse-design/SOURCE-COVERAGE-CHECKLIST.md`（ソース↔設計書 双方向網羅）を満たしていること。満たさない場合はまず設計書を是正する。
