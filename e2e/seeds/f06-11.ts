/**
 * F06-11 買取履歴一覧の画面シード。正本: cases/F06-11_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの報告（reportSeedIssue。エビデンスの「シード作成時の問題」）に残す。
 *
 * 作り方（シード表の手順を画面で行う。読み替えた点）:
 * - 会員: フロントの会員情報登録で登録し本会員にする（seeds/f06-member.ts の 本会員を作る。本登録のメールを読めない環境では管理画面で本会員にする）。
 *   管理画面の会員一覧で会員IDを控える。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードはシード表の値。
 * - 表示件数のマスタ（PAGE-MASTER）: 共有の設定なので書き換えない。マスタデータ管理で行を読み、シード表の9行と同じことを確かめるだけ（違えば止める）。
 * - ネット買取に使う「任意の商品」: グッズ商品CSV登録で F06-11 用の商品を2件（買取価格1000円・公開）作り、この実行の中で使い回す（あれば使う）。
 *   商品コード・商品名は実行の印つき。商品名をシード表の〔商品名-…〕として控える。CB のシードはシード表の商品コード・商品名（＋実行の印）で作る。
 *   販売価格は買取価格より大きい値しか登録できないので、基準価格・販売価格は買取価格＋1（M07 の部品と同じ）。
 * - ネット買取: 会員でフロントにログインし、商品をカートに入れて申し込む。マイページの買取履歴一覧に出た買取番号（7桁の表示）を控える。
 *   買取状況は管理画面の買取情報編集で選んで保存する（全権限の管理者）。
 * - 店頭買取: シード表の店舗「晴れる屋テスト店」（支店URL f0611owners）・「F0611-024-テスト店」は店舗登録で作る定めだが、共有のマスタに店舗を足さないため、
 *   M06-01 の試験店舗「買取店舗A」（S-M06-01-SHOPS。あれば使い、無ければ作る）に読み替える（F06-15 と同じ）。〔店舗ID-…〕は買取店舗Aの店舗IDを控える。
 *   ステータスは M06-01 の全店管理者（買取店舗A・B を編集可能店舗に持つ）でステータス変更画面から変える。申込者名は「晴屋」＋実行の印つきの名。
 * - 依頼日（2026-06-10 など）は DB でしか入らないので入れない（申込みの日時のまま）。依頼日の値・順を確かめるケース（005・026・050・054）は実装しない。
 * - 振込完了（ネット）・買取成立（店頭）は、画面で選んで保存すると次の状況へ自動で進む（シード表の注記）。選んで保存し、進んだ状況（処理状態は同じ「買取完了」）のまま使う。
 */
import { Browser, Page, test } from "@playwright/test";
import { registerFrontMember } from "../pages/front/member_entry";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 店頭買取のステータスを読む, 表示件数のマスタを読む } from "../pages/admin/f06_11_setup";
import { findProductsByCode } from "../pages/admin/m03_13_product";
import { 一覧から詳細を開く, 申込者名で査定IDを探す } from "../pages/admin/m06_04_status";
import { OtcDetailPage } from "../pages/admin/m06_otc_list";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { PurchaseHistoryListPage } from "../pages/front/f06_11_purchase_history";
import { applyAsMember } from "../pages/front/m06_otc_buy";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 本会員を作る, markedMail } from "./f06-member";
import { M0601_ADMIN_ALL, STORE_A } from "./m06-01";
import { 商品を論理削除済みにDBで設定する, 店頭買取をDBで設定する, 明細をDBで設定する } from "./f06-prep";
import { 個別入力商品をDBで作る, 買取依頼日をDBで設定する, 買取状況をDBで設定する } from "./m07-db-prep";
import type { 買取状況名 } from "../db/m07_prep";

export const mailOf = (前半: string): string => markedMail(前半);
/** 正本の商品コード・商品名に実行の印を付けた値 */
export const 品 = (正本: string): string => rc(正本);
/** 読み替えた買取店舗（シード表の「晴れる屋テスト店」「F0611-024-テスト店」） */
export const 読み替えた店舗名 = STORE_A.店名;

// ---------------------------------------------------------------- 001〜022 の会員だけのシード（申込みなし）

