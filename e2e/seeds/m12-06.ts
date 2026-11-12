/**
 * M12-06 入荷通知依頼 CSV出力 のシード。正本: cases/M12-06_seed_data.tsv
 *
 * 作り方は M12-05（seeds/m12-05-requests.ts）と同じ。ちがいは次のとおり。
 * - 商品: グッズ商品CSV登録は使わない（開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966）。カード商品（カード登録 → カード商品CSV登録 →
 *   必要なら商品規格の新規作成）で作る。言語は日本語（言語ID 1）、基準価格・販売価格・買取価格は 1000。
 *   2つ目の規格は商品規格一覧の「新規作成」で、状態だけ別（スライトリープレイド）にして登録する。
 * - 会員: フロントの会員情報登録で登録し、本会員にして会員IDを控える。通知待ちの依頼は会員でフロントにログインし、商品詳細の通知ボタンで作る。
 *   取り消した（削除済みの）依頼は、通知ボタンをもう一度押して作る。
 * - 依頼日時・削除日時（画面で指定できない）、商品単位の依頼（画面で作れない）、1人あたりの依頼数の上限を超える依頼は、
 *   実行の印つきの会員の依頼だけ DB で足す・設定する（db/m12_05.ts）。
 * - 「ほかのケースの専用データを含め、あれば開始時に削除する」は、他のデータを消す操作になるので行わない。代わりに、検索語に実行の印
 *   （lib/run_marker.ts）を付けた商品名にして、この実行で作った商品だけが検索に当たるようにした。
 * - 試験管理者はシステム管理者権限（分析・集計管理を操作できる権限）で、メンバー管理で登録する。
 * - ダウンロード領域（S-M12-06-DL-…）は、基盤がダウンロードを1件ずつ専用の場所へ保存するので、作り方は何もしない。
 *
 * 読み替え（正本の外で補ったこと。各ケースの手順の注記にも残す）:
 * - 会員が複数書かれていても会員の数が結果に効かないシード（005・006・007・008・015・019）は、会員1人が複数の商品へ依頼した形にした
 *   （会員の数が効く 017・018・020 は書かれた人数で作った）。
 * - 「通知済み」の依頼（005）は、画面では作れない（通知はバッチが送る）ので、取り消した依頼と同じ形（削除日時あり）にした。
 * - 範囲で書かれた呼び名（〔…017-01A〕〜〔…017-11B〕など）は、シード表に名前で出てくるものだけを控える。
 * - 006 の検索語「CSV対象商品」「CSV比較商品」は M12-05 のシードも同じ語を使うので、同じ実行で両方を作っても取り違えないよう、
 *   商品名を「CSV対象商品-M1206」の形（検索語＝「CSV対象商品-M1206＋実行の印」）にした。
 * - 入荷通知最大数が30（020）は共有の設定なので、書き換えない。通知ボタンで作るのは1人あたり少数（1商品分）で、残りは DB で足す。
 */
import { Browser, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { defineSeed as defineSeedCurrent } from "./current_seed";
import { RUN_MARK, rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { ProductRequestPage } from "../pages/admin/m12_analysis";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import {
  F0504カードを登録する, カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 単体カード配下のカテゴリID, 登録済みの割引率ID, 規格IDを選ぶ,
  商品規格一覧を読む,
} from "../pages/admin/f05_04_products";
import { ensureCardset } from "../pages/admin/product_masters";
import { ensureAnalysisAdmin } from "./m12-common";
import { DEF_AT, DEF_DEL, 商品名, seed, one, 定義, 作った商品 } from "./m12-05-requests";

export const M1206_ADMIN: Account = { loginId: "m1206_admin", password: "Passw0rd!M1206" };

defineSeed("S-M12-06-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-06試験管理者", account: M1206_ADMIN, メール: "m1206_admin@example.test" });
});

defineSeed("S-M12-06-MASTER", { needs: ["S-M12-06-ADM"] }, async ({ browser, seed: s }) => {
  await withAdminSession(browser, M1206_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ProductRequestPage(page);
    await p.open();
    const langs = (await page.locator('input[name^="admin_analysis_product_request[language]"]').evaluateAll((ns) =>
      ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()))).filter(Boolean);
    if (!langs.includes("日本語")) reportSeedIssue(s.シードID, `言語の選択肢に「日本語」が無い（ある選択肢: ${langs.join("、")}）`);
    const counts = (await p.表示件数.locator("option").allInnerTexts()).map((t) => t.trim());
    expect(counts.some((t) => /^10(件)?$/.test(t)), `表示件数の選択肢に10がある（${counts.join("、")}）`).toBe(true);
  });
});

