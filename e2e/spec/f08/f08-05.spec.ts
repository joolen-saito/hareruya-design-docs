/**
 * F08-05 店頭買取査定申込確認（と申込履歴）。正本: cases/F08-05_test_cases.tsv
 *
 * - 店舗は、ケースごとの店舗の代わりに F08-05 で共通の試験店舗（支店URL itf0805pd003）を使う（seeds/f08-05.ts の読み替え）。
 *   手順の店舗識別名「itf0805cNNN」「itf0805cbNNN」「itf0805pdNNN」は、この店舗の支店URLとして読む。
 * - 申込者の姓とメールアドレスの前半には実行の印を付ける（「店舗の査定申込み」は、この店舗の、印つきの姓の申込みとして数える）。
 * - 受信箱は開発環境のメールの受け口（E2E_MAIL_URL）で読む。操作の前に控えたメールの番号より後に、申込者の（実行の印つきの）メールアドレスへ
 *   届いたメールだけを数える（ほかの人のメールを拾わない）。029・042・043・045・083 を実装した。
 * - 037〜041（共有のメールテンプレートの件名・基本情報の送信元などを書き換える）・085（共有の仮会員設定を無効にする）も実装した。
 *   これらは共有のものを書き換えるため、夜に1本だけで流す（E2E_ALLOW_SHARED=1）。書き換える前に全項目を画面から控え、
 *   ケースの終わりに基盤（lib/shared_restore.ts）が画面で元の値に戻して確かめる（seeds/f08-05.ts の冒頭）。
 */
import { Locator, Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { mailIds, メールの見出しを読む, 宛先に届いたメール, 受信メールの一覧を出す, 届くのを待つ, 待ってから数える, 日本時間の日付, 本文の比べ用 } from "../../pages/mail_inbox";
import { adminUrl, hideDebugToolbar, loginAdmin, withAdminSession } from "../../lib/session";
import { ShopBasicPage } from "../../pages/admin/m10_01_shop";
import * as db from "../../db/f08_05";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { ステータス変更履歴, 会員IDで検索する, 履歴の行 } from "../../pages/admin/f08_05_otc_detail";
import { openEditFromResult, resultRow, searchCustomer } from "../../pages/admin/f06_customer";
import { 会員登録編集の値, 先頭の件名を開く, 先頭の送信日, 検索結果の会員名, 送信履歴を開く, 配信履歴の行 } from "../../pages/admin/f08_05_member";
import { MemberApplyPage } from "../../pages/front/f08_05_apply";
import { OtcApplyPage, 申込入力, 申込者 } from "../../pages/front/f08_05_confirm";
import {
  F0805_ADMIN, F0805_PASSWORD, 基本情報の値, PD_MEMBER_PASSWORD, PD_STORE, pdMemberEmail, サプライ複数の入力, 仮会員設定を戻す, 会員メール, 共通入力,
  申込メール, 申込者の, 拒否の氏名, 英語の入力, 英語の申込者, 英語の米国の入力, 米国の入力, 米国の郵便番号つき入力, 適格請求書の入力,
} from "../../seeds/f08-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 共通の試験店舗の支店URL（手順の店舗識別名の読み替え） */
const 支店URL = PD_STORE.支店URL;
const 店舗の読み替え = `手順の店舗識別名は、共通の試験店舗の支店URL「${支店URL}」として開いた（シード作成時の問題の読み替え）`;

/** 仮会員設定を書き換えたら、ケースの終わり（OFF）と実行の最後（ON）に元の値へ戻す */
test.afterEach(async ({ browser }) => {
  for (const m of await 仮会員設定を戻す(browser, "ケース")) note(m);
});
test.afterAll(async ({ browser }) => {
  await 仮会員設定を戻す(browser, "実行");
});

type Step = CaseCtx["step"];
type 流れ = {
  入力: 申込入力; 申込者: 申込者;
  /** 会員登録フォームに入れるメールアドレス（無ければ会員登録をスキップする） */
  メール?: string;
  /** 国を選ぶ手順が入力の手順とは別にある */
  国を選ぶ手順?: boolean;
  /** 国が日本のまま都道府県を選び、そのあと国を選び直す手順がある（067） */
  都道府県を先に?: boolean;
};

/** 申込前ログイン画面 → 申込情報入力 → 会員登録フォーム → 確認画面（手順1から）。次の手順の番号を返す */
async function 確認画面まで(step: Step, a: OtcApplyPage, p: 流れ, from = 1): Promise<number> {
  let n = from;
  await step(n++, async () => {
    await a.申込前ログイン画面を開く(支店URL);
    if (p.入力.言語 === "EN") await a.言語でENを選ぶ();
  });
  await step(n++, async () => { await a.アカウントなしで進む(); });
  if (p.都道府県を先に) {
    await step(n++, async () => { await a.国を選ぶ("日本"); await a.都道府県を選ぶ("東京都"); });
    await step(n++, async () => { await a.国を選ぶ(p.入力.国); });
  } else if (p.国を選ぶ手順) {
    await step(n++, async () => { await a.国を選ぶ(p.入力.国); });
  }
  await step(n++, async () => {
    await a.入力する(p.入力, p.申込者, { 国を選ぶ: !(p.国を選ぶ手順 || p.都道府県を先に) });
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
  });
  await step(n++, async () => {
    if (p.メール) await a.会員登録の入力をして進む(p.メール, F0805_PASSWORD);
    else await a.会員登録をスキップする();
    await a.確認画面を待つ();
  });
  return n;
}

/** 確認画面の確定のボタンを押す手順（完了画面へ移ったかを返す） */
async function 確定する手順(step: Step, a: OtcApplyPage, n: number): Promise<{ 完了画面: boolean; パス: string }> {
  let r = { 完了画面: false, パス: "" };
  await step(n, async () => {
    r = await a.確定する();
    if (!r.完了画面) note(`確定のボタンを押したあと、完了画面ではなく ${r.パス} へ移った`);
  });
  return r;
}

const 店舗ID = (c: CaseCtx, 呼び名: string) => c.notes.get(`〔店舗ID-F0805-${呼び名}〕`);

// ================= 確認画面の表示 =================

caseTest("IT-F08-05-001", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("001") });
  await c.expected(async () => {
    expect(await a.確認の値("住所"), "確認画面の住所の表示（住所3を含む）").toContain("F0805-001ビル");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-002", async (c) => {
  const a = new OtcApplyPage(c.page);
  const mail = 申込メール("f0805-002");
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("002"), メール: mail });
  await c.expected(async () => {
    expect.soft(await a.確認の値("メールアドレス"), "確認画面のメールアドレス").toBe(mail);
    expect.soft(await a.確認の値("メールアドレス(確認用)"), "確認画面のメールアドレス(確認用)").toBe(mail);
    expect.soft(await a.確認の値("パスワード"), "確認画面のパスワード").toBe("********");
    expect.soft(await a.確認の値("パスワード(確認用)"), "確認画面のパスワード(確認用)").toBe("********");
  });
  note(`${店舗の読み替え}。メールアドレスは正本の f0805-002@example.test の前半に実行の印を付けた値（${mail}）`);
});

caseTest("IT-F08-05-003", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("003"), メール: 申込メール("f0805-003") });
  await c.expected(async () => {
    await expect.soft(a.確定ボタン(), "会員登録フォームで入力した確認画面の、申込みを確定するボタン").toBeVisible();
    expect.soft(await a.確定ボタンの名前(), "申込みを確定するボタンの名前（「申込み」を含む）").toContain("申込み");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-015", async (c) => {
  const a = new OtcApplyPage(c.page);
  const who = 申込者の("015");
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: who });
  await c.expected(async () => {
    const name = (await a.確認の値("お名前")) ?? "";
    expect.soft(name, "確認画面のお名前（姓）").toContain(who.姓);
    expect.soft(name, "確認画面のお名前（名）").toContain("太郎");
    const addr = (await a.確認の値("住所")) ?? "";
    expect.soft(addr, "確認画面の住所（都道府県）").toContain("東京都");
    expect.soft(addr, "確認画面の住所（住所1）").toContain("千代田区");
    expect.soft(await a.確認の値("職業"), "確認画面の職業").toBe("会社員");
    expect.soft(await a.確認の値("電話連絡"), "確認画面の電話連絡").toBe("不必要");
    expect.soft(await a.確認の値("大会参加中または参加予定"), "確認画面の大会参加中または参加予定").toBe("いいえ");
  });
  note(`${店舗の読み替え}。姓は正本の「査定F0805-015」に実行の印を付けた値（${who.姓}）`);
});

