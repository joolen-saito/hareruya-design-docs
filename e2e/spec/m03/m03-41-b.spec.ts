/**
 * M03-41 カテゴリCSV登録の 11/20 に足したケース（060・062〜068。組合せの削除・更新）。正本: cases/M03-41_test_cases.tsv。
 * 記録 review/M03-41_progress_2026-11-11_dev.md。ほかのケースは spec/m03/m03-41.spec.ts（判定済みのケースの指紋を変えないよう、別のファイルにした）。
 * - どのケースも、正本が削除フラグの値を書くファイルを使う。カテゴリCSV登録画面の雛形の見出しに削除フラグの列が無いあいだは、
 *   シードがカテゴリを作らずに合否未判定（スキップ）で止める（020・030 と同じ。記録の裁定案1）。
 * - カテゴリの表に削除済みの印の列は無いので、行が無いことを削除済みとみなす（db/m03_41_category.ts）。
 * - 対象商品数は、カテゴリの表に件数の列が無いので、商品とカテゴリの結び付きの行の数で見る。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { カテゴリの保存内容, カテゴリの対象商品数, 親の下の名称のカテゴリ, 名称のカテゴリ } from "../../db/m03_41_category";
import { CategoryCsvUploadPage, describeUpload, UploadResult } from "../../pages/admin/m03_41_category_csv";
import { caseCsvFile, M0341_ADMIN } from "../../seeds/m03-41";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const show = (r: カテゴリの保存内容 | null) => (r ? JSON.stringify(r) : "行なし（削除済み）");

async function signIn(page: Page): Promise<CategoryCsvUploadPage> {
  await loginAdmin(page, M0341_ADMIN);
  return new CategoryCsvUploadPage(page);
}

async function uploadCase(csv: CategoryCsvUploadPage, name: string): Promise<UploadResult> {
  const file = caseCsvFile(name);
  await test.info().attach(`アップロードしたファイル ${name}`, { body: file.bytes, contentType: "text/csv" });
  note(`${name}（${file.文字コード}・改行${file.改行}）の内容: ${JSON.stringify(file.内容)}`);
  const r = await csv.upload(file);
  note(`${name} のアップロードの結果: ${describeUpload(r)}`);
  return r;
}

function readCategory(id: string): カテゴリの保存内容 | null {
  const r = カテゴリの保存内容(id);
  note(`DBのカテゴリID ${id}: ${show(r)}`);
  return r;
}

const 上部の文 = (r: UploadResult | null) => [...(r?.上部のエラー ?? []), ...(r?.上部の成功 ?? [])];

caseTest("IT-M03-41-060", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-060A〕");
  const b = notes.get("〔カテゴリID-M0341-060B〕");
  let r: UploadResult | null = null;
  let top: string[] = [];
  let afterA: カテゴリの保存内容 | null = null;
  let afterB: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "delete_child_top-M0341-CB060.csv"); });
  await step(3, async () => {
    top = 上部の文(r);
    note(`管理画面上部の表示: ${top.join(" / ") || "なし"}`);
    afterA = readCategory(a);
    afterB = readCategory(b);
  });
  await expected(async () => {
    expect.soft(top, "管理画面上部に「関連するデータがあるため「削除親M0341-CB060A」を削除できませんでした」が表示される")
      .toEqual(expect.arrayContaining([expect.stringContaining("関連するデータがあるため「削除親M0341-CB060A」を削除できませんでした")]));
    expect.soft(afterA ? "行がある" : "行なし（削除済み）", `最上位のカテゴリID ${a} が削除済みにならない`).toBe("行がある");
    expect.soft(afterB ? "行がある" : "行なし（削除済み）", `子カテゴリID ${b} も削除済みにならない`).toBe("行がある");
  });
});

caseTest("IT-M03-41-062", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const total = Number(notes.get("〔全レコード数-M0341-062〕"));
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "new_top-M0341-CB062.csv"); });
  await step(3, async () => {
    rows = 名称のカテゴリ("新規最上位M0341-CB062");
    note(`DBのカテゴリ名「新規最上位M0341-CB062」: ${rows.map((x) => show(x)).join(" / ") || "0件"}`);
  });
  await expected(async () => {
    expect(rows.length, "「新規最上位M0341-CB062」が1件追加される").toBe(1);
    expect.soft(rows[0].親カテゴリID ?? "", "最上位（親なし）").toBe("");
    expect.soft(rows[0].階層, "階層1（CSVの99ではない）").toBe("1");
    expect.soft(rows[0].表示順, `表示ランクは登録前の全レコード数 ${total} に1を足した値`).toBe(String(total + 1));
    expect.soft(カテゴリの対象商品数(rows[0].カテゴリID), "対象商品数0（CSVの999ではない）").toBe(0);
  });
});

caseTest("IT-M03-41-063", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔カテゴリID-M0341-063${x}〕`));
  const 件数 = Number(notes.get("〔対象商品数-M0341-063〕"));
  let afterA: カテゴリの保存内容 | null = null;
  let afterB: カテゴリの保存内容 | null = null;
  let afterC: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "update_top_child-M0341-CB063.csv"); });
  await step(3, async () => { afterA = readCategory(a); afterB = readCategory(b); afterC = readCategory(c); });
  await expected(async () => {
    expect.soft(afterA?.名称, `カテゴリID ${a} の名称が更新される`).toBe("更新後親M0341-CB063A");
    expect.soft(afterA?.階層, "階層1（CSVの99ではない）").toBe("1");
    expect.soft(afterA ? "行がある" : "行なし（削除済み）", `カテゴリID ${a} は削除済みにならない`).toBe("行がある");
    expect.soft(カテゴリの対象商品数(a), `対象商品数は控えた ${件数} のまま（CSVの999ではない）`).toBe(件数);
    expect.soft(afterB ? "行がある" : "行なし（削除済み）", `子カテゴリID ${b} は削除済みにならない`).toBe("行がある");
    expect.soft(afterC?.表示順, `後続のカテゴリID ${c} の表示ランクは7064のまま`).toBe("7064");
  });
});

caseTest("IT-M03-41-064", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const p = notes.get("〔カテゴリID-M0341-064P〕");
  const x = notes.get("〔カテゴリID-M0341-064X〕");
  let afterX: カテゴリの保存内容 | null = null;
  let afterP: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "delete_depth2_last-M0341-CB064.csv"); });
  await step(3, async () => { afterX = readCategory(x); afterP = readCategory(p); });
  await expected(async () => {
    expect.soft(afterX ? show(afterX) : null, `カテゴリID ${x} が削除済みになる`).toBeNull();
    expect.soft(afterP ? "行がある" : "行なし（削除済み）", `親のカテゴリID ${p} は削除済みにならない`).toBe("行がある");
  });
});

caseTest("IT-M03-41-065", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const d = notes.get("〔カテゴリID-M0341-065D〕");
  const e = notes.get("〔カテゴリID-M0341-065E〕");
  const beforeE = カテゴリの保存内容(e);
  note(`開始時のDB: 065E ${show(beforeE)}`);
  let afterD: カテゴリの保存内容 | null = null;
  let afterE: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "delete_top_follow-M0341-CB065.csv"); });
  await step(3, async () => { afterD = readCategory(d); afterE = readCategory(e); });
  await expected(async () => {
    expect.soft(beforeE?.表示順, "開始時の 065E の表示ランク（シード）").toBe("7066");
    expect.soft(afterD ? show(afterD) : null, `カテゴリID ${d} が削除済みになる`).toBeNull();
    expect.soft(afterE?.表示順, `後続のカテゴリID ${e} の表示ランクが7066から7065へ1つ繰り上がる`).toBe("7065");
  });
});

caseTest("IT-M03-41-066", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const h = notes.get("〔カテゴリID-M0341-066H〕");
  const total = Number(notes.get("〔全レコード数-M0341-066〕"));
  const parent = カテゴリの保存内容(h);
  note(`開始時のDB: 066H ${show(parent)}`);
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "new_depth3-M0341-CB066.csv"); });
  await step(3, async () => {
    rows = 親の下の名称のカテゴリ(h, "新規子M0341-CB066N");
    note(`DBの親カテゴリID ${h} の下の「新規子M0341-CB066N」: ${rows.map((x) => show(x)).join(" / ") || "0件"}`);
  });
  await expected(async () => {
    expect.soft(parent?.階層, "親に指定した 066H の階層（シード）").toBe("2");
    expect(rows.length, `親カテゴリID ${h} の下に「新規子M0341-CB066N」が1件追加される`).toBe(1);
    expect.soft(rows[0].階層, "階層は親の階層2に1を足した3（CSVの99ではない）").toBe("3");
    expect.soft(rows[0].表示順, `表示ランクは登録前の全レコード数 ${total} に1を足した値`).toBe(String(total + 1));
    expect.soft(カテゴリの対象商品数(rows[0].カテゴリID), "対象商品数0").toBe(0);
  });
});

caseTest("IT-M03-41-067", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const [p, x, y, z] = ["P", "X", "Y", "Z"].map((m) => notes.get(`〔カテゴリID-M0341-067${m}〕`));
  const 件数 = Number(notes.get("〔対象商品数-M0341-067〕"));
  let afterX: カテゴリの保存内容 | null = null;
  let afterY: カテゴリの保存内容 | null = null;
  let afterZ: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "update_depth2_child-M0341-CB067.csv"); });
  await step(3, async () => { afterX = readCategory(x); afterY = readCategory(y); afterZ = readCategory(z); });
  await expected(async () => {
    expect.soft(afterX?.名称, `カテゴリID ${x} の名称が更新される`).toBe("更新後対象M0341-CB067X");
    expect.soft(afterX?.親カテゴリID, `親カテゴリID ${p} の下のまま`).toBe(p);
    expect.soft(afterX?.階層, "階層は親の階層1に1を足した2（CSVの99ではない）").toBe("2");
    expect.soft(afterX ? "行がある" : "行なし（削除済み）", `カテゴリID ${x} は削除済みにならない`).toBe("行がある");
    expect.soft(カテゴリの対象商品数(x), `対象商品数は控えた ${件数} のまま`).toBe(件数);
    expect.soft(afterY ? "行がある" : "行なし（削除済み）", `子カテゴリID ${y} は削除済みにならない`).toBe("行がある");
    expect.soft(afterZ?.表示順, `後続のカテゴリID ${z} の表示ランクは3のまま`).toBe("3");
  });
});

caseTest("IT-M03-41-068", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-068A〕");
  const b = notes.get("〔カテゴリID-M0341-068B〕");
  const 件数 = Number(notes.get("〔対象商品数-M0341-068〕"));
  let afterA: カテゴリの保存内容 | null = null;
  let afterB: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "update_top_last-M0341-CB068.csv"); });
  await step(3, async () => { afterA = readCategory(a); afterB = readCategory(b); });
  await expected(async () => {
    expect.soft(afterA?.名称, `カテゴリID ${a} の名称が更新される`).toBe("更新後親M0341-CB068A");
    expect.soft(afterA?.階層, "階層1（CSVの99ではない）").toBe("1");
    expect.soft(afterA ? "行がある" : "行なし（削除済み）", `カテゴリID ${a} は削除済みにならない`).toBe("行がある");
    expect.soft(カテゴリの対象商品数(a), `対象商品数は控えた ${件数} のまま`).toBe(件数);
    expect.soft(afterB ? "行がある" : "行なし（削除済み）", `子カテゴリID ${b} は削除済みにならない`).toBe("行がある");
  });
});
