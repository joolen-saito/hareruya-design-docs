# 実装の手引き（e2e/ の書き方と、これまでに踏んだ落とし穴）

基盤の決まりの正本は `e2e/README.md`。ここは、それを機能に当てはめるときの手順と型。

## ファイルの置き場

| 置き場 | 書くもの | 物理名 |
| --- | --- | --- |
| `e2e/pages/admin/<画面>.ts`・`pages/front/` | 画面ごとの操作（開く・入れる・押す・読む）。セレクタはここだけ | セレクタ・HTTP のパスは可 |
| `e2e/seeds/<機能>.ts` | シード表1行＝`defineSeed` 1つ | 不可（画面の部品を呼ぶ） |
| `e2e/db/<領域>.ts` | DB確認の照会。業務の言葉の関数名で返す | SQL の中だけ可 |
| `e2e/spec/<機能群>/<機能>.spec.ts` | ケース1件＝`caseTest` 1つ | 不可 |
| `e2e/fixtures/<機能>/` | 正本の値で中身が決まる入力ファイル（CSV など） | — |

既にある部品（`pages/admin/common.ts` の `expectSaved`・`chooseByLabel`、`pages/admin/member.ts` の `ensureMember`、`pages/admin/m03_01_goods_register.ts` のグッズ商品CSV登録 など）を先に探して使う。同じ画面の部品を機能ごとに作り直さない。

## テスト（spec）の型

```ts
/** M03-14 略称タグ登録/編集。正本: cases/M03-14_test_cases.tsv */
import { expect, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ShortTagPage } from "../../pages/admin/short_tag";
import { M0314_ADMIN } from "../../seeds/m03-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M03-14-016", async ({ page, notes, step, expected, capture }) => {
  await loginAdmin(page, M0314_ADMIN);                 // 事前準備の「新しいブラウザセッションでログイン」
  const tag = new ShortTagPage(page);
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get("〔略称タグID-M0314-016〕")); });
  await step(2, async () => { await tag.fill({ 名称: "", 並び順: "123", アルファベット順: true }); });
  await step(3, async () => {
    const r = await tag.pressRegister();
    if (!r.sent) note(`ブラウザの入力チェックが送信を止めた: ${r.止めた項目.join(" / ")}`);
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "戻った画面（新規入力欄）").toBe("/admin/product/storage");
    expect.soft(await tag.並び順の値(), "並び順（123が復元されない）").not.toBe("123");
  });
});
```

- **テストIDは文字列でその場に書く**（`caseTest("IT-…", 関数(…))` も可。`coverage.mjs` が検査する）。正本に無い・除外されたIDは読み込みで落ちる。
- **正本の手順1つ＝`step(n)` 1つ**。順に全部。飛ばす・まとめる・順を変えると基盤が落とす。手順の文はコードに写さない。
- **期待結果は `expected()` の中で `expect` する**。確かめのメッセージ（第2引数）は業務の言葉で、何を確かめたかが分かるように書く。これがエビデンスの「確かめた項目」の表になる。
- 期待結果に複数の項目があれば `expect.soft`。最後の1つだけを確かめて済ませない。
- 画面は自動で撮られる。モーダル・確認の画面・ダウンロードの前など、手順の途中の状態も証拠に要るときだけ `capture("確認モーダル")`。
- 縦に長い画面（8000px 超。表示件数12000件の一覧など）は見えている範囲しか撮られない。確かめた行が画面の外にあるときは、`expected()` の中で `await 行.scrollIntoViewIfNeeded(); await capture("確かめた行");` として残す。
- 実行区分が「ブラウザ+DB確認」のケースだけ `db` が使える。DB の値は `db/<領域>.ts` の関数で読む。
- 同じ形のケースが並ぶなら、同じファイルの関数に処理を書いて `caseTest("IT-…", 関数(引数))` で呼ぶ。

## シード（seeds）の型

```ts
defineSeed("S-M13-02-BASE-002", { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1302_ADMIN, async (page) => {
    notes.set("〔イベントID-M1302-002〕", await registerEvent(page, { … }));
  });
});
```

