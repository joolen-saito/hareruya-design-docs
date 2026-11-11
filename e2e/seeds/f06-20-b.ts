/**
 * F06-20 配送先 の画面シード（-b）。正本: cases/F06-20_seed_data.tsv
 *
 * - 会員は、フロントの会員情報登録 → 本登録のメールのURL（仮会員機能は共有の設定のため書き換えない）→ 管理画面の会員一覧で会員IDを控える、の順で作る（依頼者決定 2026-10-31）。
 *   配送先は、フロントのマイページの配送先一覧から登録し、一覧の編集リンクの番号を控える。
 * - メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードには付けない。
 * - 会員の氏名は、シード表の「会員名」を姓と名に分けた値（「配送太郎-008」→ 姓「配送」・名「太郎-008」）。
 * - 参照マスタ（REF）・登録上限（ENV）は作り方が無く、手元の環境がシード表の状態であることを確かめるだけ。
 * - 配送先の件数は、会員情報住所（会員登録で自動で作られる既定の枠）も上限の数に入る作りのため、画面だけでは
 *   「登録配送先20件」は作れない（20件目の「新しい住所を追加」が出ない）。その場合は作れないことを問題として残して止める。
 * - DBでの直接設定を含むシード（5・7: 20件目をDBで設定）は実装しない。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 配送先の件数, 配送先IDの件数, 配送先登録上限, 日本国外の都道府県がある } from "../db/f06_20";
import { available } from "../lib/db";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMemberAdmin } from "../pages/admin/f06_masters";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { LoginPage } from "../pages/front/f06_03_login";
import { DeliveryPage, 既定の入力, 配送先の入力 } from "../pages/front/f06_20_delivery";
import { registerFrontMember } from "../pages/front/member_entry";
import { markedMail, 本会員を作る } from "./f06-member";

export const PW = "Passw0rd!F0620";
export const PC_PW = "Passw0rd-PC0620a";
export const PC_ADMIN = { loginId: "f0620pc-admin", password: "Passw0rd-PC0620" };
export const mailOf = (前半: string): string => markedMail(前半);

// ---- 参照マスタ・登録上限（作り方は無い。シード表の状態であることを確かめる） ----
defineSeed("S-F06-20-REF", async ({ browser }) => {
  void browser;
  if (available && !日本国外の都道府県がある()) throw new Error("都道府県ID 48「日本国外」が試験環境に無い（シード表は無ければDBで登録と定める。DBへの書き込みはしない）");
});
defineSeed("S-F06-20-ENV", async () => {
  if (!available) return;
  const 上限 = 配送先登録上限();
  if (上限 !== 20) throw new Error(`配送先登録上限が ${上限} 件（シード表は20件。設定の書き換えはしない）`);
});

type 住所 = { 郵便番号1: string; 郵便番号2: string; 都道府県: string; 住所1: string; 住所2: string; 電話: [string, string, string] };
/** 会員情報住所「東京都千代田区丸の内1-1」・電話番号 03-1111-2222 */
const 丸の内: 住所 = { 郵便番号1: "100", 郵便番号2: "0005", 都道府県: "東京都", 住所1: "千代田区丸の内", 住所2: "1-1", 電話: ["03", "1111", "2222"] };

type 配送先の定め = { 名称: string; 呼び名: string; 入力?: Partial<配送先の入力> };
type 会員の定め = { 前半: string; 姓: string; 名: string; 呼び名: string; 住所?: 住所; 会社名?: string; 配送先?: 配送先の定め[] };

