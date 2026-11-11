/**
 * F08-02（店頭買取査定申込情報入力）の画面シード。正本: cases/F08-02_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10。チームの結合テスト実施手順に合わせる）で、シード表の「DBで準備」は、画面で作れる同じ前提か既存データへ読み替えた。
 * 読み替えたことは、そのシードを使うケースの注記（シード作成時の問題）に残す（reportSeedIssue）。DB へは書き込まない。
 *
 * - 店舗（STORE・STORE-NNN・BL-ADDR-NNN・CBABROAD-NNN・CBSKIP-062）: ケースごとの店舗を作らず、F08-05 で共通の試験店舗
 *   「店頭買取PD0805-003」（支店URL itf0805pd003。無ければ登録）を使う。店舗識別名（it_f0802 など）は画面で指定できず、
 *   ケースごとに店舗を作ると共有の開発環境に店舗が残るため。手順の店舗識別名はこの店舗の支店URLとして読む。控える店舗IDは、どの呼び名もこの店舗のID。
 *   「店頭買取査定申込み=0件」は、申込者の姓かメールアドレスに実行の印を付けて、この実行の申込み・会員だけを数えることで代えた。
 * - 会員登録フォームの入力値（ENTRY-*）と、ブラックリストを使うシードのメールアドレス: 前半に実行の印を付ける。
 *   同じメールアドレスの会員・プレイヤーを DB で削除して0件にする作り方は、印で新しいアドレスになることで代えた（消さない）。
 * - ブラックリスト: 「一致する行があれば削除」は、共有のデータなので消さず、一致する行が無いことを画面で確かめる（あれば止める）。
 *   住所のキーワードには実行の印を付ける（手順の住所の同じ値にも同じ印を付ける）。電話番号「0399990216」は印を付けられないので、
 *   あれば使い、無ければ登録する（1行だけ残る）。
 * - 会員（MEMBER・MEMBER-NOREG-056・CBMEMBER-NNN）: シード表のとおりフロントの会員登録で作り、管理画面の会員登録編集で住所3を入れて本会員にする。
 *   メールアドレスの前半に実行の印を付ける。登録番号は、シード表のとおりネット買取の申込み（適格請求書発行事業者「はい」）で残す。
 *   申込みに使う買取の商品は、グッズ商品CSV登録で作る F08-02 の試験用の商品（商品コード F0802-BUY-ITEM。あれば使い、無ければ登録。1件だけ残る）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { openEditFromResult, resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { blacklistRows, ensureBlacklist, 拒否種別 } from "../pages/admin/f06_masters";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { ensureStore } from "../pages/admin/m04_24_store";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { EntryPage } from "../pages/front/f06_01_entry";
import { 申込入力, 申込者 } from "../pages/front/f08_05_confirm";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { PD_STORE } from "./f08-05";

export { PD_STORE };

// ---- 入力値（シード表の取り決め） ----

/** S-F08-02-IN-JP */
export const IN_JP: 申込入力 = {
  言語: "JP", 国: "日本", 郵便番号: ["100", "0001"], 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1",
  生年月日: ["1990", "1", "1"], 電話: ["03", "1234", "5678"], 職業: "会社員", サプライ: ["スリーブ", "ストレージボックス"],
  電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true,
};
export const IN_JPの申込者: 申込者 = { 姓: "結合", 名: "太郎", セイ: "ケツゴウ", メイ: "タロウ", 住所3: "晴れる屋ビル3階" };

/** S-F08-02-IN-MINOR（職業・返却希望サプライはシード表に無い。職業は必須の欄なので IN-JP と同じ「会社員」を入れる） */
export const IN_MINOR: 申込入力 = { ...IN_JP, 生年月日: ["2015", "1", "1"], サプライ: [] };
export const IN_MINORの申込者: 申込者 = { 姓: "結合", 名: "未成年", セイ: "ケツゴウ", メイ: "ミセイネン", 住所3: "" };

/** S-F08-02-IN-EN（郵便番号・職業はシード表に無い。職業は必須の欄なので「会社員」に当たる選択肢を入れ、郵便番号は入れない） */
export const IN_EN: 申込入力 = {
  ...IN_JP, 言語: "EN", 国: "米国", 郵便番号: undefined, 都道府県: undefined, 住所1: "New York", 住所2: "5th Avenue",
  電話: ["01", "2345", "6789"], サプライ: [],
};
export const IN_ENの申込者: 申込者 = { 姓: "Smith", 名: "Alice", 住所3: "Suite 301" };

