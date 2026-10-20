/**
 * M03-23 買取・販売価格履歴検索の画面シード。正本: cases/M03-23_seed_data.tsv
 *
 * 作るのは、画面だけで作れるシード（ADM・MASTERS・KEYWORD・RETAIN・DPEXP-041・DPLANG-042）だけ。
 * - S-M03-23-CONFIG（表示件数の既定値を50にする）は、管理画面に設定の項目が無く、値はアプリの設定ファイルで決まる（いまは10）。
 *   設定ファイルの書き換えが要るので作らない。使うケース 001・002・037 も実装しない。
 * - FILTER・RANGE・DATE・CORE・INBOUND・SORT・MAXPAGE・CORRECTION-033 は、作り方に価格履歴のDBでの削除・登録日時の設定などが
 *   含まれるので作らない（使うケースも実装しない）。
 *
 * 正本の作り方に共通の操作と解釈:
 * - どのシードも、正本どおり試験管理者（m0323_admin）でログインして作る（価格履歴の登録者は試験管理者になる）。
 * - グッズ商品CSV登録で雛形をダウンロードし、行を書いたCSVをアップロードする。正本の「表示された確認モーダルでアップロードを確定する」は、
 *   いまの画面に確認モーダルが無い（依頼者の判断待ち。設計書 M03-27 L0092 にはある）。モーダルを待たずにそのまま進め、注記する。
 * - CSVの商品公開ステータスは、正本の「2（公開）」と画面のCSV形式の説明（1:公開 2:非公開 3:廃止）が食い違う。
 *   正本の状態・属性（公開）に合わせ、画面の説明で「公開」を表す値を書く（注記。裁定案は記録の文書）。
 * - 取り込んだ商品は、商品マスターを商品コードで検索した行から商品登録編集画面を開き、「規格設定」で商品規格一覧を開いて、
 *   取り込みで作られたニアミントの商品規格の部門を選択肢の先頭、公開ステータスを「公開」にして登録する。
 * - カードの詳細情報のカードセットは、正本が値を定めない KEYWORD・DPLANG-042 でも、共有マスタの履歴セットAlpha を選ぶ
 *   （まっさらなDBにはカードセットが1件も無く、選べないため。先に作るシードに共有マスタを書く）。
 * - 共有のシード（KEYWORD・RETAIN）の商品コードは固定の値で、正本に清掃の手順が無い。前の実行の商品がすべて残っていれば、
 *   作り直さずに内容を確かめて使う。1件も無ければ作る。一部だけ残っているときは止める（作り直してよいかは依頼者が決める）。
 * - ケース専用のシード（DPEXP-041・DPLANG-042）も商品コードが固定で、清掃の手順が無い。同じ商品コードの商品が残っていれば止める
 *   （同じDBでは流し直さない）。
 * - 商品コードが固定のシード（KEYWORD・RETAIN・DPEXP-041・DPLANG-042）は、作る前に、シード表の状態・属性の「…を持つ価格履歴は
 *   これだけ」を既存の価格履歴が崩していないかをDBの参照で確かめ、崩していれば何も作らずに止める（作る前の確かめ。2026-10-20 の
 *   レビューの指摘で足した。規約「重なって正本の状態にできないときは、作らずに止めて報告する」）。DB確認の接続先が無いときも止める。
 * - DB確認の接続先があるときは、作ったあとにも「…を持つ価格履歴はこのN件だけ」をDBの参照で確かめ、違えば報告に出す（止めない）。
 *   ケース専用のシード（DPEXP-041・DPLANG-042）は、各商品の価格履歴の属性（商品に付いたカードのカードセット〔041 だけ〕・商品規格の言語・
 *   変更後の価格）もシード表どおりかを確かめ、違えば報告に出す（2026-10-20 のレビューの指摘で足した。止めない）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 語を持つ価格履歴, 商品規格の価格履歴 } from "../db/m03_23_price_history";
import { 名称のカードセット, 商品コードの価格履歴の属性, 語を持つ価格履歴の件数 } from "../db/m03_23_state";
import { available as dbAvailable } from "../lib/db";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CategoryPage } from "../pages/admin/category";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { PriceHistoryPage } from "../pages/admin/m03_23_price_history";
import {
  classRowsFromProductEdit, openProductEditByCode, productIdsByCode, publishImportedClass,
  readLanguageIds, registerCard, saveShopMemo, shopMemoOf, 同名のカードセットのID,
} from "../pages/admin/m03_23_seed_products";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { ensureMember } from "../pages/admin/member";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureCardset } from "../pages/admin/product_masters";

export const M0323_ADMIN: Account = { loginId: "m0323_admin", password: "Passw0rd!M0323" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-23-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-23試験管理者", 所属店舗: store, ログインID: M0323_ADMIN.loginId, メールアドレス: "m0323_admin@example.test",
    パスワード: M0323_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-23-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、商品管理の買取・販売価格履歴検索画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0323_ADMIN, async (page) => {
    const h = new PriceHistoryPage(page);
    await h.open();
    await expect(h.検索ボタン, "M03-23試験管理者で買取・販売価格履歴検索画面を開けない").toBeVisible();
  });
});

/** グッズ商品CSVの1行（正本が行ごとに定めた値） */
type 商品行 = { 商品コード: string; 商品名日: string; 商品名英: string; 基準価格: string; 販売価格: string; 買取価格: string; 言語ID?: string };

