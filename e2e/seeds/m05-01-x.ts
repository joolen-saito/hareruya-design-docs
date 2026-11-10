/**
 * M05-01 受注情報検索 一覧の続き（-x）の画面シード。実施不可の見直し（review/not_runnable_seed_recheck.tsv）で流せる見込みになったもののうち、
 * 検索のまとめ方が期待結果に関わらないケース（029・031・033・044・061・073・076・077・168・171・176・177）が使うもの。正本: cases/M05-01_seed_data.tsv
 *
 * 作り方（シード表の流れ）: 会員を作る → グッズ商品をCSVで登録し入庫・承認 → フロントで会員が購入（件数ぶん）→ 管理画面で対応状況・金額を整える。
 *
 * シードでの解釈（記録 review/M05-01_progress_2026-11-10_dev.md にも書く）:
 * - 注文番号: 正本は「M0501-CSV-029-A」などをDBで設定すると定めるが、注文番号は購入時に画面が振り、管理画面でも書き換えられない。
 *   画面が振った番号を控えて使う（類型T4）。シード表が呼び名を定めるもの（044）は呼び名で、ほかはこのファイルの中だけで持ち回す。
 * - 店舗A: シード表に店舗の用意が無い。フロントで購入した受注は本店の受注になるので、店舗A＝本店（店舗ID 1）と読み替える（M05-11 と同じ）。
 *   既存の S-M05-01-ADM（試験店舗A・B と M05-01試験管理者を作る）は使用シードなので作るが、そのデフォルト検索表示店舗は試験店舗A（M05-01）なので、
 *   ケースのログインには、本店をデフォルト検索表示店舗・編集可能店舗にした「M05-01試験管理者（本店）」を使う（正本の外の補い）。
 * - 会員: シード表は管理画面の会員登録と定めるが、管理画面に会員の新規登録の画面が無いので、フロントの会員登録で作る（本登録のメールを読む）。
 *   メールの前半に実行の印。商品コード・商品名にも実行の印。
 * - 商品の入庫: F04 の部品（在庫変更CSV登録＋別のメンバーの承認）。登録者・承認者は F04 の試験管理者（シード表の M05-01試験管理者の代わり）。
 * - 支払方法: シード表は「銀行振込以外」。開発環境で表示中の 郵便振替・代金引換・現金書留 を順に試す。購入直後の対応状況が注文受領でなければ、受注情報編集で注文受領にする。
 * - 044 の初回・最終購入日時（2026-07-01 10:00:00）・購入回数1・購入金額100 は画面で指定できない（購入した時点の値になる）。購入とキャンセルで実際に入った値を注記に残す。
 * - 177 の「入金済み・出荷日あり」は、対応状況を出荷完了にして出荷日を入れたあと入金済みへ戻して作る。出荷日は実施日（正本は 2026-09-15 12:00:00）。
 *   作れたかを DB の参照で確かめ、作れなければ止める。
 * - S-M05-01-PERPAGE（表示件数のマスタ）は共有の設定なので書き換えない。開発環境のマスタが正本の9つ（10〜12000）であることを DB の参照で確かめるだけ。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注の状態, 受注の店舗ID, 表示件数のマスタ } from "../db/m05_01_x";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { OrderEditPage, OrderItemsEdit, 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { OrderSearchPage } from "../pages/admin/m05_01_order_search";
import { 会員が注文する, 会員を用意する } from "../pages/front/m05_11_order";
import { FrontMember } from "../pages/front/member_entry";
import "./m05-01"; // S-M05-01-ADM の作り方

export const M0501HQ_ADMIN: Account = { loginId: "m0501_hq_admin", password: "Passw0rd!M0501HQ" };
const HQ_ADMIN_NAME = "M05-01試験管理者（本店）";
const 支払候補 = ["郵便振替", "代金引換", "現金書留"];

let mainShop: string | null = null;
/** 本店（店舗ID 1）の店名。店舗Aとして使う */
export async function 店舗Aの店名(browser: Browser): Promise<string> {
  if (!mainShop) mainShop = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, "1"));
  return mainShop;
}

let adminReady = false;
/** 本店をデフォルト検索表示店舗・編集可能店舗にした M05-01 の試験管理者を、この実行で一度だけ用意する（あれば内容を確かめて使う） */
export async function 本店の管理者を用意する(browser: Browser): Promise<void> {
  if (adminReady) return;
  const shop = await 店舗Aの店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: HQ_ADMIN_NAME, 所属店舗: shop, ログインID: M0501HQ_ADMIN.loginId, メールアドレス: `${M0501HQ_ADMIN.loginId}@example.test`,
      パスワード: M0501HQ_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  adminReady = true;
}

