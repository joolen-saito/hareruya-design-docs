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

// ================= 支払方法・日程の選択・不正な要求（001〜067） =================
const 円文 = (t: string): string => t.replace(/,/g, "");
const 金額あり = (t: string, 金額: string): boolean => new RegExp(`[¥￥]\\s*${金額}(?!\\d)`).test(円文(t));
/** 日程の開催日時の、画面の書き方（2026/12/11 10:00） */
const 開催日時文 = (大: { 開催日: string[] }, i: number): string => { const [y, m, d] = 大.開催日[i].split("-"); return `${y}/${Number(m)}/${Number(d)} 10:00`; };
const 存在しない日程ID = "99999999";
const 支払名 = "クレジットカード";
type Step = (n: number, f: () => Promise<void>) => Promise<void>;

caseTest("IT-F07-04-001", async ({ page, notes, step, expected }) => {
  await ログイン(page, "001");
  const a = notes.get("〔イベント詳細ID-F0704-001A〕"), b = notes.get("〔イベント詳細ID-F0704-001B〕");
  const 大 = 大会一覧.get("001")!;
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); });
  let 選択済み = false, 選択カード = "", 別カード = "", 別数 = 0, 選択肢: string[] = [];
  await step(2, async () => {
    await expect(e.日程チェック(a)).toBeAttached();
    選択済み = await e.日程チェック(a).isChecked();
    選択カード = (await e.選択済みのカード(a).innerText()).replace(/\s+/g, " ");
    別数 = await page.locator(`#alternative-event-${b}`).count();
    別カード = 別数 ? (await e.別日程のカード(b).innerText()).replace(/\s+/g, " ") : "";
    選択肢 = await e.支払方法の選択肢.allInnerTexts();
    note(`開催日時は、シード表の固定の日時（2026-10-10 10:00）でなく、実行日の30日後の10:00（${開催日時文(大, 0)}）で登録した日程を読む（過去の日時では日程を登録できない）。支払方法「クレジットカード」は、画面の選択肢の名前「クレジットカード決済」を読む`);
  });
  await expected(async () => {
    expect.soft(選択済み, "日程A1が選択済みで表示されている").toBe(true);
    expect.soft(選択カード.includes(大.イベント名), `イベント名「大会A」（${大.イベント名}）が表示されている`).toBe(true);
    expect.soft(選択カード.includes(開催日時文(大, 0)), `開催日時（${開催日時文(大, 0)}）が表示されている`).toBe(true);
    expect.soft(金額あり(選択カード, "1000"), "参加費1000円が表示されている").toBe(true);
    expect.soft(別数, "別日程の日程A2のチェック欄の数").toBe(1);
    expect.soft(別カード.includes(開催日時文(大, 1)), `別日程の日程A2（${開催日時文(大, 1)}）が表示されている`).toBe(true);
    expect.soft(選択肢.some((t) => t.includes(支払名)), `支払方法「クレジットカード」が選択肢に表示されている（${選択肢.join("、")}）`).toBe(true);
  });
});

