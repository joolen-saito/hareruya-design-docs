/**
 * M06-01 買取一覧(検索入力・検索結果)。正本: cases/M06-01_test_cases.tsv（spec/m06/m06-01.spec.ts の続き）
 *
 * シード表の投入方法に「DB」を含むケースのうち、次のものを実装した。
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で、
 * シードは seeds/m06-01-more.ts に作った。読み替えとDBへの書き込みは、シードの注記と、各ケースの手順の注記に残す。
 *
 * 実装しないケースと理由:
 * - 002: 既定表示件数（50件）の設定は共有の設定で、書き換えない
 * - 015・020・022・024: 共有の開発環境にある他の買取（約33万件）を削除・書き換えないと、「その買取だけが出る」前提を作れない
 * - 033: 12001件の大量データ
 * - 039: 削除済みのメンバーが履歴に残る状態は、外部キー制約のため作れない（メンバーは履歴に紐づくと削除できない）
 * - 045・082: 買取商品CSVの「部分キャンセルされた明細」の持ち方が、アプリの作り（明細に取消を表す列が無い）から決められない
 * - 047・049: カードの状態・言語・略称タグ・レアリティを持つ商品（共有のカードのマスタ）が要る
 * - 053・054・080・081: カード商品の棚番号・色・レアリティ（共有のマスタ）と、店舗の戻しリスト金額閾値（共有の設定）が要る
 *
 * 決め打ちの識別の値（申込者名・商品名）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { Download, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, csvRecords } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { Notes } from "../../lib/notes";
import { 姓を設定する, 棚戻し済みか } from "../../db/m06_01";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { M0601_ADMIN_A, M0601_ADMIN_ALL } from "../../seeds/m06-01";
import "../../seeds/m06-01-more";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type 押した結果 = Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>>;

const ALPHA = "ABCDEFGHIJK";
const 一覧のアドレス = /\/otcbuyorder(\/page\/\d+)?$/;
const 読む上限ページ = 3;

/** ダウンロードしたファイルの中身を、見出しつきの行にする（ダウンロードの完了を待つ） */
async function csvを読む(file: Download): Promise<Record<string, string>[]> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return csvRecords(decodeCsvBytes(Buffer.concat(chunks)));
}

/** 日時を空にして検索し、表示件数を最大にする（共有の環境には他の買取が多く、新しい順の先頭に出すため） */
async function 全期間で検索する(list: OtcListPage): Promise<void> {
  await list.日時を空にする();
  await list.検索する();
  await list.表示件数を最大にする();
}

const 検索対象の注記 = "一覧の表示件数は、共有の環境にある他の買取の中でも対象が見えるよう、検索のあとに最大にした";
const 在庫の注記 = "戻しリストの確かめに使う実在庫情報は、DBで実行の印つきの買取に足した（シードの注記）";

const 十一件 = (notes: Notes, no: string) => Array.from({ length: 11 }, (_, i) => notes.get(`〔査定ID-M0601-${no}${ALPHA[i]}〕`));

/** 査定IDだけで検索して結果を出す */
async function 査定IDで検索する(list: OtcListPage, id: string): Promise<void> {
  await list.査定IDを入れる(id);
  await list.日時を空にする();
  await list.検索する();
}

/** 戻しリストCSVを押し、ダウンロードの完了を待つ（棚戻し済みの更新は出力の終わりに行われる） */
async function 戻しリストCSVを出す(list: OtcListPage): Promise<押した結果> {
  const r = await list.ダウンロードを押す("戻しリストCSV");
  if (r.file) await r.file.path();
  return r;
}

// 003: デフォルト検索表示店舗（買取店舗A）の初期値
caseTest("IT-M06-01-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-003〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await expected(async () => {
    expect.soft(await list.買取店舗の選択を読む(), "検索条件に選択された買取店舗").toBe("買取店舗A");
    const rows = await list.行を順に読む(読む上限ページ, [id]);
    expect.soft(rows.map((r) => r.査定ID), "一覧に表示された買取店舗Aの査定ID").toContain(id);
    expect.soft(rows.filter((r) => r.買取店舗 !== "買取店舗A").map((r) => `${r.査定ID}（${r.買取店舗}）`), "買取店舗A以外の買取情報（表示されない）").toEqual([]);
  });
  note(検索対象の注記);
});

