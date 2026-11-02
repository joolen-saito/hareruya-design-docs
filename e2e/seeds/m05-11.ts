/**
 * M05-11 受注情報編集のシード。正本: cases/M05-11_seed_data.tsv
 *
 * 作るのは、DBでの準備を含まないシードだけ。
 * 型（このファイルの tranche A）: フロントの会員登録で本会員を作り（本登録のメールは手元の受け口で読む）、その会員で
 * 「販売中の任意の商品」を銀行振込で注文し、受注一覧で注文番号を控える。
 *
 * シードでの解釈:
 * - 店舗A: シード表の店舗ID 20511 は画面から指定できない。フロントの注文が入るのは本店（親店舗）なので、本店を店舗Aとして使い、
 *   管理者の所属店舗・編集可能店舗にする（M04-19 と同じ）。
 * - 受注ステータス「新規受付」: 手元のDBでは同じ位置づけの名称が「注文受領」。受注情報編集画面に出る名称を、シードの作成時に確かめて報告に残す。
 * - 配送方法「宅配便」: 手元のDBに無い。出荷指示リストから除外されない配送方法の先頭を選ぶ（選んだ名称を報告に残す）。
 * - 会員のメールアドレスの前半は、実行ごとの印を付ける（依頼者決定 2026-10-28）。注文者姓などの値そのものを確かめる項目には付けない。
 */
import { SETUP_ADMIN } from "../config/env";
import { 受注 } from "../db/m05_11";
import { query } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";

/** 注文で選んだ配送方法など、問題ではない事実の記録（エビデンスの注記には出さないのでコンソールに残す） */
const note = (seedId: string, m: string): void => console.log(`[${seedId}] ${m}`);
import { Account, withAdminSession } from "../lib/session";
import { ensureMember, MemberInput } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { OrderEditPage, メールで受注を開く } from "../pages/admin/m05_11_order_edit";
import { 会員が注文する, 会員を用意する, 販売中の商品 } from "../pages/front/m05_11_order";
import { FrontMember } from "../pages/front/member_entry";

/** 店舗A編集管理者（シード表 S-M05-11-ADM-A のログインID・パスワード） */
export const M0511_ADMIN_A: Account = { loginId: "m0511_admin_a", password: "Passw0rd!M0511A" };
export const ADMIN_A_NAME = "M0511管理者A";
/** 本店（親店舗）の店舗ID。店舗Aとして使う */
const MAIN_SHOP_ID = "1";

let shopName: string | null = null;
export async function 店舗Aの店名(browser: import("@playwright/test").Browser): Promise<string> {
  if (!shopName) shopName = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, MAIN_SHOP_ID));
  return shopName;
}

defineSeed("S-M05-11-ENV", async ({ seed }) => {
  // 受注ステータス・支払方法が手元のDBにあることを確かめる（画面で登録するマスタではなく、参照だけ）
  const names = query(`select name from mtb_order_status`).map((r) => r.name);
  for (const want of ["入金済み", "ピック中", "店頭予約", "出荷完了", "キャンセル"]) {
    if (!names.includes(want)) throw new Error(`受注ステータスに「${want}」が無い（${names.join("、")}）`);
  }
  if (!names.includes("新規受付")) reportSeedIssue(seed.シードID, `受注ステータスに「新規受付」の名称が無い（手元のDBは「注文受領」「入金待ち」など）。銀行振込の購入直後の受注は「入金待ち」になるので、「新規受付」は「入金待ち」とみなした（シードでの解釈）`);
  if (!names.includes("引き渡し済み")) reportSeedIssue(seed.シードID, `受注ステータスに「引き渡し済み」の名称が無い（手元のDBでは「引渡し済み」）`);
  const ds = query(`select name from dtb_delivery`).map((r) => r.name);
  if (!ds.includes("宅配便")) reportSeedIssue(seed.シードID, `配送方法に「宅配便」が無い（${ds.join("、")}）。注文では出荷指示リストから除外されない配送方法の先頭を選ぶ`);
});

defineSeed("S-M05-11-ADM-A", { needs: ["S-M05-11-ENV"] }, async ({ browser }) => {
  const shop = await 店舗Aの店名(browser);
  const v: MemberInput = {
    名前: ADMIN_A_NAME, 所属店舗: shop, ログインID: M0511_ADMIN_A.loginId, メールアドレス: "m0511_admin_a@example.test",
    パスワード: M0511_ADMIN_A.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  };
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, v));
});

/** 試験会員（お名前「試験姓 試験名」・メールの前半に実行の印） */
export function 試験会員(正本のメール前半: string, 姓 = "試験姓", 名 = "試験名", ドメイン = "example.com", 住所3?: string): FrontMember {
  return { 姓, 名, セイ: "シケンセイ", メイ: "シケンメイ", メール: `${rc(正本のメール前半)}@${ドメイン}`, パスワード: "Passw0rd!M0511", 住所3 };
}

/**
 * 「会員を登録 → 販売中の任意の商品を数量nで注文 → 受注一覧で注文番号を控える」までのシード。
 * 「管理画面ではこの受注を更新しない」の確かめ（受注がステータスの新規受付・各日付が空）も行う。
 */
export function 購入直後のシード(seedId: string, 番号: string, メール前半: string, opt: { 商品数?: number; 数量?: number; 姓?: string; 住所3?: string; ドメイン?: string; 後処理?: (page: import("@playwright/test").Page, 注文番号: string, ctx: { m: FrontMember; notes: import("../lib/notes").Notes; 店: string }) => Promise<void> } = {}): void {
  defineSeed(seedId, { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
    const m = 試験会員(メール前半, opt.姓, undefined, opt.ドメイン, opt.住所3);
    await 会員を用意する(browser, m);
    const ids = 販売中の商品(opt.商品数 ?? 1);
    const r = await 会員が注文する(browser, m, ids.map((商品ID) => ({ 商品ID, 数量: opt.数量 ?? 1 })), seed.シードID);
    note(seed.シードID, `注文で選んだ配送方法: ${r.配送方法}`);
    const shop = await 店舗Aの店名(browser);
    const got = await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      const o = await メールで受注を開く(page, m.メール, shop, seed.シードID);
      const st = await new OrderEditPage(page).現在のステータス();
      return { ...o, st };
    });
    if (got.st !== "新規受付" && got.st !== "入金待ち") reportSeedIssue(seed.シードID, `購入直後の受注のステータスが「${got.st}」（シード表は「新規受付」）`);
    notes.set(`〔受注番号-M0511-${番号}〕`, got.注文番号);
    if (opt.後処理) await withAdminSession(browser, M0511_ADMIN_A, (page) => opt.後処理!(page, got.注文番号, { m, notes, 店: shop }).then(() => undefined));
    const row = 受注(got.注文番号);
    if (row.入金日 || row.注文確定日 || row.店頭予約日 || row.出荷日) reportSeedIssue(seed.シードID, `購入直後なのに入金日・注文確定日・店頭予約日・出荷日のどれかが入っている`);
  });
}

for (const n of ["014", "015", "016", "017", "018", "020", "028", "029", "045", "046"]) {
  購入直後のシード(`S-M05-11-BASE-${n}`, n, `m0511-${n}`, n === "014" ? { 商品数: 2 } : {});
}
購入直後のシード("S-M05-11-CANCEL-025", "025", "m0511-025");
購入直後のシード("S-M05-11-BASE-071", "071", "base-071");
