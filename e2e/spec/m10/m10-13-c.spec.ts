/** M10-13 カスタムCSV出力設定の続き（006〜015・018・025・026・029・030・034・035・038〜041）。正本: integration_test/casegen/cases/M10-13_test_cases.tsv
 * 実装しない: 004（既存の定義を全部削除する）・027・028・031（受注・配送の検索対象を作れない）・036・037（在庫移動・振替/在庫分割結合の出力項目が無い）。理由は報告に残す。
 * 流し終えた m10-13.spec.ts・m10-13-b.spec.ts は触らないので、新しいファイルに書く。 */
import { test, expect as pwExpect } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { CustomCsvPage, ProductCustomCsvPage, 在庫カスタムCSV出力を押して選択肢を読む } from "../../pages/admin/m10_13_custom_csv";
import { openStockList, resultCount, searchByCode } from "../../pages/admin/m04_16_recommend_csv";
import { 出力項目の属性, 定義の出力項目, 定義を読む } from "../../db/m10_13";
import { M1013_ADMIN } from "../../seeds/m10-13";
import { M1013L_ADMIN, 既存商品名, 商品コードP, 商品コード039, 商品検索CSV名, 在庫商品コード } from "../../seeds/m10-13-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 注記_項目 = "出力項目は、正本の「CSV公開状態」「CSV商品コード」（画面に無い）の代わりに、画面にある「公開ステータス名称」「商品コード」にしたシードの上で行った";
const 公開 = "公開ステータス名称";
const コード = "商品コード";
const 新規 = "新規作成";
const 同じ集合 = (a: string[]) => [...a].sort();

/** 商品CSVの既存の定義 0NN を開く（種別は初期値の商品CSV） */
async function 既存を開く(p: CustomCsvPage, n: string): Promise<void> {
  await p.open();
  await p.定義を選ぶ(既存商品名(n));
}

// ---- 006〜008: 表示 ----
caseTest("IT-M10-13-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 出力: string[] = [], 非出力: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.種別を選ぶ("商品CSV"); });
  await step(3, async () => { await p.定義を選ぶ(既存商品名("006")); });
  await step(4, async () => {
    出力 = await p.出力する項目名(); 非出力 = await p.出力しない項目名();
    note("正本の「CSV公開状態」（無効）「CSV商品コード」（有効）「CSV商品名」（無効）「CSV商品ID」（有効）は画面に無い。有効・無効を確かめるため、出力側を無効の「送料」と有効の「商品コード」にした。出力しない側は画面の項目の並び順（商品IDが先頭）なので、「商品名」「商品ID」の並びは確かめず、無効の「税率」と有効の「商品ID」が含まれることを確かめた");
  });
  await expected(async () => {
    expect.soft(出力, "CSV出力する項目（上から）").toEqual(["送料", コード]);
    expect.soft(非出力.includes("税率") && 非出力.includes("商品ID") && !非出力.includes("送料") && !非出力.includes(コード), "CSV出力しない項目に、無効の「税率」と有効の「商品ID」が含まれ、出力側の項目は含まれない").toBe(true);
    expect.soft(出力.includes("送料") && 出力.includes(コード) && 非出力.includes("税率") && 非出力.includes("商品ID"), "有効・無効の出力項目が両方のリストに含まれる（無効: 送料・税率／有効: 商品コード・商品ID）").toBe(true);
  });
});

