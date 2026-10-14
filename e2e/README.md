# e2e — 結合テストケースを Playwright で実行する基盤

`integration_test/casegen/all_test_cases.tsv`（正本は `integration_test/casegen/cases/`）のケースを、動いている環境に対して実行する。
**テストデータは画面から作る**（依頼者決定 2026-10-09）。SQL やフィクスチャでデータを入れない。

## 使い方

```bash
cd e2e
npm install
npx playwright install chromium

npx playwright test spec/m13            # 機能群ごとに流す（1ケースごとに画面からデータを作るので時間がかかる）
npx playwright show-report              # 結果（ケースの手順・期待結果の文と、控えた番号が出る）
npm run typecheck
npm run coverage                        # 正本のケースのうち、テストがある件数。テストコードの形の検査も行う（下記）
```

## 環境の切り替え

`E2E_ENV` で切り替える（`config/env.ts`）。

| E2E_ENV | フロント | 管理画面 | DB確認 |
| --- | --- | --- | --- |
| `local`（既定） | http://localhost:8000 | http://localhost:8000/admin/ | 手元のコンテナ（`docker exec` の psql） |
| `dev` | https://replace-dev.hareruyamtg.com:8443 | https://replace-dev.hareruyamtg.com:8443/admin/ | なし（`E2E_DB_URL` を与えれば可） |

```bash
# 開発環境で流す
E2E_ENV=dev E2E_SETUP_ADMIN_USER=… E2E_SETUP_ADMIN_PASS=… E2E_CONFIRM_SHARED_ENV=1 npx playwright test spec/m13
```

| 環境変数 | 意味 |
| --- | --- |
| `E2E_SETUP_ADMIN_USER`・`E2E_SETUP_ADMIN_PASS` | シード（店舗・メンバーなど）を画面から作るための、全権限を持つ管理者。local は開発用コンテナの初期アカウントが既定。ほかの環境では必須 |
| `E2E_CONFIRM_SHARED_ENV=1` | 複数人が使う環境で流すことへの同意。**テストは画面から店舗・メンバー・イベントなどのデータを作り、消さない**。手元（localhost）以外の接続先は、`E2E_ENV` が何であっても複数人が使う環境として扱う |
| `E2E_DB_URL` | DB確認に使う PostgreSQL の接続URL（参照できる利用者）。与えると `psql` で照会する |
| `E2E_BASE_URL`・`E2E_ADMIN_ROUTE`・`E2E_DB_CONTAINER` | 個別の上書き |

パスワードなどの秘密情報はコミットしない。

複数人が使う環境では、次のケースは実行されない（スキップとして報告に出る）。

- 実行区分が「ブラウザ+DB確認」で、DB確認の接続先が無いとき。
- 使用シードに、データを消す作り方（「あれば削除して0件を確かめる」など）のものがあるとき。ほかの人のデータを消さないため。

DB確認は読み取り専用のトランザクションで流す。複数人が使う環境と手元のコンテナのDBを組み合わせた設定は、実行前に止まる。

## 作り

```
config/env.ts        環境の切り替えと接続先
lib/catalog.ts       ケース・シードの正本（TSV）を読む
lib/case.ts          caseTest: ケース1件＝テスト1件
lib/seeds.ts         defineSeed: シード1件＝画面操作の作り方1つ
lib/notes.ts         控えた番号（〔イベントID-M1302-002〕の形の呼び名で引く）
lib/session.ts       管理画面へのログイン
lib/db.ts            DB確認（参照だけ）
pages/               画面ごとの操作（セレクタはここにだけ書く）
seeds/<機能>.ts      その機能のシードの作り方
db/<領域>.ts         DB確認の照会（物理名はここの SQL にだけ書く）
spec/<機能群>/       テスト
tools/coverage.mjs   正本との対応の集計
```

### ケースの書き方

```ts
caseTest("IT-M13-02-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-002〕")); });
  await step(2, async () => { … });
  await expected(async () => { … });
});
```

- テストIDで正本を引く。**手順・期待結果の文はコードに写さない**（報告には正本の文がそのまま出る）。正本に無いID・除外されたIDは読み込み時に落ちる。
- 使用シードは、正本の「使用シード」列どおりに、ケースの直前に画面から作られる。
- 正本の手順を順にすべて実行し、そのあとで期待結果を確かめる（順が違えば落ちる）。
- 同じ形のケースが並ぶときは、同じファイルの関数に処理を書いて `caseTest("IT-…", 関数(…))` と呼ぶ。テストIDは必ずその場に文字列で書く。
- `npm run coverage` は、テストIDの二重定義・正本に無いID・中身が空の手順・確かめ（expect）の無い期待結果を誤りとして止める。
- 期待結果に確かめる項目が複数あるときは `expect.soft` を使い、1つ落ちても残りを確かめる（報告に全部出る）。
- 期待結果は正本のとおりに確かめる。**実装に合わせて期待を弱めない**。落ちたら、それが結果である。
- DB確認（`db`）は、実行区分が「ブラウザ+DB確認」のケースでだけ使える。参照（SELECT）しか通らない。

### シードの書き方

```ts
defineSeed("S-M13-02-BASE-002", { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1302_ADMIN, async (page) => {
    notes.set("〔イベントID-M1302-002〕", await registerEvent(page, { … }));
  });
});
```

- シード表（`<機能ID>_seed_data.tsv`）の投入方法のとおりに、画面操作で作る。
- 共有可のシードは「あれば使い、無ければ作る」（何度呼んでも同じ状態になるように書く）。あったものを使うときは、内容がシード表と同じかを画面で確かめ、違えば落とす。ケース専用のシードは、ケースの直前に毎回作る。
- 先に出来ていなければならないシードは `needs` に書く（ケースの使用シードの並び順に頼らない）。
- 画面が振る番号は `notes.set` で控える。シード表が「控える」と定めた呼び名を控えていないと落ちる。シード表に無い呼び名を控えても落ちる。
- 作る途中で画面がエラーを出したなど、環境・アプリ側の問題は `reportSeedIssue` で報告に出す（握りつぶさない）。

## 前提と注意

- ケース専用のシードは実行のたびに新しく作る。同じ環境で繰り返し流すと、同じ名前のデータが増えていく。「このN件だけ」を期待するケースは、まっさらな専用DBで流す前提（`integration_test/casegen/precond/README.md`）。
- ワーカーは1つ（`playwright.config.ts`）。共有シードの「作成済み」はワーカーの中で覚えているだけなので、並列にするには機能ごとに独立した環境が要る。
- local では、開発用のデバッグ表示（画面下のツールバー）がボタンを覆うので、読み込みを止めている。
