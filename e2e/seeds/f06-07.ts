/**
 * F06-07 購入履歴詳細の画面シード。正本: cases/F06-07_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。画面で作れない部分は、
 * E2E が作った実行の印つきのデータに限り DB へ書き込んでよい（db/f06_07.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 * 読み替え・DB で設定したことは、シードの報告（エビデンスの「シード作成時の問題」）に残す。
 *
 * 作り方（シード表の「DBフィクスチャで登録」を、次のように読み替える）:
 * - 会員A・会員B: フロントの会員情報登録で登録し、本会員にする（seeds/f06-member.ts の 本会員を作る）。管理画面の会員一覧で会員IDを控える。
 *   メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードはシード表の値。会員ID・注文ID・注文番号は画面が振った値（シード表の固定の値は使えない）。
 * - 注文: 会員でフロントにログインし、販売中の商品1点を注文する（M05 のフロント注文の部品。支払方法は代金引換など）。注文番号は完了画面から控え、注文IDはDBで引く。
 *   商品は手元の販売中の既存の商品（シード表の「日本語商品A」「English Product B」「廃番商品C」は作らない＝共有の商品に試験の値を足さない）。
 *   商品名・言語・現在価格はシード表と合わない。注文時の単価・数量・金額、注文日、出荷日、受注ステータス、支払い済み、支払方法、店舗、配送方法、
 *   スマレジ取引、送り主・お届け先の住所は、画面で作れないのでDBで注文に設定する。
 * - 店舗: 手元の店舗マスタの先頭から使う（シード表の晴れる屋横浜店・大阪店・秋葉原店・大宮店に代える。店舗の名前は画面の表示とDBの値を比べる）。
 * - 注文IDのうち、シード表が固定の値（607001001 など）で書くものは、画面が振った注文IDに読み替える（spec は seeds/f06-07.ts の 注文() で引く）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 店舗の先頭, 注文IDが未登録か, 注文の受注ID, 注文を整える, ポイント履歴を足す } from "../db/f06_07_k";
import type { 注文の設定 } from "../db/f06_07_k";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerFrontMember } from "../pages/front/member_entry";
import { 会員が注文する } from "../pages/front/m05_front_order";
import { 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
/** シード表のパスワード（041〜043 は dp 系、046〜050 は cb 系、ほかは A 系） */
export const passwordOf = (番号: string): string => {
  if (["041", "042", "043"].includes(番号)) return `Passw0rd-F0607${番号}`;
  if (Number(番号) >= 46) return `Passw0rd-CBF0607${番号}`;
  return `Passw0rd-F0607-${番号}!F0607A-${番号}`;
};
/** 会員Aのメールアドレスの前半（シード表の値） */
export const 前半Of = (番号: string): string => {
  if (["041", "042", "043"].includes(番号)) return `dpf0607-${番号}`;
  if (Number(番号) >= 46) return `cbf0607-${番号}`;
  return `f0607-a-${番号}`;
};
/** 会員Aの資格（ログインに使う） */
export const 会員A = (番号: string): { メール: string; パスワード: string } => ({ メール: mailOf(前半Of(番号)), パスワード: passwordOf(番号) });

export type 作った注文 = { 番号: string; ID: string; 店名?: string };
const 記録 = new Map<string, 作った注文>();
/** 作った注文（キーは「001」「013A」など）。シード表が固定の値で書く注文も、このキーで引く */
export function 注文(キー: string): 作った注文 {
  const r = 記録.get(キー);
  if (!r) throw new Error(`注文 ${キー} をまだ作っていない（そのシードを作っていない）`);
  return r;
}

/** 支払方法のID（支払方法マスタの既存の行。領収書の対象外は 郵便振替・銀行振込・代金引換） */
export const 支払 = { 郵便振替: 1, 銀行振込: 3, 代金引換: 4, クレジットカード: 5 } as const;

const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);
const 読み替えの注記 = "シード表は会員・注文をDBフィクスチャで登録すると定めるが、会員はフロントの会員登録で、注文はフロントの注文（販売中の既存の商品1点）で画面から作った。会員ID・注文ID・注文番号は画面が振った値に読み替える";

/** シード表が呼び名に挙げているときだけ控える */
function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

type 会員の資格 = { メール: string; パスワード: string };

