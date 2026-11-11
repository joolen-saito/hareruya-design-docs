/**
 * M05-07 送り状CSV出力の画面シード。正本: cases/M05-07_seed_data.tsv
 * 作り方は M05-10・M05-22（seeds/m05-10.ts・seeds/m05-22.ts）と同じ。
 * 1. 会員: ケースごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。
 * 2. 商品: グッズ商品CSV登録で作り、本店・EC-CUBE に入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コード・商品名に実行の印を付ける（M0507-001-ITEM → 印つき）。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて注文する（pages/front/m05_front_order.ts の 会員が商品を注文する）。
 * 4. 受注情報編集: シード表の注文者・お届け先・会社名・注文コメント・送り状No.・送料・手数料・値引きを画面で入れて「受注情報を登録」を押す。
 * 5. DB での書き足し（E2E の行だけ。db/m05_09.ts・db/m05_07_24.ts）: 対応状況「注文受領」（注文の支払方法によっては入金待ちなどになるため）、
 *    注文確定日・出荷指示日・出荷日（007）、出荷指示日・出荷日の未設定と更新日時（005）。どれも画面で指定できない値。更新日時は最後に書く。
 *
 * シードでの解釈（正本の外の補い。記録 review/M05-07_progress_2026-11-11_dev.md にも書く）:
 * - 003 の注文者会社「M0507-003-CO」は、前の実行の受注と重ならないよう実行の印を付けた（ケースの文の同じ値も印つきで読む）。
 *   ほかのケースの会社名・注文コメント・送り状No.・氏名などは、注文番号で絞った自分の受注の行だけを見るので印を付けない。
 * - 注文金額合計（004 の 4100・005 の 1500）は、商品の価格と送料・手数料からアプリが計算する。シード表の値になるよう商品の価格を決め、
 *   違えば記録に残す（期待結果は DB の同じ受注の値と見比べる）。
 * - 店舗「本店」は店舗ID 1（営業中）。対応状況「注文受領」はマスタにあるものを使う（S-M05-07-REF。書き換えない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 受注IDの, 受注の対応状況を書き足す, 受注の配送方法 } from "../db/m05_09";
import { 受注の値, 受注の日時, 受注の日時を書き足す } from "../db/m05_07_24";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureMember } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { 住所の入力, 住所を入れる, 受注情報編集を開く } from "../pages/admin/m05_09_delivery_slips";
import { 受注の追加の項目, 受注の追加の項目を入れる } from "../pages/admin/m05_07_24_csv";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0507_ADMIN: Account = { loginId: rcFixed("m0507admin").toLowerCase(), password: "Passw0rd!M0507" };
const PW = "Passw0rd!M0507C";

defineSeed("S-M05-07-ADM", async ({ browser, notes, seed }) => {
  const shop = await 本店の店名(browser);
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureMember(page, {
      名前: rcFixed("M05-07試験管理者"), 所属店舗: shop, ログインID: M0507_ADMIN.loginId, メールアドレス: `${M0507_ADMIN.loginId}@example.test`,
      パスワード: M0507_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  notes.set("〔管理者ID-M0507-共有〕", id);
  reportSeedIssue(seed.シードID, "権限は受注管理を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M05-07-REF", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗「本店」（店舗ID 1）と対応状況「注文受領」は開発環境に既にあるものを使った（マスタは共有なので書き換えない）");
});

// ---- ケース専用のシード ----

type 受注の定め = {
  価格?: number; 注文者?: 住所の入力; お届け先?: 住所の入力; 追加?: 受注の追加の項目;
  送料?: string; 手数料?: string; 値引き?: string;
  /** DB で書き足す日時（画面で指定できない） */
  日時?: 受注の日時;
};
type 定め = { 受注: 受注の定め[] };

