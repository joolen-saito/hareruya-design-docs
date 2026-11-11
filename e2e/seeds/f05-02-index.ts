/**
 * F05-02 ネット買取商品検索（フロント）の、検索サービス（ユニサーチ）の索引に載せる商品のシード。正本: cases/F05-02_seed_data.tsv
 * （最初の分は seeds/f05-02.ts・f05-02-more.ts。依頼者の決定 2026-11-11 夜「ユニサーチのフィード連携はしてもいい」）
 *
 * 作り方: カード詳細(登録)でカードを登録し、グッズ商品CSV登録で商品を取り込み、商品登録編集の「カード指定」でカードを指定する
 * （pages/admin/f05_index_products.ts）。この機能の索引用のシードの商品を1回の起動でまとめて作り、ユニサーチフィード作成で1回だけ送って、
 * 公開側の検索に出るまで待つ（seeds/f05_index_batch.ts）。
 * 商品名・商品コード・カード名・タグ名には実行の印を付ける（rc。依頼者決定 2026-10-28）。検索語も同じ印つきの値で入れる。
 *
 * シード表から読み替えたこと（各シードの報告にも出す）:
 * - 販売価格: 買取価格は販売価格を上回れないので、販売価格（基準価格）は 1000 円と買取価格の大きいほうにした（シード表の販売価格100円・0円は
 *   画面で作れず、シード表は DB での直接設定とする。ケースは販売価格を確かめない）。
 * - 在庫: ケースが在庫を確かめない商品は入庫しない（018 の ELIGIBLE-STOCK-018 だけ在庫10を入れる）。
 * - カードのNM以外の状態（018 の STATE-EX-018）は、DB での直接設定ではなく、商品規格一覧の「新規作成」で
 *   スライトリープレイドの規格を足し、ニアミントの規格を削除して作る（F05-03 のシード表と同じ作り方。刷新後の状態の選択肢にEXは無い）。
 * - 017 の61商品のカード: 控える呼び名は 001 と 061 のカードIDだけなので、カードは 001 と 061 の商品にだけ作って指定する
 *   （ケースは件数とページだけを確かめ、カードの値を見ない）。
 * - 「同じ商品名の他商品を0件」: 印つきの商品名にしたので、前の実行の商品とは重ならない。既存の商品は消さない。
 * - 販売の公開・言語・カテゴリなど、シード表が定めない必須の値は、グッズ商品CSVの既定（pages/admin/m03_01_goods_register.ts）のまま。
 *
 * 作らないシード: COLORONLY-029（使うケース 029 は、色の赤だけで検索し「赤を含む商品は自分の商品だけ」を前提にする。共有の索引には
 * 赤のカードの商品が多数あり、自分の商品だけに絞れないため、ケースを実装しない）。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 索引用カード, 索引用カードの詳細, 索引用カードを登録する, 索引用商品, 索引用の商品を作る, 商品一覧の表示件数のマスタを読む } from "../pages/admin/f05_index_products";
import { TagPage } from "../pages/admin/m03_13_tag";
import { ネット買取商品一覧のパス } from "../pages/front/f05_02_purchase_search";
import { defineSeed } from "./current_seed";
import "./f05-02"; // S-F05-02-MASTERS（共有のマスタ）
import { 索引のまとめ, まとめの結果 } from "./f05_index_batch";

export const F0502索引 = new 索引のまとめ("F05-02 ネット買取商品検索");

/** シードが作った商品（シードID → 商品コードの正本の値 → 商品ID など）。ケースが期待結果の商品を引く */
const 作った = new Map<string, Map<string, { 商品ID: string; 規格ID: string; カードID: string; 名: string }>>();
export function f0502の商品(seedId: string, 正本のコード: string): { 商品ID: string; 規格ID: string; カードID: string; 名: string } {
  const p = 作った.get(seedId)?.get(正本のコード);
  if (!p) throw new Error(`${seedId} の商品 ${正本のコード} はまだ作っていない`);
  return p;
}

