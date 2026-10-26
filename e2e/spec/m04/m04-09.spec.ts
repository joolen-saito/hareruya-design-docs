/**
 * M04-09 在庫移動・振替登録/編集。正本: cases/M04-09_test_cases.tsv
 *
 * 画面の作り（pages/admin/m04_09_move.ts）のうち、手順の読み方にかかわるもの:
 * - 「在庫移動初期登録画面を開く」は、在庫検索一覧で出庫元の店舗・在庫区分・商品コードで検索し、行を選んで「在庫移動登録」を押すこと
 *   （初期登録画面へは在庫検索一覧からしか移れない。設計書 L0053・L0256）。
 * - 「登録ボタンを押す」で確認モーダルが出ないとき（ブラウザの入力チェックが止めたとき）は、止めた項目を注記に残す。
 *   期待結果がDBで確かめられるもの（在庫移動が追加されない など）は、注記を残して続け、DBで確かめる（HANDOFF 2章）。
 * - 正本の手順・期待結果の文はコードに写さない（報告には正本の文が出る）。
 */
import fs from "node:fs";
import { Locator, Page, test } from "@playwright/test";
import * as dbm from "../../db/m04_09_move";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { Account, adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import {
  cancelModal, checkStockRows, chooseApprovalTarget, moveTransferListPath, inboundApprovalPath, InboundRequestPage, inboundRequestPath, moveCompletePath, MoveNewPage, moveInfo, moveNewPath, MoveTransferList, outboundApprovalPath, OutboundRequestPage,
  outboundRequestPath, pressApprove, transferApprovalPath, transferCompletePath, TransferNewPage, transferNewPath, pressReject, pressStockListAction, searchStock, setRejectReason, shownMoveId, stockListPath, topMessages, 在庫区分, 店, 店A, 店B,
  承認者名, 作業者名, 所属A, printWindowFacts,
} from "../../pages/admin/m04_09_move";
import { M0409_APP, M0409_NOAUTH, M0409_OP, M0409_RCV } from "../../seeds/m04-09";

/** ログインし、1つの操作の待ちを3分までにする（テスト全体の制限時間まで待ち続けない） */
async function login(page: Page, account: Account): Promise<void> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, account);
}

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** DBの日時（「2026-10-22 07:22:31.65+00」の形）を時刻の数にする。読めなければ NaN */
function dbTime(v: string | null | undefined): number {
  if (!v) return NaN;
  return Date.parse(v.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"));
}

/** 期待結果の「操作日時が保存される」: 操作の前の値から変わり、操作を挟んだ時刻（前後1分のゆとり）に入っていること */
function expectOperationTime(label: string, before: string | null | undefined, after: string | null | undefined, t0: number, t1: number): void {
  note(`${label}: 操作の前「${before ?? "なし"}」→ 後「${after ?? "なし"}」（操作 ${new Date(t0).toISOString()}〜${new Date(t1).toISOString()}）`);
  const t = dbTime(after);
  expect.soft(after !== before && t >= t0 - 60_000 && t <= t1 + 60_000, `${label}が操作の時刻で保存される（${after}）`).toBe(true);
}
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 在庫検索一覧で出庫元の行を選び「在庫移動登録」を押して、在庫移動初期登録画面を開く */
async function openMoveNew(page: Page, store: 店, zone: 在庫区分, codes: string[]): Promise<MoveNewPage> {
  await searchStock(page, store, zone, codes.length === 1 ? codes[0] : codes.map((c) => c).reduce((a, b) => commonOf(a, b)));
  await checkStockRows(page, codes, store, zone);
  const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
  if (!r.moved) throw new Error(`「在庫移動登録」を押しても在庫移動初期登録画面へ移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
  const form = new MoveNewPage(page);
  await form.ready();
  return form;
}

function commonOf(a: string, b: string): string {
  for (let len = Math.min(a.length, b.length); len >= 3; len--) {
    for (let i = 0; i + len <= a.length; i++) if (b.includes(a.slice(i, i + len))) return a.slice(i, i + len);
  }
  throw new Error(`${a} と ${b} に共通する部分が無い`);
}

/** 「登録」を押した結果を注記に残す */
async function pressRegister(form: MoveNewPage): Promise<boolean> {
  const r = await form.pressRegister();
  if (r.modal) return true;
  note(`「登録」を押しても確認モーダルが出なかった。ブラウザの入力チェックが止めた項目: ${r.invalid.join(" / ") || "なし"}`);
  return false;
}

// ---------------------------------------------------------------- 在庫移動の初期登録

caseTest("IT-M04-09-015", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M409-MOV-A-015";
  let form: MoveNewPage | undefined;
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    expect(r.moved, `在庫移動初期登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ")}）`).toBe(true);
    form = new MoveNewPage(page);
    await form.ready();
  });
  await expected(async () => {
    const info = await moveInfo(page);
    expect.soft(info["移動タイプ"], "移動タイプ").toBe("在庫移動");
    const text = clean(await form!.form.locator("#stockMoveTransferInfo").innerText());
    expect.soft(text, "出庫元店舗").toContain(`出庫元店舗 ${店A}`);
    expect.soft(text, "出庫元在庫区分").toContain("出庫元在庫区分 EC-CUBE");
    const cells = (await form!.row(code).locator("td").allInnerTexts()).map(clean);
    note(`明細の行: ${cells.join(" | ")}`);
    expect.soft(cells[0], "日本語商品名と商品コード").toBe(`移動商品A ${code}`);
    expect.soft(cells[1], "言語").toBe("日本語");
    expect.soft(cells[2], "状態").toBe("NM");
    expect.soft(cells[3], "Foil（なし）").toBe("-");
    expect.soft(cells[4], "基準価格").toBe("¥1,000");
    expect.soft(cells[5], "在庫数").toBe("10");
  });
});

/** 017・018・022・026: 登録できない入力で登録を押し、在庫移動が追加されないことをDBで確かめる */
function notRegisteredCase(code: string, fill: (form: MoveNewPage) => Promise<void>, opts: { confirm?: boolean } = {}): CaseBody {
  return async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  let form: MoveNewPage | undefined;
  let modal = false;
  let i = 1;
  await step(i++, async () => { form = await openMoveNew(page, 店A, "EC-CUBE", [code]); });
  await step(i++, async () => { await fill(form!); });
  await step(i++, async () => {
    modal = await pressRegister(form!);
    if (modal && !opts.confirm) throw new Error("確認モーダルが出た（画面の入力チェックは登録を止めていない）。正本の手順は確認モーダルの操作を書いていないので押していない。このままでは「追加されない・更新されない」を操作の結果として確かめられない");
  });
  if (opts.confirm) {
    await step(i++, async () => {
      if (!modal) { note("確認モーダルが出ていないので、確認モーダルの「登録」は押せない（期待結果はDBで確かめるので続ける）"); return; }
      await form!.confirmRegister();
      const m = await topMessages(page);
      note(`登録の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
  }
  await step(i++, async () => { note(`DBの在庫移動・振替（${code}）: ${dbm.商品の在庫移動振替(code).join("・") || "なし"}`); });
  await expected(async () => {
    expect(dbm.商品の在庫移動振替(code), `${code} に関する在庫移動`).toEqual([]);
  });
  };
}

caseTest("IT-M04-09-017", notRegisteredCase("M409-MOV-A-017", async (form) => {
  await form.chooseToStore("");
  await form.chooseToZone("");
  await form.quantity("M409-MOV-A-017").fill("1");
}, { confirm: true }));

caseTest("IT-M04-09-018", notRegisteredCase("M409-MOV-A-018", async (form) => {
  await form.chooseToStore(店B);
  await form.chooseToZone("EC-CUBE");
  await form.quantity("M409-MOV-A-018").fill("");
}));

caseTest("IT-M04-09-019", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const min = "M409-MOV-MIN-019";
  const max = "M409-MOV-MAX-019";
  let form: MoveNewPage | undefined;
  let id = "";
  await step(1, async () => { form = await openMoveNew(page, 店A, "EC-CUBE", [min, max]); });
  await step(2, async () => {
    await form!.chooseToStore(店B);
    await form!.chooseToZone("EC-CUBE");
  });
  await step(3, async () => {
    await form!.quantity(min).fill("1");
    await form!.quantity(max).fill("1000000");
  });
  await step(4, async () => {
    expect(await pressRegister(form!), "確認モーダルが出る").toBe(true);
    await form!.confirmRegister();
    id = /\/outbound_approval_request\/(\d+)/.exec(page.url())?.[1] ?? "";
    note(`登録の結果: ${page.url()}`);
  });
  await step(5, async () => { note(`DBの明細: ${JSON.stringify(id ? dbm.明細(id) : [])}`); });
  await expected(async () => {
    expect(id, "登録された在庫移動・振替ID").toMatch(/^\d+$/);
    const lines = dbm.明細(id);
    expect.soft(lines.find((l) => l.商品コード === min)?.移動点数, `${min} の移動点数`).toBe(1);
    expect.soft(lines.find((l) => l.商品コード === max)?.移動点数, `${max} の移動点数`).toBe(1000000);
  });
});

caseTest("IT-M04-09-021", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M409-MOV-A-021";
  let form: MoveNewPage | undefined;
  let id = "";
  await step(1, async () => { form = await openMoveNew(page, 店A, "EC-CUBE", [code]); });
  await step(2, async () => {
    await form!.chooseToStore(店B);
    await form!.chooseToZone("EC-CUBE");
    await form!.quantity(code).fill("1");
  });
  await step(3, async () => { await form!.memo.fill("A".repeat(65535)); });
  await step(4, async () => {
    expect(await pressRegister(form!), "確認モーダルが出る").toBe(true);
    await form!.confirmRegister();
    id = /\/outbound_approval_request\/(\d+)/.exec(page.url())?.[1] ?? "";
    const m = await topMessages(page);
    note(`登録の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(5, async () => { note(`DBのメモ: ${JSON.stringify(id ? dbm.長い文の形(id, "メモ") : null)}`); });
  await expected(async () => {
    expect(id, "登録された在庫移動・振替ID").toMatch(/^\d+$/);
    expect(dbm.長い文の形(id, "メモ"), "メモ（文字数・半角の A だけ）").toEqual({ 文字数: 65535, Aだけ: true });
  });
});

caseTest("IT-M04-09-022", async ({ page, step, expected }) => {
  const code = "M409-MOV-A-022";
  await login(page, M0409_OP);
  let form: MoveNewPage | undefined;
  let modal = false;
  await step(1, async () => { form = await openMoveNew(page, 店A, "EC-CUBE", [code]); });
  await step(2, async () => {
    await form!.chooseToStore(店B);
    await form!.chooseToZone("EC-CUBE");
    await form!.quantity(code).fill("1");
  });
  await step(3, async () => { await form!.memo.fill("A".repeat(65536)); });
  await step(4, async () => {
    modal = await pressRegister(form!);
    if (modal) {
      // 「登録ボタンを押す」の先は確認モーダル。正本の手順は確認モーダルの操作を書かないので、ここで止める（押さない）
      throw new Error("確認モーダルが出た（画面の入力チェックは登録を止めていない）。正本の手順は確認モーダルの操作を書いていないので押していない。このままでは「追加されない・更新されない」を操作の結果として確かめられない");
    }
  });
  await step(5, async () => { note(`DBの在庫移動・振替（${code}）: ${dbm.商品の在庫移動振替(code).join("・") || "なし"}`); });
  await expected(async () => {
    expect(dbm.商品の在庫移動振替(code), `${code} に関する在庫移動`).toEqual([]);
  });
});

caseTest("IT-M04-09-024", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M409-MOV-B-024";
  let form: MoveNewPage | undefined;
  await step(1, async () => {
    form = await openMoveNew(page, 店A, "EC-CUBE", [code]);
    await form.chooseToStore(店B);
    await form.chooseToZone("EC-CUBE");
    await form.quantity(code).fill("2");
    expect(await pressRegister(form), "確認モーダルが出る").toBe(true);
  });
  await step(2, async () => { await form!.confirmRegister(); });
  await expected(async () => {
    const id = /\/product\/stock\/move\/outbound_approval_request\/(\d+)$/.exec(new URL(page.url()).pathname)?.[1];
    expect(id, `移動ピック・出庫承認申請画面へ移る（${page.url()}）`).toBeTruthy();
    expect(outboundRequestPath(id!).test(new URL(page.url()).pathname)).toBe(true);
    await expect(page.locator("form#stock_move_outbound_approval_request_form"), "移動ピック・出庫承認申請画面").toBeVisible();
    expect(await shownMoveId(page), "画面に表示された在庫移動・振替ID（自動採番の番号）").toBe(id);
  });
});

caseTest("IT-M04-09-026", async ({ page, step, expected }) => {
  const code = "M409-MOV-A-026";
  await login(page, M0409_OP);
  let form: MoveNewPage | undefined;
  await step(1, async () => { form = await openMoveNew(page, 店A, "EC-CUBE", [code]); });
  await step(2, async () => {
    await form!.chooseToStore(店A);
    await form!.chooseToZone("EC-CUBE");
    await form!.quantity(code).fill("1");
  });
  await step(3, async () => {
    const modal = await pressRegister(form!);
    if (modal) {
      throw new Error("確認モーダルが出た（画面の入力チェックは登録を止めていない）。正本の手順は確認モーダルの操作を書いていないので押していない。このままでは「追加されない・更新されない」を操作の結果として確かめられない");
    }
  });
  await step(4, async () => { note(`DBの在庫移動・振替（${code}）: ${dbm.商品の在庫移動振替(code).join("・") || "なし"}`); });
  await expected(async () => {
    expect(dbm.商品の在庫移動振替(code), `${code} に関する在庫移動`).toEqual([]);
  });
});

caseTest("IT-M04-09-027", async ({ page, step, expected }) => {
  const code = "M409-MOV-A-027";
  await login(page, M0409_OP);
  let form: MoveNewPage | undefined;
  await step(1, async () => {
    form = await openMoveNew(page, 店A, "EC-CUBE", [code]);
    await form.chooseToStore(店B);
    await form.chooseToZone("EC-CUBE");
    await form.quantity(code).fill("3");
  });
  await step(2, async () => { expect(await pressRegister(form!), "確認モーダルが出る").toBe(true); });
  await step(3, async () => { await form!.cancelRegister(); });
  await step(4, async () => { note(`DBの在庫移動・振替（${code}）: ${dbm.商品の在庫移動振替(code).join("・") || "なし"}・在庫: ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.商品の在庫移動振替(code), `${code} に関する在庫移動`).toEqual([]);
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE")?.在庫, "出庫元在庫数").toBe(10);
  });
});

caseTest("IT-M04-09-028", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M409-MOV-A-028";
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    expect(r.moved, `在庫移動初期登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ")}）`).toBe(true);
    await new MoveNewPage(page).ready();
  });
  await step(3, async () => {
    const link = page.locator(".c-conversionArea a.c-baseLink");
    await expect(link, "「在庫一覧」のリンク").toHaveCount(1);
    await Promise.all([page.waitForURL(stockListPath, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "在庫検索一覧画面へ移る").toMatch(/\/product\/stock$/);
    const form = page.locator("form#searchStockListForm");
    const stores = await form.locator("#admin_search_stock_list_base_info").evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
    expect.soft(stores, "検索条件「店舗」").toEqual([店A]);
    const zones = await form.locator('input[name="admin_search_stock_list[stock_zone][]"]:checked').evaluateAll((is) => is.map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
    expect.soft(zones, "検索条件「在庫区分」").toEqual(["EC-CUBE"]);
    expect.soft(await form.locator("#admin_search_stock_list_product_code").inputValue(), "検索条件「商品コード」").toBe(code);
    const row = page.locator("table tbody tr").filter({ has: page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) });
    await expect.soft(row, `検索結果の ${code} の行`).toHaveCount(1);
    expect.soft(await row.locator('input[name="productStockIds[]"]').isChecked(), `${code} の選択状態`).toBe(true);
  });
});

// ---------------------------------------------------------------- 共通の部品（ピック・出庫承認申請 以降）

/** ダウンロードされたファイルを受け取る（押した操作がダウンロードを起こさなければ null） */
async function download(page: Page, action: () => Promise<void>, timeout = 60_000): Promise<{ name: string; bytes: Buffer } | null> {
  const wait = page.waitForEvent("download", { timeout }).then(async (d) => {
    const p = await d.path();
    return { name: d.suggestedFilename(), bytes: fs.readFileSync(p!) };
  }).catch(() => null);
  await action();
  return wait;
}

/** CSVの行（見出しを含む） */
function csvRows(bytes: Buffer): string[][] {
  return parseCsv(decodeCsvBytes(bytes)).filter((r) => r.some((c) => c !== ""));
}

/** 別のウィンドウ（ポップアップ）で開いた画面を受け取る */
async function popup(page: Page, action: () => Promise<void>): Promise<Page | null> {
  const wait = page.context().waitForEvent("page", { timeout: 60_000 }).catch(() => null);
  await action();
  const p = await wait;
  if (p) {
    p.setDefaultTimeout(60_000);
    await p.waitForLoadState("load").catch(() => undefined);
  }
  return p;
}

/**
 * 裁定 E13（2026-10-23）の「印刷に最適化した状態の画面として別のウィンドウで開く」。設計（在庫移動戻しリストPDF L0032・L0046・L0066）は、
 * 戻しリストをポップアップで表示し、ページ内で印刷に最適化した状態で表示し、「印刷する」ボタンで印刷ダイアログを出すとする。
 * 開いたウィンドウが PDF のファイルではなく画面（HTML）で、「印刷する」ボタンか印刷用のスタイル（@media print）を持つことで確かめる。
 */
async function expectPrintWindow(win: Page, what: string): Promise<void> {
  const v = await printWindowFacts(win);
  note(`${what}のウィンドウ: 文書の種類 ${v.contentType}・印刷のボタン「${v.printButton.join("・") || "なし"}」・印刷用のスタイル ${v.printRules ? "あり" : "なし"}`);
  expect.soft(v.contentType, `${what}が画面（PDFのファイルではない）として別のウィンドウで開く`).toBe("text/html");
  expect.soft(v.printButton.length > 0 || v.printRules, `${what}の画面が印刷に最適化した状態（「印刷する」ボタンか印刷用のスタイル）`).toBe(true);
}

/**
 * 153・157 の事前準備（裁定 E15・2026-10-23）: 在庫変動履歴が、シードの在庫編集の入庫で付いた入庫の履歴1件と、登録時の在庫移動(減算)1件の2件だけ。
 * シードの在庫編集は在庫変動区分「入庫/その他」で入庫する（pages/admin/m04_09_move.ts の registerStockIn）ので、その履歴の区分は「その他」。
 */
function expectSeedHistory(code: string, list: { 区分: string }[]): void {
  expect(list.map((h) => h.区分), `${code} の操作の前の在庫変動履歴（事前準備: シードの入庫の履歴1件と登録時の在庫移動(減算)1件）`).toEqual(["その他", "在庫移動(減算)"]);
}

/** 在庫移動・振替の「更新されない」を確かめるための、DBの状態の写し */
function snapshot(id: string, codes: { code: string; store: string; zone: 在庫区分 }[]): unknown {
  return {
    在庫移動振替: dbm.在庫移動振替(id),
    明細: dbm.明細(id),
    ステータス変更履歴: dbm.ステータス変更履歴(id),
    在庫: codes.map((c) => ({ ...c, 在庫: dbm.在庫(c.code, c.store, c.zone), 履歴件数: dbm.在庫変動履歴(c.code, c.store, c.zone).length })),
  };
}

/** 入力欄に値を入れる。読み取り専用で入れられないときは、その理由を返す（入れたら null） */
async function tryFill(input: Locator, value: string): Promise<string | null> {
  const ro = await input.evaluate((e) => (e as HTMLInputElement).readOnly || (e as HTMLInputElement).disabled);
  if (ro) return "入力欄が読み取り専用（または無効）で、値を入れられない";
  await input.fill(value);
  return null;
}

// ---------------------------------------------------------------- ピック・出庫承認申請

caseTest("IT-M04-09-031", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-031〕");
  const req = new OutboundRequestPage(page);
  let file: { name: string; bytes: Buffer } | null = null;
  await step(1, async () => { await req.open(id); await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible(); });
  await step(2, async () => {
    const link = page.locator("#stockMoveDetails a", { hasText: "CSV出力" });
    await expect(link, "「CSV出力」").toHaveCount(1);
    file = await download(page, () => link.click());
    expect(file, "CSVがダウンロードされる").not.toBeNull();
  });
  let rows: string[][] = [];
  await step(3, async () => { rows = csvRows(file!.bytes); note(`CSV（${file!.name}）: ${rows.map((r) => r.join(",")).join(" / ")}`); });
  await expected(async () => {
    expect.soft(rows[0], "見出し").toEqual(["商品コード", "商品名", "移動点数", "欠品点数"]);
    const body = rows.slice(1);
    expect.soft(body.length, "全明細（2行）").toBe(2);
    expect.soft(body.find((r) => r[0] === "M409-MOV-A-031"), "M409-MOV-A-031 の行").toEqual(["M409-MOV-A-031", "M409-MOV-A-031", "3", ""]);
    expect.soft(body.find((r) => r[0] === "M409-MOV-B-031"), "M409-MOV-B-031 の行").toEqual(["M409-MOV-B-031", "M409-MOV-B-031", "2", ""]);
  });
});

caseTest("IT-M04-09-033", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-033〕");
  const code = "M409-MOV-A-033";
  const req = new OutboundRequestPage(page);
  await step(1, async () => { await req.open(id); await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible(); });
  await step(2, async () => {
    const why = await tryFill(req.shortage(code), "1");
    if (why) throw new Error(`欠品点数に1を入れられない: ${why}（画面は「欠品登録」を押してから欠品点数の欄が入力できるようになる作り。設計書 L0303 は欠品点数を入力すると欠品登録ボタンが押せるようになると定める）`);
  });
  await step(3, async () => { await req.toggle(code).click(); });
  await step(4, async () => { await req.toggle(code).click(); });
  await expected(async () => {
    await expect.soft(req.shortage(code), "欠品点数が空").toHaveValue("");
    await expect.soft(req.toggle(code), "欠品登録ボタン").toHaveText(/^\s*欠品登録\s*$/);
    await expect.soft(req.toggle(code), "欠品登録ボタンが押せる").toBeEnabled();
  });
});

caseTest("IT-M04-09-034", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-034〕");
  const code = "M409-MOV-A-034";
  const req = new OutboundRequestPage(page);
  await req.open(id);
  await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible();
  const states: string[] = [];
  const tryValue = async (v: string) => {
    const why = await tryFill(req.shortage(code), v);
    if (why) throw new Error(`欠品点数に${v}を入れられない: ${why}（画面は「欠品登録」を押してから欠品点数の欄が入力できるようになる作り。設計書 L0303 は、移動点数より少ない正の整数を入力したときに欠品登録ボタンが押せるようになると定める）`);
    states.push(`${v}: ${clean(await req.toggle(code).innerText())}・${(await req.toggle(code).isEnabled()) ? "押せる" : "押せない"}`);
  };
  await step(1, async () => { await tryValue("0"); });
  await step(2, async () => { await tryValue("3"); });
  await step(3, async () => { await tryValue("4"); });
  await expected(async () => {
    note(`各入力のあとの欠品登録ボタン: ${states.join(" / ")}`);
    expect(states.every((s) => s.endsWith("押せない")), "各入力で欠品登録ボタンが押せない").toBe(true);
  });
});

caseTest("IT-M04-09-035", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-035〕");
  const req = new OutboundRequestPage(page);
  let before: unknown;
  await step(1, async () => { await req.open(id); await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible(); before = snapshot(id, []); });
  await step(2, async () => { await chooseApprovalTarget(page, "admin_stock_move_outbound_approval_request", "", []); });
  await step(3, async () => {
    await req.submit.click();
    const modal = page.locator("#stockMoveConfirmModalInterStore");
    const shown = await modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (shown) {
      throw new Error("確認モーダルが出た（画面の入力チェックは登録を止めていない）。正本の手順は確認モーダルの操作を書いていないので押していない。このままでは「追加されない・更新されない」を操作の結果として確かめられない");
    } else {
      const invalid = await req.form.evaluate((f) => Array.from((f as HTMLFormElement).querySelectorAll("select, input")).filter((e) => !(e as HTMLInputElement).validity.valid).map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
      note(`確認モーダルは出なかった。ブラウザの入力チェックが止めた項目: ${invalid.join(" / ") || "なし"}`);
    }
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, []), "ステータス・更新日・更新者・欠品点数・ステータス変更履歴").toEqual(before);
  });
});

