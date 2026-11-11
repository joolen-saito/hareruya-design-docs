/**
 * M07-03 買取情報編集（管理画面）。正本: cases/M07-03_test_cases.tsv
 *
 * DB への書き込みで準備したシード（まとめて買取・個別入力商品・実在庫・日時・本人確認情報）を使うケース。
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で作った実行の印つきの買取にだけ、DBで整えた（seeds/m07-03-c.ts）。
 * 整えたことはシードの報告（シード作成時の問題）に出る。管理画面の操作は試験管理者 m0703_admin で行う（事前準備①）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0703EditPage, 一覧から編集を開く, 編集の可否を読む } from "../../pages/admin/m07_03_edit";
import { M0703SectionsPage } from "../../pages/admin/m07_03_sections";
import { M0703B_ADMIN, M0703B_ADMIN_NAME, 品 } from "../../seeds/m07-03-b";
import { 選んで買取の明細ID } from "../../seeds/m07-db-prep";
import "../../seeds/m07-03-c";
import { 買取の値を読む, 実在庫を読む, 実在庫履歴を読む, 選んで買取の明細, 本店の在庫履歴 } from "../../db/m07_03";
import { まとめて買取の明細を読む, 個別入力商品を読む, 実在庫の件数, 実在庫履歴の件数, 選んで買取の明細の数, 買取金額合計 } from "../../db/m07_03_c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pathOf = (page: Page) => new URL(page.url()).pathname;
const 編集のパス = (番号: string) => new RegExp(`/purchase/${Number(番号)}/edit$`);
const 保存の結果 = (r: { 成功: string[]; エラー: string[] }) => note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);

/** 事前準備①のログインと、手順1（買取情報編集画面を開く）。n は買取NNN の NNN、呼び名はシード表の〔買取番号-M0703-NNN〕 */
async function 始める(ctx: CaseCtx, n: string, 呼び名 = `〔買取番号-M0703-${n}〕`): Promise<{ 番号: string; e: M0703EditPage; s: M0703SectionsPage }> {
  await loginAdmin(ctx.page, M0703B_ADMIN);
  const 番号 = ctx.notes.get(呼び名);
  let e!: M0703EditPage;
  await ctx.step(1, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  return { 番号, e, s: new M0703SectionsPage(ctx.page) };
}

/** 買取状況を変えて保存し、DBの値を読む（手順2〜4） */
async function 状況を変えて保存<T>(ctx: CaseCtx, n: string, 状況: string, 読む: (番号: string) => T): Promise<{ 番号: string; 値: T }> {
  const { 番号, e } = await 始める(ctx, n);
  let 値!: T;
  await ctx.step(2, async () => { await e.買取状況を選ぶ(状況); });
  await ctx.step(3, async () => { 保存の結果(await e.保存を押す()); });
  await ctx.step(4, async () => { 値 = 読む(番号); });
  return { 番号, 値 };
}
const 状況を読む = (番号: string) => 買取の値を読む(番号).買取状況;
const 数字 = (s: string | undefined) => (s ?? "").replace(/[^\d-]/g, "");

// ---- 日付・履歴 ----

caseTest("IT-M07-03-003", async (ctx) => {
  const { e } = await 始める(ctx, "003");
  let d: Awaited<ReturnType<M0703EditPage["日付群"]>> = [];
  await ctx.step(2, async () => { d = await e.日付群(); });
  await ctx.expected(async () => {
    for (const w of ["買取依頼日", "商品到着日", "MTGBuyer査定完了日", "査定内容連絡日", "査定承諾日", "振込完了日", "キャンセル日", "入庫日"]) {
      const x = d.find((y) => y.見出し === w);
      expect.soft(x !== undefined, `日付群に「${w}」の見出しがある`).toBe(true);
      expect.soft(x?.値 ?? "（見出しなし）", `「${w}」の値（値がない）`).toBe("");
    }
  });
  note(`買取ID7004003は決め打ちにできないので画面が振った買取番号で開いた。表示された日付の見出し: ${d.map((x) => `${x.見出し}${x.表示 ? "" : "（非表示）"}`).join("、")}`);
});

caseTest("IT-M07-03-005", async (ctx) => {
  const { e } = await 始める(ctx, "005");
  let rows: Awaited<ReturnType<M0703EditPage["履歴の行"]>> = [];
  await ctx.step(2, async () => { await e.履歴の開閉アイコンを押す(); rows = await e.履歴の行(); });
  await ctx.expected(async () => {
    expect.soft(rows.length, "ステータス変更履歴の行の数").toBe(3);
    const want = [
      { 日時: "2026/08/03 12:00", 状況: "振込依頼済み" },
      { 日時: "2026/08/02 11:00", 状況: "査定内容承諾" },
      { 日時: "2026/08/01 10:00", 状況: "商品到着" },
    ];
    want.forEach((w, i) => {
      expect.soft(rows[i]?.変更日時 ?? "", `${i + 1}行目の変更日時（降順）`).toContain(w.日時);
      expect.soft(rows[i]?.ステータス ?? "", `${i + 1}行目のステータス`).toBe(w.状況);
      expect.soft(rows[i]?.変更者 ?? "", `${i + 1}行目の変更者`).toBe(M0703B_ADMIN_NAME);
    });
  });
  note("買取ID7005005は決め打ちにできないので画面が振った買取番号で開いた。変更者は試験管理者（M07-03試験管理者）");
});

caseTest("IT-M07-03-085", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "085", "査定内容承諾", (n) => 実在庫の件数(n));
  await ctx.expected(async () => { expect(r.値, "DBの、この買取の実在庫情報の件数（売却するサプライ品の実在庫は作られない）").toBe(0); });
});

