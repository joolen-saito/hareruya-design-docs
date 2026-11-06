/**
 * M15-05 デッキ編集（続き）のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 *
 * - 共有マスタ（フォーマット5件・デッキタグ2件・カード4件・アーキタイプ3件）は段階ごとに分けた共有シード。名前の末尾に実行の印を付けて作る。
 * - フォーマット名(英)は半角英数字だけの欄のため、英字の別名を入れる。カード・アーキタイプの代表カード画像は画面から登録できないため、
 *   画像つきの既存カード（Lightning Bolt・Saheeli Rai）を代表カードに選ぶ（カードAの代わり・カードBの代わり）。
 * - 開催店舗「デッキ試験店舗」は作らず、イベント登録画面の選択肢（大阪店があればそれ、無ければ先頭）を使う（M15-01 と同じ）。
 * - 決め打ちのデッキ名・イベント名は「M1505-NNN」に実行の印を付けた語を前半に置く（rc）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { RUN_MARK, rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { registerSchedule } from "../pages/admin/schedule";
import { イベントと日程を用意する, デッキを登録する, デッキ登録内容 } from "../pages/admin/m15_deck";
import {
  名, カード4件を登録する, フォーマット一覧, フォーマットを登録する, アーキタイプを登録する05, デッキタグ2件を登録する, 代表カードの代役,
} from "../pages/admin/m15_05_master";
import { M1505_ADMIN } from "./m15-05";

export { 名, 代表カードの代役 };
export const M1505_U064: Account = { loginId: `m1505_u064_${RUN_MARK}`, password: M1505_ADMIN.password };
export const M1505_U065: Account = { loginId: `m1505_u065_${RUN_MARK}`, password: M1505_ADMIN.password };

/** ケースの語「M1505-NNN-…」に実行の印を付けた値（前半が検索語になる） */
export const 語 = (n: string) => rc(`M1505-${n}`);

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = SETUP_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

// ---- 共有マスタ（段階ごと） ----
defineSeed("S-M15-05-FMT", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  await 管理画面(browser, async (p) => { for (const d of フォーマット一覧) await フォーマットを登録する(p, d, (m) => reportSeedIssue("S-M15-05-FMT", m)); });
});
defineSeed("S-M15-05-CARD", { needs: ["S-M15-05-FMT"] }, async ({ browser }) => {
  await 管理画面(browser, (p) => カード4件を登録する(p, (m) => reportSeedIssue("S-M15-05-CARD", m)));
});
defineSeed("S-M15-05-ARC", { needs: ["S-M15-05-FMT"] }, async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-ARC", m);
  await 管理画面(browser, async (p) => {
    await デッキタグ2件を登録する(p);
    await アーキタイプを登録する05(p, { key: "型甲", タグ: ["タグ一", "タグ二"], 代表: "A" }, issue);
    await アーキタイプを登録する05(p, { key: "型乙", タグ: [], 代表: "B" }, issue);
    await アーキタイプを登録する05(p, { key: "型丙", タグ: [], 代表: "A" }, issue);
  });
});

// ---- デッキ ----
const 標準 = () => ({ フォーマット: 名("標準"), アーキタイプ: 名("型甲") });

function デッキのシード(seedId: string, n: string, defs: { key: string; デッキ名: string; 内容?: Partial<デッキ登録内容> }[], needs: string[] = ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (p) => {
      for (const d of defs) notes.set(`〔デッキID-M1505-${d.key}〕`, await デッキを登録する(p, { デッキ名: d.デッキ名, ...d.内容 }, issue));
    });
  });
}
const 通常 = (n: string) => ({ key: n, デッキ名: `${語(n)}-デッキ`, 内容: 標準() });

for (const n of ["005", "006", "007", "022", "065"]) デッキのシード(`S-M15-05-DECK-${n}`, n, [通常(n)]);