// 004: 全店（未選択）の初期値
caseTest("IT-M06-01-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-004A〕");
  const b = notes.get("〔査定ID-M0601-004B〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await expected(async () => {
    expect.soft(await list.買取店舗の選択を読む(), "検索条件の買取店舗（未選択）").toBe("");
    const rows = await list.行を順に読む(読む上限ページ, [a, b]);
    expect.soft(rows.find((r) => r.査定ID === a)?.買取店舗, "買取店舗Aの査定IDの買取店舗").toBe("買取店舗A");
    expect.soft(rows.find((r) => r.査定ID === b)?.買取店舗, "買取店舗Bの査定IDの買取店舗").toBe("買取店舗B");
  });
  note(検索対象の注記);
});

// 005: 直近に選んだ店舗ではなく、デフォルト検索表示店舗に戻る
caseTest("IT-M06-01-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.買取店舗を選ぶ("買取店舗B"); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.open(); });
  await expected(async () => {
    expect.soft(await list.買取店舗の選択を読む(), "検索条件の買取店舗（デフォルト検索表示店舗の買取店舗A。直近に選んだ買取店舗Bではない）").toBe("買取店舗A");
  });
});

// 006: 検索入力を開き直すと、保持されていた条件が破棄される
caseTest("IT-M06-01-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("境界ページ-006")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); await list.ページを押す(2); });
  await step(4, async () => { await list.open(); });
  await expected(async () => {
    expect.soft(await list.申込者名の入力を読む(), "保持されていた申込者名（破棄されて空）").toBe("");
    await expect.soft(page.locator("#result_list_main"), "買取一覧（表示されない）").toHaveCount(0);
    await expect.soft(list.該当件数の表示(), "該当件数（表示されない）").toHaveCount(0);
    await expect.soft(list.表示件数の選択(), "表示件数の選択（表示されない）").toHaveCount(0);
    await expect.soft(list.ページング(), "ページング（表示されない）").toHaveCount(0);
  });
  note("既定表示件数を50件に設定する事前準備は、共有の設定なので行わず、アプリの既定値のまま");
});

// 016: ステータス未選択では買取キャンセルが出ない
caseTest("IT-M06-01-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-016A〕");
  const b = notes.get("〔査定ID-M0601-016B〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.ステータスを選ぶ(""); await 全期間で検索する(list); });
  await expected(async () => {
    const rows = await list.行を順に読む(読む上限ページ, [b]);
    expect.soft(rows.map((r) => r.査定ID), "一覧に表示された査定前の査定ID").toContain(b);
    expect.soft(rows.map((r) => r.査定ID), "買取キャンセルの査定ID（表示されない）").not.toContain(a);
    expect.soft(rows.filter((r) => r.ステータス === "買取キャンセル").map((r) => r.査定ID), "買取キャンセルの買取情報（表示されない）").toEqual([]);
  });
  note(検索対象の注記);
});

// 017: 買取キャンセルを選ぶと出る
caseTest("IT-M06-01-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-017〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.ステータスを選ぶ("買取キャンセル"); await 全期間で検索する(list); });
  await expected(async () => {
    const rows = await list.行を順に読む(読む上限ページ, [id]);
    expect.soft(rows.find((r) => r.査定ID === id)?.ステータス, "買取キャンセルの査定IDのステータス（一覧に表示される）").toBe("買取キャンセル");
  });
  note(検索対象の注記);
});

