/**
 * M04-01 在庫検索/一覧の画面シード。正本: cases/M04-01_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（016・018〜022。検索条件保存の欄）が使うシードだけ。
 * 2026-11-13 試験店舗の使い回し（依頼者決定。pages/admin/reuse_store.ts・e2e/review/store_cleanup_20261113.md）: 前に作った「東京本店」「大阪支店」は
 * 片付ける一覧に入ったので、店舗は作らず、東京本店は本店（店舗ID 1）、大阪支店は「試験支店」で読み替える（下の 店名）。試験管理者は編集できる店舗が
 * 変わったので、前のものとは別の決まった名前で作る。
 * - S-M04-01-ADM-ALL: 全店舗試験管理者。メンバー管理で登録し、所属店舗・デフォルト検索表示店舗を東京本店、編集可能店舗を東京本店と大阪支店にする。
 *   東京本店・大阪支店は、シード表では S-M04-01-MASTER（検索選択肢マスタ）が店舗登録画面で登録する店舗で、ADM-ALL の作り方には店舗の用意が書かれていない。
 *   MASTER は棚番号を「DBへ直接設定する」ので作らない。編集権限に選ぶには店舗が要るので、MASTER と同じ操作（店舗登録画面で、店名・開店を指定し、
 *   ほかの必須項目に任意の値）で東京本店・大阪支店だけを用意する（あれば内容を確かめて使う）。上野閉店・マスタ類は作らない。
 *   所属店舗はシード表に無い。デフォルト検索表示店舗は所属店舗と同じ店舗しか選べない（メンバー登録画面の作り）ので、所属店舗も東京本店にする。
 *   権限はシード表に無い。在庫検索一覧を使えればよいので、システム管理者にする。
 *   手元のDBに「東京本店」「大阪支店」の店名の店舗は無い（2026-10-21 に参照で確かめた）。店名と会社名がそろい開店の店舗だけを試験店舗とみなし、
 *   2件以上あれば止める（HANDOFF 4章の27 の「本店」の重なりと同じことを避ける）。
 * - 検索パターンのシード（PATTERN-018・PATTERN-022）: 在庫検索一覧の「検索条件保存」で保存し、移った先のアドレスの末尾の番号を控える。
 * - 検索パターンが無いことのシード（ABSENT-019・ABSENT-020）: 保存された検索パターン一覧に、その名前が無いことを確かめる。あれば選んで検索条件削除を押す。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc, rcFixed } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { shortName, StockSearchPatternPage } from "../pages/admin/m04_01_search_pattern";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { 試験支店, 試験支店の店舗ID, 本店の店舗ID, 本店の店名DB } from "../pages/admin/reuse_store";

/**
 * シード表のログインIDは m0401_all。開発環境には同じログインIDのメンバー（名前 M0401全権限。手動テスト用に作られたもの）が既にあり、
 * 同じ値では登録できない。ほかの方のメンバーは使わず、決め打ちの識別の値として実行の印を付けたログインID・名前で作る（依頼者決定 2026-10-28「案A」）。
 * ケースはログインIDそのものを確かめない。
 */
export const M0401_ALL: Account = { loginId: rcFixed("m0401_all2").toLowerCase(), password: "Passw0rd!M0401A" };
export const ALL_NAME = rcFixed("M04-01全店舗試験管理者（本店・試験支店）");

/** 正本の店名と、読み替えた店舗の店名（画面の選択肢・一覧に出る名前）。東京本店＝本店（店舗ID 1）・大阪支店＝試験支店 */
export type 正本の店 = "東京本店" | "大阪支店";
export const 店名: Record<正本の店, string> = {
  東京本店: (() => { try { return 本店の店名DB(); } catch (e) { return `（本店の店名を読めない: ${(e as Error).message}）`; } })(),
  大阪支店: 試験支店.店名,
};
export const 店の読み替え = (): string => `正本の店舗「東京本店」「大阪支店」は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店「${店名.東京本店}」（店舗ID 1）と「${店名.大阪支店}」に読み替えた`;

