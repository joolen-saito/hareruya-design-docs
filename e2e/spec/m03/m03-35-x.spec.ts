/**
 * M03-35 部門更新CSV登録の続き（-x）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースの分。
 * 正本: cases/M03-35_test_cases.tsv。シード: seeds/m03-35-x.ts（部門コード31〜33の部門は開発環境の既存の部門で読み替え・商品とファイルは実行の印つき）。
 *
 * 実装したケース: 001・002・006・007・010・011・012・014・022・033・035・036・037・038・039・043・047・049・050。
 * 実装していないケース（review/recheck_not_buildable_M03-35.tsv）: 004・013・015・016・017。
 */
import { test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 商品コードの規格の部門, 部門更新の取込履歴の数 } from "../../db/m03_35_x";
import { SectionUpdateCsvPage, sectionUpdateCsvPath, UploadResult } from "../../pages/admin/m03_35_section_update_csv";
import { 取込履歴のページを選ぶ, 取込履歴の件数を選ぶ, 取込履歴の今のページ } from "../../pages/admin/m03_35_40_x";
import { M0335_ADMIN } from "../../seeds/m03-35";
import { m0335xFile, 商品の, 履歴担当の名前 } from "../../seeds/m03-35-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(ctx: CaseCtx): Promise<SectionUpdateCsvPage> {
  await loginAdmin(ctx.page, M0335_ADMIN);
  return new SectionUpdateCsvPage(ctx.page);
}

async function noteUpload(u: SectionUpdateCsvPage, r: UploadResult, when: string): Promise<void> {
  if (!r.sent) { note(`${when}: ブラウザの入力チェックが送信を止めた: ${r.止めた項目.join(" / ")}`); return; }
  const m = await u.messages();
  note(`${when}: 取込の要求の応答 ${r.応答}、戻った画面 ${r.戻った画面}。成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}`);
}

/** ファイルを選んで、アップロードボタンを押す（画面は開いてある） */
async function upload(u: SectionUpdateCsvPage, 正本の名前: string): Promise<UploadResult> {
  const f = m0335xFile(正本の名前);
  await u.choose(f);
  note(`${正本の名前}: ${f.name}（${f.buffer.length} バイト・送る形式種別 ${f.mimeType}）を選んだ`);
  const r = await u.pressUpload();
  await noteUpload(u, r, `${正本の名前} のアップロードのあと`);
  return r;
}

/** 商品コードの規格の部門ID（商品規格IDの順） */
function 部門(正本の商品コード: string): (string | null)[] {
  const rows = 商品コードの規格の部門(商品の(正本の商品コード).商品コード);
  note(`DB: 商品コード ${商品の(正本の商品コード).商品コード} の商品規格と部門ID: ${rows.map((r) => `${r.商品規格ID}→${r.部門ID ?? "なし"}`).join("、")}`);
  return rows.map((r) => r.部門ID);
}

function 履歴の数(正本の名前: string): number {
  const name = m0335xFile(正本の名前).name;
  const n = 部門更新の取込履歴の数(name);
  note(`DB: 部門更新CSVの取込履歴のうちファイル名「${name}」の行: ${n} 件`);
  return n;
}

// ---- 正常に取り込むもの ----

/** SEC の組（SEC-A の2規格→共有B・SEC-B→共有A）を取り込み、DB で確かめる */
caseTest("IT-M03-35-001", async (ctx) => {
  const u = await signIn(ctx);
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { await upload(u, "m0335_normal-001.csv"); });
  await ctx.step(3, async () => { a = 部門("SEC-A-001-001"); b = 部門("SEC-B-001-001"); });
  await ctx.expected(async () => {
    const B = ctx.notes.get("〔部門ID-M0335-共有B〕");
    const A = ctx.notes.get("〔部門ID-M0335-共有A〕");
    expect.soft(a, "商品コード SEC-A-001-001 に一致する2件の部門ID").toEqual([B, B]);
    expect.soft(b, "商品コード SEC-B-001-001 の部門ID").toEqual([A]);
  });
});

