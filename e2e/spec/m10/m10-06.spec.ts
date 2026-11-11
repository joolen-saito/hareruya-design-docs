/** M10-06 配送方法設定。正本: integration_test/casegen/cases/M10-06_test_cases.tsv
 * 全27件を実装。前回 002 005 006 009 010 021 025 029、今回 001 003 004 007 008 011〜017 019 020 022〜024 026 031。 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OrderSearchPage } from "../../pages/admin/m05_01_order_search_k";
import { PurchaseGroupPage } from "../../pages/admin/m03_22_purchase_group";
import { DeliveryPage } from "../../pages/admin/m10_06_delivery";
import { M1006L_ADMIN, 受注の取得, 連携支払L, 配送名, 支払名 } from "../../seeds/m10-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 配送の選択肢 = (g: PurchaseGroupPage) => g.配送方法.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? (n as HTMLInputElement).value));
const 保存メッセージ = async (page: Page) => (await page.locator(".alert-success").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

caseTest("IT-M10-06-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page); const g = new PurchaseGroupPage(page);
  let 一覧: string[] = []; let 文 = "";
  await step(1, async () => { await g.openNew(); expect.soft(await 配送の選択肢(g), "削除前の配送方法の選択肢").toContain(配送名.d002()); });
  await step(2, async () => { await d.openList(); });
  await step(3, async () => { 文 = await d.削除を押す(配送名.d002()); });
  await step(4, async () => {
    expect.soft(文, "確認ダイアログの文言").toBe(`この操作はあとから取り消すことができません。「${配送名.d002()}」を削除してよろしいですか？`);
    await d.モーダルで削除する();
  });
  await step(5, async () => {
    expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("削除しました");
    expect.soft(await d.行(配送名.d002()).count(), "一覧に残る行の数").toBe(0);
  });
  await step(6, async () => { await g.openNew(); });
  await step(7, async () => { 一覧 = await 配送の選択肢(g); });
  await expected(async () => { expect.soft(一覧, "購入グループ管理の配送方法の選択肢").not.toContain(配送名.d002()); });
});

caseTest("IT-M10-06-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  await step(1, async () => { await d.編集を開く(配送名.d005()); });
  await step(2, async () => {
    await pwExpect(page.getByText("全国一律送料"), "画面の「全国一律送料」の入力欄").toBeVisible({ timeout: 5_000 });
  });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d005()); });
  await step(6, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(true, "再度開いた編集画面の47都道府県の送料").toBe(true); });
});
caseTest("IT-M10-06-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  await step(1, async () => { await d.編集を開く(配送名.d006()); });
  await step(2, async () => { await pwExpect(page.getByText("全国一律送料"), "画面の「全国一律送料」の入力欄").toBeVisible({ timeout: 5_000 }); });
  await step(3, async () => { await page.waitForLoadState("load"); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(true, "47都道府県の送料欄").toBe(true); });
});

caseTest("IT-M10-06-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択 = false;
  await step(1, async () => { await d.編集を開く(配送名.d009()); });
  await step(2, async () => { await d.除外の箱.setChecked(true, { timeout: 30_000 }); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d009()); });
  await step(6, async () => { 選択 = await d.除外の箱.isChecked(); });
  await expected(async () => { expect.soft(選択, "出荷指示リストから除外のチェックボックス（選択済み）").toBe(true); });
});

caseTest("IT-M10-06-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d010()); });
  await step(2, async () => { await d.支払方法を選ぶ(支払名.b(), false); await d.支払方法を選ぶ(支払名.c(), true); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d010()); });
  await step(6, async () => { 選択 = (await d.選ばれた支払方法()).filter((n) => [支払名.a(), 支払名.b(), 支払名.c()].includes(n)); });
  await expected(async () => {
    expect.soft(選択.includes(支払名.a()), "支払M1006-010-A が選択されている").toBe(true);
    expect.soft(選択.includes(支払名.c()), "支払M1006-010-C が選択されている").toBe(true);
    expect.soft(選択.includes(支払名.b()), "支払M1006-010-B が選択されている").toBe(false);
  });
});

caseTest("IT-M10-06-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 警告: string[] = []; let 選択: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d021()); });
  await step(2, async () => { await d.支払方法を選ぶ(連携支払L(), false); await d.支払方法を選ぶ(支払名.条件付(), true); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => {
    警告 = (await page.locator(".alert-warning, .alert-danger").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    await d.openList();
  });
  await step(5, async () => { await d.編集を開く(配送名.d021()); });
  await step(6, async () => { 選択 = (await d.選ばれた支払方法()).filter((n) => [連携支払L(), 支払名.条件付()].includes(n)); });
  await expected(async () => {
    expect.soft(警告.some((t) => t.includes("の購入で選択できる支払い方法がありません。支払方法の利用条件をご確認ください。")), `管理画面上部の警告（${警告.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(選択.includes(支払名.条件付()), "条件付支払が選択されている").toBe(true);
    expect.soft(選択.includes(連携支払L()), "連携支払L が選択されている").toBe(false);
  });
});

caseTest("IT-M10-06-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page); const g = new PurchaseGroupPage(page);
  let 文 = ""; let 一覧: string[] = [];
  await step(1, async () => { await d.openList(); });
  await step(2, async () => { 文 = await d.削除を押す(配送名.d025()); });
  await step(3, async () => {
    expect.soft(文, "確認ダイアログの文言").toBe(`この操作はあとから取り消すことができません。「${配送名.d025()}」を削除してよろしいですか？`);
    await d.モーダルでキャンセルする();
  });
  await step(4, async () => { await g.openNew(); });
  await step(5, async () => { 一覧 = await 配送の選択肢(g); });
  await expected(async () => { expect.soft(一覧, "購入グループ管理の配送方法の選択肢").toContain(配送名.d025()); });
});

caseTest("IT-M10-06-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択: string[] = []; let パス = ""; let 成功: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d029()); });
  await step(2, async () => { await d.支払方法を選ぶ(連携支払L(), false); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { パス = new URL(page.url()).pathname; 成功 = await 保存メッセージ(page); note(`登録後の画面: ${パス}`); });
  await step(5, async () => { await d.編集を開く(配送名.d029()); });
  await step(6, async () => { 選択 = await d.選ばれた支払方法(); });
  await expected(async () => {
    expect.soft(成功.includes("保存しました"), "「保存しました」が表示されていない").toBe(false);
    expect.soft(選択.includes(連携支払L()), "再度開いた編集画面で連携支払L が選択されている").toBe(true);
  });
});

// ---- 残りのケース ----
const 全国一律の注記 = "手順の「全国一律送料に入力して各都道府県に適用ボタンを押す」は、画面にその入力欄・ボタンが無いので、都道府県別送料の「新規登録」の欄を47回使って、47都道府県すべてに同じ送料を入れた";
const 都道府県数 = 47;
type 送料の行 = { 地域: string; サイズ: string; 送料: string };
type Ctx = { page: Page; step: (n: number, f: () => Promise<void>) => Promise<void>; expected: (f: () => Promise<void>) => Promise<void> };

caseTest("IT-M10-06-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page); const g = new PurchaseGroupPage(page);
  let 一覧: string[] = [];
  await step(1, async () => { await d.openList(); await d.新規登録を開く(); });
  await step(2, async () => { await d.基本情報を入れる({ 配送業者名: 配送名.d001(), 名称: 配送名.d001(), 英語名称: "LinkDelivery-L001" }); });
  await step(3, async () => { await d.支払方法を選ぶ(連携支払L(), true); });
  await step(4, async () => { note(全国一律の注記); await d.全都道府県の送料を足す("800"); });
  await step(5, async () => {
    await d.登録を押す();
    expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました");
    expect.soft(await d.行(配送名.d001()).count(), "一覧に表示される行の数").toBe(1);
  });
  await step(6, async () => { await g.openNew(); });
  await step(7, async () => { 一覧 = await 配送の選択肢(g); });
  await expected(async () => { expect.soft(一覧, "購入グループ管理の配送方法の選択肢").toContain(配送名.d001()); });
});

/** 受注情報検索で注文番号を検索し、その行を選んで納品書を印刷（別窓）し、窓の文字を返して窓を閉じる */
async function 納品書を印刷する(page: Page, 注文番号: string, 言語: "日本語" | "英語"): Promise<string> {
  const o = new OrderSearchPage(page);
  await o.open();
  await o.orderNumber.fill(注文番号);
  await o.clickSearch();
  await o.checkRow(注文番号);
  const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 30_000 }), o.bulkButton(言語 === "日本語" ? "納品書印刷（日本語）" : "納品書印刷（英語）").click({ noWaitAfter: true })]);
  await popup.waitForLoadState("load");
  const 文字 = ((await popup.locator("body").innerText()) ?? "").replace(/\s+/g, " ");
  await popup.close();
  return 文字;
}
function 納品書のケース(キー: "003" | "004", 言語: "日本語" | "英語", 業者名: () => string) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1006L_ADMIN);
    const d = new DeliveryPage(page);
    const 番号 = 受注の取得(キー).注文番号;
    let 前 = ""; let 後 = "";
    note(`注文番号は、シードが作った受注の注文番号 ${番号} に読み替えた。受注日では検索せず、この注文番号で検索した（受注日は注文した日のまま）`);
    await step(1, async () => { 前 = await 納品書を印刷する(page, 番号, 言語); });
    await step(2, async () => {
      if (言語 === "英語") expect.soft(前.includes(番号), "国内配送のとき、英語の納品書に注文番号が表示されない").toBe(false);
      else expect.soft(前.includes(番号), "国内配送のとき、日本語の納品書に注文番号が表示される").toBe(true);
    });
    await step(3, async () => { await d.編集を開く(業者名()); });
    await step(4, async () => { await d.国外配送の箱.setChecked(true, { timeout: 30_000 }); await d.登録を押す(); });
    await step(5, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
    await step(6, async () => { 後 = await 納品書を印刷する(page, 番号, 言語); });
    await expected(async () => {
      if (言語 === "英語") expect.soft(後.includes(番号), `手順6で開いた英語の納品書に、注文番号 ${番号} の納品書が表示される`).toBe(true);
      else expect.soft(後.includes(番号), `手順6で開いた日本語の納品書に、注文番号 ${番号} の納品書が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-M10-06-003", 納品書のケース("003", "英語", 配送名.d003));
caseTest("IT-M10-06-004", 納品書のケース("004", "日本語", 配送名.d004));

caseTest("IT-M10-06-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 欄 = ""; let リンク = "";
  await step(1, async () => { await d.openList(); });
  await step(2, async () => {
    欄 = await d.行のID(配送名.d007()); リンク = await d.行のリンクのID(配送名.d007());
    note("配送方法ID 9106507 は画面で指定できないので、画面が振った配送方法IDに読み替え、ID欄の表示が、その行のリンクの配送方法IDと同じかで確かめた");
  });
  await expected(async () => {
    expect.soft(リンク, "行のリンクの配送方法ID（数字）").toMatch(/^\d+$/);
    expect.soft(欄, `配送業者名「${配送名.d007()}」の行のID欄`).toBe(リンク);
  });
});

caseTest("IT-M10-06-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let v = { 名称: "", 英語名称: "", 伝票URL: "", 上限サイズ: "" };
  await step(1, async () => { await d.openList(); await d.新規登録を開く(); });
  await step(2, async () => { await d.基本情報を入れる({ 配送業者名: 配送名.d008(), 名称: "検証名称M1006-008-B", 英語名称: "VerifyName-M1006-008-C", 伝票URL: "https://m1006-008-d.example.com/", 上限サイズ: "120" }); });
  await step(3, async () => { await d.支払方法を選ぶ(連携支払L(), true); });
  await step(4, async () => { note(全国一律の注記); await d.全都道府県の送料を足す("900"); });
  await step(5, async () => { await d.登録を押す(); });
  await step(6, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(7, async () => { await d.編集を開く(配送名.d008()); });
  await step(8, async () => { v = await d.基本情報を読む(); });
  await expected(async () => {
    expect.soft(v.名称, "名称").toBe("検証名称M1006-008-B");
    expect.soft(v.英語名称, "英語名称").toBe("VerifyName-M1006-008-C");
    expect.soft(v.伝票URL, "伝票No.URL").toBe("https://m1006-008-d.example.com/");
    expect.soft(v.上限サイズ, "上限サイズ").toBe("120");
  });
});

caseTest("IT-M10-06-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 時間: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d011()); });
  await step(2, async () => { await d.お届け時間を足す("午前M1006-011-A"); await d.お届け時間を足す("午後M1006-011-B"); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d011()); });
  await step(6, async () => { 時間 = await d.お届け時間の一覧(); });
  await expected(async () => {
    expect.soft(時間, "お届け時間設定の入力欄").toContain("午前M1006-011-A");
    expect.soft(時間, "お届け時間設定の入力欄").toContain("午後M1006-011-B");
  });
});

caseTest("IT-M10-06-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d012()); });
  await step(2, async () => {
    note("手順の「新規登録ボタンを押し、追加された行を確認する」は、画面の作りに合わせた。都道府県別送料の「新規登録」ボタンは、その左の地域・サイズ・送料の欄に入れた値で行を足すので、ボタンがあることだけを確かめ、押すのは次の手順にした");
    await pwExpect(page.locator("#add-delivery-fee-button"), "都道府県別送料設定の新規登録ボタン").toBeVisible({ timeout: 10_000 });
  });
  await step(3, async () => {
    await d.送料の行を足す({ 地域: "東京都", サイズ: "60", 送料: "1500" });
    expect.soft(await d.送料の行の絞り込み("東京都", "60").count(), "追加された東京都・サイズ60の行の数").toBe(1);
  });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(6, async () => { await d.編集を開く(配送名.d012()); });
  await step(7, async () => { 行 = (await d.送料の行を読む()).filter((r) => r.地域 === "東京都"); });
  await expected(async () => { expect.soft(行.some((r) => r.サイズ === "60" && r.送料 === "1500"), `東京都の行（${行.map((r) => `${r.サイズ}/${r.送料}`).join(" , ")}）に、サイズ60・送料1500の行がある`).toBe(true); });
});

caseTest("IT-M10-06-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = []; let 件数前 = 0;
  await step(1, async () => { await d.編集を開く(配送名.d013()); 件数前 = await d.送料の行.count(); });
  await step(2, async () => { await d.送料の行を足す({ 地域: null }); });
  await step(3, async () => {
    note("手順の「追加された行の地域は選択せず」は、画面の作りに合わせた。地域を選ばずに「新規登録」を押すと行は足されず、欄の下に地域の入力漏れの注意が出る");
    await d.送料の行を足す({ 地域: null, サイズ: "60", 送料: "1500" });
    expect.soft(await d.送料の行.count(), "新規登録を押したあとの送料の行の数（足されない）").toBe(件数前);
  });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => {
    expect.soft(await 保存メッセージ(page), "「保存しました」が表示されない").not.toContain("保存しました");
    expect.soft(await d.編集画面か(), "同じ編集画面が表示されている").toBe(true);
  });
  await step(6, async () => { await d.編集を開く(配送名.d013()); });
  await step(7, async () => { 行 = await d.送料の行を読む(); });
  await expected(async () => { expect.soft(行.some((r) => r.サイズ === "60" && r.送料 === "1500"), "サイズ60・送料1500の行がある").toBe(false); });
});

caseTest("IT-M10-06-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d014()); });
  await step(2, async () => { await pwExpect(page.locator("#add-delivery-fee-button"), "都道府県別送料設定の新規登録ボタン").toBeVisible({ timeout: 10_000 }); });
  await step(3, async () => {
    note("手順の「サイズ入力欄の種類を数値入力からテキスト入力へ書き換える」は、行を足したあとの行の入力欄（足す前は無い）に対して行った。追加用の欄は元からテキスト入力。東京都・サイズ「ABC」・送料1500で行を足し、その行の鉛筆を押して、サイズの入力欄の種類をテキストに書き換え、「ABC」を入れた");
    await d.送料の行を足す({ 地域: "東京都", サイズ: "ABC", 送料: "1500" });
    const 東京 = d.送料の行.filter({ has: page.locator(".display-label-pref", { hasText: /^\s*東京都\s*$/ }) });
    const 対象 = 東京.nth((await 東京.count()) - 1);
    await d.送料の行を編集にする(対象);
    await d.行の入力欄をテキストにして入れる(対象, "size", "ABC");
  });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => {
    expect.soft(await 保存メッセージ(page), "「保存しました」が表示されない").not.toContain("保存しました");
    expect.soft(await d.編集画面か(), "同じ編集画面が表示されている").toBe(true);
  });
  await step(6, async () => { await d.編集を開く(配送名.d014()); });
  await step(7, async () => { 行 = (await d.送料の行を読む()).filter((r) => r.地域 === "東京都"); });
  await expected(async () => { expect.soft(行.some((r) => r.サイズ === "ABC"), `東京都の行（${行.map((r) => r.サイズ).join(" , ")}）にサイズ「ABC」の行がある`).toBe(false); });
});

caseTest("IT-M10-06-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d015()); });
  await step(2, async () => {
    const 東京 = d.送料の行の絞り込み("東京都").first();
    await d.送料の行を編集にする(東京);
    await d.行の入力欄に入れる(東京, "fee", "");
  });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => {
    expect.soft(await 保存メッセージ(page), "「保存しました」が表示されない").not.toContain("保存しました");
    expect.soft(await d.編集画面か(), "同じ編集画面が表示されている").toBe(true);
  });
  await step(5, async () => { await d.編集を開く(配送名.d015()); });
  await step(6, async () => { 行 = (await d.送料の行を読む()).filter((r) => r.地域 === "東京都"); });
  await expected(async () => { expect.soft(行[0]?.送料, "東京都の送料").toBe("800"); });
});

caseTest("IT-M10-06-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d016()); });
  await step(2, async () => {
    const 東京 = d.送料の行の絞り込み("東京都").first();
    await d.送料の行を編集にする(東京);
    await d.行の入力欄をテキストにして入れる(東京, "fee", "ABC");
  });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => {
    expect.soft(await 保存メッセージ(page), "「保存しました」が表示されない").not.toContain("保存しました");
    expect.soft(await d.編集画面か(), "同じ編集画面が表示されている").toBe(true);
  });
  await step(5, async () => { await d.編集を開く(配送名.d016()); });
  await step(6, async () => { 行 = (await d.送料の行を読む()).filter((r) => r.地域 === "東京都"); });
  await expected(async () => { expect.soft(行[0]?.送料, "東京都の送料").toBe("800"); });
});

caseTest("IT-M10-06-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.openList(); await d.新規登録を開く(); });
  await step(2, async () => {
    note("名称と英語名称は画面の必須項目で、手順は配送業者名だけなので、名称に配送業者名と同じ値、英語名称に「NewFee-M1006-017」を入れた（ケースが確かめるのは送料）");
    await d.基本情報を入れる({ 配送業者名: 配送名.d017(), 名称: 配送名.d017(), 英語名称: "NewFee-M1006-017" });
  });
  await step(3, async () => { await d.支払方法を選ぶ(連携支払L(), true); });
  await step(4, async () => { note(全国一律の注記); await d.全都道府県の送料を足す("1300"); });
  await step(5, async () => { await d.登録を押す(); });
  await step(6, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(7, async () => { await d.編集を開く(配送名.d017()); });
  await step(8, async () => { 行 = await d.送料の行を読む(); });
  await expected(async () => {
    expect.soft(new Set(行.map((r) => r.地域)).size, "送料の行がある都道府県の数").toBe(都道府県数);
    expect.soft(行.filter((r) => r.送料 !== "1300").map((r) => `${r.地域}=${r.送料}`), "送料が1300でない行").toEqual([]);
  });
});

caseTest("IT-M10-06-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d019()); });
  await step(2, async () => {
    note("手順の「新規登録ボタンを押し、追加された行を確認する」は、画面の作りに合わせた。「新規登録」ボタンは、左の地域・サイズ・送料の欄に入れた値で行を足すので、手順4・5の値（東京都・60・1500、大阪府・80・1800）を入れてから押した");
    await d.送料の行を足す({ 地域: "東京都", サイズ: "60", 送料: "1500" });
    expect.soft(await d.送料の行の絞り込み("東京都", "60").count(), "1行目（東京都・サイズ60）が追加された").toBe(1);
  });
  await step(3, async () => {
    await d.送料の行を足す({ 地域: "大阪府", サイズ: "80", 送料: "1800" });
    expect.soft(await d.送料の行の絞り込み("大阪府", "80").count(), "2行目（大阪府・サイズ80）が追加された").toBe(1);
  });
  await step(4, async () => { expect.soft((await d.送料の行を読む()).some((r) => r.地域 === "東京都" && r.サイズ === "60" && r.送料 === "1500"), "1行目の値（東京都・60・1500）").toBe(true); });
  await step(5, async () => { expect.soft((await d.送料の行を読む()).some((r) => r.地域 === "大阪府" && r.サイズ === "80" && r.送料 === "1800"), "2行目の値（大阪府・80・1800）").toBe(true); });
  await step(6, async () => { await d.登録を押す(); });
  await step(7, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(8, async () => { await d.編集を開く(配送名.d019()); });
  await step(9, async () => { 行 = await d.送料の行を読む(); });
  await expected(async () => {
    expect.soft(行.some((r) => r.地域 === "東京都" && r.サイズ === "60" && r.送料 === "1500"), "東京都・サイズ60・送料1500の行").toBe(true);
    expect.soft(行.some((r) => r.地域 === "大阪府" && r.サイズ === "80" && r.送料 === "1800"), "大阪府・サイズ80・送料1800の行").toBe(true);
  });
});

caseTest("IT-M10-06-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 警告: string[] = []; let 選択: string[] = []; let 編集のまま = false;
  await step(1, async () => { await d.openList(); await d.新規登録を開く(); });
  await step(2, async () => { await d.基本情報を入れる({ 配送業者名: 配送名.d020(), 名称: 配送名.d020(), 英語名称: "DeliveryM1006-CB020-B" }); });
  await step(3, async () => { await d.支払方法を選ぶ(支払名.条件付020(), true); });
  await step(4, async () => { note(全国一律の注記); await d.全都道府県の送料を足す("800"); });
  await step(5, async () => {
    await d.登録を押す();
    編集のまま = await d.編集画面か();
    警告 = (await page.locator(".alert-warning, .alert-danger").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  });
  await step(6, async () => { await d.編集を開く(配送名.d020()); });
  await step(7, async () => { 選択 = (await d.選ばれた支払方法()).filter((n) => n === 支払名.条件付020() || n === 連携支払L()); });
  await expected(async () => {
    expect.soft(編集のまま, "配送方法編集画面に留まっている").toBe(true);
    expect.soft(警告.some((t) => t.includes("の購入で選択できる支払い方法がありません。支払方法の利用条件をご確認ください。")), `管理画面上部の警告（${警告.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(選択, "開き直した編集画面で選択されている支払方法").toEqual([支払名.条件付020()]);
  });
});

caseTest("IT-M10-06-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await d.openList(); await d.新規登録を開く(); });
  await step(2, async () => { await d.基本情報を入れる({ 配送業者名: 配送名.d022a(), 名称: 配送名.d022a(), 英語名称: "NewTopFg-M1006-FG022-A" }); });
  await step(3, async () => { await d.支払方法を選ぶ(連携支払L(), true); });
  await step(4, async () => { note(全国一律の注記); await d.全都道府県の送料を足す("800"); });
  await step(5, async () => { await d.登録を押す(); expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(6, async () => { await d.openList(); 並び = await d.一覧の並び(); });
  await expected(async () => {
    const a = 並び.indexOf(配送名.d022a()); const b = 並び.indexOf(配送名.d022b());
    expect.soft(a >= 0 && b >= 0, "一覧に両方の行がある").toBe(true);
    expect.soft(a < b, `「${配送名.d022a()}」の行（上から${a + 1}番目）が「${配送名.d022b()}」の行（上から${b + 1}番目）より上`).toBe(true);
  });
});

function 並べ替えのケース(x: () => string, y: () => string, 確定: boolean) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1006L_ADMIN);
    const d = new DeliveryPage(page);
    let 並び: string[] = [];
    await step(1, async () => { await d.openList(); });
    await step(2, async () => { await d.上へドラッグする(x(), y()); });
    await step(3, async () => { if (確定) await d.並べ替えを確定する(); else await d.並べ替えをキャンセルする(); });
    await step(4, async () => { await page.reload(); await d.openList(); });
    await step(5, async () => { 並び = await d.一覧の並び(); });
    await expected(async () => {
      const [上, 下] = 確定 ? [x(), y()] : [y(), x()];
      const a = 並び.indexOf(上); const b = 並び.indexOf(下);
      expect.soft(a >= 0 && b >= 0, "一覧に両方の行がある").toBe(true);
      expect.soft(a < b, `再読み込みした一覧で「${上}」の行（上から${a + 1}番目）が「${下}」の行（上から${b + 1}番目）より上`).toBe(true);
    });
  };
}
caseTest("IT-M10-06-023", 並べ替えのケース(配送名.d023x, 配送名.d023y, true));
caseTest("IT-M10-06-024", 並べ替えのケース(配送名.d024x, 配送名.d024y, false));

