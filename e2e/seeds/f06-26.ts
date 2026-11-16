/**
 * F06-26 店頭PC用アカウント制御の画面シード。正本: cases/F06-26_seed_data.tsv
 * 実装するのはケース 016 が使う GROUPS・DPENV-016・DPVIEW-016 だけ。
 *
 * - GROUPS（共有可）: 顧客グループ管理で「店内アカウント」「支店店内アカウント」「通常会員」があれば区分を確かめて使い、無ければ登録する。
 *   名称を押して開いた編集画面のアドレスの末尾の番号を控える。区分が違う同じ名称があれば落とす（共有の顧客グループを書き換えない）。
 * - DPENV-016: 店舗設定のお気に入り商品機能（共有の設定）は書き換えず、有効であることを画面で確かめるだけ（条件付き。F06-09 の ENV と同じ扱い）。
 * - DPVIEW-016: グッズ商品CSV登録で在庫0の商品を作り、取り込みで作られた商品規格を公開で登録する。会員は本店の新規会員登録画面で登録し、
 *   管理画面で本会員にする（pages/admin/member_activate.ts）。会員登録/編集で顧客グループ「通常会員」を選んで登録する。
 *   商品コード・商品名と会員のメールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。
 *
 * 作らないシード: MAIL（≪共有の設定≫のメール試験サーバー）・NOTIFY-014・DPNOTIFY-017・CBNOFAV-018・CBNOSALE-019（セール通知のバッチを実行コンソールで起動するケース用）、
 * FGIP・FGSHOPS・FGRESTRICT-020/021・FGORDER-022・FGBUTTON-023・FGTICKET-024・FGREFLECT-025（本店・支店の店頭用アカウントIPアドレスと本店の公開・開店を書き換える。021 は所属店舗を DB で設定）。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { readFavoriteOption } from "../pages/admin/f03_08_masters";
import { 会員の顧客グループを選ぶ, 顧客グループを用意する } from "../pages/admin/f06_26_setup";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { markedMail } from "./f06-member";
import { Browser } from "@playwright/test";
import { SHARED_ENV } from "../config/env";
import { registerRestore } from "../lib/shared_restore";
import { 本会員を作る } from "./f06-member";
import { findTenantId } from "../pages/admin/tenant_k";
import { 店名を読む } from "../lib/store_pick";
import { グッズ商品を登録する } from "../pages/admin/f02_02_setup";
import { 在庫を増減して承認する } from "../pages/admin/f02_01_setup";
import {
  店舗の公開と開店を読む, 店舗登録を全部読む, 店舗登録を控えへ戻す, 店頭用アカウントIPアドレスを入れて登録する, 店頭用アカウントIPアドレスを読む, 接続元IPを読む,
} from "../pages/admin/f06_26_setup";

// ---- 顧客グループ ----

defineSeed("S-F06-26-GROUPS", async ({ browser, notes, seed }) => {
  const made: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [名称, 店内注文専用, 支店店内注文専用, label] of [
      ["店内アカウント", true, false, "〔顧客グループID-F0626-共有A〕"],
      ["支店店内アカウント", false, true, "〔顧客グループID-F0626-共有B〕"],
      ["通常会員", false, false, "〔顧客グループID-F0626-共有C〕"],
    ] as const) {
      const r = await 顧客グループを用意する(page, 名称, { 店内注文専用, 支店店内注文専用 });
      notes.set(label, r.id);
      made.push(`「${名称}」ID ${r.id}（${r.作った ? "登録した。ポイント還元率は0" : "既にあったものを区分を確かめて使った"}）`);
    }
  });
  reportSeedIssue(seed.シードID, `顧客グループ: ${made.join("、")}`);
});

// ---- お気に入り商品機能（確かめるだけ） ----

defineSeed("S-F06-26-DPENV-016", async ({ browser, seed }) => {
  const on = await withAdminSession(browser, SETUP_ADMIN, (page) => readFavoriteOption(page));
  if (!on) throw new Error("店舗設定のお気に入り商品機能が無効。共有の設定は書き換えないので、有効にしてから流す");
  reportSeedIssue(seed.シードID, "店舗設定のお気に入り商品機能は共有の設定なので保存せず、有効であることを画面で確かめた（条件付き）");
});

// ---- 通常会員と売り切れ商品（016） ----

export type 作った商品 = { productId: string; classId: string; code: string };
const products = new Map<string, 作った商品>();
/** シード表の商品コード（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品コード: string): 作った商品 {
  const p = products.get(rc(正本の商品コード));
  if (!p) throw new Error(`商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return p;
}
/** シード表のメールアドレスの前半（正本の値）に実行の印を付けたメールアドレス */
export const mailOf = (正本の前半: string): string => markedMail(正本の前半);

