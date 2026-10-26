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

## エビデンス（手順ごとの画面つきの記録）

ケースを流すと、`evidence/<機能ID>/<テストID>/` にエビデンスが出る（git の対象外）。テストコード側の書き足しは要らない。

```bash
tools/run_evidence.sh M03-14                 # 機能のテストがあるケースを全部、1件ずつ流す（pw_run.sh のロックで全体1本）
tools/run_evidence.sh M03-14 016 026         # 番号を指定
tools/run_evidence.sh M03-14 --todo          # エビデンスが無いか、正本が変わって古くなったケースだけ（中断しても続きから）
tools/run_evidence.sh M03-14 --failed        # いま合格でないケースだけ
node tools/evidence_index.mjs                # 一覧（MD・HTML・TSV）を作り直す
node tools/evidence_check.mjs M03-14         # 記録の形・合格の中身・正本との一致・判定の有無を検査する
python3 tools/evidence_judgements.py todo M03-14     # 判定が要るケース
tools/evidence_pack.sh M03-14                # 固めて渡す（evidence/_packs/）
```

| 出るもの | 中身 |
| --- | --- |
| `evidence/<機能ID>/<テストID>/evidence.html`・`evidence.md` | 正本の事前準備・手順・期待結果の文（控えた番号つき）、手順1の前・各手順のあと・期待結果を確かめたあとの画面、確かめた項目ごとの合否、注記、エラー |
| `…/result.json` | 機械が読む記録（一覧の元）。正本の指紋・実施日時・E2E とアプリのコミットを含む |
| `…/Playwrightの画面_N.png`・`trace.zip` | 落ちたときだけ |
| `evidence/<機能ID>/index.html`・`index.md`・`results.tsv`・`history.tsv` | 機能の一覧と実施の履歴 |
| `evidence/index.html`・`index.md`・`results.tsv` | 全機能の一覧 |

- エビデンスの先頭に「期待結果に対する実際の状態」を文で書き、確かめた項目ごとに「期待」と「実際の状態」を並べる。spec は `expect` を `lib/case` から使う（`lib/evidence_expect.ts`。ふるまいは Playwright の expect と同じで、期待結果の中の確かめだけを記録する）。
- 画面は caseTest が自動で撮る（`lib/evidence.ts`）。手順の途中も残したいときはケースの `capture("ラベル")`。キャプチャは合否に関わらない（撮れなければ理由を残す）。`E2E_EVIDENCE=viewport|off` で切り替える。
- 自動判定は、手順か期待結果で落ちたものだけを「不合格」にし、事前準備（シード）やログインで止まったもの・時間切れ・中断は「未判定」にする。
- ケースの中身（正本）か spec ファイルが変わると、そのエビデンスは「要再実行」になり、`--todo` で流し直される。
- `pw_run.sh` はテストIDのタグ（`@IT-…`。caseTest が付ける）でケースを1件だけ選ぶ。
- 人（担当）の判定は `review/judgements/<機能ID>.tsv` に書く（`tools/evidence_judgements.py set …`）。判定は、どの実施への判定かを実施日時で持つ。流し直すと「判定が古い」になる。
- 合否の一覧（`integration_test/casegen/playwright_cases.tsv`）へは `evidence_judgements.py sync <機能ID> --apply` で、判定済みの「合格（条件なし）」「不合格（条件付きでない）」だけを載せる。
- 進め方の全体（実装→実行→判定→記録）はスキル `.codex/skills/hareruya-e2e-case-evidence/SKILL.md`。

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
lib/evidence.ts      エビデンスの画面を撮る（caseTest が呼ぶ）
lib/evidence_expect.ts  期待結果の確かめを「期待」と「実際の状態」の組で記録する expect（spec は lib/case から使う）
lib/evidence_reporter.ts  エビデンスの書き出し（Playwright のレポーター）
pages/               画面ごとの操作（セレクタはここにだけ書く）
seeds/<機能>.ts      その機能のシードの作り方
db/<領域>.ts         DB確認の照会（物理名はここの SQL にだけ書く）
spec/<機能群>/       テスト
tools/coverage.mjs   正本との対応の集計（--list でテストのあるケースの一覧）
tools/run_evidence.sh・evidence_*.mjs・evidence_judgements.py・evidence_pack.sh  エビデンスつきの実行・一覧・検査・判定・固め
```

### ケースの書き方

```ts
caseTest("IT-M13-02-002", async ({ page, notes, step, expected }) => {   // expect は lib/case から import する
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
- `IT-M13-02-057` をローカルで再実行する前は、前回の `M1302-PAGING-057-01`〜`31` を画面から片付け、イベント名 `M1302-PAGING-057` の検索結果が0件であることを確認する。片付けは対象を表示できる `m1302_admin` で行う。初期管理者 `admin` のイベント一覧は対象店舗を表示せず、0件に見えても清掃済みとは限らない。
- ワーカーは1つ（`playwright.config.ts`）。共有シードの「作成済み」はワーカーの中で覚えているだけなので、並列にするには機能ごとに独立した環境が要る。
- local では、開発用のデバッグ表示（画面下のツールバー）がボタンを覆うので、読み込みを止めている。
