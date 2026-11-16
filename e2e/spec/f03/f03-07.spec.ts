/** F03-07 入荷時通知。正本: cases/F03-07_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import {
  商品に属する有効な依頼件数, 規格の依頼件数, 商品単位の依頼件数, 有効な依頼件数, 言語つきの商品単位の依頼件数,
} from "../../db/f03_07";
import { hideDebugToolbar, loginAdmin, withAdminSession } from "../../lib/session";
import { SETUP_ADMIN, BASE_URL } from "../../config/env";
import { 規格への依頼件数, 本登録の鍵 } from "../../db/f03_07";
import { deleteClassOnEdit, openClassEdit, openClassList } from "../../pages/admin/m03_30_products";
import { EntryPage } from "../../pages/front/f06_01_entry";
import { openRequestSearch, searchProductRequests, 依頼一覧の行 } from "../../pages/admin/f03_07_restock";
import { FRONT, FrontRestock, 押した結果 } from "../../pages/front/f03_07_restock_notify";
import { classOf, mailOf, memberOf, PF_ADMIN, restoreArrivalMax, 商品名Of } from "../../seeds/f03-07";
import { Browser, Page } from "@playwright/test";
import { mailIds, mailsTo, mailText } from "../../lib/mail";
import { 商品規格の在庫の欄 } from "../../pages/admin/f03_07_restock";
import { 在庫を増減して承認する } from "../../pages/admin/f02_01_setup";
import { InventoryPlanEditPage, pressReflectExecute } from "../../pages/admin/m04_31_inventory_plan";
import { registerStockChangeCsv } from "../../pages/admin/m04_19_stock_change_csv";
import { StockApprovalListPage } from "../../pages/admin/stock_edit";
import { confirmApprove, listRows, openModalFromRow } from "../../pages/admin/m04_32_approval_list";
import { searchStockByCode, stockInRow } from "../../pages/admin/m04_02_rc_stock";
import { CB_APPROVER, CB_APPROVER_NAME, F0307_ADMIN, F0307_ADMIN_NAME, 入荷通知メールの許可をケースの間だけ設定する, 本店の店名, 棚卸計画Of } from "../../seeds/f03-07";
import { 支店URL004, 店舗表示確認商品004, 入荷待ち商品004 } from "../../seeds/f03-07";
import { ShopRestockScreens } from "../../pages/front/f03_07_branch";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 正本の外の補い（合否が補いの上に成り立つ。記録で条件付きに分ける） */
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** ケースの文の「会員A」（メールアドレスの前半＝正本の値）でログイン */
async function loginAs(front: FrontRestock, local: string, password?: string): Promise<void> {
  const m = memberOf(local);
  await front.login(m.mail, password ?? m.password);
}
const pathOf = (page: Page) => new URL(page.url()).pathname;
/** 押した結果を注記に残す */
const noteResult = (what: string, r: 押した結果) => note(`${what}: 完了の通知=${r.通知が出た ? `出た「${r.通知の文}」` : "出ない"}／ログインモーダル=${r.ログインモーダルが開いた ? "開いた" : "開かない"}／確認のモーダル=${r.確認のモーダルが開いた ? "開いた" : "開かない"}`);

/**
 * 事前準備「本店の商品一覧に表示」の前提を、手順の前に確かめる（新しいブラウザで、商品名で絞り込んだ一覧を開き、読み込み中の印・仮のカードが
 * 消えるまで待って数える）。一覧は検索サービスの索引から描かれ、シード（F0307一覧のまとめ）が送ったフィードの反映で出る。
 * 出ていなければ、通知ボタンの有無を見られない（「表示されない」が偽の合格になる・押せない）ので、手順の前で止める（未判定）。
 */
async function 一覧に出ていることを前提として確かめる(browser: Browser, 商品名: string, 支店URL = ""): Promise<void> {
  const 店 = 支店URL ? `支店（${支店URL}）` : "本店";
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let k = 0;
  try {
    await hideDebugToolbar(ctx);
    const s = new ShopRestockScreens(await ctx.newPage(), 支店URL);
    await s.一覧を開く(商品名);
    k = await s.一覧のカード(商品名).count();
  } finally {
    await ctx.close();
  }
  if (k === 0) throw new Error(`事前準備を満たさない: ${店}の商品一覧（商品名「${商品名}」で絞り込み）に商品のカードが無い（検索サービスの索引に載っていない）。通知ボタンの有無を確かめられないので手順の前で止める`);
  note(`事前準備: ${店}の商品一覧（商品名「${商品名}」で絞り込み）に商品のカードが ${k} 件出ていることを、手順の前に新しいブラウザで確かめた`);
}

/** 通知の閉じるボタン、無ければ OK ボタン。正本が「OK」を押すと書く手順で、アプリに OK ボタンが無いときの補い */
async function closeByCloseButton(front: FrontRestock, what: string): Promise<void> {
  const ok = front.通知.getByRole("button", { name: "OK", exact: true });
  if ((await ok.count()) > 0) { await ok.click(); return; }
  supplement(`${what}: 完了の通知に「OK」ボタンが無い。通知の閉じるボタンで閉じて続けた`);
  await front.通知の閉じるボタン.click();
}

// ---- 001〜003 表示 ----

caseTest("IT-F03-07-001", async ({ page, browser, step, expected }) => {
  const front = new FrontRestock(page);
  const name = 商品名Of("通知単位確認商品-001");
  const { productId } = classOf("UNIT-NM-001");
  const detail = { 規格単位のボタン: 0, 商品言語単位のボタン: 0 };
  const list = { 商品カード: 0, 通知ボタン: 0 };
  await 一覧に出ていることを前提として確かめる(browser, name);
  await step(1, async () => { await loginAs(front, "f0307-a-001"); });
  await step(2, async () => {
    await front.openDetail(productId);
    detail.規格単位のボタン = await page.locator("button.notifyme, button.notifyme-cancel").count();
    detail.商品言語単位のボタン = await front.bulkButton.count();
  });
  await step(3, async () => {
    await front.openList(name);
    // 前提: 同じ一覧に通知単位確認商品-001のカードが出ていること（出ていなければ「通知ボタンが0」は確かめにならない）
    await expect(front.listCard(name), "商品一覧に通知単位確認商品-001のカードが表示されている（通知ボタンが無いことを見る前提）").toHaveCount(1, { timeout: 60_000 });
    list.商品カード = await front.listCard(name).count();
    // 正本は「商品一覧画面には商品言語単位の通知ボタンが表示されない」。一覧の通知ボタン（.js-product-list-notify）は商品規格単位なので数えず、
    // 商品言語単位のボタン（まとめて入荷通知）を数える（2026-11-13 の流しは商品規格単位のボタンを数えて不合格にしていた）
    list.通知ボタン = await front.listBulkNotify(name).count();
    note(`商品一覧のカードの商品規格単位の通知ボタンの数: ${await front.listNotify(name).count()}（期待結果の対象外。参考）`);
  });
  await expected(async () => {
    expect.soft(detail.規格単位のボタン, "商品詳細の商品規格単位の通知ボタンの数（NM・SPの2規格）").toBe(2);
    expect.soft(detail.商品言語単位のボタン, "商品詳細の商品言語単位の通知ボタンの数").toBeGreaterThan(0);
    expect.soft(list.商品カード, "商品一覧に商品が表示されている（カードの数）").toBe(1);
    expect.soft(list.通知ボタン, "商品一覧の商品言語単位の通知ボタンの数（表示されない）").toBe(0);
  });
});

caseTest("IT-F03-07-002", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId } = classOf("STATE-NM-002");
  await step(1, async () => { await loginAs(front, "f0307-a-002"); });
  await step(2, async () => { await front.openDetail(productId); });
  await expected(async () => {
    await expect.soft(front.classButton(classOf("STATE-NM-002").classId), "NMの通知ボタン").toBeVisible();
    await expect.soft(front.classButton(classOf("STATE-SP-002").classId), "SPの通知ボタン（SP以下）").toBeVisible();
    await expect.soft(front.classButton(classOf("STATE-SPLOW-002").classId), "モデレトリープレイドの通知ボタン（SP以下）").toBeVisible();
    expect.soft(await front.bulkButton.count(), "全状態の通知ボタン（まとめて入荷通知）の数").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-07-003", async ({ page, browser, step, expected }) => {
  const front = new FrontRestock(page);
  const name = 商品名Of("高額商品確認商品-003");
  const { productId } = classOf("HIGH-NM-003");
  const list = { 商品カード: 0, 通知ボタン: 0 };
  const detail = { 商品名の表示: 0, 通知ボタン: 0 };
  await 一覧に出ていることを前提として確かめる(browser, name);
  await step(1, async () => { await loginAs(front, "f0307-a-003"); });
  await step(2, async () => {
    await front.openList(name);
    // 前提: 商品一覧に高額商品のカードが出ていること（出ていなければ通知ボタンの有無を見られない）。一覧はユニサーチの索引から描かれるので、
    // シード（S-F03-07-CASE-003）でフィードを送り、一覧に出るまで待ってある。ここでは描き終わるのを待つ
    await expect(front.listCard(name), "商品一覧に高額商品確認商品-003のカードが表示されている（通知ボタンが無いことを見る前提）").toHaveCount(1, { timeout: 60_000 });
    list.商品カード = await front.listCard(name).count();
    list.通知ボタン = await front.listNotify(name).count();
    await expect.soft(front.listNotify(name), "商品一覧の高額商品確認商品-003のカードに通知ボタンが表示されない").toHaveCount(0);
  });
  await step(3, async () => {
    await front.openDetail(productId);
    detail.商品名の表示 = await page.getByText(name).count();
    detail.通知ボタン = (await page.locator("button.notifyme, button.notifyme-cancel").count()) + (await front.bulkButton.count());
  });
  await expected(async () => {
    expect.soft(list.商品カード, "商品一覧に高額商品が表示されている（カードの数）").toBe(1);
    expect.soft(list.通知ボタン, "商品一覧の通知ボタンの数").toBe(0);
    expect.soft(detail.商品名の表示, "商品詳細に高額商品の名前が表示されている").toBeGreaterThan(0);
    expect.soft(detail.通知ボタン, "商品詳細の通知ボタンの数").toBe(0);
  });
});

