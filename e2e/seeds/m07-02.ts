/**
 * M07-02 古物台帳入力用CSV出力 のシード。正本: cases/M07-02_seed_data.tsv
 *
 * 作り方（シード表の手順を画面で行う。読み替えた点）:
 * - 会員: フロントの会員登録＋管理画面の会員登録編集（本会員・職業・本人確認ステータス「オンライン本人確認済み」）で作る（seeds/m07-03-b.ts の 会員を用意する）。
 *   メールアドレスは実行の印つき。注文者名（姓）は、ケースが検索欄へ入れる値に実行の印を付けた値にした（前の実行の残りと混ざらないため。ケースもこの値で検索する）。
 * - 買取の申込み: 会員でフロントにログインし、買取できる既存の商品を1点・数量1で申し込む（グッズ商品CSVは使わない）。買取番号は完了画面の番号を控え、
 *   管理画面の買取検索一覧をその番号で検索して、行の氏名が会員の氏名であることを確かめる。
 * - 画面で指定できない値（注文日・買取依頼日・買取状況「振込完了」）は、実行の印つきの買取にだけ、DBで設定する（seeds/m07-db-prep.ts）。
 *   「キャンセル済み」は画面（買取情報編集）で選んで保存する。
 * - プレイヤーID: シード表はイベント申込登録のプレイヤー検索で控える。DBでプレイヤーを読んで控えた（会員に紐づくプレイヤーは1件）。
 * - CSV出力設定（S-M07-02-CONFIG）: 共有の設定なので書き換えない。そのときの設定のまま出力する。
 * - 作らない（正本が固定IDをDBへ直接登録する・存在しない状態を作る定め）: S-M07-02-SPARSE-004（注文日は未設定にできない）、S-M07-02-RICH-014（CSV出力設定を変える）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BuyListPage } from "../pages/admin/m07_buy";
import { ログインする, 買取する商品を選ぶ, 申込む } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 買取状況を設定する, 試験管理者を用意する } from "./m07-common";
import { 個別入力商品をDBで作る, 買取依頼日をDBで設定する, 買取状況をDBで設定する } from "./m07-db-prep";
import { 会員のプレイヤーID } from "../db/m07_02";

export const M0702_ADMIN: Account = { loginId: "m0702_admin", password: "Passw0rd!M0702" };
const ADM = ["S-M07-02-ADM"];
const BASE = ["S-M07-02-ADM", "S-M07-02-MASTER", "S-M07-02-CONFIG"];

/** 注文日・買取依頼日（日本時間） */
const 日 = (s: string): string => `${s}+09`;
const 九月二日 = "2026-09-02 14:30:00";

/** 注文者名（姓）。実行の印つき。ケースが検索欄に入れる値もこれ */
export const 姓 = (正本: string): string => rc(正本);
/** ケース005・006の注文者名（2人の姓に共通する検索語）と、020の2語の検索語 */
export const 検索語005 = (): string => rc("M0702SEL005");
export const 検索語006 = (): string => rc("M0702SEL006");
export const 検索語020 = (): string => `M0702DP 020-${RUN_MARK}`;

type 控えた会員 = { 姓: string; 名: string; メール: string; 会員ID: string };
/** シードごとに控える会員（同じケースの中の後続のシードが使う。プロセスの中だけ） */
const 会員の控え = new Map<string, 控えた会員>();
/** 015 のように、シード表に呼び名の無い控え */
export const 控え015 = new Map<string, string>();

defineSeed("S-M07-02-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0702_ADMIN, "M07-02試験管理者");
});

