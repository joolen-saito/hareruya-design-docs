/**
 * M08-12 顧客グループ管理。正本: cases/M08-12_test_cases.tsv
 * 支払方法「試験支払A・B・C」は共有のマスタなので足さず、既にある支払方法で読み替える（seeds/m08-12.ts）。名称には実行の印が付く。
 * 全36件を実装（035 のチーム情報変更はアプリに画面が見つからないため、不合格になる形で判定する）。
 * 削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」を「OK」として押す。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 支払方法の名前, 顧客グループの件数, 顧客グループIDの保存内容, 顧客グループ名の保存内容, 名称の顧客グループの件数 } from "../../db/m08_12";
import { M08CustomerGroupPage } from "../../pages/admin/m08_customer_group";
import { LoginPage } from "../../pages/front/f06_03_login";
import { M0812_ADMIN, OTC会員, 名称, 支払ラベル, PW047, PW048 } from "../../seeds/m08-12";
import { mailOf } from "../../seeds/m08-common";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const MODAL注記 = "削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」ボタンを「OK」として押した";
const GROUP_PATH = "/admin/customer/customer_group";

caseTest("IT-M08-12-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { await g.open(); });
  await expected(async () => {
    expect.soft(await g.新規追加の状態か(), "入力フォームが新規追加の状態（顧客グループIDがアドレスに無く、名称が空）").toBe(true);
    expect.soft(await g.percentage.inputValue(), "ポイント還元率が空").toBe("");
    expect.soft(await page.locator(".card-title").first().innerText(), "入力欄の見出し").toContain("新規");
  });
});

caseTest("IT-M08-12-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: "新規遷移確認グループ", 還元率: "10" }); });
  let sent = false;
  await step(3, async () => { sent = (await g.登録する()).sent; });
  await expected(async () => {
    expect.soft(sent, "登録ボタンで送信された").toBe(true);
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面").toBe(GROUP_PATH);
    expect.soft(await g.新規追加の状態か(), "入力フォームが新規追加の状態").toBe(true);
  });
});

caseTest("IT-M08-12-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  let r: { sent: boolean; status: number | null } = { sent: false, status: null };
  await step(1, async () => { await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: "", 還元率: "" }); });
  await step(3, async () => {
    r = await g.登録する();
    if (!r.sent) note("ブラウザの入力チェックが送信を止めた（登録の要求は送られていない）");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面のまま").toMatch(/^\/admin\/customer\/customer_group/);
    expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧の行数（一覧を伴って表示されている）").toBeGreaterThan(0);
    expect.soft(r.sent, "入力チェックのためサーバーへ送信されて画面が再表示された").toBe(true);
  });
});

// ---- 削除 ----
function 削除(k: string, db確認: "消える" | "残る" | "なし", 行: "消える" | "残る" | "確認しない") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    await step(1, async () => { await g.open(); });
    await step(2, async () => { await g.削除ボタンを押す(id); });
    await step(3, async () => { note(MODAL注記); await g.モーダルで削除する(id); });
    let n = -1;
    if (db確認 !== "なし") await step(4, async () => { n = 顧客グループの件数(id); });
    await expected(async () => {
      if (db確認 === "消える") expect.soft(n, `顧客グループID ${id} の件数（削除済みのレコードとしても残らない）`).toBe(0);
      if (db確認 === "残る") expect.soft(n, `顧客グループID ${id} の件数（削除されずDBに残る）`).toBe(1);
      if (行 !== "確認しない") {
        expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面へ遷移").toBe(GROUP_PATH);
        expect.soft(await g.rowById(id).count(), `一覧の顧客グループID ${id} の行`).toBe(行 === "消える" ? 0 : 1);
      }
    });
  };
}
caseTest("IT-M08-12-023", 削除("023", "消える", "確認しない"));
caseTest("IT-M08-12-024", 削除("024", "なし", "消える"));
caseTest("IT-M08-12-025", 削除("025", "残る", "確認しない"));
caseTest("IT-M08-12-026", 削除("026", "なし", "残る"));

// ---- なりすまし対策トークン ----
function 登録トークン不正(db: boolean) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    let status: number | null = null;
    await step(1, async () => { await g.open(); });
    await step(2, async () => { await g.入れる({ 名称: "トークン不正追加", 還元率: "10" }); });
    await step(3, async () => { await page.locator('[name="admin_customer_group[_token]"]').evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
    await step(4, async () => { status = (await g.登録する()).status; });
    let n = -1;
    await step(5, async () => { note("開発者ツールのネットワーク情報の代わりに、登録要求の応答（HTTPステータス）を記録して確かめた"); if (db) n = 名称の顧客グループの件数("トークン不正追加"); });
    await expected(async () => {
      if (!db) expect.soft(status, "登録要求のHTTP応答ステータス").toBe(403);
      else expect.soft(n, "名称が「トークン不正追加」の顧客グループの件数（追加されない）").toBe(0);
    });
  };
}
caseTest("IT-M08-12-027", 登録トークン不正(false));
caseTest("IT-M08-12-028", 登録トークン不正(true));

function 削除トークン不正(db: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const k = db ? "032" : "031";
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    let status: number | null = null;
    await step(1, async () => { await g.open(); });
    await step(2, async () => {
      await g.削除ボタンを押す(id);
      await page.locator(`#delete_${id} a.btn-ec-delete`).evaluate((e) => e.setAttribute("token-for-anchor", "invalid-token"));
    });
    await step(3, async () => { note(MODAL注記); status = await g.モーダルで削除する(id); });
    let n = -1;
    await step(4, async () => {
      if (db) n = 顧客グループの件数(id);
      else note("開発者ツールのネットワーク情報の代わりに、削除要求の応答（HTTPステータス）を記録して確かめた");
    });
    await expected(async () => {
      if (!db) expect.soft(status, "削除要求のHTTP応答ステータス").toBe(403);
      else expect.soft(n, `顧客グループID ${id} の件数（削除されずDBに残る）`).toBe(1);
    });
  };
}
caseTest("IT-M08-12-031", 削除トークン不正(false));
caseTest("IT-M08-12-032", 削除トークン不正(true));

caseTest("IT-M08-12-034", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔顧客グループID-M0812-034〕");
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB: Page = await ctxB.newPage();
    const a = new M08CustomerGroupPage(page), b = new M08CustomerGroupPage(pageB);
    await loginAdmin(page, M0812_ADMIN);
    await loginAdmin(pageB, M0812_ADMIN);
    let status: number | null = null;
    await step(1, async () => { await a.open(); await b.open(); });
    await step(2, async () => { note(MODAL注記); await b.削除ボタンを押す(id); await b.モーダルで削除する(id); });
    await step(3, async () => { note(MODAL注記); await a.削除ボタンを押す(id); status = await a.モーダルで削除する(id); });
    await expected(async () => {
      expect.soft(status, "ブラウザAの削除要求のHTTP応答ステータス").toBe(404);
      expect.soft(await a.name.count(), "顧客グループ管理画面の入力フォームが表示されない").toBe(0);
      expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧が表示されない").toBe(0);
    });
  } finally {
    await ctxB.close();
  }
});

// ---- 店内注文専用でないアカウントのマイページ系画面 ----
function マイページ系(メール前半: string, pw: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    const メール = mailOf(メール前半);
    const 画面 = [
      ["購入履歴画面", "/ja/mypage/shopping_history"], ["ポイント履歴画面", "/ja/mypage/point_history"], ["ネット買取履歴画面", "/ja/mypage/purchase_history"],
      ["予約済み大会一覧画面", "/ja/mypage/event_history"], ["お問い合わせ画面", "/ja/contact"], ["お問い合わせ履歴画面", "/ja/contact/history"],
    ] as const;
    const 結果: { 名前: string; status: number; path: string; エラー: boolean }[] = [];
    await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(メール, pw); });
    for (let i = 0; i < 画面.length; i++) {
      await step(i + 2, async () => {
        const tab = await page.context().newPage();
        try {
          const res = await tab.goto(`${BASE_URL}${画面[i][1]}`, { timeout: 60_000 });
          await tab.waitForLoadState("load");
          const text = await tab.locator("body").innerText();
          結果.push({ 名前: 画面[i][0], status: res?.status() ?? 0, path: new URL(tab.url()).pathname, エラー: /システムエラー/.test(text) });
        } finally { await tab.close(); }
      });
    }
    await expected(async () => {
      for (let i = 0; i < 画面.length; i++) {
        const r = 結果[i];
        expect.soft(r?.status ?? 0, `${画面[i][0]}の応答のHTTPステータス`).toBeLessThan(400);
        expect.soft(r?.path ?? "", `${画面[i][0]}のアドレス（対象のマイページ系画面のまま）`).toBe(画面[i][1]);
        expect.soft(r?.エラー ?? true, `${画面[i][0]}にシステムエラーが表示されている`).toBe(false);
      }
    });
  };
}
caseTest("IT-M08-12-047", マイページ系("cbm0812-047", PW047));
caseTest("IT-M08-12-048", マイページ系("cbm0812-048", PW048));
void 名称;


// ====================================================================================================
// 以降: 支払方法つきの編集・保存・一覧、トークン不正の更新、店内注文専用・支店店内注文専用のアクセス制限
// ====================================================================================================
const 印注記 = "名称には実行の印が付いている（前の実行の残りと取り違えないため）。支払方法「試験支払A・B・C」は既にある支払方法で読み替えた";
const 現在日時の幅秒 = 300;
const 更新者名 = "M08-12試験管理者";

function 支払ids(notes: CaseCtx["notes"], ...ks: ("A" | "B" | "C")[]): string[] {
  return ks.map((k) => notes.get(支払ラベル[k])).sort((a, b) => Number(a) - Number(b));
}
async function 編集を開く(g: M08CustomerGroupPage, 名称の値: string): Promise<string> {
  await g.open();
  return g.名称リンクを押してIDを読む(名称の値);
}

caseTest("IT-M08-12-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const id = notes.get("〔顧客グループID-M0812-002〕");
  await step(1, async () => { await g.open(); });
  await step(2, async () => { note(印注記); await g.rowById(id).locator("td a").first().click(); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(g.idInUrl(), "編集の状態（アドレスの末尾の顧客グループID）").toBe(id);
    expect.soft(await page.locator(".card-title").first().innerText(), "入力欄の見出し").toContain("編集");
    expect.soft(await g.name.inputValue(), "名称").toBe(名称("編集前顧客グループ-002"));
    expect.soft(await g.percentage.inputValue(), "ポイント還元率").toBe("5");
    expect.soft(await g.shopFront.isChecked(), "店内注文専用アカウントが未選択").toBe(false);
    expect.soft(await g.branchFront.isChecked(), "支店店内注文専用アカウントが選択").toBe(true);
    expect.soft(await g.選択中の支払方法ID(), `支払方法は試験支払B（${支払方法の名前(notes.get(支払ラベル.B))}）だけが選択済み`).toEqual(支払ids(notes, "B"));
  });
});

caseTest("IT-M08-12-003", async ({ page, notes, step, expected }) => {
  void notes;
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { note(印注記); await 編集を開く(g, 名称("編集前顧客グループ-003")); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), g.newButton.click()]); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面").toBe(GROUP_PATH);
    expect.soft(await g.新規追加の状態か(), "新規追加の状態").toBe(true);
    expect.soft(await g.percentage.inputValue(), "ポイント還元率が空").toBe("");
    expect.soft(await g.shopFront.isChecked(), "店内注文専用アカウントが未選択").toBe(false);
    expect.soft(await g.branchFront.isChecked(), "支店店内注文専用アカウントが未選択").toBe(false);
    expect.soft(await g.選択中の支払方法ID(), "支払方法がすべて未選択").toEqual([]);
  });
});

caseTest("IT-M08-12-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  let 並び: { id: string; 名前: string }[] = [];
  await step(1, async () => { note(印注記); await g.open(); });
  await step(2, async () => { 並び = await g.支払方法の選択肢(); });
  await expected(async () => {
    const [a, b, c] = [notes.get(支払ラベル.A), notes.get(支払ラベル.B), notes.get(支払ラベル.C)];
    const ix = [a, b, c].map((x) => 並び.findIndex((o) => o.id === x));
    expect.soft(ix.every((i) => i >= 0), "試験支払A・B・Cがすべて支払方法の選択肢に表示される").toBe(true);
    expect.soft(ix[0] < ix[1] && ix[1] < ix[2], `支払方法の選択肢が表示順の降順（試験支払A=${支払方法の名前(a)}、B=${支払方法の名前(b)}、C=${支払方法の名前(c)} の順）`).toBe(true);
  });
});

type 保存 = NonNullable<ReturnType<typeof 顧客グループIDの保存内容>>;
/** 保存内容（DB）を比べる */
function 保存内容を比べる(r: ReturnType<typeof 顧客グループIDの保存内容>, v: { 名称: string; 還元率: string; 店内: boolean; 支店: boolean; 支払: string[] }, 更新を確かめる: boolean): void {
  expect.soft(r !== null, "顧客グループが保存されている").toBe(true);
  if (!r) return;
  expect.soft(r.件数, "顧客グループの件数").toBe(1);
  expect.soft(r.名称, "名称").toBe(v.名称);
  expect.soft(r.還元率, "ポイント還元率").toBe(v.還元率);
  expect.soft(r.店内注文専用, "店内注文専用アカウント").toBe(v.店内);
  expect.soft(r.支店店内注文専用, "支店店内注文専用アカウント").toBe(v.支店);
  expect.soft(r.支払方法ID, "支払方法").toEqual(v.支払);
  if (更新を確かめる) {
    expect.soft(r.更新からの秒 >= -60 && r.更新からの秒 <= 現在日時の幅秒, `更新日時が操作中の現在日時（現在から ${Math.round(r.更新からの秒)} 秒前）`).toBe(true);
    expect.soft(r.更新者, "更新者").toBe(更新者名);
  }
}