/** 1商品の定義（正本の値。印はここで付ける） */
type 品 = {
  コード: string; 名: string;
  /** 商品に指定するカード。カードを共有するときは同じ「カードの組」の名前を書く */
  カード?: Omit<索引用カード, "名" | "詳細"> & { 詳細?: 索引用カードの詳細; 組?: string };
  商品?: Omit<Partial<索引用商品>, "コード" | "名" | "カード">;
};

/** シード表の呼び名（〔商品ID-F0502-006A〕〔商品規格ID-F0502-017-061〕〔カードID-F0502-014B〕）を控える値に直す */
function 呼び名の控え(seedId: string, 商品: { 商品ID: string; 規格ID: string }[], カード: string[], カードの組: string[]): [string, string][] {
  const seed = getSeed(seedId);
  const out: [string, string][] = [];
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(商品ID|商品規格ID|カードID)-F0502-(\d{3})(?:-(\d{3})|([A-Z]))?〕$/.exec(label);
    if (!m) continue; // 共有のマスタの呼び名（MASTERS が控えたもの）
    const i = m[3] ? Number(m[3]) - 1 : m[4] ? m[4].charCodeAt(0) - 65 : 0;
    const v = m[1] === "商品ID" ? 商品[i]?.商品ID : m[1] === "商品規格ID" ? 商品[i]?.規格ID : (カードの組.length ? カードの組[i] : カード[i]);
    if (!v) throw new Error(`${seedId}: ${label} に当たる番号が無い`);
    out.push([label, v]);
  }
  return out;
}

async function 作る(c: { browser: import("@playwright/test").Browser; issue: (m: string) => void }, seedId: string, list: 品[], 組の順?: string[]): Promise<まとめの結果> {
  const 組 = new Map<string, { 定義: 品["カード"]; 詳細: 索引用カードの詳細[]; 番号: number[] }>();
  list.forEach((p, i) => {
    if (!p.カード) return;
    const key = p.カード.組 ?? `#${i}`;
    const g = 組.get(key) ?? { 定義: p.カード, 詳細: [], 番号: [] };
    g.詳細.push(p.カード.詳細 ?? {});
    g.番号.push(i);
    組.set(key, g);
  });
  const 指定 = new Map<number, { 名: string; 詳細ID: string; カードID: string }>();
  const 組のカードID = new Map<string, string>();
  await withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [key, g] of 組) {
      const 名 = rc(`F0502カード-${seedId.slice(-3)}-${key.replace("#", "")}`);
      const { 組: _, 詳細: __, ...rest } = g.定義!;
      const r = await 索引用カードを登録する(page, { ...rest, 名, 詳細: g.詳細 }, `${seedId}: カード ${名}`, c.issue);
      g.番号.forEach((i, k) => 指定.set(i, { 名, 詳細ID: r.詳細IDs[k], カードID: r.カードID }));
      組のカードID.set(key, r.カードID);
    }
  });
  const defs: 索引用商品[] = list.map((p, i) => ({
    買取: 100, ...p.商品, コード: rc(p.コード), 名: rc(p.名),
    カード: 指定.has(i) ? { 名: 指定.get(i)!.名, 詳細ID: 指定.get(i)!.詳細ID } : undefined,
  }));
  const made = await 索引用の商品を作る(c.browser, seedId, defs, c.issue);
  const 商品 = defs.map((d, i) => {
    const m = made.get(d.コード);
    return { 商品ID: m?.商品ID ?? "", 規格ID: m?.規格ID ?? "", カードID: 指定.get(i)?.カードID ?? "", 名: d.名! };
  });
  作った.set(seedId, new Map(list.map((p, i) => [p.コード, 商品[i]])));
  c.issue(`${seedId}: 商品 ${list.map((p, i) => `${rc(p.コード)}（商品ID ${商品[i].商品ID || "読まない"}）`).join("、")} を作った`);
  const 目印商品 = list.findIndex((p) => (p.商品?.買取 ?? 100) > 0 && !p.商品?.NM以外 && !p.商品?.高額商品コード && !p.商品?.予約);
  return {
    控え: 呼び名の控え(seedId, 商品, list.map((_, i) => 指定.get(i)?.カードID ?? ""), (組の順 ?? []).map((k) => 組のカードID.get(k) ?? "")),
    目印: { パス: `${ネット買取商品一覧のパス}?product=${encodeURIComponent(rc(list[目印商品].名))}`, 商品名: rc(list[目印商品].名) },
  };
}

