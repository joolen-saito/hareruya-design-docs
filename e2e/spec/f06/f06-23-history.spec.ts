/**
 * F06-23 お問い合わせ履歴（お問い合わせの履歴を持つ会員のケース）。正本: cases/F06-23_test_cases.tsv
 * 005〜009・012〜021・025。お問い合わせは画面で送り、送信日時だけ DB で設定する（seeds/f06-23.ts。書き込みは lib/db_write.ts 経由、実行の印つきのお問い合わせだけ）。
 * お問い合わせ種別は共有のマスタを書き換えず、お問い合わせ画面の件名にある既存の件名の日本語・英語の名称で比べる（種別の名称()）。
 * 履歴のない会員のケース（001〜004・010・011・022〜024）は f06-23.spec.ts。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { hideDebugToolbar } from "../../lib/session";
import { 別のブラウザの画面を撮る, scene } from "../../lib/evidence_other";
import { 言語 } from "../../pages/front/f06_23_contact_history";
import { ContactDetailPage } from "../../pages/front/f06_24_contact_detail";
import { mailOf, 種別の名称 } from "../../seeds/f06-23";

type 行 = { 日時: string; 種別: string; 番号: string };
type 資格 = { メール: string; PW: string };

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 注記種別 = () => note(`お問い合わせ種別は共有のマスタを書き換えず、既にある件名「${種別の名称().日本語}」（英語「${種別の名称().英語}」）を使った。期待結果の「商品について」「About products」はこの名称で比べた`);
const 会員A = (n: string): 資格 => ({ メール: mailOf(`f0623_member_a-${n}`), PW: `F0623PassA${n}` });
const 会員B = (n: string): 資格 => ({ メール: mailOf(`f0623_member_b-${n}`), PW: `F0623PassB${n}` });
const 日 = { 履歴1: "2026/08/01 09:05", 履歴2: "2026/08/03 11:20", 履歴3: "2026/08/02 10:10", B: "2026/08/04 12:00" };

async function 会員で入る(page: Page, m: 資格, 言: 言語 = "ja"): Promise<ContactDetailPage> {
  const h = new ContactDetailPage(page, 言);
  await h.ログインする(m.メール, m.PW);
  expect(h.path, "会員でログインできた（ログイン画面のままでない）").not.toMatch(/\/mypage\/login/);
  return h;
}
/** 事前準備の「別のブラウザセッションで会員Bとしてログイン」 */
async function 別のセッションで入る(browser: Browser, m: 資格): Promise<{ h: ContactDetailPage; 閉じる: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const h = await 会員で入る(await context.newPage(), m);
  return { h, 閉じる: () => context.close() };
}
async function 行の番号を読む(h: ContactDetailPage, 日時: string): Promise<string> {
  // 行は送信日時の数字で探す（日本語表示の一覧の日時の書式は 012 で確かめる。書式の違いで行を見失わないため）
  const r = await h.日時の数字が合う行(日時);
  expect(r, `一覧に問い合わせ日時 ${日時} の行がある`).toBeDefined();
  return r!.番号;
}

