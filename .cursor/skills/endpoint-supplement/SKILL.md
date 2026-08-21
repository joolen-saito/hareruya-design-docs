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

## 出力除外規約（2026-08-12 ユーザー決定・最優先）

**「実装差分追補」節はHTML設計書へ出力しない。** 規約の正本は [[output-exclusion-policy]]、実装は
`build_endpoint_supplement.py` の `RENDER_ENDPOINT_SUPPLEMENT = False`。この規約が有効な間、各コマンドの役割は次のとおり。

- `build` = 掃除役。output HTML から追補節（`endpoint-supplement:start/end`）と装飾CSS
  （`endpoint-supplement-style:start/end`）を取り除く（冪等）。
- `verify` = 追補節が**どのHTMLにも存在しないこと**を検査する。残っていればNG。
  `excel_to_html/verify.py` も同じフラグを import して同じ判定を行う（二重定義しない）。
- `extract` = **実行を拒否する**。HTMLに節が無い状態で走らせると正本スナップショット
  （`endpoint_supplement_data.json` / `endpoint_supplement_sections.json`）を空で上書きし、
  復元不能になるため。
- route突合の正本（`endpoint_reports/` のCSV・data JSON・sections JSON）は**消さずに保持する**。
  除外はHTML表示だけの措置で、入口の情報は正本側に残る。
- 再びHTMLへ出したくなったら `RENDER_ENDPOINT_SUPPLEMENT = True` に戻し、`build` を実行すれば
  sections JSON のスナップショットから節ごと復元できる。以下の不変条件はそのときの規約である。

## 不変条件（`RENDER_ENDPOINT_SUPPLEMENT = True` のとき）

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
- **`endpoint_supplement_data.json` に載っているHTMLは追補節を必ず持つ。** 節の欠落は `verify` が
  NG とする。convert.py の再変換は追補節を丸ごと落とすため、「節が無ければ検査対象外」と
  すると全ファイルから節が消えても素通りしてしまう（実際に25ファイル全部で消失を見逃した）。

## データソース

- `endpoint_reports/html_entry_missing_endpoints_recheck.csv`
  実装にあってHTML未記載の route 一覧。列は `section,method,path,route_name,feature,evidence,note`。
  `section == Block内部` と `method == OPTIONS` は追補対象外。
- `endpoint_reports/endpoint_supplement_data.json`
  各HTMLの「利用者視点の入口」行スナップショット（正本化された表セル）。`extract` で生成する。
- `endpoint_reports/endpoint_supplement_sections.json`
  各HTMLの**追補節の全文**スナップショット（手書き小節を含む）。`extract` で生成し、
  再変換で節ごと消えたときの復元元になる。入口テーブルだけでは手書き小節を再現できないため、
  節そのものを正本化しておく必要がある。

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

# 出力除外規約が有効（既定）のとき
python3 "$S" build    # HTMLから追補節・装飾CSSを除去（冪等）
python3 "$S" verify   # どのHTMLにも追補節が無いことを検査
# extract は正本スナップショット保護のため実行を拒否する（exit 2）

# 補助: recheck.csv の1行から入口行の導出結果を確認（正本メンテ用・規約に関係なく使える）
python3 "$S" rows --grep customer/customer_group
```

`RENDER_ENDPOINT_SUPPLEMENT = True` に戻したときは従来の3ステップになる。

```bash
# 1) 現行HTMLの入口行と追補節全文を正本JSONへスナップショット
#    （初回・行を確定したとき・節の手書き小節を編集したとき。HTMLが健全なうちに実行する）
python3 "$S" extract

# 2) 追補節を各HTMLへ冪等に再適用（節ごと消えていれば復元／表組崩れの修復／CSS注入）
python3 "$S" build

# 3) 追補節の欠落と、入口が表組でないことを検査
python3 "$S" verify
```

- `build` は次を冪等に行う。正常系（節あり＋表＋CSS適用済み）では差分ゼロ。
  1. 追補節が丸ごと消えていれば `endpoint_supplement_sections.json` から節を復元し、
     `</main>` 直前へ戻す（手書き小節ごと復元される）。
  2. 入口見出し直後の本文ブロックが表でも崩れた `ul`/`ol`/`p`/`pre` でも掴んで表組へ置き換える。
  3. 追補テーブルの装飾CSSを `<style>` へ注入する。
- 節を復元できない・入口テーブルを差し替えられないファイルがあれば `build` は非ゼロ終了する
  （黙って落とさない）。
- 入口行を増減するときは正本JSON `endpoint_reports/endpoint_supplement_data.json` を編集して
  `build` する。新規 route は `rows` で導出した行を貼り、`build` で反映する。
- 追補節の手書き小節を編集したら、**必ず `extract` でスナップショットを更新する**。
  更新しないと次の再変換で古い節に巻き戻る。

## convert.py 再変換との関係

出力除外規約が有効な間は、再変換で追補節が消えるのは**期待どおり**なので復元しない。
順序は「convert → 各種統合 → endpoint-supplement build（掃除）→ verify」で変わらず、
`build` は既存HTMLに残った追補節を取り除く役目を担う。

以下は `RENDER_ENDPOINT_SUPPLEMENT = True` に戻したときの規約である。

`excel-to-html` / `function-spec-html-render` で Excel HTML を再生成すると、後段で
注入した追補節は**丸ごと失われる**。再変換後は本スキルの `build` を実行して追補節を
復元すること。順序は「convert → 各種統合 → endpoint-supplement build → verify」。

`build` は入口テーブルだけでなく節そのものを復元する（復元元は `extract` が作った
`endpoint_supplement_sections.json`）。したがって再変換のたびに `build` → `verify` を
必ず通すこと。`verify` は data JSON に載るHTMLで節が欠けていれば NG を出す。

## 確認

- `python3 "$S" verify` が OK（節が揃い、全ファイルで入口が `<table>`）。
- `cd excel_to_html && uv run python verify.py` の追補チェックが NG を出さないこと
  （`verify.py` に「利用者視点の入口」表組チェックを内蔵済み）。
- 追補の入口列が常に 入口 / URLエンドポイント / 期待されるふるまい の3列であること。
- 追補テーブルの装飾（枠線・角丸・ヘッダ帯・ゼブラ）が本文テーブルと揃っていること
  （`/* endpoint-supplement-style:start */` が各HTMLに存在）。
- 手書き小節（調査補助等）が `build` で消えていないこと。