defineSeed("S-M07-02-MASTER", { needs: ADM }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    const have = (await page.locator("#admin_purchase_list_buy_order_status option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const miss = ["注文", "振込完了", "キャンセル済み"].filter((n) => !have.includes(n));
    if (miss.length) throw new Error(`買取状況の選択肢に ${miss.join("・")} が無い（ある選択肢: ${have.join("、")}）`);
    const names = await page.locator('input[name*="identityConfirmStatus"]').evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    if (!names.includes("オンライン本人確認済み")) throw new Error(`本人確認の選択肢に「オンライン本人確認済み」が無い（ある選択肢: ${names.join("、")}）`);
    const counts = (await page.locator("#page_count_pulldown option").allInnerTexts()).map((t) => t.trim());
    if (!counts.includes("10件")) throw new Error(`表示件数の選択肢に「10件」が無い（ある選択肢: ${counts.join("、")}）`);
  });
  reportSeedIssue(seed.シードID, "シード作成時の問題: 標準マスタはシード表では「標準マスタ投入で登録する」。DBへは書き込まず、開発環境の既存のマスタを使った（買取状況・本人確認ステータス・表示件数「10件」が買取検索一覧の選択肢にあることを画面で確かめた）");
});

defineSeed("S-M07-02-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: CSV出力設定（文字コード・区切り文字・囲み文字）は共有の設定のため書き換えていない。その環境の設定のまま出力する（シード表が定める既定値＝UTF-8・カンマ・二重引用符のはず。違う環境ではCSVを読むケースが落ちる）");
});

/** 会員を作り、その会員でフロントから n 回申込み、買取番号（数字）を申込みの順に返す */
async function 申込む会員を作る(browser: Browser, seedId: string, o: { 姓: string; 名?: string; セイ?: string; メール元: string; 住所2?: string; 住所3?: string; 回数: number }): Promise<{ 会員: 控えた会員; 番号: string[] }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 名 = o.名 ?? "シード";
  const メール = `${rc(o.メール元)}@example.test`.toLowerCase();
  const 会員ID = await 会員を用意する(browser, seedId, { 姓: o.姓, 名, セイ: o.セイ ?? "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"], 住所2: o.住所2, 住所3: o.住所3, 本人確認: "オンライン本人確認済み" });
  issue(`シード作成時の問題: 会員は、フロントの会員登録＋管理画面の会員登録編集（本会員・職業・本人確認ステータス「オンライン本人確認済み」）で作った。メールアドレスは実行の印つき（${メール}）。注文者名（姓）は「${o.姓}」`);
  const 会員 = { 姓: o.姓, 名, メール, 会員ID };
  return { 会員, 番号: await 追加で申込む(browser, seedId, 会員, o.回数) };
}

/** 作った会員で、フロントから n 回申込む。一覧で番号の行の氏名を確かめる */
async function 追加で申込む(browser: Browser, seedId: string, 会員: 控えた会員, 回数: number): Promise<string[]> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const 番号: string[] = [];
  try {
    await hideDebugToolbar(ctx);
    const fp = await ctx.newPage();
    fp.setDefaultTimeout(60_000);
    await ログインする(fp, { メール: 会員.メール, パスワード: 会員のパスワード });
    const 商品ID = await 買取する商品を選ぶ(fp);
    for (let i = 0; i < 回数; i++) 番号.push(String(Number(await 申込む(fp, 商品ID))));
  } finally { await ctx.close(); }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 番号) {
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(n);
      await l.検索する();
      const rows = (await l.行()).filter((r) => r.番号 === n);
      if (rows.length !== 1) throw new Error(`${seedId}: 買取検索一覧に買取番号 ${n} の行が無い`);
      if (!rows[0].氏名.replace(/\s/g, "").includes(`${会員.姓}${会員.名}`.replace(/\s/g, ""))) throw new Error(`${seedId}: 買取番号 ${n} の行の氏名が「${rows[0].氏名}」（${会員.姓} ${会員.名} のはず）`);
    }
  });
  reportSeedIssue(seedId, "シード作成時の問題: 買取は、既存の買取できる商品1点を数量1で申し込んだ（グッズ商品CSVは使わない）。買取番号は完了画面の番号を控え、買取検索一覧をその番号で検索して氏名を確かめた（シード表は注文者名で検索した行から控える定め。同じ検索語の行を実行の印で絞っている）");
  return 番号;
}

/** 注文日などをDBで設定したことを注記に残して設定する */
function 注文日をDBで設定する(seedId: string, 番号: string, 会員: 控えた会員, 日時: string): void {
  買取依頼日をDBで設定する(番号, 会員.メール, 日(日時));
  reportSeedIssue(seedId, `シード作成時の問題: 注文日・買取依頼日は画面で指定できないので、DBで買取 ${番号} の注文日を ${日時} にした（実行の印つきの買取にだけ書いた）`);
}

