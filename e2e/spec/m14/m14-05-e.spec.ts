/**
 * M14-05 カード登録CSVアップロードの続き。正本: cases/M14-05_test_cases.tsv のうち IT-M14-05-073
 * 補い: カード名・商品名・検索語は正本の値に実行の印を付けた値で読んだ。カード更新用ファイルのカード詳細IDは、シードで画面が振った番号で書いた（seeds/m14-05-e.ts）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { カード名でカード, カードの詳細 } from "../../db/m14_05_card_csv";
import { CardCsvUploadPage, CSV本文, 雛形の見出し, 送信の結果 } from "../../pages/admin/m14_05_csv";
import { 該当件数, 一覧の商品ID } from "../../pages/admin/m03_04_x";
import { ProductSearchPage } from "../../pages/admin/product_search";
import "../../seeds/m14-05";
import { M1405_RJ_ADMIN, RJ名 } from "../../seeds/m14-05-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M14-05-073", async ({ page, notes, step, expected }) => {
  const 商品ID = notes.get("〔商品ID-M1405-RJ001〕");
  // カード詳細IDはシード表が控えると定めていないので、シードで取り込んだカード（カード名(英)は実行の印つき）から引く
  const カード = カード名でカード(RJ名.英名());
  if (カード.length !== 1) throw new Error(`シードで取り込んだカードが ${カード.length} 件（1件のはず）`);
  const 詳細ID = カードの詳細(カード[0].カードID)[0].詳細ID;
  const 新名 = RJ名.新名();
  note(`カード名は正本の値に実行の印を付けた値で検索・入力した（RJ1405-001-新名 → ${新名}）。カード更新用ファイルのカード詳細IDは、シードで画面が振った番号（${詳細ID}）で書いた`);
  const s = new ProductSearchPage(page);
  const u = new CardCsvUploadPage(page);
  let 見出し: string[] = [];
  const 更新用 = () => ({
    name: "update-rj1405-001.csv",
    buffer: CSV本文(見出し, [{
      name_jp: 新名, name_en: RJ名.英名(), set: "Aether Revolt", rarity: "Uncommon", layout: "Normal", promotion_type: "Non Promotion", foil: "0",
      image_en: "img/m1405/rj-001-en.jpg", card_detail_id: 詳細ID, cmc: "1", frame: "Normal",
    }]),
  });
  const カード名で商品を検索 = async (): Promise<void> => { await s.open(); await s.ensureDetailVisible(); await s.field("card_name").fill(新名); await s.submitAndWaitForResult(); };
  let 前の件数 = -1; let r: 送信の結果 | undefined;
  await step(1, async () => {
    await loginAdmin(page, M1405_RJ_ADMIN);
    // カード更新用ファイルの見出しは、取込画面の雛形（35項目）から取る
    見出し = await 雛形の見出し(page);
  });
  await step(2, async () => { await カード名で商品を検索(); });
  await step(3, async () => { 前の件数 = await 該当件数(page); expect(前の件数, "取込前、カード名「新名」で該当する商品が無い").toBe(0); });
  await step(4, async () => { await u.open(); });
  await step(5, async () => {
    r = await u.選んで押す(更新用());
    note(`取込の結果のメッセージ: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」 警告「${r.警告.join(" / ")}」`);
  });
  await step(6, async () => { await カード名で商品を検索(); });
  await expected(async () => {
    expect.soft(r?.エラー ?? [], "取込のエラー表示（なし）").toEqual([]);
    await expect.soft(page.getByText(/検索結果：\d+件が該当しました/).first(), "検索結果の件数の文（1件が該当）").toContainText("検索結果：1件が該当しました");
    await expect.soft(page.locator('#form_bulk input[name="ids[]"]'), `商品マスター(検索結果)に表示された商品（商品ID ${商品ID} だけ）`).toHaveValue(商品ID);
    expect.soft(await 一覧の商品ID(page), "検索結果の商品ID").toEqual([商品ID]);
  });
});