// ダウンロード領域（基盤がダウンロードを1件ずつ専用の場所に保存するので、作り方は何もしない）
const defineDlSeed = (id: string) => defineSeedCurrent(id, async () => { /* 何もしない */ });
defineDlSeed("S-M12-06-DL-003");
defineDlSeed("S-M12-06-DL-004");
defineDlSeed("S-M12-06-DL-005");
defineDlSeed("S-M12-06-DL-006");
defineDlSeed("S-M12-06-DL-007");
defineDlSeed("S-M12-06-DL-008");
defineDlSeed("S-M12-06-DL-009");
defineDlSeed("S-M12-06-DL-015");
defineDlSeed("S-M12-06-CBDL-016");
defineDlSeed("S-M12-06-CBDL-017");
defineDlSeed("S-M12-06-CBDL-018");
defineDlSeed("S-M12-06-CBDL-019");
defineDlSeed("S-M12-06-CBDL-020");
defineDlSeed("S-M12-06-CBDL-021");

// ---------------------------------------------------------------------------
// カード商品の作り方（グッズ商品CSVの代わり）
// ---------------------------------------------------------------------------

const STATE_SP = "スライトリープレイド";
let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-9);
const 次のカード番号 = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(3, "0")}`;

async function カード商品を作る(browser: Browser, d: 定義, issue: (m: string) => void): Promise<作った商品[]> {
  const pf = d.prefix ?? "M1206";
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    if (lang.日本語 !== "1") issue(`${d.seedId}: 日本語の言語IDが「${lang.日本語}」（正本は言語ID 1）。画面で読んだ値を使った`);
    const cardset = await ensureCardset(page, rc(`${pf}試験カードセット`), `${pf} Test Set ${RUN_MARK}`, `N6${RUN_MARK}`, issue);
    const categoryId = (await 単体カード配下のカテゴリID(page)).id;
    const discountId = (await 登録済みの割引率ID(page)).id;
    const sellGroup = await readExistingSellGroupName(page);
    const headers = await カード商品CSVの見出し(page);
    // カードを商品の数だけ登録し、カード商品CSVを1回で取り込む
    const rows: Record<string, string>[] = [];
    for (const [i, p] of d.products.entries()) {
      const name = 商品名(p.base, p.suffix);
      const reg = await F0504カードを登録する(page, {
        カード名英: rc(`${pf} CARD ${d.sfx} ${i + 1}`),
        詳細: [{ カードセットID: cardset, カード番号: 次のカード番号() }],
      }, `${d.seedId}: カード ${i + 1}`, issue);
      const price = String(p.price);
      rows.push({
        "商品ID": "", "言語(ID)": lang.日本語, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
        "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
        "購入グループ名称": sellGroup, "割引率(ID)": discountId, "基準価格": price, "販売価格": price, "買取価格": price,
        "カード詳細(ID)": reg.カード詳細IDs[0],
      });
    }
    await カード商品CSVを登録する(page, headers, rows, `${pf.toLowerCase()}-${d.sfx.toLowerCase()}-${RUN_MARK.toLowerCase()}.csv`, `${d.seedId}: カード商品CSV登録`, issue);
    const out: 作った商品[] = [];
    for (const [i, p] of d.products.entries()) {
      const productId = await 商品名で商品IDを読む(page, 商品名(p.base, p.suffix));
      const classRows = await 商品規格一覧を読む(page, productId);
      const first = 規格IDを選ぶ(classRows, "JP", "NM");
      const classIds = [first];
      if (classRows.find((r) => r.商品規格ID === first)?.公開状態 !== "公開") {
        await savePublishedClass(page, { productId, classId: first }, `${d.seedId}: 商品${i + 1}`, issue);
      }
      const n = (p.classes ?? [p.s]).length;
      for (let j = 1; j < n; j++) {
        await openClassList(page, productId);
        classIds.push(await addClass(page, productId, {
          言語: "日本語", 状態: STATE_SP, 商品コード: rc(`${pf}-${d.sfx}-P${i + 1}-C${j + 1}`),
          基準価格: String(p.price), 販売価格: String(p.price), 買取価格: "10",
        }, `${d.seedId}: 商品${i + 1}の規格${j + 1}`, issue));
      }
      out.push({ productId, classIds });
    }
    return out;
  });
}

const 共通 = { prefix: "M1206", makeProducts: カード商品を作る } as const;
const defineM1206Seed = (id: string, d: Omit<定義, "seedId" | "prefix" | "makeProducts">) => defineSeedCurrent(id, seed({ seedId: id, ...共通, ...d }));
const nn = (n: number): string => String(n).padStart(2, "0");
const range = (n: number): string[] => Array.from({ length: n }, (_, i) => nn(i + 1));

defineM1206Seed("S-M12-06-BASE-003", {
  sfx: "BASE-003", ...one("003"),
  products: [{ s: "003", base: "CSV基本商品", price: 1000 }],
  requests: [{ id: "003", m: "003", p: "003", at: DEF_AT }],
});

defineM1206Seed("S-M12-06-PENDING-004", {
  sfx: "PENDING-004", ...one("004"),
  products: [{ s: "004", base: "CSV通知待ち集計", price: 1000, classes: ["004A", "004B"] }],
  requests: [{ id: "004A", m: "004", p: "004", c: "004A", at: DEF_AT }, { id: "004B", m: "004", p: "004", c: "004B", at: DEF_AT }],
});

defineM1206Seed("S-M12-06-DELETED-005", {
  sfx: "DELETED-005", members: ["005A", "005B"], shareMember: true,
  products: [
    { s: "005A", base: "CSV通知済集計", price: 1000, classes: ["005A", "005B"] },
    { s: "005B", base: "CSV取消集計", price: 1000, classes: ["005C", "005D"] },
  ],
  requests: [
    { id: "005A", m: "005A", p: "005A", c: "005A", at: DEF_AT, deleted: DEF_DEL },
    { id: "005B", m: "005A", p: "005A", c: "005B", at: DEF_AT, deleted: DEF_DEL },
    { id: "005C", m: "005B", p: "005B", c: "005C", at: DEF_AT, deleted: DEF_DEL },
    { id: "005D", m: "005B", p: "005B", c: "005D", at: DEF_AT, deleted: DEF_DEL },
  ],
});

/** 006 の検索語（M12-05 と同じ語の取り違えを避ける形）。ケースもこの名前で検索する */
export const 名前006 = { 対象: "CSV対象商品-M1206", 比較: "CSV比較商品-M1206" } as const;
defineM1206Seed("S-M12-06-FILTER-006", {
  sfx: "FILTER-006", members: ["006A", "006B"], shareMember: true,
  products: [{ s: "006A", base: 名前006.対象, price: 1000 }, { s: "006B", base: 名前006.比較, price: 1000 }],
  requests: [{ id: "006A", m: "006A", p: "006A", at: DEF_AT }, { id: "006B", m: "006B", p: "006B", at: DEF_AT }],
});

defineM1206Seed("S-M12-06-ORDER-007", {
  sfx: "ORDER-007", members: ["007A", "007B", "007C"], shareMember: true,
  products: ["A", "B", "C"].map((x) => ({ s: `007${x}`, base: "CSV順序比較", suffix: x, price: 1000 })),
  requests: ["A", "B", "C"].map((x) => ({ id: `007${x}`, m: `007${x}`, p: `007${x}`, at: DEF_AT })),
});

const L = "ABCDEFGHIJK".split("");
defineM1206Seed("S-M12-06-LIMIT-008", {
  sfx: "LIMIT-008", members: L.map((x) => `008${x}`), shareMember: true,
  products: L.map((x, i) => ({ s: `008${x}`, base: "CSV表示件数商品", suffix: nn(i + 1), price: 1000 })),
  requests: L.map((x, i) => ({ id: `008${x}`, m: `008${x}`, p: `008${x}`, at: DEF_AT, db: i > 0 })),
});

defineM1206Seed("S-M12-06-ZERO-009", {
  sfx: "ZERO-009", ...one("009"),
  products: [{ s: "009", base: "CSVゼロ件切替対象", price: 1000 }],
  requests: [{ id: "009", m: "009", p: "009", at: DEF_AT }],
});

defineM1206Seed("S-M12-06-MIXED-015", {
  sfx: "MIXED-015", members: ["015A", "015B"], shareMember: true,
  products: [
    { s: "015A", base: "CSV混在-M1206-015", suffix: " 未削除", price: 1000 },
    { s: "015B", base: "CSV混在-M1206-015", suffix: " 削除済", price: 1000 },
  ],
  requests: [
    { id: "015A", m: "015A", p: "015A", at: DEF_AT },
    { id: "015B", m: "015B", p: "015B", at: DEF_AT, deleted: DEF_DEL },
  ],
});

defineM1206Seed("S-M12-06-CBBULKPEND-016", {
  sfx: "CBBULKPEND-016", ...one("016"),
  products: [{ s: "016", base: "組合せCSV商品単位待ち", price: 1000 }],
  requests: [{ id: "016", m: "016", p: "016", at: DEF_AT, bulk: true }],
});

defineM1206Seed("S-M12-06-CBBULKDELOVER-017", {
  sfx: "CBBULKDELOVER-017", members: ["017A", "017B"],
  keep: (l) => !/入荷通知依頼ID/.test(l) || /-017-(01A|11B)〕$/.test(l),
  products: range(11).map((n) => ({ s: `017-${n}`, base: "組合せCSV商品単位削除", suffix: n, price: 1000 })),
  requests: range(11).flatMap((n) => [
    { id: `017-${n}A`, m: "017A", p: `017-${n}`, at: DEF_AT, deleted: DEF_DEL, bulk: true },
    { id: `017-${n}B`, m: "017B", p: `017-${n}`, at: DEF_AT, deleted: DEF_DEL, bulk: true },
  ]),
});

defineM1206Seed("S-M12-06-CBSINGLEMULTI-018", {
  sfx: "CBSINGLEMULTI-018", members: ["018A", "018B"],
  products: [{ s: "018", base: "組合せCSV単一規格複数待ち", price: 1000 }],
  requests: [{ id: "018A", m: "018A", p: "018", at: DEF_AT }, { id: "018B", m: "018B", p: "018", at: DEF_AT }],
});

defineM1206Seed("S-M12-06-CBSINGLEDELOVER-019", {
  sfx: "CBSINGLEDELOVER-019", ...one("019"),
  keep: (l) => !/(商品規格ID|入荷通知依頼ID)/.test(l) || /-019-(01|11)〕$/.test(l),
  products: range(11).map((n) => ({ s: `019-${n}`, base: "組合せCSV単一規格削除", suffix: n, price: 1000 })),
  requests: range(11).map((n, i) => ({ id: `019-${n}`, m: "019", p: `019-${n}`, at: DEF_AT, deleted: DEF_DEL, db: i > 0 })),
});

defineM1206Seed("S-M12-06-CBMULTIPENDOVER-020", {
  sfx: "CBMULTIPENDOVER-020", members: ["020A", "020B"],
  keep: (l) => (!/商品規格ID/.test(l) || /-020-(01|11)[AB]〕$/.test(l)) && (!/入荷通知依頼ID/.test(l) || /-020-(01A1|11B2)〕$/.test(l)),
  products: range(11).map((n) => ({ s: `020-${n}`, base: "組合せCSV複数規格待ち", suffix: n, price: 1000, classes: [`020-${n}A`, `020-${n}B`] })),
  requests: range(11).flatMap((n, i) => [
    { id: `020-${n}A1`, m: "020A", p: `020-${n}`, c: `020-${n}A`, at: DEF_AT, db: i > 0 },
    { id: `020-${n}A2`, m: "020A", p: `020-${n}`, c: `020-${n}B`, at: DEF_AT, db: i > 0 },
    { id: `020-${n}B1`, m: "020B", p: `020-${n}`, c: `020-${n}A`, at: DEF_AT, db: i > 0 },
    { id: `020-${n}B2`, m: "020B", p: `020-${n}`, c: `020-${n}B`, at: DEF_AT, db: i > 0 },
  ]),
});

defineM1206Seed("S-M12-06-CBMULTIDEL-021", {
  sfx: "CBMULTIDEL-021", ...one("021"),
  products: [{ s: "021", base: "組合せCSV複数規格削除", price: 1000, classes: ["021A", "021B"] }],
  requests: [
    { id: "021A", m: "021", p: "021", c: "021A", at: DEF_AT, deleted: DEF_DEL },
    { id: "021B", m: "021", p: "021", c: "021B", at: DEF_AT, deleted: DEF_DEL },
  ],
});
