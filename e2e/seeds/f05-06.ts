/**
 * F05-06 ネット買取 買取手続き〜完了（フロント）の画面シード。正本: cases/F05-06_seed_data.tsv
 *
 * 作るシード:
 * - 参照マスタ（MASTER・L-ENV・PD-ENV）・通常申込入力値（INPUT-BASE）: 作るものが無い（画面から確かめるだけ。会員の登録で職業「会社員」が選べなければ会員のシードが止まる）。
 * - 管理者（L-ADM・PD-ADM）: メンバー管理で登録する（あれば内容を確かめて使う）。
 * - 商品（L-PRODUCT・PD-PRODUCT・DP-QTY-PRODUCT）: カード登録 → カード商品CSV登録 → 商品規格の買取価格（F05-04 の部品）。
 *   開発環境のグッズ商品CSV登録は、商品カテゴリ(ID)に「サプライ・グッズ」の実IDを入れると弾かれる不具合があるため使わない。
 * - 会員（MEMBER-001・L-MEMBER-052〜058・ORDERER-059・PRODUCT-060・AMOUNT-061・CARTLOST-068・PD-MEMBER-073・DP-MEMBER-076）:
 *   フロントの会員情報登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える。ログインと買取カートへの追加は、ケースの事前準備（spec）で行う
 *   （カートはブラウザのセッションに紐づくので、シードからケースのブラウザへは渡せない）。
 *
 * 作らないシード（理由はこのファイルの下の「作らない」と PM への報告に書く）:
 * - SETTINGS（まとめて買取商品IDの共有設定を書き換える）を使うケースのシード、購入上限5の DB シード（CART-QUANTITY・DP-QTY のうち購入上限）、
 *   CART-NOPRICE・LOGINLOST-071 の DB 前提、職業・生年月日が未登録の会員 など。
 *
 * 決め打ちの識別の値（商品コード・商品名・メールアドレスの前半）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * 氏名・住所は正本の値のまま（ケースが画面の表示を正本の値と比べるため）。
 *
 * シード表が値を定めないもので、ここで決めたこと:
 * - 商品の販売価格・基準価格は買取価格と同じ（F05-04 の部品の既定。PD-PRODUCT は正本が販売価格・基準価格 500 を定めるが、ケースは見ない）。
 * - 商品のカテゴリは「シングルカード」配下の先頭（F05-04 の部品の既定）、部門は規格に設定しない。
 * - 管理者のパスワードは正本の値（12文字以上）、メールアドレスは「ログインID@example.test」、権限は「システム管理者」（正本に権限の名前が無い）。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { mailIds, waitForMailTo } from "../lib/mail";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { EntryPage } from "../pages/front/f06_01_entry";
import { defineSeed } from "./current_seed";
import { カード商品を作る } from "./f05-04";
import { markedMail } from "./f06-member";
import { 追加システム設定を控えて書き換える } from "./add-system-restore";
import { expectSaved } from "../pages/admin/common";
import { 商品規格一覧を読む } from "../pages/admin/f05_04_products";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";

// ---- 管理者 ----

export const F0506_L_ADMIN = { loginId: "f0506ladmin", password: "Passw0rd!L0506" };
export const F0506_PD_ADMIN = { loginId: "f0506pdadmin", password: "Passw0rd-PD0506" };

async function 管理者を用意する(browser: Browser, seedId: string, a: { loginId: string; password: string }): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl("/setting/system/member/new"));
    const 本店 = ((await page.locator('[name="admin_member[baseInfo]"] option[value="1"]').textContent()) ?? "").trim();
    if (!本店) throw new Error(`${seedId}: メンバー登録の所属店舗に本店（店舗ID 1）の選択肢が無い`);
    await ensureMember(page, {
      名前: a.loginId.toUpperCase(), 所属店舗: 本店, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`,
      パスワード: a.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店],
    });
  });
  reportSeedIssue(seedId, `シード作成時の問題（読み替え）: 管理者 ${a.loginId}（所属店舗は本店・権限は「システム管理者」・稼働）を用意した。正本は権限を「ネット買取管理の買取検索一覧と買取情報編集を操作できる権限」と定めるが権限の名前が無いので、全機能を使える権限にした`);
}

defineSeed("S-F05-06-L-ADM", async ({ browser, seed }) => { await 管理者を用意する(browser, seed.シードID, F0506_L_ADMIN); });
defineSeed("S-F05-06-PD-ADM", async ({ browser, seed }) => { await 管理者を用意する(browser, seed.シードID, F0506_PD_ADMIN); });

// ---- 参照マスタ・入力値（作るものが無い） ----

const 参照マスタの注記 = "シード作成時の問題（読み替え）: 参照マスタ（職業「会社員」・買取受注状態「注文」・買取用の送金方法・東京都）は DB のマスタで、共有のマスタは書き換えない。ここでは何も作らず、会員の登録・買取の申込の画面で使えることをケースの中で確かめる。買取受注完了メールの受け口の設定は確かめていない";
defineSeed("S-F05-06-MASTER", async ({ seed }) => { reportSeedIssue(seed.シードID, 参照マスタの注記); });
defineSeed("S-F05-06-L-ENV", async ({ seed }) => { reportSeedIssue(seed.シードID, 参照マスタの注記); });
defineSeed("S-F05-06-PD-ENV", async ({ seed }) => { reportSeedIssue(seed.シードID, 参照マスタの注記); });
defineSeed("S-F05-06-INPUT-BASE", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "投入不要（手順で記入画面へ入力する値）");
});

// ---- 商品 ----

export type F0506商品 = { 商品ID: string; 規格ID: string; 商品コード: string; 商品名: string };
const products = new Map<string, F0506商品>();
/** 作った商品（キー: L・PD・DPQ-A・DPQ-B） */
export function f0506商品(キー: string): F0506商品 {
  const p = products.get(キー);
  if (!p) throw new Error(`商品 ${キー} はまだ作っていない`);
  return p;
}

