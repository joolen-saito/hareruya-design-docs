/**
 * F01-02 支店ECTOP のシード（タイル・商品が要るもの）。正本: cases/F01-02_seed_data.tsv
 * 支店と管理者2人を作り、タイルのタグをタグ管理で作り、グッズ商品CSVで商品を作ってタグを付け、支店の在庫を入庫・承認し、
 * 支店トップページ管理で上段右にそのタグのタイル（属性「その他」）・残り3区画にピックアップ商品を設定する。
 * タグの名称・商品コード・商品名は決め打ちの識別の値なので、実行ごとの印を付ける（rc）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { ensureTenant } from "../pages/admin/tenant";
import { createTopByCsv } from "../pages/admin/category";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { 支店在庫のピックアップを指定する, 週間販売数を設定する } from "../db/f01_02_prep";
import { タグを付けて商品を登録する, タグを用意する, 支店トップページにタイルを設定する, 支店トップページを設定する, 支店の管理者を用意する, 管理者, 規格の高額商品コードを設定する, 規格のセールを設定する, 規格を追加する, 規格を削除する, 追加する規格, 規格の公開状態を設定する, 既存のカードを指定する } from "../pages/admin/f01_02_setup";
import { imageFile, saveProductWithImages } from "../pages/admin/f03_06_products";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { 支店URL, 支店名 } from "./f01-02";

const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };

/** 取込で作られる規格（言語日本語・状態NM）に足す規格。コードは「<商品コード><suffix>」 */

/** 支店を登録する。店名略称（3文字）が、ほかの店舗と重なって登録できなかったら、略称を変えて作り直す（略称は正本の指定が無い任意の値） */
export async function 支店を用意する(page: import("@playwright/test").Page, n: string, issue: (m: string) => void, 他: { 公開?: "公開" | "非公開"; X公式アカウントURL?: string } = {}): Promise<string> {
  let last = "";
  for (let salt = 0; salt < 6; salt++) {
    try {
      return await ensureTenant(page, {
        店名: 支店名(n), 店名カナ: "シケンシテン", 店名英語: "Branch Shop", 支店URL: 支店URL(n), 店名略称3文字: 略称(`${支店URL(n)}${salt || ""}`), ショップ名略称: 支店名(n), ...他,
      }, issue);
    } catch (e) {
      last = (e as Error).message;
      if (!/略称/.test(last)) throw e;
      issue(`店名略称が重なって登録できなかったので、略称を変えて登録し直した（${last.split("\n")[0]}）`);
    }
  }
  throw new Error(`店名略称を変えても支店を登録できない: ${last}`);
}

export type 足す規格 = { suffix: string; 言語: "日本語" | "英語"; 状態: "NM" | "SP" | "MP" | "HP"; 価格: string; 在庫?: number; セール?: boolean; 非公開?: boolean };
export type タイル商品 = {
  suffix: string; name: string;
  支店公開?: boolean; 在庫?: number; 価格?: string; 高額コード?: string;
  /** タイルのタグを付けるか（false で付けない）。"セール" はタイルのタグの代わりにアプリがセールに使うタグを付ける */
  タグ付け?: boolean | "セール";
  /** 既存のカードを商品に指定する（"通常" は Foil の印が無いカード、"Foil" は Foil の印があるカード） */
  カード?: "通常" | "Foil";
  /** 取込の規格（NM）を表示対象外（商品規格の公開ステータス＝非公開）にする。在庫を入れる前に行う */
  規格非公開?: boolean;
  /** 商品画像に追加する画像ファイル。必須なら、追加できなければ止める */
  画像?: { name: string; buffer: Buffer; 必須: boolean };
  /** 在庫を入れる前に、商品の公開状態（本店の公開状態）を変える */
  先の状態?: "非公開" | "廃止";
  /** 取込の規格（NM）のセールフラグ（SALE中の商品の用） */
  セール?: boolean;
  足す規格?: 足す規格[];
  /** 規格を足したあとで、取込の規格（NM）を削除する */
  取込規格を削除?: boolean;
  /** 在庫の承認のあとで、商品の公開状態を変える（本店の公開状態） */
  承認後の状態?: "非公開" | "廃止";
  /** 支店在庫のピックアップ指定を「あり」にする（画面で指定できないので、在庫の承認のあとにDBで設定する） */
  ピックアップ指定?: boolean;
  /** 本店の過去1週間の販売数（期間別販売数集計データ。バッチが作るデータで画面で指定できないので、在庫の承認のあとにDBで設定する）。取込の規格（NM）の分 */
  週間販売数?: number;
};
export const タイル商品コード = (n: string, suffix: string): string => rc(`F0102-${n}${suffix}`);
export const タイルのタグ名 = (正本の名称: string): string => rc(正本の名称);