caseTest("IT-M07-03-054", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "054", "入庫済み", () => 本店の在庫履歴(品("SKU-STK-001-054")));
  await ctx.expected(async () => {
    const hit = r.値.filter((x) => x.登録元.includes("ネット買取"));
    expect.soft(hit.length, "DBの在庫履歴で登録元が「ネット買取」の行の数").toBe(1);
    expect.soft(hit[0]?.仕入単価 ?? "", "仕入単価").toBe("500");
    expect.soft(Number(hit[0]?.登録元ID ?? "NaN"), `登録元ID（アプリは買取のIDを入れる。買取番号 ${r.番号}）`).toBe(Number(r.番号));
  });
  note("シード表の査定ID9001054は決め打ちにできない（買取のIDは振り替えない）ので、登録元IDが画面が振った買取のID（買取番号の数）であることで確かめた");
});

// ---- 明細の並び・合計・編集の可否 ----

caseTest("IT-M07-03-012", async (ctx) => {
  const { e, s } = await 始める(ctx, "012");
  let 選: Awaited<ReturnType<M0703EditPage["選んで買取の明細"]>> = [];
  let まとめて: Awaited<ReturnType<M0703SectionsPage["まとめての行"]>> = [];
  let 個別: Awaited<ReturnType<M0703SectionsPage["個別の行"]>> = [];
  await ctx.step(2, async () => { await s.まとめてを開く(2); });
  await ctx.step(3, async () => { 選 = await e.選んで買取の明細(); まとめて = await s.まとめての行(); 個別 = await s.個別の行(); });
  await ctx.expected(async () => {
    expect.soft(選.map((x) => x.売却), "選んで買取の売却の並び（売却しないが先頭）").toEqual(["しない", "する"]);
    expect.soft(まとめて.map((x) => x.売却), "まとめて買取の売却の並び（売却しないが先頭）").toEqual(["しない", "する"]);
    expect.soft(個別.map((x) => x.売却), "個別入力商品情報の売却の並び（売却しないが先頭）").toEqual(["しない", "する"]);
  });
});

caseTest("IT-M07-03-013", async (ctx) => {
  const { e, s } = await 始める(ctx, "013");
  let 選: Awaited<ReturnType<M0703EditPage["選んで買取の明細"]>> = [];
  let 初期: { 開いている: boolean; 行数: number; まとめて: { 査定金額合計: string; 査定承諾金額合計: string }; 個別: { 査定金額合計: string }; 個別の行数: number } | null = null;
  let 開いた: { 開いている: boolean; 行数: number } | null = null;
  await ctx.step(2, async () => {
    選 = await e.選んで買取の明細();
    初期 = {
      開いている: await s.まとめてが開いているか(), 行数: await s.まとめての行群().count(), まとめて: await s.まとめての合計(),
      個別: await s.個別の合計(), 個別の行数: await s.個別の行群().count(),
    };
  });
  await ctx.step(3, async () => { await s.まとめての開閉を押す(); await s.まとめての行群().first().waitFor({ timeout: 30_000 }).catch(() => null); 開いた = { 開いている: await s.まとめてが開いているか(), 行数: await s.まとめての行群().count() }; });
  await ctx.expected(async () => {
    expect.soft(選.length, "選んで買取の明細の数").toBe(2);
    expect.soft(選.reduce((a, x) => a + Number(x.査定価格) * Number(x.数量), 0), "選んで買取の査定合計").toBe(2000);
    expect.soft(初期?.開いている, "初期表示でまとめて買取の明細が閉じている").toBe(false);
    expect.soft(初期?.行数, "初期表示でまとめて買取の明細の行は表示されない").toBe(0);
    expect.soft(初期?.まとめて.査定金額合計, "まとめて買取の査定金額合計").toBe("3000");
    expect.soft(初期?.まとめて.査定承諾金額合計, "まとめて買取の査定承諾金額合計").toBe("2700");
    expect.soft(初期?.個別の行数, "個別入力商品情報の行の数").toBe(2);
    expect.soft(初期?.個別.査定金額合計, "個別入力商品情報の査定金額合計").toBe("1000");
    expect.soft(開いた?.開いている, "開閉リンク押下後にまとめて買取の明細が開く").toBe(true);
    expect.soft(開いた?.行数, "開閉リンク押下後のまとめて買取の明細の数").toBe(3);
  });
});

