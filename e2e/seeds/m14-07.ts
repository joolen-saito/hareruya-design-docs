/**
 * M14-07 カードセット管理(画像ダウンロード) のシードの作り方。正本: cases/M14-07_seed_data.tsv
 * 管理者・画面保持状態・確認ダイアログ用のカードセット（S-M14-07-ADM・SESSION・DIALOG-003/004）は seeds/m14-06.ts にある。
 *
 * 依頼者の方針（2026-11-10）に沿った読み替え:
 *  - カードセットは画面で登録し、カードはカードCSVの取り込みで登録する（名称・略称は実行の印つき）。
 *  - カード詳細IDは正本の固定の番号にせず、画面が振った番号を使う（再実行で前の実行の残りに当たらないため）。
 *  - 取得できる画像の実体は画面から置けない。既存のカードが使っている（取得できる）画像URLを、試験用のカード詳細の画像URLとして登録する。
 *    取得できない画像は、実体の無いURLにする。
 *  - 画像を持たないカード詳細・日本語だけの画像（カードCSVは画像URL(英語)が必須）・デッドリンクが真の画像は、
 *    実行の印つきのカード詳細の画像の行だけ DB で整える（db/m14_07_write.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 *  - リリース日は、正本の9999年台を2099年台に読み替えた（日付の入力欄が受け付けるかを確かめられないため。一覧の先頭のほうに並ぶ点は同じ）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { buildCardCsv, downloadCardCsvTemplate, uploadCardCsv } from "../pages/admin/card_csv";
import {
  カード名英の詳細IDs, プロモの英語名, より新しいセットの数, 画像ID, 既存のレアリティ英名, 既存のレイアウト英名, 既存の画像URL, 言語のコード, 日本語, 英語,
} from "../db/m14_07";
import { 画像を消す, デッドリンクを設定する } from "../db/m14_07_write";
import { セットを作る, 総数を満たす } from "./m14-06";

export type 画像 = "実体あり" | "実体なし" | "なし";
export type カード = {
  番号: string;
  /** 収録するカードセット（rc 済みのセット名(英)）。無ければカードセット未設定 */
  セット英名?: string;
  foil?: boolean;
  /** 既定は設定済み（Non Promotion）。false で未設定 */
  プロモ?: boolean;
  日本語?: 画像;
  英語?: 画像;
  日本語デッドリンク真?: boolean;
  英語デッドリンク真?: boolean;
};

/** ケースと共有するキー（カード名(英)の元） */
export const カード名 = (番号: string) => rc(`M1407 Card ${番号}`);

const 共通の注記 =
  "カード詳細IDは、正本の固定の番号ではなく画面が振った番号を使う。画像の実体は画面から置けないので、取得できる画像は既存のカードが使っている画像URLに読み替え、取得できない画像は実体の無い画像URLにした。" +
  "画像を持たないカード詳細・日本語だけの画像・デッドリンクが真の画像は、DBで実行の印つきのカード詳細の画像の行を消す・デッドリンクを設定して作った。リリース日の9999年台は2099年台に読み替えた。" +
  "カードセット・カード名・略称は実行の印つきの値にした。";

