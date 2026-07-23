# PILOT m09-01 新着情報管理 — 実走レポート（ケース表グレード→実行時実行可能の実証）

- 実施日: 2026-07-23
- 実施者: エンジニアリング担当（Playwright 実走）
- 対象: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md` §4 TSV の代表サブセット
- 稼働環境: front `http://localhost:8080` / admin `http://localhost:8080/admin/login`（admin/password）/
  PostgreSQL primary `ec-cube-enterprise-postgres_primary-1` db=eccubedb
- SUT: ec-cube-enterprise（dev モード）

## 成果物（テストデータ・オラクルは外だし＝spec直書き禁止を遵守）

| 種別 | パス |
|---|---|
| DB照会ヘルパ | `e2e/helpers/db.ts`（docker exec + psql -tAc。pg依存なし） |
| L1オラクル外部化（期待値の正） | `e2e/fixtures/oracle/m09_01_oracle.json` |
| 簡易L1解決器＋runFill | `e2e/helpers/oracle.ts`（`o("L1-M0901-011")` 経由で期待値取得） |
| Page Object | `e2e/pages/admin/m09/m09_01_news_pilot.page.ts` |
| spec | `e2e/spec/admin/m09/m09_01_news_pilot.spec.ts` |

SEED sql は不要だった（作成系はフレッシュ作成＋afterEach cleanup で充足。既存 max_id=1 の実データに触れない）。

## 実行コマンド

```
npx playwright test spec/admin/m09/m09_01_news_pilot.spec.ts --reporter=list
```

## 結果サマリ

- 2連続実行いずれも: **8 passed / 4 skipped(未実施・理由付き) / 0 failed**（同一判定）。
- 所要: run1 43.3s / run2 40.5s。

| テストID | 観点 | 結果 | 観測（要点） |
|---|---|---|---|
| E2E-M0901X-010 | 一覧HTTP200＋見出し3文言(ja) | 〇 | status=200、見出しに「公開日時」「公開状態」「タイトル」 |
| E2E-M0901X-010-EN | 見出し(en) | 未実施(要D15) | 管理画面ロケール切替口なし（下記） |
| E2E-M0901X-030 | タイトル空→HTML5 valueMissing | 〇 | `title.validity.valueMissing=true`・新規画面に留まる |
| E2E-M0901X-031 | タイトル空 直接POST サーバ検証(ja) | 〇 | HTTP200再描画・応答に「入力されていません。」・成功文言なし |
| E2E-M0901X-031-EN | 同(en) | 未実施(要D15) | 同上 |
| E2E-M0901X-032 | タイトル200字(ascii)受理→DB文字長=200 | 〇 | 「保存しました」＋/edit遷移＋`char_length(title)=200` |
| E2E-M0901X-033 | タイトル201字→Form拒否・DB未到達 | 〇 | 「長すぎます。この値は200文字以下で入力してください。」＋prefix行0件 |
| E2E-M0901X-033-EN | 同(en) | 未実施(要D15) | 同上 |
| E2E-M0901X-034 | 200字マルチバイト混在受理→char_length=200 | 〇 | byte長>200（あ混在）でも`char_length(title)=200`で保存成功 |
| E2E-M0901X-037 | URL空で保存成功（任意の実証） | 〇 | 「保存しました」＋/edit遷移 |
| E2E-M0901X-038 | URL形式不正拒否(ja) | 〇 | 「有効なURLではありません。」＋新規画面に留まる・DB未到達 |
| E2E-M0901X-038-EN | 同(en) | 未実施(要D15) | 同上 |

期待値は全て `o(oracleId)`（`m09_01_oracle.json`）経由で取得。spec本体に期待文字列リテラルなし。

## 失敗の切り分け（(i)実挙動乖離／(ii)ハーネス不良）

初回実走で click 系5件が Test timeout（`button.btn-ec-conversion` の click が Symfony **Web Debug Toolbar**（`.sf-toolbar`、dev専用オーバーレイ）に pointer event を横取りされ待機継続）。

