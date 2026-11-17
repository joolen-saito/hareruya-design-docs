/**
 * A07-06 ネット買取受注の商品一覧（買取代表カード）取得（MTGバイヤーの API）のシード。正本: cases/A07-06_seed_data.tsv
 * 共通の作り方・読み替えは seeds/a07-common.ts。この機能だけの点:
 * - カード商品: A06 と同じく、グッズ商品CSV登録＋カード指定で作る（seeds/a06-buying.ts の カード商品を作る。商品コード・商品名・カード名に実行の印。在庫は入れない）。
 *   言語は取込で日本語になる。シード表が英語（言語ID 2）とする明細は、申込みのあと E2E の明細の言語を DB で書く。
 * - 申込み: フロントで会員を作り、作った商品で申し込む（A と B は1回の申込みに数量 2・1 で入れる）。
 * - 査定中・売却: 買取情報編集で、買取状況「査定中」を選び、「査定編集」で明細の売却を選んで保存する。
 * - 画面で指定できない明細の値（査定金額・状態・買取カテゴリ・Foil区分・言語・NULL）は、E2E の明細にだけ DB で書く（db/a07_06.ts）。
 * - 「申込時買取価格=0件」「買取代表カード=0件」は、申込みで作られた E2E の行を消すことになる。seeds/a07-common.ts の 消してよいか を通し、
 *   消してよいの一覧に載るまでは止める（依頼者の了承が出るまで、このシードを使うケースは流さない）。A07-06 は全ケースがこれに当たる。
 * - 管理者の居ない利用者（GHOST）: seeds/a07-common.ts の 削除した管理者のトークン（いま登録した E2E の管理者だけを削除する）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { ログインする, 複数を申込む } from "../pages/front/m07_net_buy";
import { カード商品を作る } from "./a06-buying";
import { API試験環境の注記, A07のメール, 管理者を用意する, 削除した管理者のトークン, 決まった管理者, 消してよいか } from "./a07-common";
import { registerFrontMember } from "../pages/front/member_entry";
import { メールの会員ID } from "../db/a07_02";
import * as db from "../db/a07_06";

export const A0706管理者 = 決まった管理者("A07-06試験管理者", "a0706_admin", "Passw0rd!A0706");
export const A0706控え = new Map<string, string>();
const 会員のパスワード = "Passw0rd!A0706Mem";

defineSeed("S-A07-06-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });
defineSeed("S-A07-06-ADM", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0706-共有〕", await 管理者を用意する(browser, seed.シードID, A0706管理者));
});
defineSeed("S-A07-06-GHOST", async ({ browser, seed, notes }) => {
  const g = await 削除した管理者のトークン(browser, seed.シードID, "0706ghost");
  A0706控え.set("GHOST", g.トークン);
  notes.set("〔削除済み管理者会員ID-A0706-共有〕", g.管理者ID);
});

type 明細の定め = { 呼び名: string; 数量: number; 売却?: "する" | "しない"; 値: db.明細の値; 申込時?: [string, number][] };
type 申込みの定め = { 受注の呼び名: string; 明細: 明細の定め[]; 査定中: true };

/** 会員を作り、明細ごとにカード商品を作って申し込み、査定中・売却を画面で保存し、画面で指定できない値を DB で書く */
async function 作る(browser: Browser, seedId: string, notes: { set: (l: string, v: string) => void }, 会員の呼び名: string, 申込み: 申込みの定め[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, `シード作成時の問題: ${m}`);
  const 全明細 = 申込み.flatMap((o) => o.明細);
  // 「0件」の申込時買取価格・明細は E2E の行を消すので、先に関所を通す（載っていなければここで止まり、何も作らない）
  if (全明細.some((m) => !m.申込時 || m.申込時.length === 0)) 消してよいか(seedId, "申込みで作られた申込時買取価格を0件にすること");
  const 商品 = new Map<string, { 商品ID: string; 商品名: string }>();
  for (const m of 全明細) {
    const コード = `A0706-${m.呼び名.replace("共有", "CARDS-")}`; // 商品コードは英数字（シード表の A0706-CARDS-A などの形）
    const p = await カード商品を作る(browser, seedId, { 商品コード: コード, 商品名日: コード, 商品名英: コード, カード名日: `A0706試験カード${m.呼び名}`, カード名英: `A0706 Test Card ${m.呼び名.replace("共有", "S")}`, 基準価格: "1234", 販売価格: "1234", 買取価格: "1234", 在庫: 0 });
    商品.set(m.呼び名, { 商品ID: p.商品ID, 商品名: p.商品コード });
    notes.set(`〔商品ID-A0706-${m.呼び名}〕`, p.商品ID);
  }
  // メールのローカル部は英数字だけにする（呼び名の「共有」は shared に置き換える。フロントの会員登録は日本語のローカル部を受け付けない見込み）
  const メール = A07のメール(`a0706-${会員の呼び名.replace("共有", "shared").toLowerCase()}@example.test`);
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 会員ID: string | null = null;
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    await registerFrontMember(page, { 姓: "試験", 名: "買取", セイ: "シケン", メイ: "カイトリ", メール, パスワード: 会員のパスワード });
    会員ID = メールの会員ID(メール);
    for (let i = 0; !会員ID && i < 6; i++) { await page.waitForTimeout(10_000); 会員ID = メールの会員ID(メール); }
  } finally { await ctx.close(); }
  if (!会員ID) throw new Error(`${seedId}: 会員 ${メール} が DB に無い`);
  notes.set(`〔会員ID-A0706-${会員の呼び名}〕`, 会員ID);
  const 番号: string[] = [];
  const ctx2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx2);
    const page = await ctx2.newPage();
    page.setDefaultTimeout(60_000);
    await ログインする(page, { メール, パスワード: 会員のパスワード });
    for (const o of 申込み) 番号.push(String(Number(await 複数を申込む(page, o.明細.map((m) => ({ 商品ID: 商品.get(m.呼び名)!.商品ID, 数量: String(m.数量) }))))));
  } finally { await ctx2.close(); }
  申込み.forEach((o, i) => notes.set(`〔ネット買取受注ID-A0706-${o.受注の呼び名}〕`, 番号[i]));
  issue(`会員はフロントの会員登録で作った（${メール}。正本は管理画面の会員登録）。カード商品は A06 と同じくグッズ商品CSV登録＋カード指定で作り（商品コード・名前に実行の印）、その商品で申し込んだ（買取 ${番号.join("・")}）`);
  // 画面: 査定中と売却
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (let i = 0; i < 申込み.length; i++) {
      const l = new BuyListPage(page);
      await l.open(); await l.買取番号を入れる(番号[i]); await l.検索する(); await l.編集画面を開く(番号[i]);
      const e = new BuyEditPage(page);
      await e.買取状況の選択().selectOption({ label: "査定中" });
      const 売却あり = 申込み[i].明細.filter((m) => m.売却);
      if (売却あり.length) {
        await e.査定編集を始める();
        for (const m of 売却あり) await e.明細を名前で入れる(商品.get(m.呼び名)!.商品名, { 売却: m.売却 });
      }
      await e.保存する(`${seedId}: 買取 ${番号[i]} を査定中にして売却を選ぶ`);
    }
  });
  issue(`買取情報編集で、買取状況「査定中」と明細の売却（${全明細.filter((m) => m.売却).map((m) => `${m.呼び名}=${m.売却}`).join("・") || "なし"}）を保存した`);
  // DB: 明細の値と申込時買取価格
  for (let i = 0; i < 申込み.length; i++) {
    const rows = db.明細を読む(番号[i]);
    for (const m of 申込み[i].明細) {
      const id = 商品.get(m.呼び名)!.商品ID;
      const r = rows.filter((x) => x.商品ID === id);
      if (r.length !== 1) throw new Error(`${seedId}: 買取 ${番号[i]} に商品 ${id} の明細が ${r.length} 件`);
      notes.set(`〔買取商品ID-A0706-${m.呼び名}〕`, r[0].ID);
      db.明細に書く(r[0].ID, メール, m.値);
      if (m.申込時 && m.申込時.length) for (const [c, v] of m.申込時) db.申込時買取価格を置く(r[0].ID, メール, c, v);
      else if (r[0].申込時.length) db.申込時買取価格を消す(r[0].ID, メール);
    }
  }
  issue(`画面で指定できない明細の値（査定金額・状態・買取カテゴリ・Foil区分・言語・NULL）と申込時買取価格は、E2E の明細にだけDBで書いた: ${全明細.map((m) => `${m.呼び名}: ${JSON.stringify(m.値)}・申込時 ${m.申込時?.map(([c, v]) => `${c}=${v}`).join("/") || "0件（申込みで作られた行を消した）"}`).join(" ／ ")}`);
}