async function 会員を作る(browser: Browser, seedId: string, notes: Notes, 番号: string, 前半: string, パスワード: string, 呼び名の番号 = 番号): Promise<会員の資格> {
  const id = await 本会員を作る(browser, { 姓: "結合", 名: "花子", セイ: "ケツゴウ", メイ: "ハナコ", 前半, パスワード });
  控える(notes, seedId, `〔会員ID-F0607-${呼び名の番号}〕`, id);
  return { メール: mailOf(前半), パスワード };
}

/** 会員が注文し、DBで注文を設定し、注文を控える。キーは 記録 のキー（番号＋枝） */
async function 注文を作る(browser: Browser, seedId: string, notes: Notes, m: 会員の資格, キー: string, 設定: 注文の設定, 追加: { 店名?: string } = {}): Promise<作った注文> {
  const 番号 = await 会員が注文する(browser, m, `${seedId} 注文${キー}`);
  const ID = 注文の受注ID(番号);
  const done = 注文を整える(ID, 設定);
  if (done.length) 記す(`画面で作った注文 ${番号} は、DBで${done.join("、")}設定した（フロントの注文の画面では作れない値）`);
  const r: 作った注文 = { 番号, ID, ...追加 };
  記録.set(キー, r);
  控える(notes, seedId, `〔注文ID-F0607-${キー}〕`, ID);
  控える(notes, seedId, `〔注文番号-F0607-${キー}〕`, 番号);
  return r;
}

/** 注文を1件だけ持つ会員Aのシード */
function 一件のシード(seedId: string, n: string, 設定: 注文の設定): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    記す(読み替えの注記);
    const m = await 会員を作る(browser, seedId, notes, n, 前半Of(n), passwordOf(n));
    await 注文を作る(browser, seedId, notes, m, n, 設定);
  });
}

const 出荷済み = { 対応状況: "出荷完了", 支払い済み: true, 支払方法ID: 支払.クレジットカード, 注文日: "2026-08-10", 出荷日: "2026-08-12" } as const satisfies 注文の設定;
const 送り主の住所 = (n: string) => ({ 郵便番号: `150${n.padStart(4, "0")}`, 都道府県: "東京都", 住所1: "渋谷区", 住所2: `神南F0607-${n}号館`, 名前: `送主F0607-${n}`, 電話番号: `03-0607-${n.padStart(4, "0")}` });
const お届け先の住所 = (n: string) => ({ 郵便番号: `220${n.padStart(4, "0")}`, 都道府県: "神奈川県", 住所1: "横浜市", 住所2: `みなとF0607-${n}館`, 名前: `届先F0607-${n}`, 電話番号: `045-0607-${n.padStart(4, "0")}` });
const 海外の住所 = (郵便番号: string, 末尾: string, 名前: string, 電話番号: string) => ({ 国: "アメリカ合衆国" as const, 郵便番号, 住所1: `Main-Street-F0607-${末尾}`, 名前, 電話番号 });

// ---------------------------------------------------------------- 会員だけのシード（注文なし）

for (const n of ["003", "004"]) {
  defineSeed(`S-F06-07-CASE-${n}`, async ({ browser, notes }: { browser: Browser; notes: { set: (k: string, v: string) => void } }) => {
    const メール = mailOf(`f0607-a-${n}`);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      await registerFrontMember(await context.newPage(), { 姓: "結合", 名: "花子", セイ: "ケツゴウ", メイ: "ハナコ", メール, パスワード: passwordOf(n) });
    } finally { await context.close(); }
    const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await searchCustomer(page, メール);
      return resultCustomerId(page, メール);
    });
    if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
    notes.set(`〔会員ID-F0607-${n}〕`, id);
  });
}

// ---------------------------------------------------------------- 注文1件

一件のシード("S-F06-07-CASE-001", "001", { ...出荷済み });

defineSeed("S-F06-07-CASE-007", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const 店 = 店舗の先頭(4);
  記す(`保持店舗は、シード表の本店・横浜店・大阪店・秋葉原店に代えて、店舗マスタの先頭の4店舗（${店.map((s) => s.店名).join("・")}）を使う。4件とも店頭受取の注文にした（店舗名は店頭受取などEC以外の注文で表示される）`);
  const m = await 会員を作る(browser, "S-F06-07-CASE-007", notes, "007", 前半Of("007"), passwordOf("007"));
  for (const [i, s] of 店.entries()) {
    await 注文を作る(browser, "S-F06-07-CASE-007", notes, m, `007${"ABCD"[i]}`, { 店頭受取: true, 店舗ID: s.id, 対応状況: "ピック中", 支払い済み: true, 注文日: "2026-08-05" }, { 店名: s.店名 });
  }
});

