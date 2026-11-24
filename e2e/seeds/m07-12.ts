/**
 * M07-12 買取商品履歴選択CSV出力 の画面シード。正本: cases/M07-12_seed_data.tsv
 *
 * 作り方は seeds/m07-11.ts（M07-11 買取商品履歴CSV出力）と同じ。既存のファイルは変えず、同じ作り方をこのファイルに写した。
 *  1) 査定担当者のメンバーを、メンバー管理の画面で登録する（名前は実行の印つき）。
 *  2) 買取に入れる商品を、サプライ・グッズの商品として作り（棚番号・公開を設定）、会員をフロントの会員登録＋管理画面の会員登録編集で作る。
 *  3) その会員でフロントから商品を申し込み、買取情報編集の査定編集で査定価格・数量・売却「する」を入れて保存し、
 *     買取状況を「査定内容承諾」→「振込完了」→「入庫済み」の順に保存する（売却する明細の数量で実在庫と実在庫履歴が作られる）。
 *  4) 画面で指定できない部分だけ、実行の印つきの行に限り DB で整える: 査定担当者・振込完了日・実在庫履歴の変更前・変更後の数量。
 * 読み替え:
 *  - 買取番号（407120111 など）・会員ID・管理者IDは画面が振るので、シード表の固定の値の代わりに画面が振った値を控えて使う。
 *  - 商品コード・商品名・査定担当者の名称・姓・名は実行の印つき。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { 商品名で商品IDを読む } from "../pages/admin/f05_04_products";
import { サプライ品を登録する, 登録できる棚名, 規格に棚番号を付けて公開する, 棚番号を登録する } from "../pages/admin/m07_supply";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 試験管理者を用意する } from "./m07-common";
import { 買取状況をDBで設定する, 状況の履歴をDBで入れ替える } from "./m07-db-prep";
import { 実在庫の数量を設定する, 査定担当者を設定する } from "../db/m07_10";
import { メンバーID } from "../db/m03_30_x";
import { 実在庫履歴の前後を設定する } from "../db/m07_11";
import { 実在庫履歴の変更後を設定する } from "../db/m07_w";

export const M0712_ADMIN: Account = { loginId: "m0712_fgadmin", password: "Passw0rd-FGM0712ADM" };

defineSeed("S-M07-12-FGADM", async ({ browser, notes, seed }) => {
  await 試験管理者を用意する(browser, M0712_ADMIN, "M07-12試験管理者");
  // 管理者IDは画面が振る番号のまま（シード表の「アドレス欄の番号を控える」に当たる）。メンバー管理で作った管理者の番号をDBの参照で控える
  const id = メンバーID(M0712_ADMIN.loginId);
  if (!id) throw new Error("M07-12試験管理者のメンバーが、ログインID m0712_fgadmin で見つからない");
  notes.set("〔管理者ID-M0712-共有〕", id);
  reportSeedIssue(seed.シードID, "管理者IDは画面が振る番号のまま。権限は「システム管理者」（買取管理を操作できる）");
});

export const 品コード = (n: string, 枝: string): string => rc(`M0712-FG${n}-${枝}`);
export const 品名 = (n: string, 末尾: string): string => rc(`M0712-FG${n}-NAME${末尾}`);
export const 担当名 = (n: string): string => rc(`M0712-FG${n}-ASR`);
export const 会員の呼び名 = (n: string): string => `〔会員ID-M0712-${n}〕`;

type 明細 = { 枝: string; 名末尾: string };
type 作り方 = { 買取: 明細[]; 振込完了日: string; 履歴: [number, number] | null; 入庫数?: number };

/** 商品を1つ作る（サプライ・グッズ。棚番号と公開を設定） */
async function 商品を作る(page: Page, seedId: string, n: string, d: 明細): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const name = 品名(n, d.名末尾);
  const code = 品コード(n, d.枝);
  const 棚 = 登録できる棚名(`M0712-${n}-S`);
  await 棚番号を登録する(page, 棚, issue);
  await サプライ品を登録する(page, [{ コード: code, 名前: name, 基準価格: "4200", 買取価格: "1000" }], issue);
  await 規格に棚番号を付けて公開する(page, name, code, 棚, issue);
  return await 商品名で商品IDを読む(page, name);
}

const NEEDS = { needs: ["S-M07-12-FGADM"] };

