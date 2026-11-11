/**
 * M05-01 受注管理（受注一覧系）の画面シード。正本: cases/M05-01_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるシード（管理者・検索パターン系・0件確認）だけ。受注を作るシード（注文番号・日付・会員の購入履歴などをDBへ直接設定するもの）は作らない。
 * - S-M05-01-ADM: メンバー管理で登録し、店舗Aをデフォルト検索表示店舗にする。
 *   シード表に店舗の用意は書かれていない。店舗A・店舗Bは、この機能のシードとして店舗登録画面で「試験店舗A（M05-01）」「試験店舗B（M05-01）」を登録する
 *   （店名と会社名がそろい開店の店舗があれば内容を確かめて使う）。店舗Bは検索パターン保存のケース（IT-M05-01-056）が店舗の選択肢に使う。
 *   所属店舗はシード表に無いので、デフォルト検索表示店舗と同じ店舗Aにする（デフォルト検索表示店舗は所属店舗と同じ店舗しか選べない画面の作り）。
 *   編集可能店舗は店舗A・店舗B。権限はシード表の「受注管理を操作できる」を満たすシステム管理者にする（シード表に権限の指定は無い）。
 * - 検索パターン系: 受注情報検索 一覧(検索入力)画面の検索条件保存・削除で作る。
 *
 * 決め打ちの識別の値（検索パターン名・注文番号・メールアドレスの前半・お名前）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。
 * 入力チェックの確かめに使う値（フリガナのカタカナでない値）にも印を付ける（値の書式を確かめるケースではなく、カタカナでないことが要るだけ）。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 検索パターンの有無 } from "../db/m05_01_search_pattern";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { StockSearchPatternPage } from "../pages/admin/m04_01_search_pattern";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { expectStore, findOpenStoreId, M0424StoreInput } from "../pages/admin/m04_24_store";
import { OrderSearchPage } from "../pages/admin/m05_01_order_search";

/** 開発環境に同じログインID・名前の試験管理者（だれの回で書き換えられたか分からない）があるので、ログインID・名前に実行の印を付けて作る（M03-26 などと同じ） */
export const M0501_ADMIN: Account = { loginId: rc("m0501_admin").toLowerCase(), password: "Passw0rd!M0501" };
const ADMIN_NAME = rc("M05-01試験管理者");

const COMPANY = "M05-01試験会社";
const STORE_A: M0424StoreInput = {
  店名: "試験店舗A（M05-01）", 店名カナ: "シケンテンポエー", 店名英語: "Test Store A Mfive", 支店URL: "m0501storea", 店名略称3文字: "R5A", ショップ名略称: "試験店舗A",
  会社名: COMPANY, 会社名カナ: "シケンガイシャ", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿4-9-1", 住所2: "試験ビル1F", 電話番号: "03-0501-0001",
};
const STORE_B: M0424StoreInput = {
  店名: "試験店舗B（M05-01）", 店名カナ: "シケンテンポビー", 店名英語: "Test Store B Mfive", 支店URL: "m0501storeb", 店名略称3文字: "R5B", ショップ名略称: "試験店舗B",
  会社名: COMPANY, 会社名カナ: "シケンガイシャ", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿4-9-2", 住所2: "試験ビル2F", 電話番号: "03-0501-0002",
};
export const 店舗Aの店名 = STORE_A.店名;
export const 店舗Bの店名 = STORE_B.店名;

defineSeed("S-M05-01-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 店舗は作ると消せず、1店で在庫の行が約39万行できる（開発環境 2026-11-11）。開発環境に既にある店舗だけを使い、無ければ作らずに止める
    const 既存の店舗 = async (v: M0424StoreInput): Promise<string> => {
      const id = await findOpenStoreId(page, v.店名, v.会社名);
      if (!id) throw new Error(`店舗「${v.店名}」が開発環境に無い（店舗は作らない。判断待ち）`);
      await expectStore(page, id, v);
      return id;
    };
    const a = await 既存の店舗(STORE_A);
    const b = await 既存の店舗(STORE_B);
    await ensureMemberByStoreIds(page, {
      名前: ADMIN_NAME, ログインID: M0501_ADMIN.loginId, メールアドレス: `${M0501_ADMIN.loginId}@example.test`, パスワード: M0501_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
    });
  });
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    await new OrderSearchPage(page).open();
  });
});

type Pat = { 注文番号?: string; お名前?: string; フリガナ?: string; メール?: string; パターン名: string };

