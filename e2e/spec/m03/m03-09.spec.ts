/**
 * M03-09 商品規格登録/編集。正本: cases/M03-09_test_cases.tsv
 * 実施不可の見直しで流せる見込みになったケースのうち、画面で作れるもの（記録 review/M03-09_progress_2026-11-10_dev.md）。
 * 作れなかったもの（スマレジ試験環境の管理画面を使う・TC東京の在庫場所など）は review/recheck_not_buildable_M03-09.tsv。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 価格履歴の件数, 商品コードの商品規格ID, 商品規格の画像, 商品規格の記録 } from "../../db/m03_09";
import { ClassEditPage, ClassListPage } from "../../pages/admin/m03_09_class_edit";
import { chooseByLabel } from "../../pages/admin/common";
import { M0309_ADMIN, スマレジコード, 画像のファイル名の } from "../../seeds/m03-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 商品 = (ctx: CaseCtx, k: string) => ctx.notes.get(`〔商品ID-M0309-${k}〕`);
const 規格 = (ctx: CaseCtx, k: string) => ctx.notes.get(`〔商品規格ID-M0309-${k}〕`);
const 完了の表示 = (ctx: CaseCtx) => ctx.page.getByText("登録が完了しました。").first();
const pathOf = (u: string) => new URL(u).pathname;

async function 始める(ctx: CaseCtx): Promise<ClassEditPage> {
  await loginAdmin(ctx.page, M0309_ADMIN);
  return new ClassEditPage(ctx.page);
}

// ---- 新規登録状態の画面 ----
caseTest("IT-M03-09-001", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.新規で開く(商品(ctx, "001")); });
  await ctx.expected(async () => {
    expect.soft(await e.行の値("商品ID"), "商品IDの読み取り表示").toBe(商品(ctx, "001"));
    expect.soft(await e.行("商品規格ID").count(), "商品規格IDが表示されない").toBe(0);
    expect.soft(await e.行("在庫数").count(), "在庫数が表示されない").toBe(0);
    const langs = await e.選択肢(e.言語);
    expect.soft(langs.includes("日本語") && langs.includes("英語"), `言語で日本語・英語を選べる（選択肢 ${langs.join("、")}）`).toBe(true);
    expect.soft(await e.選択肢(e.状態), "状態の選択肢").toEqual(["ニアミント", "スライトリープレイド", "モデレトリープレイド", "ヘビープレイド", "その他"]);
  });
  supplement("シード表の手順（グッズ商品CSV登録）で商品を作ると、取り込みで状態ニアミントの規格が1件できる。事前準備の「商品規格は0件」はその状態のまま開いた");
});

function 状態名の欄(k: string, 状態: string, 表示される: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    await ctx.step(1, async () => { await e.新規で開く(商品(ctx, k)); });
    await ctx.step(2, async () => { await e.状態を選ぶ(状態); });
    await ctx.expected(async () => {
      if (表示される) {
        await expect.soft(e.状態名, "状態名の入力欄が表示される").toBeVisible();
        await expect.soft(e.状態名, "状態名の入力欄に入力できる").toBeEditable();
      } else {
        await expect.soft(e.状態名, "状態名の入力欄が表示されない").toBeHidden();
      }
    });
    supplement("シード表の手順（グッズ商品CSV登録）で商品を作ると、取り込みで状態ニアミントの規格が1件できる。事前準備の「商品規格は0件」はその状態のまま開いた");
  };
}
caseTest("IT-M03-09-003", 状態名の欄("003", "その他", true));
caseTest("IT-M03-09-004", 状態名の欄("004", "ニアミント", false));

caseTest("IT-M03-09-005", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "005"), 規格(ctx, "005")); });
  await ctx.expected(async () => {
    expect.soft(await e.行の値("状態名"), "登録済みの状態名の読み取り表示").toContain("水濡れ");
    expect.soft(await e.状態名.evaluateAll((els) => els.filter((x) => (x as HTMLInputElement).type !== "hidden" && !(x as HTMLInputElement).disabled && (x as HTMLElement).offsetParent !== null).length), "状態名を編集できる入力欄が無い").toBe(0);
  });
});

// ---- 代表画像 ----
caseTest("IT-M03-09-007", async (ctx) => {
  const e = await 始める(ctx);
  let r!: { 選択肢: string[]; 選ばれている: string[] };
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "007"), 規格(ctx, "007")); });
  await ctx.step(2, async () => { r = await e.代表画像の選択肢(); note(`代表画像の選択肢: ${r.選択肢.join("、")}／選ばれている: ${r.選ばれている.join("、")}`); });
  await ctx.expected(async () => {
    const f = ["IMG-A-007", "IMG-B-007", "IMG-C-007"].map(画像のファイル名の);
    expect.soft(f.every((x) => r.選択肢.some((o) => o.endsWith(x))), "商品に登録済みの3つの画像が選択肢に並ぶ").toBe(true);
    const sel = r.選ばれている.map((s) => f.findIndex((x) => s.endsWith(x)));
    expect.soft(sel, "初期選択（IMG-A-007・IMG-B-007 の順）").toEqual([0, 1]);
  });
});

caseTest("IT-M03-09-008", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "008"), 規格(ctx, "008")); });
  await ctx.step(2, async () => { await expect(e.代表画像, "代表画像の欄").toBeAttached(); });
  await ctx.expected(async () => {
    const x = ctx.page.locator("#admin_product_class_ProductClassImages + .select2 .select2-selection__choice__remove:visible");
    await expect.soft(x, "画像を削除する「×」ボタンが表示されない").toHaveCount(0);
  });
});

caseTest("IT-M03-09-064", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "064"), 規格(ctx, "064")); });
  await ctx.step(2, async () => {
    const a = 画像のファイル名の("IMG-A-064");
    const v = await e.代表画像.locator("option").evaluateAll((os, n) => os.filter((o) => (o.getAttribute("data-url") ?? "").endsWith(n as string)).map((o) => (o as HTMLOptionElement).value), a);
    await e.代表画像.selectOption(v);
    await e.代表画像.dispatchEvent("change");
    note(`代表画像を IMG-A-064 だけにした（選ばれている: ${(await e.代表画像の選択肢()).選ばれている.join("、")}）`);
  });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    expect.soft(商品規格の画像(規格(ctx, "064")), "商品規格に紐づく画像（IMG-A-064 の1件だけ）").toEqual([画像のファイル名の("IMG-A-064")]);
  });
});

caseTest("IT-M03-09-010", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.新規で開く(商品(ctx, "010")); });
  await ctx.expected(async () => {
    await expect.soft(e.日付の行("登録日"), "登録日が表示される").toBeVisible();
    await expect.soft(e.日付の行("更新日"), "更新日が表示される").toBeVisible();
    await expect.soft(e.期間別の販売数, "期間別の販売数が表示されない").toBeHidden();
  });
  supplement("シード表の手順（グッズ商品CSV登録）で商品を作ると、取り込みで状態ニアミントの規格が1件できる。事前準備の「商品規格は0件」はその状態のまま開いた");
});

// ---- 削除ボタンの表示 ----
caseTest("IT-M03-09-011", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "011"), 規格(ctx, "011A")); });
  await ctx.expected(async () => { await expect.soft(e.削除ボタン, "商品規格を削除ボタンが表示される").toBeVisible(); });
});
caseTest("IT-M03-09-012", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "012"), 規格(ctx, "012")); });
  await ctx.expected(async () => {
    await expect(e.form, "商品規格登録/編集画面が表示されている").toBeVisible();
    await expect.soft(e.削除ボタン, "商品規格を削除ボタンが表示されない").toHaveCount(0);
  });
});

// ---- 存在しない・食い違う番号 ----
caseTest("IT-M03-09-013", async (ctx) => {
  const e = await 始める(ctx);
  let status = 0;
  await ctx.step(1, async () => { await e.新規で開く(商品(ctx, "013")); });
  await ctx.step(2, async () => {
    const u = ctx.page.url().replace(`/class/${商品(ctx, "013")}/`, "/class/999999013/");
    status = (await ctx.page.goto(u))?.status() ?? 0;
  });
  await ctx.expected(async () => { expect.soft(status, "応答の状態").toBe(404); });
});
caseTest("IT-M03-09-014", async (ctx) => {
  const e = await 始める(ctx);
  let status = 0;
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "014"), 規格(ctx, "014")); });
  await ctx.step(2, async () => { status = (await ctx.page.goto(ctx.page.url().replace(/\/edit\/\d+$/, "/edit/999999014")))?.status() ?? 0; });
  await ctx.expected(async () => { expect.soft(status, "応答の状態").toBe(404); });
});
caseTest("IT-M03-09-015", async (ctx) => {
  const e = await 始める(ctx);
  let status = 0;
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "015A"), 規格(ctx, "015A")); });
  await ctx.step(2, async () => { status = (await ctx.page.goto(ctx.page.url().replace(/\/edit\/\d+$/, `/edit/${規格(ctx, "015B")}`)))?.status() ?? 0; });
  await ctx.expected(async () => { expect.soft(status, "応答の状態").toBe(404); });
});

caseTest("IT-M03-09-016", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "016"), 規格(ctx, "016")); });
  await ctx.step(2, async () => { await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load" }), e.一覧へ戻る.click()]); });
  await ctx.expected(async () => { expect.soft(pathOf(ctx.page.url()), "遷移した画面（商品規格一覧）").toMatch(new RegExp(`/product/product/class/${商品(ctx, "016")}$`)); });
});

// ---- 価格・セールフラグ ----
function 価格を登録(k: string, セール: boolean, 販売: string, 基準: string, 期待: { 販売: number; 基準: number }) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    await ctx.step(1, async () => { await e.編集で開く(商品(ctx, k), 規格(ctx, k)); });
    await ctx.step(2, async () => {
      if (セール) await e.セールフラグ.check(); else await e.セールフラグ.uncheck();
      await e.販売価格.fill(販売); await e.基準価格.fill(基準);
    });
    await ctx.step(3, async () => { await e.登録を押す(); });
    await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
    await ctx.expected(async () => {
      const r = 商品規格の記録(規格(ctx, k));
      expect.soft(r?.販売価格, "保存された販売価格").toBe(期待.販売);
      expect.soft(r?.基準価格, "保存された基準価格").toBe(期待.基準);
    });
  };
}
caseTest("IT-M03-09-026", 価格を登録("026", true, "650", "700", { 販売: 650, 基準: 700 }));
caseTest("IT-M03-09-027", 価格を登録("027", false, "650", "700", { 販売: 700, 基準: 700 }));
caseTest("IT-M03-09-106", 価格を登録("106", true, "700", "700", { 販売: 700, 基準: 700 }));

caseTest("IT-M03-09-028", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "028"), 規格(ctx, "028")); });
  await ctx.step(2, async () => { await e.セールフラグ.uncheck(); });
  await ctx.expected(async () => { expect.soft(await e.金額(e.販売価格), "販売価格の欄（基準価格700へ変わる）").toBe("700"); });
});
caseTest("IT-M03-09-029", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "029"), 規格(ctx, "029")); });
  await ctx.step(2, async () => { await e.販売価格.fill("650"); await e.基準価格.fill("700"); });
  await ctx.step(3, async () => { await e.セールフラグ.check(); });
  await ctx.expected(async () => {
    expect.soft(await e.金額(e.販売価格), "販売価格の欄（650のまま）").toBe("650");
    expect.soft(await e.金額(e.基準価格), "基準価格の欄（700のまま）").toBe("700");
  });
});

caseTest("IT-M03-09-096", async (ctx) => {
  const e = await 始める(ctx);
  const 前 = 価格履歴の件数(規格(ctx, "096"));
  note(`開始時の価格履歴の件数: ${前}`);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "096"), 規格(ctx, "096")); });
  await ctx.step(2, async () => { await e.基準価格.fill("800"); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    expect.soft(前, "開始時の価格履歴の件数（1件）").toBe(1);
    expect.soft(価格履歴の件数(規格(ctx, "096")), "登録後の価格履歴の件数（1件のまま）").toBe(1);
  });
});

caseTest("IT-M03-09-100", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "100"), 規格(ctx, "100")); });
  await ctx.step(2, async () => { await e.販売価格.fill("200"); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const r = 商品規格の記録(規格(ctx, "100"));
    expect.soft(r?.販売価格, "保存された販売価格（200）").toBe(200);
    expect.soft(r?.買取価格, "買取価格（200のまま）").toBe(200);
  });
});

// ---- 状態別称・更新日時・遷移 ----
caseTest("IT-M03-09-033", async (ctx) => {
  const e = await 始める(ctx);
  let 前 = ""; let 押した時刻 = 0;
  supplement("事前準備の更新日時 2026-09-01 10:00:00 は画面で指定できないので、シードで登録したときの更新日時のまま始めた（実施不可の見直しの B: 過去の日時→実施日）");
  await ctx.step(1, async () => { 前 = 商品規格の記録(規格(ctx, "033"))?.更新日時 ?? ""; note(`開始時の更新日時: ${前}`); });
  await ctx.step(2, async () => { await e.編集で開く(商品(ctx, "033"), 規格(ctx, "033")); });
  await ctx.step(3, async () => { await e.状態別称.fill("更新日時確認"); });
  await ctx.step(4, async () => { await new Promise((r) => setTimeout(r, 1500)); 押した時刻 = Date.now(); await e.登録を押す(); });
  await ctx.step(5, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const after = 商品規格の記録(規格(ctx, "033"))?.更新日時 ?? "";
    note(`登録後の更新日時: ${after}`);
    const t = (s: string) => Date.parse(s.replace(" ", "").replace(/(\.\d{3})\d*/, "$1").replace(/([+-]\d{2})$/, "$1:00"));
    expect.soft(t(after) > t(前), "更新日時が登録の前より新しい").toBe(true);
    expect.soft(Math.abs(t(after) - 押した時刻) < 5 * 60_000, "更新日時が登録操作時の現在時刻（5分以内）").toBe(true);
  });
});

