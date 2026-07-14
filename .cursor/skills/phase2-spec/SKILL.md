---
name: phase2-spec
description: Excel基本設計が「Ph2で対応するため、Ph1では実装しない」「フェーズ2以降で設計予定とする」としている機能・項目が、現行ソースからリバースした機能設計書に現行仕様として残っている問題を扱う。記述は消さずに残したうえで「フェーズ1では実装不要」と明示するための、検出・台帳・バナー描画・検証の手順。Ph2注記の洗い出し、台帳への判定記録、HTML設計書へのバナー反映、テスト生成側の除外リストとの同期検査に使用する。刷新後も実装しない「廃止」は superseded-spec の領分であり、本スキルはフェーズ延期だけを扱う。
---

# フェーズ2対応の明示スキル

## なぜ（背景）

Excel基本設計がフェーズ2対応としている機能は、フェーズ1では実装しない。ところが機能設計書は現行実装からのリバースなので、その機能を**現行仕様として書く**。埋め込まれた結果、読み手は「実装すべき仕様」と誤読する。[[superseded-spec]]（廃止）とまったく同じ失敗である。

実例（0302 グローバルナビ）: Excel は「通知はフェーズ2以降で設計予定とする」を**6シート**（PC版ナビ・スマホ版ナビ・支店PC版ナビ・支店スマホ版ナビ・通知・別添資料_通知一覧）に書いている。しかし `f02-05_front_global_nav_global_nav_notification.md` には Ph2 の記述が**1件も無かった**。

## 先行実装の何が不正確だったか

1. **検出器が図形注記しか見ていなかった。** `.codex/skills/hareruya-integration-test-cases/scripts/detect_ph2_features.py` は Excel の DrawingML（`xl/drawings/*.xml`）だけを走査するため、**セル本文に書かれたPh2注記を落とす**。0302 は6シートに注記があるのに2件しか拾えていなかった。生成HTMLは `excel_to_html/verify.py` の規則6（全図形テキストのHTML残存を機械強制）により**セル本文＋図形注記の検証済みスーパーセット**なので、HTML本文を読めば両方取れる。
2. **項目単位のPh2を表現できなかった。** 除外は「機能No単位のハードコード集合」でしか持てず、「ナビ機能はPh1だが、ナビ上の通知だけPh2」を表せなかった。
3. **設計書に伝わっていなかった。** 除外リストはテスト生成を止めるだけで、設計書を読む人には何も伝わらない。

## 原則

- **記述は消さない。** 現行実装のリバースとしての価値は残る。「フェーズ1では実装不要」と明示する。
- **廃止と混同しない。** 廃止は刷新後も実装しない。Ph2はフェーズ2で実装する。台帳を分ける。
- **スコープ2軸。** `FUNCTION_SCOPE`（機能まるごとPh2）と `ITEM_SCOPE`（機能はPh1、画面内の項目だけPh2）。ITEM_SCOPE を機能ごと除外してはならない。
- **除外リストとの同期を機械で守る。** 機能まるごとPh2は、テスト生成側の `EXCLUDED_FEATURE_IDS` にも載っていなければならない。載っていないと「設計書ではPh2なのにテストが作られる」。

## ハーネス（実行）

```bash
S=.cursor/skills/function-spec-html-render/scripts

python3 "$S/detect_phase2_specs.py" scan      # Ph2注記を洗い出す（HTML本文＝セル＋図形）
python3 "$S/phase2_specs.py"                  # 台帳の中身と定型句の一意性を確認
python3 "$S/integrate_function_docs_into_excel_html.py"   # バナーを反映（描画に組み込み済み）
cd excel_to_html && uv run python verify.py   # 検証

python3 "$S/detect_phase2_specs.py" baseline  # 初期在庫の退避（ratchet の起点。通常は再実行しない）
python3 "$S/detect_phase2_specs.py" check     # 新規のPh2注記だけを検出
```

## 台帳のスキーマ

`functions/phase2_specs.json` の `entries[]`。

| キー | 内容 |
|------|------|
| `id` | `書番-機能No`（機能Noが無いシートは `書番-シート識別`） |
| `book` / `bookTitle` / `sheets[]` | 根拠のExcel位置 |
| `featureNos[]` | 注記が書かれているシートの機能No。検出器の突合と、除外リスト同期検査に使う |
| `verdict` | `phase2` / `not-phase2`（偽陽性。`reason` 必須） / `needs-triage`（対象が特定できず未判定） |
| `scope` | `FUNCTION_SCOPE` / `ITEM_SCOPE` |
| `target` | Ph2対応の対象名 |
| `designQuote` | Excelの注記原文 |
| `affects[]` | `featureNo` と `doc`。ここに書いたmdにはフェーズ2対応の明記が必要 |
| `caveat` | Excelとtodo-listで機能Noが食い違う等の注意 |

`phase2` だけがバナーに描画される。`needs-triage` は描画されない（対象が特定できないまま「実装不要」と表示するのは危険なため）。

## 判定の勘所

- **注記が対象を名指ししているか。** 「・Ph2へ見送り」「Ph2にて対応」のように対象が書かれていない注記は、画面イメージ上のどこを指すか特定できない。**推測でバナーを出さず `needs-triage` に置く。**
- **機能まるごとか、項目だけか。** シート名が【新規】で始まり注記が機能名を名指ししていれば FUNCTION_SCOPE。既存画面の一部にだけ注記が付いていれば ITEM_SCOPE。
- **機能Noの食い違いに注意。** Excelのシートに書かれた機能Noが `functions/todo-list.md` と食い違うことがある（実例: 低価格帯カード価格変更CSVは Excel が出力・フォーマットの両シートを M03-44 と表記するが、todo-list では M03-43=出力 / M03-44=登録）。`caveat` に残す。

## 確認

- `cd excel_to_html && uv run python verify.py` が `VERIFY OK`。次を検査する。
  - 台帳に載る機能設計書の埋め込み節・単体プレビューにバナーが在る（**欠落は即NG**）
  - 台帳エントリの定型句が機能設計書Markdownに在る（台帳⇔md同期）
  - 機能まるごとPh2が、テスト生成側の `EXCLUDED_FEATURE_IDS` にも載っている（**同期しないと設計書ではPh2なのにテストが作られる**）
  - ベースラインにも台帳にも無い**新規**のPh2注記が無い（ratchet）