/** 作る前の確かめで数える語と、その範囲（シード表の状態・属性の書き方どおり。「公開・NMの」と書いてあれば公開・NM、書いていなければすべて） */
export type 語と範囲 = { 語: string; 範囲: "すべて" | "公開・NM" };

const 範囲の書き方 = (r: 語と範囲) => `「${r.語}」（${r.範囲 === "すべて" ? "公開状態・状態を問わない" : "公開・NM"}）`;

/**
 * 検索の対象の項目に語を持つ既存の価格履歴を、語ごとに範囲の中で数え、1件以上ある語の説明の文を返す（無ければ空。DBの参照だけ）。
 * 作る前の確かめ（SeedOps.expectNoWordOwnersBeforeCreate）の中身。調べるための一時テストからも呼べるように外に出した。
 */
export function 状態を崩す既存の価格履歴(語と範囲: 語と範囲[]): string[] {
  const found: string[] = [];
  for (const r of 語と範囲) {
    const counts = 語を持つ価格履歴の件数(r.語).filter((c) => r.範囲 === "すべて" || (c.公開状態 === "公開" && c.状態 === "NM"));
    const total = counts.reduce((s, c) => s + c.件数, 0);
    if (total > 0) found.push(`${範囲の書き方(r)}を持つ価格履歴が ${total} 件（${counts.map((c) => `${c.公開状態 || "なし"}・${c.状態 || "なし"}=${c.件数}`).join("、")}）`);
  }
  return found;
}

/** 作ったあとに確かめる、価格履歴の属性のシード表の値。カードセットはシード表が定めるときだけ渡す */
export type 価格履歴の属性の期待 = {
  カードセット?: { ID: string; 名称: string };
  言語: string;
  /** CSVに書いた値（シード表の投入方法の値。登録後に価格を変えない） */
  変更後価格: { 基準価格: string; 販売価格: string; 買取価格: string };
};

/**
 * 商品コードの価格履歴を（DBの参照だけで）読み、シード表の状態・属性と違う点の説明の文を返す（無ければ空）。
 * 見るのは、価格履歴があること、どの価格履歴でも、商品に付いたカードの詳細情報のカードセットが期待どおり（期待を渡したときだけ）・
 * 商品規格の言語が期待どおり・変更後の価格（基準価格・販売価格・買取価格）があり、CSVに書いた値と同じであること。
 * 作ったあとの確かめ（SeedOps.checkHistoryAttributes）の中身。調べるための一時テストからも呼べるように外に出した。
 * 2026-10-20 のレビューの指摘で足した（041 で B1 のカードセットが空や別の値でも、期待結果「B1 は表示されない」は通ってしまうため）。
 */
export function シード表と違う価格履歴の属性(商品コード: string, want: 価格履歴の属性の期待): string[] {
  const rows = 商品コードの価格履歴の属性(商品コード);
  if (rows.length === 0) return [`商品コード ${商品コード} の価格履歴が無い`];
  const out: string[] = [];
  for (const r of rows) {
    const at = `商品コード ${商品コード} の価格履歴（価格履歴ID ${r.価格履歴ID}）`;
    if (want.カードセット && r.カードセットID !== want.カードセット.ID) {
      out.push(`${at}: 商品に付いたカードのカードセットが「${r.カードセット名 ?? "なし"}」（ID ${r.カードセットID ?? "なし"}）。` +
        `シード表は「${want.カードセット.名称}」（ID ${want.カードセット.ID}）`);
    }
    if (r.言語 !== want.言語) out.push(`${at}: 商品規格の言語が「${r.言語 ?? "なし"}」（シード表は「${want.言語}」）`);
    const 価格: [string, string | null, string][] = [
      ["基準価格", r.変更後基準価格, want.変更後価格.基準価格], ["販売価格", r.変更後販売価格, want.変更後価格.販売価格],
      ["買取価格", r.変更後買取価格, want.変更後価格.買取価格],
    ];
    for (const [項目, got, w] of 価格) {
      if (got === null || got === "") out.push(`${at}: 変更後の${項目}が無い（シード表は変更後価格あり）`);
      else if (got !== w) out.push(`${at}: 変更後の${項目}が ${got}（CSVに書いた値は ${w}）`);
    }
  }
  return out;
}

