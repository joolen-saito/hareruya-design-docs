/**
 * M04-08 在庫移動・振替検索一覧。正本: cases/M04-08_test_cases.tsv
 *
 * 画面の作り（pages/admin/m04_09_move.ts の MoveTransferList）のうち、手順の読み方にかかわるもの:
 * - 一覧は、開いたときに初期の条件で検索した結果を出す（在庫移動・振替IDの降順。設計書 L0078）。正本の「一覧画面で ID … を選択する」は、
 *   開いた一覧の行の選択欄にチェックを入れること。行が一覧に出ていないときは、その手順を実行できない（検索を補わない）。
 * - バーコード印刷用CSV出力・在庫移動振替CSV出力・戻しリストCSV出力は、ファイルのダウンロードになる。戻しリストPDF出力は、別のウィンドウに
 *   表示する作り（ダウンロードにはならない）。ダウンロードは、ブラウザのダウンロードの発生で確かめる。
 */
import fs from "node:fs";
import { expect, Page, test } from "@playwright/test";
import * as dbm from "../../db/m04_09_move";
import { caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { collectDialogs, MoveTransferList, printWindowFacts, topMessages } from "../../pages/admin/m04_09_move";
import "../../seeds/m04-08";
import { M0409_OP } from "../../seeds/m04-09";

/** ログインし、1つの操作の待ちを3分までにする（テスト全体の制限時間まで待ち続けない） */
async function login(page: Page, account: Account): Promise<void> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, account);
}

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 一覧の行の選択欄にチェックを入れる（行が一覧に出ていなければ、その手順は実行できない） */
async function selectRows(list: MoveTransferList, ids: string[]): Promise<void> {
  const shown = await list.listedIds();
  note(`一覧に出ている行（上から）: ${shown.join("・")}`);
  for (const id of ids) {
    if (!shown.includes(id)) throw new Error(`在庫移動・振替ID ${id} の行が一覧に出ていない（開いた一覧の初期の結果に無い）ので選択できない`);
    await list.check(id).check();
  }
}

/** 押した操作で起きたダウンロードとポップアップの文を集める */
async function watch(page: Page, action: () => Promise<void>, waitMs = 15_000): Promise<{ downloads: string[]; dialogs: string[]; popups: string[]; windows: Page[] }> {
  const downloads: string[] = [];
  const popups: string[] = [];
  const windows: Page[] = [];
  const onDownload = (d: { suggestedFilename: () => string }) => { downloads.push(d.suggestedFilename()); };
  const onPage = (p: Page) => { popups.push(p.url()); windows.push(p); };
  page.on("download", onDownload);
  page.context().on("page", onPage);
  const dialogs = collectDialogs(page);
  try {
    await action();
    await page.waitForTimeout(waitMs);
    await page.waitForLoadState("load");
  } finally {
    page.off("download", onDownload);
    page.context().off("page", onPage);
    dialogs.stop();
  }
  return { downloads, dialogs: dialogs.messages, popups, windows };
}

async function openList(page: Page): Promise<MoveTransferList> {
  const list = new MoveTransferList(page);
  await list.open();
  return list;
}

caseTest("IT-M04-08-007", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  await step(1, async () => { await openList(page); });
  await step(2, async () => { await page.getByRole("button", { name: "在庫移動CSV登録", exact: true }).click(); });
  await expected(async () => {
    const modal = page.locator("#stockMoveCsvRegisterModal");
    await expect(modal, "在庫移動CSV登録モーダル").toBeVisible();
    await expect(modal.locator(".modal-title"), "モーダルの見出し").toHaveText("在庫移動CSV登録");
  });
});

caseTest("IT-M04-08-008", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  await step(1, async () => { await openList(page); });
  await step(2, async () => { await page.getByRole("button", { name: "在庫振替CSV登録", exact: true }).click(); });
  await expected(async () => {
    const modal = page.locator("#stockTransferCsvRegisterModal");
    await expect(modal, "在庫振替CSV登録モーダル").toBeVisible();
    await expect(modal.locator(".modal-title"), "モーダルの見出し").toHaveText("在庫振替CSV登録");
  });
});

