/**
 * F06-24 お問い合わせ履歴詳細。正本: cases/F06-24_test_cases.tsv
 * 実装するのは 003〜008・010・011（8件。どれも条件付き: お問い合わせ種別を既にある件名で代え、お問い合わせ日時・電話番号を DB で設定しない。seeds/f06-24.ts）。
 * 実装しないもの: 001・002（お問い合わせ日時「2026/09/01 14:35」と種別名「商品について」「About Products」を確かめるが、どちらも DB での準備が要る）、
 * 009（お問い合わせ番号999999の残りを DB で削除するシード）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { お問い合わせの記録 } from "../../db/f06_24";
import { ContactDetailPage } from "../../pages/front/f06_24_contact_detail";
import { 試験会員A, 試験会員の姓 } from "../../seeds/f06-24";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 番号A = "〔お問い合わせ番号-F0624-共有A〕";
const 番号B = "〔お問い合わせ番号-F0624-共有B〕";

/** 事前準備の「新しいブラウザセッションを開始し、試験会員Aとしてログインする」 */
async function 試験会員Aでログイン(page: CaseCtx["page"]): Promise<ContactDetailPage> {
  const h = new ContactDetailPage(page, "ja");
  const a = 試験会員A();
  await h.ログインする(a.メール, a.パスワード);
  expect(h.path, "試験会員Aでログインできた（ログイン画面のままでない）").not.toMatch(/\/mypage\/login/);
  return h;
}

/** お問い合わせ履歴画面を開き（手順 from）、お問い合わせ番号を押す（手順 from+1） */
async function 詳細を開く(h: ContactDetailPage, step: CaseCtx["step"], 番号: string, from = 1): Promise<void> {
  await step(from, async () => { await h.開く(); });
  await step(from + 1, async () => {
    const link = h.番号のリンク(番号);
    await expect(link, `お問い合わせ履歴画面のお問い合わせ番号 ${番号} の行`).toHaveCount(1, { timeout: 30_000 });
    await h.押して遷移する(link);
  });
}

caseTest("IT-F06-24-003", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  await 詳細を開く(h, step, notes.get(番号A));
  await expected(async () => {
    expect.soft(await h.詳細画面である(), "お問い合わせ履歴詳細画面が表示される").toBe(true);
    await expect.soft(h.パンくず.first(), "お問い合わせ履歴詳細画面のパンくずリスト").toBeVisible();
  });
});

caseTest("IT-F06-24-004", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  const 番号 = notes.get(番号A);
  await 詳細を開く(h, step, 番号);
  let 前 = "";
  let 動いた = true;
  await step(3, async () => {
    前 = page.url();
    await expect(h.パンくず現在地, "パンくずリストの現在表示中ページ").toContainText(番号);
    動いた = await h.現在地を押す();
  });
  await expected(async () => {
    expect.soft(動いた, "現在表示中ページを押して画面遷移が起きない").toBe(false);
    expect.soft(page.url(), "押したあとのアドレス（押す前と同じ）").toBe(前);
    expect.soft(await h.詳細画面である(), "お問い合わせ履歴詳細画面に留まる").toBe(true);
  });
});

caseTest("IT-F06-24-005", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  await 詳細を開く(h, step, notes.get(番号A));
  await step(3, async () => { await h.押して遷移する(h.パンくずホーム); });
  await expected(async () => { expect.soft(h.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

caseTest("IT-F06-24-006", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  await 詳細を開く(h, step, notes.get(番号A));
  await expected(async () => {
    expect.soft(await h.詳細画面である(), "お問い合わせ履歴詳細画面が表示される").toBe(true);
    note(`ユーザ名は試験会員Aのお名前（姓「${試験会員の姓}」名「A」）。詳細画面の枠（パンくず・見出し・お問い合わせの内容・戻る）の文に出ないことを確かめた`);
    expect.soft(await h.詳細の枠の文(), "詳細画面の上部に試験会員Aのユーザ名が出ない").not.toContain(試験会員の姓);
  });
});

caseTest("IT-F06-24-007", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  await 詳細を開く(h, step, notes.get(番号A));
  await step(3, async () => { await h.押して遷移する(h.戻る); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面のアドレス（お問い合わせ履歴）").toMatch(/^\/ja\/contact\/history\/?$/);
    expect.soft(await h.履歴画面である(), "お問い合わせ履歴画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-24-008", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  await 詳細を開く(h, step, notes.get(番号A));
  await step(3, async () => {
    expect(await h.詳細画面である(), "置き換える前にお問い合わせ履歴詳細画面が表示されている").toBe(true);
    const s = await h.URLを開く(h.番号を置き換えたURL(notes.get(番号B)));
    note(`置き換えたアドレスを開いた応答は ${s}`);
  });
  await expected(async () => {
    const 文 = await h.画面の文();
    expect.soft(文, "試験会員Bのお問い合わせ時氏名「鈴木 花子」が表示されない").not.toContain("鈴木 花子");
    expect.soft(文, "試験会員Bのお問い合わせ内容「会員B秘匿内容」が表示されない").not.toContain("会員B秘匿内容");
    expect.soft(await h.エラーや通知の表示(), "エラー・警告のインライン表示、フラッシュ、トーストが出ない").toEqual([]);
  });
});

caseTest("IT-F06-24-010", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  let url = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    const link = h.番号のリンク(notes.get(番号A));
    await expect(link, "お問い合わせ履歴画面のお問い合わせ番号の行").toHaveCount(1, { timeout: 30_000 });
    await h.押して遷移する(link);
    expect(await h.詳細画面である(), "お問い合わせ履歴詳細画面が表示された").toBe(true);
    url = page.url();
    note(`記録したアドレス: ${new URL(url).pathname}`);
  });
  await step(3, async () => { await h.ログアウトする(); });
  await step(4, async () => {
    const s = await h.URLを開く(url);
    note(`記録したアドレスを開いた応答は ${s}、表示された画面のアドレスは ${h.path}`);
  });
  await expected(async () => {
    const 文 = await h.画面の文();
    expect.soft(文, "お問い合わせ時氏名「山田 太郎」が表示されない").not.toContain("山田 太郎");
    expect.soft(文, "お問い合わせ内容「第一行」が表示されない").not.toContain("第一行");
    expect.soft(文, "お問い合わせ内容「第二行」が表示されない").not.toContain("第二行");
    expect.soft(await h.エラーや通知の表示(), "エラー・警告のインライン表示、フラッシュ、トーストが出ない").toEqual([]);
  });
});

caseTest("IT-F06-24-011", async ({ page, notes, step, expected }) => {
  const h = await 試験会員Aでログイン(page);
  const 番号 = notes.get(番号A);
  let 前: string | null = null;
  let 後: string | null = null;
  await step(1, async () => { 前 = お問い合わせの記録(番号); });
  await 詳細を開く(h, step, 番号, 2);
  await step(4, async () => {
    expect(await h.詳細画面である(), "お問い合わせ履歴詳細画面が表示された").toBe(true);
    後 = お問い合わせの記録(番号);
  });
  await expected(async () => {
    expect.soft(前, `詳細表示の前にお問い合わせ番号 ${番号} の記録がある`).not.toBeNull();
    expect.soft(後, `詳細表示の後のお問い合わせ番号 ${番号} の記録（前と同じ）`).toBe(前);
  });
});
