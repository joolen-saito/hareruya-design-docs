/** F07-04 イベント申込（フロント）。正本: cases/F07-04_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { SETUP_ADMIN } from "../../config/env";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { 申込一覧を開く, 申込詳細を開く, 申込詳細を読む, 申込登録で選手を読む, 申込を検索する } from "../../pages/admin/f07_04_setup";
import { EventEntryPage, 別のブラウザで会員としてログインする, 無料申込を完了する, 前面 } from "../../pages/front/f07_04_entry";
import * as DB from "../../db/f07_04";
import { エラーログの末尾位置, 位置以降のエラーログ } from "../../lib/app_error_log";
import { PE大会名, PE管理者, 会員一覧, 大会一覧, 連携店名, 連携形式名 } from "../../seeds/f07-04";
import "../../seeds/f07-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const detailPath = (id: string) => new RegExp(`/events/${id}/detail/?$`);

/** 会員でログインしたブラウザ（page）を使う。画面の応答待ちを長くしすぎない */
async function ログイン(page: import("@playwright/test").Page, n: string) {
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);
  await frontLogin(page, 会員(n));
}

caseTest("IT-F07-04-002", async ({ page, notes, step, expected }) => {
  await ログイン(page, "002");
  const id = notes.get("〔イベント詳細ID-F0704-002〕");
  const e = new EventEntryPage(page);
  const cb = e.日程チェック(id);
  await step(1, async () => { await e.申込確認を開く(id); });
  let 選択済み = false, 無効 = false;
  await step(2, async () => { await expect(cb).toBeAttached(); 選択済み = await cb.isChecked(); 無効 = await cb.isDisabled(); });
  await step(3, async () => {
    // 変更できない（無効の）チェック欄を、利用者が押そうとする（ラベルを押す）。押せなければ、押せなかったことを注記に残す
    await page.locator(`label[for="event-${id}"]`).click({ timeout: 3_000 }).catch(() => note("日程B1のチェック欄は無効で、押せなかった（操作を受け付けない）"));
  });
  await expected(async () => {
    expect.soft(選択済み, "日程B1が選択済みで表示されている").toBe(true);
    expect.soft(無効, "日程B1のチェック欄は変更できない（無効）").toBe(true);
    expect.soft(await cb.isChecked(), "チェックを外そうとしたあとも日程B1は選択済み").toBe(true);
    expect.soft(await e.別日程のチェック.count(), "別日程として選べる日程の数").toBe(0);
  });
});

caseTest("IT-F07-04-003", async ({ page, notes, step, expected }) => {
  await ログイン(page, "003A");
  const ids = "ABCDEF".split("").map((c) => notes.get(`〔イベント詳細ID-F0704-003${c}〕`));
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(ids[0]); });
  let 別日程: string[] = [];
  await step(2, async () => {
    await expect(e.日程チェック(ids[0])).toBeAttached();
    別日程 = await page.locator('input[id^="alternative-event-"]').evaluateAll((os) => os.map((o) => (o as HTMLInputElement).value));
  });
  await expected(async () => {
    expect.soft(別日程, "別日程の同イベントとして表示された日程（日程C2だけ）").toEqual([ids[1]]);
    for (const [i, 名] of [[2, "受付開始前の日程C3"], [3, "受付終了後の日程C4"], [4, "定員到達済みの日程C5"], [5, "申込済みの日程C6"]] as const) {
      expect.soft(別日程.includes(ids[i]), `${名}は表示されない`).toBe(false);
    }
  });
});

