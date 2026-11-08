/**
 * F06-08 入荷待ち商品一覧の続き（-b）の画面シード。正本: cases/F06-08_seed_data.tsv
 * 既存の seeds/f06-08.ts（会員・共有の設定・通知1件のシード）は変えず、そこの部品を使う。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロントの会員情報登録 → 管理画面で本会員を確かめて会員IDを控える（f06-08.ts の会員）。
 * 2. カード（カード商品があるシードだけ）: カード管理のカード新規登録画面で、詳細情報を必要な件数だけ追加して登録する。
 *    カードCSV登録は使わない（シード表がカード新規登録画面と定めている）。
 * 3. 商品: グッズ商品CSV登録で取り込み、商品マスターで商品IDを控える。カード商品は商品登録編集の「カード指定 >」でカード詳細を選んで登録する。
 *    取込で作られた規格は公開にして登録する（状態別称は規格登録編集で入れる）。追加の規格は商品規格一覧の「新規作成」。
 * 4. 入荷通知: フロントに会員でログインし、商品詳細の規格の「入荷通知」または「まとめて入荷通知」を押す。
 * 5. 高額商品コード: 通知を登録したあとで、規格登録編集画面で入れる（高額商品コードを持つ規格には通知ボタンが出ないため）。
 *
 * 決め打ちの識別の値（商品コード・商品名・カード名・メール）には実行の印を付ける（rc。依頼者決定 2026-10-28）。高額商品コードは値そのものがケースの対象なので印を付けない。
 * 画面に出ない番号（プレイヤーID・通知ID）は、DBの参照で読んで控える（書き込みはしない。F03-07・F06-08 と同じ扱い）。
 * 入荷通知登録上限数（共有の設定）は、通知を20件作るシードがあるので、作る前に20にし、ケースの終わりに控えた値へ戻す（f06-08.ts の 上限を20にする・上限を戻す）。
 *
 * 正本の外で補ったこと（記録にも書く）:
 * - 部門は選択肢の先頭、カードの詳細情報のセット・レアリティなどは選択肢の先頭（正本が任意の値と定める）。
 * - 20商品のシードでは、商品名のとおりにカード指定で書き換わった商品名を入れ直す（正本どおり）。
 * - 008 の「まとめて入荷通知」を押す1商品は、正本が「19商品のうち1商品」としか定めないので、2商品目にした。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品単位の依頼ID, 規格の依頼ID } from "../db/f03_07";
import { getSeed } from "../lib/catalog";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { imageFile } from "../pages/admin/f03_06_products";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, registerCard } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureCardset } from "../pages/admin/product_masters";
import { FRONT, FrontRestock } from "../pages/front/f03_07_restock_notify";
import { mailOf, passwordOf, 上限を20にする, 上限を戻す } from "./f06-08";
import { プレイヤーID } from "../db/f03_07";
import { 本会員を作る } from "./f06-member";
import { STATE_SP } from "./f03-07";
import "./f06-08";

// ---- 定義の型 ----

export type 規格の定義 = {
  /** 追加する規格の状態（商品規格登録編集の状態の選択肢の表示名）。取込で作られる1つ目の規格は書かない（ニアミント） */
  状態?: string;
  言語?: "日本語" | "英語";
  価格?: string;
  /** 状態別称（個別メモ）。取込で作られた規格の登録編集で入れる */
  メモ?: string;
};
export type 商品の定義 = {
  /** 正本の商品コード（商品名も同じ値）。実行の印はここで付ける */
  code: string;
  /** CSVの言語。省略すると日本語 */
  言語?: "日本語" | "英語";
  価格?: string;
  /** カードの何番目の詳細情報を指定するか。省略すると通常の商品（カード指定しない） */
  カード?: number;
  画像?: boolean;
  /** 1つ目が取込で作られる規格。2つ目以降は追加する規格 */
  規格?: 規格の定義[];
};
export type 通知の定義 = { 商品: number; 規格?: number; まとめて?: boolean; 言語?: "JP" | "EN" };
export type 段階の定義 = {
  /** この段階の最初に追加する規格（商品の番号と定義） */
  追加?: { 商品: number; 規格: 規格の定義 }[];
  通知?: 通知の定義[];
  /** この段階の最後に高額商品コードを入れる規格 */
  高額?: { 商品: number; 規格: number; コード: string }[];
};
export type シードの定義 = {
  シードID: string;
  番号: string;
  メール前半: string;
  氏名: string;
  パスワード: string;
  /** カードを登録するシードだけ */
  カード?: { Foil: "なし" | "通常"; 詳細数: number };
  商品: 商品の定義[];
  段階: 段階の定義[];
};

