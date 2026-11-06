/** M14-05 カード登録CSVアップロード。正本: cases/M14-05_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc, unrc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import {
  イラストレーターの件数, カードの分類英, カードのリーガリティ英, カードの詳細, カード名でカード, マスターの件数, 詳細IDの詳細,
} from "../../db/m14_05_card_csv";
import { CardCsvUploadPage, CSV行, CSV本文, 雛形の見出し, 送信の結果 } from "../../pages/admin/m14_05_csv";
import { CB名, M1405_ADMIN, 名E } from "../../seeds/m14-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// ---------------------------------------------------------------------------
// 部品: 取込前後のカードの状態
// ---------------------------------------------------------------------------

type 状態 = {
  件数: number; カードID: string | null; マナ: number | null; パワー: string | null; タフネス: string | null; 色順: string | null;
  詳細: ReturnType<typeof カードの詳細>;
  型: string[]; 色: string[]; 固有色: string[]; 副型: string[]; 特殊: string[]; 可: string[]; 制限: string[]; 禁止: string[];
};

function 読む(名: string): 状態 {
  const cards = カード名でカード(名);
  const c = cards[0];
  const id = c?.カードID ?? null;
  const lg = id ? カードのリーガリティ英(id) : [];
  const pick = (r: string) => lg.filter((x) => x.endsWith(`:${r}`)).map((x) => x.slice(0, x.lastIndexOf(":"))).sort();
  const cls = (k: Parameters<typeof カードの分類英>[1]) => (id ? カードの分類英(id, k).sort() : []);
  return {
    件数: cards.length, カードID: id, マナ: c?.点数で見たマナ == null ? null : Number(c.点数で見たマナ), パワー: c?.パワー ?? null, タフネス: c?.タフネス ?? null, 色順: c?.色順 ?? null,
    詳細: id ? カードの詳細(id) : [],
    型: cls("cardtype"), 色: cls("color"), 固有色: cls("color_identity"), 副型: cls("subtype"), 特殊: cls("specialtype"),
    可: pick("Legal"), 制限: pick("Restriction"), 禁止: pick("Ban"),
  };
}

type 期待 = {
  件数?: number; 同じカード?: string; マナ?: number | null; パワー?: string; タフネス?: string; 色順?: string | null;
  型?: string[]; 色?: string[]; 固有色?: string[]; 副型?: string[]; 特殊?: string[]; 可?: string[]; 制限?: string[]; 禁止?: string[]; レイアウト?: string;
};

/** 期待の項目ごとに確かめる（1つ落ちても残りを確かめる） */
function 確かめる(s: 状態, 表示名: string, e: 期待): void {
  if (e.件数 !== undefined) expect.soft(s.件数, `カード「${表示名}」の件数`).toBe(e.件数);
  if (e.同じカード !== undefined) expect.soft(s.カードID, `カード「${表示名}」が取込前と同じカードのまま`).toBe(e.同じカード);
  if (e.マナ !== undefined) expect.soft(s.マナ, `カード「${表示名}」の点数で見たマナコスト`).toBe(e.マナ);
  if (e.パワー !== undefined) expect.soft(s.パワー, `カード「${表示名}」のパワー`).toBe(e.パワー);
  if (e.タフネス !== undefined) expect.soft(s.タフネス, `カード「${表示名}」のタフネス`).toBe(e.タフネス);
  if (e.色順 !== undefined) expect.soft(s.色順, `カード「${表示名}」の色順`).toBe(e.色順);
  const sorted = (a: string[]) => [...a].sort();
  if (e.型) expect.soft(s.型, `カード「${表示名}」のカードタイプ`).toEqual(sorted(e.型));
  if (e.色) expect.soft(s.色, `カード「${表示名}」のカラー`).toEqual(sorted(e.色));
  if (e.固有色) expect.soft(s.固有色, `カード「${表示名}」の固有色`).toEqual(sorted(e.固有色));
  if (e.副型) expect.soft(s.副型, `カード「${表示名}」のサブタイプ`).toEqual(sorted(e.副型));
  if (e.特殊) expect.soft(s.特殊, `カード「${表示名}」の特殊タイプ`).toEqual(sorted(e.特殊));
  if (e.可) expect.soft(s.可, `カード「${表示名}」の使用可能フォーマット`).toEqual(sorted(e.可));
  if (e.制限) expect.soft(s.制限, `カード「${表示名}」の使用制限フォーマット`).toEqual(sorted(e.制限));
  if (e.禁止) expect.soft(s.禁止, `カード「${表示名}」の使用禁止フォーマット`).toEqual(sorted(e.禁止));
  if (e.レイアウト) expect.soft(s.詳細.map((d) => d.レイアウト), `カード「${表示名}」のレイアウト`).toContain(e.レイアウト);
}

// ---------------------------------------------------------------------------
// 部品: CSVの行
// ---------------------------------------------------------------------------

const 画像 = (n: string) => `m14-05-${n}-en.jpg`;
/** 必須の列（レアリティ・レイアウト・画像URL(英語)）を既定で埋めた行 */
const 行 = (o: CSV行): CSV行 => ({ rarity: "Uncommon", layout: "Normal", image_en: 画像(unrc(o.name_en ?? "x").toLowerCase().replace(/[^a-z0-9]+/g, "-")), ...o });
/** 既存カードを更新する行（取込前は点数で見たマナコスト1。9へ更新する） */
const 更新行 = (n: string, o: CSV行 = {}): CSV行 => 行({ name_en: 名E(n), card_detail_id: `1450010${n}`, cmc: "9", image_en: `img/m1405/pre-1450010${n}.jpg`, ...o });

