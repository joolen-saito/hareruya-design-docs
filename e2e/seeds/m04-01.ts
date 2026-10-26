/**
 * M04-01 在庫検索/一覧の画面シード。正本: cases/M04-01_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（016・018〜022。検索条件保存の欄）が使うシードだけ。
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
import { Account, withAdminSession } from "../lib/session";
import { shortName, StockSearchPatternPage } from "../pages/admin/m04_01_search_pattern";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";

export const M0401_ALL: Account = { loginId: "m0401_all", password: "Passw0rd!M0401A" };
const ALL_NAME = "M04-01全店舗試験管理者";

const COMPANY = "株式会社晴れる屋";
const COMPANY_KANA = "カブシキガイシャハレルヤ";
const TOKYO: M0424StoreInput = {
  店名: "東京本店", 店名カナ: "トウキョウホンテン", 店名英語: "Tokyo Main Store", 支店URL: "m0401tokyo", 店名略称3文字: "Q1T", ショップ名略称: "東京本店",
  会社名: COMPANY, 会社名カナ: COMPANY_KANA, 郵便番号: "100-0005", 都道府県: "東京都", 住所1: "千代田区丸の内1-1-1", 住所2: "晴ビル10F", 電話番号: "03-0401-0001",
};
const OSAKA: M0424StoreInput = {
  店名: "大阪支店", 店名カナ: "オオサカシテン", 店名英語: "Osaka Branch", 支店URL: "m0401osaka", 店名略称3文字: "Q1O", ショップ名略称: "大阪支店",
  会社名: COMPANY, 会社名カナ: COMPANY_KANA, 郵便番号: "530-0001", 都道府県: "大阪府", 住所1: "大阪市北区梅田2-2-2", 住所2: "晴ビル11F", 電話番号: "06-0401-0002",
};

defineSeed("S-M04-01-ADM-ALL", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const tokyo = await ensureStore(page, TOKYO, issue);
    const osaka = await ensureStore(page, OSAKA, issue);
    await ensureMemberByStoreIds(page, {
      名前: ALL_NAME, ログインID: M0401_ALL.loginId, メールアドレス: "m0401_all@example.test", パスワード: M0401_ALL.password,
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