type 作り方 = {
  会員ラベル: string; 姓: string; 名?: string; セイ?: string; メール元: string; 住所2?: string; 住所3?: string;
  回数: number; 買取ラベル: string[]; needs?: string[];
  /** 買取番号（順）を渡して、画面で作れない部分を整える */
  後で?: (a: { browser: Browser; 番号: string[]; 会員: 控えた会員; seedId: string }) => Promise<void>;
};

/** 会員1人を作って申込み、〔会員ID〕〔プレイヤーID〕〔買取注文ID〕を控えるシード */
function 買取のシード(seedId: string, o: 作り方): void {
  defineSeed(seedId, { needs: [...ADM, ...(o.needs ?? [])] }, async ({ browser, notes }) => {
    const { 会員, 番号 } = await 申込む会員を作る(browser, seedId, { ...o, 姓: o.姓 });
    会員の控え.set(o.会員ラベル, 会員);
    notes.set(`〔会員ID-M0702-${o.会員ラベル}〕`, 会員.会員ID);
    notes.set(`〔プレイヤーID-M0702-${o.会員ラベル}〕`, 会員のプレイヤーID(会員.会員ID));
    o.買取ラベル.forEach((l, i) => notes.set(`〔買取注文ID-M0702-${l}〕`, 番号[i]));
    await o.後で?.({ browser, 番号, 会員, seedId });
  });
}

const 注文日だけ = (日時: string) => async (a: { 番号: string[]; 会員: 控えた会員; seedId: string }) => 注文日をDBで設定する(a.seedId, a.番号[0], a.会員, 日時);

// ---- 003 ----
買取のシード("S-M07-02-RICH-003", { 会員ラベル: "003", 姓: 姓("M0702RICH003"), メール元: "m0702-003", 回数: 1, 買取ラベル: ["003A"], 後で: 注文日だけ(九月二日) });

// 過去の注文2件（B: 2026-07-01・振込完了、C: 2026-08-15・キャンセル済み）。会員は RICH-003 の会員
defineSeed("S-M07-02-HISTORY-003", { needs: [...ADM, "S-M07-02-RICH-003"] }, async ({ browser, notes, seed }) => {
  const 会員 = 会員の控え.get("003");
  if (!会員) throw new Error("S-M07-02-RICH-003 の会員を控えていない");
  const A = notes.get("〔買取注文ID-M0702-003A〕");
  const [B, C] = await 追加で申込む(browser, seed.シードID, 会員, 2);
  notes.set("〔買取注文ID-M0702-003B〕", B);
  notes.set("〔買取注文ID-M0702-003C〕", C);
  await 買取状況を設定する(browser, [[C, "キャンセル済み"]], (m) => reportSeedIssue(seed.シードID, `シード作成時の問題: ${m}`));
  注文日をDBで設定する(seed.シードID, B, 会員, "2026-07-01 12:00:00");
  買取状況をDBで設定する(B, 会員.メール, "振込完了");
  reportSeedIssue(seed.シードID, `シード作成時の問題: 買取 ${B} の買取状況「振込完了」は画面で指定できないので、DBで設定した`);
  注文日をDBで設定する(seed.シードID, C, 会員, "2026-08-15 12:00:00");
  await 会員の買取が揃うか(browser, 会員, [A, B, C].map((x) => String(Number(x))));
});

/** 会員の姓で一覧を検索し、買取注文が期待の番号の組だけであることを確かめる（シード表の確認） */
async function 会員の買取が揃うか(browser: Browser, 会員: 控えた会員, 番号: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    await l.注文者名を入れる(会員.姓);
    await l.検索する();
    const got = (await l.行()).map((r) => r.番号).sort();
    if (JSON.stringify(got) !== JSON.stringify([...番号].sort())) throw new Error(`注文者名「${会員.姓}」の買取が ${got.join("・")}（${番号.join("・")} だけのはず）`);
  });
}