caseTest("IT-F07-04-006", async ({ page, notes, step, expected }) => {
  await ログイン(page, "006");
  const id = notes.get("〔イベント詳細ID-F0704-006〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.支払説明を開くボタン.click({ timeout: 15_000 }); });
  await expected(async () => {
    await expect.soft(e.支払説明のモーダル, "支払いについてのモーダルウィンドウ").toBeVisible();
    await expect.soft(e.支払説明のモーダル, "モーダルの見出し").toContainText("お支払いについて");
  });
});

caseTest("IT-F07-04-007", async ({ page, notes, step, expected }) => {
  await ログイン(page, "007");
  const id = notes.get("〔イベント詳細ID-F0704-007〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  let 開いた = new URL("about:blank");
  await step(2, async () => {
    const popup = page.waitForEvent("popup", { timeout: 30_000 });
    await e.キャンセルポリシーのリンク.click({ timeout: 15_000 });
    const p = await popup;
    try { await p.waitForLoadState("load"); 開いた = new URL(p.url()); } finally { await p.close(); }
  });
  await expected(async () => {
    expect.soft(開いた.pathname, "新しいウィンドウで開いた画面のパス").toBe("/ja/user_data/help_event");
    expect.soft(開いた.hash, "新しいウィンドウで開いた画面の位置指定").toBe("#block_event_cancel_policy");
  });
});

caseTest("IT-F07-04-010", async ({ page, notes, step, expected }) => {
  await ログイン(page, "010");
  const a = notes.get("〔イベント詳細ID-F0704-010A〕"), b = notes.get("〔イベント詳細ID-F0704-010B〕");
  const 大 = 大会一覧.get("010")!;
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); });
  await step(2, async () => { await e.選択済みの日程を外す(a); await e.別日程を選ぶ(b); });
  await step(3, async () => { await e.支払方法を選ぶ(支払名); });
  await step(4, async () => { await e.同意して支払いへ進む(); });
  await expected(async () => {
    expect.soft(await e.申込確定画面か(), "申込確定画面が表示された").toBe(true);
    const 日程 = (await e.確定画面の日程カード.allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
    expect.soft(日程.length, "申込確定画面に表示された日程の数（日程A2だけ）").toBe(1);
    expect.soft(日程.some((t) => t.includes(開催日時文(大, 1))), "日程A2が表示されている").toBe(true);
    expect.soft(日程.some((t) => t.includes(開催日時文(大, 0))), "日程A1は表示されない").toBe(false);
    expect.soft(金額あり(await e.確定画面の合計金額.innerText(), "500"), "合計金額が500円").toBe(true);
    expect.soft(await e.確定画面の支払方法.innerText(), "支払方法").toContain(支払名);
  });
});

caseTest("IT-F07-04-011", async ({ page, notes, step, expected }) => {
  await ログイン(page, "011");
  const a = notes.get("〔イベント詳細ID-F0704-011A〕"), b = notes.get("〔イベント詳細ID-F0704-011B〕");
  const 大 = 大会一覧.get("011")!;
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); });
  await step(2, async () => {
    if (!(await e.日程チェック(a).isChecked())) await e.選択済みのカード(a).click({ timeout: 15_000 });
    await e.別日程を選ぶ(b);
    await expect(e.日程チェック(a), "日程A1が選ばれている").toBeChecked();
  });
  await step(3, async () => { await e.支払方法を選ぶ(支払名); });
  await step(4, async () => { await e.同意して支払いへ進む(); });
  await expected(async () => {
    expect.soft(await e.申込確定画面か(), "申込確定画面が表示された").toBe(true);
    const 日程 = (await e.確定画面の日程カード.allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
    expect.soft(日程.length, "申込確定画面に表示された日程の数").toBe(2);
    expect.soft(日程.some((t) => t.includes(開催日時文(大, 0))), "日程A1が表示されている").toBe(true);
    expect.soft(日程.some((t) => t.includes(開催日時文(大, 1))), "日程A2が表示されている").toBe(true);
    expect.soft(金額あり(await e.確定画面の合計金額.innerText(), "1500"), "合計金額が1500円").toBe(true);
    expect.soft(await e.確定画面の支払方法.innerText(), "支払方法").toContain(支払名);
  });
});

caseTest("IT-F07-04-012", async ({ page, notes, step, expected }) => {
  await ログイン(page, "012");
  const id = notes.get("〔イベント詳細ID-F0704-012〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => {
    await Promise.all([page.waitForURL(new RegExp(`/events/${id}/detail`), { timeout: 45_000, waitUntil: "load" }), e.申込確認のキャンセルボタン.click({ timeout: 15_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "戻った画面（日程A1の大会詳細画面）").toMatch(detailPath(id));
  });
});

caseTest("IT-F07-04-013", async ({ page, step, expected }) => {
  await ログイン(page, "013");
  // 事前準備: イベント詳細ID 99999999 のデータが無い状態。画面では指定できないので、無いことをDBの参照で確かめる（あれば止める。消さない）
  if (DB.日程が存在するか(存在しない日程ID)) throw new Error(`イベント詳細ID ${存在しない日程ID} のデータがある。共有のデータなので消さずに止める`);
  const e = new EventEntryPage(page);
  let res: Awaited<ReturnType<EventEntryPage["申込確認を開く"]>> = null;
  await step(1, async () => { res = await e.申込確認を開く(存在しない日程ID); });
  let status = 0;
  await step(2, async () => { status = res?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "イベント申込確認画面を開いた応答（HTTPの状態）").toBe(404);
    expect.soft(await e.申込確認の本体.count(), "イベント申込確認画面の本体の数").toBe(0);
  });
});

caseTest("IT-F07-04-020", async ({ page, notes, step, expected }) => {
  await ログイン(page, "020");
  const id = notes.get("〔イベント詳細ID-F0704-020〕");
  if (DB.日程が存在するか(存在しない日程ID)) throw new Error(`イベント詳細ID ${存在しない日程ID} のデータがある。共有のデータなので消さずに止める`);
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.主対象を書き換える(存在しない日程ID); });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(3, async () => { res = await e.同意して支払いへ進む(); });
  let status = 0;
  await step(4, async () => { status = res?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(404);
  });
});

