/**
 * M05-09 納品書印刷（日本語）の画面シード。正本: cases/M05-09_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。1つの作り方 作る() を、シードごとの定め（下の 定めの表）で動かす）:
 * 1. 会員: ケースごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印。会員とプレイヤーが同時に作られる）。
 *    受注情報検索を会員のメールアドレスで絞ると、そのケースの受注だけが出る（事前準備の「受注情報検索ではこの受注だけを表示できる」）。
 * 2. 商品: グッズ商品CSV登録で作り、本店・EC-CUBE に入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コード・商品名に実行の印を付ける（ケースの文の同じ値も印つきで読む）。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて、出荷指示リストから除外されない配送方法・外部の決済へ移らない支払方法で注文する
 *    （pages/front/m05_front_order.ts の 会員が商品を注文する）。配送方法がゆうパックでなければ、受注情報編集でゆうパックにする。
 * 4. 受注情報編集: シード表が定める注文者・お届け先・配送方法・値引き・送料・手数料・明細の価格を画面で入れて「受注情報を登録」を押す。
 * 5. 出荷指示リスト（002・010・016）: M05-21 と同じく、範囲に入るのが自分の受注だけであることを DB の参照で確かめてから生成する。
 * 6. DB での書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。db/m05_09.ts）: 受注日時 2026-09-29 10:00:00（全シード）、
 *    出荷指示リストの生成で「出荷指示」に変わった対応状況を「注文受領」へ戻す、注文者・配送先の都道府県／国の未設定、明細の商品規格の紐付けを外す、
 *    プレイヤーのスマレジ会員ID、プレイヤーの会員からの切り離し。どれも画面で指定できない値で、試験会員の受注・プレイヤーだけに書く。
 *
 * シードでの解釈（記録にも書く）:
 * - 受注状態「注文受付」は、開発環境の対応状況の名前「注文受領」（ID 1）。都道府県「海外」は「日本国外」（ID 48）、国「日本」は「Japan」。
 * - 019 の注文者の都道府県「大阪府」: 会員は既定の住所（東京都）で登録し、受注情報編集で注文者の都道府県を大阪府にした（受注の状態は同じ）。
 * - 受注の作成で会員の住所・電話・氏名はシード表が値を定めないので、登録できる任意の値（会員登録の部品の既定）。
 * - S-M05-09-DELIVERY（配送方法・都道府県・国のマスタ）: マスタは全員が使うので書き換えず、使う値があることを DB の参照で確かめるだけ。
 * - S-M05-09-BASEINFO（本店の適格請求書発行事業者登録番号）: 全員が使う店舗基本設定。023 のケースの開始時に spec が書き換え、終わるたびに元の値へ戻す。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  受注IDの, 受注の配送先ID, 受注の配送方法, 受注の対応状況を書き足す, 受注日時を書き足す, 注文者の都道府県を空にする, 配送先の項目を空にする,
  明細の商品規格を外す, 明細IDの, 会員のプレイヤーID, プレイヤーのスマレジIDを書き足す, プレイヤーを会員から外す, 配送方法, 都道府県がある, 国がある, 登録番号, 出荷指示リストがある,
} from "../db/m05_09";
import { 受注の出荷指示リスト, 注文番号の範囲の受注 } from "../db/m05_21";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 出荷指示リストを生成する } from "../pages/admin/m05_20_standby";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { 範囲で出荷指示リストを生成する } from "../pages/admin/m05_21_picking";
import { 住所の入力, 住所を入れる, 受注情報編集を開く, 商品名を変える, 配送方法を選ぶ } from "../pages/admin/m05_09_delivery_slips";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0509_ADMIN: Account = { loginId: rcFixed("m0509_admin").toLowerCase(), password: "Passw0rd!M0509" };
export const 受注日時 = "2026-09-29 10:00:00";
const PW = "Passw0rd!M0509C";

defineSeed("S-M05-09-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M05-09管理者"), account: M0509_ADMIN, メール: `${M0509_ADMIN.loginId}@example.test` });
  reportSeedIssue("S-M05-09-ADM", "権限は受注管理を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M05-09-DELIVERY", async () => {
  const miss: string[] = [];
  const want: [number, string, boolean][] = [[3, "ゆうパック", false], [7, "スムーズ店頭受取", false], [8, "EMS", true]];
  for (const [id, name, abroad] of want) {
    const d = 配送方法(id);
    if (!d || d.名前 !== name || d.国外 !== abroad) miss.push(`配送方法ID ${id}「${name}」（${abroad ? "海外配送" : "国内配送"}）`);
  }
  for (const p of ["東京都", "大阪府", "日本国外"]) if (!都道府県がある(p)) miss.push(`都道府県「${p}」`);
  for (const c of ["Japan", "United States", "Canada"]) if (!国がある(c)) miss.push(`国「${c}」`);
  if (miss.length) throw new Error(`開発環境のマスタに ${miss.join("・")} が無い（マスタは共有なので書き換えない）`);
  reportSeedIssue("S-M05-09-DELIVERY", "マスタは書き換えず、配送方法ID 3・7・8、都道府県（東京都・大阪府・日本国外＝海外）、国（Japan＝日本・United States・Canada）があることを DB の参照で確かめた");
});

defineSeed("S-M05-09-BASEINFO", async () => {
  reportSeedIssue("S-M05-09-BASEINFO", `本店の適格請求書発行事業者登録番号は全員が使う店舗基本設定。ケースの開始時に書き換え、終わるたびに元の値（${登録番号() || "空"}）へ戻す`);
});

// ---- ケース専用のシード ----

type 明細の定め = { コード: string; 名前: string; 価格?: number; 数量?: number };
type 受注の定め = {
  明細: 明細の定め[];
  注文者?: 住所の入力; お届け先?: 住所の入力; 配送方法?: string;
  値引き?: string; 送料?: string; 手数料?: string;
  /** 会員を分ける（008 の A・B は別の会員） */
  別の会員?: boolean;
  /** DB で書き足すもの（画面で指定できない状態） */
  注文者の都道府県なし?: true; 配送先の都道府県なし?: true; 配送先の国なし?: true;
  商品規格なしの明細?: string; スマレジ会員ID?: string; プレイヤーなし?: true;
};
type 定め = {
  受注: 受注の定め[];
  出荷指示リスト?: boolean;
  /** 注文のあとで商品名を変える（025） */
  商品名の変更?: { コード: string; 名前: string };
};

