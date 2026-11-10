/**
 * M05-11 受注情報編集の続き（-o）。仕分け直し（2026-11-10）で流せる見込みになったケース。正本: cases/M05-11_test_cases.tsv
 * - キャンセルの組合せ（255〜272）: 受注ステータスを「キャンセル」へ変えたときの、キャンセル日・在庫・週間販売数・ポイント履歴・会員の保持ポイント。
 * - 共有の受注（BASE-READ）・会員（MEMBER-READ）・付帯情報なしの受注（NULL-READ）を使う画面の確かめ。
 * シードは seeds/m05-11-o.ts（画面で作り、画面で作れない状態だけ E2E の行に DB で書き足す。依頼者決定 2026-11-10）。
 * 共有の受注を書き換えるおそれのあるケース（057・058・003。正本は書き換わらないことを期待する）は、ほかの共有の受注のケースのあとに置く。
 */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 受注, 受注の全項目, 商品の在庫, 手動変更履歴の件数 } from "../../db/m05_11";
import { 受注のポイント } from "../../db/m05_11_n";
import { 会員の購入の記録, 会員の連絡先, 在庫変動履歴の件数, 受注IDがあるか, 受注のキャンセル日, 受注のステータス, 受注のポイント履歴, 受注の日付, 受注の日付の欄, 週間販売数, 配送方法のお届け時間 } from "../../db/m05_11_o";
import { OrderEditPage, OrderItemsEdit } from "../../pages/admin/m05_11_order_edit";
import { OrderEditMore, 欄の名前 } from "../../pages/admin/m05_11_order_edit_o";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";
import {
  BASE, BASEの商品コード, M0511_ADMIN_B, 日付の会員, 日付の商品コード, キャンセルの会員, キャンセルの商品コード, キャンセルの組合せ, キャンセル日の既定, 会員A, 会員B, 最終購入日時, NULLの会員,
} from "../../seeds/m05-11-o";

const 注記 = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const 補い = (m: string) => test.info().annotations.push({ type: "正本の外の補い", description: m });
const onDialog = (m: string) => 注記(`ダイアログを受け入れた: ${m}`);
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}
const 今日 = (): string => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
const 週の欄名 = ["当日", "翌日", "3日以内", "7日以内", "28日以内", "90日以内", "180日以内", "365日以内"];

