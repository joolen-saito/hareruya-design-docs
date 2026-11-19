/**
 * A15-08 カード検索（デッキビルダーの API）のシード。正本: cases/A15-08_seed_data.tsv
 *
 * 読み替え（エビデンスの「正本の外の補い」に出す）:
 * - カード名の「A1508-NNN」には実行の印を付ける（決め打ちの値は2回目の実行で前の回のカードにも当たる。案A・依頼者決定 2026-10-28）。
 *   カード名の検索語も同じ印を付けた「A1508-NNN-<印>」で送るので、当たるのはこの実行のカードだけになる。
 * - カードは、シード表がカード新規登録画面で作るものも、カードCSV登録（同じ管理画面の取込）でまとめて作る。登録される値は同じで、
 *   カード詳細のカードセット・レアリティ・レイアウトは登録済みのもの（シード表の「選択肢を1つ」）、画像URL(英語)は CSV の必須列なので
 *   「https://example.invalid/a1508-NNN/en.jpg」を入れる（シード表が画像を定めるカードはその値）。CSV で付けられないものだけ画面で行う:
 *   ステッカー区分（カード詳細(編集)画面の「ステッカー」）と、画像を持たないカード（CSV は画像URL(英語)が必須）。
 * - 画面で指定できない値（日本語のカード画像URLだけを持つカード・更新日時）は、シード表のとおり DB で書く（E2E が作ったカードだけ。lib/db_write.ts）。
 * - カードの識別子は、カード一覧の「カードID」列の代わりに、DB をカード名(英)で引いて控える（読むだけ）。
 * - マスタの番号は、MTGマスターデータの画面の入力欄の名前の代わりに、DB を日本語名で引いて控える（読むだけ）。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { rc, RUN_MARK } from "../lib/run_marker";
import { adminUrl, withAdminSession } from "../lib/session";
import { buildCardCsv, CardCsvRecord, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "../pages/admin/card_csv";
import { カードを登録する, ensureFormatByName, ensureMaster } from "../pages/admin/m14_card";
import { マスターを用意する } from "../pages/admin/m14_05_card_csv_upload";
import { expectSaved } from "../pages/admin/common";
import { カードの更新日時を書く, カードの番号, カード詳細の番号, フォーマットの番号, マスターの番号, 日本語の画像を足す } from "../db/a15_08";

// ---------------------------------------------------------------------------
// マスタ（S-A15-08-MASTERS）
// ---------------------------------------------------------------------------

export const 種別 = { 甲: "マスタ種別甲", 乙: "マスタ種別乙", 丙: "マスタ種別丙" } as const;
export const 副 = { 甲: "マスタ副甲", 乙: "マスタ副乙", 丙: "マスタ副丙" } as const;
export const 色 = { 赤: "マスタ色赤", 青: "マスタ色青", 緑: "マスタ色緑" } as const;
export const 稀少 = { 甲: "マスタ稀少甲", 乙: "マスタ稀少乙", 丙: "マスタ稀少丙" } as const;
/** レアリティの「ほかの行と重ならない半角2文字」のコード（開発環境の既存のコード C・U・R・M・L・S・T・TR・FG・Z1・ZA・ZB と重ならない） */
const 稀少のコード = { 甲: "K1", 乙: "K2", 丙: "K3" } as const;
export const 形式 = { 名日: "マスタ形式甲", 名英: "A1508FORMAT", コード: "A1508F" } as const;

type 甲乙丙 = "甲" | "乙" | "丙";
type 赤青緑 = "赤" | "青" | "緑";
const 呼び = { 甲: "共有甲", 乙: "共有乙", 丙: "共有丙", 赤: "共有赤", 青: "共有青", 緑: "共有緑" } as const;