caseTest("IT-F08-05-016", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("016"), メール: 申込メール("f0805-016") });
  await c.expected(async () => {
    await expect(a.確認の枠("パスワード"), "確認画面のパスワードの項目（表示されている）").toHaveCount(1);
    await expect(a.確認の枠("パスワード(確認用)"), "確認画面のパスワード(確認用)の項目（表示されている）").toHaveCount(1);
    expect.soft(await a.確認の値("パスワード"), "確認画面のパスワードの表示（入力した値を出さない）").not.toContain(F0805_PASSWORD);
    expect.soft(await a.確認の値("パスワード(確認用)"), "確認画面のパスワード(確認用)の表示（入力した値を出さない）").not.toContain(F0805_PASSWORD);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-017", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 適格請求書の入力, 申込者: 申込者の("017") });
  await c.expected(async () => {
    expect(await a.確認の値("適格請求書発行事業者確認"), "確認画面の適格請求書発行事業者の回答欄と、続く登録番号").toMatch(/^はい／登録番号:\s*T8050000000009$/);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-018", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("018") });
  await c.expected(async () => {
    await expect(a.確認の枠("適格請求書発行事業者確認"), "確認画面の適格請求書発行事業者の項目（読み込みが済んだ）").toBeVisible();
    expect(await a.画面の文(), "確認画面の「登録番号:」の表示").not.toContain("登録番号:");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-019", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("019") });
  await c.expected(async () => {
    await expect(a.確認の枠("お名前"), "確認画面のお名前の項目（読み込みが済んだ）").toBeVisible();
    for (const k of ["メールアドレス", "メールアドレス(確認用)", "パスワード", "パスワード(確認用)"] as const) {
      await expect.soft(a.確認の枠(k), `確認画面の${k}の項目の数`).toHaveCount(0);
    }
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-020", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 米国の入力, 申込者: 申込者の("020"), 国を選ぶ手順: true });
  await c.expected(async () => {
    await expect(a.確認の枠("住所"), "確認画面の住所の項目（読み込みが済んだ）").toBeVisible();
    await expect.soft(c.page.locator('[name="otc_buy_order[pref]"]:visible'), "確認画面の都道府県の入力欄（見えるもの）の数").toHaveCount(0);
    expect.soft(await a.入力できる欄の数("住所"), "確認画面の住所の枠の中の入力欄の数").toBe(0);
  });
  note(`${店舗の読み替え}。郵便番号は国の切り替えで1欄になり、正本の入力値に無いので入れていない`);
});

caseTest("IT-F08-05-021", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 英語の入力, 申込者: 英語の申込者("021") });
  await c.expected(async () => {
    await expect(a.確認の枠("お名前"), "英語表示の確認画面のお名前の項目（読み込みが済んだ）").toBeVisible();
    await expect(a.確認の枠("お名前(フリガナ)"), "英語表示の確認画面のお名前(フリガナ)の項目の数").toHaveCount(0);
  });
  note(`${店舗の読み替え}。手順2のリンクは画面では「If you don't have an account, click here」。手順4の「会員登録をスキップする」は英語表示では「Skip Registration」`);
});

caseTest("IT-F08-05-022", async (c) => {
  const a = new OtcApplyPage(c.page);
  const who = 英語の申込者("022");
  await 確認画面まで(c.step, a, { 入力: 英語の米国の入力, 申込者: who, 国を選ぶ手順: true });
  await c.expected(async () => {
    const lines = ((await a.確認の値("住所")) ?? "").split("／");
    const 入力 = [who.住所3 ?? "", 英語の米国の入力.住所2, 英語の米国の入力.住所1];
    expect(lines.filter((l) => !入力.includes(l)), "英語表示で国を日本以外にした確認画面の住所の、入力した住所以外の行（都道府県）").toEqual([]);
  });
  note(`${店舗の読み替え}。住所の表示の行が、入力した住所3・住所2・住所1だけであること（都道府県の行が無いこと）で確かめた`);
});

caseTest("IT-F08-05-025", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("025") });
  await c.expected(async () => {
    await c.page.waitForTimeout(2000); // 画面のスクリプトが残り時間を表示するまで待つ
    expect(await a.画面の文(), "確認画面の「入力時間：残り」の表示").not.toContain("入力時間：残り");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-050", async (c) => {
  const a = new OtcApplyPage(c.page);
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("050") });
  const r: Record<string, { 欄: number; 前: string; 後: string }> = {};
  await c.step(n, async () => {
    for (const k of ["お名前", "住所", "職業"] as const) {
      const 前 = (await a.確認の値(k)) ?? "";
      const 欄 = await a.入力できる欄の数(k);
      await a.値を押して打つ(k, "X");
      r[k] = { 欄, 前, 後: (await a.確認の値(k)) ?? "" };
    }
  });
  await c.expected(async () => {
    for (const k of ["お名前", "住所", "職業"]) {
      expect.soft(r[k].欄, `確認画面の${k}の枠の中の入力欄の数`).toBe(0);
      // 「変わらない」を、値が読めなかった（空のまま）だけで合格にしない
      expect.soft(r[k].前, `確認画面の${k}の値が表示されている（打つ前）`).not.toBe("");
      expect.soft(r[k].後, `確認画面の${k}の値（文字を打ったあとも変わらない）`).toBe(r[k].前);
    }
  });
  note(`${店舗の読み替え}。それぞれの値の文を押して「X」を打った`);
});

caseTest("IT-F08-05-051", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("051") });
  await c.expected(async () => {
    expect.soft(await a.確認の値("Language"), "確認画面の Language").toBe("JP");
    expect.soft(await a.確認の値("国"), "確認画面の国").toBe("Japan");
    expect.soft(await a.確認の値("住所"), "確認画面の住所（住所2）").toContain("千代田1-1");
    expect.soft(await a.確認の値("返却希望サプライ"), "確認画面の返却希望サプライ").toBe("スリーブ");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-053", async (c) => {
  const a = new OtcApplyPage(c.page);
  let body = "";
  let n = 1;
  await c.step(n++, async () => { await a.申込前ログイン画面を開く(支店URL); });
  await c.step(n++, async () => { await a.アカウントなしで進む(); });
  await c.step(n++, async () => {
    await a.入力する(共通入力, 申込者の("053"));
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
  });
  await c.step(n++, async () => {
    body = await a.会員登録の入力をして進み応答を読む(申込メール("f0805-053"), F0805_PASSWORD);
    await a.確認画面を待つ();
  });
  const 値: Record<string, string[]> = {};
  await c.step(n++, async () => {
    for (const k of ["first", "second"]) {
      const tags = body.match(new RegExp(`<input[^>]*name="otc_buy_order\\[password\\]\\[${k}\\]"[^>]*>`, "g")) ?? [];
      値[k] = tags.map((t) => /value="([^"]*)"/.exec(t)?.[1] ?? "");
    }
  });
  await c.expected(async () => {
    expect.soft(値.first, "確認画面の応答の、再送信用のパスワードの値").toContain(F0805_PASSWORD);
    expect.soft(値.second, "確認画面の応答の、再送信用のパスワード(確認用)の値").toContain(F0805_PASSWORD);
  });
  note(`${店舗の読み替え}。開発者ツールで応答を開く代わりに、確認画面を返した応答の本文を読み、パスワードの隠し項目の値を見た`);
});

caseTest("IT-F08-05-062", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("062") });
  await c.expected(async () => {
    const kana = (await a.確認の値("お名前(フリガナ)")) ?? "";
    expect.soft(kana, "確認画面のお名前(フリガナ)（姓カナ）").toContain("ケッテイ");
    expect.soft(kana, "確認画面のお名前(フリガナ)（名カナ）").toContain("タロウ");
    expect.soft(await a.確認の値("郵便番号"), "確認画面の郵便番号").toContain("100-8050");
    expect.soft(await a.確認の値("生年月日"), "確認画面の生年月日（年1977・月7・日7）").toMatch(/1977\D+0?7\D+0?7/);
    expect.soft(await a.確認の値("電話番号"), "確認画面の電話番号（03・5805・0805）").toMatch(/03\D*5805\D*0805/);
    expect.soft(await a.確認の値("適格請求書発行事業者確認"), "確認画面の適格請求書発行事業者確認の回答").toBe("いいえ");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-063", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 適格請求書の入力, 申込者: 申込者の("063") });
  await c.expected(async () => {
    expect((await a.確認の値("適格請求書発行事業者確認"))?.split("／")[0], "確認画面の適格請求書発行事業者確認の回答").toBe("はい");
  });
  note(店舗の読み替え);
});

/** 利用規約の項目の数（申込フォーム側・会員登録フォーム側） */
async function 利用規約の数(page: Page): Promise<{ 申込側: number; 会員登録側: number; 見出し: string[] }> {
  const all = page.locator(".p-hareruya-entry--confirm .p-hareruya-entry__terms");
  const bottom = page.locator(".p-hareruya-entry--confirm .p-hareruya-entry__content-bottom .p-hareruya-entry__terms");
  const 全部 = await all.count();
  const 会員登録側 = await bottom.count();
  return { 申込側: 全部 - 会員登録側, 会員登録側, 見出し: (await all.locator(".p-hareruya-form-block__label").allInnerTexts()).map((t) => t.trim()) };
}
const 利用規約の注記 = (見出し: string[]) => `利用規約の項目は、確認画面の利用規約の枠（申込フォーム側と、会員登録フォームの見出しの下の会員登録フォーム側）で数えた。画面の見出しは「${見出し.join("」「")}」`;

caseTest("IT-F08-05-064", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("064") });
  let r = { 申込側: 0, 会員登録側: 0, 見出し: [] as string[] };
  await c.expected(async () => {
    await expect(a.確認の枠("お名前"), "確認画面のお名前の項目（読み込みが済んだ）").toBeVisible();
    r = await 利用規約の数(c.page);
    expect(r.申込側, "確認画面の申込フォーム側の利用規約の項目の数").toBe(1);
  });
  note(`${店舗の読み替え}。${利用規約の注記(r.見出し)}`);
});

caseTest("IT-F08-05-071", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("071") });
  let r = { 申込側: 0, 会員登録側: 0, 見出し: [] as string[] };
  await c.expected(async () => {
    await expect(a.確認の枠("お名前"), "確認画面のお名前の項目（読み込みが済んだ）").toBeVisible();
    r = await 利用規約の数(c.page);
    expect.soft(r.会員登録側, "確認画面の会員登録フォーム側の利用規約の項目の数").toBe(0);
    expect.soft(r.申込側 + r.会員登録側, "確認画面の利用規約の項目の数").toBe(1);
  });
  note(`${店舗の読み替え}。${利用規約の注記(r.見出し)}`);
});

