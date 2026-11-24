/**
 * O01-01 MTGバイヤー 店頭買取（試験端末のアプリ）の手動試験用データ。正本: cases/O01-01_seed_data.tsv
 *
 * 端末のアプリ（C#/WPF）は Playwright で操作できないので、人が試験端末で実施する（依頼者決定 2026-11-24）。
 * こちらは、ケースごとのデータを開発環境に作り、使う番号を控える（review/mtgbuyer_manual/data/控えた番号.tsv）。
 * 実行の入口は spec/o01/o01_prep.spec.ts（テストではなく、準備だけを流す）。
 *
 * 作り方（受注のシードは、シード表の状態・属性の文を読み取って作る。文のとおり）:
 * - 店頭買取の申込: 試験支店のフロントの店頭買取査定申込（会員登録なし）。姓は「査定O0101-N」・名は「太郎」（印は付けない。文のとおり）。
 * - ステータス: 買取詳細のステータス変更の画面。査定担当者・フリーコメントは、担当の管理者で買取詳細に入れて保存。
 * - 画面で作れない値（査定番号・申込日時・フリーコメントの自動入力の取り消し・本人確認の種別・登録番号の確認・電話連絡・大会参加・返却サプライ）は、
 *   この手順書用に作った受注にだけ DB へ書く（db/o01.ts。印は姓の「査定O0101-」）。
 * - 商品: カード新規登録 → カード商品CSV登録（カード詳細を指定）→ 商品規格登録編集（商品コード・部門）。
 * - 部門・管理者: 部門管理・メンバー登録の画面。名前・ログインIDは文のまま（印を付けない）。
 *
 * 読み替え（依頼者決定。手順書にも書く）:
 * - 店舗: 店舗は作らない（2026-11-13）。シード表の店舗名「O0101試験店舗」（店舗ID 9010001）は、試験支店（店舗ID 1574）で読み替える。
 * - 職業・国: シード表の「O0101試験職業」「O0101試験国」は作らない（画面に登録の手段が無い共有のマスタ）。申込画面の職業は選択肢の先頭、国は日本のまま。
 * - 固定価格部門（部門ID 9011009）: 部門としては作るが、「固定価格部門」の設定（共有の設定）は書き換えない。
 * - 管理者の氏名・ログインID・パスワードはシード表の値。所属店舗・編集可能店舗は試験支店と本店。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 申込のマスタにある } from "../db/a06";
import { 商品の日本語NM規格ID, 日本語の言語ID, 姓で受注IDを探す, 商品コードで規格IDを探す, 商品名で商品IDを探す, 部門名で部門IDを探す, ログインIDで管理者IDを探す, 受注の今, 受注を記載の値にする, 受注の記載値 } from "../db/o01";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, Account, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { ensureMemberFixed } from "../pages/admin/member";
import { OtcDetail } from "../pages/admin/m06_03_detail";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { カードを登録する } from "../pages/admin/m06_11_setup";
import { カード商品CSVの公開の値, カード商品CSVの見出し, カード商品CSVを登録する, 単体カード配下のカテゴリID, 登録済みの割引率ID, } from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { マスタを読む } from "../pages/admin/m07_09_card";
import { ensureCardset } from "../pages/admin/product_masters";
import { 試験店舗の名前を読む, 店舗読み替えの注記 } from "../pages/admin/test_store";
import { 試験支店 } from "../pages/admin/reuse_store";
import { o01申込む } from "../pages/front/o01_apply";

// ---- 控えた番号の記録（手順書が読む）----
export const 控えのファイル = path.resolve(__dirname, "..", "review", "mtgbuyer_manual", "data", "控えた番号.tsv");
const 控え = new Map<string, string>();
function 控えを読む(): void {
  if (控え.size || !fs.existsSync(控えのファイル)) return;
  for (const l of fs.readFileSync(控えのファイル, "utf-8").split("\n").slice(1)) {
    const c = l.split("\t");
    if (c[1]) 控え.set(c[1], c[2]);
  }
}
/** 呼び名と値を記録する（同じ呼び名の値が変わったら置き換える）。シードIDは作った（戻した）シード */
export function 控えを書く(シードID: string, 呼び名: string, 値: string): void {
  控えを読む();
  控え.set(呼び名, 値);
  const rows: string[][] = [];
  if (fs.existsSync(控えのファイル)) for (const l of fs.readFileSync(控えのファイル, "utf-8").split("\n").slice(1)) if (l) rows.push(l.split("\t"));
  const i = rows.findIndex((r) => r[1] === 呼び名);
  const row = [シードID, 呼び名, 値, new Date().toISOString()];
  if (i >= 0) rows[i] = row; else rows.push(row);
  fs.mkdirSync(path.dirname(控えのファイル), { recursive: true });
  fs.writeFileSync(控えのファイル, ["シードID\t呼び名\t値\t記録日時", ...rows.map((r) => r.join("\t"))].join("\n") + "\n");
}
export function 控えの値(呼び名: string): string | undefined { 控えを読む(); return 控え.get(呼び名); }