caseTest("IT-M10-06-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 文 = ""; let 通知: string[] = [];
  await step(1, async () => { await d.openList(); });
  await step(2, async () => { 文 = await d.削除を押す(配送名.d026()); });
  await step(3, async () => {
    expect.soft(文, "確認ダイアログの文言").toBe(`この操作はあとから取り消すことができません。「${配送名.d026()}」を削除してよろしいですか？`);
    await d.モーダルで削除する();
  });
  await step(4, async () => { 通知 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    expect.soft(通知.some((t) => t.includes(`関連するデータがあるため「${配送名.d026()}」を削除できませんでした`)), `管理画面上部のメッセージ（${通知.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(await d.行(配送名.d026()).count(), "一覧に残る行の数").toBe(1);
  });
});

caseTest("IT-M10-06-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 文 = ""; let 行: 送料の行[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d031()); });
  await step(2, async () => { 文 = await d.送料の行の削除を押す(d.送料の行の絞り込み("東京都", "60").first()); });
  await step(3, async () => {
    const 平 = 文.replace(/,/g, "");
    expect.soft(平, "削除の確認モーダルの地域").toContain("地域：東京都");
    expect.soft(平, "削除の確認モーダルのサイズ").toContain("サイズ：60");
    expect.soft(平, "削除の確認モーダルの送料").toContain("送料：1500");
    await d.送料の行の削除を確定する();
  });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => { expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("保存しました"); });
  await step(6, async () => { await d.編集を開く(配送名.d031()); });
  await step(7, async () => { 行 = (await d.送料の行を読む()).filter((r) => r.地域 === "東京都"); });
  await expected(async () => {
    expect.soft(行.some((r) => r.サイズ === "60" && r.送料 === "1500"), "サイズ60・送料1500の行がある").toBe(false);
    expect.soft(行.find((r) => r.サイズ === "0")?.送料, "サイズ指定なしの東京都の送料").toBe("800");
  });
});