const SALE_TAG_ID = "8"; // 「固定のセールタグ」: 手元のDBでは名称「sale1(未使用)」のタグ（アプリがセールに使うタグ）
async function タイルの支店を作る(browser: Browser, seedId: string, n: string, タグ正本名: string | null, defs: タイル商品[], notes: { set(k: string, v: string): void }, 投入方法: string, ピックアップのみ = false): Promise<void> {
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
      if (d.カード) await 既存のカードを指定する(page, productId, { Foil: d.カード === "Foil", 商品名: rc(d.name) }, `${seedId}: ${code}`, issue);
      if (d.画像) {
        const saved = await saveProductWithImages(page, productId, [{ name: d.画像.name, buffer: d.画像.buffer }], `${seedId}: ${code} の商品画像`, issue);
        if (saved.length === 0) {
          if (d.画像.必須) throw new Error(`${seedId}: ${code} に商品画像「${d.画像.name}」を追加できない`);
          issue(`${code} に商品画像「${d.画像.name}」を追加できなかったので、代替画像のまま進めた`);
        }
      }
      const 付けるタグ = d.タグ付け === false ? null : d.タグ付け === "セール" ? SALE_TAG_ID : タグID;
      await タグを付けて商品を登録する(page, productId, 付けるタグ, d.先の状態 ?? null, `${seedId}: ${code}`, issue);
      if (d.高額コード) await 規格の高額商品コードを設定する(page, productId, rows[0].商品規格ID, rc(d.高額コード), `${seedId}: ${code} の高額商品コード`, issue);
      ids.set(code, { productId, classId: rows[0].商品規格ID });
      if (d.セール) await 規格のセールを設定する(page, productId, rows[0].商品規格ID, { フラグ: true, 販売価格: d.価格 ?? "500" }, `${seedId}: ${code} のセール`, issue);
      if (d.規格非公開) await 規格の公開状態を設定する(page, productId, rows[0].商品規格ID, "非公開", `${seedId}: ${code} を表示対象外に`, issue);
      if ((d.在庫 ?? 1) > 0 && !d.取込規格を削除) 入庫.push({ code, 数量: d.在庫 ?? 1 });
      for (const r of d.足す規格 ?? []) {
        const v: 追加する規格 = { 言語: r.言語, 状態: r.状態, 商品コード: `${code}${r.suffix}`, 基準価格: r.価格, 販売価格: r.価格, 買取価格: r.価格 === "0" ? "0" : String(Math.max(1, Math.floor(Number(r.価格) / 5))), セール: r.セール };
        const 足したID = await 規格を追加する(page, productId, v, `${seedId}: ${v.商品コード}`, issue);
        足した規格ID.set(`${正規(d.suffix)}|${正規(r.suffix)}`, 足したID);
        if (r.非公開) await 規格の公開状態を設定する(page, productId, 足したID, "非公開", `${seedId}: ${v.商品コード} を表示対象外に`, issue);
        if ((r.在庫 ?? 1) > 0) 入庫.push({ code: v.商品コード, 数量: r.在庫 ?? 1 });
      }
      if (d.取込規格を削除) await 規格を削除する(page, productId, rows[0].商品規格ID, `${seedId}: ${code} の取込の規格`, issue);
    }
    const 入れる = 入庫;
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
        // 申請した管理者はこの支店・この実行だけのもの（ログインIDに番号と実行の印が入る）なので、その管理者の未承認の行だけを承認する
        const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant);
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
    // 画面で作れない値をDBで設定する（印つきの商品コードの規格だけ）
    for (const d of defs) {
      const code = タイル商品コード(n, d.suffix);
      if (d.ピックアップ指定) {
        const k = 支店在庫のピックアップを指定する(code, 支店ID);
        issue(`商品 ${code} の規格の支店在庫（${k} 行）のピックアップ指定「あり」は、指定する画面が無いので、DBで設定した`);
      }
      if (d.週間販売数 !== undefined) {
        週間販売数を設定する(code, d.週間販売数);
        issue(`商品 ${code} の規格の本店の過去1週間の販売数 ${d.週間販売数} は、期間別販売数集計バッチが作るデータで画面から作れないので、DBで設定した（集計バッチが走ると書き換わる）`);
      }
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
  if (ピックアップのみ) {
    await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページを設定する(page, 支店名(n), { タイル: [{ 属性: "ピックアップ商品" }, { 属性: "ピックアップ商品" }, { 属性: "ピックアップ商品" }, { 属性: "ピックアップ商品" }] }, seedId, issue));
  } else if (タグ正本名) {
    await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページにタイルを設定する(page, 支店名(n), タグ名, seedId, issue));
  }
}

