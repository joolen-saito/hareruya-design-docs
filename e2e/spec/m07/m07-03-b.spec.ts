/**
 * M07-03 買取情報編集（管理画面）。正本: cases/M07-03_test_cases.tsv
 *
 * 依頼者の方針（2026-11-10）で、DBでの準備が要るとしていたシードを「画面で作ったデータ・既存データ」に読み替えたケース。
 * 読み替えはシードの報告（シード作成時の問題）に出る（seeds/m07-03-b.ts）。
 * 管理画面の操作は試験管理者 m0703_admin で行う（事前準備①）。買取情報編集は買取検索一覧を買取番号で検索して、番号のリンクから開く。
 */
import { Locator, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { StockListPage } from "../../pages/admin/stock_edit";
import { BuyListPage, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { M0703EditPage, ManualMailPage, 一覧から編集を開く, 編集の可否を読む } from "../../pages/admin/m07_03_edit";
import { M0703B_ADMIN, M0703RG_ADMIN, 品, 買取の会員 } from "../../seeds/m07-03-b";
import { 買取の値を読む, 履歴の件数, 実在庫を読む, 実在庫履歴を読む, 本店の在庫, 本店の在庫履歴, 選んで買取の明細 } from "../../db/m07_03";
import { StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import { chooseHistoryShopAndZone, searchStockByCode } from "../../pages/admin/m04_02_rc_stock";
import { 本店の店名 } from "../../pages/admin/m05_admin_member";
import { PurchaseHistoryPage, 会員の買取履歴の状況, 会員の買取履歴から開く, 在庫の行の値 } from "../../pages/admin/m07_03_rg";
import { openEditFromResult, searchCustomer } from "../../pages/admin/f06_customer";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pathOf = (page: Page) => new URL(page.url()).pathname;
const 編集のパス = (番号: string) => new RegExp(`/purchase/${Number(番号)}/edit$`);

/** 事前準備①のログインと、手順1（買取情報編集画面を開く） */
async function 始める(ctx: CaseCtx, label: string): Promise<{ 番号: string; e: M0703EditPage }> {
  await loginAdmin(ctx.page, M0703B_ADMIN);
  const 番号 = ctx.notes.get(label);
  let e!: M0703EditPage;
  await ctx.step(1, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  return { 番号, e };
}

// ---- 表示 ----

caseTest("IT-M07-03-001", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-001〕");
  let v!: Awaited<ReturnType<M0703EditPage["基本情報"]>>;
  await ctx.step(2, async () => { v = await e.基本情報(); });
  await ctx.expected(async () => {
    expect.soft(v.買取番号, "買取番号").toBe(買取番号の表示(番号));
    expect.soft(v.本人確認, "本人確認状態").toBe("オンライン本人確認済み");
    expect.soft(v.氏名, "買取依頼者氏名").toBe("晴屋 太郎");
    expect.soft(v.氏名カナ, "買取依頼者氏名カナ").toBe("ハレヤ タロウ");
    expect.soft(v.振込依頼可能, "振込依頼可能（オン）").toBe(true);
    expect.soft(v.振込失敗, "振込失敗（オフ）").toBe(false);
    expect.soft(v.事業者, "適格請求書発行事業者情報（事業者）").toBe("事業者");
    expect.soft(v.登録番号, "適格請求書発行事業者の登録番号").toBe("T0000000000001");
    expect.soft(v.承諾方法, "買取の承諾方法（査定結果確認後承諾＝手動承諾の表示）").toBe("手動承諾");
    expect.soft(v.買取状況, "現在の買取状況").toBe("査定内容承諾");
  });
  note("買取の承諾方法は、画面では「自動承諾」か「手動承諾」で出る。シード値の「査定結果確認後承諾」は「手動承諾」の表示として確かめた");
});

caseTest("IT-M07-03-002", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-002〕");
  let opts: string[] = [];
  await ctx.step(2, async () => { await e.買取状況の選択肢を開く(); opts = await e.買取状況の選択肢(); });
  await ctx.expected(async () => {
    // 設計書（L0059〜L0063 の査定系・払い出しのステータス）と、事前準備の参照値（REF・GF-STATUS）にある管理画面用の状況
    const want = ["注文", "商品到着", "査定中", "査定中断", "査定再開", "MTGBuyer査定完了", "査定内容連絡済み", "査定内容承諾", "振込依頼済み", "振込完了",
      "振込失敗", "簡易書留送付済み", "キャンセル済み", "未登録在庫あり", "入庫待ち", "入庫済み"];
    for (const w of want) expect.soft(opts.includes(w), `買取状況の選択肢に「${w}」がある`).toBe(true);
  });
  note("別添資料「ネット買取管理ステータス」はリポジトリに無いので、設計書の写し（L0059〜L0063）に挙がる状況と、事前準備の参照値（買取状況8件・追加の4件）に挙がる状況が選択肢にあることを確かめた");
});

caseTest("IT-M07-03-004", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-004〕");
  let d: Awaited<ReturnType<M0703EditPage["日付群"]>> = [];
  await ctx.step(2, async () => { d = await e.日付群(); });
  await ctx.expected(async () => {
    const pending = d.find((x) => x.見出し === "査定中断日");
    expect.soft(pending?.表示 === true && (pending?.値 ?? "") !== "", "履歴がある査定中断日が値つきで表示される").toBe(true);
    const resume = d.filter((x) => x.見出し === "査定再開日" && x.表示);
    expect.soft(resume.map((x) => `${x.見出し}：${x.値 || "（値なし）"}`), "履歴がない査定再開日の表示（表示されない）").toEqual([]);
  });
});

caseTest("IT-M07-03-006", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-006〕");
  let 開いた = false, 閉じた = true;
  await ctx.step(2, async () => { await e.履歴の開閉アイコンを押す(); 開いた = await e.履歴が見えるか(); });
  await ctx.step(3, async () => { await e.履歴の開閉アイコンを押す(); 閉じた = await e.履歴が見えるか(); });
  await ctx.expected(async () => {
    expect.soft(開いた, "1回目の開閉アイコンでステータス変更履歴一覧が表示される").toBe(true);
    expect.soft(閉じた, "2回目の開閉アイコンでステータス変更履歴一覧が非表示になる").toBe(false);
  });
});

caseTest("IT-M07-03-007", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-007〕");
  let r!: Awaited<ReturnType<M0703EditPage["棚戻し済み"]>>;
  await ctx.step(2, async () => { r = await e.棚戻し済み(); });
  await ctx.expected(async () => {
    expect.soft(r.選ばれた, "棚戻し済みで選ばれている状態（未処理＝未）").toBe("未");
    expect.soft(r.無効.length > 0 && r.無効.every(Boolean), "棚戻し済みのラジオボタンがすべて非活性").toBe(true);
  });
});

caseTest("IT-M07-03-008", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-008〕");
  let url = "";
  await ctx.step(2, async () => { const p = await e.依頼者情報の詳細を押す(); url = new URL(p.url()).pathname; await p.close(); });
  await ctx.expected(async () => {
    expect(url, "開いた画面（会員詳細＝会員登録編集）").toMatch(new RegExp(`/customer/${ctx.notes.get("〔会員番号-M0703-008〕")}/edit$`));
  });
  note("「詳細」は会員登録編集を別のタブで開く。開いたタブの URL で確かめた");
});

caseTest("IT-M07-03-009", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-009〕");
  await ctx.step(2, async () => { await e.ネット買取一覧を押す(); });
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "遷移先（買取一覧の検索結果）").toMatch(/\/purchase\/page\/\d+$/);
    await expect.soft(ctx.page.locator("form#search_form"), "買取検索一覧の画面").toBeVisible();
  });
});

caseTest("IT-M07-03-010", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-010〕");
  let msgs: string[] = [];
  await ctx.step(2, async () => { msgs = await e.手動メール通知を押す(); });
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "遷移先（買取番号を引き継いだ手動メール通知）").toMatch(new RegExp(`/purchase/${Number(番号)}/mail$`));
    await expect.soft(ctx.page.locator("#template-change"), "手動メール通知（入力画面）のテンプレートの欄").toBeVisible();
  });
  if (msgs.length) note(`手動メール通知を押すと確認のアラートが出た（OK で答えた）: ${msgs.join(" / ")}`);
});