/** 検索パターンを作るシード。先に同じ名前があれば作らずに止める代わりに、選んで削除して作り直す */
function patternSeed(seedId: string, make: Pat[], absent: string[] = []): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      for (const a of absent) {
        await p.removePatternIfExists(a);
        await p.open();
        expect(await p.patternNames(), `検索パターン「${a}」が無いこと`).not.toContain(a);
      }
      for (const m of make) {
        await p.removePatternIfExists(m.パターン名);
        await p.savePattern(m);
      }
    });
  });
}

// ---- 0件の確認（受注） ----
defineSeed("S-M05-01-NOTFOUND-007", { needs: ["S-M05-01-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    await p.open();
    // 店舗は全店を選ぶ
    await p.tenants.selectOption({ label: "全店" });
    await p.orderNumber.fill(rc("M0501-NOT-FOUND"));
    await p.clickSearch();
    const total = (await page.locator("#search_total_count").innerText()).replace(/\s+/g, "");
    if (!/0件/.test(total)) {
      reportSeedIssue(seed.シードID, `注文番号「${rc("M0501-NOT-FOUND")}」の受注が0件でない（${total}）。シード表は受注を削除して0件にするとあるが、印を付けた値なので該当しないはず`);
    }
    expect(total, "注文番号に印つきの M0501-NOT-FOUND を含む受注が0件").toMatch(/0件/);
  });
});

// ---- 検索パターンが無い ----
patternSeed("S-M05-01-PATNEW-051", [], [rc("M0501-051-PAT")]);
patternSeed("S-M05-01-PATBODY-052", [], [rc("M0501-052-PAT")]);
patternSeed("S-M05-01-PATSTORE-056", [], [rc("M0501-056-PAT")]);
patternSeed("S-M05-01-VALSAVE-069", [], [rc("M0501-069-PAT")]);

// ---- 注文番号を条件に含む検索パターンが無い ----
for (const [id, no] of [["S-M05-01-PATEMPTY-054", "M0501-054-NEW"], ["S-M05-01-PATEMPTY-133", "M0501-133-NEW"], ["S-M05-01-PATEMPTYMSG-138", "M0501-138-NEW"]] as const) {
  defineSeed(id, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      await p.removePatternsWithOrderNumber(rc(no));
    });
  });
}

// ---- 検索パターンが登録されている ----
patternSeed("S-M05-01-PATUPD-055", [{ 注文番号: rc("M0501-055-A"), パターン名: rc("M0501-055-OLD") }], [rc("M0501-055-NEW")]);
patternSeed("S-M05-01-PATFORM-065", [{ 注文番号: rc("M0501-065"), メール: `${rc("m0501-065")}@example.test`, お名前: rc("M0501-065-NAME"), パターン名: rc("M0501-065-PAT") }]);
patternSeed("S-M05-01-VALCALL-071", [{ 注文番号: rc("M0501-071"), フリガナ: rc("M0501-071-BAD"), パターン名: rc("M0501-071-PAT") }]);
patternSeed("S-M05-01-PATDEL-161", [{ 注文番号: rc("M0501-161"), パターン名: rc("M0501-161-PAT") }]);
patternSeed("S-M05-01-PATDELTRANS-163", [{ 注文番号: rc("M0501-163"), パターン名: rc("M0501-163-PAT") }]);

defineSeed("S-M05-01-PATNONE-064", { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    await p.removePatternIfExists(rc("M0501-064-PAT"));
    await p.savePattern({ 注文番号: rc("M0501-064"), パターン名: rc("M0501-064-PAT") });
  });
  expect(検索パターンの有無("106499999"), "検索パターンID 106499999 の検索パターンが無い").toBe(0);
});

// ---- 検索パターンを全部消して、決まった3件（と在庫一覧の1件）だけにする ----
function listSeed(seedId: string, no: string, withStock: boolean): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      await p.removeAllPatterns();
      for (const k of ["C", "A", "B"]) {
        await p.savePattern({ 注文番号: rc(`M0501-${no}-${k}`), パターン名: rc(`M0501-${no}-PAT-${k}`) });
      }
      if (withStock) {
        const s = new StockSearchPatternPage(page);
        await s.open();
        await s.showPatternArea();
        await s.patternName.fill(rc(`M0501-${no}-PAT-STOCK`));
        await s.clickSave();
        await expect(page.locator(".alert-success"), "在庫一覧の検索パターンの保存").toBeVisible();
      }
    });
  });
}
listSeed("S-M05-01-PATLIST-058", "058", true);
listSeed("S-M05-01-PATLIST-134", "134", false);