const 標準 = (v: Partial<db.明細の値> = {}): db.明細の値 => ({ 言語ID: 1, フォイル: 0, 枚数: 1, 査定金額: 1000, 状態ID: 1, 売却: true, 買取カテゴリ: 1, ...v });

defineSeed("S-A07-06-CARDS", async ({ browser, seed, notes }) => {
  await 作る(browser, seed.シードID, notes, "共有", [
    { 受注の呼び名: "共有A", 査定中: true, 明細: [
      { 呼び名: "共有A", 数量: 2, 売却: "する", 値: 標準({ 枚数: 2, 査定金額: 1234 }), 申込時: [["NM", 1234], ["SP", 987]] },
      { 呼び名: "共有B", 数量: 1, 売却: "しない", 値: 標準({ 言語ID: 2, フォイル: 1, 査定金額: 2001, 状態ID: 2, 売却: false, 買取カテゴリ: 2 }) },
    ] },
    { 受注の呼び名: "共有B", 査定中: true, 明細: [{ 呼び名: "共有C", 数量: 3, 売却: "する", 値: 標準({ フォイル: 2, 枚数: 3, 査定金額: 3456 }) }] },
    { 受注の呼び名: "共有C", 査定中: true, 明細: [{ 呼び名: "共有D", 数量: 1, 売却: "する", 値: 標準({ 査定金額: 4000 }) }] },
  ]);
});