caseTest("IT-M04-09-038", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-038〕");
  const code = "M409-MOV-A-038";
  const req = new OutboundRequestPage(page);
  const histBefore = dbm.在庫変動履歴(code, 店A, "スマレジ").length;
  const statusBefore = dbm.ステータス変更履歴(id).length;
  await step(1, async () => {
    await req.open(id);
    // 手順は「欠品点数1を仮登録する」とだけ書き、入れる順を決めていない。画面の作り（「欠品登録」→ 入れる →「仮登録」）で仮登録した。
    // 設計書 L0303 の順（入れると欠品登録ボタンが押せる）と画面が違うことは、033・034 の不合格で扱う
    await req.registerShortage(code, 1);
    note("欠品点数は「欠品登録」→ 1 を入れる →「仮登録」の順で仮登録した（手順は順を決めていない）");
  });
  await step(2, async () => {
    await expect(req.submit, "店舗内の移動のボタン").toBeVisible();
    note(`ボタンの表示: 「${clean(await req.submit.innerText())}」`);
    await req.submit.click();
    const modal = page.locator("#stockMoveConfirmModalSameStore");
    await expect(modal, "確認モーダル").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))} 明細 ${JSON.stringify(dbm.明細(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータスが入庫完了").toBe("入庫完了");
    const d = dbm.明細(id)[0];
    expect.soft(d.欠品点数, "欠品点数").toBe(1);
    expect.soft(t.更新者, "操作したユーザー").toBe(作業者名);
    expect.soft(dbm.在庫(code, 店A, "スマレジ"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 6, 総原価: 600 });
    expect.soft(dbm.在庫変動履歴(code, 店A, "スマレジ").length, "入庫先の在庫変動履歴が登録される").toBeGreaterThan(histBefore);
    expect.soft(dbm.ステータス変更履歴(id).length, "ステータス変更履歴が登録される").toBeGreaterThan(statusBefore);
  });
});

caseTest("IT-M04-09-039", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-039〕");
  const req = new OutboundRequestPage(page);
  let win: Page | null = null;
  await step(1, async () => { await req.open(id); await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible(); });
  await step(2, async () => {
    win = await popup(page, () => page.locator("#stockMovePickListPdfExport").click());
    expect(win, "別のウィンドウが開く").not.toBeNull();
  });
  let title = "";
  let heading = "";
  await step(3, async () => {
    await win!.waitForFunction(() => !document.body.innerText.includes("読み込み中"), undefined, { timeout: 60_000 }).catch(() => undefined);
    title = await win!.title();
    heading = clean(await win!.locator("h1, h2, h3, .title").first().innerText({ timeout: 5_000 }).catch(() => ""));
    note(`開いたウィンドウ: アドレス ${win!.url()}・タイトル「${title}」・見出し「${heading}」・PDFの表示か: ${win!.url().endsWith(".pdf") || (await win!.evaluate(() => document.contentType)) === "application/pdf"}`);
  });
  await expected(async () => {
    // 裁定 E13（2026-10-23）: ピック表が、印刷に最適化した状態の画面として別のウィンドウで開き、その画面のタイトルが「ピック表」
    await expectPrintWindow(win!, "ピック表");
    expect(title === "ピック表" || heading === "ピック表", "その画面のタイトルが「ピック表」").toBe(true);
  });
});

caseTest("IT-M04-09-040", async ({ page, notes, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const id = notes.get("〔在庫移動ID-M0409-040〕");
  const codes = ["M409-MOV-A-040", "M409-MOV-B-040"].map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
  const before = snapshot(id, codes);
  await step(1, async () => {
    await page.goto(adminUrl(`/product/stock/move/outbound_approval_request/${id}`));
    await page.waitForLoadState("load");
    note(`開いた結果: ${page.url()}`);
  });
  await step(2, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "在庫一覧画面へ移る").toMatch(/\/product\/stock$/);
    expect.soft(snapshot(id, codes), "ステータス・明細・在庫").toEqual(before);
  });
});

// ---------------------------------------------------------------- 移動出庫承認

caseTest("IT-M04-09-041", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-041〕");
  const codes = ["M409-MOV-A-041", "M409-MOV-B-041"].flatMap((code) => [{ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }, { code, store: 店B, zone: "EC-CUBE" as 在庫区分 }]);
  const before = snapshot(id, codes);
  await step(1, async () => {
    await page.goto(adminUrl(`/product/stock/move/outbound_approval/${id}`));
    await page.waitForLoadState("load");
    note(`開いた結果: ${page.url()}`);
  });
  await step(2, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(outboundRequestPath(id).test(new URL(page.url()).pathname), `移動ピック・出庫承認申請画面へ移る（${page.url()}）`).toBe(true);
    expect.soft(snapshot(id, codes), "ステータス・在庫").toEqual(before);
  });
});

