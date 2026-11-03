/**
 * M14-04 カード詳細(登録・編集・削除) のシードの作り方（画面操作）。正本: cases/M14-04_seed_data.tsv
 * - 試験管理者・マスター: 画面で「あれば使い、無ければ登録する」。
 * - 画面で登録するカード: カード名(英)に実行ごとの印を付ける（検索・DB確認の鍵になるため。印の付け方は lib/run_marker.ts）。
 * - カードCSVで登録するカード（カード詳細IDが固定のもの）は、前の実行の残りが同じ詳細IDを持つと取り込めないので、
 *   先に詳細IDで探して（参照）、そのカードを画面の削除ボタンで消してから取り込む（試験専用の詳細IDのカードだけ）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { Notes } from "../lib/notes";
import { buildCardCsv, downloadCardCsvTemplate, uploadCardCsv } from "../pages/admin/card_csv";
import { CardSearchPage, ensureFormatByName, ensureMaster } from "../pages/admin/m14_card";
import { CardEditPage } from "../pages/admin/m14_04_card_edit";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { ensureCardset } from "../pages/admin/product_masters";
import {
  カードセットの英語名, カードセットのコード, カードの詳細, カードのリーガリティ, プロモの英語名, フォーマットの英語名, レアリティの英語名, レイアウトの英語名,
  詳細IDのカードID, 詳細の画像, カードの件数, カード名英でカードID,
} from "../db/m14_04_card";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1404_ADMIN: Account = { loginId: "m1404_admin", password: "Passw0rd!M1404" };
export const レアリティ = "試験レアリティ", レイアウト = "試験レイアウト", プロモ = "試験プロモ", カードセット = "試験カードセット";
export const 必須 = { レアリティ, レイアウト, プロモ種別: プロモ };

defineSeed("S-M14-04-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-04試験管理者", account: M1404_ADMIN, メール: "m1404_admin@example.test" });
});

defineSeed("S-M14-04-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const [名, 並び順] of [["FMT-STD", "9001"], ["FMT-MOD", "9002"], ["FMT-CMD", "9003"]]) {
      await ensureFormatByName(page, { 名日: 名, 名英: 名, コード: "", 並び順 }, seed.シードID, issue);
    }
    await ensureCardset(page, カードセット, カードセットの英語名(カードセット) ?? カードセット, カードセットのコード(カードセット) ?? "M1404SET", issue);
    await ensureMaster(page, "レアリティ", レアリティ, レアリティ, seed.シードID, "TR");
    await ensureMaster(page, "カードレイアウト", レイアウト, レイアウト, seed.シードID);
    await ensureMaster(page, "プロモーション", プロモ, プロモ, seed.シードID, "M1404PROMO");
    await ensureMaster(page, "カードタイプ", "試験カードタイプ", "試験カードタイプ", seed.シードID);
    await ensureMaster(page, "サブタイプ", "試験サブタイプ", "試験サブタイプ", seed.シードID);
    await ensureMaster(page, "特殊タイプ", "試験特殊タイプ", "試験特殊タイプ", seed.シードID);
  });
});

// ---------------------------------------------------------------------------
// カードの作り方
// ---------------------------------------------------------------------------

export type 画面カード = {
  日?: string; 英: string; マナ?: string; 詳細数: number;
  基本?: Parameters<CardEditPage["基本情報を入れる"]>[0];
  リーガリティ?: { フォーマット: string; リーガリティ: string }[];
  詳細ごと?: Parameters<CardEditPage["詳細を入れる"]>[1][];
};

/** カード詳細(登録)画面でカードを登録し、カードIDと詳細ID（追加した順）を返す */
export async function 画面でカードを作る(page: Page, v: 画面カード, what: string): Promise<{ カードID: string; 詳細IDs: string[] }> {
  const e = new CardEditPage(page);
  await e.openNew();
  await e.基本情報を入れる({ カード名日: v.日, カード名英: v.英, 点数で見たマナ: v.マナ ?? "2", ...(v.基本 ?? {}) });
  for (const r of v.リーガリティ ?? []) { const row = await e.リーガリティを追加する(); await e.リーガリティを選ぶ(row, r.フォーマット, r.リーガリティ); }
  for (let i = 0; i < v.詳細数; i++) {
    const det = await e.詳細情報を追加する();
    await e.必須を入れる(det, 必須);
    const extra = v.詳細ごと?.[i];
    if (extra) await e.詳細を入れる(det, extra);
  }
  const r = await e.登録を押す();
  const m = /\/card\/(\d+)\/edit/.exec(r.url);
  if (!r.sent || !m) throw new Error(`${what}: カードを登録できない（${r.url} ${(await e.通知()).join(" / ")}）`);
  return { カードID: m[1], 詳細IDs: await e.詳細IDs() };
}

