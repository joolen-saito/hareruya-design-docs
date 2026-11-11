/**
 * M07-02 古物台帳入力用CSV出力（買取検索一覧の「ダウンロード▼」→「古物台帳入力用CSV」）。正本: cases/M07-02_test_cases.tsv
 *
 * 実装していないケース（理由）:
 * - IT-M07-02-004: 注文日が未設定の買取を作れない（注文日は必ず入る項目）。シード表は固定ID（702005004）をDBへ直接登録する定め。
 * - IT-M07-02-014: 開始時にCSV出力設定を文字コード=SJIS-win に設定する。共有の設定を書き換えるので実装しない（手元の環境で行う）。
 * CSV出力設定（S-M07-02-CONFIG）は書き換えず、その環境の設定（UTF-8・カンマ・二重引用符のはず）のまま出力して読む。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { CSVを読む, コンソールで送る, チェックの値を変える, 開発者ツールのスクリプト, 検索して件数を確かめる, 買取番号の行, 読んだCSV } from "../../pages/admin/m07_02_csv";
import { M0702_ADMIN, 控え015, 検索語005, 検索語006, 検索語020, 姓 } from "../../seeds/m07-02";
import { 関連の記録を読む } from "../../db/m07_02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 古物台帳 = "古物台帳入力用CSV" as const;
const 呼び名 = (種類: string, 番号: string) => `〔${種類}-M0702-${番号}〕`;
const 買取 = (ctx: CaseCtx, ラベル: string) => ctx.notes.get(呼び名("買取注文ID", ラベル));

/** 事前準備のログインと検索（クリアして検索し、件数を確かめる）。買取一覧(検索結果)画面を返す */
async function 検索まで(ctx: CaseCtx, 条件: { 買取番号?: string; 注文者名?: string }, 件数: number): Promise<BuyListPage> {
  await loginAdmin(ctx.page, M0702_ADMIN);
  const l = new BuyListPage(ctx.page);
  await 検索して件数を確かめる(l, 条件, 件数);
  return l;
}

/** 手順「買取一覧(検索結果)画面を開く」 */
async function 結果画面を開く(l: BuyListPage): Promise<void> {
  await expect(l.結果の欄(), "買取一覧(検索結果)画面の結果").toBeVisible();
}

/** 手順「ダウンロード▼を押して古物台帳入力用CSVを押す」。CSVが出なければ止める */
async function CSVを出す(l: BuyListPage) {
  const r = await l.ダウンロードを押す(古物台帳);
  if (!r.file) throw new Error(`古物台帳入力用CSVが出力されない（応答 ${r.応答}、警告 ${r.ダイアログ.join(" / ") || "なし"}）`);
  return r.file;
}

/** 買取を1件選んでCSVを出し、その買取の行を返す（手順1〜4） */
async function 一件を出す(ctx: CaseCtx, ラベル: string, 五手順目あり = false): Promise<{ 番号: string; csv: () => 読んだCSV; 行: () => Record<string, string> }> {
  const 番号 = 買取(ctx, ラベル);
  const l = await 検索まで(ctx, { 買取番号: 番号 }, 1);
  let file!: Awaited<ReturnType<typeof CSVを出す>>;
  let csv!: 読んだCSV;
  await ctx.step(1, async () => { await 結果画面を開く(l); });
  await ctx.step(2, async () => { await l.対象にする(番号); });
  await ctx.step(3, async () => { file = await CSVを出す(l); });
  await ctx.step(4, async () => {
    csv = await CSVを読む(file);
    const r = 買取番号の行(csv, 番号);
    note(`ダウンロードしたCSVは ${csv.行.length} 行（買取番号 ${番号} の行は受注番号の列で探した）。見出し: ${csv.見出し.join("・")}`);
    expect(r, `CSVの買取番号 ${番号} の行`).toBeTruthy();
  });
  if (五手順目あり) await ctx.step(5, async () => { note("文字コードUTF-8、区切り文字カンマ、囲み文字二重引用符として読み取った（CSV出力設定はそのときの設定のまま）"); });
  return { 番号, csv: () => csv, 行: () => 買取番号の行(csv, 番号) ?? {} };
}

const 取り方の注記 = "CSVの列は、見出し「利用回数」「前回利用日」「点数」などで読んだ。買取番号の行は、見出し「受注番号」が買取番号（先頭の0を除いた数）の行";

caseTest("IT-M07-02-003", async (ctx) => {
  const r = await 一件を出す(ctx, "003A");
  await ctx.expected(async () => {
    expect.soft(r.行()["利用回数"], "利用回数（キャンセル済みの注文を含む）").toBe("3");
    expect.soft(r.行()["前回利用日"], "前回利用日").toBe("2026/08/15");
  });
  note(取り方の注記);
});