function 作る(n: string, o: 作り方): (ctx: { browser: Browser; seed: { シードID: string }; notes: { set(k: string, v: string): void } }) => Promise<void> {
  return async ({ browser, seed, notes }) => {
    const seedId = seed.シードID;
    const issue = (m: string) => reportSeedIssue(seedId, m);
    // 1) 査定担当者
    const 担当ログインID = `m0712_t${n.toLowerCase()}_${RUN_MARK.toLowerCase()}`;
    await 試験管理者を用意する(browser, { loginId: 担当ログインID, password: "Passw0rd!M0712T" }, 担当名(n));
    // 2) 商品
    const ids = new Map<string, string>();
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const m of o.買取) ids.set(m.枝, await 商品を作る(page, seedId, n, m));
    });
    issue(`シード作成時の問題: 商品は、シード表どおりグッズ商品CSV登録（サプライ品）で作り、棚番号 ${登録できる棚名(`M0712-${n}-S`)} と公開を設定した（基準価格4200・商品設定の買取価格1000）。商品コード・商品名は実行の印つき（${o.買取.map((m) => 品コード(n, m.枝)).join(" / ")}）`);
    // 3) 会員と申込
    const メール = `${rc(`m0712-${n}`)}@example.test`.toLowerCase();
    const 会員ID = await 会員を用意する(browser, seedId, { 姓: rc(`M0712-FG${n}-SEI`), 名: rc(`M0712-FG${n}-MEI`), セイ: "テストセイ", メイ: "テストメイ", メール, 電話: ["090", "1234", "5678"] });
    notes.set(会員の呼び名(n), 会員ID);
    const 番号: string[] = [];
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール, パスワード: 会員のパスワード });
      for (const m of o.買取) {
        番号.push(await 条件つきで申込む(fp, [{ 商品ID: ids.get(m.枝)!, 数量: "1" }], { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケンシード" }));
      }
    } finally { await ctx.close(); }
    // 4) 管理画面の操作
    for (let i = 0; i < o.買取.length; i++) {
      const m = o.買取[i];
      const 画面で出来なかった: string[] = [];
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        let e = await 一覧から編集を開く(page, 番号[i]);
        await e.査定編集を始める();
        await e.明細を名前で入れる(品名(n, m.名末尾), { 査定価格: "1500", 数量: "1", 売却: "する" });
        await e.査定確定する();
        await e.保存する(`買取番号 ${番号[i]} の査定（${品コード(n, m.枝)}）`);
        for (const st of ["査定内容承諾", "振込完了", "入庫済み"]) {
          e = await 一覧から編集を開く(page, 番号[i]);
          try { await e.買取状況を変えて保存する(st); } catch (err) {
            if (!/買取状況に「.*」が無い/.test((err as Error).message)) throw err;
            画面で出来なかった.push(st);
            break;
          }
        }
      });
      if (画面で出来なかった.length) issue(`買取番号 ${番号[i]}: 買取状況の選択肢に ${画面で出来なかった.join("・")} が無く、画面の保存で進められなかったので、DBで買取状況を「入庫済み」にした`);
      // 5) DB: 画面で指定できない部分（印はメールアドレス）
      if (画面で出来なかった.length) 買取状況をDBで設定する(番号[i], メール, "入庫済み");
      査定担当者を設定する(番号[i], メール, 担当ログインID);
      状況の履歴をDBで入れ替える(番号[i], メール, "振込完了", [`${o.振込完了日} 00:00:00+09`]);
      if (o.履歴) 実在庫履歴の前後を設定する(番号[i], メール, 品コード(n, m.枝), o.履歴[0], o.履歴[1]);
      if (o.入庫数 !== undefined) {
        実在庫履歴の変更後を設定する(番号[i], メール, 品コード(n, m.枝), o.入庫数);
        実在庫の数量を設定する(番号[i], メール, 品コード(n, m.枝), o.入庫数);
      }
    }
    issue(`シード作成時の問題: 買取番号・会員IDは画面が振るので、シード表の固定の値の代わりに画面が振った値を控えて使った。会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作った（メールアドレス・姓・名は実行の印つき）。`
      + `査定担当者（メンバーを画面で登録。名称は実行の印つき）・振込完了日（${o.振込完了日}）・実在庫履歴の数量（${o.履歴 ? `変更前${o.履歴[0]}・変更後${o.履歴[1]}` : `変更後${o.入庫数}（実在庫の数量も同じ）`}）は画面で指定できないので、実行の印つきの行に限りDBで設定した`);
  };
}

// 011: 同じ会員の買取3件（商品ごとに1件）。買取番号は画面が振る（シード表は 407120111〜407120113）
defineSeed("S-M07-12-FGSEL-011", NEEDS, 作る("011", {
  買取: [{ 枝: "PA", 名末尾: "A" }, { 枝: "PB", 名末尾: "B" }, { 枝: "PC", 名末尾: "C" }],
  振込完了日: "2026-08-03", 履歴: [10, 15],
}));
// 012: 買取1件・実在庫履歴の数量12
defineSeed("S-M07-12-FGSEL-012", NEEDS, 作る("012", {
  買取: [{ 枝: "PA", 名末尾: "A" }],
  振込完了日: "2026-08-03", 履歴: null, 入庫数: 12,
}));