一件のシード("S-F06-07-CASE-008", "008", {
  ...出荷済み, 明細: [{ 数量: 1, 単価: 1000 }, { 数量: 1, 単価: 1000 }, { 数量: 2, 単価: 1000 }],
  送料: 600, 手数料: 100, 割引: 200, ポイント使用: 0, ポイント発生: 0,
});

defineSeed("S-F06-07-CASE-009", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, 店] = 店舗の先頭(2);
  const m = await 会員を作る(browser, "S-F06-07-CASE-009", notes, "009", 前半Of("009"), passwordOf("009"));
  await 注文を作る(browser, "S-F06-07-CASE-009", notes, m, "009", {
    店頭受取: true, 店舗ID: 店.id, 対応状況: "ピック中", 注文日: "2026-08-05", 出荷日: "2026-08-06", 支払方法名: "店頭支払", 明細: [{ 数量: 1, 単価: 2000 }],
  }, { 店名: 店.店名 });
});

/** 店頭受取の移行元の注文と、スマレジ取引の移行先の注文を作る。移行先の注文を返す */
async function 移行の注文を作る(browser: Browser, seedId: string, notes: Notes, m: 会員の資格, 移行元キー: string, 移行先キー: string, 店: { id: string; 店名: string },
  移行先: { 購入日: string; レシートNo: string; 取引ID: string } & Partial<注文の設定>): Promise<作った注文> {
  const 元 = await 注文を作る(browser, seedId, notes, m, 移行元キー, { 店頭受取: true, 店舗ID: 店.id, 対応状況: "ピック中", 注文日: 移行先.購入日, 支払方法名: "店頭支払" }, { 店名: 店.店名 });
  const { 購入日, レシートNo, 取引ID, ...残り } = 移行先;
  const 先 = await 注文を作る(browser, seedId, notes, m, 移行先キー, {
    店舗ID: 店.id, 対応状況: "出荷完了", 支払い済み: true, 注文日: 購入日, スマレジ取引ID: `${取引ID}-${RUN_MARK}`, レシートNo, 支払方法名: "店頭コード決済A", ...残り,
  }, { 店名: 店.店名 });
  注文を整える(元.ID, { 移行先の受注ID: 先.ID });
  記す(`移行元の注文 ${元.番号} は、DBで移行先の受注として注文 ${先.番号} を関連付けた（店頭受取からスマレジ取引への移行はスマレジ連携でしか入らない）`);
  return 先;
}

defineSeed("S-F06-07-CASE-010", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, , 店] = 店舗の先頭(3);
  const m = await 会員を作る(browser, "S-F06-07-CASE-010", notes, "010", 前半Of("010"), passwordOf("010"));
  const 先 = await 移行の注文を作る(browser, "S-F06-07-CASE-010", notes, m, "010元", "010", 店, {
    購入日: "2026-08-04", レシートNo: "6070030000001", 取引ID: "607700010", クーポン名: "店頭割引券A", クーポン値引き: 300, 免税額: 500,
    明細: [{ 数量: 1, 単価: 3000 }], 割引: 300, ポイント使用: 100, ポイント発生: 27,
  });
  void 先;
});

defineSeed("S-F06-07-CASE-011", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, , , 店] = 店舗の先頭(4);
  const m = await 会員を作る(browser, "S-F06-07-CASE-011", notes, "011", 前半Of("011"), passwordOf("011"));
  await 注文を作る(browser, "S-F06-07-CASE-011", notes, m, "011", {
    店舗ID: 店.id, 対応状況: "出荷完了", 支払い済み: true, 注文日: "2026-08-02", スマレジ取引ID: `607700011-${RUN_MARK}`, レシートNo: "6070040000001",
    支払方法名: "店頭コード決済A", クーポン名: "店頭割引券B", クーポン値引き: 200, 免税額: 400, 明細: [{ 数量: 1, 単価: 1500 }], 割引: 200, ポイント使用: 0, ポイント発生: 13,
  }, { 店名: 店.店名 });
});