// ---- 共有の値 ----
export const TC管理者: Account & { 名前: string; メール: string } = { loginId: "o0101-adm-tc", password: "Passw0rd!O0101", 名前: "O0101買取担当TC", メール: "o0101-adm-tc@example.test" };
const 部門の定め: [string, string, string][] = [["9011001", "O0101試験部門A", "9011001"], ["9011002", "O0101試験部門B", "9011002"], ["9011009", "O0101固定価格部門", "9011009"]];
const 部門名の対応 = new Map(部門の定め.map(([id, 名]) => [id, 名]));

/** 管理者を（無ければ）メンバー登録画面で登録し、管理者IDを返す。所属・編集可能店舗は試験支店と本店 */
async function 管理者を用意する(browser: Browser, seedId: string, a: { 名前: string; loginId: string; password: string; メール: string }): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 試験店舗の名前を読む(page);
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店.試験支店, ログインID: a.loginId, メールアドレス: a.メール, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店.試験支店, 編集可能店舗: [店.試験支店, 店.本店],
    }, (m) => reportSeedIssue(seedId, m));
    reportSeedIssue(seedId, `管理者「${a.名前}」（ログインID ${a.loginId}・管理者ID ${id}）は、メンバー登録画面で登録した（あれば使い回した）。権限はシステム管理者、所属店舗と編集可能店舗は試験支店と本店（${店舗読み替えの注記("O0101試験店舗", 店.試験支店, "1574")}）`);
    return id;
  });
}

// ---- シード表の文の読み取り ----
type 規格の定め = { 呼び名: string; 言語: string; 状態: string; フォイル: string; 買取: string; 販売: string; 部門ID: string };
type 商品の定め = { 呼び名: string; コード: string; 名前: string; 規格: 規格の定め[] };
type 受注の定め = { 呼び名: string; 査定番号: string; 姓: string; 状態: string; 担当名: string | null; コメント: string | null; 本人確認: string | null; 適格: boolean; 確認: boolean | null; 電話: boolean; 大会: boolean; 返却: string | null };
type 管理者の定め = { 呼び名: string; 氏名: string };
export type 受注シードの定め = { 管理者: 管理者の定め[]; 商品: 商品の定め[]; 受注: 受注の定め[] };