/** 会員を作り、会員ID・プレイヤーIDを控える（seeds/f06-08.ts の会員と同じ作り方） */
async function 会員(browser: Browser, notes: Notes, n: string, 前半: string, 名: string, パスワード: string): Promise<{ mail: string; password: string; id: string }> {
  const id = await 本会員を作る(browser, { 姓: "晴屋", 名, セイ: "ハレヤ", メイ: "シケン", 前半, パスワード });
  notes.set(`〔会員ID-F0608-${n}〕`, id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error(`会員 ${前半} のプレイヤーが見つからない`);
  notes.set(`〔プレイヤーID-F0608-${n}〕`, pid);
  return { mail: mailOf(前半), password: パスワード, id };
}

// ---- 実行中に控える結果（ケースの文の値 → 実際の値） ----

export type 作った結果 = {
  会員ID: string;
  mail: string;
  password: string;
  商品ID: string[];
  /** 商品ごとの規格ID（並びは 取込の規格 → 追加の規格 の順） */
  規格ID: string[][];
  カードID?: string;
  カード詳細IDs: string[];
  /** 商品画像を付けられたか（画像を要る商品だけ） */
  画像を付けられた: boolean[];
};
const built = new Map<string, 作った結果>();
export function 結果(番号: string): 作った結果 {
  const r = built.get(番号);
  if (!r) throw new Error(`F06-08 のシード ${番号} はまだ作っていない`);
  return r;
}

const stage = (m: string, seedId: string): void => reportSeedIssue(seedId, m);

async function 通知を登録する(browser: Browser, seedId: string, r: 作った結果, items: 通知の定義[]): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const front = new FrontRestock(page);
    await front.login(r.mail, r.password);
    for (const it of items) {
      const id = r.商品ID[it.商品];
      const url = `${FRONT}/products/detail/${id}${it.言語 ? `?lang=${it.言語}` : ""}`;
      const res = await page.goto(url);
      if ((res?.status() ?? 0) >= 400) throw new Error(`${seedId}: 商品ID ${id} の商品詳細画面が開けない（応答 ${res?.status()}）`);
      await page.waitForLoadState("load");
      if (it.まとめて) {
        if ((await front.bulkButton.count()) === 0) throw new Error(`${seedId}: 商品ID ${id} の商品詳細画面に「まとめて入荷通知」のボタンが無い`);
        const p = await front.press(front.bulkButton);
        if (!p.通知が出た) throw new Error(`${seedId}: 商品ID ${id} の「まとめて入荷通知」を押しても完了の通知が出ない（${JSON.stringify(p)}）`);
      } else {
        const cid = r.規格ID[it.商品][it.規格 ?? 0];
        const p = await front.press(front.classButton(cid));
        if (!p.通知が出た || !/設定/.test(p.通知の文)) throw new Error(`${seedId}: 商品規格ID ${cid} の「入荷通知」を押しても完了の通知が出ない（${JSON.stringify(p)}）`);
      }
    }
    stage(`会員 ${r.mail} が入荷通知を ${items.length} 件登録した`, seedId);
  } finally {
    await context.close();
  }
}