// ---- 005 ----
買取のシード("S-M07-02-RICH-005", { 会員ラベル: "005A", 姓: `${検索語005()}-A`, メール元: "m0702-005-a", 回数: 1, 買取ラベル: ["005A"], 後で: 注文日だけ(九月二日) });
買取のシード("S-M07-02-SECOND-005", { 会員ラベル: "005B", 姓: `${検索語005()}-B`, メール元: "m0702-005-b", 回数: 1, 買取ラベル: ["005B"], needs: ["S-M07-02-RICH-005"], 後で: 注文日だけ("2026-09-01 10:00:00") });

// ---- 006 ----
買取のシード("S-M07-02-RICH-006", { 会員ラベル: "006A", 姓: `${検索語006()}-A`, メール元: "m0702-006-a", 回数: 1, 買取ラベル: ["006A"] });
買取のシード("S-M07-02-SECOND-006", { 会員ラベル: "006B", 姓: `${検索語006()}-B`, メール元: "m0702-006-b", 回数: 1, 買取ラベル: ["006B"], needs: ["S-M07-02-RICH-006"] });

/** 存在しない買取番号であることを確かめるシード（あれば止める。共有の環境の買取は消さない） */
function 存在しない番号(seedId: string, 番号: string): void {
  defineSeed(seedId, { needs: ADM }, async ({ browser }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(番号);
      await l.検索する();
      const rows = await l.行();
      if (rows.length !== 0) throw new Error(`${seedId}: 買取番号 ${番号} の買取が存在する（${rows.length}件）。共有の環境の買取は削除しないので止める`);
    });
    reportSeedIssue(seedId, `シード作成時の問題: 買取番号 ${番号} が存在しないことを一覧の検索で確かめた。シード表は「1件表示されたら削除する」定めだが、存在したときは共有の環境の買取を消さずに止める`);
  });
}
存在しない番号("S-M07-02-NOTFOUND-006", "970299006");
存在しない番号("S-M07-02-NOTFOUND-009", "999999009");
存在しない番号("S-M07-02-NOTFOUND-010", "999999010");

// ---- 007・009・010・011 ----
買取のシード("S-M07-02-RICH-007", { 会員ラベル: "007", 姓: 姓("M0702RICH007"), メール元: "m0702-007", 回数: 1, 買取ラベル: ["007"] });
買取のシード("S-M07-02-RICH-009", { 会員ラベル: "009", 姓: 姓("M0702RICH009"), メール元: "m0702-009", 回数: 1, 買取ラベル: ["009"] });
買取のシード("S-M07-02-RICH-010", { 会員ラベル: "010", 姓: 姓("M0702RICH010"), メール元: "m0702-010", 回数: 1, 買取ラベル: ["010"] });
買取のシード("S-M07-02-RICH-011", { 会員ラベル: "011", 姓: 姓("M0702RICH011"), メール元: "m0702-011", 回数: 1, 買取ラベル: ["011"] });

// ---- 008 ----
買取のシード("S-M07-02-PAGING-008", {
  会員ラベル: "008", 姓: 姓("M0702PAGE008"), メール元: "m0702-008", 回数: 11,
  買取ラベル: ["008A", "008B", "008C", "008D", "008E", "008F", "008G", "008H", "008I", "008J", "008K"],
  後で: async ({ browser, 番号, 会員 }) => { await 会員の買取が揃うか(browser, 会員, 番号); },
});

// ---- 013 ----
買取のシード("S-M07-02-RICH-013", {
  会員ラベル: "013", 姓: "山田", 名: "太郎", セイ: "ヤマダゼロイチサン", メール元: "m0702-013", 住所2: "丸の内1-1", 住所3: "ハレルヤ,ビル", 回数: 1, 買取ラベル: ["013"], 後で: 注文日だけ(九月二日),
});

// ---- 017〜020 ----
買取のシード("S-M07-02-QTY-017", { 会員ラベル: "017", 姓: 姓("M0702DPQ017"), メール元: "dpm0702-017", 回数: 1, 買取ラベル: ["017"], 後で: 注文日だけ(九月二日) });
買取のシード("S-M07-02-FIRST-018", { 会員ラベル: "018", 姓: 姓("M0702DPF018"), メール元: "dpm0702-018", 回数: 1, 買取ラベル: ["018"], 後で: 注文日だけ(九月二日) });