/** S-F08-02-IN-REGNO-058 */
export const IN_REGNO_058: 申込入力 = { ...IN_JP, 適格請求書発行事業者: "はい", 登録番号: "TF0802-058" };
/** S-F08-02-IN-SUPPLY1-059 */
export const IN_SUPPLY1_059: 申込入力 = { ...IN_JP, サプライ: ["スリーブ"] };
/** S-F08-02-IN-SUPPLY-045 */
export const IN_SUPPLY_045: 申込入力 = { ...IN_JP, サプライその他: "F0802-045-SUP" };
/** S-F08-02-IN-TEL5-044 */
export const IN_TEL5_044: 申込入力 = { ...IN_JP, 電話: ["12345", "12345", "12345"] };

/** CBABROAD-06N の入力値（英語・米国。姓に実行の印） */
export const CB海外の入力 = (n: "060" | "061"): { 入力: 申込入力; 申込者: 申込者 } => ({
  入力: { ...IN_EN, 住所1: `Ave-F0802-CB${n}`, 住所2: n === "061" ? rc("Rd-F0802-CB061") : `Rd-F0802-CB${n}` },
  申込者: { 姓: rc(`SmithF0802CB${n}`), 名: "Alice", 住所3: `Suite-F0802-CB${n}` },
});
/** CBSKIP-062 の申込者（姓に実行の印） */
export const CBSKIPの申込者 = (): 申込者 => ({ ...IN_JPの申込者, 姓: rc("結合F0802CB062") });

/** 会員登録フォームのメールアドレス（正本の前半に実行の印を付けた値） */
export const 印つきメール = (正本: string): string => {
  const [local, domain] = 正本.split("@");
  return `${rc(local)}@${domain}`;
};

/** BL-ADDR-05N の住所（手順で変える欄）と、ブラックリストのキーワード（どちらも同じ実行の印） */
export const 住所ブラックリスト = (n: "050" | "051" | "052" | "053"): { 住所1?: string; 住所2: string; キーワード: string } => {
  switch (n) {
    case "050": return { 住所2: rc("F0802-050-ADDR"), キーワード: `東京都千代田区${rc("F0802-050-ADDR")}` };
    case "051": return { 住所1: `千代田区 ${rc("F0802-051")}`, 住所2: "ビル　3階", キーワード: `東京都千代田区${rc("F0802-051")}ビル3階` };
    case "052": return { 住所2: `${rc("F0802-052")}ビル`, キーワード: `東京都千代田区${rc("F0802-052")}` };
    case "053": return { 住所2: rc("F0802-053"), キーワード: `東京都 千代田区${rc("F0802-053")}` };
  }
};
/** CBABROAD-06N の住所のブラックリストのキーワード */
export const 海外住所のキーワード = (n: "060" | "061"): string =>
  n === "060" ? rc("日本国外F0802-CB060-NOMATCH") : `日本国外Ave-F0802-CB061${rc("Rd-F0802-CB061")}`;

const 入力値の取り決め = [
  "S-F08-02-IN-JP", "S-F08-02-IN-MINOR", "S-F08-02-IN-EN", "S-F08-02-IN-MAX128-040", "S-F08-02-IN-TEL5-044", "S-F08-02-IN-SUPPLY-045",
  "S-F08-02-LANG-TOEN-047", "S-F08-02-LANG-TOEN-048", "S-F08-02-LANG-TOJP-049", "S-F08-02-IN-REGNO-058", "S-F08-02-IN-SUPPLY1-059",
  "S-F08-02-CBSESSION-063", "S-F08-02-CBSESSION-066", "S-F08-02-CBSESSION-067", "S-F08-02-CBSESSION-068", "S-F08-02-CBSESSION-069",
];
for (const id of 入力値の取り決め) defineSeed(id, async () => { /* 入力値・新しいブラウザセッションの取り決め。投入は要らない */ });

/** 会員登録フォームの入力値（同じメールアドレスの会員・プレイヤーを DB で削除して0件にする作り方は、印つきのアドレスで代える） */
for (const id of ["S-F08-02-ENTRY-ABROAD-014", "S-F08-02-ENTRY-PLAYER", "S-F08-02-ENTRY-PLAYER-015", "S-F08-02-ENTRY-PLAYER-016", "S-F08-02-ENTRY-JP-057"]) {
  defineSeed(id, async ({ seed }) => {
    reportSeedIssue(seed.シードID, "会員登録フォームのメールアドレスの前半に実行の印を付けた。同じメールアドレスの会員・プレイヤーを DB で削除して0件にする作り方は、" +
      "印で新しいアドレスになることで代えた（DB で削除しない）");
  });
}

