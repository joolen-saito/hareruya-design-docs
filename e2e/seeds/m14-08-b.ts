/**
 * M14-08 カードセット詳細（登録・編集・削除）の残りのシード（画面操作）。正本: cases/M14-08_seed_data.tsv
 * - カードセットの名称・英語名・略称には実行ごとの印を付ける（シード表の「同じ名称のものが無いこと」を、前の実行の残りと重ならない形で満たす）。
 * - 「試験ブロック」は共有可。MTGマスターデータ管理で無ければ登録し、ブロック選択の値（ID）を控える。
 * - 収録カードは、カード詳細(登録)画面で作る（カード名には印を付ける）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { Notes } from "../lib/notes";
import { 登録画面を開く, カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { ensureMaster } from "../pages/admin/m14_card";
import { 画面でカードを作る } from "./m14-04";

export const 名 = {
  日: (n: string, 基: string) => rc(`${基}-${n}`),
  英: (n: string, 基: string) => rc(`${基} ${n}`),
  略: (n: string, 基: string) => rc(`${基}-${n}`),
};

/** ケース専用のカードセット1件（既定は未指定ブロック・特殊セット未選択・画像なし・2025/09/18） */
export type セット定義 = { 呼び名: string; 日: string; 英: string; 略: string; ブロック?: string; 特殊?: boolean };

export const 編集前 = (n: string): セット定義 => ({ 呼び名: `〔カードセットID-M1408-${n}〕`, 日: rc(`編集前カードセット-${n}`), 英: rc(`Before Card Set-${n}`), 略: rc(`BEFORE-${n}`) });
export const 収録あり = (n: string): セット定義 => ({ 呼び名: `〔カードセットID-M1408-${n}A〕`, 日: rc(`収録カードありセット-${n}`), 英: rc(`Card Included Set-${n}`), 略: rc(`WITHCARD-${n}`) });
export const 削除用 = (n: string): セット定義 => ({ 呼び名: `〔カードセットID-M1408-${n}〕`, 日: rc(`削除確認セット-${n}`), 英: rc(`Delete Check Set-${n}`), 略: rc(`DELETE-${n}`) });
export const 画像なし = (n: string): セット定義 => ({ 呼び名: `〔カードセットID-M1408-${n}〕`, 日: rc(`M1408-${n}-A`), 英: rc(`M1408-${n}-A`), 略: rc(`M1408-${n}-A`) });

async function セットを作る(page: Page, notes: Notes, s: セット定義, what: string): Promise<string> {
  const id = await カードセットを登録する(page, { 名日: s.日, 名英: s.英, 略称: s.略, ブロック: s.ブロック, 特殊: s.特殊 }, what);
  notes.set(s.呼び名, id);
  return id;
}

/** 試験ブロックのID（ブロック選択の選択肢の値）。無ければ画面で登録する */
async function 試験ブロックを用意する(page: Page, what: string): Promise<string> {
  await ensureMaster(page, "カードセットブロック" as never, "試験ブロック", "Test Block", what);
  await 登録画面を開く(page);
  const v = await page.locator('[name="admin_cardset[Cardsetblock]"] option').evaluateAll((os) => (os as HTMLOptionElement[]).filter((o) => o.textContent?.trim() === "試験ブロック").map((o) => o.value));
  if (v.length === 0) throw new Error(`${what}: ブロック選択に「試験ブロック」が出ない`);
  return v[0];
}

defineSeed("S-M14-08-BLOCK", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔カードセットブロックID-M1408-共有〕", await 試験ブロックを用意する(page, seed.シードID));
  });
});

