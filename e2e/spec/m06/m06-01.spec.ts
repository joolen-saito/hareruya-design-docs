/**
 * M06-01 買取一覧(検索入力・検索結果)。正本: cases/M06-01_test_cases.tsv
 *
 * 画面だけで準備できる11件（001・025・057〜062・068・069・071）を実装した（記録 review/M06-01_progress_2026-11-01.md）。
 * 買取の査定申込日時・棚戻し済みフラグ・実在庫などをDBへ直接設定するシードを使うケースは実装しない。
 *
 * 決め打ちの識別の値（申込者名）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { Notes } from "../../lib/notes";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { M0601_ADMIN_A, M0601_ADMIN_ALL } from "../../seeds/m06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// 買取一覧(検索入力)画面の初期表示
caseTest("IT-M06-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await expected(async () => {
    await expect.soft(page.locator("#result_list_main"), "買取一覧が表示されない").toHaveCount(0);
    await expect.soft(list.該当件数の表示(), "該当件数が表示されない").toHaveCount(0);
    await expect.soft(list.表示件数の選択(), "表示件数の選択が表示されない").toHaveCount(0);
    await expect.soft(list.ダウンロードのボタン(), "ダウンロード操作が表示されない").toHaveCount(0);
    await expect.soft(list.ページング(), "ページングが表示されない").toHaveCount(0);
  });
  note("既定表示件数を50件に設定する事前準備は、管理画面に設定の項目が無く行えていない（アプリの既定値のまま）");
});

// 戻し未完了のみ表示
caseTest("IT-M06-01-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-025A〕");
  const b = notes.get("〔査定ID-M0601-025B〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.戻し未完了のみ表示(true);
    await list.日時を空にする();
    await list.検索する();
  });
  await expected(async () => {
    const rows = (await list.行()).map((r) => r.査定ID);
    expect.soft(rows, "棚戻し済みフラグが立っていない査定ID（一覧に表示される）").toContain(a);
    expect.soft(rows, "棚戻し済みの査定ID（一覧に表示されない）").not.toContain(b);
    expect.soft(rows, "一覧に表示された査定ID（棚戻し未完了の査定IDだけ）").toEqual([a]);
  });
  note("事前準備②（本ケース以外の買取情報を棚戻し済みにする）は、画面では行えない（開発用の買取データが約33万8千件あり、一括で棚戻し済みにする画面が無い）。行わずに流した");
});

function 検索して対象にする(list: OtcListPage, 店: string | null, 査定ID: string) {
  return async () => {
    if (店 !== null) await list.買取店舗を選ぶ(店);
    await list.査定IDを入れる(査定ID);
    await list.検索する();
  };
}

// 057: 入庫待ち・入庫済み以外（査定前）の戻しリストCSV
caseTest("IT-M06-01-057", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-057〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await 検索して対象にする(list, null, id)(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされない（入庫待ち・入庫済み以外の買取情報）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

// 058: 編集できない店舗Bの戻しリストCSV
caseTest("IT-M06-01-058", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-058〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await 検索して対象にする(list, "買取店舗B", id)(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされない（編集可能権限がない買取店舗B）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

// 059: 複数店舗の戻しリストCSV
caseTest("IT-M06-01-059", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-059A〕");
  const b = notes.get("〔査定ID-M0601-059B〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされない（複数店舗の買取情報）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

// 060: 入庫待ち・入庫済み以外（査定前）の戻しリストPDF
caseTest("IT-M06-01-060", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-060〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await 検索して対象にする(list, null, id)(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await expected(async () => {
    expect.soft(r!.popup, "戻しリストPDFが開かない（入庫待ち・入庫済み以外の買取情報）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

// 061: 編集できない店舗Bの戻しリストPDF
caseTest("IT-M06-01-061", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-061〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await 検索して対象にする(list, "買取店舗B", id)(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await expected(async () => {
    expect.soft(r!.popup, "戻しリストPDFが開かない（編集可能権限がない買取店舗B）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

// 062: 複数店舗の戻しリストPDF
caseTest("IT-M06-01-062", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-062A〕");
  const b = notes.get("〔査定ID-M0601-062B〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await expected(async () => {
    expect.soft(r!.popup, "戻しリストPDFが開かない（複数店舗の買取情報）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.上部のエラー().first(), "画面上部にエラーが表示される").toBeVisible();
  });
});

const ALPHA = "ABCDEFGHIJK";
const ids = (notes: Notes, no: string) => Array.from({ length: 11 }, (_, i) => notes.get(`〔査定ID-M0601-${no}${ALPHA[i]}〕`));

// 068: 昇順で2ページ目
caseTest("IT-M06-01-068", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const all = ids(notes, "068");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("M0601-068")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { await list.並び順を指定して開く(1, "asc"); });
  await step(5, async () => { await list.ページを押す(2); });
  await expected(async () => {
    const rows = (await list.行()).map((r) => r.査定ID);
    expect.soft(rows, "2ページ目に表示された査定ID（昇順で11件目だけ）").toEqual([all[10]]);
  });
  note("既定表示件数を50件に設定する事前準備は、管理画面に設定の項目が無く行えていない（アプリの既定値のまま）");
});

// 069: 昇順で50件表示
caseTest("IT-M06-01-069", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const all = ids(notes, "069");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("M0601-069")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { await list.並び順を指定して開く(1, "asc"); });
  await step(5, async () => { await list.表示件数を変える(50); });
  await expected(async () => {
    const rows = (await list.行()).map((r) => r.査定ID);
    expect.soft(rows, "1ページに昇順で表示された査定ID（Aから順に11件）").toEqual(all);
    await expect.soft(list.ページング(), "ページングが表示されない（1ページに収まる）").toHaveCount(0);
  });
  note("既定表示件数を50件に設定する事前準備は、管理画面に設定の項目が無く行えていない（アプリの既定値のまま）");
});

// 071: 該当件数
caseTest("IT-M06-01-071", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("M0601-071")); await list.日時を空にする(); await list.検索する(); });
  await expected(async () => {
    expect.soft(await list.該当件数(), "該当件数（検索に一致した3件）").toBe(3);
  });
});