caseTest("IT-M07-02-005", async (ctx) => {
  const A = 買取(ctx, "005A"), B = 買取(ctx, "005B");
  const l = await 検索まで(ctx, { 注文者名: 検索語005() }, 2);
  let file!: Awaited<ReturnType<typeof CSVを出す>>;
  let csv!: 読んだCSV;
  await ctx.step(1, async () => { await 結果画面を開く(l); });
  await ctx.step(2, async () => { await l.対象にする(B); await l.対象にする(A); });
  await ctx.step(3, async () => { file = await CSVを出す(l); });
  await ctx.step(4, async () => { csv = await CSVを読む(file); note(`CSVのデータ行の受注番号: ${csv.行.map((x) => x["受注番号"]).join("、")}`); });
  await ctx.expected(async () => {
    expect.soft(csv.行.map((x) => x["受注番号"]), "CSVのデータ行（1件1行・買取番号の昇順）").toEqual([A, B].map((n) => String(Number(n))).sort((a, b) => Number(a) - Number(b)));
    expect.soft(Number(A) < Number(B), "買取番号は A が B より小さい（シード表の登録順）").toBe(true);
  });
  note("注文者名の検索語は、2人の姓に共通する「" + 検索語005() + "」（実行の印つき）");
});

caseTest("IT-M07-02-006", async (ctx) => {
  const A = 買取(ctx, "006A"), B = 買取(ctx, "006B");
  const l = await 検索まで(ctx, { 注文者名: 検索語006() }, 2);
  let file!: Awaited<ReturnType<typeof CSVを出す>>;
  let csv!: 読んだCSV;
  await ctx.step(1, async () => { await 結果画面を開く(l); });
  await ctx.step(2, async () => { await l.対象にする(A); await l.対象にする(B); });
  await ctx.step(3, async () => { await チェックの値を変える(l, B, "970299006"); note(`買取番号 ${B} のチェックボックスの値を、開発者ツールと同じに 970299006 へ書き換えた`); });
  await ctx.step(4, async () => { file = await CSVを出す(l); });
  await ctx.step(5, async () => { csv = await CSVを読む(file); });
  await ctx.expected(async () => {
    expect.soft(csv.行.map((x) => x["受注番号"]), "CSVのデータ行（存在する買取番号の1行だけ）").toEqual([String(Number(A))]);
    expect.soft(csv.行.some((x) => x["受注番号"] === "970299006"), "存在しないID 970299006 の行").toBe(false);
  });
});

caseTest("IT-M07-02-007", async (ctx) => {
  const 番号 = 買取(ctx, "007");
  const l = await 検索まで(ctx, { 買取番号: 番号 }, 1);
  expect(await l.行の(番号).locator('input[type="checkbox"]').isChecked(), "選択が解除されている").toBe(false);
  let 結果!: Awaited<ReturnType<typeof コンソールで送る>>;
  let 前 = 0;
  await ctx.step(1, async () => { await 結果画面を開く(l); });
  await ctx.step(2, async () => { 前 = 0; note("買取情報を選択せず、ダウンロードの記録を始めた（この画面で起きたダウンロードの数を数える。記録開始時は0件）"); });
  await ctx.step(3, async () => { 結果 = await コンソールで送る(ctx.page); note(`Consoleで実行したスクリプト: ${開発者ツールのスクリプト}（送信の応答 ${結果.応答}）`); });
  await ctx.step(4, async () => { note(`ダウンロードの数: ${結果.ダウンロード数}`); });
  await ctx.expected(async () => {
    expect.soft(結果.ダウンロード数 - 前, "新しく追加されたCSVファイルの数").toBe(0);
  });
});

caseTest("IT-M07-02-008", async (ctx) => {
  await loginAdmin(ctx.page, M0702_ADMIN);
  const l = new BuyListPage(ctx.page);
  const 名 = 姓("M0702PAGE008");
  await l.open();
  await l.注文者名を入れる(名);
  await l.検索する();
  await l.件数を選ぶ(10);
  await l.並べかえる("買取番号", "昇順");
  expect(await l.該当件数(), "検索結果の件数（注文者名のみ）").toBe(11);
  await l.ページを開く(2);
  await l.全選択のチェック().uncheck();
  expect(await ctx.page.locator('#result_list_main input[type="checkbox"]:checked').count(), "選択されている買取情報の数").toBe(0);
  let 結果!: Awaited<ReturnType<typeof コンソールで送る>>;
  await ctx.step(1, async () => { await 結果画面を開く(l); note("2ページ目で、買取情報を選択していない"); });
  await ctx.step(2, async () => { 結果 = await コンソールで送る(ctx.page); note(`Consoleで実行したスクリプト: ${開発者ツールのスクリプト}（送信の応答 ${結果.応答}）`); });
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "戻った画面（買取一覧(検索結果)の2ページ目）").toMatch(/\/purchase\/page\/2$/);
    await expect.soft(l.結果の欄(), "買取一覧(検索結果)の結果").toBeVisible();
    expect.soft(結果.ダウンロード数, "ダウンロードされたファイルの数").toBe(0);
  });
});