// ---- キャンセルの組合せ（255〜272） ----
/** 正本の期待結果が「5から4になる」とする週間販売数の欄（当日=0 … 365日以内=7）。キャンセル日が既に入っている組は空 */
const 減る欄: Record<string, number[]> = {
  "255": [], "256": [],
  "257": [0, 2, 3, 4, 5, 6, 7], "258": [0, 2, 3, 4, 5, 6, 7],
  "259": [1, 2, 3, 4, 5, 6, 7], "260": [1, 2, 3, 4, 5, 6, 7],
  "261": [2, 3, 4, 5, 6, 7], "262": [2, 3, 4, 5, 6, 7],
  "263": [3, 4, 5, 6, 7], "264": [3, 4, 5, 6, 7],
  "265": [4, 5, 6, 7], "266": [4, 5, 6, 7],
  "267": [5, 6, 7], "268": [5, 6, 7],
  "269": [6, 7], "270": [6, 7],
  "271": [7], "272": [7],
};
function キャンセル(n: string) {
  return async ({ page, browser, notes, step, expected }: CaseCtx): Promise<void> => {
    const c = キャンセルの組合せ[n];
    const no = notes.get(`〔受注番号-M0511-${n}〕`), m = キャンセルの会員(n), code = キャンセルの商品コード(n);
    if (c.日数 > 0) 補い(`受注日は、試験実行日の${c.日数}日前の日付になるよう、画面で作った受注の受注日を DB で前へずらした（画面では注文を確定した日時になる）`);
    if (c.既に) 補い(`キャンセル日 ${キャンセル日の既定} は画面で指定できないため、画面で作った受注へ DB で書き足した`);
    補い("商品規格別の週間販売数の各比較欄の5は、画面で指定できないため、画面で作った商品規格へ DB で書き足した");
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let 後: { キャンセル日: string; 在庫: number; 戻し: number; 週: number[]; 履歴: number[]; 保持: number } | undefined;
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
    await step(3, async () => { await p.ステータスを変更する(onDialog); });
    await step(4, async () => {
      後 = {
        キャンセル日: 受注のキャンセル日(no, m.メール), 在庫: 商品の在庫(code).在庫, 戻し: 在庫変動履歴の件数(code, { 変更前: 9, 変更後: 10, 増減数: 1 }),
        週: 週間販売数(code), 履歴: 受注のポイント履歴(no, m.メール), 保持: 受注のポイント(no).会員の保持,
      };
      注記(`操作後: ${JSON.stringify(後)}`);
    });
    await expected(async () => {
      const a = 後!;
      expect.soft(a.キャンセル日, c.既に ? "受注のキャンセル日（2026-08-24のまま）" : "受注のキャンセル日（試験実行日）").toBe(c.既に ? キャンセル日の既定 : 今日());
      expect.soft(a.在庫, c.既に ? "商品の在庫数（9のまま）" : "商品の在庫数（9から10）").toBe(c.既に ? 9 : 10);
      if (!c.既に) expect.soft(a.戻し, "在庫変動履歴の、キャンセルによる在庫戻し（変更前9・変更後10・増減数1）の行の数").toBe(1);
      else expect.soft(a.戻し, "在庫変動履歴に在庫戻しの行が増えない").toBe(0);
      const want = 週の欄名.map((_, i) => (減る欄[n].includes(i) ? 4 : 5));
      expect.soft(a.週, `商品規格別の週間販売数（${週の欄名.map((x, i) => `${x}=${want[i]}`).join("・")}）`).toEqual(want);
      const 履歴 = c.既に ? (c.二件 ? [50, -50] : [50]) : [];
      expect.soft(a.履歴, c.既に ? `本受注のポイント履歴（${c.二件 ? "+50と-50の2件" : "+50の1件"}のまま）` : "本受注のポイント履歴（削除されて0件）").toEqual(履歴);
      const 保持 = c.既に || c.二件 ? 1000 : 950;
      expect.soft(a.保持, `会員の保持ポイント（${保持 === 1000 ? "1000のまま" : "1000から950"}）`).toBe(保持);
    });
  };
}
caseTest("IT-M05-11-255", キャンセル("255"));
caseTest("IT-M05-11-256", キャンセル("256"));
caseTest("IT-M05-11-257", キャンセル("257"));
caseTest("IT-M05-11-258", キャンセル("258"));
caseTest("IT-M05-11-259", キャンセル("259"));
caseTest("IT-M05-11-260", キャンセル("260"));
caseTest("IT-M05-11-261", キャンセル("261"));
caseTest("IT-M05-11-262", キャンセル("262"));
caseTest("IT-M05-11-263", キャンセル("263"));
caseTest("IT-M05-11-264", キャンセル("264"));
caseTest("IT-M05-11-265", キャンセル("265"));
caseTest("IT-M05-11-266", キャンセル("266"));
caseTest("IT-M05-11-267", キャンセル("267"));
caseTest("IT-M05-11-268", キャンセル("268"));
caseTest("IT-M05-11-269", キャンセル("269"));
caseTest("IT-M05-11-270", キャンセル("270"));
caseTest("IT-M05-11-271", キャンセル("271"));
caseTest("IT-M05-11-272", キャンセル("272"));

// ---- 共有の受注（BASE-READ）を読むだけのケース ----
const BASE_NO = "〔受注番号-M0511-共有BASE〕";

