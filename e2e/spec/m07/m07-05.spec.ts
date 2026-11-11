/**
 * M07-05 入金CSV出力。正本: cases/M07-05_test_cases.tsv
 *
 * 実装していないケース（理由は報告）:
 * - 002: 銀行コード・支店コード・口座種別の値と、受理合計価格・明細金額の食い違う状態を画面で作れない（サプライ品を作るグッズ商品CSV登録は不具合 ECCUBE_HARERUYA-3966 に当たる）。
 * - 013・014: CSV出力設定を共有の設定から区切り文字タブ・文字コード SJIS-win へ書き換えるケースのため、共有の設定を書き換えない方針で実装しない。
 * 実装したケースのうち CSV の中身を読むもの（003・005・006・012）は、CSV出力設定（UTF-8・カンマ・二重引用符）を書き換えず、いまの設定のまま読む。
 * 開発者ツールの操作（チェックボックスの値の書き換え・Console のスクリプト）は、正本の手順どおり、画面のスクリプト実行（page.evaluate）で同じ内容を実行する。
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { M0701ListPage } from "../../pages/admin/m07_01_list";
import { M0705_ADMIN, 注文者名 } from "../../seeds/m07-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 番 = (n: string) => String(Number(n));

/** ダウンロードの発生を数える（ブラウザのダウンロード履歴の代わり） */
function ダウンロードを数える(page: Page): { 件数: () => number } {
  let n = 0;
  page.on("download", () => { n++; });
  return { 件数: () => n };
}

async function 始める(page: Page): Promise<M0701ListPage> {
  await loginAdmin(page, M0705_ADMIN);
  return new M0701ListPage(page);
}

async function 名前で検索する(l: M0701ListPage, 姓: string): Promise<void> {
  await l.open();
  await l.注文者名を入れる(注文者名(姓));
  await l.検索する();
}

async function 番号で検索する(l: M0701ListPage, 番号: string): Promise<void> {
  await l.open();
  await l.買取番号を入れる(番号);
  await l.検索する();
}

/** 開発者ツールで、買取番号のチェックボックスの値を書き換える */
async function 値を書き換える(page: Page, 番号: string, 値: string): Promise<void> {
  const n = await page.evaluate(([id, v]) => {
    const c = document.querySelector(`input.searched_buy_order_id[buyOrderId="${id}"]`) as HTMLInputElement | null;
    if (!c) return 0;
    c.value = v;
    return 1;
  }, [番, 値] as const);
  expect(n, `買取番号 ${番} のチェックボックス`).toBe(1);
}

/** 開発者ツールのConsoleで、入金CSVの送信先を指定して送信する（チェックボックスのチェックはそのまま） */
async function Consoleで送信する(page: Page): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }),
    page.evaluate(() => {
      const f = document.getElementById("bulk_csv_export") as HTMLFormElement;
      f.action = (document.getElementById("csvexport_deposit") as HTMLButtonElement).formAction;
      f.submit();
    }),
  ]);
  await page.waitForTimeout(2_000);
}

async function 現在のページ(page: Page): Promise<string> {
  return ((await page.locator("ul.pagination li.active").first().innerText().catch(() => "")) || "").trim();
}

// ---- 003: 本人確認区分 ----
caseTest("IT-M07-05-003", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const ids = ["A", "B", "C", "D"].map((x) => notes.get(`〔買取注文ID-M0705-003${x}〕`));
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  await step(1, async () => { await 名前で検索する(l, "M0705STATUS003"); });
  await step(2, async () => { for (const id of ids) await l.対象にする(id); });
  await step(3, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    expect(r.file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    csv = await CSVを読む(r.file!);
  });
  await step(4, async () => { expect(csv, "入金CSVを読めた").not.toBeNull(); });
  await expected(async () => {
    note("4人の会員の注文者名（姓）は共通の値（実行の印つき）にした。CSV出力設定は共有の設定のため書き換えず、いまの設定のまま読んだ");
    const 期待 = ["未確認", "確認中", "オンライン本人確認済み", "簡易書留確認済み"];
    for (const [i, id] of ids.entries()) {
      const r = csv!.行.find((x) => 番(x["受注番号"] ?? "") === 番(id));
      expect.soft(r?.["オンライン本人確認区分"] ?? "（行が無い）", `〔買取注文ID-M0705-003${"ABCD"[i]}〕のオンライン本人確認区分`).toBe(期待[i]);
    }
  });
});