async function 作る(browser: Browser, notes: Notes, d: シードの定義): Promise<void> {
  const seedId = d.シードID;
  const issue = (m: string) => stage(m, seedId);
  // 20件の通知を作るシードがあるので、作る前に上限を20にする（ケースの終わりに控えた値へ戻す）
  await 上限を20にする(browser);
  try {
    const m = await 会員(browser, notes, d.番号, d.メール前半, d.氏名, d.パスワード);
    const r: 作った結果 = { 会員ID: m.id, mail: m.mail, password: m.password, 商品ID: [], 規格ID: [], カード詳細IDs: [], 画像を付けられた: [] };
    built.set(d.番号, r);
    const 商品名 = (p: 商品の定義) => rc(p.code);
    let cardName = "";

    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      // 2. カード
      if (d.カード) {
        const cardsetId = await ensureCardset(page, "F0608カードセット", "F0608 Card Set", "F0608S", issue);
        cardName = rc(`F0608-CARD-${d.番号}`);
        const c = await registerCard(page, { カード名日: cardName, カード名英: cardName, 点数で見たマナ: "1", コスト: "{1}", カードセットID: cardsetId, Foil: d.カード.Foil, 詳細数: d.カード.詳細数 }, `${seedId}: カード`, issue);
        r.カードID = c.カードID;
        r.カード詳細IDs = c.カード詳細IDs;
      }
      // 3. グッズ商品CSV登録
      const categoryId = await readExistingGoodsChildCategoryId(page);
      const 英語ID = d.商品.some((p) => p.言語 === "英語") ? await 英語の言語ID(page) : "";
      await registerGoodsCsv(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}.csv`, categoryId,
        lines: d.商品.map((p) => ({
          code: rc(p.code), nameJp: 商品名(p), nameEn: 商品名(p),
          values: { ...(p.価格 ? { "基準価格": p.価格, "販売価格": p.価格 } : {}), ...(p.言語 === "英語" ? { "言語(ID)": 英語ID } : {}), "地域別販売制限": "0", "スマレジ連携フラグ": "0" },
        })),
        onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
        uploadWaitMs: 180_000,
      });
      for (const [i, p] of d.商品.entries()) {
        const what = `${seedId}: ${p.code}`;
        const productId = await openProductEditByCode(page, rc(p.code));
        r.商品ID.push(productId);
        if (p.カード !== undefined) {
          const imgs = p.画像 ? [imageFile(`F0608-${p.code}`)] : undefined;
          let 画像失敗 = false;
          await assignCardOnProductEdit(page, { productId, cardNameJp: cardName, cardDetailId: r.カード詳細IDs[p.カード], productNameJp: 商品名(p), productNameEn: 商品名(p), images: imgs }, (x) => {
            if (x.includes("画像を追加できなかった")) 画像失敗 = true;
            issue(`${what}: ${x}`);
          });
          if (p.画像) r.画像を付けられた[i] = !画像失敗;
        } else if (p.画像) {
          throw new Error(`${what}: 画像つきのカード商品でない商品は未対応`);
        }
        const rows = await classRowsFromProductEdit(page, productId);
        if (rows.length !== 1) throw new Error(`${what}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
        r.規格ID.push([rows[0].商品規格ID]);
        await savePublishedClass(page, { productId, classId: rows[0].商品規格ID, memo: p.規格?.[0]?.メモ }, what, issue);
        for (const extra of (p.規格 ?? []).slice(1)) await 規格を足す(page, r, i, p, extra, seedId, issue);
      }
    });
    // 呼び名を控える（通知の前に控えられるもの）
    // 4・5. 段階ごとの追加・通知・高額商品コード
    const 通知の並び: 通知の定義[] = [];
    for (const [si, s] of d.段階.entries()) {
      if (s.追加?.length) {
        await withAdminSession(browser, SETUP_ADMIN, async (page) => {
          page.setDefaultTimeout(60_000);
          for (const a of s.追加!) await 規格を足す(page, r, a.商品, d.商品[a.商品], a.規格, seedId, issue);
        });
      }
      if (s.通知?.length) {
        await 通知を登録する(browser, `${seedId}(段階${si + 1})`, r, s.通知);
        通知の並び.push(...s.通知);
      }
      if (s.高額?.length) {
        await withAdminSession(browser, SETUP_ADMIN, async (page) => {
          page.setDefaultTimeout(60_000);
          for (const h of s.高額!) {
            await savePublishedClass(page, { productId: r.商品ID[h.商品], classId: r.規格ID[h.商品][h.規格], highPriceCode: h.コード }, `${seedId}: 高額商品コード ${h.コード}`, issue);
          }
        });
      }
    }
    noteLabels(seedId, notes, d, r, 通知の並び);
  } catch (e) {
    const back = await 上限を戻す(browser).catch((x) => `上限を戻せない: ${String(x)}`);
    if (back) issue(back);
    throw e;
  }
}