caseTest("IT-M07-03-011", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-011〕");
  let status = 0;
  await ctx.step(2, async () => { status = await e.URLで開く("999999"); });
  await ctx.expected(async () => { expect(status, "買取ID 999999 の買取情報編集の HTTP ステータス").toBe(404); });
});

caseTest("IT-M07-03-014", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-014〕");
  const 可否: Record<string, boolean> = {};
  let 査定 = "", 依頼者 = "";
  await ctx.step(2, async () => {
    const code = 品("M0703-014-FB");
    const items: [string, import("@playwright/test").Locator][] = [
      ["送料", e.送料の欄()], ["管理者用メモ", e.メモの欄()],
      ["選んで買取の査定価格", e.明細の入力欄(code, "査定価格")], ["選んで買取の数量", e.明細の入力欄(code, "数量")], ["選んで買取の売却", e.明細の入力欄(code, "売却")],
      ["都道府県", e.f("Pref")], ["住所3", e.f("addr03")], ["電話番号", e.f("telNo")], ["身分証明書", e.f("Identification")], ["口座番号", e.口座("accountNo")],
    ];
    for (const [k, l] of items) 可否[k] = (await 編集の可否を読む(l)).編集できる;
    査定 = await e.査定編集ボタンの文();
    依頼者 = await e.依頼者情報の編集ボタンの文();
  });
  await ctx.expected(async () => {
    for (const [k, v] of Object.entries(可否)) expect.soft(v, `初期表示の「${k}」が非活性（編集できない）`).toBe(false);
    expect.soft(査定, "査定側のボタンの表示").toBe("査定編集");
    expect.soft(依頼者, "依頼者情報側のボタンの表示").toBe("編集");
  });
});

// ---- 査定・保存（DB確認） ----

caseTest("IT-M07-03-016", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-016〕");
  let v!: ReturnType<typeof 買取の値を読む>;
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => { await e.送料とメモを入れる({ 送料: "500", メモ: "査定確認中" }); });
  await ctx.step(4, async () => { await e.査定確定する(); });
  await ctx.step(5, async () => { v = 買取の値を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(v.送料, "DBの送料（保存前の300のまま）").toBe("300");
    expect.soft(v.メモ, "DBの管理者用メモ（保存前の「編集前メモ」のまま）").toBe("編集前メモ");
  });
});

async function 商品を追加する(e: M0703EditPage, コード: string): Promise<void> {
  await e.商品を検索する(コード);
  await e.結果の商品を決定する(コード);
}

caseTest("IT-M07-03-019", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-019〕");
  const code = 品("ADD-SUP-001");
  await ctx.step(2, async () => { await e.商品追加を押す(); });
  await ctx.step(3, async () => { await 商品を追加する(e, code); });
  await ctx.expected(async () => {
    const rows = await e.選んで買取の明細();
    expect(rows.filter((r) => r.商品コード === code || r.商品名 === code).length, "選んで買取の明細に追加された ADD-SUP-001 の行の数").toBe(1);
  });
});

caseTest("IT-M07-03-020", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-020〕");
  const code = 品("ADD-SUP-001");
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  await ctx.step(2, async () => { await e.商品追加を押す(); });
  await ctx.step(3, async () => { await 商品を追加する(e, code); });
  await ctx.step(4, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => {
    expect(rows.filter((r) => r.商品コード === code).length, "DBの選んで買取の ADD-SUP-001 の明細の数（追加されていない）").toBe(0);
  });
});

caseTest("IT-M07-03-021", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-021〕");
  const code = 品("ADD-SUP-001");
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  let r!: Awaited<ReturnType<M0703EditPage["保存を押す"]>>;
  await ctx.step(2, async () => { await e.商品追加を押す(); });
  await ctx.step(3, async () => { await 商品を追加する(e, code); });
  await ctx.step(4, async () => { r = await e.保存を押す(); });
  await ctx.step(5, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => {
    expect(rows.filter((x) => x.商品コード === code).length, "DBの選んで買取の ADD-SUP-001 の明細の数").toBe(1);
  });
  note(`保存の結果のメッセージ: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
});

caseTest("IT-M07-03-024", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-024〕");
  let v!: ReturnType<typeof 買取の値を読む>;
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  let r!: Awaited<ReturnType<M0703EditPage["保存を押す"]>>;
  await ctx.step(2, async () => { await e.買取状況を選ぶ("商品到着"); await e.振込状況を設定する({ 振込依頼可能: true, 振込失敗: true }); });
  await ctx.step(3, async () => {
    await e.査定編集を始める();
    await e.送料とメモを入れる({ 送料: "500", メモ: "通常保存メモ" });
    const n = await e.売却をすべて選ぶ("する");
    note(`売却を「する」にした明細: 選んで買取 ${n} 行（まとめて買取・個別入力商品は無い。シードの報告を参照）`);
    await e.査定確定する();
  });
  await ctx.step(4, async () => { await e.依頼者情報の編集を押す(); await e.f("addr03").fill("神田1-2-3"); await e.依頼者情報の編集を押す(); });
  await ctx.step(5, async () => { r = await e.保存を押す(); });
  await ctx.step(6, async () => { v = 買取の値を読む(番号); rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => {
    expect.soft(v.買取状況, "DBの買取状況").toBe("商品到着");
    expect.soft(v.振込依頼可能, "DBの振込依頼可能").toBe(true);
    expect.soft(v.振込失敗, "DBの振込失敗").toBe(true);
    expect.soft(v.送料, "DBの送料").toBe("500");
    expect.soft(v.メモ, "DBの管理者用メモ").toBe("通常保存メモ");
    expect.soft(rows.length > 0 && rows.every((x) => x.売却 === "する"), `DBの選んで買取の売却（すべて「売却する」）: ${rows.map((x) => x.売却).join("・")}`).toBe(true);
    expect.soft(v.住所3, "DBの住所3").toBe("神田1-2-3");
  });
  note(`保存の結果のメッセージ: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
});