caseTest("IT-M03-09-035", async (ctx) => {
  const e = await 始める(ctx);
  let r!: { 状態: number; 転送があった: boolean; URL: string };
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "035"), 規格(ctx, "035")); });
  await ctx.step(2, async () => { await e.状態別称.fill("遷移確認"); });
  await ctx.step(3, async () => { r = await e.登録を押す(); });
  await ctx.step(4, async () => { note(`送信の応答: 転送（3xx）=${r.転送があった ? "あり" : "なし"}・移った先 ${r.URL}（${r.状態}）`); });
  await ctx.expected(async () => {
    expect.soft(r.転送があった, "登録の要求の応答が転送（302）").toBe(true);
    expect.soft(pathOf(r.URL), "移った先（同じ商品規格の編集画面）").toMatch(new RegExp(`/product/product/class/${商品(ctx, "035")}/edit/${規格(ctx, "035")}$`));
  });
});

// ---- 公開ステータス ----
caseTest("IT-M03-09-042", async (ctx) => {
  const e = await 始める(ctx);
  let opts: string[] = [];
  await ctx.step(1, async () => { await e.新規で開く(商品(ctx, "042")); });
  await ctx.step(2, async () => { opts = await e.選択肢(e.公開ステータス); });
  await ctx.expected(async () => { expect.soft(opts, "公開ステータスの選択肢").toEqual(["公開", "非公開", "廃止"]); });
  supplement("シード表の手順（グッズ商品CSV登録）で商品を作ると、取り込みで状態ニアミントの規格が1件できる。事前準備の「商品規格は0件」はその状態のまま開いた");
});