const 全列 = (名: string, 詳細ID: string, 裏面 = ""): CSV行 => ({
  name_jp: `${unrc(名)}（日本語）`, name_en: 名, arena_format_name_jp: "アリーナ名", arena_format_name_en: "Arena Name", text_jp: "ルール文", text_en: "Rule text",
  mana_cost: "(4)(W)", cmc: "5", power: "3", toughness: "4", loyalty: "2", cardtype: "Creature,_enchantment", color: "White,Blue", color_identity: "White,Blue",
  subtype: "Adventure,Advisor", specialtype: "Basic,Legendary", format: "Legacy,Modern", restriction_format: "Vintage", ban_format: "Commander,Pioneer",
  set: "Aether Revolt", rarity: "Uncommon", illustrator: "Jung Park", layout: "Normal", flavor_jp: "フレーバー", flavor_en: "Flavor", card_no: "7",
  promotion_type: "Non Promotion", foil: "1", frame: "Special", image_jp: "m14-05-full-jp.jpg", image_en: "m14-05-full-en.jpg", card_detail_id: 詳細ID,
  back_card_detail_id: 裏面, color_sequence: "マルチ-白青",
});

type ファイル = { name: string; buffer: Buffer; mimeType?: string };

/**
 * 「画面を開く → ファイルを選んで押す →（DBで確かめる）」の型。
 * 読む は取込前と取込後の両方で呼ぶ（取込前の状態との比較に使う）。二度 は同じファイルをもう一度送る（手順が1つ増える）
 */
function 取込<T>(o: {
  file: (見出し: string[], notes: { get(k: string): string }) => ファイル;
  読む?: (notes: { get(k: string): string }) => T;
  確かめ?: (after: T, before: T, r: 送信の結果, notes: { get(k: string): string }) => void;
  戻る?: boolean; 二度?: boolean;
}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1405_ADMIN);
    const u = new CardCsvUploadPage(page);
    const 見出し = await 雛形の見出し(page);
    const n = { get: (k: string) => notes.get(k) };
    const before = o.読む ? o.読む(n) : (undefined as T);
    const f = o.file(見出し, n);
    let r!: 送信の結果;
    let after = before;
    await step(1, async () => { await u.open(); });
    await step(2, async () => { r = await u.選んで押す(f); });
    if (o.二度) await step(3, async () => { await u.open(); r = await u.選んで押す(f); });
    if (o.読む) await step(o.二度 ? 4 : 3, async () => { after = o.読む!(n); });
    await expected(async () => {
      if (o.戻る) {
        expect.soft(new URL(r.url).pathname, "取込後の画面（カード登録CSVアップロード）").toMatch(/\/card\/csv_upload$/);
        expect.soft(r.送信した, "アップロードの要求が送られた").toBe(true);
      }
      if (o.確かめ) o.確かめ(after, before, r, n);
    });
  };
}

const 取込前と同じ = (表示名: string) => (after: 状態, before: 状態, r: 送信の結果): void => {
  expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
  expect.soft(after.件数, `カード「${表示名}」の件数（取込前と同じ）`).toBe(before.件数);
  expect.soft(after.マナ, `カード「${表示名}」の点数で見たマナコスト（取込前と同じ）`).toBe(before.マナ);
  expect.soft(after.詳細.map((d) => d.詳細ID), `カード「${表示名}」の詳細（取込前と同じ）`).toEqual(before.詳細.map((d) => d.詳細ID));
};

// ---------------------------------------------------------------------------
// 画面部品・基本
// ---------------------------------------------------------------------------

caseTest("IT-M14-05-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1405_ADMIN);
  const u = new CardCsvUploadPage(page);
  let r!: 送信の結果;
  await step(1, async () => { await u.open(); });
  await step(2, async () => { r = await u.選ばずに押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "押したあとの画面（カード登録CSVアップロード）").toMatch(/\/card\/csv_upload$/);
    if (!r.送信した) note("ファイルを選ばずに押しても、要求は送られなかった（ブラウザの入力チェックが止めた）");
  });
});

// 正常な新規2行（全採用列）
const 新規2行 = (a: string, b: string, d1: string, d2: string): CSV行[] => [全列(a, d1), 全列(b, d2, d1)];
const 名A = (s = "") => rc(`M1405 New A${s}`);
const 名B = (s = "") => rc(`M1405 New B${s}`);

caseTest("IT-M14-05-002", 取込({
  file: (h) => ({ name: "m14-05_new_full-002.csv", buffer: CSV本文(h, 新規2行(名A(), 名B(), "145101002", "145102002")) }),
  読む: () => ({ a: 読む(名A()), b: 読む(名B()) }),
  確かめ: ({ a, b }) => {
    expect.soft(a.件数, "カード「M1405 New A」の件数").toBe(1);
    expect.soft(b.件数, "カード「M1405 New B」の件数").toBe(1);
    expect.soft(a.詳細.map((d) => d.詳細ID), "カード「M1405 New A」のカード詳細ID").toEqual(["145101002"]);
    expect.soft(b.詳細.map((d) => d.詳細ID), "カード「M1405 New B」のカード詳細ID").toEqual(["145102002"]);
    expect.soft(a.マナ, "カード「M1405 New A」の点数で見たマナコスト").toBe(5);
    expect.soft(b.詳細[0]?.裏面詳細ID ?? null, "カード「M1405 New B」の裏面カード詳細ID").toBe("145101002");
  },
}));

caseTest("IT-M14-05-003", 取込({
  file: (h) => ({ name: "m14-05_new_full-003.csv", buffer: CSV本文(h, 新規2行(名A(" 003"), 名B(" 003"), "145101003", "145102003")) }),
  戻る: true,
  確かめ: (_a, _b, r) => { expect.soft(r.成功.join(" / "), "取込完了の表示").toContain("登録が完了しました"); },
}));

