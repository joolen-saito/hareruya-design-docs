/**
 * F02-03（支店のグローバルナビ・PC版）の画面シード。正本: cases/F02-03_seed_data.tsv
 *
 * 作るシード:
 * - S-F02-03-ENV: 試験環境（支店サイトの公開・画面幅）。作る操作が無い。画面幅1280pxは試験の基盤の既定。
 * - S-F02-03-STORE: 試験支店A・試験支店B。店舗登録画面で、郵便番号・住所・Google map埋め込みURL・電話番号・店舗営業時間・ご当地晴れる屋くんの画像を入れて登録する。
 *   店舗一覧に同じ店名があれば内容を確かめて使う。支店URLは f0203a・f0203b（正本が決めていない）。画像は e2e/fixtures/f02-03/（正本の外の補い。中身が決まっていない入力ファイル）。
 * - S-F02-03-MEMBER: フロントの会員情報登録で登録し本会員にする（依頼者決定 2026-10-31）。管理画面の会員のポイント履歴追加で+1200。メールの前半に実行の印。
 * - S-F02-03-MEMBER-055: 保有ポイント0の会員。
 * - S-F02-03-STORE-056: 試験支店B-056（Google map埋め込みURLが違う店舗）。
 * - S-F02-03-CART-EMPTY-052: カートに触れない（作る操作が無い）。
 * - カートのシード（CART-BASE・-024・-025・-028・-ONE・-FULL・-051・-MIX-053・-NOFOIL-054・CBCART-058）: 商品（カード指定のあるカード商品・グッズ商品）を画面で作り、
 *   在庫を入れ（登録者とは別の管理者が承認）、新しいブラウザで支店Aの商品詳細画面から数量を入れてカートへ入れる。そのブラウザのクッキーをケースのブラウザへ移して使う。
 *   正本の外で代えたこと（シードの注記にも出す）:
 *   - 「カート明細の追加日時・セッション識別子はDBへ直接設定する」は行わない。追加日時はカートへ入れた順（追加の順）で代える（カートの商品の並びはカート明細の番号順＝入れた順）。
 *     セッション識別子はクッキーの移しで代える。カートID・カート明細IDは画面に出ないので「画面に出ない」と控える（DBの参照に頼らない）。
 *   - 商品名はシード表の値のまま（カートの表示を正本と比べるため）。商品コード・カード名に実行の印を付けて重なりを避ける。
 *   - MIX-053 の「在庫なし商品」は、カートへ入れたあと、この実行で作った商品の在庫の行だけを DB で0にする（writeTestData。E2E_DB_WRITE=1 のときだけ）。
 *
 * 作らないシード: 検索試験データ・ユニサーチ反映（カードセットは共有のマスタなので足さない。ケース003〜006は既存のカードセット・商品で代える）、
 * カテゴリ（共有のカテゴリへ子を足す）、送料無料条件・送料無料条件到達カート（共有の設定の書き換え）、連携試験のシード（共有のカードセットの編集）。
 */
import path from "node:path";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { findTenantId } from "../pages/admin/tenant_k";
import { 読み替えの文, 店舗で表す, 試験支店, 店名を読む, 支店URLを読む } from "../lib/store_pick";
import { 店舗の画像と値をケースの間だけ設定する } from "../pages/admin/store_setting_restore";
export type { 試験支店 };
import { カート商品の定義, カート用商品を作る, 作った商品, 印つきの商品の在庫を0にする } from "../pages/admin/f02_03_cart_setup";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { 支店のゲストカートを作る, 試験カート } from "../pages/front/f02_03_cart";
import { 本会員を作る, markedMail } from "./f06-member";

export const FIXTURES = path.resolve(__dirname, "../fixtures/f02-03");
/**
 * 支店A・B・B056。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」）。店名・住所・電話番号・営業時間・地図URLが入っている、
 * 元からある店舗（読むだけ）で表す: 支店A=成田店（店舗ID 2）・支店B=福岡店（3）・支店B056=札幌店（4）。値は店舗のいまの登録値を読み、画面と比べる。
 * ご当地晴れる屋くんの画像は、正本の branch-a.png・branch-b.png を店舗へ上げられない（店舗の登録内容を書き換えない）ので、画像の同一を比べる 002 は止める。
 */
export const 支店A = 店舗で表す("2");
export const 支店B = 店舗で表す("3");
export const 支店B056 = 店舗で表す("4");
/**
 * 039（店舗情報の表示）の支店B。福岡店（店舗ID 3）は店舗営業時間が登録されておらず（営業時間の欄が空）、画面にも出ないので比べる値にならない。
 * 店舗の登録値を書き換えない決まりなので、営業時間を含む全項目が登録済みの E2E の店舗（店舗ID 5006・公開・開店の支店。読むだけ）で表す。
 */