/** 画面の削除ボタンで1件のカードを消す（試験で作ったカードだけに使う） */
export async function 画面でカードを消す(page: Page, カードID: string, what: string): Promise<void> {
  const e = new CardEditPage(page);
  await e.open(カードID);
  await e.削除を押す();
  await e.確認で実行する();
  if (カードの件数(カードID) !== 0) throw new Error(`${what}: カードID ${カードID} を削除できない（商品などに紐づく可能性）`);
}

/** 詳細IDが固定のカードを取り込む前に、前の実行の残りのカードを消す */
async function 残りを消す(page: Page, 詳細IDs: string[], what: string, issue: (m: string) => void): Promise<void> {
  const done = new Set<string>();
  for (const d of 詳細IDs) {
    const id = 詳細IDのカードID(d);
    if (id && !done.has(id)) {
      done.add(id);
      await 画面でカードを消す(page, id, what);
      issue(`前の実行で作ったカード（ID ${id}、詳細ID ${d}）を画面の削除ボタンで消してから取り込んだ`);
    }
  }
}

type CSV行 = { 日?: string; 英: string; 詳細ID?: string; 画像?: string; 使用可?: string; カード番号?: string };

/** カードCSVで1回取り込む。マスターは英語名で引かれるので、日本語名から英語名を引いて書く */
async function CSVで取り込む(page: Page, 行: CSV行[], file: string, what: string, issue: (m: string) => void): Promise<void> {
  const need = (v: string | null, n: string) => { if (!v) throw new Error(`${what}: ${n}の英語名を引けない（マスターのシードが未作成）`); return v; };
  const r = need(レアリティの英語名(レアリティ), "レアリティ"), l = need(レイアウトの英語名(レイアウト), "レイアウト"), p = need(プロモの英語名(プロモ), "プロモ種別");
  const headers = await downloadCardCsvTemplate(page);
  const csv = buildCardCsv(headers, 行.map((x, i) => ({
    name_jp: x.日 ?? "", name_en: x.英, cmc: "2", rarity: r, layout: l, promotion_type: p, foil: "0", frame: "Normal",
    image_en: x.画像 ?? `img/m1404/${file}-${i + 1}.jpg`, ...(x.詳細ID ? { card_detail_id: x.詳細ID } : {}),
    ...(x.使用可 ? { format: need(フォーマットの英語名(x.使用可), x.使用可), set: need(カードセットの英語名(カードセット), "カードセット") } : {}),
    ...(x.カード番号 ? { card_no: x.カード番号 } : {}),
  })));
  await uploadCardCsv(page, csv, `${file}.csv`, `${what} のカードCSV登録`, issue);
}

const 英字 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---------------------------------------------------------------------------
// 共有: 読み取り用の基本カード（CSV）
// ---------------------------------------------------------------------------

defineSeed("S-M14-04-BASE-READ", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 揃っている = (): boolean => {
      const c = 詳細IDのカードID("240401");
      if (!c || 詳細IDのカードID("240402") !== c) return false;
      const d = カードの詳細(c);
      return d.length === 2 && d[0].コレクターNo === "BASE-001" && d[1].コレクターNo === "BASE-002" && カードのリーガリティ(c).length === 1
        && 詳細の画像("240401")[0]?.言語 === "日本語" && 詳細の画像("240402")[0]?.言語 === "日本語";
    };
    if (!揃っている()) {
      await 残りを消す(page, ["240401", "240402"], seed.シードID, issue);
      await CSVで取り込む(page, [
        { 日: "編集前カード", 英: "BeforeCard", 詳細ID: "240401", 画像: "img/m1404/base-read-1.jpg", 使用可: "FMT-STD" },
        { 日: "編集前カード", 英: "BeforeCard", 詳細ID: "240402", 画像: "img/m1404/base-read-2.jpg", 使用可: "FMT-STD" },
      ], "m1404-base-read", seed.シードID, issue);
      const id = 詳細IDのカードID("240401");
      if (!id) throw new Error(`${seed.シードID}: 取り込んだカードが見つからない`);
      const e = new CardEditPage(page);
      await e.open(id);
      await e.詳細を入れる(e.詳細("240401"), { コレクターNo: "BASE-001" });
      await e.詳細を入れる(e.詳細("240402"), { コレクターNo: "BASE-002" });
      for (const d of ["240401", "240402"]) {
        const lang = e.画像言語(e.詳細(d)).first();
        await lang.selectOption({ label: "日本語" });
      }
      const r = await e.登録を押す();
      if (!r.sent) throw new Error(`${seed.シードID}: カードを更新できない`);
      if (!揃っている()) throw new Error(`${seed.シードID}: 取り込み後もカードが期待の状態にならない`);
    }
  });
  const id = 詳細IDのカードID("240401")!;
  notes.set("〔カードID-M1404-共有〕", id);
  notes.set("〔リーガリティID-M1404-共有〕", カードのリーガリティ(id)[0].リーガリティID);
  notes.set("〔画像ID-M1404-共有A〕", 詳細の画像("240401")[0].画像ID);
  notes.set("〔画像ID-M1404-共有B〕", 詳細の画像("240402")[0].画像ID);
});