function defineIndexSeed(seedId: string, f: (c: { browser: import("@playwright/test").Browser; notes: Notes; issue: (m: string) => void }) => Promise<まとめの結果>): void {
  F0502索引.足す(seedId, f);
  defineSeed(seedId, { needs: ["S-F05-02-MASTERS"] }, async ({ browser, notes }) => { await F0502索引.用意する(seedId, browser, notes); });
}

// ---- 006（14条件すべてに一致する1商品と、1条件だけ違う14商品） ----
defineIndexSeed("S-F05-02-DETAIL-006", async (c) => {
  const n = (k: string) => c.notes.get(`〔${k}〕`);
  const 基本 = {
    色: ["赤"], 固有色: ["白"], 点数で見たマナ: "3", カードタイプ: [{ ID: n("カードタイプID-F0502-共有A") }], サブタイプID: [n("サブタイプID-F0502-共有A")],
    リーガリティ: [{ フォーマットID: n("フォーマットID-F0502-共有A"), 種別: "使用可" }],
  };
  const 詳細: 索引用カードの詳細 = { カードセットID: n("カードセットID-F0502-共有A"), レアリティ: "神話レア", イラストレーターID: n("イラストレーターID-F0502-共有A"), Foil: "特殊", フレーム: "特殊" };
  const 商品 = { カテゴリID: [n("カテゴリID-F0502-共有B")] };
  const 違い: [string, Partial<品["カード"]> & { 詳細?: 索引用カードの詳細 }, Partial<索引用商品>?, string?][] = [
    ["01", {}, undefined, "F0502-DIFF-NAME-006"],
    ["02", {}, { カテゴリID: [n("カテゴリID-F0502-共有C")] }],
    ["03", { 詳細: { ...詳細, カードセットID: n("カードセットID-F0502-共有B") } }],
    ["04", { 色: ["青"] }], ["05", { 固有色: ["青"] }], ["06", { 点数で見たマナ: "4" }],
    ["07", { カードタイプ: [{ ID: n("カードタイプID-F0502-共有B") }] }], ["08", { サブタイプID: [n("サブタイプID-F0502-共有B")] }],
    ["09", { リーガリティ: [{ フォーマットID: n("フォーマットID-F0502-共有B"), 種別: "使用可" }] }],
    ["10", {}, { 言語: "英語" }],
    ["11", { 詳細: { ...詳細, レアリティ: "レア" } }], ["12", { 詳細: { ...詳細, Foil: "通常" } }], ["13", { 詳細: { ...詳細, フレーム: "通常" } }],
    ["14", { 詳細: { ...詳細, イラストレーターID: n("イラストレーターID-F0502-共有B") } }],
  ];
  return 作る(c, "S-F05-02-DETAIL-006", [
    { コード: "DETAIL-ALL-006", 名: "F0502-ALL-006", カード: { ...基本, 詳細 }, 商品 },
    ...違い.map(([no, card, prod, name]) => ({
      コード: `DETAIL-DIFF-${no}-006`, 名: name ?? "F0502-ALL-006", カード: { ...基本, 詳細, ...card }, 商品: { ...商品, ...prod },
    })),
  ]);
});