export const 支店B039 = 店舗で表す("5006");
/** 空白を除いて比べる（画面は改行・空白を整えて出すことがある） */
export const 空白なし = (t: string): string => t.replace(/\s+/g, "");

export const 会員メール = () => markedMail("f02-03-member");
export const 会員パスワード = "F0203Member!";
export const 会員055メール = () => markedMail("dpf0203-055");
export const 会員055パスワード = "Passw0rd-F0203055";

// 試験環境「支店Aと支店Bの支店ECTOP画面へアクセス可能」は、試験支店A・Bを登録して整える
defineSeed("S-F02-03-ENV", { needs: ["S-F02-03-STORE"] }, async () => { /* 画面幅1280pxは基盤の既定 */ });
defineSeed("S-F02-03-CART-EMPTY-052", async () => { /* カートに触れない */ });

async function 店舗を確かめる(page: import("@playwright/test").Page, v: 試験支店, 正本の店名: string, issue: (m: string) => void): Promise<string> {
  const id = await findTenantId(page, v.店名);
  if (id !== v.id) throw new Error(`店舗ID ${v.id} が店舗一覧に無い（店名「${v.店名}」で探して ${id ?? "なし"}）`);
  issue(読み替えの文(正本の店名, { id, 店名: v.店名 }, "住所・電話番号・営業時間・地図URL は店舗の登録値を読んで画面と比べる。ご当地晴れる屋くんの画像は正本の画像ファイルを上げない"));
  return id;
}