async function 商品を作る(
  browser: Browser, seedId: string, notes: Notes,
  d: { キー: string; カード名英: string; 名: string; コード: string; 買取: { NM: number; SP?: number; MP?: number }; 英語?: { NM: number; SP: number; MP: number } },
): Promise<F0506商品> {
  const 規格: Parameters<typeof カード商品を作る>[4]["規格"] = { "JP-NM": { 商品コード: d.コード, 買取: d.買取.NM } };
  const 残す = ["NM"];
  if (d.買取.SP !== undefined) { 規格["JP-SP"] = { 買取: d.買取.SP }; 残す.push("SP"); }
  if (d.買取.MP !== undefined) { 規格["JP-MP"] = { 買取: d.買取.MP }; 残す.push("MP"); }
  if (d.英語) { 規格["EN-NM"] = { 買取: d.英語.NM }; 規格["EN-SP"] = { 買取: d.英語.SP }; 規格["EN-MP"] = { 買取: d.英語.MP }; }
  const made = await カード商品を作る(browser, seedId, notes, { 名英: d.カード名英 }, {
    名: d.名, 言語: d.英語 ? ["JP", "EN"] : ["JP"], 買取: d.買取.NM, 規格, 残す状態: 残す,
  }, false);
  const nm = made.規格["JP-NM"];
  if (!nm) throw new Error(`${seedId}: 商品 ${d.名} の日本語・NMの規格が無い`);
  const p = { 商品ID: made.商品ID, 規格ID: nm, 商品コード: rc(d.コード), 商品名: rc(d.名) };
  products.set(d.キー, p);
  reportSeedIssue(seedId, `シード作成時の問題（読み替え）: 商品「${d.名}」（商品コード ${d.コード}）は、カード登録・カード商品CSV登録・規格の買取価格で作った（グッズ商品CSV登録は商品カテゴリの不具合で使わない）。販売価格・基準価格は買取価格（NM）と同じ。商品コード・商品名には実行の印を付けた`);
  return p;
}

