/**
 * M04-28 送り状CSV出力。正本: cases/M04-28_test_cases.tsv
 *
 * 全9件（001・003〜007・009〜011）を実装した。どのシードも画面だけで作れる（正本の外の補いは seeds/m04-28.ts の冒頭）。
 *
 * 手順の読み方（M04-24 の記録の「シード・手順の解釈」8 と同じ）:
 * - 「移動指示IDに〔…〕を入力して「検索する」を押す」（001・003〜006・009〜011 の手順2）は、書かれたとおり在庫移動指示IDだけを入れて
 *   「検索」を押す。画面は出庫元店舗・入庫先店舗を必須にしている（入庫先店舗の初期値は「未選択」）ので、ブラウザの入力チェックが検索を止める。
 *   店舗を補って選ぶことはしない（手順の直しは依頼者が決める。M04-24 の裁定案1の1 と同じ形）。止めた項目は注記に残す。
 * - 検索が止まると一覧に行が無く、手順3「行頭チェックボックスを選択する」を実行できない。期待結果は送り状CSVのダウンロードの結果なので、
 *   その手順で止めて不合格にする（操作をせずに合格にしない）。
 * - 007 は手順2で店舗を選ぶので、控えた店舗ID（東京店＝〔店舗ID-M0428-共有A〕、大阪店＝〔店舗ID-M0428-共有B〕）で選ぶ
 *   （手元のDBには M04-24 のシードの「大阪店」もあり、店名では選べない）。
 * - CSVの項目は設計書の項目名（design.txt L0015〜L0037 の識別ID 1〜23）で引く。見出しの名前が違えば、その項目は「無い」として落とす。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { MoveInstructionSearchPage, SubmitResult } from "../../pages/admin/m04_24_move_instruction";
import { M0428_010_A, M0428_011_A, M0428_ADMIN } from "../../seeds/m04-28";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 設計書の送り状CSVの項目名（識別ID 1〜23 の順） */
const DESIGN_HEADERS = [
  "オーダーID", "注文金額合計", "注文者氏名", "注文者カナ", "注文者郵便番号", "注文者都道府県", "注文者住所", "注文者住所2", "注文者電話番号",
  "商品金額合計", "送料", "送料(税抜)", "手数料", "手数料(税抜)", "配送先氏名", "配送先カナ", "配送先郵便番号", "配送先都道府県", "配送先住所",
  "配送先住所2", "配送先電話番号", "郵便種別", "発送方法",
];

type LabelCsv = { headers: string[]; rows: string[][] };