// ---- 店舗（F08-05 と共通の試験店舗） ----

const 店舗の注記 = (正本の店舗識別名: string) =>
  `店舗識別名「${正本の店舗識別名}」の店舗を新しく作らず（店舗識別名は画面で指定できない）、F08-05 と共通の試験店舗「${PD_STORE.店名}」` +
  `（支店URL ${PD_STORE.支店URL}。無ければ登録）に読み替えた。手順の店舗識別名もこの店舗の支店URLとして読む。` +
  "店頭買取査定申込み0件の前提は、申込者の姓かメールアドレスに実行の印を付けて、この実行の申込み・会員だけを数えることで代えた";

async function 共通の店舗(browser: Browser, seedId: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, PD_STORE, (m) => reportSeedIssue(seedId, m));
  });
}

for (const [seedId, 呼び名, 識別名] of [
  ["S-F08-02-STORE", "共有", "it_f0802"], ["S-F08-02-STORE-014", "014", "it_f0802_014"], ["S-F08-02-STORE-015", "015", "it_f0802_015"],
  ["S-F08-02-STORE-016", "016", "it_f0802_016"], ["S-F08-02-STORE-057", "057", "it_f0802_057"],
] as const) {
  defineSeed(seedId, async ({ browser, notes }) => {
    notes.set(`〔店舗ID-F0802-${呼び名}〕`, await 共通の店舗(browser, seedId));
    reportSeedIssue(seedId, 店舗の注記(識別名));
  });
}

// ---- ブラックリスト ----

/** 一致してはならない行が無いことを確かめ（あれば消さずに止める）、キーワードの行を登録して、その行のブラックリストIDを返す */
async function ブラックリストを用意する(browser: Browser, 無いこと: { 種別: string; キーワード: string }[], 登録: { 種別: 拒否種別; キーワード: string }): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const rows = await blacklistRows(page);
    const hit = rows.filter((r) => 無いこと.some((w) => w.種別 === r.種別 && w.キーワード === r.キーワード));
    if (hit.length) throw new Error(`一致してはならないブラックリストの行がある（${hit.map((h) => `${h.種別}「${h.キーワード}」`).join("、")}）。共有のデータなので消さずに止めた`);
    await ensureBlacklist(page, 登録.種別, 登録.キーワード);
    const row = (await blacklistRows(page)).filter((r) => r.種別 === 登録.種別 && r.キーワード === 登録.キーワード);
    if (row.length !== 1) throw new Error(`ブラックリストの${登録.種別}「${登録.キーワード}」の行が ${row.length} 件ある（1件のはず）`);
    return row[0].id;
  });
}

const 消さない注記 = (行: string) => `ブラックリストの${行}の行があれば削除する作り方は、共有のデータなので削除せず、その行が無いことを画面で確かめた（あれば止める）`;

defineSeed("S-F08-02-BLACKLIST-TEL-016", async ({ browser, notes, seed }) => {
  notes.set("〔ブラックリストID-F0802-016〕", await ブラックリストを用意する(browser,
    [{ 種別: "氏名", キーワード: "結合太郎" }, { 種別: "住所", キーワード: "東京都千代田区千代田1-1" }],
    { 種別: "電話番号", キーワード: "0399990216" }));
  reportSeedIssue(seed.シードID, `${消さない注記("氏名「結合太郎」・住所「東京都千代田区千代田1-1」")}。電話番号「0399990216」の行は、あれば使い、無ければ登録した（実行の印を付けられないので1行が残る）`);
});

for (const n of ["050", "051", "052", "053"] as const) {
  defineSeed(`S-F08-02-BL-ADDR-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0802-${n}〕`, await 共通の店舗(browser, seed.シードID));
    const b = 住所ブラックリスト(n);
    notes.set(`〔ブラックリストID-F0802-${n}〕`, await ブラックリストを用意する(browser,
      [{ 種別: "氏名", キーワード: "結合太郎" }, { 種別: "電話番号", キーワード: "0312345678" }], { 種別: "住所", キーワード: b.キーワード }));
    reportSeedIssue(seed.シードID, `${店舗の注記(`f0802-${n}-shop`)}。${消さない注記("氏名「結合太郎」・電話番号「0312345678」")}。` +
      `住所のキーワードは正本の値に実行の印を付けた「${b.キーワード}」で登録し、手順の住所にも同じ印を付ける。` +
      "同じメールアドレスの会員・プレイヤーを DB で削除する作り方は、メールアドレスの前半に実行の印を付けて代えた");
  });
}