defineSeed("S-F05-06-L-PRODUCT", async ({ browser, notes, seed }) => {
  const p = await 商品を作る(browser, seed.シードID, notes, { キー: "L", カード名英: "F0506L-A Card", 名: "結合連携カードA", コード: "F0506L-A", 買取: { NM: 100, SP: 70, MP: 40 } });
  notes.set("〔商品ID-F0506-共有F〕", p.商品ID);
});
defineSeed("S-F05-06-PD-PRODUCT", async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, { キー: "PD", カード名英: "F0506PD-A Card", 名: "結合PD連携カードA", コード: "F0506PD-A", 買取: { NM: 100, SP: 70, MP: 40 } });
  reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 部門「結合PD連携部門」は作っていない（ケースが部門を見ないので、規格の部門は設定しない）");
});
defineSeed("S-F05-06-DP-QTY-PRODUCT", async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, { キー: "DPQ-A", カード名英: "F0506-DPQ-A Card", 名: "F0506-DPQ-A", コード: "F0506-DPQ-A", 買取: { NM: 100 } });
  await 商品を作る(browser, seed.シードID, notes, { キー: "DPQ-B", カード名英: "F0506-DPQ-B Card", 名: "F0506-DPQ-B", コード: "F0506-DPQ-B", 買取: { NM: 200 } });
  reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 正本は購入上限5をDBで設定すると定めるが、購入上限を設定していない（購入上限は買取価格の合計を見るケースの結果に関わらない）");
});

// ---- 会員 ----

export type F0506会員 = { メール: string; パスワード: string; 姓: string; 名: string; 会員ID: string };
const members = new Map<string, F0506会員>();
/** 作った会員（キーはシードID） */
export function f0506会員(シードID: string): F0506会員 {
  const m = members.get(シードID);
  if (!m) throw new Error(`会員 ${シードID} はまだ作っていない`);
  return m;
}

type 会員定義 = {
  seed: string; 前半: string; パスワード: string; 姓: string; 名: string; セイ: string; メイ: string; 郵便番号: string; 住所3: string; 電話: string;
  /** 職業を登録しない（会員情報登録で職業を選ばない） */
  職業なし?: boolean;
  /** 生年月日を登録しない（会員情報登録では必須なので仮に入れ、管理画面の会員登録（編集）で未選択に戻す） */
  生年月日なし?: boolean;
};
const 結合: Pick<会員定義, "姓" | "名" | "セイ" | "メイ" | "郵便番号" | "電話"> = { 姓: "結合", 名: "買取", セイ: "ケツゴウ", メイ: "カイトリ", 郵便番号: "160-0023", 電話: "03-1234-5678" };
const L = (番: string, n: string, 姓: string, セイ: string, 連番: string, パスワード: string): 会員定義 => ({
  seed: `S-F05-06-L-MEMBER-${番}`, 前半: `it-f0506-l-${n}`, パスワード, 姓, 名: "買取", セイ, メイ: "カイトリ", 郵便番号: "160-0023", 住所3: `連携ビル${連番}`, 電話: "03-1234-5678",
});
const 会員の定義: 会員定義[] = [
  { seed: "S-F05-06-MEMBER-001", 前半: "buyer-f0506-001", パスワード: "Member001Pwd9!", ...結合, 住所3: "ITビル506" },
  L("052", "001", "連携甲", "レンケイコウ", "001", "Member001Pwd9F0506n052!"),
  L("053", "002", "連携乙", "レンケイオツ", "002", "Member002Pwd9!"),
  L("054", "003", "連携丙", "レンケイヘイ", "003", "Member003Pwd9!"),
  L("055", "004", "連携丁", "レンケイテイ", "004", "Member004Pwd9F0506n055!"),
  L("056", "005", "連携戊", "レンケイボ", "005", "Member005Pwd9F0506n056!"),
  L("057", "006", "連携己", "レンケイキ", "006", "Member006Pwd9F0506n057!"),
  L("058", "007", "連携庚", "レンケイカノエ", "007", "Member007Pwd9F0506n058!"),
  { seed: "S-F05-06-ORDERER-059", 前半: "buyer-f0506-059", パスワード: "F0506Member059Pwd9!", 姓: "表示五九", 名: "会員", セイ: "ヒョウジゴク", メイ: "カイイン", 郵便番号: "160-0059", 住所3: "ITビル506", 電話: "03-0506-0059" },
  { seed: "S-F05-06-PRODUCT-060", 前半: "buyer-f0506-060", パスワード: "F0506Member060Pwd9!", ...結合, 住所3: "ITビル506" },
  { seed: "S-F05-06-AMOUNT-061", 前半: "buyer-f0506-061", パスワード: "F0506Member061Pwd9!", ...結合, 住所3: "ITビル506" },
  { seed: "S-F05-06-CARTLOST-068", 前半: "buyer-f0506-068", パスワード: "F0506Member068Pwd9!", ...結合, 住所3: "ITビル506" },
  { seed: "S-F05-06-PD-MEMBER-073", 前半: "it-f0506-pd-002", パスワード: "Member003Pwd9F0506pd!", 姓: "履歴丁", 名: "買取", セイ: "レキシテイ", メイ: "カイトリ", 郵便番号: "160-0023", 住所3: "履歴ビル004", 電話: "03-1234-5678" },
  { seed: "S-F05-06-DP-MEMBER-076", 前半: "dpf0506-076", パスワード: "Passw0rd-F0506076", ...結合, 郵便番号: "076-0506", 住所3: "ITビル076", 電話: "03-0506-0076" },
];