/** 過去注文（買取依頼日 2026-07-01・振込完了）を1件持つ会員。番号は申込みの順に [過去, 今回] */
const 過去1件を持つ = (seedId: string, o: { 会員ラベル: string; 姓: string; メール元: string; 過去ラベル: string; 今回ラベル: string }) =>
  買取のシード(seedId, {
    会員ラベル: o.会員ラベル, 姓: o.姓, メール元: o.メール元, 回数: 2, 買取ラベル: [o.過去ラベル, o.今回ラベル],
    後で: async ({ 番号, 会員, seedId: id }) => {
      注文日をDBで設定する(id, 番号[1], 会員, 九月二日);
      注文日をDBで設定する(id, 番号[0], 会員, "2026-07-01 12:00:00");
      買取状況をDBで設定する(番号[0], 会員.メール, "振込完了");
      reportSeedIssue(id, `シード作成時の問題: 買取 ${番号[0]} の買取状況「振込完了」は画面で指定できないので、DBで設定した`);
    },
  });
過去1件を持つ("S-M07-02-PAST1-019", { 会員ラベル: "019", 姓: 姓("M0702DPP019"), メール元: "dpm0702-019", 過去ラベル: "019B", 今回ラベル: "019A" });
過去1件を持つ("S-M07-02-HIST-020", { 会員ラベル: "020A", 姓: `M0702DPM020-${RUN_MARK}`, メール元: "dpm0702-020-a", 過去ラベル: "020P", 今回ラベル: "020A" });
買取のシード("S-M07-02-NOHIST-020", { 会員ラベル: "020B", 姓: `M0702DPN020-${RUN_MARK}`, メール元: "dpm0702-020-b", 回数: 1, 買取ラベル: ["020B"], 後で: 注文日だけ("2026-09-02 15:00:00") });

// ---- 015（更新しないこと。固定IDの代わりに画面で作った買取を使う） ----
// RICH-015: 会員・買取1件（明細1件）・個別入力商品1件。HISTORY-015: 同じ会員の過去の買取2件。
defineSeed("S-M07-02-RICH-015", { needs: ADM }, async ({ browser, seed }) => {
  const { 会員, 番号 } = await 申込む会員を作る(browser, seed.シードID, { 姓: 姓("M0702RICH015"), メール元: "m0702-015", 回数: 1 });
  会員の控え.set("015", 会員);
  控え015.set("会員ID", 会員.会員ID);
  控え015.set("買取番号", 番号[0]);
  注文日をDBで設定する(seed.シードID, 番号[0], 会員, 九月二日);
  個別入力商品をDBで作る(番号[0], 会員.メール, [{ 名前: rc("M0702-015-IND"), 査定金額: 500, 数量: 1, 売却: "未定" }]);
  reportSeedIssue(seed.シードID, "シード作成時の問題: シード表は固定ID（買取注文702001015・明細723001015/723002015・個別入力商品724001015 など）と更新日時をDBで指定して登録する定めだが、固定IDは振れないので、画面で作った買取（明細は申込みの1件）に、個別入力商品を1件DBで足した。ケースは、画面が振った番号で確かめる");
});

defineSeed("S-M07-02-HISTORY-015", { needs: [...ADM, "S-M07-02-RICH-015"] }, async ({ browser, seed }) => {
  const 会員 = 会員の控え.get("015");
  if (!会員) throw new Error("S-M07-02-RICH-015 の会員を控えていない");
  const [p1, p2] = await 追加で申込む(browser, seed.シードID, 会員, 2);
  注文日をDBで設定する(seed.シードID, p1, 会員, "2026-07-01 12:00:00");
  注文日をDBで設定する(seed.シードID, p2, 会員, "2026-08-15 12:00:00");
  控え015.set("過去の買取番号", `${p1},${p2}`);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 固定ID（725001015・725002015）と更新日時の指定は振れないので、画面で作った過去の買取2件にした");
});