/** 選んだ買取のチェックの値を書き換えて古物台帳入力用CSVを押す（ケース009・010・011） */
async function 値を書き換えて押す(ctx: CaseCtx, ラベル: string, 値: string, 手順: { 記録あり: boolean }) {
  const 番号 = 買取(ctx, ラベル);
  const l = await 検索まで(ctx, { 買取番号: 番号 }, 1);
  let 結果!: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>>;
  let n = 1;
  await ctx.step(n++, async () => { await 結果画面を開く(l); });
  await ctx.step(n++, async () => { await l.対象にする(番号); });
  await ctx.step(n++, async () => { await チェックの値を変える(l, 番号, 値); note(`買取番号 ${番号} のチェックボックスの値を、開発者ツールと同じに ${値} へ書き換えた`); });
  if (手順.記録あり) await ctx.step(n++, async () => { note("この画面で起きたダウンロードを数え始めた（記録開始時は0件）"); });
  await ctx.step(n++, async () => { 結果 = await l.ダウンロードを押す(古物台帳); });
  if (手順.記録あり) await ctx.step(n++, async () => { note(`ダウンロードの数: ${結果.file ? 1 : 0}（送信の応答 ${結果.応答}、警告 ${結果.ダイアログ.join(" / ") || "なし"}）`); });
  return { l, 結果 };
}

caseTest("IT-M07-02-009", async (ctx) => {
  const { 結果 } = await 値を書き換えて押す(ctx, "009", "999999009", { 記録あり: true });
  await ctx.expected(async () => { expect.soft(結果.file, "新しく追加されたCSVファイル").toBeNull(); });
});

caseTest("IT-M07-02-010", async (ctx) => {
  const { l } = await 値を書き換えて押す(ctx, "010", "999999010", { 記録あり: false });
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "戻った画面（買取一覧(検索結果)）").toMatch(/\/purchase\/page\/\d+$/);
    await expect.soft(l.結果の欄(), "買取一覧(検索結果)の結果").toBeVisible();
  });
});

caseTest("IT-M07-02-011", async (ctx) => {
  const { 結果 } = await 値を書き換えて押す(ctx, "011", "0", { 記録あり: true });
  await ctx.expected(async () => { expect.soft(結果.file, "新しく追加されたCSVファイル（0を除くと買取注文IDが残らない）").toBeNull(); });
});

caseTest("IT-M07-02-013", async (ctx) => {
  const r = await 一件を出す(ctx, "013", true);
  await ctx.expected(async () => {
    const csv = r.csv();
    expect.soft(csv.先頭がBOM, "ファイル先頭のUTF-8のBOM").toBe(true);
    expect.soft(csv.見出し.length, "見出しの列数").toBe(15);
    expect.soft(csv.全行.every((x) => x.length === 15), "すべての行が15列として読み取れる").toBe(true);
    expect.soft(r.行()["住所"], "住所列の値（カンマを欠落させない）").toBe("東京都 千代田区 丸の内1-1ハレルヤ,ビル");
    expect.soft(csv.文字.includes('"東京都 千代田区 丸の内1-1ハレルヤ,ビル"'), "住所が二重引用符で囲まれている").toBe(true);
  });
  note("文字コードUTF-8・区切り文字カンマ・囲み文字二重引用符は、共有の設定を書き換えずにそのときの設定のまま読み取った（設定が違えば列数や文字化けで落ちる）。先頭のBOMは、ダウンロードしたファイルの先頭3バイトが EF BB BF であることで確かめた");
});