/** 会員を登録し、本会員にして、管理画面の会員一覧から会員IDを読む */
async function 会員を作る(browser: Browser, m: 会員定義): Promise<F0506会員> {
  const メール = markedMail(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const e = new EntryPage(page);
    await e.open();
    await e.fill({
      姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: ["1990", "1", "2"], メール, パスワード: m.パスワード,
      国: "Japan", 郵便番号: m.郵便番号, 都道府県: "東京都", 住所1: "新宿区", 住所2: "西新宿1-1-1", 電話番号: m.電話, 職業: m.職業なし ? undefined : "会社員",
    });
    const addr3 = e.f("address][addr03");
    if ((await addr3.count()) > 0) await addr3.fill(m.住所3);
    else reportSeedIssue(m.seed, "シード作成時の問題（読み替え）: 日本の会員情報登録画面に住所3の入力欄が無い（住所3を入れていない）");
    if (!(await e.同意する()).sent) throw new Error(`${m.seed}: 会員 ${メール} の「同意して確認画面へ」で確認画面へ進めない（${(await e.エラー文()).join(" / ")}）`);
    const before = await mailIds();
    await e.登録する();
    if (e.完了画面か) {
      const mail = await waitForMailTo(メール, before);
      const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/.exec(mail.text)?.[0];
      if (!url) throw new Error(`${m.seed}: 本登録のメール（${mail.subject}）に本登録のURLが無い`);
      await page.goto(url.replace(/&amp;/g, "&"));
      await page.waitForLoadState("load");
    }
    await expect(page.locator(".p-hareruya-entry-complete__message-text").first(), `${m.seed}: 本登録の完了の表示`).toBeVisible({ timeout: 30_000 });
    if (/\/entry\/(complete|regist_error)/.test(page.url())) throw new Error(`${m.seed}: 会員 ${メール} が本会員にならない（${page.url()}）`);
  } finally { await context.close(); }
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 共有の開発環境では、登録した直後の会員が会員一覧の検索にすぐ出ないことがある。見つからないときは間をおいて検索し直す（最大で約1分）
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      const found = await resultCustomerId(page, メール);
      if (found || i >= 5) return found;
      await page.waitForTimeout(10_000);
    }
  });
  if (!会員ID) throw new Error(`${m.seed}: 登録した会員 ${メール} を会員一覧で探せない`);
  if (m.生年月日なし) await 生年月日を未選択に戻す(browser, m.seed, 会員ID);
  return { メール, パスワード: m.パスワード, 姓: m.姓, 名: m.名, 会員ID };
}

