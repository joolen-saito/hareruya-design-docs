/**
 * M03-37 略称タグ更新CSV登録。正本: cases/M03-37_test_cases.tsv
 *
 * 2026-10-21 の時点で、アプリに略称タグ更新CSV登録画面が無い（pages/admin/m03_37_short_tag_update_csv.ts の冒頭）。
 * どのケースも手順1「略称タグ更新CSV登録画面を開く」（メニューから開く）で落ちる。手順2以降と期待結果の確かめは、
 * 画面ができたときのために正本どおりに書いた（画面の作りは仮定。画面ができたら確かめ直す）。
 *
 * 実装したケース: 001・002・008・009・010・011・012・014・019・020・026・027・028・029・035・036・040・041・043・044・045。
 * 実装していないケース（理由は e2e/review/M03-37_progress_2026-10-21.md）: 003〜007・015〜018・021〜025・037〜039（シードがDBでの準備）、
 * 013（設定ファイルの区切り文字の書き換え）。
 */
import { expect, Page, test } from "@playwright/test";
import { 商品の略称タグID, 略称タグの件数, 略称タグ更新の取込履歴の件数, 略称タグ更新の同名の取込履歴の件数 } from "../../db/m03_37_short_tag_update";
import { CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { ShortTagUpdateCsvPage, UploadResult } from "../../pages/admin/m03_37_short_tag_update_csv";
import { ShortTagPage } from "../../pages/admin/short_tag";
import { M0337_ADMIN, M0337L_ADMIN, m0337File } from "../../seeds/m03-37";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 共有A = "〔略称タグID-M0337-共有A〕";
const 共有B = "〔略称タグID-M0337-共有B〕";
/** 設計書 M03-37-MSG-001（全行の取り込みが終わったとき） */
const 完了メッセージ = "商品登録CSVファイルをアップロードしました。";

async function signIn(page: Page, account: Account = M0337_ADMIN): Promise<ShortTagUpdateCsvPage> {
  await loginAdmin(page, account);
  return new ShortTagUpdateCsvPage(page);
}

async function noteUpload(u: ShortTagUpdateCsvPage, r: UploadResult, when: string): Promise<void> {
  if (!r.sent) {
    note(`${when}: ブラウザの入力チェックが送信を止めた（取込の要求は送られていない）: ${r.止めた項目.join(" / ")}`);
    return;
  }
  const m = await u.messages();
  note(`${when}: 取込の要求の応答 ${r.応答}、戻った画面 ${r.戻った画面}。画面上部の成功の帯: ${m.成功.join(" / ") || "なし"}、` +
    `誤りの帯: ${m.エラー.join(" / ") || "なし"}、アップロード欄のエラー: ${(await u.uploadFieldErrors()).join(" / ") || "なし"}`);
}

async function chooseAndUpload(u: ShortTagUpdateCsvPage, fileName: string): Promise<UploadResult> {
  const f = m0337File(fileName);
  await u.choose(f);
  note(`${f.name}（${f.buffer.length} バイト・送る形式種別 ${f.mimeType}）を選んだ`);
  const r = await u.pressUpload();
  await noteUpload(u, r, `${fileName} のアップロードのあと`);
  return r;
}

/** 手順1〜2（画面を開く／ファイルを選んでアップロードボタンを押す） */
async function openAndUpload(ctx: CaseCtx, fileName: string, account?: Account): Promise<ShortTagUpdateCsvPage> {
  const u = await signIn(ctx.page, account);
  await ctx.step(1, async () => { await u.openFromMenu(); });
  await ctx.step(2, async () => {
    const r = await chooseAndUpload(u, fileName);
    if (!r.sent) throw new Error(`${fileName}: ブラウザの入力チェックで送信が止まった`);
  });
  return u;
}

/** 手順3（DBで商品の略称タグIDを確認する）。商品の呼び名→略称タグID */
async function readTags(ctx: CaseCtx, n: number, labels: string[]): Promise<Record<string, string | null>> {
  const got: Record<string, string | null> = {};
  await ctx.step(n, async () => {
    for (const l of labels) got[l] = 商品の略称タグID(ctx.notes.get(l));
    note(`DBの略称タグID: ${labels.map((l) => `${l}=${got[l]}`).join("・")}`);
  });
  return got;
}

// ---- 正常に取り込むもの ----

caseTest("IT-M03-37-001", async (ctx) => {
  await openAndUpload(ctx, "m0337_normal-001.csv");
  const got = await readTags(ctx, 3, ["〔商品ID-M0337-001A〕", "〔商品ID-M0337-001B〕"]);
  await ctx.expected(async () => {
    expect.soft(got["〔商品ID-M0337-001A〕"], "商品ID 〔商品ID-M0337-001A〕の略称タグID").toBe(ctx.notes.get(共有B));
    expect.soft(got["〔商品ID-M0337-001B〕"], "商品ID 〔商品ID-M0337-001B〕の略称タグID").toBe(ctx.notes.get(共有A));
  });
});

caseTest("IT-M03-37-002", async (ctx) => {
  const u = await openAndUpload(ctx, "m0337_normal-002.csv");
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "取込のあと戻った画面").toBe(u.path());
    await expect.soft(u.取込ファイル, "戻った画面の取込ファイルの欄").toHaveCount(1);
    const m = await u.messages();
    expect.soft(m.成功.join(" / "), "全行の取り込みが終わった表示").toContain(完了メッセージ);
    expect.soft(m.エラー, "誤りの帯").toEqual([]);
  });
});