caseTest("IT-M07-03-015", async (ctx) => {
  const { e, s } = await 始める(ctx, "015");
  const sup = 品("SUP-EDIT-001-015"), card = 品("CARD-EDIT-001-015"), blk = 品("M0703-015-BLK"), ind = 品("M0703-015-IND");
  const 可否: Record<string, boolean> = {};
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => {
    await s.まとめてを開く(1);
    const r = (名: string) => e.選んで買取の行(名);
    const items: [string, import("@playwright/test").Locator][] = [
      ["送料", e.送料の欄()], ["管理者用メモ", e.メモの欄()],
      ["サプライ品の売却", e.明細の入力欄(sup, "売却")], ["サプライ品の査定価格", e.明細の入力欄(sup, "査定価格")], ["サプライ品の数量", e.明細の入力欄(sup, "数量")],
      ["カードの売却", e.明細の入力欄(card, "売却")], ["まとめて買取の売却", s.まとめての入力欄(blk, "売却")], ["個別入力商品の売却", s.個別の売却欄(ind)],
      ["サプライ品の状態", r(sup).locator('[name$="[cardCondition]"]')], ["カードの状態", r(card).locator('[name$="[cardCondition]"]')],
      ["カードの査定価格", e.明細の入力欄(card, "査定価格")], ["カードの数量", e.明細の入力欄(card, "数量")],
      ["まとめて買取の査定価格", s.まとめての入力欄(blk, "査定価格")], ["まとめて買取の数量", s.まとめての入力欄(blk, "数量")],
    ];
    for (const [k, l] of items) 可否[k] = (await 編集の可否を読む(l)).編集できる;
    可否["個別入力商品の商品名・査定金額・数量"] = await s.個別の文字欄に入力部品があるか(ind);
  });
  await ctx.expected(async () => {
    for (const k of ["送料", "管理者用メモ", "サプライ品の売却", "サプライ品の査定価格", "サプライ品の数量", "カードの売却", "まとめて買取の売却", "個別入力商品の売却"]) {
      expect.soft(可否[k], `査定編集中に「${k}」が編集可能`).toBe(true);
    }
    for (const k of ["サプライ品の状態", "カードの状態", "カードの査定価格", "カードの数量", "まとめて買取の査定価格", "まとめて買取の数量", "個別入力商品の商品名・査定金額・数量"]) {
      expect.soft(可否[k], `査定編集中に「${k}」が編集不可`).toBe(false);
    }
  });
  note("個別入力商品の商品名・査定金額・数量は、画面では文字で出る（入力欄が無い）ので、入力部品が無いことを編集不可とした");
});

caseTest("IT-M07-03-017", async (ctx) => {
  const { e, s } = await 始める(ctx, "017");
  let 選: Awaited<ReturnType<M0703EditPage["選んで買取の明細"]>> = [];
  let 複製: number | null = null, まとめてのリンク = true;
  await ctx.step(2, async () => {
    選 = await e.選んで買取の明細();
    複製 = await ctx.page.locator("#edit_purchase_info_box__list a, #edit_purchase_info_box__list button").filter({ hasText: "複製" }).count();
    await s.まとめてを開く(1);
    まとめてのリンク = await s.まとめてに削除か複製のリンクがあるか();
  });
  await ctx.expected(async () => {
    expect.soft(選.length, "選んで買取の明細の数（サプライ品・カード）").toBe(2);
    expect.soft(選.some((x) => x.削除リンク), "選んで買取に「削除」リンクが表示される行がある（表示されない）").toBe(false);
    expect.soft(複製, "選んで買取の「複製」リンクの数（表示されない）").toBe(0);
    expect.soft(まとめてのリンク, "まとめて買取に「削除」「複製」のリンクがある（表示されない）").toBe(false);
  });
});

type 売却の3区分 = { 選: string[]; まとめて: string[]; 個別: string[] };
async function 一括売却登録を試す(ctx: CaseCtx, n: string, 答え: "OK" | "キャンセル"): Promise<{ 文: string[]; 前: 売却の3区分; 後: 売却の3区分 }> {
  const { 番号, e } = await 始める(ctx, n);
  const 読む = (): 売却の3区分 => ({ 選: 選んで買取の明細(番号).map((x) => x.売却), まとめて: まとめて買取の明細を読む(番号).map((x) => x.売却), 個別: 個別入力商品を読む(番号).map((x) => x.売却) });
  const 前 = 読む();
  let 文: string[] = [];
  let 後!: 売却の3区分;
  await ctx.step(2, async () => { 文 = await e.一括売却登録を押す(答え); });
  await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note(`送信前確認の文「${文.join(" / ")}」に「${答え}」で答えた（ダイアログは押した直後に出るので、手順2の中で応答を決めた）。保存前の値（選んで買取／まとめて買取／個別入力商品）: ${JSON.stringify(前)}`); });
  await ctx.step(4, async () => { 後 = 読む(); });
  return { 文, 前, 後 };
}
caseTest("IT-M07-03-059", async (ctx) => {
  const { 文, 前, 後 } = await 一括売却登録を試す(ctx, "059", "キャンセル");
  await ctx.expected(async () => {
    expect.soft(文.length, "送信前確認のダイアログが出た").toBe(1);
    expect.soft(前.まとめて.includes("未定") && 前.個別.includes("未定") && 前.選.includes("未定"), "保存前の3区分に売却未定の行がある").toBe(true);
    expect.soft(後.選, "選んで買取の売却状況（保存前のまま）").toEqual(前.選);
    expect.soft(後.まとめて, "まとめて買取の売却状況（保存前のまま）").toEqual(前.まとめて);
    expect.soft(後.個別, "個別入力商品情報の売却状況（保存前のまま）").toEqual(前.個別);
  });
});
caseTest("IT-M07-03-060", async (ctx) => {
  const { 文, 前, 後 } = await 一括売却登録を試す(ctx, "060", "OK");
  await ctx.expected(async () => {
    expect.soft(文.length, "送信前確認のダイアログが出た").toBe(1);
    expect.soft(後.選, "選んで買取の全明細の売却状況").toEqual(前.選.map(() => "する"));
    expect.soft(後.まとめて, "まとめて買取の全明細の売却状況").toEqual(前.まとめて.map(() => "する"));
    expect.soft(後.個別, "個別入力商品情報の全明細の売却状況").toEqual(前.個別.map(() => "する"));
  });
});

