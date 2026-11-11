/**
 * F06-25 店頭モニター。正本: cases/F06-25_test_cases.tsv
 * 実装するのは、番号札を使わない 003〜006。正本のアドレスは本番の「https://www.hareruyamtg.com/ja/…」で書かれているため、手元の接続先の同じ「/ja/…」で開いた（正本の外の補い）。
 * 008〜013・017・020 は、店舗ID 1・5（共有の店舗）の番号札を消せないので、試験店舗（試験本店-F0625P1＝本店の役、試験支店-F0625P2＝大阪の役）の店頭モニターで確かめる（seeds/f06-25.ts の注記）。
 * 001・002・007・014〜016・019 は、ピック完了の受注・数字札の投入が要るので実装しない。記録 review/F06-25_progress_2026-11-04.md
 */
import { Browser, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { WaitingTagPage } from "../../pages/admin/m05_27_waiting_tag";
import { WaitingPage } from "../../pages/front/f06_25_waiting";
import { F0625_ADMIN, モニターのパス, 支店, 本店 } from "../../seeds/f06-25";

const supplement = () => test.info().annotations.push({ type: "正本の外の補い", description: "正本のアドレスは本番(https://www.hareruyamtg.com)で書かれているため、手元の接続先の同じ「/ja/…」を開いた。店名は書き換えず、店舗ID 1 が本店・店舗ID 5 が支店(osaka)であることを確かめて使った" });

caseTest("IT-F06-25-003", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  await step(1, async () => { await w.開く("/ja/waiting_number_1"); });
  await step(2, async () => { await expect(w.番号札の枠, "店頭モニターの番号札の枠").toBeAttached({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await w.WiFi欄.count(), "WiFiパスワードの欄が表示される").toBe(1); });
});
caseTest("IT-F06-25-004", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  await step(1, async () => { await w.開く("/ja/osaka/waiting_number"); });
  await step(2, async () => { await expect(w.番号札の枠, "店頭モニターの番号札の枠").toBeAttached({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await w.WiFi欄.count(), "WiFiパスワードの欄が表示されない").toBe(0); });
});
caseTest("IT-F06-25-005", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  let status = 0;
  await step(1, async () => { status = await w.開く("/ja/waiting_number_1"); });
  await expected(async () => {
    expect.soft(status, "応答の状態").toBe(200);
    expect.soft(await w.モニター画面である(), "本店の店頭モニター画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-25-006", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  let status = 0;
  await step(1, async () => { status = await w.開く("/ja/waiting_number_2"); });
  await expected(async () => {
    expect.soft(await w.モニター画面である(), "2つ目の本店用店頭モニター画面が表示されない").toBe(false);
    expect.soft(status, "応答の状態（存在しない画面）").toBe(404);
  });
});

// ---- 008〜013・017・020 番号札の定期取得・音・表示（試験店舗で確かめる） ----

const readingNote = () => test.info().annotations.push({
  type: "正本の外の補い",
  description: "シード表の「店舗ID 1（TC東京・本店）」「店舗ID 5（大阪）」は共有の店舗なので番号札を消せない。試験店舗（試験本店-F0625P1を本店の役、試験支店-F0625P2を大阪の役）の店頭モニターと店頭注文番号札管理で確かめた。"
    + "音は聞けないので、画面が音声を鳴らす呼び出しの回数を数えた。番号札の取得は10秒ごとなので、次の取得を待って確かめた",
});

/** 管理画面（店頭注文番号札管理）を別のブラウザで開く。終わったら close を呼ぶ */
async function openTagAdmin(browser: Browser): Promise<{ w: WaitingTagPage; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const admin = await context.newPage();
  admin.setDefaultTimeout(60_000);
  await loginAdmin(admin, F0625_ADMIN);
  return { w: new WaitingTagPage(admin), close: () => context.close() };
}

/** 管理画面で店頭注文番号札管理を開き、検索店舗に試験本店（本店の役）を選ぶ */
async function selectMain(w: WaitingTagPage): Promise<void> {
  await w.open();
  await w.検索店舗を選ぶ(本店);
}

/** NEW を登録する */
async function registerNew(w: WaitingTagPage): Promise<void> {
  const r = await w.登録する("NEW");
  expect(r.成功の表示, `店頭注文番号札NEWの登録（${r.エラーの表示.join(" / ") || "エラーの表示なし"}）`).toBe(true);
}

caseTest("IT-F06-25-008", async ({ page, browser, step, expected }) => {
  readingNote();
  const a = new WaitingPage(page);
  const b = new WaitingPage(await page.context().newPage());
  const adm = await openTagAdmin(browser);
  try {
    await step(1, async () => { await a.音声を数える(); await a.開いて初回取得を待つ(モニターのパス(本店)); });
    await step(2, async () => { await b.開いて初回取得を待つ(モニターのパス(支店)); });
    await step(3, async () => { await selectMain(adm.w); });
    await step(4, async () => { await registerNew(adm.w); });
    const got = { A: [] as string[], B: [] as string[] };
    await step(5, async () => {
      await a.次の取得を待つ((l) => l.includes("NEW"));
      await b.次の取得を待つ();
      got.A = await a.表示中の番号札();
      got.B = await b.表示中の番号札();
    });
    await expected(async () => {
      expect.soft(got.A, "本店（の役の試験本店）の店頭モニターにNEWが表示される").toContain("NEW");
      expect.soft(got.B, "大阪（の役の試験支店）の店頭モニターにNEWが表示されない").not.toContain("NEW");
    });
  } finally { await adm.close(); }
});

/** 009・011: 開いた後にNEWを登録し、次の取得で音が鳴る */
function soundOnNew(初回の音: number): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, browser, step, expected }) => {
    readingNote();
    const m = new WaitingPage(page);
    const adm = await openTagAdmin(browser);
    const got = { 初回後: -1, 取得後: -1 };
    try {
      await step(1, async () => {
        await m.音声を数える();
        await m.開いて初回取得を待つ(モニターのパス(本店));
        got.初回後 = await m.音声の再生回数();
        expect(got.初回後, "初回取得の音の回数（前提）").toBe(初回の音);
      });
      await step(2, async () => { await selectMain(adm.w); });
      await step(3, async () => { await registerNew(adm.w); });
      await step(4, async () => {
        await m.次の取得を待つ((l) => l.includes("NEW"));
        got.取得後 = await m.音声の再生回数();
      });
      await expected(async () => { expect.soft(got.取得後 - got.初回後, "NEW登録後の取得で鳴った音の回数（鳴る）").toBe(1); });
    } finally { await adm.close(); }
  };
}
caseTest("IT-F06-25-009", soundOnNew(1));
caseTest("IT-F06-25-011", soundOnNew(0));

