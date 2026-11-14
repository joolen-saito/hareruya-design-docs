/**
 * M05-23 出荷指示：納品書印刷（英語）の画面シード。正本: cases/M05-23_seed_data.tsv
 * 作り方は M05-22（seeds/m05-22.ts。日本語の納品書）と同じ。1つの作り方 作る() を、シードごとの定め（下の 定めの表）で動かす。
 * 1. 会員: ケースごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。
 * 2. 商品: グッズ商品CSV登録で作り、本店・EC-CUBE に入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コード・商品名に実行の印を付ける（ケースの文の同じ値も印つきで読む）。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて注文する。続けて注文する。
 * 4. 受注情報編集: 配送方法（既定は海外向けの International Express）・注文者・お届け先・送料・手数料・値引きを画面で入れて「受注情報を登録」を押す。
 * 5. 出荷指示リスト: 出荷指示リスト検索の生成欄で、注文番号の範囲で生成する。範囲に入るのが自分の受注だけであることを DB の参照で確かめてから生成する。
 * 6. DB での書き足し（E2E の行だけ。lib/db_write.ts を通す db/m05_09.ts・db/m05_10.ts・db/m05_22.ts の部品）:
 *    受注日時 2026-09-01 10:00（全シード）、注文者の都道府県・配送先の都道府県／国の未設定、明細の商品・商品規格の紐付けを外す、
 *    プレイヤーの会員からの切り離し、配送先を受注から外す、受注から会員を外す。どれも画面で指定できない値（シード表の投入方法どおり）。
 *    会員・配送先を外すと持ち主を確かめられないので、その受注の書き足しの最後にする。
 *
 * シードでの解釈（正本の外の補い。記録 review/M05-23_progress_2026-11-14_dev.md にも書く）:
 * - 配送方法「International Express」（海外向け）は開発環境の「EMS」（ID 8・海外配送）、「宅配便」（国内向け）は「ゆうパック」（ID 3）で読み替えた
 *   （配送方法のマスタは全員が使うので足さない・名前を書き換えない）。国「日本」は「Japan」。
 * - 出荷指示日（2026-09-02 10:00）は、受注に当たる欄が無く、納品書にも出ないので、生成した日時のまま（M05-22 と同じ）。
 * - 021 の「商品サブ情報」「商品規格サブ情報」に当たる表は、このアプリのデータベースに無い。「サブ情報なし明細」の2件は、
 *   商品・商品規格を持つ明細として作った（関連を外す相手が無い。M05-22 の 023 と同じ）。
 * - S-M05-23-BASEINFO（本店の適格請求書発行事業者登録番号）: シード表のとおり共有の開発環境では書き換えない。015 は今の登録番号のまま、
 *   その番号が納品書に出ないことを確かめる（spec の注記に残す）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  受注IDの, 受注の配送先ID, 受注の配送方法, 受注日時を書き足す, 注文者の都道府県を空にする, 配送先の項目を空にする,
  明細の商品規格を外す, 明細IDの, 会員のプレイヤーID, プレイヤーを会員から外す, 配送方法, 都道府県がある, 国がある, 登録番号,
} from "../db/m05_09";
import { 受注から会員を外す, 配送先を受注から外す } from "../db/m05_10";
import { 受注の出荷指示リスト, 注文番号の範囲の受注 } from "../db/m05_21";
import { サブ情報の表がある, 出荷指示の対応状況がある, 出荷指示リストから外れる配送方法か, 受注の対応状況名, 明細の商品を外す } from "../db/m05_22";
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

/** 開発環境に手動テスト用の同じログインIDのメンバーがありうるので、決まった印で1度だけ作って使い回す（M05-22 と同じ） */
export const M0523_ADMIN: Account = { loginId: rcFixed("m0523_admin").toLowerCase(), password: "Passw0rd!M0523" };
export const 受注日時 = "2026-09-01 10:00:00";
const PW = "Passw0rd!M0523C";
/** 「International Express」（海外向け）・「宅配便」（国内向け）の読み替え */
export const 国際配送 = "EMS";
export const 宅配便 = "ゆうパック";

