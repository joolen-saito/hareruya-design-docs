/**
 * F06-17 大会デッキ登録確認〜完了（フロント）の、デッキ登録完了メールのケース（004）。正本: cases/F06-17_test_cases.tsv
 *
 * - 会員・大会は seeds/f06-17.ts の S-F06-17-CASE-004（会員はフロントの新規会員登録。メールアドレスの前半に実行の印）。
 * - 試験メールの受信箱は、開発環境のメールの受け口（E2E_MAIL_URL。pages/mail_inbox.ts。読むだけ）で読む。
 *   受け口は共有なので、受信件数を0件にする代わりに、提出の直前に受け口のメールの番号を控え、それより後にその宛先へ届いたものだけを数える。
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import { mailIds, 届くのを待つ } from "../../pages/mail_inbox";
import * as DB from "../../db/f06_16";
import { カード名 } from "../../pages/admin/f06_17_setup";
import { 会員一覧, 大会一覧 } from "../../seeds/f06-17";
import "../../seeds/f06-17";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = 大会一覧.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };

async function ログイン(page: Page, n: string): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
}

caseTest("IT-F06-17-004", async ({ page, step, expected }) => {
  supplement("試験メールの受信箱は開発環境で共有のため、既存メールを消して受信件数を0件にする代わりに、提出の直前に受信箱のメールの番号を控え、それより後にその宛先へ届いたメールだけを数えた");
  await ログイン(page, "004");
  const m = 会員("004");
  note(`選手のメールアドレス「f0617-en-004@example.test」は、実行の印を付けた「${m.メール}」として読む（会員登録で入れたメールアドレス）`);
  const e = new DeckEditPage(page);
  const d = 大会("004");
  await step(1, async () => {
    await e.開く(d.日程ID);
    await expect(e.メイン, "大会デッキ登録編集画面のメインボードの入力欄が表示される").toBeVisible();
  });
  await step(2, async () => {
    const 選択肢 = await e.フォーマット選択肢();
    if (選択肢.length > 1) await e.フォーマットを選ぶ("スタンダード試験");
    else note(`フォーマット選択は表示されない（大会のフォーマットが「スタンダード試験」の1つだけ）。「スタンダード試験」を選ぶ操作はできず、フォームは隠し項目でフォーマット（ID ${await e.選択中のフォーマットID()}）を送る`);
    await e.入力する("メイン", `1 ${カード名.通常A()}`);
    await e.入力する("サイド", `1 ${カード名.通常B()}`);
    await expect(e.メイン, "メインボードに入れた内容").toHaveValue(`1 ${カード名.通常A()}`);
    await expect(e.サイド, "サイドボードに入れた内容").toHaveValue(`1 ${カード名.通常B()}`);
  });
  let before = new Set<number>();
  let r: Awaited<ReturnType<DeckEditPage["提出する"]>> | undefined;
  await step(3, async () => {
    before = await mailIds();
    r = await e.提出する();
    expect(r.送信, "「デッキリストを提出する」で送信された（送信先の応答があった）").toBe(true);
    await expect(page, "デッキ登録完了画面へ移る").toHaveURL(/\/deckentry\/\d+\/check\/?$/);
  });
  let decks: DB.大会デッキ[] = [];
  await step(4, async () => { decks = DB.大会デッキ一覧(d.日程ID, m.選手ID); });
  let 届いた: Awaited<ReturnType<typeof 届くのを待つ>> | null = null;
  await step(5, async () => { 届いた = await 届くのを待つ(m.メール, before); });
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキが保存された（件数）").toBe(1);
    const got = 届いた as Awaited<ReturnType<typeof 届くのを待つ>> | null;
    expect.soft(got?.件数 ?? 0, `「${m.メール}」宛のメールが1通送信される（件数）`).toBe(1);
    expect.soft(got?.件名 ?? "", "届いたメールの件名（デッキ登録完了メール）").toContain("デッキ登録完了");
  });
});