// ---- 007・028（固有色） ----
defineIndexSeed("S-F05-02-IDENTITY-007", (c) => 作る(c, "S-F05-02-IDENTITY-007", [
  { コード: "IDENTITY-W-007", 名: "F0502-IDENTITY-007", カード: { 固有色: ["白"] } },
  { コード: "IDENTITY-WU-007", 名: "F0502-IDENTITY-007", カード: { 固有色: ["白", "青"] } },
  { コード: "IDENTITY-U-007", 名: "F0502-IDENTITY-007", カード: { 固有色: ["青"] } },
]));
defineIndexSeed("S-F05-02-IDENTITY-028", (c) => 作る(c, "S-F05-02-IDENTITY-028", [
  { コード: "F0502-IDW-028", 名: "F0502-IDENTITY-028", カード: { 固有色: ["白"] } },
  { コード: "F0502-IDU-028", 名: "F0502-IDENTITY-028", カード: { 固有色: ["青"] } },
  { コード: "F0502-IDWU-028", 名: "F0502-IDENTITY-028", カード: { 固有色: ["白", "青"] } },
  { コード: "F0502-IDWK-028", 名: "F0502-IDENTITY-028", カード: { 固有色: ["白", "黒"] } },
]));

// ---- 008（Foil）・009（フレーム） ----
defineIndexSeed("S-F05-02-FOIL-FRAME-008", (c) => 作る(c, "S-F05-02-FOIL-FRAME-008", [
  { コード: "F0502-FOIL-SPECIAL-008", 名: "F0502-FOIL-008", カード: { 詳細: { Foil: "特殊" } } },
  { コード: "F0502-FOIL-OTHER-008", 名: "F0502-FOIL-008", カード: { 詳細: { Foil: "通常" } } },
]));
defineIndexSeed("S-F05-02-FOIL-FRAME-009", (c) => 作る(c, "S-F05-02-FOIL-FRAME-009", [
  { コード: "F0502-FRAME-NORMAL-009", 名: "F0502-FRAME-009", カード: { 詳細: { フレーム: "通常" } } },
  { コード: "F0502-FRAME-SPECIAL-009", 名: "F0502-FRAME-009", カード: { 詳細: { フレーム: "特殊" } } },
]));

// ---- 011（禁止カード） ----
defineIndexSeed("S-F05-02-BANNED-011", (c) => 作る(c, "S-F05-02-BANNED-011", [
  { コード: "BAN-REGULAR-011", 名: "F0502-BAN-011", カード: {} },
  { コード: "BAN-PROHIBITED-011", 名: "F0502-BAN-011", カード: { リーガリティ: [{ フォーマットID: c.notes.get("〔フォーマットID-F0502-共有A〕"), 種別: "禁止" }] } },
]));

// ---- 013（タグと商品名の両方） ----
defineIndexSeed("S-F05-02-TAG-013", async (c) => {
  const seedId = "S-F05-02-TAG-013";
  const tagId = await withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new TagPage(page);
    await tag.openNew();
    return tag.register({ 名称日: rc("T-F0502-013"), 名称英: rc("T-F0502-013"), 並び順: "9997" }, `${seedId}: タグ「${rc("T-F0502-013")}」の登録`);
  });
  const r = await 作る(c, seedId, [
    { コード: "PRESERVE-BOTH-013", 名: "F0502-PRESERVE-013", カード: {}, 商品: { タグID: [tagId] } },
    { コード: "PRESERVE-TAG-013", 名: "F0502-PRESERVE-TAGONLY-013", カード: {}, 商品: { タグID: [tagId] } },
    { コード: "PRESERVE-NAME-013", 名: "F0502-PRESERVE-013", カード: {} },
  ]);
  c.issue(`${seedId}: タグ「${rc("T-F0502-013")}」（タグID ${tagId}）を画面で作り、グッズ商品CSVのタグ(ID)で PRESERVE-BOTH-013・PRESERVE-TAG-013 を所属させた。PRESERVE-TAG-013 の「異なる商品名」は「F0502-PRESERVE-TAGONLY-013」にした（シード表は値を定めない）`);
  return { ...r, 控え: [["〔タグID-F0502-013〕", tagId], ...(r.控え ?? [])] };
});

