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
  d: { キー: string; カード名英: string; 名: string; コード: string; 買取: { NM: number; SP?: number; MP?: number } },
): Promise<F0506商品> {
  const 規格: Parameters<typeof カード商品を作る>[4]["規格"] = { "JP-NM": { 商品コード: d.コード, 買取: d.買取.NM } };
  const 残す = ["NM"];
  if (d.買取.SP !== undefined) { 規格["JP-SP"] = { 買取: d.買取.SP }; 残す.push("SP"); }
  if (d.買取.MP !== undefined) { 規格["JP-MP"] = { 買取: d.買取.MP }; 残す.push("MP"); }
  const made = await カード商品を作る(browser, seedId, notes, { 名英: d.カード名英 }, {
    名: d.名, 言語: ["JP"], 買取: d.買取.NM, 規格, 残す状態: 残す,
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
      国: "Japan", 郵便番号: m.郵便番号, 都道府県: "東京都", 住所1: "新宿区", 住所2: "西新宿1-1-1", 電話番号: m.電話, 職業: "会社員",
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
  return { メール, パスワード: m.パスワード, 姓: m.姓, 名: m.名, 会員ID };
}

function defineMemberSeed(seedId: string): void {
  const m = 会員の定義.find((x) => x.seed === seedId);
  if (!m) throw new Error(`${seedId} の会員の定義が無い`);
  defineSeed(seedId, async ({ browser, notes, seed }) => {
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