caseTest("IT-M08-12-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const n = 名称("新規GroupＡ");
  let r: ReturnType<typeof 顧客グループ名の保存内容> = null;
  await step(1, async () => { note(印注記); await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: n, 還元率: "10" }); });
  await step(3, async () => { await g.入れる({ 店内注文専用: true, 支店店内注文専用: false }); });
  await step(4, async () => { await g.支払方法を選ぶ(支払ids(notes, "A", "C")); });
  await step(5, async () => { expect((await g.登録する()).sent, "登録ボタンで送信された").toBe(true); });
  await step(6, async () => { r = 顧客グループ名の保存内容(n); });
  await expected(async () => { expect.soft(r !== null, "顧客グループが保存されている").toBe(true); 保存内容を比べる(r, { 名称: n, 還元率: "10", 店内: true, 支店: false, 支払: 支払ids(notes, "A", "C") }, true); });
});

caseTest("IT-M08-12-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const n = 名称("任意項目空グループ");
  let r: ReturnType<typeof 顧客グループ名の保存内容> = null;
  await step(1, async () => { note(印注記); await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: n, 還元率: "0" }); });
  await step(3, async () => { await g.入れる({ 店内注文専用: false, 支店店内注文専用: false }); await g.支払方法を選ぶ([]); });
  await step(4, async () => { expect((await g.登録する()).sent, "登録ボタンで送信された").toBe(true); });
  await step(5, async () => { r = 顧客グループ名の保存内容(n); });
  await expected(async () => { expect.soft(r !== null, "顧客グループが保存されている").toBe(true); 保存内容を比べる(r, { 名称: n, 還元率: "0", 店内: false, 支店: false, 支払: [] }, false); });
});