export function 受注シードを読む(text: string): 受注シードの定め {
  const 管理者: 管理者の定め[] = [...text.matchAll(/管理者（管理者IDは登録時に画面が振る（控える。以下(〔[^〕]+〕)）。氏名「([^」]+)」）/g)].map((m) => ({ 呼び名: m[1], 氏名: m[2] }));
  const 商品: 商品の定め[] = [];
  const 位置: { 位置: number; 商品: 商品の定め }[] = [];
  for (const m of text.matchAll(/商品（商品IDは登録時に画面が振る（控える。以下(〔商品ID-[^〕]+〕)）。商品コード ([^、]+)、日本語の商品名「([^」]+)」/g)) {
    const p: 商品の定め = { 呼び名: m[1], コード: m[2], 名前: m[3], 規格: [] };
    商品.push(p); 位置.push({ 位置: m.index ?? 0, 商品: p });
  }
  for (const m of text.matchAll(/規格（規格IDは登録時に画面が振る（控える。以下(〔規格ID-[^〕]+〕)））は([^・]+)・([A-Z]+)・フォイル区分(\d)・買取価格(\d+)・販売価格(\d+)・部門ID (\d+)/g)) {
    const at = m.index ?? 0;
    const 親 = [...位置].reverse().find((x) => x.位置 < at);
    if (!親) throw new Error(`規格 ${m[1]} の親の商品が文に無い`);
    親.商品.規格.push({ 呼び名: m[1], 言語: m[2], 状態: m[3], フォイル: m[4], 買取: m[5], 販売: m[6], 部門ID: m[7] });
  }
  const 受注: 受注の定め[] = [];
  const parts = text.split("店頭買取受注（").slice(1);
  for (const raw of parts) {
    const s = raw.split("検索で見つかる商品")[0];
    const get = (re: RegExp): string | null => re.exec(s)?.[1] ?? null;
    const 呼び名 = get(/店頭買取受注IDは登録時に画面が振る（控える。以下(〔[^〕]+〕)）/);
    const 査定番号 = get(/査定番号([^、]+)、/);
    const 姓 = get(/お客様名「(.+?) 太郎」/);
    const 状態 = get(/状態=([^、]+)、/);
    if (!呼び名 || !査定番号 || !姓 || !状態) throw new Error(`受注の文が読めない: ${s.slice(0, 120)}`);
    const 担当 = /査定担当者=([^、]+)、/.exec(s)?.[1] ?? null;
    const コメント = /フリーコメント「([^」]*)」/.exec(s)?.[1] ?? null;
    const 本人確認 = /本人確認の種別=([^（、]+)/.exec(s)?.[1] ?? null;
    const 確認 = /登録番号の確認の値(true|false)/.exec(s)?.[1];
    受注.push({
      呼び名, 査定番号, 姓, 状態, 担当名: 担当, コメント, 本人確認,
      適格: /適格請求書発行事業者(?!でない)/.test(s),
      確認: 確認 === undefined ? null : 確認 === "true",
      電話: /電話通知フラグ1/.test(s), 大会: /大会参加中フラグ1/.test(s), 返却: /返却サプライ「([^」]+)」/.exec(s)?.[1] ?? null,
    });
  }
  return { 管理者, 商品, 受注 };
}

// ---- 部門・商品 ----
let 前提の控え: { 日本語: string; カテゴリ: string; 割引率: string; 購入グループ: string; カードセット: string; レア: string } | undefined;
async function 商品の前提(browser: Browser, issue: (m: string) => void): Promise<NonNullable<typeof 前提の控え>> {
  if (前提の控え) return 前提の控え;
  前提の控え = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const rare = await マスタを読む(page, "レアリティ");
    const C = rare.find((r) => r.コード === "C") ?? rare[0];
    if (!C) throw new Error("レアリティのマスタが空");
    const cat = await 単体カード配下のカテゴリID(page);
    const disc = await 登録済みの割引率ID(page);
    const group = await readExistingSellGroupName(page);
    const set = await ensureCardset(page, "O0101試験カードセット", "O0101 Test Set", "O0101T", issue);
    return { 日本語: 日本語の言語ID(), カテゴリ: cat.id, 割引率: disc.id, 購入グループ: group, カードセット: set, レア: C.名称 };
  });
  return 前提の控え;
}

let 連番 = 0;
const 番号の基 = String(Date.now()).slice(-8);

/** 部門（A・B・固定価格部門）を、無ければ部門管理の画面で登録する */
async function 部門を用意する(browser: Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [, 名, コード] of 部門の定め) {
      if (部門名で部門IDを探す(名)) continue;
      await new DepartmentPage(page).register({ 部門名: 名, 部門コード: コード, 免税区分: "対象外", MTGBuyer表示フラグ: true }, `${seedId}: 部門「${名}」`);
    }
  });
  for (const [定めのID, 名] of 部門名の対応) 控えを書く(seedId, `部門ID（シード表の${定めのID}）`, 部門名で部門IDを探す(名) ?? "");
}

async function 規格を記載の値にする(page: Page, 商品ID: string, 規格ID: string, p: 商品の定め, g: 規格の定め, what: string): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await form.waitFor({ timeout: 30_000 });
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"][value="0"]');
  if ((await smaregi.count()) === 1) await smaregi.check({ force: true });
  await form.locator("#admin_product_class_code").fill(p.コード);
  await form.locator("#admin_product_class_buy_price").fill(g.買取);
  await form.locator("#admin_product_class_price02").fill(g.販売);
  await form.locator("#admin_product_class_standard_price").fill(g.販売);
  const 部門名 = 部門名の対応.get(g.部門ID);
  if (!部門名) throw new Error(`${what}: 部門ID ${g.部門ID} が部門の対応に無い`);
  await form.locator("#admin_product_class_Section").selectOption({ label: 部門名 });
  await form.locator("#admin_product_class_Status").selectOption({ label: "公開" });
  const on = (d: import("@playwright/test").Dialog) => { void d.accept(); };
  page.on("dialog", on);
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ noWaitAfter: true }),
    ]);
  } finally { page.off("dialog", on); }
  await expectSaved(page, `${what}: 商品規格の登録`);
}