function defineMemberSeed(seedId: string): void {
  const 決めた = 会員の定義.find((x) => x.seed === seedId);
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const m = 決めた ?? シード表の会員(seed);
    const made = await 会員を作る(browser, m);
    members.set(m.seed, made);
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      if (/^〔会員ID-F0506-\d+〕$/.test(l)) notes.set(l, made.会員ID);
    }
    reportSeedIssue(seed.シードID, `シード作成時の問題（読み替え）: 会員のメールアドレスは実行の印を付けた ${made.メール}。ログインと買取カートへの商品の追加は、ケースの事前準備（試験用ブラウザごと）で行う`);
  });
}
defineMemberSeed("S-F05-06-MEMBER-001");
defineMemberSeed("S-F05-06-L-MEMBER-052");
defineMemberSeed("S-F05-06-L-MEMBER-053");
defineMemberSeed("S-F05-06-L-MEMBER-054");
defineMemberSeed("S-F05-06-L-MEMBER-055");
defineMemberSeed("S-F05-06-L-MEMBER-056");
defineMemberSeed("S-F05-06-L-MEMBER-057");
defineMemberSeed("S-F05-06-L-MEMBER-058");
defineMemberSeed("S-F05-06-ORDERER-059");
defineMemberSeed("S-F05-06-PRODUCT-060");
defineMemberSeed("S-F05-06-AMOUNT-061");
defineMemberSeed("S-F05-06-CARTLOST-068");
defineMemberSeed("S-F05-06-PD-MEMBER-073");
defineMemberSeed("S-F05-06-DP-MEMBER-076");

// ---- 2026-11-12 追加: まとめて買取商品IDの共有設定を書き換えるケース（夜の1本流し）のシード ----
//
// - CART-BASE（共有可）: 商品A（商品コード F0506-B・日本語 NM200/SP150/MP100）と商品B（F0506-A・日本語 NM100/SP70/MP40・英語 NM900/SP700/MP400）は、
//   既存の商品と同じくカード登録 → カード商品CSV登録 → 規格の買取価格で作る（シード表はグッズ商品CSV登録のあとにカードを指定する手順。カード詳細のある商品になる点は同じ）。
//   商品C（まとめて買取・F0506-BULK・買取価格100）は、カード詳細の無い商品としてグッズ商品CSV登録で作る（商品カテゴリは最上位の「サプライ・グッズ」）。
// - CART-MEMO（共有可）: 商品D「ITパック」・E「ITサプライ」（買取価格100・カード詳細なし）をグッズ商品CSV登録で作る。
// - SETTINGS（≪共有の設定を書き換える≫）: 追加システム設定の「まとめて買取商品ID」だけを商品Cの商品IDへ書き換える。
//   書き換える前に画面の全項目を控え、元の値のまま保存できることを確かめてから、元へ戻すことを登録する（seeds/add-system-restore.ts）。
//   ケースの終わりに基盤が画面で元の値へ戻し、開き直して全項目が控えと同じかを確かめる。
// - 会員（MEMBER-0NN・MEMBER-MISSING-0NN・ACCTTYPE-062・BOX20-063・BOX2-067・COMPLETE-069・DP-MEMBER-078〜082）: シード表の状態・属性の値で、
//   フロントの会員情報登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える。「職業なし」は職業を選ばずに登録し、
//   「生年月日なし」は仮に 1990年1月2日 で登録してから、管理画面の会員登録（編集）で生年月日を未選択に戻して登録する（シード表の投入方法のとおり）。
// - ブラウザごとの準備（ログイン・買取カート）はケースの事前準備（spec）で行う。
// 商品コード・商品名・メールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。

/** 状態・属性（「項目=値」を「／」で区切った文）から会員の定義を読む */
function シード表の会員(seed: { シードID: string; "状態・属性": string }): 会員定義 {
  const t = seed["状態・属性"];
  const v = (k: string): string => {
    const m = new RegExp(`(?:^|／)${k}=([^／]+)`).exec(t);
    if (!m) throw new Error(`${seed.シードID}: 状態・属性に「${k}=」が無い`);
    return m[1].trim();
  };
  const [姓, 名] = v("氏名").split(/\s+/);
  const [セイ, メイ] = v("フリガナ").split(/\s+/);
  return {
    seed: seed.シードID, 前半: v("メールアドレス").split("@")[0], パスワード: v("パスワード"), 姓, 名, セイ, メイ,
    郵便番号: v("郵便番号"), 住所3: v("住所3"), 電話: v("電話番号"),
    職業なし: /(?:^|／)職業なし(?:／|$)/.test(t), 生年月日なし: /(?:^|／)生年月日なし(?:／|$)/.test(t),
  };
}