defineSeed("S-F06-26-DPVIEW-016", { needs: ["S-F06-26-GROUPS"] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = rc("F0626-SOLD-016");
  // 商品（在庫0）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const region = Object.fromEntries(template.headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...region, "スマレジ連携フラグ": "0", "原価単価": "10" },
      lines: [{ code, nameJp: code, nameEn: code, values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100" } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    });
    const productId = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, productId);
    if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${seedId}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
    await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${seedId}: ${code}`, issue);
    products.set(code, { productId, classId: rows[0].商品規格ID, code });
    issue(`商品 ${code}（商品ID ${productId}・商品規格ID ${rows[0].商品規格ID}）をグッズ商品CSV登録で作り、商品規格を公開で登録した。入庫はしていない（在庫0）。基準価格・販売価格1000・買取価格100・サイズ1・重量1・カテゴリはサプライ・グッズ（シード表は「有効な値」とだけ定める）`);
  });
  // 会員（通常会員）
  const mail = mailOf("dpf0626-016-a");
  const id = await 会員を登録して本会員にする(browser, {
    姓: "F06-26", 名: "会員016", セイ: "シケン", メイ: "カイイン", メール: mail, パスワード: "Passw0rd-F0626016",
  }, issue);
  notes.set("〔会員ID-F0626-016〕", id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 会員の顧客グループを選ぶ(page, id, notes.get("〔顧客グループID-F0626-共有C〕"));
  });
  issue(`会員 ${mail}（会員ID ${id}）の顧客グループを「通常会員」にして登録した。お気に入り・入荷通知依頼は登録していない`);
});

// =====================================================================================
// 020・022〜025 店頭用アカウント（店内アカウント）の制御（2026-11-12 追加）
// - 接続元IP（FGIP）: 管理画面のログイン履歴で、この実行の端末からのログインの接続元IPを読んで控える（アプリが見た接続元のアドレス）。
// - 店舗（FGSHOPS）: 本店は公開・開店であることを画面で確かめるだけ（書き換えない）。シード表の支店「FG0626支店」は、
//   試験用の店舗を増やさない決まり（依頼者決定 2026-11-11）に従い、決まった印の試験用の支店（店舗A-E2E。pages/admin/m13_marked_shop.ts）で代える。
//   020・022〜025 は支店を使わない（021 は実装しない）。
// - 本店の店頭用アカウントIPアドレス（共有の設定）: 書き換える前に本店の店舗登録の全項目を画面から控え、ケースの終わりに画面で戻して開き直して確かめる
//   （lib/shared_restore.ts）。共有の環境では夜の1本流し（E2E_ALLOW_SHARED=1）でだけ書き換える。
// =====================================================================================

const 本店ID = "1";

defineSeed("S-F06-26-FGIP", async ({ browser, notes, seed }) => {
  const r = await withAdminSession(browser, SETUP_ADMIN, (page) => 接続元IPを読む(page, SETUP_ADMIN.loginId));
  notes.set("〔接続元IP-F0626-共有〕", r.IP);
  reportSeedIssue(seed.シードID, `管理画面のログイン履歴で、この端末からの管理者のログイン（いちばん新しい成功の行: ${r.行}）の接続元IP「${r.IP}」を控えた。` +
    "管理画面と公開側は同じアプリで、公開側へも同じ経路で接続する前提（違えば、店内アカウントのログインがログアウトへ移されてケースが落ちる）");
});

defineSeed("S-F06-26-FGSHOPS", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 本店 = await 店舗登録を全部読む(page, 本店ID);
    const { 公開, 開店 } = await 店舗の公開と開店を読む(page);
    issue(`本店（店舗ID 1）の店舗登録画面: 公開「${公開 || "読めない"}」・開店「${開店 || "読めない"}」（項目 ${Object.keys(本店).length} 個）。本店の公開・開店は共有の設定なので書き換えない`);
    // 店舗は作らない（依頼者 2026-11-15）。支店は使い回す E2E の店舗 5006（公開・開店の支店）で表す
    const id = (await findTenantId(page, 店名を読む("5006"))) ?? "";
    if (id !== "5006") throw new Error("使い回す店舗（店舗ID 5006）が店舗一覧に無い");
    notes.set("〔店舗ID-F0626-FG共有〕", id);
    issue(`読み替え: シード表の支店「FG0626支店」は、店舗は作らない決まり（依頼者 2026-11-15）により、使い回す店舗「${店名を読む("5006")}」（店舗ID ${id}）で表した（020・022〜025 は支店を使わない）`);
  });
});

/** 本店の店頭用アカウントIPアドレスをケースの間だけ値にする（全項目を控えて、ケースの終わりに画面で戻す） */
async function 本店の店頭用IPをケースの間だけ(browser: Browser, 値: string, issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const now = await 店頭用アカウントIPアドレスを読む(page, 本店ID);
    if (now === 値) { issue(`本店の店頭用アカウントIPアドレスはすでに「${値}」だったので書き換えなかった`); return; }
    if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
      throw new Error("共有の環境では本店の店頭用アカウントIPアドレス（共有の設定）を書き換えない。夜に1本だけで流す回でだけ書き換える");
    }
    const 控え = await 店舗登録を全部読む(page, 本店ID);
    registerRestore("本店の店舗登録（全項目。店頭用アカウントIPアドレスを書き換える前）", 控え,
      async () => { await withAdminSession(browser, SETUP_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 店舗登録を控えへ戻す(p, 本店ID, 控え, "本店の店舗登録を元の値へ戻す"); }); },
      async () => withAdminSession(browser, SETUP_ADMIN, async (p) => {
        p.setDefaultTimeout(60_000);
        const 今 = await 店舗登録を全部読む(p, 本店ID);
        return Object.keys(控え).every((k) => 今[k] === 控え[k]) && Object.keys(今).every((k) => k in 控え);
      }));
    await 店頭用アカウントIPアドレスを入れて登録する(page, 本店ID, 値);
    issue(`本店の店頭用アカウントIPアドレスを「${now}」から「${値}」にした（共有の設定。本店の店舗登録の全項目を控え、ケースの終わりに画面で戻して確かめる）`);
  });
}

/** 店内アカウントの会員を作る（本会員にして、顧客グループを店内アカウントにする） */
async function 店内アカウントの会員を作る(browser: Browser, n: string, notes: { set(k: string, v: string): void; get(k: string): string }, issue: (m: string) => void): Promise<string> {
  const id = await 本会員を作る(browser, { 姓: "F06-26", 名: `店内${n}`, セイ: "シケン", メイ: "テンナイ", 前半: `fgf0626-${n}`, パスワード: `Passw0rd-FGF0626${n}` });
  notes.set(`〔会員ID-F0626-${n}〕`, id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 会員の顧客グループを選ぶ(page, id, notes.get("〔顧客グループID-F0626-共有A〕"));
  });
  issue(`会員 ${mailOf(`fgf0626-${n}`)}（会員ID ${id}）を本会員にし、顧客グループを「店内アカウント」にした`);
  return id;
}

for (const [sfx, n] of [["FGRESTRICT-020", "020"], ["FGORDER-022", "022"], ["FGBUTTON-023", "023"], ["FGTICKET-024", "024"], ["FGREFLECT-025", "025"]] as const) {
  defineSeed(`S-F06-26-${sfx}`, { needs: ["S-F06-26-GROUPS", "S-F06-26-FGIP"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await 店内アカウントの会員を作る(browser, n, notes, issue);
    if (n === "022" || n === "024" || n === "023") {
      const 正本の商品コード = n === "023" ? "F0626-FG-SOLD-023" : `F0626-FG-ORDER-${n}`;
      const code = rc(正本の商品コード);
      const [productId] = await グッズ商品を登録する(browser, seed.シードID, [{ 商品コード: code, 商品名: code }], issue);
      const classId = await withAdminSession(browser, SETUP_ADMIN, async (page) => (await classRowsFromProductEdit(page, productId))[0].商品規格ID);
      products.set(code, { productId, classId, code });
      if (n !== "023") {
        await 在庫を増減して承認する(browser, seed.シードID, [{ 商品コード: code, 数: 5, 区分: "入庫/その他", 承認後の在庫: 5 }], issue);
        issue(`商品 ${code}（商品ID ${productId}）を作り、本店のEC-CUBE在庫5を入れた（在庫編集とその承認。シード表の在庫変更CSV登録の代わり。できる状態は同じ）。税込み価格はグッズ商品の登録の部品の値で、ケースは確かめない`);
      } else {
        issue(`商品 ${code}（商品ID ${productId}）を作った（在庫0・売り切れ）。お気に入り・入荷通知依頼は登録していない`);
      }
      if (n !== "023") issue("配送先は、会員登録で入れた住所の1件（シード表の「お届け先住所を追加」の代わり）");
    }
    const ip = notes.get("〔接続元IP-F0626-共有〕");
    await 本店の店頭用IPをケースの間だけ(browser, n === "025" ? "" : ip, issue);
  });
}

/**
 * 025 の手順2（管理画面＞モール設定＞店舗登録で本店を開き、店頭用アカウントIPアドレスを入れて登録する）。ケースの画面で行う。
 * 書き換える前に本店の店舗登録の全項目を控え、ケースの終わりに画面で戻して確かめる登録をする（シードの登録と重ねても、いちばん古い控えへ戻る）。
 */
export async function 本店の店頭用IPを画面で入れる(page: import("@playwright/test").Page, browser: Browser, 値: string): Promise<void> {
  if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
    throw new Error("共有の環境では本店の店頭用アカウントIPアドレス（共有の設定）を書き換えない。夜に1本だけで流す回でだけ書き換える");
  }
  const 控え = await 店舗登録を全部読む(page, 本店ID);
  registerRestore("本店の店舗登録（全項目。025 の手順2で書き換える前）", 控え,
    async () => { await withAdminSession(browser, SETUP_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 店舗登録を控えへ戻す(p, 本店ID, 控え, "本店の店舗登録を元の値へ戻す"); }); },
    async () => withAdminSession(browser, SETUP_ADMIN, async (p) => {
      p.setDefaultTimeout(60_000);
      const 今 = await 店舗登録を全部読む(p, 本店ID);
      return Object.keys(控え).every((k) => 今[k] === 控え[k]) && Object.keys(今).every((k) => k in 控え);
    }));
  await 店頭用アカウントIPアドレスを入れて登録する(page, 本店ID, 値);
}