caseTest("IT-M14-05-004", 取込({
  file: (h) => ({ name: "m14-05_update_full-004.csv", buffer: CSV本文(h, [{ ...全列(名E("04"), "145001004"), back_card_detail_id: "" }]) }),
  読む: (n) => ({ s: 読む(名E("04")), id: n.get("〔カードID-M1405-004〕") }),
  確かめ: ({ s, id }) => {
    const d = s.詳細.find((x) => x.詳細ID === "145001004");
    expect.soft(s.件数, "カード「M1405X-Existing-004」の件数").toBe(1);
    expect.soft(s.カードID, "既存のカードのまま（控えたカードID）").toBe(id);
    expect.soft(s.マナ, "点数で見たマナコスト（CSVの値）").toBe(5);
    expect.soft(s.パワー, "カードのパワー（CSVの値）").toBe("3");
    expect.soft(s.タフネス, "カードのタフネス（CSVの値）").toBe("4");
    expect.soft(d?.コレクターNo, "カード詳細のカードNo（CSVの値）").toBe("7");
    expect.soft(String(d?.Foil), "カード詳細のFoil（CSVの値）").toBe("1");
    expect.soft(d?.フレーム, "カード詳細のフレーム（CSVの値）").toBe("Special");
  },
}));

caseTest("IT-M14-05-005", 取込({
  file: (h) => ({ name: "m14-05_optional_empty-005.csv", buffer: CSV本文(h, [{ name_en: rc("M1405 Required Only"), rarity: "Uncommon", layout: "Normal", image_en: "m14-05-required-only-en-005.jpg" }]) }),
  読む: () => 読む(rc("M1405 Required Only")),
  確かめ: (s) => {
    expect.soft(s.件数, "カード「M1405 Required Only」の件数").toBe(1);
    expect.soft(s.詳細.map((d) => d.レアリティ), "レアリティ").toContain("Uncommon");
    expect.soft(s.詳細.map((d) => d.レイアウト), "レイアウト").toContain("Normal");
  },
}));

caseTest("IT-M14-05-010", 取込({
  file: (h) => ({ name: "m14-05_numeric_max-010.csv", buffer: CSV本文(h, [更新行("10", { cmc: "10", card_no: "16", foil: "1" })]) }),
  読む: () => 読む(名E("10")),
  確かめ: (s) => {
    const d = s.詳細.find((x) => x.詳細ID === "145001010");
    expect.soft(s.マナ, "点数で見たマナコスト（最大値10）").toBe(10);
    expect.soft(d?.コレクターNo, "カードNo（最大値16）").toBe("16");
    expect.soft(String(d?.Foil), "Foil（最大値1）").toBe("1");
  },
}));

// ---------------------------------------------------------------------------
// 取込をやめる（取込前の状態のまま）
// ---------------------------------------------------------------------------

const 名RA = (n: string) => rc(`M1405X-${n}`);
caseTest("IT-M14-05-016", 取込({
  file: (h) => ({
    name: "m14-05_master_rollback-016.csv",
    buffer: CSV本文(h, [行({ name_en: 名RA("MasterRollbackA-016") }), 行({ name_en: 名RA("MasterRollbackB-016"), cardtype: "NotRegistered-016" })]),
  }),
  読む: () => ({ e: 読む(名E("16")), a: 読む(名RA("MasterRollbackA-016")), b: 読む(名RA("MasterRollbackB-016")), master: マスターの件数("cardtype", "NotRegistered-016") }),
  確かめ: (after, before, r) => {
    expect.soft(before.master, "取込前: カードタイプ「NotRegistered-016」のマスタ件数").toBe(0);
    expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(after.a.件数, "新規カード「M1405X-MasterRollbackA-016」の件数（1行目も取り消し）").toBe(0);
    expect.soft(after.b.件数, "新規カード「M1405X-MasterRollbackB-016」の件数").toBe(0);
    expect.soft(after.e.件数, "既存カード「M1405X-Existing-016」の件数").toBe(1);
  },
}));

const 変更されない = (n: string) => ({
  読む: () => 読む(名E(n)),
  確かめ: 取込前と同じ(`M1405X-Existing-${n}`),
});

caseTest("IT-M14-05-017", 取込({
  file: (h) => {
    const 見出し = h.filter((x) => x !== "text_en");
    return { name: "m14-05_header_missing-017.csv", buffer: CSV本文(見出し, [更新行("17")]) };
  },
  ...変更されない("17"),
}));
caseTest("IT-M14-05-018", 取込({
  file: (h) => ({ name: "m14-05_header_extra-018.csv", buffer: CSV本文([...h, "UNKNOWN"], [更新行("18")]) }),
  ...変更されない("18"),
}));
caseTest("IT-M14-05-019", 取込({
  file: (h) => {
    const 見出し = [...h];
    [見出し[0], 見出し[1]] = [見出し[1], 見出し[0]];
    return { name: "m14-05_header_order-019.csv", buffer: CSV本文(見出し, [更新行("19")]) };
  },
  ...変更されない("19"),
}));

// 020 は投入方法に「DBへ直接設定する」画像の準備があるため実装しない（記録の振り分け表）

caseTest("IT-M14-05-021", 取込({
  file: (h) => ({ name: "m14-05_legacy_ids-021.csv", buffer: CSV本文([...h, "現行の日本語商品ID", "現行の英語商品ID"], [更新行("21")]) }),
  読む: () => 読む(名E("21")),
  確かめ: (s, _b, r) => {
    expect.soft(r.エラー.join(" / "), "取込のエラー表示（なし）").toBe("");
    expect.soft(s.マナ, "点数で見たマナコスト（CSVの値9へ更新）").toBe(9);
  },
}));