caseTest("IT-M08-12-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const id = notes.get("〔顧客グループID-M0812-008〕");
  const n = 名称("更新GroupＢ");
  let r: ReturnType<typeof 顧客グループIDの保存内容> = null;
  await step(1, async () => { note(印注記); await 編集を開く(g, 名称("編集前顧客グループ-008")); });
  await step(2, async () => { await g.入れる({ 名称: n, 還元率: "12" }); });
  await step(3, async () => { await g.入れる({ 店内注文専用: true, 支店店内注文専用: false }); });
  await step(4, async () => { await g.支払方法を選ぶ(支払ids(notes, "A", "C")); });
  await step(5, async () => { expect((await g.登録する()).sent, "登録ボタンで送信された").toBe(true); });
  await step(6, async () => { r = 顧客グループIDの保存内容(id); });
  await expected(async () => { expect.soft(r !== null, "顧客グループが保存されている").toBe(true); 保存内容を比べる(r, { 名称: n, 還元率: "12", 店内: true, 支店: false, 支払: 支払ids(notes, "A", "C") }, true); });
});

caseTest("IT-M08-12-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { note(印注記); await 編集を開く(g, 名称("編集前顧客グループ-009")); });
  await step(2, async () => { await g.入れる({ 名称: 名称("更新遷移確認グループ") }); });
  let sent = false;
  await step(3, async () => { sent = (await g.登録する()).sent; });
  await expected(async () => {
    expect.soft(sent, "登録ボタンで送信された").toBe(true);
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面").toBe(GROUP_PATH);
    expect.soft(await g.新規追加の状態か(), "入力フォームが新規追加の状態").toBe(true);
  });
});