const 単純: { id: string; 定義: セット定義; ブロック必要?: boolean }[] = [
  { id: "BASE-003", 定義: 編集前("003") },
  { id: "BASE-013", 定義: 編集前("013") },
  { id: "BASE-014", 定義: { ...編集前("014"), ブロック: "試験ブロック", 特殊: true }, ブロック必要: true },
  { id: "BASE-017", 定義: 編集前("017") },
  { id: "BASE-019", 定義: 編集前("019") },
  { id: "BASE-020", 定義: 編集前("020") },
  { id: "BASE-026", 定義: 編集前("026") },
  { id: "BASE-028", 定義: 編集前("028") },
  { id: "BASE-029", 定義: 編集前("029") },
  { id: "LOOKUP-027", 定義: { 呼び名: "〔カードセットID-M1408-027〕", 日: rc("URL確認カードセット-027"), 英: rc("URL Check Card Set-027"), 略: rc("URLCHECK-027") } },
  { id: "DELETE-035", 定義: 削除用("035") },
  { id: "DELETE-036", 定義: 削除用("036") },
  { id: "DELETE-040", 定義: 削除用("040") },
  { id: "DELETE-041", 定義: 削除用("041") },
  { id: "NOIMG-051", 定義: 画像なし("051") },
  { id: "NOIMG-052", 定義: 画像なし("052") },
  { id: "DP-NOIMG-055", 定義: 画像なし("055") },
  { id: "DP-BASE-056", 定義: 画像なし("056") },
];
for (const s of 単純) {
  defineSeed(`S-M14-08-${s.id}`, s.ブロック必要 ? { needs: ["S-M14-08-BLOCK"] } : {}, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await セットを作る(page, notes, s.定義, seed.シードID);
    });
  });
}

// 新規登録のケースが使う「未登録」の前提。名称に実行ごとの印を付けるので、前の実行のカードセットとは重ならない
for (const id of ["NEW-006", "NEW-030", "NEW-050", "CBNEWNOIMG-057"]) defineSeed(`S-M14-08-${id}`, async () => { /* 同じ名称のカードセットは0件（印つきの名称で登録する） */ });

// 収録カードあり: 対象のカードセット（A）に収録するカードと、別のカードセット（B）に収録するカード
const カード付き: { n: string; A名: string; Bカード: string | null; Aカード: string }[] = [
  { n: "016", A名: "収録カードA", Bカード: "他セットカードB", Aカード: "収録カードA" },
  { n: "033", A名: "収録カードA-033", Bカード: "他セットカードB-033", Aカード: "収録カードA-033" },
  { n: "034", A名: "収録カードA", Bカード: "他セットカードB", Aカード: "収録カードA" },
  { n: "038", A名: "収録カードA-038", Bカード: null, Aカード: "収録カードA-038" },
  { n: "039", A名: "収録カードA-039", Bカード: null, Aカード: "収録カードA-039" },
];
/** 収録カードの表示名（カード名(日)。実行の印つき） */
export const 収録カード名 = (n: string, 基: string) => rc(`${基}-${n}`);

async function カードを作る(browser: Browser, セット日: string, 日: string, 英: string, what: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const r = await 画面でカードを作る(page, { 日, 英, 詳細数: 1, 詳細ごと: [{ カードセット: セット日 }] }, what);
    return r.カードID;
  });
}
for (const c of カード付き) {
  defineSeed(`S-M14-08-WITH-CARD-${c.n}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    const A = c.Bカード ? 収録あり(c.n) : { ...収録あり(c.n), 呼び名: `〔カードセットID-M1408-${c.n}〕` };
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await セットを作る(page, notes, A, seed.シードID);
      if (c.Bカード) {
        const B = { 呼び名: `〔カードセットID-M1408-${c.n}B〕`, 日: rc(`他カードセット-${c.n}`), 英: rc(`Other Card Set ${c.n}`), 略: rc(`OTHER-${c.n}`) };
        await セットを作る(page, notes, B, seed.シードID);
        const cardB = await カードを作る(browser, B.日, rc(`${c.Bカード}`), rc(`OtherCard${c.n}B`), seed.シードID);
        notes.set(`〔カードID-M1408-${c.n}B〕`, cardB);
      }
    });
    const cardA = await カードを作る(browser, A.日, rc(`${c.Aカード}`), rc(`IncludedCard${c.n}A`), seed.シードID);
    notes.set(c.Bカード ? `〔カードID-M1408-${c.n}A〕` : `〔カードID-M1408-${c.n}〕`, cardA);
  });
}
void 収録カード名;