// ---- 014・015・021（同名商品検索の引継ぎ。A〜D は同じカード、E は別のカード） ----
function 引継ぎ(no: "014" | "015" | "021"): 品[] {
  return [
    { コード: `SOURCE-CARD-${no}`, 名: `SOURCE-CARD-${no}`, カード: { 組: "A", 詳細: { Foil: "なし" } } },
    { コード: `CARRY-HIGH-${no}`, 名: `F0502-CARRY-${no}`, カード: { 組: "A", 詳細: { Foil: "特殊" } }, 商品: { 買取: no === "021" ? 100 : 3000 } },
    { コード: `CARRY-LOW-${no}`, 名: `F0502-CARRY-${no}`, カード: { 組: "A", 詳細: { Foil: "特殊" } }, 商品: { 買取: no === "021" ? 100 : 1000 } },
    { コード: `CARRY-NORMAL-${no}`, 名: `F0502-CARRY-${no}`, カード: { 組: "A", 詳細: { Foil: "通常" } }, 商品: { 買取: no === "021" ? 100 : 2000 } },
    { コード: `CARRY-OTHER-${no}`, 名: `F0502-CARRY-${no}`, カード: { 組: "B", 詳細: { Foil: "特殊" } }, 商品: { 買取: no === "021" ? 100 : 2000 } },
  ];
}
const 引継ぎを作る = (no: "014" | "015" | "021") => async (c: { browser: import("@playwright/test").Browser; notes: Notes; issue: (m: string) => void }): Promise<まとめの結果> => {
  const seedId = `S-F05-02-CARRY-${no}`;
  const r = await 作る(c, seedId, 引継ぎ(no), ["A", "B"]);
  c.issue(`${seedId}: SOURCE-CARD・CARRY-HIGH・CARRY-LOW・CARRY-NORMAL は同じカード（カード「${rc(`F0502カード-${no}-A`)}」の詳細情報を1件ずつ）、CARRY-OTHER は別のカードにした。SOURCE-CARD の Foil・買取価格はシード表が定めないので「なし」・100円${no === "021" ? "。021 の買取価格は「1円以上」なので全商品100円" : ""}`);
  return r;
};
defineIndexSeed("S-F05-02-CARRY-014", 引継ぎを作る("014"));
defineIndexSeed("S-F05-02-CARRY-015", 引継ぎを作る("015"));
defineIndexSeed("S-F05-02-CARRY-021", 引継ぎを作る("021"));
/** 014・015・021 のカードAの名前（021 のページタイトル・パンくずに出るカードの日本語名） */
export const F0502カードAの名 = (no: "014" | "015" | "021") => rc(`F0502カード-${no}-A`);

// ---- 017（既定表示件数。61商品） ----
defineSeed("S-F05-02-PAGING-SETTING", async ({ browser, seed }) => {
  const rows = await withAdminSession(browser, SETUP_ADMIN, (page) => 商品一覧の表示件数のマスタを読む(page));
  const hit = rows.filter((r) => r.ID === "60");
  // 共有のマスタなので、行が無くても足さずに止める（ネット買取商品一覧は ID 60 の行を既定の表示件数として使う）
  expect(hit.length, `${seed.シードID}: 商品一覧の表示件数のマスタにIDが60の行がある（無ければ共有のマスタを書き換えずに止める）`).toBe(1);
  reportSeedIssue(seed.シードID, `マスタデータ管理の商品一覧の表示件数のマスタに、IDが60の行（名称「${hit[0].名称}」）があることを確かめた（書き換えていない）`);
});
defineIndexSeed("S-F05-02-PAGING-017", (c) => 作る(c, "S-F05-02-PAGING-017", Array.from({ length: 61 }, (_, i) => {
  const no = String(i + 1).padStart(3, "0");
  return { コード: `PAGING-${no}-017`, 名: "F0502-PAGING-017", カード: i === 0 || i === 60 ? {} : undefined, 商品: i === 0 || i === 60 ? {} : { 番号を読まない: true } };
})));