/** 1商品の略称タグが PRE（共有B）に更新されることを確かめるケース（009・011・012） */
function updatedToPre(fileName: string, label: string) {
  return async (ctx: CaseCtx) => {
    await openAndUpload(ctx, fileName);
    const got = await readTags(ctx, 3, [label]);
    await ctx.expected(async () => {
      expect(got[label], `商品ID ${label} の略称タグID`).toBe(ctx.notes.get(共有B));
    });
  };
}
caseTest("IT-M03-37-009", updatedToPre("m0337_sjis-009.csv", "〔商品ID-M0337-009〕"));
caseTest("IT-M03-37-011", updatedToPre("m0337_bom_zwsp-011.csv", "〔商品ID-M0337-011〕"));
caseTest("IT-M03-37-012", updatedToPre("m0337_tab-012.tsv", "〔商品ID-M0337-012〕"));
caseTest("IT-M03-37-029", updatedToPre("m0337_duplicate-029.csv", "〔商品ID-M0337-029〕"));

caseTest("IT-M03-37-008", async ({ page, step, expected }) => {
  const u = await signIn(page);
  let file: { fileName: string; bytes: Buffer } = { fileName: "", bytes: Buffer.alloc(0) };
  let rows: string[][] = [];
  await step(1, async () => { await u.openFromMenu(); });
  await step(2, async () => { file = await u.downloadTemplate(); });
  await step(3, async () => {
    const text = decodeCsvBytes(file.bytes);
    rows = parseCsv(text);
    note(`ダウンロードしたファイル ${file.fileName}（${file.bytes.length} バイト）の中身: ${JSON.stringify(text)}`);
  });
  await expected(async () => {
    expect.soft(rows[0], "見出し行（左から順）").toEqual(["商品ID", "略称タグ"]);
    expect.soft(rows.length, "行の数（見出し行だけでデータ行が無い）").toBe(1);
  });
});

caseTest("IT-M03-37-010", async (ctx) => {
  const u = await signIn(ctx.page);
  const files = ["m0337_lf-010.csv", "m0337_crlf-010.csv", "m0337_cr-010.csv"];
  for (const [i, name] of files.entries()) {
    await ctx.step(i + 1, async () => {
      await u.openFromMenu();
      const r = await chooseAndUpload(u, name);
      if (!r.sent) throw new Error(`${name}: ブラウザの入力チェックで送信が止まった`);
    });
  }
  const labels = ["〔商品ID-M0337-010A〕", "〔商品ID-M0337-010B〕", "〔商品ID-M0337-010C〕"];
  const got = await readTags(ctx, 4, labels);
  await ctx.expected(async () => {
    for (const l of labels) expect.soft(got[l], `商品ID ${l} の略称タグID`).toBe(ctx.notes.get(共有B));
  });
});

// ---- 取り込まないもの ----

/** 1商品の略称タグが POR（共有A）から変わらないことを確かめるケース（019・020・026） */
function notUpdated(fileName: string, label: string) {
  return async (ctx: CaseCtx) => {
    await openAndUpload(ctx, fileName);
    const got = await readTags(ctx, 3, [label]);
    await ctx.expected(async () => {
      expect(got[label], `商品ID ${label} の略称タグID（更新されない）`).toBe(ctx.notes.get(共有A));
    });
  };
}
caseTest("IT-M03-37-019", notUpdated("m0337_three_columns-019.csv", "〔商品ID-M0337-019〕"));
caseTest("IT-M03-37-020", notUpdated("m0337_missing_item-020.csv", "〔商品ID-M0337-020〕"));
caseTest("IT-M03-37-026", notUpdated("m0337_unknown_tag-026.csv", "〔商品ID-M0337-026〕"));
caseTest("IT-M03-37-028", notUpdated("m0337_error_on_third_line-028.csv", "〔商品ID-M0337-028A〕"));