// ---- 005 未ログインで通知 ----

caseTest("IT-F03-07-005", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("UNIT-NM-005");
  let r!: 押した結果;
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { r = await front.press(front.classButton(classId)); noteResult("未ログインで通知ボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "入荷通知依頼確認モーダルを経由した").toBe(false);
    expect.soft(r.ログインモーダルが開いた, "ログインモーダルが表示された").toBe(true);
  });
});

// ---- 006 保存 ----

caseTest("IT-F03-07-006", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-006");
  const { productId, classId } = classOf("UNIT-NM-006");
  let n = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await loginAs(front, "f0307-a-006"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
  await step(4, async () => { n = 規格の依頼件数(m.id, classId); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aと商品規格UNIT-NM-006を対応付けた入荷通知依頼（有効）の件数").toBe(1);
  });
});

caseTest("IT-F03-07-007", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("UNIT-NM-007");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0307-a-007"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    r = await front.press(front.classButton(classId));
    // 完了の通知は出てから5秒で自動で消えるので、出たらすぐ自動で消える時計を止め、期待結果の画像に写す
    if (r.通知が出た) {
      await front.通知が自動で消えるのを止める();
      test.info().annotations.push({ type: "手順の注記", description: "入荷通知完了の通知は出てから5秒で自動で消えるので、期待結果の画像に写すため、出た直後に自動で消える時計を止めた（通知の文・表示は画面のまま）" });
    }
    noteResult("通知ボタンを押した", r);
  });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "入荷通知依頼確認モーダルを経由した").toBe(false);
    expect.soft(r.通知が出た, "入荷通知完了モーダルが表示された").toBe(true);
    expect.soft(r.通知の文, "完了の表示の文").toMatch(/入荷通知.*(設定|完了)/);
    if (r.通知が出た) await expect.soft(front.通知, "画面に出た入荷通知完了の通知").toBeVisible();
  });
});

caseTest("IT-F03-07-008", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("EXIST-001-008");
  await step(1, async () => { await loginAs(front, "f0307-a-008"); });
  await step(2, async () => { await front.openDetail(productId); });
  await expected(async () => {
    const btn = front.classButton(classId);
    expect.soft(await front.依頼済み表示か(btn), "商品規格EXIST-001-008のボタンが依頼済み状態").toBe(true);
    expect.soft(await front.見えている文言(btn), "ボタンに見えている文言").toContain("通知待ち");
  });
});

caseTest("IT-F03-07-009", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-009");
  const { productId, classId } = classOf("EXIST-001-009");
  let n = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await loginAs(front, "f0307-a-009"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("依頼済みの通知ボタンを押した", await front.press(front.classButton(classId))); });
  await step(4, async () => { n = 規格の依頼件数(m.id, classId); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aと商品規格EXIST-001-009を対応付けた入荷通知依頼（有効）の件数（削除される）").toBe(0);
  });
});

caseTest("IT-F03-07-010", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("EXIST-001-010");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0307-a-010"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { r = await front.press(front.classButton(classId)); noteResult("依頼済みの通知ボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "入荷通知キャンセル確認モーダルを経由した").toBe(false);
    expect.soft(r.通知が出た, "入荷通知キャンセル完了モーダルが表示された").toBe(true);
    expect.soft(r.通知の文, "取消の表示の文").toMatch(/解除|キャンセル/);
  });
});

caseTest("IT-F03-07-011", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-011");
  const { productId } = classOf("BULK-NM-011");
  let n = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await loginAs(front, "f0307-a-011"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("まとめて入荷通知を押した", await front.press(front.bulkButton)); });
  await step(4, async () => { n = 言語つきの商品単位の依頼件数(m.id, productId, "JP"); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aとまとめて通知確認商品-011の日本語を対応付けた商品単位の入荷通知依頼の件数").toBe(1);
  });
});

caseTest("IT-F03-07-012", async ({ page, browser, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-012");
  const name = 商品名Of("一覧SOLDOUT商品-012");
  const { productId } = classOf("LISTSO-NM-012");
  let n = { 有効: -1, 削除済み: -1 };
  let all = -1;
  await 一覧に出ていることを前提として確かめる(browser, name);
  await step(1, async () => { await loginAs(front, "f0307-a-012"); });
  await step(2, async () => {
    await front.openList(name);
    // 前提: 商品一覧に一覧SOLDOUT商品-012のカードが出ていること。一覧はユニサーチの索引から描かれるので、
    // シード（S-F03-07-CASE-012）でフィードを送り、一覧に出るまで待ってある。ここでは描き終わるのを待つ
    await expect(front.listCard(name), "商品一覧に一覧SOLDOUT商品-012のカードが表示されている（事前準備の前提）").toHaveCount(1, { timeout: 60_000 });
  });
  await step(3, async () => { noteResult("一覧の通知ボタンを押した", await front.press(front.listNotify(name).first())); });
  await step(4, async () => { n = 商品単位の依頼件数(m.id, productId); all = 商品に属する有効な依頼件数(m.id, productId); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aと一覧SOLDOUT商品-012を対応付けた商品単位の入荷通知依頼の件数").toBe(1);
    expect.soft(all, "（参考）会員Aのこの商品に属する有効な依頼の件数（規格単位を含む）").toBeGreaterThanOrEqual(0);
  });
});

caseTest("IT-F03-07-013", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0307-a-013"); });
  await step(2, async () => { await front.openNotifyList(); names = await front.入荷待ち商品名一覧(); });
  await expected(async () => {
    expect.soft(names, "入荷待ち商品に会員Aが登録したOWN-A-001-013がある").toContain(rc("OWN-A-001-013"));
    expect.soft(names, "入荷待ち商品に会員Aが登録したOWN-A-002-013がある").toContain(rc("OWN-A-002-013"));
    expect.soft(names, "入荷待ち商品に会員BだけのOWN-B-001-013が無い").not.toContain(rc("OWN-B-001-013"));
  });
});

// ---- 014・015・019 上限（共有の設定を書き換える。ケースが終わるたびに戻す） ----

function limitCase(a: { local: string; code: string; db: "increase" | "over" | "cancel" }): CaseBody {
  return async ({ page, browser, step, expected }) => {
    const front = new FrontRestock(page);
    const m = memberOf(a.local);
    const { productId, classId } = classOf(a.code);
    const got = { 前: -1, 後: -1, 対象の依頼: { 有効: -1, 削除済み: -1 } };
    let r!: 押した結果;
    try {
      await step(1, async () => { await loginAs(front, a.local); });
      await step(2, async () => { await front.openDetail(productId); });
      await step(3, async () => {
        got.前 = 有効な依頼件数(m.id);
        r = await front.press(front.classButton(classId));
        noteResult("通知ボタンを押した", r);
      });
      await step(4, async () => { got.後 = 有効な依頼件数(m.id); got.対象の依頼 = 規格の依頼件数(m.id, classId); });
      await expected(async () => {
        if (a.db === "increase") {
          expect.soft(got.前, "押す前の会員Aの有効な入荷通知依頼件数").toBe(19);
          expect.soft(got.後, "押した後の会員Aの有効な入荷通知依頼件数（上限値の20件）").toBe(20);
        } else if (a.db === "over") {
          expect.soft(r.通知の文, "登録上限超過を示すエラーの文").toMatch(/上限/);
          expect.soft(got.後, "会員Aの有効な入荷通知依頼件数（20件のまま）").toBe(20);
          expect.soft(got.対象の依頼.有効, "LIMIT-NEW-001-015の依頼の件数（保存されない）").toBe(0);
        } else {
          expect.soft(got.後, "取消の後の会員Aの有効な入荷通知依頼件数").toBe(19);
          expect.soft(got.対象の依頼.有効, "LIMIT-EXIST-001-019の依頼の件数（削除される）").toBe(0);
        }
      });
    } finally {
      await restoreArrivalMax(browser);
    }
  };
}
caseTest("IT-F03-07-014", limitCase({ local: "f0307-a-014", code: "LIMIT-NEW-001-014", db: "increase" }));
caseTest("IT-F03-07-015", limitCase({ local: "f0307-a-015", code: "LIMIT-NEW-001-015", db: "over" }));
caseTest("IT-F03-07-019", limitCase({ local: "f0307-a-019", code: "LIMIT-EXIST-001-019", db: "cancel" }));

