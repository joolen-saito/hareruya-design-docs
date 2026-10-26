/**
 * M04-17 在庫履歴検索一覧。正本: cases/M04-17_test_cases.tsv
 *
 * 画面だけで準備できるケースのうち、017・020・023・026・031・036・037・055・012・016 を実装した。
 * どのケースも、試験管理者（デフォルト検索表示店舗は本店）の新しいブラウザのセッションで行う。
 * 「検索条件をクリア」はアコーディオンの中の条件だけを空にし、店舗（本店）は残る。シードの履歴はどれも本店・在庫区分 EC-CUBE の在庫に作る。
 */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { csvRecords, decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { readClassPrices } from "../../pages/admin/m04_17_seed_ops";
import {
  firstDayOfThisMonth, HistoryRow, numberOf, StockHistoryPage, 在庫変動履歴CSVだけの見出し, 欠品履歴CSVだけの見出し,
} from "../../pages/admin/m04_17_stock_history";
import { M0417_ADMIN, MAIN_SHOP } from "../../seeds/m04-17";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備①: 試験管理者で、本機能の保持値がない（新しい）ブラウザのセッションにログインする */
async function signIn(page: Page): Promise<StockHistoryPage> {
  await loginAdmin(page, M0417_ADMIN);
  return new StockHistoryPage(page);
}

/**
 * 検索ボタンを押す。検索が実行された結果の画面になったこと（応答200・入力した値が残っている・件数の表示が出ている）を確かめ、
 * 件数の表示・一覧の行の数・画面のメッセージを注記に残す。
 * アプリは、入力の誤りで検索をしなかったときも、応答200で入力した値を残した画面を返す（一覧は出ず「検索条件に誤りがあります」が出る）。
 * 件数の表示「検索結果：N件が該当しました」は検索が実行されたときにだけ出るので、これで検索が実行されたあとの画面であることを押さえる。
 */
async function search(h: StockHistoryPage, keyword: string): Promise<void> {
  const status = await h.submit();
  expect(status, "検索の応答").toBe(200);
  await expect(h.キーワード欄, "検索の結果の画面（入力した値が残っている）").toHaveValue(keyword);
  const count = await h.resultCount();
  note(`検索の結果: 件数の表示「${count ?? "なし"}」・一覧の行 ${(await h.rows()).length}件・画面のメッセージ「${(await h.messages()).join(" / ") || "なし"}」`);
  expect(count, "検索が実行された（検索結果の件数の表示が出ている。入力の誤りで検索をしなかった画面ではない）").not.toBeNull();
}

const codesOf = (rows: HistoryRow[]) => rows.map((r) => r["商品コード"]);
const namesOf = (rows: HistoryRow[]) => rows.map((r) => r["商品名"]).sort();

// ---- 検索 ----

// 範囲の検索: 変更時販売価格(from)500・(to)1000。シードの変更時販売価格は 500・1000・2000・0
caseTest("IT-M04-17-012", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("RANGE-M0417-012");
    await h.fillSellPrice("500", "1000");
  });
  await step(4, () => search(h, "RANGE-M0417-012"));
  await expected(async () => {
    const rows = await h.rows();
    expect.soft(namesOf(rows), "表示されるのは RANGE-01-012・RANGE-02-012 の2件だけ").toEqual(["RANGE-01-012", "RANGE-02-012"]);
    const price = (name: string) => rows.filter((r) => r["商品名"] === name).map((r) => numberOf(r["変更時販売価格"]));
    expect.soft(price("RANGE-01-012"), "RANGE-01-012 の変更時販売価格は下限と同じ500").toEqual([500]);
    expect.soft(price("RANGE-02-012"), "RANGE-02-012 の変更時販売価格は上限と同じ1000").toEqual([1000]);
  });
});

// 在庫変動理由・欠品理由の部分一致。シードの在庫変動理由は「境界理由 01」「02 境界理由」と、含まない2件
caseTest("IT-M04-17-016", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("RANGE-M0417-016");
    await h.fillReason("境界理由");
  });
  await step(4, () => search(h, "RANGE-M0417-016"));
  await expected(async () => {
    const rows = await h.rows();
    expect.soft(namesOf(rows), "表示されるのは RANGE-01-016・RANGE-02-016 の2件だけ").toEqual(["RANGE-01-016", "RANGE-02-016"]);
    for (const r of rows) expect.soft(r["在庫変動理由"], `${r["商品名"]} の在庫変動理由は「境界理由」を含む`).toContain("境界理由");
  });
});