caseTest("IT-M03-37-014", async ({ page, step, expected }) => {
  const u = await signIn(page);
  let before = -1;
  let after = -1;
  let r: UploadResult = { sent: false, 止めた項目: [] };
  await step(1, async () => { await u.openFromMenu(); });
  await step(2, async () => { before = 略称タグ更新の取込履歴の件数(); note(`取込履歴（略称タグ更新）の件数: ${before}`); });
  await step(3, async () => { r = await u.pressUpload(); await noteUpload(u, r, "ファイルを選ばずにアップロードボタンを押したあと"); });
  await step(4, async () => { after = 略称タグ更新の取込履歴の件数(); note(`取込履歴（略称タグ更新）の件数: ${after}`); });
  await expected(async () => {
    expect(after, "取込履歴（略称タグ更新）の件数（追加されない）").toBe(before);
  });
});

caseTest("IT-M03-37-027", async (ctx) => {
  const u = await openAndUpload(ctx, "m0337_error_on_third_line-027.csv");
  let errors: string[] = [];
  await ctx.step(3, async () => {
    errors = [...await u.uploadFieldErrors(), ...(await u.messages()).エラー];
    note(`アップロード欄・画面上部のエラー: ${errors.join(" / ") || "なし"}`);
  });
  await ctx.expected(async () => {
    expect.soft(errors.some((t) => /(^|[^0-9])3\s*行目/.test(t)), "エラーの対象行が、見出し行を1行目として数えた3行目").toBe(true);
    expect.soft(errors.filter((t) => /(^|[^0-9])2\s*行目/.test(t)), "2行目（正常な行）をエラーの対象にしていない").toEqual([]);
  });
});

caseTest("IT-M03-37-044", async (ctx) => {
  const u = await openAndUpload(ctx, "m0337_two_errors-044.csv");
  let field: string[] = [];
  await ctx.step(3, async () => {
    field = await u.uploadFieldErrors();
    note(`アップロード欄のエラー: ${field.join(" / ") || "なし"}・画面上部の誤りの帯: ${(await u.messages()).エラー.join(" / ") || "なし"}`);
  });
  await ctx.expected(async () => {
    expect(field, "アップロード欄のエラー（3行目のものだけ）").toEqual(["略称タグ は必須項目です。 3 行目のデータを確認してください。"]);
  });
});

/** なりすまし対策トークンを消す・変えて送ると、どちらの商品の略称タグも変わらない（035・036） */
function tokenTampered(n: "035" | "036") {
  return async (ctx: CaseCtx) => {
    const u = await signIn(ctx.page);
    await ctx.step(1, async () => { await u.openFromMenu(); });
    await ctx.step(2, async () => { await u.choose(m0337File(`m0337_normal-${n}.csv`)); });
    await ctx.step(3, async () => { if (n === "035") await u.removeToken(); else await u.changeToken("invalid-token"); });
    await ctx.step(4, async () => { await noteUpload(u, await u.pressUpload(), "アップロードボタンを押したあと"); });
    const A = `〔商品ID-M0337-${n}A〕`;
    const B = `〔商品ID-M0337-${n}B〕`;
    const got = await readTags(ctx, 5, [A, B]);
    await ctx.expected(async () => {
      expect.soft(got[A], `商品ID ${A} の略称タグID（更新されない）`).toBe(ctx.notes.get(共有A));
      expect.soft(got[B], `商品ID ${B} の略称タグID（更新されない）`).toBe(ctx.notes.get(共有B));
    });
  };
}
caseTest("IT-M03-37-035", tokenTampered("035"));
caseTest("IT-M03-37-036", tokenTampered("036"));

// ---- 大きさの上限・再取込 ----

caseTest("IT-M03-37-043", async (ctx) => {
  await openAndUpload(ctx, "m0337_exact-043.csv");
  let tag: string | null = null;
  let history = -1;
  await ctx.step(3, async () => {
    tag = 商品の略称タグID(ctx.notes.get("〔商品ID-M0337-043A〕"));
    history = 略称タグ更新の同名の取込履歴の件数("m0337_exact-043.csv");
    note(`DB: 略称タグID=${tag}、取込履歴（m0337_exact-043.csv）=${history}件`);
  });
  await ctx.expected(async () => {
    expect.soft(tag, "商品ID 〔商品ID-M0337-043A〕の略称タグID").toBe(ctx.notes.get(共有B));
    expect.soft(history, "m0337_exact-043.csv の取込履歴の件数（シードで0件を確かめてある）").toBe(1);
  });
});

