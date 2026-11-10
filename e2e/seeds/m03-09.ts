/**
 * M03-09 商品規格登録/編集の画面シード。正本: cases/M03-09_seed_data.tsv
 * 実施不可の見直し（review/not_runnable_seed_recheck.tsv）で流せる見込みになったケースの分。
 *
 * - S-M03-09-ADM: M03-30 と同じ作り方（メンバー管理で、権限「システム管理者」の試験管理者を登録する。あれば使う）。
 * - S-M03-09-MASTER: シード表は DB で店舗・在庫場所・言語・状態・部門を登録すると定める。見直しの判定（B: 既にある標準のマスタを使う）のとおり、
 *   開発環境に既にあるマスタを使い、言語（日本語・英語）・状態（5つ）・部門10・20 が有効なことを DB の参照で確かめるだけにする（書き換えない）。
 *   在庫場所はアプリでは「EC-CUBE」「スマレジ」の2つの決まった値で、マスタの表は無い。「TC東京」の在庫場所は確かめていない（使うケース 006 は作らない）。
 * - 商品: グッズ商品CSV登録で1行を取り込み（取り込みで状態ニアミントの規格が1件できる）、商品マスターの検索から商品規格一覧を開き、
 *   取り込みでできた規格を開いて部門・スマレジ連携フラグ・公開ステータスなどを入れて「商品規格を登録」する（pages/admin/m03_30_products.ts の部品）。
 *   2件目の規格は商品規格一覧の「新規作成」で登録する。商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。
 * - スマレジ商品コード（8309… の数字）は、スマレジの試験環境に同じコードの商品が前の実行で残るので、末尾に実行ごとの数字5桁を付けて作る（数字のまま）。
 *   ケースの文の同じコード（変更後のコードも）も同じ数字を付けて読む。値そのものを確かめるケースは条件付き（注記に残す）。
 * - 在庫（110・114 の通販在庫5）: 在庫検索一覧から本店・EC-CUBE の在庫編集で入庫し、別のメンバーが在庫編集承認一覧で承認する（F04 の登録者・承認者）。
 * - 画像（007・008・064）: 商品登録編集画面の商品画像へ、試験用の画像（色違いの小さな PNG。ファイル名 IMG-A-007.png など）を順に追加して「商品を登録」し、
 *   規格の代表画像でシード表の順に選ぶ。画像の中身は正本が決めないので、色違いの小さな画像にした（正本の外の補い）。
 * - カード（122・124）: 商品登録編集画面の「カード指定」で、カード検索の結果の先頭のカードを指定して登録する（M03-30 の部品）。
 *   シード表の「商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選ぶ」はしていない（ケースは商品カテゴリを確かめない。注記に残す）。
 */
import zlib from "node:zlib";
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { ある言語, 商品規格の記録, 商品コードの規格の数, 部門が有効か, 状態の名前 } from "../db/m03_09";
import { 在庫承認の最大ID } from "../db/f03_08";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { F04承認者, F04登録者, 管理者を用意する, 本店の店名 } from "../pages/admin/f04_setup";
import { saveProductWithImages } from "../pages/admin/f03_06_products";
import { ensureMember } from "../pages/admin/member";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { addClass, assignFirstCard, displayedClassId, openClassList, openClassListByCode, registerGoodsProduct } from "../pages/admin/m03_30_products";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";

export const M0309_ADMIN: Account = { loginId: "m0309_admin", password: "Passw0rd!M0309" };

/** スマレジ商品コードに付ける実行ごとの数字（1回の実行の中では同じ） */
export const 数字の印 = String(Date.now()).slice(-5);
/** 正本のスマレジ商品コード（数字）に、実行ごとの数字を付けた値 */
export const スマレジコード = (正本の値: string): string => `${正本の値}${数字の印}`;

// ---- 管理者・マスタ ----