// 該当なし。正本の事前準備②の「同じ値を持つ試験残骸があれば削除する」: 「不存在-M0417」を含む商品・履歴を作るシードは無い。
// 残っていれば一覧に出て、このケースは落ちる（削除の手段を画面に求めない）。
// 検索の補助関数が、件数の表示が出ている（検索が実行された）ことを確かめてから、期待結果で一覧が無いことを判定する。
caseTest("IT-M04-17-017", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("不存在-M0417");
    await search(h, "不存在-M0417");
  });
  await expected(async () => {
    await expect.soft(h.list, "検索結果一覧が表示されない").toHaveCount(0);
    expect.soft(await h.rows(), "一覧の行が無い").toEqual([]);
  });
});

// 欠品検索のチェックを外したときの入力欄の状態と、在庫履歴の一覧
caseTest("IT-M04-17-020", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const state = async (when: string) => {
    note(`${when}: 在庫変動理由区分の選択内容「${(await h.selectedChangeTypes()).join("、") || "なし"}」・` +
      `在庫変動理由・欠品理由の欄「${await h.在庫変動理由欄.inputValue()}」（${(await h.在庫変動理由欄.isDisabled()) ? "非活性" : "活性"}）`);
  };
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.setDisposalSearch(true);
    await state("欠品検索にチェックしたあと");
  });
  await step(4, async () => {
    // 画面には欠品理由だけの欄は無く、「在庫変動理由・欠品理由」の1つの欄で在庫変動理由と欠品理由の両方を探す
    note("欠品理由は、画面の「在庫変動理由・欠品理由」の欄に入れた（欠品理由だけの欄は無い）");
    await h.fillReason("欠品理由M0417");
  });
  await step(5, async () => {
    await h.setDisposalSearch(false);
    await state("欠品検索のチェックを外したあと（検索ボタンを押す前）");
    expect(await h.submit(), "検索の応答").toBe(200);
    await state("検索ボタンを押したあと");
    note(`検索の結果: 件数の表示「${(await h.resultCount()) ?? "なし"}」・画面のメッセージ「${(await h.messages()).join(" / ") || "なし"}」`);
  });
  await expected(async () => {
    expect.soft(await h.selectedChangeTypes(), "在庫変動理由区分の選択内容が空").toEqual([]);
    expect.soft(await h.在庫変動理由欄.inputValue(), "欠品理由（在庫変動理由・欠品理由の欄）が空").toBe("");
    await expect.soft(h.在庫変動理由欄, "欠品理由（在庫変動理由・欠品理由の欄）が非活性").toBeDisabled();
    const headers = await h.headers();
    expect.soft(headers.includes("変更前在庫") && !headers.includes("欠品点数"), `在庫履歴検索一覧（欠品履歴検索一覧ではない）が表示される（見出し: ${headers.join("・") || "一覧なし"}）`).toBe(true);
    expect.soft(codesOf(await h.rows()), "在庫履歴検索一覧に STOCK-001-020 が表示される").toContain("STOCK-001-020");
  });
});

// 1件だけの検索結果
caseTest("IT-M04-17-023", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("BASE-001-023");
    await search(h, "BASE-001-023");
  });
  await expected(async () => {
    expect.soft(await h.resultCount(), "検索結果件数は1件").toBe(1);
    expect.soft(codesOf(await h.rows()), "検索結果一覧は BASE-001-023 の1行").toEqual(["BASE-001-023"]);
  });
});

// ---- 一覧の表示 ----

// 履歴作成時の販売価格。シードは販売価格1000で入庫・承認したあと、商品規格の基準価格・販売価格を1200に変えた。
// 期待結果の「現在の販売価格が1200である」も、ケースの中で商品規格の編集画面を開いて確かめる（保存はしない）。
caseTest("IT-M04-17-026", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("BASE-001-026");
    await search(h, "BASE-001-026");
  });
  await expected(async () => {
    const rows = (await h.rows()).filter((r) => r["商品コード"] === "BASE-001-026");
    expect.soft(rows.length, "BASE-001-026 の履歴は1行").toBe(1);
    expect.soft(rows.map((r) => numberOf(r["変更時販売価格"])), "変更時販売価格は履歴作成時の1000（現在の1200ではない）").toEqual([1000]);
    // 一覧を読み終えてから、商品規格の編集画面へ移って現在の販売価格を読む
    const current = await readClassPrices(page, "BASE-001-026", "BASE-001-026");
    note(`BASE-001-026 の商品規格の編集画面: 基準価格「${current.基準価格}」・販売価格「${current.販売価格}」`);
    expect.soft(numberOf(current.販売価格), "BASE-001-026 の現在の販売価格（商品規格の編集画面）は1200").toBe(1200);
  });
});

// 入庫承認待ちの在庫情報は表示しない。検索の補助関数が、検索が実行された（件数の表示が出ている）ことを確かめてから判定する
caseTest("IT-M04-17-031", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("PENDING-M0417-031");
    await search(h, "PENDING-M0417-031");
  });
  await expected(async () => {
    expect.soft(codesOf(await h.rows()).filter((c) => c === "PENDING-M0417-031"), "入庫承認待ちの PENDING-M0417-031 は表示されない").toEqual([]);
  });
});