caseTest("IT-M03-09-046", async (ctx) => {
  await loginAdmin(ctx.page, M0309_ADMIN);
  const l = new ClassListPage(ctx.page);
  let 通常 = true; let 廃止 = false;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "046")); });
  await ctx.step(2, async () => { 通常 = await l.通常の一覧にあるか(規格(ctx, "046")); 廃止 = await l.廃止規格の欄にあるか(規格(ctx, "046")); });
  await ctx.expected(async () => {
    expect.soft(通常, "通常の一覧に表示されない").toBe(false);
    expect.soft(廃止, "廃止規格の表示領域に表示される").toBe(true);
  });
});

caseTest("IT-M03-09-047", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "047"), 規格(ctx, "047")); });
  await ctx.step(2, async () => { await expect(e.form, "商品規格登録/編集画面").toBeVisible(); });
  await ctx.expected(async () => {
    const 選ばれている = (await e.公開ステータス.count()) ? await e.選んでいる文字(e.公開ステータス) : await e.行の値("公開ステータス");
    expect.soft(選ばれている, "公開ステータスの表示（廃止）").toContain("廃止");
    const 変えられる = (await e.公開ステータス.count()) > 0 && (await e.公開ステータス.isEnabled()) && (await e.公開ステータス.isVisible());
    expect.soft(変えられる, "公開ステータスを変更できない").toBe(false);
  });
});