caseTest("IT-F07-04-004", async ({ page, notes, step, expected }) => {
  await ログイン(page, "004");
  const id = notes.get("〔イベント詳細ID-F0704-004〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await expect(e.申込確認の本体).toBeVisible(); });
  await expected(async () => {
    const 本文 = (await e.申込確認の本体.innerText()).replace(/\s+/g, " ");
    expect.soft(await e.申込確認の本体.locator('input[type="email"], input[type="text"], input[type="number"]').count(), "申込入力欄（メール・席次などの入力欄）の数").toBe(0);
    expect.soft(本文.includes("メールアドレス"), "「メールアドレス」の入力欄が表示されない").toBe(false);
    expect.soft(本文.includes("席次"), "「席次」の入力欄が表示されない").toBe(false);
    expect.soft(本文.includes("確認済み"), "「確認済み」の入力欄が表示されない").toBe(false);
  });
});

caseTest("IT-F07-04-005", async ({ page, notes, step, expected }) => {
  await ログイン(page, "005");
  const id = notes.get("〔イベント詳細ID-F0704-005〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.同意して支払いへ進む(); });
  await step(3, async () => { await e.申込するを押す(); await e.申込完了画面を待つ(); });
  let 申込: DB.日程の申込[] = [];
  await step(4, async () => { 申込 = DB.日程の申込一覧(id); });
  await expected(async () => {
    expect.soft(申込.length, "日程T1の申込の件数").toBe(1);
    expect.soft(DB.日程の申込選手の件数(id, 会員("005").会員ID), "会員Aの申込選手の件数").toBe(1);
    expect.soft(DB.日程の申込履歴の件数(id), "日程T1の申込履歴の件数").toBe(1);
    expect.soft(DB.メールだけの仮選手の件数(会員("005").メール), "メールだけの仮選手の件数").toBe(0);
    expect.soft(DB.日程の未承認の申込選手の件数(id), "未承認の申込選手の件数").toBe(0);
  });
});

caseTest("IT-F07-04-019", async ({ page, notes, step, expected }) => {
  await ログイン(page, "019");
  const id = notes.get("〔イベント詳細ID-F0704-019〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "戻った画面（日程D1の大会詳細画面）").toMatch(detailPath(id));
    expect.soft(await e.申込確認の本体.count(), "イベント申込確認画面の本体の数").toBe(0);
  });
});

caseTest("IT-F07-04-022", async ({ page, browser, notes, step, expected }) => {
  await ログイン(page, "022");
  const id = notes.get("〔イベント詳細ID-F0704-022〕");
  const B = await 別のブラウザで会員としてログインする(browser, 会員("022"));
  try {
    const a = new EventEntryPage(page), b = new EventEntryPage(B.page);
    await step(1, async () => { await a.申込確認を開く(id); await b.申込確認を開く(id); });
    await step(2, async () => { await 無料申込を完了する(B.page, id); });
    await step(3, async () => { await a.同意して支払いへ進む(); await page.waitForLoadState("load"); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "戻った画面（日程A1の大会詳細画面）").toMatch(detailPath(id));
      expect.soft(DB.日程の申込一覧(id).length, "日程A1の申込の件数（ブラウザBの1件だけ）").toBe(1);
    });
  } finally { await B.context.close(); }
});

caseTest("IT-F07-04-024", async ({ page, browser, notes, step, expected }) => {
  await ログイン(page, "024A");
  const c1 = notes.get("〔イベント詳細ID-F0704-024A〕"), c5 = notes.get("〔イベント詳細ID-F0704-024B〕");
  const B = await 別のブラウザで会員としてログインする(browser, 会員("024B"));
  try {
    const a = new EventEntryPage(page);
    await step(1, async () => { await a.申込確認を開く(c1); });
    await step(2, async () => { await 無料申込を完了する(B.page, c5); });
    await step(3, async () => { await page.locator(`label[for="alternative-event-${c5}"]`).click({ timeout: 15_000 }); });
    let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
    await step(4, async () => { res = await a.同意して支払いへ進む(); });
    let status = 0;
    await step(5, async () => { status = res?.status() ?? 0; });
    await expected(async () => {
      expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
    });
  } finally { await B.context.close(); }
});

/** 申込確定画面まで進む（申込確認 → 同意して支払いへ進む） */
async function 確定画面まで進む(e: EventEntryPage, id: string): Promise<void> {
  await e.申込確認を開く(id);
  await e.同意して支払いへ進む();
  expect(await e.申込確定画面か(), "申込確定画面へ進んだ").toBe(true);
}