// 019: 買取店舗Bを選ぶと買取店舗Bだけ
caseTest("IT-M06-01-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-019〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.買取店舗を選ぶ("買取店舗B"); await 全期間で検索する(list); });
  await expected(async () => {
    const rows = await list.行を順に読む(読む上限ページ, [id]);
    expect.soft(rows.map((r) => r.査定ID), "一覧に表示された買取店舗Bの査定ID").toContain(id);
    expect.soft(rows.filter((r) => r.買取店舗 !== "買取店舗B").map((r) => `${r.査定ID}（${r.買取店舗}）`), "買取店舗B以外の買取情報（表示されない）").toEqual([]);
  });
  note(検索対象の注記);
});

// 026: 該当なしの表示
caseTest("IT-M06-01-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.査定IDを入れる("M0601-NOT-FOUND"); await list.日時を空にする(); await list.検索する(false); });
  await expected(async () => {
    await expect.soft(page.getByText("検索条件に該当するデータがありませんでした。"), "空結果の表示").toBeVisible();
    await expect.soft(list.該当件数の表示(), "該当件数（表示されない）").toHaveCount(0);
    await expect.soft(list.表示件数の選択(), "表示件数（表示されない）").toHaveCount(0);
    await expect.soft(list.ダウンロードのボタン(), "ダウンロード操作（表示されない）").toHaveCount(0);
    await expect.soft(list.結果の表(), "一覧の行（表示されない）").toHaveCount(0);
    await expect.soft(list.ページング(), "ページング（表示されない）").toHaveCount(0);
  });
});

// 028: 並び順のパラメータが不正
caseTest("IT-M06-01-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-028〕");
  let status = 0;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { status = await list.並び順のキーを指定して開く(1, "INVALID", "asc"); });
  await expected(async () => {
    expect.soft(status, "不正な並び順を送ったあとの応答の状態（エラーにならない）").toBeLessThan(400);
    await expect.soft(page.locator("#result_list_main"), "買取一覧（表示されない）").toHaveCount(0);
    await expect.soft(list.該当件数の表示(), "該当件数（表示されない）").toHaveCount(0);
    expect.soft(await list.査定IDの入力を読む(), "保持されていた検索条件（破棄されて空）").toBe("");
  });
});

// 029: 並び順の指定（昇順）
caseTest("IT-M06-01-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const ids = Array.from({ length: 11 }, (_, i) => notes.get(`〔査定ID-M0601-029${ALPHA[i]}〕`));
  let 降順: string[] = [];
  await step(1, async () => {
    await list.open();
    await list.申込者名を入れる(rc("境界ページ"));
    await 全期間で検索する(list);
  });
  await step(2, async () => { 降順 = (await list.行()).map((r) => r.査定ID); });
  await step(3, async () => { await list.並び順を指定して開く(1, "asc"); });
  await expected(async () => {
    expect.soft(降順, "並び順を指定する前の一覧（Kから順）").toEqual([...ids].reverse());
    const rows = (await list.行()).map((r) => r.査定ID);
    expect.soft(rows, "並び順の指定どおり（Aから順の昇順）に並んだ一覧の11件").toEqual(ids);
  });
  note("既定表示件数を50件に設定する事前準備は共有の設定なので行わず、11件が1ページに出るよう検索のあとに表示件数を最大にした。申込者名は実行の印を付けた値");
});

// 030: 11件を10件表示にすると10件が1ページ目
caseTest("IT-M06-01-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const ids = 十一件(notes, "030");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("境界ページ-030")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); });
  await expected(async () => {
    expect.soft(await list.該当件数(), "該当件数（11件）").toBe(11);
    expect.soft((await list.行()).map((r) => r.査定ID), "1ページ目に表示された10件（新しい順）").toEqual(ids.slice(0, 10));
  });
});

// 031: 2ページ目に11件目
caseTest("IT-M06-01-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const ids = 十一件(notes, "031");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("境界ページ-031")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { await list.ページを押す(2); });
  await expected(async () => {
    expect.soft((await list.行()).map((r) => r.査定ID), "2ページ目に表示された11件目の査定ID").toEqual([ids[10]]);
  });
});