caseTest("IT-F06-23-005", async ({ page, browser, step, expected }) => {
  const b = await 別のセッションで入る(browser, 会員B("005"));
  try {
    const a = await 会員で入る(page, 会員A("005"));
    let 番号B = "";
    let 番号A: string[] = [];
    let 一覧: string[] = [];
    await step(1, async () => {
      await b.h.開く(); 番号B = await 行の番号を読む(b.h, 日.B);
      // 会員Bは別のセッションなので自動の撮影に写らない。会員Bの履歴の画面（送信日時の行と番号）を残す
      await 別のブラウザの画面を撮る(b.h.page, scene.stepLabel(1, "会員B（別のブラウザ）のお問い合わせ履歴"));
    });
    await step(2, async () => { await a.開く(); });
    await step(3, async () => { 番号A = [await 行の番号を読む(a, 日.履歴1), await 行の番号を読む(a, 日.履歴2), await 行の番号を読む(a, 日.履歴3)]; });
    await step(4, async () => { 一覧 = (await a.行の内容()).map((r) => r.番号); });
    await expected(async () => {
      for (const n of 番号A) expect.soft(一覧, `会員Aの履歴に番号 ${n} が表示される`).toContain(n);
      expect.soft(一覧, `会員Bの番号 ${番号B} が表示されない`).not.toContain(番号B);
    });
  } finally { await b.閉じる(); }
});
caseTest("IT-F06-23-006", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("006"));
  let 順: string[] = [];
  let 一覧: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 順 = [await 行の番号を読む(h, 日.履歴1), await 行の番号を読む(h, 日.履歴2), await 行の番号を読む(h, 日.履歴3)]; });
  await step(3, async () => { 一覧 = (await h.行の内容()).map((r) => r.番号); });
  await expected(async () => { expect.soft(一覧, "お問い合わせ番号の並び（履歴1・履歴2・履歴3の順）").toEqual(順); });
});
caseTest("IT-F06-23-007", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("007"));
  let 番号 = "";
  let r: 行 | undefined;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 番号 = await 行の番号を読む(h, 日.履歴1); });
  await step(3, async () => { r = (await h.行の内容()).find((x) => x.番号 === 番号); });
  await expected(async () => {
    注記種別();
    // 書式（設計は「Y年m月d日 H:i」）は 012 で確かめる。ここでは送信日時が表示されていることを、日時の数字で確かめる
    expect.soft((r?.日時 ?? "").replace(/\D/g, ""), `一覧行の問い合わせ日時（表示「${r?.日時 ?? ""}」）`).toBe("202608010905");
    expect.soft(r?.種別, "一覧行のお問い合わせ種別").toBe(種別の名称().日本語);
    expect.soft(r?.番号, "一覧行のお問い合わせ番号").toBe(番号);
  });
});
function 件数の確認(n: string, 言: 言語, 期待: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = await 会員で入る(page, 会員A(n), 言);
    let 件数 = "";
    await step(1, async () => { await h.開く(); });
    await step(2, async () => { 件数 = await h.件数の表示(); });
    // 「13件」なども「3件」を含むので、件数の欄の文がちょうどその値であることを確かめる
    await expected(async () => { expect.soft(件数, "問い合わせ件数の表示").toBe(期待); });
  };
}
caseTest("IT-F06-23-008", 件数の確認("008", "ja", "3件"));
caseTest("IT-F06-23-009", 件数の確認("009", "en", "3 Items"));
caseTest("IT-F06-23-012", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("012"));
  let r: 行 | undefined;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { r = await h.日時の数字が合う行(日.履歴1); });
  await expected(async () => {
    注記種別();
    expect.soft(r, "送信日時2026-08-01 09:05の一覧行がある").toBeDefined();
    expect.soft(r?.日時, "問い合わせ日時").toContain("2026年08月01日 09:05");
    expect.soft(r?.種別, "お問い合わせ種別（日本語名称）").toBe(種別の名称().日本語);
  });
});
caseTest("IT-F06-23-013", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("013"), "en");
  let r: 行 | undefined;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { r = await h.日時の数字が合う行("08/01/2026 09:05"); });
  await expected(async () => {
    注記種別();
    expect.soft(r, "送信日時08/01/2026 09:05の一覧行がある").toBeDefined();
    expect.soft(r?.日時, "問い合わせ日時").toContain("08/01/2026 09:05");
    expect.soft(r?.種別, "お問い合わせ種別（英語名称）").toBe(種別の名称().英語);
  });
});
caseTest("IT-F06-23-014", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("014"));
  let 番号 = "";
  let 画面の番号 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    番号 = await 行の番号を読む(h, 日.履歴1);
    await h.押して遷移する(h.番号の行(番号).locator(h.行の種別));
    画面の番号 = await h.詳細の番号();
  });
  await expected(async () => {
    expect.soft(画面の番号, `詳細に表示されているお問い合わせ番号（控えた番号 ${番号}）`).toBe(番号);
    expect.soft(h.path, `遷移した画面（お問い合わせ番号 ${番号} の詳細）`).toBe(`/ja/contact/history/${番号}/detail`);
    expect.soft(await h.詳細画面である(), "お問い合わせ履歴詳細ページが表示される").toBe(true);
  });
});
caseTest("IT-F06-23-015", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("015"));
  let 番号 = "";
  let 画面の番号 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    番号 = await 行の番号を読む(h, 日.履歴1);
    await h.押して遷移する(h.番号の行(番号).locator(h.行の番号));
    画面の番号 = await h.詳細の番号();
  });
  await expected(async () => {
    expect.soft(画面の番号, `詳細に表示されているお問い合わせ番号（控えた番号 ${番号}）`).toBe(番号);
    expect.soft(h.path, `遷移した画面（お問い合わせ番号 ${番号} の詳細）`).toBe(`/ja/contact/history/${番号}/detail`);
    expect.soft(await h.詳細画面である(), "お問い合わせ履歴詳細ページが表示される").toBe(true);
  });
});
caseTest("IT-F06-23-016", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("016"));
  let 番号 = "";
  let 内容: string[] = [];
  let 枠の数 = 0;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    番号 = await 行の番号を読む(h, 日.履歴1);
    await h.押して遷移する(h.番号の行(番号));
  });
  await step(3, async () => {
    枠の数 = await h.詳細の枠.count();
    内容 = (await h.お問い合わせ内容.allInnerTexts()).map((t) => t.trim());
  });
  await expected(async () => {
    expect.soft(h.path, `表示した詳細のお問い合わせ番号 ${番号}`).toBe(`/ja/contact/history/${番号}/detail`);
    expect.soft(枠の数, "表示されているお問い合わせの数").toBe(1);
    expect.soft(内容.length, "お問い合わせ内容の数").toBe(1);
    expect.soft(内容[0] ?? "", "内容（履歴1）").toContain("確認したいです");
    expect.soft(内容[0] ?? "", "ほかの履歴の内容（追加確認・初回確認）は表示されない").not.toMatch(/追加確認|初回確認/);
  });
});
caseTest("IT-F06-23-017", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("017"));
  let 行の文: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.番号の行(await 行の番号を読む(h, 日.履歴1))); });
  await step(3, async () => {
    expect(await h.お問い合わせ内容.count(), "お問い合わせ内容の表示").toBe(1);
    行の文 = (await h.お問い合わせ内容.innerText()).split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
  });
  await expected(async () => { expect.soft(行の文, "お問い合わせ内容の行（2行に分かれる）").toEqual(["商品について", "確認したいです"]); });
});
function 詳細の日時と種別(n: string, 言: 言語, 日時: string, 種別: () => string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = await 会員で入る(page, 会員A(n), 言);
    let 日時の表示 = "", 種別の表示 = "";
    const 整える = (s: string) => s.replace(/\s+/g, " ").trim();
    await step(1, async () => { await h.開く(); });
    await step(2, async () => { await h.押して遷移する(h.番号の行(await 行の番号を読む(h, 言 === "ja" ? 日.履歴1 : "08/01/2026 09:05"))); });
    await step(3, async () => {
      expect(await h.詳細画面である(), "お問い合わせ履歴詳細ページが表示された").toBe(true);
      日時の表示 = 整える(await h.page.locator(".p-hareruya-contact-detail__date").first().innerText());
      種別の表示 = 整える(await h.page.locator(".p-hareruya-contact-detail__subject").first().innerText());
    });
    await expected(async () => {
      注記種別();
      expect.soft(日時の表示, "問い合わせ日時").toBe(日時);
      expect.soft(種別の表示, "お問い合わせ種別").toBe(種別());
    });
  };
}
caseTest("IT-F06-23-018", 詳細の日時と種別("018", "ja", "2026/08/01 09:05", () => 種別の名称().日本語));
caseTest("IT-F06-23-019", 詳細の日時と種別("019", "en", "08/01/2026 09:05", () => 種別の名称().英語));