async function 会員IDを探す(browser: Browser, メール: string): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を管理画面の会員一覧で1件に定められない`);
  return id;
}

/** フロントでログイン済みの画面を用意して処理する（登録直後は本登録のURLで会員としてログイン済みのことがある） */
export async function フロント会員で<T>(browser: Browser, メール: string, パスワード: string, fn: (page: Page, d: DeliveryPage) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    const l = new LoginPage(page);
    await l.ログイン画面を開く();
    if (await l.ログイン画面である()) await l.ログインする(メール, パスワード);
    return await fn(page, new DeliveryPage(page));
  } finally { await context.close(); }
}

async function 会員を作る(browser: Browser, m: 会員の定め): Promise<{ メール: string; 会員ID: string }> {
  const メール = mailOf(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    await registerFrontMember(page, { 姓: m.姓, 名: m.名, セイ: "ハイソウ", メイ: "タロウ", メール, パスワード: PW, 会社名: m.会社名, 詳細: m.住所 });
  } finally { await context.close(); }
  return { メール, 会員ID: await 会員IDを探す(browser, メール) };
}

/** 配送先を順に登録し、一覧の編集リンクから配送先IDを控える */
async function 配送先を足す(browser: Browser, seedId: string, メール: string, 配送先: 配送先の定め[], notes: { set(l: string, v: string): void }, 会員呼び名: string, 会員ID: string): Promise<void> {
  if (配送先.length === 0) return;
  await フロント会員で(browser, メール, PW, async (page, d) => {
    void page;
    for (const x of 配送先) {
      await d.一覧を開く();
      if ((await d.新しい住所を追加.count()) === 0) {
        const 文 = await d.一覧の画面上部の文;
        reportSeedIssue(seedId, `配送先「${x.名称}」を足そうとしたが、一覧に「新しい住所を追加」が無い（会員情報住所の枠も上限の数に入るため）。一覧の上部: ${文.slice(0, 120)}`);
        throw new Error(`${seedId}: 配送先「${x.名称}」を画面から足せない（配送先の件数が上限に達している）。ここまでの登録配送先の数: ${(await d.一覧の配送先()).length}`);
      }
      await d.登録する流れ({ 配送先名称: x.名称, ...x.入力 }, `${seedId} ${x.名称}`);
    }
    await d.一覧を開く();
    const 一覧 = await d.一覧の配送先();
    for (const x of 配送先) {
      const hit = 一覧.filter((y) => y.名称 === x.名称);
      if (hit.length !== 1) throw new Error(`${seedId}: 配送先名称「${x.名称}」が一覧に ${hit.length} 件ある`);
      // シード表が控えると定めた呼び名（範囲「01〜19」は両端）だけを控える
      const 定め = getSeed(seedId);
      const label = `〔配送先ID-F0620-${x.呼び名}〕`;
      if ((定め["状態・属性"] + 定め.投入方法).includes(label)) notes.set(label, hit[0].配送先ID);
    }
    if (一覧.length !== 配送先.length) throw new Error(`${seedId}: 登録配送先が ${一覧.length} 件（シード表は ${配送先.length} 件）`);
  });
  if (available) {
    const n = 配送先の件数(会員ID);
    if (n.既定を除く !== 配送先.length) throw new Error(`${seedId}: DBの登録配送先（会員情報住所を除く）が ${n.既定を除く} 件（シード表は ${配送先.length} 件）`);
  }
  void 会員呼び名;
}

function 会員シード(seedId: string, m: 会員の定め): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const { メール, 会員ID } = await 会員を作る(browser, m);
    notes.set(`〔会員ID-F0620-${m.呼び名}〕`, 会員ID);
    await 配送先を足す(browser, seedId, メール, m.配送先 ?? [], notes, m.呼び名, 会員ID);
  });
}

const 詳細な配送先 = (n: string): 配送先の定め => ({ 名称: `勤務先-${n}`, 呼び名: n, 入力: { ...既定の入力, 会社名: "晴屋商事" } });
const 任意の配送先 = (n: string): 配送先の定め => ({ 名称: `勤務先-${n}`, 呼び名: n });

// ---- 1件の配送先を持つ会員 ----
会員シード("S-F06-20-BASE-001", { 前半: "f06-20-001", 姓: "配送", 名: "太郎", 呼び名: "001", 住所: 丸の内, 会社名: "晴屋本社", 配送先: [詳細な配送先("001")] });
for (const n of ["002", "003", "009", "010", "011"]) {
  会員シード(`S-F06-20-BASE-${n}`, { 前半: `f06-20-${n}`, 姓: "配送", 名: `太郎-${n}`, 呼び名: n, 配送先: [任意の配送先(n)] });
}
会員シード("S-F06-20-BASE-008", { 前半: "f06-20-008", 姓: "配送", 名: "太郎-008", 呼び名: "008", 配送先: [詳細な配送先("008")] });
会員シード("S-F06-20-BASE-030", { 前半: "f06-20-030", 姓: "配送", 名: "太郎-030", 呼び名: "030", 配送先: [詳細な配送先("030")] });
for (const [k, n] of [["BASE", "031"], ["BASE", "032"], ["BASE", "033"], ["BASE", "034"], ["BASE", "035"], ["MISSING", "036"]] as const) {
  会員シード(`S-F06-20-${k}-${n}`, { 前半: `f06-20-${n}`, 姓: "配送", 名: `太郎-${n}`, 呼び名: n, 配送先: [任意の配送先(n)] });
}

// ---- 配送先0件の会員 ----
会員シード("S-F06-20-NEW-012", { 前半: "f06-20-012", 姓: "配送", 名: "太郎-012", 呼び名: "012", 住所: 丸の内 });
会員シード("S-F06-20-NEW-049", { 前半: "f06-20-049", 姓: "配送", 名: "太郎-049", 呼び名: "049", 住所: 丸の内 });
for (const n of ["013", "014", "015", "016", "017", "018", "019"]) {
  会員シード(`S-F06-20-NEW-${n}`, { 前半: `f06-20-${n}`, 姓: "配送", 名: `太郎-${n}`, 呼び名: n });
}

// ---- 上限に近い件数 ----
const 連番 = (接頭: string, 末尾: string, 呼び接頭: string, 件数: number): 配送先の定め[] =>
  Array.from({ length: 件数 }, (_, i) => { const nn = String(i + 1).padStart(2, "0"); return { 名称: `${接頭}${nn}${末尾}`, 呼び名: `${呼び接頭}-${nn}` }; });
会員シード("S-F06-20-CAP19-004", { 前半: "f06-20-004", 姓: "上限直前", 名: "会員-004", 呼び名: "004", 配送先: 連番("上限直前住所", "-004", "004", 19) });
会員シード("S-F06-20-CBEDIT-057", { 前半: "cbf06-20-057", 姓: "F0620CB057", 名: "会員", 呼び名: "CB057", 配送先: 連番("住所", "-F0620-CB057", "CB057", 2) });
会員シード("S-F06-20-CBLIMIT-058", { 前半: "cbf06-20-058", 姓: "F0620CB058", 名: "会員", 呼び名: "CB058", 配送先: 連番("住所", "-F0620-CB058", "CB058", 20) });
会員シード("S-F06-20-CBUPD-061", { 前半: "cbf06-20-061", 姓: "F0620CB061", 名: "会員", 呼び名: "CB061", 配送先: 連番("住所", "-F0620-CB061", "CB061", 20) });

// ---- 2件の配送先を持つ会員 ----
for (const n of ["055", "056"]) {
  会員シード(`S-F06-20-BASE-${n}`, {
    前半: `f06-20-${n}`, 姓: "配送", 名: `太郎-F0620-${n}`, 呼び名: n,
    配送先: [{ 名称: `勤務先-F0620-${n}-A`, 呼び名: `${n}-A` }, { 名称: `勤務先-F0620-${n}-B`, 呼び名: `${n}-B` }],
  });
}

// ---- 他会員の配送先（操作会員A・他会員B） ----
for (const n of ["027", "028", "037"]) {
  const seedId = `S-F06-20-OWNERSHIP-${n}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    for (const [記号, 前半, 名称] of [["A", `f06-20-${n}`, `操作会員住所-${n}`], ["B", `f06-20-other-${n}`, `他会員住所-${n}`]] as const) {
      const m: 会員の定め = { 前半, 姓: "配送", 名: `太郎-${n}${記号}`, 呼び名: `${n}${記号}` };
      const { メール, 会員ID } = await 会員を作る(browser, m);
      notes.set(`〔会員ID-F0620-${n}${記号}〕`, 会員ID);
      await 配送先を足す(browser, seedId, メール, [{ 名称, 呼び名: `${n}${記号}` }], notes, m.呼び名, 会員ID);
    }
  });
}