function defineMemberOnlySeed(seedId: string, n: string, 前半: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0611-${n}〕`, await 本会員を作る(browser, { 姓: "F06-11", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", 前半, パスワード: `F0611PwdCase${n}` }));
  });
}
defineMemberOnlySeed("S-F06-11-CASE-003", "003", "f0611-a-003");
defineMemberOnlySeed("S-F06-11-CASE-004", "004", "f0611-a-004");
defineMemberOnlySeed("S-F06-11-CASE-018", "018", "none-f0611-018");
defineMemberOnlySeed("S-F06-11-CASE-019", "019", "none-f0611-019");
defineMemberOnlySeed("S-F06-11-CASE-022", "022", "f0611-a-022");

// ---------------------------------------------------------------- 部品

/** シード表が呼び名に挙げているときだけ控える（範囲「〔…A〕〜〔…K〕」の中間は控えない） */
function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

async function 会員を用意する(browser: Browser, 前半: string, パスワード: string, 名: string): Promise<string> {
  return 本会員を作る(browser, { 姓: "F06-11", 名, セイ: "シケン", メイ: "カイイン", 前半, パスワード });
}

type 商品の定め = { コード: string; 名前: string; 買取価格: string };

/** グッズ商品CSV登録で商品を作り（同じ商品コードの公開の商品があれば使い）、商品IDを返す（品の順） */
async function 商品を用意する(browser: Browser, seedId: string, 品々: 商品の定め[]): Promise<string[]> {
  const issue = (s: string) => reportSeedIssue(seedId, s);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 既存 = new Map<string, string>();
    for (const p of 品々) {
      const rows = await findProductsByCode(page, 品(p.コード), ["公開"]);
      if (rows.length === 1) 既存.set(p.コード, rows[0].商品ID);
    }
    const 作る = 品々.filter((p) => !既存.has(p.コード));
    if (作る.length) {
      await サプライ品を登録する(page, 作る.map((p) => ({ コード: 品(p.コード), 名前: 品(p.名前), 基準価格: p.買取価格, 買取価格: p.買取価格 })), issue);
      issue(`シード作成時の問題: 商品はグッズ商品CSV登録で作った（商品コード・商品名は実行の印つき: ${作る.map((p) => `${品(p.コード)}／${品(p.名前)}`).join("、")}）。`
        + "基準価格・販売価格は買取価格＋1（販売価格は買取価格より大きい値しか登録できない）");
    }
    const out: string[] = [];
    for (const p of 品々) {
      if (既存.has(p.コード)) { out.push(既存.get(p.コード)!); continue; }
      const rows = await findProductsByCode(page, 品(p.コード), ["公開"]);
      if (rows.length !== 1) throw new Error(`商品マスターに商品コード ${品(p.コード)} の公開の商品が ${rows.length} 件（1件のはず）`);
      out.push(rows[0].商品ID);
    }
    return out;
  });
}

/** シード表の「買取価格が500円以上の任意の商品」に使う、F06-11 用の商品（1・2） */
const 任意の商品の定め: 商品の定め[] = [
  { コード: "F0611-ANY-1", 名前: "F0611-任意商品1", 買取価格: "1000" },
  { コード: "F0611-ANY-2", 名前: "F0611-任意商品2", 買取価格: "1000" },
];
let 任意の商品の約束: Promise<string[]> | null = null;
async function 任意の商品(browser: Browser, seedId: string): Promise<{ 商品ID: string; 名前: string }[]> {
  任意の商品の約束 ??= 商品を用意する(browser, seedId, 任意の商品の定め);
  let ids: string[];
  try { ids = await 任意の商品の約束; } catch (e) { 任意の商品の約束 = null; throw e; }
  reportSeedIssue(seedId, `シード作成時の問題: 「買取価格が500円以上の任意の商品」は、グッズ商品CSV登録で作った F06-11 用の商品（${任意の商品の定め.map((p) => 品(p.名前)).join("・")}。買取価格1000円・公開）を使った`);
  return ids.map((id, i) => ({ 商品ID: id, 名前: 品(任意の商品の定め[i].名前) }));
}

async function 会員のページ<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(page);
  } finally { await ctx.close(); }
}

/** 一覧の番号が会員の買取履歴一覧に出ていて、宛先の種類が合うことを確かめ、詳細のアドレスの番号を返す */
async function 一覧に出ている(page: Page, 番号: string, 種類: "net" | "otc"): Promise<string> {
  const h = new PurchaseHistoryListPage(page);
  await h.指定して開く({ pageSize: 50 });
  if ((await h.番号リンク(番号).count()) === 0) throw new Error(`申込みの完了画面の番号 ${番号} が、マイページの買取履歴一覧に出ない（一覧: ${(await h.番号の並び()).join("、")}）`);
  const to = await h.リンクの宛先(番号);
  if (to.種類 !== 種類) throw new Error(`買取番号 ${番号} のリンクが${種類 === "net" ? "ネット買取" : "店頭買取"}の詳細でない`);
  return to.番号;
}

/** 会員でログインし、同じ商品でネット買取を回数分申し込む。作った順の買取番号（7桁の表示）と詳細の番号を返す */
async function ネット買取を申し込む(browser: Browser, メール: string, パスワード: string, 品々: { 商品ID: string; 数量: string }[], 回数 = 1): Promise<{ 表示: string; 番号: string }[]> {
  return 会員のページ(browser, async (page) => {
    await ログインする(page, { メール, パスワード });
    const 表示: string[] = [];
    for (let i = 0; i < 回数; i++) {
      const done = await 条件つきで申込む(page, 品々, { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケン カイイン", 箱数: "1" });
      表示.push(String(Number(done)).padStart(7, "0"));
    }
    const out: { 表示: string; 番号: string }[] = [];
    for (const t of 表示) out.push({ 表示: t, 番号: await 一覧に出ている(page, t, "net") });
    return out;
  });
}

/** 管理画面の買取情報編集で、査定（査定価格・売却）と買取状況を入れて保存する。保存後の買取状況を返す */
async function 管理画面で保存する(browser: Browser, 番号: string, v: { 査定?: { 名前: string; 査定価格: string; 売却: "売却する" | "売却しない" }[]; 状況: string }): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const e = await 一覧から編集を開く(page, 番号);
    if (v.査定?.length) {
      await e.査定編集を始める();
      for (const m of v.査定) await e.明細を名前で入れる(m.名前, { 査定価格: m.査定価格, 売却: m.売却 });
      await e.査定確定する();
    }
    await e.買取状況を選ぶ(v.状況);
    await e.保存する(`買取番号 ${番号} の保存（${JSON.stringify(v)}）`);
    const e2 = await 一覧から編集を開く(page, 番号);
    return (await e2.基本情報()).買取状況;
  });
}

/** 振込完了を選んで保存したあとに進む状況（処理状態はどれも「買取完了」） */
const 振込完了の先 = ["振込完了", "未登録在庫あり", "入庫待ち", "入庫済み（仕入れ完了）", "入庫済み"];

async function ネット買取の状況を変える(browser: Browser, seedId: string, 表示: string, 番号: string, 状況: string, 査定?: { 名前: string; 査定価格: string; 売却: "売却する" | "売却しない" }[]): Promise<void> {
  const after = await 管理画面で保存する(browser, 番号, { 査定, 状況 });
  if (状況 === "振込完了") {
    if (!振込完了の先.includes(after)) throw new Error(`買取番号 ${表示} の買取状況を「振込完了」にして保存したが、保存後は「${after}」（処理状態が買取完了の状況でない）`);
    reportSeedIssue(seedId, `シード作成時の問題: 買取状況の振込完了はDBで入れる定め。管理画面で「振込完了」を選んで保存した（買取番号 ${表示} の保存後の買取状況は「${after}」。処理状態は振込完了と同じ「買取完了」）`);
  } else if (after !== 状況) {
    throw new Error(`買取番号 ${表示} の買取状況を「${状況}」にして保存したが、保存後は「${after}」`);
  }
}

/** 会員でログインして買取店舗Aに店頭買取査定申込を行い、査定番号（一覧の買取番号）を返す */
async function 店頭買取を申し込む(browser: Browser, メール: string, パスワード: string, 名: string): Promise<string> {
  return (await 店頭買取を申し込んでIDも読む(browser, メール, パスワード, 名)).番号;
}

/** 店頭買取を申し込み、査定番号（一覧の買取番号）と店頭買取のID（詳細のアドレスの番号）を返す */
async function 店頭買取を申し込んでIDも読む(browser: Browser, メール: string, パスワード: string, 名: string): Promise<{ 番号: string; ID: string }> {
  return 会員のページ(browser, async (page) => {
    const 番号 = await applyAsMember(page, STORE_A.支店URL, { メール, パスワード }, { 姓: "晴屋", 名, セイ: "シケン", メイ: "カイイン" });
    const ID = await 一覧に出ている(page, 番号, "otc");
    return { 番号, ID };
  });
}

/** 全店管理者で、申込者名の店頭買取のステータスを変える。変えたあとの買取一覧のステータスを返す */
async function 店頭買取のステータスを変える(browser: Browser, 名: string, 変更後: string): Promise<string> {
  return withAdminSession(browser, M0601_ADMIN_ALL, async (page) => {
    page.setDefaultTimeout(60_000);
    const 査定ID = await 申込者名で査定IDを探す(page, `晴屋 ${名}`, STORE_A.店名);
    await 一覧から詳細を開く(page, 査定ID);
    await new OtcDetailPage(page).ステータスを変える(変更後);
    return 店頭買取のステータスを読む(page, `晴屋 ${名}`, STORE_A.店名).catch((e: Error) => `（読めない: ${e.message.slice(0, 120)}）`);
  });
}

/** 買取成立を選んで保存したあとに進むステータス（処理状態はどれも「買取完了」） */
const 買取成立の先 = ["買取成立", "入庫済み", "未登録在庫あり", "入庫待ち"];

const 店舗の読み替え =(seedId: string, 正本の店名: string) => reportSeedIssue(seedId,
  `シード作成時の問題: 店舗「${正本の店名}」は店舗登録で作る定め。共有のマスタに店舗を足さないため、M06-01 の試験店舗「${STORE_A.店名}」（あれば使い、無ければ作る）に読み替えた。`
  + "店頭買取の買取店舗の表示も、この店名で確かめる。ステータスは M06-01 の全店管理者（編集可能店舗に買取店舗A・Bを持つ）で変えた。申込者名は「晴屋」＋実行の印つきの名");
const 依頼日の読み替え = (seedId: string) => reportSeedIssue(seedId,
  "シード作成時の問題: 依頼日（2026-06-10 など）はDBで入れる定め。画面では指定できないので申込みの日時のまま（このシードを使うケースは依頼日の値を確かめない）");

const OTC_NEEDS = ["S-M06-01-SHOPS", "S-M06-01-ADM-ALL"];

// ---------------------------------------------------------------- 表示件数のマスタ（参照だけ）

const 表示件数の正本 = ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"];

// ---------------------------------------------------------------- ページ送り（028〜031・037）

function definePageLinkSeed(seedId: string, n: string, 回数: number, 最後の字: string): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = { 前半: `f0611-${n}`, パスワード: `F0611PwdCase${n}` };
    控える(notes, id, `〔会員ID-F0611-${n}〕`, await 会員を用意する(browser, m.前半, m.パスワード, `会員${n}`));
    const [p] = await 任意の商品(browser, id);
    const made = await ネット買取を申し込む(browser, mailOf(m.前半), m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }], 回数);
    const nums = made.map((x) => Number(x.表示));
    if (nums.some((v, i) => i > 0 && v <= nums[i - 1])) throw new Error(`作った順に買取番号が大きくならない（${made.map((x) => x.表示).join("、")}）`);
    控える(notes, id, `〔買取番号-F0611-${n}A〕`, made[0].表示);
    控える(notes, id, `〔買取番号-F0611-${n}${最後の字}〕`, made[made.length - 1].表示);
    reportSeedIssue(id, `作ったネット買取（作った順）: ${made.map((x) => x.表示).join("、")}`);
  });
}
definePageLinkSeed("S-F06-11-PAGELINK-028", "028", 11, "K");
definePageLinkSeed("S-F06-11-PAGELINK-029", "029", 11, "K");
definePageLinkSeed("S-F06-11-PAGELINK-030", "030", 11, "K");
definePageLinkSeed("S-F06-11-PAGELINK-031", "031", 11, "K");
definePageLinkSeed("S-F06-11-PAGELINK-037", "037", 5, "E");

// ---------------------------------------------------------------- CB（038・042・048・049・051・052・053・055）

const CBのパスワード = (n: string): string => `Passw0rd-CBF0611${n}`;
const CB会員 = (n: string) => ({ 前半: `cbf0611-${n}`, パスワード: CBのパスワード(n) });
const CB一品 = (n: string): 商品の定め => ({ コード: `F0611-CB${n}-P1`, 名前: `F0611-CB${n}-Prod`, 買取価格: "1000" });

defineSeed("S-F06-11-CBAMT-038", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = CB会員("038");
  notes.set("〔会員ID-F0611-038〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員038"));
  const [pid] = await 商品を用意する(browser, id, [CB一品("038")]);
  const [r] = await ネット買取を申し込む(browser, mailOf(m.前半), m.パスワード, [{ 商品ID: pid, 数量: "1" }]);
  notes.set("〔買取番号-F0611-038〕", r.表示);
  await ネット買取の状況を変える(browser, id, r.表示, r.番号, "査定内容承諾", [{ 名前: 品(CB一品("038").名前), 査定価格: "51038", 売却: "売却する" }]);
  reportSeedIssue(id, "シード作成時の問題: 査定承諾金額合計51038円はDBで入れる定め。画面では、明細1件（数量1）の査定価格を51038円・売却するにして査定を確定し、買取状況を査定内容承諾にして保存した（査定承諾金額合計は売却する明細の査定価格×数量の合計で決まる）");
});

defineSeed("S-F06-11-CBREP-042", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = CB会員("042");
  notes.set("〔会員ID-F0611-042〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員042"));
  const 品々: 商品の定め[] = [
    { コード: "F0611-CB042-C1", 名前: "F0611-CB042-ProdA", 買取価格: "1000" },
    { コード: "F0611-CB042-C2", 名前: "F0611-CB042-ProdB", 買取価格: "1500" },
    { コード: "F0611-CB042-C3", 名前: "F0611-CB042-ProdC", 買取価格: "2000" },
  ];
  const ids = await 商品を用意する(browser, id, 品々);
  const [r] = await ネット買取を申し込む(browser, mailOf(m.前半), m.パスワード, ids.map((x) => ({ 商品ID: x, 数量: "1" })));
  notes.set("〔買取番号-F0611-042〕", r.表示);
  reportSeedIssue(id, "シード作成時の問題: 各商品の規格の状態を定義順3・2・1の状態にするのはDBで入れる定め。画面では入れられないので、3商品ともグッズ商品CSV登録で作られるニアミントのまま。"
    + "3商品の買取価格（1000・1500・2000円）が違うので、代表商品は買取価格の高い順で決まり、状態の定義順は代表の選び方に関わらない");
});

/** ネット買取2件（同じ商品）。A を先に、B を後に作り、それぞれの買取状況を変える（undefined は注文のまま） */
function defineNetOrderSeed(seedId: string, n: string, 状況A?: string, 状況B?: string, 依頼日?: [string, string]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = CB会員(n);
    notes.set(`〔会員ID-F0611-${n}〕`, await 会員を用意する(browser, m.前半, m.パスワード, `会員${n}`));
    const [pid] = await 商品を用意する(browser, id, [CB一品(n)]);
    const [a, b] = await ネット買取を申し込む(browser, mailOf(m.前半), m.パスワード, [{ 商品ID: pid, 数量: "1" }], 2);
    if (Number(a.表示) >= Number(b.表示)) throw new Error(`先に作った買取番号 ${a.表示} が後の ${b.表示} より小さくない`);
    notes.set(`〔買取番号-F0611-${n}A〕`, a.表示);
    notes.set(`〔買取番号-F0611-${n}B〕`, b.表示);
    if (状況A) await ネット買取の状況を変える(browser, id, a.表示, a.番号, 状況A);
    if (状況B) await ネット買取の状況を変える(browser, id, b.表示, b.番号, 状況B);
    if (依頼日) {
      買取依頼日をDBで設定する(a.番号, mailOf(m.前半), 依頼日[0]);
      買取依頼日をDBで設定する(b.番号, mailOf(m.前半), 依頼日[1]);
    }
  });
}
defineNetOrderSeed("S-F06-11-CBORD-048", "048", undefined, "査定内容承諾");
defineNetOrderSeed("S-F06-11-CBORD-049", "049");
defineNetOrderSeed("S-F06-11-CBORD-051", "051", "振込完了", "キャンセル済み");
defineNetOrderSeed("S-F06-11-CBORD-050", "050", "振込完了", "キャンセル済み", ["2026-06-03 12:00:00+09", "2026-06-01 12:00:00+09"]);

/** 店頭買取2件。A を先に、B を後に申し込み、それぞれのステータスを変える（undefined は査定前のまま） */
function defineOtcOrderSeed(seedId: string, n: string, 変更A?: string, 変更B?: string, 依頼日?: [string, string]): void {
  defineSeed(seedId, { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = CB会員(n);
    notes.set(`〔会員ID-F0611-${n}〕`, await 会員を用意する(browser, m.前半, m.パスワード, `会員${n}`));
    const 名A = rc(`F0611O${n}A`); const 名B = rc(`F0611O${n}B`);
    const oa = await 店頭買取を申し込んでIDも読む(browser, mailOf(m.前半), m.パスワード, 名A);
    const ob = await 店頭買取を申し込んでIDも読む(browser, mailOf(m.前半), m.パスワード, 名B);
    notes.set(`〔買取番号-F0611-${n}A〕`, oa.番号);
    notes.set(`〔買取番号-F0611-${n}B〕`, ob.番号);
    for (const [名, 変更, 字] of [[名A, 変更A, "A"], [名B, 変更B, "B"]] as const) {
      if (!変更) continue;
      const after = await 店頭買取のステータスを変える(browser, 名, 変更);
      if (変更 === "買取成立") {
        if (!買取成立の先.includes(after)) throw new Error(`〔買取番号-F0611-${n}${字}〕のステータスを「買取成立」にして保存したが、買取一覧のステータスは「${after}」（処理状態が買取完了のステータスでない）`);
        reportSeedIssue(id, `シード作成時の問題: ステータスの買取成立はDBで入れる定め。ステータス変更画面で「買取成立」を選んで保存した（〔買取番号-F0611-${n}${字}〕の保存後のステータスは「${after}」。処理状態は買取成立と同じ「買取完了」）`);
      } else if (after !== 変更) {
        throw new Error(`〔買取番号-F0611-${n}${字}〕のステータスを「${変更}」にして保存したが、買取一覧のステータスは「${after}」`);
      }
    }
    if (依頼日) {
      店頭買取をDBで設定する(oa.ID, mailOf(m.前半), { 依頼日: 依頼日[0] });
      店頭買取をDBで設定する(ob.ID, mailOf(m.前半), { 依頼日: 依頼日[1] });
    }
    店舗の読み替え(id, "晴れる屋テスト店（S-F06-11-OWNERS の店舗）");
  });
}
defineOtcOrderSeed("S-F06-11-CBORD-052", "052", undefined, "査定中");
defineOtcOrderSeed("S-F06-11-CBORD-053", "053");
defineOtcOrderSeed("S-F06-11-CBORD-055", "055", "買取成立", "買取キャンセル");
defineOtcOrderSeed("S-F06-11-CBORD-054", "054", "買取成立", "買取キャンセル", ["2026-06-03 12:00:00+09", "2026-06-01 12:00:00+09"]);

// ---------------------------------------------------------------- 101件のページ送り（010〜015・035・036。PM の判断 2026-11-10）
//
// シード表は会員ごとに101件のネット買取を DB で入れる定め（PAGE-101・CASE-010/013/014/035/036）。画面で作り、8件のケースで1人の会員を共有する読み替え。
// - 会員のメールアドレスは実行の印を付けない固定の試験用の名前（下の ページング会員）。前の実行で作った会員と申込みを使い回し、実行ごとに増やさない。
// - 会員が無ければフロントの会員登録で作る。ネット買取が101件に足りなければ、足りない分だけ F06-11 用の商品（任意の商品）で申し込む。
//   1回のケースの時間に収まらないときは、作れたところで止める（流し直すと続きから作る）。
// - 101件を超えていたら作り直さない（シードの報告に件数を残す）。
// - 買取番号は画面が振る。正本の決め打ちの番号（6105001〜6105101・6105091 など）は、この会員の101件の買取番号（一覧の並び）に読み替える。

export const ページング会員 = { メール: "f0611-page101-e2e@example.test", パスワード: "F0611PwdPage101" };
/** ページング会員の買取番号（一覧の並び＝新しい順。シードが読んで入れる） */
export const ページング会員の番号: string[] = [];
const 目標件数 = 101;
/** 申込みを続ける時間の上限（ケースの時間切れの前に止める） */
const 作る時間の上限 = 20 * 60_000;

async function 一覧の番号を全部読む(page: Page): Promise<string[]> {
  const h = new PurchaseHistoryListPage(page);
  await h.指定して開く({ pageSize: 500 });
  return h.番号の並び();
}

let ページング会員の約束: Promise<void> | null = null;

async function ページング会員を用意する(browser: Browser, seedId: string): Promise<void> {
  const issue = (s: string) => reportSeedIssue(seedId, s);
  await 会員のページ(browser, async (page) => {
    const h = new PurchaseHistoryListPage(page);
    await h.ログインする(ページング会員.メール, ページング会員.パスワード);
    if (await h.ログイン画面である()) {
      const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(ctx);
        await registerFrontMember(await ctx.newPage(), { 姓: "F06-11", 名: "ページング", セイ: "シケン", メイ: "ページング", メール: ページング会員.メール, パスワード: ページング会員.パスワード });
      } finally { await ctx.close(); }
      issue(`ページング会員（${ページング会員.メール}）が無かったので、フロントの会員登録で作った`);
      await h.ログインする(ページング会員.メール, ページング会員.パスワード);
      if (await h.ログイン画面である()) throw new Error(`作ったページング会員 ${ページング会員.メール} でログインできない`);
    }
    let 番号 = await 一覧の番号を全部読む(page);
    if (番号.length < 目標件数) {
      test.info().setTimeout(Math.max(test.info().timeout, 作る時間の上限 + 15 * 60_000));
      const [p] = await 任意の商品(browser, seedId);
      const 始め = Date.now();
      const 前 = 番号.length;
      for (let i = 番号.length; i < 目標件数; i++) {
        if (Date.now() - 始め > 作る時間の上限) {
          番号 = await 一覧の番号を全部読む(page);
          throw new Error(`ページング会員のネット買取を${目標件数}件にする途中で時間の上限に届いた（いま ${番号.length} 件）。流し直すと続きから作る`);
        }
        await 条件つきで申込む(page, [{ 商品ID: p.商品ID, 数量: "1" }], { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケン ページング", 箱数: "1" });
      }
      番号 = await 一覧の番号を全部読む(page);
      issue(`ページング会員のネット買取が ${前} 件だったので、${目標件数 - 前} 件を画面で申し込んだ（いま ${番号.length} 件）`);
    } else {
      issue(`ページング会員（${ページング会員.メール}）は前の実行で作ったネット買取を ${番号.length} 件持っていたので、そのまま使った（作り直さない）`);
    }
    if (番号.length !== 目標件数) issue(`ページング会員のネット買取は ${番号.length} 件（シード表は${目標件数}件）`);
    ページング会員の番号.splice(0, ページング会員の番号.length, ...番号);
  });
}

function definePagingSeed(seedId: string): void {
  defineSeed(seedId, async ({ browser, seed }) => {
    ページング会員の約束 ??= ページング会員を用意する(browser, seed.シードID);
    try { await ページング会員の約束; } catch (e) { ページング会員の約束 = null; throw e; }
    reportSeedIssue(seed.シードID, "シード作成時の問題: シード表は会員ごとに101件のネット買取をDBで入れる定め（決め打ちの会員ID・買取番号）。"
      + `PM の判断（2026-11-10）で、101件を持つ会員を1人（${ページング会員.メール}。実行の印を付けない固定の名前で、前の実行の分を使い回す）にまとめ、`
      + "ネット買取は画面で申し込んだ（注文のまま）。決め打ちの買取番号は、この会員の買取番号（一覧の新しい順）に読み替える");
  });
}
definePagingSeed("S-F06-11-PAGE-101");
definePagingSeed("S-F06-11-CASE-010");
definePagingSeed("S-F06-11-CASE-013");
definePagingSeed("S-F06-11-CASE-014");
definePagingSeed("S-F06-11-CASE-035");
definePagingSeed("S-F06-11-CASE-036");

// ---------------------------------------------------------------- DBで整えるシード（依頼者の承認 2026-11-10「印つきデータは何でも」）
//
// 画面で作った印つきの会員・商品・買取（申込みまで）に、画面で作れない部分（依頼日・金額・買取状況・明細の区分・数量・売却・カード状態・個別入力商品・論理削除）だけをDBで整える
// （seeds/f06-prep.ts・seeds/m07-db-prep.ts。書き込みは lib/db_write.ts 経由）。整えたことは、シードの注記（シード作成時の問題）に「DBで〜を〜に設定した」と残る。
// 読み替え（シード表から一意に決まらず、こう決めた）:
// - シード表の決め打ちの買取ID・商品ID・規格ID・明細IDは振れないので、画面が振った番号・申込みで作られた明細を使う（明細は申込みで作ったものを書き換える）。
// - まとめて買取の明細は、申込みで作った「えらんで買取」の明細の区分をDBで「まとめて買取」に書き換えて作る。個別入力商品は、DBで行を足して作る（商品規格は紐づけない）。
// - 状態定義順は、カード状態の定義順（1=NM, 2=SP, 3=MP …）の番号をそのまま、明細のカード状態としてDBで設定した。
// - 店頭買取の店舗は、これまでどおり買取店舗A（M06-01）に読み替える。
// - 買取状況・店頭買取のステータスのうち、画面で作れるもの（保存で変えられるもの）も、ここでは一度に整えるためDBで設定した（画面の保存を通していない）。
// - 査定承諾金額合計の表示は、アプリが売却する明細の合計を10円単位に切り上げて出すので、1の位が0でない金額（12345円など）は切り上げた額が表示される。シード表の金額どおりに入れてある。

const DB書き込み注記 = (seedId: string, ...文: string[]) => { for (const m of 文) reportSeedIssue(seedId, `シード作成時の問題: ${m}`); };

type 明細の指定 = { c: string; 名: string; 買取価格?: string; 設定?: Parameters<typeof 明細をDBで設定する>[3] };

/** 会員を作り、指定の商品で1件ネット買取を申し込み、明細をDBで整える。申込みで作った順に明細を指定する */
async function 明細つきネット買取を作る(browser: Browser, seedId: string, m: { 前半: string; パスワード: string; 名: string }, 明細: 明細の指定[]): Promise<{ 会員ID: string; 表示: string; 番号: string; 印: string }> {
  const 会員ID = await 会員を用意する(browser, m.前半, m.パスワード, m.名);
  const ids = await 商品を用意する(browser, seedId, 明細.map((x) => ({ コード: x.c, 名前: x.名, 買取価格: x.買取価格 ?? "1000" })));
  const [r] = await ネット買取を申し込む(browser, mailOf(m.前半), m.パスワード, ids.map((x) => ({ 商品ID: x, 数量: "1" })));
  const 印 = mailOf(m.前半);
  for (const x of 明細) if (x.設定) 明細をDBで設定する(r.番号, 印, 品(x.c), x.設定);
  return { 会員ID, 表示: r.表示, 番号: r.番号, 印 };
}

// ---- 005（並び順。21件）----

/** 005 で期待する、買取番号の並び（上から）。シードが作った買取の買取番号を、期待の順に入れる */
export const 並び順005: string[] = [];

defineSeed("S-F06-11-CASE-005", { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  test.info().setTimeout(Math.max(test.info().timeout, 40 * 60_000));
  const m = { 前半: "sort-f0611-005", パスワード: "F0611PwdCase005" };
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-005〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員005"));
  const [p] = await 任意の商品(browser, id);
  // ネット買取14件（作った順）。注文のものは申込みのまま、ほかはDBで買取状況を設定する
  const ネット: (買取状況名)[] = ["注文", "注文", "商品到着", "査定中", "査定中断", "査定再開", "MTGBuyer査定完了", "査定内容連絡済み", "査定内容承諾", "本人確認済み", "振込依頼済み", "振込失敗", "振込完了", "キャンセル済み"];
  const net = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }], ネット.length);
  if (Number(net[0].表示) >= Number(net[1].表示) || net[0].表示.length !== net[1].表示.length) throw new Error(`注文の2件の買取番号 ${net[0].表示}・${net[1].表示} が、作った順に大きくならない`);
  for (let i = 0; i < ネット.length; i++) if (ネット[i] !== "注文") 買取状況をDBで設定する(net[i].番号, 印, ネット[i]);
  買取依頼日をDBで設定する(net[12].番号, 印, "2026-06-03 10:00:00+09");
  買取依頼日をDBで設定する(net[13].番号, 印, "2026-06-02 10:00:00+09");
  // 店頭買取7件
  const 店頭: { 状況: "査定前" | "査定中" | "査定中断" | "査定再開" | "経理払い出し待ち" | "買取成立" | "買取キャンセル"; 依頼日?: string }[] = [
    { 状況: "査定前" }, { 状況: "査定中" }, { 状況: "査定中断" }, { 状況: "査定再開" }, { 状況: "経理払い出し待ち" },
    { 状況: "買取成立", 依頼日: "2026-06-03 12:00:00+09" }, { 状況: "買取キャンセル", 依頼日: "2026-06-01 10:00:00+09" },
  ];
  const otc: { 番号: string; ID: string }[] = [];
  for (let i = 0; i < 店頭.length; i++) {
    const o = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc(`F0611O05${i}`));
    otc.push(o);
    if (店頭[i].状況 !== "査定前" || 店頭[i].依頼日) 店頭買取をDBで設定する(o.ID, 印, { 状況: 店頭[i].状況, 依頼日: 店頭[i].依頼日 });
  }
  const n = (i: number) => net[i].表示;
  // 期待の順: 注文(後)・注文(先)・商品到着・店頭査定前・ネット査定中・中断・再開・MTGBuyer査定完了・店頭査定中・中断・再開・連絡済み・承諾・簡易書留送付済み・振込依頼済み・振込失敗・店頭経理払い出し待ち・店頭買取成立・ネット振込完了・ネットキャンセル済み・店頭買取キャンセル
  並び順005.splice(0, 並び順005.length,
    n(1), n(0), n(2), otc[0].番号, n(3), n(4), n(5), n(6), otc[1].番号, otc[2].番号, otc[3].番号, n(7), n(8), n(9), n(10), n(11), otc[4].番号, otc[5].番号, n(12), n(13), otc[6].番号);
  notes.set("〔買取番号-F0611-005〕", 並び順005.join(","));
  店舗の読み替え(id, "晴れる屋テスト店（S-F06-11-OWNERS の店舗）");
  DB書き込み注記(id,
    "シード表は21件の買取を買取ID・依頼日つきでDBに登録する定め。画面で、ネット買取14件・店頭買取7件を申し込み、買取状況・ステータスをDBで設定した（注文の2件と店頭の査定前は申込みのまま）。決め打ちの買取番号は、画面が振った買取番号に読み替えた",
    "終端4件の依頼日（2026-06-03・06-03・06-02・06-01）はDBで設定した。06-03の2件は同じ日で、店頭買取成立（12:00）を ネット振込完了（10:00）より新しい時刻にして、期待の順（店頭買取成立が先）になるようにした");
});

// ---- 008・009（買取金額合計）----

defineSeed("S-F06-11-CASE-008", { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "amount-f0611-008", パスワード: "F0611PwdCase008" };
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-008〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員008"));
  const [p] = await 任意の商品(browser, id);
  const コード = 品("F0611-ANY-1");
  const [a, c, e] = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }], 3);
  明細をDBで設定する(a.番号, 印, コード, { 査定価格: 12345, 売却: "する" });
  買取状況をDBで設定する(a.番号, 印, "査定内容承諾");
  明細をDBで設定する(c.番号, 印, コード, { 査定価格: 34567, 売却: "する" });
  買取状況をDBで設定する(c.番号, 印, "振込完了");
  const b = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc("F0611O08B"));
  const d = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc("F0611O08D"));
  const f = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc("F0611O08F"));
  店頭買取をDBで設定する(b.ID, 印, { 状況: "経理払い出し待ち", 査定金額合計: 23456 });
  店頭買取をDBで設定する(d.ID, 印, { 状況: "買取成立", 査定金額合計: 45678 });
  控える(notes, id, "〔買取番号-F0611-008A〕", a.表示); 控える(notes, id, "〔買取番号-F0611-008B〕", b.番号);
  控える(notes, id, "〔買取番号-F0611-008C〕", c.表示); 控える(notes, id, "〔買取番号-F0611-008D〕", d.番号);
  控える(notes, id, "〔買取番号-F0611-008E〕", e.表示); 控える(notes, id, "〔買取番号-F0611-008F〕", f.番号);
  店舗の読み替え(id, "晴れる屋テスト店-008（支店URL f0611case008）");
  DB書き込み注記(id, "ネット買取の査定承諾金額合計（振込待ち12345円・買取完了34567円）は、申込みの明細の査定価格×1（売却する）をDBで設定して作った。買取状況（査定内容承諾・振込完了）もDBで設定した。店頭買取の査定金額合計とステータスもDBで設定した");
});

defineSeed("S-F06-11-CASE-009", { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "amount-f0611-009", パスワード: "F0611PwdCase009" };
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-009〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員009"));
  const [p] = await 任意の商品(browser, id);
  const [a] = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }]);
  明細をDBで設定する(a.番号, 印, 品("F0611-ANY-1"), { 査定価格: 99999, 売却: "する" });
  const b = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc("F0611O09B"));
  店頭買取をDBで設定する(b.ID, 印, { 状況: "査定中", 査定金額合計: 88888 });
  控える(notes, id, "〔買取番号-F0611-009A〕", a.表示); 控える(notes, id, "〔買取番号-F0611-009B〕", b.番号);
  店舗の読み替え(id, "晴れる屋テスト店-009（支店URL f0611case009）");
  DB書き込み注記(id, "ネット買取（注文のまま）の査定承諾金額99999円は、申込みの明細の査定価格をDBで設定して作った。店頭買取の査定中のステータスと査定金額合計88888円もDBで設定した");
});

// ---- 016・023（依頼内容。共有可）----

defineSeed("S-F06-11-CONTENT", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "content-f0611", パスワード: "F0611PwdContent", 名: "内容確認" };
  const r = await 明細つきネット買取を作る(browser, id, m, [
    { c: "F0611-CT-A", 名: "F0611-CT-商品A", 設定: { 査定価格: 1000, 数量: 1, 売却: "する", 状態の定義順: 3 } },
    { c: "F0611-CT-B", 名: "F0611-CT-商品B", 設定: { 査定価格: 1500, 数量: 1, 売却: "する", 状態の定義順: 2 } },
    { c: "F0611-CT-C", 名: "F0611-CT-商品C", 設定: { 査定価格: 1500, 数量: 1, 売却: "する", 状態の定義順: 1 } },
    { c: "F0611-CT-D", 名: "F0611-CT-商品D", 設定: { 査定価格: 2000, 数量: 1, 売却: "しない", 状態の定義順: 1 } },
    { c: "F0611-CT-E", 名: "F0611-CT-商品E", 設定: { 査定価格: 3000, 数量: 0, 売却: "する", 状態の定義順: 1 } },
    { c: "F0611-CT-M1", 名: "F0611-CT-商品M1", 設定: { 区分: "まとめて買取", 査定価格: 700, 数量: 1, 売却: "する", 状態の定義順: 1 } },
  ]);
  個別入力商品をDBで作る(r.番号, r.印, [{ 名前: 品("F0611-CT-個別M2"), 査定金額: 800, 数量: 1, 売却: "する" }]);
  notes.set("〔会員ID-F0611-CONTENT〕", r.会員ID);
  notes.set("〔買取番号-F0611-CONTENT〕", r.表示);
  notes.set("〔買取ID-F0611-CONTENT〕", r.番号);
  DB書き込み注記(id, "決め打ちの買取番号6111001は、画面が振った買取番号に読み替えた。商品A〜E・M1は申込みで作った明細（商品はグッズ商品CSV登録で作った印つきの商品）をDBで書き換えて作った（売却対象外Dは売却しない・数量0のEは数量0）。個別入力商品M2はDBで足した");
});

// ---- 017（論理削除済みの商品）----

defineSeed("S-F06-11-CASE-017", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "deleted-f0611-017", パスワード: "F0611PwdCase017", 名: "会員017" };
  const r = await 明細つきネット買取を作る(browser, id, m, [{ c: "F0611-DEL-017", 名: "論理削除済み商品-017", 設定: { 査定価格: 1000, 数量: 1, 売却: "する" } }]);
  商品を論理削除済みにDBで設定する(品("F0611-DEL-017"));
  notes.set("〔会員ID-F0611-017〕", r.会員ID);
  notes.set("〔買取番号-F0611-017〕", r.表示);
  DB書き込み注記(id, "決め打ちの買取番号6112001・明細ID・商品ID・規格IDは、画面が振った番号に読み替えた。商品名は実行の印つきの「論理削除済み商品-017」");
});

// ---- 026（依頼日）----

defineSeed("S-F06-11-REQDATE-026", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "f0611-026", パスワード: "F0611PwdCase026" };
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-026〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員026"));
  const [p] = await 任意の商品(browser, id);
  const [a, b] = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }], 2);
  買取依頼日をDBで設定する(a.番号, 印, "2026-06-10 12:00:00+09");
  買取依頼日をDBで設定する(b.番号, 印, "2026-05-03 12:00:00+09");
  控える(notes, id, "〔買取番号-F0611-026A〕", a.表示); 控える(notes, id, "〔買取番号-F0611-026B〕", b.表示);
});

// ---- 027（金額が表示されない状態）----

defineSeed("S-F06-11-AMOUNTHIDE-027", { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = { 前半: "f0611-027", パスワード: "F0611PwdCase027" };
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-027〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員027"));
  const [p] = await 任意の商品(browser, id);
  const [a, b] = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: p.商品ID, 数量: "1" }], 2);
  const コード = 品("F0611-ANY-1");
  明細をDBで設定する(a.番号, 印, コード, { 査定価格: 71111, 売却: "する" }); 買取状況をDBで設定する(a.番号, 印, "査定内容連絡済み");
  明細をDBで設定する(b.番号, 印, コード, { 査定価格: 72222, 売却: "する" }); 買取状況をDBで設定する(b.番号, 印, "キャンセル済み");
  const c = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc("F0611O27C"));
  店頭買取をDBで設定する(c.ID, 印, { 状況: "買取キャンセル", 査定金額合計: 73333 });
  控える(notes, id, "〔買取番号-F0611-027A〕", a.表示); 控える(notes, id, "〔買取番号-F0611-027B〕", b.表示); 控える(notes, id, "〔買取番号-F0611-027C〕", c.番号);
  控える(notes, id, "〔店舗ID-F0611-027〕", notes.get("〔店舗ID-M0601-共有A〕"));
  店舗の読み替え(id, "F0611-027-テスト店（支店URL f0611case027）");
  DB書き込み注記(id, "ネット買取の査定承諾金額71111円・72222円は申込みの明細の査定価格をDBで設定して作り、買取状況（査定内容連絡済み・キャンセル済み）もDBで設定した。店頭買取の買取キャンセルと査定金額合計73333円もDBで設定した");
});

// ---- CB 039〜041（買取店舗と買取金額合計）----

defineSeed("S-F06-11-CBAMT-039", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = CB会員("039");
  const 印 = mailOf(m.前半);
  控える(notes, id, "〔会員ID-F0611-039〕", await 会員を用意する(browser, m.前半, m.パスワード, "会員039"));
  const [pid] = await 商品を用意する(browser, id, [CB一品("039")]);
  const [r] = await ネット買取を申し込む(browser, 印, m.パスワード, [{ 商品ID: pid, 数量: "1" }]);
  明細をDBで設定する(r.番号, 印, 品(CB一品("039").コード), { 査定価格: 52039, 売却: "する" });
  控える(notes, id, "〔買取番号-F0611-039〕", r.表示);
  DB書き込み注記(id, "買取は注文のまま（受付完了）で、査定承諾金額合計52039円は、申込みの明細の査定価格をDBで設定して作った");
});
function defineOtcAmountSeed(seedId: string, n: string, 状況: "経理払い出し待ち" | "査定中", 合計: number): void {
  defineSeed(seedId, { needs: OTC_NEEDS }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = CB会員(n);
    const 印 = mailOf(m.前半);
    控える(notes, id, `〔会員ID-F0611-${n}〕`, await 会員を用意する(browser, m.前半, m.パスワード, `会員${n}`));
    const o = await 店頭買取を申し込んでIDも読む(browser, 印, m.パスワード, rc(`F0611O${n}`));
    控える(notes, id, `〔買取番号-F0611-${n}〕`, o.番号);
    店頭買取をDBで設定する(o.ID, 印, { 状況, 査定金額合計: 合計 });
    店舗の読み替え(id, "晴れる屋テスト店（S-F06-11-OWNERS の店舗）");
  });
}
defineOtcAmountSeed("S-F06-11-CBAMT-040", "040", "経理払い出し待ち", 53040);
defineOtcAmountSeed("S-F06-11-CBAMT-041", "041", "査定中", 54041);

// ---- CB 043〜047（依頼内容の代表商品）----

type 区分 = "えらんで買取" | "まとめて買取";
type 構成 = { x: string; 区分: 区分; 価格: number; 数量: number; 売却: "する" | "しない"; 状態: number };
function defineRepSeed(seedId: string, n: string, 明細: 構成[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = CB会員(n);
    const r = await 明細つきネット買取を作る(browser, id, { ...m, 名: `会員${n}` }, 明細.map((c) => ({
      c: `F0611-CB${n}-${c.x}`, 名: `F0611-CB${n}-Prod${c.x}`,
      設定: { 区分: c.区分, 査定価格: c.価格, 数量: c.数量, 売却: c.売却, 状態の定義順: c.状態 },
    })));
    控える(notes, id, `〔会員ID-F0611-${n}〕`, r.会員ID);
    控える(notes, id, `〔買取番号-F0611-${n}〕`, r.表示);
    DB書き込み注記(id, "明細（売却対象・数量・買取価格・状態定義順・区分）は、申込みで作った明細をDBで書き換えて作った。買取は注文のまま");
  });
}
const 選 = (x: string, 価格: number, 状態: number, 数量 = 1, 売却: "する" | "しない" = "する"): 構成 => ({ x, 区分: "えらんで買取", 価格, 数量, 売却, 状態 });
const ま = (x: string, 価格: number, 状態: number, 数量 = 1, 売却: "する" | "しない" = "する"): 構成 => ({ x, 区分: "まとめて買取", 価格, 数量, 売却, 状態 });
defineRepSeed("S-F06-11-CBREP-043", "043", [選("A", 1500, 2), 選("B", 1500, 1), 選("C", 1500, 3), 選("D", 9999, 1, 1, "しない"), 選("E", 8888, 1, 0)]);
defineRepSeed("S-F06-11-CBREP-044", "044", [ま("M1", 700, 1), ま("M2", 800, 2), ま("M3", 900, 3, 0)]);
defineRepSeed("S-F06-11-CBREP-045", "045", [ま("M1", 600, 2), ま("M2", 600, 1), ま("M3", 9000, 1, 1, "しない")]);
defineRepSeed("S-F06-11-CBREP-046", "046", [選("A", 1200, 2), 選("B", 1200, 1), ま("M1", 700, 2), ま("M2", 700, 1)]);
defineRepSeed("S-F06-11-CBREP-047", "047", [選("A", 1000, 3), 選("B", 2000, 1), 選("D", 9999, 1, 1, "しない"), ま("M1", 700, 2), ま("M2", 800, 1), ま("E", 8888, 2, 0)]);
