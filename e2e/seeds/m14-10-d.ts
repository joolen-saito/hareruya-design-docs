/**
 * M14-10 フォーマット詳細(登録・編集・削除) のシードの作り方（画面操作）その4。正本: cases/M14-10_seed_data.tsv
 * 連携確認用（デッキ検索・イベント一覧・ハイランダーのアラート）と、デッキが紐づく削除制約のシード。
 * - 名称には実行の印を付ける（前の実行の残りと重ならない）。値そのものを確かめるケースではない。
 * - シード表が「含め」と書くチェック項目は、状態の欄の「未選択」を優先し、フォーマット登録では何も選ばない（ケースの手順で選ぶ）。
 * - 公開のイベントデッキの開催日は、ケース実行日の3日前。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { フォーマットを登録する, フォーマット入力 } from "../pages/admin/m14_10_format";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { デッキを登録する, 公開用 } from "../pages/admin/m15_deck";
import { 大会を登録する } from "../pages/admin/f07_04_setup";
import { 実行日から } from "../pages/admin/f07_01_setup";
import { CardEditPage } from "../pages/admin/m14_04_card_edit";
import { 必須 } from "./m14-04";

type Issue = (m: string) => void;
type 登録済み = { id: string; 名日: string };

async function 形式を作る(page: Page, 基: string, 英: string, v: Partial<フォーマット入力>, what: string): Promise<登録済み> {
  const 名日 = rc(基);
  const id = await フォーマットを登録する(page, { 名日, 名英: rc(英), 並び順: "70", メタ日数: "14", ...v }, what);
  return { id, 名日 };
}

/** 試験基準日（ケース実行日）の3日前の開催日（日時欄の値） */
export const 三日前 = (): string => 実行日から(-3, "10:00").replace(" ", "T");

/** 公開のアーキタイプ1件と、試験基準日の3日前の公開中イベントデッキ1件を、フォーマットに紐づけて作る */
export async function 公開デッキを作る(page: Page, 番号: string, 形式: 登録済み, issue: Issue, メイン?: string): Promise<string> {
  const arch = await アーキタイプを登録する(page, { 名日: `連携確認アーキタイプ-${番号}`, 名英: `LinkArchetype${番号.replace(/[^0-9A-Za-z]/g, "")}`, フォーマット: 形式.名日 }, issue);
  return デッキを登録する(page, {
    デッキ名: rc(`連携確認デッキ-${番号}`), デッキタイプ: "event", フォーマット: 形式.名日, アーキタイプ: arch,
    ...公開用(`連携確認-${番号}`), 開催日: 三日前(), ...(メイン ? { メイン } : {}),
  }, issue);
}

/** カード詳細(登録)画面でカードを登録する（カードタイプは土地以外、または基本土地のレアリティ。指定のフォーマットで使用可） */
export async function カードを登録する(page: Page, v: { 日: string; 英: string; フォーマット?: string; 基本土地?: boolean; カードタイプ?: string; 特殊タイプ?: string }, what: string): Promise<string> {
  const e = new CardEditPage(page);
  await e.openNew();
  await e.基本情報を入れる({ カード名日: rc(v.日), カード名英: rc(v.英), 点数で見たマナ: "0" });
  if (!v.基本土地 || v.カードタイプ) await page.locator('select[name="admin_card[cardtypes][]"]').selectOption({ label: v.カードタイプ ?? "クリーチャー" });
  if (v.特殊タイプ) await page.locator('select[name="admin_card[specialtypes][]"]').selectOption({ label: v.特殊タイプ });
  if (v.フォーマット) { const row = await e.リーガリティを追加する(); await e.リーガリティを選ぶ(row, v.フォーマット, "使用可"); }
  const det = await e.詳細情報を追加する();
  await e.必須を入れる(det, 必須);
  if (v.基本土地) await e.詳細を入れる(det, { レアリティ: "基本土地" });
  const r = await e.登録を押す();
  const m = /\/card\/(\d+)\/edit/.exec(r.url);
  if (!r.sent || !m) throw new Error(`${what}: カード「${v.日}」を登録できない（${r.url} ${(await e.通知()).join(" / ")}）`);
  return m[1];
}

const 管理 = async (browser: Parameters<Parameters<typeof defineSeed>[2]>[0]["browser"], f: (page: Page) => Promise<void>) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await f(page); });
};