// ---- 020〜023 ログインモーダル ----

caseTest("IT-F03-07-020", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("UNIT-NM-020");
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
  await step(3, async () => {
    const form = page.locator("#notify-login-form");
    await expect(form, "ログインモーダルの入力欄").toBeVisible();
    await form.locator('input[name="login_email"]').fill("invalid@example.test");
    await form.locator('input[name="login_pass"]').fill("invalid-password");
  });
  await step(4, async () => {
    await page.locator("#notify-login-form button[type=submit]").click();
    await page.waitForURL(/\/mypage\/login/, { timeout: 10_000 }).catch(() => note("ログインを押しても、会員ログイン画面へ遷移しなかった"));
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page), "遷移先の画面のパス（会員ログイン画面）").toMatch(/\/mypage\/login$/);
  });
});

caseTest("IT-F03-07-021", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("UNIT-NM-021");
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
  await step(3, async () => {
    const link = front.ログインモーダル.locator('a[href$="/entry"]');
    await expect(link, "ログインモーダルの「新規会員登録」").toBeVisible();
    await Promise.all([page.waitForURL(/\/entry/, { timeout: 120_000}), link.click({ noWaitAfter: true })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page), "遷移先の画面のパス（会員登録画面）").toMatch(/\/entry$/);
  });
});

/** 022・023: ログインモーダルでログインし、戻り先の画面を確かめる */
function returnTargetCase(n: "022" | "023"): CaseBody {
  return async ({ page, step, expected, capture }) => {
    const front = new FrontRestock(page);
    const local = `f0307-a-${n}`;
    const { productId, classId } = classOf(`UNIT-NM-${n}`);
    const detailPath = `/ja/products/detail/${productId}`;
    const landed: string[] = [];
    await step(1, async () => { await front.openDetail(productId); });
    await step(2, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
    await step(3, async () => {
      const m = memberOf(local);
      const form = page.locator("#notify-login-form");
      await expect(form, "ログインモーダルの入力欄").toBeVisible();
      await form.locator('input[name="login_email"]').fill(m.mail);
      await form.locator('input[name="login_pass"]').fill(m.password);
    });
    await step(4, async () => {
      await page.locator("#notify-login-form button[type=submit]").click();
      // ログイン後の画面の読み込みが終わり、ヘッダーがログイン済みの表示になるまで待つ（待たずに撮ると、ヘッダーが「ログイン」のままの画像になっていた。2026-11-14 の 022）
      await page.waitForURL((u) => u.pathname === detailPath, { timeout: 30_000 }).catch(() => undefined);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.locator("header").getByText("ログイン", { exact: true }).first().waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
      note(`ログインを押した後の画面: ${pathOf(page)}`);
    });
    await step(5, async () => {
      await front.openMypage();
      landed.push(pathOf(page));
      if (n === "023") {
        // 1回目にマイページを開いた後の画面（商品詳細へ戻った画面）を残す
        await capture("1回目にマイページを開いた後の画面");
        await front.openMypage();
        landed.push(pathOf(page));
      }
    });
    await expected(async () => {
      if (n === "022") {
        expect.soft(landed[0], "マイページを開いた後の画面（マイページを表示せず、商品詳細画面）").toBe(detailPath);
      } else {
        expect.soft(landed[0], "1回目にマイページを開いた後の画面（保持された戻り先の商品詳細画面）").toBe(detailPath);
        expect.soft(landed[1], "2回目にマイページを開いた後の画面（マイページ）").toMatch(/\/mypage\/?$/);
      }
    });
  };
}
caseTest("IT-F03-07-022", returnTargetCase("022"));
caseTest("IT-F03-07-023", returnTargetCase("023"));

// ---- 025・026 通信の遮断 ----

function blockedCase(n: "025" | "026"): CaseBody {
  return async ({ page, step, expected }) => {
    const front = new FrontRestock(page);
    const m = memberOf(`f0307-a-${n}`);
    const { productId, classId } = classOf(n === "025" ? "UNIT-NM-025" : "EXIST-001-026");
    let before = { 依頼済み: false, 件数: { 有効: -1, 削除済み: -1 } };
    let after = { 依頼済み: false, パス: "", 件数: { 有効: -1, 削除済み: -1 } };
    let 遮断した = 0;
    await step(1, async () => { await loginAs(front, `f0307-a-${n}`); });
    await step(2, async () => { await front.openDetail(productId); before.依頼済み = await front.依頼済み表示か(front.classButton(classId)); });
    await step(3, async () => {
      // 入荷通知の依頼・取消の通信の行き先は /cart/pushReceive（Controller/Front/CartController.php の cart_push_receive）。
      // 以前は /cart/push_receive で遮断していて、実際の通信と一致せず遮断できていなかった（2026-11-13 の 025・026）
      await page.route(/\/cart\/(pushReceive|push_receive)(\?|$)/, (route) => { 遮断した++; return route.abort(); });
      note("開発者ツールのネットワーク遮断の代わりに、ブラウザの通信の中継で入荷通知の通信を遮断した");
    });
    await step(4, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
    await step(5, async () => {
      after = { 依頼済み: await front.依頼済み表示か(front.classButton(classId)), パス: pathOf(page), 件数: 規格の依頼件数(m.id, classId) };
    });
    await expected(async () => {
      // 押しても通信が出なければ「反映されない・保存されない／残る」は何もしなくても成り立つので、通信を実際に遮断したことを確かめる
      expect.soft(遮断した, "遮断した入荷通知の通信の数（ボタンを押して通信が出た）").toBeGreaterThan(0);
      expect.soft(after.パス, "押した後の画面（商品詳細画面に留まる）").toBe(`/ja/products/detail/${productId}`);
      expect.soft(after.依頼済み, "ボタンの依頼済み表示（押す前と同じ。処理結果が反映されない）").toBe(before.依頼済み);
      if (n === "025") expect.soft(after.件数.有効, "商品規格UNIT-NM-025の入荷通知依頼の件数（保存されない）").toBe(0);
      else expect.soft(after.件数.有効, "商品規格EXIST-001-026の入荷通知依頼の件数（残る）").toBe(1);
    });
  };
}
caseTest("IT-F03-07-025", blockedCase("025"));
caseTest("IT-F03-07-026", blockedCase("026"));

// ---- 036〜041 一覧からの通知 ----

function listPressCase(a: { local?: string; name: string; expect: "login" | "noConfirm" | "noCancelConfirm" | "done" | "cancelDone" }): CaseBody {
  return async ({ page, browser, step, expected }) => {
    const front = new FrontRestock(page);
    const name = 商品名Of(a.name);
    let r!: 押した結果;
    let s = 1;
    await 一覧に出ていることを前提として確かめる(browser, name);
    if (a.local) await step(s++, async () => { await loginAs(front, a.local!); });
    await step(s++, async () => {
      await front.openList(name);
      // 押す前の一覧の通知ボタンの状態を画像に残す（押す前にボタンが画面に見える位置へ寄せ、文言を注記に残す。取消のケースは「通知待ち」のはず）
      const ボタン = front.listNotify(name).first();
      if (await ボタン.waitFor({ state: "visible", timeout: 60_000 }).then(() => true, () => false)) {
        await ボタン.scrollIntoViewIfNeeded().catch(() => undefined);
        note(`押す前の一覧の通知ボタン: 文言「${(await ボタン.innerText().catch(() => "")).replace(/\s+/g, " ").trim()}」（商品「${name}」）`);
      }
    });
    // 押す前提（事前準備②「本店の商品一覧に表示」）: 一覧に商品のカードが出ていること。出ていなければ手順の外で止め、未判定にする
    // （手順の中の確かめにすると、前提が満たせなかったのに不合格になっていた。2026-11-13 の 039〜041）
    const カード = await expect(front.listCard(name)).toHaveCount(1, { timeout: 60_000 }).then(() => 1, async () => front.listCard(name).count());
    if (カード !== 1) throw new Error(`事前準備を満たさない: 本店の商品一覧（商品名「${name}」で絞り込み）に商品のカードが ${カード} 件（1件のはず。検索サービスの索引に載っていない）。通知ボタンを押せないので止める`);
    // 取消のケースは、押す前の一覧のボタンが「通知待ち」であることが前提（そうでなければ取消の操作にならない。2026-11-14 の 041 は「入荷時に通知」を押していた）
    if (a.expect === "cancelDone" || a.expect === "noCancelConfirm") {
      const 文言 = await front.見えている文言(front.listNotify(name).first());
      if (!文言.includes("通知待ち")) throw new Error(`事前準備を満たさない: 商品一覧の「${name}」の通知ボタンが「通知待ち」でない（見えている文言「${文言}」）。取消の操作にならないので止める`);
    }
    await step(s++, async () => {
      r = await front.press(front.listNotify(name).first());
      noteResult("一覧の通知ボタンを押した", r);
    });
    await expected(async () => {
      // 開いたログインモーダルそのものを確かめる（押したボタンを読んだ値で確かめると、赤枠が後ろの商品のカードに付いていた。2026-11-14 の 036）
      if (a.expect === "login") await expect.soft(front.ログインモーダル, "ログインモーダルが表示された").toBeVisible();
      if (a.expect === "noConfirm") expect.soft(r.確認のモーダルが開いた, "入荷通知依頼確認モーダルが表示された").toBe(false);
      if (a.expect === "done") expect.soft(r.通知が出た && /設定|完了/.test(r.通知の文), "入荷通知完了モーダルが表示された").toBe(true);
      if (a.expect === "cancelDone") expect.soft(r.通知が出た && /解除|キャンセル/.test(r.通知の文), "入荷通知キャンセル完了モーダルが表示された").toBe(true);
      if (a.expect === "noCancelConfirm") expect.soft(r.確認のモーダルが開いた, "入荷通知キャンセル確認モーダルが表示された").toBe(false);
      // 押しても何も起きなければ「確認モーダルが出ない」は成り立つので、押したことに画面が応じた（通知・ログインモーダルのいずれか）ことを確かめる
      if (a.expect === "noConfirm" || a.expect === "noCancelConfirm") {
        expect.soft(r.通知が出た || r.ログインモーダルが開いた || r.確認のモーダルが開いた, `押したことに画面が応じた（通知「${r.通知の文}」・ログインモーダル・モーダルのいずれか）`).toBe(true);
      }
    });
  };
}
caseTest("IT-F03-07-036", listPressCase({ name: "一覧未ログイン確認商品-036", expect: "login" }));
caseTest("IT-F03-07-037", listPressCase({ name: "一覧未ログイン確認商品-037", expect: "noConfirm" }));
caseTest("IT-F03-07-038", listPressCase({ local: "f0307-a-038", name: "一覧ログイン済み確認商品-038", expect: "done" }));
caseTest("IT-F03-07-039", listPressCase({ local: "f0307-a-039", name: "一覧ログイン済み確認商品-039", expect: "noConfirm" }));
caseTest("IT-F03-07-040", listPressCase({ local: "f0307-a-040", name: "一覧取消確認商品-040", expect: "cancelDone" }));
caseTest("IT-F03-07-041", listPressCase({ local: "f0307-a-041", name: "一覧取消確認商品-041", expect: "noCancelConfirm" }));

// ---- 044〜050 モーダルを閉じる・表示切替 ----

caseTest("IT-F03-07-044", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("F0307-044-NM");
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => {
    const r = await front.press(front.classButton(classId));
    noteResult("通知ボタンを押した", r);
    expect(r.ログインモーダルが開いた, "ログインモーダルが表示された").toBe(true);
  });
  await step(3, async () => {
    const close = front.ログインモーダル.locator("[data-js-modal-close]").first();
    note(`ログインモーダルの閉じるボタンの名前: 「${(await close.getAttribute("aria-label")) ?? ""}」`);
    await close.click();
    await page.waitForTimeout(500);
  });
  await expected(async () => {
    expect.soft(await front.ログインモーダルが開いているか(), "ログインモーダルが開いている").toBe(false);
  });
});