export type 作った受注 = { 注文番号: string[]; メール: string; 会員ID: string };
const made = new Map<string, 作った受注>();
/** シードが作った受注（作った順の注文番号・会員のメール・会員ID） */
export function 受注の(seedId: string): 作った受注 {
  const m = made.get(seedId);
  if (!m) throw new Error(`${seedId} の受注をまだ作っていない`);
  return m;
}

type 受注の定め = {
  /** ケースの番号（メール・商品コードに使う） */
  番号: string; 件数: number;
  /** 作った順の受注ごとに、注文受領にしたあと変える対応状況（順に変える） */
  状態?: (string[] | undefined)[];
  /** 作った順の受注ごとのお支払合計（明細の価格を合計に合わせ、送料・手数料・値引きを0にする） */
  合計?: (number | undefined)[];
  /** メールの前半（既定は m0501-<番号>-buyer） */
  メール前半?: string;
  /** 商品名（既定は M0501試験商品<番号>） */
  商品名?: string;
  /** 受注を作ったあとの処理 */
  後で?: (browser: Browser, seedId: string, r: 作った受注) => Promise<void>;
};

/** 会員→商品と入庫→購入（件数ぶん）→注文受領にそろえる→対応状況・金額を整える */
function 受注のシード(seedId: string, d: 受注の定め, 呼び名?: { 会員ID?: string; 注文番号?: string[] }): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 本店の管理者を用意する(browser);
    const shop = await 店舗Aの店名(browser);
    const m: FrontMember = { 姓: "試験", 名: `購入者${d.番号}`, セイ: "シケン", メイ: "コウニュウシャ", メール: `${rc(d.メール前半 ?? `m0501-${d.番号}-buyer`)}@example.test`, パスワード: "Passw0rd!M0501" };
    await 会員を用意する(browser, m);
    const code = rc(`M0501-ITEM-${d.番号}`);
    const [p] = await 商品を作って入庫する(browser, seedId, [{ 商品コード: code, 商品名: rc(d.商品名 ?? `M0501試験商品${d.番号}`), 価格: "100", 入庫数: 100 }], issue);
    const nos: string[] = [];
    for (let i = 0; i < d.件数; i++) {
      const r = await 会員が注文する(browser, m, [{ 商品ID: p.productId, 数量: 1 }], `${seedId}: ${i + 1}件目の購入`, { 支払候補 });
      if (i === 0) issue(`購入の配送方法は「${r.配送方法}」、支払方法は「${r.支払方法}」`);
      nos.push(r.注文番号);
      const 店舗ID = 受注の店舗ID(r.注文番号);
      if (店舗ID !== "1") throw new Error(`${seedId}: ${i + 1}件目（${r.注文番号}）が本店（店舗A）の受注にならない（店舗ID ${店舗ID || "読めない"}）`);
    }
    const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (let i = 0; i < nos.length; i++) {
        const e = new OrderEditPage(page);
        await e.openByOrderNo(nos[i], shop);
        if ((await e.現在のステータス()) !== "注文受領") {
          issue(`${i + 1}件目（${nos[i]}）は購入直後の対応状況が「${await e.現在のステータス()}」だったので、注文受領にした`);
          await e.ステータスを選ぶ("注文受領"); await e.ステータスを変更する(() => undefined);
        }
        const total = d.合計?.[i];
        if (total !== undefined) {
          await e.openByOrderNo(nos[i], shop);
          const items = new OrderItemsEdit(page);
          await items.明細に入れる(code, { 価格: String(total), 数量: "1" });
          await items.金額欄({ 送料: "0", 手数料: "0", 値引き: "0" });
          await e.受注情報を登録する(() => undefined);
        }
        for (const st of d.状態?.[i] ?? []) {
          await e.openByOrderNo(nos[i], shop);
          await e.ステータスを選ぶ(st); await e.ステータスを変更する(() => undefined);
        }
      }
    });
    const r: 作った受注 = { 注文番号: nos, メール: m.メール, 会員ID };
    made.set(seedId, r);
    if (呼び名?.会員ID) notes.set(呼び名.会員ID, 会員ID);
    呼び名?.注文番号?.forEach((k, i) => notes.set(k, nos[i]));
    if (d.後で) await d.後で(browser, seedId, r);
  });
}