caseTest("IT-F06-25-010", async ({ page, browser, step, expected }) => {
  readingNote();
  const m = new WaitingPage(page);
  const adm = await openTagAdmin(browser);
  const got = { 初回後: -1, 取得後: -1 };
  try {
    await step(1, async () => {
      await m.音声を数える();
      const l = await m.開いて初回取得を待つ(モニターのパス(本店));
      expect(l.map(String).sort(), "初回取得の番号札（KEEP-010・OLD）").toEqual(["KEEP-010", "OLD"]);
      got.初回後 = await m.音声の再生回数();
    });
    await step(2, async () => { await selectMain(adm.w); });
    await step(3, async () => { await adm.w.削除確認を開く("OLD"); await adm.w.削除確認で削除する(); });
    await step(4, async () => { await registerNew(adm.w); });
    await step(5, async () => {
      await m.次の取得を待つ((l) => l.includes("NEW"));
      got.取得後 = await m.音声の再生回数();
    });
    await expected(async () => { expect.soft(got.取得後 - got.初回後, "OLD削除・NEW登録後の取得で鳴った音の回数（件数は2件のまま、鳴る）").toBeGreaterThan(0); });
  } finally { await adm.close(); }
});

caseTest("IT-F06-25-012", async ({ page, step, expected }) => {
  readingNote();
  const m = new WaitingPage(page);
  const got = { 初回後: -1, 次回後: -1 };
  await step(1, async () => { await m.音声を数える(); await m.開いて初回取得を待つ(モニターのパス(本店)); got.初回後 = await m.音声の再生回数(); });
  await step(2, async () => { await m.次の取得を待つ(); got.次回後 = await m.音声の再生回数(); });
  await expected(async () => { expect.soft(got.次回後, "初回取得と次の取得で鳴った音の回数（鳴らない）").toBe(0); });
});

caseTest("IT-F06-25-013", async ({ page, browser, step, expected }) => {
  readingNote();
  const m = new WaitingPage(page);
  const adm = await openTagAdmin(browser);
  const got = { 初回後: -1, 取得後: -1, 一覧: [] as (string | number)[] };
  try {
    await step(1, async () => {
      await m.音声を数える();
      await m.開いて初回取得を待つ(モニターのパス(本店));
      got.初回後 = await m.音声の再生回数();
      expect(got.初回後, "初回取得の音の回数（前提）").toBe(1);
    });
    await step(2, async () => { await selectMain(adm.w); });
    await step(3, async () => { await adm.w.削除確認を開く("OLD"); await adm.w.削除確認で削除する(); });
    await step(4, async () => {
      got.一覧 = await m.次の取得を待つ((l) => !l.includes("OLD"));
      got.取得後 = await m.音声の再生回数();
    });
    await expected(async () => {
      expect.soft(got.一覧.map(String), "取得結果がKEEP-013だけ").toEqual(["KEEP-013"]);
      expect.soft(got.取得後 - got.初回後, "OLD削除後の取得で鳴った音の回数（鳴らない）").toBe(0);
    });
  } finally { await adm.close(); }
});

caseTest("IT-F06-25-017", async ({ page, step, expected }) => {
  readingNote();
  const m = new WaitingPage(page);
  const got = { 表示: [] as string[] };
  await step(1, async () => { await m.開いて初回取得を待つ(モニターのパス(本店)); });
  await step(2, async () => { got.表示 = await m.表示中の番号札(); });
  await expected(async () => {
    expect.soft(got.表示, "表示枠25枠にアルファベットAからYまでが並ぶ").toEqual("ABCDEFGHIJKLMNOPQRSTUVWXY".split(""));
    expect.soft(got.表示, "Zが表示されない").not.toContain("Z");
  });
});

caseTest("IT-F06-25-020", async ({ page, step, expected }) => {
  readingNote();
  const m = new WaitingPage(page);
  const got = { 初回後: -1, 次回後: -1 };
  await step(1, async () => {
    await m.音声を数える();
    const l = await m.開いて初回取得を待つ(モニターのパス(本店));
    expect(l.map(String), "初回取得の番号札").toEqual(["KEEP-020"]);
    got.初回後 = await m.音声の再生回数();
    expect(got.初回後, "初回取得の音の回数（前提）").toBe(1);
  });
  await step(2, async () => {
    const l = await m.次の取得を待つ();
    expect(l.map(String), "2回目の取得の番号札（前回と同じ）").toEqual(["KEEP-020"]);
    got.次回後 = await m.音声の再生回数();
  });
  await expected(async () => { expect.soft(got.次回後 - got.初回後, "2回目の取得で鳴った音の回数（鳴らない）").toBe(0); });
});
