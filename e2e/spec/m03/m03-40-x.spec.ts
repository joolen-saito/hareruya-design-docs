/**
 * M03-40 棚番号更新CSV登録の続き（-x）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースの分。
 * 正本: cases/M03-40_test_cases.tsv。シード: seeds/m03-40-x.ts（棚番号は開発環境の既存の「S-001」「S-002」で読み替え・商品とファイルは実行の印つき）。
 *
 * 実装したケース: 004・005・006・007・010・011・012・015・017・018・019・020・029・030・031・032・034・038・040。
 * 実装していないケース（review/recheck_not_buildable_M03-40.tsv）: 009・013・014。
 */
import { test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 商品コードの規格の棚番号, 棚番号更新の取込履歴, 規格と商品の項目 } from "../../db/m03_40_x";
import { tamperToken } from "../../pages/admin/devtools";
import { CsvUploadResult, describeCsvUpload } from "../../pages/admin/m03_38_product_status_csv";
import { ShelfNumberCsvScreen, 棚番号更新CSV登録 } from "../../pages/admin/m03_40_shelf_number_csv";
import { M0340_ADMIN, M0340_ADMIN_NAME } from "../../seeds/m03-40";
import { m0340xFile, 商品の, 棚1, 棚2 } from "../../seeds/m03-40-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(ctx: CaseCtx): Promise<ShelfNumberCsvScreen> {
  await loginAdmin(ctx.page, M0340_ADMIN);
  return new ShelfNumberCsvScreen(ctx.page);
}

async function upload(csv: ShelfNumberCsvScreen, 正本の名前: string): Promise<CsvUploadResult> {
  const f = m0340xFile(正本の名前);
  note(`${正本の名前}: ${f.name}（${f.内容の要約}・送る形式種別 ${f.mimeType ?? "text/csv"}）を選んだ`);
  const r = await csv.upload(f);
  note(`${正本の名前} のアップロードの結果: ${describeCsvUpload(r)}`);
  return r;
}

/** 商品の規格の棚番号の名前（商品規格IDの順） */
function 棚(nnn: string, 正本の商品コード: string): (string | null)[] {
  const code = 商品の(nnn, 正本の商品コード).商品コード;
  const rows = 商品コードの規格の棚番号(code);
  note(`DB: 商品コード ${code} の商品規格と棚番号: ${rows.map((r) => `${r.商品規格ID}→${r.棚番号 ?? "なし"}`).join("、")}`);
  return rows.map((r) => r.棚番号);
}

function 履歴(正本の名前: string): number {
  const name = m0340xFile(正本の名前).name;
  const rows = 棚番号更新の取込履歴(name);
  note(`DB: 棚番号更新CSVの取込履歴のうちファイル名「${name}」の行: ${rows.length} 件`);
  return rows.length;
}

const 画面か = (csv: ShelfNumberCsvScreen) => csv.isOnScreen();

// ---- 正常に取り込むもの ----

caseTest("IT-M03-40-004", async (ctx) => {
  const csv = await signIn(ctx);
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => { await upload(csv, "m0340-normal-004.csv"); });
  await ctx.step(3, async () => { a = 棚("004", "34000401"); b = 棚("004", "34000402"); });
  await ctx.expected(async () => {
    expect.soft(a, `商品コード 34000401 の棚番号（S-002-004 の読み替え ${棚2}）`).toEqual([棚2]);
    expect.soft(b, `商品コード 34000402 の棚番号（S-001-004 の読み替え ${棚1}）`).toEqual([棚1]);
  });
});

caseTest("IT-M03-40-005", async (ctx) => {
  const csv = await signIn(ctx);
  let r: CsvUploadResult | null = null;
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => { r = await upload(csv, "m0340-normal-005.csv"); });
  await ctx.expected(async () => {
    const got = r as unknown as CsvUploadResult;
    expect.soft(got.送信した, "アップロードが送信された").toBe(true);
    expect.soft(await 画面か(csv), `取込のあと表示中の画面が棚番号更新CSV登録画面（${ctx.page.url()}）`).toBe(true);
    expect.soft(got.上部のエラー, "誤りの帯が出ていない").toEqual([]);
  });
});