function 公開ステータスを変える(k: string, 変更後: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    await ctx.step(1, async () => { await e.編集で開く(商品(ctx, k), 規格(ctx, k)); });
    await ctx.step(2, async () => { await e.公開ステータスを選ぶ(変更後); });
    await ctx.step(3, async () => { await e.登録を押す(); });
    await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
    await ctx.expected(async () => {
      await expect.soft(完了の表示(ctx), "「登録が完了しました。」が表示される").toBeVisible();
      expect.soft(商品規格の記録(規格(ctx, k))?.公開ステータス, `保存された公開ステータス（${変更後}）`).toBe(変更後);
    });
  };
}
caseTest("IT-M03-09-107", 公開ステータスを変える("107", "非公開"));
caseTest("IT-M03-09-108", 公開ステータスを変える("108", "廃止"));
caseTest("IT-M03-09-114", 公開ステータスを変える("114", "非公開"));

caseTest("IT-M03-09-110", async (ctx) => {
  const e = await 始める(ctx);
  let errs: string[] = [];
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "110"), 規格(ctx, "110")); });
  await ctx.step(2, async () => { await e.公開ステータスを選ぶ("廃止"); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { errs = (await e.画面のエラー.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()); note(`画面のエラー: ${errs.join(" / ") || "なし"}`); });
  await ctx.step(5, async () => { await e.編集で開く(商品(ctx, "110"), 規格(ctx, "110")); });
  await ctx.expected(async () => {
    expect.soft(errs.some((t) => t.includes("在庫")), "在庫が存在する旨のエラーが表示された").toBe(true);
    expect.soft(await e.選んでいる文字(e.公開ステータス), "開き直した画面の公開ステータス（公開のまま）").toBe("公開");
  });
});

