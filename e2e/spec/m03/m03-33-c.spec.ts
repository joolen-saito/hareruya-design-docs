/**
 * M03-33 セール用高額商品価格変更CSV登録（その3）。正本: cases/M03-33_test_cases.tsv
 * 実装したのは、受け付けるファイル（024）・タグ・対象外（039・041・042・060・061）・アラート（055・056・057・066・069）。
 * 書かないもの: 007・008（1商品に規格2つ）・044（同じ商品コードの商品2件）・062〜065（ユニサーチの反映待ち）。
 * 取込ファイルは画面の雛形の見出し行の下に正本のデータ行を入れる（その他の列の補いは seeds/m03-33-c.ts の冒頭）。期待結果は正本どおり。
 */
import { Page, test } from "@playwright/test";
import { 商品規格の状態 } from "../../db/m03_32_high_price";
import { 商品のタグ } from "../../db/m03_13_x";
import { ファイル名の取込履歴 } from "../../db/m03_33_b";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { HighPriceCsvUploadPage } from "../../pages/admin/m03_32_high_price_csv";
import { M0333_ADMIN, m0333FilePath } from "../../seeds/m03-33";
import "../../seeds/m03-33-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const URL_BASE = "https://replace-dev.hareruyamtg.com:8443";
/** 取込がファイルの形で拒まれず受け付けられたこと（拒まれた理由がデータの中身であることを確かめる前提） */
const 受付済み = (msg: string, what: string) => expect.soft(msg, `${what}（列数・形式の誤りで拒まれていない。「CSVのフォーマットが一致しません」が出ない）`).not.toContain("CSVのフォーマットが一致しません");

async function open(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0333_ADMIN);
  const u = new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
  await u.open();
  return u;
}