caseTest("IT-M05-11-005", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const 欄: 欄の名前[] = ["注文者情報", "お支払情報", "お届け先情報", "ポイント連携エラー"];
  const 初め: Record<string, { 開: boolean; タイトル: boolean }> = {};
  const 押した: Record<string, { 一回目: boolean; 二回目: boolean }> = {};
  let x!: OrderEditMore;
  await step(1, async () => {
    await 開く(browser, page, notes.get(BASE_NO));
    x = new OrderEditMore(page);
    for (const k of 欄) 初め[k] = { 開: await x.欄が開いているか(k), タイトル: await x.欄のタイトルが見えているか(k) };
    注記(`開いた直後: ${JSON.stringify(初め)}`);
  });
  await step(2, async () => {
    for (const k of 欄) {
      await x.欄のタイトルを押す(k); const 一 = await x.欄が開いているか(k);
      await x.欄のタイトルを押す(k); const 二 = await x.欄が開いているか(k);
      押した[k] = { 一回目: 一, 二回目: 二 };
    }
    注記(`タイトルを押したとき: ${JSON.stringify(押した)}`);
  });
  await expected(async () => {
    for (const k of 欄) {
      expect.soft(初め[k].タイトル, `${k}: 初期状態でタイトルが表示される`).toBe(true);
      expect.soft(初め[k].開, `${k}: 初期状態では内容が閉じている`).toBe(false);
      expect.soft(押した[k]?.一回目, `${k}: タイトルを押すと内容が開く`).toBe(true);
      expect.soft(押した[k]?.二回目, `${k}: もう一度押すと内容が閉じる`).toBe(false);
    }
  });
});

caseTest("IT-M05-11-008", async ({ page, browser, notes, step, expected }) => {
  補い("ポイント付帯情報（発生ポイント・使用ポイント・ポイント付与率）の未設定は画面で指定できないため、画面で作った受注へ DB で書き足した");
  await loginAdmin(page, M0511_ADMIN_A);
  let x!: OrderEditMore; let v!: Awaited<ReturnType<OrderEditMore["ポイントと送り状の値"]>>;
  await step(1, async () => { await 開く(browser, page, notes.get("〔受注番号-M0511-共有NULL〕")); x = new OrderEditMore(page); });
  await step(2, async () => {
    for (const k of ["お支払情報", "お届け先情報", "ポイント連携エラー"] as 欄の名前[]) if (!(await x.欄が開いているか(k))) await x.欄のタイトルを押す(k);
    v = await x.ポイントと送り状の値();
  });
  await expected(async () => {
    expect.soft(v.発生, "発生ポイント").toBe("0");
    expect.soft(v.使用, "使用ポイント").toBe("0");
    expect.soft(v.付与率, "ポイント付与率").toBe("0");
    expect.soft(v.送り状, "送り状No.（空）").toBe("");
    expect.soft(v.連携エラー, "ポイント連携エラー（空）").toBe("");
  });
});

caseTest("IT-M05-11-030", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(BASE_NO);
  let p!: OrderEditPage; let h!: OrderEditPage; let 別タブ = false;
  let r = { ボタン: -1, リンク: -1, 履歴: -1 };
  await step(1, async () => { p = await 開く(browser, page, no); 注記(`この受注の手動変更履歴の件数: ${手動変更履歴の件数(String(受注(no).受注ID))}`); });
  await step(2, async () => { h = await p.履歴を開く(0); 別タブ = h.page !== page; });
  await step(3, async () => {
    const x = new OrderEditMore(h.page);
    r = { ボタン: await x.更新ボタンの数(), リンク: await x.本文のリンクの数(), 履歴: await x.受注データ更新履歴の数() };
    注記(`開いたタブ ${h.page.url()}: ${JSON.stringify(r)}`);
  });
  await expected(async () => {
    expect.soft(別タブ, "履歴用の受注情報編集画面が別タブで開く").toBe(true);
    expect.soft(new URL(h.page.url()).pathname, "開いたタブ（履歴用の受注情報編集画面）").toMatch(/\/order\/\d+\/history\/\d+/);
    expect.soft(r.ボタン, "更新ボタンが表示されない").toBe(0);
    expect.soft(r.リンク, "リンクが表示されない").toBe(0);
    expect.soft(r.履歴, "受注データ更新履歴が表示されない").toBe(0);
  });
});