caseTest("IT-M14-05-022", 取込({
  file: (h) => ({ name: "m14-05_header_removed-022.csv", buffer: CSV本文([...h, "Foilフラグ", "プロモフラグ"], [{ ...更新行("22"), "Foilフラグ": "0", "プロモフラグ": "0" }]) }),
  ...変更されない("22"),
}));

const 新規の確認 = (名: string[]) => ({
  読む: () => 名.map((n) => 読む(n)),
});

caseTest("IT-M14-05-024", 取込({
  file: (h) => ({
    name: "m14-05_row_mismatch-024.csv",
    buffer: CSV本文(h, [行({ name_en: rc("M1405X-RowMismatchA-024") }), 行({ name_en: rc("M1405X-RowMismatchB-024") })], { 列数不足の行: { 1: 3 } }),
  }),
  ...新規の確認([rc("M1405X-RowMismatchA-024"), rc("M1405X-RowMismatchB-024")]),
  確かめ: ([a, b], _before, r) => {
    expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(a.件数, "1行目「M1405X-RowMismatchA-024」の件数（取り消し）").toBe(0);
    expect.soft(b.件数, "2行目「M1405X-RowMismatchB-024」の件数").toBe(0);
  },
}));

caseTest("IT-M14-05-025", 取込({
  file: (h) => ({
    name: "m14-05_required_rollback-025.csv",
    buffer: CSV本文(h, [行({ name_en: rc("M1405X-RequiredRollbackA-025") }), 行({ name_en: rc("M1405X-RequiredRollbackB-025"), rarity: "" })]),
  }),
  ...新規の確認([rc("M1405X-RequiredRollbackA-025"), rc("M1405X-RequiredRollbackB-025")]),
  確かめ: ([a, b], _before, r) => {
    expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(a.件数, "1行目「M1405X-RequiredRollbackA-025」の件数（取り消し）").toBe(0);
    expect.soft(b.件数, "2行目「M1405X-RequiredRollbackB-025」の件数").toBe(0);
  },
}));

caseTest("IT-M14-05-026", 取込({
  file: (h) => ({
    name: "m14-05_back_notfound-026.csv",
    buffer: CSV本文(h, [行({ name_en: rc("M1405X-BackNotfoundA-026") }), 行({ name_en: rc("M1405X-BackNotfoundB-026"), back_card_detail_id: "999999" })]),
  }),
  読む: () => ({ e: 読む(名E("26")), a: 読む(rc("M1405X-BackNotfoundA-026")), b: 読む(rc("M1405X-BackNotfoundB-026")) }),
  確かめ: (after, before, r) => {
    expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(after.a.件数, "1行目「M1405X-BackNotfoundA-026」の件数（取り消し）").toBe(0);
    expect.soft(after.b.件数, "2行目「M1405X-BackNotfoundB-026」の件数").toBe(0);
    expect.soft(after.e.件数, "既存カード「M1405X-Existing-026」の件数（取込前と同じ）").toBe(before.e.件数);
  },
}));

// ---------------------------------------------------------------------------
// 空欄の扱い・紐付け
// ---------------------------------------------------------------------------

caseTest("IT-M14-05-027", 取込({
  file: (h) => ({ name: "m14-05_back_empty-027.csv", buffer: CSV本文(h, [更新行("27", { back_card_detail_id: "" })]) }),
  読む: () => 読む(名E("27")),
  確かめ: (s, before) => {
    expect.soft(before.詳細.find((x) => x.詳細ID === "145001027")?.裏面詳細ID, "取込前: 裏面カード詳細ID").toBe("145002027");
    expect.soft(s.詳細.find((x) => x.詳細ID === "145001027")?.裏面詳細ID ?? null, "カード詳細ID 145001027 の裏面カード詳細ID（未設定）").toBeNull();
  },
}));

caseTest("IT-M14-05-028", 取込({
  file: (h) => ({ name: "m14-05_color_order_empty-028.csv", buffer: CSV本文(h, [更新行("28", { color_sequence: "", color: "White,Blue" })]) }),
  読む: () => 読む(名E("28")),
  確かめ: (s, before) => {
    expect.soft(before.色順, "取込前: 色順").toBe("マルチ-白青");
    expect.soft(s.色順, "取込後: 色順（未設定）").toBeNull();
  },
}));

caseTest("IT-M14-05-029", 取込({
  file: (h) => ({
    name: "m14-05_relation_dedupe-029.csv",
    buffer: CSV本文(h, [更新行("29", {
      cardtype: "Creature,_enchantment/Creature,_enchantment", color: "White/Blue,White,Blue", color_identity: "White,Blue/White,Blue",
      subtype: "Adventure,Advisor/Adventure,Advisor", specialtype: "Basic/Legendary,Basic,Legendary",
    })]),
  }),
  読む: () => 読む(名E("29")),
  確かめ: (s) => 確かめる(s, "M1405X-Existing-029", { 型: ["Creature", "_enchantment"], 色: ["White", "Blue"], 固有色: ["White", "Blue"], 副型: ["Adventure", "Advisor"], 特殊: ["Basic", "Legendary"] }),
}));

