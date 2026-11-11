/**
 * M07-01 買取検索一覧。正本: cases/M07-01_test_cases.tsv
 *
 * DB への書き込みで準備したシードを使うケース（履歴・買取依頼日の日時、まとめて買取・個別入力商品、箱数、申込単価）。
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で作った実行の印つきの買取にだけ、DBで整えた（seeds/m07-01-d.ts）。
 * 整えたことはシードの報告（シード作成時の問題）に出る。管理画面の操作は試験管理者 m0701_admin（事前準備①）。
 *
 * 共有の環境では「この N 件以外に検索条件へ一致する買取情報が無い」を作れない（ほかの買取を消さない）。
 * 日付などで絞るケースは「作った買取が表示される／表示されない」と「表示された行がすべて条件に合うこと」で確かめ、注記に残す。
 * 日付の検索欄は日付だけの入力欄（yyyy-MM-dd）。正本の「2026/08/01」は「2026-08-01」と入れた。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVを読む, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { M0701ListPage, 日付の状況 } from "../../pages/admin/m07_01_list";
import { M0701_ADMIN } from "../../seeds/m07-01";
import { 注文者名 } from "../../seeds/m07-01-b";
import { 控え } from "../../seeds/m07-01-d";
import { 作った買取一覧, 品 } from "../../seeds/m07-03-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 数字 = (s: string | undefined) => (s ?? "").replace(/[^\d]/g, "");
const 番 = (n: string) => String(Number(n));
const 共有の環境 = "共有の環境ではほかの買取を消さないので、条件に合うほかの買取も一覧に出る。作った買取の表示・非表示と、表示された行（1ページ目）がすべて条件に合うことを確かめた";

async function 始める(page: Page): Promise<M0701ListPage> {
  await loginAdmin(page, M0701_ADMIN);
  return new M0701ListPage(page);
}

function 作った(seedId: string): { 番号: string } {
  const a = 作った買取一覧.get(seedId);
  if (!a) throw new Error(`シード ${seedId} が買取を控えていない`);
  return a;
}

// ---- 商品到着日（009・010・034） ----

function 商品到着日(n: string, 端: "from" | "to", 日: string, 表示: string[], 出ない: string[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const l = await 始める(page);
    const ラベル = (x: string) => `〔買取番号-M0701-${n}${x}〕`;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.日付を入れる("arrival", 端, 日); });
    await step(3, async () => { await l.検索する(); });
    await expected(async () => {
      const rows = await l.行();
      note(共有の環境);
      note(`1ページ目の行 ${rows.length} 件。該当件数 ${await l.該当件数()}`);
      for (const x of 表示) expect.soft(rows.some((r) => r.番号 === 番(notes.get(ラベル(x)))), `${ラベル(x)}（${買取番号の表示(notes.get(ラベル(x)))}）が表示される`).toBe(true);
      for (const x of 出ない) expect.soft(rows.some((r) => r.番号 === 番(notes.get(ラベル(x)))), `${ラベル(x)}（${買取番号の表示(notes.get(ラベル(x)))}）が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-M07-01-009", 商品到着日("009", "from", "2026-08-01", ["A", "B", "C"], ["D"]));
caseTest("IT-M07-01-010", 商品到着日("010", "to", "2026-08-31", ["A", "B", "D"], ["C"]));

caseTest("IT-M07-01-034", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取番号-M0701-034〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.日付を入れる("arrival", "from", "2026-08-15");
    await l.日付を入れる("arrival", "to", "2026-08-15");
    // 共有の環境では、同じ日の商品到着履歴を持つほかの買取（前の実行の残り）も出るので、注文者名（実行の印つき）も入れて作った買取だけにする
    await l.注文者名を入れる(注文者名("M0701-034-X"));
  });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    const rows = await l.行();
    note("共有の環境ではほかの買取を消さないので、同じ日の商品到着履歴を持つほかの買取（前の実行の残り）が出ないよう、注文者名（実行の印つき）も入れて、作った買取だけに絞った");
    expect.soft(await l.該当件数(), "総件数").toBe(2);
    expect.soft(rows.filter((r) => r.番号 === 番(番号)).length, `〔買取番号-M0701-034〕（${買取番号の表示(番号)}）の行の数（商品到着履歴が2件あるので2行）`).toBe(2);
  });
});

// ---- 会員（019〜022）。買取依頼日 2026/08/20 ----

function 会員の絞り込み(手順3: (l: M0701ListPage) => Promise<void>, 表示: string[], 出ない: string[], 行の条件: (r: { 本人確認: string; 利用回数: string }) => boolean, 条件の名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const l = await 始める(page);
    const 番号 = (x: string) => notes.get(`〔買取番号-M0701-共有会員${x}〕`);
    await step(1, async () => { await l.open(); });
    await step(2, async () => {
      await l.日付を入れる("request", "from", "2026-08-20");
      await l.日付を入れる("request", "to", "2026-08-20");
    });
    await step(3, async () => { await 手順3(l); });
    await step(4, async () => { await l.検索する(); });
    await expected(async () => {
      const rows = await l.行();
      note(共有の環境);
      note(`1ページ目の行 ${rows.length} 件。該当件数 ${await l.該当件数()}`);
      for (const x of 表示) expect.soft(rows.some((r) => r.番号 === 番(番号(x))), `〔買取番号-M0701-共有会員${x}〕（${買取番号の表示(番号(x))}）が表示される`).toBe(true);
      for (const x of 出ない) expect.soft(rows.some((r) => r.番号 === 番(番号(x))), `〔買取番号-M0701-共有会員${x}〕（${買取番号の表示(番号(x))}）が表示されない`).toBe(false);
      expect.soft(rows.filter((r) => !行の条件(r)).map((r) => `${r.買取番号}:本人確認=${r.本人確認}・利用回数=${r.利用回数}`), `${条件の名}に合わない行`).toEqual([]);
    });
  };
}
// 019 は手順が3つ（本人確認の選択がない）なので、手順4を検索にして番号を合わせる
caseTest("IT-M07-01-019", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = (x: string) => notes.get(`〔買取番号-M0701-共有会員${x}〕`);
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.日付を入れる("request", "from", "2026-08-20");
    await l.日付を入れる("request", "to", "2026-08-20");
  });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    const rows = await l.行();
    note(共有の環境);
    note(`1ページ目の行 ${rows.length} 件。該当件数 ${await l.該当件数()}`);
    for (const x of ["A", "B", "C"]) expect.soft(rows.some((r) => r.番号 === 番(番号(x))), `〔買取番号-M0701-共有会員${x}〕（${買取番号の表示(番号(x))}）が表示される（本人確認で絞り込まない）`).toBe(true);
    const 状態 = (x: string) => rows.find((r) => r.番号 === 番(番号(x)))?.本人確認 ?? "（行が無い）";
    expect.soft([状態("A"), 状態("B"), 状態("C")], "A・B・C の本人確認（未確認・確認中・オンライン本人確認済み）").toEqual(["未確認", "確認中", "オンライン本人確認済み"]);
  });
});
caseTest("IT-M07-01-020", 会員の絞り込み(
  async (l) => { await l.本人確認をまとめて選ぶ(["確認中", "オンライン本人確認済み"]); },
  ["B", "C"], ["A"], (r) => ["確認中", "オンライン本人確認済み"].includes(r.本人確認), "本人確認が確認中・オンライン本人確認済み",
));
caseTest("IT-M07-01-021", 会員の絞り込み(
  async (l) => { await l.利用回数を入れる("from", "2"); },
  ["B", "C"], ["A"], (r) => Number(r.利用回数) >= 2, "利用回数が2回以上",
));
caseTest("IT-M07-01-022", 会員の絞り込み(
  async (l) => { await l.利用回数を入れる("to", "2"); },
  ["A", "B"], ["C"], (r) => Number(r.利用回数) <= 2, "利用回数が2回以下",
));

// ---- 状況ごとの日付（069・071〜077） ----

function 状況の日付(n: string, 状況: 日付の状況, 名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const l = await 始める(page);
    const ラベル = (x: string) => `〔買取番号-M0701-${n}${x}〕`;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.検索条件をクリアする(); });
    await step(3, async () => {
      await l.日付を入れる(状況, "from", "2026-08-01");
      await l.日付を入れる(状況, "to", "2026-08-31");
    });
    await step(4, async () => { await l.検索する(); });
    await expected(async () => {
      const rows = await l.行();
      note(共有の環境);
      note(`${名}(From) 2026-08-01・${名}(To) 2026-08-31 を入れた。1ページ目の行 ${rows.length} 件。該当件数 ${await l.該当件数()}`);
      expect.soft(rows.some((r) => r.番号 === 番(notes.get(ラベル("A")))), `${ラベル("A")}（${買取番号の表示(notes.get(ラベル("A")))}）が表示される`).toBe(true);
      for (const x of ["B", "C"]) expect.soft(rows.some((r) => r.番号 === 番(notes.get(ラベル(x)))), `${ラベル(x)}（${買取番号の表示(notes.get(ラベル(x)))}）が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-M07-01-069", 状況の日付("069", "assessing", "査定開始日"));
caseTest("IT-M07-01-071", 状況の日付("071", "appraisal", "MTGBuyer査定完了日"));
caseTest("IT-M07-01-072", 状況の日付("072", "communicated", "査定内容連絡日"));
caseTest("IT-M07-01-073", 状況の日付("073", "acceptance", "査定承諾日"));
caseTest("IT-M07-01-074", 状況の日付("074", "transfer_request", "振込依頼日"));
caseTest("IT-M07-01-075", 状況の日付("075", "transfer_complete", "振込完了日"));
caseTest("IT-M07-01-076", 状況の日付("076", "stocking_complete", "入庫日"));
caseTest("IT-M07-01-077", 状況の日付("077", "cancellation", "キャンセル日"));

// ---- 表示 ----

caseTest("IT-M07-01-037", async ({ page, step, expected }) => {
  const l = await 始める(page);
  const 番号 = 作った("S-M07-01-DISPLAY-037").番号;
  let 合計 = "";
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => {
    await expect(l.行の(番号), `買取番号 ${買取番号の表示(番号)} の行`).toBeVisible({ timeout: 30_000 });
    合計 = await l.申込時買取金額合計(番号);
  });
  await expected(async () => {
    note(`買取ID8120037は決め打ちにできないので、画面が振った買取番号 ${買取番号の表示(番号)} で検索した。申込時買取金額合計の表示: ${合計}`);
    expect.soft(数字(合計), "申込時買取金額合計（申込単価から算出された800円。査定後価格9999円・現在価格8888円ではない）").toBe("800");
  });
});

caseTest("IT-M07-01-038", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取番号-M0701-038A〕"), B = notes.get("〔買取番号-M0701-038B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(注文者名("表示試験")); await l.検索する(); });
  await step(3, async () => {
    await expect(l.行の(A), `〔買取番号-M0701-038A〕の行`).toBeVisible({ timeout: 30_000 });
    await expect(l.行の(B), `〔買取番号-M0701-038B〕の行`).toBeVisible({ timeout: 30_000 });
  });
  await expected(async () => {
    const rows = await l.行();
    note("注文者名は「表示試験」に実行の印を付けた値で検索した");
    expect.soft(rows.find((r) => r.番号 === 番(A))?.箱数 ?? "（行が無い）", `ID 〔買取番号-M0701-038A〕（${買取番号の表示(A)}）の箱数（空欄）`).toBe("");
    expect.soft(rows.find((r) => r.番号 === 番(B))?.箱数 ?? "（行が無い）", `ID 〔買取番号-M0701-038B〕（${買取番号の表示(B)}）の箱数`).toBe("3");
  });
});

caseTest("IT-M07-01-039", async ({ page, step, expected }) => {
  const l = await 始める(page);
  const id = "S-M07-01-DISPLAY-039";
  const 番号 = 作った(id).番号, c = 控え.get(id)!;
  let 名前: string[] = [];
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => {
    await expect(l.行の(番号), `買取番号 ${買取番号の表示(番号)} の行`).toBeVisible({ timeout: 30_000 });
    名前 = await l.買取詳細の商品名(番号);
  });
  await expected(async () => {
    note(`買取ID8120039は決め打ちにできないので、画面が振った買取番号 ${買取番号の表示(番号)} で検索した。まとめて買取の商品は、設定のまとめて買取の商品（${c["まとめて買取の商品名"]}）の明細。選んで買取は 査定価格・状態が 500・NM／500・HP／300・NM の3商品`);
    expect.soft(名前, "買取詳細の商品名の並び（まとめて買取の商品、続けて選んで買取を単価降順・状態昇順）").toEqual([c["まとめて買取の商品名"], c["C3"], c["C2"], c["C1"]]);
    expect.soft(名前.some((t) => t.includes(c["個別入力"])), "個別入力商品が表示されない").toBe(false);
  });
});

caseTest("IT-M07-01-078", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取番号-M0701-078〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await expected(async () => {
    await expect.soft(l.行の(番号), `〔買取番号-M0701-078〕（${買取番号の表示(番号)}）の行`).toBeVisible({ timeout: 30_000 });
    const 注記 = await l.キャンセルの注記(番号);
    note(`買取番号欄の注記: ${注記 || "（無い）"}`);
    expect.soft(注記, "売却しない個別入力商品だけを持つ買取の行に、キャンセルを含む旨の注記").toContain("キャンセル");
  });
});

caseTest("IT-M07-01-082", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.注文者名を入れる(注文者名("M0701-082-X")); await l.検索する(); });
  await step(4, async () => { await expect(l.結果の表の行().first(), "検索結果の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const rows = await l.行();
    note("注文者名は「M0701-082-X」に実行の印を付けた値で検索した");
    for (const [x, 状況] of [["A", "査定内容承諾"], ["B", "簡易書留送付済み"], ["C", "振込完了"], ["D", "振込失敗"]] as const) {
      const n = 番(notes.get(`〔買取番号-M0701-082${x}〕`));
      expect.soft(rows.find((r) => r.番号 === n)?.買取状況 ?? "（行が無い）", `買取番号〔買取番号-M0701-082${x}〕の買取状況`).toBe(状況);
    }
  });
});

// ---- 買取商品一覧CSV・買取商品（キャンセル）CSV ----

type 出力 = "買取商品一覧CSV" | "買取商品（キャンセル）CSV";

/** 注文者名で検索（step 2）→ 対象にチェック（step 3）→ 出力（step 4）→ 開く（step 5）。行は 見出し→値 の組 */
async function CSVを出す(ctx: CaseCtx, l: M0701ListPage, 姓の正本: string, 対象: string[] | "すべて", 項目: 出力): Promise<{ 行: Record<string, string>[]; 見出し: string[] }> {
  let file: Awaited<ReturnType<M0701ListPage["ダウンロードを押す"]>>["file"] = null;
  let out = { 行: [] as Record<string, string>[], 見出し: [] as string[] };
  await ctx.step(1, async () => { await l.open(); });
  await ctx.step(2, async () => { await l.注文者名を入れる(注文者名(姓の正本)); await l.検索する(); });
  await ctx.step(3, async () => {
    if (対象 === "すべて") await l.すべて対象にする();
    else for (const n of 対象) await l.対象にする(n);
  });
  await ctx.step(4, async () => {
    const r = await l.ダウンロードを押す(項目);
    file = r.file;
    expect(file, `${項目}のファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
  });
  await ctx.step(5, async () => { const c = await CSVを読む(file!); out = { 行: c.行, 見出し: c.見出し }; });
  return out;
}

const 行の組 = (rows: Record<string, string>[], 数の見出し: string) => rows.map((r) => `${r["商品コード"] ?? ""}|${r["商品名"] ?? ""}|${r[数の見出し] ?? ""}`);

caseTest("IT-M07-01-056", async (ctx) => {
  const l = await 始める(ctx.page);
  const c = 控え.get("S-M07-01-PRODUCT-056")!;
  const { 行: rows } = await CSVを出す(ctx, l, "商品出力試験", [作った("S-M07-01-PRODUCT-056").番号], "買取商品一覧CSV");
  await ctx.expected(async () => {
    note("買取ID7300001・商品ID10056／20056は決め打ちにできないので、画面が振った買取番号と、グッズ商品CSV登録で作った2商品（A=商品ID10056の役、B=20056の役）を使った。コードなしの明細は、状態のない明細（CSVでは商品コードが空）。略称タグ・レアリティは共有のマスタを書き換えないので設定しておらず、確かめない");
    expect.soft(rows.length, "CSVのデータ行の数（売却するものだけ。売却しない通常明細は出ない）").toBe(4);
    const 期待 = [
      { 商品コード: c["A"], 在庫増減数: "2", 商品名: c["A"], 販売価格: "1000", 買取価格: "300", 状態: "HP" },
      { 商品コード: "", 在庫増減数: "4", 商品名: c["A"], 販売価格: "", 買取価格: "400", 状態: "" },
      { 商品コード: c["B"], 在庫増減数: "3", 商品名: c["B"], 販売価格: "1000", 買取価格: "500", 状態: "NM" },
      { 商品コード: "", 在庫増減数: "5", 商品名: c["個別入力"], 販売価格: "", 買取価格: "600", 状態: "" },
    ];
    const 名 = ["通常・コードあり・HP", "通常・コードなし", "通常・コードあり・NM（商品IDの大きい方）", "個別入力商品"];
    期待.forEach((e, i) => {
      const r = rows[i] ?? {};
      const 実際 = { 商品コード: r["商品コード"] ?? "（行が無い）", 在庫増減数: r["在庫増減数"] ?? "", 商品名: r["商品名"] ?? "", 販売価格: 数字(r["販売価格"]), 買取価格: 数字(r["買取価格"]), 状態: r["状態"] ?? "" };
      expect.soft(実際, `CSVの${i + 1}行目（${名[i]}）`).toEqual(e);
    });
    expect.soft(rows.some((r) => r["商品名"] === c["売却しない"]), "売却しない通常明細の行（出力されない）").toBe(false);
    expect.soft(rows[3]?.["言語ID"], "個別入力商品の言語ID").toBe("1");
  });
});

caseTest("IT-M07-01-058", async (ctx) => {
  const l = await 始める(ctx.page);
  const c = 控え.get("S-M07-01-CANCEL-CSV-058")!;
  const { 行: rows, 見出し } = await CSVを出す(ctx, l, "キャンセル出力試験", "すべて", "買取商品（キャンセル）CSV");
  await ctx.expected(async () => {
    expect.soft(見出し.includes("キャンセル数") && !見出し.includes("在庫増減数"), `見出し（キャンセル数の列があり、在庫増減数の列が無い）: ${見出し.join("・")}`).toBe(true);
    const 実際 = 行の組(rows, "キャンセル数").sort();
    const 期待 = [`${c["えらんで"]}|${c["えらんで"]}|1`, `${c["まとめて"]}|${c["まとめて"]}|2`, `|${c["個別入力"]}|3`].sort();
    expect.soft(実際, "CSVのデータ行（商品コード|商品名|キャンセル数。えらんで・まとめて・個別入力商品の売却しない明細だけ）").toEqual(期待);
    for (const k of ["未定", "売却する", "キャンセル済みの明細"]) expect.soft(rows.some((r) => r["商品名"] === c[k]), `${k}の明細の行（出力されない）`).toBe(false);
  });
});

caseTest("IT-M07-01-092", async (ctx) => {
  const l = await 始める(ctx.page);
  const { 行: rows } = await CSVを出す(ctx, l, "M0701-CB092-X", [ctx.notes.get("〔買取番号-M0701-092〕")], "買取商品一覧CSV");
  await ctx.expected(async () => {
    note("個別入力明細は、画面でできた通常買取明細（申込みの商品）のあとにDBで足した。CSVは個別入力商品を後ろに並べる作り");
    expect.soft(rows.length, "CSVのデータ行の数").toBe(2);
    expect.soft(`${rows[0]?.["商品コード"] ?? "（行が無い）"}×${rows[0]?.["在庫増減数"] ?? ""}`, "1行目（商品コードM0701-CB092-N・在庫増減数2）").toBe(`${品("M0701-CB092-N")}×2`);
    expect.soft(`${rows[1]?.["商品名"] ?? "（行が無い）"}×${rows[1]?.["在庫増減数"] ?? ""}`, "2行目（商品名M0701-CB092-INDIV・在庫増減数3）").toBe(`${品("M0701-CB092-INDIV")}×3`);
  });
});

caseTest("IT-M07-01-094", async (ctx) => {
  const l = await 始める(ctx.page);
  const { 行: rows } = await CSVを出す(ctx, l, "M0701-CB094-X", [ctx.notes.get("〔買取番号-M0701-094〕")], "買取商品一覧CSV");
  await ctx.expected(async () => {
    note("商品コードなしの明細は、状態のない同じ商品の明細（アプリのCSVは商品コード空の行として出す）と読んだ");
    expect.soft(rows.length, "CSVのデータ行の数").toBe(2);
    expect.soft(`${rows[0]?.["商品コード"] ?? "（行が無い）"}×${rows[0]?.["在庫増減数"] ?? ""}`, "1行目（商品コードM0701-CB094-P・在庫増減数2）").toBe(`${品("M0701-CB094-P")}×2`);
    expect.soft(`${rows[1] ? rows[1]["商品コード"] : "（行が無い）"}×${rows[1]?.["在庫増減数"] ?? ""}`, "2行目（商品コード欄が空・在庫増減数3）").toBe("×3");
  });
});