function 未保存の編集(n: string, 別の画面へ: "種別" | "定義", 予備?: string): (ctx: import("../../lib/case").CaseCtx) => Promise<void> {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1013_ADMIN);
    const p = new CustomCsvPage(page);
    const 元の名 = 既存商品名(n);
    await step(1, async () => { await 既存を開く(p, n); });
    await step(2, async () => { await p.名前.fill("未保存名称"); });
    await step(3, async () => { await p.出力しない項目を選ぶ(["商品名(日)"]); await p.右向きの項目移動を押す(); });
    if (別の画面へ === "種別") {
      await step(4, async () => { await p.種別を選ぶ("受注CSV"); });
      await step(5, async () => { await p.種別を選ぶ("商品CSV"); await p.定義を選ぶ(元の名); });
    } else {
      await step(4, async () => { await p.定義を選ぶ(予備!); });
      await step(5, async () => { await p.定義を選ぶ(元の名); });
    }
    await expected(async () => {
      expect.soft(await p.名前.inputValue(), "名前").toBe(元の名);
      expect.soft(await p.出力する項目名(), "CSV出力する項目（上から）").toEqual([公開, コード]);
    });
    note(`${注記_項目}。「CSV商品名」は「商品名(日)」にした`);
  };
}
caseTest("IT-M10-13-007", 未保存の編集("007", "種別"));
caseTest("IT-M10-13-008", 未保存の編集("008", "定義", rc("商品CSV予備-008")));

// ---- 009: 新規作成（在庫CSV）----
caseTest("IT-M10-13-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const 名 = rc("在庫CSV設定A1");
  let id = "";
  let d = { 件数: -1, 名称: null as string | null, 種別: null as string | null, 更新者: null as string | null };
  await step(1, async () => { await p.open(); await p.定義を選ぶ(新規); });
  await step(2, async () => { await p.種別を選ぶ("在庫CSV"); });
  await step(3, async () => { await p.名前.fill(名); });
  await step(4, async () => { await p.項目を出力へ移す(コード); note("正本の「CSV在庫コード」（画面に無い）の代わりに、在庫CSVの画面にある「商品コード」を移した。定義の名称は実行の印つきにした"); });
  await step(5, async () => { id = await p.設定する("在庫CSVのカスタム定義の登録"); });
  await step(6, async () => { d = 定義を読む({ id }); });
  await expected(async () => {
    expect.soft(d.件数, "追加されたカスタム出力定義の数").toBe(1);
    expect.soft(d.名称, "名称").toBe(名);
    expect.soft(d.種別, "種別").toBe("在庫CSV");
    expect.soft(d.更新者, "更新者").toBe("M10-13試験管理者");
  });
});

// ---- 010〜014: 更新（DB確認）----
caseTest("IT-M10-13-010", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const id = () => notes.get("〔カスタム定義ID-M1013-010〕");
  let 関連: string[] = [];
  await step(1, async () => { await 既存を開く(p, "010"); });
  await step(2, async () => { await p.出力しない項目を選ぶ(["商品名(日)", "商品ID"]); });
  await step(3, async () => { await p.右向きの項目移動を押す(); });
  await step(4, async () => { await p.設定する("カスタム定義の更新"); });
  await step(5, async () => { 関連 = 定義の出力項目({ id: id() }); note(`${注記_項目}。「CSV商品名」は「商品名(日)」、「CSV商品ID」は「商品ID」にした。移した2項目は画面の並び順（商品ID、商品名(日)）で後ろに足されるので、4件の並びは問わず、4件であることを確かめた`); });
  await expected(async () => {
    expect.soft(関連.length, "出力項目の関連の数").toBe(4);
    expect.soft(同じ集合(関連), "出力項目の関連（公開ステータス名称・商品コード・商品名(日)・商品ID）").toEqual(同じ集合([公開, コード, "商品名(日)", "商品ID"]));
  });
});

caseTest("IT-M10-13-011", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 順: string[] = [];
  await step(1, async () => { await 既存を開く(p, "011"); });
  await step(2, async () => { await p.出力する項目を選ぶ([公開]); });
  await step(3, async () => { await p.下向きの順序入替を押す(); });
  await step(4, async () => { await p.設定する("カスタム定義の更新"); });
  await step(5, async () => { 順 = 定義の出力項目({ id: notes.get("〔カスタム定義ID-M1013-011〕") }); note(注記_項目); });
  await expected(async () => { expect.soft(順, "出力順序（上から）").toEqual([コード, 公開]); });
});