caseTest("IT-F08-05-076", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("076"), メール: 申込メール("dpf0805-076") });
  let r = { 申込側: 0, 会員登録側: 0, 見出し: [] as string[] };
  await c.expected(async () => {
    r = await 利用規約の数(c.page);
    expect.soft(r.会員登録側, "確認画面の会員登録フォーム側の利用規約の項目の数").toBe(1);
    expect.soft(r.申込側 + r.会員登録側, "確認画面の利用規約の項目の数").toBe(2);
  });
  note(`${店舗の読み替え}。${利用規約の注記(r.見出し)}`);
});

caseTest("IT-F08-05-066", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 米国の郵便番号つき入力, 申込者: 申込者の("066"), 国を選ぶ手順: true });
  await c.expected(async () => {
    expect(await a.確認の値("郵便番号"), "国をアメリカ合衆国にした確認画面の郵便番号（1欄）").toBe("90210");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-067", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 米国の郵便番号つき入力, 申込者: 申込者の("067"), 都道府県を先に: true });
  await c.expected(async () => {
    expect(await a.確認の値("住所"), "確認画面の住所の表示（国を変える前に選んだ都道府県）").toContain("東京都");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-081", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: サプライ複数の入力, 申込者: 申込者の("081") });
  await c.expected(async () => {
    expect(await a.確認の値("返却希望サプライ"), "確認画面の返却希望サプライ").toBe("スリーブ・ストレージボックス・F0805-081サプライ");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-086", async (c) => {
  const a = new OtcApplyPage(c.page);
  await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("CB086") });
  await c.expected(async () => {
    expect.soft(await a.確認の値("郵便番号"), "確認画面の郵便番号（前半と後半を「-」でつなぐ）").toContain("100-8050");
    expect.soft(await a.確認の値("住所"), "確認画面の住所（都道府県）").toContain("東京都");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-088", async (c) => {
  const a = new OtcApplyPage(c.page);
  const who = 英語の申込者("CB088", { 住所3: undefined });
  await 確認画面まで(c.step, a, { 入力: 英語の入力, 申込者: who });
  await c.expected(async () => {
    expect.soft(await a.確認の値("お名前"), "英語表示の確認画面の氏名（名・姓の順）").toBe(`太郎 ${who.姓}`);
    await expect.soft(a.確認の枠("お名前(フリガナ)"), "英語表示の確認画面のお名前(フリガナ)の項目の数").toHaveCount(0);
    expect.soft(await a.確認の値("郵便番号"), "英語表示の確認画面の郵便番号").toContain("100-8050");
    const lines = ((await a.確認の値("住所")) ?? "").split("／");
    expect.soft(lines.slice(0, 2), "英語表示の確認画面の住所（住所2・住所1の順）").toEqual(["1-1", "Chiyoda"]);
    expect.soft(lines[2] ?? "", "英語表示の確認画面の住所の3行目（東京都に当たる都道府県）").toMatch(/^(東京都|Tokyo)$/i);
  });
  note(`${店舗の読み替え}。英語表示では「会員登録をスキップする」は「Skip Registration」`);
});

// ================= 確認画面の操作 =================

caseTest("IT-F08-05-024", async (c) => {
  const a = new OtcApplyPage(c.page);
  const who = 申込者の("024");
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: who });
  await c.step(n, async () => { await a.戻る(); });
  await c.expected(async () => {
    const v = await a.入力画面の値();
    expect.soft(v.国, "申込情報入力画面の国").toBe("Japan");
    expect.soft(v.姓, "申込情報入力画面のお名前（姓）").toBe(who.姓);
    expect.soft(v.名, "申込情報入力画面のお名前（名）").toBe("太郎");
    expect.soft(v.住所1, "申込情報入力画面の住所1").toBe("千代田区");
    expect.soft(v.住所2, "申込情報入力画面の住所2").toBe("千代田1-1");
    expect.soft(v.住所3, "申込情報入力画面の住所3").toBe("F0805-024ビル");
    expect.soft(v.職業, "申込情報入力画面の職業").toBe("会社員");
    expect.soft(v.電話連絡, "申込情報入力画面の電話連絡").toBe("不必要");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-014", async (c) => {
  const a = new OtcApplyPage(c.page);
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("014") });
  await 確定する手順(c.step, a, n);
  await c.expected(async () => {
    await expect.soft(a.完了の表示(), "店頭買取査定申込登録確認～完了の完了画面").toBeVisible();
    expect.soft(await a.査定番号(), "完了画面の査定番号欄の値").toMatch(/\S+/);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-026", async (c) => {
  test.setTimeout(30 * 60_000);
  const a = new OtcApplyPage(c.page);
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("026") });
  let 待った後 = "";
  await c.step(n, async () => {
    await c.page.waitForTimeout(11 * 60_000);
    待った後 = new URL(c.page.url()).pathname;
  });
  let r = { 完了画面: false, パス: "" };
  await c.step(n + 1, async () => {
    if (!/\/confirm$/.test(待った後)) note(`11分待ったあと、画面は確認画面ではなく ${待った後} だった（確定のボタンを押せない）`);
    r = await a.確定する();
  });
  await c.expected(async () => {
    expect.soft(待った後, "11分待ったあとの画面（申込前ログイン画面へ戻らない）").toMatch(/\/confirm$/);
    expect.soft(r.完了画面, "確定のボタンを押したあとに完了画面へ移った").toBe(true);
    await expect.soft(a.完了の表示(), "店頭買取査定申込登録確認～完了の完了画面").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-027", async (c) => {
  const a = new OtcApplyPage(c.page);
  const A = 申込者の("027-A");
  const B = 申込者の("027-B");
  await c.step(1, async () => { await a.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await a.アカウントなしで進む(); });
  await c.step(3, async () => {
    await a.入力する(共通入力, A);
    expect(await a.次のページへ進む(), "1回目の「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
    await expect(a.会員登録フォーム(), "会員登録フォームが表示される").toBeVisible();
  });
  await c.step(4, async () => { await a.申込前ログイン画面を開く(支店URL); });
  await c.step(5, async () => { await a.アカウントなしで進む(); });
  await c.step(6, async () => {
    await a.入力する(共通入力, B);
    expect(await a.次のページへ進む(), "2回目の「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
  });
  await c.step(7, async () => { await a.会員登録をスキップする(); await a.確認画面を待つ(); });
  await c.expected(async () => {
    const name = (await a.確認の値("お名前")) ?? "";
    expect.soft(name.split(" ")[0], "確認画面のお名前の姓（2回目に入力した値）").toBe(B.姓);
  });
  note(`${店舗の読み替え}。姓は正本の値に実行の印を付けた値（1回目 ${A.姓}・2回目 ${B.姓}）`);
});

caseTest("IT-F08-05-031", async (c) => {
  const a = new OtcApplyPage(c.page);
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: 申込者の("031", { 姓の頭: "拒否", 名: "対象" }), メール: 申込メール("f0805-031") });
  const r = await 確定する手順(c.step, a, n);
  await c.expected(async () => {
    expect.soft(r.完了画面, "ブラックリストに一致しても、確定のボタンで完了画面へ移った").toBe(true);
    await expect.soft(a.完了の表示(), "店頭買取査定申込登録確認～完了の完了画面").toBeVisible();
  });
  note(`${店舗の読み替え}。ブラックリストの氏名は ${拒否の氏名("031")}`);
});

// ================= 申込みの登録（DB確認） =================

/** 会員登録なし・ありで申込み、DBで確かめるケースの共通の手順（確定まで）。確定の手順の番号の次を返す */
async function 申込む(c: CaseCtx, p: 流れ): Promise<{ a: OtcApplyPage; n: number; r: { 完了画面: boolean; パス: string } }> {
  const a = new OtcApplyPage(c.page);
  const n = await 確認画面まで(c.step, a, p);
  const r = await 確定する手順(c.step, a, n);
  return { a, n: n + 1, r };
}

caseTest("IT-F08-05-005", async (c) => {
  const who = 申込者の("005");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "005"), who.姓); });
  await c.expected(async () => { expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1); });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-006", async (c) => {
  const who = 申込者の("006");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  let hist: db.状態の履歴[] = [];
  await c.step(n, async () => {
    rows = db.査定申込み(店舗ID(c, "006"), who.姓);
    hist = rows[0] ? db.ステータス変更履歴(rows[0].id) : [];
  });
  await c.expected(async () => {
    expect.soft(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(hist.length, "その査定申込みを対象とするステータス変更履歴の件数").toBe(1);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-007", async (c) => {
  const who = 申込者の("007");
  const { n } = await 申込む(c, { 入力: 適格請求書の入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "007"), who.姓); });
  await c.expected(async () => {
    expect.soft(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.フリーコメント ?? null, "査定申込みのフリーコメント").toBe("適格請求書発行事業者");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-077", async (c) => {
  const who = 申込者の("077");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "077"), who.姓); });
  await c.expected(async () => {
    expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.フリーコメント ?? "", "査定申込みのフリーコメント（「適格請求書発行事業者」でない）").not.toBe("適格請求書発行事業者");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-013", async (c) => {
  const who = 申込者の("013", { 姓の頭: "拒否", 名: "対象", セイ: "キョヒ", メイ: "タイショウ" });
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: 申込メール("f0805-013") });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "013"), who.姓); });
  await c.expected(async () => { expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1); });
  note(`${店舗の読み替え}。ブラックリストの氏名は ${拒否の氏名("013")}`);
});

