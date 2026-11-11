/**
 * M05-24 出荷実績入力用CSV出力。正本: cases/M05-24_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-24_progress_2026-11-11_dev.md。
 * 出荷指示リスト詳細（出荷待ち）画面で受注を選び「出荷実績入力用CSV」を押して、ダウンロードした CSV のデータ行を見出しの名前で読む。
 * 019・025 の「開発者ツールで送信先を確かめて Referer なしで要求する」は、画面のフォームの選択項目を読み、Playwright の要求（Referer を付けない）で代える。
 * 受注・出荷指示リストはケースごとにシードで作る（seeds/m05-24.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { Refererなしで要求する, ResultCsvStandbyPage, ダウンロードの結果 } from "../../pages/admin/m05_07_24_csv";
import { M0524_ADMIN, 会員のメール, 作ったものの } from "../../seeds/m05-24";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);

const 行の = (bytes: Buffer | null) => (bytes ? csvRecords(decodeCsvBytes(bytes)) : []);
const 注文番号の一覧 = (rows: Record<string, string>[]) => rows.map((r) => r["注文番号"] ?? "");

/** 手順1〜4: 詳細を開き、受注を選んで（選ばなければ外して）出荷実績入力用CSVを押し、データ行を読む */
function 押して読む(seed: string, 選ぶ: string[] | "選ばない", check: (rows: Record<string, string>[], r: ダウンロードの結果, ctx: CaseCtx, s: ResultCsvStandbyPage) => void | Promise<void>, 手順の数 = 4, ダウンロードされる = 選ぶ !== "選ばない") {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M0524_ADMIN);
    const s = new ResultCsvStandbyPage(page);
    const v = 作ったものの(seed);
    const 番号 = /-(\d{3})$/.exec(seed)?.[1] ?? "";
    await step(1, async () => { expect(await s.詳細を開く(番号の(ctx, `〔出荷指示リストID-M0524-${番号}〕`)), "出荷指示（出荷待ち）詳細画面の応答").toBeLessThan(400); });
    let r!: ダウンロードの結果;
    if (選ぶ === "選ばない") {
      await step(2, async () => {
        await s.選択をすべて外す();
        r = await s.出荷実績入力用CSVを押す();
        note(`ダウンロード: ${r.ファイル名 ?? "なし"}・移った先: ${r.移った先 || "（移らない）"}${r.画面のエラー.length ? `・エラー「${r.画面のエラー.join(" / ")}」` : ""}`);
      });
    } else {
      await step(2, async () => { await s.受注を選ぶ(選ぶ.map((n) => v.受注ID[v.注文番号.indexOf(番号の(ctx, n))])); });
      await step(3, async () => {
        r = await s.出荷実績入力用CSVを押す();
        note(`ダウンロード: ${r.ファイル名 ?? "なし"}・移った先: ${r.移った先 || "（移らない）"}${r.画面のエラー.length ? `・エラー「${r.画面のエラー.join(" / ")}」` : ""}`);
      });
    }
    let rows: Record<string, string>[] = [];
    if (手順の数 >= 4) {
      await step(4, async () => { rows = 行の(r.バイト列); note(`データ行の注文番号: ${注文番号の一覧(rows).join("・") || "なし"}`); });
    }
    await expected(async () => {
      expect.soft(r.ファイル名 !== null, ダウンロードされる ? "出荷実績入力用CSVがダウンロードされた" : "CSVファイルはダウンロードされない").toBe(ダウンロードされる);
      await check(rows, r, ctx, s);
    });
  };
}

/** データ行が注文番号の1行だけ、その行を返す */
function 一行(rows: Record<string, string>[], 注文番号: string): Record<string, string> {
  expect.soft(注文番号の一覧(rows), `データ行は注文番号 ${注文番号} の1行だけ`).toEqual([注文番号]);
  return rows.find((x) => x["注文番号"] === 注文番号) ?? {};
}

caseTest("IT-M05-24-004", 押して読む("S-M05-24-BASE-004", ["〔注文番号-M0524-004A〕"], (rows, _r, ctx) => {
  const a = 番号の(ctx, "〔注文番号-M0524-004A〕"), b = 番号の(ctx, "〔注文番号-M0524-004B〕");
  expect.soft(注文番号の一覧(rows), `データ行は ${a} の1行だけ`).toEqual([a]);
  expect.soft(注文番号の一覧(rows), `選んでいない ${b} を含まない`).not.toContain(b);
}));