defineSeed("S-F02-03-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0203-共有A〕", await 店舗を確かめる(page, 支店A, "試験支店A", (m) => reportSeedIssue(seed.シードID, m)));
    notes.set("〔店舗ID-F0203-共有B〕", await 店舗を確かめる(page, 支店B, "試験支店B", (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-F02-03-STORE-056", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0203-056〕", await 店舗を確かめる(page, 支店B056, "試験支店B-056", (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-F02-03-MEMBER", async ({ browser, notes }) => {
  const id = await 本会員を作る(browser, { 姓: "F0203試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: "f02-03-member", パスワード: 会員パスワード });
  notes.set("〔会員ID-F0203-共有〕", id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, id, 1200); });
});

defineSeed("S-F02-03-MEMBER-055", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0203-055〕", await 本会員を作る(browser, { 姓: "F0203試験", 名: "ゼロ", セイ: "シケン", メイ: "ゼロ", 前半: "dpf0203-055", パスワード: 会員055パスワード }));
});

// ---- カートのシード（支店Aのカートに商品を入れたブラウザ） ----

/** カートのシードが作ったブラウザの状態（シードID → クッキー）。ケースは自分のブラウザへクッキーを移す */
export const カートのブラウザたち = new Map<string, 試験カート>();

const 画面に出ない = "画面に出ない（カートへ入れたブラウザのカート。DBの参照には頼らない）";

/** シード表に出てくる呼び名を控える。カートID・カート明細IDは画面に出ないので固定の文、商品ID・商品規格IDは作った商品から（割当: 呼び名の末尾 → 商品の並びの番号） */
function 控える(seedId: string, notes: Notes, made: 作った商品[], 割当: Record<string, number> = {}): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-F0203-(.+)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, suffix] = m;
    if (kind === "カートID" || kind === "カート明細ID") { notes.set(label, 画面に出ない); continue; }
    const p = made[割当[suffix] ?? 0];
    if (!p) throw new Error(`${seedId}: ${label} に当たる商品を作っていない`);
    if (kind === "商品ID") notes.set(label, p.商品ID);
    else if (kind === "商品規格ID") notes.set(label, p.規格ID);
    else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

/** 支店Aの在庫を入れる管理者（支店Aだけを編集できる。承認は別の管理者）。決まった印で1度だけ作って使い回す */
const 支店A在庫登録者: Account = { loginId: `${rcFixed("f0203_branch_stock")}${支店A.id}`.toLowerCase(), password: "Passw0rd!F0203BS" };
/**
 * 支店Aの在庫の入庫を承認する管理者。決まった印で1度だけ作って使い回す。
 * 承認通知先に選べて承認できるのは、在庫の店舗（支店A）を編集できる承認の権限を持つ管理者だけで（アプリ origin/develop:
 * StockApprovalType::getMemberChoices・MemberRepository::canApprove）、準備用の管理者（SETUP_ADMIN）の編集可能店舗に支店Aは無い
 * （2026-11-13 07時台、承認通知先のメンバーが登録者1人だけで「『管理者』がいる部署が無い」で止まった）。共有の管理者の編集可能店舗は書き換えない。
 */
const 支店A在庫承認者: Account = { loginId: `${rcFixed("f0203_branch_appr")}${支店A.id}`.toLowerCase(), password: "Passw0rd!F0203BA" };
async function 支店A在庫登録者を用意する(page: import("@playwright/test").Page): Promise<void> {
  await ensureMember(page, {
    名前: rcFixed("F02-03支店A在庫登録者"), 所属店舗: 支店A.店名, ログインID: 支店A在庫登録者.loginId, メールアドレス: `${支店A在庫登録者.loginId}@example.test`,
    パスワード: 支店A在庫登録者.password, 権限: "システム管理者", デフォルト検索表示店舗: 支店A.店名, 編集可能店舗: [支店A.店名],
  });
  await ensureMember(page, {
    名前: rcFixed("F02-03支店A在庫承認者"), 所属店舗: 支店A.店名, ログインID: 支店A在庫承認者.loginId, メールアドレス: `${支店A在庫承認者.loginId}@example.test`,
    パスワード: 支店A在庫承認者.password, 権限: "システム管理者", デフォルト検索表示店舗: 支店A.店名, 編集可能店舗: [支店A.店名],
  });
}

type カートの商品 = { 定義: Omit<カート商品の定義, "商品コード"> & { コード: string }; 数量: number };

function defineCartSeed(seedId: string, items: カートの商品[], opt: { 割当?: Record<string, number>; 後で?: (made: 作った商品[], issue: (m: string) => void, 店舗ID: string) => void } = {}): void {
  defineSeed(seedId, { needs: ["S-F02-03-STORE"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    // 支店Aの商品詳細は支店Aの在庫を見るので、在庫は支店Aに入れる
    const 支店AのID = notes.get("〔店舗ID-F0203-共有A〕");
    const made = await カート用商品を作る(browser, seedId, items.map((i) => ({ ...i.定義, 商品コード: rc(i.定義.コード) })), issue,
      { 店舗ID: 支店AのID, 登録者: 支店A在庫登録者, 登録者を用意する: 支店A在庫登録者を用意する, 承認者: 支店A在庫承認者 });
    issue(`在庫数は、カートへ入れる支店A（${支店A.店名}・店舗ID ${支店AのID}）に入れた（シード表は在庫の店舗を決めていない。支店の商品詳細は、その支店の在庫で数量の欄を出す）。在庫編集の登録は ${支店A在庫登録者.loginId}、承認は ${支店A在庫承認者.loginId}（どちらも支店Aだけを編集できる E2E の管理者。支店Aの在庫を承認できるのは支店Aを編集できる管理者だけ）`);
    const cart = await 支店のゲストカートを作る(browser, seedId, 支店A.支店URL, items.map((i, k) => ({ 商品ID: made[k].商品ID, 数量: i.数量 })));
    const 合計 = items.reduce((a, i) => a + i.数量, 0);
    if (cart.商品数 !== 合計) throw new Error(`${seedId}: カートへ入れたあとの支店トップのカートの商品数が ${cart.商品数}（${合計} のはず）`);
    issue(`支店Aのカートへ${items.map((i) => `「${i.定義.商品名}」${i.数量}個`).join("・")}を入れた順に入れ、カートの商品数が ${合計} になったことを確かめた。このブラウザの状態（クッキー）をケースのブラウザへ移して使う（シード表の追加日時・セッション識別子のDBへの設定は、入れた順・クッキーの移しで代えた）`);
    opt.後で?.(made, issue, 支店AのID);
    カートのブラウザたち.set(seedId, cart);
    控える(seedId, notes, made, opt.割当);
  });
}

const Foilカード = (コード: string, 商品名: string): カートの商品["定義"] => ({ コード, 商品名, 価格: "2000", カード: { Foil: "通常" }, 在庫: 5 });
const サプライ = (コード: string, 商品名: string, 価格 = "1000", 在庫 = 5): カートの商品["定義"] => ({ コード, 商品名, 価格, 在庫 });

defineCartSeed("S-F02-03-CART-BASE", [
  { 定義: Foilカード("F0203-FOIL-READ", "試験Foilカード"), 数量: 2 },
  { 定義: サプライ("F0203-SUPPLY-READ", "試験サプライ"), 数量: 2 },
], { 割当: { 共有D: 0, 共有E: 1 } });
defineCartSeed("S-F02-03-CART-BASE-024", [
  { 定義: Foilカード("F0203-FOIL-024", "試験Foilカード-024"), 数量: 2 },
  { 定義: サプライ("F0203-SUPPLY-024", "試験サプライ-024"), 数量: 2 },
], { 割当: { "024A": 0, "024B": 1 } });
defineCartSeed("S-F02-03-CART-BASE-025", [{ 定義: Foilカード("F0203-FOIL-025", "試験Foilカード-025"), 数量: 2 }]);
defineCartSeed("S-F02-03-CART-BASE-028", [{ 定義: Foilカード("F0203-FOIL-028", "試験Foilカード-028"), 数量: 2 }]);
defineCartSeed("S-F02-03-CART-ONE", [{ 定義: サプライ("F0203-ONE", "数量下限商品"), 数量: 1 }]);
defineCartSeed("S-F02-03-CART-FULL", [{ 定義: サプライ("F0203-FULL", "在庫上限商品", "1000", 3), 数量: 3 }]);
defineCartSeed("S-F02-03-CART-BASE-051", [{ 定義: サプライ("F0203-SUPPLY-051", "試験サプライ-051"), 数量: 1 }]);
defineCartSeed("S-F02-03-CART-NOFOIL-054", [{ 定義: { コード: "F0203-NOFOIL-054", 商品名: "試験カード-054", 価格: "2000", カード: { Foil: "なし" }, 在庫: 5 }, 数量: 1 }]);
defineCartSeed("S-F02-03-CBCART-058", [{ 定義: サプライ("F0203-CB058-P", "カート商品F0203-CB058-A", "500"), 数量: 1 }]);
// 在庫なし商品は、先に在庫1を入れてカートへ入れ、そのあと在庫を0にする（正本: 出庫-1を承認）
defineCartSeed("S-F02-03-CART-MIX-053", [
  { 定義: サプライ("F0203-OOS-053", "在庫なし商品-053", "1000", 1), 数量: 1 },
  { 定義: サプライ("F0203-STOCK-053", "在庫あり商品-053"), 数量: 2 },
], { 割当: { "053A": 0, "053B": 1 }, 後で: (made, issue, 店舗ID) => 印つきの商品の在庫を0にする(made[0], 店舗ID, issue, "S-F02-03-CART-MIX-053") });

// ---- 共有のマスタ・設定へ足さず、既存のデータで代えるシード（作るものは無い） ----

/** 作らず、既存のデータで代える。シード表の呼び名は「作らなかった」と控える（シードの注記に理由を残す） */
function defineReadSeed(seedId: string, 理由: string): void {
  defineSeed(seedId, async ({ notes, seed }) => {
    for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) if (!notes.has(label)) notes.set(label, "（作らず、既存のデータで代えた）");
    reportSeedIssue(seed.シードID, 理由);
  });
}
defineReadSeed("S-F02-03-SEARCH", "カードセット（共有のマスタ）・検索対象の商品は登録せず、環境にある既存のカードセット・商品で代えた（外部の検索索引に画面で作った商品はすぐには出ないため）");
defineReadSeed("S-F02-03-UNISEARCH", "外部の検索索引（ユニサーチ）へ商品データを送る作業は行わず、すでに反映されている既存の商品で代えた");
defineReadSeed("S-F02-03-CATEGORY", "カテゴリは共有のマスタなので、最新セット・スタンダードなどの既存カテゴリへ試験用の子カテゴリを足さず、環境にある既存のカテゴリのツリーで代えた");
defineReadSeed("S-F02-03-CBBROWSER-059", "専用ブラウザプロファイルは作らず、ケースのブラウザの表示領域を幅390pxにして代えた（会員未ログイン・カートに商品なしはケースの新しいブラウザの状態）");
defineReadSeed("S-F02-03-CBBROWSER-060", "専用ブラウザプロファイルは作らず、ケースのブラウザで試験会員でログインし、表示領域を幅390pxにして代えた");

/**
 * 002 用: 支店A・Bに別の画像（branch-a.png・branch-b.png）を、E2E の店舗（A=4973・B=5006）へケースの間だけ上げ、終わりに元へ戻す（依頼者 2026-11-15）。
 * 画像を書き換えるので 002 は solo_cases.tsv の一人で流す回で流す。
 */
export async function 画像の支店を用意する(browser: import("@playwright/test").Browser): Promise<{ A: { 店名: string; 支店URL: string }; B: { 店名: string; 支店URL: string } }> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue("S-F02-03-STORE", m);
    await 店舗の画像と値をケースの間だけ設定する(page, "4973", path.join(FIXTURES, "branch-a.png"), {}, "支店Aの画像", issue);
    await 店舗の画像と値をケースの間だけ設定する(page, "5006", path.join(FIXTURES, "branch-b.png"), {}, "支店Bの画像", issue);
  });
  return { A: { 店名: 店名を読む("4973"), 支店URL: 支店URLを読む("4973") }, B: { 店名: 店名を読む("5006"), 支店URL: 支店URLを読む("5006") } };
}