defineSeed("S-A15-08-MASTERS", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 足した: string[] = [];
    for (const k of ["甲", "乙", "丙"] as const) {
      if (await ensureMaster(page, "カードタイプ", 種別[k], 種別[k], seed.シードID)) 足した.push(種別[k]);
      if (await ensureMaster(page, "サブタイプ", 副[k], 副[k], seed.シードID)) 足した.push(副[k]);
      if (await ensureMaster(page, "レアリティ", 稀少[k], 稀少[k], seed.シードID, 稀少のコード[k])) 足した.push(稀少[k]);
    }
    for (const k of ["赤", "青", "緑"] as const) if (await マスターを用意する(page, "カラー", 色[k], seed.シードID, 色[k])) 足した.push(色[k]);
    await ensureFormatByName(page, { 名日: 形式.名日, 名英: 形式.名英, コード: 形式.コード, 並び順: "9000" }, seed.シードID, issue);
    issue(足した.length ? `MTGマスターデータに ${足した.join("・")} を登録した（ほかは登録済みの行を使った）` : "マスタは、すべて登録済みの行を使った（同じ名称の行は追加しない）");
  });
  for (const k of ["甲", "乙", "丙"] as const) {
    notes.set(`〔カード種別ID-A1508-${呼び[k]}〕`, マスターの番号("カード種別", 種別[k]));
    notes.set(`〔サブタイプID-A1508-${呼び[k]}〕`, マスターの番号("サブタイプ", 副[k]));
    notes.set(`〔レアリティID-A1508-${呼び[k]}〕`, マスターの番号("レアリティ", 稀少[k]));
  }
  for (const k of ["赤", "青", "緑"] as const) notes.set(`〔色ID-A1508-${呼び[k]}〕`, マスターの番号("色", 色[k]));
  notes.set("〔フォーマットID-A1508-共有〕", フォーマットの番号(形式.名日));
  issue("マスタの番号は、MTGマスターデータの画面の入力欄の名前の代わりに、DB を日本語名で引いて控えた（読むだけ）");
});

// ---------------------------------------------------------------------------
// カード
// ---------------------------------------------------------------------------

export type カード = {
  /** 控える呼び名（〔カードID-…〕） */
  控え: string;
  /** カード名(日)・(英)の、検索語のあとに付く部分（例: "J1"・"E1"） */
  日: string; 英: string;
  マナ?: number;
  種別?: 甲乙丙[]; 色?: 赤青緑[];
  /** サブタイプ。"Attraction" は既存のアトラクションのサブタイプ */
  副?: (甲乙丙 | "Attraction")[];
  /** カード詳細のレアリティ（詳細1件ごと）。省略すると登録済みのレアリティ1つ */
  稀少?: 甲乙丙[];
  形式?: "使用可" | "制限" | "禁止";
  パワー?: number; タフネス?: number; ロイヤルティ?: number;
  イラスト?: string;
  画像日?: string; 画像英?: string;
  ステッカー?: boolean;
};

/** ケースの検索語（カード名に付ける共通の部分。実行の印つき） */
export const 検索語 = (ケース: string): string => rc(`A1508-${ケース}`);
export const カード名 = (ケース: string, 末尾: string): string => `${検索語(ケース)}-${末尾}`;

/** J1/E1…の連番のカード（控えは 〔カードID-A1508-NNN<記号>〕） */
const 記号 = "ABCDEF";
const 連番 = (ケース: string, 個: Omit<カード, "控え" | "日" | "英">[]): カード[] =>
  個.map((c, i) => ({ 控え: `〔カードID-A1508-${ケース}${記号[i]}〕`, 日: `J${i + 1}`, 英: `E${i + 1}`, ...c }));
/** 末尾の番号で控えるカード（〔カードID-A1508-NNN-k〕） */
const 番号つき = (ケース: string, n: number, マナ?: (k: number) => number): カード[] =>
  Array.from({ length: n }, (_, i) => ({ 控え: `〔カードID-A1508-${ケース}-${i + 1}〕`, 日: `J${i + 1}`, 英: `E${i + 1}`, マナ: マナ ? マナ(i + 1) : undefined }));
const 一枚 = (ケース: string, c: Omit<カード, "控え" | "日" | "英"> = {}): カード[] => [{ 控え: `〔カードID-A1508-${ケース}〕`, 日: "J1", 英: "E1", ...c }];