// 032: 50件表示に戻すと11件が1ページ
caseTest("IT-M06-01-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const ids = 十一件(notes, "032");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("境界ページ-032")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { await list.表示件数を変える(50); });
  await expected(async () => {
    expect.soft((await list.行()).map((r) => r.査定ID), "1ページに表示された11件（新しい順）").toEqual(ids);
    await expect.soft(list.ページング(), "ページング（表示されない。1ページに収まる）").toHaveCount(0);
  });
});

// 034: 2ページ目を開いたまま件数が減ると、1ページ目に戻る
caseTest("IT-M06-01-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const ids = 十一件(notes, "034");
  await step(1, async () => {
    await list.open();
    await list.申込者名を入れる(rc("境界ページ-034"));
    await list.日時を空にする();
    await list.検索する();
  });
  await step(2, async () => { await list.表示件数を変える(10); await list.ページを押す(2); });
  await step(3, async () => { 姓を設定する(ids[10], "検索対象外"); });
  await step(4, async () => { await page.reload({ waitUntil: "load" }); });
  await expected(async () => {
    expect.soft((await list.行()).map((r) => r.査定ID), "再読み込み後に表示された残る10件（1ページ目）").toEqual(ids.slice(0, 10));
  });
  note("手順3のDBでの姓の更新は、実行の印つきの買取にだけ書いた");
});

// 035: 一覧の査定ID・買取店舗・最終更新者・ステータス
caseTest("IT-M06-01-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-035〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 査定IDで検索する(list, id); });
  await expected(async () => {
    const r = (await list.行()).find((x) => x.査定ID === id);
    expect.soft(r?.査定ID, "一覧の査定ID").toBe(id);
    expect.soft(r?.買取店舗, "一覧の買取店舗").toBe("買取店舗A");
    expect.soft(r?.最終更新者, "一覧の最終更新者").toBe("M06-01試験管理者A");
    expect.soft(r?.ステータス, "一覧のステータス").toBe("査定前");
  });
  note("最終更新者A は、既存のメンバー「M06-01試験管理者A」に読み替えた");
});

// 036: 申込者名と買取金額の表示
caseTest("IT-M06-01-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-036〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 査定IDで検索する(list, id); });
  await expected(async () => {
    const r = (await list.行()).find((x) => x.査定ID === id);
    expect.soft(r?.申込者, "一覧の申込者（姓と名が空白区切り）").toBe("山田 太郎");
    expect.soft(r?.買取金額 ?? "", "一覧の買取金額（通貨記号が前置され、整数部が3桁区切り）").toMatch(/^[^\d\s.,]+\s?123,456$/);
    expect.soft(r?.買取金額 ?? "", "一覧の買取金額（小数部が表示されない）").not.toContain(".");
  });
  note("買取金額 123456.75 円は、金額の列が整数のため 123456 円で入れた（小数部が表示されないことを見るケース）。通貨記号は共有の設定のまま（書き換えない）");
});

// 037: 査定担当者は買取成立へ変更した最新の担当者
caseTest("IT-M06-01-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-037〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 査定IDで検索する(list, id); });
  await expected(async () => {
    const r = (await list.行()).find((x) => x.査定ID === id);
    expect.soft(r?.査定担当者, "査定担当者（買取成立へ変更した最新の担当者）").toBe("M06-01試験全店管理者");
  });
  note("成立担当者B-037 は既存のメンバー「M06-01試験全店管理者」、成立担当者A は「M06-01試験管理者A」に読み替えた（買取成立の履歴はAが2日前、全店管理者が最新）");
});

// 038: 買取成立の履歴が無ければ最終更新者
caseTest("IT-M06-01-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-038〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 査定IDで検索する(list, id); });
  await expected(async () => {
    const r = (await list.行()).find((x) => x.査定ID === id);
    expect.soft(r?.査定担当者, "査定担当者（最終更新者）").toBe("M06-01試験全店管理者");
  });
  note("最終更新者C-038 は既存のメンバー「M06-01試験全店管理者」に読み替えた");
});

