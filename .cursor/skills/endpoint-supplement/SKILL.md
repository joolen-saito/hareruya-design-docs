---
name: endpoint-supplement
description: 基本設計仕様書HTMLの末尾に「実装差分追補」節を追補し、Controllerの本番利用routeと既存「利用者視点の入口」を突合して未記載の入口を補う。追補の「利用者視点の入口」は必ず3列の表組(<table>)で生成する。新規routeの追加、convert.py再変換後の追補復元、表組崩れの検出・修復に使用する。
---

# 実装差分追補スキル

## 目的

`excel_to_html/output/*基本設計仕様書*.html` の末尾に **「実装差分追補」** 節を持たせる。
この節は Controller の本番利用 route と既存の「利用者視点の入口」を突合し、
利用者が画面操作・ファイル出力・外部API呼び出しとして到達する入口のうち、
本文に未記載のものを追補したものである。Block内部描画や CORS 用 OPTIONS は含めない。

追補節は `<!-- endpoint-supplement:start -->` 〜 `<!-- endpoint-supplement:end -->`
で囲まれた `<section class="endpoint-supplement">` であり、先頭に
`<h2 id="endpoint-supplement-user-entry">利用者視点の入口</h2>` の表を持つ。

## 不変条件（最優先）

- **「利用者視点の入口」は必ず3列の表組(`<table>`)で出力する。** 箇条書き(`<ul>`/`<ol>`)・
  段落(`<p>`)・整形済みテキスト(`<pre>`)で出力してはならない。
- 列は固定で **入口 / URLエンドポイント / 期待されるふるまい** の3列とする。
- 追補節のうち本スキルが所有するのは **「利用者視点の入口」テーブルと、追補テーブルの装飾CSS**。
  同節に手書きの小節（調査補助・処理フロー等）がある場合、それらには手を加えない。
- **追補テーブルは本文テーブルと同じ装飾にする。** 本文の表CSSは `.function-design-body` 配下に
  スコープされており追補節（`.endpoint-supplement`）には当たらないため、`build` が
  `.endpoint-supplement` 用の同等CSL（枠線・角丸・ヘッダ帯・ゼブラ）を `<style>` 内へ
  `/* endpoint-supplement-style:start/end */` で自己完結注入する。CSS変数（`--line` 等）は
  convert.py 基底 `:root` で常に定義されるため埋め込みの有無に依存しない。
- 正本はあくまで route 突合データ（`endpoint_reports/`）であり、HTML側で入口を創作しない。

## データソース

- `endpoint_reports/html_entry_missing_endpoints_recheck.csv`
  実装にあってHTML未記載の route 一覧。列は `section,method,path,route_name,feature,evidence,note`。
  `section == Block内部` と `method == OPTIONS` は追補対象外。
- `endpoint_reports/endpoint_supplement_data.json`
  各HTMLの「利用者視点の入口」行スナップショット（正本化された表セル）。`extract` で生成する。

## 表セルの導出規約

`recheck.csv` の1行から表セルを次のとおり導出する（`build_endpoint_supplement.py rows` で確認できる）。

- **入口** = `feature` の末尾句点(`。`/`.`)を除いた文字列 ＋ 種別サフィックス。
- **URLエンドポイント** = `` `METHOD path` ``（バッククォート囲み）。
- **期待されるふるまい** = メソッドと種別ごとの定型文。

種別は path・route_name・feature から判定する（export/csv/download/pdf/xls→ファイル出力、
json/ajax/api→JSON-API、それ以外→画面）。

| メソッド | 種別 | サフィックス | 期待されるふるまい |
|------|------|------|------|
| GET | 画面 | を開く | 指定された画面または対象データを表示する。 |
| GET | ファイル | を出力する | 利用者操作に応じて対象ファイルを出力する。 |
| GET | JSON | を取得する | 指定条件に応じたデータをJSON等のレスポンスで返す。 |
| POST | 画面 | を実行する | 利用者の送信内容を処理し、処理結果を画面に反映する。 |
| POST | JSON | を実行する | リクエスト内容を処理し、JSON等のレスポンスで結果を返す。 |
| PUT | 画面 | を更新する | 利用者の送信内容を処理し、処理結果を画面に反映する。 |
| PUT | JSON | を更新する | リクエスト内容を処理し、JSON等のレスポンスで結果を返す。 |
| DELETE | - | を削除する | 削除操作を実行し、処理結果を画面に反映する。 |

## ハーネス（実行）

同梱スクリプト `scripts/build_endpoint_supplement.py` を使う。生成経路は
`render_user_entry_table()` のみであり、ここを通る限り出力は必ず表組になる。

```bash
S=.cursor/skills/endpoint-supplement/scripts/build_endpoint_supplement.py

# 1) 現行HTMLの入口行を正本JSONへスナップショット（初回・行を確定したとき）
python3 "$S" extract

# 2) 入口テーブルを各HTMLへ冪等に再適用（表組崩れの修復／convert再変換後の復元）
python3 "$S" build

# 3) 全HTMLの追補「利用者視点の入口」が表組であることを検査
python3 "$S" verify

# 補助: recheck.csv の1行から入口行の導出結果を確認（新規route追加時）
python3 "$S" rows --grep customer/customer_group
```

- `build` は入口見出し直後の本文ブロックが表でも崩れた `ul`/`ol`/`p`/`pre` でも掴んで
  表組へ置き換え、さらに追補テーブルの装飾CSSを `<style>` へ冪等注入する。
  正常系（既に表＋CSS適用済み）では差分ゼロで冪等。
- 入口行を増減するときは正本JSON `endpoint_reports/endpoint_supplement_data.json` を編集して
  `build` する。新規 route は `rows` で導出した行を貼り、`build` で反映する。

## convert.py 再変換との関係

`excel-to-html` / `function-spec-html-render` で Excel HTML を再生成すると、後段で
注入した追補節は失われる。再変換後は本スキルの `build` を実行して追補節の入口テーブルを
復元すること。順序は「convert → 各種統合 → endpoint-supplement build → verify」。

## 確認

- `python3 "$S" verify` が OK（全ファイルで入口が `<table>`）。
- `cd excel_to_html && uv run python verify.py` の追補チェックが NG を出さないこと
  （`verify.py` に「利用者視点の入口」表組チェックを内蔵済み）。
- 追補の入口列が常に 入口 / URLエンドポイント / 期待されるふるまい の3列であること。
- 追補テーブルの装飾（枠線・角丸・ヘッダ帯・ゼブラ）が本文テーブルと揃っていること
  （`/* endpoint-supplement-style:start */` が各HTMLに存在）。
- 手書き小節（調査補助等）が `build` で消えていないこと。