/** カードをカードCSVで登録し、カード詳細IDを返す（番号の順）。画像の状態をDBで整える */
export async function カードを作る(browser: Browser, seedId: string, 行: カード[]): Promise<string[]> {
  const レアリティ = 既存のレアリティ英名(), レイアウト = 既存のレイアウト英名();
  if (!レアリティ || !レイアウト) throw new Error(`${seedId}: 既存のレアリティ・レイアウトの英語名を引けない`);
  const ノンプロモ = プロモの英語名(1);
  if (!ノンプロモ) throw new Error(`${seedId}: プロモーションID=1 の英語名を引けない`);
  const 実体 = (言語: number): string => {
    const u = 既存の画像URL(言語);
    if (!u) throw new Error(`${seedId}: 取得できる既存の画像URL（言語ID=${言語}）が無い`);
    return u;
  };
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const headers = await downloadCardCsvTemplate(page);
    const csv = buildCardCsv(headers, 行.map((x) => {
      const r: Record<string, string> = {
        name_jp: `M1407カード${x.番号}`, name_en: カード名(x.番号), cmc: "2", rarity: レアリティ, layout: レイアウト,
        promotion_type: x.プロモ === false ? "" : ノンプロモ, foil: x.foil ? "1" : "0", frame: "Normal", set: x.セット英名 ?? "",
      };
      const 日 = x.日本語 ?? "なし", 英 = x.英語 ?? "なし";
      if (日 !== "なし") r.image_jp = 日 === "実体あり" ? 実体(日本語) : `m1407/${x.番号}-jp.jpg`;
      // 画像URL(英語)は必須。「なし」のときは実体の無いURLで取り込み、あとで画像の行を消す
      r.image_en = 英 === "実体あり" ? 実体(英語) : `m1407/${x.番号}-en.jpg`;
      return r;
    }));
    await uploadCardCsv(page, csv, "m1407-card.csv", `${seedId} のカードCSV登録`, (m) => reportSeedIssue(seedId, m));
  });
  const ids: string[] = [];
  for (const x of 行) {
    const d = カード名英の詳細IDs(カード名(x.番号));
    if (d.length !== 1) throw new Error(`${seedId}: カード「${x.番号}」の詳細が ${d.length} 件（1件のはず）`);
    const id = d[0];
    if ((x.英語 ?? "なし") === "なし") 画像を消す(id, 英語, `${seedId}: 英語画像を持たないカード詳細にするため`);
    if (x.日本語デッドリンク真) デッドリンクを設定する(id, 日本語, true, `${seedId}: 日本語画像のデッドリンクを真にするため`);
    if (x.英語デッドリンク真) デッドリンクを設定する(id, 英語, true, `${seedId}: 英語画像のデッドリンクを真にするため`);
    ids.push(id);
  }
  return ids;
}

/** 日付つきでカードセットを登録する。略称は実行の印つき。セット名(英)は rc(英) になる */
async function セット(browser: Browser, seedId: string, キー: string, 略称: string, 日: string): Promise<{ id: string; 英: string; 略称: string }> {
  const 英 = `M1407 Set ${キー}`;
  const id = await セットを作る(browser, seedId, `M1407セット${キー}`, 英, rc(略称), { リリース日: 日 });
  return { id, 英: rc(英), 略称: rc(略称) };
}

const 画像注記 = (seedId: string) => reportSeedIssue(seedId, 共通の注記);

// ---------------------------------------------------------------------------
// 参照マスタ・位置固定用
// ---------------------------------------------------------------------------
defineSeed("S-M14-07-MASTER", async ({ seed }) => {
  if (言語のコード(日本語) !== "JP" || 言語のコード(英語) !== "EN") throw new Error(`${seed.シードID}: 言語マスタが 日本語=JP・英語=EN の値になっていない`);
  if (プロモの英語名(1) !== "Non Promotion") throw new Error(`${seed.シードID}: プロモーションID=1 が Non Promotion になっていない`);
  reportSeedIssue(seed.シードID, "言語・プロモーションのマスタは既存のものをDBで確認しただけで、値は足していない（共有のマスタは書き換えない）。");
});
defineSeed("S-M14-07-PAGING", async ({ browser, seed }) => {
  await 総数を満たす(browser, seed.シードID, 11);
  reportSeedIssue(seed.シードID, "2100件のカードセット登録は読み替えた。2ページ目ができる件数があればよいので、表示件数を10件にして、各ケースのカードセットが2ページ目以降に並ぶ形にした（足りないときは補助のカードセットを画面で登録した）。");
});

/** カードセットが「リリース日降順・10件表示」の2ページ目以降に並び、次の行と同じページに並ぶよう、新しい日付の補助のカードセットを足す */
async function 位置を整える(browser: Browser, seedId: string, 先頭のセットID: string, 印: string): Promise<void> {
  let n = より新しいセットの数(先頭のセットID);
  for (let k = 1; n < 10 || n % 10 === 9; k++) {
    await セットを作る(browser, seedId, `M1407位置補助${印}-${k}`, `M1407 Pos ${印}-${k}`, rc(`POS-${印}-${k}`), { リリース日: "2090-01-01" });
    n = より新しいセットの数(先頭のセットID);
  }
}
const 位置の注記 = "リリース日降順・10件表示で、共有カードセット件数の後ろに並ぶ位置は、古いリリース日（2010年台）にして2ページ目以降に並ぶ形に読み替えた。2件が同じページに並ぶよう、必要なら新しい日付の補助のカードセットを足した。";