// ---- 削除 ----
caseTest("IT-M03-09-048", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "048"), 規格(ctx, "048A")); });
  await ctx.step(2, async () => { await e.削除ボタン.click(); });
  await ctx.step(3, async () => { await expect(e.削除の確定, "確認の画面").toBeVisible(); await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load" }), e.削除の確定.click()]); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => { expect.soft(商品規格の記録(規格(ctx, "048A"))?.削除されていない, "商品規格が論理削除された（削除されていない＝false）").toBe(false); });
});
caseTest("IT-M03-09-049", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "049"), 規格(ctx, "049A")); await ctx.page.waitForLoadState("load"); });
  await ctx.step(2, async () => { await e.削除ボタン.click(); });
  await ctx.step(3, async () => { await expect(e.削除の確定, "確認の画面").toBeVisible(); await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load" }), e.削除の確定.click()]); });
  await ctx.expected(async () => { expect.soft(pathOf(ctx.page.url()), "遷移した画面（商品規格一覧）").toMatch(new RegExp(`/product/product/class/${商品(ctx, "049")}$`)); });
});

function 別の規格を削除(k: string, DB: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    let 元 = ""; let status = 0;
    await ctx.step(1, async () => { await e.編集で開く(商品(ctx, `${k}A`), 規格(ctx, `${k}A`)); 元 = await e.削除のリンク先(); note(`削除のリンク先: ${pathOf(元)}`); });
    await ctx.step(2, async () => {
      const u = 元.replace(/\/class\/\d+\/delete\/\d+/, `/class/${商品(ctx, `${k}B`)}/delete/${規格(ctx, `${k}C`)}`);
      note("開発者ツールの代わりに、画面の削除のリンク先を書き換えてから、画面の「商品規格を削除」→「削除」で送った");
      status = await e.リンク先を書き換えて削除する(u);
    });
    if (DB) await ctx.step(3, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
    await ctx.expected(async () => {
      if (!DB) expect.soft(status, "応答の状態").toBe(400);
      else expect.soft(商品規格の記録(規格(ctx, `${k}C`))?.削除されていない, "別の商品の規格が論理削除されない").toBe(true);
    });
  };
}
caseTest("IT-M03-09-051", 別の規格を削除("051", false));
caseTest("IT-M03-09-052", 別の規格を削除("052", true));