caseTest("IT-M07-03-025", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-025〕");
  let n = -1;
  await ctx.step(2, async () => { await e.買取状況を選ぶ("振込失敗"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { n = 履歴の件数(番号, "振込失敗"); });
  await ctx.expected(async () => { expect(n, "DBの振込失敗のステータス変更履歴の件数").toBe(1); });
});

caseTest("IT-M07-03-026", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-026〕");
  await ctx.step(2, async () => { await e.振込状況を設定する({ 振込依頼可能: true }); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.expected(async () => { expect(pathOf(ctx.page), "保存後の画面（買取情報編集）").toMatch(編集のパス(番号)); });
});

caseTest("IT-M07-03-029", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-029〕");
  let v!: ReturnType<typeof 買取の値を読む>;
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => {
    await e.依頼者の選択欄を選ぶ("Pref", "");
    await e.f("addr03").fill("");
    await e.f("telNo").fill("");
    await e.依頼者の選択欄を選ぶ("Identification", "");
    const r = await e.事業者状況を選ぶ("非事業者");
    if (!r.押せた) note(`事業者状況のラジオが非活性で「非事業者」を押せなかった（選ばれているもの: ${r.選ばれた || "なし"}）`);
  });
  await ctx.step(4, async () => {
    const m = 買取の会員.get("S-M07-03-CASE-029");
    await e.f("lastName").fill("晴屋"); await e.f("firstName").fill("買取029");
    await e.f("lastNameKana").fill("ハレヤ"); await e.f("firstNameKana").fill("カイトリ");
    await e.f("zipcode").fill("1010001"); await e.f("addr01").fill("千代田区"); await e.f("addr02").fill("神田");
    if (m) await e.f("email").fill(m.メール);
    note("他の必須項目（氏名・氏名カナ・郵便番号・住所1・住所2・E-mail）に、シード値（E-mail は実行の印つき）を入れ直した");
  });
  await ctx.step(5, async () => { await e.依頼者情報の編集を押す(); const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(6, async () => { v = 買取の値を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(v.都道府県, "DBの都道府県（空）").toBe("");
    expect.soft(v.住所3, "DBの住所3（空）").toBe("");
    expect.soft(v.電話番号, "DBの電話番号（空）").toBe("");
    expect.soft(v.身分証明書, "DBの身分証明書（空）").toBe("");
    expect.soft(v.事業者, "DBの事業者区分（非事業者）").toBe(false);
  });
});

caseTest("IT-M07-03-031", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-031〕");
  let v!: ReturnType<typeof 買取の値を読む>;
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => {
    await e.f("telNo").fill("09012345678");
    await e.口座("accountNo").fill("1234567");
    const r = await e.事業者状況を選ぶ("事業者");
    if (!r.押せた) note(`事業者状況のラジオが非活性で「事業者」を押せなかった（選ばれているもの: ${r.選ばれた || "なし"}）`);
    await e.事業者番号の欄().fill("T1234567890123").catch((err) => note(`事業者番号の欄に入力できなかった: ${(err as Error).message.split("\n")[0]}`));
  });
  await ctx.step(4, async () => { await e.依頼者情報の編集を押す(); const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(5, async () => { v = 買取の値を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(v.電話番号, "DBの電話番号（11文字）").toBe("09012345678");
    expect.soft(v.口座番号.replace(/^0+/, "").padStart(7, "0"), "DBの口座番号（7文字）").toBe("1234567");
    expect.soft(v.事業者番号, "DBの事業者番号（14文字）").toBe("T1234567890123");
  });
});

caseTest("IT-M07-03-033", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-033〕");
  let v!: ReturnType<typeof 買取の値を読む>;
  let 口座種別の値 = "";
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => {
    await e.依頼者の選択欄を選ぶ("Pref", "東京都");
    await e.依頼者の選択欄を選ぶ("Job", "会社員");
    await e.依頼者の選択欄を選ぶ("Identification", "自動車運転免許証");
    await e.口座("accountTypeId").selectOption({ label: "普通" });
    口座種別の値 = await e.口座("accountTypeId").inputValue();
  });
  await ctx.step(4, async () => { await e.依頼者情報の編集を押す(); const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(5, async () => { v = 買取の値を読む(番号); });
  await ctx.expected(async () => {
    expect.soft(v.都道府県, "DBの都道府県").toBe("東京都");
    expect.soft(v.職業, "DBの職業").toBe("会社員");
    expect.soft(v.身分証明書, "DBの身分証明書").toBe("自動車運転免許証");
    expect.soft(v.口座種別, "DBの口座種別（「普通」の選択肢の値）").toBe(口座種別の値);
  });
});

caseTest("IT-M07-03-034", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-034〕");
  const 保存後: string[] = [];
  const 入れて保存 = async (年: string, 月: string, 日: string) => {
    await e.依頼者情報の編集を押す();
    try { await e.生年月日を選ぶ(年, 月, 日); } catch (err) { note(`生年月日 ${年}/${月}/${日} を選べなかった: ${(err as Error).message.split("\n")[0]}`); }
    await e.依頼者情報の編集を押す();
    const r = await e.保存を押す();
    note(`${年}/${月}/${日} の保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
    保存後.push(買取の値を読む(番号).生年月日);
    await e.読み込みを待つ();
  };
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => { await 入れて保存("1905", "1", "1"); });
  await ctx.step(4, async () => { await 入れて保存("2026", "12", "31"); });
  await ctx.step(5, async () => { note(`各保存の直後にDBの生年月日を読んだ: ${保存後.join(" / ")}`); });
  await ctx.expected(async () => {
    expect.soft(保存後[0] ?? "", "1回目の保存後のDBの生年月日").toBe("1905-01-01");
    expect.soft(保存後[1] ?? "", "2回目の保存後のDBの生年月日").toBe("2026-12-31");
  });
  note("手順2の「編集」は手順3で押すので、手順2では「編集」を押して開いたことを確かめてから一度閉じた。手順5のDB確認は、各保存の直後（手順3・4の中）に読んだ値を並べた");
});

async function 事業者を保存(ctx: CaseCtx, label: string, 表示: "事業者" | "非事業者", 番号の値?: string): Promise<ReturnType<typeof 買取の値を読む>> {
  const { 番号, e } = await 始める(ctx, label);
  let v!: ReturnType<typeof 買取の値を読む>;
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => {
    const r = await e.事業者状況を選ぶ(表示);
    if (!r.押せた) note(`事業者状況のラジオが非活性で「${表示}」を押せなかった（選ばれているもの: ${r.選ばれた || "なし"}）`);
    if (番号の値 !== undefined) await e.事業者番号の欄().fill(番号の値).catch((err) => note(`事業者番号の欄に入力できなかった: ${(err as Error).message.split("\n")[0]}`));
  });
  await ctx.step(4, async () => { await e.依頼者情報の編集を押す(); const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(5, async () => { v = 買取の値を読む(番号); });
  return v;
}

caseTest("IT-M07-03-036", async (ctx) => {
  const v = await 事業者を保存(ctx, "〔買取番号-M0703-036〕", "事業者", "T1234567890123");
  await ctx.expected(async () => {
    expect.soft(v.事業者, "DBの事業者情報（事業者）").toBe(true);
    expect.soft(v.事業者番号, "DBの事業者番号").toBe("T1234567890123");
  });
});

caseTest("IT-M07-03-039", async (ctx) => {
  const v = await 事業者を保存(ctx, "〔買取番号-M0703-039〕", "非事業者");
  await ctx.expected(async () => {
    expect.soft(v.事業者, "DBの事業者区分（非事業者）").toBe(false);
    expect.soft(v.事業者番号, "DBの適格請求書発行事業者の登録番号（空）").toBe("");
  });
});

async function トークンを変えて保存(ctx: CaseCtx, label: string, how: "消す" | "書き換える"): Promise<ReturnType<typeof 買取の値を読む>> {
  const { 番号, e } = await 始める(ctx, label);
  let v!: ReturnType<typeof 買取の値を読む>;
  await ctx.step(2, async () => { await e.振込状況を設定する({ 振込依頼可能: true }); });
  await ctx.step(3, async () => {
    const n = how === "消す" ? await e.トークンを消す() : await e.トークンを書き換える("invalid-token");
    note(`保存のフォームのなりすまし対策トークンの入力要素 ${n} 個を${how === "消す" ? "消した" : "「invalid-token」に書き換えた"}（開発者ツールの操作を、画面のスクリプトで行った）`);
  });
  await ctx.step(4, async () => { const r = await e.保存を押す(); note(`保存の結果: 応答 ${r.応答} 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(5, async () => { v = 買取の値を読む(番号); });
  return v;
}
caseTest("IT-M07-03-041", async (ctx) => {
  const v = await トークンを変えて保存(ctx, "〔買取番号-M0703-041〕", "消す");
  await ctx.expected(async () => { expect(v.振込依頼可能, "DBの振込依頼可能（保存前のオフのまま）").toBe(false); });
});
caseTest("IT-M07-03-042", async (ctx) => {
  const v = await トークンを変えて保存(ctx, "〔買取番号-M0703-042〕", "書き換える");
  await ctx.expected(async () => { expect(v.振込依頼可能, "DBの振込依頼可能（保存前のオフのまま）").toBe(false); });
});

/** 買取状況を変えて保存し、手順4でDBを読む（手順: 開く → 状況を選ぶ → 保存 → DB） */
async function 状況を変えて保存<T>(ctx: CaseCtx, label: string, 状況: string, 読む: (番号: string) => T): Promise<{ 番号: string; 値: T }> {
  const { 番号, e } = await 始める(ctx, label);
  let 値!: T;
  await ctx.step(2, async () => { await e.買取状況を選ぶ(状況); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { 値 = 読む(番号); });
  return { 番号, 値 };
}
const 状況を読む = (番号: string) => 買取の値を読む(番号).買取状況;

caseTest("IT-M07-03-043", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-043〕", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（査定内容承諾のまま）").toBe("査定内容承諾"); });
});
caseTest("IT-M07-03-044", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-044〕", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（査定内容承諾のまま）").toBe("査定内容承諾"); });
});
caseTest("IT-M07-03-045", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-045〕", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("振込依頼済み"); });
  note("買取情報編集の査定金額合計の欄は、画面のスクリプトが1の位を切り上げて入れる（査定価格9999・数量1のとき 10000）。シード表の手順のまま作った");
});