caseTest("IT-F07-04-025", async ({ page, notes, step, expected }) => {
  await ログイン(page, "025");
  const id = notes.get("〔イベント詳細ID-F0704-025〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  await step(2, async () => { await e.確定画面のトークンを消す(); });
  let r = { status: 0 };
  await step(3, async () => { r = await e.申込するを押す(); });
  let 件数 = { 申込: -1, 申込選手: -1, 申込履歴: -1 };
  await step(4, async () => { 件数 = { 申込: DB.日程の申込一覧(id).length, 申込選手: DB.日程の申込選手の件数(id), 申込履歴: DB.日程の申込履歴の件数(id) }; });
  await expected(async () => {
    expect.soft(件数.申込, "日程B1の申込の件数").toBe(0);
    expect.soft(件数.申込選手, "日程B1の申込選手の件数").toBe(0);
    expect.soft(件数.申込履歴, "日程B1の申込履歴の件数").toBe(0);
    expect.soft(r.status, "申込登録の応答（参考: 拒否されている）").toBeGreaterThanOrEqual(400);
  });
});

caseTest("IT-F07-04-026", async ({ page, notes, step, expected }) => {
  await ログイン(page, "026");
  const id = notes.get("〔イベント詳細ID-F0704-026〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  await step(2, async () => { await e.確定画面のトークンを書き換える("invalid-token"); });
  let r = { status: 0 };
  await step(3, async () => { r = await e.申込するを押す(); });
  let 件数 = { 申込: -1, 申込選手: -1, 申込履歴: -1 };
  await step(4, async () => { 件数 = { 申込: DB.日程の申込一覧(id).length, 申込選手: DB.日程の申込選手の件数(id), 申込履歴: DB.日程の申込履歴の件数(id) }; });
  await expected(async () => {
    expect.soft(件数.申込, "日程B1の申込の件数").toBe(0);
    expect.soft(件数.申込選手, "日程B1の申込選手の件数").toBe(0);
    expect.soft(件数.申込履歴, "日程B1の申込履歴の件数").toBe(0);
    expect.soft(r.status, "申込登録の応答（参考: 拒否されている）").toBeGreaterThanOrEqual(400);
  });
});

caseTest("IT-F07-04-027", async ({ page, notes, step, expected }) => {
  await ログイン(page, "027");
  const id = notes.get("〔イベント詳細ID-F0704-027〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.同意して支払いへ進む(); });
  await step(3, async () => { await e.申込するを押す(); await e.申込完了画面を待つ(); });
  let 申込: DB.日程の申込[] = [];
  await step(4, async () => { 申込 = DB.日程の申込一覧(id); });
  await expected(async () => {
    expect.soft(申込.map((x) => x.申込状況), "日程B1の申込（エントリー済み＝申込済み）").toEqual(["申込済み"]);
    expect.soft(DB.日程の申込選手の件数(id, 会員("027").会員ID), "会員Aの申込選手の件数").toBe(1);
    expect.soft(DB.日程の申込履歴の件数(id), "申込履歴の件数").toBe(1);
  });
});

caseTest("IT-F07-04-028", async ({ page, notes, step, expected }) => {
  await ログイン(page, "028");
  const id = notes.get("〔イベント詳細ID-F0704-028〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  let 応答: ReturnType<EventEntryPage["申込登録の応答を待ち受ける"]> | undefined;
  await step(2, async () => { 応答 = e.申込登録の応答を待ち受ける(); });
  await step(3, async () => { await e.申込するボタン.click({ timeout: 20_000 }); });
  let r: { status: number; json: Record<string, unknown> | null } = { status: 0, json: null };
  await step(4, async () => { r = await 応答!; });
  await expected(async () => {
    expect.soft(r.status, "申込登録の応答（HTTPの状態）").toBe(200);
    expect.soft(String(r.json?.detail ?? ""), "応答に返された、完了画面用の日程B1のイベント詳細ID").toBe(id);
  });
});

caseTest("IT-F07-04-029", async ({ page, notes, step, expected }) => {
  await ログイン(page, "029");
  const id = notes.get("〔イベント詳細ID-F0704-029〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  await step(2, async () => { await e.申込するを押す(); await e.申込完了画面を待つ(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面（申込完了画面）").toMatch(/\/events\/payment_complete\/?$/);
    expect.soft(new URL(page.url()).searchParams.get("detail"), "完了画面の日程").toBe(id);
    await expect.soft(e.完了メッセージ, "申込完了の文").toBeVisible();
  });
});

caseTest("IT-F07-04-036", async ({ page, browser, notes, step, expected }) => {
  await ログイン(page, "036A");
  const id = notes.get("〔イベント詳細ID-F0704-036〕");
  const B = await 別のブラウザで会員としてログインする(browser, 会員("036B"));
  try {
    const a = new EventEntryPage(page), b = new EventEntryPage(B.page);
    await step(1, async () => { await 確定画面まで進む(a, id); await 確定画面まで進む(b, id); });
    let ra = 0, rb = 0;
    await step(2, async () => {
      const wa = a.申込登録の応答を待ち受ける(), wb = b.申込登録の応答を待ち受ける();
      // 両ブラウザで同時に押す
      await Promise.all([a.申込するボタン.click({ timeout: 20_000 }), b.申込するボタン.click({ timeout: 20_000 })]);
      [ra, rb] = (await Promise.all([wa, wb])).map((r) => r.status);
    });
    await step(3, async () => { await page.waitForTimeout(1_000); });
    await expected(async () => {
      const 状態 = [ra, rb].sort((x, y) => x - y);
      expect.soft(状態.filter((s) => s === 200).length, "申込登録が成功した数（応答が200）").toBe(1);
      expect.soft(状態[1], "もう一方の申込登録の応答（HTTPの状態）").toBe(400);
    });
  } finally { await B.context.close(); }
});

caseTest("IT-F07-04-037", async ({ page, browser, notes, step, expected }) => {
  await ログイン(page, "037A");
  const id = notes.get("〔イベント詳細ID-F0704-037〕");
  const B = await 別のブラウザで会員としてログインする(browser, 会員("037B"));
  try {
    const a = new EventEntryPage(page), b = new EventEntryPage(B.page);
    await step(1, async () => { await 確定画面まで進む(a, id); await 確定画面まで進む(b, id); });
    await step(2, async () => {
      const wa = a.申込登録の応答を待ち受ける(), wb = b.申込登録の応答を待ち受ける();
      await Promise.all([a.申込するボタン.click({ timeout: 20_000 }), b.申込するボタン.click({ timeout: 20_000 })]);
      await Promise.all([wa, wb]);
      await page.waitForTimeout(2_000);
    });
    let 件数 = { 申込: -1, 申込選手: -1, 申込履歴: -1 };
    await step(3, async () => { 件数 = { 申込: DB.日程の申込一覧(id).length, 申込選手: DB.日程の申込選手の件数(id), 申込履歴: DB.日程の申込履歴の件数(id) }; });
    await expected(async () => {
      expect.soft(件数.申込, "日程L1の申込の件数").toBe(1);
      expect.soft(件数.申込選手, "日程L1の申込選手の件数").toBe(1);
      expect.soft(件数.申込履歴, "日程L1の申込履歴の件数").toBe(1);
    });
  } finally { await B.context.close(); }
});

caseTest("IT-F07-04-043", async ({ page, notes, step, expected }) => {
  await ログイン(page, "043");
  const id = notes.get("〔イベント詳細ID-F0704-043〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await page.goto(前面(`/events/payment_complete?detail=${id}`)); await page.waitForLoadState("load"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), e.イベント一覧に戻るボタン.click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（イベント一覧画面）").toMatch(/\/ja\/events\/?$/);
  });
});