// 040: 査定IDから買取詳細へ
caseTest("IT-M06-01-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-040〕");
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.詳細を開く(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取詳細）").toMatch(/\/otcbuyorder\/\d+$/);
    await expect.soft(page.getByText(id).first(), "買取詳細に表示された査定ID").toBeVisible();
  });
});

// 041: ダウンロードの項目
caseTest("IT-M06-01-041", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  let 項目: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await step(3, async () => { 項目 = await list.ダウンロードの項目を読む(); });
  await expected(async () => {
    expect.soft(項目, "選択できるダウンロードの項目").toEqual(["古物台帳入力用CSV", "買取商品一覧CSV", "戻しリストCSV", "戻しリストPDF"]);
    expect.soft(項目.filter((t) => /インポート|キャンセル/.test(t)), "選択できないダウンロードの項目（インポート用・買取商品（キャンセル）CSV）").toEqual([]);
  });
});

// 042: 古物台帳入力用CSVは選択した買取だけ
caseTest("IT-M06-01-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔査定ID-M0601-042${x}〕`));
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await step(5, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    expect.soft(records.map((x) => x["査定ID"]).sort(), "CSVのデータ行の査定ID（選択した2件だけ）").toEqual([a, b].sort());
    expect.soft(records.map((x) => x["査定ID"]), "チェックを付けていない査定ID（出力されない）").not.toContain(c);
  });
  note(`${検索対象の注記}。古物台帳に必要な本人確認の種類・住所3は、DBで実行の印つきの買取に設定した（シードの注記）`);
});

// 043: 住所3
caseTest("IT-M06-01-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-043〕");
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await step(4, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    expect.soft(records.find((x) => x["査定ID"] === id)?.["住所"] ?? "", "CSVの住所列（住所3「丸の内1-1」を含む）").toContain("丸の内1-1");
  });
});

// 044: 古物台帳入力用CSVの並び順
caseTest("IT-M06-01-044", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-044A〕");
  const b = notes.get("〔査定ID-M0601-044B〕");
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await step(3, async () => { await list.対象にする(b); await list.対象にする(a); });
  await step(4, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await step(5, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    expect.soft(records.map((x) => x["査定ID"]), "CSVのデータ行の査定ID（Aの次にB）").toEqual([a, b]);
  });
  note(検索対象の注記);
});

// 050: 戻しリストCSVで棚戻し済みになる
caseTest("IT-M06-01-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-050〕");
  let r: 押した結果 | undefined;
  let 済み = false;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await 戻しリストCSVを出す(list); });
  await step(4, async () => { 済み = 棚戻し済みか(id); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされる").not.toBeNull();
    expect.soft(済み, "棚戻し済みフラグ（棚戻し済みに更新される）").toBe(true);
  });
  note(在庫の注記);
});

// 051: 戻しリストPDFで棚戻し済みになる
caseTest("IT-M06-01-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-051〕");
  let r: 押した結果 | undefined;
  let 済み = false;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await step(4, async () => { 済み = 棚戻し済みか(id); });
  await expected(async () => {
    expect.soft(r!.popup, "戻しリストPDFが開く").not.toBeNull();
    expect.soft(済み, "棚戻し済みフラグ（棚戻し済みに更新される）").toBe(true);
  });
  note(在庫の注記);
});

// 052: 戻しリストCSVは実在庫情報から出力される
caseTest("IT-M06-01-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-052〕");
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await 戻しリストCSVを出す(list); });
  await step(4, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    const 在庫 = records.find((x) => x["商品名"] === rc("実在庫商品-052"));
    expect.soft(在庫?.["数"], "実在庫情報の商品名「実在庫商品-052」の数量").toBe("2");
    expect.soft(records.some((x) => x["商品名"] === rc("明細商品-052")), "買取明細の商品名「明細商品-052」（出力されない）").toBe(false);
  });
  note(`${在庫の注記}。商品名は実行の印を付けた値`);
});