caseTest("IT-M08-12-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  let r: { sent: boolean; status: number | null } = { sent: false, status: null };
  await step(1, async () => { note(印注記); await 編集を開く(g, 名称("編集前顧客グループ-013")); });
  await step(2, async () => { await g.入れる({ 名称: "", 還元率: "" }); });
  await step(3, async () => {
    r = await g.登録する();
    if (!r.sent) note("ブラウザの入力チェックが送信を止めた（登録の要求は送られていない）");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面のまま").toMatch(/^\/admin\/customer\/customer_group/);
    expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧の行数（一覧を伴って表示されている）").toBeGreaterThan(0);
    expect.soft(r.sent, "入力チェックのためサーバーへ送信されて画面が再表示された").toBe(true);
  });
});

function 編集して保存(k: string, 入力: { 名称?: string; 還元率?: string }, 比べる: (r: 保存) => void) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    let r: ReturnType<typeof 顧客グループIDの保存内容> = null;
    await step(1, async () => { note(印注記); await 編集を開く(g, 名称(`編集前顧客グループ-${k}`)); });
    await step(2, async () => { await g.入れる(入力); });
    await step(3, async () => { expect((await g.登録する()).sent, "登録ボタンで送信された").toBe(true); });
    await step(4, async () => { r = 顧客グループIDの保存内容(id); });
    await expected(async () => {
      expect.soft(r !== null, `顧客グループID ${id} が保存されている`).toBe(true);
      if (r) 比べる(r);
    });
  };
}
caseTest("IT-M08-12-014", 編集して保存("014", { 名称: "あ".repeat(255) }, (r) => {
  expect.soft(r.名称.length, "名称の文字数（最大255文字）").toBe(255);
  expect.soft(r.名称, "名称が「あ」255文字で更新された").toBe("あ".repeat(255));
}));
caseTest("IT-M08-12-016", 編集して保存("016", { 名称: "顧客Group１２" }, (r) => {
  expect.soft(r.名称, "名称が全角・半角を含む値に更新された").toBe("顧客Group１２");
}));
caseTest("IT-M08-12-017", 編集して保存("017", { 還元率: "0" }, (r) => {
  expect.soft(r.還元率, "ポイント還元率が下限値0に更新された").toBe("0");
}));
caseTest("IT-M08-12-018", 編集して保存("018", { 還元率: "4294967295" }, (r) => {
  expect.soft(r.還元率, "ポイント還元率が上限値4294967295に更新された").toBe("4294967295");
}));