caseTest("IT-M05-11-031", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage; let h!: OrderEditPage; let n = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(BASE_NO)); });
  await step(2, async () => { h = await p.履歴を開く(0); });
  await step(3, async () => {
    const x = new OrderEditMore(h.page);
    for (const k of ["注文者情報", "お支払情報", "お届け先情報"] as 欄の名前[]) if (!(await x.欄が開いているか(k))) await x.欄のタイトルを押す(k);
    n = await x.入力できる欄の数();
  });
  await expected(async () => { expect.soft(n, "履歴画面の注文者情報・お支払情報・お届け先情報で編集できる欄の数").toBe(0); });
});

caseTest("IT-M05-11-077", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let x!: OrderEditMore; let 前: string[] = [], 後: string[] = [];
  const want = 配送方法のお届け時間("店頭受取");
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); x = new OrderEditMore(page); });
  await step(2, async () => { if (!(await x.欄が開いているか("お届け先情報"))) await x.欄のタイトルを押す("お届け先情報"); 前 = await x.お届け時間の選択肢(); });
  await step(3, async () => { await x.配送方法を選ぶ("店頭受取"); });
  await step(4, async () => { 後 = await x.お届け時間の選択肢(); 注記(`変更前の選択肢: ${前.join("、")} ／ 変更後: ${後.join("、")} ／ 店頭受取のお届け時間（DB）: ${want.join("、")}`); });
  await expected(async () => {
    expect.soft(後.filter((t) => want.includes(t)).sort(), "変更後お届け時間の選択肢に、店頭受取のお届け時間がすべてある").toEqual([...want].sort());
    expect.soft(後.filter((t) => t && !want.includes(t) && !/指定なし|選択|^-+$/.test(t)), "店頭受取に無いお届け時間が残らない").toEqual([]);
  });
});

// ---- 会員の呼び出し（MEMBER-READ） ----
caseTest("IT-M05-11-091", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const id = notes.get("〔会員ID-M0511-共有A〕");
  let x!: OrderEditMore; let v: Record<string, string> = {};
  const want = 会員の連絡先(会員A().メール);
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); x = new OrderEditMore(page); });
  await step(2, async () => { await x.会員を検索する(id); await x.会員を決定する(id); v = await x.注文者情報の値(); 注記(`呼び出したあとの注文者情報: ${JSON.stringify(v)}`); });
  await expected(async () => {
    expect.soft(v.姓, "姓（会員姓）").toBe("会員姓");
    expect.soft(v.名, "名（会員名）").toBe("会員名");
    expect.soft(`${v.郵便番号1}${v.郵便番号2}`, "郵便番号（会員の住所）").toBe(want.郵便番号);
    expect.soft(v.都道府県, "都道府県（会員の住所）").toBe(want.都道府県);
    expect.soft(v.住所1, "住所1（会員の住所）").toBe(want.住所1);
    expect.soft(v.住所2, "住所2（会員の住所）").toBe(want.住所2);
    expect.soft(v.メール, "メールアドレス（会員のメールアドレス）").toBe(want.メール);
    expect.soft(`${v.電話1}${v.電話2}${v.電話3}`, "電話番号（会員の電話番号）").toBe(want.電話);
  });
});

caseTest("IT-M05-11-092", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const id = notes.get("〔会員ID-M0511-共有A〕");
  const dialogs: string[] = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.accept().catch(() => undefined); });
  let x!: OrderEditMore; let v: Record<string, string> = {};
  注記(`会員ID 999999 の会員: ${受注IDがあるか("999999") ? "（受注ID 999999 はある）" : ""}会員一覧の確かめはシード表のとおり`);
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); x = new OrderEditMore(page); });
  await step(2, async () => { await x.会員を検索する(id); });
  await step(3, async () => { await x.決定ボタンの会員IDを書き換える(id, "999999"); 注記("開発者ツールの代わりに、決定ボタンが送る会員IDを画面のスクリプトで 999999 に書き換えた"); });
  await step(4, async () => {
    await x.決定ボタン("999999").first().click({ timeout: 20_000 });
    await page.waitForTimeout(3000);
    v = await x.注文者情報の値();
  });
  await expected(async () => {
    expect.soft(dialogs.length, "呼び出し失敗のダイアログが表示される").toBeGreaterThan(0);
    expect.soft(v.姓, "注文者情報の姓（試験姓のまま）").toBe(BASE.姓);
    expect.soft(v.メール, "注文者情報のメールアドレス（base@example.com のまま）").toBe(BASE.メール);
  });
});