const 商品 = (suffix: string, name: string, 他: Partial<タイル商品> = {}): タイル商品 => ({ suffix, name, ...他 });
const 四つ = ["01", "02", "03", "04"].map((nn) => 商品(`-${nn}`, `F0102-044商品${nn}`, { 価格: "1" }));
/** 連番の商品（suffix は「-01」〜、商品名は「<前>01<後>」〜） */
const 連番 = (区切り: string, 前: string, 後: string, 件数: number, 他: Partial<タイル商品>): タイル商品[] =>
  Array.from({ length: 件数 }, (_, i) => String(i + 1).padStart(2, "0")).map((nn) => 商品(`${区切り}${nn}`, `${前}${nn}${後}`, 他));
/**
 * 商品画像のファイル。名前は正本の画像のファイル名（.webp）、中身は名前から色を決めた 32x32 の PNG（手元に WebP を作る道具が無いため。
 * アプリは中身で画像の種類を確かめるので受け付ける）
 */
const 画像 = (名前: string, 必須: boolean): { name: string; buffer: Buffer; 必須: boolean } => ({ name: `${名前}.webp`, buffer: imageFile(名前).buffer, 必須 });
const SP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "日本語", 状態: "SP", 価格, 在庫 });
const MP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "日本語", 状態: "MP", 価格, 在庫 });
const 英NM = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "英語", 状態: "NM", 価格, 在庫 });
const 英SP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "英語", 状態: "SP", 価格, 在庫 });
const HP = (suffix: string, 価格: string, 在庫 = 3): 足す規格 => ({ suffix, 言語: "日本語", 状態: "HP", 価格, 在庫 });
/** 売れ筋・ピックアップの商品は、タイルのタグを付けない。売れ筋の抽出は商品にカード（カード詳細）が紐づいていることを求めるので、既存のカードを指定する */
const 売れ筋 = (suffix: string, name: string, 他: Partial<タイル商品> = {}): タイル商品 => 商品(suffix, name, { タグ付け: false, カード: "通常", ...他 });
/** 週間販売数 31〜1 の連番の商品（01 が 31 個 … 31 が 1 個） */
const 週間連番 = (n: string): タイル商品[] => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((nn, i) =>
  売れ筋(`-${nn}`, `週間商品${nn}-${n}`, { 価格: "500", 在庫: 1, 週間販売数: 31 - i }));