for (const n of ["060", "061"] as const) {
  defineSeed(`S-F08-02-CBABROAD-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0802-CB${n}〕`, await 共通の店舗(browser, seed.シードID));
    const who = CB海外の入力(n).申込者;
    const kw = 海外住所のキーワード(n);
    notes.set(`〔ブラックリストID-F0802-CB${n}〕`, await ブラックリストを用意する(browser,
      [{ 種別: "氏名", キーワード: `${who.姓}${who.名}` }, { 種別: "電話番号", キーワード: "0123456789" }], { 種別: "住所", キーワード: kw }));
    reportSeedIssue(seed.シードID, `${店舗の注記(`f0802cb${n}shop`)}。${消さない注記(`氏名「${who.姓}${who.名}」・電話番号「0123456789」`)}。` +
      `氏名の姓と住所のキーワードには実行の印を付けた（姓「${who.姓}」、キーワード「${kw}」）。` +
      "同じメールアドレスの会員・プレイヤーを DB で削除する作り方は、メールアドレスの前半に実行の印を付けて代えた");
  });
}

defineSeed("S-F08-02-CBSKIP-062", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-F0802-CB062〕", await 共通の店舗(browser, seed.シードID));
  reportSeedIssue(seed.シードID, `${店舗の注記("f0802cb062shop")}。氏名の姓に実行の印を付けた（${CBSKIPの申込者().姓}）。この姓の会員は作らない`);
});

// ---- 会員 ----

export type F0802会員 = { 姓: string; 名: string; セイ: string; メイ: string; 生年月日: [string, string, string]; メール: string; パスワード: string; 住所3?: string; 登録番号?: string };

const 会員の定義: Record<string, Omit<F0802会員, "メール"> & { 正本のメール: string; 呼び名: string }> = {
  "S-F08-02-MEMBER": { 姓: "結合", 名: "会員", セイ: "ケツゴウ", メイ: "カイイン", 生年月日: ["1990", "1", "2"], 正本のメール: "f0802-member@example.invalid", パスワード: "Passw0rd!F0802", 住所3: "晴れる屋ビル3階", 登録番号: "T1234567890123", 呼び名: "共有" },
  "S-F08-02-MEMBER-NOREG-056": { 姓: "結合", 名: "無番号", セイ: "ケツゴウ", メイ: "ムバンゴウ", 生年月日: ["1990", "1", "3"], 正本のメール: "dpf0802-056@example.test", パスワード: "Passw0rd-F0802056", 呼び名: "056" },
  "S-F08-02-CBMEMBER-072": { 姓: "結合", 名: "会員F0802CB072", セイ: "ケツゴウ", メイ: "カイイン", 生年月日: ["1990", "1", "2"], 正本のメール: "cbf0802-072@example.test", パスワード: "Passw0rd-CBF0802072", 住所3: "晴れる屋ビル3階", 登録番号: "TF0802CB072000", 呼び名: "CB072" },
  "S-F08-02-CBMEMBER-073": { 姓: "結合", 名: "会員F0802CB073", セイ: "ケツゴウ", メイ: "カイイン", 生年月日: ["1990", "1", "2"], 正本のメール: "cbf0802-073@example.test", パスワード: "Passw0rd-CBF0802073", 住所3: "晴れる屋ビル3階", 登録番号: "TF0802CB073000", 呼び名: "CB073" },
  "S-F08-02-CBMEMBER-074": { 姓: "結合", 名: "会員F0802CB074", セイ: "ケツゴウ", メイ: "カイイン", 生年月日: ["1990", "1", "2"], 正本のメール: "cbf0802-074@example.test", パスワード: "Passw0rd-CBF0802074", 住所3: "晴れる屋ビル3階", 呼び名: "CB074" },
};

/** シードの会員（メールアドレスは実行の印つき） */
export function F0802の会員(seedId: keyof typeof 会員の定義 | string): F0802会員 {
  const d = 会員の定義[seedId];
  if (!d) throw new Error(`${seedId} は F08-02 の会員のシードではない`);
  return { ...d, メール: 印つきメール(d.正本のメール) };
}

const 商品コード = "F0802-BUY-ITEM";