caseTest("IT-F07-04-054", async ({ page, notes, step, expected }) => {
  await ログイン(page, "054A");
  const id = notes.get("〔イベント詳細ID-F0704-054〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（日程F1の大会詳細画面）").toMatch(detailPath(id));
    expect.soft(await e.申込確認の本体.count(), "イベント申込確認画面の本体の数").toBe(0);
  });
});

caseTest("IT-F07-04-056", async ({ page, notes, step, expected }) => {
  await ログイン(page, "056");
  const id = notes.get("〔イベント詳細ID-F0704-056〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.申込確認のトークンを消す(); });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(3, async () => { res = await e.同意して支払いへ進む(); });
  await expected(async () => {
    expect.soft(res?.status() ?? 0, "申込内容の確認の応答（アクセス拒否）").toBe(403);
    expect.soft(await e.申込確定画面か(), "申込確定画面へ進まない").toBe(false);
  });
});

caseTest("IT-F07-04-057", async ({ page, notes, step, expected }) => {
  await ログイン(page, "057");
  const id = notes.get("〔イベント詳細ID-F0704-057〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  await step(2, async () => { await e.確定画面のトークンを書き換える("invalid-token"); });
  let r = { status: 0 };
  await step(3, async () => { r = await e.申込するを押す(); });
  await expected(async () => {
    expect.soft(r.status, "申込登録の応答（アクセス拒否）").toBe(403);
  });
});

caseTest("IT-F07-04-063", async ({ page, notes, step, expected }) => {
  await ログイン(page, "063");
  const h1 = notes.get("〔イベント詳細ID-F0704-063A〕"), h2 = notes.get("〔イベント詳細ID-F0704-063B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => {
    await e.申込確認を開く(h1);
    await page.locator(`label[for="alternative-event-${h2}"]`).click({ timeout: 15_000 });
    await expect(page.locator(`#alternative-event-${h2}`), "日程H2が選ばれた").toBeChecked();
  });
  await step(2, async () => { await e.同意して支払いへ進む(); });
  await step(3, async () => { await e.申込するを押す(); await e.申込完了画面を待つ(); });
  const 読む = (d: string) => ({ 状況: DB.日程の申込一覧(d).map((x) => x.申込状況), 申込選手: DB.日程の申込選手の件数(d, 会員("063").会員ID), 申込履歴: DB.日程の申込履歴の件数(d) });
  let 結果: Record<string, ReturnType<typeof 読む>> = {};
  await step(4, async () => { 結果 = { 日程H1: 読む(h1), 日程H2: 読む(h2) }; });
  await expected(async () => {
    for (const 名 of ["日程H1", "日程H2"]) {
      expect.soft(結果[名].状況, `${名}の申込（エントリー済み＝申込済み）`).toEqual(["申込済み"]);
      expect.soft(結果[名].申込選手, `${名}の会員Aの申込選手の件数`).toBe(1);
      expect.soft(結果[名].申込履歴, `${名}の申込履歴の件数`).toBe(1);
    }
  });
});

caseTest("IT-F07-04-065", async ({ page, browser, notes, step, expected }) => {
  await ログイン(page, "065");
  const j1 = notes.get("〔イベント詳細ID-F0704-065A〕"), j2 = notes.get("〔イベント詳細ID-F0704-065B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => {
    await e.申込確認を開く(j1);
    await page.locator(`label[for="alternative-event-${j2}"]`).click({ timeout: 15_000 });
    await expect(page.locator(`#alternative-event-${j2}`), "日程J2が選ばれた").toBeChecked();
  });
  await step(2, async () => {
    await withAdminSession(browser, SETUP_ADMIN, async (admin) => {
      admin.setDefaultTimeout(60_000);
      const 大 = 大会一覧.get("065")!;
      await 申込登録で選手を読む(admin, 大, 1, 会員("065").氏名, true);
    });
  });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(3, async () => { res = await e.同意して支払いへ進む(); });
  let status = 0;
  await step(4, async () => { status = res?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
  });
});