// ---- 更新のなりすまし対策トークン ----
function 更新トークン不正(db: boolean, k: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    let status: number | null = null;
    await step(1, async () => { note(印注記); await 編集を開く(g, 名称(`編集前顧客グループ-${k}`)); });
    await step(2, async () => { await g.入れる({ 名称: "トークン不正更新" }); });
    await step(3, async () => { await page.locator('[name="admin_customer_group[_token]"]').evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
    await step(4, async () => { status = (await g.登録する()).status; });
    let name = "";
    await step(5, async () => {
      if (db) name = 顧客グループIDの保存内容(id)?.名称 ?? "";
      else note("開発者ツールのネットワーク情報の代わりに、更新要求の応答（HTTPステータス）を記録して確かめた");
    });
    await expected(async () => {
      if (!db) expect.soft(status, "更新要求のHTTP応答ステータス").toBe(403);
      else expect.soft(name, `顧客グループID ${id} の名称（「編集前顧客グループ-${k}」から更新されない）`).toBe(名称(`編集前顧客グループ-${k}`));
    });
  };
}
caseTest("IT-M08-12-029", 更新トークン不正(false, "029"));
caseTest("IT-M08-12-030", 更新トークン不正(true, "030"));

caseTest("IT-M08-12-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  let id = "";
  let status: number | null = null;
  await step(1, async () => { note(印注記); id = await 編集を開く(g, 名称("編集前顧客グループ-033")); });
  await step(2, async () => {
    const res = await page.goto(page.url().replace(`/customer_group/${id}`, "/customer_group/999999"), { timeout: 60_000 });
    status = res?.status() ?? null;
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(status, "応答のHTTPステータス").toBe(404);
    expect.soft(await g.name.count(), "顧客グループの編集フォームが表示されない").toBe(0);
    expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧が表示されない").toBe(0);
  });
});