caseTest("IT-M07-03-051", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-051〕", "入庫済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("入庫済み"); });
});
caseTest("IT-M07-03-052", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-052〕");
  let s: ReturnType<typeof 本店の在庫> = null;
  await ctx.step(2, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { s = 本店の在庫(品("SKU-STK-001-052")); });
  await ctx.expected(async () => { expect(s?.在庫 ?? null, `DBの本店のEC-CUBE在庫（入庫前10＋実在庫2。買取番号 ${番号}）`).toBe(12); });
});
caseTest("IT-M07-03-053", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-053〕");
  let s: ReturnType<typeof 本店の在庫> = null;
  let h: ReturnType<typeof 本店の在庫履歴> = [];
  await ctx.step(2, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { s = 本店の在庫(品("SKU-STK-001-053")); h = 本店の在庫履歴(品("SKU-STK-001-053")); });
  await ctx.expected(async () => {
    expect.soft(s?.在庫 ?? null, "DBの総在庫（10＋2）").toBe(12);
    expect.soft(s?.総原価 ?? null, "DBの総原価（10000＋買取小計1000）").toBe(11000);
    const last = h[h.length - 1];
    expect.soft(Number(last?.変更後原価単価 ?? "NaN").toFixed(2), "DBの入庫後の原価単価（総原価11000÷総在庫12）").toBe((11000 / 12).toFixed(2));
  });
  note("原価単価は在庫の表に列が無いので、入庫で作られた在庫履歴の変更後原価単価で確かめた");
});
caseTest("IT-M07-03-055", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-055〕");
  let who = "";
  await ctx.step(2, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { who = 買取の値を読む(番号).最終更新者; });
  await ctx.expected(async () => { expect(who, "DBの最終更新者（ログインID）").toBe(M0703B_ADMIN.loginId); });
});
caseTest("IT-M07-03-056", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-056〕", "振込完了", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況（入庫済みのまま）").toBe("入庫済み"); });
});

caseTest("IT-M07-03-058", async (ctx) => {
  await loginAdmin(ctx.page, M0703B_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-058〕");
  const l = new BuyListPage(ctx.page);
  let r!: Awaited<ReturnType<M0703EditPage["棚戻し済み"]>>;
  await ctx.step(1, async () => { await l.open(); });
  await ctx.step(2, async () => { await l.買取番号を入れる(String(Number(番号))); await l.検索する(); });
  await ctx.step(3, async () => { await l.対象にする(番号); });
  await ctx.step(4, async () => {
    const d = await l.ダウンロードを押す("戻しリストCSV");
    note(`戻しリストCSV: ファイル ${d.file ? (d.file.suggestedFilename()) : "なし"}・応答 ${d.応答}・アラート「${d.ダイアログ.join(" / ")}」`);
  });
  await ctx.step(5, async () => { const e = await 一覧から編集を開く(ctx.page, 番号); r = await e.棚戻し済み(); });
  await ctx.expected(async () => {
    expect.soft(r.選ばれた, "棚戻し済みで選ばれている状態（済）").toBe("済");
    expect.soft(r.無効.length > 0 && r.無効.every(Boolean), "棚戻し済みのラジオボタンがすべて非活性").toBe(true);
  });
});

caseTest("IT-M07-03-061", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-061〕");
  let 文: string[] = [];
  await ctx.step(2, async () => {
    ctx.page.once("dialog", (d) => { 文.push(d.message()); void d.accept(); });
    await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), ctx.page.locator("#sell_btn").click({ timeout: 30_000 })]);
  });
  await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note(`送信前確認の文「${文.join(" / ")}」に「OK」で答えた（ダイアログは押した直後に出るので、手順2の中で応答を決めた）`); });
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "処理後の画面（買取情報編集）").toMatch(編集のパス(番号));
    expect.soft(文.length, "送信前確認のダイアログが出た").toBe(1);
  });
});

// ---- 商品追加の検索のエラー ----

caseTest("IT-M07-03-071", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-071〕");
  const alerts: string[] = [];
  ctx.page.on("dialog", (d) => { alerts.push(d.message()); void d.accept(); });
  try {
    await ctx.step(2, async () => { await e.商品追加を押す(); });
    await ctx.step(3, async () => { await ctx.page.context().setOffline(true); });
    await ctx.step(4, async () => { await e.商品を検索する(品("ADD-SUP-001"), false); });
    await ctx.page.context().setOffline(false);
    await ctx.expected(async () => {
      expect.soft(pathOf(ctx.page), "検索のエラー後の画面（買取情報編集のまま）").toMatch(編集のパス(番号));
      await expect.soft(ctx.page.locator("#purchase_detail_form"), "買取情報編集の画面が表示されたまま").toBeVisible();
    });
    note(`検索のエラーで出たアラート: ${alerts.join(" / ") || "なし"}`);
  } finally { await ctx.page.context().setOffline(false); }
});

caseTest("IT-M07-03-072", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-072〕");
  const alerts: string[] = [];
  ctx.page.on("dialog", (d) => { alerts.push(d.message()); void d.accept(); });
  try {
    await ctx.step(2, async () => { await e.商品追加を押す(); });
    await ctx.step(3, async () => { await e.商品を検索する("PAGE-SUP"); });
    await ctx.step(4, async () => { await ctx.page.context().setOffline(true); });
    await ctx.step(5, async () => { await e.結果のページを押す(2); });
    await ctx.page.context().setOffline(false);
    await ctx.expected(async () => {
      expect.soft(pathOf(ctx.page), "ページ切替のエラー後の画面（買取情報編集のまま）").toMatch(編集のパス(番号));
      await expect.soft(ctx.page.locator("#purchase_detail_form"), "買取情報編集の画面が表示されたまま").toBeVisible();
    });
    note(`ページ切替のエラーで出たアラート: ${alerts.join(" / ") || "なし"}`);
  } finally { await ctx.page.context().setOffline(false); }
});

// ---- 実在庫の増減 ----

async function 増減して保存(ctx: CaseCtx, label: string, コード: string): Promise<string> {
  const { 番号, e } = await 始める(ctx, label);
  await ctx.step(2, async () => { await e.実在庫の編集ボタンを押す(); await e.増減数を入れる(品(コード), "1"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  note("増減数の欄は実在庫情報の「編集」で出るので、手順2で「編集」を押してから入れた");
  return 番号;
}

caseTest("IT-M07-03-074", async (ctx) => {
  const 番号 = await 増減して保存(ctx, "〔買取番号-M0703-074〕", "STOCK-EDIT-001-074");
  let s: ReturnType<typeof 実在庫を読む> = [];
  await ctx.step(4, async () => { s = 実在庫を読む(番号); });
  await ctx.expected(async () => { expect(s.find((x) => x.商品コード === 品("STOCK-EDIT-001-074"))?.数量 ?? null, "DBの STOCK-EDIT-001-074 の実在庫の数量（2から3）").toBe(3); });
});
caseTest("IT-M07-03-075", async (ctx) => {
  const 番号 = await 増減して保存(ctx, "〔買取番号-M0703-075〕", "STOCK-EDIT-001-075");
  let h: ReturnType<typeof 実在庫履歴を読む> = [];
  await ctx.step(4, async () => { h = 実在庫履歴を読む(番号); });
  await ctx.expected(async () => {
    const hit = h.filter((x) => x.商品コード === 品("STOCK-EDIT-001-075") && x.変更前 === 2 && x.変更後 === 3);
    expect(hit.length, "DBの STOCK-EDIT-001-075 の、増減数1（2→3）の実在庫の変更履歴の数").toBe(1);
  });
});
caseTest("IT-M07-03-076", async (ctx) => {
  const 番号 = await 増減して保存(ctx, "〔買取番号-M0703-076〕", "STOCK-EDIT-001-076");
  let total = "", sum = -1;
  await ctx.step(4, async () => { total = 買取の値を読む(番号).査定金額合計; sum = 実在庫を読む(番号).reduce((a, x) => a + x.小計, 0); });
  await ctx.expected(async () => { expect(String(sum), `DBの全実在庫明細の買取小計の合計（買取合計金額 ${total} と一致）`).toBe(total); });
});

caseTest("IT-M07-03-077", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-077〕");
  let h: ReturnType<typeof 本店の在庫履歴> = [];
  await ctx.step(2, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { h = 本店の在庫履歴(品("M0703-077-SKU")); });
  await ctx.expected(async () => {
    const reason = `ネット買取による入庫 買取番号：${番号}`;
    const hit = h.filter((x) => x.理由 === reason);
    expect.soft(hit.length, `DBの在庫履歴で理由が「${reason}」の行の数`).toBe(1);
    expect.soft(hit.map((x) => `${x.在庫変動区分}／${x.登録元}`).join("、"), "その行の在庫変動区分／登録元（ネット買取）").toMatch(/ネット買取/);
  });
});

// ---- 査定内容承諾での実在庫の作成 ----

caseTest("IT-M07-03-081", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-081〕", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    expect(r.値.map((x) => `${x.商品コード}:${x.数量}`), "DBの実在庫情報（M0703-081-SUP の数量2 の1件）").toEqual([`${品("M0703-081-SUP")}:2`]);
  });
});
caseTest("IT-M07-03-083", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-083〕", "査定内容承諾", 実在庫履歴を読む);
  await ctx.expected(async () => {
    expect(r.値.filter((x) => x.商品コード === 品("M0703-083-SUP")).length, "DBの M0703-083-SUP の実在庫に対応する実在庫履歴の数").toBe(1);
  });
});
caseTest("IT-M07-03-084", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-084〕", "査定内容承諾", (n) => ({ 状況: 状況を読む(n), 連絡: 履歴の件数(n, "査定内容連絡済み") }));
  await ctx.expected(async () => {
    expect.soft(r.値.状況, "DBの買取状況").toBe("査定内容承諾");
    expect.soft(r.値.連絡, "DBの査定内容連絡済みのステータス変更履歴の件数").toBe(0);
  });
});

