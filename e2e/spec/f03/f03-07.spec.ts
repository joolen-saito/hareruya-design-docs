/** F03-07 入荷時通知。正本: cases/F03-07_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import {
  商品に属する有効な依頼件数, 規格の依頼件数, 商品単位の依頼件数, 有効な依頼件数,
} from "../../db/f03_07";
import { loginAdmin } from "../../lib/session";
import { openRequestSearch, searchProductRequests, 依頼一覧の行 } from "../../pages/admin/f03_07_restock";
import { FRONT, FrontRestock, 押した結果 } from "../../pages/front/f03_07_restock_notify";
import { classOf, memberOf, PF_ADMIN, restoreArrivalMax } from "../../seeds/f03-07";
import { Page } from "@playwright/test";

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

/** 通知の閉じるボタン、無ければ OK ボタン。正本が「OK」を押すと書く手順で、アプリに OK ボタンが無いときの補い */
async function closeByCloseButton(front: FrontRestock, what: string): Promise<void> {
  const ok = front.通知.getByRole("button", { name: "OK", exact: true });
  if ((await ok.count()) > 0) { await ok.click(); return; }
  supplement(`${what}: 完了の通知に「OK」ボタンが無い。通知の閉じるボタンで閉じて続けた`);
  await front.通知の閉じるボタン.click();
}

// ---- 001〜003 表示 ----