/** シードを作る試験管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  private files = 0;
  private csvCategoryId?: string;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {}

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /**
   * グッズ商品CSVの商品カテゴリ(ID)に入れる、サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧の値）。
   * カードや商品を作る前に呼ぶ。グッズ商品CSV登録画面の列の説明が示すサプライ・グッズのIDと違えば、何も作らずに止める
   * （空から作ったDBのカテゴリの初期データはアプリの固定のIDと合わず、取込が「値が異常です」で拒む。HANDOFF 4章の16。
   * 確かめないまま進むと、先に登録したカードだけが残る）。確かめは M03-22 の部品（画面を読むだけ）を使う。
   */
  async goodsCategory(): Promise<string> {
    if (!this.csvCategoryId) this.csvCategoryId = await goodsCsvCategoryId(this.page, this.warn);
    return this.csvCategoryId;
  }

  /**
   * グッズ商品CSV登録で、正本の各行共通の値と行ごとの値を書いたCSVをアップロードする。
   * 各行共通: 商品IDは空・言語(ID)は日本語のID（行が定めればその値）・商品公開ステータスと支店の商品公開ステータスは公開・サイズ1・重量1・
   * 商品カテゴリ(ID)はサプライ・グッズのカテゴリID・購入グループ名称は既存の購入グループの名称・原価単価10・地域別販売制限0・部門IDは空。
   */
  async importGoods(rows: 商品行[]): Promise<void> {
    this.files += 1;
    const categoryId = await this.goodsCategory();
    await registerGoodsCsv(this.page, {
      what: `${this.seedId} のグッズ商品CSV登録`, fileName: `${this.seedId}-${this.files}.csv`, categoryId,
      lines: rows.map((r) => ({
        code: r.商品コード, nameJp: r.商品名日, nameEn: r.商品名英,
        values: { "基準価格": r.基準価格, "販売価格": r.販売価格, "買取価格": r.買取価格, ...(r.言語ID ? { "言語(ID)": r.言語ID } : {}) },
      })),
      common: { "原価単価": "10", "地域別販売制限": "0" },
      onWarning: this.warn,
    });
    this.warn(`グッズ商品CSV（${rows.map((r) => r.商品コード).join("・")}）: 正本の「確認モーダルでアップロードを確定する」の確認モーダルは出ず、` +
      "「CSVファイルのアップロード」を押すと取り込まれた（依頼者の判断待ちの点）");
    this.warn(`グッズ商品CSV: 商品カテゴリ(ID)はサプライ・グッズのカテゴリID ${categoryId}。商品公開ステータスは、正本の「2（公開）」でなく、` +
      "画面のCSV形式の説明で公開を表す値を書いた（説明は「1:公開 2:非公開 3:廃止」）");
  }

  /**
   * 固定の商品コードの商品が前の実行で残っているか。すべて1件ずつ残っていれば商品コード→商品IDを返し、1件も無ければ null を返す。
   * 一部だけ・2件以上残っているときは止める（正本に清掃の手順が無い）。
   */
  async leftovers(codes: string[]): Promise<Map<string, string> | null> {
    const found = new Map<string, string[]>();
    for (const code of codes) found.set(code, await productIdsByCode(this.page, code));
    const counts = [...found.values()].map((ids) => ids.length);
    if (counts.every((n) => n === 0)) return null;
    if (counts.every((n) => n === 1)) return new Map([...found].map(([code, ids]) => [code, ids[0]]));
    const detail = [...found].map(([code, ids]) => `${code}=${ids.length}件`).join("・");
    throw new Error(`${this.seedId}: 固定の商品コードの商品が一部だけ、または重なって残っている（${detail}）。正本に清掃の手順が無いので、作り直してよいかの判断が要る`);
  }

  /** ケース専用のシードの固定の商品コードの商品が、1件も残っていないこと */
  async expectNoLeftovers(codes: string[]): Promise<void> {
    for (const code of codes) {
      const ids = await productIdsByCode(this.page, code);
      if (ids.length > 0) {
        throw new Error(`${this.seedId}: 商品コード ${code} の商品が前の実行で残っている（商品ID ${ids.join("・")}）。正本に清掃の手順が無いので、同じDBでは流し直さない`);
      }
    }
  }

  /** 商品マスターで商品コードを検索した行から商品登録編集画面を開き、取り込みで作られたニアミントの商品規格を公開にする。商品規格IDを返す */
  async publish(code: string, 言語 = "日本語"): Promise<string> {
    const productId = await openProductEditByCode(this.page, code);
    return publishImportedClass(this.page, productId, { 商品コード: code, 言語 }, `${this.seedId}: 商品コード ${code}`, this.warn);
  }

  /** 前の実行で残っていた商品の商品規格が、取り込みで作られた1件だけで、公開・NMであることを確かめる。商品規格IDを返す */
  async expectPublished(code: string, 言語 = "日本語"): Promise<string> {
    const productId = await openProductEditByCode(this.page, code);
    const rows = await classRowsFromProductEdit(this.page, productId);
    const ok = rows.length === 1 && rows[0].商品コード === code && rows[0].状態 === "NM" && rows[0].言語 === 言語 && rows[0].公開状態 === "公開";
    if (!ok) throw new Error(`${this.seedId}: 残っていた商品コード ${code} の商品規格が、公開・NM・${言語}の1件でない: ${JSON.stringify(rows)}`);
    return rows[0].商品規格ID;
  }

  /**
   * DB確認の接続先があれば、検索の対象の項目に語を持つ価格履歴の商品コードが want（順不同）のとおりで、どれも公開・NMであることを確かめる。
   * 違えば報告に出す（ほかの機能のデータが語を含むなど。ケースの前提が崩れていることを知らせる）。
   */
  checkWordOwners(語: string, want: string[]): void {
    if (!dbAvailable) return;
    // 既存のデータが多い環境（ダンプのDB）では、語を持つ価格履歴が数千件になることがある。行を全部読まずに、公開状態・状態ごとの件数で知らせる
    const counts = 語を持つ価格履歴の件数(語);
    const total = counts.reduce((s, c) => s + c.件数, 0);
    if (total > 50) {
      this.warn(`DBの参照: 「${語}」を検索の対象の項目に持つ価格履歴が ${total} 件ある（シード表は ${want.join("・")} の ${want.length} 件だけ）。` +
        `公開状態・状態ごとの件数: ${counts.map((c) => `${c.公開状態 || "なし"}・${c.状態 || "なし"}=${c.件数}`).join("、")}`);
      return;
    }
    const rows = 語を持つ価格履歴(語);
    const got = rows.map((r) => r.商品コード).sort();
    if (JSON.stringify(got) !== JSON.stringify([...want].sort())) {
      this.warn(`DBの参照: 「${語}」を検索の対象の項目に持つ価格履歴の商品コードが ${got.join("・") || "なし"}（シード表は ${want.join("・")} だけ）`);
    }
    const off = rows.filter((r) => r.公開状態 !== "公開" || r.状態 !== "NM");
    if (off.length) this.warn(`DBの参照: 「${語}」を持つ価格履歴のうち公開・NMでないもの: ${off.map((r) => `${r.商品コード}（${r.公開状態}・${r.状態}）`).join("・")}`);
  }

  /**
   * 作る前の確かめ（2026-10-20 のレビューの指摘で足した）。シード表の状態・属性の「…を持つ価格履歴はこれだけ」を、
   * 既存の価格履歴（このシードがまだ作っていないもの）が崩していないかを、何かを作る前にDBの参照で確かめる。
   * 語ごとに、シード表の書き方どおりの範囲で数える（「公開・NMの」と書いてあれば公開・NMだけ、書いていなければ公開状態・状態を問わない）。
   * 1件でもあれば、何も作らずに止める（商品コードが固定で清掃の手順が無いので、正本の状態にできないまま作らない）。
   * 範囲を狭める（例: 裁定案10の「公開・NMに限る」）のは、依頼者が認めたときだけ。DB確認の接続先が無いときは確かめられないので止める。
   */
  expectNoWordOwnersBeforeCreate(語と範囲: 語と範囲[]): void {
    if (!dbAvailable) {
      throw new Error(`${this.seedId}: DB確認の接続先が無いので、作る前の確かめ（${語と範囲.map(範囲の書き方).join("・")}を持つ既存の価格履歴が無いこと）ができない。` +
        "清掃の手順が無い固定の商品コードの商品を作るので、何も作らずに止めた");
    }
    const found = 状態を崩す既存の価格履歴(語と範囲);
    if (found.length > 0) {
      throw new Error(`${this.seedId}: 作る前の確かめで、シード表の状態・属性を既存の価格履歴が崩している: ${found.join("／")}。` +
        "正本の状態にできないので、何も作らずに止めた（作るかどうかは依頼者の判断）");
    }
    this.warn(`作る前の確かめ: ${語と範囲.map(範囲の書き方).join("・")}を検索の対象の項目に持つ既存の価格履歴は、どれも0件だった（DBの参照）`);
  }

  /** DB確認の接続先があれば、商品規格の価格履歴がちょうど1件であることを確かめる（違えば報告に出す） */
  checkOneHistory(code: string, 商品規格ID: string): void {
    if (!dbAvailable) return;
    const n = 商品規格の価格履歴(商品規格ID).length;
    if (n !== 1) this.warn(`DBの参照: 商品コード ${code}（商品規格ID ${商品規格ID}）の価格履歴が ${n} 件（シード表は1件）`);
  }

  /**
   * DB確認の接続先があれば、作った商品の価格履歴の属性（カードセット・言語・変更後価格）がシード表どおりかを確かめる。
   * 違えば報告に出す（止めない。期待結果の確かめは変えない）。合っていれば、確かめた値を報告に残す。
   */
  checkHistoryAttributes(code: string, want: 価格履歴の属性の期待): void {
    if (!dbAvailable) return;
    const issues = シード表と違う価格履歴の属性(code, want);
    for (const i of issues) this.warn(`DBの参照: ${i}`);
    if (issues.length === 0) {
      const v = want.変更後価格;
      this.warn(`DBの参照: 商品コード ${code} の価格履歴は、${want.カードセット ? `カードのカードセット「${want.カードセット.名称}」・` : ""}` +
        `言語「${want.言語}」・変更後の価格（基準価格 ${v.基準価格}・販売価格 ${v.販売価格}・買取価格 ${v.買取価格}）で、シード表どおりだった`);
    }
  }
}