/** 東京本店・大阪支店の店舗ID（S-M04-01-ADM-ALL が画面で用意したもの。呼び名はシード表に無いので控えない） */
export const 店舗ID = { 東京本店: "", 大阪支店: "" };

defineSeed("S-M04-01-ADM-ALL", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const tokyo = 本店の店舗ID;
    const osaka = 試験支店の店舗ID();
    issue(店の読み替え());
    店舗ID.東京本店 = tokyo; 店舗ID.大阪支店 = osaka;
    await ensureMemberByStoreIds(page, {
      名前: ALL_NAME, ログインID: M0401_ALL.loginId, メールアドレス: `${M0401_ALL.loginId}@example.test`, パスワード: M0401_ALL.password,
      権限: "システム管理者", 所属店舗ID: tokyo, デフォルト検索表示店舗ID: tokyo, 編集可能店舗ID: [tokyo, osaka],
    });
  });
  // ログインでき（ロックされていない）、在庫検索一覧を開けること
  await withAdminSession(browser, M0401_ALL, async (page) => {
    await new StockSearchPatternPage(page).open();
  });
});

/** 在庫検索一覧の「検索条件保存」で検索パターンを保存し、移った先のアドレスの末尾の検索パターンIDを返す */
async function savePattern(p: StockSearchPatternPage, name: string, what: string): Promise<string> {
  await p.showPatternArea();
  await p.patternName.fill(name);
  await p.clickSave();
  const m = /\/product\/stock\/pattern\/(\d+)$/.exec(p.page.url());
  if (!m) throw new Error(`${what}: 検索条件保存のあと、検索パターンの画面へ移らない（${p.page.url()}）`);
  const msg = await p.messages();
  if (msg.error.length) throw new Error(`${what}: 保存のあとにエラーが出た: ${msg.error.join(" / ")}`);
  if (!msg.success.length) throw new Error(`${what}: 保存のあとに成功のメッセージが出ない`);
  return m[1];
}

defineSeed("S-M04-01-PATTERN-018", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M0401_ALL, async (page) => {
    const p = new StockSearchPatternPage(page);
    await p.open();
    await p.stockZone("EC-CUBE").check();
    notes.set("〔検索パターンID-M0401-018〕", await savePattern(p, "既存検索条件-018", "S-M04-01-PATTERN-018"));
  });
});

defineSeed("S-M04-01-PATTERN-022", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M0401_ALL, async (page) => {
    const p = new StockSearchPatternPage(page);
    await p.open();
    await p.form.locator("#admin_search_stock_list_product_name").fill("削除試験");
    notes.set("〔検索パターンID-M0401-022〕", await savePattern(p, "削除対象条件-022", "S-M04-01-PATTERN-022"));
  });
});

/** 保存された検索パターン一覧に名前が無いことを確かめる。あれば選んで検索条件削除を押し、無くなったことを確かめる */
function defineAbsent(seedId: string, name: string): void {
  defineSeed(seedId, { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser }) => {
    await withAdminSession(browser, M0401_ALL, async (page) => {
      const p = new StockSearchPatternPage(page);
      await p.open();
      await p.showPatternArea();
      const n = (await p.savedPatternNames()).filter((x) => x === name).length;
      if (n > 1) throw new Error(`${seedId}: 保存された検索パターン一覧に ${shortName(name)} が ${n} 件ある`);
      if (n === 1) {
        await p.choosePattern(name);
        await p.clickDelete();
        const msg = await p.messages();
        if (msg.error.length) throw new Error(`${seedId}: 検索条件削除でエラーが出た: ${msg.error.join(" / ")}`);
        reportSeedIssue(seedId, `保存された検索パターン一覧に ${shortName(name)} があったので、選んで検索条件削除を押した`);
        await p.open();
        await p.showPatternArea();
      }
      expect((await p.savedPatternNames()).filter((x) => x === name), `${seedId}: 保存された検索パターン一覧に ${shortName(name)} が無い`).toEqual([]);
    });
  });
}

defineAbsent("S-M04-01-ABSENT-019", "検".repeat(255));
defineAbsent("S-M04-01-ABSENT-020", "検".repeat(256));