/** 045・047: 完了の通知の「閉じる」ボタン、046・048: 「OK」ボタン */
function closeCase(a: { local: string; code: string; cancel: boolean; button: "close" | "ok" }): CaseBody {
  return async ({ page, step, expected }) => {
    const front = new FrontRestock(page);
    const { productId, classId } = classOf(a.code);
    let r!: 押した結果;
    await step(1, async () => { await loginAs(front, a.local); });
    await step(2, async () => { await front.openDetail(productId); });
    await step(3, async () => {
      r = await front.press(front.classButton(classId));
      noteResult(a.cancel ? "依頼済みの通知ボタンを押した" : "通知ボタンを押した", r);
      expect(r.通知が出た, a.cancel ? "入荷通知キャンセル完了モーダルが表示された" : "入荷通知完了モーダルが表示された").toBe(true);
    });
    await step(4, async () => {
      if (a.button === "close") {
        await front.通知の閉じるボタン.click();
      } else {
        // 完了の通知に「OK」ボタンが無いとき（開発環境の画面は「×」だけのトースト）、押せずに時間切れ（未判定）になっていた。
        // 正本の手順の「OK」ボタンが無いことは、実装と正本の食い違いとして不合格にする
        const ok = front.通知.getByRole("button", { name: "OK", exact: true });
        await expect(ok, a.cancel ? "入荷通知キャンセル完了モーダルに「OK」ボタンがある" : "入荷通知完了モーダルに「OK」ボタンがある").toHaveCount(1, { timeout: 5000 });
        await ok.click();
      }
      await page.waitForTimeout(500);
    });
    await expected(async () => {
      expect.soft(await front.通知が出ているか(), a.cancel ? "入荷通知キャンセル完了モーダルが開いている" : "入荷通知完了モーダルが開いている").toBe(false);
    });
  };
}
caseTest("IT-F03-07-045", closeCase({ local: "f0307-a-045", code: "F0307-045-NM", cancel: false, button: "close" }));
caseTest("IT-F03-07-046", closeCase({ local: "f0307-a-046", code: "F0307-046-NM", cancel: false, button: "ok" }));
caseTest("IT-F03-07-047", closeCase({ local: "f0307-a-047", code: "F0307-047-NM", cancel: true, button: "close" }));
caseTest("IT-F03-07-048", closeCase({ local: "f0307-a-048", code: "F0307-048-NM", cancel: true, button: "ok" }));

function switchCase(a: { local: string; code: string; cancel: boolean }): CaseBody {
  return async ({ page, step, expected }) => {
    const front = new FrontRestock(page);
    const { productId, classId } = classOf(a.code);
    const got = { 依頼済み表示: false, 文言: "" };
    await step(1, async () => { await loginAs(front, a.local); });
    await step(2, async () => { await front.openDetail(productId); });
    await step(3, async () => {
      const r = await front.press(front.classButton(classId));
      noteResult(a.cancel ? "依頼済みの通知ボタンを押した" : "通知ボタンを押した", r);
      expect(r.通知が出た, "完了のモーダルが表示された").toBe(true);
    });
    await step(4, async () => {
      await closeByCloseButton(front, "完了モーダルを閉じる");
      await page.waitForTimeout(500);
      const btn = front.classButton(classId);
      got.依頼済み表示 = await front.依頼済み表示か(btn);
      got.文言 = await front.見えている文言(btn);
    });
    await expected(async () => {
      if (!a.cancel) expect.soft(got.文言, "商品規格F0307-049-NMのボタンの表示").toContain("通知待ち");
      else expect.soft(got.文言, "商品規格F0307-050-NMのボタンの表示").toContain("入荷時に通知");
      expect.soft(got.依頼済み表示, "ボタンが依頼済み状態").toBe(!a.cancel);
    });
  };
}
caseTest("IT-F03-07-049", switchCase({ local: "f0307-a-049", code: "F0307-049-NM", cancel: false }));
caseTest("IT-F03-07-050", switchCase({ local: "f0307-a-050", code: "F0307-050-NM", cancel: true }));

// ---- 051 管理画面との連携 ----

caseTest("IT-F03-07-051", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("F0307PF001-NM");
  const name = rc("連携入荷通知商品F0307PF001");
  let rows: 依頼一覧の行[] = [];
  await step(1, async () => { await loginAs(front, "f0307-pf-001", "Passw0rd-PF001"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    const r = await front.press(front.classButton(classId));
    noteResult("通知ボタンを押した", r);
    expect(r.通知が出た, "入荷通知完了モーダルが表示された").toBe(true);
    await closeByCloseButton(front, "入荷通知完了モーダルを閉じる");
  });
  await step(4, async () => { await loginAdmin(page, PF_ADMIN); });
  await step(5, async () => { await openRequestSearch(page); });
  await step(6, async () => { rows = await searchProductRequests(page, name); });
  await expected(async () => {
    expect.soft(rows.map((r) => r.商品名), "入荷通知依頼 一覧表示(検索結果)の商品名の列").toContain(name);
  });
});

// ---- 054 取消後の再依頼 ----

caseTest("IT-F03-07-054", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("dpf0307-054");
  const { productId, classId } = classOf("RE-REQ-F0307-054");
  let n = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await loginAs(front, "dpf0307-054"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("1回目の依頼", await front.press(front.classButton(classId))); });
  await step(4, async () => { await closeByCloseButton(front, "入荷通知依頼完了のモーダルを閉じる"); });
  await step(5, async () => { noteResult("依頼済みの通知ボタンで取消", await front.press(front.classButton(classId))); });
  await step(6, async () => { await closeByCloseButton(front, "入荷通知キャンセル完了のモーダルを閉じる"); });
  await step(7, async () => { noteResult("取消後の2回目の依頼", await front.press(front.classButton(classId))); });
  await step(8, async () => { n = 規格の依頼件数(m.id, classId); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aと商品規格RE-REQ-F0307-054を対応付けた有効な入荷通知依頼の件数").toBe(1);
  });
});