/** 管理画面の会員登録（編集）で、生年月日の年・月・日を未選択に戻して登録する */
async function 生年月日を未選択に戻す(browser: Browser, seedId: string, 会員ID: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl(`/customer/${会員ID}/edit`));
    await page.waitForLoadState("load");
    for (const part of ["year", "month", "day"]) await page.locator(`[name="admin_customer[birth][${part}]"]`).selectOption({ value: "" });
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), page.locator("#register_btn").click({ noWaitAfter: true })]);
    await expectSaved(page, `${seedId}: 会員 ${会員ID} の生年月日を未選択に戻す`);
    const 年 = await page.locator('[name="admin_customer[birth][year]"]').inputValue();
    if (年 !== "") throw new Error(`${seedId}: 会員 ${会員ID} の生年月日が未選択に戻らない（年「${年}」）`);
  });
  reportSeedIssue(seedId, "生年月日は、会員情報登録で仮に 1990年1月2日 を入れて登録し、管理画面の会員登録（編集）で未選択に戻した（シード表の投入方法のとおり）");
}

/** グッズ商品CSV登録で、カード詳細の無い商品を作る（商品カテゴリは最上位の「サプライ・グッズ」）。商品ID・規格ID を控える */
async function グッズ商品を作る(browser: Browser, seedId: string, d: { キー: string; コード: string; 名: string; 名英: string; 買取: number }): Promise<F0506商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const p = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    const price = String(d.買取);
    await registerGoodsCsv(page, {
      what: `${seedId}: グッズ商品CSV登録（${d.コード}）`, fileName: `${seedId}-${d.キー}.csv`, categoryId,
      lines: [{ code: rc(d.コード), nameJp: rc(d.名), nameEn: rc(d.名英), values: { "基準価格": "1000", "販売価格": "1000", "原価単価": "0", "買取価格": price } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const ids = await productIdsByCode(page, rc(d.コード));
    if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${rc(d.コード)} の商品が ${ids.length} 件ある（1件のはず）`);
    const rows = await 商品規格一覧を読む(page, ids[0]);
    if (rows.length !== 1) throw new Error(`${seedId}: 商品 ${rc(d.名)} の商品規格が ${rows.length} 件ある（グッズ商品は1件のはず）`);
    return { 商品ID: ids[0], 規格ID: rows[0].商品規格ID, 商品コード: rc(d.コード), 商品名: rc(d.名) };
  });
  products.set(d.キー, p);
  issue(`商品「${d.名}」（商品コード ${d.コード}・買取価格 ${d.買取}）はグッズ商品CSV登録で作った（カード詳細なし。商品カテゴリは最上位の「サプライ・グッズ」、基準価格・販売価格 1000、原価単価 0）。商品コード・商品名には実行の印を付けた`);
  return p;
}

defineSeed("S-F05-06-CART-BASE", async ({ browser, notes, seed }) => {
  const a = await 商品を作る(browser, seed.シードID, notes, { キー: "A", カード名英: "F0506-B Card A", 名: "F0506-B 買取カードA", コード: "F0506-B", 買取: { NM: 200, SP: 150, MP: 100 } });
  const b = await 商品を作る(browser, seed.シードID, notes, {
    キー: "B", カード名英: "F0506-A Card B", 名: "F0506-A 買取カードB", コード: "F0506-A", 買取: { NM: 100, SP: 70, MP: 40 }, 英語: { NM: 900, SP: 700, MP: 400 },
  });
  const c = await グッズ商品を作る(browser, seed.シードID, { キー: "C", コード: "F0506-BULK", 名: "まとめて買取", 名英: "Bulk Buyback", 買取: 100 });
  notes.set("〔商品ID-F0506-共有A〕", a.商品ID);
  notes.set("〔商品ID-F0506-共有B〕", b.商品ID);
  notes.set("〔商品ID-F0506-共有C〕", c.商品ID);
});

defineSeed("S-F05-06-CART-MEMO", { needs: ["S-F05-06-CART-BASE"] }, async ({ browser, notes, seed }) => {
  const d = await グッズ商品を作る(browser, seed.シードID, { キー: "D", コード: "F0506-ITPACK", 名: "ITパック", 名英: "IT Pack", 買取: 100 });
  const e = await グッズ商品を作る(browser, seed.シードID, { キー: "E", コード: "F0506-ITSUPPLY", 名: "ITサプライ", 名英: "IT Supply", 買取: 100 });
  notes.set("〔商品ID-F0506-共有D〕", d.商品ID);
  notes.set("〔商品ID-F0506-共有E〕", e.商品ID);
});

defineSeed("S-F05-06-SETTINGS", { needs: ["S-F05-06-CART-BASE"] }, async ({ browser, notes, seed }) => {
  const c = notes.get("〔商品ID-F0506-共有C〕");
  await 追加システム設定を控えて書き換える(browser, seed.シードID, { まとめて買取商品ID: c });
  reportSeedIssue(seed.シードID, `共有の追加システム設定は、画面で全項目の元の値を控えて（元の値のまま保存できることも確かめて）から、「まとめて買取商品ID」だけを商品C（${c}）へ書き換えた。ケースの終わりに基盤が画面で元の値へ戻し、開き直して確かめる`);
});

defineSeed("S-F05-06-MAIL-ENV", async ({ seed }) => {
  await mailIds(); // メールの受け口を読めること（読めなければここで止まる）
  reportSeedIssue(seed.シードID, "メールの配送先の設定は変えていない。試験用のメールの受け口（E2E が読む受け口）を読めることだけを確かめた");
});
defineSeed("S-F05-06-INPUT-INVOICE", async ({ seed }) => { reportSeedIssue(seed.シードID, "投入不要（手順で記入画面へ入力する値）"); });
defineSeed("S-F05-06-CART-BASE-002", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード表の商品ID 50601・50603・50604 は、S-F05-06-CART-BASE の商品A・B・C（数量1・2・1）に読み替えた。未ログインのブラウザの買取カートへの追加は、ケースの事前準備（spec）で行う");
});

for (const id of [
  "S-F05-06-MEMBER-004", "S-F05-06-MEMBER-009", "S-F05-06-MEMBER-MISSING-011", "S-F05-06-MEMBER-MISSING-012", "S-F05-06-MEMBER-MISSING-015",
  "S-F05-06-MEMBER-017", "S-F05-06-MEMBER-023", "S-F05-06-MEMBER-024", "S-F05-06-MEMBER-027", "S-F05-06-MEMBER-028", "S-F05-06-MEMBER-029",
  "S-F05-06-MEMBER-030", "S-F05-06-MEMBER-033", "S-F05-06-MEMBER-034", "S-F05-06-MEMBER-035", "S-F05-06-MEMBER-036", "S-F05-06-MEMBER-037",
  "S-F05-06-MEMBER-038", "S-F05-06-MEMBER-039", "S-F05-06-MEMBER-040", "S-F05-06-MEMBER-041", "S-F05-06-MEMBER-042", "S-F05-06-MEMBER-043",
  "S-F05-06-MEMBER-044", "S-F05-06-MEMBER-045", "S-F05-06-MEMBER-048", "S-F05-06-MEMBER-049", "S-F05-06-MEMBER-050", "S-F05-06-MEMBER-051",
  "S-F05-06-ACCTTYPE-062", "S-F05-06-BOX20-063", "S-F05-06-BOX2-067", "S-F05-06-COMPLETE-069",
  "S-F05-06-DP-MEMBER-078", "S-F05-06-DP-MEMBER-079", "S-F05-06-DP-MEMBER-080", "S-F05-06-DP-MEMBER-081", "S-F05-06-DP-MEMBER-082",
  // 2026-11-13 追加（077 メモ・083 完了後の再申込）
  "S-F05-06-DP-MEMBER-077", "S-F05-06-DP-MEMBER-083",
]) defineMemberSeed(id);
