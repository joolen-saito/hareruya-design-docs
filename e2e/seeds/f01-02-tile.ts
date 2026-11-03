/**
 * F01-02 支店ECTOP のシード（タイル・商品が要るもの）。正本: cases/F01-02_seed_data.tsv
 * 支店と管理者2人を作り、タイルのタグをタグ管理で作り、グッズ商品CSVで商品を作ってタグを付け、支店の在庫を入庫・承認し、
 * 支店トップページ管理で上段右にそのタグのタイル（属性「その他」）・残り3区画にピックアップ商品を設定する。
 * タグの名称・商品コード・商品名は決め打ちの識別の値なので、実行ごとの印を付ける（rc）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureTenant } from "../pages/admin/tenant";
import { createTopByCsv } from "../pages/admin/category";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { タグを付けて商品を登録する, タグを用意する, 支店トップページにタイルを設定する, 支店の管理者を用意する, 管理者, 規格の高額商品コードを設定する, 規格のセールを設定する, 規格を追加する, 規格を削除する, 追加する規格 } from "../pages/admin/f01_02_setup";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { 在庫承認の最大ID } from "../db/f03_08";
import { 支店URL, 支店名 } from "./f01-02";

const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };

/** 取込で作られる規格（言語日本語・状態NM）に足す規格。コードは「<商品コード><suffix>」 */

/** 支店を登録する。店名略称（3文字）が、ほかの店舗と重なって登録できなかったら、略称を変えて作り直す（略称は正本の指定が無い任意の値） */
async function 支店を用意する(page: import("@playwright/test").Page, n: string, issue: (m: string) => void): Promise<string> {
  let last = "";
  for (let salt = 0; salt < 6; salt++) {
    try {
      return await ensureTenant(page, {
        店名: 支店名(n), 店名カナ: "シケンシテン", 店名英語: "Branch Shop", 支店URL: 支店URL(n), 店名略称3文字: 略称(`${支店URL(n)}${salt || ""}`), ショップ名略称: 支店名(n),
      }, issue);
    } catch (e) {
      last = (e as Error).message;
      if (!/略称/.test(last)) throw e;
      issue(`店名略称が重なって登録できなかったので、略称を変えて登録し直した（${last.split("\n")[0]}）`);
    }
  }
  throw new Error(`店名略称を変えても支店を登録できない: ${last}`);
}

export type 足す規格 = { suffix: string; 言語: "日本語" | "英語"; 状態: "NM" | "SP" | "MP" | "HP"; 価格: string; 在庫?: number; セール?: boolean };
export type タイル商品 = {
  suffix: string; name: string;
  支店公開?: boolean; 在庫?: number; 価格?: string; 高額コード?: string; タグ付け?: boolean;
  /** 取込の規格（NM）のセールフラグ（SALE中の商品の用） */
  セール?: boolean;
  足す規格?: 足す規格[];
  /** 規格を足したあとで、取込の規格（NM）を削除する */
  取込規格を削除?: boolean;
  /** 在庫の承認のあとで、商品の公開状態を変える（本店の公開状態） */
  承認後の状態?: "非公開" | "廃止";
};
export const タイル商品コード = (n: string, suffix: string): string => rc(`F0102-${n}${suffix}`);
export const タイルのタグ名 = (正本の名称: string): string => rc(正本の名称);