const 定めの表: Record<string, 定め> = {
  "ORD-001": { 受注: [{ 追加: { 送り状No: "M0507-001-TRK", お届け先の会社名: "M0507-001-SCO" } }] },
  "ORD-002": { 受注: [{ 追加: { 注文者の会社名: "M0507-002-CO", 注文コメント: "M0507-002-MSG", 送り状No: "M0507-002-TRK", お届け先の会社名: "M0507-002-SCO" } }] },
  "ORD-003": { 受注: [0, 1, 2].map(() => ({ 追加: { 注文者の会社名: rc("M0507-003-CO") } })) },
  "ORD-004": { 受注: [{ 価格: 3000, 送料: "800", 手数料: "200", 値引き: "0" }] },
  "ORD-005": { 受注: [{ 価格: 1500, 送料: "0", 手数料: "0", 値引き: "0", 日時: { 出荷指示日: null, 出荷日: null } }] },
  "ORD-006": {
    受注: [{
      注文者: { 姓: "M0507-006-SEI", 名: "M0507-006-MEI", 都道府県: "愛知県", 住所1: "M0507-006-ADR1", 住所2: "M0507-006-ADR2", 住所3: "M0507-006-ADR3", 電話: ["050", "7000", "006"] },
      追加: { 注文者のフリガナ: ["ヨミセイロク", "ヨミメイロク"], 注文者の郵便番号: "5070006" },
    }],
  },
  "ORD-007": { 受注: [{ 日時: { 注文確定日: "2026-03-01 10:00:00", 出荷指示日: "2026-03-02 11:00:00", 出荷日: "2026-03-03 12:00:00" } }] },
  "ORD-008": {
    受注: [{
      お届け先: { 姓: "M0507-008-SEI", 名: "M0507-008-MEI", 都道府県: "大阪府", 住所1: "M0507-008-ADR1", 住所2: "M0507-008-ADR2", 住所3: "M0507-008-ADR3", 電話: ["050", "7000", "009"] },
      追加: { お届け先のフリガナ: ["ハイソウセイキュウ", "ハイソウメイキュウ"], お届け先の郵便番号: "5400009" },
    }],
  },
};
/** 005 の更新日時（シード表）。受注の書き足しの最後に書く */
const 更新日時_005 = "2026-03-01 10:00:00";

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string; 受注ID: string[]; 注文番号: string[] };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
export const 会員の前半 = (番号: string) => `m0507-${番号}`;

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-07-${k}`;
  defineSeed(seedId, { needs: ["S-M05-07-ADM", "S-M05-07-REF"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 番号 = k.slice(-3);
    // 1. 会員
    await 本会員を作る(browser, { 姓: "送り状", 名: `会員${番号}`, セイ: "オクリジョウ", メイ: "カイイン", 前半: 会員の前半(番号), パスワード: PW });
    const メール = markedMail(会員の前半(番号));
    // 2. 商品（受注ごとに数量1。入庫は余裕を持たせる）
    const [made] = await 商品を作って入庫する(browser, seedId, [{
      商品コード: rc(`M0507-${番号}-ITEM`), 商品名: rc(`M0507-${番号}-ITEM`), 価格: String(d.受注[0].価格 ?? 1000), 入庫数: d.受注.length + 2,
    }], issue);
    // 3. 受注（続けて注文する）
    const 注文番号: string[] = [];
    const 受注ID: string[] = [];
    for (const [i] of d.受注.entries()) {
      const n = await 会員が商品を注文する(browser, { メール, パスワード: PW }, [{ 商品ID: made.productId, 数量: 1 }], `${seedId}: ${i + 1}件目の受注`);
      注文番号.push(n); 受注ID.push(受注IDの(n, メール));
    }
    // 4. 受注情報編集
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const [i, o] of d.受注.entries()) {
        if (!o.注文者 && !o.お届け先 && !o.追加 && o.送料 === undefined && o.手数料 === undefined && o.値引き === undefined) continue;
        await 受注情報編集を開く(page, 受注ID[i]);
        if (o.注文者) await 住所を入れる(page, "注文者", o.注文者);
        if (o.お届け先) await 住所を入れる(page, "お届け先", o.お届け先);
        if (o.追加) await 受注の追加の項目を入れる(page, o.追加);
        if (o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined) await new OrderItemsEdit(page).金額欄({ 値引き: o.値引き, 送料: o.送料, 手数料: o.手数料 });
        const before = 受注の配送方法(受注ID[i]);
        const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号[i]}: 受注情報の登録の確認「${m}」`));
        for (const w of warnings) issue(`${注文番号[i]}: 受注情報の登録の警告「${w}」`);
        if (受注の配送方法(受注ID[i]).join("・") !== before.join("・")) throw new Error(`${seedId}: ${注文番号[i]} の配送方法が受注情報の登録で変わった`);
      }
    });
    // 5. DB での書き足し（E2E の行だけ。更新日時は最後）
    const 書いた: string[] = [];
    for (const [i, o] of d.受注.entries()) {
      const st = 受注の値(受注ID[i]).対応状況;
      if (st !== "注文受領") { 受注の対応状況を書き足す(seedId, [受注ID[i]], メール, "注文受領"); 書いた.push(`${注文番号[i]} の対応状況を「${st}」から「注文受領」`); }
      if (o.日時) { 受注の日時を書き足す(seedId, 受注ID[i], メール, o.日時); 書いた.push(`${注文番号[i]} の ${Object.entries(o.日時).map(([a, b]) => `${a}=${b ?? "未設定"}`).join("・")}`); }
    }
    if (k === "ORD-005") { 受注の日時を書き足す(seedId, 受注ID[0], メール, { 更新日時: 更新日時_005 }); 書いた.push(`${注文番号[0]} の更新日時=${更新日時_005}`); }
    if (書いた.length) issue(`DB で書き足した（E2E の行だけ）: ${書いた.join("・")}`);
    for (const [i, o] of d.受注.entries()) {
      if (o.価格 === undefined) continue;
      const v = 受注の値(受注ID[i]);
      issue(`${注文番号[i]} の金額（アプリの計算）: 注文金額合計 ${v.注文金額合計}・商品金額合計 ${v.商品金額合計}・送料 ${v.送料}・手数料 ${v.手数料}`);
    }

    作った.set(seedId, { 会員メール: メール, 受注ID, 注文番号 });
    // 呼び名を控える（シード表の文に出る呼び名だけ）
    const v: Record<string, string> = {};
    注文番号.forEach((n, i) => { v[`〔注文番号-M0507-${番号}${注文番号.length > 1 ? "ABC"[i] : ""}〕`] = n; });
    const seed = getSeed(seedId);
    for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
      notes.set(label, v[label]);
    }
  });
}