caseTest("IT-F07-04-021", async ({ page, notes, step, expected }) => {
  await ログイン(page, "021");
  const id = notes.get("〔イベント詳細ID-F0704-021〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => {
    DB.日程の受付を終了にする(id);
    note("DBで、この実行で作った日程A1のオンライン受付の終了日時を、現在の1日前に変えた（手順がDBでの変更を求める。画面では受付中の日程を受付終了にできない）");
  });
  await step(3, async () => { await e.同意して支払いへ進む(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "戻った画面（日程A1の大会詳細画面）").toMatch(detailPath(id));
    expect.soft(await e.申込確定画面か(), "申込確定画面へ進まない").toBe(false);
  });
});

caseTest("IT-F07-04-023", async ({ page, notes, step, expected }) => {
  await ログイン(page, "023");
  const a = notes.get("〔イベント詳細ID-F0704-023A〕"), z = notes.get("〔イベント詳細ID-F0704-023B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); });
  await step(2, async () => { await e.隠し欄を足す("form#filter_form", "details[]", z); });
  await step(3, async () => { await e.支払方法を選ぶ(支払名); });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(4, async () => { res = await e.同意して支払いへ進む(); });
  let status = 0;
  await step(5, async () => { status = res?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
  });
});

/** 2つの日程（A1・A2）を選んで申込確定画面へ進む。外部の決済サイトへは移らないようにする */
async function 二日程で確定画面へ(e: EventEntryPage, a: string, b: string): Promise<void> {
  await e.外部への移動を止める();
  await e.申込確認を開く(a);
  await e.別日程を選ぶ(b);
  await e.支払方法を選ぶ(支払名);
  await e.同意して支払いへ進む();
  expect(await e.申込確定画面か(), "申込確定画面へ進んだ").toBe(true);
}

caseTest("IT-F07-04-030", async ({ page, notes, step, expected }) => {
  await ログイン(page, "030");
  const a = notes.get("〔イベント詳細ID-F0704-030A〕"), b = notes.get("〔イベント詳細ID-F0704-030B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 二日程で確定画面へ(e, a, b); });
  let r: { status: number; json: Record<string, unknown> | null } = { status: 0, json: null };
  await step(2, async () => {
    r = await e.申込するを押す();
    note("申込登録の応答のあと、画面は外部の決済サイトへ移ろうとするが、試験では移動を止めた（決済サイトへは送らない）");
  });
  const 読む = (d: string) => ({ 申込: DB.日程の申込一覧(d), 番号: DB.日程の申込の支払番号(d), 申込選手: DB.日程の申込選手の件数(d, 会員("030").会員ID), 履歴: DB.日程の申込履歴の件数(d) });
  let 結果: Record<string, ReturnType<typeof 読む>> = {};
  await step(3, async () => { await page.waitForTimeout(1_000); 結果 = { 日程A1: 読む(a), 日程A2: 読む(b) }; });
  await expected(async () => {
    expect.soft(r.status, "申込登録の応答（HTTPの状態）").toBe(200);
    for (const 名 of ["日程A1", "日程A2"]) {
      expect.soft(結果[名].申込.map((x) => x.申込状況), `${名}の申込（決済中）`).toEqual(["決済中"]);
      expect.soft(結果[名].申込選手, `${名}の会員Aの申込選手の件数`).toBe(1);
      expect.soft(結果[名].履歴, `${名}の申込履歴の件数`).toBe(1);
      expect.soft(結果[名].番号.length === 1 && 結果[名].番号[0] !== "", `${名}の申込に支払番号が設定されている`).toBe(true);
    }
    expect.soft(結果["日程A1"].番号[0], "2件の申込の支払番号が共通").toBe(結果["日程A2"].番号[0]);
  });
});

caseTest("IT-F07-04-031", async ({ page, notes, step, expected }) => {
  await ログイン(page, "031");
  const a = notes.get("〔イベント詳細ID-F0704-031A〕"), b = notes.get("〔イベント詳細ID-F0704-031B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await 二日程で確定画面へ(e, a, b); });
  let 応答: ReturnType<EventEntryPage["申込登録の応答を待ち受ける"]> | undefined;
  await step(2, async () => { 応答 = e.申込登録の応答を待ち受ける(); });
  await step(3, async () => { await e.申込するボタン.click({ timeout: 20_000 }); });
  let r: { status: number; json: Record<string, unknown> | null } = { status: 0, json: null };
  await step(4, async () => { r = await 応答!; });
  await expected(async () => {
    const 番号 = DB.日程の申込の支払番号(a);
    expect.soft(r.status, "申込登録の応答（HTTPの状態）").toBe(200);
    expect.soft(String(r.json?.PaymentNo ?? ""), "応答に返された支払番号が、DBへ登録された共通の支払番号").toBe(番号[0] ?? "(DBに無い)");
    expect.soft(DB.日程の申込の支払番号(b)[0], "日程A2の申込の支払番号も同じ").toBe(番号[0] ?? "(DBに無い)");
    expect.soft(Number(r.json?.Amount), "応答に返された合計金額").toBe(1500);
  });
});

/** 申込確認で支払方法の値を書き換えて「支払いへ進む」を押し、申込内容の確認の応答の状態を返す（033・034） */
async function 支払方法を書き換えて進む(e: EventEntryPage, id: string, 値: string, step: Step): Promise<number> {
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.支払方法の値を書き換える(値); });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(3, async () => { res = await e.同意して支払いへ進む(); });
  let status = 0;
  await step(4, async () => { status = res?.status() ?? 0; });
  return status;
}

caseTest("IT-F07-04-033", async ({ page, notes, step, expected }) => {
  await ログイン(page, "033");
  const id = notes.get("〔イベント詳細ID-F0704-033〕");
  const status = await 支払方法を書き換えて進む(new EventEntryPage(page), id, "", step);
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
  });
});