/** 試験管理者でログインしたセッションで作る */
function defineM0323Seed(seedId: string, needs: string[], build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M03-23-ADM", ...needs] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, M0323_ADMIN, async (page) => {
      await build(new SeedOps(page, seed.シードID, notes));
    });
  });
}

// ---- 検索選択肢マスタ ----

const 履歴カテゴリ = ["履歴親カテゴリ", "履歴子カテゴリ", "履歴別カテゴリ"] as const;

defineM0323Seed("S-M03-23-MASTERS", [], async (o) => {
  const category = new CategoryPage(o.page);
  await category.openTop();
  const csv = await category.downloadCsv();
  const named = (n: string) => csv.filter((r) => r["カテゴリ名(日)"] === n);
  const [parent, child, other] = 履歴カテゴリ.map(named);
  let ids: { 親: string; 子: string; 別: string };
  if (parent.length === 0 && child.length === 0 && other.length === 0) {
    // 既にある最上位のカテゴリを1つ選んでその配下を開き、履歴親カテゴリ・履歴別カテゴリを作る。履歴親カテゴリの配下に履歴子カテゴリを作る
    await category.openTop();
    const top = (await category.rowValues())[0];
    if (!top) throw new Error(`${o.seedId}: 最上位のカテゴリが1件も無い`);
    o.warn(`最上位のカテゴリは、一覧の先頭の「${top.nameJp}」（ID ${top.id}）を選んだ（正本: 既にある最上位のカテゴリを1つ）`);
    const 親 = await category.createChild(top.id, { nameJp: "履歴親カテゴリ" }, o.warn);
    const 別 = await category.createChild(top.id, { nameJp: "履歴別カテゴリ" }, o.warn);
    const 子 = await category.createChild(親, { nameJp: "履歴子カテゴリ" }, o.warn);
    ids = { 親, 子, 別 };
  } else if (parent.length === 1 && child.length === 1 && other.length === 1
    && child[0]["親カテゴリID"] === parent[0]["カテゴリID"] && other[0]["親カテゴリID"] === parent[0]["親カテゴリID"]) {
    // 前の実行で作ったものが、正本の親子の関係のまま残っている。一覧のID列の番号で控える
    const top = parent[0]["親カテゴリID"];
    if (top && top !== "0") await category.openChildrenOf(top); else await category.openTop();
    const 親 = await category.idOf("履歴親カテゴリ");
    const 別 = await category.idOf("履歴別カテゴリ");
    await category.openChildrenOf(親);
    const 子 = await category.idOf("履歴子カテゴリ");
    ids = { 親, 子, 別 };
    o.warn(`前の実行で作った履歴親カテゴリ（ID ${親}）・履歴子カテゴリ（ID ${子}）・履歴別カテゴリ（ID ${別}）を使った`);
  } else {
    const detail = [parent, child, other].map((rows, i) => `${履歴カテゴリ[i]}=${rows.map((r) => `ID ${r["カテゴリID"]}（親 ${r["親カテゴリID"]}）`).join("・") || "なし"}`).join(" / ");
    throw new Error(`${o.seedId}: 履歴カテゴリが正本の親子の関係で残っていない（${detail}）。作り直してよいかの判断が要る`);
  }
  o.notes.set("〔カテゴリID-M0323-共有A〕", ids.親);
  o.notes.set("〔カテゴリID-M0323-共有B〕", ids.子);
  o.notes.set("〔カテゴリID-M0323-共有C〕", ids.別);
  // カードセット名英語・略称・リリース日は任意の有効な値（リリース日はその日の日付）。前の実行で作った同名のカードセットがあれば、内容を照合して使う
  o.notes.set("〔カードセットID-M0323-共有A〕", await cardset(o, "履歴セットAlpha", "History Set A M0323", "M0323HSA"));
  o.notes.set("〔カードセットID-M0323-共有B〕", await cardset(o, "履歴セットBeta", "History Set B M0323", "M0323HSB"));
});