defineSeed("S-F06-07-CASE-012", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, 支店] = 店舗の先頭(2);
  記す(`支店は、シード表の晴れる屋大宮店に代えて、店舗マスタの本店の次の店舗（${支店.店名}）を使う`);
  const m = await 会員を作る(browser, "S-F06-07-CASE-012", notes, "012", 前半Of("012"), passwordOf("012"));
  await 注文を作る(browser, "S-F06-07-CASE-012", notes, m, "012", { ...出荷済み, 店舗ID: 支店.id, 明細: [{ 数量: 1, 単価: 1000 }], 送料: 700, 手数料: 150 }, { 店名: 支店.店名 });
});

defineSeed("S-F06-07-CASE-013", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const 店 = 店舗の先頭(4);
  const m = await 会員を作る(browser, "S-F06-07-CASE-013", notes, "013", 前半Of("013"), passwordOf("013"));
  await 注文を作る(browser, "S-F06-07-CASE-013", notes, m, "013A", { ...出荷済み });
  await 注文を作る(browser, "S-F06-07-CASE-013", notes, m, "013B", { 店頭受取: true, 店舗ID: 店[1].id, 対応状況: "ピック中", 注文日: "2026-08-05" });
  // 移行元〔注文ID-F0607-013C〕と、その移行先（シード表の注文ID 607003013 → 注文013D）、スマレジ単独取引（607004013 → 注文013E）
  await 移行の注文を作る(browser, "S-F06-07-CASE-013", notes, m, "013C", "013D", 店[2], { 購入日: "2026-08-03", レシートNo: "6070030130001", 取引ID: "607700013", 明細: [{ 数量: 1, 単価: 1000 }] });
  await 注文を作る(browser, "S-F06-07-CASE-013", notes, m, "013E", {
    店舗ID: 店[3].id, 対応状況: "出荷完了", 支払い済み: true, 注文日: "2026-08-02", スマレジ取引ID: `607700413-${RUN_MARK}`, レシートNo: "6070040130001", 支払方法名: "店頭コード決済A",
  });
});

一件のシード("S-F06-07-CASE-014", "014", { ...出荷済み, 明細: [{ 数量: 4, 単価: 1000 }], 送料: 600, 手数料: 100, 割引: 200 });
一件のシード("S-F06-07-CASE-015", "015", { ...出荷済み, ポイント使用: 0, ポイント発生: 0 });

defineSeed("S-F06-07-CASE-030", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const m = await 会員を作る(browser, "S-F06-07-CASE-030", notes, "030", 前半Of("030"), passwordOf("030"));
  const o = await 注文を作る(browser, "S-F06-07-CASE-030", notes, m, "030", { ...出荷済み });
  ポイント履歴を足す(o.ID, { ポイント: 27, 発行日: "2026-08-13", 備考: `F06-07 注文のポイント履歴 ${o.番号}` });
  記す(`注文 ${o.番号} に紐づくポイント履歴を、DBで1件作った（ポイント27・発行日2026-08-13。注文由来の履歴は注文の画面操作では入らない）`);
});

defineSeed("S-F06-07-CASE-031", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, , , 店] = 店舗の先頭(4);
  const m = await 会員を作る(browser, "S-F06-07-CASE-031", notes, "031", 前半Of("031"), passwordOf("031"));
  const o = await 注文を作る(browser, "S-F06-07-CASE-031", notes, m, "031", {
    店舗ID: 店.id, 対応状況: "出荷完了", 支払い済み: true, 注文日: "2026-08-03", スマレジ取引ID: `607700031-${RUN_MARK}`, レシートNo: "6070040000001", 支払方法名: "店頭コード決済A",
  }, { 店名: 店.店名 });
  ポイント履歴を足す(o.ID, { ポイント: 13, 発行日: "2026-08-03", 備考: "F06-07 スマレジ取引のポイント履歴", スマレジ取引ID: 607700031 });
  記す(`スマレジ取引の注文 ${o.番号} に紐づくポイント履歴を、DBで1件作った（ポイント13・発行日2026-08-03・スマレジ取引ID 607700031。スマレジ連携でしか入らない）`);
});