caseTest("IT-M07-03-148", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "148");
  let 文: string[] = [];
  let 選: string[] = [], まとめて: string[] = [];
  await ctx.step(2, async () => { 文 = await e.一括売却登録を押す("OK"); });
  await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note(`送信前確認の文「${文.join(" / ")}」に「OK」で答えた（ダイアログは押した直後に出るので、手順2の中で応答を決めた）`); });
  await ctx.step(4, async () => { 選 = 選んで買取の明細(番号).map((x) => x.売却); まとめて = まとめて買取の明細を読む(番号).map((x) => x.売却); });
  await ctx.expected(async () => {
    expect.soft(まとめて, "まとめて買取3件の売却状況").toEqual(["する", "する", "する"]);
    expect.soft(選, "選んで買取2件の売却状況").toEqual(["する", "する"]);
  });
});

caseTest("IT-M07-03-086", async (ctx) => {
  const { e } = await 始める(ctx, "086");
  const sup = 品("M0703-086-SUP");
  let 前 = "", 後 = "";
  await ctx.step(2, async () => { await e.査定編集を始める(); 前 = await e.査定金額合計(); });
  await ctx.step(3, async () => { await e.明細を名前で入れる(sup, { 査定価格: "1500" }); });
  await ctx.step(4, async () => { await e.査定確定する(); });
  await ctx.step(5, async () => { 保存の結果(await e.保存を押す()); });
  await ctx.step(6, async () => { 後 = await e.査定金額合計(); });
  await ctx.expected(async () => { expect(後, "保存後の査定金額合計（選んで買取1500×2＋まとめて買取100×3＋個別入力商品200×1）").toBe("3500"); });
  note(`査定編集を始めた時点の査定金額合計の表示: ${前}（シード表では2500）`);
});

caseTest("IT-M07-03-100", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "100");
  const before = 買取金額合計(番号);
  let 文: string[] = [];
  let 後 = "";
  await ctx.step(2, async () => { /* 削除リンクは手順3で押す */ await e.選んで買取の行(品("M0703-100-SUP")).locator('td[id^="purchase_list_main__delete--"] a').waitFor({ timeout: 30_000 }); });
  await ctx.step(3, async () => {
    ctx.page.once("dialog", (d) => { 文.push(d.message()); void d.accept(); });
    await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), e.選んで買取の行(品("M0703-100-SUP")).locator('td[id^="purchase_list_main__delete--"] a').click()]);
    await ctx.page.waitForLoadState("load");
    note(`削除の確認ダイアログ「${文.join(" / ")}」に「OK」で答えた（ダイアログは押した直後に出るので、手順3の中で応答を決めた）。削除前のDBの買取金額の合計: ${before}`);
  });
  await ctx.step(4, async () => { 後 = 買取金額合計(番号); });
  await ctx.expected(async () => {
    expect.soft(before, "削除前の買取金額の合計（シード表の1550）").toBe("1550");
    expect.soft(後, "削除後の買取金額の合計（残る明細の合計1245を10円単位に切り上げた値）").toBe("1250");
  });
});

async function 査定編集の売却の入力欄を試す(ctx: CaseCtx, n: string): Promise<{ 編集中: boolean; 確定後: boolean; ボタン: string }> {
  const { e, s } = await 始める(ctx, n);
  const 欄 = () => (n === "116" ? s.まとめての入力欄(品("M0703-116-BLK"), "売却") : s.個別の売却欄(品("M0703-117-IND")));
  let 編集中 = false, 確定後 = true, ボタン = "";
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => { if (n === "116") await s.まとめてを開く(1); 編集中 = (await 編集の可否を読む(欄())).編集できる; });
  await ctx.step(4, async () => { await e.査定確定する(); });
  await ctx.step(5, async () => { 確定後 = (await 編集の可否を読む(欄())).編集できる; ボタン = await e.査定編集ボタンの文(); });
  return { 編集中, 確定後, ボタン };
}
caseTest("IT-M07-03-116", async (ctx) => {
  const r = await 査定編集の売却の入力欄を試す(ctx, "116");
  await ctx.expected(async () => {
    expect.soft(r.編集中, "手順3のまとめて買取の売却が編集可能").toBe(true);
    expect.soft(r.確定後, "まとめて買取の売却の入力欄が編集可能（編集不可になる）").toBe(false);
    expect.soft(r.ボタン, "査定側のボタンの表示").toBe("査定編集");
  });
});
caseTest("IT-M07-03-117", async (ctx) => {
  const r = await 査定編集の売却の入力欄を試す(ctx, "117");
  await ctx.expected(async () => {
    expect.soft(r.編集中, "手順3の個別入力商品情報の売却が編集可能").toBe(true);
    expect.soft(r.確定後, "個別入力商品情報の売却の入力欄が編集可能（編集不可になる）").toBe(false);
    expect.soft(r.ボタン, "査定側のボタンの表示").toBe("査定編集");
  });
});

// ---- 選んで買取の削除（サプライ品以外は削除できない） ----