caseTest("IT-M07-02-015", async (ctx) => {
  const 番号 = 控え015.get("買取番号"), 会員ID = 控え015.get("会員ID");
  if (!番号 || !会員ID) throw new Error("シードが買取番号・会員IDを控えていない");
  let 前!: ReturnType<typeof 関連の記録を読む>;
  let l!: BuyListPage;
  await loginAdmin(ctx.page, M0702_ADMIN);
  l = new BuyListPage(ctx.page);
  await 検索して件数を確かめる(l, { 買取番号: 番号 }, 1);
  await ctx.step(1, async () => {
    前 = 関連の記録を読む(会員ID);
    note(`記録した件数: 買取注文 ${前.買取注文.length}、買取明細 ${前.買取明細.length}、個別入力商品 ${前.個別入力商品.length}、会員 ${前.会員.length}、プレイヤー ${前.プレイヤー.length}（各行の全項目と更新日時を記録）`);
    expect(前.買取注文.length, "同じ会員の買取注文（今回と過去2件）").toBe(3);
    expect(前.個別入力商品.length, "個別入力商品").toBe(1);
  });
  await ctx.step(2, async () => { await 結果画面を開く(l); });
  await ctx.step(3, async () => { await l.対象にする(番号); });
  let file!: Awaited<ReturnType<typeof CSVを出す>>;
  await ctx.step(4, async () => { file = await CSVを出す(l); await CSVを読む(file); });
  let 後!: ReturnType<typeof 関連の記録を読む>;
  await ctx.step(5, async () => { 後 = 関連の記録を読む(会員ID); });
  await ctx.expected(async () => {
    for (const k of ["買取注文", "買取明細", "個別入力商品", "会員", "プレイヤー"] as const) {
      expect.soft(後[k].length, `${k}の件数`).toBe(前[k].length);
      expect.soft(後[k], `${k}の値・更新日時（出力前と同じ）`).toEqual(前[k]);
    }
  });
  note("シード表は固定ID（702001015 など）と更新日時の指定でDBに登録する定め。固定IDは振れないので、画面で作った買取（番号 " + 番号 + "）を使い、同じ会員の買取注文・買取明細・個別入力商品・会員・プレイヤーの全項目（更新日時を含む）を出力の前後で比べた。本人確認情報はプレイヤーの項目で比べた。買取明細は申込みの1件");
});

caseTest("IT-M07-02-017", async (ctx) => {
  const r = await 一件を出す(ctx, "017");
  await ctx.expected(async () => { expect.soft(r.行()["点数"], "点数").toBe("1"); });
  note(取り方の注記);
});

caseTest("IT-M07-02-018", async (ctx) => {
  const r = await 一件を出す(ctx, "018");
  await ctx.expected(async () => { expect.soft(r.行()["利用回数"], "利用回数").toBe("1"); });
  note(取り方の注記);
});

caseTest("IT-M07-02-019", async (ctx) => {
  const r = await 一件を出す(ctx, "019A");
  await ctx.expected(async () => { expect.soft(r.行()["前回利用日"], "前回利用日").toBe("2026/07/01"); });
  note(取り方の注記);
});

caseTest("IT-M07-02-020", async (ctx) => {
  const A = 買取(ctx, "020A"), P = 買取(ctx, "020P"), B = 買取(ctx, "020B");
  await loginAdmin(ctx.page, M0702_ADMIN);
  const l = new BuyListPage(ctx.page);
  let file!: Awaited<ReturnType<typeof CSVを出す>>;
  let csv!: 読んだCSV;
  await ctx.step(1, async () => {
    await l.open();
    await l.注文者名を入れる(検索語020());
    await l.検索する();
    const got = (await l.行()).map((r) => r.番号).sort();
    expect(got, "検索結果（3件だけ）").toEqual([A, P, B].sort());
  });
  await ctx.step(2, async () => { await l.対象にする(A); await l.対象にする(B); });
  await ctx.step(3, async () => { file = await CSVを出す(l); });
  await ctx.step(4, async () => { csv = await CSVを読む(file); note(`CSVのデータ行の受注番号: ${csv.行.map((x) => x["受注番号"]).join("、")}`); });
  await ctx.expected(async () => {
    const ra = 買取番号の行(csv, A), rb = 買取番号の行(csv, B);
    expect.soft(csv.行.length, "CSVのデータ行の数（過去の買取は含まない）").toBe(2);
    expect.soft(ra?.["利用回数"], "買取番号A の利用回数").toBe("2");
    expect.soft(ra?.["前回利用日"], "買取番号A の前回利用日").toBe("2026/07/01");
    expect.soft(rb?.["利用回数"], "買取番号B の利用回数").toBe("1");
    expect.soft(rb?.["前回利用日"], "買取番号B の前回利用日（空欄）").toBe("");
  });
  note(`注文者名の検索語は、正本の「M0702DP 020」の2語目に実行の印を付けた「${検索語020()}」（両会員の姓にどちらの語も含まれる）`);
});
