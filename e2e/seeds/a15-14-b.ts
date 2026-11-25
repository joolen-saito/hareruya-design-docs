/**
 * A15-14 メタゲーム情報参照の 018（アーキタイプの代表カード画像）のシード。正本: cases/A15-14_seed_data.tsv の S-A15-14-IMAGES-018
 * フォーマット・アーキタイプ・大会デッキの作り方は seeds/a15-14.ts と同じ（名前はシード表の値のまま・選択欄は番号で選ぶ）。
 *
 * 読み替え（エビデンスの「正本の外の補い」に出す。記録 review/A15-14_progress_2026-11-24_dev.md）:
 * - 代表カード画像URL「https://example.invalid/archetypes/A1514-018-1.jpg」などは、シード表は「画面で指定できないため DB へ直接設定」と書く。
 *   アーキタイプの代表カードは、カードの画像（カードマスタの行）を選ぶ作りで、その URL の画像の行が無いと DB でも指せない。
 *   そこで、画像URL(英語)がその URL のカードを、カードCSVアップロードで印つきの名前で登録し（全員が使うマスタは印付きで作ってよい・
 *   依頼者決定 2026-11-14）、アーキタイプ編集画面の代表カードの検索でそのカードを選んだ（DB には書かない）。
 *   カードセット・レアリティ・レイアウトは、カード一覧の既存の値（seeds/f09-06.ts と同じ部品）。カード詳細IDは空欄（自動採番）。
 * - 「複製で計2件」は、デッキ一覧の新規登録を同じ値で2回行った（seeds/a15-14.ts と同じ）。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { フォーマットのデッキの件数 } from "../db/a15_14";
import { アーキタイプの代表カード画像 } from "../db/a15_14_b";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { adminUrl, withAdminSession } from "../lib/session";
import { アーキタイプを登録する, デッキを登録する, フォーマットを登録する } from "../pages/admin/a15_14_metagame";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "../pages/admin/card_csv";
import { expectSaved } from "../pages/admin/common";
import { 開催日時 } from "./a15-14";

const 画像 = { "018A": "https://example.invalid/archetypes/A1514-018-1.jpg", "018B": "https://example.invalid/archetypes/A1514-018-2.jpg" } as const;

defineSeed("S-A15-14-IMAGES-018", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const fid = await フォーマットを登録する(page, { 名日: "結合試験A1514-018フォーマット", 名英: "Integration A1514-018 Format", 並び順: "9000", メタ日数: "7" }, issue);
    notes.set("〔フォーマット識別子-A1514-018〕", fid);
    const aid: Record<"018A" | "018B", string> = { "018A": "", "018B": "" };
    for (const [k, n] of [["018A", "1"], ["018B", "2"]] as const) {
      aid[k] = await アーキタイプを登録する(page, { 名日: `結合試験A1514-018アーキタイプ${n}`, 名英: `Integration A1514-018 Archetype ${n}`, フォーマット番号: fid }, issue);
      notes.set(`〔アーキタイプ識別子-A1514-${k}〕`, aid[k]);
    }
    // 代表カードにする画像つきのカード（印つきの名前）をカードCSVで登録する
    const 既存 = await readExistingCardValues(page);
    const headers = await downloadCardCsvTemplate(page);
    const カード名 = { "018A": rc("結合試験A1514-018代表カード1"), "018B": rc("結合試験A1514-018代表カード2") };
    const rows = (["018A", "018B"] as const).map((k) => ({
      name_jp: カード名[k], name_en: `${カード名[k]}EN`, cmc: "0", cardtype: "",
      set: 既存.set, rarity: 既存.rarity, layout: 既存.layout, promotion_type: "", foil: "0", image_en: 画像[k], card_detail_id: "",
    }));
    await uploadCardCsv(page, buildCardCsv(headers, rows), "a1514_018_cards.csv", `${seed.シードID}: カードCSVアップロード`, (w) => issue(`カードCSVの警告「${w}」`));
    for (const k of ["018A", "018B"] as const) {
      await page.goto(adminUrl(`/archetype/${aid[k]}/edit`));
      await page.waitForLoadState("load");
      await page.locator('[data-bs-target="#searchCardImageModal"]').click();
      const m = page.locator("#searchCardImageModal");
      await expect(m, "代表カード検索の画面").toBeVisible();
      await m.locator("#card_image_search_word").fill(カード名[k]);
      await m.locator("#card_image_exact_match").check();
      await m.locator("#btn_search_card_image").click();
      const b = m.locator(`button.select-card-image[data-name^="${カード名[k]}"]`);
      await expect(b.first(), `代表カード検索の結果に「${カード名[k]}」`).toBeVisible({ timeout: 60_000 });
      await b.first().click();
      await expect(m).toBeHidden();
      await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
      for (const w of await expectSaved(page, `アーキタイプ ${aid[k]} の代表カードの保存`)) issue(`アーキタイプ ${aid[k]} の警告「${w}」`);
      const url = アーキタイプの代表カード画像(aid[k]);
      if (url !== 画像[k]) throw new Error(`${seed.シードID}: アーキタイプ ${aid[k]} の代表カード画像が「${url}」（シード表は「${画像[k]}」）`);
    }
    for (const [k, 件数] of [["018A", 2], ["018B", 1]] as const) {
      for (let i = 1; i <= 件数; i++) {
        await デッキを登録する(page, { 種類: "event", 公開: true, フォーマット番号: fid, アーキタイプ番号: aid[k], 開催日時: 開催日時(0) }, `${seed.シードID} の大会デッキ（アーキタイプ ${k}・${i}/${件数}件目）`, issue);
      }
    }
    const have = フォーマットのデッキの件数(fid);
    if (have !== 3) throw new Error(`${seed.シードID}: フォーマット ${fid} のデッキが ${have} 件（登録したのは3件）`);
  });
  issue("代表カード画像URLは、その URL を画像URL(英語)に持つカードを印つきの名前でカードCSVアップロードで登録し、アーキタイプ編集画面の代表カードの検索で選んで設定した（シード表の「DBへ直接設定」の代わり。DB には書いていない）。カードセット・レアリティ・レイアウトはカード一覧の既存の値");
  issue("「複製で計2件」は、デッキ一覧の新規登録を同じ値で2回行った（できあがる大会デッキの値は同じ）。メタゲーム集計の一時保存結果は、新しく振られたフォーマット識別子なのでまだ無い");
});