// ---- 055・056 入荷待ち商品・一覧の「通知待ち」表示 ----

caseTest("IT-F03-07-055", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const name = rc("F0307-CB055-GOODS");
  const { classId } = classOf("F0307-CB055-NM");
  const got = { 行: 0, 文言: "" };
  await step(1, async () => { await loginAs(front, "cbf0307-055", "Passw0rd-CBF0307055"); });
  await step(2, async () => { await front.openNotifyList(); });
  await step(3, async () => {
    const card = page.locator(".p-hareruya-product-card--notifylist").filter({ hasText: name });
    got.行 = await card.count();
    if (got.行 > 0) got.文言 = await front.見えている文言(card.locator(`button[data-productclass="${classId}"]`).first());
    note(`入荷待ち商品一覧の行のボタンの文言「${got.文言}」。文言の食い違い（依頼者の判断待ち）: 正本の期待結果は「通知待ち」、設計書（入荷待ち商品一覧 10「解除/入荷通知」）は入荷通知が設定されている規格には解除ボタンを表示するとしている`);
  });
  await expected(async () => {
    expect.soft(got.行, "入荷待ち商品一覧にF0307-CB055-GOODSの行がある").toBe(1);
    expect.soft(got.文言, "F0307-CB055-GOODSの行の入荷通知のボタンの表示（依頼済みを示す）").toContain("通知待ち");
  });
});

caseTest("IT-F03-07-056", async ({ page, browser, step, expected }) => {
  const front = new FrontRestock(page);
  const name = 商品名Of("F0307-CB056-LIST");
  const got = { カード: 0, 文言: "", ボタン数: 0 };
  await 一覧に出ていることを前提として確かめる(browser, name);
  await step(1, async () => { await loginAs(front, "cbf0307-056", "Passw0rd-CBF0307056"); });
  await step(2, async () => { await front.openList(name); });
  await step(3, async () => {
    // 前提: 同じ一覧に F0307-CB056-LIST のカードが出ていること（出ていなければボタンの表示を確かめられない）
    await expect(front.listCard(name), "商品一覧にF0307-CB056-LISTのカードが表示されている（ボタンの表示を見る前提）").toHaveCount(1, { timeout: 60_000 });
    got.カード = await front.listCard(name).count();
    got.ボタン数 = await front.listNotify(name).count();
    if (got.ボタン数 > 0) got.文言 = await front.見えている文言(front.listNotify(name).first());
  });
  await expected(async () => {
    expect.soft(got.カード, "商品一覧にF0307-CB056-LISTが表示されている").toBe(1);
    expect.soft(got.文言, "F0307-CB056-LISTの入荷通知のボタンの表示（依頼済みを示す）").toContain("通知待ち");
    expect.soft(got.文言, "「入荷時に通知」のボタンの表示がない").not.toContain("入荷時に通知");
  });
});

// ---- 017 非有効な依頼は上限の件数に入らない（入荷通知最大数は共有の設定なので書き換えない。シードが20であることを確かめる） ----

caseTest("IT-F03-07-017", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-017");
  const { productId, classId } = classOf("LIMIT-ACTIVE-NEW-017");
  const got = { 前: -1, 後: -1, 対象の依頼: { 有効: -1, 削除済み: -1 } };
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0307-a-017"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    got.前 = 有効な依頼件数(m.id);
    r = await front.press(front.classButton(classId));
    noteResult("通知ボタンを押した", r);
  });
  await step(4, async () => { got.後 = 有効な依頼件数(m.id); got.対象の依頼 = 規格の依頼件数(m.id, classId); });
  await expected(async () => {
    expect.soft(got.前, "押す前の会員Aの有効な入荷通知依頼件数（取り消し済み・削除日時つきを除く）").toBe(19);
    expect.soft(got.対象の依頼.有効, "LIMIT-ACTIVE-NEW-017の依頼が保存された").toBe(1);
    expect.soft(got.後, "新しい依頼の保存後の会員Aの有効な入荷通知依頼件数").toBe(20);
  });
});

// ---- 018 商品規格が削除されたあとに通知ボタンを押す（削除はDBでなく、管理画面の商品規格の削除で行う） ----

caseTest("IT-F03-07-018", async ({ page, browser, step, expected }) => {
  supplement("手順2「DBで商品規格を削除済みにする」は、画面で行える操作なので、管理画面の商品規格登録編集画面の「商品規格を削除」で行った（DBは書き換えていない）");
  const front = new FrontRestock(page);
  const { productId, classId } = classOf("DELETE-AFTER-OPEN-018");
  let r!: 押した結果;
  let 依頼: { 有効: number; 削除済み: number } = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => {
    await withAdminSession(browser, SETUP_ADMIN, async (admin) => {
      await openClassList(admin, productId);
      await openClassEdit(admin, productId, classId);
      await deleteClassOnEdit(admin, "DELETE-AFTER-OPEN-018", (m) => note(m));
    });
  });
  await step(3, async () => {
    r = await front.press(front.classButton(classId));
    noteResult("通知ボタンを押した", r);
  });
  await step(4, async () => { 依頼 = 規格への依頼件数(classId); });
  await expected(async () => {
    expect.soft(r.通知が出た && /削除/.test(r.通知の文), "対象商品が削除済みであることを示す通知が表示された").toBe(true);
    expect.soft(r.ログインモーダルが開いた, "ログインモーダルが表示されない").toBe(false);
    expect.soft(依頼.有効, "DELETE-AFTER-OPEN-018の入荷通知依頼が保存されない").toBe(0);
  });
});

// ---- 024 通知ボタン → 新規会員登録 → 本会員登録のURL → 商品詳細へ戻る ----

caseTest("IT-F03-07-024", async ({ page, step, expected }) => {
  supplement("手順4の「会員登録確認メールに記載されたURL」は、開発環境にメールの受け口が無いので、DBの参照で読んだ本登録用の値から組み立てたURL（/ja/entry/activate/…）で開いた");
  const front = new FrontRestock(page);
  const entry = new EntryPage(page);
  const { productId, classId } = classOf("UNIT-NM-024");
  const detailPath = `/ja/products/detail/${productId}`;
  const mail = mailOf("f0307-new");
  const landed: string[] = [];
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
  await step(3, async () => {
    const link = front.ログインモーダル.locator('a[href$="/entry"]');
    await expect(link, "ログインモーダルの「新規会員登録」").toBeVisible();
    await Promise.all([page.waitForURL(/\/entry/, { timeout: 120_000}), link.click({ noWaitAfter: true })]);
    await page.waitForLoadState("load");
    await entry.fill({
      姓: "試験会員", 名: "戻り先", セイ: "シケンカイイン", メイ: "モドリサキ", メール: mail, パスワード: "Passw0rd!f0307new",
      国: "Japan", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "0300000000",
    });
    expect((await entry.同意する()).sent, "会員情報登録画面から確認画面へ進めた").toBe(true);
    await entry.登録する();
    expect(entry.完了画面か, `会員登録を完了した（仮会員登録完了画面。いまの画面 ${entry.path}）`).toBe(true);
  });
  await step(4, async () => {
    const key = 本登録の鍵(mail);
    if (!key) throw new Error(`会員 ${mail} の本登録用の値をDBの参照で読めない`);
    await page.goto(`${BASE_URL}/ja/entry/activate/${key}`);
    await page.waitForLoadState("load");
    landed.push(pathOf(page));
  });
  await step(5, async () => { await front.openMypage(); landed.push(pathOf(page)); });
  await expected(async () => {
    expect.soft(landed[0], "手順4の後の画面（会員登録完了の画面ではなく、通知単位確認商品-024の商品詳細画面）").toBe(detailPath);
    expect.soft(landed[1], "手順5の後の画面（マイページ）").toMatch(/\/mypage\/?$/);
  });
});

// =====================================================================================
// 029〜035・042・043・053・057・058 入荷通知メール、052 連携の集計（2026-11-12 追加）
// - 入荷通知メールの許可は共有の設定。事前準備で前提の値にし、ケースの終わりに追加システム設定の全項目を画面で戻して確かめる（seeds/f03-07.ts）。
// - メールは開発環境のメールの受け口で、操作の前に控えた番号より後に、会員のメールアドレスあてに届いたものだけを数える。
//   「届かない」を確かめるケース（029・043）は、在庫が実際に0から1になったこと（操作が行われたこと）も確かめ、届くまでの待ちと同じ時間（2分）待ってから数える。
// - 「商品規格の登録更新で在庫を0から1へ変更する」: 商品規格登録編集画面の在庫数は表示だけで入力欄が無い（画面で確かめて注記に残す）。
//   在庫の変更は、在庫編集（入庫/その他・1）とその承認で行った（正本の外の補い）。
// =====================================================================================

const メールの待ち = 120_000;