defineSeed("S-M05-23-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M05-23管理者"), account: M0523_ADMIN, メール: `${M0523_ADMIN.loginId}@example.test` });
  reportSeedIssue("S-M05-23-ADM", "権限は受注管理・出荷指示リスト・納品書印刷を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に決まった印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M05-23-ENV", async () => {
  reportSeedIssue("S-M05-23-ENV", "ポップアップの許可は Playwright の新しい窓（popup）で受ける。開発者ツールでの送信内容の書き換え（005）は、画面の送信用のフォームに選んだ受注の入力を足して代える");
});

defineSeed("S-M05-23-MASTERS", async () => {
  const miss: string[] = [];
  const want: [number, string, boolean][] = [[3, 宅配便, false], [8, 国際配送, true]];
  for (const [id, name, abroad] of want) {
    const d = 配送方法(id);
    if (!d || d.名前 !== name || d.国外 !== abroad) miss.push(`配送方法ID ${id}「${name}」（${abroad ? "海外向け" : "国内向け"}）`);
  }
  for (const p of ["東京都", "千葉県", "神奈川県"]) if (!都道府県がある(p)) miss.push(`都道府県「${p}」`);
  for (const c of ["Japan"]) if (!国がある(c)) miss.push(`国「${c}」`);
  if (!出荷指示の対応状況がある()) miss.push("対応状況「出荷指示」");
  if (miss.length) throw new Error(`開発環境のマスタに ${miss.join("・")} が無い（マスタは共有なので書き換えない）`);
  for (const n of [国際配送, 宅配便]) {
    if (出荷指示リストから外れる配送方法か(n) !== false) throw new Error(`配送方法「${n}」が出荷指示リストの生成から外れる設定になっている（共有のマスタなので書き換えない）`);
  }
  reportSeedIssue("S-M05-23-MASTERS", `マスタは書き換えず、あることを DB の参照で確かめた。International Express＝${国際配送}（ID 8・海外向け）、宅配便＝${宅配便}（ID 3・国内向け）、`
    + "都道府県（東京都・千葉県・神奈川県）、国（Japan＝日本）、対応状況「出荷指示」。どちらの配送方法も出荷指示リストの生成から外れない");
});

defineSeed("S-M05-23-BASEINFO", async () => {
  reportSeedIssue("S-M05-23-BASEINFO", `本店の適格請求書発行事業者登録番号は全員が使う店舗基本設定。シード表のとおり共有の開発環境では書き換えない（T5230000000000 にしない）。`
    + `今の値（${登録番号() || "空"}）のまま、その番号が英語の納品書に出ないことを確かめる`);
});

defineSeed("S-M05-23-DOC-FIXED", async () => {
  reportSeedIssue("S-M05-23-DOC-FIXED", "英語の納品書の会社情報はアプリのテンプレートに固定（Hareruya Inc. ほか）。準備することは無い");
});

// ---- ケース専用のシード ----

type 明細の定め = { コード: string; 名前: string; 価格?: number; 数量?: number };
type 受注の定め = {
  明細: 明細の定め[];
  注文者?: 住所の入力; お届け先?: 住所の入力; 配送方法?: string;
  値引き?: string; 送料?: string; 手数料?: string;
  /** 会員を分ける（プレイヤーを会員から外す受注は、ほかの受注と同じ会員にしない） */
  別の会員?: boolean;
  /** DB で書き足すもの（画面で指定できない状態） */
  注文者の都道府県なし?: true; 配送先の都道府県なし?: true; 配送先の国なし?: true;
  商品規格なしの明細?: string; 商品なしの明細?: string; プレイヤーなし?: true;
  配送先なし?: true; 会員なし?: true;
};
type 定め = {
  受注: 受注の定め[];
  /** 受注ごとに別の出荷指示リストにする（005） */
  受注ごとのリスト?: boolean;
  /** 注文のあとで商品名を変える（018） */
  商品名の変更?: { コード: string; 名前: string };
};

const P = (番号: string, 価格 = 1000): 明細の定め[] => [{ コード: `M0523-${番号}-P1`, 名前: `M0523-${番号}-P1`, 価格 }];
const 二件 = (番号: string): 受注の定め[] => [{ 明細: P(`${番号}A`) }, { 明細: P(`${番号}B`) }];