caseTest("IT-M05-11-093", async ({ page, browser, notes, step, expected }) => {
  補い(`会員の最終購入日時 ${最終購入日時} は画面で指定できないため、画面で作った会員へ DB で書き足した`);
  await loginAdmin(page, M0511_ADMIN_A);
  const id = notes.get("〔会員ID-M0511-共有A〕");
  let x!: OrderEditMore; let v = { 最終注文日: "", 累計注文金額: "" };
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); x = new OrderEditMore(page); });
  await step(2, async () => { await x.会員を検索する(id); await x.会員を決定する(id); });
  await step(3, async () => { v = await x.購入の表示(); 注記(`最終注文日・累計注文金額の表示: ${JSON.stringify(v)}`); });
  await expected(async () => {
    expect.soft(v.最終注文日, "最終購入日時（2026/08/31 12:34:56）").toBe("2026/08/31 12:34:56");
    expect.soft(v.累計注文金額, "購入金額（通貨表記）").toMatch(/^[¥￥]\s?[\d,]+$/);
  });
});

caseTest("IT-M05-11-094", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const id = notes.get("〔会員ID-M0511-共有B〕");
  let x!: OrderEditMore; let v = { 最終注文日: "", 累計注文金額: "" };
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); x = new OrderEditMore(page); });
  await step(2, async () => { await x.会員を検索する(id); await x.会員を決定する(id); });
  await step(3, async () => { v = await x.購入の表示(); 注記(`最終注文日の表示: ${JSON.stringify(v)}（会員B ${会員B().メール}）`); });
  await expected(async () => { expect.soft(v.最終注文日, "最終購入日時（空）").toBe(""); });
});

caseTest("IT-M05-11-095", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let status = 0; let path = ""; let 編集の欄 = -1;
  await step(1, async () => { await 開く(browser, page, notes.get(BASE_NO)); 注記(`受注ID 999999 の受注: ${受注IDがあるか("999999") ? "ある" : "無い"}`); });
  await step(2, async () => {
    status = await new OrderEditMore(page).受注IDで開く("999999");
    path = new URL(page.url()).pathname;
    編集の欄 = await page.locator("#order_OrderStatus").count();
    注記(`応答 ${status}・開いた画面 ${path}`);
  });
  await expected(async () => {
    expect.soft(path === "/admin/order/999999/edit" && status < 400 && 編集の欄 > 0, "受注ID 999999 の受注情報編集画面が表示されない").toBe(false);
  });
});

// ---- 共有の受注を書き換えるおそれのあるケース（ほかの共有の受注のケースのあと） ----
caseTest("IT-M05-11-057", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(BASE_NO);
  let 前: Record<string, string | null> = {}; let 後: Record<string, string | null> = {};
  let x!: OrderEditMore;
  await step(1, async () => { 前 = 受注の全項目(no); await 開く(browser, page, no); x = new OrderEditMore(page); });
  await step(2, async () => { await x.欠品登録を押す(onDialog); });
  await step(3, async () => {
    for (const k of ["注文者情報", "お支払情報", "お届け先情報"] as 欄の名前[]) if (!(await x.欄が開いているか(k))) await x.欄のタイトルを押す(k);
    const ng = await x.空にする([
      '#table-form-field tr.item_box input[name$="[quantity]"]', '#table-form-field tr.item_box input[name$="[stockout]"]', '#table-form-field tr.item_box input[name$="[price]"]',
      "#order_discount", "#order_delivery_fee_total", "#order_charge",
      "#order_name_name01", "#order_name_name02", "#order_address_pref", "#order_address_addr01", "#order_address_addr02", "#order_email",
      "#order_tel_tel01", "#order_tel_tel02", "#order_tel_tel03", "#order_Payment", "#order_pointPercentage", "#order_gainedPoints", "#order_spendedPoints",
      "#order_Shipping_name_name01", "#order_Shipping_name_name02", "#order_Shipping_address_pref", "#order_Shipping_address_addr01", "#order_Shipping_address_addr02", "#order_Shipping_Delivery",
    ]);
    if (ng.length) 注記(`画面に無く空にできなかった欄: ${ng.join("、")}`);
  });
  await step(4, async () => { await new OrderEditPage(page).登録を押す(onDialog); 注記(`押したあとの画面: ${page.url()}・エラーの表示: ${(await x.エラーの文()).slice(0, 5).join(" / ")}`); });
  await step(5, async () => { 後 = 受注の全項目(no); });
  await expected(async () => {
    const 変わった = Object.keys(前).filter((k) => k !== "update_date" && String(前[k]) !== String(後[k]));
    注記(`変わった項目: ${変わった.map((k) => `${k}: ${前[k]} → ${後[k]}`).join(" ／ ") || "なし"}`);
    expect.soft(変わった, "受注の各項目が更新前の値から変わらない（変わった項目）").toEqual([]);
  });
});