/** ファイルを選んで「CSVファイルのアップロード」を押し、画面上部のメッセージを返す */
async function importFile(u: HighPriceCsvUploadPage, file: string): Promise<string> {
  await u.choose(m0333FilePath(file));
  expect(await u.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([file]);
  const r = await u.submit();
  if (!r.sent) note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）`);
  const m = await u.messages();
  const all = [...m.成功, ...m.警告, ...m.エラー].join(" / ");
  note(`押したあとの画面上部のメッセージ: 成功「${m.成功.join(" / ") || "なし"}」・警告「${m.警告.join(" / ") || "なし"}」・エラー「${m.エラー.join(" / ") || "なし"}」`);
  return all;
}

function stateOf(id: string): NonNullable<ReturnType<typeof 商品規格の状態>> {
  const s = 商品規格の状態(id);
  expect(s, `商品規格ID ${id} の商品規格`).not.toBeNull();
  return s!;
}

caseTest("IT-M03-33-024", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品規格ID-M0333-024〕");
  let u!: HighPriceCsvUploadPage;
  await step(1, async () => { u = await open(page); await importFile(u, "shift_jis-024.csv"); });
  let after!: ReturnType<typeof stateOf>;
  await step(2, async () => { after = stateOf(id); note(`取込後（DBの参照）: 販売価格 ${after.販売価格}・買取価格 ${after.買取価格}・セール ${after.セール}・帯URL ${after.帯URL ?? "なし"}`); });
  await expected(async () => {
    expect.soft(after.販売価格, "CSVの値で更新された販売価格").toBe("1200");
    expect.soft(after.買取価格, "CSVの値で更新された買取価格").toBe("700");
    expect.soft(after.セール, "セール").toBe(true);
    expect.soft(after.帯URL, "帯URL（日本語の「帯」を含む）").toBe(`${URL_BASE}/帯`);
  });
});

/** 取込で商品規格が更新されず、タグが取込前のタグID 1だけ残ること（039・060・061） */
function notUpdatedWithTag(n: string, file: string, 手順の数: number) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]): Promise<void> => {
    const classId = notes.get(`〔商品規格ID-M0333-${n}〕`);
    const productId = notes.get(`〔商品ID-M0333-${n}〕`);
    const before = stateOf(classId);
    note(`取込前（DBの参照）: 販売価格 ${before.販売価格}・買取価格 ${before.買取価格}・セール ${before.セール}・タグ ${商品のタグ(productId).join(",")}`);
    let u!: HighPriceCsvUploadPage;
    let msg = "";
    if (手順の数 === 2) await step(1, async () => { u = await open(page); msg = await importFile(u, file); });
    else { await step(1, async () => { u = await open(page); }); await step(2, async () => { msg = await importFile(u, file); }); }
    let after!: ReturnType<typeof stateOf>; let tags: string[] = [];
    await step(手順の数, async () => { after = stateOf(classId); tags = 商品のタグ(productId); note(`取込後（DBの参照）: 販売価格 ${after.販売価格}・買取価格 ${after.買取価格}・セール ${after.セール}・タグ ${tags.join(",")}`); });
    await expected(async () => {
      受付済み(msg, "取込が受け付けられている");
      expect.soft(after.販売価格, "販売価格が更新されない").toBe("1500");
      expect.soft(after.買取価格, "買取価格が更新されない").toBe("600");
      expect.soft(after.セール, "セールが無効のまま").toBe(false);
      expect.soft(after.全項目, "商品規格が更新されない（全項目が取込前と同じ）").toBe(before.全項目);
      expect.soft(tags, "商品タグは取込前のタグID 1だけ").toEqual(["1"]);
    });
  };
}
caseTest("IT-M03-33-039", notUpdatedWithTag("039", "unknown_tag-039.csv", 2));
caseTest("IT-M03-33-060", notUpdatedWithTag("060", "m0333-060-tag.csv", 3));
caseTest("IT-M03-33-061", notUpdatedWithTag("061", "m0333-061-tag.csv", 3));

caseTest("IT-M03-33-041", async ({ page, step, expected }) => {
  const file = "unknown_product-041.csv";
  const before = ファイル名の取込履歴(file).length;
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); msg = await importFile(u, file); });
  let after = -1;
  await step(2, async () => { after = ファイル名の取込履歴(file).length; note(`取込履歴（同名）の件数: 取込前 ${before}・取込後 ${after}`); });
  await expected(async () => {
    受付済み(msg, "取込が受け付けられている");
    expect.soft(after, "取込履歴が増えない").toBe(before);
  });
});

caseTest("IT-M03-33-042", async ({ page, notes, step, expected }) => {
  const classId = notes.get("〔商品規格ID-M0333-042〕");
  const before = stateOf(classId);
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); msg = await importFile(u, "no_high_price_code-042.csv"); });
  let after!: ReturnType<typeof stateOf>;
  await step(2, async () => { after = stateOf(classId); note(`取込後（DBの参照）: 販売価格 ${after.販売価格}・買取価格 ${after.買取価格}・セール ${after.セール}`); });
  await expected(async () => {
    受付済み(msg, "取込が受け付けられている");
    expect.soft(after.販売価格, "販売価格が更新されない").toBe("1500");
    expect.soft(after.買取価格, "買取価格が更新されない").toBe("600");
    expect.soft(after.セール, "セールが無効のまま").toBe(false);
    expect.soft(after.全項目, "高額商品コードを持たない商品規格が更新されない（全項目が取込前と同じ）").toBe(before.全項目);
  });
});

caseTest("IT-M03-33-055", async ({ page, step, expected }) => {
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { msg = await importFile(u, "m0333-055-on-off.csv"); });
  await expected(async () => {
    expect.soft(msg, "CSVの販売価格9999が反映されていない旨のアラート").toContain("セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。");
  });
});

caseTest("IT-M03-33-056", async ({ page, step, expected }) => {
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { msg = await importFile(u, "m0333-056-off-off.csv"); });
  await expected(async () => {
    expect.soft(msg, "通常商品の販売価格、買取価格は変更できない旨のアラート（通常商品）").toContain("通常商品");
    expect.soft(msg, "通常商品の販売価格、買取価格は変更できない旨のアラート（販売価格・買取価格）").toMatch(/販売価格.*買取価格|買取価格.*販売価格/);
    expect.soft(msg, "通常商品の販売価格、買取価格は変更できない旨のアラート（変更できない）").toContain("変更できない");
  });
});

caseTest("IT-M03-33-057", async ({ page, step, expected }) => {
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { msg = await importFile(u, "m0333-057-unknown.csv"); });
  await expected(async () => {
    受付済み(msg, "取込が受け付けられている");
    expect.soft(msg, "完了メッセージ「登録が完了しました。」が表示されない").not.toContain("登録が完了しました。");
  });
});

caseTest("IT-M03-33-066", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔商品規格ID-M0333-066-A〕"), b = notes.get("〔商品規格ID-M0333-066-B〕");
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { msg = await importFile(u, "m0333-066-mixed.csv"); });
  await step(3, async () => { note(`管理画面上部のアラート: ${msg}`); });
  let sa!: ReturnType<typeof stateOf>; let sb!: ReturnType<typeof stateOf>;
  await step(4, async () => { sa = stateOf(a); sb = stateOf(b); note(`取込後（DBの参照）A: ${sa.販売価格}/${sa.買取価格}/${sa.セール}・B: ${sb.販売価格}/${sb.買取価格}/${sb.セール}`); });
  await expected(async () => {
    expect.soft(sa.販売価格, "Aの販売価格（基準価格の2000）").toBe("2000");
    expect.soft(sa.買取価格, "Aの買取価格").toBe("700");
    expect.soft(sa.セール, "Aのセールフラグが無効").toBe(false);
    expect.soft(sb.販売価格, "Bの販売価格が2000のまま").toBe("2000");
    expect.soft(sb.買取価格, "Bの買取価格").toBe("700");
    expect.soft(sb.セール, "Bのセールフラグが無効のまま").toBe(false);
    expect.soft(msg, "2行目のアラート").toContain("2行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。");
    expect.soft(msg, "3行目のアラート").toContain("3行目: 通常商品のため、買取価格はCSVの値で更新しました。");
  });
});

caseTest("IT-M03-33-069", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品規格ID-M0333-069〕");
  let u!: HighPriceCsvUploadPage; let msg = "";
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { await importFile(u, "m0333-069-on-off.csv"); });
  await step(3, async () => { u = new HighPriceCsvUploadPage(page, "セール用高額商品価格変更"); await u.open(); msg = await importFile(u, "m0333-069-on-off.csv"); });
  await step(4, async () => { note(`2回目の取込後の管理画面上部のアラート: ${msg}`); });
  let s!: ReturnType<typeof stateOf>;
  await step(5, async () => { s = stateOf(id); note(`取込後（DBの参照）: 販売価格 ${s.販売価格}・買取価格 ${s.買取価格}・セール ${s.セール}`); });
  await expected(async () => {
    expect.soft(s.販売価格, "販売価格が1500のまま").toBe("1500");
    expect.soft(s.買取価格, "買取価格").toBe("650");
    expect.soft(s.セール, "セールフラグが無効のまま").toBe(false);
    expect.soft(msg, "2回目の取込後のアラート").toContain("2行目: 通常商品のため、買取価格はCSVの値で更新しました。");
  });
});