export const 計画: Record<string, { シード: string; カード: カード[]; 画面で?: boolean }> = {
  "001": { シード: "S-A15-08-ALLATTR-001", カード: 連番("001", [
    { 種別: ["甲"], 色: ["赤"], マナ: 1, 稀少: ["甲"] }, { 種別: ["乙"], 色: ["青"], マナ: 2, 稀少: ["乙"] }, { 種別: ["丙"], 色: ["緑"], マナ: 3, 稀少: ["丙"] },
    { 種別: ["甲"], 色: ["青"], マナ: 4, 稀少: ["乙"] }, { 種別: ["乙"], 色: ["赤"], マナ: 5, 稀少: ["丙"] }, { 種別: ["丙"], 色: ["緑"], マナ: 6, 稀少: ["甲"] }]) },
  "002": { シード: "S-A15-08-STRUCT-002", カード: [{ 控え: "〔カードID-A1508-002〕", 日: "炎の竜", 英: "Fire Dragon", 種別: ["甲"], 色: ["赤"], マナ: 4,
    画像日: "https://example.invalid/a1508-002/ja.jpg", 画像英: "https://example.invalid/a1508-002/en.jpg" }] },
  "003": { シード: "S-A15-08-VALUES-003", カード: [{ 控え: "〔カードID-A1508-003〕", 日: "炎の竜", 英: "Fire Dragon", マナ: 4 }] },
  "004": { シード: "S-A15-08-ARRAYS-004", カード: 一枚("004", { 種別: ["甲", "乙"], 色: ["赤", "青"], マナ: 0 }) },
  "005": { シード: "S-A15-08-KUBUN-005", カード: 連番("005", [{ 副: ["Attraction"] }, { ステッカー: true }, {}]) },
  "006": { シード: "S-A15-08-IMAGE-006", カード: 一枚("006", { 画像日: "https://example.invalid/a1508-006/ja.jpg", 画像英: "https://example.invalid/a1508-006/en.jpg" }) },
  "007": { シード: "S-A15-08-NOIMAGE-007", 画面で: true, カード: 連番("007", [{ 画像日: "https://example.invalid/a1508-007/ja.jpg" }, {}]) },
  "018": { シード: "S-A15-08-TYPEAND-018", カード: 連番("018", [{ 種別: ["甲", "乙"] }, { 種別: ["甲", "丙"] }, { 種別: ["乙"] }]) },
  "019": { シード: "S-A15-08-TYPEOR-019", カード: 連番("019", [{ 種別: ["甲"] }, { 種別: ["乙"] }, { 種別: ["丙"] }]) },
  "020": { シード: "S-A15-08-SUBAND-020", カード: 連番("020", [{ 副: ["甲", "乙"] }, { 副: ["甲", "丙"] }, { 副: ["乙"] }]) },
  "021": { シード: "S-A15-08-SUBOR-021", カード: 連番("021", [{ 副: ["甲"] }, { 副: ["乙"] }, { 副: ["丙"] }]) },
  "022": { シード: "S-A15-08-RARE1-022", カード: 連番("022", [{ 稀少: ["甲"] }, { 稀少: ["乙"] }, { 稀少: ["丙"] }]) },
  "023": { シード: "S-A15-08-RAREOR-023", カード: 連番("023", [{ 稀少: ["甲"] }, { 稀少: ["乙"] }, { 稀少: ["丙"] }]) },
  "024": { シード: "S-A15-08-COLAND-024", カード: 連番("024", [{ 色: ["赤", "青"] }, { 色: ["赤", "緑"] }, { 色: ["青"] }]) },
  "025": { シード: "S-A15-08-COLOR-025", カード: 連番("025", [{ 色: ["赤"] }, { 色: ["青"] }, { 色: ["緑"] }]) },
  "026": { シード: "S-A15-08-EXCOL-026", カード: 連番("026", [{ 色: ["赤"] }, { 色: ["赤", "青"] }, { 色: ["青"] }, { 色: ["緑"] }]) },
  "027": { シード: "S-A15-08-FORMAT-027", カード: 連番("027", [{ 形式: "使用可" }, { 形式: "制限" }, { 形式: "禁止" }, {}]) },
  "028": { シード: "S-A15-08-ILLEGAL-028", カード: 連番("028", [{ 形式: "使用可" }, { 形式: "制限" }, { 形式: "禁止" }]) },
  "029": { シード: "S-A15-08-RANGE-029", カード: 連番("029", [
    { マナ: 3, パワー: 3, タフネス: 3, ロイヤルティ: 3 }, { マナ: 6, パワー: 3, タフネス: 3, ロイヤルティ: 3 }, { マナ: 3, パワー: 6, タフネス: 3, ロイヤルティ: 3 },
    { マナ: 3, パワー: 3, タフネス: 6, ロイヤルティ: 3 }, { マナ: 3, パワー: 3, タフネス: 3, ロイヤルティ: 6 }, { マナ: 1, パワー: 3, タフネス: 3, ロイヤルティ: 3 }]) },
  "030": { シード: "S-A15-08-MATCH-030", カード: 連番("030", [
    { マナ: 3, パワー: 2, タフネス: 2, ロイヤルティ: 4 }, { マナ: 5, パワー: 2, タフネス: 2, ロイヤルティ: 4 }, { マナ: 3, パワー: 3, タフネス: 2, ロイヤルティ: 4 },
    { マナ: 3, パワー: 2, タフネス: 3, ロイヤルティ: 4 }, { マナ: 3, パワー: 2, タフネス: 2, ロイヤルティ: 5 }, { マナ: 4, パワー: 2, タフネス: 2, ロイヤルティ: 4 }]) },
  "031": { シード: "S-A15-08-EXCLUDE-031", カード: 連番("031", [
    { マナ: 1, パワー: 1, タフネス: 1, ロイヤルティ: 1 }, { マナ: 3, パワー: 1, タフネス: 1, ロイヤルティ: 1 }, { マナ: 1, パワー: 2, タフネス: 1, ロイヤルティ: 1 },
    { マナ: 1, パワー: 1, タフネス: 2, ロイヤルティ: 1 }, { マナ: 1, パワー: 1, タフネス: 1, ロイヤルティ: 4 }]) },
  "032": { シード: "S-A15-08-ILLUST-032", カード: 連番("032", [{ イラスト: "A1508-032-Alice" }, { イラスト: "A1508-032-Bob" }]) },
  "033": { シード: "S-A15-08-COMBO-033", カード: 連番("033", [
    { 種別: ["甲"], 色: ["赤"], マナ: 3, 稀少: ["甲"] }, { 種別: ["乙"], 色: ["赤"], マナ: 3, 稀少: ["甲"] }, { 種別: ["甲"], 色: ["青"], マナ: 3, 稀少: ["甲"] },
    { 種別: ["甲"], 色: ["赤"], マナ: 6, 稀少: ["甲"] }, { 種別: ["甲"], 色: ["赤"], マナ: 3, 稀少: ["乙"] }]) },
  "039": { シード: "S-A15-08-SORTDEF-039", カード: 連番("039", [{ 色: ["赤"] }, { 色: ["青"] }, { 色: ["緑"] }, { 色: ["赤", "青"] }]) },
  "043": { シード: "S-A15-08-TOTAL-043", カード: 番号つき("043", 25, (k) => k) },
  "044": { シード: "S-A15-08-PAGEWALK-044", カード: 番号つき("044", 12, (k) => [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 6, 7, 8][k]) },
  "045": { シード: "S-A15-08-DEDUP-045", カード: 連番("045", [{ 副: ["甲", "乙"] }, { 副: ["甲"] }, { 副: ["丙"] }]) },
  "046": { シード: "S-A15-08-PAGEDEF-046", カード: 番号つき("046", 25, (k) => k) },
  "047": { シード: "S-A15-08-LIMIT100-047", カード: 番号つき("047", 101) },
  "048": { シード: "S-A15-08-ZERO200-048", カード: 一枚("048") },
  "049": { シード: "S-A15-08-ZEROCOUNT-049", カード: 一枚("049") },
  "050": { シード: "S-A15-08-NOAUTH-050", カード: 一枚("050") },
  "052": { シード: "S-A15-08-READONLY-052", カード: 連番("052", [{}, {}]) },
  "060": { シード: "S-A15-08-COLDEF-060", カード: 連番("060", [{ 色: ["赤", "青"] }, { 色: ["赤", "緑"] }, { 色: ["青"] }]) },
  "061": { シード: "S-A15-08-RAREDEF-061", カード: 連番("061", [{ 稀少: ["甲", "乙"] }, { 稀少: ["甲"] }, { 稀少: ["乙"] }]) },
  "076": { シード: "S-A15-08-NOMSG-076", カード: 一枚("076", { 種別: ["甲"], 色: ["赤"], マナ: 1 }) },
  "079": { シード: "S-A15-08-TYPENOT-079", カード: 連番("079", [{ 種別: ["甲"] }, { 種別: ["乙"] }, { 種別: ["甲", "丙"] }, { 種別: ["丙"] }]) },
  "080": { シード: "S-A15-08-SUBNOT-080", カード: 連番("080", [{ 副: ["甲"] }, { 副: ["乙"] }, { 副: ["甲", "丙"] }, { 副: ["丙"] }]) },
  "081": { シード: "S-A15-08-RARENOT-081", カード: 連番("081", [{ 稀少: ["甲"] }, { 稀少: ["乙"] }, { 稀少: ["丙"] }]) },
  "083": { シード: "S-A15-08-POWLOW-083", カード: 連番("083", [{ パワー: 5 }, { パワー: 1 }, { パワー: 9 }]) },
  "084": { シード: "S-A15-08-TOULOW-084", カード: 連番("084", [{ タフネス: 5 }, { タフネス: 1 }, { タフネス: 9 }]) },
  "085": { シード: "S-A15-08-LOYLOW-085", カード: 連番("085", [{ ロイヤルティ: 5 }, { ロイヤルティ: 1 }, { ロイヤルティ: 9 }]) },
  "086": { シード: "S-A15-08-BEYOND-086", カード: 番号つき("086", 25, (k) => k) },
};