// ---- フォーマットだけ（デッキ検索条件・商品検索条件に出る） ----
for (const [n, 検索] of [["025", "searchFlg"], ["026", "productSearchFlg"]] as const) {
  defineSeed(`S-M14-10-DOWNSTREAM-${n}`, async ({ browser, notes, seed }) => {
    await 管理(browser, async (page) => {
      const f = await 形式を作る(page, `連携確認フォーマット-${n}`, `Integration Link Format-${n}`, { コード: `LINK-${n}`, チェック: { [検索]: false } }, seed.シードID);
      notes.set(`〔フォーマットID-M1410-${n}〕`, f.id);
    });
  });
}

// ---- フォーマット＋公開アーキタイプ＋3日前の公開イベントデッキ ----
const デッキつき: { id: string; n: string; 基: string; 英: string; チェック: フォーマット入力["チェック"]; 番号: string }[] = [
  { id: "DOWNSTREAM-027", n: "027", 基: "連携確認フォーマット-027", 英: "Integration Link Format-027", チェック: { rankingFlg: false, OtherMetaFlg: false }, 番号: "027" },
  { id: "DOWNSTREAM-028", n: "028", 基: "連携確認フォーマット-028", 英: "Integration Link Format-028", チェック: { rankingFlg: false, OtherMetaFlg: false }, 番号: "028" },
  { id: "DOWNSTREAM-029", n: "029", 基: "連携確認フォーマット-029", 英: "Integration Link Format-029", チェック: { rankingFlg: false, OtherMetaFlg: false }, 番号: "029" },
  { id: "DPRANK-063", n: "063", 基: "連携確認フォーマット-063", 英: "M1410-063-Fmt", チェック: { rankingFlg: false, OtherMetaFlg: false }, 番号: "063" },
  { id: "CBRANKMETA-075", n: "075", 基: "連携確認フォーマット-CB075", 英: "M1410-CB075-Fmt", チェック: { rankingFlg: false, OtherMetaFlg: false }, 番号: "CB075" },
];
for (const d of デッキつき) {
  defineSeed(`S-M14-10-${d.id}`, async ({ browser, notes, seed }) => {
    await 管理(browser, async (page) => {
      const f = await 形式を作る(page, d.基, d.英, { チェック: d.チェック }, seed.シードID);
      notes.set(`〔フォーマットID-M1410-${d.n}〕`, f.id);
      await 公開デッキを作る(page, d.番号, f, (m) => reportSeedIssue(seed.シードID, m));
    });
  });
}

// ---- 削除制約: デッキが1件だけ紐づくフォーマット ----
defineSeed("S-M14-10-DELETE-DECK-047", async ({ browser, notes, seed }) => {
  await 管理(browser, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const f = await 形式を作る(page, "デッキ使用中形式-047", "Deck Format-047", { 並び順: "82" }, seed.シードID);
    notes.set("〔フォーマットID-M1410-047〕", f.id);
    const 別 = await 形式を作る(page, "削除制約の補助形式-047", "Deck Helper Format-047", { 並び順: "82" }, seed.シードID);
    const arch = await アーキタイプを登録する(page, { 名日: "削除制約の補助アーキタイプ-047", 名英: "DeleteHelperArchetype047", フォーマット: 別.名日 }, issue);
    await デッキを登録する(page, { デッキ名: rc("削除制約デッキ-047"), デッキタイプ: "event", フォーマット: f.名日, アーキタイプ: arch, アーキタイプのフォーマット: 別.名日, 公開状態: "非公開" }, issue);
  });
});