defineSeed("S-M14-04-ABSENT", async () => {
  // カードID 999999 のカードが無いこと（あれば画面で消す）。ここでは参照で確かめるだけ
  if (カードの件数("999999") !== 0) throw new Error("S-M14-04-ABSENT: カードID 999999 のカードがある");
});
defineSeed("S-M14-04-LIST", async () => { /* 表示件数10件は一覧の既定。ケースの中で一覧の表示件数を確かめる */ });
defineSeed("S-M14-04-SESSION", async () => { /* 新しいブラウザセッションでログインする（ケースがログインから始める） */ });

// ---------------------------------------------------------------------------
// ケース専用: 画面で登録するカード
// ---------------------------------------------------------------------------

type 専用 = { id: string; n: string; 日: string; 英: string; 詳細数?: number; リーガリティ?: boolean; 基本?: 画面カード["基本"]; 詳細ごと?: 画面カード["詳細ごと"]; 後で?: (page: Page, ids: { カードID: string; 詳細IDs: string[] }) => Promise<void> };
const 専用カード: 専用[] = [
  { id: "BASE-008", n: "008", 日: "編集前カード-008", 英: "BeforeCard-008" },
  {
    id: "BASE-016", n: "016", 日: "編集前カード-016", 英: "BeforeCard-016",
    基本: { アリーナ名日: "編集前アリーナ-016", アリーナ名英: "BeforeArena-016", ルールテキスト日: "編集前ルール-016", ルールテキスト英: "Before rule-016", マナ・コスト: "{1}", パワー: "2", タフネス: "3", 忠誠度: "4" },
    詳細ごと: [{ コレクターNo: "OPT-016", ルールテキスト日: "詳細ルール-016", ルールテキスト英: "Detail rule-016", パワー: "2", タフネス: "3", フレーバー日: "詳細フレーバー-016", フレーバー英: "Detail flavor-016", カードセット }],
    後で: async (page, ids) => {
      const e = new CardEditPage(page);
      await e.open(ids.カードID);
      await e.詳細を入れる(e.詳細(ids.詳細IDs[0]), { 裏面カード詳細ID: ids.詳細IDs[1] });
      const r = await e.登録を押す();
      if (!r.sent) throw new Error("S-M14-04-BASE-016: 裏面カード詳細IDを保存できない");
    },
  },
  { id: "BASE-017", n: "017", 日: "編集前カード-017", 英: "BeforeCard-017", 詳細ごと: [{ コレクターNo: "BASE-001-017" }] },
  { id: "BASE-023", n: "023", 日: "編集前カード-023", 英: "BeforeCard-023" },
  { id: "BASE-024", n: "024", 日: "編集前カード-024", 英: "BeforeCard-024", リーガリティ: true },
  { id: "BASE-025", n: "025", 日: "編集前カード-025", 英: "BeforeCard-025", リーガリティ: true },
  { id: "BASE-026", n: "026", 日: "編集前カード-026", 英: "BeforeCard-026" },
  { id: "BASE-040", n: "040", 日: "編集前カード-040", 英: "BeforeCard-040" },
  { id: "BASE-054", n: "054", 日: "カード詳細ID表示カード-054", 英: "M1404-054-Card" },
  { id: "BASE-065", n: "065", 日: "M1404-065-カード", 英: "M1404-065-Card", 詳細数: 1 },
  { id: "CBPLAIN-070", n: "070", 日: "削除可能カード-M1404-070", 英: "PlainDeleteCardM1404-070", 詳細数: 1 },
];
for (const c of 専用カード) {
  defineSeed(`S-M14-04-${c.id}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const r = await 画面でカードを作る(page, {
        日: c.日, 英: rc(c.英), 詳細数: c.詳細数 ?? 2, 基本: c.基本, 詳細ごと: c.詳細ごと,
        リーガリティ: c.リーガリティ ? [{ フォーマット: "FMT-STD", リーガリティ: "使用可" }] : undefined,
      }, seed.シードID);
      if (c.後で) await c.後で(page, r);
      notes.set(`〔カードID-M1404-${c.n}〕`, r.カードID);
      // 詳細情報が1件のカードは、シード表が詳細IDを控えると定めていないので控えない
      if (r.詳細IDs.length > 1) r.詳細IDs.forEach((d, i) => notes.set(`〔カード詳細ID-M1404-${c.n}${英字[i]}〕`, d));
      if (c.リーガリティ) notes.set(`〔リーガリティID-M1404-${c.n}〕`, カードのリーガリティ(r.カードID)[0].リーガリティID);
    });
  });
}

// 新規登録のケース: 同じ名前のカードが0件であること（実行ごとの印を付けるので前の実行のカードとは重ならない）
for (const id of ["NEW-020", "NEW-021", "NEW-058", "NEW-064"]) defineSeed(`S-M14-04-${id}`, async () => { /* 実行ごとの印つきの名前で登録するので、同名のカードは0件 */ });

// マスターに値を足すシード（共有。あれば使う）
async function マスター(browser: Browser, seedId: string, 追加: { 種別: Parameters<typeof 行を用意する>[1]; 名: string; 英?: string }[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const a of 追加) await 行を用意する(page, a.種別, a.名, a.英 ?? a.名, seedId);
  });
}
defineSeed("S-M14-04-NEW-049", async ({ browser, seed }) => { await マスター(browser, seed.シードID, [{ 種別: "カラー", 名: "M1404-049-A" }, { 種別: "カラー", 名: "M1404-049-B" }]); });
defineSeed("S-M14-04-NEW-050", async () => { /* 固有色の選択肢（白・青・黒・赤・緑・無色）は元からある */ });
defineSeed("S-M14-04-NEW-052", async ({ browser, seed }) => { await マスター(browser, seed.シードID, [{ 種別: "色順", 名: "M1404-052-A" }, { 種別: "色順", 名: "M1404-052-B" }]); });
defineSeed("S-M14-04-NEW-053", async ({ browser, seed }) => { await マスター(browser, seed.シードID, [{ 種別: "イラストレーター", 名: "M1404-053-A" }, { 種別: "イラストレーター", 名: "M1404-053-B" }]); });
defineSeed("S-M14-04-NEW-060", async ({ browser, seed }) => {
  await マスター(browser, seed.シードID, [
    { 種別: "カードタイプ", 名: "M1404-060-TA" }, { 種別: "カードタイプ", 名: "M1404-060-TB" },
    { 種別: "サブタイプ", 名: "M1404-060-SA" }, { 種別: "サブタイプ", 名: "M1404-060-SB" },
    { 種別: "特殊タイプ", 名: "M1404-060-XA" }, { 種別: "特殊タイプ", 名: "M1404-060-XB" },
  ]);
});

// ---------------------------------------------------------------------------
// ケース専用: カードCSVで登録するカード（詳細IDが固定）
// ---------------------------------------------------------------------------

const CSV専用: { id: string; n: string; 日: string; 英: string; 詳細ID: string[]; 後で?: (page: Page, 詳細ID: string[]) => Promise<void>; 番号?: boolean }[] = [
  {
    id: "BASE-022", n: "022", 日: "編集前カード-022", 英: "BeforeCard-022", 詳細ID: ["240401022", "240402022"],
    後で: async (page, ids) => {
      const e = new CardEditPage(page);
      await e.open(詳細IDのカードID(ids[0])!);
      await e.詳細を入れる(e.詳細(ids[0]), { コレクターNo: "BASE-001-022" });
      for (const d of ids) await e.画像言語(e.詳細(d)).first().selectOption({ label: "日本語" });
      const r = await e.登録を押す();
      if (!r.sent) throw new Error("S-M14-04-BASE-022: 詳細情報を保存できない");
    },
  },
  { id: "BASE-027", n: "027", 日: "編集前カード-027", 英: "BeforeCard-027", 詳細ID: ["240401027", "240402027"] },
  { id: "BASE-029", n: "029", 日: "編集前カード-029", 英: "BeforeCard-029", 詳細ID: ["240401029", "240402029"] },
  { id: "PLAIN-DELETE-032", n: "032", 日: "削除可能カード-032", 英: "PlainDeleteCard-032", 詳細ID: ["240406032"] },
  { id: "PLAIN-DELETE-061", n: "061", 日: "削除可能カード-M1404-061", 英: "M1404-061-Card", 詳細ID: ["240407061", "240408061"] },
  { id: "CBBASE-071", n: "071", 日: "編集前カード-M1404-071", 英: "BeforeCardM1404-071", 詳細ID: ["240401071", "240402071"] },
];
for (const c of CSV専用) {
  defineSeed(`S-M14-04-${c.id}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 残りを消す(page, c.詳細ID, seed.シードID, issue);
      await CSVで取り込む(page, c.詳細ID.map((d, i) => ({ 日: c.日, 英: c.英, 詳細ID: d, 画像: c.id === "BASE-029" ? `img/m1404/029-${i + 1}.jpg` : undefined })), `m1404-${c.n}`, seed.シードID, issue);
      if (c.後で) await c.後で(page, c.詳細ID);
    });
    const id = 詳細IDのカードID(c.詳細ID[0]);
    if (!id) throw new Error(`${seed.シードID}: 取り込んだカードが見つからない`);
    notes.set(`〔カードID-M1404-${c.n}〕`, id);
    const imgs = c.詳細ID.map((d) => 詳細の画像(d)[0]?.画像ID).filter(Boolean);
    if (c.n === "027" || c.n === "029") { notes.set(`〔画像ID-M1404-${c.n}A〕`, imgs[0]); notes.set(`〔画像ID-M1404-${c.n}B〕`, imgs[1]); }
    if (c.n === "032") notes.set("〔カード画像ID-M1404-032〕", imgs[0]);
    if (c.n === "061") { notes.set("〔カード画像ID-M1404-061A〕", imgs[0]); notes.set("〔カード画像ID-M1404-061B〕", imgs[1]); }
  });
}