caseTest("IT-M03-35-002", async (ctx) => {
  const u = await signIn(ctx);
  let r: UploadResult = { sent: false, 止めた項目: [] };
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { r = await upload(u, "m0335_normal-002.csv"); });
  await ctx.expected(async () => {
    expect.soft(r.sent, "アップロードボタンで取込の要求が送られた").toBe(true);
    if (!r.sent) return;
    expect.soft(r.戻った画面, "取込のあと表示された画面").toBe(sectionUpdateCsvPath());
    await expect.soft(u.取込ファイル, "部門更新CSV登録画面の取込ファイルの欄").toHaveCount(1);
    await expect.soft(u.アップロードボタン, "部門更新CSV登録画面のアップロードボタン").toBeVisible();
    const m = await u.messages();
    expect.soft(m.成功.length, `取込が完了した帯が出ている（成功: ${m.成功.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(m.エラー, "誤りの帯が出ていない").toEqual([]);
  });
});

/** 1商品を取り込んで、部門が呼び名の部門になったことを確かめる（形式の違うファイル） */
function 一つ更新(ファイル: string, 商品コード: string, 呼び名: string, 何: string) {
  return async (ctx: CaseCtx) => {
    const u = await signIn(ctx);
    let got: (string | null)[] = [];
    await ctx.step(1, async () => { await u.open(); });
    await ctx.step(2, async () => { await upload(u, ファイル); });
    await ctx.step(3, async () => { got = 部門(商品コード); });
    await ctx.expected(async () => {
      expect.soft(got, `${何}: 商品コード ${商品コード} の部門ID`).toEqual([ctx.notes.get(呼び名)]);
    });
  };
}
caseTest("IT-M03-35-010", 一つ更新("m0335_sjis-010.csv", "FMT-SJIS-001-010", "〔部門ID-M0335-共有B〕", "Shift_JIS のCSV"));
caseTest("IT-M03-35-011", 一つ更新("m0335_tab-011.tsv", "FMT-TSV-001-011", "〔部門ID-M0335-共有B〕", "タブ区切りのファイル"));
caseTest("IT-M03-35-012", 一つ更新("m0335_text-012.txt", "FMT-TXT-001-012", "〔部門ID-M0335-共有B〕", "カンマ区切りのテキストファイル"));
caseTest("IT-M03-35-014", 一つ更新("m0335_zwsp-014.csv", "FMT-ZWSP-001-014", "〔部門ID-M0335-共有B〕", "ゼロ幅空白を含むファイル"));
caseTest("IT-M03-35-037", 一つ更新("m0335_duplicate-037.csv", "DUP-001-037", "〔部門ID-M0335-共有C〕", "同じ商品コードの2行（最後の行が部門コード33）"));

caseTest("IT-M03-35-043", async (ctx) => {
  const u = await signIn(ctx);
  let got: (string | null)[] = [];
  let 種別 = "";
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { await u.choose(m0335xFile("m0335_excel-043.xls")); });
  await ctx.step(3, async () => {
    // 開発者ツールの代わりに、送信の要求の本文からファイルの種別を読む
    const req = ctx.page.waitForRequest((q) => q.method() === "POST" && /\/product\/section\/import$/.test(new URL(q.url()).pathname));
    const r = await u.pressUpload();
    const body = (await req).postDataBuffer()?.toString("latin1") ?? "";
    種別 = /Content-Type:\s*(\S+)/i.exec(body.slice(body.indexOf("filename=")))?.[1] ?? "";
    note(`送信されたファイルの種別: ${種別 || "読めない"}`);
    await noteUpload(u, r, "m0335_excel-043.xls のアップロードのあと");
  });
  await ctx.step(4, async () => { got = 部門("FMT-XLS-001-043"); });
  await ctx.expected(async () => {
    expect.soft(種別, "送信されたファイルの種別").toBe("application/vnd.ms-excel");
    expect.soft(got, "商品コード FMT-XLS-001-043 の部門ID").toEqual([ctx.notes.get("〔部門ID-M0335-共有B〕")]);
  });
});

caseTest("IT-M03-35-047", async (ctx) => {
  const u = await signIn(ctx);
  let got: (string | null)[] = [];
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { await u.choose(m0335xFile("m0335-047-a.dat")); note("開発者ツールの代わりに、選ぶときのファイルの種別を text/csv にした（送信されるファイルの種別を書き換えて送るのと同じ要求になる）"); });
  await ctx.step(3, async () => { const r = await u.pressUpload(); await noteUpload(u, r, "m0335-047-a.dat のアップロードのあと"); });
  await ctx.step(4, async () => { got = 部門("M0335-047-A"); });
  await ctx.expected(async () => {
    expect.soft(got, "商品コード M0335-047-A の部門ID（共有A から共有B へ）").toEqual([ctx.notes.get("〔部門ID-M0335-共有B〕")]);
  });
});

caseTest("IT-M03-35-049", async (ctx) => {
  const u = await signIn(ctx);
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  let n = -1;
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { await upload(u, "m0335_exact-049.csv"); });
  await ctx.step(3, async () => { a = 部門("SEC-A-001-049"); b = 部門("SEC-B-001-049"); n = 履歴の数("m0335_exact-049.csv"); });
  await ctx.expected(async () => {
    const B = ctx.notes.get("〔部門ID-M0335-共有B〕");
    const A = ctx.notes.get("〔部門ID-M0335-共有A〕");
    expect.soft(a, "商品コード SEC-A-001-049 に一致する2件の部門ID").toEqual([B, B]);
    expect.soft(b, "商品コード SEC-B-001-049 の部門ID").toEqual([A]);
    expect.soft(n, "m0335_exact-049.csv の取込履歴の数").toBe(1);
  });
});

caseTest("IT-M03-35-050", async (ctx) => {
  const u = await signIn(ctx);
  const 成功: string[][] = [];
  let a: (string | null)[] = [];
  let b: (string | null)[] = [];
  let n = -1;
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => {
    await upload(u, "m0335_repeat-050.csv");
    const m = await u.messages();
    成功.push(m.成功);
    expect(m.成功.join(" "), "1回目の取込の「登録が完了しました。」").toContain("登録が完了しました。");
  });
  await ctx.step(3, async () => {
    await u.open();
    await upload(u, "m0335_repeat-050.csv");
    成功.push((await u.messages()).成功);
  });
  await ctx.step(4, async () => { a = 部門("SEC-A-001-050"); b = 部門("SEC-B-001-050"); n = 履歴の数("m0335_repeat-050.csv"); });
  await ctx.expected(async () => {
    const B = ctx.notes.get("〔部門ID-M0335-共有B〕");
    const A = ctx.notes.get("〔部門ID-M0335-共有A〕");
    expect.soft((成功[1] ?? []).join(" "), "2回目の取込の帯").toContain("登録が完了しました。");
    expect.soft(a, "商品コード SEC-A-001-050 に一致する2件の部門ID").toEqual([B, B]);
    expect.soft(b, "商品コード SEC-B-001-050 の部門ID").toEqual([A]);
    expect.soft(n, "m0335_repeat-050.csv の取込履歴の数").toBe(2);
  });
});

// ---- 取り込まれないもの（部門が変わらず、取込履歴も増えない） ----

function 変わらない(ファイル: string, 商品: [string, string[]][], 何: string) {
  return async (ctx: CaseCtx) => {
    const u = await signIn(ctx);
    const got: Record<string, (string | null)[]> = {};
    let n = -1;
    await ctx.step(1, async () => { await u.open(); });
    await ctx.step(2, async () => { await upload(u, ファイル); });
    await ctx.step(3, async () => {
      for (const [code] of 商品) got[code] = 部門(code);
      n = 履歴の数(ファイル);
    });
    await ctx.expected(async () => {
      for (const [code, labels] of 商品) expect.soft(got[code], `${何}: 商品コード ${code} の部門ID（取込前のまま）`).toEqual(labels.map((l) => ctx.notes.get(l)));
      expect.soft(n, `${何}: ${ファイル} の取込履歴（追加されない）`).toBe(0);
    });
  };
}
const SECの取込前 = (nnn: string): [string, string[]][] => [
  [`SEC-A-001-${nnn}`, ["〔部門ID-M0335-共有A〕", "〔部門ID-M0335-共有A〕"]],
  [`SEC-B-001-${nnn}`, ["〔部門ID-M0335-共有B〕"]],
];
caseTest("IT-M03-35-022", 変わらない("m0335_oversize-022.csv", SECの取込前("022"), "ファイルサイズ上限を1バイト超えるファイル"));
caseTest("IT-M03-35-033", 変わらない("m0335_unknown_product-033.csv", SECの取込前("033"), "未登録の商品コード"));
caseTest("IT-M03-35-035", 変わらない("m0335_unknown_department-035.csv", [["TGT-DEPT-001-035", ["〔部門ID-M0335-共有A〕"]]], "未登録の部門コード99"));
caseTest("IT-M03-35-036", 変わらない("m0335_rollback-036.csv", [["RB-A-036", ["〔部門ID-M0335-共有A〕"]], ["RB-B-036", ["〔部門ID-M0335-共有A〕"]]], "2行目が未登録の商品コード"));

// ---- なりすまし対策トークン（038・039） ----

caseTest("IT-M03-35-038", async (ctx) => {
  const u = await signIn(ctx);
  const seen: { a: (string | null)[]; b: (string | null)[]; n: number }[] = [];
  const 確かめる = () => { seen.push({ a: 部門("SEC-A-001-038"), b: 部門("SEC-B-001-038"), n: 履歴の数("m0335_normal-038.csv") }); };
  const 送る = async (when: string) => {
    const r = await u.pressUpload().catch((e) => { note(`${when}: 送信のあとの画面を待てなかった（${String(e).split("\n")[0]}）`); return null; });
    if (r) await noteUpload(u, r, when);
  };
  await ctx.step(1, async () => { await u.open(); await u.choose(m0335xFile("m0335_normal-038.csv")); });
  await ctx.step(2, async () => { await u.changeToken("なし"); note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンの入力要素を取り除いた"); await 送る("トークンを取り除いて送ったあと"); });
  await ctx.step(3, async () => { 確かめる(); });
  await ctx.step(4, async () => { await u.open(); await u.choose(m0335xFile("m0335_normal-038.csv")); });
  await ctx.step(5, async () => { await u.changeToken("invalid-token"); note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンを「invalid-token」に変えた"); await 送る("トークンを変えて送ったあと"); });
  await ctx.step(6, async () => { 確かめる(); });
  await ctx.expected(async () => {
    const A = ctx.notes.get("〔部門ID-M0335-共有A〕");
    const B = ctx.notes.get("〔部門ID-M0335-共有B〕");
    for (const [i, s] of seen.entries()) {
      expect.soft(s.a, `${i + 1}回目: 商品コード SEC-A-001-038 の部門ID（取込前のまま）`).toEqual([A, A]);
      expect.soft(s.b, `${i + 1}回目: 商品コード SEC-B-001-038 の部門ID（取込前のまま）`).toEqual([B]);
      expect.soft(s.n, `${i + 1}回目: m0335_normal-038.csv の取込履歴（追加されない）`).toBe(0);
    }
    expect(seen.length, "2回とも確かめた").toBe(2);
  });
});

caseTest("IT-M03-35-039", async (ctx) => {
  const u = await signIn(ctx);
  let path = "";
  await ctx.step(1, async () => { await u.open(); await u.choose(m0335xFile("m0335_normal-039.csv")); });
  await ctx.step(2, async () => {
    await u.changeToken("invalid-token");
    note("開発者ツールの代わりに、画面のスクリプトでなりすまし対策トークンを「invalid-token」に変えた");
    const r = await u.pressUpload();
    await noteUpload(u, r, "トークンを変えて送ったあと");
    path = new URL(ctx.page.url()).pathname;
  });
  await ctx.expected(async () => {
    expect.soft(path, "送信のあとに表示された画面（部門更新CSV取込画面）").toBe(sectionUpdateCsvPath());
    await expect.soft(u.取込ファイル, "部門更新CSV取込画面の取込ファイルの欄").toHaveCount(1);
  });
});

// ---- 取込履歴（006・007） ----

caseTest("IT-M03-35-006", async (ctx) => {
  const u = await signIn(ctx);
  const name = m0335xFile("m0335_deleted_operator-006.csv").name;
  let 作業者: string[] = [];
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => {
    let rows = (await u.historyRows()).filter((r) => r.ファイル名 === name);
    if (rows.length === 0) {
      note(`取込履歴の1ページ目に「${name}」の行が無いので、件数を最大にして開き直した`);
      await u.open("?page_no=1&page_count=12000");
      rows = (await u.historyRows()).filter((r) => r.ファイル名 === name);
    }
    作業者 = rows.map((r) => r.作業者);
    note(`取込履歴の「${name}」の行の作業者: ${作業者.join("、") || "行が無い"}`);
  });
  await ctx.expected(async () => {
    expect.soft(作業者, `「${name}」の行の作業者（削除済みの管理者）`).toEqual([履歴担当の名前()]);
  });
});

caseTest("IT-M03-35-007", async (ctx) => {
  const u = await signIn(ctx);
  let before = "";
  let after = "";
  await ctx.step(1, async () => { await u.open(); });
  await ctx.step(2, async () => { await 取込履歴の件数を選ぶ(ctx.page, 10); await u.ready(); });
  await ctx.step(3, async () => {
    before = new URL(ctx.page.url()).search;
    await 取込履歴のページを選ぶ(ctx.page, 2);
    await u.ready();
    after = new URL(ctx.page.url()).search;
    note(`ページングで2を押す前のアドレスの問い合わせ部分「${before}」、押したあと「${after}」`);
  });
  await ctx.expected(async () => {
    expect.soft(await 取込履歴の今のページ(ctx.page), "ページングで選ばれているページ").toBe("2");
    expect.soft(new URLSearchParams(after).get("page_no"), "表示中のページ番号").toBe("2");
    expect.soft((await u.historyRows()).length, "2ページ目に取込履歴の行がある").toBeGreaterThan(0);
  });
});