caseTest("IT-M14-05-030", 取込({
  file: (h) => ({ name: "m14-05_relation_empty-030.csv", buffer: CSV本文(h, [更新行("30", { cardtype: "", color: "", color_identity: "", subtype: "", specialtype: "" })]) }),
  読む: () => 読む(名E("30")),
  確かめ: (s, before) => {
    確かめる(before, "M1405X-Existing-030（取込前）", { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"] });
    確かめる(s, "M1405X-Existing-030", { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"] });
  },
}));

caseTest("IT-M14-05-031", 取込({
  file: (h) => ({
    name: "m14-05_relation_duplicate_name-031.csv",
    buffer: CSV本文(h, [
      更新行("31", { cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic" }),
      更新行("31", { cardtype: "_enchantment", color: "Blue", color_identity: "Blue", subtype: "Advisor", specialtype: "Legendary" }),
    ]),
  }),
  読む: () => 読む(名E("31")),
  確かめ: (s) => 確かめる(s, "M1405X-Existing-031", { 件数: 1, 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"] }),
}));

caseTest("IT-M14-05-032", 取込({
  file: (h) => ({ name: "m14-05_format_replace-032.csv", buffer: CSV本文(h, [更新行("32", { format: "Modern" })]) }),
  読む: () => 読む(名E("32")),
  確かめ: (s, before) => {
    確かめる(before, "M1405X-Existing-032（取込前）", { 可: ["Legacy", "Modern"] });
    確かめる(s, "M1405X-Existing-032", { 可: ["Modern"] });
  },
}));

caseTest("IT-M14-05-033", 取込({
  file: (h) => ({ name: "m14-05_format_empty-033.csv", buffer: CSV本文(h, [更新行("33", { format: "" })]) }),
  読む: () => 読む(名E("33")),
  確かめ: (s, before) => {
    確かめる(before, "M1405X-Existing-033（取込前）", { 可: ["Legacy", "Modern"] });
    確かめる(s, "M1405X-Existing-033", { 可: ["Legacy", "Modern"] });
  },
}));

caseTest("IT-M14-05-034", 取込({
  file: (h) => ({ name: "m14-05_promotion_empty-034.csv", buffer: CSV本文(h, [更新行("34", { promotion_type: "" })]) }),
  読む: () => 読む(名E("34")),
  確かめ: (s, before) => {
    expect.soft(before.詳細.find((x) => x.詳細ID === "145001034")?.プロモ種別, "取込前: プロモ種別").toBe("Promotion");
    expect.soft(s.詳細.find((x) => x.詳細ID === "145001034")?.プロモ種別, "取込後: プロモ種別（非プロモーション）").toBe("Non Promotion");
  },
}));

// 読み取り（BOM・ゼロ幅スペース・CRLF）
caseTest("IT-M14-05-035", 取込({
  file: (h) => {
    const 表示 = rc("M1405 BOM Card");
    const 名 = 表示.replace("M1405 ", "M1405 ​"); // ゼロ幅スペースを挿入（除去後は印つきの正本の名前になる）
    return { name: "m14-05_bom_zwsp_crlf-035.csv", buffer: CSV本文(h, [行({ name_en: 名 })], { bom: true, 改行: "\r\n" }) };
  },
  読む: () => ({ ok: 読む(rc("M1405 BOM Card")) }),
  確かめ: ({ ok }) => { expect.soft(ok.件数, "カード「M1405 BOM Card」の件数（BOMとゼロ幅スペースを除いた名前）").toBe(1); },
}));

// TSV
const TSV本文 = (h: string[], rows: CSV行[]) => CSV本文(h, rows, { 区切り: "\t" });
caseTest("IT-M14-05-043", 取込({
  file: (h) => ({ name: "m14-05_valid-043.tsv", buffer: TSV本文(h, [更新行("43")]), mimeType: "text/tab-separated-values" }),
  ...変更されない("43"),
}));
caseTest("IT-M14-05-044", 取込({
  file: (h) => ({ name: "m14-05_valid-044.tsv", buffer: TSV本文(h, [行({ name_en: rc("M1405X-TSVCard-044") })]), mimeType: "text/tab-separated-values" }),
  戻る: true,
}));

// ---------------------------------------------------------------------------
// 列ごとの取り込み方（新規1行）
// ---------------------------------------------------------------------------

type 取込の設定<T> = Parameters<typeof 取込<T>>[0];
const 新規行 = (n: string, 詳細ID: string, o: CSV行, 期待のカード: (s: 状態, r: 送信の結果) => void, ファイル名: string): 取込の設定<状態> => {
  const 名 = rc(`M1405-${n}-A`);
  return {
    file: (h) => ({ name: ファイル名, buffer: CSV本文(h, [{ name_en: 名, card_detail_id: 詳細ID, rarity: "Uncommon", layout: "Normal", image_en: 画像(n), ...o }]) }),
    読む: () => 読む(名),
    確かめ: (s, _b, r) => 期待のカード(s, r),
  };
};

caseTest("IT-M14-05-048", 取込(新規行("048", "14520481", { power: "3", toughness: "4" }, (s) => {
  expect.soft(s.パワー, "カードのパワー").toBe("3");
  expect.soft(s.タフネス, "カードのタフネス").toBe("4");
  const d = 詳細IDの詳細("14520481");
  expect.soft(d?.パワー, "カード詳細14520481のパワー").toBe("3");
  expect.soft(d?.タフネス, "カード詳細14520481のタフネス").toBe("4");
}, "m14-05_power_toughness-048.csv")));

const 未登録マスタ = (n: string): ((s: 状態, r: 送信の結果) => void) => (s, r) => {
  expect.soft(r.エラー.length, `取込のエラー表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
  expect.soft(s.件数, `カード「M1405-${n}-A」の件数（取込エラーで登録されない）`).toBe(0);
};
caseTest("IT-M14-05-049", 取込(新規行("049", "14520491", { color: "M1405-049-NoColor" }, 未登録マスタ("049"), "m14-05_master_missing-049.csv")));
caseTest("IT-M14-05-050", 取込(新規行("050", "14520501", { subtype: "M1405-050-NoSub" }, 未登録マスタ("050"), "m14-05_master_missing-050.csv")));
caseTest("IT-M14-05-051", 取込(新規行("051", "14520511", { specialtype: "M1405-051-NoSpecial" }, 未登録マスタ("051"), "m14-05_master_missing-051.csv")));
caseTest("IT-M14-05-052", 取込(新規行("052", "14520521", { set: "M1405-052-NoSet" }, 未登録マスタ("052"), "m14-05_master_missing-052.csv")));
caseTest("IT-M14-05-053", 取込(新規行("053", "14520531", { rarity: "M1405-053-NoRarity" }, 未登録マスタ("053"), "m14-05_master_missing-053.csv")));
caseTest("IT-M14-05-054", 取込(新規行("054", "14520541", { layout: "M1405-054-NoLayout" }, 未登録マスタ("054"), "m14-05_master_missing-054.csv")));
caseTest("IT-M14-05-055", 取込(新規行("055", "14520551", { promotion_type: "M1405-055-NoPromo" }, 未登録マスタ("055"), "m14-05_master_missing-055.csv")));
caseTest("IT-M14-05-056", 取込(新規行("056", "14520561", { color_sequence: "M1405-056-NoOrder" }, 未登録マスタ("056"), "m14-05_master_missing-056.csv")));

caseTest("IT-M14-05-057", 取込(新規行("057", "14520571", { color_identity: "Black,Red,Green,Colorless" }, (s) => {
  expect.soft(s.件数, "カード「M1405-057-A」の件数").toBe(1);
  expect.soft(s.固有色, "固有色").toEqual(["Black", "Colorless", "Green", "Red"]);
}, "m14-05_unique_color-057.csv")));

{
  const イラスト = rc("M1405-058-Illustrator");
  const 名 = rc("M1405-058-A");
  caseTest("IT-M14-05-058", 取込({
    file: (h) => ({ name: "m14-05_illustrator_new-058.csv", buffer: CSV本文(h, [行({ name_en: 名, card_detail_id: "14520581", illustrator: イラスト, image_en: 画像("058") })]) }),
    読む: () => ({ s: 読む(名), 前: イラストレーターの件数(イラスト) }),
    確かめ: ({ s }, { 前 }) => {
      expect.soft(前, "取込前: イラストレーターのマスタ件数").toBe(0);
      expect.soft(イラストレーターの件数(イラスト), "取込後: イラストレーター「M1405-058-Illustrator」のマスタ件数").toBe(1);
      expect.soft(s.件数, "カード「M1405-058-A」の件数").toBe(1);
      expect.soft(s.詳細.map((d) => d.イラストレーター), "カードのイラストレーター").toContain(イラスト);
    },
  }));
}

caseTest("IT-M14-05-059", 取込(新規行("059", "14520591", { layout: "" }, (s) => {
  expect.soft(s.件数, "カード「M1405-059-A」の件数（レイアウトが空の行は取り込まれない）").toBe(0);
}, "m14-05_layout_blank-059.csv")));

{
  const A = rc("M1405-060-A"), B = rc("M1405-060-B");
  caseTest("IT-M14-05-060", 取込({
    file: (h) => ({
      name: "m14-05_frame_values-060.csv",
      buffer: CSV本文(h, [
        行({ name_en: A, card_detail_id: "14520601", frame: "Normal", image_en: "m14-05-060-a-en.jpg" }),
        行({ name_en: B, card_detail_id: "14520602", frame: "Special", image_en: "m14-05-060-b-en.jpg" }),
      ]),
    }),
    読む: () => ({ a: 読む(A), b: 読む(B) }),
    確かめ: ({ a, b }) => {
      expect.soft(a.詳細.find((d) => d.詳細ID === "14520601")?.フレーム, "「M1405-060-A」のフレーム").toBe("Normal");
      expect.soft(b.詳細.find((d) => d.詳細ID === "14520602")?.フレーム, "「M1405-060-B」のフレーム").toBe("Special");
    },
  }));
}

caseTest("IT-M14-05-061", 取込(新規行("061", "14520611", { color_identity: "Purple" }, (s) => {
  expect.soft(s.固有色, "カードの固有色（Purpleを含まない）").not.toContain("Purple");
  expect.soft(マスターの件数("color", "Purple"), "カラーのマスタに「Purple」が増えていない").toBe(0);
}, "m14-05_unique_color_invalid-061.csv")));

caseTest("IT-M14-05-062", 取込(新規行("062", "14520621", { frame: "Rainbow" }, (s) => {
  expect.soft(s.詳細.map((d) => d.フレーム), "カードのフレーム（Rainbowを含まない）").not.toContain("Rainbow");
}, "m14-05_frame_invalid-062.csv")));

caseTest("IT-M14-05-063", 取込(新規行("063", "14520631", { set: "Aether Revolt" }, (s) => {
  expect.soft(s.件数, "カード「M1405-063-A」の件数").toBe(1);
  expect.soft(s.詳細.map((d) => d.カードセット), "カードのカードセット").toContain("Aether Revolt");
}, "m14-05_cardset_registered-063.csv")));
caseTest("IT-M14-05-064", 取込(新規行("064", "14520641", {}, (s) => {
  expect.soft(s.件数, "カード「M1405-064-A」の件数").toBe(1);
  expect.soft(s.詳細.map((d) => d.レアリティ), "カードのレアリティ").toContain("Uncommon");
}, "m14-05_rarity_registered-064.csv")));
caseTest("IT-M14-05-065", 取込(新規行("065", "14520651", { layout: "Normal" }, (s) => {
  expect.soft(s.件数, "カード「M1405-065-A」の件数").toBe(1);
  expect.soft(s.詳細.map((d) => d.レイアウト), "カードのレイアウト").toContain("Normal");
}, "m14-05_layout_registered-065.csv")));
caseTest("IT-M14-05-066", 取込(新規行("066", "14520661", { promotion_type: "Promotion" }, (s) => {
  expect.soft(s.件数, "カード「M1405-066-A」の件数").toBe(1);
  expect.soft(s.詳細.map((d) => d.プロモ種別), "カードのプロモ種別").toContain("Promotion");
}, "m14-05_promo_registered-066.csv")));
caseTest("IT-M14-05-067", 取込(新規行("067", "14520671", { color_sequence: "マルチ-白青" }, (s) => {
  expect.soft(s.件数, "カード「M1405-067-A」の件数").toBe(1);
  expect.soft(s.色順, "カードの色順").toBe("マルチ-白青");
}, "m14-05_color_order_registered-067.csv")));

caseTest("IT-M14-05-068", 取込({
  file: (h) => ({
    name: "m14-05_mixed-068.csv",
    buffer: CSV本文(h, [
      行({ name_en: rc("M1405-068-A"), card_detail_id: "14520681", cmc: "2", image_en: 画像("068-a") }),
      行({ name_en: rc("M1405-068-B"), card_detail_id: "14520682", cmc: "5", image_en: 画像("068-b") }),
    ]),
  }),
  読む: (n) => ({ a: 読む(rc("M1405-068-A")), b: 読む(rc("M1405-068-B")), id: n.get("〔カードID-M1405-068〕") }),
  確かめ: ({ a, b, id }) => {
    expect.soft(a.件数, "新規カード「M1405-068-A」の件数").toBe(1);
    expect.soft(a.詳細.map((d) => d.詳細ID), "「M1405-068-A」のカード詳細").toEqual(["14520681"]);
    expect.soft(a.マナ, "「M1405-068-A」の点数で見たマナコスト").toBe(2);
    expect.soft(b.件数, "既存カード「M1405-068-B」の件数（1件のまま）").toBe(1);
    expect.soft(b.カードID, "「M1405-068-B」が既存のカードのまま").toBe(id);
    expect.soft(b.詳細.map((d) => d.詳細ID), "「M1405-068-B」のカード詳細").toEqual(["14520682"]);
    expect.soft(b.マナ, "「M1405-068-B」の点数で見たマナコスト（5へ更新）").toBe(5);
  },
  戻る: true,
}));

caseTest("IT-M14-05-069", 取込({
  file: (h) => ({ name: "m14-05_repeat-069.csv", buffer: CSV本文(h, [行({ name_en: rc("M1405-069-A"), card_detail_id: "14520691", cmc: "3", image_en: 画像("069") })]) }),
  読む: () => 読む(rc("M1405-069-A")),
  二度: true,
  確かめ: (s) => {
    expect.soft(s.件数, "カード「M1405-069-A」の件数（2回送っても1件）").toBe(1);
    expect.soft(s.詳細.filter((d) => d.詳細ID === "14520691").length, "カード詳細ID 14520691 の件数").toBe(1);
    expect.soft(s.マナ, "点数で見たマナコスト").toBe(3);
  },
}));

caseTest("IT-M14-05-070", 取込(新規行("070", "14520701", { cardtype: "Creature", color: "White", subtype: "Adventure", specialtype: "Basic" }, (s) => {
  確かめる(s, "M1405-070-A", { 型: ["Creature"], 色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"] });
}, "m14-05_single_value-070.csv")));
caseTest("IT-M14-05-071", 取込(新規行("071", "14520711", { restriction_format: "Modern" }, (s) => {
  expect.soft(s.制限, "使用制限フォーマット").toEqual(["Modern"]);
}, "m14-05_format_restricted-071.csv")));
caseTest("IT-M14-05-072", 取込(新規行("072", "14520721", { ban_format: "Modern" }, (s) => {
  expect.soft(s.禁止, "使用禁止フォーマット").toEqual(["Modern"]);
}, "m14-05_format_banned-072.csv")));

// ---------------------------------------------------------------------------
// 組み合わせ（カードタイプ・カラーなどの紐付け、レイアウト、点数で見たマナコスト）
// ---------------------------------------------------------------------------

type CB = { n: string; 行: CSV行[]; 既存?: boolean; 期待: 期待; 詳細?: Record<string, { カードNo?: string; フレーム?: string }> };
const CB設定 = (c: CB): 取込の設定<{ s: 状態 }> => {
  const 名 = CB名(c.n);
  const 画像名 = `m14-05-cb${c.n}-en.jpg`;
  return {
    file: (h) => ({ name: `m14-05_cb-${c.n}.csv`, buffer: CSV本文(h, c.行.map((r) => 行({ name_en: 名, image_en: 画像名, ...r }))) }),
    読む: () => ({ s: 読む(名) }),
    確かめ: ({ s }, 前) => {
      確かめる(s, `M1405-CB${c.n}-A`, { 件数: 1, ...(c.既存 ? { 同じカード: 前.s.カードID ?? "（取込前に無い）" } : {}), ...c.期待 });
      for (const [d, v] of Object.entries(c.詳細 ?? {})) {
        const x = s.詳細.find((y) => y.詳細ID === d);
        expect.soft(x !== undefined, `カード詳細ID ${d} がある`).toBe(true);
        if (v.カードNo) expect.soft(x?.コレクターNo, `カード詳細ID ${d} のカードNo`).toBe(v.カードNo);
        if (v.フレーム) expect.soft(x?.フレーム, `カード詳細ID ${d} のフレーム`).toBe(v.フレーム);
      }
    },
  };
};

caseTest("IT-M14-05-074", 取込(CB設定({ n: "074", 行: [{ cardtype: "Creature", color_identity: "White", specialtype: "Basic", format: "Legacy,Modern", layout: "Split", cmc: "2/3" }],
  期待: { 型: ["Creature"], 色: [], 固有色: ["White"], 副型: [], 特殊: ["Basic"], 可: ["Legacy", "Modern"], 制限: [], 禁止: [], レイアウト: "Split", マナ: 5 } })));
caseTest("IT-M14-05-075", 取込(CB設定({ n: "075", 行: [
  { cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", restriction_format: "Vintage", ban_format: "Commander", layout: "Flip", cmc: "3" },
  { color: "Blue", subtype: "Advisor", restriction_format: "Vintage", ban_format: "Commander", layout: "Flip", cmc: "3" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: [], 制限: ["Vintage"], 禁止: ["Commander"], レイアウト: "Flip", マナ: 3 } })));
caseTest("IT-M14-05-076", 取込(CB設定({ n: "076", 行: [{ color: "White", color_identity: "White", subtype: "Adventure", format: "Legacy,Modern", layout: "Double Faced" }],
  期待: { 型: [], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: [], 可: ["Legacy", "Modern"], 制限: [], 禁止: [], レイアウト: "Meld", マナ: 0 } })));
caseTest("IT-M14-05-077", 取込(CB設定({ n: "077", 行: [{ cardtype: "Creature", color: "White", specialtype: "Basic", restriction_format: "Vintage", ban_format: "Commander", layout: "Normal" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: [], 副型: [], 特殊: ["Basic"], 可: [], 制限: ["Vintage"], 禁止: ["Commander"], レイアウト: "Normal", マナ: 0 } })));
caseTest("IT-M14-05-078", 取込(CB設定({ n: "078", 既存: true, 行: [{ cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", restriction_format: "Vintage", layout: "Split", cmc: "3/4" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Legendary"], 可: ["Pioneer"], 制限: ["Vintage"], 禁止: [], レイアウト: "Split", マナ: 7 } })));
caseTest("IT-M14-05-079", 取込(CB設定({ n: "079", 既存: true, 行: [{ cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", format: "Modern", layout: "Flip", cmc: "5", card_detail_id: "14570791", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Modern"], 制限: [], 禁止: [], レイアウト: "Flip", マナ: 5 }, 詳細: { "14570791": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-082", 取込(CB設定({ n: "082", 既存: true, 行: [
  { cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", format: "Modern", layout: "Split", card_detail_id: "14570821", card_no: "7", frame: "Special" },
  { cardtype: "_enchantment", subtype: "Advisor", specialtype: "Legendary", format: "Modern", layout: "Split", card_detail_id: "14570822", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Modern"], 制限: [], 禁止: [], レイアウト: "Split", マナ: 0 },
  詳細: { "14570821": { カードNo: "7", フレーム: "Special" }, "14570822": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-083", 取込(CB設定({ n: "083", 行: [{ cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", restriction_format: "Vintage", ban_format: "Commander", layout: "Double Faced", cmc: "6", card_detail_id: "14570831", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: [], 制限: ["Vintage"], 禁止: ["Commander"], レイアウト: "Meld", マナ: 6 }, 詳細: { "14570831": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-084", 取込(CB設定({ n: "084", 既存: true, 行: [
  { cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", format: "Modern", layout: "Double Faced", cmc: "2", card_detail_id: "14570841", card_no: "7", frame: "Special" },
  { color: "Blue", specialtype: "Legendary", format: "Modern", layout: "Double Faced", cmc: "2", card_detail_id: "14570842", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Modern"], 制限: [], 禁止: [], レイアウト: "Meld", マナ: 2 },
  詳細: { "14570841": { カードNo: "7", フレーム: "Special" }, "14570842": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-085", 取込(CB設定({ n: "085", 既存: true, 行: [{ cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", format: "Modern", layout: "Normal", cmc: "7", card_detail_id: "14570851", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Legendary"], 可: ["Modern"], 制限: [], 禁止: [], レイアウト: "Normal", マナ: 7 }, 詳細: { "14570851": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-086", 取込(CB設定({ n: "086", 既存: true, 行: [{ cardtype: "Creature", color_identity: "White", subtype: "Adventure", specialtype: "Basic", restriction_format: "Vintage", ban_format: "Commander", layout: "Split", cmc: "6", card_detail_id: "14570861", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["Blue"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Pioneer"], 制限: ["Vintage"], 禁止: ["Commander"], レイアウト: "Split", マナ: 6 }, 詳細: { "14570861": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-087", 取込(CB設定({ n: "087", 既存: true, 行: [{ cardtype: "Creature", color_identity: "White", specialtype: "Basic", format: "Modern", layout: "Flip", card_detail_id: "14570871", card_no: "7", frame: "Special" }],
  期待: { 型: ["Creature"], 色: ["Blue"], 固有色: ["White"], 副型: ["Advisor"], 特殊: ["Basic"], 可: ["Modern"], 制限: [], 禁止: [], レイアウト: "Flip", マナ: 0 }, 詳細: { "14570871": { カードNo: "7", フレーム: "Special" } } })));
caseTest("IT-M14-05-088", 取込(CB設定({ n: "088", 行: [{ color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic", format: "Legacy,Modern", layout: "Split", cmc: "1/2" }],
  期待: { 型: [], 色: ["White"], 固有色: ["White"], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Legacy", "Modern"], 制限: [], 禁止: [], レイアウト: "Split", マナ: 3 } })));
caseTest("IT-M14-05-089", 取込(CB設定({ n: "089", 行: [{ cardtype: "Creature", color: "White", subtype: "Adventure", specialtype: "Basic", format: "Legacy,Modern", layout: "Flip", cmc: "4/2" }],
  期待: { 型: ["Creature"], 色: ["White"], 固有色: [], 副型: ["Adventure"], 特殊: ["Basic"], 可: ["Legacy", "Modern"], 制限: [], 禁止: [], レイアウト: "Flip", マナ: 4 } })));