// ---------------------------------------------------------------------------
// ケース専用: 一覧の2ページ目に出る12件
// ---------------------------------------------------------------------------

/** 12件を登録順に作る（1件目が一覧のID降順で2ページ目に出る）。検索語は実行の印つき */
async function 十二件を画面で作る(browser: Browser, notes: Notes, seedId: string, 語: string, 呼び名: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (let i = 1; i <= 12; i++) {
      const nn = String(i).padStart(2, "0");
      await 画面でカードを作る(page, { 日: `${語}-${nn}`, 英: `${語}-${nn}-Card`, 詳細数: 1 }, seedId);
    }
    const l = new CardSearchPage(page);
    await l.open();
    await l.キーワードで検索する(語);
    const n = (await l.検索結果件数()) ?? 0;
    if (n !== 12) throw new Error(`${seedId}: 検索語「${語}」で ${n} 件出た（12件のはず）`);
    for (const i of [1, 2, 12]) notes.set(`〔カードID-M1404-${呼び名}${英字[i - 1]}〕`, カード名英でカードID(`${語}-${String(i).padStart(2, "0")}-Card`)[0]);
  });
}
defineSeed("S-M14-04-SEARCH-031", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => { await 十二件を画面で作る(browser, notes, seed.シードID, rc("検索保持-031"), "031"); });
defineSeed("S-M14-04-SEARCH-035", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => { await 十二件を画面で作る(browser, notes, seed.シードID, rc("検索保持-035"), "035"); });
defineSeed("S-M14-04-CBSEARCH-067", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 語 = rc("CbSearchM1404-067");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 行 = Array.from({ length: 12 }, (_, i) => ({ 日: `CB検索M1404-067-${String(i + 1).padStart(2, "0")}`, 英: `${語}-${String(i + 1).padStart(2, "0")}` }));
    await CSVで取り込む(page, 行.slice(0, 1), "m1404-067-a", seed.シードID, issue);
    await CSVで取り込む(page, 行.slice(1), "m1404-067-b", seed.シードID, issue);
    const l = new CardSearchPage(page);
    await l.open();
    await l.キーワードで検索する(語);
    if ((await l.検索結果件数()) !== 12) throw new Error(`${seed.シードID}: 検索語で12件出ない`);
    for (const i of [1, 2, 12]) notes.set(`〔カードID-M1404-067${英字[i - 1]}〕`, カード名英でカードID(`${語}-${String(i).padStart(2, "0")}`)[0]);
  });
});