/** 名前のマスタを使うシード（マスタが先に要る） */
const マスタが要る = (cs: カード[]): boolean => cs.some((c) => c.種別 || c.色 || (c.副 ?? []).some((s) => s !== "Attraction") || c.稀少 || c.形式);

/** カードCSVの行（カード詳細1件＝1行。レアリティが2つのカードは2行） */
function CSVの行(ケース: string, c: カード, 既存: { set: string; rarity: string; layout: string }): CardCsvRecord[] {
  const rarities = c.稀少?.length ? c.稀少.map((k) => 稀少[k]) : [既存.rarity];
  return rarities.map((rarity) => {
    const r: CardCsvRecord = {
      name_jp: カード名(ケース, c.日), name_en: カード名(ケース, c.英), cmc: String(c.マナ ?? 0),
      set: 既存.set, rarity, layout: 既存.layout, image_en: c.画像英 ?? `https://example.invalid/a1508-${ケース}/en.jpg`,
    };
    if (c.画像日) r.image_jp = c.画像日;
    if (c.種別?.length) r.cardtype = c.種別.map((k) => 種別[k]).join(",");
    if (c.色?.length) r.color = c.色.map((k) => 色[k]).join(",");
    if (c.副?.length) r.subtype = c.副.map((k) => (k === "Attraction" ? "Attraction" : 副[k])).join(",");
    if (c.形式 === "使用可") r.format = 形式.名英;
    if (c.形式 === "制限") r.restriction_format = 形式.名英;
    if (c.形式 === "禁止") r.ban_format = 形式.名英;
    if (c.パワー !== undefined) r.power = String(c.パワー);
    if (c.タフネス !== undefined) r.toughness = String(c.タフネス);
    if (c.ロイヤルティ !== undefined) r.loyalty = String(c.ロイヤルティ);
    if (c.イラスト) r.illustrator = c.イラスト;
    return r;
  });
}