async function カードの削除を試す(ctx: CaseCtx, n: string): Promise<{ 番号: string; 文: string[] }> {
  const { 番号, e } = await 始める(ctx, n);
  const sup = 品(`M0703-${n}-SUP`), card = 品(`M0703-${n}-CARD`);
  const 文: string[] = [];
  const 宛先 = { 前: "", 後: "" };
  await ctx.step(2, async () => {
    const supId = 選んで買取の明細ID(番号, sup), cardId = 選んで買取の明細ID(番号, card);
    const link = e.選んで買取の行(sup).locator('td[id^="purchase_list_main__delete--"] a');
    await link.waitFor({ timeout: 30_000 });
    宛先.前 = (await link.getAttribute("href")) ?? "";
    await link.evaluate((a, v) => { const el = a as HTMLAnchorElement; el.setAttribute("href", el.getAttribute("href")!.replace(new RegExp(`/${v.from}(?=/|$|\\?)`), `/${v.to}`)); }, { from: supId, to: cardId });
    宛先.後 = (await link.getAttribute("href")) ?? "";
  });
  await ctx.step(3, async () => {
    ctx.page.on("dialog", (d) => { 文.push(d.message()); void d.accept(); });
    const link = e.選んで買取の行(sup).locator('td[id^="purchase_list_main__delete--"] a');
    await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), link.click()]);
    await ctx.page.waitForLoadState("load");
  });
  await ctx.step(4, async () => { note(`削除リンクの宛先を書き換えた: 「${宛先.前}」→「${宛先.後}」。確認ダイアログ「${文.join(" / ")}」に「OK」で答えた（ダイアログは押した直後に出るので、手順3の中で応答を決めた）`); });
  return { 番号, 文 };
}

caseTest("IT-M07-03-099", async (ctx) => {
  const { 番号 } = await カードの削除を試す(ctx, "099");
  let 残 = 0;
  await ctx.step(5, async () => { 残 = 選んで買取の明細の数(番号, 品("M0703-099-CARD")); });
  await ctx.expected(async () => { expect(残, "DBのカード M0703-099-CARD の明細の数（削除されずに残る）").toBe(1); });
});

caseTest("IT-M07-03-123", async (ctx) => {
  const { 番号 } = await カードの削除を試す(ctx, "123");
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "削除後の画面（買取情報編集）").toMatch(編集のパス(番号));
    await expect.soft(ctx.page.locator(".alert-danger").filter({ hasText: "サプライ品以外は削除できません" }), "管理画面上部の「サプライ品以外は削除できません」").toBeVisible();
  });
});

// ---- 買取状況の変更と実在庫 ----

caseTest("IT-M07-03-022", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "022", "〔買取番号-M0703-022A〕");
  let csv!: Awaited<ReturnType<M0703EditPage["古物台帳CSV出力を押す"]>>;
  await ctx.step(2, async () => { csv = await e.古物台帳CSV出力を押す(); });
  await ctx.step(3, async () => { note(`ダウンロードされたCSVの見出し: ${csv.見出し.join("・")}（${csv.行.length}行）`); });
  await ctx.expected(async () => {
    expect.soft(csv.見出し, "CSVの項目構成（定義順）").toEqual(["日付", "受注番号", "氏名", "住所", "年齢", "職業", "電話番号", "身分証", "点数", "金額", "区別", "品目", "特徴", "利用回数", "前回利用日"]);
    expect.soft(csv.行.length, "CSVのデータ行の数（当該買取だけ）").toBe(1);
    const r = csv.行[0] ?? {};
    const want: Record<string, string> = {
      日付: "2026/08/10", 受注番号: String(Number(番号)), 氏名: "晴屋CSV", 住所: "東京都 千代田区 神田1-2-3",
      年齢: String(new Date().getFullYear() - 1990), 職業: "会社員", 電話番号: "09012345678", 身分証: "自動車運転免許証",
      点数: "3", 金額: "2400", 区別: "買受", 品目: "トレーディングカード", 特徴: "マジック・ザ・ギャザリング", 利用回数: "2", 前回利用日: "2026/07/01",
    };
    for (const [k, v] of Object.entries(want)) expect.soft(r[k] ?? "（列なし）", `CSVの「${k}」`).toBe(v);
  });
  note("CSVの値の取り方は機能設計書の「出力する列」に従った: 氏名は姓と名をスペースなしで連結（晴屋CSV）、住所は都道府県・住所1・住所2を半角スペースで連結、年齢は「サーバの現在の年」と生年（1990）の差なので、テストを流す端末の現在の年から1990を引いた値で比べた（サーバと端末の年が同じ前提）、受注番号は買取番号");
});

caseTest("IT-M07-03-048", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "048", "振込完了", 実在庫を読む);
  await ctx.expected(async () => {
    expect(r.値.some((x) => x.商品コード === 品("M0703-048-STK1")), "DBに、売却しない IND-NOTSALE-001-048 の実在庫情報がある（削除されない）").toBe(true);
  });
});
caseTest("IT-M07-03-049", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "049", "振込完了", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（全個別入力商品が実在庫登録済みなので入庫待ち）").toBe("入庫待ち"); });
});
caseTest("IT-M07-03-050", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "050", "振込完了", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（実在庫未登録の個別入力商品が残るので未登録在庫あり）").toBe("未登録在庫あり"); });
});
caseTest("IT-M07-03-080", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "080", "振込完了", 実在庫を読む);
  await ctx.expected(async () => {
    expect(r.値.filter((x) => x.商品コード === 品("M0703-080-STK")).length, "DBの、売却しない M0703-080-NOTSALE の実在庫情報の数（1件のまま）").toBe(1);
  });
});