caseTest("IT-F08-05-028", async (c) => {
  const who = 申込者の("028", { 姓の頭: "拒否", 名: "対象" });
  const mail = 申込メール("f0805-028");
  const { n, r: 確定 } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  const r = { 会員: -1, プレイヤー: -1, 住所帳: -1, 申込み: -1 };
  await c.step(n, async () => {
    r.会員 = db.会員(mail).length;
    r.プレイヤー = db.プレイヤー(mail).length;
    r.住所帳 = db.姓の住所帳の数(who.姓);
    r.申込み = db.査定申込み(店舗ID(c, "028"), who.姓).length;
  });
  await c.expected(async () => {
    // 「会員が0件」を、申込みが確定されなかっただけで合格にしない。申込み自体は受け付けられる（会員登録だけを行わない）
    expect.soft(確定.完了画面, `「会員登録して申込み」を押したあと完了画面へ移った（${確定.パス}）`).toBe(true);
    expect.soft(r.申込み, "店舗の、この申込者の査定申込みの件数（申込みは受け付けられた）").toBe(1);
    expect.soft(r.会員, "このメールアドレスの会員の件数").toBe(0);
    expect.soft(r.プレイヤー, "このメールアドレスのプレイヤーの件数").toBe(0);
    expect.soft(r.住所帳, "この氏名(姓)の住所帳の件数").toBe(0);
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}、姓 ${who.姓}（ともに実行の印つき）`);
});

caseTest("IT-F08-05-046", async (c) => {
  const who = 申込者の("046");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let hist: db.状態の履歴[] = [];
  let 完了 = "";
  await c.step(n, async () => {
    const rows = db.査定申込み(店舗ID(c, "046"), who.姓);
    hist = rows[0] ? db.ステータス変更履歴(rows[0].id) : [];
    完了 = db.査定申込みの状態().find((s) => s.名前 === "完了")?.名前 ?? "完了";
  });
  await c.expected(async () => {
    expect(hist.length, "この申込者の査定申込みのステータス変更履歴の件数").toBe(1);
    expect.soft(hist[0]?.状態 ?? "", "ステータス変更履歴の状態（完了前の状態＝完了ではない）").not.toBe(完了);
  });
  note(`${店舗の読み替え}。完了前の状態は、状態の名前が「完了」でないこととして確かめた（状態の名前はエビデンスの実際の状態に出る）`);
});

caseTest("IT-F08-05-047", async (c) => {
  const who = 申込者の("047");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let hist: db.状態の履歴[] = [];
  await c.step(n, async () => {
    const rows = db.査定申込み(店舗ID(c, "047"), who.姓);
    hist = rows[0] ? db.ステータス変更履歴(rows[0].id) : [];
  });
  await c.expected(async () => {
    expect(hist.length, "この申込者の査定申込みのステータス変更履歴の件数").toBe(1);
    expect.soft(hist[0]?.管理者ID ?? null, "ステータス変更履歴の操作した管理者").toBeNull();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-048", async (c) => {
  const who = 申込者の("048");
  const { n, r: 確定 } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let 件数 = -1, 申込み = -1;
  await c.step(n, async () => { 件数 = db.姓の会員数(who.姓); 申込み = db.査定申込み(店舗ID(c, "048"), who.姓).length; });
  await c.expected(async () => {
    // 「会員が0件」を、申込みが確定されなかっただけで合格にしない（会員登録をせずに申込んだ後であることを確かめる）
    expect.soft(確定.完了画面, `「査定申込み」を押したあと完了画面へ移った（${確定.パス}）`).toBe(true);
    expect.soft(申込み, "店舗の、この申込者の査定申込みの件数（申込んだ）").toBe(1);
    expect(件数, "この姓の会員の件数").toBe(0);
  });
  note(`${店舗の読み替え}。姓「査定F0805-048」の会員を0件にする事前準備（あれば削除）は、姓に実行の印を付けて代えた（${who.姓}）`);
});

caseTest("IT-F08-05-049", async (c) => {
  const a = new OtcApplyPage(c.page);
  const who = 申込者の("049");
  const n = await 確認画面まで(c.step, a, { 入力: 共通入力, 申込者: who });
  let 件数 = -1;
  await c.step(n, async () => { 件数 = db.査定申込み(店舗ID(c, "049"), who.姓).length; });
  await c.expected(async () => {
    await expect(a.確定ボタン(), "確認画面のまま（確定のボタンを押していない）").toBeVisible();
    expect(件数, "店舗の、この申込者の査定申込みの件数").toBe(0);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-055", async (c) => {
  const who = 申込者の("055");
  const { a, n, r: 一回目 } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let 二回目を押した = false;
  await c.step(n, async () => {
    await c.page.goBack({ waitUntil: "load" }).catch((e) => note(`ブラウザの「戻る」で読み込みが終わらなかった（${(e as Error).message.split("\n")[0]}）`));
    const path = new URL(c.page.url()).pathname;
    if (await a.確定ボタン().isVisible()) {
      const r = await a.確定する();
      二回目を押した = true;
      note(`「戻る」で ${path} に戻り、もう一度確定のボタンを押した。移った先は ${r.パス}`);
    } else {
      note(`「戻る」で戻った画面（${path}）に確定のボタンが無く、押せなかった`);
    }
  });
  let 件数 = -1;
  await c.step(n + 1, async () => { 件数 = db.査定申込み(店舗ID(c, "055"), who.姓).length; });
  await c.expected(async () => {
    expect.soft(一回目.完了画面, `1回目の「査定申込み」のあと完了画面へ移った（${一回目.パス}）`).toBe(true);
    // 「2件目が登録されない」を、2回目の確定を押せなかっただけで合格にしない
    expect.soft(二回目を押した, "「戻る」で戻った確認画面で、もう一度「査定申込み」を押せた").toBe(true);
    expect(件数, "店舗の、この申込者の査定申込みの件数（2件目が登録されない）").toBe(1);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-057", async (c) => {
  const who = 申込者の("057");
  const ctx2 = await c.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx2);
    const page2 = await ctx2.newPage();
    page2.setDefaultTimeout(60_000);
    const a = new OtcApplyPage(c.page);
    const b = new OtcApplyPage(page2);
    await c.step(1, async () => { await a.申込前ログイン画面を開く(支店URL); await b.申込前ログイン画面を開く(支店URL); });
    await c.step(2, async () => { await a.アカウントなしで進む(); await b.アカウントなしで進む(); });
    await c.step(3, async () => {
      for (const x of [a, b]) {
        await x.入力する(共通入力, who);
        expect(await x.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
      }
    });
    await c.step(4, async () => {
      for (const x of [a, b]) { await x.会員登録をスキップする(); await x.確認画面を待つ(); }
    });
    await c.step(5, async () => {
      const [ra, rb] = await Promise.all([a.確定する(), b.確定する()]);
      note(`同時に確定のボタンを押した。1つ目は ${ra.パス}、2つ目は ${rb.パス} へ移った`);
    });
  } finally {
    await ctx2.close();
  }
  let rows: db.査定申込み[] = [];
  await c.step(6, async () => { rows = db.査定申込み(店舗ID(c, "057"), who.姓); });
  await c.expected(async () => {
    expect.soft(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(2);
    expect.soft(new Set(rows.map((r) => r.査定番号)).size, "2件の査定番号の種類の数（異なる）").toBe(2);
  });
  note(`${店舗の読み替え}。2つ目のブラウザセッションは、同じブラウザの別のコンテキスト（クッキーを分けたもの）で開いた。画面のキャプチャは1つ目のセッション`);
});

caseTest("IT-F08-05-058", async (c) => {
  const who = 申込者の("058");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  let hist: db.状態の履歴[] = [];
  await c.step(n, async () => {
    rows = db.査定申込み(店舗ID(c, "058"), who.姓);
    hist = rows[0] ? db.ステータス変更履歴(rows[0].id) : [];
  });
  await c.expected(async () => {
    expect(hist.length, "この申込者の査定申込みのステータス変更履歴の件数").toBe(1);
    expect.soft(hist[0].作成日時 >= rows[0].申込日時, `ステータス変更履歴の登録日時（${hist[0].作成日時}）が査定申込みの登録日時（${rows[0].申込日時}）と同じかそれより後`).toBe(true);
  });
  note(`${店舗の読み替え}。査定申込みの登録日時は申込日時の項目で比べた（日時は1970年からの秒）`);
});

caseTest("IT-F08-05-060", async (c) => {
  const who = 申込者の("060");
  const { n } = await 申込む(c, { 入力: 米国の郵便番号つき入力, 申込者: who, 国を選ぶ手順: true });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "060"), who.姓); });
  await c.expected(async () => {
    expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.都道府県 ?? "", "査定申込みの都道府県").toBe("日本国外");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-05-061", async (c) => {
  const who = 英語の申込者("061");
  const { n } = await 申込む(c, { 入力: 英語の入力, 申込者: who });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "061"), who.姓); });
  await c.expected(async () => {
    expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.セイ ?? "", "査定申込みの姓カナ（姓と同じ）").toBe(who.姓);
    expect.soft(rows[0]?.メイ ?? "", "査定申込みの名カナ（名と同じ）").toBe("太郎");
  });
  note(`${店舗の読み替え}。英語表示の確定のボタンは「Apply for Assessment」`);
});

caseTest("IT-F08-05-068", async (c) => {
  const who = 申込者の("068");
  const { n } = await 申込む(c, { 入力: 米国の郵便番号つき入力, 申込者: who, 国を選ぶ手順: true });
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => { rows = db.査定申込み(店舗ID(c, "068"), who.姓); });
  await c.expected(async () => {
    expect(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.郵便番号 ?? "", "査定申込みの郵便番号").toBe("90210");
  });
  note(店舗の読み替え);
});

// ================= 会員登録を伴う申込み（DB確認） =================

caseTest("IT-F08-05-009", async (c) => {
  const who = 申込者の("009");
  const mail = 申込メール("f0805-009");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let 会員ID = "";
  let rows: db.査定申込み[] = [];
  await c.step(n, async () => {
    会員ID = db.会員(mail)[0]?.id ?? "";
    rows = db.査定申込み(店舗ID(c, "009"), who.姓);
  });
  await c.expected(async () => {
    expect(会員ID, "このメールアドレスで登録された会員の会員ID").not.toBe("");
    expect.soft(rows.length, "店舗の、この申込者の査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.会員ID ?? null, "査定申込みの会員ID（登録された会員の会員IDと同じ）").toBe(会員ID);
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-032", async (c) => {
  const who = 申込者の("032");
  const mail = 申込メール("f0805-032");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let m: db.会員[] = [];
  await c.step(n, async () => { m = db.会員(mail); });
  await c.expected(async () => {
    expect(m.length, "このメールアドレスの会員の件数").toBe(1);
    const v = m[0];
    expect.soft(v.国, "会員の国").toBe("Japan");
    expect.soft(v.姓, "会員の姓").toBe(who.姓);
    expect.soft(v.名, "会員の名").toBe("太郎");
    expect.soft(v.セイ, "会員の姓カナ").toBe("ケッテイ");
    expect.soft(v.メイ, "会員の名カナ").toBe("タロウ");
    expect.soft(v.都道府県, "会員の都道府県").toBe("東京都");
    expect.soft(v.住所1, "会員の住所1").toBe("千代田区");
    expect.soft(v.住所2, "会員の住所2").toBe("千代田1-1");
    expect.soft(v.職業, "会員の職業").toBe("会社員");
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-035", async (c) => {
  const mail = 申込メール("f0805-035");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("035"), メール: mail });
  let m: db.会員[] = [];
  let addr: db.住所帳[] = [];
  await c.step(n, async () => {
    m = db.会員(mail);
    addr = m[0] ? db.会員の住所帳(m[0].id).filter((a) => a.名称 === "会員情報住所 / Membership Information Address") : [];
  });
  await c.expected(async () => {
    expect(m.length, "このメールアドレスの会員の件数").toBe(1);
    expect(addr.length, "会員の住所帳の、名称「会員情報住所 / Membership Information Address」の住所の件数").toBe(1);
    for (const k of ["姓", "名", "都道府県", "住所1", "住所2"] as const) {
      expect.soft(addr[0][k], `住所帳の住所の${k}（会員の${k}と同じ）`).toBe(m[0][k]);
    }
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-036", async (c) => {
  const who = 申込者の("036");
  const mail = 申込メール("f0805-036");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let 会員ID = "";
  let p: db.プレイヤー[] = [];
  await c.step(n, async () => {
    会員ID = db.会員(mail)[0]?.id ?? "";
    p = db.プレイヤー(mail);
  });
  await c.expected(async () => {
    expect(会員ID, "このメールアドレスの会員の会員ID").not.toBe("");
    const mine = p.filter((x) => x.会員ID === 会員ID);
    expect(mine.length, "会員の会員IDと同じ会員IDのプレイヤーの件数").toBe(1);
    expect.soft(mine[0].メール, "プレイヤーのメールアドレス").toBe(mail);
    expect.soft(mine[0].姓, "プレイヤーの姓").toBe(who.姓);
    expect.soft(mine[0].名, "プレイヤーの名").toBe("太郎");
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-044", async (c) => {
  const mail = 申込メール("f0805-044");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("044"), メール: mail });
  let tpl: (string | null)[] = [];
  await c.step(n, async () => {
    const id = db.会員(mail)[0]?.id;
    tpl = id ? db.配信履歴のテンプレート(id) : [];
  });
  await c.expected(async () => {
    expect(tpl.length, "会員のメール配信履歴の件数").toBeGreaterThan(0);
    expect.soft(tpl, "会員のメール配信履歴の使用したメールテンプレート（すべて「【販売/日】仮会員登録」）").toEqual(tpl.map(() => "【販売/日】仮会員登録"));
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-054", async (c) => {
  const who = 申込者の("054");
  const mail = 申込メール("f0805-054");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let 会員の登録 = NaN;
  let 申込みの登録 = NaN;
  await c.step(n, async () => {
    会員の登録 = db.会員(mail)[0]?.登録日時 ?? NaN;
    申込みの登録 = db.査定申込み(店舗ID(c, "054"), who.姓)[0]?.申込日時 ?? NaN;
  });
  await c.expected(async () => {
    expect(Number.isFinite(会員の登録) && Number.isFinite(申込みの登録), "会員と査定申込みが登録されている").toBe(true);
    expect.soft(会員の登録 <= 申込みの登録, `会員の登録日時（${会員の登録}）が査定申込みの登録日時（${申込みの登録}）と同じかそれより前`).toBe(true);
  });
  note(`${店舗の読み替え}。査定申込みの登録日時は申込日時の項目で比べた（日時は1970年からの秒）`);
});

caseTest("IT-F08-05-069", async (c) => {
  const mail = 申込メール("f0805-069");
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("069"), メール: mail });
  let m: db.会員[] = [];
  await c.step(n, async () => { m = db.会員(mail); });
  await c.expected(async () => {
    expect(m.length, "このメールアドレスの会員の件数").toBe(1);
    expect.soft(m[0].郵便番号, "会員の郵便番号（前半と後半をつないだ値）").toBe("1008050");
    expect.soft(m[0].電話, "会員の電話番号（03・5805・0805 の区分）").toEqual(["03", "5805", "0805"]);
    expect.soft(m[0].生年月日, "会員の生年月日").toBe("1977-07-07");
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-070", async (c) => {
  const mail = 申込メール("f0805-070");
  const { n } = await 申込む(c, { 入力: 米国の郵便番号つき入力, 申込者: 申込者の("070"), メール: mail, 国を選ぶ手順: true });
  let addr: db.住所帳[] = [];
  await c.step(n, async () => {
    const id = db.会員(mail)[0]?.id;
    addr = id ? db.会員の住所帳(id).filter((a) => a.名称 === "会員情報住所 / Membership Information Address") : [];
  });
  await c.expected(async () => {
    expect(addr.length, "会員の住所帳の、名称「会員情報住所 / Membership Information Address」の住所の件数").toBe(1);
    expect.soft([addr[0].郵便番号, addr[0].海外郵便番号], "住所帳の住所の郵便番号（日本の郵便番号・国外の郵便番号のどちらかが 90210）").toContain("90210");
  });
  note(`${店舗の読み替え}。郵便番号は、日本の郵便番号の項目と国外の郵便番号の項目の両方を見た。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-078", async (c) => {
  const mail = 申込メール("dpf0805-078");
  const { n } = await 申込む(c, { 入力: 米国の郵便番号つき入力, 申込者: 申込者の("078"), メール: mail, 国を選ぶ手順: true });
  let m: db.会員[] = [];
  await c.step(n, async () => { m = db.会員(mail); });
  await c.expected(async () => {
    expect(m.length, "このメールアドレスの会員の件数").toBe(1);
    expect.soft(m[0].都道府県, "会員の都道府県").toBe("日本国外");
  });
  note(`${店舗の読み替え}。メールアドレス ${mail}`);
});

caseTest("IT-F08-05-079", async (c) => {
  const who = 英語の申込者("079");
  const mail = 申込メール("dpf0805-079");
  const { n } = await 申込む(c, { 入力: 英語の入力, 申込者: who, メール: mail });
  let m: db.会員[] = [];
  await c.step(n, async () => { m = db.会員(mail); });
  await c.expected(async () => {
    expect(m.length, "このメールアドレスの会員の件数").toBe(1);
    expect.soft(m[0].セイ, "会員の姓カナ（姓と同じ）").toBe(who.姓);
    expect.soft(m[0].メイ, "会員の名カナ（名と同じ）").toBe("太郎");
  });
  note(`${店舗の読み替え}。英語表示の確定のボタンは「Membership and Assessment」。メールアドレス ${mail}`);
});

// ================= 会員としてログインした申込み =================

/** 会員でログインして確認画面まで（手順1〜3） */
async function 会員で確認画面まで(c: CaseCtx, メール: string): Promise<MemberApplyPage> {
  const m = new MemberApplyPage(c.page);
  await c.step(1, async () => { await m.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await m.ログインする(メール, F0805_PASSWORD); });
  await c.step(3, async () => { await m.同意して次へ進む(); });
  return m;
}

caseTest("IT-F08-05-008", async (c) => {
  const id = c.notes.get("〔会員ID-F0805-008〕");
  const m = await 会員で確認画面まで(c, 会員メール("008"));
  await c.step(4, async () => { await m.査定申込みする(); });
  let rows: { id: string; 会員ID: string | null }[] = [];
  await c.step(5, async () => { rows = db.会員の査定申込み(店舗ID(c, "008"), id); });
  await c.expected(async () => {
    expect(rows.length, "店舗の、ログインした会員の会員IDを持つ査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.会員ID ?? null, "査定申込みの会員ID").toBe(id);
  });
  note(`${店舗の読み替え}。店舗の査定申込みは、ログインした会員（実行ごとに作る）の会員IDで探した。メールアドレス ${会員メール("008")}`);
});

caseTest("IT-F08-05-052", async (c) => {
  await 会員で確認画面まで(c, 会員メール("052"));
  const a = new OtcApplyPage(c.page);
  await c.expected(async () => {
    await a.確認画面を待つ();
    for (const k of ["メールアドレス", "メールアドレス(確認用)", "パスワード", "パスワード(確認用)"] as const) {
      await expect.soft(a.確認の枠(k), `ログイン中の確認画面の${k}の項目の数`).toHaveCount(0);
    }
  });
  note(`${店舗の読み替え}。メールアドレス ${会員メール("052")}`);
});

caseTest("IT-F08-05-065", async (c) => {
  await 会員で確認画面まで(c, 会員メール("065"));
  let r = { 申込側: 0, 会員登録側: 0, 見出し: [] as string[] };
  await c.expected(async () => {
    await new OtcApplyPage(c.page).確認画面を待つ();
    r = await 利用規約の数(c.page);
    expect.soft(r.会員登録側, "ログイン中の確認画面の会員登録フォーム側の利用規約の項目の数").toBe(0);
    expect.soft(r.申込側 + r.会員登録側, "ログイン中の確認画面の利用規約の項目の数").toBe(1);
  });
  note(`${店舗の読み替え}。${利用規約の注記(r.見出し)}`);
});

caseTest("IT-F08-05-082", async (c) => {
  const id = c.notes.get("〔会員ID-F0805-082〕");
  const mail = 会員メール("082");
  const m = new MemberApplyPage(c.page);
  const 一回 = async () => {
    await m.申込前ログイン画面を開く(支店URL);
    await m.ログインする(mail, F0805_PASSWORD);
    await m.同意して次へ進む();
    await m.査定申込みする();
    await expect(m.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible({ timeout: 30_000 });
  };
  await c.step(1, async () => { await m.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await m.ログインする(mail, F0805_PASSWORD); });
  await c.step(3, async () => { await m.同意して次へ進む(); });
  await c.step(4, async () => {
    await m.査定申込みする();
    await expect(m.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible({ timeout: 30_000 });
  });
  await c.step(5, async () => {
    // 新しいブラウザセッション: 会員のログインを含む全てのクッキーを消して始め直す
    await c.page.context().clearCookies();
    await 一回();
  });
  let rows: { id: string; 会員ID: string | null }[] = [];
  await c.step(6, async () => { rows = db.会員の査定申込み(店舗ID(c, "082"), id); });
  await c.expected(async () => {
    expect.soft(rows.length, "店舗の、ログインした会員の会員IDを持つ査定申込みの件数").toBe(2);
    expect.soft(rows.every((r) => r.会員ID === id), "2件とも会員IDがログインした会員の会員ID").toBe(true);
  });
  note(`${店舗の読み替え}。新しいブラウザセッションは、同じブラウザのクッキーを全て消して始め直して代えた。メールアドレス ${mail}`);
});

// ================= 管理画面での確かめ（PD） =================

/** 会員登録を伴う申込み（手順1〜5）→ 管理画面の会員検索一覧（手順6〜7） */
async function PDの申込みと会員検索(c: CaseCtx, who: 申込者, mail: string, pw: string): Promise<void> {
  const a = new OtcApplyPage(c.page);
  await c.step(1, async () => { await a.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await a.アカウントなしで進む(); });
  await c.step(3, async () => {
    await a.入力する(共通入力, who);
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
  });
  await c.step(4, async () => { await a.会員登録の入力をして進む(mail, pw); await a.確認画面を待つ(); });
  await c.step(5, async () => {
    await a.確定する();
    await expect(a.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible();
  });
  await c.step(6, async () => {
    // ブラウザB: 申込者のセッションのクッキーを全て消して、管理画面にログインする
    await c.page.context().clearCookies();
    await loginAdmin(c.page, F0805_ADMIN);
    await c.page.goto(adminUrl("/customer"));
    await c.page.waitForLoadState("load");
  });
  await c.step(7, async () => { await searchCustomer(c.page, mail); });
}
const PDの注記 = (mail: string) => `${店舗の読み替え}。ブラウザBは、同じブラウザのクッキーを全て消して始め直して代えた（画面のキャプチャを1つのセッションに残すため）。` +
  `管理者の権限は、正本が定める細かな権限の代わりにシステム管理者にした。メールアドレスは正本の値の前半に実行の印を付けた値（${mail}）`;

caseTest("IT-F08-05-072", async (c) => {
  const mail = 申込メール("pd0805-001");
  await PDの申込みと会員検索(c, { 姓: "査定一", 名: "太郎", セイ: "ケッテイイチ", メイ: "タロウ", 住所3: "PD0805-001ビル" }, mail, "Pw-F0805-PD-001");
  let 会員名 = "";
  let メール欄 = "";
  await c.step(8, async () => {
    await expect(resultRow(c.page, mail), "検索結果のメールアドレスの行").toHaveCount(1);
    会員名 = await 検索結果の会員名(c.page, mail);
    await openEditFromResult(c.page, mail);
    メール欄 = (await 会員登録編集の値(c.page)).メールアドレス;
  });
  await c.expected(async () => {
    expect.soft(会員名, "検索結果の行の会員名（姓）").toContain("査定一");
    expect.soft(会員名, "検索結果の行の会員名（名）").toContain("太郎");
    expect.soft(メール欄, "会員登録編集画面のメールアドレス").toBe(mail);
  });
  note(PDの注記(mail));
});

caseTest("IT-F08-05-073", async (c) => {
  const mail = 申込メール("pd0805-002");
  await PDの申込みと会員検索(c, { 姓: "査定二", 名: "次郎", セイ: "ケッテイニ", メイ: "ジロウ", 住所3: "PD0805-002ビル" }, mail, "Pw-F0805-PD-002");
  let v: Record<string, string> = {};
  await c.step(8, async () => { await openEditFromResult(c.page, mail); v = await 会員登録編集の値(c.page); });
  await c.expected(async () => {
    expect.soft(v.お名前姓, "会員登録編集画面のお名前（姓）").toBe("査定二");
    expect.soft(v.お名前名, "会員登録編集画面のお名前（名）").toBe("次郎");
    expect.soft(v.フリガナ姓, "会員登録編集画面のお名前(カナ)（姓）").toBe("ケッテイニ");
    expect.soft(v.フリガナ名, "会員登録編集画面のお名前(カナ)（名）").toBe("ジロウ");
    expect.soft(v.都道府県, "会員登録編集画面の都道府県").toBe("東京都");
    expect.soft(v.住所1, "会員登録編集画面の住所1").toBe("千代田区");
    expect.soft(v.住所2, "会員登録編集画面の住所2").toBe("千代田1-1");
    expect.soft(v.メールアドレス, "会員登録編集画面のメールアドレス").toBe(mail);
    expect.soft(v.職業, "会員登録編集画面の職業").toBe("会社員");
    expect.soft(`${v.生年月日年}/${v.生年月日月}/${v.生年月日日}`, "会員登録編集画面の生年月日（1977年7月7日）").toMatch(/1977\D+0?7\D+0?7/);
    expect.soft(v.会員ステータス, "会員登録編集画面の会員ステータス").toBe("仮会員");
  });
  note(PDの注記(mail));
});

caseTest("IT-F08-05-075", async (c) => {
  const mail = 申込メール("pd0805-004");
  await PDの申込みと会員検索(c, { 姓: "査定四", 名: "四郎", セイ: "ケッテイヨン", メイ: "シロウ", 住所3: "PD0805-004ビル" }, mail, "Pw-F0805-PD-004");
  let 行 = -1;
  await c.step(8, async () => {
    await openEditFromResult(c.page, mail);
    await 送信履歴を開く(c.page);
    行 = await 配信履歴の行(c.page).count();
  });
  let pop = { 件名: "", 本文: "" };
  await c.step(9, async () => { pop = await 先頭の件名を開く(c.page); });
  await c.expected(async () => {
    expect.soft(行, "メール配信履歴の一覧の行の数").toBeGreaterThan(0);
    expect.soft(pop.件名, "ポップアップの件名").not.toBe("");
    expect.soft(pop.本文, "ポップアップの本文（申込者の姓）").toContain("査定四");
    expect.soft(pop.本文, "ポップアップの本文（申込者の名）").toContain("四郎");
  });
  note(PDの注記(mail));
});

caseTest("IT-F08-05-080", async (c) => {
  const mail = 申込メール("dpf0805-080");
  const a = new OtcApplyPage(c.page);
  await c.step(1, async () => { await a.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await a.アカウントなしで進む(); });
  await c.step(3, async () => {
    await a.入力する(共通入力, 申込者の("080"));
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
  });
  await c.step(4, async () => { await a.会員登録の入力をして進む(mail, F0805_PASSWORD); await a.確認画面を待つ(); });
  await c.step(5, async () => {
    await a.確定する();
    await expect(a.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible();
  });
  await c.step(6, async () => {
    await c.page.context().clearCookies();
    await loginAdmin(c.page, F0805_ADMIN);
    await c.page.goto(adminUrl("/customer"));
    await c.page.waitForLoadState("load");
  });
  await c.step(7, async () => { await searchCustomer(c.page, mail); });
  await c.step(8, async () => { await openEditFromResult(c.page, mail); await 送信履歴を開く(c.page); });
  await c.expected(async () => {
    await expect(c.page.locator("#mail-history-form"), "メール配信履歴の画面（読み込みが済んだ）").toBeVisible();
    await expect(配信履歴の行(c.page), "メール配信履歴の一覧の行の数").toHaveCount(0);
  });
  note(PDの注記(mail));
});

// 会員ログインでの申込で作られるステータス変更履歴
caseTest("IT-F08-05-074", async ({ page, notes, step, expected }) => {
  const apply = new MemberApplyPage(page);
  let 姓名 = { 姓: "", 名: "" };
  await step(1, async () => { await apply.申込前ログイン画面を開く(PD_STORE.支店URL); });
  await step(2, async () => { await apply.ログインする(pdMemberEmail(), PD_MEMBER_PASSWORD); });
  await step(3, async () => {
    姓名 = await apply.申込者の姓名();
    expect.soft(姓名, "申込情報入力画面に設定された会員情報（お名前の姓・名）").toEqual({ 姓: "履歴丙", 名: "三郎" });
    await apply.同意して次へ進む();
  });
  await step(4, async () => {
    await apply.査定申込みする();
    await expect(apply.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible({ timeout: 30_000 });
  });
  const list = new OtcListPage(page);
  await step(5, async () => {
    // 別のブラウザセッション: 会員のログインを含む全てのクッキーを消した新しいセッションで管理画面にログインする
    await page.context().clearCookies();
    await loginAdmin(page, F0805_ADMIN);
    await list.open();
  });
  await step(6, async () => { await 会員IDで検索する(list, notes.get("〔会員ID-F0805-003〕")); });
  await step(7, async () => {
    const rows = await list.行();
    const mine = rows.filter((r) => r.申込者.replace(/\s+/g, "") === "履歴丙三郎");
    expect(mine.length, "会員IDの検索結果のうち申込者が「履歴丙 三郎」の行の数").toBeGreaterThan(0);
    await list.詳細を開く(mine[0].査定ID);
  });
  let 履歴: 履歴の行[] = [];
  await step(8, async () => { 履歴 = await ステータス変更履歴(page); });
  await expected(async () => {
    expect.soft(履歴.length, "ステータス変更履歴の行数（申込で作成された履歴）").toBeGreaterThan(0);
    expect.soft(履歴[0]?.ステータス ?? "", "申込で作成された履歴の行のステータス").not.toBe("");
  });
  note("別のブラウザセッションは、同じブラウザのクッキーを全て消して始め直して代えた（画面のキャプチャを1つのセッションに残すため）。管理者の権限は、正本が定める細かな権限の代わりにシステム管理者にした。店舗は再実行で同じものを使う");
});

// ================= 受信メールの確認（開発環境のメールの受け口） =================

const メールの注記 = (mail: string) =>
  `${店舗の読み替え}。メールアドレスは正本の値の前半に実行の印を付けた値（${mail}）。受信箱は、操作の前に控えたメールの番号より後にこのアドレスへ届いたメールだけを数えた（受信履歴を0件にする代わり）`;

/** 管理画面の会員検索から、メールアドレスの会員の登録編集画面 → 送信履歴を開く（手順の一つ） */
async function 会員の送信履歴を開く(c: CaseCtx, mail: string): Promise<void> {
  await c.page.context().clearCookies();
  await loginAdmin(c.page, SETUP_ADMIN);
  await c.page.goto(adminUrl("/customer"));
  await c.page.waitForLoadState("load");
  await searchCustomer(c.page, mail);
  await openEditFromResult(c.page, mail);
  await 送信履歴を開く(c.page);
}

caseTest("IT-F08-05-029", async (c) => {
  const who = 申込者の("029", { 姓の頭: "拒否", 名: "対象" });
  const mail = 申込メール("f0805-029");
  const 控え = await mailIds();
  const { n, r: 確定 } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let 届いた: Awaited<ReturnType<typeof 待ってから数える>> = [];
  await c.step(n, async () => { 届いた = await 待ってから数える(mail, 控え, 20_000); });
  await c.expected(async () => {
    // 「届いていない」を、申込みが確定されなかっただけで合格にしない
    expect.soft(確定.完了画面, `「会員登録して申込み」を押したあと完了画面へ移った（${確定.パス}）`).toBe(true);
    expect(届いた.length, `メールアドレス ${mail} 宛の受信メールの件数（確認メールが届いていない）`).toBe(0);
  });
  note(`${メールの注記(mail)}。ブラックリストの氏名は ${拒否の氏名("029")}。届かないことは、確定のあと20秒待ってから数えて確かめた`);
});

caseTest("IT-F08-05-042", async (c) => {
  const who = 申込者の("042");
  const mail = 申込メール("f0805-042");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let m: Awaited<ReturnType<typeof 届くのを待つ>> | undefined;
  await c.step(n, async () => { m = await 届くのを待つ(mail, 控え); });
  await c.expected(async () => {
    expect(m, "確認メールが届いた").toBeDefined();
    expect.soft(m!.本文, "確認メールの本文（申込者の姓）").toContain(who.姓);
    expect.soft(m!.本文, "確認メールの本文（申込者の名）").toContain("太郎");
    expect.soft(m!.本文, "確認メールの本文（会員登録を完了させるURL）").toMatch(/https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/);
  });
  note(`${メールの注記(mail)}。会員登録を完了させるURLは、本登録の画面のアドレス（…/entry/activate/…）として確かめた。姓は正本の「査定F0805-042」に実行の印を付けた値（${who.姓}）`);
});

caseTest("IT-F08-05-043", async (c) => {
  const mail = 申込メール("f0805-043");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("043"), メール: mail });
  let m: Awaited<ReturnType<typeof 届くのを待つ>> | undefined;
  await c.step(n, async () => { m = await 届くのを待つ(mail, 控え); });
  let 履歴 = { 件名: "", 本文: "" };
  await c.step(n + 1, async () => {
    await 会員の送信履歴を開く(c, mail);
    履歴 = await 先頭の件名を開く(c.page);
  });
  await c.expected(async () => {
    expect(m, "確認メールが届いた").toBeDefined();
    expect.soft(履歴.件名, "メール配信履歴の件名が受信した確認メールの件名と同じ").toBe(m!.件名);
    expect.soft(本文の比べ用(履歴.本文), "メール配信履歴の本文が受信した確認メールの本文と同じ（空白・改行を除いて比べた）").toBe(本文の比べ用(m!.本文));
  });
  note(`${メールの注記(mail)}。手順7の「DBで…配信履歴を開く」は、管理画面の会員登録編集の「送信履歴」の件名リンクを開いて読んだ（管理者は全権限の管理者）。本文は改行・空白の違いを除いて比べた`);
});

caseTest("IT-F08-05-045", async (c) => {
  const mail = 申込メール("f0805-045");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("045"), メール: mail });
  let m: Awaited<ReturnType<typeof 届くのを待つ>> | undefined;
  await c.step(n, async () => { m = await 届くのを待つ(mail, 控え); });
  let 送信日 = "";
  await c.step(n + 1, async () => {
    await 会員の送信履歴を開く(c, mail);
    送信日 = await 先頭の送信日(c.page);
  });
  await c.expected(async () => {
    expect(m, "確認メールが届いた").toBeDefined();
    expect.soft(送信日, "メール配信履歴の送信日が受信した確認メールの送信日（日本時間）と同じ").toBe(日本時間の日付(m!.届いた日時));
  });
  note(`${メールの注記(mail)}。メール配信履歴の画面は送信日を「年/月/日」の日付だけで表示するので、日付で比べた（受信したメールの日時は日本時間の日付にした）`);
});

caseTest("IT-F08-05-083", async (c) => {
  const who = 申込者の("CB083");
  const mail = 申込メール("f0805-cb083");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let m: Awaited<ReturnType<typeof 届くのを待つ>> | undefined;
  await c.step(n, async () => { m = await 届くのを待つ(mail, 控え); });
  let 会員一覧: db.会員[] = [];
  let 住所: db.住所帳[] = [];
  let プレイヤー: db.プレイヤー[] = [];
  let 申込み: db.査定申込み[] = [];
  await c.step(n + 1, async () => {
    会員一覧 = db.会員(mail);
    住所 = 会員一覧[0] ? db.会員の住所帳(会員一覧[0].id) : [];
    プレイヤー = db.プレイヤー(mail);
    申込み = db.査定申込み(店舗ID(c, "CB083"), who.姓);
  });
  await c.expected(async () => {
    expect.soft(m?.件数 ?? 0, `メールアドレス ${mail} 宛の確認メールの件数`).toBe(1);
    expect.soft(会員一覧.length, "このメールアドレスの会員の件数").toBe(1);
    const 既定 = 住所.filter((a) => a.名称 === "会員情報住所 / Membership Information Address" && a.既定);
    expect.soft(既定.length, "会員の住所帳の、名称「会員情報住所 / Membership Information Address」の既定の住所の件数").toBe(1);
    expect.soft(プレイヤー.length, "このメールアドレスのプレイヤーの件数").toBe(1);
    expect.soft(プレイヤー[0]?.姓, "プレイヤーの姓").toBe(who.姓);
    expect.soft(プレイヤー[0]?.名, "プレイヤーの名").toBe("太郎");
    expect.soft(申込み.length, `氏名「${who.姓}太郎」の査定申込みの件数`).toBe(1);
  });
  note(`${メールの注記(mail)}。氏名・姓は正本の「査定F0805-CB083」に実行の印を付けた値（${who.姓}）`);
});

// ================= 共有の設定を書き換えて戻すケース（夜に1本だけで流す） =================
// シード（seeds/f08-05.ts）が、共有のメールテンプレート・店舗基本設定（基本情報・仮会員設定）を、書き換える前に全項目を画面から控え、
// ケースの終わりに基盤（lib/shared_restore.ts）が画面で元の値に戻して確かめる。

const 共有の注記 = "共有のメールテンプレート・基本情報・仮会員設定は、書き換える前に全項目を画面から控え、ケースの終わりに画面で元の値に戻して確かめる";

/** 店舗基本設定の店名（確認メールの件名の頭に付く） */
async function 基本情報の店名(c: CaseCtx): Promise<string> {
  return withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.open();
    return await p.値("店名");
  });
}

/**
 * 申込んで、確認メールの件名と、基本情報の店名（件名の頭に付く）を読む（手順1〜6）。
 * 受信メールの一覧（受け口から読んだ件名の表）を同じブラウザの別のタブに出し、期待結果の画像にも写す。呼んだ側は 一覧のタブ を閉じる
 */
async function 確認メールの件名を読む(c: CaseCtx, n: string, 入力: 申込入力, 申込者: 申込者): Promise<{ mail: string; 件名: string; 店名: string; 一覧のタブ?: Page; 件名の欄?: Locator }> {
  const mail = 申込メール(`f0805-${n}`);
  const 控え = await mailIds();
  const { n: next } = await 申込む(c, { 入力, 申込者, メール: mail });
  let 件名 = "";
  let 店名 = "";
  let 一覧のタブ: Page | undefined;
  let 件名の欄: Locator | undefined;
  await c.step(next, async () => {
    件名 = (await 届くのを待つ(mail, 控え)).件名;
    店名 = await 基本情報の店名(c);
    const r = await 受信メールの一覧を出す(c.page.context(), mail, 控え);
    一覧のタブ = r.タブ;
    const 最新 = r.一覧[r.一覧.length - 1];
    if (最新) 件名の欄 = r.件名の欄(最新.番号);
  });
  return { mail, 件名, 店名, 一覧のタブ, 件名の欄 };
}


const 件名の注記 = (mail: string, 店名: string, 件名: string) =>
  `${メールの注記(mail)}。${共有の注記}。確認メールの件名は、アプリの作りで基本情報の店名を「[店名] 」の形で頭に付けて送るため、「[${店名}] ${件名}」として確かめた（テンプレートの件名の部分が「${件名}」）`;

caseTest("IT-F08-05-037", async (c) => {
  const r = await 確認メールの件名を読む(c, "037", 共通入力, 申込者の("037"));
  // 表のタブは、期待結果を確かめて撮ったあとに閉じる
  try {
    await c.expected(async () => {
      // 受信メールの一覧の表の件名の欄で確かめる（赤枠が件名に付く）
      const 期待 = `[${r.店名}] F0805-JP 確認メール`;
      if (r.件名の欄) await expect.soft(r.件名の欄, "確認メールの件名（日本語の仮会員登録のテンプレートの件名）").toHaveText(期待);
      expect.soft(r.件名, "確認メールの件名（日本語の仮会員登録のテンプレートの件名。メールの受け口から読んだ件名）").toBe(期待);
    });
  } finally {
    await r.一覧のタブ?.close().catch(() => undefined);
  }
  note(件名の注記(r.mail, r.店名, "F0805-JP 確認メール"));
});

caseTest("IT-F08-05-038", async (c) => {
  const r = await 確認メールの件名を読む(c, "038", 英語の入力, 英語の申込者("038"));
  // 表のタブは、期待結果を確かめて撮ったあとに閉じる
  try {
    await c.expected(async () => {
      // 受信メールの一覧の表の件名の欄で確かめる（赤枠が件名に付く）
      const 期待 = `[${r.店名}] F0805-EN Confirmation`;
      if (r.件名の欄) await expect.soft(r.件名の欄, "確認メールの件名（英語の仮会員登録のテンプレートの件名）").toHaveText(期待);
      expect.soft(r.件名, "確認メールの件名（英語の仮会員登録のテンプレートの件名。メールの受け口から読んだ件名）").toBe(期待);
    });
  } finally {
    await r.一覧のタブ?.close().catch(() => undefined);
  }
  note(件名の注記(r.mail, r.店名, "F0805-EN Confirmation"));
});

/** 基本情報（送信元・店名・返信先・送信エラー受付）を書き換えた状態で申込み、申込者あての確認メールの番号を返す */
async function 基本情報で申込む(c: CaseCtx, n: string): Promise<{ mail: string; 控え: Set<number>; 番号: number }> {
  const mail = 申込メール(`f0805-${n}`);
  const 控え = await mailIds();
  const { n: next } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の(n), メール: mail });
  let 番号 = 0;
  await c.step(next, async () => {
    await 届くのを待つ(mail, 控え);
    番号 = (await 宛先に届いたメール(mail, 控え))[0].番号;
  });
  return { mail, 控え, 番号 };
}