const 定めの表: Record<string, 定め> = {
  "BASE-001": { 受注: 二件("001") },
  "BASE-002": { 受注: 二件("002") },
  "BASE-003": { 受注: 二件("003") },
  "EXTERNAL-005": { 受注: 二件("005"), 受注ごとのリスト: true },
  "RELATIONS-007": {
    受注: [
      { 明細: P("007A") }, { 明細: P("007B"), 会員なし: true }, { 明細: P("007C"), 別の会員: true, プレイヤーなし: true },
      { 明細: P("007D"), 配送先なし: true }, { 明細: P("007E"), 注文者の都道府県なし: true },
    ],
  },
  "RELATIONS-008": {
    受注: [
      { 明細: P("008A"), 会員なし: true }, { 明細: P("008B"), 別の会員: true, プレイヤーなし: true },
      { 明細: P("008C"), 配送先なし: true }, { 明細: P("008D"), 注文者の都道府県なし: true },
    ],
  },
  "NULL-ADDRESS-009": { 受注: [{ 明細: P("009"), 配送先の都道府県なし: true }] },
  "NULL-ADDRESS-010": { 受注: [{ 明細: P("010"), 配送先の国なし: true }] },
  "ADDRESS-012": { 受注: [{ 明細: P("012"), お届け先: { 国: "Japan", 都道府県: "東京都", 住所1: "配送先住所523" }, 注文者: { 国: "Japan", 都道府県: "東京都", 住所1: "注文者住所523" } }] },
  "RAW-VALUES-013": {
    受注: [{
      明細: [{ コード: "M0523-013-P1", 名前: "日本語商品名523" }],
      お届け先: { 国: "Japan", 都道府県: "東京都", 住所1: "東京都新宿区未翻訳町523" }, 注文者: { 国: "Japan", 都道府県: "東京都", 住所1: "東京都新宿区未翻訳町523" },
    }],
  },
  "COMPANY-014": {
    受注: [
      { 明細: [{ コード: "M0523-014A-P1", 名前: "会社比較商品A", 価格: 1000 }], 注文者: { 姓: "青木", 名: "一郎" }, お届け先: { 国: "Japan", 都道府県: "千葉県" } },
      { 明細: [{ コード: "M0523-014B-P1", 名前: "会社比較商品B", 価格: 2500 }], 注文者: { 姓: "井上", 名: "二郎" }, お届け先: { 国: "Japan", 都道府県: "神奈川県" } },
    ],
  },
  "OMISSION-015": { 受注: [{ 明細: P("015", 10857), 送料: "0", 手数料: "0", 値引き: "0" }] },
  "AMOUNTS-016": { 受注: [{ 明細: P("016", 12345), 送料: "1234", 手数料: "56", 値引き: "1234" }] },
  "AMOUNTS-017": { 受注: [{ 明細: P("017", 1000), 送料: "0", 手数料: "0", 値引き: "0" }] },
  "SNAPSHOT-018": { 受注: [{ 明細: [{ コード: "M0523-018-P1", 名前: "Ordered Product 523" }] }], 商品名の変更: { コード: "M0523-018-P1", 名前: "Renamed Product 523" } },
  "BASE-019": { 受注: [{ 明細: P("019") }] },
  "CBDETAILS-021": {
    受注: [{
      明細: [
        { コード: "M0523-021-OK", 名前: "VALID-ITEM-021" },
        { コード: "M0523-021-NOPRD", 名前: "NO-PRODUCT-021" },
        { コード: "M0523-021-NOCLS", 名前: "NO-PRODUCT-CLASS-021" },
        { コード: "M0523-021-NOSUB", 名前: "NO-PRODUCT-SUB-021" },
        { コード: "M0523-021-NOCSUB", 名前: "NO-PRODUCT-CLASS-SUB-021" },
      ],
      商品なしの明細: "M0523-021-NOPRD", 商品規格なしの明細: "M0523-021-NOCLS",
    }],
  },
  "CBDOMESTIC-022": { 受注: [{ 明細: P("022A"), 配送方法: 宅配便 }, { 明細: P("022B") }] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string[]; 受注ID: string[]; 注文番号: string[]; 出荷指示リストID: string[]; 商品名: Record<string, string> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
export const 会員の前半 = (番号: string, i = 0) => `m0523-${番号}${i > 0 ? "-b" : ""}`;
export const 会員のメール = (番号: string, i = 0) => markedMail(会員の前半(番号, i));

async function 生成する(browser: Browser, seedId: string, 注文番号: string[], 持ち主: string[]): Promise<void> {
  const from = 注文番号[0], to = 注文番号[注文番号.length - 1];
  if (注文番号.length > 1 && Number(to) !== Number(from) + 注文番号.length - 1) {
    throw new Error(`${seedId}: 続けて注文した受注の注文番号 ${注文番号.join("・")} が連続していない（間にほかの方の注文が入った）。範囲で生成するとほかの方の受注を巻き込むので止める`);
  }
  const 範囲 = 注文番号の範囲の受注(from, to);
  const 自分 = new Set(注文番号);
  const 他 = 範囲.filter((r) => !自分.has(r.注文番号) || !持ち主.includes(r.メール));
  if (他.length > 0 || 範囲.length !== 注文番号.length) throw new Error(`${seedId}: 注文番号 ${from}〜${to} の範囲に自分の受注以外が入っている。生成すると巻き込むので止める`);
  await withAdminSession(browser, M0523_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (注文番号.length === 1) await 出荷指示リストを生成する(page, from, seedId);
    else await 範囲で出荷指示リストを生成する(page, from, to, seedId);
  });
}

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";

  // 1. 会員（「別の会員」の受注は2人目）
  const メール: string[] = [];
  const 会員の数 = d.受注.some((o) => o.別の会員) ? 2 : 1;
  for (let i = 0; i < 会員の数; i++) {
    await 本会員を作る(browser, { 姓: "出荷指示英語納品書", 名: `${番号}${"ABC"[i]}`, セイ: "シュッカシジエイゴノウヒンショ", メイ: "カイイン", 前半: 会員の前半(番号, i), パスワード: PW });
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
  for (const [i, o] of d.受注.entries()) {
    const m = メール[o.別の会員 ? 1 : 0];
    const n = await 会員が商品を注文する(browser, { メール: m, パスワード: PW }, o.明細.map((x) => ({ 商品ID: 商品ID.get(x.コード)!, 数量: x.数量 ?? 1 })), `${seedId}: ${i + 1}件目の受注`);
    注文番号.push(n); 受注ID.push(受注IDの(n, m)); 持ち主.push(m);
  }

  // 4. 受注情報編集（配送方法・シード表の値）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, o] of d.受注.entries()) {
      const 今の配送 = 受注の配送方法(受注ID[i]);
      const 配送 = o.配送方法 ?? 国際配送;
      const 変える = 今の配送.some((x) => x !== 配送) || o.注文者 || o.お届け先 || o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined;
      if (!変える) continue;
      await 受注情報編集を開く(page, 受注ID[i]);
      if (今の配送.some((x) => x !== 配送)) {
        await 配送方法を選ぶ(page, 配送);
        await page.waitForTimeout(1500);
        issue(`${注文番号[i]}: 注文で選ばれた配送方法（${今の配送.join("・")}）を、受注情報編集で${配送}にした`);
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

  // 商品名を変える（018）
  if (d.商品名の変更) {
    const ch = d.商品名の変更;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 商品名を変える(page, 商品ID.get(ch.コード)!, rc(ch.名前), issue); });
  }

  // 5. 出荷指示リスト（範囲に入るのが自分の受注だけかを確かめてから生成する）
  const リスト: string[] = [];
  const 組 = d.受注ごとのリスト ? d.受注.map((_, i) => [i]) : [d.受注.map((_, i) => i)];
  for (const g of 組) {
    await 生成する(browser, seedId, g.map((i) => 注文番号[i]), g.map((i) => 持ち主[i]));
    const per = g.map((i) => 受注の出荷指示リスト(受注ID[i]));
    if (per.some((x) => x.length !== 1) || new Set(per.map((x) => x[0])).size !== 1) throw new Error(`${seedId}: 生成した出荷指示リストに受注がそろって入っていない`);
    リスト.push(per[0][0]);
  }
  for (const id of 受注ID) {
    const st = 受注の対応状況名(id);
    if (st !== "出荷指示") throw new Error(`${seedId}: 生成のあとの受注ID ${id} の対応状況が「${st}」（「出荷指示」のはず）`);
  }

  // 6. DB での書き足し（E2E の行だけ。会員・配送先を外すのは、その受注の最後）
  const 書いた: string[] = [];
  for (const [i, o] of d.受注.entries()) {
    受注日時を書き足す(seedId, [受注ID[i]], 持ち主[i], 受注日時);
    if (o.注文者の都道府県なし) { 注文者の都道府県を空にする(seedId, 受注ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の注文者の都道府県を未設定`); }
    if (o.配送先の都道府県なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "都道府県"); 書いた.push(`${注文番号[i]} の配送先の都道府県を未設定`); }
    if (o.配送先の国なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "国"); 書いた.push(`${注文番号[i]} の配送先の国を未設定`); }
    for (const [コード, 外す, 何] of [[o.商品なしの明細, 明細の商品を外す, "商品"], [o.商品規格なしの明細, 明細の商品規格を外す, "商品規格"]] as const) {
      if (!コード) continue;
      const ids = 明細IDの(受注ID[i], rc(コード));
      if (ids.length !== 1) throw new Error(`${seedId}: ${rc(コード)} の明細が ${ids.length} 件（1件のはず）`);
      外す(seedId, ids, 持ち主[i]); 書いた.push(`${コード} の明細の${何}の紐付けを外した`);
    }
    if (o.プレイヤーなし) {
      const ps = 会員のプレイヤーID(持ち主[i]);
      if (ps.length !== 1) throw new Error(`${seedId}: 会員 ${持ち主[i]} のプレイヤーが ${ps.length} 件（1件のはず）`);
      プレイヤーを会員から外す(seedId, ps, 持ち主[i]); 書いた.push(`${注文番号[i]} の会員からプレイヤーを外した`);
    }
    if (o.配送先なし) { 配送先を受注から外す(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i]); 書いた.push(`${注文番号[i]} の配送先を受注から外した`); }
    if (o.会員なし) { 受注から会員を外す(seedId, 受注ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の受注から会員を外した（ゲスト受注）`); }
  }
  issue(`DB で書き足した（E2E の行だけ）: 受注 ${受注ID.join("・")} の受注日時を ${受注日時}${書いた.length ? `・${書いた.join("・")}` : ""}`);
  if (seedId.endsWith("-021")) {
    const s = サブ情報の表がある();
    issue(`商品サブ情報・商品規格サブ情報に当たる表は、このアプリのデータベースに${s.商品 || s.商品規格 ? "ある（関連は外していない）" : "無い"}。「サブ情報なし」の2明細は、商品・商品規格を持つ明細として作った（正本の外の補い）`);
  }

  作った.set(seedId, { 会員メール: メール, 受注ID, 注文番号, 出荷指示リストID: リスト, 商品名: Object.fromEntries(明細の一覧.map((x) => [x.コード, rc(x.名前)])) });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number, n: number) => (n > 1 ? "ABCDE"[i] : "");
  const v: Record<string, string> = {};
  注文番号.forEach((n, i) => { v[`〔注文番号-M0523-${番号}${文字(i, 注文番号.length)}〕`] = n; });
  受注ID.forEach((n, i) => { v[`〔受注ID-M0523-${番号}${文字(i, 受注ID.length)}〕`] = n; });
  リスト.forEach((n, i) => { v[`〔出荷指示リストID-M0523-${番号}${文字(i, リスト.length)}〕`] = n; });
  if (d.商品名の変更) v[`〔商品ID-M0523-${番号}〕`] = 商品ID.get(d.商品名の変更.コード)!;
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-23-${k}`;
  defineSeed(seedId, { needs: ["S-M05-23-ADM"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}

/** この実行の印（spec が注記に使う） */
export const 実行の印 = RUN_MARK;