// ---------------------------------------------------------------------------
// 基本（001・002・016・021・011）
// ---------------------------------------------------------------------------
defineSeed("S-M14-07-BASE-001", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "001A", "FIN-BF-001", "2099-12-31");
  const b = await セット(browser, seed.シードID, "001B", "FIN-001B", "2099-12-30");
  notes.set("〔カードセットID-M1407-001A〕", a.id); notes.set("〔カードセットID-M1407-001B〕", b.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "714101001", セット英名: a.英, foil: true, 日本語: "実体あり", 英語: "実体あり" },
    { 番号: "714102001", セット英名: b.英, 日本語: "なし", 英語: "実体あり" },
  ]);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "2つ目のカードセットの略称は、他のケースの「FIN」と区別するため「FIN-001B」（印つき）にした。保存先の拡張子（.png・.webp・.gif）は、既存の画像URLのままで合わせていない。");
});
defineSeed("S-M14-07-BASE-002", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "002A", "FIN-BF-002", "2099-12-29");
  const b = await セット(browser, seed.シードID, "002B", "FIN-002B", "2099-12-28");
  notes.set("〔カードセットID-M1407-002A〕", a.id); notes.set("〔カードセットID-M1407-002B〕", b.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "714101002", セット英名: a.英, foil: true, 日本語: "実体あり", 英語: "実体あり" },
    { 番号: "714102002", セット英名: b.英, 日本語: "なし", 英語: "実体あり" },
  ]);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "2つ目のカードセットの略称は、他のケースの「FIN」と区別するため「FIN-002B」（印つき）にした。");
});
defineSeed("S-M14-07-FOIL-SHARED", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "共有", "FIN-BF", "2099-12-24");
  notes.set("〔カードセットID-M1407-共有〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "177252", セット英名: s.英, foil: true, 日本語: "実体あり", 英語: "実体あり" }]);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "カード詳細ID 177252 は固定せず、画面が振った番号にした。保存先の拡張子（.png・.webp）は、既存の画像URLのままで合わせていない。");
});
defineSeed("S-M14-07-BASE-016", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "016", "FIN-016", "2099-12-18");
  notes.set("〔カードセットID-M1407-016〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "177253", セット英名: s.英, 日本語: "なし", 英語: "実体あり" }]);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "カードセットの略称は、他のケースの「FIN」と区別するため「FIN-016」（印つき）にした。カード詳細ID 177253 は固定せず、画面が振った番号にした。保存先の拡張子（.gif）は、既存の画像URLのままで合わせていない。");
});
defineSeed("S-M14-07-BASE-021", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "021", "FIN-BF-021", "2099-12-13");
  notes.set("〔カードセットID-M1407-021〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "714101021", セット英名: s.英, foil: true, 日本語: "実体あり", 英語: "なし" }]);
  画像注記(seed.シードID);
});

// ---------------------------------------------------------------------------
// 絞り込み・順序・画像なし
// ---------------------------------------------------------------------------
defineSeed("S-M14-07-FILTER-007", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "007", "FIN-BF-007", "2099-12-25");
  notes.set("〔カードセットID-M1407-007〕", s.id);
  const [, 画像なし] = await カードを作る(browser, seed.シードID, [
    { 番号: "714101007", セット英名: s.英, 日本語: "実体あり", 英語: "なし" },
    { 番号: "714101007N", セット英名: s.英, 日本語: "なし", 英語: "なし" },
    { 番号: "177261", セット英名: s.英, プロモ: false, 日本語: "実体あり", 英語: "なし" },
  ]);
  notes.set("〔カード詳細ID-M1407-007〕", 画像なし);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "プロモーション未設定のカード詳細（正本は177261）は、固定せず、画面が振った番号にした。");
});
for (const n of ["008", "009", "010"]) {
  const 年 = n === "008" ? 2011 : n === "009" ? 2012 : 2013;
  defineSeed(`S-M14-07-EMPTY-PAGED-${n}`, async ({ browser, notes, seed }) => {
    const a = await セット(browser, seed.シードID, `${n}A`, `VALID-FIRST-${n}`, `${年}-02-01`);
    const b = await セット(browser, seed.シードID, `${n}B`, `EMPTY-AFTER-${n}`, `${年}-01-01`);
    notes.set(`〔カードセットID-M1407-${n}A〕`, a.id); notes.set(`〔カードセットID-M1407-${n}B〕`, b.id);
    await カードを作る(browser, seed.シードID, [{ 番号: `71410${n}`, セット英名: a.英, 日本語: "実体あり", 英語: "なし" }]);
    await 位置を整える(browser, seed.シードID, a.id, n);
    画像注記(seed.シードID);
    reportSeedIssue(seed.シードID, 位置の注記);
  });
}
for (const n of ["022", "023", "024"]) {
  const 年 = n === "022" ? 2014 : n === "023" ? 2015 : 2016;
  defineSeed(`S-M14-07-NOZIP-PAGED-${n}`, async ({ browser, notes, seed }) => {
    const s = await セット(browser, seed.シードID, n, `NO-IMAGE-${n}`, `${年}-02-01`);
    notes.set(`〔カードセットID-M1407-${n}〕`, s.id);
    await カードを作る(browser, seed.シードID, [{ 番号: `71410${n}`, セット英名: s.英, 日本語: "実体なし", 英語: "なし" }]);
    await 位置を整える(browser, seed.シードID, s.id, n);
    画像注記(seed.シードID);
    reportSeedIssue(seed.シードID, 位置の注記);
  });
}
defineSeed("S-M14-07-FALLBACK-012", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "012", "LANG-FALLBACK-012", "2099-12-23");
  notes.set("〔カードセットID-M1407-012〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "714101012", セット英名: s.英, 日本語: "実体なし", 英語: "実体あり" }]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-LANG-SKIP-015", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "015A", "EMPTY-LANG-015", "2099-12-20");
  const b = await セット(browser, seed.シードID, "015B", "VALID-LANG-015", "2099-12-19");
  notes.set("〔カードセットID-M1407-015A〕", a.id); notes.set("〔カードセットID-M1407-015B〕", b.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "714101015", セット英名: b.英, 日本語: "実体あり", 英語: "なし" }]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-DEADLINK-017", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "017", "DEADLINK", "2099-12-17");
  notes.set("〔カードセットID-M1407-017〕", s.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "177290", セット英名: s.英, 日本語: "実体なし", 英語: "なし" },
    { 番号: "177291", セット英名: s.英, 日本語: "実体あり", 英語: "なし", 日本語デッドリンク真: true },
  ]);
  画像注記(seed.シードID);
  reportSeedIssue(seed.シードID, "カード詳細ID 177290・177291 は固定せず、画面が振った番号にした（カード名(英)の番号の順に並べる）。");
});