caseTest("IT-F03-07-001", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const name = rc("通知単位確認商品-001");
  const { productId } = classOf("UNIT-NM-001");
  const detail = { 規格単位のボタン: 0, 商品言語単位のボタン: 0 };
  const list = { 商品カード: 0, 通知ボタン: 0 };
  await step(1, async () => { await loginAs(front, "f0307-a-001"); });
  await step(2, async () => {
    await front.openDetail(productId);
    detail.規格単位のボタン = await page.locator("button.notifyme, button.notifyme-cancel").count();
    detail.商品言語単位のボタン = await front.bulkButton.count();
  });
  await step(3, async () => {
    await front.openList(name);
    list.商品カード = await front.listCard(name).count();
    list.通知ボタン = await front.listNotify(name).count();
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
    expect.soft(front.classButton(classOf("STATE-NM-002").classId), "NMの通知ボタン").toBeVisible();
    expect.soft(front.classButton(classOf("STATE-SP-002").classId), "SPの通知ボタン（SP以下）").toBeVisible();
    expect.soft(front.classButton(classOf("STATE-SPLOW-002").classId), "モデレトリープレイドの通知ボタン（SP以下）").toBeVisible();
    expect.soft(await front.bulkButton.count(), "全状態の通知ボタン（まとめて入荷通知）の数").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-07-003", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const name = rc("高額商品確認商品-003");
  const { productId } = classOf("HIGH-NM-003");
  const list = { 商品カード: 0, 通知ボタン: 0 };
  const detail = { 商品名の表示: 0, 通知ボタン: 0 };
  await step(1, async () => { await loginAs(front, "f0307-a-003"); });
  await step(2, async () => {
    await front.openList(name);
    list.商品カード = await front.listCard(name).count();
    list.通知ボタン = await front.listNotify(name).count();
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
  await step(3, async () => { r = await front.press(front.classButton(classId)); noteResult("通知ボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "入荷通知依頼確認モーダルを経由した").toBe(false);
    expect.soft(r.通知が出た, "入荷通知完了モーダルが表示された").toBe(true);
    expect.soft(r.通知の文, "完了の表示の文").toMatch(/入荷通知.*(設定|完了)/);
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
  await step(4, async () => { n = 商品単位の依頼件数(m.id, productId); });
  await expected(async () => {
    expect.soft(n.有効, "会員Aとまとめて通知確認商品-011の日本語を対応付けた商品単位の入荷通知依頼の件数").toBe(1);
  });
});

caseTest("IT-F03-07-012", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const m = memberOf("f0307-a-012");
  const name = rc("一覧SOLDOUT商品-012");
  const { productId } = classOf("LISTSO-NM-012");
  let n = { 有効: -1, 削除済み: -1 };
  let all = -1;
  await step(1, async () => { await loginAs(front, "f0307-a-012"); });
  await step(2, async () => { await front.openList(name); });
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
    await Promise.all([page.waitForURL(/\/entry/, { timeout: 10_000 }), link.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page), "遷移先の画面のパス（会員登録画面）").toMatch(/\/entry$/);
  });
});

/** 022・023: ログインモーダルでログインし、戻り先の画面を確かめる */
function returnTargetCase(n: "022" | "023"): CaseBody {
  return async ({ page, step, expected }) => {
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
      await page.waitForLoadState("load");
      await page.waitForTimeout(1500);
      note(`ログインを押した後の画面: ${pathOf(page)}`);
    });
    await step(5, async () => {
      await front.openMypage();
      landed.push(pathOf(page));
      if (n === "023") {
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
    await step(1, async () => { await loginAs(front, `f0307-a-${n}`); });
    await step(2, async () => { await front.openDetail(productId); before.依頼済み = await front.依頼済み表示か(front.classButton(classId)); });
    await step(3, async () => {
      await page.route(/\/cart\/push_receive/, (route) => route.abort());
      note("開発者ツールのネットワーク遮断の代わりに、ブラウザの通信の中継で入荷通知の通信を遮断した");
    });
    await step(4, async () => { noteResult("通知ボタンを押した", await front.press(front.classButton(classId))); });
    await step(5, async () => {
      after = { 依頼済み: await front.依頼済み表示か(front.classButton(classId)), パス: pathOf(page), 件数: 規格の依頼件数(m.id, classId) };
    });
    await expected(async () => {
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
  return async ({ page, step, expected }) => {
    const front = new FrontRestock(page);
    const name = rc(a.name);
    let r!: 押した結果;
    let s = 1;
    if (a.local) await step(s++, async () => { await loginAs(front, a.local!); });
    await step(s++, async () => { await front.openList(name); });
    await step(s++, async () => {
      expect(await front.listCard(name).count(), "商品一覧に商品が表示されている").toBeGreaterThan(0);
      r = await front.press(front.listNotify(name).first());
      noteResult("一覧の通知ボタンを押した", r);
    });
    await expected(async () => {
      if (a.expect === "login") expect.soft(r.ログインモーダルが開いた, "ログインモーダルが表示された").toBe(true);
      if (a.expect === "noConfirm") expect.soft(r.確認のモーダルが開いた, "入荷通知依頼確認モーダルが表示された").toBe(false);
      if (a.expect === "done") expect.soft(r.通知が出た && /設定|完了/.test(r.通知の文), "入荷通知完了モーダルが表示された").toBe(true);
      if (a.expect === "cancelDone") expect.soft(r.通知が出た && /解除|キャンセル/.test(r.通知の文), "入荷通知キャンセル完了モーダルが表示された").toBe(true);
      if (a.expect === "noCancelConfirm") expect.soft(r.確認のモーダルが開いた, "入荷通知キャンセル確認モーダルが表示された").toBe(false);
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
        await front.通知.getByRole("button", { name: "OK", exact: true }).click({ timeout: 5000 });
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
  });
  await expected(async () => {
    expect.soft(got.行, "入荷待ち商品一覧にF0307-CB055-GOODSの行がある").toBe(1);
    expect.soft(got.文言, "F0307-CB055-GOODSの行の入荷通知のボタンの表示（依頼済みを示す）").toContain("通知待ち");
  });
});

caseTest("IT-F03-07-056", async ({ page, step, expected }) => {
  const front = new FrontRestock(page);
  const name = rc("F0307-CB056-LIST");
  const got = { カード: 0, 文言: "", ボタン数: 0 };
  await step(1, async () => { await loginAs(front, "cbf0307-056", "Passw0rd-CBF0307056"); });
  await step(2, async () => { await front.openList(name); });
  await step(3, async () => {
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