caseTest("IT-M03-40-006", async (ctx) => {
  const csv = await signIn(ctx);
  let rows: ReturnType<typeof 棚番号更新の取込履歴> = [];
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => { await upload(csv, "m0340-normal-006.csv"); });
  await ctx.step(3, async () => {
    rows = 棚番号更新の取込履歴(m0340xFile("m0340-normal-006.csv").name);
    note(`DB: 取込履歴の行: ${JSON.stringify(rows)}`);
  });
  await ctx.expected(async () => {
    expect.soft(rows.length, "取込履歴が1件追加された").toBe(1);
    const h = rows[0];
    expect.soft(h?.種別, "取込履歴の種別").toBe("棚番号更新");
    expect.soft(h?.ファイル名, "取込履歴の元のファイル名（m0340-normal-006.csv。実行の印つき）").toBe(m0340xFile("m0340-normal-006.csv").name);
    expect.soft(h?.取込日時 ?? "", "取込履歴の取込日時").toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect.soft(h?.作業者, "取込履歴の作業者（M03-40試験管理者。実行の印つき）").toBe(M0340_ADMIN_NAME);
  });
});

caseTest("IT-M03-40-007", async (ctx) => {
  const csv = await signIn(ctx);
  const ids = () => [商品の("007", "34000701").商品規格ID[0], 商品の("007", "34000702").商品規格ID[0]];
  let before: { 規格: string; 商品: string }[] = [];
  let after: { 規格: string; 商品: string }[] = [];
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  await ctx.step(1, async () => {
    await csv.open();
    before = ids().map((id) => 規格と商品の項目(id));
    note("取込の前に、2商品の商品・商品規格の項目（棚番号を除く。更新日時を含む）を DB で控えた（正本の更新日時 2026-09-01 09:00 などは画面で指定できないので、控えた値と比べる）");
  });
  await ctx.step(2, async () => { await upload(csv, "m0340-normal-007.csv"); });
  await ctx.step(3, async () => {
    after = ids().map((id) => 規格と商品の項目(id));
    a = 棚("007", "34000701"); b = 棚("007", "34000702");
  });
  await ctx.expected(async () => {
    expect.soft(a, `商品甲の棚番号が CSV の値（${棚2}）`).toEqual([棚2]);
    expect.soft(b, `商品乙の棚番号が CSV の値（${棚1}）`).toEqual([棚1]);
    for (const [i, name] of ["商品甲", "商品乙"].entries()) {
      expect.soft(after[i]?.規格, `${name}: 商品規格の棚番号以外の項目と更新日時が取込前のまま`).toBe(before[i]?.規格);
      expect.soft(after[i]?.商品, `${name}: 商品の項目と更新日時が取込前のまま`).toBe(before[i]?.商品);
    }
  });
});

caseTest("IT-M03-40-010", async (ctx) => {
  const csv = await signIn(ctx);
  const got: (string | null)[][] = [];
  const files = ["m0340-lf-010.csv", "m0340-crlf-010.csv", "m0340-cr-010.csv"];
  for (const [i, f] of files.entries()) {
    await ctx.step(i + 1, async () => { await csv.open(); await upload(csv, f); });
  }
  await ctx.step(4, async () => { for (const c of ["4012", "4013", "4014"]) got.push(棚("010", c)); });
  await ctx.expected(async () => {
    for (const [i, c] of ["4012（LF）", "4013（CRLF）", "4014（CR）"].entries()) expect.soft(got[i], `商品コード ${c} の棚番号（S-002-010 の読み替え ${棚2}）`).toEqual([棚2]);
  });
});

/** 1商品を取り込んで、棚番号が S-002 の読み替えになったことを確かめる */
function 一つ更新(nnn: string, ファイル: string, 商品コード: string, 何: string) {
  return async (ctx: CaseCtx) => {
    const csv = await signIn(ctx);
    let got: (string | null)[] = [];
    await ctx.step(1, async () => { await csv.open(); });
    await ctx.step(2, async () => { await upload(csv, ファイル); });
    await ctx.step(3, async () => { got = 棚(nnn, 商品コード); });
    await ctx.expected(async () => { expect.soft(got, `${何}: 商品コード ${商品コード} の棚番号（S-002-${nnn} の読み替え ${棚2}）`).toEqual([棚2]); });
  };
}
caseTest("IT-M03-40-011", 一つ更新("011", "m0340-bom-zwsp-011.csv", "34001101", "BOM とゼロ幅スペースを含むファイル"));
caseTest("IT-M03-40-012", 一つ更新("012", "m0340-tab-012.tsv", "4016", "タブ区切りの tsv ファイル"));
caseTest("IT-M03-40-032", 一つ更新("032", "m0340-duplicate-032.csv", "4022", "同じ商品コードの2件（後のレコードが S-002-032）"));