// ---- 一覧の表示 ----
caseTest("IT-M08-12-042", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const n = 名称("M0812-042-GROUP");
  await step(1, async () => { note(印注記); await g.open(); });
  let 欄 = { ポイント率: "", 支払方法: "" };
  await step(2, async () => { await expect(g.rowByName(n), `一覧に名称「${n}」の行が1つ`).toHaveCount(1); 欄 = await g.行の欄(n); });
  await expected(async () => { expect.soft(欄.ポイント率, "ポイント率欄（「37%」と表示される）").toMatch(/^37\s*%?$/); });
});

caseTest("IT-M08-12-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  const n = 名称("M0812-043-GROUP");
  await step(1, async () => { note(印注記); await g.open(); });
  let 欄 = { ポイント率: "", 支払方法: "" };
  await step(2, async () => { await expect(g.rowByName(n), `一覧に名称「${n}」の行が1つ`).toHaveCount(1); 欄 = await g.行の欄(n); });
  await expected(async () => {
    const 表示 = 欄.支払方法.split(",").map((x) => x.trim());
    const [a, b, c] = [支払方法の名前(notes.get(支払ラベル.A)), 支払方法の名前(notes.get(支払ラベル.B)), 支払方法の名前(notes.get(支払ラベル.C))];
    expect.soft(表示, `支払方法欄に試験支払A（${a}）が表示される`).toContain(a);
    expect.soft(表示, `支払方法欄に試験支払C（${c}）が表示される`).toContain(c);
    expect.soft(表示, `支払方法欄に試験支払B（${b}）が表示されない`).not.toContain(b);
  });
});

function 一件(k: "044" | "045") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const 元 = k === "044" ? "一件支払M0812-044" : "支店のみM0812-045";
    const n = 名称(元);
    const 店 = k === "044";
    const 払 = k === "044" ? 支払ids(notes, "B") : 支払ids(notes, "A", "C");
    let r: ReturnType<typeof 顧客グループ名の保存内容> = null;
    await step(1, async () => { note(印注記); await g.open(); });
    await step(2, async () => { await g.入れる({ 名称: n, 還元率: "10" }); });
    await step(3, async () => { await g.入れる({ 店内注文専用: 店, 支店店内注文専用: !店 }); });
    await step(4, async () => { await g.支払方法を選ぶ(払); });
    await step(5, async () => { expect((await g.登録する()).sent, "登録ボタンで送信された").toBe(true); });
    await step(6, async () => { r = 顧客グループ名の保存内容(n); });
    await expected(async () => { expect.soft(r !== null, "顧客グループが保存されている").toBe(true); 保存内容を比べる(r, { 名称: n, 還元率: "10", 店内: 店, 支店: !店, 支払: 払 }, false); });
  };
}
caseTest("IT-M08-12-044", 一件("044"));
caseTest("IT-M08-12-045", 一件("045"));

// ---- 店内注文専用・支店店内注文専用アカウントのアクセス制限 ----
type 開いた画面 = { 名前: string; status: number; path: string; h1: string; システムエラー: boolean };
async function 新しいタブで開く(page: Page, 名前: string, path: string): Promise<開いた画面> {
  const tab = await page.context().newPage();
  try {
    const res = await tab.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await tab.waitForLoadState("load");
    const text = await tab.locator("body").innerText();
    const h1 = (await tab.locator("h1").first().innerText({ timeout: 5_000 }).catch(() => "")).trim();
    return { 名前, status: res?.status() ?? 0, path: new URL(tab.url()).pathname, h1, システムエラー: /システムエラー/.test(text) };
  } finally { await tab.close(); }
}
const OTC注記 = "対象画面が開けないときアプリが出すのは、HTTP 403 の「店頭用アカウントでは利用できません。」のエラー画面。正本の「システムエラーが表示される」は、このエラー画面が出ること（対象画面が表示されないこと）と解釈した";
const OTC画面 = [
  ["購入履歴画面", "/ja/mypage/shopping_history"], ["ポイント履歴画面", "/ja/mypage/point_history"], ["ネット買取履歴画面", "/ja/mypage/purchase_history"],
  ["予約済み大会一覧画面", "/ja/mypage/event_history"],
] as const;
const OTC画面2 = [
  ["大会デッキ登録画面", "/ja/deckentry/1/edit"], ["配送先の新規登録画面", "/ja/mypage/delivery/new/edit"], ["配送先の変更画面", "/ja/mypage/delivery/1/edit"],
  ["お問い合わせ画面", "/ja/contact"], ["お問い合わせ履歴画面", "/ja/contact/history"],
] as const;