caseTest("IT-M05-11-058", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(BASE_NO);
  let x!: OrderEditMore; let 後 = ""; let id = "";
  await step(1, async () => { await 開く(browser, page, no); x = new OrderEditMore(page); id = String(受注(no).受注ID); });
  await step(2, async () => {
    if (!(await x.欄が開いているか("注文者情報"))) await x.欄のタイトルを押す("注文者情報");
    const country = page.locator("#order_Country");
    if (await country.count()) await country.selectOption({ label: "日本" }).catch(() => 注記("国の選択肢に「日本」が無い"));
    await x.空にする(["#order_postalCode_postalCode01", "#order_postalCode_postalCode02"]);
  });
  await step(3, async () => {
    const items = new OrderItemsEdit(page);
    for (const k of ["A", "B"] as const) { await items.削除を押す(BASEの商品コード(k)); await items.削除を確定する(BASEの商品コード(k)); }
  });
  await step(4, async () => { await new OrderEditPage(page).登録を押す(onDialog); 後 = new URL(page.url()).pathname; 注記(`押したあとの画面: ${page.url()}・エラーの表示: ${(await x.エラーの文()).slice(0, 5).join(" / ")}`); });
  await expected(async () => {
    expect.soft(後, "受注情報編集画面に留まる（同じ受注の編集画面）").toBe(`/admin/order/${id}/edit`);
    expect.soft(await page.locator("#order_OrderStatus").count(), "受注情報編集画面が表示されている").toBeGreaterThan(0);
  });
});

caseTest("IT-M05-11-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_B);
  const no = notes.get(BASE_NO);
  let x!: OrderEditMore; let errs: string[] = []; let status = 0;
  await step(1, async () => { x = new OrderEditMore(page); status = await x.受注IDで開く(String(受注(no).受注ID)); 注記(`店舗Bの管理者で店舗Aの受注を開いた応答: ${status}・${page.url()}`); });
  await step(2, async () => { await new OrderEditPage(page).注文者姓を入れる("権限外更新"); });
  await step(3, async () => { await new OrderEditPage(page).登録を押す(onDialog); errs = await x.エラーの文(); 注記(`押したあとの画面: ${page.url()}・エラー: ${errs.join(" / ")}`); });
  await expected(async () => {
    expect.soft(await page.locator("#order_OrderStatus").count(), "受注情報編集画面が表示されている").toBeGreaterThan(0);
    expect.soft(errs.length, "受注情報編集画面にエラーが表示される").toBeGreaterThan(0);
  });
});

// ---- 日付のクリア（011・012・013）・累計注文金額（041） ----
const 日付の欄の並び = ["ピック中", "入金日", "出荷指示日", "出荷日", "キャンセル日", "店頭予約日"] as const;