caseTest("IT-M03-40-017", async (ctx) => {
  const csv = await signIn(ctx);
  let got: (string | null)[] = [];
  let n = -1;
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => { await upload(csv, "m0340-size-max-017.csv"); });
  await ctx.step(3, async () => { got = 棚("017", "4018"); n = 履歴("m0340-size-max-017.csv"); });
  await ctx.expected(async () => {
    expect.soft(got, `商品コード 4018 の棚番号（S-002-017 の読み替え ${棚2}）`).toEqual([棚2]);
    expect.soft(n, "取込履歴が1件追加された").toBe(1);
  });
});

caseTest("IT-M03-40-038", async (ctx) => {
  const csv = await signIn(ctx);
  const 帯: string[][] = [];
  let got: (string | null)[] = [];
  let n = -1;
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => {
    const r = await upload(csv, "m0340-repeat-038.csv");
    帯.push(r.上部の成功);
    expect(r.上部の成功.length, `1回目の取込の登録完了の帯（${describeCsvUpload(r)}）`).toBeGreaterThan(0);
  });
  await ctx.step(3, async () => { await csv.open(); const r = await upload(csv, "m0340-repeat-038.csv"); 帯.push(r.上部の成功); });
  await ctx.step(4, async () => { got = 棚("038", "M0340-038-A"); n = 履歴("m0340-repeat-038.csv"); });
  await ctx.expected(async () => {
    expect.soft((帯[1] ?? []).length, `2回目の取込も登録完了（成功の帯: ${(帯[1] ?? []).join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(got, `商品規格の棚番号（S-002-038 の読み替え ${棚2}）`).toEqual([棚2]);
    expect.soft(n, "元のファイル名 m0340-repeat-038.csv の棚番号更新CSVの取込履歴").toBe(2);
  });
});

// ---- 取り込まれないもの（棚番号が変わらず、取込履歴も増えない） ----

function 変わらない(nnn: string, ファイル: string[], 商品: [string, string][], 何: string) {
  return async (ctx: CaseCtx) => {
    const csv = await signIn(ctx);
    const got: Record<string, (string | null)[]> = {};
    const n: Record<string, number> = {};
    for (const [i, f] of ファイル.entries()) {
      await ctx.step(i + 1, async () => { await csv.open(); await upload(csv, f); });
    }
    await ctx.step(ファイル.length + 1, async () => {
      for (const [code] of 商品) got[code] = 棚(nnn, code);
      for (const f of ファイル) n[f] = 履歴(f);
    });
    await ctx.expected(async () => {
      for (const [code, shelf] of 商品) expect.soft(got[code], `${何}: 商品コード ${code} の棚番号（取込前の ${shelf} のまま）`).toEqual([shelf]);
      for (const f of ファイル) expect.soft(n[f], `${何}: ${f} の取込履歴（追加されない）`).toBe(0);
    });
  };
}
caseTest("IT-M03-40-015", 変わらない("015", ["m0340-110000-015.csv"], [["4030", 棚1]], "データレコード110000件"));
caseTest("IT-M03-40-018", 変わらない("018", ["m0340-size-over-018.csv"], [["4018", 棚1]], "アップロードサイズ上限を1バイト超えるファイル"));
caseTest("IT-M03-40-029", 変わらない("029", ["m0340-unknown-product-029.csv", "m0340-deleted-product-029.csv"], [["4099", 棚1]], "未登録・削除済みの商品コード"));
caseTest("IT-M03-40-030", 変わらない("030", ["m0340-unknown-shelf-030.csv"], [["34003001", 棚1]], "未登録の棚番号名称"));
caseTest("IT-M03-40-031", 変わらない("031", ["m0340-rollback-031.csv"], [["34003101", 棚1], ["34003102", 棚2]], "2件目が未登録の商品コード"));

caseTest("IT-M03-40-040", async (ctx) => {
  const csv = await signIn(ctx);
  let got: (string | null)[] = [];
  let n = -1;
  await ctx.step(1, async () => { await csv.open(); });
  await ctx.step(2, async () => { await upload(csv, "cbm0340-040.csv"); });
  await ctx.step(3, async () => { got = 棚("040", "M0340-CB040-P"); n = 履歴("cbm0340-040.csv"); });
  await ctx.expected(async () => {
    expect.soft(got, `商品コード M0340-CB040-P の2件の商品規格の棚番号（S-M0340-CB040-OLD の読み替え ${棚1} のまま）`).toEqual([棚1, 棚1]);
    expect.soft(n, "取込履歴（追加されない）").toBe(0);
  });
});

// ---- なりすまし対策トークン（019・020） ----

caseTest("IT-M03-40-019", async (ctx) => {
  const csv = await signIn(ctx);
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  let n = -1;
  const 送る = async (when: string) => { const r = await csv.pressUpload(); note(`${when}: ${describeCsvUpload(r)}`); };
  await ctx.step(1, async () => { await csv.open(); await csv.choose(m0340xFile("m0340-normal-019.csv")); });
  await ctx.step(2, async () => { await tamperToken(csv.form, "なし"); note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンの入力要素を取り除いた"); await 送る("トークンを取り除いて送った結果"); });
  await ctx.step(3, async () => { await csv.open(); await csv.choose(m0340xFile("m0340-normal-019.csv")); });
  await ctx.step(4, async () => { await tamperToken(csv.form, "invalid-token"); note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンを「invalid-token」に変えた"); await 送る("トークンを変えて送った結果"); });
  await ctx.step(5, async () => { a = 棚("019", "34001901"); b = 棚("019", "34001902"); n = 履歴("m0340-normal-019.csv"); });
  await ctx.expected(async () => {
    expect.soft(a, `商品コード 34001901 の棚番号（取込前の ${棚1} のまま）`).toEqual([棚1]);
    expect.soft(b, `商品コード 34001902 の棚番号（取込前の ${棚2} のまま）`).toEqual([棚2]);
    expect.soft(n, "取込履歴（追加されない）").toBe(0);
  });
});

caseTest("IT-M03-40-020", async (ctx) => {
  const csv = await signIn(ctx);
  let r: CsvUploadResult | null = null;
  await ctx.step(1, async () => { await csv.open(); await csv.choose(m0340xFile("m0340-normal-020.csv")); });
  await ctx.step(2, async () => { await tamperToken(csv.form, "invalid-token"); note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンを「invalid-token」に変えた"); });
  await ctx.step(3, async () => { r = await csv.pressUpload(); note(`送った結果: ${describeCsvUpload(r)}`); });
  await ctx.expected(async () => {
    expect.soft((r as unknown as CsvUploadResult).応答, "取込の要求への応答（アクセス拒否）").toBe(403);
  });
});

// ---- 034 いろいろな誤りのあと画面へ戻る ----

caseTest("IT-M03-40-034", async (ctx) => {
  const csv = await signIn(ctx);
  const seen: { 何: string; 戻った: boolean; 画面: string }[] = [];
  const 戻ったか = async (何: string) => { seen.push({ 何, 戻った: await 画面か(csv), 画面: new URL(ctx.page.url()).pathname }); };
  await ctx.step(1, async () => {
    await csv.open();
    const r = await csv.pressUpload();
    note(`ファイル未選択で押した結果: ${describeCsvUpload(r)}`);
    await 戻ったか("ファイル未選択");
  });
  const files = ["m0340-size-over-034.csv", "m0340-invalid-034.png", "m0340-110000-034.csv", "m0340-empty-product-code-034.csv", "m0340-unknown-product-034.csv", "m0340-unknown-shelf-034.csv"];
  for (const [i, f] of files.entries()) {
    await ctx.step(i + 2, async () => { await csv.open(); await upload(csv, f); await 戻ったか(f); });
  }
  await ctx.expected(async () => {
    expect(seen.length, "7回の操作の結果を読んだ").toBe(7);
    for (const s of seen) expect.soft(s.戻った, `${s.何}: 処理のあと棚番号更新CSV登録画面へ戻る（表示中 ${s.画面}・画面 ${棚番号更新CSV登録.画面}）`).toBe(true);
  });
});