async function 商品を用意する(ctx: SeedCtx, p: 商品の定め): Promise<void> {
  const { browser, notes, seed } = ctx;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 規格の呼び名 = p.規格[0]?.呼び名;
  if (!規格の呼び名) throw new Error(`${seed.シードID}: 商品「${p.名前}」の規格が文に無い`);
  if (p.規格.length > 1) throw new Error(`${seed.シードID}: 商品「${p.名前}」に規格が ${p.規格.length} 件ある（この作り方は1件だけ。2件目以降は作れない）`);
  const g = p.規格[0];
  if (g.言語 !== "日本語" || g.状態 !== "NM" || g.フォイル !== "0") throw new Error(`${seed.シードID}: 規格の言語・状態・フォイル区分（${g.言語}・${g.状態}・${g.フォイル}）がこの作り方の範囲（日本語・NM・フォイル区分0）でない`);
  let 商品ID = 商品名で商品IDを探す(p.名前);
  if (!商品ID) {
    const pre = await 商品の前提(browser, issue);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const c = await カードを登録する(page, {
        カード名英: `O0101 ${p.コード}`, カラー: "白",
        詳細: { カードセットID: pre.カードセット, カード番号: `${番号の基}${String(++連番).padStart(2, "0")}`, レアリティ名: pre.レア, Foil: false },
      }, `${seed.シードID}: カード ${p.コード}`, issue);
      const 見出し = await カード商品CSVの見出し(page);
      const 公開 = await カード商品CSVの公開の値(page);
      await カード商品CSVを登録する(page, 見出し, [{
        "商品ID": "", "言語(ID)": pre.日本語, "商品公開ステータス": 公開.商品公開ステータス, "支店の商品公開ステータス": 公開.支店の商品公開ステータス,
        "商品名(日)": p.名前, "商品名(英)": `O0101 ${p.コード}`, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": pre.カテゴリ,
        "購入グループ名称": pre.購入グループ, "割引率(ID)": pre.割引率, "基準価格": g.販売, "販売価格": g.販売, "買取価格": g.買取,
        "カード詳細(ID)": c.カード詳細ID,
      }], `${seed.シードID}-${p.コード}.csv`.toLowerCase(), `${seed.シードID}: カード商品CSV登録`, issue);
    });
    for (let i = 0; !商品ID && i < 12; i++) { 商品ID = 商品名で商品IDを探す(p.名前); if (!商品ID) await new Promise((r) => setTimeout(r, 5_000)); }
    if (!商品ID) throw new Error(`${seed.シードID}: 商品「${p.名前}」を登録したが、見つからない`);
  }
  const 既存の規格ID = 商品コードで規格IDを探す(p.コード);
  let 規格ID = 既存の規格ID;
  if (!規格ID) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      let 見つけた: string | null = null;
      for (let i = 0; !見つけた && i < 12; i++) { 見つけた = 商品の日本語NM規格ID(商品ID!); if (!見つけた) await page.waitForTimeout(5_000); }
      if (!見つけた) throw new Error(`${seed.シードID}: 商品「${p.名前}」の規格（日本語・NM）が無い`);
      await 規格を記載の値にする(page, 商品ID!, 見つけた, p, g, seed.シードID);
      規格ID = 見つけた;
    });
  }
  notes.set(p.呼び名, 商品ID);
  notes.set(g.呼び名, 規格ID!);
  控えを書く(seed.シードID, p.呼び名, 商品ID);
  控えを書く(seed.シードID, g.呼び名, 規格ID!);
  issue(`商品「${p.名前}」（商品ID ${商品ID}・規格ID ${規格ID}）は、カード新規登録 → カード商品CSV登録 → 商品規格登録編集で作った（あれば使い回した）。言語 日本語・状態 NM・フォイル区分 0・買取価格 ${g.買取}・販売価格 ${g.販売}（基準価格も同じ）・部門「${部門名の対応.get(g.部門ID)}」。商品コード ${p.コード}`);
}