/** カード詳細(登録)画面の「カードセット」の、選べる最初の選択肢（シード表の「登録済みのカードセットを1つ」） */
async function 最初のカードセット(page: Page): Promise<string> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  await page.locator("#add-detail").click();
  const sel = page.locator('#card-details-container .detail-card select[name$="[cardset]"]').last();
  const label = await sel.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, l: (n.textContent ?? "").trim() })).find((o) => o.v !== "")?.l ?? "");
  if (!label) throw new Error("カード詳細(登録)画面のカードセットに選べる選択肢が無い");
  return label;
}

/** カード詳細(編集)画面で「ステッカー」に印を付けて登録する（カードCSVに無い項目） */
async function ステッカーにする(page: Page, カードID: string, what: string): Promise<void> {
  await page.goto(adminUrl(`/card/${カードID}/edit`));
  await page.waitForLoadState("load");
  await page.locator("#admin_card_isSticker").check();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    page.locator("form#form1 button[type=\"submit\"]").filter({ hasText: /^\s*登録\s*$/ }).click({ noWaitAfter: true }),
  ]);
  await expectSaved(page, `${what}: ステッカーの登録`);
}

/** 計画のカードを作り、控える（ケースごとのシード） */
async function 作る(ケース: string, { browser, notes, seed }: SeedCtx): Promise<void> {
  const p = 計画[ケース];
  {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    issue(`カード名の「A1508-${ケース}」に実行の印を付けた「${検索語(ケース)}」を使う（2回目の実行で前の回のカードに当たらないように。検索語も同じ）`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      if (p.画面で) {
        const set = await 最初のカードセット(page);
        for (const c of p.カード) {
          await カードを登録する(page, { カード名日: カード名(ケース, c.日), カード名英: カード名(ケース, c.英), 点数で見たマナ: String(c.マナ ?? 0), 詳細: { カードセット: set } }, seed.シードID, issue);
        }
        issue(`カード詳細のカードセットは、登録済みの「${set}」、レアリティ・レイアウト・プロモ種別は選択肢の先頭、Foil・フレームは「なし」「通常」を選んだ`);
      } else {
        const 既存 = await readExistingCardValues(page);
        const headers = await downloadCardCsvTemplate(page);
        const rows = p.カード.flatMap((c) => CSVの行(ケース, c, 既存));
        await uploadCardCsv(page, buildCardCsv(headers, rows), `a1508_${ケース}_cards.csv`, `${seed.シードID}: カードCSV登録`, (w) => issue(`カードCSVの警告「${w}」`));
        issue(`カードは、シード表のカード新規登録画面の代わりに、カードCSV登録でまとめて作った（${rows.length}行）。カード詳細のカードセット「${既存.set}」・レイアウト「${既存.layout}」は登録済みのもの${p.カード.some((c) => !c.稀少) ? `、レアリティの指定の無いカードは登録済みの「${既存.rarity}」` : ""}、画像URL(英語)は CSV の必須列なので指定の無いカードは https://example.invalid/a1508-${ケース}/en.jpg を入れた`);
      }
      for (const c of p.カード) notes.set(c.控え, カードの番号(カード名(ケース, c.英)));
      for (const c of p.カード.filter((x) => x.ステッカー)) {
        await ステッカーにする(page, notes.get(c.控え), seed.シードID);
        issue(`${c.控え}のステッカー区分は、カードCSVに列が無いので、カード詳細(編集)画面の「ステッカー」に印を付けて登録した`);
      }
    });
    if (p.画面で) {
      for (const c of p.カード.filter((x) => x.画像日)) {
        const [詳細ID] = カード詳細の番号(notes.get(c.控え));
        日本語の画像を足す(seed.シードID, 詳細ID, c.画像日!, RUN_MARK);
        issue(`${c.控え}の日本語のカード画像URLは、画面で指定できないので DB で足した（E2E が作ったカード詳細だけ）`);
      }
    }
    if (ケース === "052") {
      const ids = p.カード.map((c) => notes.get(c.控え));
      カードの更新日時を書く(seed.シードID, ids, "2026-01-01 00:00:00", RUN_MARK);
      issue("2枚のカードの更新日時 2026-01-01 00:00:00（日本時間）は、画面で指定できないので DB で書いた（E2E が作ったカードだけ）");
    }
  }
}