/** ネット買取の申込みに使う、F08-02 の試験用の買取の商品（グッズ商品CSV登録。あれば使い、無ければ登録）。商品IDを返す */
async function 買取の商品(browser: Browser, issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let ids = await productIdsByCode(page, 商品コード);
    if (ids.length === 0) {
      const categoryId = await readGoodsRootCategoryId(page);
      await registerGoodsCsv(page, {
        what: "F08-02: ネット買取の申込みに使う商品のグッズ商品CSV登録", fileName: "f08-02-buy-item.csv", categoryId,
        lines: [{ code: 商品コード, nameJp: "F0802試験買取品", nameEn: "F0802 Test Buy Item", values: { "基準価格": "1000", "販売価格": "1000", "原価単価": "1000", "買取価格": "1000" } }],
        onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
        uploadWaitMs: 120_000,
      });
      ids = await productIdsByCode(page, 商品コード);
      issue(`ネット買取の申込みに使う商品（商品コード ${商品コード}、買取価格1000円）を、グッズ商品CSV登録でサプライ・グッズのカテゴリに登録した（シード表は任意の商品）`);
    }
    if (ids.length !== 1) throw new Error(`商品コード ${商品コード} の商品が ${ids.length} 件ある（1件のはず）`);
    return ids[0];
  });
}

/**
 * 会員を作る: フロントの会員情報登録画面で登録し、管理画面の会員一覧で会員IDを読み、会員登録（編集）画面で住所3を入れて本会員にする。
 * 登録番号があれば、ネット買取の申込み（適格請求書発行事業者「はい」）で残す。会員IDを返す。
 */
export async function 会員を作る(browser: Browser, m: F0802会員, issue: (m: string) => void): Promise<string> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const e = new EntryPage(await ctx.newPage());
    e.page.setDefaultTimeout(60_000);
    await e.open();
    await e.fill({
      姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: m.生年月日, メール: m.メール, パスワード: m.パスワード,
      国: "Japan", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1", 電話番号: "0312345678", 職業: "会社員",
    });
    // 郵便番号から住所を自動で入れるスクリプトが遅れて住所1を上書きすることがあるので、落ち着いてから入れ直す
    await e.page.waitForTimeout(1500);
    for (const [name, value] of [["address][addr01", "千代田区"], ["address][addr02", "千代田1-1"]] as const) {
      if ((await e.f(name).inputValue()) !== value) await e.f(name).fill(value);
    }
    if (!(await e.同意する()).sent) throw new Error(`会員 ${m.メール} の登録: 「同意して確認画面へ」を押しても確認画面へ進めない`);
    await e.登録する();
    if (e.登録エラー画面か) throw new Error(`会員 ${m.メール} の登録が登録エラーの画面になった（${e.path}）`);
  } finally {
    await ctx.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 共有の開発環境では、登録直後の会員が会員一覧の検索にすぐ出ないことがある。間をおいて検索し直す（最大で約1分）
    let found: string | null = null;
    for (let i = 0; ; i++) {
      await searchCustomer(page, m.メール);
      found = await resultCustomerId(page, m.メール);
      if (found || i >= 5) break;
      await page.waitForTimeout(10_000);
    }
    if (!found) throw new Error(`会員 ${m.メール} が管理画面の会員一覧で1件に定まらない`);
    await openEditFromResult(page, m.メール);
    const ed = new M08CustomerEditPage(page);
    const before = await ed.選択中("status");
    if (m.住所3 !== undefined) await ed.set("address][addr03", m.住所3);
    await ed.選ぶ("status", "本会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${m.メール} の会員登録（編集）の保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
    issue(`会員 ${m.メール}（メールアドレスの前半に実行の印）を登録した。会員登録（編集）画面で${m.住所3 !== undefined ? `住所3「${m.住所3}」を入れ、` : ""}` +
      `会員ステータスを「${before}」から本会員にして保存した`);
    return found;
  });
  if (m.登録番号) {
    const 商品ID = await 買取の商品(browser, issue);
    const fctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(fctx);
      const fp = await fctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール: m.メール, パスワード: m.パスワード });
      const no = await 条件つきで申込む(fp, [{ 商品ID, 数量: "1" }], { 承諾方法: "査定結果を確認してから承諾する", 登録番号: m.登録番号, 口座名義: "ケツゴウ カイイン" });
      issue(`ネット買取の申込み（買取番号の番号部分 ${no}）を、適格請求書発行事業者「はい」・登録番号「${m.登録番号}」で行った。` +
        "ログインは「買取手続きへ」の前にフロントのログイン画面で行った。買取手続きのほかの必須項目は任意の有効な値");
    } finally {
      await fctx.close();
    }
  }
  return id;
}

for (const seedId of Object.keys(会員の定義)) {
  defineSeed(seedId, async ({ browser, notes }) => {
    const m = F0802の会員(seedId);
    notes.set(`〔会員ID-F0802-${会員の定義[seedId].呼び名}〕`, await 会員を作る(browser, m, (s) => reportSeedIssue(seedId, s)));
  });
}