// 並び順の不正な値
caseTest("IT-M04-17-036", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, () => h.fillKeyword("BASE-001"));
  await step(4, async () => {
    const fields = h.sortOrderFields();
    const n = await fields.count();
    if (n === 0) {
      throw new Error("検索の送信に並び順の項目が無い（検索欄・一覧のどこにも並び順を選ぶ項目が無く、送信の項目にも並び順にあたるものが無い）。" +
        "並び順の送信値を「invalid」に変えて送る手順を画面で実行できない。期待結果は送信した結果の画面を見るものなので、操作をせずに合格にはしない");
    }
    note(`検索の送信に並び順の項目が ${n} 件ある。先頭の項目の送信値を「invalid」に書き換えて検索ボタンを押した`);
    await h.overwriteValue(fields.first(), "invalid");
    note(`検索の応答: ${await h.submit()}`);
  });
  await expected(async () => {
    const v = await h.searchValues();
    expect.soft(v.キーワード, "商品名(日/英)・カード名・商品コードは初期値（空）").toBe("");
    expect.soft(v.店舗, "店舗は初期値（デフォルト検索表示店舗）").toEqual([MAIN_SHOP]);
    expect.soft(v.登録日From, "登録日(from)は初期値（当月1日）").toBe(firstDayOfThisMonth());
    expect.soft(v.公開種別, "公開種別は初期値（公開）").toEqual(["公開"]);
    expect.soft(v.状態, "状態は初期値（NM）").toEqual(["NM"]);
    expect.soft(await h.resultCount(), "検索結果件数が表示されない").toBeNull();
    await expect.soft(h.list, "検索結果一覧が表示されない").toHaveCount(0);
  });
});

// CSVダウンロード。落ちてきたのが在庫変動履歴CSVであること（欠品履歴CSVでないこと）は、設計書の2つのCSVの出力項目の差で見分ける
caseTest("IT-M04-17-037", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let file: { name: string; bytes: Buffer } | null = null;
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("BASE-001-037");
    await search(h, "BASE-001-037");
  });
  await step(4, async () => {
    const download = await h.downloadCsv();
    const path = await download.path();
    file = { name: download.suggestedFilename(), bytes: path ? fs.readFileSync(path) : Buffer.alloc(0) };
    note(`ダウンロードしたファイルの名前「${file.name}」・大きさ ${file.bytes.length} バイト`);
  });
  await expected(async () => {
    const got = file as { name: string; bytes: Buffer } | null;
    expect(got, "CSVダウンロードでファイルがダウンロードされる").not.toBeNull();
    expect.soft(got!.name, "ダウンロードしたファイルはCSV").toMatch(/\.csv$/i);
    const text = decodeCsvBytes(got!.bytes);
    // 在庫変動履歴CSVであること（欠品履歴CSVではないこと）を、見出しの行で確かめる。
    // 拡張子と商品コードの列は欠品履歴CSVにもあるので、それだけでは見分けられない
    const headers = parseCsv(text)[0] ?? [];
    note(`CSVの見出しの行: ${headers.join("・") || "なし"}`);
    for (const 列 of 在庫変動履歴CSVだけの見出し) {
      expect.soft(headers, `在庫変動履歴CSV: 見出しに在庫変動履歴CSVにだけある「${列}」がある`).toContain(列);
    }
    for (const 列 of 欠品履歴CSVだけの見出し) {
      expect.soft(headers, `在庫変動履歴CSV: 見出しに欠品履歴CSVにだけある「${列}」が無い（欠品履歴CSVではない）`).not.toContain(列);
    }
    const records = csvRecords(text);
    expect.soft(records.map((r) => r["商品コード"]), "在庫変動履歴CSVの明細は、検索結果の BASE-001-037 の履歴1行").toEqual(["BASE-001-037"]);
  });
});

// 承認済みと入庫承認待ちが混ざるとき
caseTest("IT-M04-17-055", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.open());
  await step(2, () => h.clearConditions());
  await step(3, async () => {
    await h.fillKeyword("MIX-M0417-055");
    await search(h, "MIX-M0417-055");
  });
  await expected(async () => {
    const codes = codesOf(await h.rows());
    expect.soft(await h.resultCount(), "検索結果件数は1件").toBe(1);
    expect.soft(codes, "一覧は MIX-M0417-055-N だけ").toEqual(["MIX-M0417-055-N"]);
    expect.soft(codes, "入庫承認待ちの MIX-M0417-055-P は表示されない").not.toContain("MIX-M0417-055-P");
  });
});