caseTest("IT-M05-24-008", 押して読む("S-M05-24-OPTIONAL-008", ["〔注文番号-M0524-008〕"], (rows, _r, ctx) => {
  const row = 一行(rows, 番号の(ctx, "〔注文番号-M0524-008〕"));
  for (const k of ["性別(ID)", "性別(名称)", "職業(ID)", "職業(名称)", "お届け時間ID", "お届け時間(名称)"]) expect.soft(row[k] ?? "（列が無い）", `${k} は空`).toBe("");
}));

caseTest("IT-M05-24-009", 押して読む("S-M05-24-MULTI-SHIPPING-009", ["〔注文番号-M0524-009〕"], (rows, _r, ctx) => {
  const row = 一行(rows, 番号の(ctx, "〔注文番号-M0524-009〕"));
  expect.soft(row["配送先_お名前(姓)"] ?? "（列が無い）", "配送先の項目は1件目の配送先（第一配送先）").toBe("第一配送先");
  expect.soft(rows.map((x) => x["配送先_お名前(姓)"]), "2件目の配送先（第二配送先）を含まない").not.toContain("第二配送先");
}));

caseTest("IT-M05-24-010", 押して読む("S-M05-24-MEMBER-CHANGED-010", ["〔注文番号-M0524-010〕"], (rows, _r, ctx) => {
  const row = 一行(rows, 番号の(ctx, "〔注文番号-M0524-010〕"));
  const 期待: [string, string][] = [
    ["お名前(姓)", "新姓"], ["お名前(名)", "新名"], ["お名前(セイ)", "シンセイ"], ["お名前(メイ)", "シンメイ"], ["郵便番号1", "160"], ["郵便番号2", "0022"],
    ["都道府県(ID)", "13"], ["都道府県(名称)", "東京都"], ["住所1", "新宿区新宿"], ["住所2", "1-2-3"], ["住所3", "新住所3"], ["メールアドレス", 会員のメール("m0524-010-new")],
    ["TEL1", "03"], ["TEL2", "1111"], ["TEL3", "2222"], ["FAX1", "03"], ["FAX2", "3333"], ["FAX3", "4444"],
  ];
  for (const [k, want] of 期待) expect.soft(row[k] ?? "（列が無い）", `注文者の ${k}（会員の現在値）`).toBe(want);
  const 全部 = Object.values(row).join("|");
  for (const old of ["旧姓", "旧名", "旧住所", 会員のメール("m0524-010-old")]) expect.soft(全部.includes(old), `受注時の旧値「${old}」を含まない`).toBe(false);
}));

caseTest("IT-M05-24-011", 押して読む("S-M05-24-DATETIME-011", ["〔注文番号-M0524-011〕"], (rows, _r, ctx) => {
  const row = 一行(rows, 番号の(ctx, "〔注文番号-M0524-011〕"));
  expect.soft(row["誕生日"] ?? "（列が無い）", "誕生日").toBe("1980/01/02 00:00:00");
  expect.soft(row["注文日"] ?? "（列が無い）", "注文日").toBe("2026/08/01 09:10:11");
  expect.soft(row["入金日"] ?? "（列が無い）", "入金日").toBe("2026/08/02 10:20:30");
  for (const k of ["注文確定日", "出荷指示日", "出荷日"]) expect.soft(row[k] ?? "（列が無い）", `未設定の ${k} は空欄`).toBe("");
}));

caseTest("IT-M05-24-012", 押して読む("S-M05-24-OVERSEAS-012", ["〔注文番号-M0524-012〕"], (rows, _r, ctx) => {
  const row = 一行(rows, 番号の(ctx, "〔注文番号-M0524-012〕"));
  expect.soft(row["住所3"] ?? "（列が無い）", "住所3").toBe("Building 5, Floor 2");
}));

caseTest("IT-M05-24-017", 押して読む("S-M05-24-BASE-017", "選ばない", (_rows, r) => {
  if (r.画面のエラー.length) note(`画面のエラー: ${r.画面のエラー.join(" / ")}`);
}, 2));