caseTest("IT-F07-04-034", async ({ page, notes, step, expected }) => {
  await ログイン(page, "034");
  const id = notes.get("〔イベント詳細ID-F0704-034〕");
  // 事前準備: 支払方法ID 999999 が大会Aに設定されていない。画面では設定できない値なので、設定が無いことをDBの参照で確かめる（あれば止める。消さない）
  if (DB.日程の大会に紐づく支払方法の件数("999999", id) > 0) throw new Error("支払方法ID 999999 が大会に紐づいている。共有の設定なので消さずに止める");
  const status = await 支払方法を書き換えて進む(new EventEntryPage(page), id, "999999", step);
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
  });
});

caseTest("IT-F07-04-035", async ({ page, notes, step, expected }) => {
  await ログイン(page, "035");
  const a = notes.get("〔イベント詳細ID-F0704-035A〕"), z = notes.get("〔イベント詳細ID-F0704-035B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.外部への移動を止める(); await 確定画面まで進む(e, a); });
  await step(2, async () => { await e.隠し欄を足す("form#form-registration", "details[]", z); });
  let r: { status: number; json: Record<string, unknown> | null } = { status: 0, json: null };
  await step(3, async () => { r = await e.申込するを押す(); });
  let status = 0;
  await step(4, async () => { status = r.status; });
  await expected(async () => {
    expect.soft(status, "申込登録の応答（HTTPの状態）").toBe(400);
  });
});

caseTest("IT-F07-04-053", async ({ page, notes, step, expected }) => {
  await ログイン(page, "053");
  const id = notes.get("〔イベント詳細ID-F0704-053〕");
  const 位置 = エラーログの末尾位置(); // 事前準備③: エラーログの試験開始時点の末尾位置を記録する
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  await step(2, async () => { await e.支払方法の値を書き換える(""); });
  await step(3, async () => { await e.同意して支払いへ進む(); });
  let ログ: string[] = [];
  await step(4, async () => { await page.waitForTimeout(1_500); ログ = 位置以降のエラーログ(位置); });
  await expected(async () => {
    expect.soft(ログ.some((l) => l.includes("支払い前イベント登録エラー")), `エラーログに「支払い前イベント登録エラー」が記録された（新しいエラーログ${ログ.length}件${ログ[0] ? `: ${ログ[0].slice(0, 160)}` : ""}）`).toBe(true);
    expect.soft(ログ.some((l) => l.includes("支払い前イベント登録エラー") && /支払方法|payment/i.test(l)), "同じ記録に、支払方法の検証エラーの内容がある").toBe(true);
  });
});

caseTest("IT-F07-04-055", async ({ page, notes, step, expected }) => {
  await ログイン(page, "055");
  const id = notes.get("〔イベント詳細ID-F0704-055〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(id); });
  let 選択数 = -1, 候補 = -1;
  await step(2, async () => {
    await expect(e.申込確認の本体, "申込確認画面が表示された").toBeVisible();
    選択数 = await e.支払方法の選択.count();
    候補 = (await e.支払方法の選択肢.allInnerTexts()).filter((t) => t.includes(支払名)).length;
  });
  await expected(async () => {
    expect.soft(選択数, "支払方法選択（セレクトボックス）の数").toBe(0);
    expect.soft(候補, "選択肢「クレジットカード」の数").toBe(0);
  });
});

caseTest("IT-F07-04-064", async ({ page, notes, step, expected }) => {
  await ログイン(page, "064");
  const a = notes.get("〔イベント詳細ID-F0704-064A〕"), b = notes.get("〔イベント詳細ID-F0704-064B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); await e.別日程を選ぶ(b); });
  await step(2, async () => {
    DB.日程の受付を終了にする(b);
    note("DBで、この実行で作った日程I2のオンライン受付の終了日時を、現在の1日前に変えた（手順がDBでの変更を求める。画面では受付中の日程を受付終了にできない）");
  });
  let res: Awaited<ReturnType<EventEntryPage["同意して支払いへ進む"]>> = null;
  await step(3, async () => { res = await e.同意して支払いへ進む(); });
  let status = 0;
  await step(4, async () => { status = res?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "申込内容の確認の応答（HTTPの状態）").toBe(400);
  });
});

caseTest("IT-F07-04-066", async ({ page, notes, step, expected }) => {
  await ログイン(page, "066");
  const a = notes.get("〔イベント詳細ID-F0704-066A〕"), b = notes.get("〔イベント詳細ID-F0704-066B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.申込確認を開く(a); await e.別日程を選ぶ(b); });
  await step(2, async () => { await e.支払方法を選ぶ(支払名); });
  await step(3, async () => { await e.同意して支払いへ進む(); });
  await step(4, async () => { await expect(e.確定画面の合計金額, "申込確定画面の合計金額").toBeVisible(); });
  await expected(async () => {
    expect.soft(金額あり(await e.確定画面の合計金額.innerText(), "1000"), "合計金額が1000円").toBe(true);
    expect.soft(await e.確定画面の支払方法.innerText(), "お支払い方法").toContain(支払名);
  });
});

caseTest("IT-F07-04-067", async ({ page, notes, step, expected }) => {
  await ログイン(page, "067");
  const a = notes.get("〔イベント詳細ID-F0704-067A〕"), b = notes.get("〔イベント詳細ID-F0704-067B〕");
  const e = new EventEntryPage(page);
  await step(1, async () => { await e.外部への移動を止める(); await e.申込確認を開く(a); await e.別日程を選ぶ(b); });
  await step(2, async () => { await e.支払方法を選ぶ(支払名); await e.同意して支払いへ進む(); });
  let 応答: ReturnType<EventEntryPage["申込登録の応答を待ち受ける"]> | undefined;
  await step(3, async () => {
    expect(await e.申込確定画面か(), "申込確定画面へ進んだ").toBe(true);
    応答 = e.申込登録の応答を待ち受ける();
    await e.確定画面の支払方法を書き換える("");
  });
  await step(4, async () => { await e.申込するボタン.click({ timeout: 20_000 }); });
  let r: { status: number; json: Record<string, unknown> | null } = { status: 0, json: null };
  await step(5, async () => { r = await 応答!; });
  await expected(async () => {
    expect.soft(r.status, "申込登録の応答（HTTPの状態）").toBe(400);
  });
});