caseTest("IT-M03-37-045", async (ctx) => {
  const u = await signIn(ctx.page);
  const msgs: string[][] = [];
  await ctx.step(1, async () => { await u.openFromMenu(); });
  await ctx.step(2, async () => {
    await chooseAndUpload(u, "m0337_repeat-045.csv");
    msgs.push((await u.messages()).成功);
    expect(msgs[0].join(" / "), "1回目の取込のあとの表示").toContain(完了メッセージ);
  });
  await ctx.step(3, async () => {
    await chooseAndUpload(u, "m0337_repeat-045.csv");
    msgs.push((await u.messages()).成功);
  });
  const A = "〔商品ID-M0337-045A〕";
  const B = "〔商品ID-M0337-045B〕";
  let got: Record<string, string | null> = {};
  let history = -1;
  await ctx.step(4, async () => {
    got = { [A]: 商品の略称タグID(ctx.notes.get(A)), [B]: 商品の略称タグID(ctx.notes.get(B)) };
    history = 略称タグ更新の同名の取込履歴の件数("m0337_repeat-045.csv");
    note(`DB: ${A}=${got[A]}・${B}=${got[B]}、取込履歴（m0337_repeat-045.csv）=${history}件`);
  });
  await ctx.expected(async () => {
    expect.soft(msgs[1]?.join(" / ") ?? "", "2回目の取込のあとの表示").toContain(完了メッセージ);
    expect.soft(got[A], `商品ID ${A} の略称タグID`).toBe(ctx.notes.get(共有B));
    expect.soft(got[B], `商品ID ${B} の略称タグID`).toBe(ctx.notes.get(共有A));
    expect.soft(history, "m0337_repeat-045.csv の取込履歴の件数（シードで0件を確かめてある）").toBe(2);
  });
});

// ---- 略称タグ登録/編集との連携（040・041） ----

/**
 * 事前準備④（略称タグ一覧の表示ページを1、表示件数を12000件にする）のあと、手順1〜5:
 * 取込ファイルをアップロードし、略称タグ登録/編集画面を開き、略称タグ一覧で削除する行の削除ボタンを押して確認ダイアログで承認し、DBで確認する。
 */
function linkThenDelete(n: "040" | "041", file: string, 削除する: "A" | "B") {
  return async (ctx: CaseCtx) => {
    const u = await signIn(ctx.page, M0337L_ADMIN);
    const tag = new ShortTagPage(ctx.page);
    await tag.showFirstPageWith("12000");
    const id = ctx.notes.get(`〔略称タグID-M0337-${n}${削除する}〕`);
    await ctx.step(1, async () => { await u.openFromMenu(); });
    await ctx.step(2, async () => {
      const r = await chooseAndUpload(u, file);
      if (!r.sent) throw new Error(`${file}: ブラウザの入力チェックで送信が止まった`);
    });
    await ctx.step(3, async () => { await tag.openNew(); });
    await ctx.step(4, async () => {
      const r = await tag.pressDelete(tag.rowById(id), true);
      const m = await u.messages();
      note(`確認ダイアログの文「${r.dialog}」。削除の要求の応答 ${r.response?.status() ?? "なし"}。成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}`);
    });
    let left = -1;
    let shown = -1;
    await ctx.step(5, async () => {
      left = 略称タグの件数(id);
      await tag.showFirstPageWith("12000");
      shown = await tag.rowById(id).count();
      note(`DB: 略称タグID ${id} の件数 ${left}。略称タグ一覧のID ${id} の行 ${shown} 件`);
    });
    await ctx.expected(async () => {
      if (削除する === "B") {
        expect(left, `略称タグID ${id} の略称タグ（削除されずに残る）`).toBe(1);
      } else {
        expect.soft(left, `略称タグID ${id} の略称タグ（削除される）`).toBe(0);
        expect.soft(shown, `略称タグ一覧のID ${id} の行（表示されない）`).toBe(0);
      }
    });
  };
}
caseTest("IT-M03-37-040", linkThenDelete("040", "l0337_001.csv", "B"));
caseTest("IT-M03-37-041", linkThenDelete("041", "l0337_002.csv", "A"));