caseTest("IT-M10-13-012", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 関連: string[] = [];
  await step(1, async () => { await 既存を開く(p, "012"); });
  await step(2, async () => { await p.出力する項目を選ぶ([公開]); await p.左向きの項目移動を押す(); });
  await step(3, async () => { await p.出力しない項目を選ぶ(["商品名(日)"]); await p.右向きの項目移動を押す(); });
  await step(4, async () => { await p.設定する("カスタム定義の更新"); });
  await step(5, async () => { 関連 = 定義の出力項目({ id: notes.get("〔カスタム定義ID-M1013-012〕") }); note(`${注記_項目}。「CSV商品名」は「商品名(日)」にした`); });
  await expected(async () => { expect.soft(関連, "出力項目の関連（保存前の関連が置き換わった結果）").toEqual([コード, "商品名(日)"]); });
});

caseTest("IT-M10-13-013", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const id = () => notes.get("〔カスタム定義ID-M1013-013〕");
  let d = { 件数: -1, 名称: null as string | null, 種別: null as string | null, 更新者: null as string | null };
  let 関連: string[] = [];
  await step(1, async () => { await 既存を開く(p, "013"); });
  await step(2, async () => { await p.名前.fill(""); });
  await step(3, async () => { await p.出力する項目を選ぶ([公開, コード]); await p.左向きの項目移動を押す(); });
  await step(4, async () => {
    const 送信 = await p.名前の必須チェックに掛かるか();
    const status = await p.設定ボタンを押して応答を待つ();
    note(`${注記_項目}。名前を空にして設定ボタンを押した結果: ${status === null ? "保存の要求が送られなかった（ブラウザの必須チェックで止まった: " + (送信 ? "名前が空" : "原因不明") + "）" : "保存の要求の応答 " + status}`);
  });
  await step(5, async () => { d = 定義を読む({ id: id() }); 関連 = 定義の出力項目({ id: id() }); });
  await expected(async () => {
    expect.soft(d.名称 ?? "", "対象定義の名称（空で保存される）").toBe("");
    expect.soft(関連.length, "出力項目の関連の数").toBe(0);
  });
});

caseTest("IT-M10-13-014", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  void notes;
  let 前: string[] = [], 後: string[] = [];
  await step(1, async () => { 前 = 出力項目の属性("1"); });
  await step(2, async () => { await 既存を開く(p, "014"); });
  await step(3, async () => { await p.出力する項目を選ぶ([公開]); await p.左向きの項目移動を押す(); });
  await step(4, async () => { await p.出力しない項目を選ぶ(["商品名(日)"]); await p.右向きの項目移動を押す(); });
  await step(5, async () => { await p.設定する("カスタム定義の更新"); });
  await step(6, async () => { 後 = 出力項目の属性("1"); note(`${注記_項目}。「CSV商品名」は「商品名(日)」にした。出力項目そのものは、商品CSVの全項目の表示名・有効・並び順を保存の前後で比べた`); });
  await expected(async () => {
    expect.soft(前.length > 0, "保存前に記録した出力項目の数が1以上").toBe(true);
    expect.soft(後, "保存後の商品CSVの出力項目（表示名・有効・並び順）が保存前と同じ").toEqual(前);
  });
});

// ---- 015・018 ----
caseTest("IT-M10-13-015", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const 新しい名 = rc("保存後遷移CSV");
  let 保存後のID = "";
  await step(1, async () => { await 既存を開く(p, "015"); });
  await step(2, async () => { await p.名前.fill(新しい名); });
  await step(3, async () => { 保存後のID = await p.設定する("カスタム定義の更新"); note(`${注記_項目}。定義の名称は実行の印つきにした`); });
  await expected(async () => {
    expect.soft(保存後のID, "保存後の画面のカスタム定義ID（保存した定義）").toBe(notes.get("〔カスタム定義ID-M1013-015〕"));
    expect.soft(await p.選択中の表示名(p.追加されたCSV選択), "追加されたCSV選択の選択中の値").toBe(新しい名);
    expect.soft(await p.名前.inputValue(), "名前").toBe(新しい名);
  });
});