const SALE_TAG_ID = "8"; // 「固定のセールタグ」: 手元のDBでは名称「sale1(未使用)」のタグ（アプリがセールに使うタグ）
async function タイルの支店を作る(browser: Browser, seedId: string, n: string, タグ正本名: string | null, defs: タイル商品[], notes: { set(k: string, v: string): void }, 投入方法: string): Promise<void> {
  const 定め = new Set([...投入方法.matchAll(/〔[^〕]+〕/g)].map((m) => m[0]));
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const url = 支店URL(n);
  const 本店名 = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, "1"));
  const 支店ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, n, issue));
  notes.set(`〔支店ID-F0102-${n.replace(/^CB/, "")}〕`, 支店ID);
  const 管: { 登録者: 管理者; 承認者: 管理者 } = await withAdminSession(browser, SETUP_ADMIN, (page) => 支店の管理者を用意する(page, n, RUN_MARK, 支店名(n), 本店名));
  const タグ名 = タグ正本名 ? タイルのタグ名(タグ正本名) : "";
  const タグID = タグ正本名 ? await withAdminSession(browser, SETUP_ADMIN, (page) => タグを用意する(page, タグ名, seedId)) : SALE_TAG_ID;
  /** 在庫を入れる規格（商品コードと数量） */
  const 入庫: { code: string; 数量: number }[] = [];
  const ids = new Map<string, { productId: string; classId: string }>();
  /** 足した規格の商品規格ID（キー: <商品のsuffix>|<足したsuffix>、どちらも先頭の「-」を除く） */
  const 足した規格ID = new Map<string, string>();
  const 正規 = (x: string): string => x.replace(/^-/, "");
  await withAdminSession(browser, 管.登録者.account, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: defs.map((d) => {
        const p = d.価格 ?? "500";
        return {
          code: タイル商品コード(n, d.suffix), nameJp: rc(d.name), nameEn: rc(d.name), branchStatus: d.支店公開 === false ? "非公開" : "公開",
          values: { "基準価格": p, "販売価格": p, "買取価格": p === "0" ? "0" : "1", "原価単価": p === "0" ? "0" : "1" },
        };
      }),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = タイル商品コード(n, d.suffix);
      const productId = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1) throw new Error(`${seedId}: ${code} の取込直後の商品規格が1件でない`);
      await タグを付けて商品を登録する(page, productId, d.タグ付け === false ? null : タグID, null, `${seedId}: ${code}`, issue);
      if (d.高額コード) await 規格の高額商品コードを設定する(page, productId, rows[0].商品規格ID, rc(d.高額コード), `${seedId}: ${code} の高額商品コード`, issue);
      ids.set(code, { productId, classId: rows[0].商品規格ID });
      if (d.セール) await 規格のセールを設定する(page, productId, rows[0].商品規格ID, { フラグ: true, 販売価格: d.価格 ?? "500" }, `${seedId}: ${code} のセール`, issue);
      if ((d.在庫 ?? 1) > 0 && !d.取込規格を削除) 入庫.push({ code, 数量: d.在庫 ?? 1 });
      for (const r of d.足す規格 ?? []) {
        const v: 追加する規格 = { 言語: r.言語, 状態: r.状態, 商品コード: `${code}${r.suffix}`, 基準価格: r.価格, 販売価格: r.価格, 買取価格: r.価格 === "0" ? "0" : String(Math.max(1, Math.floor(Number(r.価格) / 5))), セール: r.セール };
        足した規格ID.set(`${正規(d.suffix)}|${正規(r.suffix)}`, await 規格を追加する(page, productId, v, `${seedId}: ${v.商品コード}`, issue));
        if ((r.在庫 ?? 1) > 0) 入庫.push({ code: v.商品コード, 数量: r.在庫 ?? 1 });
      }
      if (d.取込規格を削除) await 規格を削除する(page, productId, rows[0].商品規格ID, `${seedId}: ${code} の取込の規格`, issue);
    }
    const 入れる = 入庫;
    const baseline = 在庫承認の最大ID();
    for (const d of 入れる) {
      const code = d.code;
      const stock = await searchStockByCode(page, { 商品コード: code, 店舗: 支店名(n), 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(code, 支店名(n), "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F01-02試験データ", quantity: String(d.数量), purchasePrice: "1", approverName: 管.承認者.名前 }, `${seedId}: ${code} の在庫編集`, issue);
    }
    if (入れる.length) {
      await withAdminSession(browser, 管.承認者.account, async (ap) => {
        const list = new StockApprovalListPage(ap);
        await list.open(支店名(n));
        const registrant = await loggedInMemberName(page);
        const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline);
        if (rows.length < 入れる.length) throw new Error(`${seedId}: 在庫編集の未承認の行が ${rows.length} 件（${入れる.length} 件のはず）`);
        try {
          await list.approve(rows.slice(0, 入れる.length).map((r) => r.id), `${seedId}: 在庫編集の承認`, issue);
        } catch (e) {
          // 承認の成功の表示が出なかったとき、承認の一覧で承認済みになったかを確かめる（なっていれば先へ進み、報告する）
          const ids = rows.slice(0, 入れる.length).map((r) => r.id);
          await list.open(支店名(n));
          const after = (await list.rowValues()).filter((r) => ids.includes(r.id));
          if (after.some((r) => r.status === "未承認")) {
            throw new Error(`${(e as Error).message.split("\n")[0]}（承認の一覧で未承認のまま: ${after.map((r) => `${r.id}:${r.status}`).join(",")}）`);
          }
          issue(`在庫編集の承認で、成功の表示は出なかったが、承認の一覧から未承認の行が無くなっていた（${(e as Error).message.split("\n")[0]}）`);
        }
      });
    }
    for (const d of defs.filter((x) => x.承認後の状態)) {
      await タグを付けて商品を登録する(page, ids.get(タイル商品コード(n, d.suffix))!.productId, null, d.承認後の状態!, `${seedId}: ${タイル商品コード(n, d.suffix)} を${d.承認後の状態}に`, issue);
    }
    // シード表が「控える」と定めた呼び名だけを控える（番号が画面に出ないタイル・トップページ設定は、設定した場所を文で控える）
    const 数字 = n.replace(/^CB/, "");
    for (const label of 定め) {
      let m = /^〔商品ID-F0102-(\d+)(.*)〕$/.exec(label);
      if (m && m[1] === 数字) {
        const d = defs.find((x) => 正規(x.suffix) === 正規(m![2]));
        if (d) notes.set(label, ids.get(タイル商品コード(n, d.suffix))!.productId);
        continue;
      }
      m = /^〔商品規格ID-F0102-(\d+)(.*)〕$/.exec(label);
      if (m && m[1] === 数字) {
        const rest = 正規(m[2]);
        const base = defs.find((x) => 正規(x.suffix) === rest) ?? (rest === "A" ? defs.find((x) => x.suffix === "") : undefined);
        const extra = defs.map((x) => 足した規格ID.get(`${正規(x.suffix)}|${rest}`)).find((x) => x);
        const id = base ? ids.get(タイル商品コード(n, base.suffix))!.classId : extra;
        if (id) notes.set(label, id);
        continue;
      }
      if (/^〔(タイルID|トップページ設定ID)-/.test(label)) notes.set(label, `支店ID ${支店ID} の支店トップページ管理で登録したタイル（番号は画面に出ない）`);
    }
  });
  if (タグ正本名) await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページにタイルを設定する(page, 支店名(n), タグ名, seedId, issue));
}