// ---- ハイランダー: カードとアーキタイプ（デッキは、ケースの手順で登録する） ----
const ハイランダー: { id: string; n: string; カード: { 日: string; 英: string; 基本土地?: boolean }[] }[] = [
  { id: "DOWNSTREAM-039", n: "039", カード: [{ 日: "重複試験カード-039", 英: "M1410-039-CardX" }] },
  { id: "DPHL-065", n: "065", カード: [{ 日: "単独試験カードA-065", 英: "M1410-065-CardA" }, { 日: "単独試験カードB-065", 英: "M1410-065-CardB" }] },
  { id: "DPHL-066", n: "066", カード: [{ 日: "重複試験カード-066", 英: "M1410-066-CardX" }] },
  { id: "DPHL-067", n: "067", カード: [{ 日: "重複基本土地-067", 英: "M1410-067-CardX", 基本土地: true }] },
];
for (const h of ハイランダー) {
  defineSeed(`S-M14-10-${h.id}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await 管理(browser, async (page) => {
      const issue = (m: string) => reportSeedIssue(seed.シードID, m);
      const f = await 形式を作る(page, `連携確認フォーマット-${h.n}`, h.n === "039" ? `Integration Link Format-${h.n}` : `M1410-${h.n}-Fmt`, {}, seed.シードID);
      notes.set(`〔フォーマットID-M1410-${h.n}〕`, f.id);
      for (const c of h.カード) await カードを登録する(page, { ...c, フォーマット: f.名日 }, seed.シードID);
      await アーキタイプを登録する(page, { 名日: `連携確認アーキタイプ-${h.n}`, 名英: `LinkArchetype${h.n}`, フォーマット: f.名日 }, issue);
    });
  });
}

// ---- イベント一覧: フォーマットを紐づけた公開中のイベント ----
async function イベントつき形式(page: Page, 基: string, 英: string, 表示: boolean, イベント名: string, what: string): Promise<登録済み> {
  const f = await 形式を作る(page, 基, 英, { チェック: { isShownInEvent: 表示 } }, what);
  await 大会を登録する(page, { イベント名: rc(イベント名), フォーマット: f.名日, 日程: [{ 受付: "中", 定員: "10", 参加費: "0" }] });
  return f;
}
for (const [id, n] of [["EVENTS-034", "034"], ["EVENTS-035", "035"]] as const) {
  defineSeed(`S-M14-10-${id}`, async ({ browser, notes, seed }) => {
    await 管理(browser, async (page) => {
      const A = await イベントつき形式(page, `連携確認フォーマット-${n}`, `Link Event Format ${n}A`, false, `連携イベントA-${n}`, seed.シードID);
      const B = await イベントつき形式(page, `イベント非表示フォーマット-${n}`, `Link Event Hidden ${n}B`, false, `連携イベントB-${n}`, seed.シードID);
      notes.set(`〔フォーマットID-M1410-${n}A〕`, A.id);
      notes.set(`〔フォーマットID-M1410-${n}B〕`, B.id);
    });
  });
}
defineSeed("S-M14-10-EVENTS-057", async ({ browser, notes, seed }) => {
  await 管理(browser, async (page) => {
    const A = await イベントつき形式(page, "イベント表示確認フォーマット-057", "Event Shown Format 057", true, "表示確認イベントA-057", seed.シードID);
    const B = await イベントつき形式(page, "イベント非表示確認フォーマット-057", "Event Hidden Format 057", false, "表示確認イベントB-057", seed.シードID);
    notes.set("〔フォーマットID-M1410-057A〕", A.id);
    notes.set("〔フォーマットID-M1410-057B〕", B.id);
  });
});


// ---- 公開側のデッキの画面・採用枚数・メタゲーム: 3日前／30日前の公開中イベントデッキ ----
export const 日前 = (n: number): string => 実行日から(-n, "10:00").replace(" ", "T");

/** 公開のイベントデッキを、n日前の開催日で登録する（アーキタイプ名は登録済みのもの） */
export async function 公開デッキをn日前に作る(page: Page, v: { 番号: string; デッキ名: string; 形式: string; アーキタイプ: string; 日前: number; メイン?: string }, issue: Issue): Promise<string> {
  return デッキを登録する(page, {
    デッキ名: rc(v.デッキ名), デッキタイプ: "event", フォーマット: v.形式, アーキタイプ: v.アーキタイプ,
    ...公開用(`連携確認-${v.デッキ名}`), 開催日: 日前(v.日前), ...(v.メイン ? { メイン: v.メイン } : {}),
  }, issue);
}

// 031: ARENA導入済 → 日本語テキスト
defineSeed("S-M14-10-DOWNSTREAM-031", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 管理(browser, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const f = await 形式を作る(page, "連携確認フォーマット-031", "Integration Link Format-031", { チェック: { ArenaLegalFlg: false } }, seed.シードID);
    notes.set("〔フォーマットID-M1410-031〕", f.id);
    await カードを登録する(page, { 日: "日英カード-031", 英: "Bilingual Card-031" }, seed.シードID);
    const arch = await アーキタイプを登録する(page, { 名日: "連携確認アーキタイプ-031", 名英: "LinkArchetype031", フォーマット: f.名日 }, issue);
    await 公開デッキをn日前に作る(page, { 番号: "031", デッキ名: "連携確認デッキ-031", 形式: f.名日, アーキタイプ: arch, 日前: 3, メイン: `4 ${rc("日英カード-031")}` }, issue);
  });
});

// 032: 基本土地を含める
defineSeed("S-M14-10-DOWNSTREAM-032", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 管理(browser, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const f = await 形式を作る(page, "連携確認フォーマット-032", "Integration Link Format-032", { チェック: { IncludeBasicFlg: false } }, seed.シードID);
    notes.set("〔フォーマットID-M1410-032〕", f.id);
    await カードを登録する(page, { 日: "基本土地テスト-032", 英: "BasicLandTest032", カードタイプ: "土地", 特殊タイプ: "基本" }, seed.シードID);
    const arch = await アーキタイプを登録する(page, { 名日: "連携確認アーキタイプ-032", 名英: "LinkArchetype032", フォーマット: f.名日 }, issue);
    await 公開デッキをn日前に作る(page, { 番号: "032", デッキ名: "連携確認デッキ-032", 形式: f.名日, アーキタイプ: arch, 日前: 3, メイン: `4 ${rc("基本土地テスト-032")}` }, issue);
  });
});

// 036・037: 分析日数（分析内カード＝3日前に4枚、分析外カード＝30日前に40枚）
for (const n of ["036", "037"]) {
  defineSeed(`S-M14-10-ANALYTICS-${n}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await 管理(browser, async (page) => {
      const issue = (m: string) => reportSeedIssue(seed.シードID, m);
      const f = await 形式を作る(page, `連携確認フォーマット-${n}`, `Integration Link Format-${n}`, n === "036" ? { チェック: { rankingFlg: false } } : {}, seed.シードID);
      notes.set(`〔フォーマットID-M1410-${n}〕`, f.id);
      await カードを登録する(page, { 日: `分析内カード-${n}`, 英: `InsideCard${n}` }, seed.シードID);
      await カードを登録する(page, { 日: `分析外カード-${n}`, 英: `OutsideCard${n}` }, seed.シードID);
      const arch = await アーキタイプを登録する(page, { 名日: `連携確認アーキタイプ-${n}`, 名英: `LinkArchetype${n}`, フォーマット: f.名日 }, issue);
      await 公開デッキをn日前に作る(page, { 番号: n, デッキ名: `分析内デッキ-${n}`, 形式: f.名日, アーキタイプ: arch, 日前: 3, メイン: `4 ${rc(`分析内カード-${n}`)}` }, issue);
      await 公開デッキをn日前に作る(page, { 番号: n, デッキ名: `分析外デッキ-${n}`, 形式: f.名日, アーキタイプ: arch, 日前: 30, メイン: `40 ${rc(`分析外カード-${n}`)}` }, issue);
    });
  });
}

// 038: アーキタイプ別のデッキ数（3日前に2件・30日前に8件）
defineSeed("S-M14-10-ANALYTICS-038", async ({ browser, notes, seed }) => {
  await 管理(browser, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const f = await 形式を作る(page, "連携確認フォーマット-038", "Integration Link Format-038", {}, seed.シードID);
    notes.set("〔フォーマットID-M1410-038〕", f.id);
    const 内 = await アーキタイプを登録する(page, { 名日: "分析内アーキタイプ-038", 名英: "InsideArchetype038", フォーマット: f.名日 }, issue);
    const 外 = await アーキタイプを登録する(page, { 名日: "分析外アーキタイプ-038", 名英: "OutsideArchetype038", フォーマット: f.名日 }, issue);
    for (let i = 1; i <= 2; i++) await 公開デッキをn日前に作る(page, { 番号: "038", デッキ名: `分析内デッキ-038-${i}`, 形式: f.名日, アーキタイプ: 内, 日前: 3 }, issue);
    for (let i = 1; i <= 8; i++) await 公開デッキをn日前に作る(page, { 番号: "038", デッキ名: `分析外デッキ-038-${i}`, 形式: f.名日, アーキタイプ: 外, 日前: 30 }, issue);
  });
});