caseTest("IT-M10-13-018", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let status = 0; let 表示された = false;
  await step(1, async () => { await 既存を開く(p, "018"); });
  await step(2, async () => {
    const id = notes.get("〔カスタム定義ID-M1013-018〕");
    const url = page.url().replace(new RegExp(`/${id}(\\?.*)?$`), "/999999");
    pwExpect(url, "表示中のURLの末尾が定義IDだった").toMatch(/\/999999$/);
    const res = await page.goto(url);
    status = res?.status() ?? 0;
    表示された = await p.CSV選択.isVisible().catch(() => false);
    note(注記_項目);
  });
  await expected(async () => {
    expect.soft(表示された, "カスタムCSV出力設定画面が表示されている").toBe(false);
    expect.soft(status, "HTTPの応答コード（エラー）").toBeGreaterThanOrEqual(400);
  });
});

// ---- 025〜030: 出力 ----
const 行 = (b: Buffer) => parseCsv(decodeCsvBytes(b));

caseTest("IT-M10-13-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const list = new ProductCustomCsvPage(page);
  let ヘッダ: string[] = [];
  let ファイル: Buffer = Buffer.alloc(0);
  await step(1, async () => { await 既存を開く(p, "025"); });
  await step(2, async () => { await p.出力する項目を選ぶ([公開]); });
  await step(3, async () => { await p.下向きの順序入替を押す(); });
  await step(4, async () => { await p.設定する("カスタム定義の更新"); });
  await step(5, async () => { await list.open(); await list.商品コードで検索する(商品コードP("001")); note("商品全件の出力を避けるため、商品コードを実行の印つきの「CSV-P-001」にして検索してから出力した（ヘッダ行の確認は変わらない）。" + 注記_項目); });
  await step(6, async () => { ファイル = (await list.ダウンロードする(既存商品名("025"))).バイト; });
  await step(7, async () => { ヘッダ = 行(ファイル)[0] ?? []; });
  await expected(async () => { expect.soft(ヘッダ, "ヘッダ行（保存した順序の2列だけ）").toEqual([コード, 公開]); });
});

caseTest("IT-M10-13-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const list = new ProductCustomCsvPage(page);
  let データ: string[][] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.商品コードで検索する(商品コードP("001")); });
  let バイト: Buffer = Buffer.alloc(0);
  await step(3, async () => { バイト = (await list.ダウンロードする(商品検索CSV名())).バイト; });
  await step(4, async () => { データ = 行(バイト).slice(1); note("出力項目は「商品コード」「商品名(日)」、商品コードは実行の印つきの「CSV-P-001」にした"); });
  await expected(async () => {
    expect.soft(データ.length, "データ行の数").toBe(1);
    expect.soft(データ[0]?.[0], "データ行の商品コード").toBe(商品コードP("001"));
  });
});

caseTest("IT-M10-13-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const list = new ProductCustomCsvPage(page);
  let バイト: Buffer = Buffer.alloc(0);
  await step(1, async () => { await list.open(); await list.商品コードで検索する(商品コードP("001")); note("検索結果があるときだけカスタムCSV出力のプルダウンが出るので、実行の印つきの商品コードで検索してから出力した"); });
  await step(2, async () => { バイト = (await list.ダウンロードする(商品検索CSV名())).バイト; });
  let utf8 = false; let 先頭行 = "";
  await step(3, async () => {
    try { 先頭行 = new TextDecoder("utf-8", { fatal: true }).decode(バイト).replace(/^﻿/, "").split(/\r?\n/)[0]; utf8 = true; } catch { utf8 = false; }
  });
  await expected(async () => {
    expect.soft(utf8, "CSVの文字コードがUTF-8（UTF-8として読める）").toBe(true);
    expect.soft(先頭行.includes(",") && !先頭行.includes("\t") && !先頭行.includes(";") && parseCsv(先頭行).flat().length === 2, `区切り文字がカンマ（ヘッダ行: ${先頭行}）`).toBe(true);
  });
});