// ---- なりすまし対策 ----
function トークン(k: string, 外す: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    const 新 = rc(外す ? "M0309-NOTOKEN" : "M0309-BADTOKEN");
    await ctx.step(1, async () => { await e.編集で開く(商品(ctx, k), 規格(ctx, k)); });
    await ctx.step(2, async () => { await e.商品コード.fill(新); });
    await ctx.step(3, async () => {
      note(`開発者ツールの代わりに、なりすまし対策の入力要素を画面上で${外す ? "取り除いた" : "「invalid-token」に書き換えた"}`);
      if (外す) await e.なりすまし対策.evaluateAll((els) => els.forEach((x) => x.remove()));
      else await e.なりすまし対策.evaluateAll((els) => els.forEach((x) => ((x as HTMLInputElement).value = "invalid-token")));
    });
    await ctx.step(4, async () => { await e.登録を押す().catch((err) => note(`登録の送信のあとの移動: ${String(err).split("\n")[0].slice(0, 120)}`)); });
    await ctx.step(5, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
    await ctx.expected(async () => { expect.soft(商品規格の記録(規格(ctx, k))?.商品コード, "商品コード（更新されない）").toBe(rc(`M0309-BASE-01-${k}`)); });
  };
}
caseTest("IT-M03-09-053", トークン("053", true));
caseTest("IT-M03-09-054", トークン("054", false));

// ---- 新規登録 ----
caseTest("IT-M03-09-098", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.新規で開く(商品(ctx, "098")); });
  await ctx.step(2, async () => {
    await chooseByLabel(e.言語, "日本語"); await e.状態を選ぶ("その他"); await e.状態名.fill("水濡れ");
    await e.商品コード.fill(rc("M0309-098-NEW")); await e.販売価格.fill("500"); await e.基準価格.fill("500"); await e.買取価格.fill("200");
    await e.部門を選ぶ("10"); await e.スマレジ連携を選ぶ(false); await e.公開ステータスを選ぶ("公開");
  });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const ids = 商品コードの商品規格ID(商品(ctx, "098"), rc("M0309-098-NEW"));
    expect.soft(ids.length, "登録された規格の数（1件）").toBe(1);
    const r = ids[0] ? 商品規格の記録(ids[0]) : null;
    expect.soft(r?.状態, "登録された規格の状態（その他）").toBe("その他");
    expect.soft(r?.状態名, "登録された規格の状態名（水濡れ）").toBe("水濡れ");
  });
});

// ---- スマレジ ----
caseTest("IT-M03-09-099", async (ctx) => {
  const e = await 始める(ctx);
  supplement(`スマレジ商品コード 8309031099・8309032099 は、前の実行と重ならないよう末尾に実行ごとの数字を付けて読んだ（${スマレジコード("8309031099")} → ${スマレジコード("8309032099")}）`);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "099"), 規格(ctx, "099")); });
  await ctx.step(2, async () => { await e.スマレジ商品コード.fill(スマレジコード("8309032099")); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => { expect.soft(商品規格の記録(規格(ctx, "099"))?.スマレジ商品コード, "保存されたスマレジ商品コード").toBe(スマレジコード("8309032099")); });
});

