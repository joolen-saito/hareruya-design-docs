/**
 * M15-05 デッキ編集（代表カードの指定・ボードの解釈）のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 * 共有マスタは seeds/m15-05-b.ts の共有シード。語は「M1505-NNN」「M1505-CBNNN」に実行の印を付けた語。
 * 代表カードの画像は画面から登録できないため、アーキタイプの代表カードは画像つきの既存カード（Lightning Bolt）で代える。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { デッキを登録する } from "../pages/admin/m15_deck";
import { 名 } from "../pages/admin/m15_05_master";
import { ケース専用アーキタイプを登録する } from "../pages/admin/m15_05_cb";
import { 語 } from "./m15-05-b";
import { 語CB } from "./m15-05-e";

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

defineSeed("S-M15-05-DECK-144", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"] }, async ({ browser, notes }) => {
  await 管理画面(browser, async (p) => {
    notes.set("〔デッキID-M1505-144〕", await デッキを登録する(p, { デッキ名: `${語("144")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型甲") }, (m) => reportSeedIssue("S-M15-05-DECK-144", m)));
  });
});

// 登録前の状態（作るものは無い）
for (const n of ["156", "157", "158", "159", "160", "161", "162", "166", "167", "168"]) {
  defineSeed(`S-M15-05-CBNEWREQ-${n}`, { needs: ["S-M15-05-ADM"] }, async () => { /* 作るものは無い（登録前の状態） */ });
}

// ケース専用のアーキタイプ（代表カード=Lightning Bolt で代える。166 は代表カードなし）
const アーキ: [string, Parameters<typeof 名>[0], boolean][] = [
  ["159", "単一", true], ["160", "統率なし", true], ["161", "上限", true], ["162", "下限", true], ["166", "標準", false],
];
for (const [n, fmt, 代表あり] of アーキ) {
  defineSeed(`S-M15-05-CBARC-${n}`, { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD"] }, async ({ browser }) => {
    await 管理画面(browser, async (p) => {
      await ケース専用アーキタイプを登録する(p, { 名日: `${語CB(n)}-型`, 名英: `${語CB(n)}-Type`, フォーマット: fmt, 代表: 代表あり ? "A" : undefined }, (m) => reportSeedIssue(`S-M15-05-CBARC-${n}`, m));
    });
  });
}