/**
 * カードセットを、同名があれば内容を照合して使い、無ければ登録画面をアドレスで開いて登録する（共通の部品）。
 * 共通の部品はどちらだったかを返さないので、先に同名のカードセットの有無を見て、注記を書き分ける
 * （2026-10-20 のレビューの指摘。前は照合だけのときも「登録した」と注記していた）。有無は、DB確認の接続先があればDBの参照、無ければ画面で見る。
 */
async function cardset(o: SeedOps, nameJp: string, nameEn: string, code: string): Promise<string> {
  const before = dbAvailable ? 名称のカードセット(nameJp).map((c) => c.カードセットID) : await 同名のカードセットのID(o.page, nameJp);
  const id = await ensureCardset(o.page, nameJp, nameEn, code, o.warn);
  if (before.length === 0) {
    o.warn(`カードセット「${nameJp}」は、カードセット管理(一覧)の「新規登録」と同じ登録画面をアドレスで開いて登録した（カードセットID ${id}）`);
  } else {
    o.warn(`カードセット「${nameJp}」は、前の実行で作ったもの（カードセットID ${id}）の内容を照合して使った（登録していない）`);
  }
  return id;
}

// ---- 複合キーワード検索データ ----

/** 識別子 → 商品コード（OR-CODE-001 だけ、商品コードが「ORKEY-OR-CODE-001」） */
export const KEYWORDの商品コード: Record<string, string> = {
  "OR-JP-001": "OR-JP-001", "OR-EN-001": "OR-EN-001", "OR-CARD-001": "OR-CARD-001", "OR-CODE-001": "ORKEY-OR-CODE-001",
  "OR-MEMO-001": "OR-MEMO-001", "AND-BOTH-001": "AND-BOTH-001", "AND-ALPHA-001": "AND-ALPHA-001", "AND-BETA-001": "AND-BETA-001",
  "PERCENT-001": "PERCENT-001", "UNDERSCORE-001": "UNDERSCORE-001",
};