// 055: チェックなしでは買取商品一覧CSVが出ない
caseTest("IT-M06-01-055", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  let r: 押した結果 | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await 全期間で検索する(list); });
  await step(3, async () => { r = await list.ダウンロードを押す("買取商品一覧CSV"); });
  await expected(async () => {
    expect.soft(r!.file, "買取商品一覧CSVがダウンロードされない（買取情報にチェックを付けていない）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(一覧のアドレス);
  });
  note(検索対象の注記);
});

// 056: 存在しない内部IDでは戻しリストCSVが出ない
caseTest("IT-M06-01-056", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-056〕");
  let r: 押した結果 | undefined;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { await list.対象の値を差し替える(id, "999999"); });
  await step(4, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされない（存在しない内部ID）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(一覧のアドレス);
  });
});

// 063: 存在しない内部IDでは戻しリストPDFが開かない
caseTest("IT-M06-01-063", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-063〕");
  let r: 押した結果 | undefined;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { await list.対象の値を差し替える(id, "999999"); });
  await step(4, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await expected(async () => {
    expect.soft(r!.popup, "戻しリストPDFが開かない（存在しない内部ID）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(一覧のアドレス);
  });
});

// 065: PDF用データの取得に失敗するとポップアップが閉じる
caseTest("IT-M06-01-065", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-065〕");
  let r: Awaited<ReturnType<OtcListPage["戻しリストPDFを押して閉じるのを待つ"]>> | undefined;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { await list.戻しリストPDFの要求を遮断する(); });
  await step(4, async () => { r = await list.戻しリストPDFを押して閉じるのを待つ(); });
  await expected(async () => {
    expect.soft(r!.開いた && r!.閉じた, "開いたポップアップが閉じる").toBe(true);
    expect.soft(new URL(r!.アドレス).pathname, "留まった画面（買取一覧）").toMatch(一覧のアドレス);
  });
  note(在庫の注記);
});

// 072: 入庫済みでも棚戻し済みになる
caseTest("IT-M06-01-072", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-072〕");
  let r: 押した結果 | undefined;
  let 済み = false;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await 戻しリストCSVを出す(list); });
  await step(4, async () => { 済み = 棚戻し済みか(id); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされる").not.toBeNull();
    expect.soft(済み, "入庫済みの買取の棚戻し済みフラグ（棚戻し済みに更新される）").toBe(true);
  });
  note(在庫の注記);
});

// 073: 戻しリストを出してもステータスは変わらない
caseTest("IT-M06-01-073", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-073〕");
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { await 戻しリストCSVを出す(list); });
  await step(4, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await expected(async () => {
    expect.soft((await list.行()).find((x) => x.査定ID === id)?.ステータス, "検索し直した査定IDのステータス（入庫待ちのまま）").toBe("入庫待ち");
  });
  note(在庫の注記);
});

// 074: 戻し未完了のみ表示を付けなければ、棚戻し済みも出る
caseTest("IT-M06-01-074", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-074A〕");
  const b = notes.get("〔査定ID-M0601-074B〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.申込者名を入れる(rc("買取試験M0601-074"));
    await list.戻し未完了のみ表示(false);
    await list.日時を空にする();
    await list.検索する();
  });
  await expected(async () => {
    expect.soft((await list.行()).map((r) => r.査定ID).sort(), "一覧に表示された棚戻し未完了と棚戻し済みの2件").toEqual([a, b].sort());
  });
  note("申込者名は実行の印を付けた値。棚戻し済みの設定は、DBで実行の印つきの買取に書いた（シードの注記）");
});

// 075: 買取商品一覧CSVに選択した2件の商品が出る
caseTest("IT-M06-01-075", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-075A〕");
  const b = notes.get("〔査定ID-M0601-075B〕");
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("買取試験M0601-075")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await list.ダウンロードを押す("買取商品一覧CSV"); });
  await step(5, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    const 名 = records.map((x) => x["商品名"]);
    expect.soft(名, "CSVに出力された商品（商品M0601-075A）").toContain(rc("商品M0601-075A"));
    expect.soft(名, "CSVに出力された商品（商品M0601-075B）").toContain(rc("商品M0601-075B"));
  });
  note("申込者名・商品名は実行の印を付けた値。通常明細は、DBで実行の印つきの買取に足した（シードの注記）");
});