// ---- 選んで買取の査定 ----

async function 明細を変えて保存(ctx: CaseCtx, label: string, コード: string, v: { 査定価格?: string; 数量?: string; 売却?: string }): Promise<string> {
  const { 番号, e } = await 始める(ctx, label);
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => { await e.明細を名前で入れる(品(コード), v); });
  await ctx.step(4, async () => { await e.査定確定する(); const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  return 番号;
}

caseTest("IT-M07-03-087", async (ctx) => {
  const 番号 = await 明細を変えて保存(ctx, "〔買取番号-M0703-087〕", "M0703-087-SUP", { 査定価格: "1500" });
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  await ctx.step(5, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => { expect(rows.find((x) => x.商品コード === 品("M0703-087-SUP"))?.査定価格 ?? "", "DBの M0703-087-SUP の査定価格（1000から1500）").toBe("1500"); });
});
caseTest("IT-M07-03-088", async (ctx) => {
  const 番号 = await 明細を変えて保存(ctx, "〔買取番号-M0703-088〕", "M0703-088-SUP", { 数量: "3" });
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  await ctx.step(5, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => { expect(rows.find((x) => x.商品コード === 品("M0703-088-SUP"))?.数量 ?? "", "DBの M0703-088-SUP の数量（1から3）").toBe("3"); });
});

/** 実在庫情報（数量2・買取小計1000）が変わらないことを確かめる（091・127・128） */
async function 明細を変えて実在庫を読む(ctx: CaseCtx, label: string, コード: string, v: { 査定価格?: string; 数量?: string; 売却?: string }): Promise<ReturnType<typeof 実在庫を読む>> {
  const 番号 = await 明細を変えて保存(ctx, label, コード, v);
  let s: ReturnType<typeof 実在庫を読む> = [];
  await ctx.step(5, async () => { s = 実在庫を読む(番号); });
  note("買取単価は実在庫情報に列が無いので、買取小計÷数量で確かめた");
  return s.filter((x) => x.商品コード === 品(コード));
}
/** 実在庫情報（数量2・買取単価500・買取小計1000）が保存前から変わらないこと（091・127・128） */
function 実在庫の見比べ(hit: ReturnType<typeof 実在庫を読む>, コード: string): [string, number | null, number][] {
  return [
    [`DBの ${コード} の商品規格に紐づく実在庫情報の数`, hit.length, 1],
    ["実在庫情報の数量（2のまま）", hit[0]?.数量 ?? null, 2],
    ["実在庫情報の買取単価（500のまま）", hit[0] ? hit[0].小計 / hit[0].数量 : null, 500],
    ["実在庫情報の買取小計（1000のまま）", hit[0]?.小計 ?? null, 1000],
  ];
}
caseTest("IT-M07-03-091", async (ctx) => {
  const hit = await 明細を変えて実在庫を読む(ctx, "〔買取番号-M0703-091〕", "M0703-091-SUP", { 査定価格: "1200", 数量: "2" });
  await ctx.expected(async () => { for (const [m, a, w] of 実在庫の見比べ(hit, "M0703-091-SUP")) expect.soft(a, m).toBe(w); });
});
caseTest("IT-M07-03-127", async (ctx) => {
  const hit = await 明細を変えて実在庫を読む(ctx, "〔買取番号-M0703-127〕", "M0703-127-SUP", { 数量: "3" });
  await ctx.expected(async () => { for (const [m, a, w] of 実在庫の見比べ(hit, "M0703-127-SUP")) expect.soft(a, m).toBe(w); });
});
caseTest("IT-M07-03-128", async (ctx) => {
  const hit = await 明細を変えて実在庫を読む(ctx, "〔買取番号-M0703-128〕", "M0703-128-SUP", { 売却: "しない" });
  await ctx.expected(async () => { for (const [m, a, w] of 実在庫の見比べ(hit, "M0703-128-SUP")) expect.soft(a, m).toBe(w); });
});

caseTest("IT-M07-03-090", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-090〕");
  let r!: Awaited<ReturnType<M0703EditPage["基本情報の事業者を押す"]>>;
  await ctx.step(2, async () => { r = await e.基本情報の事業者を押す("非事業者"); });
  await ctx.expected(async () => {
    expect.soft(r.選ばれた, "適格請求書発行事業者情報で選ばれている状態（事業者のまま）").toBe("事業者");
    expect.soft(r.無効, "適格請求書発行事業者情報のラジオボタンが非活性").toBe(true);
  });
});

caseTest("IT-M07-03-092", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-092〕");
  let url = "";
  await ctx.step(2, async () => { const p = await e.会員詳細を押す(); url = new URL(p.url()).pathname; await p.close(); });
  await ctx.expected(async () => {
    expect(url, "開いた画面（会員詳細＝会員登録編集）").toMatch(new RegExp(`/customer/${ctx.notes.get("〔会員番号-M0703-092〕")}/edit$`));
  });
  note("「会員詳細」は会員登録編集を別のタブで開く。開いたタブの URL で確かめた");
});

caseTest("IT-M07-03-093", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-093〕");
  let 送料!: Awaited<ReturnType<typeof 編集の可否を読む>>, メモ!: Awaited<ReturnType<typeof 編集の可否を読む>>;
  let 文 = "";
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => { await e.送料とメモを入れる({ 送料: "500" }); });
  await ctx.step(4, async () => { await e.査定確定する(); });
  await ctx.step(5, async () => { 送料 = await 編集の可否を読む(e.送料の欄()); メモ = await 編集の可否を読む(e.メモの欄()); 文 = await e.査定編集ボタンの文(); });
  await ctx.expected(async () => {
    expect.soft(文, "ボタンの表示").toBe("査定編集");
    expect.soft(送料.編集できる, "送料の入力欄が非活性").toBe(false);
    expect.soft(メモ.編集できる, "管理者用メモの入力欄が非活性").toBe(false);
  });
});