// ---------------------------------------------------------------------------
// カードセット未設定のカードがあるセット
// ---------------------------------------------------------------------------
for (const n of ["025", "026"]) {
  const 日 = n === "025" ? "2099-11-25" : "2099-11-24";
  defineSeed(`S-M14-07-GFSET-${n}`, async ({ browser, notes, seed }) => {
    const s = await セット(browser, seed.シードID, n, `M1407-${n}-A`, 日);
    notes.set(`〔カードセットID-M1407-${n}〕`, s.id);
    const [id] = await カードを作る(browser, seed.シードID, [{ 番号: `71410${n}`, セット英名: s.英, 日本語: "実体あり", 英語: n === "025" ? "なし" : "実体あり" }]);
    notes.set(`〔画像ID-M1407-${n}A〕`, 画像ID(id, 日本語) ?? "");
    if (n === "026") notes.set("〔画像ID-M1407-026B〕", 画像ID(id, 英語) ?? "");
    画像注記(seed.シードID);
  });
  defineSeed(`S-M14-07-GFUNREG-${n}`, async ({ browser, notes, seed }) => {
    const [id] = await カードを作る(browser, seed.シードID, [{ 番号: `71410${n}U`, 日本語: "実体あり", 英語: n === "025" ? "なし" : "実体あり" }]);
    notes.set(n === "025" ? "〔画像ID-M1407-025B〕" : "〔画像ID-M1407-026C〕", 画像ID(id, 日本語) ?? "");
    if (n === "026") notes.set("〔画像ID-M1407-026D〕", 画像ID(id, 英語) ?? "");
    画像注記(seed.シードID);
    reportSeedIssue(seed.シードID, "カードセット未設定のカードを、実行の印つきのカード名で1件登録した（一覧のダウンロードは、このカードセットだけを選ぶ）。");
  });
}

// ---------------------------------------------------------------------------
// 言語別・デッドリンク
// ---------------------------------------------------------------------------
defineSeed("S-M14-07-LANGDEAD-028", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "028", "M1407-028-A", "2099-11-27");
  notes.set("〔カードセットID-M1407-028〕", s.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "727101028", セット英名: s.英, 日本語: "なし", 英語: "実体なし" },
    { 番号: "727102028", セット英名: s.英, 日本語: "なし", 英語: "実体あり" },
  ]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-LANGDEAD-029", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "029", "M1407-029-A", "2099-11-28");
  notes.set("〔カードセットID-M1407-029〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "727101029", セット英名: s.英, 日本語: "なし", 英語: "実体あり", 英語デッドリンク真: true }]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-NOZIP-LANG-030", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "030", "M1407-030-A", "2099-11-29");
  notes.set("〔カードセットID-M1407-030〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "727101030", セット英名: s.英, 日本語: "なし", 英語: "実体なし" }]);
  画像注記(seed.シードID);
});