/** 申込完了画面のデッキ登録ボタン（070〜073） */
function デッキ登録ボタン(n: string, 表示される: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await ログイン(page, n);
    const id = notes.get(`〔イベント詳細ID-F0704-${n}〕`);
    const e = new EventEntryPage(page);
    await step(1, async () => { await e.申込確認を開く(id); });
    await step(2, async () => { await e.同意して支払いへ進む(); });
    await step(3, async () => { await e.申込するを押す(); await e.申込完了画面を待つ(); });
    await step(4, async () => { await expect(e.完了メッセージ, "申込完了画面").toBeVisible(); });
    await expected(async () => {
      // 完了画面の「イベント一覧へ戻る」が出ている（画面の描画が済んでいる）状態で数える
      await expect.soft(e.イベント一覧に戻るボタン, "完了画面の描画が済んでいる").toBeVisible();
      expect.soft(await e.デッキ登録ボタン.count(), "デッキ登録のボタンの数").toBe(表示される ? 1 : 0);
    });
  };
}
caseTest("IT-F07-04-070", デッキ登録ボタン("070", true));
caseTest("IT-F07-04-071", デッキ登録ボタン("071", false));
caseTest("IT-F07-04-072", デッキ登録ボタン("072", false));
caseTest("IT-F07-04-073", デッキ登録ボタン("073", false));