caseTest("IT-M07-03-094", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-094〕");
  const 可否: Record<string, boolean> = {};
  let 文 = "";
  await ctx.step(2, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(3, async () => { await e.f("addr03").fill("M0703-094-住所2"); });
  await ctx.step(4, async () => { await e.依頼者情報の編集を押す(); });
  await ctx.step(5, async () => {
    文 = await e.依頼者情報の編集ボタンの文();
    const items: [string, Locator][] = [
      ["氏名（姓）", e.f("lastName")], ["都道府県", e.f("Pref")], ["住所3", e.f("addr03")], ["電話番号", e.f("telNo")], ["職業", e.f("Job")], ["身分証明書", e.f("Identification")],
      ["銀行名", e.口座("bankCode")], ["口座番号", e.口座("accountNo")], ["口座種別", e.口座("accountTypeId")], ["口座名義", e.口座("accountHolder")],
      ["事業者状況", e.事業者状況のラジオ().first()], ["事業者番号", e.事業者番号の欄()],
    ];
    for (const [k, l] of items) 可否[k] = (await 編集の可否を読む(l)).編集できる;
  });
  await ctx.expected(async () => {
    expect.soft(文, "ボタンの表示").toBe("編集");
    for (const [k, v] of Object.entries(可否)) expect.soft(v, `「${k}」の入力欄が非活性`).toBe(false);
  });
});

// ---- 選んで買取の削除 ----

caseTest("IT-M07-03-095", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-095〕");
  let rows: Awaited<ReturnType<M0703EditPage["選んで買取の明細"]>> = [];
  await ctx.step(2, async () => { rows = await e.選んで買取の明細(); });
  await ctx.expected(async () => {
    const f = (c: string) => rows.find((x) => x.商品名 === 品(c) || x.商品コード === 品(c));
    expect.soft(f("M0703-095-SUP")?.削除リンク ?? null, "サプライ品 M0703-095-SUP の行の「削除」リンク（表示される）").toBe(true);
    expect.soft(f("M0703-095-CARD")?.削除リンク ?? null, "カード M0703-095-CARD の行の「削除」リンク（表示されない）").toBe(false);
  });
});

async function 明細を削除(ctx: CaseCtx, label: string, コード: string, 答え: "OK" | "キャンセル"): Promise<string> {
  const { 番号, e } = await 始める(ctx, label);
  const 文: string[] = [];
  await ctx.step(2, async () => {
    ctx.page.once("dialog", (d) => { 文.push(d.message()); void (答え === "OK" ? d.accept() : d.dismiss()); });
    const link = e.選んで買取の行(品(コード)).locator('td[id^="purchase_list_main__delete--"] a');
    await expect(link, `${コード} の「削除」リンク`).toBeVisible();
    if (答え === "OK") await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), link.click()]);
    else { await link.click(); await ctx.page.waitForTimeout(1_000); }
  });
  await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note(`削除の確認ダイアログ「${文.join(" / ")}」に「${答え}」で答えた（ダイアログは押した直後に出るので、手順2の中で応答を決めた）`); });
  return 番号;
}

caseTest("IT-M07-03-096", async (ctx) => {
  const 番号 = await 明細を削除(ctx, "〔買取番号-M0703-096〕", "M0703-096-SUP", "OK");
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  await ctx.step(4, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => {
    expect.soft(rows.some((x) => x.商品コード === 品("M0703-096-SUP")), "DBに M0703-096-SUP の明細がある（削除されている）").toBe(false);
    expect.soft(rows.some((x) => x.商品コード === 品("M0703-096-CARD")), "DBに M0703-096-CARD の明細がある（残る）").toBe(true);
  });
});
caseTest("IT-M07-03-097", async (ctx) => {
  const 番号 = await 明細を削除(ctx, "〔買取番号-M0703-097〕", "M0703-097-SUP", "キャンセル");
  let rows: ReturnType<typeof 選んで買取の明細> = [];
  await ctx.step(4, async () => { rows = 選んで買取の明細(番号); });
  await ctx.expected(async () => { expect(rows.some((x) => x.商品コード === 品("M0703-097-SUP")), "DBに M0703-097-SUP の明細がある（削除されずに残る）").toBe(true); });
});
caseTest("IT-M07-03-098", async (ctx) => {
  const 番号 = await 明細を削除(ctx, "〔買取番号-M0703-098〕", "M0703-098-SUP", "OK");
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page), "遷移先（買取情報編集）").toMatch(編集のパス(番号));
    await expect.soft(ctx.page.locator(".alert-success").filter({ hasText: "削除しました" }), "管理画面上部の「削除しました」").toBeVisible();
  });
});

// ---- 実在庫情報の編集・編集解除 ----

async function 編集解除(ctx: CaseCtx, label: string, コード: string, 答え: "OK" | "キャンセル"): Promise<{ e: M0703EditPage; 文: string[] }> {
  const { e } = await 始める(ctx, label);
  let 文: string[] = [];
  await ctx.step(2, async () => { await e.実在庫の編集ボタンを押す(); });
  await ctx.step(3, async () => { await e.増減数を入れる(品(コード), "1"); });
  await ctx.step(4, async () => { 文 = await e.実在庫の編集ボタンを押す(答え); });
  await ctx.step(5, async () => { note(`確認ダイアログ「${文.join(" / ")}」に「${答え}」で答えた（ダイアログは押した直後に出るので、手順4の中で応答を決めた）`); });
  return { e, 文 };
}

caseTest("IT-M07-03-101", async (ctx) => {
  const { e, 文 } = await 編集解除(ctx, "〔買取番号-M0703-101〕", "M0703-101-STK", "OK");
  await ctx.expected(async () => {
    expect.soft(文.join(" / "), "確認ダイアログの文").toContain("編集した内容は元に戻ります。解除しますか？");
    await expect.soft(e.実在庫の閲覧表(), "実在庫情報の閲覧表示").toBeVisible();
    await expect.soft(e.実在庫の編集欄(), "実在庫情報の編集欄（表示されない）").toBeHidden();
    expect.soft(await e.実在庫の編集ボタンの文(), "ボタンの表示").toBe("編集");
  });
});
caseTest("IT-M07-03-102", async (ctx) => {
  const { e } = await 編集解除(ctx, "〔買取番号-M0703-102〕", "M0703-102-STK", "キャンセル");
  await ctx.expected(async () => {
    expect.soft(await e.実在庫の編集ボタンの文(), "ボタンの表示（編集解除のまま）").toBe("編集解除");
    await expect.soft(e.実在庫の編集欄(), "実在庫情報の編集欄（編集状態のまま）").toBeVisible();
    expect.soft(await e.増減数の欄(品("M0703-102-STK")).inputValue(), "M0703-102-STK の増減数（入力した1が残る）").toBe("1");
  });
});
caseTest("IT-M07-03-124", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-124〕");
  let 値 = "x";
  await ctx.step(2, async () => { await e.実在庫の編集ボタンを押す(); });
  await ctx.step(3, async () => { await e.増減数を入れる(品("M0703-124-STK"), "1"); });
  await ctx.step(4, async () => { await e.実在庫の編集ボタンを押す("OK"); });
  await ctx.step(5, async () => { note("確認ダイアログには、手順4で押した直後に「OK」で答えた"); });
  await ctx.step(6, async () => { await e.実在庫の編集ボタンを押す(); 値 = await e.増減数の欄(品("M0703-124-STK")).inputValue(); });
  await ctx.expected(async () => { expect(値, "再度「編集」を押したときの M0703-124-STK の増減数（空）").toBe(""); });
});

// ---- 買取状況の変更（DB確認） ----

