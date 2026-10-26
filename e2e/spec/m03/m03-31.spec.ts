/**
 * M03-31 セール用価格変更CSV登録。正本: cases/M03-31_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できるケース（ほかを実装しない理由は e2e/review/M03-31_progress_2026-10-21.md）。
 * 正本の「セール用価格変更CSVアップロード画面」は、メニュー「商品管理」→「CSV管理」の画面（見出し「セール用価格変更CSVアップロード」）。
 * 正本の「CSVファイルのアップロード」は、画面の「CSVファイルをアップロード」ボタン（文言の違い）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import * as price from "../../db/m03_30_price";
import {
  PriceCsvUploadPage, priceCsvUploadPath, SubmitResult, 画面上部のメッセージ, 画面の見出し,
} from "../../pages/admin/m03_30_price_csv";
import { BELT, M0331_ADMIN, m0331FilePath } from "../../seeds/m03-31";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<PriceCsvUploadPage> {
  await loginAdmin(page, M0331_ADMIN);
  return new PriceCsvUploadPage(page, "セール用価格変更");
}

/** 送信の結果と画面上部のメッセージを注記に残す */
async function noteSubmit(page: Page, r: SubmitResult): Promise<void> {
  if (!r.sent) {
    note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
    return;
  }
  note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}。移った画面: ${new URL(page.url()).pathname}`);
  const m = await 画面上部のメッセージ(page);
  note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」/ エラー「${m.エラー.join("」「") || "なし"}」/ 警告「${m.警告.join("」「") || "なし"}」`);
}

/** アップロードを押す。送信が止まったら手順を実行できなかったとして落とす */
async function uploadChosen(page: Page, upload: PriceCsvUploadPage): Promise<void> {
  const r = await upload.submit();
  await noteSubmit(page, r);
  expect(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた（送られないと手順を実行できない）").toBe(true);
}

/** 送信の結果として、セール用価格変更CSVアップロード画面にいること（再表示・遷移） */
async function expectOnSaleUploadScreen(page: Page, upload: PriceCsvUploadPage): Promise<void> {
  expect.soft(new URL(page.url()).pathname, "送信のあとの画面がセール用価格変更CSVアップロード画面").toBe(priceCsvUploadPath("セール用価格変更"));
  await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(new RegExp(`^\\s*${画面の見出し("セール用価格変更")}\\s*$`));
}

// ---- 024: 雛形ファイル ----

caseTest("IT-M03-31-024", async ({ page, step, expected }) => {
  const dir = path.join(STATE_DIR, "m03-31", "downloads-024");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { force: true });
  const upload = await signIn(page);
  let suggested = "";
  let failure: string | null = "未確認";
  let bytes = Buffer.alloc(0);
  let formatItems: string[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    // 画面のファイルフォーマットの表の項目名（登録CSVの列）
    formatItems = await page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr td:first-child").evaluateAll((tds) => tds
      .map((td) => [...td.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim()));
    const download = await upload.downloadTemplate();
    suggested = download.suggestedFilename();
    await download.saveAs(path.join(dir, path.basename(suggested)));
    failure = await download.failure();
  });
  await step(3, async () => {
    // ブラウザのダウンロード一覧の代わりに、ダウンロードが失敗なく終わったこと・保存したファイルを見る
    const names = fs.readdirSync(dir);
    bytes = fs.readFileSync(path.join(dir, path.basename(suggested)));
    note(`ダウンロードの結果: 失敗=${failure ?? "なし"}、ファイル名「${suggested}」、保存先のファイル ${JSON.stringify(names)}、${bytes.length} バイト。中身: ${JSON.stringify(decodeCsvBytes(bytes))}。画面のファイルフォーマットの表の項目: ${JSON.stringify(formatItems)}`);
  });
  await expected(async () => {
    expect.soft(failure, "ダウンロードが失敗なく終わった（ダウンロード済み）").toBeNull();
    expect.soft(fs.existsSync(path.join(dir, path.basename(suggested))), "ダウンロードしたファイルがある").toBe(true);
    // 登録CSVの雛形: 見出し行だけで、列が画面のファイルフォーマットの表の項目と同じ
    const rows = parseCsv(decodeCsvBytes(bytes));
    expect.soft(rows.length, "雛形は見出し行だけ").toBe(1);
    expect.soft(rows[0], "雛形の見出しが、画面のセール用価格変更CSVファイルフォーマットの項目と同じ").toEqual(formatItems);
  });
});