// ---- 管理画面のイベント申込一覧への連携（059〜062） ----

/** 会員Aとして本店のフロントにログインし、日程の申込を完了する（手順1〜4）。管理画面での確認は手順5以降 */
async function 連携の申込(n: string, page: import("@playwright/test").Page, notes: { get: (l: string) => string }, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<void> {
  const m = 会員(`PE${n}`);
  const id = notes.get(`〔イベント詳細ID-F0704-00${Number(n)}〕`);
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);
  const e = new EventEntryPage(page);
  await step(1, async () => { await frontLogin(page, m); });
  await step(2, async () => { await e.申込確認を開く(id); });
  await step(3, async () => { await e.同意して支払いへ進む(); });
  await step(4, async () => {
    await e.申込するを押す();
    await e.申込完了画面を待つ();
    await expect(e.完了メッセージ, "申込完了画面が表示された").toBeVisible();
  });
}

caseTest("IT-F07-04-059", async ({ page, notes, step, expected }) => {
  await 連携の申込("001", page, notes, step);
  await step(5, async () => { await loginAdmin(page, PE管理者); await 申込一覧を開く(page); });
  let r: Awaited<ReturnType<typeof 申込を検索する>> = { 件数: -1, 行: [] };
  await step(6, async () => { r = await 申込を検索する(page, PE大会名("001"), false); });
  await step(7, async () => { await expect(page.locator("body")).toContainText("検索結果"); });
  await expected(async () => {
    expect.soft(r.件数, "検索結果の該当件数").toBe(1);
    expect.soft(r.行.length, "表示された申込の行の数").toBe(1);
    expect.soft(r.行[0]?.イベント名の欄 ?? "", "行に表示されたイベント名").toContain(PE大会名("001"));
    expect.soft(r.行[0]?.申込ID ?? "", "行に表示された申込ID（数字）").toMatch(/^\d+$/);
  });
});

caseTest("IT-F07-04-060", async ({ page, notes, step, expected }) => {
  await 連携の申込("002", page, notes, step);
  await step(5, async () => { await loginAdmin(page, PE管理者); await 申込一覧を開く(page); });
  let r: Awaited<ReturnType<typeof 申込を検索する>> = { 件数: -1, 行: [] };
  await step(6, async () => { r = await 申込を検索する(page, PE大会名("002"), false); });
  let 控えた申込ID = "";
  await step(7, async () => { 控えた申込ID = r.行[0]?.申込ID ?? ""; expect(控えた申込ID, "検索結果の行に表示された申込ID").toMatch(/^\d+$/); });
  await step(8, async () => { await 申込詳細を開く(page, 控えた申込ID); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（イベント申込詳細・編集）").toMatch(/\/event\/entry\/\d+\/edit/);
    const d = await 申込詳細を読む(page);
    expect.soft(d.申込ID, "イベント申込ID（手順7で控えた申込ID）").toBe(控えた申込ID);
    expect.soft(d.イベント名の欄, "イベント名").toContain(PE大会名("002"));
  });
});