const kw = (商品コード: string, 商品名日: string, 商品名英: string): 商品行 => ({ 商品コード, 商品名日, 商品名英, 基準価格: "1000", 販売価格: "1000", 買取価格: "100" });
const KEYWORD_ROWS: 商品行[] = [
  kw("OR-JP-001", "ORKEY日本語商品", "KW-OR-JP-001"),
  kw("OR-EN-001", "KW日本語-OR-EN-001", "ORKEY English Product"),
  kw("OR-CARD-001", "KW日本語-OR-CARD-001", "KW-OR-CARD-001"),
  kw("ORKEY-OR-CODE-001", "KW日本語-OR-CODE-001", "KW-OR-CODE-001"),
  kw("OR-MEMO-001", "KW日本語-OR-MEMO-001", "KW-OR-MEMO-001"),
  kw("AND-BOTH-001", "ALPHA商品-AND-BOTH-001", "KW-AND-BOTH-001"),
  kw("AND-ALPHA-001", "ALPHA商品-AND-ALPHA-001", "KW-AND-ALPHA-001"),
  kw("AND-BETA-001", "BETA商品-AND-BETA-001", "KW-AND-BETA-001"),
  kw("PERCENT-001", "100%商品", "KW-PERCENT-001"),
  kw("UNDERSCORE-001", "KW日本語-UNDERSCORE-001", "KW-UNDERSCORE-001"),
];
/** ショップ用メモ欄に入れる値 */
const KEYWORD_MEMOS: [string, string][] = [["OR-MEMO-001", "ORKEY"], ["AND-BOTH-001", "BETA"], ["UNDERSCORE-001", "UNDER_SCORE"]];
/** OR-CARD-001 に指定するカード。カード名(日)だけに ORKEY を含める（カード名(英)には ORKEY・ALPHA・BETA・「%」・「_」を入れない） */
const KEYWORD_CARD = { カード名日: "ORKEYカード-M0323", カード名英: "Keyword Card M0323", 点数で見たマナ: "1", コスト: "{1}" };

defineM0323Seed("S-M03-23-KEYWORD", ["S-M03-23-MASTERS"], async (o) => {
  const codes = KEYWORD_ROWS.map((r) => r.商品コード);
  const left = await o.leftovers(codes);
  const classIds = new Map<string, string>();
  if (!left) {
    // 何かを作る前に、シード表の状態・属性の「…を持つ履歴はこれだけ」を既存の価格履歴が崩していないかを確かめる（崩していれば止める）。
    // 範囲はシード表の書き方どおり: ORKEY は「公開・NMの履歴」、ALPHA・BETA・「%」・「_」は公開状態・状態を書いていないので問わない
    o.expectNoWordOwnersBeforeCreate([
      { 語: "ORKEY", 範囲: "公開・NM" }, { 語: "ALPHA", 範囲: "すべて" }, { 語: "BETA", 範囲: "すべて" },
      { 語: "%", 範囲: "すべて" }, { 語: "_", 範囲: "すべて" },
    ]);
    // 何かを作る前に、グッズ商品CSVがサプライ・グッズのカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
    await o.goodsCategory();
    // カード名を持たせる商品（OR-CARD-001）だけ、先にカードを登録する
    const card = await registerCard(o.page, { ...KEYWORD_CARD, カードセットID: o.notes.get("〔カードセットID-M0323-共有A〕") }, `${o.seedId}: OR-CARD-001 のカード`, o.warn);
    await o.importGoods(KEYWORD_ROWS);
    const cardRow = KEYWORD_ROWS[2];
    const productId = await openProductEditByCode(o.page, cardRow.商品コード);
    await assignCardOnProductEdit(o.page, {
      productId, cardNameJp: KEYWORD_CARD.カード名日, cardDetailId: card.カード詳細ID, productNameJp: cardRow.商品名日, productNameEn: cardRow.商品名英,
    }, o.warn);
    for (const [code, memo] of KEYWORD_MEMOS) {
      const id = await openProductEditByCode(o.page, code);
      await saveShopMemo(o.page, id, memo, `${o.seedId}: 商品コード ${code} のショップ用メモ欄`, o.warn);
    }
    for (const code of codes) classIds.set(code, await o.publish(code));
  } else {
    // 注意: 2026-10-20 のダンプのDBに残っている10件は、「「_」を持つ履歴は UNDERSCORE-001 だけ」が成り立たないと分かっていながら作ったもの
    // （規約の外。作る前の確かめは、そのあとに足した）。このDBで使ってよいかは依頼者の判断待ち（記録 e2e/review/M03-23_progress_2026-10-20.md）
    o.warn(`前の実行で作った商品（${codes.join("・")}）が残っていたので、作り直さずに使った`);
    for (const code of codes) {
      const productId = left.get(code)!;
      const memo = KEYWORD_MEMOS.find(([c]) => c === code)?.[1] ?? "";
      await openProductEditByCode(o.page, code);
      const now = await shopMemoOf(o.page);
      if (now !== memo) throw new Error(`${o.seedId}: 残っていた商品コード ${code}（商品ID ${productId}）のショップ用メモ欄が「${now}」（シード表は「${memo}」）`);
      if (code === "OR-CARD-001") {
        await expect(o.page.locator("#admin_product_cardDetailId_name"), `${o.seedId}: 残っていた OR-CARD-001 にカードが指定されている`).toContainText(KEYWORD_CARD.カード名日);
      }
      classIds.set(code, await o.expectPublished(code));
    }
  }
  o.checkWordOwners("ORKEY", ["OR-JP-001", "OR-EN-001", "OR-CARD-001", "ORKEY-OR-CODE-001", "OR-MEMO-001"]);
  o.checkWordOwners("ALPHA", ["AND-BOTH-001", "AND-ALPHA-001"]);
  o.checkWordOwners("BETA", ["AND-BOTH-001", "AND-BETA-001"]);
  o.checkWordOwners("%", ["PERCENT-001"]);
  o.checkWordOwners("_", ["UNDERSCORE-001"]);
  for (const [code, id] of classIds) o.checkOneHistory(code, id);
});