// ---------------------------------------------------------------------------
// 画像の取得結果とデッドリンクの組み合わせ（CB 系）
// ---------------------------------------------------------------------------
defineSeed("S-M14-07-CBENONLYSET-031", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "CB031", "M1407-CB031-A", "2099-10-01");
  notes.set("〔カードセットID-M1407-031A〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "74110031", セット英名: s.英, 日本語: "なし", 英語: "実体あり", 英語デッドリンク真: true }]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBLANGEMPTYPART-033", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "CB033A", "M1407-CB033-A", "2099-10-03");
  const b = await セット(browser, seed.シードID, "CB033B", "M1407-CB033-B", "2099-10-13");
  notes.set("〔カードセットID-M1407-033A〕", a.id); notes.set("〔カードセットID-M1407-033B〕", b.id);
  const ids = await カードを作る(browser, seed.シードID, [
    { 番号: "74110033", セット英名: b.英, 日本語: "なし", 英語: "実体あり" },
    { 番号: "74120033", セット英名: b.英, 日本語: "なし", 英語: "実体なし" },
    { 番号: "74130033", セット英名: b.英, 日本語: "なし", 英語: "なし" },
  ]);
  notes.set("〔カード詳細ID-M1407-033〕", ids[2]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBSETBOTHLANG-035", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "CB035", "M1407-CB035-A", "2099-10-05");
  notes.set("〔カードセットID-M1407-035A〕", s.id);
  await カードを作る(browser, seed.シードID, [{ 番号: "74110035", セット英名: s.英, 日本語: "実体あり", 英語: "実体あり", 日本語デッドリンク真: true, 英語デッドリンク真: true }]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBLANGEMPTYPROMO-036", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "CB036A", "M1407-CB036-A", "2099-10-06");
  const b = await セット(browser, seed.シードID, "CB036B", "M1407-CB036-B", "2099-10-16");
  notes.set("〔カードセットID-M1407-036A〕", a.id); notes.set("〔カードセットID-M1407-036B〕", b.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "74110036", セット英名: b.英, 日本語: "実体あり", 英語: "なし", 日本語デッドリンク真: true },
    { 番号: "74120036", セット英名: b.英, プロモ: false, 日本語: "実体あり", 英語: "なし", 日本語デッドリンク真: true },
  ]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBLANGEMPTYBOTH-037", async ({ browser, notes, seed }) => {
  const a = await セット(browser, seed.シードID, "CB037A", "M1407-CB037-A", "2099-10-07");
  const b = await セット(browser, seed.シードID, "CB037B", "M1407-CB037-B", "2099-10-17");
  notes.set("〔カードセットID-M1407-037A〕", a.id); notes.set("〔カードセットID-M1407-037B〕", b.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "74110037", セット英名: b.英, 日本語: "実体あり", 英語: "実体あり" },
    { 番号: "74120037", セット英名: b.英, プロモ: false, 日本語: "実体あり", 英語: "実体あり" },
  ]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBSETENPROMO-038", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "CB038", "M1407-CB038-A", "2099-10-08");
  notes.set("〔カードセットID-M1407-038A〕", s.id);
  await カードを作る(browser, seed.シードID, [
    { 番号: "74110038", セット英名: s.英, 日本語: "なし", 英語: "実体あり" },
    { 番号: "74120038", セット英名: s.英, プロモ: false, 日本語: "なし", 英語: "実体あり" },
  ]);
  画像注記(seed.シードID);
});
defineSeed("S-M14-07-CBSETNOIMGDEAD-039", async ({ browser, notes, seed }) => {
  const s = await セット(browser, seed.シードID, "CB039", "M1407-CB039-A", "2099-10-09");
  notes.set("〔カードセットID-M1407-039A〕", s.id);
  const ids = await カードを作る(browser, seed.シードID, [
    { 番号: "74110039", セット英名: s.英, 日本語: "実体あり", 英語: "なし", 日本語デッドリンク真: true },
    { 番号: "74120039", セット英名: s.英, 日本語: "なし", 英語: "なし" },
  ]);
  notes.set("〔カード詳細ID-M1407-039〕", ids[1]);
  画像注記(seed.シードID);
});