defineSeed("S-M03-09-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error("S-M03-09-ADM: メンバーに割り当てられる店舗が画面に無い");
    await ensureMember(page, {
      名前: "M03-09試験管理者", 所属店舗: stores[0], ログインID: M0309_ADMIN.loginId, メールアドレス: "m0309_admin@example.test",
      パスワード: M0309_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
});

defineSeed("S-M03-09-MASTER", async ({ seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const langs = ある言語(["日本語", "英語"]);
  if (langs.length !== 2) throw new Error(`言語「日本語」「英語」が登録されていない（あるもの: ${langs.join("、")}）`);
  const states = 状態の名前();
  const want = ["ニアミント", "スライトリープレイド", "モデレトリープレイド", "ヘビープレイド", "その他"];
  if (JSON.stringify(states) !== JSON.stringify(want)) throw new Error(`状態のマスタがシード表の5つと違う（${states.join("、")}）`);
  for (const id of ["10", "20"]) if (!部門が有効か(id)) throw new Error(`部門${id}が有効でない`);
  issue("マスタは開発環境に既にあるものを使い、DB の参照で確かめた（言語・状態・部門10/20）。書き換えていない。在庫場所は EC-CUBE・スマレジの決まった値で、TC東京は確かめていない");
});
defineSeed("S-M03-09-CBP1ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "環境のシード。スマレジ試験環境への接続は開発環境の設定をそのまま使う（書き換えない）。11/10 時点で、開発環境で連携ありにした商品規格にスマレジ側の商品IDが付いていることを DB で確かめた");
});

// ---- 商品と規格 ----

type 整え = {
  部門?: string; 連携?: boolean; スマレジ商品コード?: string; 公開?: string;
  販売?: string; 基準?: string; セール?: boolean; 状態別称?: string; 代表画像?: string[];
};
type 追加の規格 = { 呼び名: string; 状態: string; 商品コード: string; 状態名?: string; 価格?: [string, string, string] };
type 商品の定め = {
  商品コード: string; 商品名: string; 価格: [string, string, string]; 商品ID呼び名?: string;
  規格の呼び名?: string; 整え?: 整え; 追加?: 追加の規格[]; 画像?: string[]; 廃止?: boolean; 通販在庫?: number; カード?: boolean;
};

const 標準: 整え = { 部門: "10", 連携: false, 公開: "公開" };
const P = (code: string, name: string, 価格: [string, string, string] = ["500", "500", "200"]) => ({ 商品コード: code, 商品名: name, 価格 });

/** シードごとの作り方（シード表の投入方法の値） */
const 定め: Record<string, 商品の定め[]> = {
  "NEW-001": [{ ...P("M0309-NEW-001-NM", "M0309-NEW-001"), 商品ID呼び名: "001" }],
  "NEW-003": [{ ...P("M0309-NEW-003-NM", "M0309-NEW-003"), 商品ID呼び名: "003" }],
  "NEW-004": [{ ...P("M0309-NEW-004-NM", "M0309-NEW-004"), 商品ID呼び名: "004" }],
  "NEW-010": [{ ...P("M0309-NEW-010-NM", "M0309-NEW-010"), 商品ID呼び名: "010" }],
  "NEW-042": [{ ...P("M0309-NEW-042-NM", "M0309-NEW-042"), 商品ID呼び名: "042" }],
  "NEW-098": [{ ...P("M0309-NEW-098-NM", "M0309-NEW-098"), 商品ID呼び名: "098" }],
  "NOTFOUND-013": [{ ...P("M0309-NOTFOUND-013-NM", "M0309-NOTFOUND-013", ["1000", "1000", "100"]), 商品ID呼び名: "013" }],
  "OTHER-005": [{ ...P("M0309-OTHER-005-NM", "M0309-OTHER-005", ["1000", "1000", "100"]), 商品ID呼び名: "005", 追加: [{ 呼び名: "005", 状態: "その他", 状態名: "水濡れ", 商品コード: "M0309-SEED-005" }] }],
  "IMAGE-007": [{ ...P("M0309-SEED-007", "M0309-IMAGE-007"), 商品ID呼び名: "007", 規格の呼び名: "007", 画像: ["IMG-A-007", "IMG-B-007", "IMG-C-007"], 整え: { ...標準, 代表画像: ["IMG-A-007", "IMG-B-007"] } }],
  "IMAGE-008": [{ ...P("M0309-SEED-008", "M0309-IMAGE-008"), 商品ID呼び名: "008", 規格の呼び名: "008", 画像: ["IMG-A-008"], 整え: { ...標準, 代表画像: ["IMG-A-008"] } }],
  "IMAGE-064": [{ ...P("M0309-SEED-064", "M0309-IMAGE-064"), 商品ID呼び名: "064", 規格の呼び名: "064", 画像: ["IMG-A-064", "IMG-B-064", "IMG-C-064"], 整え: { ...標準, 代表画像: ["IMG-A-064", "IMG-B-064"] } }],
  "MULTI-011": [{ ...P("M0309-SEED-011-A", "M0309-MULTI-011"), 商品ID呼び名: "011", 規格の呼び名: "011A", 整え: 標準, 追加: [{ 呼び名: "011B", 状態: "スライトリープレイド", 商品コード: "M0309-SEED-011-B" }] }],
  "LAST-012": [{ ...P("M0309-SEED-012", "M0309-LAST-012"), 商品ID呼び名: "012", 規格の呼び名: "012", 整え: 標準 }],
  "NOTFOUND-014": [{ ...P("M0309-SEED-014", "M0309-NOTFOUND-014"), 商品ID呼び名: "014", 規格の呼び名: "014", 整え: 標準 }],
  "MISMATCH-015": [
    { ...P("M0309-SEED-015-A", "M0309-MISMATCH-015-A"), 商品ID呼び名: "015A", 規格の呼び名: "015A", 整え: 標準 },
    { ...P("M0309-SEED-015-B", "M0309-MISMATCH-015-B"), 商品ID呼び名: "015B", 規格の呼び名: "015B", 整え: 標準 },
  ],
  "BASE-016": [{ ...P("M0309-SEED-016", "M0309-BASE-016"), 商品ID呼び名: "016", 規格の呼び名: "016", 整え: 標準 }],
  "BASE-026": [{ ...P("M0309-SEED-026", "M0309-BASE-026"), 商品ID呼び名: "026", 規格の呼び名: "026", 整え: { ...標準, セール: false } }],
  "BASE-027": [{ ...P("M0309-SEED-027", "M0309-BASE-027"), 商品ID呼び名: "027", 規格の呼び名: "027", 整え: { ...標準, 基準: "500", セール: true, 販売: "500" } }],
  "SALE-028": [{ ...P("M0309-SEED-028", "M0309-SALE-028", ["700", "500", "200"]), 商品ID呼び名: "028", 規格の呼び名: "028", 整え: { ...標準, 基準: "700", セール: true, 販売: "500" } }],
  "BASE-029": [{ ...P("M0309-SEED-029", "M0309-BASE-029"), 商品ID呼び名: "029", 規格の呼び名: "029", 整え: { ...標準, セール: false } }],
  "BASE-033": [{ ...P("M0309-SEED-033", "M0309-BASE-033"), 商品ID呼び名: "033", 規格の呼び名: "033", 整え: { ...標準, 状態別称: "基本状態" } }],
  "BASE-035": [{ ...P("M0309-SEED-035", "M0309-BASE-035"), 商品ID呼び名: "035", 規格の呼び名: "035", 整え: { ...標準, 状態別称: "基本状態" } }],
  "RETIRED-046": [{ ...P("M0309-SEED-046", "M0309-RETIRED-046"), 商品ID呼び名: "046", 規格の呼び名: "046", 整え: 標準, 廃止: true }],
  "RETIRED-047": [{ ...P("M0309-SEED-047", "M0309-RETIRED-047"), 商品ID呼び名: "047", 規格の呼び名: "047", 整え: 標準, 廃止: true }],
  "DELETE-048": [{ ...P("M0309-SEED-048-A", "M0309-DELETE-048"), 商品ID呼び名: "048", 規格の呼び名: "048A", 整え: 標準, 追加: [{ 呼び名: "048B", 状態: "スライトリープレイド", 商品コード: "M0309-SEED-048-B" }] }],
  "DELETE-049": [{ ...P("M0309-SEED-049-A", "M0309-DELETE-049"), 商品ID呼び名: "049", 規格の呼び名: "049A", 整え: 標準, 追加: [{ 呼び名: "049B", 状態: "スライトリープレイド", 商品コード: "M0309-SEED-049-B" }] }],
  "LAST-051": [
    { ...P("M0309-SEED-051-A", "M0309-LAST-051-A"), 商品ID呼び名: "051A", 規格の呼び名: "051A", 整え: 標準, 追加: [{ 呼び名: "051B", 状態: "スライトリープレイド", 商品コード: "M0309-SEED-051-B" }] },
    { ...P("M0309-SEED-051-C", "M0309-LAST-051-B"), 商品ID呼び名: "051B", 規格の呼び名: "051C", 整え: 標準 },
  ],
  "LAST-052": [
    { ...P("M0309-SEED-052-A", "M0309-LAST-052-A"), 商品ID呼び名: "052A", 規格の呼び名: "052A", 整え: 標準, 追加: [{ 呼び名: "052B", 状態: "スライトリープレイド", 商品コード: "M0309-SEED-052-B" }] },
    { ...P("M0309-SEED-052-C", "M0309-LAST-052-B"), 商品ID呼び名: "052B", 規格の呼び名: "052C", 整え: 標準 },
  ],
  "TOKEN-053": [{ ...P("M0309-BASE-01-053", "M0309-TOKEN-053"), 商品ID呼び名: "053", 規格の呼び名: "053", 整え: 標準 }],
  "TOKEN-054": [{ ...P("M0309-BASE-01-054", "M0309-TOKEN-054"), 商品ID呼び名: "054", 規格の呼び名: "054", 整え: 標準 }],
  "HISTORY-096": [{ ...P("M0309-SEED-096", "M0309-HISTORY-096", ["700", "500", "200"]), 商品ID呼び名: "096", 規格の呼び名: "096", 整え: { ...標準, 基準: "700", セール: true, 販売: "500" } }],
  "BASE-099": [{ ...P("M0309-SEED-099", "M0309-BASE-099"), 商品ID呼び名: "099", 規格の呼び名: "099", 整え: { ...標準, スマレジ商品コード: "8309031099" } }],
  "BASE-100": [{ ...P("M0309-SEED-100", "M0309-BASE-100"), 商品ID呼び名: "100", 規格の呼び名: "100", 整え: { ...標準, 基準: "500", セール: true, 販売: "500" } }],
  "CBSALEON-106": [{ ...P("M0309-CB106-A", "M0309-CB106-商品"), 商品ID呼び名: "106", 規格の呼び名: "106", 整え: 標準 }],
  "CBPUBREG-107": [{ ...P("M0309-CB107-A", "M0309-CB107-商品"), 商品ID呼び名: "107", 規格の呼び名: "107", 整え: { ...標準, 連携: true, スマレジ商品コード: "830911071" } }],
  "CBRETNOREG-108": [{ ...P("M0309-CB108-A", "M0309-CB108-商品"), 商品ID呼び名: "108", 規格の呼び名: "108", 整え: 標準 }],
  "CBRETEC-110": [{ ...P("M0309-CB110-A", "M0309-CB110-商品"), 商品ID呼び名: "110", 規格の呼び名: "110", 整え: 標準, 通販在庫: 5 }],
  "CBPUBEC-114": [{ ...P("M0309-CB114-A", "M0309-CB114-商品"), 商品ID呼び名: "114", 規格の呼び名: "114", 整え: { ...標準, 連携: true, スマレジ商品コード: "830911141" }, 通販在庫: 5 }],
  "CBOFFSTK0-116": [{ ...P("M0309-CB116-A", "M0309-CB116-商品"), 商品ID呼び名: "116", 規格の呼び名: "116", 整え: { ...標準, 連携: true, スマレジ商品コード: "830911161" } }],
  "CBKEEPSTK0-117": [{ ...P("M0309-CB117-A", "M0309-CB117-商品"), 商品ID呼び名: "117", 規格の呼び名: "117", 整え: { ...標準, 連携: true, スマレジ商品コード: "830911171" } }],
  "CBGDNOCODE-121": [{ ...P("M0309-CB121-A", "M0309-CB121-商品"), 商品ID呼び名: "121", 規格の呼び名: "121", 整え: 標準 }],
  "CBSGNOCODE-122": [{ ...P("M0309-CB122-A", "M0309-CB122-商品"), 商品ID呼び名: "122", 規格の呼び名: "122", 整え: 標準, カード: true }],
  "CBGDCODE-123": [{ ...P("M0309-CB123-A", "M0309-CB123-商品"), 商品ID呼び名: "123", 規格の呼び名: "123", 整え: { ...標準, スマレジ商品コード: "830911231" } }],
  "CBSGOFF-124": [{ ...P("M0309-CB124-A", "M0309-CB124-商品"), 商品ID呼び名: "124", 規格の呼び名: "124", 整え: 標準, カード: true }],
};

/** 試験用の小さな PNG（色違い。画像の中身は正本が決めない） */
function png(r: number, g: number, b: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const w = 16, h = 16;
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; } }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const 色 = [[220, 40, 40], [40, 120, 220], [40, 180, 80], [200, 160, 30]];