const マスタの要否 = (ケース: string): string[] => (マスタが要る(計画[ケース].カード) ? ["S-A15-08-MASTERS"] : []);
defineSeed("S-A15-08-ALLATTR-001", { needs: マスタの要否("001") }, (ctx) => 作る("001", ctx));
defineSeed("S-A15-08-STRUCT-002", { needs: マスタの要否("002") }, (ctx) => 作る("002", ctx));
defineSeed("S-A15-08-VALUES-003", { needs: マスタの要否("003") }, (ctx) => 作る("003", ctx));
defineSeed("S-A15-08-ARRAYS-004", { needs: マスタの要否("004") }, (ctx) => 作る("004", ctx));
defineSeed("S-A15-08-KUBUN-005", { needs: マスタの要否("005") }, (ctx) => 作る("005", ctx));
defineSeed("S-A15-08-IMAGE-006", { needs: マスタの要否("006") }, (ctx) => 作る("006", ctx));
defineSeed("S-A15-08-NOIMAGE-007", { needs: マスタの要否("007") }, (ctx) => 作る("007", ctx));
defineSeed("S-A15-08-TYPEAND-018", { needs: マスタの要否("018") }, (ctx) => 作る("018", ctx));
defineSeed("S-A15-08-TYPEOR-019", { needs: マスタの要否("019") }, (ctx) => 作る("019", ctx));
defineSeed("S-A15-08-SUBAND-020", { needs: マスタの要否("020") }, (ctx) => 作る("020", ctx));
defineSeed("S-A15-08-SUBOR-021", { needs: マスタの要否("021") }, (ctx) => 作る("021", ctx));
defineSeed("S-A15-08-RARE1-022", { needs: マスタの要否("022") }, (ctx) => 作る("022", ctx));
defineSeed("S-A15-08-RAREOR-023", { needs: マスタの要否("023") }, (ctx) => 作る("023", ctx));
defineSeed("S-A15-08-COLAND-024", { needs: マスタの要否("024") }, (ctx) => 作る("024", ctx));
defineSeed("S-A15-08-COLOR-025", { needs: マスタの要否("025") }, (ctx) => 作る("025", ctx));
defineSeed("S-A15-08-EXCOL-026", { needs: マスタの要否("026") }, (ctx) => 作る("026", ctx));
defineSeed("S-A15-08-FORMAT-027", { needs: マスタの要否("027") }, (ctx) => 作る("027", ctx));
defineSeed("S-A15-08-ILLEGAL-028", { needs: マスタの要否("028") }, (ctx) => 作る("028", ctx));
defineSeed("S-A15-08-RANGE-029", { needs: マスタの要否("029") }, (ctx) => 作る("029", ctx));
defineSeed("S-A15-08-MATCH-030", { needs: マスタの要否("030") }, (ctx) => 作る("030", ctx));
defineSeed("S-A15-08-EXCLUDE-031", { needs: マスタの要否("031") }, (ctx) => 作る("031", ctx));
defineSeed("S-A15-08-ILLUST-032", { needs: マスタの要否("032") }, (ctx) => 作る("032", ctx));
defineSeed("S-A15-08-COMBO-033", { needs: マスタの要否("033") }, (ctx) => 作る("033", ctx));
defineSeed("S-A15-08-SORTDEF-039", { needs: マスタの要否("039") }, (ctx) => 作る("039", ctx));
defineSeed("S-A15-08-TOTAL-043", { needs: マスタの要否("043") }, (ctx) => 作る("043", ctx));
defineSeed("S-A15-08-PAGEWALK-044", { needs: マスタの要否("044") }, (ctx) => 作る("044", ctx));
defineSeed("S-A15-08-DEDUP-045", { needs: マスタの要否("045") }, (ctx) => 作る("045", ctx));
defineSeed("S-A15-08-PAGEDEF-046", { needs: マスタの要否("046") }, (ctx) => 作る("046", ctx));
defineSeed("S-A15-08-LIMIT100-047", { needs: マスタの要否("047") }, (ctx) => 作る("047", ctx));
defineSeed("S-A15-08-ZERO200-048", { needs: マスタの要否("048") }, (ctx) => 作る("048", ctx));
defineSeed("S-A15-08-ZEROCOUNT-049", { needs: マスタの要否("049") }, (ctx) => 作る("049", ctx));
defineSeed("S-A15-08-NOAUTH-050", { needs: マスタの要否("050") }, (ctx) => 作る("050", ctx));
defineSeed("S-A15-08-READONLY-052", { needs: マスタの要否("052") }, (ctx) => 作る("052", ctx));
defineSeed("S-A15-08-COLDEF-060", { needs: マスタの要否("060") }, (ctx) => 作る("060", ctx));
defineSeed("S-A15-08-RAREDEF-061", { needs: マスタの要否("061") }, (ctx) => 作る("061", ctx));
defineSeed("S-A15-08-NOMSG-076", { needs: マスタの要否("076") }, (ctx) => 作る("076", ctx));
defineSeed("S-A15-08-TYPENOT-079", { needs: マスタの要否("079") }, (ctx) => 作る("079", ctx));
defineSeed("S-A15-08-SUBNOT-080", { needs: マスタの要否("080") }, (ctx) => 作る("080", ctx));
defineSeed("S-A15-08-RARENOT-081", { needs: マスタの要否("081") }, (ctx) => 作る("081", ctx));
defineSeed("S-A15-08-POWLOW-083", { needs: マスタの要否("083") }, (ctx) => 作る("083", ctx));
defineSeed("S-A15-08-TOULOW-084", { needs: マスタの要否("084") }, (ctx) => 作る("084", ctx));
defineSeed("S-A15-08-LOYLOW-085", { needs: マスタの要否("085") }, (ctx) => 作る("085", ctx));
defineSeed("S-A15-08-BEYOND-086", { needs: マスタの要否("086") }, (ctx) => 作る("086", ctx));
