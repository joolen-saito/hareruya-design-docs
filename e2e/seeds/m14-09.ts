/**
 * M14-09 フォーマット一覧 のシードの作り方（画面操作）。正本: cases/M14-09_seed_data.tsv
 * - フォーマット名(日)・(英)には実行ごとの印を付ける（手元のDBに元からある開発用のフォーマットと同名にならないようにする）。
 * - 実装しないシード: LIST（スタンダード等の同名フォーマットが手元に元からある）、ALL-002・ZERO-004（DBでの準備）、DECK-013・014（デッキ登録の部品が未整備）
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { 大会を登録する } from "../pages/admin/f07_04_setup";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { 画面でカードを作る } from "./m14-04";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1409_ADMIN: Account = { loginId: "m1409_admin", password: "Passw0rd!M1409" };
defineSeed("S-M14-09-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-09試験管理者", account: M1409_ADMIN, メール: "m1409_admin@example.test" });
});

/** 一覧に出る表示（フォーマット名(日) / フォーマット名(英)） */
export const 形式名 = (日: string, 英: string) => ({ 日: rc(日), 英: rc(英) });

type 定義 = { id: string; 日: string; 英: string; 並び?: string; 後?: (page: import("@playwright/test").Page, 名: { 日: string; 英: string }, what: string) => Promise<void> };

const 定義一覧: 定義[] = [
  { id: "EVENT-011", 日: "イベント使用中フォーマット-011", 英: "Event Format 011", 並び: "900", 後: (p, n) => 大会を登録する(p, { イベント名: rc("EV-M1409-01-011"), フォーマット: n.日, 日程: [] }).then(() => undefined) },
  { id: "EVENT-012", 日: "イベント使用中フォーマット-012", 英: "Event Format 012", 並び: "900", 後: (p, n) => 大会を登録する(p, { イベント名: rc("EV-M1409-01-012"), フォーマット: n.日, 日程: [] }).then(() => undefined) },
  { id: "ARCHETYPE-015", 日: "アーキタイプ使用中フォーマット-015", 英: "Archetype Format 015", 後: async (p, n, w) => { await アーキタイプを登録する(p, { 名日: "ARCH-M1409-01-015", 名英: "ARCHM140901015", フォーマット: n.日 }, (m) => reportSeedIssue(w, m)); } },
  { id: "ARCHETYPE-016", 日: "アーキタイプ使用中フォーマット-016", 英: "Archetype Format 016", 後: async (p, n, w) => { await アーキタイプを登録する(p, { 名日: "ARCH-M1409-01-016", 名英: "ARCHM140901016", フォーマット: n.日 }, (m) => reportSeedIssue(w, m)); } },
  { id: "DELETABLE-017", 日: "削除可能フォーマット-017", 英: "Deletable Format 017", 後: async (p, n, w) => { await 禁止と制限のカード(p, "017", n.日, w); } },
  { id: "DELETABLE-018", 日: "削除可能フォーマット-018", 英: "Deletable Format 018", 後: async (p, n, w) => { await 禁止と制限のカード(p, "018", n.日, w); } },
  { id: "NOTFOUND-019", 日: "識別子確認フォーマット-019", 英: "Identifier Format 019" },
  { id: "NOTFOUND-020", 日: "識別子確認フォーマット-020", 英: "Identifier Format 020" },
  { id: "TOKEN-021", 日: "トークン確認フォーマット-021", 英: "Token Format 021" },
  { id: "TOKEN-022", 日: "トークン確認フォーマット-022", 英: "Token Format 022" },
  { id: "DP-NOLEGAL-027", 日: "M1409-027-A", 英: "M1409-027-A" },
];

async function 禁止と制限のカード(page: import("@playwright/test").Page, n: string, フォーマット: string, what: string): Promise<void> {
  await 画面でカードを作る(page, { 日: rc(`CARD-BAN-001-${n}`), 英: rc(`CARD-BAN-001-${n}`), 詳細数: 1, マナ: "0", リーガリティ: [{ フォーマット, リーガリティ: "禁止" }] }, what);
  await 画面でカードを作る(page, { 日: rc(`CARD-LIMIT-001-${n}`), 英: rc(`CARD-LIMIT-001-${n}`), 詳細数: 1, マナ: "0", リーガリティ: [{ フォーマット, リーガリティ: "制限" }] }, what);
}

for (const d of 定義一覧) {
  defineSeed(`S-M14-09-${d.id}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 名 = 形式名(d.日, d.英);
      const id = await フォーマットを登録する(page, { 名日: 名.日, 名英: 名.英, 並び順: d.並び ?? "900" }, seed.シードID);
      notes.set(`〔フォーマットID-M1409-${d.id.slice(-3)}〕`, id);
      if (d.後) await d.後(page, 名, seed.シードID);
    });
  });
}

defineSeed("S-M14-09-DP-TWOFMT-028", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const A = 形式名("M1409-028-A", "M1409-028-A"), B = 形式名("M1409-028-B", "M1409-028-B");
    notes.set("〔フォーマットID-M1409-028A〕", await フォーマットを登録する(page, { 名日: A.日, 名英: A.英, 並び順: "900" }, seed.シードID));
    notes.set("〔フォーマットID-M1409-028B〕", await フォーマットを登録する(page, { 名日: B.日, 名英: B.英, 並び順: "900" }, seed.シードID));
    await 画面でカードを作る(page, { 日: rc("CARD-M1409-028-X"), 英: rc("CARD-M1409-028-X"), 詳細数: 1, マナ: "0", リーガリティ: [{ フォーマット: A.日, リーガリティ: "禁止" }, { フォーマット: B.日, リーガリティ: "制限" }] }, seed.シードID);
  });
});
