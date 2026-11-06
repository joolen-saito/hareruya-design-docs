/**
 * M14-10 フォーマット詳細（登録・編集・削除）の続きのシード（画面操作）。正本: cases/M14-10_seed_data.tsv
 * - フォーマット名(日)・(英)には実行ごとの印を付ける（画面でフォーマットを削除せず、前の実行のフォーマットと重ならない形で「無い状態」を満たす）。
 *   フォーマットコードは文字数の上限（10文字）に印が入らないため、コードを入れるシードは正本のまま。
 * - 大会・アーキタイプ・カード（禁止／制限の指定つき）は、フォーマットを登録したあとに画面から作る。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { Notes } from "../lib/notes";
import { Page } from "@playwright/test";
import { ensureMaster } from "../pages/admin/m14_card";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { 大会を登録する } from "../pages/admin/f07_04_setup";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { 画面でカードを作る } from "./m14-04";

export const 形式 = {
  日: (基: string) => rc(基),
  英: (基: string) => rc(基),
};

defineSeed("S-M14-10-CERT", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // シード表の英語名「M14-10 Test Certification」(25文字)は、認定の英語名の上限(16文字)を超えて保存できない。名称(日)で選ぶだけなので、英語名は短い値に代える
    await ensureMaster(page, "認定" as never, "M14-10試験認定", "M1410 Test Cert", seed.シードID);
    reportSeedIssue(seed.シードID, "認定の英語名は、シード表の「M14-10 Test Certification」が上限16文字を超えて保存できないため「M1410 Test Cert」で登録した");
  });
});

for (const id of ["NEW-007", "NEW-017", "NEW-021", "CBREGPASS-073"]) defineSeed(`S-M14-10-${id}`, async () => { /* 同じ名称のフォーマットは0件（印つきの名称で登録する） */ });

async function 登録(page: Page, notes: Notes, 呼び名: string, v: Parameters<typeof フォーマットを登録する>[1], what: string): Promise<string> {
  const id = await フォーマットを登録する(page, v, what);
  notes.set(呼び名, id);
  return id;
}

// 統率の設定を持つフォーマット（統率使用・統率メイン算入、上限2・下限1）
for (const [seed, n, 名, 英] of [
  ["COMMANDER-041", "041", "統率設定形式-041", "Commander Format-041"],
  ["CBCMDKEEP-071", "071", "統率維持形式-M1410CB071", "Cmd Keep M1410CB071"],
] as const) {
  defineSeed(`S-M14-10-${seed}`, async ({ browser, notes, seed: s }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 登録(page, notes, `〔フォーマットID-M1410-${n}〕`, { 名日: rc(名), 名英: rc(英), 並び順: "60", チェック: { useCommandFlg: true, commanderInMain: true }, 統率上限: "2", 統率下限: "1" }, s.シードID);
    });
  });
}
defineSeed("S-M14-10-CBCMDNONE-072", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 登録(page, notes, "〔フォーマットID-M1410-072〕", { 名日: rc("統率なし形式-M1410CB072"), 名英: rc("Cmd None M1410CB072"), 並び順: "60", ルール日: "統率なし更新前-M1410CB072" }, seed.シードID);
  });
});
defineSeed("S-M14-10-CBUPDPASS-074", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 登録(page, notes, "〔フォーマットID-M1410-074〕", { 名日: rc("更新前形式-M1410CB074"), 名英: rc("Upd Pass M1410CB074"), 並び順: "60" }, seed.シードID);
  });
});
defineSeed("S-M14-10-DPDEL-068", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 登録(page, notes, "〔フォーマットID-M1410-068〕", { 名日: rc("削除可能形式-068"), 名英: rc("M1410-068-Fmt"), 並び順: "80" }, seed.シードID);
  });
});

// 削除できるフォーマット（禁止カード・制限カードの指定つき）
for (const n of ["043", "050", "051"]) {
  defineSeed(`S-M14-10-DELETE-FREE-${n}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 名 = rc(`削除可能形式-${n}`);
      await 登録(page, notes, `〔フォーマットID-M1410-${n}〕`, { 名日: 名, 名英: rc(`Deletable Format-${n}`), 並び順: "80" }, seed.シードID);
      await 画面でカードを作る(page, { 日: rc(`禁止カード-${n}`), 英: rc(`BannedCard${n}`), 詳細数: 1, リーガリティ: [{ フォーマット: 名, リーガリティ: "禁止" }] }, seed.シードID);
      if (n === "043") await 画面でカードを作る(page, { 日: rc(`制限カード-${n}`), 英: rc(`RestrictedCard${n}`), 詳細数: 1, リーガリティ: [{ フォーマット: 名, リーガリティ: "制限" }] }, seed.シードID);
    });
  });
}

// 大会が紐づくフォーマット
for (const [n, 名, 英, 並び] of [["046", "大会使用中形式-046", "Tournament Format-046", "81"], ["049", "大会使用中形式-049", "Tournament Format-049", "81"]] as const) {
  defineSeed(`S-M14-10-DELETE-TOURNAMENT-${n}`, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 登録(page, notes, `〔フォーマットID-M1410-${n}〕`, { 名日: rc(名), 名英: rc(英), 並び順: 並び }, seed.シードID);
      await 大会を登録する(page, { イベント名: rc(`削除制約大会-${n}`), フォーマット: rc(名), 日程: [] });
    });
  });
}

// アーキタイプが紐づくフォーマット
defineSeed("S-M14-10-DELETE-ARCHETYPE-048", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 名 = rc("アーキタイプ使用中形式-048");
    await 登録(page, notes, "〔フォーマットID-M1410-048〕", { 名日: 名, 名英: rc("Archetype Format-048"), 並び順: "83" }, seed.シードID);
    await アーキタイプを登録する(page, { 名日: "削除制約アーキタイプ-048", 名英: "ArchetypeM1410048", フォーマット: 名 }, (m) => reportSeedIssue(seed.シードID, m));
  });
});

// 削除対象と別のフォーマットに同じカードを指定
defineSeed("S-M14-10-DPDEL-069", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const A = rc("削除対象形式-069"), B = rc("残存形式-069");
    await 登録(page, notes, "〔フォーマットID-M1410-069A〕", { 名日: A, 名英: rc("M1410-069-FmtA"), 並び順: "80" }, seed.シードID);
    await 登録(page, notes, "〔フォーマットID-M1410-069B〕", { 名日: B, 名英: rc("M1410-069-FmtB"), 並び順: "81" }, seed.シードID);
    await 画面でカードを作る(page, { 日: rc("共通指定カード-069"), 英: rc("M1410-069-CardX"), 詳細数: 1, リーガリティ: [{ フォーマット: A, リーガリティ: "禁止" }, { フォーマット: B, リーガリティ: "制限" }] }, seed.シードID);
  });
});