const 商品 = (suffix: string, name: string, 他: Partial<タイル商品> = {}): タイル商品 => ({ suffix, name, ...他 });
const 四つ = ["01", "02", "03", "04"].map((nn) => 商品(`-${nn}`, `F0102-044商品${nn}`, { 価格: "1" }));
const SP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "日本語", 状態: "SP", 価格, 在庫 });
const MP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "日本語", 状態: "MP", 価格, 在庫 });
const 英NM = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "英語", 状態: "NM", 価格, 在庫 });

/** n＝支店・商品コードの組み立てに使う番号（シードIDの末尾とは別）。タグが null のものは「SALE中の商品」の用（アプリがセールに使うタグ） */
export const タイルの定め: Record<string, { シードID: string; タグ: string | null; 商品: タイル商品[] }> = {
  "035": { シードID: "S-F01-02-CASE-035", タグ: "テストタイルA", 商品: [商品("", "テストタイル商品-035")] },
  "036": { シードID: "S-F01-02-CASE-036", タグ: "テストタイルA-036", 商品: [商品("A", "タイル公開商品", { 価格: "1" }), 商品("B", "タイル非公開商品", { 価格: "1", 支店公開: false })] },
  "037": { シードID: "S-F01-02-CASE-037", タグ: "テストタイルA-037", 商品: [商品("A", "タイル在庫1商品", { 価格: "1" }), 商品("B", "タイル在庫0商品", { 価格: "1", 在庫: 0 })] },
  "039": { シードID: "S-F01-02-CASE-039", タグ: "テストタイルA", 商品: [商品("A", "タイルNM価格1円商品", { 価格: "1" }), 商品("B", "タイルNM価格0円商品", { 価格: "0" })] },
  "040": { シードID: "S-F01-02-CASE-040", タグ: "テストタイルA", 商品: [商品("A", "タイル非NM価格100円商品", { 価格: "1", 在庫: 0, 足す規格: [SP("-A", "100", 1)] }), 商品("B", "タイル非NM価格99円商品", { 価格: "1", 在庫: 0, 足す規格: [SP("-B", "99", 1)] })] },
  "041": { シードID: "S-F01-02-CASE-041", タグ: "テストタイルA", 商品: [商品("A", "タイル高額コードなし商品", { 価格: "1" }), 商品("B", "タイル高額コードあり商品", { 価格: "1", 高額コード: "F0102-HIGH-041" })] },
  "042": { シードID: "S-F01-02-CASE-042", タグ: "テストタイルA", 商品: [商品("", "タイル優先順位商品-042", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "300"), 英NM("-C", "700"), MP("-D", "200")] })] },
  "043": { シードID: "S-F01-02-CASE-043", タグ: "テストタイルA-043", 商品: [商品("A", "タイルNM基準あり商品", { 価格: "1", 在庫: 0, 足す規格: [SP("-A", "100", 1)] }), 商品("B", "タイルNM基準なし商品", { 価格: "100", 取込規格を削除: true, 足す規格: [SP("-B", "100", 1)] })] },
  "044": { シードID: "S-F01-02-CASE-044", タグ: "上限確認タイル-044", 商品: 四つ },
  "049": { シードID: "S-F01-02-CASE-049", タグ: "テストタイルA-049", 商品: [商品("", "タイル画像なし商品", { 価格: "1" })] },
  "052": { シードID: "S-F01-02-CASE-052", タグ: "テストタイルA-052", 商品: [商品("", "テストタイル商品-052")] },
  "054": { シードID: "S-F01-02-CASE-054", タグ: "テストタイルA-054", 商品: [商品("", "週間販売なしタイル商品-054")] },
  "055": { シードID: "S-F01-02-CASE-055", タグ: "テストタイルA-055", 商品: [商品("A", "F0102-055商品A"), 商品("B", "F0102-055商品B", { タグ付け: false })] },
  "087": { シードID: "S-F01-02-TILENONCARD-087", タグ: "テストタイルF0102-087", 商品: [商品("", "タイル非カード商品F0102-087", { 価格: "500", 在庫: 3 })] },
  "CB097": { シードID: "S-F01-02-CBTILEA-097", タグ: "タイルF0102-CB097", 商品: [商品("-A", "タイル商品F0102-CB097", { 価格: "800" })] },
  "CB100": { シードID: "S-F01-02-CBTILED-100", タグ: "タイルF0102-CB100", 商品: [商品("-A", "タイル商品F0102-CB100", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "300"), 英NM("-C", "700")] })] },
  "CB101": { シードID: "S-F01-02-CBTILEE-101", タグ: "タイルF0102-CB101", 商品: [商品("-A", "タイル商品F0102-CB101", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "300"), MP("-C", "200")] })] },
  "CB102": { シードID: "S-F01-02-CBTILEF-102", タグ: "タイルF0102-CB102", 商品: [商品("-A", "タイル在庫価格不足商品F0102-CB102", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "99"), MP("-C", "300")] })] },
  "CB104": { シードID: "S-F01-02-CBTILEH-104", タグ: "タイルF0102-CB104", 商品: [商品("-A", "タイル商品F0102-CB104", { 価格: "500", 在庫: 3, 足す規格: [英NM("-B", "700")] })] },
  "CB105": { シードID: "S-F01-02-CBTILEI-105", タグ: "タイルF0102-CB105", 商品: [商品("-A", "タイル商品F0102-CB105", { 価格: "450", 在庫: 0, 足す規格: [SP("-B", "250")] })] },
  "CB106": { シードID: "S-F01-02-CBTILEJ-106", タグ: "タイルF0102-CB106", 商品: [商品("-A", "タイル商品F0102-CB106", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "300"), MP("-C", "200")] })] },
  "CB107": { シードID: "S-F01-02-CBTILEK-107", タグ: "タイルF0102-CB107", 商品: [商品("-A", "タイル商品F0102-CB107", { 価格: "500", 在庫: 0, 足す規格: [SP("-B", "99"), 英NM("-C", "700"), MP("-D", "200")] })] },
  // ---- SALE中の商品（固定のセールタグ） ----
  "030": { シードID: "S-F01-02-CASE-030", タグ: null, 商品: [商品("A", "F0102-030商品A", { 価格: "1", 在庫: 5, セール: true }), 商品("B", "F0102-030商品B", { 価格: "1", 在庫: 5, セール: true, タグ付け: false }), 商品("C", "F0102-030商品C", { 価格: "1", 在庫: 5 })] },
  "083": { シードID: "S-F01-02-SALEMINNS-083", タグ: null, 商品: [商品("", "最小状態非セール商品F0102-083", { 価格: "500", 在庫: 5, 足す規格: [{ ...SP("-B", "500", 5), セール: true }] })] },
  "084": { シードID: "S-F01-02-SALEMINST-084", タグ: null, 商品: [商品("", "最小状態在庫なし商品F0102-084", { 価格: "500", 在庫: 0, セール: true, 足す規格: [{ ...SP("-B", "500", 5), セール: true }] })] },
  "086": { シードID: "S-F01-02-SALEMINLG-086", タグ: null, 商品: [商品("", "最小状態言語違い商品F0102-086", { 価格: "500", 在庫: 5, セール: true, 足す規格: [{ ...英NM("-B", "700", 5), セール: true }, { ...SP("-C", "300", 5), セール: true }] })] },
  "089": { シードID: "S-F01-02-CART1-089", タグ: null, 商品: [商品("", "セール基準商品-089", { 価格: "500", 在庫: 5, セール: true })] },
  "090": { シードID: "S-F01-02-CART5-090", タグ: null, 商品: [商品("", "セール基準商品-090", { 価格: "500", 在庫: 5, セール: true })] },
  "CB095": { シードID: "S-F01-02-CBCBSALE-095", タグ: null, 商品: [商品("-A", "セール全条件F0102-CB095", { 価格: "1", 在庫: 5, セール: true })] },
  "CB096": { シードID: "S-F01-02-CBCBSALEHQ-096", タグ: null, 商品: [商品("-A", "セール公開F0102-CB096", { 価格: "1", 在庫: 5, セール: true }), 商品("-B", "セール本店非公開F0102-CB096", { 価格: "1", 在庫: 5, セール: true, 承認後の状態: "非公開" })] },
};
for (const [n, d] of Object.entries(タイルの定め)) {
  defineSeed(d.シードID, async ({ browser, notes, seed }) => { await タイルの支店を作る(browser, seed.シードID, n, d.タグ, d.商品, notes, `${seed["状態・属性"]}${seed.投入方法}`); });
}

// ---- カテゴリの支店表示フラグ（064） ----
export const カテゴリ名 = (正本の名称: string): string => rc(正本の名称);
defineSeed("S-F01-02-CASE-064", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 支店ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, "064", issue));
  notes.set("〔支店ID-F0102-064〕", 支店ID);
  // カテゴリ管理の最上位の画面には入力欄が無いので、カテゴリ登録CSV（画面）で最上位のカテゴリを登録する
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const [正本名, 非表示, 呼び名] of [["支店表示カテゴリ-064", "0", "〔カテゴリID-F0102-064A〕"], ["支店非表示カテゴリ-064", "1", "〔カテゴリID-F0102-064B〕"]] as const) {
      notes.set(呼び名, await createTopByCsv(page, { nameJp: カテゴリ名(正本名), nameEn: カテゴリ名(正本名), branchHide: 非表示 }, `f0102-064-${Date.now()}.csv`, issue));
    }
  });
});