caseTest("IT-M05-24-018", 押して読む("S-M05-24-BASE-018", "選ばない", (_rows, r, ctx, s) => {
  const want = `/standby/${番号の(ctx, "〔出荷指示リストID-M0524-018〕")}/edit`;
  expect.soft(new URL(s.page.url()).pathname.endsWith(want), `操作の起点の出荷指示（出荷待ち）詳細画面（${want}）へ戻る（いま ${s.page.url()}）`).toBe(true);
}, 2));

/** 019・025: 詳細を開き、送信先と選択項目を読み（開発者ツールの代わり）、Referer なしで要求する */
function Refererなし(seed: string, 選ぶ: string[], check: (res: Awaited<ReturnType<typeof Refererなしで要求する>>, rows: Record<string, string>[], ctx: CaseCtx) => void, 手順の数: number) {
  const ダウンロードされる = 選ぶ.length > 0;
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M0524_ADMIN);
    const s = new ResultCsvStandbyPage(page);
    const v = 作ったものの(seed);
    const 番号 = /-(\d{3})$/.exec(seed)?.[1] ?? "";
    await step(1, async () => { expect(await s.詳細を開く(番号の(ctx, `〔出荷指示リストID-M0524-${番号}〕`)), "出荷指示（出荷待ち）詳細画面の応答").toBeLessThan(400); });
    await step(2, async () => {
      const f = await s.送信先と選択項目();
      note(`送信先: ${f.送信先}・受注の選択項目: ${f.選択項目.join("・")}`);
      supplement("開発者ツールで見る代わりに、画面のフォームの受注の選択項目を読んだ。送信先は画面のスクリプトが入れる出荷実績入力用CSVの送り先");
      expect(f.選択項目.length, "受注の選択項目がある").toBeGreaterThan(0);
    });
    let res!: Awaited<ReturnType<typeof Refererなしで要求する>>;
    await step(3, async () => {
      const ids = 選ぶ.map((n) => v.受注ID[v.注文番号.indexOf(番号の(ctx, n))]);
      res = await Refererなしで要求する(page, ids);
      note(`要求の結果: 状態 ${res.状態}・最後の URL ${res.URL}・種類 ${res.種類}・ファイル名 ${res.ファイル名 || "なし"}`);
      if (ids.length) supplement(`正本は「配送先〔配送先ID〕を注文として選択」だが、画面のフォームの選択項目は受注IDなので、受注ID ${ids.join("・")} を選んだ形で送った`);
    });
    let rows: Record<string, string>[] = [];
    if (手順の数 >= 4) await step(4, async () => { rows = res.ファイル名 ? 行の(res.バイト列) : []; note(`データ行の注文番号: ${注文番号の一覧(rows).join("・") || "なし"}`); });
    await expected(async () => {
      expect.soft(res.ファイル名 !== "", ダウンロードされる ? "出荷実績入力用CSVがダウンロードされる" : "CSVファイルはダウンロードされない").toBe(ダウンロードされる);
      check(res, rows, ctx);
    });
  };
}

caseTest("IT-M05-24-019", Refererなし("S-M05-24-BASE-019", [], (res) => {
  expect.soft(new URL(res.URL).pathname.replace(/\/$/, "").endsWith("/order"), `受注一覧画面が表示される（最後の URL ${res.URL}）`).toBe(true);
}, 3));

caseTest("IT-M05-24-025", Refererなし("S-M05-24-CBREFNONE-025", ["〔注文番号-M0524-025〕"], (res, rows, ctx) => {
  expect.soft(注文番号の一覧(rows), "データ行は注文番号の1行だけ").toEqual([番号の(ctx, "〔注文番号-M0524-025〕")]);
}, 4));

caseTest("IT-M05-24-026", 押して読む("S-M05-24-CBGUESTKNOWN-026", ["〔注文番号-M0524-026〕"], (_rows, _r, ctx, s) => {
  const want = `/standby/${番号の(ctx, "〔出荷指示リストID-M0524-026〕")}/edit`;
  expect.soft(new URL(s.page.url()).pathname.endsWith(want), `操作の起点の出荷指示（出荷待ち）詳細画面（${want}）が表示される（いま ${s.page.url()}）`).toBe(true);
}, 3, false));