一件のシード("S-F06-07-ECQTY-032", "032", { ...出荷済み, 明細: [{ 数量: 3, 単価: 1000 }, { 数量: 1, 単価: 1500 }], 送料: 600, 手数料: 100 });

defineSeed("S-F06-07-OTCQTY-033", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, 店] = 店舗の先頭(2);
  const m = await 会員を作る(browser, "S-F06-07-OTCQTY-033", notes, "033", 前半Of("033"), passwordOf("033"));
  await 注文を作る(browser, "S-F06-07-OTCQTY-033", notes, m, "033", {
    店頭受取: true, 店舗ID: 店.id, 対応状況: "ピック中", 注文日: "2026-08-05", 明細: [{ 数量: 4, 単価: 500 }, { 数量: 2, 単価: 700 }],
  }, { 店名: 店.店名 });
});

defineSeed("S-F06-07-MIGQTY-034", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, , 店] = 店舗の先頭(3);
  const m = await 会員を作る(browser, "S-F06-07-MIGQTY-034", notes, "034", 前半Of("034"), passwordOf("034"));
  await 移行の注文を作る(browser, "S-F06-07-MIGQTY-034", notes, m, "034元", "034", 店, {
    購入日: "2026-08-06", レシートNo: "6070030340001", 取引ID: "607700034", 明細: [{ 数量: 5, 単価: 300 }, { 数量: 2, 単価: 400 }],
  });
});

defineSeed("S-F06-07-SMAQTY-035", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, , , 店] = 店舗の先頭(4);
  const m = await 会員を作る(browser, "S-F06-07-SMAQTY-035", notes, "035", 前半Of("035"), passwordOf("035"));
  await 注文を作る(browser, "S-F06-07-SMAQTY-035", notes, m, "035", {
    店舗ID: 店.id, 対応状況: "出荷完了", 支払い済み: true, 注文日: "2026-08-07", スマレジ取引ID: `607700035-${RUN_MARK}`, レシートNo: "6070040350001", 支払方法名: "店頭コード決済A",
    明細: [{ 数量: 3, 単価: 250 }, { 数量: 6, 単価: 100 }],
  }, { 店名: 店.店名 });
});

for (const n of ["036", "037"]) {
  const id = n === "036" ? "S-F06-07-SENDER-036" : "S-F06-07-DEST-037";
  一件のシード(id, n, { ...出荷済み, 送り主: 送り主の住所(n), お届け先: お届け先の住所(n) });
}
一件のシード("S-F06-07-DESTLINE-038", "038", { ...出荷済み, 明細: [{ 数量: 4, 単価: 1000 }, { 数量: 2, 単価: 1500 }], 送料: 600, 手数料: 100 });

defineSeed("S-F06-07-OTCRCPT-039", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const [, 店] = 店舗の先頭(2);
  const m = await 会員を作る(browser, "S-F06-07-OTCRCPT-039", notes, "039", 前半Of("039"), passwordOf("039"));
  await 注文を作る(browser, "S-F06-07-OTCRCPT-039", notes, m, "039", { ...出荷済み, 店頭受取: true, 店舗ID: 店.id }, { 店名: 店.店名 });
});

一件のシード("S-F06-07-QTY1-041", "041", { ...出荷済み, 明細: [{ 数量: 1, 単価: 1000 }], 送料: 600, 手数料: 100 });
一件のシード("S-F06-07-CBADDR-047", "047", {
  ...出荷済み,
  送り主: 海外の住所("9000047", "047", "Taro-F0607-047", "0607-047"), お届け先: 海外の住所("9100047", "047-D", "Taro-F0607-047-D", "0607-047-D"),
});
一件のシード("S-F06-07-CBADDR-048", "048", { ...出荷済み, 送り主: 海外の住所("9000048", "048", "Taro-F0607-048", "0607-048"), お届け先: お届け先の住所("048") });
一件のシード("S-F06-07-CBADDR-049", "049", { ...出荷済み, 送り主: 送り主の住所("049"), お届け先: 海外の住所("9100049", "049-D", "Taro-F0607-049-D", "0607-049-D") });
一件のシード("S-F06-07-CBADDR-050", "050", { ...出荷済み, 送り主: 送り主の住所("050"), お届け先: お届け先の住所("050") });