// ---- 受注 ----
async function ステータスを画面で変える(browser: Browser, 受注ID: string, 変更後: string): Promise<void> {
  // 試験支店の買取を変えられるのは、編集可能店舗に試験支店がある管理者（O0101買取担当TC）
  await withAdminSession(browser, TC管理者, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl(`/otcbuyorder/status/${受注ID}`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    await page.locator('form#form select[name$="[otc_buy_order_status]"]').selectOption({ label: 変更後 });
    await Promise.all([page.waitForLoadState("load"), page.getByRole("button", { name: "保存", exact: true }).click()]);
    await expectSaved(page, `ステータスを「${変更後}」に変える`);
  });
}

async function 受注を用意する(ctx: SeedCtx, o: 受注の定め, 担当: { 管理者ID: string; account: Account } | null, 申込む: Parameters<typeof o01申込む>[2]): Promise<string> {
  const { browser, notes, seed } = ctx;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 前 = 控えの値(o.呼び名);
  let id: string | null = null;
  if (前 && 受注の今(前)?.姓 === o.姓) id = 前;
  if (!id) id = 姓で受注IDを探す(o.姓, "太郎");
  const 新規 = !id;
  if (!id) {
    const context = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      await o01申込む(page, 試験支店.支店URL, 申込む);
    } finally { await context.close(); }
    for (let i = 0; !id && i < 6; i++) { id = 姓で受注IDを探す(o.姓, "太郎"); if (!id) await new Promise((r) => setTimeout(r, 5_000)); }
    if (!id) throw new Error(`${seed.シードID}: 申込んだ受注（${o.姓} 太郎）が DB に無い`);
    if (o.状態 !== "査定前") await ステータスを画面で変える(browser, id, o.状態);
    if (担当 && o.コメント !== null) {
      await withAdminSession(browser, 担当.account, async (page) => {
        page.setDefaultTimeout(60_000);
        const d = new OtcDetail(page);
        await d.open(id!);
        await d.フリーコメントを入れる(o.コメント!);
        await d.保存を押す();
      });
    }
  }
  const 記載: 受注の記載値 = {
    査定番号: o.査定番号, 申込日時: "2026-10-01 10:00:00", ステータス: o.状態, 担当の管理者ID: 担当?.管理者ID ?? null,
    フリーコメント: o.コメント, 本人確認の種別: o.本人確認, 適格請求書発行事業者: o.適格, 登録番号の確認: o.確認,
    電話連絡: o.電話, 大会参加: o.大会, 返却サプライ: o.返却,
  };
  受注を記載の値にする(`${seed.シードID}: 受注 ${id} を記載の値にする`, id, 記載);
  notes.set(o.呼び名, id);
  控えを書く(seed.シードID, o.呼び名, id);
  issue(`受注（受注ID ${id}・査定番号 ${o.査定番号}）は、${新規 ? "試験支店のフロントの店頭買取査定申込で申込み" : "作ってあったものを使い"}、査定番号・申込日時・状態・査定担当者・フリーコメント・本人確認の種別・登録番号の確認・電話連絡・大会参加・返却サプライをシード表の記載の値にした（画面で作れない値は DB へ。この手順書用の受注だけ）${新規 ? "" : "。状態の戻しも同じ書き込み"}`);
  return id;
}

/** O01-01 の受注のシード1件を作る（または、作ってあれば記載の値へ戻す） */
async function 受注のシードを作る(ctx: SeedCtx): Promise<void> {
  const { browser, notes, seed } = ctx;
  const d = 受注シードを読む(seed["状態・属性"]);
  const 管理者ID = new Map<string, string>();
  for (const a of d.管理者) {
    const n = /(\d{3})$/.exec(a.氏名)?.[1] ?? "000";
    const acc = { 名前: a.氏名, loginId: `o0101-adm-${n}`, password: "Passw0rd!O0101", メール: `o0101-adm-${n}@example.test` };
    const id = await 管理者を用意する(browser, seed.シードID, acc);
    notes.set(a.呼び名, id);
    控えを書く(seed.シードID, a.呼び名, id);
    管理者ID.set(a.氏名, id);
  }
  for (const p of d.商品) await 商品を用意する(ctx, p);
  for (const o of d.受注) {
    const 担当 = o.担当名 ? { 管理者ID: 管理者ID.get(o.担当名) ?? "", account: { loginId: `o0101-adm-${/(\d{3})$/.exec(o.担当名)?.[1]}`, password: "Passw0rd!O0101" } } : null;
    if (o.担当名 && !担当?.管理者ID) throw new Error(`${seed.シードID}: 査定担当者「${o.担当名}」の管理者がシードの文に無い`);
    await 受注を用意する(ctx, o, 担当, {
      姓: o.姓, 名: "太郎", セイ: "サテイ", メイ: "タロウ", 適格請求書発行事業者: o.適格, 電話連絡を必要にする: o.電話, 大会参加: o.大会,
      返却サプライその他: o.返却 ?? undefined,
    });
  }
}