caseTest("IT-M04-09-042", async ({ page, notes, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const id = notes.get("〔在庫移動ID-M0409-042〕");
  const codes = [{ code: "M409-MOV-A-042", store: 店A, zone: "EC-CUBE" as 在庫区分 }];
  const before = snapshot(id, codes);
  await step(1, async () => {
    await page.goto(adminUrl(`/product/stock/move/outbound_approval/${id}`));
    await page.waitForLoadState("load");
    expect(outboundApprovalPath(id).test(new URL(page.url()).pathname), `移動出庫承認画面が開く（${page.url()}）`).toBe(true);
  });
  await step(2, async () => {
    await pressApprove(page, "outbound_approval_approve_btn");
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(outboundApprovalPath(id).test(new URL(page.url()).pathname), `移動出庫承認画面に留まる（${page.url()}）`).toBe(true);
    expect.soft(snapshot(id, codes), "ステータス・承認日・承認者・在庫・履歴").toEqual(before);
  });
});

/** 出庫承認待ちの移動を、承認者が却下・承認する（043〜046・122・123・131・153・156・157・178・179） */
async function openOutboundApproval(page: Page, id: string): Promise<void> {
  await openViaList(page, id, outboundApprovalPath(id));
}

/** 在庫移動・振替検索一覧で在庫移動・振替IDを検索し、行のリンクから開く（正本の「…画面を開く」）。開いた画面が求める画面であること */
async function openViaList(page: Page, id: string, want: RegExp): Promise<void> {
  const list = new MoveTransferList(page);
  await list.searchById(id);
  await list.openFromRow(id);
  expect(want.test(new URL(page.url()).pathname), `在庫移動・振替検索一覧の行から開いた画面（${page.url()}）`).toBe(true);
}

caseTest("IT-M04-09-043", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-043〕");
  const codes = [{ code: "M409-MOV-A-043", store: 店A, zone: "EC-CUBE" as 在庫区分 }];
  const before = snapshot(id, codes);
  let modal = false;
  await step(1, async () => { await openOutboundApproval(page, id); });
  await step(2, async () => {
    await setRejectReason(page, "");
    await page.locator("#outbound_approval_reject_btn").click();
    modal = await page.locator("#rejectConfirmModal").waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (!modal) note(`確認モーダルは出なかった（ブラウザの入力チェック: ${await page.locator('textarea[name$="[rejected_memo]"]').evaluate((e) => (e as HTMLTextAreaElement).validationMessage)}）`);
  });
  await step(3, async () => {
    if (!modal) { note("確認モーダルが出ていないので、「却下する」は押せない（期待結果はDBで確かめるので続ける）"); return; }
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#reject_confirm_submit_btn").click()]);
    const m = await topMessages(page);
    note(`結果: ${page.url()} エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, codes), "ステータス・在庫・総原価・ステータス変更履歴").toEqual(before);
  });
});

caseTest("IT-M04-09-044", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-044〕");
  const code = "M409-MOV-A-044";
  const hist = dbm.在庫変動履歴(code, 店A, "EC-CUBE").length;
  const status = dbm.ステータス変更履歴(id).length;
  const updatedBefore = dbm.在庫移動振替(id)?.更新日;
  let t0 = 0;
  let t1 = 0;
  await step(1, async () => { await openOutboundApproval(page, id); });
  await step(2, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("出庫内容不一致"); });
  await step(3, async () => {
    t0 = Date.now();
    const r = await pressReject(page, "outbound_approval_reject_btn", null);
    t1 = Date.now();
    expect(r.modal, `確認モーダルが出る（${r.invalid.join(" / ")}）`).toBe(true);
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータス").toBe("却下");
    expect.soft(t.却下理由, "却下理由").toBe("出庫内容不一致");
    expect.soft(t.更新者, "操作したユーザー").toBe(承認者名);
    expectOperationTime("操作日時（更新日）", updatedBefore, t.更新日, t0, t1);
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE"), "出庫元の在庫数・仕入総原価").toEqual({ 在庫: 10, 総原価: 1000 });
    expect.soft(dbm.在庫変動履歴(code, 店A, "EC-CUBE").length, "在庫変動履歴が登録される").toBeGreaterThan(hist);
    expect.soft(dbm.ステータス変更履歴(id).length, "ステータス変更履歴が登録される").toBeGreaterThan(status);
    expect.soft(moveCompletePath(id).test(new URL(page.url()).pathname), `在庫移動完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-045", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-045〕");
  const status = dbm.ステータス変更履歴(id).length;
  const prev = dbm.在庫移動振替(id);
  let t0 = 0;
  let t1 = 0;
  await step(1, async () => { await openOutboundApproval(page, id); });
  await step(2, async () => {
    t0 = Date.now();
    await pressApprove(page, "outbound_approval_approve_btn");
    t1 = Date.now();
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}・履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータス").toBe("出庫承認済み");
    expect.soft(t.出庫承認者, "出庫承認者").toBe(承認者名);
    // 「承認操作時の出庫承認日」「更新情報」: 044・084 と同じく、操作の前の値から変わり、操作の時刻の前後1分に入ること（2026-10-23 に直した）
    expectOperationTime("承認操作時の出庫承認日", prev?.出庫承認日, t.出庫承認日, t0, t1);
    expectOperationTime("更新情報の更新日", prev?.更新日, t.更新日, t0, t1);
    expect.soft(t.更新者, "更新情報の更新者").toBe(承認者名);
    const h = dbm.ステータス変更履歴(id);
    expect.soft(h.length, "ステータス変更履歴が保存される").toBeGreaterThan(status);
    expect.soft(h[h.length - 1]?.ステータス, "最新のステータス変更履歴").toBe("出庫承認済み");
    expect.soft(moveCompletePath(id).test(new URL(page.url()).pathname), `在庫移動完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-046", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-046〕");
  const codes = [{ code: "M409-MOV-A-046", store: 店A, zone: "EC-CUBE" as 在庫区分 }];
  const before = snapshot(id, codes);
  await step(1, async () => {
    await openOutboundApproval(page, id);
    await page.locator("#outbound_approval_reject_btn").click();
    const shown = await page.locator("#rejectConfirmModal").waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (!shown) {
      note("却下理由が空のままでは「却下」で確認モーダルが出なかった（ブラウザの入力チェック）。確認モーダルのキャンセルは押せない（期待結果はDBで確かめるので続ける）");
      return;
    }
    await cancelModal(page, "rejectConfirmModal");
  });
  await step(2, async () => {
    await page.locator("#outbound_approval_approve_btn").click();
    await cancelModal(page, "approveConfirmModal");
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, codes), "ステータス・承認情報・在庫・総原価・履歴").toEqual(before);
  });
});

// ---------------------------------------------------------------- 移動入庫承認申請

const both = (codes: string[]) => codes.flatMap((code) => [{ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }, { code, store: 店B, zone: "EC-CUBE" as 在庫区分 }]);

caseTest("IT-M04-09-047", async ({ page, notes, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const id = notes.get("〔在庫移動ID-M0409-047〕");
  const codes = both(["M409-MOV-A-047", "M409-MOV-B-047"]);
  const before = snapshot(id, codes);
  await step(1, async () => {
    await page.goto(adminUrl(`/product/stock/move/inbound_approval_request/${id}`));
    await page.waitForLoadState("load");
    note(`開いた結果: ${page.url()}`);
  });
  await step(2, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "在庫一覧画面へ移る").toMatch(/\/product\/stock$/);
    expect.soft(snapshot(id, codes), "ステータス・差分情報・在庫").toEqual(before);
  });
});

caseTest("IT-M04-09-048", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-048〕");
  const req = new InboundRequestPage(page);
  let file: { name: string; bytes: Buffer } | null = null;
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); await expect(req.form, "移動入庫承認申請画面").toBeVisible(); });
  await step(2, async () => {
    const link = page.locator("#stockMoveDetails a", { hasText: "CSV出力" });
    await expect(link, "「CSV出力」").toHaveCount(1);
    file = await download(page, () => link.click());
    expect(file, "CSVがダウンロードされる").not.toBeNull();
  });
  let rows: string[][] = [];
  await step(3, async () => { rows = csvRows(file!.bytes); note(`CSV（${file!.name}）: ${rows.map((r) => r.join(",")).join(" / ")}`); });
  await expected(async () => {
    expect.soft(rows[0], "見出し").toEqual(["商品コード", "商品名", "実移動点数", "差分点数"]);
    const body = rows.slice(1);
    expect.soft(body.length, "全明細（2行）").toBe(2);
    expect.soft(body.find((r) => r[0] === "M409-MOV-A-048"), "M409-MOV-A-048 の行").toEqual(["M409-MOV-A-048", "M409-MOV-A-048", "3", ""]);
    expect.soft(body.find((r) => r[0] === "M409-MOV-B-048"), "M409-MOV-B-048 の行").toEqual(["M409-MOV-B-048", "M409-MOV-B-048", "2", ""]);
  });
});

caseTest("IT-M04-09-050", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-050〕");
  const code = "M409-MOV-A-050";
  const req = new InboundRequestPage(page);
  await openViaList(page, id, inboundRequestPath(id));
  await step(1, async () => {
    const why = await tryFill(req.diff(code), "1");
    if (why) throw new Error(`差分点数に1を入れられない: ${why}（画面は「差分登録」を押してから差分点数の欄が入力できるようになる作り。設計書 L0499 は入力された差分点数が整数の場合に差分登録ボタンが押せるようになると定める）`);
  });
  await step(2, async () => { await req.toggle(code).click(); });
  await step(3, async () => { await req.toggle(code).click(); });
  await expected(async () => {
    await expect.soft(req.diff(code), "差分点数が空").toHaveValue("");
    await expect.soft(req.toggle(code), "差分登録ボタン").toHaveText(/^\s*差分登録\s*$/);
    await expect.soft(req.toggle(code), "差分登録ボタンが押せる").toBeEnabled();
  });
});

caseTest("IT-M04-09-056", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-056〕");
  const req = new InboundRequestPage(page);
  const before = snapshot(id, []);
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); await expect(req.form, "移動入庫承認申請画面").toBeVisible(); });
  await step(2, async () => { await chooseApprovalTarget(page, "admin_stock_move_inbound_approval_request", "", []); });
  await step(3, async () => {
    await req.submit.click();
    const modal = page.locator("#stockMoveInboundConfirmModal");
    const shown = await modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (shown) throw new Error("確認モーダルが出た（画面の入力チェックは登録を止めていない）。正本の手順は確認モーダルの操作を書いていないので押していない。このままでは「追加されない・更新されない」を操作の結果として確かめられない");
    else {
      const invalid = await req.form.evaluate((f) => Array.from((f as HTMLFormElement).querySelectorAll("select, input")).filter((e) => !(e as HTMLInputElement).validity.valid).map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
      note(`確認モーダルは出なかった。ブラウザの入力チェックが止めた項目: ${invalid.join(" / ") || "なし"}`);
    }
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, []), "ステータス・差分情報・ステータス変更履歴").toEqual(before);
  });
});

caseTest("IT-M04-09-058", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-058〕");
  let win: Page | null = null;
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); });
  await step(2, async () => {
    const button = page.locator("#stockMoveReturnListPdfExport");
    await expect(button, "「戻しリストPDF出力」").toBeVisible();
    win = await popup(page, () => button.click());
  });
  await expected(async () => {
    expect(win, "別のウィンドウが開く").not.toBeNull();
    await win!.waitForFunction(() => !document.body.innerText.includes("読み込み中"), undefined, { timeout: 60_000 }).catch(() => undefined);
    const text = clean(await win!.locator("body").innerText());
    note(`開いたウィンドウ: ${win!.url()}・タイトル「${await win!.title()}」・本文の先頭「${text.slice(0, 200)}」`);
    expect.soft(`${await win!.title()} ${text}`, "戻しリストが表示される").toContain("戻しリスト");
    // 裁定 E13（2026-10-23）: 戻しリストが、印刷に最適化した状態の画面として別のウィンドウで開く
    await expectPrintWindow(win!, "戻しリスト");
  });
});

// ---------------------------------------------------------------- 移動入庫承認

/** 入庫承認画面の明細の行（上から: 商品コード・差分点数） */
async function inboundApprovalRows(page: Page): Promise<{ 商品コード: string; 差分点数: string }[]> {
  return page.locator("#stockMoveDetails tbody tr").evaluateAll((trs) => trs.filter((tr) => tr.querySelectorAll("td").length > 5).map((tr) => {
    const td = tr.querySelectorAll("td");
    return { 商品コード: (td[0].querySelector("small")?.textContent ?? "").trim(), 差分点数: (td[8]?.textContent ?? "").trim() };
  }));
}

caseTest("IT-M04-09-059", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-059〕");
  let rows: { 商品コード: string; 差分点数: string }[] = [];
  await step(1, async () => { await openViaList(page, id, inboundApprovalPath(id)); });
  await step(2, async () => { rows = await inboundApprovalRows(page); note(`商品一覧（上から）: ${rows.map((r) => `${r.商品コード}（差分 ${r.差分点数}）`).join(" / ")}`); });
  await expected(async () => {
    const a = rows.findIndex((r) => r.商品コード === "M409-MOV-A-059");
    const b = rows.findIndex((r) => r.商品コード === "M409-MOV-B-059");
    expect.soft(rows[a]?.差分点数, "M409-MOV-A-059 の差分点数").toBe("1");
    expect(a >= 0 && b >= 0 && a < b, "差分点数のある M409-MOV-A-059 が、差分点数のない明細より上").toBe(true);
  });
});

caseTest("IT-M04-09-060", async ({ page, notes, step, expected }) => {
  // 事前準備のログインは M04-09承認者（裁定 E14・2026-10-23。入庫承認申請はシードで M04-09入庫担当者 がした）
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-060〕");
  const status = dbm.ステータス変更履歴(id).length;
  const prev = dbm.在庫移動振替(id);
  let t0 = 0;
  let t1 = 0;
  await step(1, async () => {
    await openViaList(page, id, inboundApprovalPath(id));
    await page.locator("#inbound_approval_reconfirm_btn").click();
    await expect(page.locator("#reconfirmConfirmModal"), "入庫再確認の確認モーダル").toBeVisible();
  });
  await step(2, async () => {
    t0 = Date.now();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#reconfirm_confirm_submit_btn").click()]);
    t1 = Date.now();
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}・履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータス").toBe("移動中");
    expect.soft(t.更新者, "更新者").toBe(承認者名);
    expectOperationTime("操作日時（更新日）", prev?.更新日, t.更新日, t0, t1);
    const h = dbm.ステータス変更履歴(id);
    expect.soft(h.length, "ステータス変更履歴が保存される").toBeGreaterThan(status);
    // 「操作日時・M04-09承認者を持つ…ステータス変更履歴」: 新しい履歴の行のステータス・更新者・更新日も確かめる（2026-10-23 DBを戻したあとに直した。前は件数だけ）
    const last = h[h.length - 1];
    expect.soft(last?.ステータス, "最新のステータス変更履歴のステータス").toBe("移動中");
    expect.soft(last?.更新者, "最新のステータス変更履歴の更新者").toBe(承認者名);
    expectOperationTime("最新のステータス変更履歴の更新日", null, last?.更新日, t0, t1);
    expect.soft(inboundRequestPath(id).test(new URL(page.url()).pathname), `移動入庫承認申請画面へ移る（${page.url()}）`).toBe(true);
  });
});

/** 入庫承認画面で「承認」→「承認する」（061〜064・130・132・133・155） */
async function approveInbound(page: Page, id: string): Promise<void> {
  await openViaList(page, id, inboundApprovalPath(id));
  await pressApprove(page, "inbound_approval_approve_btn");
  const m = await topMessages(page);
  note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
}

caseTest("IT-M04-09-061", async ({ page, notes, step, expected }) => {
  // 事前準備のログインは M04-09承認者（裁定 E14・2026-10-23。入庫承認申請はシードで M04-09入庫担当者 がした）
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-061〕");
  const code = "M409-MOV-A-061";
  const hist = dbm.在庫変動履歴(code, 店B, "EC-CUBE").length;
  const status = dbm.ステータス変更履歴(id).length;
  await step(1, async () => {
    await openViaList(page, id, inboundApprovalPath(id));
    await page.locator("#inbound_approval_approve_btn").click();
    await expect(page.locator("#approveConfirmModal"), "承認の確認モーダル").toBeVisible();
  });
  let t0 = 0;
  let t1 = 0;
  await step(2, async () => {
    t0 = Date.now();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#approve_confirm_submit_btn").click()]);
    t1 = Date.now();
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}・履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータスが入庫完了").toBe("入庫完了");
    // 入庫承認日は、前は空でないことだけを見ていた。事前準備は「入庫承認情報なし」なので、操作の時刻で保存されることを確かめる（2026-10-23 DBを戻したあとに直した）
    expectOperationTime("入庫承認日", null, t.入庫承認日, t0, t1);
    expect.soft(t.入庫承認者, "入庫承認者").toBe(承認者名);
    const h = dbm.ステータス変更履歴(id);
    expect.soft(h.length, "ステータス変更履歴").toBeGreaterThan(status);
    expect.soft(h[h.length - 1]?.ステータス, "最新のステータス変更履歴").toBe("入庫完了");
    expect.soft(dbm.在庫(code, 店B, "EC-CUBE"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 8, 総原価: 800 });
    expect.soft(dbm.在庫変動履歴(code, 店B, "EC-CUBE").length, "在庫変動履歴が登録される").toBeGreaterThan(hist);
    expect.soft(moveCompletePath(id).test(new URL(page.url()).pathname), `在庫移動完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-062", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-062〕");
  const code = "M409-MOV-A-062";
  const histA = dbm.在庫変動履歴(code, 店A, "EC-CUBE").length;
  await step(1, async () => { await approveInbound(page, id); });
  await step(2, async () => { note(`DB: 入庫先 ${JSON.stringify(dbm.在庫(code, 店B, "EC-CUBE"))}・出庫元 ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫(code, 店B, "EC-CUBE"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 7, 総原価: 700 });
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE"), "出庫元の在庫数・仕入総原価").toEqual({ 在庫: 8, 総原価: 800 });
    const added = dbm.在庫変動履歴(code, 店A, "EC-CUBE").slice(histA);
    note(`出庫元に増えた在庫変動履歴: ${JSON.stringify(added)}`);
    expect.soft(added.map((h) => h.区分), "出庫元に在庫移動（差分加算）の履歴").toContain("在庫移動(差分加算)");
  });
});

caseTest("IT-M04-09-063", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-063〕");
  const code = "M409-MOV-A-063";
  const histA = dbm.在庫変動履歴(code, 店A, "EC-CUBE").length;
  await step(1, async () => { await approveInbound(page, id); });
  await step(2, async () => { note(`DB: 入庫先 ${JSON.stringify(dbm.在庫(code, 店B, "EC-CUBE"))}・出庫元 ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫(code, 店B, "EC-CUBE"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 4, 総原価: 500 });
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE"), "出庫元の在庫数・仕入総原価").toEqual({ 在庫: 8, 総原価: 1600 });
    const added = dbm.在庫変動履歴(code, 店A, "EC-CUBE").slice(histA);
    note(`出庫元に増えた在庫変動履歴: ${JSON.stringify(added)}`);
    expect.soft(added.map((h) => h.区分), "出庫元に在庫移動（差分減算）の履歴").toContain("在庫移動(差分減算)");
  });
});

caseTest("IT-M04-09-064", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-064〕");
  const code = "M409-MOV-A-064";
  await step(1, async () => { await approveInbound(page, id); });
  await step(2, async () => { note(`DB: 入庫先 ${JSON.stringify(dbm.在庫(code, 店B, "EC-CUBE"))}・出庫元 ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫(code, 店B, "EC-CUBE"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 4, 総原価: 300 });
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE"), "出庫元の在庫数・仕入総原価").toEqual({ 在庫: 0, 総原価: 0 });
  });
});

caseTest("IT-M04-09-065", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-065〕");
  const codes = both(["M409-MOV-A-065"]);
  const before = snapshot(id, codes);
  await step(1, async () => {
    await openViaList(page, id, inboundApprovalPath(id));
    await page.locator("#inbound_approval_reconfirm_btn").click();
    await cancelModal(page, "reconfirmConfirmModal");
  });
  await step(2, async () => {
    await page.locator("#inbound_approval_approve_btn").click();
    await cancelModal(page, "approveConfirmModal");
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, codes), "ステータス・承認情報・在庫・総原価・履歴").toEqual(before);
  });
});

// ---------------------------------------------------------------- 在庫移動完了

caseTest("IT-M04-09-066", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動ID-M0409-共有A〕");
  const b = notes.get("〔在庫移動ID-M0409-共有B〕");
  const seen: { id: string; url: string; ステータス: string; メモ: string; 編集できる欄: number }[] = [];
  const look = async (id: string) => {
    await openViaList(page, id, moveCompletePath(id));
    const info = await moveInfo(page);
    const memo = page.locator("#stockMoveMemo");
    seen.push({
      id, url: page.url(), ステータス: info["ステータス"] ?? "", メモ: clean(await memo.innerText()),
      編集できる欄: await memo.locator("textarea:not([readonly]):not([disabled]), input:not([readonly]):not([disabled]):not([type=hidden])").count(),
    });
  };
  await step(1, async () => { await look(a); });
  await step(2, async () => { await look(b); });
  await expected(async () => {
    note(`表示: ${JSON.stringify(seen)}`);
    expect.soft(seen[0]?.ステータス, `入庫完了の ${a} のステータス`).toBe("入庫完了");
    expect.soft(seen[1]?.ステータス, `却下の ${b} のステータス`).toBe("却下");
    expect.soft(seen.map((s) => s.編集できる欄), "在庫移動・振替メモを編集できない").toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------- 在庫振替

/** 在庫検索一覧で振替元の行を選び「在庫振替登録」を押して、在庫振替初期登録画面を開く */
async function openTransferNew(page: Page, codes: string[]): Promise<TransferNewPage> {
  await searchStock(page, 店A, "EC-CUBE", codes.length === 1 ? codes[0] : codes.reduce((a, b) => commonOf(a, b)));
  await checkStockRows(page, codes, 店A, "EC-CUBE");
  const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
  if (!r.moved) throw new Error(`「在庫振替登録」を押しても在庫振替初期登録画面へ移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
  const form = new TransferNewPage(page);
  await form.ready();
  return form;
}

caseTest("IT-M04-09-074", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const src = "M409-TR-A-074";
  let form: TransferNewPage | undefined;
  await step(1, async () => {
    form = await openTransferNew(page, [src]);
    await form.dest(src).fill("M409-TR-TO-A-074");
    await form.dest(src).blur();
    await form.qty(src).fill("1");
  });
  await step(2, async () => {
    await chooseApprovalTarget(page, "admin_stock_transfer_new", "", []);
    const r = await form!.pressRegister();
    const m = await topMessages(page);
    note(`「登録」の結果: 画面が移ったか ${r.moved}・入力チェックで止まった項目 ${r.invalid.join(" / ") || "なし"}・${page.url()} エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DBの在庫移動・振替（${src}）: ${dbm.商品の在庫移動振替(src).join("・") || "なし"}`); });
  await expected(async () => {
    expect(dbm.商品の在庫移動振替(src), `${src} に関する在庫振替`).toEqual([]);
  });
});

caseTest("IT-M04-09-078", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M409-TR-A-078";
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, `在庫振替初期登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ")}）`).toBe(true);
    await new TransferNewPage(page).ready();
  });
  await step(3, async () => {
    const link = page.locator(".c-conversionArea a.c-baseLink");
    await expect(link, "「在庫一覧」のリンク").toHaveCount(1);
    await Promise.all([page.waitForURL(stockListPath, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "在庫検索一覧画面へ移る").toMatch(/\/product\/stock$/);
    const form = page.locator("form#searchStockListForm");
    const stores = await form.locator("#admin_search_stock_list_base_info").evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
    expect.soft(stores, "検索条件「店舗」").toEqual([店A]);
    const zones = await form.locator('input[name="admin_search_stock_list[stock_zone][]"]:checked').evaluateAll((is) => is.map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
    expect.soft(zones, "検索条件「在庫区分」").toEqual(["EC-CUBE"]);
    expect.soft(await form.locator("#admin_search_stock_list_product_code").inputValue(), "検索条件「商品コード」").toBe(code);
    const row = page.locator("table tbody tr").filter({ has: page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) });
    await expect.soft(row, `検索結果の ${code} の行`).toHaveCount(1);
    expect.soft(await row.locator('input[name="productStockIds[]"]').isChecked(), `${code} の選択状態`).toBe(true);
  });
});

/** 在庫振替承認画面を開く（在庫移動・振替検索一覧の行から） */
async function openTransferApproval(page: Page, id: string): Promise<void> {
  await openViaList(page, id, transferApprovalPath(id));
}

/** 承認・却下できない利用者（080・081）: 1件目を承認し、2件目を却下理由を入れて却下する */
function transferRefusedCase(n: string, account: Account): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, account);
    const a = notes.get(`〔在庫振替ID-M0409-${n}A〕`);
    const b = notes.get(`〔在庫振替ID-M0409-${n}B〕`);
    const codes = [`M409-TR-A-${n}`, `M409-TR-TO-A-${n}`, `M409-TR-B-${n}`, `M409-TR-TO-B-${n}`].map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
    const before = { a: snapshot(a, codes), b: snapshot(b, []) };
    await step(1, async () => {
      await page.goto(adminUrl(`/product/stock/transfer/${a}/approval`));
      await page.waitForLoadState("load");
      expect(transferApprovalPath(a).test(new URL(page.url()).pathname), `在庫振替承認画面が開く（${page.url()}）`).toBe(true);
      await pressApprove(page, "transfer_approval_approve_btn");
      const m = await topMessages(page);
      note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(2, async () => {
      await page.goto(adminUrl(`/product/stock/transfer/${b}/approval`));
      await page.waitForLoadState("load");
      expect(transferApprovalPath(b).test(new URL(page.url()).pathname), `在庫振替承認画面が開く（${page.url()}）`).toBe(true);
      const r = await pressReject(page, "transfer_approval_reject_btn", "振替内容不一致");
      const m = await topMessages(page);
      note(`却下の結果: 確認モーダル ${r.modal}・${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(3, async () => { note(`DB: ${JSON.stringify([dbm.在庫移動振替(a), dbm.在庫移動振替(b)])}`); });
    await expected(async () => {
      expect.soft(snapshot(a, codes), `在庫振替 ${a}（ステータス・承認情報・却下理由・在庫・総原価・履歴）`).toEqual(before.a);
      expect.soft(snapshot(b, []), `在庫振替 ${b}（ステータス・承認情報・却下理由・履歴）`).toEqual(before.b);
    });
  };
}

caseTest("IT-M04-09-080", transferRefusedCase("080", M0409_NOAUTH));
caseTest("IT-M04-09-081", transferRefusedCase("081", M0409_OP));

caseTest("IT-M04-09-082", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-082〕");
  const codes = ["M409-TR-A-082", "M409-TR-TO-A-082"].map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
  const before = snapshot(id, codes);
  let modal = false;
  await step(1, async () => { await openTransferApproval(page, id); });
  await step(2, async () => {
    await setRejectReason(page, "");
    await page.locator("#transfer_approval_reject_btn").click();
    modal = await page.locator("#rejectConfirmModal").waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (!modal) note(`確認モーダルは出なかった（ブラウザの入力チェック: ${await page.locator('textarea[name$="[rejected_memo]"]').evaluate((e) => (e as HTMLTextAreaElement).validationMessage)}）`);
  });
  await step(3, async () => {
    if (!modal) { note("確認モーダルが出ていないので、「却下する」は押せない（期待結果はDBで確かめるので続ける）"); return; }
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#reject_confirm_submit_btn").click()]);
    const m = await topMessages(page);
    note(`結果: ${page.url()} エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, codes), "ステータス・却下理由・在庫・総原価・履歴").toEqual(before);
  });
});

caseTest("IT-M04-09-083", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-083〕");
  const dest = "M409-TR-TO-A-083";
  const hist = dbm.在庫変動履歴(dest, 店A, "EC-CUBE").length;
  const status = dbm.ステータス変更履歴(id).length;
  let t0 = 0;
  let t1 = 0;
  await step(1, async () => {
    await openTransferApproval(page, id);
    await page.locator("#transfer_approval_approve_btn").click();
    await expect(page.locator("#approveConfirmModal"), "承認の確認モーダル").toBeVisible();
  });
  await step(2, async () => {
    t0 = Date.now();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#approve_confirm_submit_btn").click()]);
    t1 = Date.now();
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータスが入庫完了").toBe("入庫完了");
    // 期待結果どおり、入庫承認日・入庫承認者の項目を見る（出庫承認の項目には読み替えない。出庫承認の項目の値は参考に注記へ残す）
    note(`入庫承認日 ${t.入庫承認日}・入庫承認者 ${t.入庫承認者}（参考: 出庫承認日 ${t.出庫承認日}・出庫承認者 ${t.出庫承認者}）`);
    const at = dbTime(t.入庫承認日);
    expect.soft(at >= t0 - 60_000 && at <= t1 + 60_000, `入庫承認日が承認の操作の時刻で保存される（${t.入庫承認日}）`).toBe(true);
    expect.soft(t.入庫承認者, "入庫承認者").toBe(承認者名);
    expect.soft(dbm.ステータス変更履歴(id).length, "ステータス変更履歴").toBeGreaterThan(status);
    expect.soft(dbm.在庫(dest, 店A, "EC-CUBE"), "振替先の在庫数・仕入総原価").toEqual({ 在庫: 7, 総原価: 900 });
    expect.soft(dbm.在庫変動履歴(dest, 店A, "EC-CUBE").length, "在庫変動履歴が登録される").toBeGreaterThan(hist);
    expect.soft(transferCompletePath(id).test(new URL(page.url()).pathname), `在庫振替完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-084", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-084〕");
  const src = "M409-TR-A-084";
  const hist = dbm.在庫変動履歴(src, 店A, "EC-CUBE").length;
  const status = dbm.ステータス変更履歴(id).length;
  const updatedBefore = dbm.在庫移動振替(id)?.更新日;
  let t0 = 0;
  let t1 = 0;
  await step(1, async () => {
    await openTransferApproval(page, id);
    await page.locator('textarea[name$="[rejected_memo]"]').fill("振替内容不一致");
  });
  await step(2, async () => {
    t0 = Date.now();
    const r = await pressReject(page, "transfer_approval_reject_btn", null);
    t1 = Date.now();
    expect(r.modal, `確認モーダルが出る（${r.invalid.join(" / ")}）`).toBe(true);
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    const t = dbm.在庫移動振替(id)!;
    expect.soft(t.ステータス, "ステータス").toBe("却下");
    expect.soft(t.却下理由, "却下理由").toBe("振替内容不一致");
    expect.soft(t.更新者, "操作したユーザー").toBe(承認者名);
    expectOperationTime("操作日時（更新日）", updatedBefore, t.更新日, t0, t1);
    expect.soft(dbm.ステータス変更履歴(id).length, "ステータス変更履歴").toBeGreaterThan(status);
    expect.soft(dbm.在庫(src, 店A, "EC-CUBE"), "振替元の在庫数・仕入総原価").toEqual({ 在庫: 10, 総原価: 1000 });
    expect.soft(dbm.在庫変動履歴(src, 店A, "EC-CUBE").length, "在庫変動履歴が登録される").toBeGreaterThan(hist);
    expect.soft(transferCompletePath(id).test(new URL(page.url()).pathname), `在庫振替完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-085", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const a = notes.get("〔在庫振替ID-M0409-085A〕");
  const b = notes.get("〔在庫振替ID-M0409-085B〕");
  const codes = ["M409-TR-A-085", "M409-TR-TO-A-085", "M409-TR-B-085", "M409-TR-TO-B-085"].map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
  const before = { a: snapshot(a, codes), b: snapshot(b, []) };
  await step(1, async () => {
    await openTransferApproval(page, a);
    await page.locator("#transfer_approval_approve_btn").click();
    await cancelModal(page, "approveConfirmModal");
  });
  await step(2, async () => {
    await openTransferApproval(page, b);
    await page.locator("#transfer_approval_reject_btn").click();
    const shown = await page.locator("#rejectConfirmModal").waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    if (!shown) { note("却下理由が空のままでは「却下」で確認モーダルが出なかった（ブラウザの入力チェック）。確認モーダルのキャンセルは押せない（期待結果はDBで確かめるので続ける）"); return; }
    await cancelModal(page, "rejectConfirmModal");
  });
  await step(3, async () => { note(`DB: ${JSON.stringify([dbm.在庫移動振替(a), dbm.在庫移動振替(b)])}`); });
  await expected(async () => {
    expect.soft(snapshot(a, codes), `在庫振替 ${a}`).toEqual(before.a);
    expect.soft(snapshot(b, []), `在庫振替 ${b}`).toEqual(before.b);
  });
});

caseTest("IT-M04-09-086", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫振替ID-M0409-共有A〕");
  const b = notes.get("〔在庫振替ID-M0409-共有B〕");
  const seen: { id: string; url: string; ステータス: string; 却下理由: string; 編集できる欄: number }[] = [];
  const look = async (id: string) => {
    await openViaList(page, id, transferCompletePath(id));
    const info = await moveInfo(page);
    const reason = page.locator("#rejectionReasonComplete");
    seen.push({
      id, url: page.url(), ステータス: info["ステータス"] ?? "", 却下理由: (await reason.count()) ? clean(await reason.innerText()) : "",
      編集できる欄: await page.locator("main textarea:not([readonly]):not([disabled]), main select:not([disabled]), main input:not([readonly]):not([disabled]):not([type=hidden])").count(),
    });
  };
  await step(1, async () => { await look(a); });
  await step(2, async () => { await look(b); });
  await expected(async () => {
    note(`表示: ${JSON.stringify(seen)}`);
    expect.soft(seen[0]?.ステータス, `入庫完了の ${a} のステータス`).toBe("入庫完了");
    expect.soft(seen[1]?.ステータス, `却下の ${b} のステータス`).toBe("却下");
    expect.soft(seen[1]?.却下理由, `却下の ${b} の却下理由`).toBe("振替内容不一致");
    expect.soft(seen.map((s) => s.編集できる欄), "ステータス・却下理由が変更できない（入力欄が無い）").toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------- 権限・初期登録画面の表示

caseTest("IT-M04-09-095", async ({ page, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const code = "M0409-095-A";
  let moved = false;
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    moved = r.moved;
    note(`「在庫移動登録」の結果: 在庫移動初期登録画面へ移ったか ${r.moved}・ポップアップ「${r.dialogs.join(" / ") || "なし"}」`);
  });
  await step(3, async () => {
    if (!moved) { note("在庫移動初期登録画面は表示されなかったので、この手順は行わない（手順の条件どおり）"); return; }
    const form = new MoveNewPage(page);
    await form.ready();
    await form.chooseToStore(店B);
    await form.chooseToZone("EC-CUBE");
    await form.quantity(code).fill("1");
    if (await pressRegister(form)) await form.confirmRegister();
    const m = await topMessages(page);
    note(`登録の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: 在庫移動 ${dbm.商品の在庫移動振替(code).join("・") || "なし"}・在庫 ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.商品の在庫移動振替(code), `${code} に関する在庫移動`).toEqual([]);
    expect.soft(dbm.在庫(code, 店A, "EC-CUBE")?.在庫, "試験店舗A・EC-CUBE の在庫数").toBe(10);
  });
});

caseTest("IT-M04-09-096", async ({ page, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const code = "M0409-096-A";
  let r: { moved: boolean; dialogs: string[] } | undefined;
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    note(`「在庫移動登録」の結果: ${page.url()}・ポップアップ「${r.dialogs.join(" / ") || "なし"}」`);
  });
  await expected(async () => {
    expect(r!.moved, "在庫移動初期登録画面が表示されない").toBe(false);
    await expect(page.locator("form#stock_move_new_form"), "在庫移動初期登録画面の入力欄").toHaveCount(0);
  });
});

/** 在庫移動・振替情報の欄に、見出しが表示されているもの（値の有無を問わない） */
async function shownLabels(page: Page, root: string): Promise<{ 見出し: string; 値: string }[]> {
  return page.locator(`${root} label`).evaluateAll((ls) => ls.filter((l) => (l as HTMLElement).offsetParent !== null).map((l) => {
    const row = l.closest(".row");
    return { 見出し: (l.textContent ?? "").replace(/\s+/g, " ").trim(), 値: (row?.querySelector(".form-control-plaintext")?.textContent ?? "").replace(/\s+/g, " ").trim() };
  }));
}

caseTest("IT-M04-09-099", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M0409-099-A";
  let labels: { 見出し: string; 値: string }[] = [];
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    expect(r.moved, "在庫移動初期登録画面へ移る").toBe(true);
    await new MoveNewPage(page).ready();
  });
  await step(3, async () => { labels = await shownLabels(page, "#stockMoveTransferInfo"); note(`在庫移動・振替情報の欄: ${labels.map((l) => `${l.見出し}「${l.値}」`).join(" / ")}`); });
  await expected(async () => {
    const hidden = ["在庫移動・振替ID", "ステータス", "登録日", "更新日", "登録者", "更新者"];
    const shown = labels.filter((l) => hidden.includes(l.見出し)).map((l) => l.見出し);
    expect(shown, "在庫移動・振替ID・ステータス・登録日・更新日・登録者・更新者のいずれも表示されない").toEqual([]);
  });
});

caseTest("IT-M04-09-102", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M0409-102-A";
  let cell = "";
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    expect(r.moved, "在庫移動初期登録画面へ移る").toBe(true);
    await new MoveNewPage(page).ready();
  });
  await step(3, async () => {
    const form = new MoveNewPage(page);
    cell = clean(await form.row(code).locator("td").first().innerText());
    note(`商品名/商品コードの欄: 「${cell}」・言語「${clean(await form.row(code).locator("td").nth(1).innerText())}」`);
  });
  await expected(async () => {
    expect(cell, "日本語商品名").toBe(`M0409-102-A 日本語商品名 ${code}`);
  });
});

caseTest("IT-M04-09-103", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M0409-103-A";
  let cell = "";
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, "在庫振替初期登録画面へ移る").toBe(true);
    await new TransferNewPage(page).ready();
  });
  await step(3, async () => {
    cell = clean(await new TransferNewPage(page).row(code).locator("td").first().innerText());
    note(`[振替元]商品名/商品コードの欄: 「${cell}」`);
  });
  await expected(async () => {
    expect(cell, "日本語商品名").toBe(`M0409-103-A 日本語商品名 ${code}`);
  });
});

/** 在庫移動・振替検索一覧で在庫移動・振替IDを入れて検索し、結果の行を選んで、移った画面を確かめる（106〜109） */
function listSelectCase(n: string, account: Account, want: (id: string) => RegExp, 画面: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, account);
    const id = notes.get(`〔在庫移動ID-M0409-${n}〕`);
    const list = new MoveTransferList(page);
    await step(1, async () => { await list.searchById(id); });
    await step(2, async () => { await list.openFromRow(id); note(`移った画面: ${page.url()}`); });
    await expected(async () => {
      expect.soft(want(id).test(new URL(page.url()).pathname), `${画面}へ移る（${page.url()}）`).toBe(true);
      expect.soft(await shownMoveId(page), "選択した在庫移動・振替IDの移動が表示される").toBe(id);
    });
  };
}

caseTest("IT-M04-09-106", listSelectCase("106", M0409_APP, outboundRequestPath, "移動ピック・出庫承認申請画面"));
caseTest("IT-M04-09-107", listSelectCase("107", M0409_APP, outboundApprovalPath, "移動出庫承認画面"));
caseTest("IT-M04-09-108", listSelectCase("108", M0409_RCV, inboundRequestPath, "移動入庫承認申請画面"));
caseTest("IT-M04-09-109", listSelectCase("109", M0409_RCV, inboundApprovalPath, "移動入庫承認画面"));

caseTest("IT-M04-09-110", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const a = notes.get("〔在庫移動ID-M0409-110A〕");
  const b = notes.get("〔在庫移動ID-M0409-110B〕");
  const list = new MoveTransferList(page);
  const seen: { id: string; url: string; 表示ID: string | null; ステータス: string }[] = [];
  await step(1, async () => {
    await list.searchById(a);
    await list.openFromRow(a);
    seen.push({ id: a, url: page.url(), 表示ID: await shownMoveId(page), ステータス: (await moveInfo(page))["ステータス"] ?? "" });
  });
  await step(2, async () => {
    const menu = page.locator('a[href$="/product/stock/move_transfer"]').filter({ hasText: /在庫移動・振替/ }).first();
    await expect(menu, "メニューの在庫移動・振替").toHaveCount(1);
    await Promise.all([page.waitForURL(moveTransferListPath, { waitUntil: "load" }), menu.click({ force: true })]);
  });
  await step(3, async () => {
    await list.field("stock_move_transfer_id").fill(b);
    await list.pressSearch();
    await list.openFromRow(b);
    seen.push({ id: b, url: page.url(), 表示ID: await shownMoveId(page), ステータス: (await moveInfo(page))["ステータス"] ?? "" });
  });
  await expected(async () => {
    note(`表示: ${JSON.stringify(seen)}`);
    for (const s of seen) {
      expect.soft(moveCompletePath(s.id).test(new URL(s.url).pathname), `${s.id}: 在庫移動完了画面へ移る（${s.url}）`).toBe(true);
      expect.soft(s.表示ID, `${s.id}: 選択した在庫移動・振替ID`).toBe(s.id);
    }
    expect.soft(seen[0]?.ステータス, `${a} のステータス`).toBe("入庫完了");
    expect.soft(seen[1]?.ステータス, `${b} のステータス`).toBe("却下");
  });
});

caseTest("IT-M04-09-114", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-114〕");
  const req = new OutboundRequestPage(page);
  await step(1, async () => { await openViaList(page, id, outboundRequestPath(id)); });
  await step(2, async () => {
    note(`ボタンの表示: 「${clean(await req.submit.innerText())}」`);
    await req.submit.click();
    const modal = page.locator("#stockMoveConfirmModalSameStore");
    await expect(modal, "確認モーダル").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await expected(async () => {
    expect(moveCompletePath(id).test(new URL(page.url()).pathname), `在庫移動完了画面へ移る（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-115", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-115〕");
  const req = new OutboundRequestPage(page);
  let v: { 移動前在庫数: string; 移動後在庫数: string; 移動点数: string } | undefined;
  await step(1, async () => { await openViaList(page, id, outboundRequestPath(id)); });
  await step(2, async () => { v = await req.rowValues("M0409-115-A"); note(`行の表示: ${JSON.stringify(v)}`); });
  await expected(async () => {
    expect(v, "移動前在庫数・移動後在庫数・移動点数").toEqual({ 移動前在庫数: "10", 移動後在庫数: "7", 移動点数: "3" });
  });
});

caseTest("IT-M04-09-116", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-116〕");
  await step(1, async () => { await openViaList(page, id, outboundRequestPath(id)); });
  await step(2, async () => {
    const link = page.locator(".c-conversionArea a.c-baseLink");
    await expect(link, "フッターの在庫移動・振替一覧画面のボタン").toHaveCount(1);
    note(`ボタンの表示: 「${clean(await link.innerText())}」`);
    await Promise.all([page.waitForURL(moveTransferListPath, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect(moveTransferListPath.test(new URL(page.url()).pathname), `在庫移動・振替検索一覧画面へ移る（${page.url()}）`).toBe(true);
    await expect(page.locator("form#form_search_stock_move_transfer"), "在庫移動・振替検索一覧の検索欄").toBeVisible();
  });
});

// ---------------------------------------------------------------- 却下理由の上限

/** 承認画面で、却下理由に半角の A を n 文字入れて却下する（122〜125） */
function rejectLengthCase(label: string, n: number, kind: "移動" | "振替", codes: string[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, M0409_APP);
    const id = notes.get(label);
    const stocks = codes.map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
    const before = snapshot(id, stocks);
    const want = kind === "移動" ? outboundApprovalPath(id) : transferApprovalPath(id);
    const button = kind === "移動" ? "outbound_approval_reject_btn" : "transfer_approval_reject_btn";
    let modal = false;
    await step(1, async () => { await openViaList(page, id, want); });
    await step(2, async () => { await setRejectReason(page, "A".repeat(n)); });
    await step(3, async () => {
      const r = await pressReject(page, button, null);
      modal = r.modal;
      const m = await topMessages(page);
      note(`却下の結果: 確認モーダル ${r.modal}（${r.invalid.join(" / ") || "入力チェックで止まっていない"}）・${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(4, async () => { note(`DB: ${JSON.stringify({ ...dbm.在庫移動振替(id), 却下理由: dbm.長い文の形(id, "却下理由") })}`); });
    await expected(async () => {
      if (n === 65535) {
        expect(modal, "却下の確認モーダルで「却下する」を押せた").toBe(true);
        expect.soft(dbm.在庫移動振替(id)?.ステータス, "ステータス").toBe("却下");
        expect.soft(dbm.長い文の形(id, "却下理由"), "却下理由（文字数・半角の A だけ）").toEqual({ 文字数: 65535, Aだけ: true });
      } else {
        expect(snapshot(id, stocks), "ステータス・却下理由・在庫・総原価・履歴").toEqual(before);
      }
    });
  };
}

caseTest("IT-M04-09-122", rejectLengthCase("〔在庫移動ID-M0409-122〕", 65535, "移動", ["M0409-122-A"]));
caseTest("IT-M04-09-123", rejectLengthCase("〔在庫移動ID-M0409-123〕", 65536, "移動", ["M0409-123-A"]));
caseTest("IT-M04-09-124", rejectLengthCase("〔在庫振替ID-M0409-124〕", 65535, "振替", ["M0409-124-A", "M0409-124-B"]));
caseTest("IT-M04-09-125", rejectLengthCase("〔在庫振替ID-M0409-125〕", 65536, "振替", ["M0409-125-A", "M0409-125-B"]));

caseTest("IT-M04-09-126", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-126〕");
  const code = "M0409-126-A";
  const req = new InboundRequestPage(page);
  const states: string[] = [];
  const tryValue = async (v: string) => {
    const why = await tryFill(req.diff(code), v);
    if (why) throw new Error(`差分点数に${v}を入れられない: ${why}（画面は「差分登録」を押してから差分点数の欄が入力できるようになる作り）`);
    states.push(`${v}: ${clean(await req.toggle(code).innerText())}・${(await req.toggle(code).isEnabled()) ? "押せる" : "押せない"}`);
  };
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); });
  await step(2, async () => { await tryValue("1.5"); });
  await step(3, async () => { await tryValue("-2.5"); });
  await expected(async () => {
    note(`各入力のあとの差分登録ボタン: ${states.join(" / ")}`);
    expect(states.every((s) => s.endsWith("押せない")), "各入力で差分登録ボタンが押せない").toBe(true);
  });
});

caseTest("IT-M04-09-127", async ({ page, notes, step, expected }) => {
  await login(page, M0409_NOAUTH);
  const id = notes.get("〔在庫移動ID-M0409-127〕");
  const codes = both(["M0409-127-A"]);
  const before = snapshot(id, codes);
  await step(1, async () => {
    await page.goto(adminUrl(`/product/stock/move/inbound_approval/${id}`));
    await page.waitForLoadState("load");
    expect(inboundApprovalPath(id).test(new URL(page.url()).pathname), `移動入庫承認画面が開く（${page.url()}）`).toBe(true);
  });
  await step(2, async () => {
    await page.locator("#inbound_approval_reconfirm_btn").click();
    await expect(page.locator("#reconfirmConfirmModal"), "入庫再確認の確認モーダル").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#reconfirm_confirm_submit_btn").click()]);
    const m = await topMessages(page);
    note(`入庫再確認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => {
    if (!inboundApprovalPath(id).test(new URL(page.url()).pathname)) {
      note(`入庫再確認のあと移動入庫承認画面ではない（${page.url()}）。手順のとおり移動入庫承認画面を開き直して承認を押す`);
      await page.goto(adminUrl(`/product/stock/move/inbound_approval/${id}`));
      await page.waitForLoadState("load");
    }
    if (!inboundApprovalPath(id).test(new URL(page.url()).pathname)) { note(`移動入庫承認画面を開けない（${page.url()}）。承認は押せない（期待結果はDBで確かめるので続ける）`); return; }
    await pressApprove(page, "inbound_approval_approve_btn");
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect(snapshot(id, codes), "ステータス・入庫承認日・入庫承認者・在庫・総原価・履歴").toEqual(before);
  });
});

caseTest("IT-M04-09-128", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-128〕");
  let buttons: string[] = [];
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); });
  await step(2, async () => {
    buttons = (await page.locator(".c-conversionArea button, .c-conversionArea a.btn").allInnerTexts()).map(clean).filter(Boolean);
    note(`フッターのボタン: ${buttons.join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(buttons, "却下ボタンが表示されない").not.toContain("却下");
    expect.soft(buttons, "承認申請ボタンが表示される").toContain("承認申請");
  });
});

// ---------------------------------------------------------------- 在庫変動履歴

/** 承認・却下のあと、在庫変動履歴に増えた行のうち、区分が一致する行（1件のはず） */
function addedHistory(code: string, store: 店, before: number, 区分: string): dbm.在庫変動履歴[] {
  return dbm.在庫変動履歴(code, store, "EC-CUBE").slice(before).filter((h) => h.区分 === 区分);
}

caseTest("IT-M04-09-130", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-130〕");
  const code = "M0409-130-A";
  const before = dbm.在庫変動履歴(code, 店B, "EC-CUBE").length;
  await step(1, async () => { await openViaList(page, id, inboundApprovalPath(id)); });
  await step(2, async () => {
    await pressApprove(page, "inbound_approval_approve_btn");
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`入庫先に増えた在庫変動履歴: ${JSON.stringify(dbm.在庫変動履歴(code, 店B, "EC-CUBE").slice(before))}`); });
  await expected(async () => {
    const h = addedHistory(code, 店B, before, "在庫移動(加算)");
    expect(h.length, "入庫先に在庫移動(加算)の履歴が1件").toBe(1);
    expect.soft([h[0].変更前在庫, h[0].変更後在庫, h[0].増減数], "変更前在庫・変更後在庫・増減数").toEqual([5, 8, 3]);
    expect.soft(h[0].仕入総価格, "仕入総価格").toBe(300);
    expect.soft([h[0].変更前総原価, h[0].変更後総原価], "変更前総原価・変更後総原価").toEqual([500, 800]);
    expect.soft(h[0].履歴登録元ID, "履歴登録元ID").toBe(id);
    for (const w of ["在庫移動による加算", `${店A}から${店B}`, id]) expect.soft(h[0].理由, `理由に「${w}」`).toContain(w);
  });
});

caseTest("IT-M04-09-131", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-131〕");
  const code = "M0409-131-A";
  const before = dbm.在庫変動履歴(code, 店A, "EC-CUBE").length;
  await step(1, async () => { await openViaList(page, id, outboundApprovalPath(id)); });
  await step(2, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("出庫内容不一致"); });
  await step(3, async () => {
    const r = await pressReject(page, "outbound_approval_reject_btn", null);
    expect(r.modal, "確認モーダルが出る").toBe(true);
    const m = await topMessages(page);
    note(`却下の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`出庫元に増えた在庫変動履歴: ${JSON.stringify(dbm.在庫変動履歴(code, 店A, "EC-CUBE").slice(before))}`); });
  await expected(async () => {
    note(`出庫元に増えた履歴の区分: ${dbm.在庫変動履歴(code, 店A, "EC-CUBE").slice(before).map((x) => x.区分).join("・") || "なし"}`);
    const h = addedHistory(code, 店A, before, "在庫移動(棄却)");   // 裁定 E12（2026-10-23）で正本が「在庫移動(棄却)」になった
    expect(h.length, "出庫元に在庫移動(棄却)の履歴が1件").toBe(1);
    expect.soft([h[0].変更前在庫, h[0].変更後在庫, h[0].増減数], "変更前在庫・変更後在庫・増減数").toEqual([7, 10, 3]);
    expect.soft(h[0].仕入総価格, "仕入総価格").toBe(300);
    expect.soft([h[0].変更前総原価, h[0].変更後総原価], "変更前総原価・変更後総原価").toEqual([700, 1000]);
    expect.soft(h[0].履歴登録元ID, "履歴登録元ID").toBe(id);
    for (const w of ["在庫移動棄却による戻し", 店A, id]) expect.soft(h[0].理由, `理由に「${w}」`).toContain(w);
  });
});

function diffHistoryCase(n: string, 区分: string, before: [number, number, number], cost: [number, number], words: string[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, M0409_RCV);
    const id = notes.get(`〔在庫移動ID-M0409-${n}〕`);
    const code = `M0409-${n}-A`;
    const count = dbm.在庫変動履歴(code, 店A, "EC-CUBE").length;
    await step(1, async () => { await openViaList(page, id, inboundApprovalPath(id)); });
    await step(2, async () => {
      await pressApprove(page, "inbound_approval_approve_btn");
      const m = await topMessages(page);
      note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(3, async () => { note(`出庫元に増えた在庫変動履歴: ${JSON.stringify(dbm.在庫変動履歴(code, 店A, "EC-CUBE").slice(count))}`); });
    await expected(async () => {
      const h = addedHistory(code, 店A, count, 区分);
      expect(h.length, `出庫元に${区分}の履歴が1件`).toBe(1);
      expect.soft([h[0].変更前在庫, h[0].変更後在庫, h[0].増減数], "変更前在庫・変更後在庫・増減数").toEqual(before);
      expect.soft([h[0].変更前総原価, h[0].変更後総原価], "変更前総原価・変更後総原価").toEqual(cost);
      expect.soft(h[0].履歴登録元ID, "履歴登録元ID").toBe(id);
      for (const w of [...words, id]) expect.soft(h[0].理由, `理由に「${w}」`).toContain(w);
    });
  };
}

caseTest("IT-M04-09-132", diffHistoryCase("132", "在庫移動(差分加算)", [7, 8, 1], [700, 800], ["在庫移動差し戻しによる加算", 店A]));
caseTest("IT-M04-09-133", diffHistoryCase("133", "在庫移動(差分減算)", [9, 8, -1], [1800, 1600], ["在庫移動差し戻しによる減算", 店A]));

caseTest("IT-M04-09-135", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-135〕");
  const dest = "M0409-135-B";
  const before = dbm.在庫変動履歴(dest, 店A, "EC-CUBE").length;
  await step(1, async () => { await openViaList(page, id, transferApprovalPath(id)); });
  await step(2, async () => {
    await pressApprove(page, "transfer_approval_approve_btn");
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`振替先に増えた在庫変動履歴: ${JSON.stringify(dbm.在庫変動履歴(dest, 店A, "EC-CUBE").slice(before))}`); });
  await expected(async () => {
    const h = addedHistory(dest, 店A, before, "在庫振替(加算)");
    expect(h.length, "振替先に在庫振替(加算)の履歴が1件").toBe(1);
    expect.soft([h[0].変更前在庫, h[0].変更後在庫, h[0].増減数], "変更前在庫・変更後在庫・増減数").toEqual([4, 7, 3]);
    expect.soft(h[0].仕入総価格, "仕入総価格").toBe(300);
    expect.soft(h[0].履歴登録元ID, "履歴登録元ID").toBe(id);
    for (const w of ["在庫振替による加算", "商品コードM0409-135-AからM0409-135-B", id]) expect.soft(h[0].理由, `理由に「${w}」`).toContain(w);
  });
});

caseTest("IT-M04-09-136", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-136〕");
  const src = "M0409-136-A";
  const before = dbm.在庫変動履歴(src, 店A, "EC-CUBE").length;
  await step(1, async () => { await openViaList(page, id, transferApprovalPath(id)); });
  await step(2, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("振替内容不一致"); });
  await step(3, async () => {
    const r = await pressReject(page, "transfer_approval_reject_btn", null);
    expect(r.modal, "確認モーダルが出る").toBe(true);
    const m = await topMessages(page);
    note(`却下の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`振替元に増えた在庫変動履歴: ${JSON.stringify(dbm.在庫変動履歴(src, 店A, "EC-CUBE").slice(before))}`); });
  await expected(async () => {
    const h = addedHistory(src, 店A, before, "在庫振替(棄却)");
    expect(h.length, "振替元に在庫振替(棄却)の履歴が1件").toBe(1);
    expect.soft([h[0].変更前在庫, h[0].変更後在庫, h[0].増減数], "変更前在庫・変更後在庫・増減数").toEqual([7, 10, 3]);
    expect.soft(h[0].履歴登録元ID, "履歴登録元ID").toBe(id);
    for (const w of ["在庫振替棄却による戻し", "商品コードM0409-136-AからM0409-136-B", id]) expect.soft(h[0].理由, `理由に「${w}」`).toContain(w);
  });
});

// ---------------------------------------------------------------- 在庫振替の初期登録画面

caseTest("IT-M04-09-139", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const code = "M0409-139-A";
  let labels: { 見出し: string; 値: string }[] = [];
  let cards: string[] = [];
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", code);
    await checkStockRows(page, [code], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, "在庫振替初期登録画面へ移る").toBe(true);
    await new TransferNewPage(page).ready();
  });
  await step(3, async () => {
    labels = await shownLabels(page, "#stockTransferBasicInfo");
    cards = (await page.locator(".card-header .card-title").allInnerTexts()).map(clean);
    note(`在庫移動・振替情報の欄: ${labels.map((l) => `${l.見出し}「${l.値}」`).join(" / ")}・カードの見出し: ${cards.join(" / ")}`);
  });
  await expected(async () => {
    const hidden = ["在庫移動・振替ID", "ステータス", "登録日", "更新日", "承認日", "登録者", "更新者", "承認者"];
    expect.soft(labels.filter((l) => hidden.includes(l.見出し)).map((l) => l.見出し), "在庫移動・振替ID・ステータス・登録日・更新日・承認日・登録者・更新者・承認者が表示されない").toEqual([]);
    expect.soft(cards.filter((c) => c === "ステータス変更履歴" || c === "却下理由"), "ステータス変更履歴・却下理由が表示されない").toEqual([]);
  });
});

caseTest("IT-M04-09-141", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const src = "M0409-141-A";
  let form: TransferNewPage | undefined;
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", src);
    await checkStockRows(page, [src], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, "在庫振替初期登録画面へ移る").toBe(true);
    form = new TransferNewPage(page);
    await form.ready();
  });
  await step(3, async () => { await form!.dest(src).fill("M0409-141-B"); });
  await step(4, async () => {
    const res = page.waitForResponse((r) => r.url().includes("/dest-product-class-info"), { timeout: 30_000 }).catch(() => null);
    await form!.dest(src).blur();
    await res;
  });
  await expected(async () => {
    await expect.poll(async () => (await form!.destInfo(src))["product_name_code"], { timeout: 15_000 }).not.toBe("");
    const d = await form!.destInfo(src);
    note(`振替先の表示: ${JSON.stringify(d)}`);
    expect.soft(d["product_name_code"], "商品名").toContain("M0409-141-B 振替先商品");
    expect.soft(d["language"], "言語").toBe("英語");
    expect.soft(d["card_condition"], "状態").toBe("NM");
    expect.soft(d["foil"], "Foil（なしのハイフン）").toBe("-");
    expect.soft(d["standard_price"], "基準価格").toMatch(/^¥?800$|^¥?800円?$/);
  });
});

caseTest("IT-M04-09-142", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const src = "M0409-142-A";
  const destId = notes.get("〔商品ID-M0409-142〕");
  let form: TransferNewPage | undefined;
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", src);
    await checkStockRows(page, [src], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, "在庫振替初期登録画面へ移る").toBe(true);
    form = new TransferNewPage(page);
    await form.ready();
  });
  await step(3, async () => {
    await form!.row(src).locator(".btn-transfer-product-search").click();
    await expect(page.locator("#stockTransferProductModal"), "商品検索モーダル").toBeVisible();
  });
  await step(4, async () => {
    const box = page.locator("#stockTransferProductModal #admin_search_product_id");
    note(`商品検索モーダルの検索欄の案内: 「${await box.getAttribute("placeholder")}」（商品名だけの欄は無く、商品ID・商品名・商品コードの欄に入れた）`);
    await box.fill("M0409-142-B 振替候補");
    await page.locator("#searchProductModalButton").click();
    await expect(page.locator("#searchProductModalList tr").first(), "検索結果").toBeVisible({ timeout: 30_000 });
  });
  await step(5, async () => {
    const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`button.add-order-item[data-product-id="${destId}"]`) });
    await expect(row, `検索結果の商品ID ${destId} の行`).toHaveCount(1);
    await row.locator('select[name="product_class"]').selectOption({ label: "M0409-142-B" }).catch(async () => {
      const opts = await row.locator('select[name="product_class"] option').allInnerTexts();
      const hit = opts.find((o) => o.includes("M0409-142-B"));
      if (!hit) throw new Error(`商品コードの選択肢に M0409-142-B が無い（${opts.join(" / ")}）`);
      await row.locator('select[name="product_class"]').selectOption({ label: hit });
    });
    const res = page.waitForResponse((r) => r.url().includes("/dest-product-class-info"), { timeout: 30_000 }).catch(() => null);
    await row.locator("button.add-order-item").click();
    await res;
  });
  await expected(async () => {
    await expect.soft(form!.dest(src), "振替先商品コード").toHaveValue("M0409-142-B");
    await expect.poll(async () => (await form!.destInfo(src))["product_name_code"], { timeout: 15_000 }).not.toBe("");
    const d = await form!.destInfo(src);
    note(`振替先の表示: ${JSON.stringify(d)}`);
    expect.soft(d["product_name_code"], "商品名").toContain("M0409-142-B 振替候補");
    expect.soft(d["language"], "言語").toBe("英語");
    expect.soft(d["card_condition"], "状態").toBe("NM");
    expect.soft(d["foil"], "Foil（なしのハイフン）").toBe("-");
    expect.soft(d["standard_price"], "基準価格").toMatch(/^¥?800$|^¥?800円?$/);
  });
});

caseTest("IT-M04-09-144", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫振替ID-M0409-144〕");
  const list = new MoveTransferList(page);
  await step(1, async () => {
    await list.open();
    await list.field("stock_move_transfer_id").fill(id);
    await setChoice(page, "move_transfer_type", "在庫振替");
    await setChoice(page, "move_transfer_status", "振替承認待ち");
    await list.pressSearch();
  });
  await step(2, async () => { await list.openFromRow(id); expect(transferApprovalPath(id).test(new URL(page.url()).pathname), `在庫振替承認画面（${page.url()}）`).toBe(true); });
  await step(3, async () => {
    const link = page.locator(".c-conversionArea a.c-baseLink");
    await expect(link, "フッターの在庫移動・振替検索一覧のリンク").toHaveCount(1);
    await Promise.all([page.waitForURL(moveTransferListPath, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect(moveTransferListPath.test(new URL(page.url()).pathname), `在庫移動・振替検索一覧画面へ移る（${page.url()}）`).toBe(true);
    expect.soft(await list.field("stock_move_transfer_id").inputValue(), "検索条件: 在庫移動・振替ID").toBe(id);
    expect.soft(await checkedChoices(page, "move_transfer_type"), "検索条件: 移動タイプ").toEqual(["在庫振替"]);
    expect.soft(await checkedChoices(page, "move_transfer_status"), "検索条件: ステータス").toEqual(["振替承認待ち"]);
    expect.soft(await list.listedIds(), "検索結果").toEqual([id]);
  });
});

/** 在庫移動・振替検索一覧のチェック欄（移動タイプ・ステータス・在庫区分）を、指定の選択肢だけにする */
async function setChoice(page: Page, name: string, ...labels: string[]): Promise<void> {
  const boxes = page.locator(`input[name="admin_search_stock_move_transfer[${name}][]"]`);
  const all = await boxes.evaluateAll((is) => is.map((i) => ({ v: (i as HTMLInputElement).value, l: (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "" })));
  for (const l of labels) if (!all.some((a) => a.l === l)) throw new Error(`検索欄「${name}」に選択肢「${l}」が無い（${all.map((a) => a.l).join("、")}）`);
  for (const a of all) await page.locator(`input[name="admin_search_stock_move_transfer[${name}][]"][value="${a.v}"]`).setChecked(labels.includes(a.l));
}

async function checkedChoices(page: Page, name: string): Promise<string[]> {
  return page.locator(`input[name="admin_search_stock_move_transfer[${name}][]"]:checked`).evaluateAll((is) => is.map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
}

function selfApproveCase(n: string, mode: "承認" | "却下"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, M0409_APP);
    const id = notes.get(`〔在庫振替ID-M0409-${n}〕`);
    const codes = [`M0409-${n}-A`, `M0409-${n}-B`].map((code) => ({ code, store: 店A, zone: "EC-CUBE" as 在庫区分 }));
    const before = snapshot(id, codes);
    let i = 1;
    await step(i++, async () => { await openViaList(page, id, transferApprovalPath(id)); });
    if (mode === "却下") await step(i++, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("振替内容不一致"); });
    await step(i++, async () => {
      if (mode === "承認") await pressApprove(page, "transfer_approval_approve_btn");
      else {
        const r = await pressReject(page, "transfer_approval_reject_btn", null);
        expect(r.modal, "確認モーダルが出る").toBe(true);
      }
      const m = await topMessages(page);
      note(`${mode}の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(i++, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
    await expected(async () => {
      expect(snapshot(id, codes), "ステータス・承認情報・却下理由・在庫・総原価・履歴").toEqual(before);
    });
  };
}

caseTest("IT-M04-09-145", selfApproveCase("145", "承認"));
caseTest("IT-M04-09-146", selfApproveCase("146", "却下"));

// ---------------------------------------------------------------- 複数明細・欠品の有無

caseTest("IT-M04-09-153", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-153〕");
  const a = "M0409-153-A";
  const b = "M0409-153-B";
  const haList = dbm.在庫変動履歴(a, 店A, "EC-CUBE");
  const ha = haList.length;
  const hb = dbm.在庫変動履歴(b, 店A, "EC-CUBE");
  // 事前準備（裁定 E15）: 両商品とも、シードの在庫編集の入庫の履歴1件と登録時の在庫移動(減算)1件の2件だけ
  note(`操作の前の在庫変動履歴: ${a} ${haList.map((h) => h.区分).join("・")}／${b} ${hb.map((h) => h.区分).join("・")}`);
  expectSeedHistory(a, haList);
  expectSeedHistory(b, hb);
  await step(1, async () => { await openViaList(page, id, outboundApprovalPath(id)); });
  await step(2, async () => {
    await pressApprove(page, "outbound_approval_approve_btn");
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`増えた履歴: A ${JSON.stringify(dbm.在庫変動履歴(a, 店A, "EC-CUBE").slice(ha))}・B 在庫 ${JSON.stringify(dbm.在庫(b, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    const added = dbm.在庫変動履歴(a, 店A, "EC-CUBE").slice(ha).map((h) => h.区分);
    expect.soft(added.filter((k) => k === "欠品加算(移動)").length, `${a} に欠品加算（移動）の履歴が1件`).toBe(1);
    expect.soft(added.filter((k) => k === "欠品減算(移動)").length, `${a} に欠品減算（移動）の履歴が1件`).toBe(1);
    expect.soft(dbm.在庫(b, 店A, "EC-CUBE")?.在庫, `${b} の在庫数`).toBe(8);
    const histB = dbm.在庫変動履歴(b, 店A, "EC-CUBE");
    note(`${b} の在庫変動履歴（操作の前 ${hb.length}件・後 ${histB.length}件）: ${histB.map((h) => `${h.区分}（${h.変更前在庫}→${h.変更後在庫}）`).join("・")}`);
    // 期待結果（裁定 E15）: 操作の前と同じ2件（シードの入庫の履歴1件と登録時の在庫移動(減算)1件）のままで、新しい履歴が登録されない
    expect.soft(histB, `${b} の在庫変動履歴が操作の前と同じ2件のまま（新しい履歴が登録されない）`).toEqual(hb);
  });
});

caseTest("IT-M04-09-155", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-155〕");
  const [a, b, c] = ["M0409-155-A", "M0409-155-B", "M0409-155-C"];
  const hb = dbm.在庫変動履歴(b, 店A, "EC-CUBE").length;
  const hc = dbm.在庫変動履歴(c, 店A, "EC-CUBE").length;
  await step(1, async () => {
    await openViaList(page, id, inboundApprovalPath(id));
    await page.locator("#inbound_approval_approve_btn").click();
    await expect(page.locator("#approveConfirmModal"), "承認の確認モーダル").toBeVisible();
  });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#approve_confirm_submit_btn").click()]);
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify([a, b, c].map((code) => ({ code, A: dbm.在庫(code, 店A, "EC-CUBE"), B: dbm.在庫(code, 店B, "EC-CUBE") })))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫(a, 店B, "EC-CUBE"), `${a} の入庫先`).toEqual({ 在庫: 8, 総原価: 800 });
    expect.soft(dbm.在庫(b, 店B, "EC-CUBE"), `${b} の入庫先`).toEqual({ 在庫: 7, 総原価: 700 });
    expect.soft(dbm.在庫(c, 店B, "EC-CUBE"), `${c} の入庫先`).toEqual({ 在庫: 4, 総原価: 500 });
    expect.soft(dbm.在庫(a, 店A, "EC-CUBE"), `${a} の出庫元`).toEqual({ 在庫: 7, 総原価: 700 });
    expect.soft(dbm.在庫(b, 店A, "EC-CUBE"), `${b} の出庫元`).toEqual({ 在庫: 8, 総原価: 800 });
    expect.soft(dbm.在庫(c, 店A, "EC-CUBE"), `${c} の出庫元`).toEqual({ 在庫: 8, 総原価: 1600 });
    expect.soft(dbm.在庫変動履歴(b, 店A, "EC-CUBE").slice(hb).map((h) => h.区分), `${b} の出庫元に在庫移動（差分加算）`).toContain("在庫移動(差分加算)");
    expect.soft(dbm.在庫変動履歴(c, 店A, "EC-CUBE").slice(hc).map((h) => h.区分), `${c} の出庫元に在庫移動（差分減算）`).toContain("在庫移動(差分減算)");
  });
});

caseTest("IT-M04-09-156", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-156〕");
  const [a, b] = ["M0409-156-A", "M0409-156-B"];
  const ha = dbm.在庫変動履歴(a, 店A, "EC-CUBE").length;
  const hb = dbm.在庫変動履歴(b, 店A, "EC-CUBE").length;
  await step(1, async () => { await openViaList(page, id, outboundApprovalPath(id)); });
  await step(2, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("出庫内容不一致"); });
  await step(3, async () => {
    const r = await pressReject(page, "outbound_approval_reject_btn", null);
    expect(r.modal, "確認モーダルが出る").toBe(true);
    const m = await topMessages(page);
    note(`却下の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫(a, 店A, "EC-CUBE")?.在庫, `${a} の出庫元在庫数`).toBe(10);
    expect.soft(dbm.在庫(b, 店A, "EC-CUBE")?.在庫, `${b} の出庫元在庫数`).toBe(10);
    expect.soft(dbm.在庫変動履歴(a, 店A, "EC-CUBE").length, `${a} に在庫変動履歴が登録される`).toBeGreaterThan(ha);
    expect.soft(dbm.在庫変動履歴(b, 店A, "EC-CUBE").length, `${b} に在庫変動履歴が登録される`).toBeGreaterThan(hb);
  });
});

caseTest("IT-M04-09-157", async ({ page, notes, step, expected }) => {
  await login(page, M0409_APP);
  const id = notes.get("〔在庫移動ID-M0409-157〕");
  const a = "M0409-157-A";
  const before = dbm.在庫変動履歴(a, 店A, "EC-CUBE");
  // 事前準備（裁定 E15）: シードの在庫編集の入庫の履歴1件と登録時の在庫移動(減算)1件の2件だけ
  note(`操作の前の在庫変動履歴: ${before.map((h) => h.区分).join("・")}`);
  expectSeedHistory(a, before);
  await step(1, async () => { await openViaList(page, id, outboundApprovalPath(id)); });
  await step(2, async () => {
    await pressApprove(page, "outbound_approval_approve_btn");
    const m = await topMessages(page);
    note(`承認の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}・履歴 ${JSON.stringify(dbm.在庫変動履歴(a, 店A, "EC-CUBE"))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫移動振替(id)?.ステータス, "ステータス").toBe("出庫承認済み");
    const after = dbm.在庫変動履歴(a, 店A, "EC-CUBE");
    expect.soft(after.filter((h) => /欠品/.test(h.区分)).length, "欠品加算（移動）・欠品減算（移動）の履歴が登録されない").toBe(0);
    note(`${a} の在庫変動履歴（操作の前 ${before.length}件・後 ${after.length}件）: ${after.map((h) => `${h.区分}（${h.変更前在庫}→${h.変更後在庫}）`).join("・")}`);
    // 期待結果（裁定 E15）: 操作の前と同じ2件（シードの入庫の履歴1件と登録時の在庫移動(減算)1件）のまま
    expect.soft(after, "在庫変動履歴が操作の前と同じ2件のまま").toEqual(before);
  });
});

caseTest("IT-M04-09-158", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-158〕");
  const code = "M0409-158-A";
  const hist = dbm.在庫変動履歴(code, 店A, "スマレジ").length;
  const req = new OutboundRequestPage(page);
  await step(1, async () => { await openViaList(page, id, outboundRequestPath(id)); });
  await step(2, async () => {
    await req.submit.click();
    const modal = page.locator("#stockMoveConfirmModalSameStore");
    await expect(modal, "確認モーダル").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
    const m = await topMessages(page);
    note(`結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(3, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}`); });
  await expected(async () => {
    expect.soft(dbm.在庫移動振替(id)?.ステータス, "ステータスが入庫完了").toBe("入庫完了");
    expect.soft(dbm.在庫(code, 店A, "スマレジ"), "入庫先の在庫数・仕入総原価").toEqual({ 在庫: 7, 総原価: 700 });
    expect.soft(dbm.在庫変動履歴(code, 店A, "スマレジ").length, "在庫変動履歴が登録される").toBeGreaterThan(hist);
  });
});

function rejectStockCase(n: string, total: number): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page, M0409_APP);
    const id = notes.get(`〔在庫移動ID-M0409-${n}〕`);
    const code = `M0409-CB${n}-A`;
    await step(1, async () => { await openViaList(page, id, outboundApprovalPath(id)); });
    await step(2, async () => { await page.locator('textarea[name$="[rejected_memo]"]').fill("出庫内容不一致"); });
    await step(3, async () => {
      const r = await pressReject(page, "outbound_approval_reject_btn", null);
      expect(r.modal, "確認モーダルが出る").toBe(true);
      const m = await topMessages(page);
      note(`却下の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
    });
    await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))}・在庫 ${JSON.stringify(dbm.在庫(code, 店A, "EC-CUBE"))}`); });
    await expected(async () => {
      const t = dbm.在庫移動振替(id)!;
      expect.soft(t.ステータス, "ステータス").toBe("却下");
      expect.soft(t.却下理由, "却下理由").toBe("出庫内容不一致");
      expect.soft(dbm.在庫(code, 店A, "EC-CUBE"), "出庫元の在庫数・仕入総原価").toEqual({ 在庫: 10, 総原価: total });
    });
  };
}

caseTest("IT-M04-09-178", rejectStockCase("178", 1000));
caseTest("IT-M04-09-179", rejectStockCase("179", 900));

// ---------------------------------------------------------------- 差分商品の追加

/** 移動入庫承認申請画面で「差分商品追加」を押し、商品検索モーダルで商品コードを検索して、その商品コードを選んで決定する */
async function addDiffProduct(page: Page, code: string): Promise<void> {
  await page.locator('button[data-bs-target="#moveDifferentialProductSearchModal"]').click();
  const modal = page.locator("#moveDifferentialProductSearchModal");
  await expect(modal, "商品検索モーダル").toBeVisible();
  await modal.locator("#admin_search_product_id").fill(code);
  await modal.locator("#moveDifferentialProductSearchModalButton").click();
  const row = modal.locator("#moveDifferentialProductSearchModalList tr").filter({ has: page.locator('select[name="product_class"] option', { hasText: code }) });
  await expect(row, `検索結果の ${code} の行`).toHaveCount(1, { timeout: 30_000 });
  const opts = await row.locator('select[name="product_class"] option').allInnerTexts();
  const hit = opts.find((o) => o.includes(code));
  await row.locator('select[name="product_class"]').selectOption({ label: hit! });
  await Promise.all([page.waitForEvent("load", { timeout: 60_000 }), row.locator("button.add-order-item").click()]);
  await page.waitForLoadState("load");
}

caseTest("IT-M04-09-195", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-195〕");
  const code = "M0409-CB195-B";
  await openViaList(page, id, inboundRequestPath(id));
  await step(1, async () => {
    await page.locator('button[data-bs-target="#moveDifferentialProductSearchModal"]').click();
    await expect(page.locator("#moveDifferentialProductSearchModal"), "商品検索モーダル").toBeVisible();
  });
  const modal = page.locator("#moveDifferentialProductSearchModal");
  await step(2, async () => {
    await modal.locator("#admin_search_product_id").fill(code);
    const res = page.waitForResponse((r) => r.request().method() === "POST" && /\/search\/product/.test(new URL(r.url()).pathname), { timeout: 60_000 });
    await modal.locator("#moveDifferentialProductSearchModalButton").click();
    expect((await res).status(), "検索の応答").toBe(200);
    await page.waitForTimeout(500);
    note(`カテゴリの選択欄: 「${clean(await modal.locator("#admin_search_product_category_id option:checked").first().innerText().catch(() => ""))}」が選ばれている・検索結果の行 ${await modal.locator("#moveDifferentialProductSearchModalList tr").count()} 件`);
  });
  await step(3, async () => {
    const row = modal.locator("#moveDifferentialProductSearchModalList tr").filter({ has: page.locator('select[name="product_class"] option', { hasText: code }) });
    await expect(row, `検索結果の ${code} の行`).toHaveCount(1);
    const opts = await row.locator('select[name="product_class"] option').allInnerTexts();
    await row.locator('select[name="product_class"]').selectOption({ label: opts.find((o) => o.includes(code))! });
    await Promise.all([page.waitForEvent("load", { timeout: 60_000 }), row.locator("button.add-order-item").click()]);
    await page.waitForLoadState("load");
    const m = await topMessages(page);
    note(`決定の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await expected(async () => {
    expect.soft(inboundRequestPath(id).test(new URL(page.url()).pathname), `移動入庫承認申請画面（${page.url()}）`).toBe(true);
    const row = new InboundRequestPage(page).row(code);
    await expect(row, `差分商品 ${code} の行`).toHaveCount(1);
    const cells = (await row.locator("td").allInnerTexts()).map(clean);
    note(`差分商品の行: ${cells.join(" | ")}`);
    expect.soft(cells[0], "商品名と商品コード").toBe(`${code} ${code}`);
    expect.soft(cells[1], "言語").toBe("日本語");
    expect.soft(cells[2], "状態").toBe("NM");
    expect.soft(cells[4], "基準価格").toBe("¥1,000");
  });
});

caseTest("IT-M04-09-196", async ({ page, browser, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-196〕");
  const code = "M0409-CB196-B";
  await step(1, async () => { await openViaList(page, id, inboundRequestPath(id)); });
  await step(2, async () => {
    const ctx = await browser.newContext();
    try {
      await hideDebugToolbar(ctx);
      const other = await ctx.newPage();
      await loginAdmin(other, M0409_APP);
      await openViaList(other, id, inboundRequestPath(id));
      // 手順2（裁定 E11・2026-10-23）: 承認通知先の所属は選ばず（指定なしのまま）、メンバーに M04-09承認者 を選ぶ
      await chooseApprovalTarget(other, "admin_stock_move_inbound_approval_request", "", [承認者名]);
      await other.locator("#stock_move_inbound_approval_request_submit_btn").click();
      const modal = other.locator("#stockMoveInboundConfirmModal");
      await expect(modal, "承認申請の確認モーダル").toBeVisible();
      await Promise.all([other.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
      const m = await topMessages(other);
      note(`別のブラウザの承認申請の結果: ${other.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」・ステータス ${dbm.在庫移動振替(id)?.ステータス}`);
      expect(dbm.在庫移動振替(id)?.ステータス, "別のブラウザの承認申請で入庫承認待ちになる").toBe("入庫承認待ち");
    } finally {
      await ctx.close();
    }
  });
  await step(3, async () => {
    await addDiffProduct(page, code);
    const m = await topMessages(page);
    note(`差分商品追加の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  });
  await step(4, async () => { note(`DBの明細: ${JSON.stringify(dbm.明細(id))}`); });
  await expected(async () => {
    const m = await topMessages(page);
    expect.soft(m.エラー, "管理画面上部のメッセージ").toContain("差分CSV登録可能なステータスではありません。");
    expect.soft(dbm.明細(id).map((d) => d.振替先商品コード), `明細に ${code} が登録されない`).not.toContain(code);
  });
});

// ---------------------------------------------------------------- 商品検索モーダル（差分商品追加・振替先の検索）

/**
 * 商品検索モーダルで、商品名・商品コード・商品ID・カテゴリの順に指定して検索する（053・069）。
 * モーダルには商品名・商品コード・商品IDを分けた欄が無く、1つの欄（商品ID・商品名・商品コードのいずれか）とカテゴリの選択欄がある。
 * 商品名・商品コード・商品IDは、その欄に1つずつ入れて検索する（ほかの条件は空にする）。カテゴリは欄を空にしてカテゴリを選んで検索する。
 */
async function searchEach(page: Page, modalSel: string, buttonSel: string, listSel: string, productId: string, 語: { 商品名: string; 商品コード: string }, カテゴリ: string):
  Promise<{ 条件: string; 出たか: boolean }[]> {
  const modal = page.locator(modalSel);
  const box = modal.locator("#admin_search_product_id");
  const cat = modal.locator("#admin_search_product_category_id");
  note(`商品検索モーダルの欄: 「${await box.getAttribute("placeholder")}」とカテゴリの選択欄（商品名・商品コード・商品IDを分けた欄は無い）`);
  const out: { 条件: string; 出たか: boolean }[] = [];
  const run = async (条件: string, text: string, category: string) => {
    await box.fill(text);
    if (category) await chooseByLabelLoose(cat, category);
    else if (await cat.locator('option[value=""]').count()) await cat.selectOption("");
    else note(`カテゴリの選択欄に「指定なし」の選択肢が無く、「${clean(await cat.locator("option:checked").first().innerText().catch(() => ""))}」が選ばれたまま検索した`);
    const list = modal.locator(listSel);
    await list.evaluate((n) => { n.innerHTML = ""; });
    const res = page.waitForResponse((r) => r.request().method() === "POST" && /\/search\/product/.test(new URL(r.url()).pathname), { timeout: 60_000 });
    await modal.locator(buttonSel).click();
    expect((await res).status(), `${条件}の検索の応答`).toBe(200);
    await page.waitForTimeout(500);
    const 出たか = (await list.locator(`button.add-order-item[data-product-id="${productId}"]`).count()) === 1;
    out.push({ 条件, 出たか });
  };
  await run(`商品名「${語.商品名}」`, 語.商品名, "");
  await run(`商品コード「${語.商品コード}」`, 語.商品コード, "");
  await run(`商品ID「${productId}」`, productId, "");
  await run(`カテゴリ「${カテゴリ}」`, "", カテゴリ);
  note(`各検索の結果: ${out.map((o) => `${o.条件}→${o.出たか ? "出た" : "出ない"}`).join(" / ")}`);
  return out;
}

async function chooseByLabelLoose(select: Locator, label: string): Promise<void> {
  const opts = await select.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, l: (n.textContent ?? "").replace(/\s+/g, " ").trim() })));
  const hit = opts.filter((o) => o.l.replace(/^[　\s└├─┗-]+/, "") === label);
  if (hit.length !== 1) throw new Error(`カテゴリの選択肢に「${label}」が${hit.length}件（${opts.map((o) => o.l).join("、")}）`);
  await select.selectOption(hit[0].v);
}

caseTest("IT-M04-09-053", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-053〕");
  const productId = notes.get("〔商品ID-M0409-共有〕");
  let found: { 条件: string; 出たか: boolean }[] = [];
  let option = "";
  await openViaList(page, id, inboundRequestPath(id));
  await step(1, async () => {
    await page.locator('button[data-bs-target="#moveDifferentialProductSearchModal"]').click();
    await expect(page.locator("#moveDifferentialProductSearchModal"), "商品検索モーダル").toBeVisible();
  });
  await step(2, async () => {
    found = await searchEach(page, "#moveDifferentialProductSearchModal", "#moveDifferentialProductSearchModalButton", "#moveDifferentialProductSearchModalList", productId, { 商品名: "差分候補", 商品コード: "DIFF" }, "試験カテゴリA");
  });
  await step(3, async () => {
    const row = page.locator("#moveDifferentialProductSearchModalList tr").filter({ has: page.locator(`button.add-order-item[data-product-id="${productId}"]`) });
    await expect(row, "M409-DIFF-01 の行").toHaveCount(1);
    const opts = await row.locator('select[name="product_class"] option').allInnerTexts();
    option = clean(opts.find((o) => o.includes("M409-DIFF-01")) ?? "");
    note(`商品コードの選択肢: ${opts.map(clean).join(" / ")}`);
    await row.locator('select[name="product_class"]').selectOption({ label: opts.find((o) => o.includes("M409-DIFF-01"))! });
  });
  await expected(async () => {
    expect.soft(found.filter((f) => !f.出たか).map((f) => f.条件), "各検索で M409-DIFF-01 が表示される").toEqual([]);
    for (const w of ["日本語", "M409DIFF01"]) expect.soft(option, `商品コードの選択肢に「${w}」`).toContain(w);
    // 期待結果は状態の表示の形を決めていない。状態（ニアミント）が名前か略号で出ていること
    expect.soft(option, "商品コードの選択肢に状態（ニアミント・NM）").toMatch(/ニアミント|NM/);
    expect.soft(option, "商品コードの選択肢に基準価格").toMatch(/1,?000/);
  });
});

caseTest("IT-M04-09-069", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const src = "M409-TR-A-069";
  const dest = "M409-TR-TO-A-069";
  const productId = notes.get("〔商品ID-M0409-069〕");
  const form = await openTransferNew(page, [src]);
  let found: { 条件: string; 出たか: boolean }[] = [];
  let option = "";
  await step(1, async () => {
    await form.row(src).locator(".btn-transfer-product-search").click();
    await expect(page.locator("#stockTransferProductModal"), "商品検索モーダル").toBeVisible();
  });
  await step(2, async () => {
    found = await searchEach(page, "#stockTransferProductModal", "#searchProductModalButton", "#searchProductModalList", productId, { 商品名: "振替候補", 商品コード: "TR-TO" }, "試験カテゴリA");
  });
  await step(3, async () => {
    const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`button.add-order-item[data-product-id="${productId}"]`) });
    await expect(row, `${dest} の行`).toHaveCount(1);
    const opts = await row.locator('select[name="product_class"] option').allInnerTexts();
    option = clean(opts.find((o) => o.includes(dest)) ?? "");
    note(`商品コードの選択肢: ${opts.map(clean).join(" / ")}`);
    await row.locator('select[name="product_class"]').selectOption({ label: opts.find((o) => o.includes(dest))! });
    const res = page.waitForResponse((r) => r.url().includes("/dest-product-class-info"), { timeout: 30_000 }).catch(() => null);
    await row.locator("button.add-order-item").click();
    await res;
  });
  await expected(async () => {
    expect.soft(found.filter((f) => !f.出たか).map((f) => f.条件), `各検索で ${dest} が表示される`).toEqual([]);
    for (const w of [dest, "日本語", "M409TRTOA069"]) expect.soft(option, `選択肢に「${w}」`).toContain(w);
    // 期待結果は状態の表示の形を決めていない。状態（ニアミント）が名前か略号で出ていること
    expect.soft(option, "選択肢に状態（ニアミント・NM）").toMatch(/ニアミント|NM/);
    expect.soft(option, "選択肢に基準価格").toMatch(/1,?000/);
    await expect.soft(form.dest(src), "決定後の振替先商品コード").toHaveValue(dest);
  });
});

// ---------------------------------------------------------------- 在庫振替の初期登録画面（カードを指定した商品）

/** 状態の表示名（在庫検索一覧は名前、在庫振替登録画面は略号で出す）を略号にそろえる。状態のマスターの名前と略号の組 */
const CONDITION_CODE: Record<string, string> = { ニアミント: "NM", スライトリープレイド: "SP", モデレトリープレイド: "MP", ヘビープレイド: "HP", その他: "OT" };
const conditionCode = (v: string) => CONDITION_CODE[v] ?? v;

/** 在庫検索一覧の行の表示（商品名・言語・状態）。比べる値として読む（データは変えない） */
async function stockRowInfo(page: Page, code: string): Promise<{ 商品名: string; 言語: string; 状態: string }> {
  await searchStock(page, 店A, "EC-CUBE", code);
  const row = page.locator("table tbody tr").filter({ has: page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) });
  await expect(row, `在庫検索一覧の ${code} の行`).toHaveCount(1);
  const nameCell = clean(await row.locator("td.col-name").innerText());
  return { 商品名: clean(nameCell.replace(code, "")), 言語: clean(await row.locator("td.col-lang").innerText()), 状態: clean(await row.locator("td.col-cond").innerText()) };
}

caseTest("IT-M04-09-067", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const [a, b] = ["M409-TR-A-067", "M409-TR-B-067"];
  const ref = { [a]: await stockRowInfo(page, a), [b]: await stockRowInfo(page, b) };
  note(`在庫検索一覧の表示（比べる値）: ${JSON.stringify(ref)}`);
  await step(1, async () => {
    await searchStock(page, 店A, "EC-CUBE", commonOf(a, b));
    await checkStockRows(page, [b, a], 店A, "EC-CUBE");
  });
  await step(2, async () => {
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, "在庫振替初期登録画面へ移る").toBe(true);
    await new TransferNewPage(page).ready();
  });
  await expected(async () => {
    const info = await moveInfo(page);
    const basic = clean(await page.locator("#stockTransferBasicInfo").innerText());
    note(`在庫移動・振替情報: ${JSON.stringify(info)}`);
    expect.soft(info["移動タイプ"], "移動タイプ").toBe("在庫振替");
    expect.soft(basic, "店舗").toContain(`店舗 ${店A}`);
    expect.soft(basic, "在庫区分").toMatch(/在庫区分 EC-CUBE/);
    // 承認通知先の欄（所属・メンバー。メンバーの欄の select2 が名前の無い検索の入力欄を持つ）は除き、名前のある入力欄を数える
    const editable = await page.locator("#stockTransferBasicInfo").locator("select[name], input[name], textarea[name]").evaluateAll((es) => es
      .filter((e) => (e as HTMLInputElement).type !== "hidden" && !/approval/.test((e as HTMLInputElement).name)).map((e) => (e as HTMLInputElement).name));
    note(`在庫振替の基本情報の入力欄（承認通知先を除く）: ${editable.join("、") || "なし"}`);
    expect.soft(editable, "店舗・在庫区分は変更できない（入力欄が無い）").toEqual([]);
    const rows = await page.locator("#stockTransferNewTransferTbody > tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll("td")).slice(0, 5).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim()).concat([(tr.querySelectorAll("td")[11]?.textContent ?? "").trim()])));
    note(`振替元の行（上から）: ${JSON.stringify(rows)}`);
    expect.soft(rows.map((r) => r[0].split(" ").pop()), "振替元が商品コードの昇順").toEqual([a, b]);
    for (const [i, code] of [a, b].entries()) {
      const r = rows[i] ?? [];
      expect.soft(r[0], `${code} の日本語商品名`).toBe(`${ref[code].商品名} ${code}`);
      expect.soft(r[1], `${code} の言語`).toBe(ref[code].言語);
      expect.soft(r[2], `${code} の状態（在庫検索一覧の「${ref[code].状態}」の略号）`).toBe(conditionCode(ref[code].状態));
      expect.soft(r[3], `${code} のFoil`).not.toBe("");
      expect.soft(r[4], `${code} の基準価格`).toBe("¥1,000");
      expect.soft(r[5], `${code} の在庫数`).toBe("10");
    }
  });
});

caseTest("IT-M04-09-068", async ({ page, step, expected }) => {
  await login(page, M0409_OP);
  const [src, dest] = ["M409-TR-A-068", "M409-TR-TO-A-068"];
  const ref = await stockRowInfo(page, dest);
  note(`振替先の在庫検索一覧の表示（比べる値）: ${JSON.stringify(ref)}`);
  const form = await openTransferNew(page, [src]);
  await step(1, async () => { await form.dest(src).fill(dest); });
  await step(2, async () => {
    const res = page.waitForResponse((r) => r.url().includes("/dest-product-class-info"), { timeout: 30_000 }).catch(() => null);
    await form.dest(src).blur();
    await res;
  });
  await expected(async () => {
    await expect.poll(async () => (await form.destInfo(src))["product_name_code"], { timeout: 15_000 }).not.toBe("");
    const d = await form.destInfo(src);
    note(`振替先の表示: ${JSON.stringify(d)}`);
    expect.soft(d["product_name_code"], "商品名").toContain(ref.商品名);
    expect.soft(d["card_condition"], `状態（在庫検索一覧の「${ref.状態}」の略号）`).toBe(conditionCode(ref.状態));
    expect.soft(d["foil"], "Foil").not.toBe("");
    expect.soft(d["standard_price"], "基準価格").toMatch(/1,?000/);
  });
});