// 076: 複数選択の戻しリストCSVで2件とも棚戻し済み
caseTest("IT-M06-01-076", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-076A〕");
  const b = notes.get("〔査定ID-M0601-076B〕");
  let r: 押した結果 | undefined;
  let 済み: boolean[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("買取試験M0601-076")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await 戻しリストCSVを出す(list); });
  await step(5, async () => { 済み = [棚戻し済みか(a), 棚戻し済みか(b)]; });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされる").not.toBeNull();
    expect.soft(済み, "2件の棚戻し済みフラグ（ともに棚戻し済みに更新される）").toEqual([true, true]);
  });
  note(`申込者名は実行の印を付けた値。${在庫の注記}`);
});

// 077: 複数選択の戻しリストCSVに2件の実在庫が出る
caseTest("IT-M06-01-077", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-077A〕");
  const b = notes.get("〔査定ID-M0601-077B〕");
  let r: 押した結果 | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("買取試験M0601-077")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await 戻しリストCSVを出す(list); });
  await step(5, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    const 名 = records.map((x) => x["商品名"]);
    expect.soft(名, "戻しリストCSVに出力された実在庫（在庫商品M0601-077A）").toContain(rc("在庫商品M0601-077A"));
    expect.soft(名, "戻しリストCSVに出力された実在庫（在庫商品M0601-077B）").toContain(rc("在庫商品M0601-077B"));
  });
  note(`申込者名・商品名は実行の印を付けた値。${在庫の注記}`);
});

// 078: 査定前が混ざると戻しリストCSVは出ず、入庫待ちも棚戻し済みにならない
caseTest("IT-M06-01-078", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-078A〕");
  const b = notes.get("〔査定ID-M0601-078B〕");
  let r: 押した結果 | undefined;
  let 済み = true;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.申込者名を入れる(rc("買取試験M0601-078")); await list.日時を空にする(); await list.検索する(); });
  await step(3, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(4, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await step(5, async () => { 済み = 棚戻し済みか(a); });
  await expected(async () => {
    expect.soft(r!.file, "戻しリストCSVがダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(一覧のアドレス);
    expect.soft(済み, "入庫待ちの査定IDの棚戻し済みフラグ（棚戻し未完了のまま）").toBe(false);
  });
  note(`申込者名は実行の印を付けた値。${在庫の注記}`);
});

// 079: 戻しリストCSVを2回出しても棚戻し済みのまま
caseTest("IT-M06-01-079", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_A);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-079〕");
  let r1: 押した結果 | undefined;
  let r2: 押した結果 | undefined;
  let 済み1 = false;
  let 済み2 = false;
  await step(1, async () => { await list.open(); await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r1 = await 戻しリストCSVを出す(list); });
  await step(4, async () => { 済み1 = 棚戻し済みか(id); });
  await step(5, async () => { await list.open(); await 査定IDで検索する(list, id); await list.対象にする(id); });
  await step(6, async () => { r2 = await 戻しリストCSVを出す(list); });
  await step(7, async () => { 済み2 = 棚戻し済みか(id); });
  await expected(async () => {
    expect.soft(r1!.file, "1回目の戻しリストCSVがダウンロードされる").not.toBeNull();
    expect.soft(済み1, "1回目のあとの棚戻し済みフラグ（棚戻し済み）").toBe(true);
    expect.soft(r2!.file, "2回目の戻しリストCSVもダウンロードされる").not.toBeNull();
    expect.soft(済み2, "2回目のあとの棚戻し済みフラグ（棚戻し済みのまま）").toBe(true);
  });
  note(在庫の注記);
});