caseTest("IT-M05-11-011", async ({ page, browser, notes, step, expected }) => {
  補い("ピック中・入金日・出荷指示日・出荷日・キャンセル日・店頭予約日の2026-08-20〜25は画面で指定できないため、画面で作った受注へ DB で書き足した");
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get("〔受注番号-M0511-011〕"), m = 日付の会員("011");
  let x!: OrderEditMore; const 読み直し: Record<string, boolean> = {}; let 後: Record<string, string> = {};
  await step(1, async () => { await 開く(browser, page, no); x = new OrderEditMore(page); 注記(`操作前の日付: ${JSON.stringify(受注の日付(no, m.メール))}`); });
  await step(2, async () => { for (const k of 日付の欄の並び) 読み直し[k] = await x.クリアを押す(受注の日付の欄[k], onDialog); });
  await step(3, async () => { 注記(`クリアのたびに画面を読み込み直したか: ${JSON.stringify(読み直し)}`); });
  await step(4, async () => { 後 = 受注の日付(no, m.メール); 注記(`操作後の日付: ${JSON.stringify(後)}`); });
  await expected(async () => {
    for (const k of 日付の欄の並び) {
      expect.soft(後[k], `${k}が空に更新される`).toBe("");
      expect.soft(読み直し[k], `${k}の「クリア」のあと画面が読み込み直される`).toBe(true);
    }
  });
});

caseTest("IT-M05-11-012", async ({ page, browser, notes, step, expected }) => {
  補い("キャンセル日2026-08-24は画面で指定できないため、画面で作った受注へ DB で書き足した");
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get("〔受注番号-M0511-012〕"), m = 日付の会員("012"), code = 日付の商品コード("012");
  let x!: OrderEditMore;
  const 前 = { 在庫: 商品の在庫(code).在庫, ポイント: 受注のポイント(no).会員の保持, ステータス: 受注のステータス(no, m.メール) };
  let 後 = { 在庫: -1, ポイント: -1, ステータス: "" };
  await step(1, async () => { await 開く(browser, page, no); x = new OrderEditMore(page); 注記(`操作前: ${JSON.stringify(前)}`); });
  await step(2, async () => { await x.クリアを押す(受注の日付の欄.キャンセル日, onDialog); });
  await step(3, async () => { 後 = { 在庫: 商品の在庫(code).在庫, ポイント: 受注のポイント(no).会員の保持, ステータス: 受注のステータス(no, m.メール) }; 注記(`操作後: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft(後.在庫, "商品の在庫数（操作前から変わらない）").toBe(前.在庫);
    expect.soft(後.ポイント, "会員ポイント（操作前から変わらない）").toBe(前.ポイント);
    expect.soft(後.ステータス, "受注ステータス（操作前から変わらない）").toBe(前.ステータス);
  });
});

caseTest("IT-M05-11-013", async ({ page, browser, notes, step, expected }) => {
  補い("入金日2026-08-21は画面で指定できないため、画面で作った受注へ DB で書き足した");
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get("〔受注番号-M0511-013〕");
  let x!: OrderEditMore; let moved = false; let 前 = "";
  await step(1, async () => { await 開く(browser, page, no); x = new OrderEditMore(page); 前 = new URL(page.url()).pathname; });
  await step(2, async () => { moved = await x.クリアを押す(受注の日付の欄.入金日, onDialog); });
  await expected(async () => {
    expect.soft(moved, "「クリア」のあと画面が読み込み直される（再遷移）").toBe(true);
    expect.soft(new URL(page.url()).pathname, "再遷移した先（同じ受注の受注情報編集画面）").toBe(前);
    expect.soft(await page.locator("#order_OrderStatus").count(), "受注情報編集画面が表示されている").toBeGreaterThan(0);
  });
});

caseTest("IT-M05-11-041", async ({ page, browser, notes, step, expected }) => {
  補い("会員の累計注文金額10000は画面で指定できないため、画面で作った会員へ DB で書き足した");
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get("〔受注番号-M0511-041〕"), m = 日付の会員("041");
  let 後 = -1;
  await step(1, async () => { await 開く(browser, page, no); 注記(`操作前の累計注文金額: ${会員の購入の記録(m.メール).累計注文金額}`); });
  await step(2, async () => { await new OrderItemsEdit(page).金額欄({ 値引き: "500" }); });
  await step(3, async () => { await new OrderEditPage(page).受注情報を登録する(onDialog); });
  await step(4, async () => { 後 = 会員の購入の記録(m.メール).累計注文金額; });
  await expected(async () => { expect.soft(後, "会員の累計注文金額（9500）").toBe(9500); });
});