// ---- 検索条件保持データ ----

const RETAIN_ROWS: 商品行[] = Array.from({ length: 11 }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return { 商品コード: `RETAIN-${n}`, 商品名日: `RETAIN RESET商品-${n}`, 商品名英: `RETAIN RESET Product ${n}`, 基準価格: "1000", 販売価格: "1000", 買取価格: "100" };
});

defineM0323Seed("S-M03-23-RETAIN", [], async (o) => {
  const codes = RETAIN_ROWS.map((r) => r.商品コード);
  const left = await o.leftovers(codes);
  const ids: string[] = [];
  if (!left) {
    // 何かを作る前に、シード表の状態・属性「RESETまたはRETAINを検索対象項目に持つ価格履歴はこの11件だけ」を既存の価格履歴が
    // 崩していないかを確かめる（公開状態・状態を書いていないので問わない。崩していれば止める。裁定案10の「公開・NMに限る」は依頼者が認めたときだけ）
    o.expectNoWordOwnersBeforeCreate([{ 語: "RETAIN", 範囲: "すべて" }, { 語: "RESET", 範囲: "すべて" }]);
    // 何かを作る前に、グッズ商品CSVがサプライ・グッズのカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
    await o.goodsCategory();
    // 11行を RETAIN-001 から RETAIN-011 の順に書いた CSV を取り込む（この順に商品規格IDが振られる）
    await o.importGoods(RETAIN_ROWS);
    for (const code of codes) ids.push(await o.publish(code));
  } else {
    o.warn(`前の実行で作った商品（RETAIN-001〜RETAIN-011）が残っていたので、作り直さずに使った`);
    for (const code of codes) ids.push(await o.expectPublished(code));
  }
  // 商品規格IDは登録した順に昇順（RETAIN-001 が最も小さく、商品規格IDの降順で並べたときに最後になる）
  for (let i = 1; i < ids.length; i++) {
    if (!(Number(ids[i]) > Number(ids[i - 1]))) throw new Error(`${o.seedId}: 商品規格IDが登録した順に増えていない（${codes.map((c, j) => `${c}=${ids[j]}`).join("・")}）`);
  }
  // 呼び名は範囲（〔…共有C〕〜〔…共有M〕）で書かれているので、控えるのは両端だけ
  o.notes.set("〔商品規格ID-M0323-共有C〕", ids[0]);
  o.notes.set("〔商品規格ID-M0323-共有M〕", ids[10]);
  o.warn(`商品規格ID: ${codes.map((c, j) => `${c}=${ids[j]}`).join("・")}`);
  o.checkWordOwners("RETAIN", codes);
  o.checkWordOwners("RESET", codes);
  codes.forEach((code, j) => o.checkOneHistory(code, ids[j]));
});

// ---- カードを指定した商品を1件ずつ作るケース専用のシード（041・042） ----

/** 1件ずつ: カードを登録 → グッズ商品CSV（1行）を取り込む → 商品にカードを指定して商品名を入れ直す → 商品規格を公開にする */
async function cardProduct(o: SeedOps, v: { 商品: 商品行; 言語: string; カード名日: string; カード名英: string; カードセットID: string }): Promise<string> {
  const code = v.商品.商品コード;
  const card = await registerCard(o.page, {
    カード名日: v.カード名日, カード名英: v.カード名英, 点数で見たマナ: "1", コスト: "{1}", カードセットID: v.カードセットID,
  }, `${o.seedId}: ${code} のカード`, o.warn);
  await o.importGoods([v.商品]);
  const productId = await openProductEditByCode(o.page, code);
  await assignCardOnProductEdit(o.page, {
    productId, cardNameJp: v.カード名日, cardDetailId: card.カード詳細ID, productNameJp: v.商品.商品名日, productNameEn: v.商品.商品名英,
  }, o.warn);
  return o.publish(code, v.言語);
}

const named = (prefix: string, code: string, 言語ID?: string): 商品行 => ({
  商品コード: code, 商品名日: `${prefix}${code}`, 商品名英: `${prefix}${code}`, 基準価格: "1000", 販売価格: "1000", 買取価格: "100", 言語ID,
});