caseTest("IT-M10-13-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const list = new ProductCustomCsvPage(page);
  let url = ""; let r = { ダウンロードされた: true, 応答: null as number | null };
  await step(1, async () => { await list.open(); await list.商品コードで検索する(商品コードP("001")); note("検索結果があるときだけカスタムCSV出力のプルダウンが出るので、実行の印つきの商品コードで検索した"); });
  await step(2, async () => { url = await list.要求先を読む(商品検索CSV名()); note(`開発者ツールの要求先に当たるものとして、プルダウンの選択肢の行き先を読んだ: ${new URL(url, page.url()).pathname}`); });
  await step(3, async () => { r = await list.定義IDを置き換えて開く(url, "999999"); });
  await expected(async () => {
    expect.soft(r.ダウンロードされた, "CSVがダウンロードされた").toBe(false);
    expect.soft(r.応答 ?? 0, "HTTPの応答コード（エラー）").toBeGreaterThanOrEqual(400);
  });
});

// ---- 034・035: 在庫検索一覧のカスタムCSV出力の選択肢 ----
const 在庫で検索する = async (page: import("@playwright/test").Page, code: string) => {
  await openStockList(page);
  await searchByCode(page, code);
  const n = await resultCount(page);
  if (!n) throw new Error(`在庫検索一覧で ${code} が見つからない（検索結果 ${n} 件）`);
};

caseTest("IT-M10-13-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013L_ADMIN);
  const p = new CustomCsvPage(page);
  const 名 = rc("連携在庫CSV-001");
  let 選択肢: string[] = [];
  await step(1, async () => { await p.open(); await p.定義を選ぶ(新規); });
  await step(2, async () => { await p.種別を選ぶ("在庫CSV"); });
  await step(3, async () => { await p.名前.fill(名); });
  await step(4, async () => { await p.項目を出力へ移す("商品ID"); await p.項目を出力へ移す("商品名"); });
  await step(5, async () => { await p.設定する("在庫CSVのカスタム定義の登録"); });
  await step(6, async () => { await openStockList(page); });
  await step(7, async () => { await searchByCode(page, 在庫商品コード("001")); if (!(await resultCount(page))) throw new Error("在庫検索一覧に検索結果が無い"); note("在庫明細はDBで作る代わりに、画面で作った印つきの商品（商品コード・規格）の在庫の行で代えた。管理者は所属が本店のシステム管理者。定義の名称・商品コードは実行の印つき"); });
  await step(8, async () => { 選択肢 = await 在庫カスタムCSV出力を押して選択肢を読む(page); });
  await expected(async () => { expect.soft(選択肢, "カスタムCSVで作成した出力フォーマットの選択肢").toContain(名); });
});

caseTest("IT-M10-13-035", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013L_ADMIN);
  const p = new CustomCsvPage(page);
  const 名 = rc("連携削除在庫CSV-002");
  let 削除前: string[] = [], 削除後: string[] = [];
  await step(1, async () => { await openStockList(page); });
  await step(2, async () => { await searchByCode(page, 在庫商品コード("002")); if (!(await resultCount(page))) throw new Error("在庫検索一覧に検索結果が無い"); });
  await step(3, async () => {
    削除前 = await 在庫カスタムCSV出力を押して選択肢を読む(page);
    pwExpect(削除前, "削除する前は、リンクとして定義が表示されている").toContain(名);
  });
  await step(4, async () => { await p.open("10"); });
  await step(5, async () => { await p.種別を選ぶ("在庫CSV"); await p.定義を選ぶ(名); pwExpect(page.url(), "選んだ定義の画面").toContain(notes.get("〔カスタム定義ID-M1013-035〕")); });
  await step(6, async () => { await pwExpect(p.削除リンク, "削除リンク").toBeVisible(); });
  await step(7, async () => { await p.削除する(); });
  await step(8, async () => { await openStockList(page); });
  await step(9, async () => { await searchByCode(page, 在庫商品コード("002")); if (!(await resultCount(page))) throw new Error("在庫検索一覧に検索結果が無い"); });
  await step(10, async () => { 削除後 = await 在庫カスタムCSV出力を押して選択肢を読む(page); note("在庫明細はDBで作る代わりに、画面で作った印つきの商品の在庫の行で代えた。管理者は所属が本店のシステム管理者"); });
  await expected(async () => { expect.soft(削除後, "カスタムCSVで作成した出力フォーマットの選択肢（削除した定義が表示されない）").not.toContain(名); });
});