// ---- 005: 選択した買取だけ・昇順 ----
caseTest("IT-M07-05-005", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取注文ID-M0705-005A〕"), B = notes.get("〔買取注文ID-M0705-005B〕");
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  await step(1, async () => { await 名前で検索する(l, "M0705SEL005"); });
  await step(2, async () => { await l.対象にする(B); await l.対象にする(A); });
  await step(3, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    expect(r.file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    csv = await CSVを読む(r.file!);
  });
  await step(4, async () => { expect(csv, "入金CSVを読めた").not.toBeNull(); });
  await expected(async () => {
    note("CSV出力設定は共有の設定のため書き換えず、いまの設定のまま読んだ");
    expect.soft(csv!.行.map((r) => 番(r["受注番号"] ?? "")), "CSVのデータ行の買取番号（選択した2件だけが1件1行で、昇順）").toEqual([番(A), 番(B)]);
  });
});

// ---- 006: 存在しないIDを含めても、存在する行だけ ----
caseTest("IT-M07-05-006", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取注文ID-M0705-006A〕"), B = notes.get("〔買取注文ID-M0705-006B〕");
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  await step(1, async () => { await 名前で検索する(l, "M0705SEL006"); });
  await step(2, async () => { await l.対象にする(A); await l.対象にする(B); });
  await step(3, async () => { await 値を書き換える(page, 番(B), "970599006"); });
  await step(4, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    expect(r.file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    csv = await CSVを読む(r.file!);
  });
  await step(5, async () => { expect(csv, "入金CSVを読めた").not.toBeNull(); });
  await expected(async () => {
    note("CSV出力設定は共有の設定のため書き換えず、いまの設定のまま読んだ");
    const ids = csv!.行.map((r) => 番(r["受注番号"] ?? ""));
    expect.soft(ids, "CSVのデータ行の買取番号（存在する〔買取注文ID-M0705-006A〕の1行だけ）").toEqual([番(A)]);
    expect.soft(ids.includes("970599006"), "存在しないID 970599006の行を含む").toBe(false);
  });
});

// ---- 007: 未選択のまま送信 ----
caseTest("IT-M07-05-007", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取注文ID-M0705-007〕");
  await 番号で検索する(l, 番号);
  const d = ダウンロードを数える(page);
  await step(1, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { expect(d.件数(), "記録を始めた時点のダウンロード数").toBe(0); });
  await step(3, async () => { await Consoleで送信する(page); });
  await step(4, async () => { await page.waitForTimeout(1_000); });
  await expected(async () => {
    expect.soft(d.件数(), "新しく追加されたCSVファイルの数（ダウンロード履歴）").toBe(0);
  });
});

// ---- 008: 未選択のまま送信 → 2ページ目へ戻る ----
async function 二ページ目を開く(l: M0701ListPage, 姓: string): Promise<void> {
  await l.open();
  await l.注文者名を入れる(注文者名(姓));
  await l.検索する();
  await l.件数を選ぶ(10);
  await l.並べかえる("買取番号", "昇順");
  await l.ページを開く(2);
}