/** 「検索」を押した結果を注記に残し、送られたかを返す */
function noteSearch(r: SubmitResult): boolean {
  note("正本の「検索する」は、検索欄の「検索」ボタンとして押した（表示の違い）");
  if (r.sent) { note(`検索の応答: ${r.status}`); return true; }
  note(`移動指示IDだけを入れて「検索」を押すと、ブラウザの入力チェックが検索を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
  return false;
}

/** 行を選ぶ。一覧に行が無ければ、手順が実行できないので止める */
async function selectRows(search: MoveInstructionSearchPage, ids: string[], searched: boolean): Promise<void> {
  const listed = (await search.listedRows()).map((r) => r.移動指示ID);
  note(`一覧の行: ${listed.join("・") || "なし"}`);
  for (const id of ids) {
    if (!(await search.rowById(id).count())) {
      throw new Error(`一覧に移動指示ID ${id} の行が無く、行頭チェックボックスを選択できない（${searched ? "検索の結果に出ない" : "手順の検索がブラウザの入力チェックで止まり、検索されていない"}）`);
    }
    await search.selectRow(id);
  }
}

/** 「送り状CSVダウンロード」を押し、ダウンロードされたファイルの数と中身を返す */
async function pressLabelDownload(page: Page, search: MoveInstructionSearchPage): Promise<{ count: number; csv: LabelCsv | null; name: string }> {
  await expect(search.送り状CSVダウンロード, "送り状CSVダウンロードボタンが押せる").toBeEnabled();
  const downloads: import("@playwright/test").Download[] = [];
  const onDownload = (d: import("@playwright/test").Download) => { downloads.push(d); };
  page.on("download", onDownload);
  try {
    const first = page.waitForEvent("download", { timeout: 60_000 });
    await search.送り状CSVダウンロード.click();
    await first;
    await page.waitForTimeout(2_000); // 2つ目のファイルが出ないことも見る
  } finally {
    page.off("download", onDownload);
  }
  const d = downloads[0];
  const path = await d.path();
  const bytes = (await import("node:fs")).readFileSync(path);
  const rows = parseCsv(decodeCsvBytes(bytes));
  note(`ダウンロードされたファイル: ${downloads.map((x) => x.suggestedFilename()).join("・")}（${downloads.length}件）`);
  return { count: downloads.length, csv: rows.length ? { headers: rows[0], rows: rows.slice(1) } : null, name: d.suggestedFilename() };
}

/** CSVの、オーダーID（識別ID 1）が id のデータ行を、設計書の項目名 → 値で返す。見出しに無い項目は undefined */
function recordOf(csv: LabelCsv, id: string): Record<string, string | undefined> | null {
  const orderCol = csv.headers.indexOf("オーダーID");
  const hits = csv.rows.filter((r) => r[orderCol >= 0 ? orderCol : 0] === id);
  if (hits.length !== 1) return null;
  return Object.fromEntries(DESIGN_HEADERS.map((h) => { const i = csv.headers.indexOf(h); return [h, i >= 0 ? hits[0][i] : undefined]; }));
}

function noteCsv(csv: LabelCsv | null): void {
  if (!csv) { note("CSVは空"); return; }
  note(`CSVの見出し（${csv.headers.length}項目）: ${csv.headers.join(",")}`);
  const missing = DESIGN_HEADERS.filter((h) => !csv.headers.includes(h));
  if (missing.length) note(`設計書の項目名のうち、CSVの見出しに無いもの: ${missing.join("・")}`);
  note(`データ行（${csv.rows.length}行）: ${csv.rows.map((r) => r.join(",")).join(" / ")}`);
}

/**
 * 001・003〜006・009〜011 の共通の流れ。手順: 0.（010・011 だけ）ログイン 1. 検索画面を開く 2. 移動指示IDを入れて検索 3. 行を選ぶ 4. ダウンロード（5. 開く）
 * check はダウンロードの結果を確かめる（期待結果）
 */
function downloadById(label: string, account: Account, loginIsStep: boolean, check: (r: { count: number; csv: LabelCsv | null }, id: string) => void) {
  return async ({ page, notes, c, step, expected }: CaseCtx) => {
    const id = notes.get(label);
    const search = new MoveInstructionSearchPage(page);
    let n = 0;
    const next = () => ++n;
    if (loginIsStep) await step(next(), async () => { page.setDefaultTimeout(180_000); page.setDefaultNavigationTimeout(180_000); await loginAdmin(page, account); });
    else page.setDefaultTimeout(180_000); page.setDefaultNavigationTimeout(180_000); await loginAdmin(page, account);
    let searched = false;
    let result: { count: number; csv: LabelCsv | null } = { count: 0, csv: null };
    await step(next(), async () => { await search.open(); });
    await step(next(), async () => { searched = noteSearch(await search.searchById(id)); });
    await step(next(), async () => { await selectRows(search, [id], searched); });
    await step(next(), async () => { result = await pressLabelDownload(page, search); });
    if (c.手順.includes("ダウンロードしたCSVを開く")) await step(next(), async () => { noteCsv(result.csv); });
    await expected(async () => {
      expect.soft(result.count, "ダウンロードされたファイルは1つ").toBe(1);
      expect(result.csv, "CSVに中身がある").not.toBeNull();
      check(result, id);
    });
  };
}

const num = (s: string | undefined) => (s === undefined ? NaN : Number(s));

caseTest("IT-M04-28-001", downloadById("〔移動指示ID-M0428-001〕", M0428_ADMIN, false, (r, id) => {
  expect.soft(recordOf(r.csv!, id), `移動指示ID ${id} の行がある（選択した在庫移動指示の送り状CSV）`).not.toBeNull();
}));

caseTest("IT-M04-28-003", downloadById("〔移動指示ID-M0428-003〕", M0428_ADMIN, false, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  expect.soft(rec!["オーダーID"], "オーダーID").toBe(id);
  expect.soft(num(rec!["注文金額合計"]), "注文金額合計").toBe(3500);
  expect.soft(num(rec!["商品金額合計"]), "商品金額合計").toBe(3500);
}));

caseTest("IT-M04-28-004", downloadById("〔移動指示ID-M0428-004〕", M0428_ADMIN, false, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  expect.soft(rec!["注文者氏名"], "注文者氏名").toBe("株式会社送り元 東京店");
  expect.soft(rec!["注文者カナ"], "注文者カナ").toBe("カブシキガイシャオクリモト トウキョウテン");
  expect.soft(rec!["注文者郵便番号"], "注文者郵便番号").toBe("1000001");
  expect.soft(rec!["注文者都道府県"], "注文者都道府県").toBe("東京都");
  expect.soft(rec!["注文者住所"], "注文者住所").toBe("千代田区千代田1-1");
  expect.soft(rec!["注文者住所2"], "注文者住所2").toBe("送り元ビル1F");
  expect.soft(rec!["注文者電話番号"], "注文者電話番号").toBe("0311112222");
}));

caseTest("IT-M04-28-005", downloadById("〔移動指示ID-M0428-005〕", M0428_ADMIN, false, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  expect.soft(rec!["配送先氏名"], "配送先氏名").toBe("株式会社送り先 大阪店");
  expect.soft(rec!["配送先カナ"], "配送先カナ").toBe("カブシキガイシャオクリサキ オオサカテン");
  expect.soft(rec!["配送先郵便番号"], "配送先郵便番号").toBe("5300001");
  expect.soft(rec!["配送先都道府県"], "配送先都道府県").toBe("大阪府");
  expect.soft(rec!["配送先住所"], "配送先住所").toBe("大阪市北区梅田2-2");
  expect.soft(rec!["配送先住所2"], "配送先住所2").toBe("送り先ビル2F");
  expect.soft(rec!["配送先電話番号"], "配送先電話番号").toBe("0666667777");
}));

caseTest("IT-M04-28-006", downloadById("〔移動指示ID-M0428-006〕", M0428_ADMIN, false, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  for (const h of ["送料", "送料(税抜)", "手数料", "手数料(税抜)", "郵便種別"]) expect.soft(rec![h], h).toBe("0");
  expect.soft(rec!["発送方法"], "発送方法").toBe("ゆうパック");
}));

caseTest("IT-M04-28-009", downloadById("〔移動指示ID-M0428-009〕", M0428_ADMIN, false, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  expect.soft(rec!["オーダーID"], "オーダーID").toBe(id);
  expect.soft(num(rec!["注文金額合計"]), "注文金額合計").toBe(8000);
  expect.soft(num(rec!["商品金額合計"]), "商品金額合計").toBe(8000);
}));

caseTest("IT-M04-28-010", downloadById("〔移動指示ID-M0428-010〕", M0428_010_A.account, true, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  const row = r.csv!.rows.find((x) => x.includes(id));
  expect.soft(row?.length, "データ行は23項目").toBe(23);
  expect.soft(rec!["注文者氏名"], "注文者氏名").toBe("株式会社M0428-010 元店M0428-010");
  expect.soft(rec!["注文者住所"], "注文者住所").toBe("新宿区西新宿M0428-010");
  expect.soft(rec!["注文者住所2"], "注文者住所2（空）").toBe("");
  expect.soft(rec!["注文者電話番号"], "注文者電話番号").toBe("0355550100");
  expect.soft(rec!["配送先氏名"], "配送先氏名").toBe("株式会社送り先 大阪店");
  expect.soft(rec!["配送先住所2"], "配送先住所2").toBe("送り先ビル2F");
}));

caseTest("IT-M04-28-011", downloadById("〔移動指示ID-M0428-011〕", M0428_011_A.account, true, (r, id) => {
  const rec = recordOf(r.csv!, id);
  expect(rec, `移動指示ID ${id} のデータ行`).not.toBeNull();
  const row = r.csv!.rows.find((x) => x.includes(id));
  expect.soft(row?.length, "データ行は23項目").toBe(23);
  expect.soft(rec!["注文者住所2"], "注文者住所2").toBe("送り元ビル1F");
  expect.soft(rec!["配送先氏名"], "配送先氏名").toBe("株式会社M0428-011 先店M0428-011");
  expect.soft(rec!["配送先住所"], "配送先住所").toBe("名古屋市中区M0428-011");
  expect.soft(rec!["配送先住所2"], "配送先住所2（空）").toBe("");
  expect.soft(rec!["配送先電話番号"], "配送先電話番号").toBe("0525550110");
  expect.soft(rec!["郵便種別"], "郵便種別").toBe("0");
  expect.soft(rec!["発送方法"], "発送方法").toBe("ゆうパック");
}));

caseTest("IT-M04-28-007", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔移動指示ID-M0428-007A〕");
  const b = notes.get("〔移動指示ID-M0428-007B〕");
  const cc = notes.get("〔移動指示ID-M0428-007C〕");
  page.setDefaultTimeout(180_000); page.setDefaultNavigationTimeout(180_000); await loginAdmin(page, M0428_ADMIN);
  const search = new MoveInstructionSearchPage(page);
  let searched = false;
  let result: { count: number; csv: LabelCsv | null } = { count: 0, csv: null };
  await step(1, async () => { await search.open(); });
  await step(2, async () => {
    await search.出庫元店舗.selectOption(notes.get("〔店舗ID-M0428-共有A〕"));
    await search.入庫先店舗.selectOption(notes.get("〔店舗ID-M0428-共有B〕"));
    note(`出庫元店舗「${(await search.selected(search.出庫元店舗)).表示}」・入庫先店舗「${(await search.selected(search.入庫先店舗)).表示}」を店舗IDで選んだ`);
    searched = noteSearch(await search.pressSearch());
  });
  await step(3, async () => {
    await selectRows(search, [a, b], searched);
    await expect(search.rowById(cc), `移動指示ID ${cc} の行は一覧にある（選択しない）`).toHaveCount(1);
    await expect(search.rowById(cc).locator("input.row-check"), `移動指示ID ${cc} は選択しない`).not.toBeChecked();
  });
  await step(4, async () => { result = await pressLabelDownload(page, search); });
  await step(5, async () => { noteCsv(result.csv); });
  await expected(async () => {
    expect(result.csv, "CSVに中身がある").not.toBeNull();
    expect.soft(result.csv!.rows.length, "見出しを除くデータ行").toBe(2);
    expect.soft(result.csv!.headers, "見出しに「オーダーID」がある（設計書 識別ID 1）").toContain("オーダーID");
    const col = result.csv!.headers.indexOf("オーダーID");
    expect.soft(result.csv!.rows.map((r) => r[col >= 0 ? col : 0]).sort(), `オーダーID${col >= 0 ? "" : "（見出しに無いので1列目）"}の集合`).toEqual([a, b].sort());
  });
});