function 連携フラグ(k: string, 操作: "連携しないにする" | "連携するにする" | "販売制限数10", 期待連携: boolean, 完了を見る = true) {
  return async (ctx: CaseCtx): Promise<void> => {
    const e = await 始める(ctx);
    ctx.page.on("dialog", (d) => { note(`確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); });
    await ctx.step(1, async () => { await e.編集で開く(商品(ctx, k), 規格(ctx, k)); });
    await ctx.step(2, async () => {
      if (操作 === "販売制限数10") await e.販売制限数.fill("10");
      else await e.スマレジ連携を選ぶ(操作 === "連携するにする");
    });
    await ctx.step(3, async () => { await e.登録を押す(); });
    await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
    await ctx.expected(async () => {
      if (完了を見る) await expect.soft(完了の表示(ctx), "「登録が完了しました。」が表示される").toBeVisible();
      expect.soft(商品規格の記録(規格(ctx, k))?.スマレジ連携, `保存されたスマレジ連携フラグ（${期待連携 ? "連携する" : "連携しない"}）`).toBe(期待連携);
    });
  };
}
caseTest("IT-M03-09-116", 連携フラグ("116", "連携しないにする", false));
caseTest("IT-M03-09-117", 連携フラグ("117", "販売制限数10", true));

caseTest("IT-M03-09-121", async (ctx) => {
  const e = await 始める(ctx);
  let errs: string[] = [];
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "121"), 規格(ctx, "121")); });
  await ctx.step(2, async () => { await e.スマレジ連携を選ぶ(true); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { errs = (await e.画面のエラー.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()); note(`画面のエラー: ${errs.join(" / ") || "なし"}`); });
  await ctx.expected(async () => { expect.soft(errs.some((t) => t.includes("スマレジ商品コード")), "スマレジ商品コードの入力が必要である旨のエラーが表示された").toBe(true); });
});

caseTest("IT-M03-09-122", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "122"), 規格(ctx, "122")); });
  await ctx.step(2, async () => { await e.スマレジ連携を選ぶ(true); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const r = 商品規格の記録(規格(ctx, "122"));
    expect.soft(r?.スマレジ商品コード ?? "", "保存されたスマレジ商品コード（6桁の数字の自動採番）").toMatch(/^\d{6}$/);
    expect.soft(r?.スマレジ連携, "保存されたスマレジ連携フラグ（連携する）").toBe(true);
  });
});

caseTest("IT-M03-09-123", async (ctx) => {
  const e = await 始める(ctx);
  supplement(`スマレジ商品コード 830911231 は、前の実行と重ならないよう末尾に実行ごとの数字を付けた値（${スマレジコード("830911231")}）で作り、同じ値で確かめた`);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "123"), 規格(ctx, "123")); });
  await ctx.step(2, async () => { await e.スマレジ連携を選ぶ(true); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const r = 商品規格の記録(規格(ctx, "123"));
    expect.soft(r?.スマレジ商品コード, "保存されたスマレジ商品コード（変わらない）").toBe(スマレジコード("830911231"));
    expect.soft(r?.スマレジ連携, "保存されたスマレジ連携フラグ（連携する）").toBe(true);
  });
});

caseTest("IT-M03-09-124", async (ctx) => {
  const e = await 始める(ctx);
  await ctx.step(1, async () => { await e.編集で開く(商品(ctx, "124"), 規格(ctx, "124")); });
  await ctx.step(2, async () => { await e.販売制限数.fill("10"); });
  await ctx.step(3, async () => { await e.登録を押す(); });
  await ctx.step(4, async () => { note("DB の参照で確かめる（期待結果の確かめで読む）"); });
  await ctx.expected(async () => {
    const r = 商品規格の記録(規格(ctx, "124"));
    expect.soft(r?.スマレジ商品コード, "保存されたスマレジ商品コード（空のまま）").toBe("");
    expect.soft(r?.スマレジ連携, "保存されたスマレジ連携フラグ（連携しない）").toBe(false);
  });
});