caseTest("IT-M07-05-008", async ({ page, step, expected }) => {
  const l = await 始める(page);
  await 二ページ目を開く(l, "入金CSVページ保持-008");
  const d = ダウンロードを数える(page);
  await step(1, async () => {
    expect(await 現在のページ(page), "いま開いているページ").toBe("2");
    expect(await page.locator("input.searched_buy_order_id:checked").count(), "選択している買取情報の数").toBe(0);
  });
  await step(2, async () => { await Consoleで送信する(page); });
  await expected(async () => {
    expect.soft(await 現在のページ(page), "送信後に開いている買取一覧(検索結果)のページ（2ページ目）").toBe("2");
    expect.soft(d.件数(), "ダウンロードされたファイルの数").toBe(0);
  });
});

// ---- 009: 存在しないIDだけ ----
caseTest("IT-M07-05-009", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取注文ID-M0705-009〕");
  await 番号で検索する(l, 番号);
  const d = ダウンロードを数える(page);
  await step(1, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await l.対象にする(番号); });
  await step(3, async () => { await 値を書き換える(page, 番(番号), "970599009"); });
  await step(4, async () => { expect(d.件数(), "記録を始めた時点のダウンロード数").toBe(0); });
  await step(5, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    note(`入金CSVを押した結果: ファイル ${r.file ? "あり" : "なし"}・応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ") || "なし"}`);
  });
  await step(6, async () => { await page.waitForTimeout(1_000); });
  await expected(async () => {
    expect.soft(d.件数(), "新しく追加されたCSVファイルの数（ダウンロード履歴）").toBe(0);
  });
});

// ---- 010: 存在しないIDを選んだら2ページ目へ戻る ----
caseTest("IT-M07-05-010", async ({ page, step, expected }) => {
  const l = await 始める(page);
  await 二ページ目を開く(l, "入金CSVページ保持-010");
  let 行の番号: string[] = [];
  await step(1, async () => {
    行の番号 = (await l.行()).map((r) => r.番号);
    expect(行の番号.length, "2ページ目に表示されている買取情報の数").toBeGreaterThan(0);
    for (const id of 行の番号) await l.対象にする(id);
  });
  await step(2, async () => { for (const id of 行の番号) await 値を書き換える(page, id, "970599010"); });
  await step(3, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    note(`入金CSVを押した結果: ファイル ${r.file ? "あり" : "なし"}・応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(await 現在のページ(page), "押した後に開いている買取一覧(検索結果)のページ（2ページ目）").toBe("2");
  });
});

// ---- 011: 値を 0 に ----
caseTest("IT-M07-05-011", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取注文ID-M0705-011〕");
  await 番号で検索する(l, 番号);
  const d = ダウンロードを数える(page);
  await step(1, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await l.対象にする(番号); });
  await step(3, async () => { await 値を書き換える(page, 番(番号), "0"); });
  await step(4, async () => { expect(d.件数(), "記録を始めた時点のダウンロード数").toBe(0); });
  await step(5, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    note(`入金CSVを押した結果: ファイル ${r.file ? "あり" : "なし"}・応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ") || "なし"}`);
  });
  await step(6, async () => { await page.waitForTimeout(1_000); });
  await expected(async () => {
    expect.soft(d.件数(), "新しく追加されたCSVファイルの数（ダウンロード履歴）").toBe(0);
  });
});

// ---- 012: ファイル名 ----
caseTest("IT-M07-05-012", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取注文ID-M0705-012A〕"), B = notes.get("〔買取注文ID-M0705-012B〕");
  let 名 = "";
  await step(1, async () => { await 名前で検索する(l, "M0705SEL012"); });
  await step(2, async () => { await l.対象にする(B); await l.対象にする(A); });
  await step(3, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    expect(r.file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    名 = r.file!.suggestedFilename();
  });
  await step(4, async () => { expect(名, "ダウンロードしたCSVのファイル名").not.toBe(""); });
  await expected(async () => {
    const 先頭 = `purchase_bank_deposit_${番(A).padStart(7, "0")}_`;
    note(`ファイル名: ${名}`);
    expect.soft(名.startsWith(先頭), `ファイル名が「${先頭}」で始まる`).toBe(true);
    expect.soft(名.endsWith(".csv"), "拡張子が「.csv」").toBe(true);
  });
});