- シード表の「投入方法」のとおりに画面で作る。シード表に書いていない値を決めるときは、シード表の「状態・属性」から一意に決まるものだけ。決まらないものは推測せず、記録に「シードでの解釈」として書く。
- 先に要るシードは `needs`。ケースの使用シードの並び順に頼らない。
- 共有可は「あれば使い、無ければ作る」。あったものを使うときは、内容がシード表と同じかを画面で確かめ、違えば落とす。
- 作る途中で画面がエラーを出したなど、環境・アプリ側の問題は `reportSeedIssue(seedId, 文)` で残す（エビデンスの注記に出る）。
- シードのアカウントのパスワードは試験用の固定値でよい（シード表の値）。実在の資格情報は環境変数（`SETUP_ADMIN`）。

## 落とし穴（これまでの実行で踏んだもの）

| 症状 | 原因と対処 |
| --- | --- |
| 確認のモーダルが出ないと判断した | 画面のスクリプトの読み込み前に押していた。読み込みを待ってから押せば出る（M03-01 の009） |
| 登録ボタンを押しても何も起きない | ブラウザの入力チェック（必須の欄）が送信を止めている。要求が送られたかを見て注記に残す。止まったこと自体が結果（不合格。区分は JUDGEMENT.md） |
| 結果の数が0件で合格になった | 結果画面の読み込みを待たずに数えていた。検索の部品の `submitAndWaitForResult` のように、結果の表示を待ってから数える |
| 一覧に対象の行が出ない | 表示件数が少ない。事前準備が表示件数を定めるならそれに従い、定めないなら増やして注記に残す |
| 店名・ID の決め打ちで止まる | DB によって店舗ID 1 の店名が違う（「Hareruya」など）。画面の選択肢から読む |
| 店舗一覧に本店（親店舗）が無い | 店舗一覧は親店舗を出さない作り。在庫検索の「店舗」の選択肢などから読む |
| 画面下のツールバーがボタンを覆う | 基盤が止めている（`hideDebugToolbar`）。自前で別のコンテキストを作るときは `withAdminSession` を使う |
| ドラッグで並びが変わらない | 座標の測り方。要素の中心を、移る先の要素の位置へ段階的に動かす（M03-11 の023・024） |
| 商品登録画面が開けない | 新規登録は禁止の画面（設計書 M03-02）。商品はグッズ商品CSV登録で作る（裁定 E03 の型） |
| 固定の商品コードが残ってシードが止まる | 前回の実行の残り。シード表に清掃が無ければ、流し直す前に依頼者に聞く |
| 1件が900秒で時間切れ | 手元の環境が遅い。`pw_run.sh` は1800秒で流す。時間切れは「未判定」になる |

## 実装しないケースの扱い

- テストを書かない（`test.fixme` も置かない）。理由は記録（MD）の振り分けの表に書く。`coverage.mjs` の数で、書いたケースと書かないケースが分かる。
- 実装しない理由が「依頼者の判断待ち」なら、記録の「判断待ち」にも挙げる。

## 書き終えたら

```bash
cd e2e
npm run typecheck
node tools/coverage.mjs <機能ID>        # 誤り0
```

物理名の混入は、論理名の監査（`.cursor/skills/logical-naming/scripts/audit_logical_naming.py`）の報告で、**自分が書いたファイルの行だけ**を見る。
監査の棚卸し（baseline.tsv）はリポジトリの整理より古く、全体の終了コードは以前から失敗になる（2026-10-26 時点で約4万2千件。大半は integration_test/archive）。

```bash
cd ..   # リポジトリの根
nice python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo . --report <scratchpad>/naming.tsv > /dev/null
grep -E "^e2e/(spec/<機能群>/<機能>.spec.ts|seeds/<機能>.ts|pages/admin/<画面>.ts|review/<機能ID>_progress)" <scratchpad>/naming.tsv
```

出た行は、SQL なら `db/` へ移し、それ以外は業務の言葉に書き換える（対応は `e2e/config/logical-names.tsv`）。セレクタ・HTTP のパスは監査が拾わない。