caseTest("IT-M04-08-009", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動・振替ID-M0408-009A〕");
  const b = notes.get("〔在庫移動・振替ID-M0408-009B〕");
  let list: MoveTransferList | undefined;
  let url = "";
  await step(1, async () => {
    list = await openList(page);
    await selectRows(list, [a, b]);
  });
  await step(2, async () => {
    const r = await list!.pressCreateInstruction([a, b]);
    url = r.url;
    const m = await topMessages(page);
    note(`在庫移動指示作成の結果: 画面が移ったか ${r.moved}・${r.url}・ポップアップ「${r.dialogs.join(" / ") || "なし"}」・成功「${m.成功.join(" / ")}」・エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DBの在庫移動指示: ${JSON.stringify(dbm.在庫移動指示([a, b]))}`); });
  await expected(async () => {
    const got = dbm.在庫移動指示([a, b]);
    expect.soft(got.length, "在庫移動指示が1件").toBe(1);
    expect.soft(got[0]?.在庫移動振替ID, "2件を対象とする").toEqual([a, b].sort((x, y) => Number(x) - Number(y)));
    expect.soft(new URL(url).pathname, "在庫移動指示一覧画面へ移る").toMatch(/\/product\/stock\/move-instruction$/);
  });
});

caseTest("IT-M04-08-010", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = (x: string) => notes.get(`〔在庫移動・振替ID-M0408-010${x}〕`);
  const g = id("G");
  const beforeG = dbm.在庫移動指示([g]);
  const press = async (ids: string[]) => {
    const list = await openList(page);
    await selectRows(list, ids);
    const r = await list.pressCreateInstruction(ids);
    const m = await topMessages(page);
    note(`ID ${ids.join("・")} の在庫移動指示作成: 画面が移ったか ${r.moved}・${r.url}・ポップアップ「${r.dialogs.join(" / ") || "なし"}」・成功「${m.成功.join(" / ")}」・エラー「${m.エラー.join(" / ")}」`);
  };
  await step(1, async () => { await press([id("A")]); });
  await step(2, async () => { await press([id("B"), id("C")]); });
  await step(3, async () => { await press([id("D"), id("E")]); });
  await step(4, async () => { await press([id("F")]); });
  await step(5, async () => { await press([g]); });
  await step(6, async () => { note(`DBの在庫移動指示: ${JSON.stringify(dbm.在庫移動指示(["A", "B", "C", "D", "E", "F", "G"].map(id)))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫移動指示(["A", "B", "C", "D", "E", "F"].map(id)), "A〜F を含む在庫移動指示").toEqual([]);
    expect.soft(dbm.在庫移動指示([g]), "G の在庫移動指示は登録済みの1件のまま").toEqual(beforeG);
  });
});

caseTest("IT-M04-08-011", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動・振替ID-M0408-共有出力A〕");
  let list: MoveTransferList | undefined;
  let w: { downloads: string[]; dialogs: string[]; popups: string[] } | undefined;
  await step(1, async () => { list = await openList(page); await selectRows(list, [a]); });
  await step(2, async () => { w = await watch(page, () => page.locator("#stockMoveTransferBarcodeCsvExport").click()); note(`結果: ${JSON.stringify(w)}・エラー「${(await topMessages(page)).エラー.join(" / ")}」`); });
  await expected(async () => {
    expect(w!.downloads.length, "バーコード印刷用CSVが1件ダウンロードされる").toBe(1);
  });
});

caseTest("IT-M04-08-012", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動・振替ID-M0408-共有出力A〕");
  const b = notes.get("〔在庫移動・振替ID-M0408-共有出力B〕");
  let list: MoveTransferList | undefined;
  let file: { name: string; bytes: Buffer } | null = null;
  await step(1, async () => { list = await openList(page); await selectRows(list, [a, b]); });
  await step(2, async () => {
    const wait = page.waitForEvent("download", { timeout: 60_000 }).then(async (d) => ({ name: d.suggestedFilename(), bytes: fs.readFileSync((await d.path())!) })).catch(() => null);
    await page.locator("#stockMoveTransferCsvExport").click();
    file = await wait;
    note(`ダウンロード: ${file ? file.name : "なし"}`);
  });
  await expected(async () => {
    expect(file, "在庫移動振替CSVが1件ダウンロードされる").not.toBeNull();
    const rows = parseCsv(decodeCsvBytes(file!.bytes)).filter((r) => r.some((c) => c));
    note(`CSV: ${rows.map((r) => r.join(",")).join(" / ")}`);
    expect.soft(rows[0]?.[0], "見出しの先頭").toBe("在庫移動振替ID");
    const ids = new Set(rows.slice(1).map((r) => r[0]));
    expect.soft([...ids].sort(), "選択した2件を対象とする（在庫移動振替IDの列）").toEqual([a, b].sort());
  });
});

caseTest("IT-M04-08-013", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動・振替ID-M0408-共有出力A〕");
  let list: MoveTransferList | undefined;
  let csv: Awaited<ReturnType<typeof watch>> | undefined;
  let pdf: Awaited<ReturnType<typeof watch>> | undefined;
  await step(1, async () => { list = await openList(page); await selectRows(list, [a]); });
  await step(2, async () => { csv = await watch(page, () => page.locator("#stockMoveTransferReturnListCsvExport").click()); note(`戻しリストCSV出力: ${JSON.stringify(csv)}`); });
  await step(3, async () => {
    if (!(await list!.check(a).isChecked())) await list!.check(a).check();
    pdf = await watch(page, () => page.locator("#stockMoveTransferReturnListPdfExport").click());
    note(`戻しリストPDF出力: ${JSON.stringify({ ...pdf, windows: undefined })}`);
  });
  await expected(async () => {
    expect.soft(csv!.downloads.length, "ダウンロード一覧に戻しリストCSVが1件").toBe(1);
    // 裁定 E13（2026-10-23）: 戻しリストPDF出力で、戻しリストが印刷に最適化した状態の画面として別のウィンドウで1つ開く
    expect.soft(pdf!.windows.length, "戻しリストPDF出力で別のウィンドウが1つ開く").toBe(1);
    const win = pdf!.windows[0];
    if (win) {
      await win.waitForLoadState("load").catch(() => undefined);
      const v = await printWindowFacts(win);
      note(`開いたウィンドウ: ${win.url()}・タイトル「${v.title}」・文書の種類 ${v.contentType}・印刷のボタン「${v.printButton.join("・") || "なし"}」・印刷用のスタイル ${v.printRules ? "あり" : "なし"}・本文の先頭「${v.text.slice(0, 200)}」`);
      expect.soft(`${v.title} ${v.text}`, "開いた画面が戻しリスト").toContain("戻しリスト");
      expect.soft(v.contentType, "戻しリストが画面（PDFのファイルではない）として開く").toBe("text/html");
      expect.soft(v.printButton.length > 0 || v.printRules, "戻しリストの画面が印刷に最適化した状態（「印刷する」ボタンか印刷用のスタイル）").toBe(true);
    }
  });
});

caseTest("IT-M04-08-014", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const b = notes.get("〔在庫移動・振替ID-M0408-共有出力B〕");
  const c = notes.get("〔在庫移動・振替ID-M0408-共有出力C〕");
  const results: { 操作: string; downloads: string[]; dialogs: string[]; popups: string[]; エラー: string[] }[] = [];
  const run = async (操作: string, ids: string[], button: string) => {
    const list = await openList(page);
    await selectRows(list, ids);
    const w = await watch(page, () => page.locator(button).click());
    results.push({ 操作, ...w, エラー: (await topMessages(page)).エラー });
  };
  await step(1, async () => { await run("C のバーコード印刷用CSV出力", [c], "#stockMoveTransferBarcodeCsvExport"); });
  await step(2, async () => {
    await run("B の戻しリストCSV出力", [b], "#stockMoveTransferReturnListCsvExport");
    await run("B の戻しリストPDF出力", [b], "#stockMoveTransferReturnListPdfExport");
  });
  await expected(async () => {
    note(`結果: ${JSON.stringify(results)}`);
    // 押した操作が画面に届いたこと（ポップアップかエラーの表示が出たこと）を確かめてから、ダウンロードが無いことを見る
    for (const r of results) expect.soft(r.dialogs.length + r.エラー.length + r.popups.length, `${r.操作}: 押した結果（ポップアップかエラー）が出る`).toBeGreaterThan(0);
    expect(results.flatMap((r) => r.downloads), "3回の操作によるファイルが追加されない").toEqual([]);
  });
});