// ---- 配送先の登録・変更が会員管理の画面に出ること（PC-*） ----
defineSeed("S-F06-20-PC-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberAdmin(page, "F06-20会員管理の管理者", PC_ADMIN.loginId, PC_ADMIN.password));
});
defineSeed("S-F06-20-PC-ENV", async () => {
  // 配送先登録数の上限が20件であることを確かめる。ブラックリストの行は開発用の既存の行を消さない（判定の注記に残す）
  if (!available) return;
  const 上限 = 配送先登録上限();
  if (上限 !== 20) throw new Error(`配送先登録上限が ${上限} 件（シード表は20件。設定の書き換えはしない）`);
  reportSeedIssue("S-F06-20-PC-ENV", "ブラックリストは0件にしていない（開発用の既存の行を消さない決まり）。このケースの氏名・電話番号・住所と一致する行が無いことは、登録が止められないことで確かめた");
});
for (const [n, 前半, 名, 追加] of [["052", "pc-f0620-001", "太郎", false], ["053", "pc-f0620-002", "太郎", false], ["054", "pc-f0620-003", "太郎", true]] as const) {
  defineSeed(`S-F06-20-PC-MEMBER-${n}`, async ({ browser, notes }) => {
    const 会員ID = await 本会員を作る(browser, { 姓: "配送", 名, セイ: "ハイソウ", メイ: "タロウ", 前半, パスワード: PC_PW, 電話番号: "0312345678" });
    notes.set(`〔会員ID-F0620-PC${{ "052": "001", "053": "002", "054": "003" }[n]}〕`, 会員ID);
    if (追加) {
      await フロント会員で(browser, mailOf(前半), PC_PW, async (page, d) => {
        void page;
        await d.登録する流れ({
          配送先名称: "実家F0620PC003", 姓: "配送", 名: "花子", セイ: "ハイソウ", メイ: "ハナコ", 郵便番号: "5300001", 都道府県: "大阪府",
          住所1: "大阪市北区梅田", 住所2: "1丁目1番", 電話: "0663334444", 会社名: "配送実家商事F0620PC003",
        }, "S-F06-20-PC-MEMBER-054 実家F0620PC003");
      });
    }
  });
}