caseTest("IT-F08-05-039", async (c) => {
  const { mail, 番号 } = await 基本情報で申込む(c, "039");
  const 見出し = await メールの見出しを読む(番号);
  await c.expected(async () => {
    expect.soft(見出し.送信元のアドレス, "確認メールの送信元のアドレス").toBe(基本情報の値.送信元);
    expect.soft(見出し.送信元の表示名, "確認メールの送信元に併記された店舗名").toBe(基本情報の値.店名);
  });
  note(`${メールの注記(mail)}。${共有の注記}。送信元は、受け口の原文の送信元の見出し（符号化された文字は元に戻した）で確かめた`);
});

caseTest("IT-F08-05-040", async (c) => {
  const mail = 申込メール("f0805-040");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: 申込者の("040"), メール: mail });
  let 件数 = 0;
  await c.step(n, async () => {
    await 届くのを待つ(mail, 控え);
    // 基本情報のメールアドレス宛（Bcc）のメールのうち、この申込者あてに送られた確認メール（同じメールの宛先に申込者が入っているもの）を数える
    件数 = (await 宛先に届いたメール(基本情報の値.送信元, 控え)).filter((x) => x.宛先.includes(mail.toLowerCase())).length;
  });
  await c.expected(async () => {
    expect.soft(件数, `メールアドレス ${基本情報の値.送信元} 宛に届いた、この申込者への確認メールの件数`).toBe(1);
  });
  note(`${メールの注記(mail)}。${共有の注記}。受信箱は共有のため、基本情報のアドレス宛のメールのうち、申込者のアドレスも宛先に入っている確認メールだけを数えた`);
});