defineSeed("S-A07-06-NULL", async ({ browser, seed, notes }) => {
  await 作る(browser, seed.シードID, notes, "共有NULL", [{ 受注の呼び名: "共有NULL", 査定中: true, 明細: [
    { 呼び名: "共有NULL", 数量: 1, 値: { 言語ID: null, フォイル: null, 枚数: null, 査定金額: null, 状態ID: null, 売却: null, 買取カテゴリ: 1 } },
  ] }]);
});

/** NONE: 申込みのあと、申込みで作られた明細と申込時買取価格を消して0件にする（消す。関所を通す） */
defineSeed("S-A07-06-NONE", async ({ browser, seed, notes }) => {
  消してよいか(seed.シードID, "申込みで作られた買取代表カードと申込時買取価格を消すこと");
  const コード = "A0706-NONE";
  const p = await カード商品を作る(browser, seed.シードID, { 商品コード: コード, 商品名日: コード, 商品名英: コード, カード名日: "A0706試験カードNONE", カード名英: "A0706 Test Card NONE", 基準価格: "1234", 販売価格: "1234", 買取価格: "1234", 在庫: 0 });
  const メール = A07のメール("a0706-none@example.test");
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try { await hideDebugToolbar(ctx); await registerFrontMember(await ctx.newPage(), { 姓: "試験", 名: "買取", セイ: "シケン", メイ: "カイトリ", メール, パスワード: 会員のパスワード }); } finally { await ctx.close(); }
  const 会員ID = メールの会員ID(メール);
  if (!会員ID) throw new Error(`会員 ${メール} が DB に無い`);
  notes.set("〔会員ID-A0706-共有NONE〕", 会員ID);
  const ctx2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 番号 = "";
  try { await hideDebugToolbar(ctx2); const page = await ctx2.newPage(); await ログインする(page, { メール, パスワード: 会員のパスワード }); 番号 = String(Number(await 複数を申込む(page, [{ 商品ID: p.商品ID, 数量: "1" }]))); } finally { await ctx2.close(); }
  notes.set("〔ネット買取受注ID-A0706-共有NONE〕", 番号);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const l = new BuyListPage(page); await l.open(); await l.買取番号を入れる(番号); await l.検索する(); await l.編集画面を開く(番号);
    await new BuyEditPage(page).買取状況を変えて保存する("査定中");
  });
  for (const m of db.明細を読む(番号)) if (m.申込時.length) db.申込時買取価格を消す(m.ID, メール);
  db.明細を消す(番号, メール);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 正本は「買取価格が登録された公開中の任意のシングルカード商品」。E2E のカード商品（${p.商品コード}）で申し込み、査定中にしてから、申込みで作られた E2E の明細と申込時買取価格をDBで消して0件にした（消してよいの一覧に載っているときだけ）`);
});

/** 016〜023: 明細1件の受注 */
function defineOneSeed(seedId: string, 呼び名: string, 値: db.明細の値, 売却: "する" | "しない" = "する", 数量 = 1): void {
  defineSeed(seedId, async ({ browser, seed, notes }) => {
    await 作る(browser, seed.シードID, notes, 呼び名, [{ 受注の呼び名: 呼び名, 査定中: true, 明細: [{ 呼び名, 数量, 売却, 値 }] }]);
  });
}
defineOneSeed("S-A07-06-ORDERID-016", "016", 標準());
defineOneSeed("S-A07-06-PRODUCTID-017", "017", 標準());
defineOneSeed("S-A07-06-LANGUAGEID-018", "018", 標準({ 言語ID: 2 }));
defineOneSeed("S-A07-06-COUNT-019", "019", 標準({ 枚数: 7 }), "する", 7);
defineOneSeed("S-A07-06-CONDITIONID-020", "020", 標準({ 状態ID: 2 }));
defineOneSeed("S-A07-06-SALEFLG-TRUE-021", "021", 標準());
defineOneSeed("S-A07-06-SALEFLG-FALSE-022", "022", 標準({ 売却: false }), "しない");
defineOneSeed("S-A07-06-CATEGORY-023", "023", 標準({ 買取カテゴリ: 2 }));