/** n＝支店・商品コードの組み立てに使う番号（シードIDの末尾とは別）。タグが null のものは「SALE中の商品」の用（アプリがセールに使うタグ） */
export const タイルの定め: Record<string, { シードID: string; タグ: string | null; 商品: タイル商品[]; ピックアップのみ?: boolean }> = {
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
  // ---- 2026-11-10 追加 ----
  "038": { シードID: "S-F01-02-CASE-038", タグ: "テストタイルA", 商品: [商品("A", "タイル表示対象商品", { 価格: "1" }), 商品("B", "タイル表示対象外商品", { 価格: "1", 規格非公開: true })] },
  "050": { シードID: "S-F01-02-CASE-050", タグ: "テストタイルA-050", 商品: [商品("", "テストタイル商品-050", { 画像: 画像("tile-product-050", false) })] },
  "051": { シードID: "S-F01-02-CASE-051", タグ: "テストタイルA-051", 商品: [商品("", "テストタイル商品-051", { カード: "通常" })] },
  "076": { シードID: "S-F01-02-TILEENLARGE-076", タグ: "テストタイルF0102-076", 商品: [商品("", "タイル拡大商品F0102-076", { 価格: "500", 在庫: 3, 画像: 画像("tile-image-F0102-076", true) })] },
  "077": { シードID: "S-F01-02-TILELANG-077", タグ: "テストタイルF0102-077", 商品: [商品("", "タイル言語商品F0102-077", { 価格: "500", 在庫: 3, カード: "通常" })] },
  "092": { シードID: "S-F01-02-TILEFOIL-092", タグ: "テストタイルF0102-092", 商品: [商品("", "タイルFoil商品F0102-092", { 価格: "500", 在庫: 3, カード: "Foil" })] },
  "CB108": { シードID: "S-F01-02-CBTILEL-108", タグ: "タイルF0102-CB108", 商品: [商品("-A", "タイル本店公開商品F0102-CB108", { 価格: "800", 在庫: 3 }), 商品("-B", "タイル本店廃止商品F0102-CB108", { 価格: "800", 在庫: 3, 先の状態: "廃止" })] },
  // ---- 2026-11-10 追加（DBで整える: ピックアップ指定・週間販売数） ----
  "046": { シードID: "S-F01-02-CASE-046", タグ: "ピックアップタイル-046", ピックアップのみ: true, 商品: [商品("A", "ピックアップ指定商品-046", { タグ付け: false, ピックアップ指定: true }), 商品("B", "ピックアップ未指定商品-046")] },
  "CB098": { シードID: "S-F01-02-CBTILEB-098", タグ: null, ピックアップのみ: true, 商品: [商品("-A", "タイル商品F0102-CB098", { タグ付け: false, ピックアップ指定: true, 価格: "500", 在庫: 0, 足す規格: [SP("-B", "300"), 英NM("-C", "700", 0), 英SP("-D", "300")] })] },
  "CB099": { シードID: "S-F01-02-CBTILEC-099", タグ: null, ピックアップのみ: true, 商品: [商品("-A", "タイル商品F0102-CB099", { タグ付け: false, ピックアップ指定: true, 価格: "500", 在庫: 0, 足す規格: [SP("-B", "99"), MP("-C", "200"), HP("-D", "150")] })] },
  "CB103": { シードID: "S-F01-02-CBTILEG-103", タグ: null, ピックアップのみ: true, 商品: [商品("-A", "タイル商品F0102-CB103", { タグ付け: false, ピックアップ指定: true, 価格: "800", 在庫: 3 })] },
  "053": { シードID: "S-F01-02-CASE-053", タグ: "テストタイルA-053", 商品: [商品("", "テストタイル商品-053", { 週間販売数: 7 })] },
  "007": { シードID: "S-F01-02-CASE-007", タグ: null, 商品: 週間連番("007") },
  "008": { シードID: "S-F01-02-CASE-008", タグ: null, 商品: 週間連番("008") },
  "010": { シードID: "S-F01-02-CASE-010", タグ: null, 商品: [売れ筋("A", "週間公開商品-010", { 価格: "500", 在庫: 1, 週間販売数: 2 }), 売れ筋("B", "週間非公開商品-010", { 価格: "500", 在庫: 1, 週間販売数: 1, 支店公開: false })] },
  "027": { シードID: "S-F01-02-CASE-027", タグ: null, 商品: [売れ筋("", "週間在庫なし商品-027", { 価格: "500", 在庫: 0, 週間販売数: 1 })] },
  "CB093": { シードID: "S-F01-02-CBCBWEEK-093", タグ: null, 商品: [売れ筋("-A", "売れ筋公開F0102-CB093", { 価格: "500", 在庫: 3, 週間販売数: 3 })] },
  "CB094": { シードID: "S-F01-02-CBCBWEEKHQ-094", タグ: null, 商品: [売れ筋("-A", "売れ筋公開F0102-CB094", { 価格: "500", 在庫: 3, 週間販売数: 3 }), 売れ筋("-B", "売れ筋本店非公開F0102-CB094", { 価格: "500", 在庫: 3, 週間販売数: 4, 承認後の状態: "非公開" })] },
  // SALE中の商品のラベル（029）: セールフラグ1の商品はSALE中の商品に、セールフラグ0の商品はタイルに出す（週間販売数の代わり）
  "029": { シードID: "S-F01-02-CASE-029", タグ: "SALEラベル確認タイル-029", 商品: [商品("A", "セール基準商品-029", { 価格: "500", 在庫: 5, セール: true, タグ付け: "セール" }), 商品("B", "セールフラグOFF商品-029", { 価格: "500", 在庫: 5 })] },
  // SALE中の商品（固定のセールタグ）
  "020": { シードID: "S-F01-02-CASE-020", タグ: null, 商品: 連番("-", "SALE上限商品", "-020", 31, { 価格: "1", 在庫: 1, セール: true }) },
  "022": { シードID: "S-F01-02-CASE-022", タグ: null, 商品: [商品("A", "セール基準商品-022", { 価格: "500", 在庫: 5, セール: true, カード: "通常" }), 商品("B", "セール非カード商品-022", { 価格: "500", 在庫: 5, セール: true })] },
  "031": { シードID: "S-F01-02-CASE-031", タグ: null, 商品: [商品("", "セール基準商品-031", { 価格: "500", 在庫: 5, セール: true, カード: "通常" })] },
  "072": { シードID: "S-F01-02-ENLARGE-072", タグ: null, 商品: [商品("", "画像拡大商品F0102-072", { 価格: "500", 在庫: 5, セール: true, 画像: 画像("sale-image-F0102-072", true) })] },
  "073": { シードID: "S-F01-02-ENLARGESP-073", タグ: null, 商品: [商品("", "画像拡大SP商品F0102-073", { 価格: "500", 在庫: 5, セール: true, 画像: 画像("sale-image-F0102-073", true) })] },
  "074": { シードID: "S-F01-02-SLIDEL-074", タグ: null, 商品: 連番("-", "スライド商品F0102-074-", "", 20, { 価格: "500", 在庫: 5, セール: true }) },
  "075": { シードID: "S-F01-02-SLIDER-075", タグ: null, 商品: 連番("-", "スライド商品F0102-075-", "", 20, { 価格: "500", 在庫: 5, セール: true }) },
  "085": { シードID: "S-F01-02-SALEMINHD-085", タグ: null, 商品: [商品("", "最小状態表示対象外商品F0102-085", { 価格: "500", 在庫: 5, セール: true, 規格非公開: true, 足す規格: [{ ...SP("-B", "500", 5), セール: true }] })] },
  "091": { シードID: "S-F01-02-FOILSALE-091", タグ: null, 商品: [商品("", "セールFoil商品-091", { 価格: "500", 在庫: 5, セール: true, カード: "Foil" })] },
};
for (const [n, d] of Object.entries(タイルの定め)) {
  defineSeed(d.シードID, async ({ browser, notes, seed }) => { await タイルの支店を作る(browser, seed.シードID, n, d.タグ, d.商品, notes, `${seed["状態・属性"]}${seed.投入方法}`, d.ピックアップのみ); });
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