caseTest("IT-F07-04-061", async ({ page, notes, step, expected }) => {
  await 連携の申込("003", page, notes, step);
  await step(5, async () => { await loginAdmin(page, PE管理者); await 申込一覧を開く(page); });
  let r: Awaited<ReturnType<typeof 申込を検索する>> = { 件数: -1, 行: [] };
  await step(6, async () => { r = await 申込を検索する(page, PE大会名("003"), false); });
  await step(7, async () => { await expect(page.locator("body")).toContainText("検索結果"); });
  await expected(async () => {
    const 行 = r.行[0]?.イベント名の欄 ?? "";
    expect.soft(r.行.length, "表示された申込の行の数").toBe(1);
    expect.soft(行, "行のイベント名").toContain(PE大会名("003"));
    expect.soft(行, "行の店舗").toContain(連携店名());
    expect.soft(行, "行の開催日").toContain("2099/12/20");
  });
});

caseTest("IT-F07-04-062", async ({ page, notes, step, expected }) => {
  await 連携の申込("004", page, notes, step);
  await step(5, async () => { await loginAdmin(page, PE管理者); await 申込一覧を開く(page); });
  let r: Awaited<ReturnType<typeof 申込を検索する>> = { 件数: -1, 行: [] };
  await step(6, async () => { r = await 申込を検索する(page, PE大会名("004"), false); });
  let 控えた申込ID = "";
  await step(7, async () => { 控えた申込ID = r.行[0]?.申込ID ?? ""; expect(控えた申込ID, "検索結果の行に表示された申込ID").toMatch(/^\d+$/); });
  let d: Awaited<ReturnType<typeof 申込詳細を読む>> | undefined;
  await step(8, async () => { await 申込詳細を開く(page, 控えた申込ID); d = await 申込詳細を読む(page); });
  await expected(async () => {
    expect.soft(d?.イベント名の欄 ?? "", "イベント名").toContain(PE大会名("004"));
    expect.soft(d?.店舗 ?? "", "店舗").toBe(連携店名());
    expect.soft(d?.フォーマット ?? "", "フォーマット").toBe(連携形式名());
    expect.soft(d?.支払番号 ?? "", "支払番号の先頭").toMatch(/^EV/);
    expect.soft((d?.支払番号 ?? "").split("-").slice(1).join("-"), "支払番号の「-」より後ろ（イベント申込IDを10桁にゼロ詰めした値）").toBe((d?.申込ID ?? "").padStart(10, "0"));
  });
});

caseTest("IT-F07-04-058", async ({ page, notes, step, expected }) => {
  await ログイン(page, "058");
  const id = notes.get("〔イベント詳細ID-F0704-058〕");
  const 位置 = エラーログの末尾位置(); // 事前準備②: エラーログの試験開始時点の末尾位置を記録する
  const e = new EventEntryPage(page);
  await step(1, async () => { await 確定画面まで進む(e, id); });
  await step(2, async () => { await e.確定画面のトークンを書き換える("invalid-token"); });
  await step(3, async () => { await e.申込するを押す(); });
  let 新しいエラー: string[] = [];
  await step(4, async () => { await page.waitForTimeout(1_500); 新しいエラー = 位置以降のエラーログ(位置); });
  await expected(async () => {
    expect.soft(新しいエラー.length, `記録した位置以降の新しいエラーログの件数${新しいエラー.length ? `（${新しいエラー[0].slice(0, 160)}）` : ""}`).toBe(0);
  });
});