/** 操作の前に控えた番号より後に、宛先あてに届いたメール（本文つき）。期待の通数が届くまで待つ。0通を確かめるときは待ちの時間いっぱい待つ */
async function 届いたメール(宛先: string, before: Set<number>, 期待の通数: number): Promise<{ id: number; subject: string; 本文: string }[]> {
  const deadline = Date.now() + メールの待ち;
  for (;;) {
    const got = await mailsTo(宛先, before);
    if ((期待の通数 > 0 && got.length >= 期待の通数) || Date.now() > deadline) {
      return Promise.all(got.map(async (m) => ({ ...m, 本文: await mailText(m.id) })));
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}
const メールの様子 = (ms: { id: number; subject: string }[]) => ms.map((m) => `#${m.id}「${m.subject}」`).join("、") || "なし";

/** 商品規格の登録更新の画面で在庫を変えられるかを確かめ、変えられないので在庫編集（入庫/その他）と承認で本店のEC-CUBE在庫を 0→1 にする */
async function 在庫を0から1にする(page: Page, browser: Browser, 正本の商品コード: string, caseId: string): Promise<void> {
  const { productId, classId } = classOf(正本の商品コード);
  const 欄 = await 商品規格の在庫の欄(page, productId, classId);
  if (欄.入力欄 > 0) throw new Error(`商品規格登録編集画面に在庫の入力欄がある（${欄.入力欄}個）。この画面で在庫を変える作りを実装していない`);
  supplement(`商品規格 ${classOf(正本の商品コード).商品コード} の商品規格登録編集画面の在庫数は表示だけ（「${欄.表示}」）で入力欄が無い。在庫の変更は、在庫編集（入庫/その他・在庫増減数1・仕入単価0）を登録し、別の管理者が承認して本店のEC-CUBE在庫を0から1にした`);
  await 在庫を増減して承認する(browser, caseId, [{ 商品コード: classOf(正本の商品コード).商品コード, 数: 1, 区分: "入庫/その他", 承認後の在庫: 1 }], (m) => note(m));
  // 在庫が1になったことを、この画面（試験管理者）の在庫検索一覧で確かめ、手順の画像に残す（画像が在庫0の商品規格登録画面のままだった。2026-11-14 の 029・032・033）
  const 店 = await 本店の店名(page);
  const 商品コード = classOf(正本の商品コード).商品コード;
  const s = await searchStockByCode(page, { 商品コード, 店舗: 店, 在庫区分: "EC-CUBE" });
  expect(await stockInRow(s.row(商品コード, 店, "EC-CUBE")), `在庫検索一覧の商品規格 ${商品コード} の本店のEC-CUBE在庫（0から1になった）`).toBe(1);
}

type 一通の形 = { n: string; local: string; code: string; 設定: "送信する" | "送信しない"; 期待: number; 商品名: string };

/** 029・032: 登録更新で 0→1 にして、受信箱を確かめる */
function 一通のケース(a: 一通の形): CaseBody {
  return async ({ page, browser, step, expected }) => {
    note(await 入荷通知メールの許可をケースの間だけ設定する(browser, a.設定));
    await loginAdmin(page, F0307_ADMIN);
    const 宛先 = memberOf(a.local).mail;
    const before = await mailIds();
    let 在庫を変えた = false;
    let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
    await step(1, async () => { await 在庫を0から1にする(page, browser, a.code, `IT-F03-07-${a.n}`); 在庫を変えた = true; });
    await step(2, async () => { ms = await 届いたメール(宛先, before, a.期待); note(`${宛先} あてに届いたメール: ${メールの様子(ms)}`); });
    await expected(async () => {
      expect.soft(在庫を変えた, `商品規格 ${rc(a.code)} の本店のEC-CUBE在庫を0から1にした（承認後の在庫1を在庫検索一覧で確かめた）`).toBe(true);
      expect.soft(ms.length, `会員A（${宛先}）あてに届いた入荷通知メールの通数（入荷通知メールの許可「${a.設定}」）`).toBe(a.期待);
      if (a.期待 > 0) expect.soft(ms[0]?.本文 ?? "", "入荷通知メールの本文に入荷した商品の商品名がある").toContain(rc(a.商品名));
    });
  };
}
caseTest("IT-F03-07-029", 一通のケース({ n: "029", local: "f0307-a-029", code: "MAIL-ONE-001-029", 設定: "送信しない", 期待: 0, 商品名: "入荷通知メール確認商品-029" }));
caseTest("IT-F03-07-032", 一通のケース({ n: "032", local: "f0307-a-032", code: "MAIL-UPDATE-001-032", 設定: "送信する", 期待: 1, 商品名: "入荷通知メール確認商品-032" }));

/** 030・053: 棚卸計画の在庫反映で 0→1 にする */
async function 棚卸の在庫反映を実行する(page: Page, 正本の棚卸名: string): Promise<string[]> {
  const plan = 棚卸計画Of(正本の棚卸名);
  const edit = new InventoryPlanEditPage(page);
  await edit.openById(plan.計画ID);
  const 名 = await edit.name();
  if (名 !== rc(正本の棚卸名)) throw new Error(`棚卸計画ID ${plan.計画ID} の棚卸名が「${名}」（「${rc(正本の棚卸名)}」のはず）`);
  await edit.pressReflect();
  const m = await pressReflectExecute(page);
  if (m.エラー.length) throw new Error(`棚卸結果の在庫反映でエラー: ${m.エラー.join(" / ")}`);
  return m.成功;
}

caseTest("IT-F03-07-030", async ({ page, browser, step, expected }) => {
  note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
  await loginAdmin(page, F0307_ADMIN);
  const 宛先 = memberOf("f0307-a-030").mail;
  const before = await mailIds();
  let 反映: string[] = [];
  let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(1, async () => {
    反映 = await 棚卸の在庫反映を実行する(page, "F0307棚卸-030");
    note(`棚卸結果の在庫反映の結果: ${反映.join(" / ") || "（成功の表示なし）"}`);
  });
  await step(2, async () => { ms = await 届いたメール(宛先, before, 1); note(`${宛先} あてに届いたメール: ${メールの様子(ms)}`); });
  await expected(async () => {
    expect.soft(反映.length, "棚卸結果の在庫反映が成功した（成功の表示）").toBeGreaterThan(0);
    expect.soft(ms.length, `会員A（${宛先}）あてに届いた入荷通知メールの通数`).toBe(1);
    expect.soft(ms[0]?.本文 ?? "", "入荷通知メールの本文に商品規格 MAIL-ONE-001-030 の商品の商品名がある").toContain(rc("入荷通知メール確認商品-030"));
  });
});

caseTest("IT-F03-07-033", async ({ page, browser, step, expected }) => {
  note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
  await loginAdmin(page, F0307_ADMIN);
  const 会員たち = ["f0307-a-033", "f0307-b-033", "f0307-c-033"].map((l) => memberOf(l).mail);
  const before = await mailIds();
  const 届いた: Record<string, { id: number; subject: string }[]> = {};
  await step(1, async () => { await 在庫を0から1にする(page, browser, "MAIL-ORDER-001-033", "IT-F03-07-033"); });
  await step(2, async () => {
    for (const a of 会員たち) 届いた[a] = await 届いたメール(a, before, 1);
    note(会員たち.map((a, i) => `会員${"ABC"[i]}（${a}）: ${メールの様子(届いた[a])}`).join("／"));
  });
  await expected(async () => {
    会員たち.forEach((a, i) => expect.soft(届いた[a]?.length, `会員${"ABC"[i]}（${a}）あてに届いた入荷通知メールの通数`).toBe(1));
    const 順 = 会員たち.map((a) => 届いた[a]?.[0]?.id ?? -1);
    expect.soft(順[0] < 順[1] && 順[1] < 順[2], `送信順が依頼の登録日時の昇順（会員A→B→C）になっている（受け口の受信の番号 A=${順[0]}・B=${順[1]}・C=${順[2]}）`).toBe(true);
  });
});

caseTest("IT-F03-07-034", async ({ page, browser, step, expected }) => {
  note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
  await loginAdmin(page, F0307_ADMIN);
  const m = memberOf("f0307-a-034");
  const { classId } = classOf("MAIL-ONE-001-034");
  const before = await mailIds();
  let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
  let 件数 = { 有効: -1, 削除済み: -1 };
  await step(1, async () => { await 在庫を0から1にする(page, browser, "MAIL-ONE-001-034", "IT-F03-07-034"); });
  await step(2, async () => {
    ms = await 届いたメール(m.mail, before, 1);
    note(`${m.mail} あてに届いたメール: ${メールの様子(ms)}`);
    if (ms.length === 0) throw new Error("会員Aへの入荷通知メールが届かず、「送信された後」の DB の確かめに進めない");
    件数 = 規格の依頼件数(m.id, classId);
  });
  await expected(async () => {
    expect.soft(ms.length, "会員Aへの入荷通知メールが送信された（通数）").toBeGreaterThanOrEqual(1);
    expect.soft(件数.有効, `DB: 会員A（会員ID ${m.id}）と商品規格（商品規格ID ${classId}）の入荷通知依頼のうち、削除日時の無い依頼の件数（メール送信後も残る）`).toBe(1);
  });
});

caseTest("IT-F03-07-035", async ({ page, browser, step, expected }) => {
  note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
  await loginAdmin(page, F0307_ADMIN);
  const 宛先 = memberOf("f0307-a-035").mail;
  const code = "MAIL-ONE-001-035";
  const before = await mailIds();
  let 一通目: Awaited<ReturnType<typeof 届いたメール>> = [];
  let 二通目まで: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(1, async () => { await 在庫を0から1にする(page, browser, code, "IT-F03-07-035"); });
  await step(2, async () => {
    一通目 = await 届いたメール(宛先, before, 1);
    note(`1回目の入荷のあと ${宛先} あてに届いたメール: ${メールの様子(一通目)}`);
    expect(一通目.length, "1回目の入荷で会員Aへ入荷通知メールが1通届いている").toBe(1);
  });
  await step(3, async () => {
    await 在庫を増減して承認する(browser, "IT-F03-07-035", [{ 商品コード: rc(code), 数: -1, 区分: "廃棄/廃棄(その他)", 承認後の在庫: 0 }], (m) => note(m));
    note("在庫を0へ戻すのは、在庫編集（廃棄/廃棄(その他)・-1。廃棄は負の数で入れる）とその承認で行った（承認後の在庫0を在庫検索一覧で確かめた）");
  });
  await step(4, async () => { await 在庫を0から1にする(page, browser, code, "IT-F03-07-035"); });
  await step(5, async () => { 二通目まで = await 届いたメール(宛先, before, 2); note(`2回目の入荷のあと ${宛先} あてに届いたメール: ${メールの様子(二通目まで)}`); });
  await expected(async () => {
    expect.soft(二通目まで.length, "会員Aあての入荷通知メールが、再入荷で2通目まで届いている（通数）").toBe(2);
    expect.soft(二通目まで[1]?.本文 ?? "", "2通目の本文に商品の商品名がある").toContain(rc("入荷通知メール確認商品-035"));
  });
});

/** 042・043: 一覧で「入荷時に通知」を押し、NM（042）・SP（043）の在庫を 0→1 にする */
function 一覧から依頼するケース(a: { n: "042" | "043"; 入荷: "NM" | "SP"; 期待: number }): CaseBody {
  return async ({ page, browser, step, expected }) => {
    note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
    const front = new FrontRestock(page);
    const name = 商品名Of(a.n === "042" ? "一覧NM入荷確認商品-042" : "一覧非NM入荷確認商品-043");
    const 宛先 = memberOf(`f0307-a-${a.n}`).mail;
    const before = await mailIds();
    let 押した!: 押した結果;
    let 在庫を変えた = false;
    let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
    await 一覧に出ていることを前提として確かめる(browser, name);
    await step(1, async () => { await loginAs(front, `f0307-a-${a.n}`); });
    await step(2, async () => {
      await front.openList(name);
      await expect(front.listCard(name), "商品一覧に商品が表示されている").toHaveCount(1, { timeout: 60_000 });
    });
    await step(3, async () => {
      押した = await front.press(front.listNotify(name).first());
      noteResult("一覧の「入荷時に通知」を押した", 押した);
      expect(押した.通知が出た, "依頼の完了の通知が出た").toBe(true);
    });
    await step(4, async () => {
      await page.context().clearCookies();
      await loginAdmin(page, F0307_ADMIN);
      await 在庫を0から1にする(page, browser, `F0307-${a.n}-${a.入荷}`, `IT-F03-07-${a.n}`);
      在庫を変えた = true;
    });
    await step(5, async () => { ms = await 届いたメール(宛先, before, a.期待); note(`${宛先} あてに届いたメール: ${メールの様子(ms)}`); });
    await expected(async () => {
      expect.soft(押した.通知が出た, `手順3の依頼が登録された（通知「${押した.通知の文}」）`).toBe(true);
      expect.soft(在庫を変えた, `商品規格 F0307-${a.n}-${a.入荷} の本店のEC-CUBE在庫を0から1にした`).toBe(true);
      expect.soft(ms.length, `会員A（${宛先}）あてに届いた入荷通知メールの通数`).toBe(a.期待);
    });
  };
}
caseTest("IT-F03-07-042", 一覧から依頼するケース({ n: "042", 入荷: "NM", 期待: 1 }));
caseTest("IT-F03-07-043", 一覧から依頼するケース({ n: "043", 入荷: "SP", 期待: 0 }));

caseTest("IT-F03-07-053", async ({ page, browser, step, expected }) => {
  note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
  await loginAdmin(page, F0307_ADMIN);
  const 宛先 = memberOf("dpf0307-053").mail;
  const before = await mailIds();
  let 反映: string[] = [];
  let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(1, async () => { 反映 = await 棚卸の在庫反映を実行する(page, "F0307棚卸-053"); note(`棚卸結果の在庫反映の結果: ${反映.join(" / ") || "（成功の表示なし）"}`); });
  await step(2, async () => { ms = await 届いたメール(宛先, before, 2); note(`${宛先} あてに届いたメール: ${メールの様子(ms)}`); });
  await expected(async () => {
    expect.soft(反映.length, "棚卸結果の在庫反映が成功した（成功の表示）").toBeGreaterThan(0);
    expect.soft(ms.length, `会員A（${宛先}）あてに届いた入荷通知メールの通数（計2件）`).toBe(2);
    expect.soft(ms.filter((m) => m.本文.includes(rc("同時入荷商品A-F0307-053"))).length, "商品規格 MAIL-TWO-A-F0307-053（同時入荷商品A）の入荷通知メールの通数").toBe(1);
    expect.soft(ms.filter((m) => m.本文.includes(rc("同時入荷商品B-F0307-053"))).length, "商品規格 MAIL-TWO-B-F0307-053（同時入荷商品B）の入荷通知メールの通数").toBe(1);
  });
});

/** 057・058: 在庫変更CSV登録 → 承認用管理者が在庫編集承認一覧でその行を開いて承認する */
function CSVで入庫するケース(a: { n: "057" | "058"; local: string; code: string; 商品名: string }): CaseBody {
  return async ({ page, browser, step, expected, capture }) => {
    note(await 入荷通知メールの許可をケースの間だけ設定する(browser, "送信する"));
    const 宛先 = memberOf(a.local).mail;
    const 本店 = await withAdminSession(browser, SETUP_ADMIN, (p) => 本店の店名(p));
    const 前の行 = await withAdminSession(browser, CB_APPROVER, async (p) => {
      const list = new StockApprovalListPage(p);
      await list.open(本店);
      return new Set((await list.rowValues()).map((r) => r.id));
    });
    await loginAdmin(page, F0307_ADMIN);
    const before = await mailIds();
    let 承認: { 成功: string[]; エラー: string[] } = { 成功: [], エラー: [] };
    let 在庫 = -1;
    let ms: Awaited<ReturnType<typeof 届いたメール>> = [];
    await step(1, async () => {
      await registerStockChangeCsv(page, {
        店舗: 本店, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: `F0307-CB${a.n}試験`, 承認者: CB_APPROVER_NAME,
        行: [{ 商品コード: rc(a.code), 在庫増減数: "1", 仕入単価: "1" }], ファイル名: `f0307-cb${a.n}-${Date.now()}.csv`,
      }, `IT-F03-07-${a.n} の在庫変更CSV登録`, (w) => note(w));
      note("在庫変動区分の「入庫の区分」は「入庫/その他」を選んだ");
    });
    await step(2, async () => {
      await page.context().clearCookies();
      await loginAdmin(page, CB_APPROVER);
      const list = new StockApprovalListPage(page);
      await list.open(本店);
      const rows = (await listRows(page)).filter((r) => r.id && !前の行.has(r.id) && r.承認状態 === "未承認" && r.登録者 === F0307_ADMIN_NAME);
      if (rows.length !== 1) throw new Error(`在庫編集承認一覧に、手順1で増えた未承認の行が ${rows.length} 件（1件のはず）`);
      await openModalFromRow(page, rows[0]);
      await capture("承認の確認モーダル");
      承認 = (await confirmApprove(page)).メッセージ;
      const s = await searchStockByCode(page, { 商品コード: rc(a.code), 店舗: 本店, 在庫区分: "EC-CUBE" });
      在庫 = await stockInRow(s.row(rc(a.code), 本店, "EC-CUBE"));
      note(`承認の結果: ${承認.成功.join(" / ") || "なし"}${承認.エラー.length ? `（エラー ${承認.エラー.join(" / ")}）` : ""}／承認後の本店のEC-CUBE在庫 ${在庫}`);
    });
    await step(3, async () => { ms = await 届いたメール(宛先, before, 1); note(`${宛先} あてに届いたメール: ${メールの様子(ms)}`); });
    await expected(async () => {
      expect.soft(承認.エラー, "承認でエラーが出ていない").toEqual([]);
      expect.soft(在庫, `承認後の商品規格 ${rc(a.code)} の本店のEC-CUBE在庫（0から1）`).toBe(1);
      expect.soft(ms.length, `会員A（${宛先}）あてに届いた入荷通知メールの通数`).toBe(1);
      expect.soft(ms[0]?.本文 ?? "", "入荷通知メールの本文に商品の商品名がある").toContain(rc(a.商品名));
    });
  };
}
caseTest("IT-F03-07-057", CSVで入庫するケース({ n: "057", local: "cbf0307-057", code: "F0307-CB057-NM", 商品名: "F0307-CB057-GOODS" }));
caseTest("IT-F03-07-058", CSVで入庫するケース({ n: "058", local: "cbf0307-058", code: "F0307-CB058-SP", 商品名: "F0307-CB058-CARD" }));

caseTest("IT-F03-07-052", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const name = rc("連携入荷通知商品F0307PF002");
  const { productId, classId: nm } = classOf("F0307PF002-NM");
  const { classId: sp } = classOf("F0307PF002-SP");
  const 押した: 押した結果[] = [];
  let rows: 依頼一覧の行[] = [];
  await step(1, async () => { await loginAs(front, "f0307-pf-002", "Passw0rd-PF002"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    const r = await front.press(front.classButton(nm));
    押した.push(r); noteResult("NM の行の「入荷時に通知」", r);
    await closeByCloseButton(front, "NM の入荷通知完了");
  });
  await step(4, async () => {
    const r = await front.press(front.classButton(sp));
    押した.push(r); noteResult("SP の行の「入荷時に通知」", r);
    await closeByCloseButton(front, "SP の入荷通知完了");
  });
  await step(5, async () => { await loginAdmin(page, PF_ADMIN); });
  await step(6, async () => { await openRequestSearch(page); });
  await step(7, async () => { rows = await searchProductRequests(page, name); note(`検索結果: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    expect.soft(押した.map((r) => r.通知が出た), "NM・SP の2つの依頼の完了の通知が出た").toEqual([true, true]);
    expect.soft(rows.length, "検索結果の行数").toBe(1);
    expect.soft(rows[0]?.商品ID, "商品ID").toBe(productId);
    expect.soft(rows[0]?.言語, "言語").toBe("日本語");
    expect.soft(rows[0]?.商品名, "商品名").toBe(name);
    expect.soft(rows[0]?.通知待ち, "通知待ち（同じ商品の2規格への依頼が1件として集計される）").toBe("1");
  });
});

// ---- 004 本店と支店での表示 ----

caseTest("IT-F03-07-004", async ({ page, browser, notes, step, expected }) => {
  const a = memberOf("f0307-a-004");
  const 商品ID = notes.get("〔商品ID-F0307-004〕");
  const 規格ID = notes.get("〔商品規格ID-F0307-004〕");
  const name = 店舗表示確認商品004();
  const 待ち = [入荷待ち商品004(1), 入荷待ち商品004(2)];
  const 本店 = new ShopRestockScreens(page);
  const 支店 = new ShopRestockScreens(page, 支店URL004);
  const 結果 = {
    本店: { 一覧: { 商品カード: 0, 通知ボタン: 0 }, 詳細: { 応答: 0, 商品名の表示: 0, 通知ボタン: 0 }, 規格の通知ボタン: 0, 入荷待ち: { 応答: 0, アドレス: "", メニューから開いた: false, 商品名: [] as string[], 通知ボタン: 0 } },
    支店: { 一覧: { 商品カード: 0, 通知ボタン: 0 }, 詳細: { 応答: 0, 商品名の表示: 0, 通知ボタン: 0 }, 規格の通知ボタン: 0, 入荷待ち: { 応答: 0, アドレス: "", メニューから開いた: false, 商品名: [] as string[], 通知ボタン: 0 } },
  };
  /** 一覧・詳細・入荷待ち商品を順に開いて読む（一覧は、検索サービスから描かれる商品カードが出るのを待ってから数える） */
  const 三画面を読む = async (s: ShopRestockScreens, r: typeof 結果.本店, 店: string) => {
    await s.一覧を開く(name);
    await s.一覧のカード(name).first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => note(`${店}の商品一覧に「${name}」のカードが60秒たっても出なかった`));
    r.一覧 = await s.一覧を読む(name);
    r.詳細 = await s.詳細を開いて読む(商品ID, name);
    r.規格の通知ボタン = await s.規格の通知ボタン(規格ID).count();
    r.入荷待ち = await s.入荷待ち商品を開いて読む();
    note(`${店}: 商品一覧のカード ${r.一覧.商品カード}・通知ボタン ${r.一覧.通知ボタン}／商品詳細の応答 ${r.詳細.応答}・通知ボタン ${r.詳細.通知ボタン}／入荷待ち商品（${r.入荷待ち.メニューから開いた ? "マイページのメニューから" : "メニューが無くアドレスで"}開いた。応答 ${r.入荷待ち.応答}・${r.入荷待ち.アドレス}）の商品 ${r.入荷待ち.商品名.length} 件・通知ボタン ${r.入荷待ち.通知ボタン}`);
  };
  // 前提: 店舗表示確認商品が本店と支店の両方の商品一覧に出ていること（支店で「通知ボタンが表示されない」を見る前提）
  await 一覧に出ていることを前提として確かめる(browser, name);
  await 一覧に出ていることを前提として確かめる(browser, name, 支店URL004);
  await step(1, async () => {
    expect(await 本店.ログイン画面を開く(), "本店のログイン画面にログインの入力欄がある（開始時はログアウト状態）").toBe(true);
    await 本店.ログインする(a.mail, a.password);
  });
  await step(2, async () => { await 三画面を読む(本店, 結果.本店, "本店"); });
  await step(3, async () => {
    if (!(await 支店.ログイン画面を開く())) {
      // 本店でのログインが支店にも及び、支店のログイン画面がマイページへ移った。同じ認証情報でのログインを行うため、支店でログアウトしてからログインする
      note("支店のログイン画面を開くと、本店でのログインのままマイページへ移った。支店でログアウトしてから、支店のログイン画面で同じメールアドレスとパスワードでログインした");
      await 支店.ログアウトする();
      expect(await 支店.ログイン画面を開く(), "支店でログアウトしたあと、支店のログイン画面にログインの入力欄がある").toBe(true);
    }
    await 支店.ログインする(a.mail, a.password);
    note(`支店でログインしたあとの画面のアドレス: ${new URL(page.url()).pathname}`);
  });
  await step(4, async () => { await 三画面を読む(支店, 結果.支店, "支店"); });
  await expected(async () => {
    // 本店の3画面には入荷時通知機能が表示される
    expect.soft(結果.本店.一覧.商品カード, "本店の商品一覧に店舗表示確認商品が表示されている（カードの数）").toBe(1);
    expect.soft(結果.本店.一覧.通知ボタン, "本店の商品一覧の店舗表示確認商品の通知ボタンの数（表示される）").toBeGreaterThan(0);
    expect.soft(結果.本店.規格の通知ボタン, "本店の商品詳細の、店舗表示確認商品の商品規格の通知ボタン（表示される）").toBe(1);
    expect.soft(待ち.every((n) => 結果.本店.入荷待ち.商品名.includes(n)), `本店のマイページ＞入荷待ち商品に、会員Aの依頼の2商品（${待ち.join("・")}）が表示される（表示された商品: ${結果.本店.入荷待ち.商品名.join("・") || "なし"}）`).toBe(true);
    expect.soft(結果.本店.入荷待ち.通知ボタン, "本店のマイページ＞入荷待ち商品の通知待ちのボタンの数（表示される）").toBeGreaterThan(0);
    // 支店の3画面には表示されない（商品・画面そのものは出ていることを先に確かめる）
    expect.soft(結果.支店.一覧.商品カード, "支店の商品一覧に店舗表示確認商品が表示されている（カードの数。通知ボタンが無いことを見る前提）").toBe(1);
    expect.soft(結果.支店.一覧.通知ボタン, "支店の商品一覧の店舗表示確認商品の通知ボタンの数（表示されない）").toBe(0);
    expect.soft(結果.支店.詳細.商品名の表示, "支店の商品詳細に店舗表示確認商品の名前が表示されている（通知ボタンが無いことを見る前提）").toBeGreaterThan(0);
    expect.soft(結果.支店.詳細.通知ボタン, "支店の商品詳細の通知ボタンの数（表示されない）").toBe(0);
    expect.soft(結果.支店.入荷待ち.アドレス, "支店のマイページ＞入荷待ち商品を、支店のアドレスで開いた").toContain(`/${支店URL004}/`);
    expect.soft(結果.支店.入荷待ち.アドレス, "支店のマイページ＞入荷待ち商品を開いた画面がログイン画面でない（ログインしたままで見た）").not.toMatch(/\/mypage\/login/);
    expect.soft(結果.支店.入荷待ち.商品名.length, "支店のマイページ＞入荷待ち商品に表示された入荷待ちの商品の数（表示されない）").toBe(0);
    expect.soft(結果.支店.入荷待ち.通知ボタン, "支店のマイページ＞入荷待ち商品の通知待ちのボタンの数（表示されない）").toBe(0);
  });
  note("会員B相当の依頼は、2人目の会員を画面で登録し、その会員が画面で依頼して代えた（シード）");
});