// ---- 受注を選ばずに一括の操作を押す（3受注） ----
受注のシード("S-M05-01-CSV-029", { 番号: "029", 件数: 3 });
受注のシード("S-M05-01-CSV-031", { 番号: "031", 件数: 3 });
受注のシード("S-M05-01-CSV-033", { 番号: "033", 件数: 3 });

// ---- 最後の集計対象の受注を削除する（044） ----
受注のシード("S-M05-01-DEL-LAST-044", { 番号: "044", 件数: 2, 合計: [100, 9000], 状態: [undefined, ["キャンセル"]] },
  { 会員ID: "〔会員ID-M0501-044〕", 注文番号: ["〔注文番号-M0501-044A〕", "〔注文番号-M0501-044B〕"] });

// ---- 検索パターンの該当件数欄の「*」（061） ----
受注のシード("S-M05-01-PATSTAR-061", {
  番号: "061", 件数: 2,
  後で: async (_browser, seedId, r) => {
    await withAdminSession(_browser, M0501HQ_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      // 正本の条件「注文番号 M0501-061」は2受注の共通の先頭だが、画面の番号では共通の先頭が作れない。1件目の注文番号を条件にする（正本の外の補い）
      await p.savePattern({ 注文番号: r.注文番号[0], パターン名: rc("M0501-061-PAT") });
    });
    reportSeedIssue(seedId, `検索パターン「${rc("M0501-061-PAT")}」の条件は、2受注の共通の先頭の代わりに1件目の注文番号 ${r.注文番号[0]} にした`);
  },
});

// ---- 画面の開き直し・表示件数・クリア（073・076・077） ----
受注のシード("S-M05-01-INITVIEW-073", { 番号: "073", 件数: 3 });
受注のシード("S-M05-01-PERPAGEOPT-076", { 番号: "076", 件数: 1 });
受注のシード("S-M05-01-CLEAR-077", { 番号: "077", 件数: 1 });

// ---- 店舗・対応状況の組合せ（168・171）と警告の表示（176・177） ----
受注のシード("S-M05-01-CBALLPLUSOK-168", { 番号: "168", 件数: 1, メール前半: "cbm0501-168-buyer", 商品名: "M0501-CB168試験商品A" });
受注のシード("S-M05-01-CBALLCANCELONLY-171", { 番号: "171", 件数: 1, メール前半: "cbm0501-171-buyer", 商品名: "M0501-CB171試験商品A", 状態: [["キャンセル"]] });
受注のシード("S-M05-01-CBWARNNONE-176", { 番号: "176", 件数: 1, メール前半: "cbm0501-176-buyer", 商品名: "M0501-CB176試験商品A" });
受注のシード("S-M05-01-CBWARNDATEONLY-177", {
  番号: "177", 件数: 1, メール前半: "cbm0501-177-buyer", 商品名: "M0501-CB177試験商品A", 状態: [["出荷完了", "入金済み"]],
  後で: async (_browser, seedId, r) => {
    const s = 受注の状態(r.注文番号[0]);
    if (s.対応状況 !== "入金済み" || !s.出荷日 || s.キャンセル日) {
      throw new Error(`${seedId}: 「入金済み・出荷日あり・キャンセル日なし」の受注を画面で作れない（実際: 対応状況=${s.対応状況}・出荷日=${s.出荷日 ?? "なし"}・キャンセル日=${s.キャンセル日 ?? "なし"}）`);
    }
    reportSeedIssue(seedId, `出荷完了にしてから入金済みへ戻し、出荷日 ${s.出荷日}（正本は 2026-09-15 12:00:00）・キャンセル日なしの入金済みの受注を作った`);
  },
});

// ---- 表示件数のマスタ（共有の設定。書き換えずに確かめる） ----
const 表示件数 = ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"];
defineSeed("S-M05-01-PERPAGE", async ({ seed }) => {
  const now = 表示件数のマスタ();
  if (JSON.stringify(now) !== JSON.stringify(表示件数)) {
    throw new Error(`表示件数のマスタが正本の ${表示件数.join("・")} でない（${now.join("・")}）。共有の設定なので書き換えない`);
  }
  reportSeedIssue(seed.シードID, "表示件数のマスタは共有の設定なので書き換えず、開発環境の値が正本の9つ（10〜12000）であることをDBの参照で確かめた");
});
export { 表示件数 };