async function 規格を足す(page: import("@playwright/test").Page, r: 作った結果, 商品番号: number, p: 商品の定義, def: 規格の定義, seedId: string, issue: (m: string) => void): Promise<void> {
  await openClassList(page, r.商品ID[商品番号]);
  const id = await addClass(page, r.商品ID[商品番号], {
    言語: def.言語 ?? "日本語", 状態: def.状態 ?? STATE_SP, 商品コード: rc(p.code), 基準価格: def.価格 ?? "100", 販売価格: def.価格 ?? "100", 買取価格: "10",
  }, `${seedId}: ${p.code} の追加規格`, issue);
  r.規格ID[商品番号].push(id);
}

async function 英語の言語ID(page: import("@playwright/test").Page): Promise<string> {
  await page.goto(adminUrl("/product"));
  const choices = await page.locator('input[name^="admin_search_product[language]"]').evaluateAll((inputs) => inputs.map((node) => {
    const input = node as HTMLInputElement;
    return { id: input.value, label: input.labels?.item(0)?.textContent?.trim() ?? "" };
  }));
  const m = choices.filter((c) => c.label === "英語" && /^\d+$/.test(c.id));
  if (m.length !== 1) throw new Error(`英語の言語 ID を画面から一意に読めない: ${JSON.stringify(choices)}`);
  return m[0].id;
}

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える（英字の添え字は、商品・規格・通知の登録順） */
function noteLabels(seedId: string, notes: Notes, d: シードの定義, r: 作った結果, 通知: 通知の定義[]): void {
  const seed = getSeed(seedId);
  const flat = r.規格ID.flat();
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (notes.has(label)) continue;
    const m = /^〔(.+?)-F0608-(\d{3})([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, , suffix] = m;
    const idx = suffix ? suffix.charCodeAt(0) - 65 : 0;
    const need = <T,>(v: T | undefined, what: string): T => { if (v === undefined) throw new Error(`${seedId}: ${label} に当たる${what}が無い`); return v; };
    if (kind === "商品ID") notes.set(label, need(r.商品ID[idx], "商品"));
    else if (kind === "商品規格ID") notes.set(label, need(flat[idx], "商品規格"));
    else if (kind === "カード情報ID") notes.set(label, need(r.カード詳細IDs[idx], "カード詳細"));
    else if (kind === "カードID") notes.set(label, need(r.カードID, "カード"));
    else if (kind === "通知ID") {
      const it = need(通知[idx], "通知");
      if (!available) { notes.set(label, "（DB確認なし）"); continue; }
      const id = it.まとめて ? 商品単位の依頼ID(r.会員ID, r.商品ID[it.商品]) : 規格の依頼ID(r.会員ID, r.規格ID[it.商品][it.規格 ?? 0]);
      if (!id) throw new Error(`${seedId}: 通知を画面で登録したのに、DBの参照で通知が見つからない（${label}）`);
      notes.set(label, id);
    } else if (kind === "会員ID" || kind === "プレイヤーID") continue; // 会員の作り方で控え済み
    else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

// ---- シード表の1行 ＝ defineSeed 1つ ----

const NM: 規格の定義 = {};
const letters = (n: number): string[] => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

function 定義する(d: シードの定義): void {
  defineSeed(d.シードID, async ({ browser, notes }) => { await 作る(browser, notes, d); });
}

// 005: 規格単位通知2件（グッズ商品）＋ カード商品3つ目にまとめて入荷通知
定義する({
  シードID: "S-F06-08-BASIC-005", 番号: "005", メール前半: "f0608_basic-005", 氏名: "基本-005", パスワード: passwordOf("005"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: ["F0608-005A", "F0608-005B", "F0608-005C"].map((code, i) => ({ code, カード: i === 2 ? 0 : undefined })),
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }, { 商品: 1, 規格: 0 }, { 商品: 2, まとめて: true, 言語: "JP" }] }],
});