caseTest("IT-F08-05-041", async (c) => {
  const { mail, 番号 } = await 基本情報で申込む(c, "041");
  const 見出し = await メールの見出しを読む(番号);
  await c.expected(async () => {
    expect.soft(見出し.返信先, "確認メールの返信先").toBe(基本情報の値.返信先);
    expect.soft(見出し.戻り先 || 見出し.封筒の送信元, "確認メールの送信エラーの戻り先").toBe(基本情報の値.送信エラー受付);
  });
  note(`${メールの注記(mail)}。${共有の注記}。返信先は原文の返信先の見出し、送信エラーの戻り先は原文の戻り先の見出し（無ければ受け口が控えた送信元のアドレス）で確かめた`);
});

caseTest("IT-F08-05-085", async (c) => {
  const who = 申込者の("CB085");
  const mail = 申込メール("f0805-cb085");
  const 控え = await mailIds();
  const { n } = await 申込む(c, { 入力: 共通入力, 申込者: who, メール: mail });
  let 届いた: Awaited<ReturnType<typeof 待ってから数える>> = [];
  let 会員一覧: db.会員[] = [];
  let 住所: db.住所帳[] = [];
  let プレイヤー: db.プレイヤー[] = [];
  let 申込み: db.査定申込み[] = [];
  await c.step(n, async () => { 届いた = await 待ってから数える(mail, 控え, 20_000); });
  await c.step(n + 1, async () => {
    会員一覧 = db.会員(mail);
    住所 = 会員一覧[0] ? db.会員の住所帳(会員一覧[0].id) : [];
    プレイヤー = db.プレイヤー(mail);
    申込み = db.査定申込み(店舗ID(c, "CB085"), who.姓);
  });
  await c.expected(async () => {
    expect.soft(届いた.length, `メールアドレス ${mail} 宛の受信メールの件数（仮会員設定が無効なので確認メールは届かない）`).toBe(0);
    expect.soft(会員一覧.length, "このメールアドレスの会員の件数").toBe(1);
    const 既定 = 住所.filter((a) => a.名称 === "会員情報住所 / Membership Information Address" && a.既定);
    expect.soft(既定.length, "会員の住所帳の、名称「会員情報住所 / Membership Information Address」の既定の住所の件数").toBe(1);
    expect.soft(プレイヤー.length, "このメールアドレスのプレイヤーの件数").toBe(1);
    expect.soft(プレイヤー[0]?.姓, "プレイヤーの姓").toBe(who.姓);
    expect.soft(プレイヤー[0]?.名, "プレイヤーの名").toBe("太郎");
    expect.soft(申込み.length, `氏名「${who.姓}太郎」の査定申込みの件数`).toBe(1);
  });
  note(`${メールの注記(mail)}。${共有の注記}。届かないことは、確定のあと20秒待ってから数えて確かめた。氏名・姓は正本の「査定F0805-CB085」に実行の印を付けた値（${who.姓}）`);
});
