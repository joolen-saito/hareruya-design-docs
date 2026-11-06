/**
 * M15-05 デッキ編集（複製の重ね・更新の重ね・削除後の戻り先）のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 * 共有マスタは seeds/m15-05-b.ts の共有シード。デッキ名は「M1505-NNN」「M1505-CBNNN」に実行の印を付けた語を前半に置く。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { デッキを登録する } from "../pages/admin/m15_deck";
import { 名 } from "../pages/admin/m15_05_master";
import { 語 } from "./m15-05-b";

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });
const 標準 = () => ({ フォーマット: 名("標準"), アーキタイプ: 名("型甲") });

/** ケースの語「M1505-CBNNN」に実行の印を付けた値 */
export const 語CB = (n: string) => rc(`M1505-CB${n}`);

defineSeed("S-M15-05-DECK-151", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"] }, async ({ browser, notes }) => {
  await 管理画面(browser, async (p) => { notes.set("〔デッキID-M1505-151〕", await デッキを登録する(p, { デッキ名: `${語("151")}-デッキ`, ...標準() }, (m) => reportSeedIssue("S-M15-05-DECK-151", m))); });
});
defineSeed("S-M15-05-DECK-150", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD", "S-M15-05-ARC"] }, async ({ browser, notes }) => {
  await 管理画面(browser, async (p) => {
    notes.set("〔デッキID-M1505-150〕", await デッキを登録する(p, { デッキ名: `${語("150")}-デッキ`, ...標準(), メイン: `4 ${名("カードA")}`, サイド: `3 ${名("カードB")}` }, (m) => reportSeedIssue("S-M15-05-DECK-150", m)));
  });
});
// シード表は、番号順の先頭〔デッキID-M1505-CB195A〕と末尾〔デッキID-M1505-CB195L〕を控えると定める（間の10件は控えない）
defineSeed("S-M15-05-CBDECK12-195", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-CBDECK12-195", m);
  await 管理画面(browser, async (p) => {
    for (let i = 0; i < 12; i++) {
      const id = await デッキを登録する(p, { デッキ名: `${語CB("195")}-${String(i + 1).padStart(2, "0")}`, ...標準() }, issue);
      if (i === 0) notes.set("〔デッキID-M1505-CB195A〕", id);
      if (i === 11) notes.set("〔デッキID-M1505-CB195L〕", id);
    }
  });
});
defineSeed("S-M15-05-CBNEW-196", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"] }, async () => { /* 作るものは無い（登録前の状態。新しいブラウザの状態で成り立つ） */ });