caseTest("IT-M08-12-035", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const m = OTC会員["035"];
  const 結果: (開いた画面 | null)[] = [];
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf(m.前半), m.pw); });
  for (let i = 0; i < OTC画面.length; i++) await step(i + 2, async () => { if (i === 0) note(OTC注記); 結果.push(await 新しいタブで開く(page, OTC画面[i][0], OTC画面[i][1])); });
  await step(6, async () => { note("チーム情報変更の画面は、アプリのマイページのルートに見つからない（開く対象が無い）。開けない画面として、不合格になる形で判定する"); 結果.push(null); });
  for (let i = 0; i < OTC画面2.length; i++) await step(i + 7, async () => { 結果.push(await 新しいタブで開く(page, OTC画面2[i][0], OTC画面2[i][1])); });
  await expected(async () => {
    const 名 = ["購入履歴画面", "ポイント履歴画面", "ネット買取履歴画面", "予約済み大会一覧画面", "チーム情報変更画面", ...OTC画面2.map((x) => x[0])];
    for (let i = 0; i < 結果.length; i++) {
      const r = 結果[i];
      if (r === null) { expect.soft(false, `${名[i]}がアプリに見つからない（対象画面を特定できず、エラー表示を確かめられない）`).toBe(true); continue; }
      expect.soft(r.status, `${r.名前}の応答のHTTPステータス（対象画面が表示されない）`).toBe(403);
      expect.soft(r.h1, `${r.名前}のエラー表示`).toContain("店頭用アカウントでは利用できません");
    }
  });
});

caseTest("IT-M08-12-036", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const m = OTC会員["036"];
  const 画面 = [["本店のご注文方法指定画面", "/ja/shopping"], ["本店の配送先の新規登録画面", "/ja/shopping/shipping_edit/1"], ["本店の配送先の変更画面", "/ja/shopping/shipping_edit/1/1"]] as const;
  const 結果: 開いた画面[] = [];
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf(m.前半), m.pw); });
  for (let i = 0; i < 画面.length; i++) await step(i + 2, async () => { if (i === 0) note(OTC注記.replace("店頭用アカウント", "支店店頭用アカウント")); 結果.push(await 新しいタブで開く(page, 画面[i][0], 画面[i][1])); });
  await expected(async () => {
    for (const r of 結果) {
      expect.soft(r.status, `${r.名前}の応答のHTTPステータス（対象画面が表示されない）`).toBe(403);
      expect.soft(r.h1, `${r.名前}のエラー表示`).toContain("支店店頭用アカウントでは利用できません");
    }
  });
});

caseTest("IT-M08-12-046", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const m = OTC会員["046"];
  const 画面 = [["本店の配送先の新規登録画面", "/ja/shopping/shipping_edit/1"], ["本店の配送先の変更画面", "/ja/shopping/shipping_edit/1/1"]] as const;
  const 結果: 開いた画面[] = [];
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf(m.前半), m.pw); });
  for (let i = 0; i < 画面.length; i++) await step(i + 2, async () => {
    if (i === 0) note("注文の手続きが無い状態で開くため、対象画面そのものは表示されず別の画面へ移ることがある。判定は、システムエラーが出ないことと、利用制限のエラー画面（HTTP 403）でないことで行った");
    結果.push(await 新しいタブで開く(page, 画面[i][0], 画面[i][1]));
  });
  await expected(async () => {
    for (const r of 結果) {
      expect.soft(r.システムエラー, `${r.名前}にシステムエラーが表示されている`).toBe(false);
      expect.soft(r.status, `${r.名前}の応答のHTTPステータス（利用制限の403でない）`).not.toBe(403);
    }
  });
});