- 分類: **(ii)ハーネス不良**（SUTの実挙動ではなく、dev環境のデバッグツールバーがボタンを覆う環境要因）。判断根拠: エラーログに `<div class="sf-toolbar-icon"> ... subtree intercepts pointer events`。click しない 010・031（直接POST）は初回から成功していた。
- 是正: `submitRegister()` を `form.requestSubmit()` に変更（送信ボタン押下と等価にネイティブHTML5検証＋通常送信を発火し、オーバーレイを回避）。期待値・SUTは一切変更していない。
- 是正後: 8/8 実行対象が pass。**実挙動乖離(i)は検出ゼロ**（＝SUTは見本の期待どおり）。

## DB副作用と cleanup 確認

- 作成系（032/034/037）は afterEach で「リダイレクトURLの id で DELETE」＋「run-id prefix `E2E-<runid>-` で DELETE」の二段掃除。afterEach で `prefix残骸=0` をアサート。
- 検証失敗系（031/033/038）は保存不成立を DB でも確認（prefix count=0）。
- 実走後の実DB: `SELECT count(*),max(id) FROM dtb_news` = **1 / 1**（既存 id=1「サイトオープンいたしました!」のまま）、`title LIKE 'E2E-%'` = **0件**。実データ・帯外データ・予約ID帯に副作用なし。

## 2連続同一判定

run1・run2 とも **8 passed / 4 skipped / 0 failed**、両run後とも dtb_news=1行・E2E-残骸0。冪等性担保を確認。

## -EN が未実施(要D15)である根拠（実測）

管理画面の en 切替口が現環境に存在しない。
- `ECCUBE_LOCALE` はコンテナ env で未設定（既定 ja）。admin route に `_locale` 前置なし。
- 実測: `curl -H "Accept-Language: en" .../admin/login` も `?_locale=en` も `<title>ログイン ...`（ja）のまま不変。
- container env（ECCUBE_LOCALE=en）変更は SUT 設定変更に当たり規約上不可。

よって 010-EN/031-EN/033-EN/038-EN は ×ではなく **理由付き未実施(要D15)** として記録（見本§5・§9-3と整合）。

## 実挙動乖離（検出したもの）

なし。実行対象8件すべて見本§1オラクルの期待どおり。特に:
- Form 200文字 / DB 255文字の段差が実在（201字は 201≦255 でも Form 層で拒否・DB未到達）。
- PostgreSQL は文字長意味論（char_length）で判定（マルチバイト混在200字＝UTF-8バイト長>200 でも保存成功・char_length=200）。

## 他機能展開時に効く知見／追加で要る道具

1. **dev の Web Debug Toolbar 対策は横展開必須**。click ベース submit は `.sf-toolbar` に阻害される。共通ヘルパ化候補: `submit via requestSubmit()` あるいは toolbar 無効化。全 admin フォーム系に効く。
2. **`page.request`（同一context）で直接POST/サーバ検証**が有効（§6.1契約）。CSRFは新規フォームGETで `admin_news[_token]` を都度抽出。他機能は block prefix が変わるだけ（`getBlockPrefix()` で確定）→ request契約は汎用ヘルパ化可能。
3. **db.ts（docker exec方式）は pg 依存なしで即戦力**。`char_length` 照会・prefix掃除・id掃除の型は他機能へそのまま流用可。primary 固定で読めた（レプリカ遅延の懸念なし）。
4. **作成行の一意特定=リダイレクトURLのid**が決定的で最も堅い。prefixは安全網。runFill(n, repertoire, prefix) は「境界文字数を汚さず一意化」で有効に機能（ちょうどn文字を spec 側でも `[...s].length` で自己検証）。
5. **en 展開は D15（管理画面ロケール切替口）が前提**。現状のenv固定ではLS=1の-EN群は全機能で未実施になる。D15（例: テスト用に ECCUBE_LOCALE=en の別スタック、または _locale対応の実機PoC）が全機能横断のブロッカー。
6. **datetime-local の prefill 値**（`yyyy-MM-ddTHH:mm:ss`・サーバtz）はそのまま直接POSTに載せられる。公開日時ブラケット判定（020）等へ db.ts の `dbNow()` と併用で拡張可能。
7. title に **maxlength 属性は出力されない**（`required` のみ）ことを実DOMで確認（見本§9-4のTBDを解消）。よって最大長はHTML5層でブロックされず、サーバ(Form Length)観測で自立する。