caseTest("IT-M07-03-082", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "082", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    const hit = r.値.filter((x) => x.商品コード === 品("M0703-082-BULK"));
    expect.soft(hit.length, "DBの、M0703-082-BULK の商品規格に紐づく実在庫情報の数").toBe(1);
    expect.soft(hit[0]?.数量, "その数量").toBe(3);
  });
});
caseTest("IT-M07-03-120", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "120", "査定内容承諾", 実在庫履歴を読む);
  await ctx.expected(async () => {
    expect(r.値.filter((x) => x.商品コード === 品("M0703-120-BULK")).length, "DBの、M0703-120-BULK の実在庫に対応する実在庫履歴の数").toBe(1);
  });
});
caseTest("IT-M07-03-126", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "126", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    expect.soft(r.値.map((x) => `${x.商品コード}:${x.数量}`), "DBの、この買取の実在庫情報（売却する M0703-126-BULK の数量3の1件だけ）").toEqual([`${品("M0703-126-BULK")}:3`]);
    expect.soft(r.値.some((x) => x.商品コード === 品("M0703-126-BULKN")), "売却しない M0703-126-BULKN の実在庫情報がある（作られない）").toBe(false);
  });
});
caseTest("IT-M07-03-145", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "145", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    expect.soft(r.値.length, "DBの、この買取の実在庫情報の数").toBe(2);
    expect.soft(r.値.map((x) => `${x.商品コード}:${x.数量}`).sort(), "実在庫情報（M0703-145-SUP の数量2・M0703-145-BULK の数量3）").toEqual([`${品("M0703-145-BULK")}:3`, `${品("M0703-145-SUP")}:2`].sort());
  });
});
caseTest("IT-M07-03-159", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "159", "査定内容承諾", (n) => ({ 在庫: 実在庫の件数(n), 履歴: 実在庫履歴の件数(n) }));
  await ctx.expected(async () => {
    expect.soft(r.値.在庫, "DBの、この買取の実在庫情報の件数").toBe(0);
    expect.soft(r.値.履歴, "DBの、この買取の実在庫履歴の件数").toBe(0);
  });
});
caseTest("IT-M07-03-121", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "121", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    expect.soft(r.値.map((x) => `${x.商品コード}:${x.数量}`), "DBの、この買取の実在庫情報（M0703-121-SUP の数量2の1件だけ）").toEqual([`${品("M0703-121-SUP")}:2`]);
    expect.soft(r.値.some((x) => x.商品コード === 品("M0703-121-OLD")), "事前の M0703-121-OLD の実在庫情報が残っている（残らない）").toBe(false);
  });
});
caseTest("IT-M07-03-122", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "122", "査定内容承諾", 実在庫履歴を読む);
  await ctx.expected(async () => {
    expect.soft(r.値.map((x) => x.商品コード), "DBの、この買取の実在庫履歴（M0703-122-SUP の実在庫に対応する1件だけ）").toEqual([品("M0703-122-SUP")]);
    expect.soft(r.値.some((x) => x.商品コード === 品("M0703-122-OLD")), "事前の M0703-122-OLDHIST が残っている（残らない）").toBe(false);
  });
});

// ---- 本人確認情報 ----

caseTest("IT-M07-03-108", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "108");
  let r!: Awaited<ReturnType<M0703EditPage["保存を押す"]>>;
  await ctx.step(2, async () => { await e.買取状況を選ぶ("振込依頼済み"); });
  await ctx.step(3, async () => { r = await e.保存を押す(); });
  await ctx.step(4, async () => { r = { ...r, ...(await e.画面上部のメッセージ()) }; });
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "保存後の画面（買取情報編集）").toMatch(編集のパス(番号));
    expect.soft([...r.成功, ...r.エラー].join(" / "), "画面上部のメッセージ").toContain("会員の本人確認情報を取得できません。");
  });
});
caseTest("IT-M07-03-118", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "118", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（査定内容承諾のまま）").toBe("査定内容承諾"); });
});

// ---- 実在庫登録 ----

const 登録の商品 = 品("STOCK-REG-001");

/** 手順1〜3（買取を開く → 個別入力商品の「実在庫登録」を押す → 商品コードを検索して選択する） */
async function 実在庫を登録する(ctx: CaseCtx, n: string, 名前: string): Promise<{ 番号: string; e: M0703EditPage; s: M0703SectionsPage; 送信: { 送信された: boolean; 応答: number | null } }> {
  const { 番号, e, s } = await 始める(ctx, n);
  let 送信 = { 送信された: false, 応答: null as number | null };
  await ctx.step(2, async () => { await s.実在庫登録を押す(品(名前)); });
  await ctx.step(3, async () => {
    送信 = await s.登録の商品を選ぶ(登録の商品);
    note(`検索語は商品コード STOCK-REG-001 に実行の印を付けた ${登録の商品}。登録の送信: ${送信.送信された ? `応答 ${送信.応答}` : "送られなかった"}`);
  });
  return { 番号, e, s, 送信 };
}