// ---- 038・039 ----
caseTest("IT-M10-13-038", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  const 名 = rc("再保存CSV-M1013-038");
  let 一回目 = { 件数: -1, 関連: [] as string[] }, 二回目 = { 件数: -1, 関連: [] as string[] };
  await step(1, async () => { await p.open(); await p.定義を選ぶ(新規); });
  await step(2, async () => { await p.種別を選ぶ("商品CSV"); });
  await step(3, async () => { await p.名前.fill(名); });
  await step(4, async () => { await p.項目を出力へ移す(コード); await p.項目を出力へ移す("商品ID"); });
  await step(5, async () => { await p.設定する("カスタム定義の登録"); });
  await step(6, async () => { 一回目 = { 件数: 定義を読む({ 名称: 名 }).件数, 関連: 定義の出力項目({ 名称: 名 }) }; });
  await step(7, async () => { await p.設定する("同じ内容での再保存"); });
  await step(8, async () => { 二回目 = { 件数: 定義を読む({ 名称: 名 }).件数, 関連: 定義の出力項目({ 名称: 名 }) }; note("出力項目は、正本の「CSV商品コード」「CSV商品ID」の代わりに、画面にある「商品コード」「商品ID」にした。定義の名称は実行の印つき"); });
  await expected(async () => {
    expect.soft(一回目.件数, "1回目の保存後の定義の数").toBe(1);
    expect.soft(一回目.関連, "1回目の保存後の出力項目の関連").toEqual([コード, "商品ID"]);
    expect.soft(二回目.件数, "2回目の保存後の定義の数").toBe(1);
    expect.soft(二回目.関連, "2回目の保存後の出力項目の関連（重複なし）").toEqual([コード, "商品ID"]);
  });
});

caseTest("IT-M10-13-039", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const list = new ProductCustomCsvPage(page);
  const 検索語 = "CSV-P-M1013-039";
  let 行群: string[][] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.商品コードで検索する(検索語); });
  let バイト: Buffer = Buffer.alloc(0);
  await step(3, async () => { バイト = (await list.ダウンロードする(rc("複数件CSV-M1013-039"))).バイト; });
  await step(4, async () => { 行群 = 行(バイト); note("出力項目は、正本の「CSV商品コード」の代わりに、画面にある「商品コード」にした。商品コード・定義の名称は実行の印つき（検索語は印の前の部分）"); });
  await expected(async () => {
    expect.soft(行群[0], "ヘッダ行").toEqual([コード]);
    expect.soft(行群.slice(1).map((r) => r[0]).sort(), "データ行の商品コード（ちょうど2件）").toEqual([商品コード039("A"), 商品コード039("B")].sort());
  });
});

// ---- 040・041: 在庫移動・振替CSV／在庫分割結合CSV の選択肢 ----
function 選択肢のケース(種別: string, base: string): (ctx: import("../../lib/case").CaseCtx) => Promise<void> {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1013_ADMIN);
    const p = new CustomCsvPage(page);
    let 選択肢: string[] = [];
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.種別を選ぶ(種別); });
    await step(3, async () => { 選択肢 = await p.定義名の一覧(); note("この種別には出力項目が無く、共有のマスタに項目を足さないため、定義の出力項目は0件のまま作ったシードの上で行った。定義の名称は実行の印つき"); });
    await expected(async () => { expect.soft(選択肢, "追加されたCSV選択の選択肢（2つだけ）").toEqual([新規, rc(base)]); });
  };
}
caseTest("IT-M10-13-040", 選択肢のケース("在庫移動・振替CSV", "在庫移動・振替CSV選択確認-M1013-040"));
caseTest("IT-M10-13-041", 選択肢のケース("在庫分割結合CSV", "在庫分割結合CSV選択確認-M1013-041"));

void adminUrl;