// 006: 20商品（19商品に規格単位通知・20商品目に商品・JP単位のまとめて入荷通知）
定義する({
  シードID: "S-F06-08-MAX20-006", 番号: "006", メール前半: "f0608_max20-006", 氏名: "上限20-006", パスワード: passwordOf("006"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: letters(20).map((c, i) => ({ code: `F0608-006${c}`, カード: i === 19 ? 0 : undefined })),
  段階: [{ 通知: [...letters(19).map((_, i): 通知の定義 => ({ 商品: i, 規格: 0 })), { 商品: 19, まとめて: true, 言語: "JP" }] }],
});

// 007: カード商品19件に規格単位通知19件（まとめては押さない）
const 十九 = Array.from({ length: 19 }, (_, i) => i);
定義する({
  シードID: "S-F06-08-LIMIT19-007", 番号: "007", メール前半: "f0608_limit19-007", 氏名: "上限19-007", パスワード: passwordOf("007"),
  カード: { Foil: "なし", 詳細数: 19 },
  商品: 十九.map((i) => ({ code: i === 0 ? "CARD-LIMIT19-007" : `CARD-LIMIT19-007-${String(i + 1).padStart(2, "0")}`, カード: i })),
  段階: [{ 通知: 十九.map((i): 通知の定義 => ({ 商品: i, 規格: 0 })) }],
});

// 008: カード商品19件（1商品目にSP規格を追加・SPの通知は押さない）＋ 規格単位通知19件とまとめて入荷通知1件
定義する({
  シードID: "S-F06-08-LIMIT20-008", 番号: "008", メール前半: "f0608_limit20-008", 氏名: "上限20-008", パスワード: passwordOf("008"),
  カード: { Foil: "なし", 詳細数: 19 },
  商品: 十九.map((i) => ({ code: i === 0 ? "CARD-LIMIT20-008" : `CARD-LIMIT20-008-${String(i + 1).padStart(2, "0")}`, カード: i, 規格: i === 0 ? [NM, { 状態: STATE_SP }] : undefined })),
  段階: [{ 通知: [...十九.map((i): 通知の定義 => ({ 商品: i, 規格: 0 })), { 商品: 1, まとめて: true, 言語: "JP" }] }],
});

// 012: JPとENの規格を持つカード商品。それぞれに規格単位通知
定義する({
  シードID: "S-F06-08-LANG-012", 番号: "012", メール前半: "f0608_display-012", 氏名: "表示-012", パスワード: passwordOf("012"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-LANG-012", カード: 0, 規格: [NM, { 状態: "ニアミント", 言語: "英語" }] }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0, 言語: "JP" }, { 商品: 0, 規格: 1, 言語: "EN" }] }],
});

// 013: 高額商品コードHP-A-013のNMとSP、HP-B-013のNM
定義する({
  シードID: "S-F06-08-GROUP-013", 番号: "013", メール前半: "f0608_display-013", 氏名: "表示-013", パスワード: passwordOf("013"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-GROUP-013", カード: 0, 規格: [NM, { 状態: STATE_SP }] }],
  段階: [
    { 通知: [{ 商品: 0, 規格: 0 }, { 商品: 0, 規格: 1 }], 高額: [{ 商品: 0, 規格: 0, コード: "HP-A-013" }, { 商品: 0, 規格: 1, コード: "HP-A-013" }] },
    { 追加: [{ 商品: 0, 規格: { 状態: "ニアミント" } }], 通知: [{ 商品: 0, 規格: 2 }], 高額: [{ 商品: 0, 規格: 2, コード: "HP-B-013" }] },
  ],
});

// 014: NM(価格1111)に通知あり、SP(価格2222)に通知なし
定義する({
  シードID: "S-F06-08-FILTER-014", 番号: "014", メール前半: "f0608_display-014", 氏名: "表示-014", パスワード: passwordOf("014"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-FILTER-014", カード: 0, 価格: "1111", 規格: [NM, { 状態: STATE_SP, 価格: "2222" }] }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 015: NMに状態別称「特記A」・SPは別称なし。どちらも高額商品コードHP-A-015
定義する({
  シードID: "S-F06-08-STATE-015", 番号: "015", メール前半: "f0608_display-015", 氏名: "表示-015", パスワード: passwordOf("015"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-GROUP-015", カード: 0, 規格: [{ メモ: "特記A" }, { 状態: STATE_SP }] }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }, { 商品: 0, 規格: 1 }], 高額: [{ 商品: 0, 規格: 0, コード: "HP-A-015" }, { 商品: 0, 規格: 1, コード: "HP-A-015" }] }],
});

// 016: NMの販売価格123456、高額商品コードHP-A-016
定義する({
  シードID: "S-F06-08-PRICE-016", 番号: "016", メール前半: "f0608_display-016", 氏名: "表示-016", パスワード: passwordOf("016"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-GROUP-016", カード: 0, 価格: "123456" }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }], 高額: [{ 商品: 0, 規格: 0, コード: "HP-A-016" }] }],
});

// 017: 商品画像なしの通常の商品
定義する({
  シードID: "S-F06-08-NOIMAGE-017", 番号: "017", メール前半: "f0608_display-017", 氏名: "画像無-017", パスワード: passwordOf("017"),
  商品: [{ code: "NOIMAGE-PRODUCT-017" }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 019: 商品画像ありのカード商品
定義する({
  シードID: "S-F06-08-IMAGE-LANG-019", 番号: "019", メール前半: "f0608_display-019", 氏名: "表示-019", パスワード: passwordOf("019"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-LANG-019", カード: 0, 画像: true }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 020: 商品画像ありのカード商品。規格に高額商品コードHP-Z-020
定義する({
  シードID: "S-F06-08-IMAGE-HIGH-020", 番号: "020", メール前半: "f0608_display-020", 氏名: "表示-020", パスワード: passwordOf("020"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "HIGH-PRODUCT-020", カード: 0, 画像: true }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }], 高額: [{ 商品: 0, 規格: 0, コード: "HP-Z-020" }] }],
});

// 021: ENのカード商品（EN・NM規格）
定義する({
  シードID: "S-F06-08-NAME-LANG-021", 番号: "021", メール前半: "f0608_display-021", 氏名: "表示-021", パスワード: passwordOf("021"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-LANG-021", 言語: "英語", カード: 0 }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0, 言語: "EN" }] }],
});

// 022: カードIDを控える
定義する({
  シードID: "S-F06-08-SAMECARD-022", 番号: "022", メール前半: "f0608_display-022", 氏名: "表示-022", パスワード: passwordOf("022"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-LANG-022", カード: 0 }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 023: カード情報の無い通常の商品
定義する({
  シードID: "S-F06-08-NONCARD-023", 番号: "023", メール前半: "f0608_display-023", 氏名: "表示-023", パスワード: passwordOf("023"),
  商品: [{ code: "NONCARD-PRODUCT-023" }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 025: カード商品2つ。1つ目は規格単位通知、2つ目は商品・JP単位のまとめて入荷通知
定義する({
  シードID: "S-F06-08-BUTTONS-025", 番号: "025", メール前半: "f0608_display-025", 氏名: "表示-025", パスワード: passwordOf("025"),
  カード: { Foil: "なし", 詳細数: 2 },
  商品: [{ code: "CARD-LANG-025", カード: 0 }, { code: "CARD-BULK-025", カード: 1 }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }, { 商品: 1, まとめて: true, 言語: "JP" }] }],
});

// 026: NMに通知あり、SPは追加しただけで通知なし
定義する({
  シードID: "S-F06-08-RELOAD-CLASS-026", 番号: "026", メール前半: "f0608_display-026", 氏名: "表示-026", パスワード: passwordOf("026"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-FILTER-026", カード: 0, 規格: [NM, { 状態: STATE_SP }] }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 027: 規格単位通知のみ（まとめては押さない）
定義する({
  シードID: "S-F06-08-RELOAD-BULK-027", 番号: "027", メール前半: "f0608_display-027", 氏名: "表示-027", パスワード: passwordOf("027"),
  カード: { Foil: "なし", 詳細数: 1 },
  商品: [{ code: "CARD-LANG-027", カード: 0 }],
  段階: [{ 通知: [{ 商品: 0, 規格: 0 }] }],
});

// 034〜037: Foilあり/なし × まとめて入荷通知あり/なし。商品名はカード指定のあと商品コードと同じ値に入れ直す
export const CB_パスワード = (n: string): string => `Passw0rd-CBF0608${n.padStart(3, "0")}`;
for (const [n, foil, bulk] of [["034", "通常", true], ["035", "通常", false], ["036", "なし", true], ["037", "なし", false]] as const) {
  定義する({
    シードID: `S-F06-08-CB${foil === "通常" ? "FOIL" : "NOFOIL"}${bulk ? "" : "NO"}BULK-${n}`, 番号: n, メール前半: `cbf0608-${n}`, 氏名: `組合せF0608-${n}`, パスワード: CB_パスワード(n),
    カード: { Foil: foil, 詳細数: 1 },
    商品: [{ code: `CARD-F0608-CB${n}`, カード: 0 }],
    段階: [{ 通知: [{ 商品: 0, 規格: 0 }, ...(bulk ? [{ 商品: 0, まとめて: true, 言語: "JP" } as 通知の定義] : [])] }],
  });
}