/** 作れないシード（理由つき）。手順書の「作れなかったケース」に出る */
export const 作れない理由 = new Map<string, string>([
  ["S-O01-01-ORD-118", "別の店舗（店舗名「O0101-118店」）の登録が要る。店舗は作らない決まり（2026-11-13）"],
  ["S-O01-01-ADM-118", "別の店舗（店舗名「O0101-118店」）の登録が要る。店舗は作らない決まり（2026-11-13）"],
  ["S-O01-01-ORD-026", "同じ商品に2つ目の規格（日本語・SP・買取価格250・販売価格600）を足す作り方が未実装"],
]);

const 人が端末で行う = (seed: { シードID: string }): string => `${seed.シードID} は試験端末で人が行う準備（端末のフォルダ・保管先の確認や、アプリの操作で作るデータ）。手順書の「端末で人がする準備」に、シード表の投入方法を番号入りで写した`;

export function o01_01のシードを登録する(ids: string[]): void {
  for (const id of ids) {
    if (/^S-O01-01-ORD-\d+$/.test(id)) {
      if (作れない理由.has(id)) defineSeed(id, async () => { throw new Error(作れない理由.get(id)!); });
      else defineSeed(id, { needs: ["S-O01-01-MASTER", "S-O01-01-ADM-TC"] }, 受注のシードを作る);
    } else if (/^S-O01-01-(TERM|ID|FILE)-\d+$/.test(id)) {
      const n = /(\d+)$/.exec(id)![1];
      defineSeed(id, { needs: [`S-O01-01-ORD-${n}`] }, async ({ seed }) => { reportSeedIssue(seed.シードID, 人が端末で行う(seed)); });
    }
  }
}

defineSeed("S-O01-01-ENV", async ({ seed }) => { reportSeedIssue(seed.シードID, "試験端末の設定（接続先・保管先）は端末で人が行う。手順書の「共通の準備」に書いた"); });
defineSeed("S-O01-01-STORE", async ({ seed }) => { reportSeedIssue(seed.シードID, "試験用保管先（S3）の確認は人が行う。手順書の「共通の準備」に書いた"); });
defineSeed("S-O01-01-ADM-118", async () => { throw new Error(作れない理由.get("S-O01-01-ADM-118")!); });
defineSeed("S-O01-01-MASTER", async ({ browser, seed }) => {
  const 店 = await withAdminSession(browser, SETUP_ADMIN, async (page) => 試験店舗の名前を読む(page));
  const 店頭買取ステータス: [string, string][] = [["1", "買取成立"], ["2", "買取キャンセル"], ["5", "査定前"], ["6", "査定中"], ["8", "査定中断"], ["9", "査定再開"], ["10", "経理払い出し待ち"], ["13", "入庫待ち"]];
  void 店頭買取ステータス;
  if (!申込のマスタにある("国", "Japan") && !申込のマスタにある("国", "日本")) throw new Error(`${seed.シードID}: 国のマスタに日本が無い`);
  await 部門を用意する(browser, seed.シードID);
  reportSeedIssue(seed.シードID, `${店舗読み替えの注記("O0101試験店舗", 店.試験支店, "1574")}。部門A・B・固定価格部門は部門管理の画面で登録した（あれば使い回した。部門IDは画面が振るので、控えた番号の表の「部門ID（シード表の…）」）。職業「O0101試験職業」・国「O0101試験国」は作らず、申込画面の既存の選択肢（職業は先頭・国は日本）を使った。固定価格部門の設定（共有の設定）は書き換えていない。買取ステータス・言語・状態・フォイル区分・身分証明書種別は既存のマスタを使った`);
});
defineSeed("S-O01-01-ADM-TC", async ({ browser, notes, seed }) => {
  const id = await 管理者を用意する(browser, seed.シードID, { 名前: TC管理者.名前, loginId: TC管理者.loginId, password: TC管理者.password, メール: TC管理者.メール });
  notes.set("〔管理者ID-O0101-共有〕", id);
  控えを書く(seed.シードID, "〔管理者ID-O0101-共有〕", id);
});