デッキのシード("S-M15-05-DECK-008", "008", [{
  key: "008", デッキ名: `${語("008")}-デッキ`,
  内容: { ...標準(), リスト非公開: true, タグ: [名("タグ一")], 代表カード検索語: 代表カードの代役.A, 公開状態: "公開",
    プレイヤー名: `${語("008")}-プレイヤー`, イベント名日: `${語("008")}-大会`, イベント名英: `${語("008")}-Event`, 開催日: "2026-05-10T13:30",
    順位: "3", 成績: `${語("008")}-成績`, 引用元URL: "https://example.com/M1505-008", 参加人数: "64" },
}], ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD", "S-M15-05-ARC"]);

デッキのシード("S-M15-05-DECK-009", "009", [{
  key: "009", デッキ名: `${語("009")}-デッキ`,
  内容: { ...標準(), メイン: `4 ${名("カードA")}\n2 ${名("カードB")}`, サイド: `3 ${名("カードB")}`, 統率: `1 ${名("カードA")}` },
}], ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD", "S-M15-05-ARC"]);

// 共有のマスタから任意の1件を使うデッキ（フォーマット・アーキタイプの指定なし）
defineSeed("S-M15-05-DECK2-012", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-DECK2-012", m);
  await 管理画面(browser, async (p) => {
    notes.set("〔デッキID-M1505-012A〕", await デッキを登録する(p, { デッキ名: `${語("012")}-甲` }, issue));
    notes.set("〔デッキID-M1505-012B〕", await デッキを登録する(p, { デッキ名: `${語("012")}-乙` }, issue));
  });
});
defineSeed("S-M15-05-DECK-013", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  await 管理画面(browser, async (p) => { notes.set("〔デッキID-M1505-013〕", await デッキを登録する(p, { デッキ名: `${語("013")}-デッキ` }, (m) => reportSeedIssue("S-M15-05-DECK-013", m))); });
});

// ---- イベントとデッキ ----
const イベント日 = "2026/07/20 18:00";
defineSeed("S-M15-05-EVT-010", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-EVT-010", m);
  await 管理画面(browser, async (p) => {
    const ev = await イベントと日程を用意する(p, { 名日: `${語("010")}-大会`, 名英: `${語("010")}-Event`, 開始時間: イベント日.replace(/\//g, "-") }, issue);
    notes.set("〔デッキID-M1505-010〕", await デッキを登録する(p, { デッキ名: `${語("010")}-デッキ`, イベント: { 検索語: `${語("010")}-大会`, 日程ID: ev.日程ID }, 選択後に空にする: true }, issue));
  });
});

/** イベントA（2026-03-10 10:00）とイベントB（2026-06-20 10:00） */
for (const n of ["027", "028", "030", "031"]) {
  defineSeed(`S-M15-05-EVT-${n}`, { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(`S-M15-05-EVT-${n}`, m);
    await 管理画面(browser, async (p) => {
      await イベントと日程を用意する(p, { 名日: `${語(n)}-甲大会`, 名英: `${語(n)}-AlphaCup`, 開始時間: "2026-03-10 10:00" }, issue);
      await イベントと日程を用意する(p, { 名日: `${語(n)}-乙大会`, 名英: `${語(n)}-BetaCup`, 開始時間: "2026-06-20 10:00" }, issue);
    });
  });
}
defineSeed("S-M15-05-EVT-029", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-EVT-029", m);
  await 管理画面(browser, async (p) => {
    const ev = await イベントと日程を用意する(p, { 名日: `${語("029")}-複数大会`, 名英: `${語("029")}-MultiCup`, 開始時間: "2026-04-01 10:00" }, issue);
    await registerSchedule(p, ev.イベントID, { 開始時間: "2026-04-02 10:00", 受付あり: false, デッキ登録あり: false });
  });
});

// ---- 削除済みの番号 ----
defineSeed("S-M15-05-NOEXIST-011", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-NOEXIST-011", m);
  await 管理画面(browser, async (p) => {
    const 消す = await デッキを登録する(p, { デッキ名: `${語("011")}-消す` }, issue);
    await p.goto(adminUrl(`/deck/${消す}/edit`));
    p.once("dialog", (d) => d.accept());
    await Promise.all([p.waitForURL((u) => !/\/edit$/.test(u.pathname), { waitUntil: "load" }), p.locator("#btn_delete").click()]);
    notes.set("〔デッキID-M1505-011A〕", 消す);
    notes.set("〔デッキID-M1505-011B〕", await デッキを登録する(p, { デッキ名: `${語("011")}-元` }, issue));
  });
});

// ---- 新規登録のあとで作られるものは無い（不存在状態）。登録の入力に使う共有マスタを先に作る ----
for (const n of ["039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "056", "060", "061", "064"]) {
  defineSeed(`S-M15-05-${/^03/.test(n) ? "NEWALL" : /^04[89]|^05[0-3]/.test(n) ? "NEWMAX" : "NEWREQ"}-${n}`, { needs: ["S-M15-05-ADM"] }, async () => { /* 作るものは無い（登録前の状態） */ });
}
defineSeed("S-M15-05-ADM2-064", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: M1505_U064.loginId, account: M1505_U064, メール: `${M1505_U064.loginId}@example.test` });
});
defineSeed("S-M15-05-ADM2-065", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: M1505_U065.loginId, account: M1505_U065, メール: `${M1505_U065.loginId}@example.test` });
});

for (const n of ["015", "016", "018"]) {
  defineSeed(`S-M15-05-SESS-${n}`, async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });
}