const P = (番号: string, n = 1, 価格 = 1000): 明細の定め[] => Array.from({ length: n }, (_, i) => {
  const s = n > 1 ? `-P${String(i + 1).padStart(2, "0")}` : "-P1";
  return { コード: `M0509-${番号}${s}`, 名前: `M0509-${番号}${s}`, 価格 };
});
const ゆうパック = "ゆうパック";

const 定めの表: Record<string, 定め> = {
  "STANDBY-002": { 受注: [{ 明細: P("002A") }, { 明細: P("002B") }], 出荷指示リスト: true },
  "CLASSIFICATION-003": { 受注: [{ 明細: P("003"), 注文者: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" }, お届け先: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" } }] },
  "CLASSIFICATION-004": { 受注: [{ 明細: P("004A") }, { 明細: P("004B"), 配送方法: "EMS" }] },
  "CUSTOMERS-007": { 受注: [{ 明細: P("007"), スマレジ会員ID: "SMR-50907-007" }] },
  "CUSTOMERS-008": { 受注: [{ 明細: P("008A"), スマレジ会員ID: "SMR-50907-008" }, { 明細: P("008B"), 別の会員: true, プレイヤーなし: true }] },
  "RELATIONS-010": { 受注: [{ 明細: P("010A") }, { 明細: P("010B"), 注文者の都道府県なし: true }], 出荷指示リスト: true },
  "NULL-ADDRESS-012": { 受注: [{ 明細: P("012"), 配送先の都道府県なし: true }] },
  "NULL-ADDRESS-013": { 受注: [{ 明細: P("013"), 配送先の国なし: true }] },
  "STANDBY-016": { 受注: [{ 明細: P("016") }], 出荷指示リスト: true },
  "ADDRESSES-018": { 受注: [{ 明細: P("018"), お届け先: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" }, 注文者: { 国: "Canada", 都道府県: "日本国外", 海外郵便番号: "A1B2C3" } }] },
  "ADDRESSES-019": { 受注: [{ 明細: P("019"), お届け先: { 国: "Japan", 都道府県: "東京都" }, 注文者: { 国: "Japan", 都道府県: "大阪府" } }] },
  "SIGNATURE-020": { 受注: [{ 明細: P("020"), 配送方法: "スムーズ店頭受取" }] },
  "SIGNATURE-021": { 受注: [{ 明細: P("021") }] },
  "COMPANY-023": { 受注: [{ 明細: P("023") }] },
  "POINTS-024": { 受注: [{ 明細: P("024A"), 値引き: "250" }, { 明細: P("024B"), 値引き: "0" }] },
  "PRODUCT-SNAPSHOT-025": { 受注: [{ 明細: [{ コード: "M0509-025-P1", 名前: "受注時商品名" }] }], 商品名の変更: { コード: "M0509-025-P1", 名前: "変更後商品名" } },
  "PAGE30-026": { 受注: [{ 明細: P("026", 30) }] },
  "PAGE31-027": { 受注: [{ 明細: P("027", 31) }] },
  "TAX-028": { 受注: [{ 明細: P("028"), 送料: "0", 手数料: "100", 値引き: "0" }] },
  "ADDR-SHIPTO-041": { 受注: [{ 明細: P("041"), 注文者: { 住所1: "大阪市北区梅田4-5-6", 住所2: "M0509-041-タワー9F", 電話: ["06", "9876", "5432"], 姓: "佐藤", 名: "花子" }, お届け先: { 住所1: "渋谷区道玄坂1-2-3", 住所2: "M0509-041-ビル5F", 電話: ["03", "1234", "5678"], 姓: "山田", 名: "太郎" } }] },
  "ADDR-SENDER-042": { 受注: [{ 明細: P("042"), 注文者: { 住所1: "大阪市北区梅田4-5-6", 住所2: "M0509-042-タワー9F", 電話: ["06", "9876", "5432"], 姓: "佐藤", 名: "花子" }, お届け先: { 住所1: "渋谷区道玄坂1-2-3", 住所2: "M0509-042-ビル5F", 電話: ["03", "1234", "5678"], 姓: "山田", 名: "太郎" } }] },
  "CBBASE-046": { 受注: [{ 明細: [{ コード: "M0509-CB046-P1", 名前: "M0509-CB046-P1" }] }] },
  "CBLINE-047": { 受注: [{ 明細: [{ コード: "M0509-CB047-OK", 名前: "M0509-CB047-OK" }, { コード: "M0509-CB047-NG", 名前: "M0509-CB047-NG" }], 商品規格なしの明細: "M0509-CB047-NG" }] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string[]; 受注ID: string[]; 注文番号: string[]; 出荷指示リストID: string; 商品名: Record<string, string> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
/** ケースの会員（受注情報検索を絞るメールアドレス。008 は A の会員） */
export const 会員の前半 = (番号: string, i = 0) => `m0509-${番号}${i > 0 ? "-b" : ""}`;
export const 会員のメール = (番号: string, i = 0) => markedMail(会員の前半(番号, i));

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";

  // 1. 会員（受注ごとに「別の会員」でなければ同じ会員）
  const メール: string[] = [];
  const 会員の数 = d.受注.some((o) => o.別の会員) ? 2 : 1;
  for (let i = 0; i < 会員の数; i++) {
    await 本会員を作る(browser, { 姓: "納品書試験", 名: `${番号}${"ABC"[i]}`, セイ: "ノウヒンショシケン", メイ: "カイイン", 前半: 会員の前半(番号, i), パスワード: PW });
    メール.push(会員のメール(番号, i));
  }

  // 2. 商品
  const 明細の一覧 = d.受注.flatMap((o) => o.明細);
  const made = await 商品を作って入庫する(browser, seedId, 明細の一覧.map((x) => ({
    商品コード: rc(x.コード), 商品名: rc(x.名前), 価格: String(x.価格 ?? 1000), 入庫数: (x.数量 ?? 1) + 2,
  })), issue);
  const 商品ID = new Map(made.map((m, i) => [明細の一覧[i].コード, m.productId]));

  // 3. 受注（続けて注文する）
  const 注文番号: string[] = [];
  const 受注ID: string[] = [];
  const 持ち主: string[] = [];
  let 会員i = 0;
  for (const [i, o] of d.受注.entries()) {
    if (o.別の会員) 会員i = 1;
    const m = メール[会員i];
    const n = await 会員が商品を注文する(browser, { メール: m, パスワード: PW }, o.明細.map((x) => ({ 商品ID: 商品ID.get(x.コード)!, 数量: x.数量 ?? 1 })), `${seedId}: ${i + 1}件目の受注`);
    注文番号.push(n); 受注ID.push(受注IDの(n, m)); 持ち主.push(m);
  }

  // 4. 受注情報編集（配送方法がゆうパックでなければゆうパックにする。シード表の値を入れる）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, o] of d.受注.entries()) {
      const 今の配送 = 受注の配送方法(受注ID[i]);
      const 配送 = o.配送方法 ?? ゆうパック;
      const 変える = 今の配送.some((x) => x !== 配送) || o.注文者 || o.お届け先 || o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined;
      if (!変える) continue;
      await 受注情報編集を開く(page, 受注ID[i]);
      if (今の配送.some((x) => x !== 配送)) {
        await 配送方法を選ぶ(page, 配送);
        await page.waitForTimeout(1500);
        if (o.配送方法 === undefined) issue(`${注文番号[i]}: 注文で選ばれた配送方法（${今の配送.join("・")}）を、受注情報編集でゆうパックにした`);
      }
      if (o.注文者) await 住所を入れる(page, "注文者", o.注文者);
      if (o.お届け先) await 住所を入れる(page, "お届け先", o.お届け先);
      if (o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined) await new OrderItemsEdit(page).金額欄({ 値引き: o.値引き, 送料: o.送料, 手数料: o.手数料 });
      const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号[i]}: 受注情報の登録の確認「${m}」`));
      for (const w of warnings) issue(`${注文番号[i]}: 受注情報の登録の警告「${w}」`);
      const now = 受注の配送方法(受注ID[i]);
      if (now.some((x) => x !== 配送)) throw new Error(`${seedId}: ${注文番号[i]} の配送方法が ${now.join("・")}（${配送} のはず）`);
    }
  });

  // 商品名を変える（025）
  if (d.商品名の変更) {
    const ch = d.商品名の変更;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 商品名を変える(page, 商品ID.get(ch.コード)!, rc(ch.名前), issue); });
  }

  // 5. 出荷指示リスト（範囲に入るのが自分の受注だけかを確かめてから生成する）
  let リスト = "";
  if (seedId.endsWith("-016") && 出荷指示リストがある("999999")) throw new Error(`${seedId}: 出荷指示リストID 999999 が登録されている（正本は未登録）`);
  if (d.出荷指示リスト) {
    const from = 注文番号[0], to = 注文番号[注文番号.length - 1];
    if (注文番号.length > 1 && Number(to) !== Number(from) + 注文番号.length - 1) {
      throw new Error(`${seedId}: 続けて注文した受注の注文番号 ${注文番号.join("・")} が連続していない（間にほかの方の注文が入った）。範囲で生成するとほかの方の受注を巻き込むので止める`);
    }
    const 範囲 = 注文番号の範囲の受注(from, to);
    const 自分 = new Set(注文番号);
    const 他 = 範囲.filter((r) => !自分.has(r.注文番号) || !持ち主.includes(r.メール));
    if (他.length > 0 || 範囲.length !== 注文番号.length) throw new Error(`${seedId}: 注文番号 ${from}〜${to} の範囲に自分の受注以外が入っている。生成すると巻き込むので止める`);
    await withAdminSession(browser, M0509_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      if (注文番号.length === 1) await 出荷指示リストを生成する(page, from, seedId);
      else await 範囲で出荷指示リストを生成する(page, from, to, seedId);
    });
    const per = 受注ID.map((id) => 受注の出荷指示リスト(id));
    if (per.some((x) => x.length !== 1) || new Set(per.map((x) => x[0])).size !== 1) throw new Error(`${seedId}: 生成した出荷指示リストに受注がそろって入っていない`);
    リスト = per[0][0];
  }

  // 6. DB での書き足し（E2E の行だけ）
  const 書いた: string[] = [];
  for (const [i, o] of d.受注.entries()) {
    受注日時を書き足す(seedId, [受注ID[i]], 持ち主[i], 受注日時);
    if (d.出荷指示リスト) 受注の対応状況を書き足す(seedId, [受注ID[i]], 持ち主[i], "注文受領");
    if (o.注文者の都道府県なし) { 注文者の都道府県を空にする(seedId, 受注ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の注文者の都道府県を未設定`); }
    if (o.配送先の都道府県なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "都道府県"); 書いた.push(`${注文番号[i]} の配送先の都道府県を未設定`); }
    if (o.配送先の国なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "国"); 書いた.push(`${注文番号[i]} の配送先の国を未設定`); }
    if (o.商品規格なしの明細) {
      const ids = 明細IDの(受注ID[i], rc(o.商品規格なしの明細));
      if (ids.length !== 1) throw new Error(`${seedId}: ${rc(o.商品規格なしの明細)} の明細が ${ids.length} 件（1件のはず）`);
      明細の商品規格を外す(seedId, ids, 持ち主[i]); 書いた.push(`${o.商品規格なしの明細} の明細の商品規格の紐付けを外した`);
    }
    if (o.スマレジ会員ID || o.プレイヤーなし) {
      const ps = 会員のプレイヤーID(持ち主[i]);
      if (ps.length !== 1) throw new Error(`${seedId}: 会員 ${持ち主[i]} のプレイヤーが ${ps.length} 件（1件のはず）`);
      if (o.スマレジ会員ID) { プレイヤーのスマレジIDを書き足す(seedId, ps, 持ち主[i], o.スマレジ会員ID); 書いた.push(`会員のプレイヤーのスマレジ会員IDを ${o.スマレジ会員ID}`); }
      if (o.プレイヤーなし) { プレイヤーを会員から外す(seedId, ps, 持ち主[i]); 書いた.push(`${注文番号[i]} の会員からプレイヤーを外した`); }
    }
  }
  issue(`DB で書き足した（E2E の行だけ）: 受注 ${受注ID.join("・")} の受注日時を ${受注日時}${d.出荷指示リスト ? "・対応状況を「注文受領」へ戻した" : ""}${書いた.length ? `・${書いた.join("・")}` : ""}`);

  作った.set(seedId, { 会員メール: メール, 受注ID, 注文番号, 出荷指示リストID: リスト, 商品名: Object.fromEntries(明細の一覧.map((x) => [x.コード, rc(x.名前)])) });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number, n: number) => (n > 1 ? "ABC"[i] : "");
  const cb = seedId.includes("-CB") ? "CB" : "";
  const v: Record<string, string> = {};
  注文番号.forEach((n, i) => { v[`〔注文番号-M0509-${cb}${番号}${文字(i, 注文番号.length)}〕`] = n; });
  if (リスト) v[`〔出荷指示リストID-M0509-${番号}〕`] = リスト;
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-09-${k}`;
  defineSeed(seedId, { needs: ["S-M05-09-ADM"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}

/** この実行の印（spec が注記に使う） */
export const 実行の印 = RUN_MARK;