// ---- 026・027: 取込を行わず同じ画面を再表示 ----

caseTest("IT-M03-31-026", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    r = await upload.submit();
    await noteSubmit(page, r);
  });
  await expected(async () => {
    // 再表示（送信の結果として画面が返ること）を見る期待結果なので、送信が止まって元の画面にいるときは合格にしない
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    await expectOnSaleUploadScreen(page, upload);
  });
});

caseTest("IT-M03-31-027", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(m0331FilePath("027", "unsupported.png")); });
  await step(3, async () => {
    r = await upload.submit();
    await noteSubmit(page, r);
  });
  await expected(async () => {
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    await expectOnSaleUploadScreen(page, upload);
  });
});

// ---- 012・046: エラー一覧 ----

function errorListCase(caseNo: string, file: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const upload = await signIn(page);
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(m0331FilePath(caseNo, file)); });
    await step(3, async () => { await uploadChosen(page, upload); });
    await expected(async () => {
      await expectOnSaleUploadScreen(page, upload);
      const m = await 画面上部のメッセージ(page);
      expect.soft(m.エラー.length, `セール用価格変更CSVアップロード画面にエラー一覧が表示される（エラー: ${m.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    });
  };
}

caseTest("IT-M03-31-012", errorListCase("012", "unknown-product-012.csv"));
caseTest("IT-M03-31-046", errorListCase("046", "unknown-tag-046.csv"));

// ---- 025: 取込完了後の画面 ----

caseTest("IT-M03-31-025", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(m0331FilePath("025", "history-success-025.csv")); });
  await step(3, async () => { await uploadChosen(page, upload); });
  await expected(async () => {
    // 「取込完了後に」: 取込が完了した（完了のメッセージが出て、エラーが無い）うえで、セール用価格変更CSVアップロード画面が表示されること
    const m = await 画面上部のメッセージ(page);
    expect.soft(m.エラー, "取込のエラーが無い").toEqual([]);
    expect.soft(m.成功, "取込の完了のメッセージ「登録が完了しました。」").toContain("登録が完了しました。");
    await expectOnSaleUploadScreen(page, upload);
  });
});

// ---- DBで商品規格・商品タグを確かめるケース ----

type 規格の見方 = { label: string; check: (before: price.商品規格の状態, after: price.商品規格の状態) => void };

/** 取込の前後で、商品規格の値が変わらないこと（比べる項目: 基準価格・販売価格・買取価格・セールフラグ・帯URL・スマレジ連携フラグ・表示） */
function unchanged(label = "商品規格が更新前の状態から変更されない"): (b: price.商品規格の状態, a: price.商品規格の状態) => void {
  return (b, a) => { expect.soft(a, label).toEqual(b); };
}

/**
 * 手順: 1. 画面を開く／2. ファイルを選ぶ／3. アップロードを押す／4. DBで確かめる。
 * classLabels: 確かめる商品規格の呼び名。before は取込の前にDBで読んだ値（事前準備の状態）。
 */
function dbCase(caseNo: string, file: string, opts: {
  classes?: { label: string; check: (b: price.商品規格の状態, a: price.商品規格の状態) => void }[];
  tags?: (ctx: { notes: CaseCtx["notes"]; before: string[]; after: string[] }) => void;
  productLabel?: string;
}) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const classes = (opts.classes ?? []).map((c) => ({ ...c, id: notes.get(c.label) }));
    const productId = opts.productLabel ? notes.get(opts.productLabel) : "";
    const before = new Map<string, price.商品規格の状態>();
    for (const c of classes) {
      const s = price.商品規格(c.id);
      expect(s, `事前準備: ${c.label}=${c.id} の商品規格がある`).not.toBeNull();
      before.set(c.id, s!);
    }
    const tagsBefore = productId ? price.商品タグのID(productId) : [];
    note(`取込の前: ${JSON.stringify([...before.entries()])}${productId ? ` / 商品タグ ${JSON.stringify(tagsBefore)}` : ""}`);
    const upload = await signIn(page);
    const after = new Map<string, price.商品規格の状態 | null>();
    let tagsAfter: string[] = [];
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(m0331FilePath(caseNo, file)); });
    await step(3, async () => { await uploadChosen(page, upload); });
    await step(4, async () => {
      for (const c of classes) after.set(c.id, price.商品規格(c.id));
      if (productId) tagsAfter = price.商品タグのID(productId);
      note(`取込のあと: ${JSON.stringify([...after.entries()])}${productId ? ` / 商品タグ ${JSON.stringify(tagsAfter)}` : ""}`);
    });
    await expected(async () => {
      for (const c of classes) {
        const a = after.get(c.id);
        expect(a, `${c.label}=${c.id} の商品規格がある`).not.toBeNull();
        c.check(before.get(c.id)!, a!);
      }
      if (opts.tags) opts.tags({ notes, before: tagsBefore, after: tagsAfter });
    });
  };
}

/** CSVの値へ更新されたこと（販売価格・買取価格・セールフラグ） */
const updatedTo = (販売価格: string, 買取価格: string, セール: boolean, 帯URL?: string) => (_b: price.商品規格の状態, a: price.商品規格の状態) => {
  expect.soft(a.販売価格, "販売価格がCSVの値").toBe(販売価格);
  expect.soft(a.買取価格, "買取価格がCSVの値").toBe(買取価格);
  expect.soft(a.セールフラグ, "セールフラグがCSVの値").toBe(セール);
  if (帯URL !== undefined) expect.soft(a.帯URL, "帯URLがCSVの値").toBe(帯URL);
};

/** 販売価格・買取価格・セールフラグが更新前のまま */
const pricesKept = (b: price.商品規格の状態, a: price.商品規格の状態) => {
  expect.soft({ 販売価格: a.販売価格, 買取価格: a.買取価格, セールフラグ: a.セールフラグ }, "販売価格・買取価格・セールフラグが更新前のまま")
    .toEqual({ 販売価格: b.販売価格, 買取価格: b.買取価格, セールフラグ: b.セールフラグ });
};

// 008〜011: 更新の対象の絞り込み
caseTest("IT-M03-31-008", dbCase("008", "scope-008.csv", {
  classes: [
    { label: "〔商品規格ID-M0331-008A〕", check: updatedTo("2100", "800", true) },
    { label: "〔商品規格ID-M0331-008B〕", check: updatedTo("2100", "800", true) },
  ],
}));
caseTest("IT-M03-31-009", dbCase("009", "scope-009.csv", { classes: [{ label: "〔商品規格ID-M0331-009C〕", check: pricesKept }] }));
caseTest("IT-M03-31-010", dbCase("010", "scope-010.csv", { classes: [{ label: "〔商品規格ID-M0331-010D〕", check: pricesKept }] }));
caseTest("IT-M03-31-011", dbCase("011", "scope-011.csv", { classes: [{ label: "〔商品規格ID-M0331-011E〕", check: pricesKept }] }));

// 013・014・047: 商品タグ
caseTest("IT-M03-31-013", dbCase("013", "tag-replace-013.csv", {
  productLabel: "〔商品ID-M0331-013〕",
  tags: ({ notes, before, after }) => {
    expect.soft(before, "取込の前の商品タグは更新前タグだけ").toEqual([notes.get("〔タグID-M0331-共有A〕")]);
    const want = [notes.get("〔タグID-M0331-共有B〕"), notes.get("〔タグID-M0331-共有C〕")].sort((x, y) => Number(x) - Number(y));
    expect.soft([...after].sort((x, y) => Number(x) - Number(y)), "商品タグが、CSVで指定した2件だけへ入れ替わる").toEqual(want);
  },
}));
caseTest("IT-M03-31-014", dbCase("014", "optional-empty-014.csv", {
  productLabel: "〔商品ID-M0331-014〕",
  tags: ({ notes, before, after }) => {
    expect.soft(before, "取込の前の商品タグは更新前タグだけ（登録されていた商品タグ）").toEqual([notes.get("〔タグID-M0331-共有A〕")]);
    expect.soft(after, "商品タグが0件になる").toEqual([]);
  },
}));
caseTest("IT-M03-31-047", dbCase("047", "invalid-tag-format-047.csv", {
  productLabel: "〔商品ID-M0331-047〕",
  tags: ({ notes, before, after }) => {
    expect.soft(before, "取込の前の商品タグは更新前タグだけ").toEqual([notes.get("〔タグID-M0331-共有A〕")]);
    expect.soft(after, "商品タグが既存のタグIDから変更されない").toEqual([notes.get("〔タグID-M0331-共有A〕")]);
  },
}));

// 015・016・059・060: 帯URL
caseTest("IT-M03-31-015", dbCase("015", "belt-url-015.csv", {
  classes: [{ label: "〔商品規格ID-M0331-015〕", check: (b, a) => {
    expect.soft(b.帯URL, "取込の前の帯URL").toBe(BELT.before);
    expect.soft(a.帯URL, "帯URLがCSVで指定した値に更新される").toBe(BELT.sale);
  } }],
}));
caseTest("IT-M03-31-016", dbCase("016", "optional-empty-016.csv", {
  classes: [{ label: "〔商品規格ID-M0331-016〕", check: (b, a) => {
    expect.soft(b.帯URL, "取込の前の帯URL").toBe(BELT.before);
    expect.soft(a.帯URL ?? "", "帯URLが未設定（空）になる").toBe("");
  } }],
}));
caseTest("IT-M03-31-059", dbCase("059", "belt-url-128-059.csv", {
  classes: [{ label: "〔商品規格ID-M0331-059〕", check: (_b, a) => {
    expect.soft(a.帯URL, "帯URLが128文字の値で更新される").toBe(BELT.len128);
  } }],
}));
caseTest("IT-M03-31-060", dbCase("060", "belt-url-129-060.csv", {
  classes: [{ label: "〔商品規格ID-M0331-060〕", check: (b, a) => {
    expect.soft(b.帯URL, "取込の前の帯URL").toBe(BELT.before);
    expect.soft(a.帯URL, "帯URLが更新前の値から変更されない").toBe(BELT.before);
  } }],
}));

// 035〜044・048: 行の不備で取込を打ち切る（商品規格が変わらない）
/** 確かめる商品規格（その商品の唯一の規格）が、取込の前後で変わらないこと */
function keepOne(no: string) {
  return { classes: [{ label: `〔商品規格ID-M0331-${no}〕`, check: unchanged() }] };
}
caseTest("IT-M03-31-035", dbCase("035", "blank-product-id-035.csv", keepOne("035")));
caseTest("IT-M03-31-036", dbCase("036", "blank-language-id-036.csv", keepOne("036")));
caseTest("IT-M03-31-037", dbCase("037", "blank-sell-price-037.csv", keepOne("037")));
caseTest("IT-M03-31-038", dbCase("038", "blank-buy-price-038.csv", keepOne("038")));
caseTest("IT-M03-31-039", dbCase("039", "blank-sale-flag-039.csv", keepOne("039")));
caseTest("IT-M03-31-040", dbCase("040", "invalid-product-id-040.csv", keepOne("040")));
caseTest("IT-M03-31-041", dbCase("041", "invalid-language-id-041.csv", keepOne("041")));
caseTest("IT-M03-31-042", dbCase("042", "invalid-sell-price-042.csv", keepOne("042")));
caseTest("IT-M03-31-043", dbCase("043", "invalid-buy-price-043.csv", keepOne("043")));
caseTest("IT-M03-31-044", dbCase("044", "invalid-sale-flag-044.csv", keepOne("044")));
caseTest("IT-M03-31-048", dbCase("048", "buy-over-sell-048.csv", keepOne("048")));

// 058: 上限を超える価格
caseTest("IT-M03-31-058", dbCase("058", "price-over-max-058.csv", {
  classes: [{ label: "〔商品規格ID-M0331-058〕", check: (b, a) => {
    expect.soft({ 販売価格: a.販売価格, 買取価格: a.買取価格 }, "販売価格と買取価格が更新前の値から変更されない").toEqual({ 販売価格: b.販売価格, 買取価格: b.買取価格 });
  } }],
}));

// 052・053・055: 受け付けるファイルの形式（値が反映される）
caseTest("IT-M03-31-052", dbCase("052", "valid.tsv", {
  classes: [{ label: "〔商品規格ID-M0331-052〕", check: updatedTo("1500", "500", true, BELT.of("052")) }],
}));
caseTest("IT-M03-31-053", dbCase("053", "non-utf8-053.csv", {
  classes: [{ label: "〔商品規格ID-M0331-053〕", check: updatedTo("1500", "500", true) }],
}));
caseTest("IT-M03-31-055", dbCase("055", "valid.txt", {
  classes: [{ label: "〔商品規格ID-M0331-055〕", check: updatedTo("1500", "500", true) }],
}));