// ---- 018（ネット買取の検索対象の判定） ----
defineIndexSeed("S-F05-02-ELIGIBILITY-018", async (c) => {
  const seedId = "S-F05-02-ELIGIBILITY-018";
  const r = await 作る(c, seedId, [
    { コード: "ELIGIBLE-NOSTOCK-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 1, 価格: 1000 } },
    { コード: "ELIGIBLE-STOCK-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 600, 価格: 9999, 在庫: 10 } },
    { コード: "BUY-ZERO-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 0 } },
    { コード: "STATE-EX-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 600, NM以外: true } },
    { コード: "HIGH-CODE-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 600, 高額商品コード: rc("F0502-HIGH-018") } },
    { コード: "RESERVED-018", 名: "F0502-ELIGIBILITY-018", カード: {}, 商品: { 買取: 600, 予約: true } },
  ]);
  c.issue(`${seedId}: 読み替え: ELIGIBLE-NOSTOCK-018 の販売価格は0円にできない（買取価格を上回れない。シード表は DB での直接設定）ので1000円、在庫は0のまま。ELIGIBLE-STOCK-018 は販売価格9999円・在庫10（入庫と承認）。STATE-EX-018 は状態をスライトリープレイドにした（刷新後の状態の選択肢にEXは無い）`);
  return r;
});

// ---- 023・026・027（色とカードタイプの論理演算子） ----
function 色とタイプ(接頭: "LOGIC" | "DEFOP", no: "023" | "026", A: string, B: string): 品[] {
  return [
    { コード: `${接頭}-R-${no}`, 名: `F0502-${接頭}-COLOR-${no}`, カード: { 色: ["赤"] } },
    { コード: `${接頭}-U-${no}`, 名: `F0502-${接頭}-COLOR-${no}`, カード: { 色: ["青"] } },
    { コード: `${接頭}-RU-${no}`, 名: `F0502-${接頭}-COLOR-${no}`, カード: { 色: ["赤", "青"] } },
    { コード: `${接頭}-C-${no}`, 名: `F0502-${接頭}-TYPE-${no}`, カード: { カードタイプ: [{ ID: A }] } },
    { コード: `${接頭}-A-${no}`, 名: `F0502-${接頭}-TYPE-${no}`, カード: { カードタイプ: [{ ID: B }] } },
    { コード: `${接頭}-CA-${no}`, 名: `F0502-${接頭}-TYPE-${no}`, カード: { カードタイプ: [{ ID: A }, { ID: B }] } },
  ];
}
defineIndexSeed("S-F05-02-LOGIC-023", (c) => 作る(c, "S-F05-02-LOGIC-023", 色とタイプ("LOGIC", "023", c.notes.get("〔カードタイプID-F0502-共有A〕"), c.notes.get("〔カードタイプID-F0502-共有B〕"))));
defineIndexSeed("S-F05-02-DEFOP-026", (c) => 作る(c, "S-F05-02-DEFOP-026", 色とタイプ("DEFOP", "026", c.notes.get("〔カードタイプID-F0502-共有A〕"), c.notes.get("〔カードタイプID-F0502-共有B〕"))));
defineIndexSeed("S-F05-02-TYPEAND-027", (c) => {
  const A = c.notes.get("〔カードタイプID-F0502-共有A〕");
  const B = c.notes.get("〔カードタイプID-F0502-共有B〕");
  return 作る(c, "S-F05-02-TYPEAND-027", [
    { コード: "TYPEAND-C-027", 名: "F0502-TYPEAND-027", カード: { カードタイプ: [{ ID: A }] } },
    { コード: "TYPEAND-A-027", 名: "F0502-TYPEAND-027", カード: { カードタイプ: [{ ID: B }] } },
    { コード: "TYPEAND-CA-027", 名: "F0502-TYPEAND-027", カード: { カードタイプ: [{ ID: A }, { ID: B }] } },
  ]);
});