defineM0323Seed("S-M03-23-DPEXP-041", ["S-M03-23-MASTERS"], async (o) => {
  // 商品コード・カードセットの呼び名・カードセットの名称（シード表: M0323-041-A1・M0323-041-A2=履歴セットAlpha、M0323-041-B1=履歴セットBeta）
  const items: [string, string, string][] = [
    ["M0323-041-A1", "〔カードセットID-M0323-共有A〕", "履歴セットAlpha"], ["M0323-041-A2", "〔カードセットID-M0323-共有A〕", "履歴セットAlpha"],
    ["M0323-041-B1", "〔カードセットID-M0323-共有B〕", "履歴セットBeta"],
  ];
  await o.expectNoLeftovers(items.map(([code]) => code));
  // 何かを作る前に、シード表の状態・属性「商品名に「M0323-041-EXP」を含む公開・NMの価格履歴は…3件だけ」を既存の価格履歴が崩していないかを
  // 確かめる（商品名だけでなく検索の対象の項目すべてで数える。崩していれば止める）
  o.expectNoWordOwnersBeforeCreate([{ 語: "M0323-041-EXP", 範囲: "公開・NM" }]);
  // 何かを作る前に、グッズ商品CSVがサプライ・グッズのカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
  await o.goodsCategory();
  for (const [code, set, setName] of items) {
    const suffix = code.replace("M0323-041-", "");
    const 商品 = named("M0323-041-EXP商品", code);
    const classId = await cardProduct(o, {
      商品, 言語: "日本語",
      カード名日: `M0323-041カード${suffix}`, カード名英: `M0323 041 Card ${suffix}`, カードセットID: o.notes.get(set),
    });
    o.checkOneHistory(code, classId);
    // シード表「…=履歴セットAlpha／…=履歴セットBeta」「どの履歴も言語は日本語で変更後価格あり」を、作ったあとにDBの参照で確かめる（違えば報告に出す）
    o.checkHistoryAttributes(code, {
      カードセット: { ID: o.notes.get(set), 名称: setName }, 言語: "日本語",
      変更後価格: { 基準価格: 商品.基準価格, 販売価格: 商品.販売価格, 買取価格: 商品.買取価格 },
    });
  }
  o.checkWordOwners("M0323-041-EXP", items.map(([code]) => code));
});

defineM0323Seed("S-M03-23-DPLANG-042", ["S-M03-23-MASTERS"], async (o) => {
  const codes = ["M0323-042-JP", "M0323-042-EN", "M0323-042-OT"];
  await o.expectNoLeftovers(codes);
  // 何かを作る前に、シード表の状態・属性「商品名に「M0323-042-LANG」を含む公開・NMの価格履歴は…3件だけ」を既存の価格履歴が崩していないかを
  // 確かめる（商品名だけでなく検索の対象の項目すべてで数える。崩していれば止める）
  o.expectNoWordOwnersBeforeCreate([{ 語: "M0323-042-LANG", 範囲: "公開・NM" }]);
  // 何かを作る前に、グッズ商品CSVがサプライ・グッズのカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
  await o.goodsCategory();
  const set = o.notes.get("〔カードセットID-M0323-共有A〕");
  const card = (suffix: string) => ({ カード名日: `M0323-042カード${suffix}`, カード名英: `M0323 042 Card ${suffix}`, カードセットID: set });
  // 日本語の商品を先に作る（言語(ID)は各行共通の日本語のID）。その他言語のIDは、商品規格の登録画面の言語の欄から読む（既存の商品が要る）
  const jpRow = named("M0323-042-LANG商品", codes[0]);
  const jp = await cardProduct(o, { 商品: jpRow, 言語: "日本語", ...card("JP") });
  const lang = await readLanguageIds(o.page);
  o.warn(`その他言語（日本語と英語以外の言語）には「${lang.その他言語.label}」（言語ID ${lang.その他言語.id}）を使った`);
  const enRow = named("M0323-042-LANG商品", codes[1], lang.英語);
  const en = await cardProduct(o, { 商品: enRow, 言語: "英語", ...card("EN") });
  const otRow = named("M0323-042-LANG商品", codes[2], lang.その他言語.id);
  const ot = await cardProduct(o, { 商品: otRow, 言語: lang.その他言語.label, ...card("OT") });
  [jp, en, ot].forEach((id, i) => o.checkOneHistory(codes[i], id));
  // シード表「M0323-042-JP=日本語、M0323-042-EN=英語、M0323-042-OT=その他言語」「全履歴に変更後価格がある」を、作ったあとにDBの参照で確かめる
  // （違えば報告に出す）。カードセットはシード表が定めないので見ない
  ([[jpRow, "日本語"], [enRow, "英語"], [otRow, lang.その他言語.label]] as [商品行, string][]).forEach(([r, 言語]) => o.checkHistoryAttributes(r.商品コード, {
    言語, 変更後価格: { 基準価格: r.基準価格, 販売価格: r.販売価格, 買取価格: r.買取価格 },
  }));
  o.checkWordOwners("M0323-042-LANG", codes);
});