caseTest("IT-M07-03-110", async (ctx) => {
  await loginAdmin(ctx.page, M0703B_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-110〕");
  let e!: M0703EditPage;
  let 後 = "";
  await ctx.step(1, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  await ctx.step(2, async () => {
    const msgs = await e.手動メール通知を押す();
    if (msgs.length) note(`手動メール通知を押すと確認のアラートが出た（OK で答えた）: ${msgs.join(" / ")}`);
    const m = new ManualMailPage(ctx.page);
    const t = await m.テンプレートを選ぶ("査定");
    const r = await m.送信する();
    note(`手動メール通知でテンプレート「${t}」を選んで送信した（宛先は買取依頼者 ${買取の会員.get("S-M07-03-TOCONTACTED-110")?.メール ?? ""}。正本の buyer7095-110@example.test に実行の印を付けた値）: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
  });
  await ctx.step(3, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  await ctx.step(4, async () => { await e.買取状況を選ぶ("査定内容連絡済み"); });
  await ctx.step(5, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(6, async () => { 後 = 状況を読む(番号); });
  await ctx.expected(async () => { expect(後, "DBの買取状況").toBe("査定内容連絡済み"); });
});
caseTest("IT-M07-03-111", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-111〕", "簡易書留送付済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("簡易書留送付済み"); });
});
caseTest("IT-M07-03-112", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-112〕", "キャンセル済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("キャンセル済み"); });
});
caseTest("IT-M07-03-113", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-113〕", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("振込依頼済み"); });
});
caseTest("IT-M07-03-114", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-114〕", "振込依頼済み", 状況を読む);
  await ctx.expected(async () => { expect(r.値, "DBの買取状況").toBe("振込依頼済み"); });
});

caseTest("IT-M07-03-115", async (ctx) => {
  const { e } = await 始める(ctx, "〔買取番号-M0703-115〕");
  const code = 品("M0703-115-SUP");
  let 前 = false;
  const 後: Record<string, boolean> = {};
  let 文 = "";
  await ctx.step(2, async () => { await e.査定編集を始める(); });
  await ctx.step(3, async () => { 前 = (await 編集の可否を読む(e.明細の入力欄(code, "査定価格"))).編集できる; note(`査定編集中の M0703-115-SUP の査定価格の入力欄は${前 ? "編集できた" : "編集できなかった"}`); });
  await ctx.step(4, async () => { await e.査定確定する(); });
  await ctx.step(5, async () => {
    for (const k of ["査定価格", "数量", "売却"] as const) 後[k] = (await 編集の可否を読む(e.明細の入力欄(code, k))).編集できる;
    文 = await e.査定編集ボタンの文();
  });
  await ctx.expected(async () => {
    for (const [k, v] of Object.entries(後)) expect.soft(v, `査定確定後の M0703-115-SUP の${k}の入力欄が編集不可`).toBe(false);
    expect.soft(文, "ボタンの表示").toBe("査定編集");
  });
});

caseTest("IT-M07-03-125", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-125〕", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => {
    expect(r.値.map((x) => `${x.商品コード}:${x.数量}`), "DBの実在庫情報（売却する M0703-125-SUP の数量2 の1件だけ）").toEqual([`${品("M0703-125-SUP")}:2`]);
  });
});
caseTest("IT-M07-03-144", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-144〕", "査定内容承諾", 実在庫を読む);
  await ctx.expected(async () => { expect(r.値.length, "DBのこの買取の実在庫情報の数").toBe(0); });
});
caseTest("IT-M07-03-158", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-158〕", "査定内容承諾", (n) => ({ 在庫: 実在庫を読む(n).length, 履歴: 実在庫履歴を読む(n).length }));
  await ctx.expected(async () => {
    expect.soft(r.値.在庫, "DBのこの買取の実在庫情報の数").toBe(0);
    expect.soft(r.値.履歴, "DBのこの買取の実在庫履歴の数").toBe(0);
  });
});

// ---- 入庫済みへの変更（本店の在庫） ----

caseTest("IT-M07-03-146", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-146〕", "入庫済み", () => ({
    A: 本店の在庫(品("M0703-146-A")), B: 本店の在庫(品("M0703-146-B")),
    hA: 本店の在庫履歴(品("M0703-146-A")), hB: 本店の在庫履歴(品("M0703-146-B")),
  }));
  await ctx.expected(async () => {
    expect.soft(r.値.A?.在庫 ?? null, "DBの M0703-146-A の本店在庫").toBe(12);
    expect.soft(r.値.B?.在庫 ?? null, "DBの M0703-146-B の本店在庫").toBe(13);
    const net = (h: ReturnType<typeof 本店の在庫履歴>) => h.filter((x) => /ネット買取/.test(`${x.在庫変動区分}${x.登録元}`)).length;
    expect.soft(net(r.値.hA), "M0703-146-A の在庫変動区分「ネット買取」の在庫履歴の数").toBe(1);
    expect.soft(net(r.値.hB), "M0703-146-B の在庫変動区分「ネット買取」の在庫履歴の数").toBe(1);
  });
});
caseTest("IT-M07-03-147", async (ctx) => {
  const r = await 状況を変えて保存(ctx, "〔買取番号-M0703-147〕", "入庫済み", () => 本店の在庫(品("M0703-147-SKU")));
  await ctx.expected(async () => {
    expect.soft(r.値?.在庫 ?? null, "DBの M0703-147-SKU の本店の総在庫").toBe(2);
    expect.soft(r.値?.総原価 ?? null, "DBの M0703-147-SKU の本店の総原価").toBe(1000);
  });
});

caseTest("IT-M07-03-149", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-149〕");
  let s: ReturnType<typeof 実在庫を読む> = [];
  let h: ReturnType<typeof 実在庫履歴を読む> = [];
  await ctx.step(2, async () => { await e.実在庫の編集ボタンを押す(); await e.増減数を入れる(品("M0703-149-E1"), "1"); note("増減数の欄は実在庫情報の「編集」で出るので、「編集」を押してから入れた。M0703-149-E2 には入れない"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => { s = 実在庫を読む(番号); h = 実在庫履歴を読む(番号); });
  await ctx.expected(async () => {
    const q = (c: string) => s.find((x) => x.商品コード === 品(c))?.数量 ?? null;
    expect.soft(q("M0703-149-E1"), "DBの M0703-149-E1 の数量（2から3）").toBe(3);
    expect.soft(h.filter((x) => x.商品コード === 品("M0703-149-E1") && x.変更前 === 2 && x.変更後 === 3).length, "M0703-149-E1 の増減数1（2→3）の変更履歴の数").toBe(1);
    expect.soft(q("M0703-149-E2"), "DBの M0703-149-E2 の数量（3のまま）").toBe(3);
    expect.soft(h.filter((x) => x.商品コード === 品("M0703-149-E2") && x.変更前 !== null).length, "M0703-149-E2 の増減数の変更履歴（作られたときの履歴を除く）の数").toBe(0);
  });
});

caseTest("IT-M07-03-154", async (ctx) => {
  const { 番号, e } = await 始める(ctx, "〔買取番号-M0703-154〕");
  let 状況 = "（行が無い）";
  await ctx.step(2, async () => { await e.買取状況を選ぶ("振込依頼済み"); });
  await ctx.step(3, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(4, async () => {
    const l = new BuyListPage(ctx.page);
    await l.open();
    await l.買取番号を入れる(String(Number(番号)));
    await l.検索する();
    状況 = (await l.行()).find((x) => x.番号 === String(Number(番号)))?.買取状況 ?? "（行が無い）";
  });
  await ctx.expected(async () => { expect(状況, "買取検索一覧の買取状況").toBe("振込依頼済み"); });
  note("買取情報編集の査定金額合計の欄は、画面のスクリプトが1の位を切り上げて入れる（査定価格9999・数量1のとき 10000）。シード表の手順のまま作った");
});

// ---- RG: 買取情報編集の変更が、在庫履歴・在庫検索・買取商品履歴・会員登録編集へ反映される ----

async function 在庫履歴を検索(page: Page, h: StockHistoryPage, code: string, shop: string): Promise<void> {
  await h.fillKeyword(code);
  await chooseHistoryShopAndZone(page, { 店舗: shop, 在庫区分: "EC-CUBE" });
  await h.submit();
}
const ネット買取の行 = (rows: Record<string, string>[]) => rows.filter((r) => (r["登録元"] ?? "").includes("ネット買取"));
const 数字 = (s: string | undefined) => (s ?? "").replace(/[^\d.-]/g, "");

caseTest("IT-M07-03-150", async (ctx) => {
  await loginAdmin(ctx.page, M0703RG_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-RG001〕");
  const code = 品("M0703-RG001-SKU");
  const shop = await 本店の店名(ctx.browser);
  const h = new StockHistoryPage(ctx.page);
  let 前: Record<string, string>[] = [], 後: Record<string, string>[] = [];
  let e!: M0703EditPage;
  let 状況 = "";
  await ctx.step(1, async () => { await h.open(); });
  await ctx.step(2, async () => { await h.clearConditions(); });
  await ctx.step(3, async () => { await 在庫履歴を検索(ctx.page, h, code, shop); });
  await ctx.step(4, async () => { 前 = ネット買取の行(await h.rows()); note(`手順4: 登録元が「ネット買取」の行 ${前.length} 行`); });
  await ctx.step(5, async () => { e = await 一覧から編集を開く(ctx.page, 番号); 状況 = (await e.基本情報()).買取状況; note(`手順5: 買取状況は「${状況}」`); });
  await ctx.step(6, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(7, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(8, async () => { await h.open(); await h.clearConditions(); await 在庫履歴を検索(ctx.page, h, code, shop); });
  await ctx.step(9, async () => { 後 = ネット買取の行(await h.rows()); });
  await ctx.expected(async () => {
    expect.soft(後.length, "登録元「ネット買取」の行の数（加わった1行）").toBe(1);
    const r = 後[0] ?? {};
    expect.soft(数字(r["変更前在庫"]), "変更前在庫").toBe("10");
    expect.soft(数字(r["変更後在庫"]), "変更後在庫").toBe("12");
    expect.soft(数字(r["在庫変動数"]), "在庫増減数").toBe("2");
    expect.soft(数字(r["仕入単価"]), "仕入単価").toBe("1100");
    expect.soft(数字(r["変更前総原価"]), "変更前総原価").toBe("8000");
    expect.soft(数字(r["変更後総原価"]), "変更後総原価").toBe("10200");
    expect.soft(Number(数字(r["変更前原価単価"])), "変更前原価単価").toBe(800);
    expect.soft(Number(数字(r["変更後原価単価"])), "変更後原価単価").toBe(850);
    expect.soft(r["在庫変動理由"] ?? "", "在庫変動理由").toContain(`ネット買取による入庫 買取番号：${番号}`);
  });
  note("在庫履歴検索一覧の見出しは「在庫変動数」（正本の在庫増減数）。原価単価は小数の表示を数で比べた");
});

caseTest("IT-M07-03-151", async (ctx) => {
  await loginAdmin(ctx.page, M0703RG_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-RG002〕");
  const code = 品("M0703-RG002-SKU");
  const shop = await 本店の店名(ctx.browser);
  let 前 = { 在庫: "", 原価単価: "", 総原価: "" }, 後 = 前;
  let e!: M0703EditPage;
  await ctx.step(1, async () => { await ctx.page.goto(adminUrl("/product/stock")); await ctx.page.waitForLoadState("load"); });
  await ctx.step(2, async () => { await searchStockByCode(ctx.page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" }); });
  await ctx.step(3, async () => { const list = new StockListPage(ctx.page); 前 = await 在庫の行の値(list.row(code, shop, "EC-CUBE")); note(`手順3: 在庫 ${前.在庫}・原価単価 ${前.原価単価}・総原価 ${前.総原価}`); });
  await ctx.step(4, async () => { e = await 一覧から編集を開く(ctx.page, 番号); note(`手順4: 買取状況は「${(await e.基本情報()).買取状況}」`); });
  await ctx.step(5, async () => { await e.買取状況を選ぶ("入庫済み"); });
  await ctx.step(6, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(7, async () => { await searchStockByCode(ctx.page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" }); });
  await ctx.step(8, async () => { const list = new StockListPage(ctx.page); 後 = await 在庫の行の値(list.row(code, shop, "EC-CUBE")); });
  await ctx.expected(async () => {
    expect.soft(前.在庫, "操作前の在庫").toBe("10");
    expect.soft(前.総原価, "操作前の総原価").toBe("8000");
    expect.soft(Number(前.原価単価), "操作前の原価単価").toBe(800);
    expect.soft(後.在庫, "操作後の在庫").toBe("12");
    expect.soft(後.総原価, "操作後の総原価").toBe("10200");
    expect.soft(Number(後.原価単価), "操作後の原価単価").toBe(850);
  });
});

caseTest("IT-M07-03-152", async (ctx) => {
  await loginAdmin(ctx.page, M0703RG_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-RG003〕");
  const code = 品("M0703-RG003-SKU");
  const ph = new PurchaseHistoryPage(ctx.page);
  const ステータス = ["振込完了", "未登録在庫あり", "入庫待ち", "入庫済み"];
  let 前件数: number | null = null, 前行 = -1;
  let 後行: Record<string, string>[] = [];
  let e!: M0703EditPage;
  const 保存 = async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); };
  await ctx.step(1, async () => { await ph.open(); });
  await ctx.step(2, async () => { await ph.買取番号を入れる(String(Number(番号))); await ph.ステータスを選ぶ(ステータス); await ph.検索する(); });
  await ctx.step(3, async () => { 前件数 = await ph.該当件数(); 前行 = (await ph.行()).length; });
  await ctx.step(4, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  await ctx.step(5, async () => { await e.査定編集を始める(); await e.明細を名前で入れる(code, { 査定価格: "1100", 数量: "2", 売却: "する" }); await e.査定確定する(); });
  await ctx.step(6, async () => { await e.買取状況を選ぶ("査定内容承諾"); await 保存(); });
  await ctx.step(7, async () => { await e.依頼者情報の編集を押す(); await e.依頼者の選択欄を選ぶ("Identification", "自動車運転免許証"); await e.依頼者情報の編集を押す(); });
  await ctx.step(8, async () => { await e.買取状況を選ぶ("振込依頼済み"); await 保存(); });
  await ctx.step(9, async () => { await e.買取状況を選ぶ("振込完了"); await 保存(); });
  await ctx.step(10, async () => { await ph.open(); await ph.買取番号を入れる(String(Number(番号))); await ph.ステータスを選ぶ(ステータス); await ph.検索する(); });
  await ctx.step(11, async () => { 後行 = await ph.行(); });
  await ctx.expected(async () => {
    expect.soft(前件数, "手順3の該当件数").toBe(0);
    expect.soft(前行, "手順3の行の数").toBe(0);
    const hit = 後行.filter((r) => 数字(r["買取番号"]) === String(Number(番号)) || (r["買取番号"] ?? "").includes(番号));
    expect.soft(hit.length, "手順11の、買取番号の行の数").toBe(1);
    expect.soft((hit[0]?.["申込者"] ?? "").replace(/\s/g, ""), "申込者").toBe("晴屋買取RG003");
    expect.soft(hit[0]?.["商品コード"] ?? "", "商品コード").toBe(code);
    expect.soft(数字(hit[0]?.["入庫数"]), "入庫数").toBe("2");
  });
  note("手順7の身分証明書は、手順8の保存で一緒に保存した（「確定」は買取依頼者情報の編集を閉じるだけで、保存は「保存」で行う）");
});

caseTest("IT-M07-03-153", async (ctx) => {
  await loginAdmin(ctx.page, M0703RG_ADMIN);
  const 番号 = ctx.notes.get("〔買取番号-M0703-RG004〕");
  const メール = 買取の会員.get("S-M07-03-RG-ACCEPTED-153")?.メール ?? "";
  let 前: string | null = null, 後: string | null = null;
  let e!: M0703EditPage;
  await ctx.step(1, async () => { await ctx.page.goto(adminUrl("/customer")); await ctx.page.waitForLoadState("load"); });
  await ctx.step(2, async () => { await searchCustomer(ctx.page, メール); note(`検索語は正本の buyer-m0703-rg004@example.test に実行の印を付けたメールアドレス（${メール}）`); });
  await ctx.step(3, async () => { await openEditFromResult(ctx.page, メール); });
  await ctx.step(4, async () => { 前 = await 会員の買取履歴の状況(ctx.page, 番号); });
  await ctx.step(5, async () => { await 会員の買取履歴から開く(ctx.page, 番号); e = new M0703EditPage(ctx.page); await e.読み込みを待つ(); });
  await ctx.step(6, async () => { await e.買取状況を選ぶ("振込依頼済み"); });
  await ctx.step(7, async () => { const r = await e.保存を押す(); note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`); });
  await ctx.step(8, async () => { await searchCustomer(ctx.page, メール); await openEditFromResult(ctx.page, メール); });
  await ctx.step(9, async () => { 後 = await 会員の買取履歴の状況(ctx.page, 番号); });
  await ctx.expected(async () => {
    expect.soft(前, "操作前の買取履歴欄の買取ステータス").toBe("査定内容承諾");
    expect.soft(後, "操作後の買取履歴欄の買取ステータス").toBe("振込依頼済み");
  });
});