const 注記エラー = "判定の根拠: 設計書（0306 お問い合わせ履歴詳細）は「他会員・存在しない番号を指定したときは当該内容を表示しない。閲覧専用のため画面上の明示エラーは出さない」。当該内容を表示しないことに加え、エラーページ（404 Page Not Found）・エラーの文言を出さないことを確かめた";
caseTest("IT-F06-23-020", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, 会員A("020"));
  let 応答 = 0;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.番号の行(await 行の番号を読む(h, 日.履歴1))); });
  await step(3, async () => {
    expect(await h.詳細画面である(), "置き換える前にお問い合わせ履歴詳細画面が表示されている").toBe(true);
    応答 = await h.URLを開く(h.番号を置き換えたURL("999999"));
    note(`置き換えたアドレスを開いた応答は ${応答}`);
  });
  await expected(async () => {
    const 文 = await h.画面の文();
    note(注記エラー);
    expect.soft(await h.詳細画面である(), "お問い合わせ番号999999の内容（詳細）が表示されない").toBe(false);
    expect.soft(文, "お問い合わせの内容が表示されない").not.toContain("確認したいです");
    expect.soft(応答, "明示のエラーを出さない（応答がエラー 400 以上でない）").toBeLessThan(400);
    await expect.soft(h.エラーページの表示, "明示のエラー（404 Page Not Found などのエラーページ・エラーの文言）を出さない").toHaveCount(0);
    expect.soft(await h.エラーや通知の表示(), "エラー・警告のインライン表示、フラッシュ、トーストが出ない").toEqual([]);
  });
});
caseTest("IT-F06-23-021", async ({ page, browser, step, expected }) => {
  const b = await 別のセッションで入る(browser, 会員B("021"));
  try {
    const a = await 会員で入る(page, 会員A("021"));
    let 番号B = "";
    let 応答 = 0;
    await step(1, async () => {
      await b.h.開く(); 番号B = await 行の番号を読む(b.h, 日.B);
      // 会員Bは別のセッションなので自動の撮影に写らない。会員Bの履歴の画面（送信日時の行と番号）を残す
      await 別のブラウザの画面を撮る(b.h.page, scene.stepLabel(1, "会員B（別のブラウザ）のお問い合わせ履歴"));
    });
    await step(2, async () => { await a.開く(); await a.押して遷移する(a.番号の行(await 行の番号を読む(a, 日.履歴1))); });
    await step(3, async () => {
      expect(await a.詳細画面である(), "置き換える前にお問い合わせ履歴詳細画面が表示されている").toBe(true);
      応答 = await a.URLを開く(a.番号を置き換えたURL(番号B));
      note(`置き換えたアドレスを開いた応答は ${応答}`);
    });
    await expected(async () => {
      const 文 = await a.画面の文();
      note(注記エラー);
      expect.soft(await a.詳細画面である(), `会員Bの番号 ${番号B} の詳細が表示されない`).toBe(false);
      expect.soft(文, "会員Bのお問い合わせ内容「会員B秘匿内容」が表示されない").not.toContain("会員B秘匿内容");
      expect.soft(応答, "明示のエラーを出さない（応答がエラー 400 以上でない）").toBeLessThan(400);
      await expect.soft(a.エラーページの表示, "明示のエラー（404 Page Not Found などのエラーページ・エラーの文言）を出さない").toHaveCount(0);
      expect.soft(await a.エラーや通知の表示(), "エラー・警告のインライン表示、フラッシュ、トーストが出ない").toEqual([]);
    });
  } finally { await b.閉じる(); }
});
caseTest("IT-F06-23-025", async ({ page, step, expected }) => {
  const h = await 会員で入る(page, { メール: mailOf("dpf0623-025-a"), PW: "Passw0rd-F0623025" });
  let 件数 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 件数 = await h.件数の表示(); });
  await expected(async () => { expect.soft(件数, "問い合わせ件数の表示（「11件」なども含まないよう、ちょうどの値）").toBe("1件"); });
});