/** 画像の名前（IMG-A-007 など）→ 商品登録で保存されたファイル名。ケースが画像を見分けるのに使う */
const 画像のファイル名 = new Map<string, string>();
export function 画像のファイル名の(名前: string): string {
  const f = 画像のファイル名.get(名前);
  if (!f) throw new Error(`画像 ${名前} はまだ登録していない`);
  return f;
}

/** 開いている商品規格登録/編集画面で、整えの値を入れて「商品規格を登録」する */
async function 規格を整える(page: Page, v: 整え, what: string, issue: (m: string) => void): Promise<void> {
  const e = new ClassEditPage(page);
  if (v.部門) await e.部門を選ぶ(v.部門);
  if (v.スマレジ商品コード !== undefined) await e.スマレジ商品コード.fill(スマレジコード(v.スマレジ商品コード));
  if (v.連携 !== undefined) await e.スマレジ連携を選ぶ(v.連携);
  if (v.公開) await e.公開ステータスを選ぶ(v.公開);
  if (v.状態別称 !== undefined) await e.状態別称.fill(v.状態別称);
  if (v.基準 !== undefined) await e.基準価格.fill(v.基準);
  if (v.セール !== undefined) { if (v.セール) await e.セールフラグ.check(); else await e.セールフラグ.uncheck(); }
  if (v.販売 !== undefined) await e.販売価格.fill(v.販売);
  if (v.代表画像) {
    const want = v.代表画像.map(画像のファイル名の);
    const values = await e.代表画像.locator("option").evaluateAll((os, names) => (names as string[]).map((n) => {
      const o = os.find((x) => (x.getAttribute("data-url") ?? "").endsWith(n) || (x.textContent ?? "").trim() === n) as HTMLOptionElement | undefined;
      return o?.value ?? "";
    }), want);
    if (values.some((x) => !x)) throw new Error(`${what}: 代表画像の選択肢に登録した画像が無い（${want.join("、")}）`);
    await e.代表画像.selectOption(values);
    await e.代表画像.dispatchEvent("change");
  }
  // 「商品規格を登録」の前に、画面のスクリプトがスマレジの基準価格の閾値の確認を出すことがある
  page.once("dialog", (d) => { issue(`${what}: 確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); });
  const r = await e.登録を押す();
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  const 移った先 = new URL(r.URL).pathname;
  const 編集画面 = /\/product\/product\/class\/\d+\/edit\/\d+$/.test(移った先);
  const 一覧 = /\/product\/product\/class\/\d+$/.test(移った先);
  if (!編集画面 && !(v.公開 === "廃止" && 一覧)) throw new Error(`${what}: 登録後に商品規格登録編集画面へ移らない（${r.URL}）`);
}

/** 本店・EC-CUBE（通販）の在庫編集で入庫し、別のメンバーが承認する */
async function 通販に入庫する(browser: Browser, code: string, 数: number, what: string, issue: (m: string) => void): Promise<void> {
  await 管理者を用意する(browser);
  const shop = await 本店の店名(browser);
  const baseline = 在庫承認の最大ID();
  let registrant = "";
  await withAdminSession(browser, F04登録者.account, async (page) => {
    const stock = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    await registerStockEdit(page, { changeType: "入庫/その他", reason: `${code}-試験データ`, quantity: String(数), purchasePrice: "0", approverName: F04承認者.名前 }, `${what}: 在庫編集`, issue);
    registrant = await loggedInMemberName(page);
  });
  await withAdminSession(browser, F04承認者.account, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline && r.quantity === String(数));
    if (rows.length === 0) throw new Error(`${what}: 在庫編集承認一覧に、登録者「${registrant}」の未承認の行が無い`);
    try { await list.approve([rows[0].id], `${what}: 在庫編集の承認`, issue); } catch (err) {
      if (!String(err).includes("成功メッセージ")) throw err;
      await list.open(shop);
      if ((await list.rowValues()).some((r) => r.id === rows[0].id && r.status === "未承認")) throw err;
      issue(`${what}: 承認の成功の表示は出なかったが、承認一覧の行は未承認でなくなった`);
    }
  });
}

/** 商品規格一覧の「新規作成」で、状態「その他」・状態名つきの規格を登録する（addClass は状態名の欄を扱わないので、ここで入れる） */
async function その他の規格を足す(page: Page, productId: string, a: 追加の規格, what: string, issue: (m: string) => void): Promise<string> {
  const e = new ClassEditPage(page);
  await e.新規で開く(productId);
  await chooseByLabel(e.言語, "日本語");
  await e.状態を選ぶ(a.状態);
  await e.状態名.fill(a.状態名 ?? "");
  await e.商品コード.fill(rc(a.商品コード));
  const [基準, 販売, 買取] = a.価格 ?? ["500", "500", "200"];
  await e.基準価格.fill(基準); await e.販売価格.fill(販売); await e.買取価格.fill(買取);
  await 規格を整える(page, 標準, what, issue);
  return displayedClassId(page);
}

async function 商品を作る(browser: Browser, seedId: string, d: 商品の定め, notes: Notes, issue: (m: string) => void): Promise<void> {
  const code = rc(d.商品コード), name = rc(d.商品名);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tpl = await downloadGoodsCsvTemplate(page);
    const zeros = Object.fromEntries(tpl.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsProduct(page, {
      what: seedId, code, nameJp: name, nameEn: name,
      values: { "基準価格": d.価格[0], "販売価格": d.価格[1], "買取価格": d.価格[2], "原価単価": "10", ...zeros }, onIssue: issue,
    });
    const { productId, rows } = await openClassListByCode(page, code);
    if (d.商品ID呼び名) notes.set(`〔商品ID-M0309-${d.商品ID呼び名}〕`, productId);
    if (d.画像) {
      const files = d.画像.map((n, i) => ({ name: `${n}.png`, buffer: png(...(色[i % 色.length] as [number, number, number])) }));
      const saved = await saveProductWithImages(page, productId, files, seedId, issue);
      if (saved.length !== files.length) throw new Error(`${seedId}: 商品画像を ${files.length} 件追加できなかった（保存されたのは ${saved.length} 件）`);
      d.画像.forEach((n, i) => 画像のファイル名.set(n, saved[i]));
      issue(`${seedId}: 画像の中身は正本が決めないので、色違いの小さな PNG（${d.画像.map((n) => `${n}.png`).join("・")}）を登録した（正本の外の補い）`);
    }
    if (d.カード) {
      await assignFirstCard(page, { productId, productNameJp: name, productNameEn: name }, seedId, issue);
      issue(`${seedId}: シード表の「商品カテゴリをサプライ・グッズから単体カードのカテゴリへ替える」はしていない（ケースは商品カテゴリを確かめない）`);
    }
    if (d.規格の呼び名 && d.整え) {
      if (rows.length !== 1) throw new Error(`${seedId}: 取り込み直後の商品規格が1件でない（${rows.length}件）`);
      const e = new ClassEditPage(page);
      await e.編集で開く(productId, rows[0].商品規格ID);
      await 規格を整える(page, d.整え, `${seedId}: ${code} の規格`, issue);
      const id = await displayedClassId(page);
      notes.set(`〔商品規格ID-M0309-${d.規格の呼び名}〕`, id);
      if (d.廃止) {
        await 規格を整える(page, { 公開: "廃止" }, `${seedId}: ${code} の規格を廃止`, issue);
        const rec = 商品規格の記録(id);
        if (rec?.公開ステータス !== "廃止") throw new Error(`${seedId}: 規格を廃止にできない（公開ステータス ${rec?.公開ステータス}）`);
      }
    }
    for (const a of d.追加 ?? []) {
      await openClassList(page, productId);
      if (a.状態名 !== undefined) { notes.set(`〔商品規格ID-M0309-${a.呼び名}〕`, await その他の規格を足す(page, productId, a, `${seedId}: ${rc(a.商品コード)}`, issue)); continue; }
      const id = await addClass(page, productId, { 言語: "日本語", 状態: a.状態, 商品コード: rc(a.商品コード), 基準価格: "500", 販売価格: "500", 買取価格: "200" }, `${seedId}: ${rc(a.商品コード)}`, issue);
      const e = new ClassEditPage(page);
      if ((await e.部門.inputValue()) !== "10") { await 規格を整える(page, { 部門: "10" }, `${seedId}: ${rc(a.商品コード)} の部門`, issue); }
      notes.set(`〔商品規格ID-M0309-${a.呼び名}〕`, id);
    }
  });
  if (d.通販在庫) await 通販に入庫する(browser, rc(d.商品コード), d.通販在庫, seedId, issue);
}

for (const [k, defs] of Object.entries(定め)) {
  const seedId = `S-M03-09-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const attrs = getSeed(seedId)["状態・属性"];
    for (const d of defs) {
      if (!attrs.includes(d.商品名) && !getSeed(seedId)["投入方法"].includes(d.商品名)) throw new Error(`${seedId}: シード表に商品名 ${d.商品名} が無い（作り方の表の誤り）`);
      await 商品を作る(browser, seedId, d, notes, issue);
    }
    // シード表の「…の規格が存在しない状態にする（あれば削除する）」は、実行の印を付けた商品コードで確かめる（印つきの値は前の実行と重ならない）
    for (const m of getSeed(seedId)["状態・属性"].matchAll(/商品コード(M0309-[A-Z0-9-]+?)(?:を持つ|の)規格が存在しない/g)) {
      if (商品コードの規格の数(rc(m[1])) !== 0) throw new Error(`${seedId}: 商品コード ${rc(m[1])} の規格がすでにある`);
    }
  });
}