caseTest("IT-M07-03-062", async (ctx) => {
  const { e, s } = await 始める(ctx, "062");
  let 状況 = "";
  let 行: Awaited<ReturnType<M0703SectionsPage["個別の行"]>> = [];
  await ctx.step(2, async () => { 状況 = (await e.基本情報()).買取状況; 行 = await s.個別の行(); });
  await ctx.expected(async () => {
    expect.soft(状況, "現在の買取状況").toBe("未登録在庫あり");
    expect.soft(行.find((x) => x.商品名 === 品("IND-STOCK-001-062"))?.実在庫, "IND-STOCK-001-062 の実在庫登録の欄（登録ボタン）").toBe("登録ボタン");
  });
  note("実在庫登録のボタンの画面の文字は「実在庫情報登録」（シード表・手順では「実在庫登録」）");
});
caseTest("IT-M07-03-063", async (ctx) => {
  const { s } = await 始める(ctx, "063");
  let 行: Awaited<ReturnType<M0703SectionsPage["個別の行"]>> = [];
  await ctx.step(2, async () => { 行 = await s.個別の行(); });
  await ctx.expected(async () => {
    expect.soft(行.find((x) => x.商品名 === 品("IND-STOCK-002-063"))?.実在庫, "IND-STOCK-002-063 の実在庫登録の欄（実在庫登録済み。ボタンは無い）").toBe("登録済み");
  });
});
caseTest("IT-M07-03-064", async (ctx) => {
  const { s } = await 始める(ctx, "064");
  await ctx.step(2, async () => { await s.実在庫登録を押す(品("IND-STOCK-001-064")); });
  await ctx.expected(async () => {
    await expect.soft(s.登録のモーダル(), "実在庫として登録する商品を選択する商品検索モーダル").toBeVisible();
    await expect.soft(s.登録のモーダル().locator("#registModalLabel"), "モーダルの見出し").toHaveText("商品検索");
    await expect.soft(s.登録のモーダル().locator("#stock_admin_search_product_id"), "商品の検索欄").toBeVisible();
  });
});
caseTest("IT-M07-03-065", async (ctx) => {
  const { 番号 } = await 実在庫を登録する(ctx, "065", "IND-STOCK-001-065");
  let 在庫: ReturnType<typeof 実在庫を読む> = [];
  await ctx.step(4, async () => { 在庫 = 実在庫を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(在庫.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(在庫[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(在庫[0]?.数量, "数量").toBe(2);
    expect.soft(在庫[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-066", async (ctx) => {
  const { 番号, s } = await 実在庫を登録する(ctx, "066", "IND-STOCK-001-066");
  let 個別: ReturnType<typeof 個別入力商品を読む> = [];
  let 行: Awaited<ReturnType<M0703SectionsPage["個別の行"]>> = [];
  await ctx.step(4, async () => { 個別 = 個別入力商品を読む(番号); 行 = await s.個別の行(); });
  await ctx.expected(async () => {
    expect.soft(個別.find((x) => x.名前 === 品("IND-STOCK-001-066"))?.商品コード, "DBの IND-STOCK-001-066 の商品コード").toBe(登録の商品);
    expect.soft(行.find((x) => x.商品名 === 品("IND-STOCK-001-066"))?.実在庫, "実在庫登録状況（実在庫登録済み）").toBe("登録済み");
  });
});
caseTest("IT-M07-03-067", async (ctx) => {
  const { 番号 } = await 実在庫を登録する(ctx, "067", "IND-STOCK-001-067");
  let 状況 = "";
  await ctx.step(4, async () => { 状況 = 状況を読む(番号); });
  await ctx.expected(async () => { expect(状況, "DBの買取状況（実在庫未登録の IND-STOCK-003-067 が残るので未登録在庫ありのまま）").toBe("未登録在庫あり"); });
});
caseTest("IT-M07-03-068", async (ctx) => {
  const { 番号 } = await 実在庫を登録する(ctx, "068", "IND-STOCK-004-068");
  let 状況 = "";
  await ctx.step(4, async () => { 状況 = 状況を読む(番号); });
  await ctx.expected(async () => { expect(状況, "DBの買取状況（すべて実在庫登録済みなので入庫待ち）").toBe("入庫待ち"); });
});

caseTest("IT-M07-03-069", async (ctx) => {
  const { 番号, e, s } = await 始める(ctx, "069");
  await ctx.step(2, async () => { await s.実在庫登録を押す(品("IND-STOCK-001-069")); });
  await ctx.step(3, async () => {
    // 開発者ツールで登録リクエストのなりすまし対策トークンを書き換える代わりに、送信されるリクエストの値を書き換える
    await ctx.page.route(/\/purchase\/\d+\/register-individual-stock\/\d+/, async (route) => {
      const body = route.request().postData() ?? "";
      await route.continue({ postData: body.replace(/(^|&)_token=[^&]*/, "$1_token=invalid-token") });
    });
    await s.登録の商品を選ぶ(登録の商品);
  });
  let m!: { 成功: string[]; エラー: string[] };
  await ctx.step(4, async () => { m = await e.画面上部のメッセージ(); });
  await ctx.expected(async () => { expect(pathOf(ctx.page), "セキュリティ確認後の画面（買取情報編集）").toMatch(編集のパス(番号)); });
  note(`送信するトークンの値を route で「invalid-token」に書き換えた。画面上部のメッセージ: 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」。実在庫の件数: ${実在庫の件数(番号)}`);
});
caseTest("IT-M07-03-070", async (ctx) => {
  const { 番号, e, s } = await 始める(ctx, "070");
  await ctx.step(2, async () => { await s.実在庫登録を押す(品("IND-STOCK-001-070")); });
  await ctx.step(3, async () => {
    await ctx.page.route(/\/purchase\/\d+\/register-individual-stock\/\d+/, async (route) => {
      const body = route.request().postData() ?? "";
      await route.continue({ postData: body.replace(/(^|&)product_class_id=[^&]*/, "$1product_class_id=999999") });
    });
    await s.登録の商品を選ぶ(登録の商品);
  });
  let m!: { 成功: string[]; エラー: string[] };
  await ctx.step(4, async () => { m = await e.画面上部のメッセージ(); });
  await ctx.expected(async () => { expect(pathOf(ctx.page), "商品規格の確認後の画面（買取情報編集）").toMatch(編集のパス(番号)); });
  note(`送信する商品規格IDを route で 999999 に書き換えた。画面上部のメッセージ: 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」。実在庫の件数: ${実在庫の件数(番号)}`);
});
caseTest("IT-M07-03-073", async (ctx) => {
  const { 番号, e, s } = await 始める(ctx, "073");
  const 文: string[] = [];
  ctx.page.on("dialog", (d) => { 文.push(d.message()); void d.accept(); });
  let 送信 = { 送信された: false, 応答: null as number | null };
  await ctx.step(2, async () => {
    // 開発者ツールで実在庫登録用のなりすまし対策トークンを削除する代わりに、画面の設定からトークンを除いて読み込み直す
    await ctx.page.addInitScript(() => {
      const parse = JSON.parse;
      JSON.parse = function (text: string, reviver?: (this: unknown, key: string, value: unknown) => unknown) {
        const v = parse.call(JSON, text, reviver);
        if (v && typeof v === "object" && "registerIndividualStockToken" in v) delete (v as Record<string, unknown>).registerIndividualStockToken;
        return v;
      } as typeof JSON.parse;
    });
    await ctx.page.reload();
    await e.読み込みを待つ();
  });
  await ctx.step(3, async () => { await s.実在庫登録を押す(品("IND-STOCK-001-073")); });
  await ctx.step(4, async () => { 送信 = await s.登録の商品を選ぶ(登録の商品); });
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "実在庫登録の後の画面（買取情報編集に留まる）").toMatch(編集のパス(番号));
    expect.soft(送信.送信された, "実在庫登録の送信が行われた（行われない）").toBe(false);
  });
  note(`画面が出したアラート: ${文.join(" / ") || "なし"}。実在庫の件数: ${実在庫の件数(番号)}`);
});

caseTest("IT-M07-03-104", async (ctx) => {
  const { e } = await 実在庫を登録する(ctx, "104", "M0703-104-IND");
  let m!: { 成功: string[]; エラー: string[] };
  await ctx.step(4, async () => { m = await e.画面上部のメッセージ(); });
  await ctx.expected(async () => {
    expect.soft(m.エラー.join(" / "), "管理画面上部のメッセージ").toContain("実在庫情報の登録は「査定内容承諾」〜「入庫待ち」のステータスの場合のみ可能です。");
  });
  note(`画面上部のメッセージ: 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
});
caseTest("IT-M07-03-105", async (ctx) => {
  const { 番号 } = await 実在庫を登録する(ctx, "105", "M0703-105-IND");
  let 件数 = -1, 個別: ReturnType<typeof 個別入力商品を読む> = [];
  await ctx.step(4, async () => { 件数 = 実在庫の件数(番号); 個別 = 個別入力商品を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(件数, "DBの、この買取の実在庫情報の件数（0件のまま）").toBe(0);
    expect.soft(個別.find((x) => x.名前 === 品("M0703-105-IND"))?.商品コード, "M0703-105-IND の商品コード（実在庫未登録のまま）").toBe("");
  });
});

/** 登録できる状況（実在庫情報が1件登録される） */
async function 登録できる状況で登録する(ctx: CaseCtx, n: string): Promise<ReturnType<typeof 実在庫を読む>> {
  const { 番号 } = await 実在庫を登録する(ctx, n, `M0703-${n}-IND`);
  let 在庫: ReturnType<typeof 実在庫を読む> = [];
  await ctx.step(4, async () => { 在庫 = 実在庫を読む(番号); });
  return 在庫;
}
caseTest("IT-M07-03-106", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "106");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-129", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "129");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-130", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "130");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-131", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "131");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-132", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "132");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-133", async (ctx) => {
  const r = await 登録できる状況で登録する(ctx, "133");
  await ctx.expected(async () => {
    expect.soft(r.length, "DBの、この買取の実在庫情報の数").toBe(1);
    expect.soft(r[0]?.商品コード, "商品コード").toBe(登録の商品);
    expect.soft(r[0]?.数量, "数量").toBe(2);
    expect.soft(r[0]?.小計, "買取小計（買取単価700×数量2）").toBe(1400);
  });
});
caseTest("IT-M07-03-107", async (ctx) => {
  const { 番号 } = await 実在庫を登録する(ctx, "107", "M0703-107-IND");
  let 履歴: ReturnType<typeof 実在庫履歴を読む> = [];
  await ctx.step(4, async () => { 履歴 = 実在庫履歴を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(履歴.length, "DBの、この買取の実在庫履歴の数").toBe(1);
    expect.soft(履歴[0]?.商品コード, "その実在庫履歴の商品コード（登録した実在庫情報に対応）").toBe(登録の商品);
  });
});
/** 登録できない状況（実在庫情報は登録されない） */
async function 登録できない状況で登録する(ctx: CaseCtx, n: string): Promise<{ 件数: number; コード: string | undefined }> {
  const { 番号 } = await 実在庫を登録する(ctx, n, `M0703-${n}-IND`);
  let 件数 = -1, 個別: ReturnType<typeof 個別入力商品を読む> = [];
  await ctx.step(4, async () => { 件数 = 実在庫の件数(番号); 個別 = 個別入力商品を読む(番号); });
  return { 件数, コード: 個別.find((x) => x.名前 === 品(`M0703-${n}-IND`))?.商品コード };
}
caseTest("IT-M07-03-134", async (ctx) => {
  const r = await 登録できない状況で登録する(ctx, "134");
  await ctx.expected(async () => {
    expect.soft(r.件数, "DBの、この買取の実在庫情報の件数（0件のまま）").toBe(0);
    expect.soft(r.コード, "M0703-134-IND の商品コード（実在庫未登録のまま）").toBe("");
  });
});
caseTest("IT-M07-03-135", async (ctx) => {
  const r = await 登録できない状況で登録する(ctx, "135");
  await ctx.expected(async () => {
    expect.soft(r.件数, "DBの、この買取の実在庫情報の件数（0件のまま）").toBe(0);
    expect.soft(r.コード, "M0703-135-IND の商品コード（実在庫未登録のまま）").toBe("");
  });
});
