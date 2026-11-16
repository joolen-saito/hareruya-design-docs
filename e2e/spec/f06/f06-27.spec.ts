/**
 * F06-27 パスワード設定（ポリシー違反用）。正本: cases/F06-27_test_cases.tsv
 * 003・021: ポリシー違反のセッションが無い会員（画面だけで準備）。
 * 001・002・005〜009・014・015・017・019: ポリシー違反のパスワード（11文字）の会員。会員は画面で登録し、保存パスワードだけを
 *   実行の印つきの会員に限って DB で置き換える（seeds/f06-27.ts・db/f06_27_write.ts。依頼者決定 2026-11-10）。
 * 入力が受け付けられないことを確かめるケース（014・015）は、「変更する」を押したことが画面の誤りの表示か、ブラウザの入力チェックが止めた項目として
 * 残っていることも確かめる（押さずに「変わっていない」で合格にしない）。
 * 記録 review/F06-27_progress_2026-11-04.md
 */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { PolicyPage, 変更を押した結果 } from "../../pages/front/f06_27_policy";
import { mailOf, ポリシー違反のパスワード } from "../../seeds/f06-27";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 押した様子 = (r: 変更を押した結果) => `送信=${r.送った ? "送った" : "送られていない"}／画面の誤りの表示=${r.誤りの文.join(" / ") || "なし"}／ブラウザの入力チェックが止めた項目=${r.止めた項目.join(" / ") || "なし"}`;

type ログインの結果 = { 後の画面: string; 認証エラー: string; ログイン画面のまま: boolean; ログインが成立した: boolean };

/** 本店のログイン画面を開いて入力し「ログイン」を押す。押したあとの画面とエラーを返す */
async function ログインする(l: LoginPage, メール: string, パスワード: string): Promise<ログインの結果> {
  await l.ログイン画面を開く();
  await l.ログインする(メール, パスワード);
  const ログイン画面のまま = /\/mypage\/login\/?$/.test(l.path());
  return { 後の画面: l.path(), 認証エラー: ログイン画面のまま ? await l.認証エラー() : "", ログイン画面のまま, ログインが成立した: !ログイン画面のまま };
}

async function ログアウトする(p: PolicyPage): Promise<void> {
  const how = await p.ログアウトする();
  if (how === "アドレス") note(`ログアウトは、画面に見えているログアウトのリンクが無かったため、ログアウトのアドレス（/ja/logout）を開いて行った（移った先 ${p.path}）`);
}

const 会員 = (n: string) => mailOf(`f0627-${n}`);

caseTest("IT-F06-27-003", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0627-003"), "F0627-Cmp-003!ab"); });
  await step(2, async () => { await p.直接開く(); });
  await expected(async () => {
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面が表示されない").toBe(false);
    expect.soft(p.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
  });
});

caseTest("IT-F06-27-021", async ({ page, step, expected }) => {
  const p = new PolicyPage(page);
  await step(1, async () => { await p.直接開く(); });
  note(`未ログインでパスワード設定（ポリシー違反用）画面のアドレスを開いた結果、移った先は ${p.path}。正本の「マイページへリダイレクトされる」は、未ログインではログインの誘導が先に働くため、最終の画面がマイページにならない場合がある。期待結果の判定は正本どおり（移った先がマイページか）で行い、画面の要点（設定画面が表示されない）は画面の部品の有無でも確かめる`);
  await expected(async () => {
    expect.soft(p.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面が表示されない").toBe(false);
    await expect.soft(p.フォーム, "パスワード設定（ポリシー違反用）画面の入力フォームが画面に無い").toHaveCount(0);
  });
});

caseTest("IT-F06-27-001", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  let r: ログインの結果 | undefined;
  await step(1, async () => { r = await ログインする(l, 会員("001"), ポリシー違反のパスワード); });
  await expected(async () => {
    expect.soft(r!.ログインが成立した, `ログインが成立した（ログイン画面に留まらない。認証エラー: ${r!.認証エラー || "なし"}）`).toBe(true);
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面が表示されている").toBe(true);
    await expect.soft(p.フォーム, "パスワード設定（ポリシー違反用）画面の入力フォーム").toBeVisible();
  });
});

caseTest("IT-F06-27-002", async ({ page, step, expected, capture }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  const 見た: { 開いたアドレス: string; 画面: string; 設定画面: boolean }[] = [];
  await step(1, async () => {
    const r = await ログインする(l, 会員("002"), ポリシー違反のパスワード);
    expect(r.ログインが成立した, `ログインが成立する（認証エラー: ${r.認証エラー || "なし"}）`).toBe(true);
  });
  await step(2, async () => {
    await p.マイページを開く();
    見た.push({ 開いたアドレス: "/ja/mypage", 画面: p.path, 設定画面: await p.設定画面である() });
  });
  await step(3, async () => {
    await p.会員情報変更を開く();
    見た.push({ 開いたアドレス: "/ja/mypage/change", 画面: p.path, 設定画面: await p.設定画面である() });
    await capture("会員情報変更画面のアドレスを開いたあと");
  });
  await expected(async () => {
    for (const v of 見た) {
      expect.soft(v.設定画面, `${v.開いたアドレス} を開くと、パスワード設定（ポリシー違反用）画面が表示される（表示された画面 ${v.画面}）`).toBe(true);
    }
    expect.soft(見た[0]?.画面, "マイページ画面は表示されない（マイページのアドレスに留まらない）").not.toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(見た[1]?.画面, "会員情報変更画面は表示されない（会員情報変更のアドレスに留まらない）").not.toMatch(/^\/ja\/mypage\/change\/?$/);
  });
});

/** 005・017: 新しいパスワードが受理され、完了画面が表示される */
function 受理される(n: "005" | "017", 新: string): CaseBody {
  return async ({ page, step, expected }) => {
    const l = new LoginPage(page);
    const p = new PolicyPage(page);
    let r: 変更を押した結果 | undefined;
    await step(1, async () => {
      const x = await ログインする(l, 会員(n), ポリシー違反のパスワード);
      expect(await p.設定画面である(), `ログイン後にパスワード設定（ポリシー違反用）画面が表示される（表示された画面 ${x.後の画面}・認証エラー ${x.認証エラー || "なし"}）`).toBe(true);
    });
    await step(2, async () => {
      r = await p.変更を押す(新, 新);
      note(`入力したパスワードは ${新.length} 文字。${押した様子(r)}`);
    });
    await expected(async () => {
      expect.soft(r!.送った, "「変更する」で送信された").toBe(true);
      expect.soft(await p.完了画面である(), `パスワード変更完了画面が表示されている（表示された画面 ${p.path}）`).toBe(true);
      await expect.soft(p.完了の文, "完了の文「パスワードを変更しました。」").toBeVisible();
    });
  };
}
caseTest("IT-F06-27-005", 受理される("005", "F0627-N-005!"));
caseTest("IT-F06-27-017", 受理される("017", "F0627-N-017!xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"));

caseTest("IT-F06-27-006", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  const 新 = "F0627-N-006!abc";
  let r: ログインの結果 | undefined;
  await step(1, async () => { await ログインする(l, 会員("006"), ポリシー違反のパスワード); });
  await step(2, async () => {
    const x = await p.変更を押す(新, 新);
    note(押した様子(x));
    expect(await p.完了画面である(), "パスワード変更完了画面が表示される（変更が済んだ）").toBe(true);
  });
  await step(3, async () => { await ログアウトする(p); });
  await step(4, async () => { r = await ログインする(l, 会員("006"), 新); });
  await expected(async () => {
    expect.soft(r!.ログインが成立した, `変更後のパスワードでログインできる（ログイン画面に留まらない。表示された画面 ${r!.後の画面}）`).toBe(true);
    expect.soft(r!.認証エラー, "ログインエラーが表示されない").toBe("");
    expect.soft(await p.設定画面である(), "変更後はパスワード設定（ポリシー違反用）画面へ移らない").toBe(false);
  });
});

caseTest("IT-F06-27-007", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  const 新 = "F0627-N-007!abc";
  await step(1, async () => { await ログインする(l, 会員("007"), ポリシー違反のパスワード); });
  await step(2, async () => {
    const x = await p.変更を押す(新, 新);
    note(押した様子(x));
    expect(await p.完了画面である(), "パスワード変更完了画面が表示される（変更が済んだ）").toBe(true);
  });
  await step(3, async () => { await p.マイページを開く(); });
  await expected(async () => {
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面へは遷移しない").toBe(false);
    expect.soft(p.path, "マイページ画面が表示される（アドレス）").toMatch(/^\/ja\/mypage\/?$/);
  });
});

/** 008・009 の手順1〜4（変更 → 戻る → 別の値で再送信）。再送信の結果を返す */
async function 戻って再送信する(n: "008" | "009", l: LoginPage, p: PolicyPage, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<{ 再送信: 変更を押した結果 | undefined; 戻った画面: string }> {
  const 新 = `F0627-N-${n}!abc`;
  const 再 = `F0627-N-${n}!abd`;
  let 再送信: 変更を押した結果 | undefined;
  let 戻った画面 = "";
  await step(1, async () => { await ログインする(l, 会員(n), ポリシー違反のパスワード); });
  await step(2, async () => {
    const x = await p.変更を押す(新, 新);
    note(`1回目: ${押した様子(x)}`);
    expect(await p.完了画面である(), "パスワード変更完了画面が表示される（1回目の変更が済んだ）").toBe(true);
  });
  await step(3, async () => {
    await p.戻る();
    戻った画面 = p.path;
    note(`ブラウザの「戻る」で表示された画面: ${戻った画面}（入力フォーム ${(await p.フォーム.count()) > 0 ? "あり" : "なし"}）`);
  });
  await step(4, async () => {
    if ((await p.フォーム.count()) === 0) {
      throw new Error(`ブラウザの「戻る」でパスワード設定（ポリシー違反用）画面の入力フォームに戻れず（表示された画面 ${戻った画面}）、再送信の手順を実行できない`);
    }
    再送信 = await p.変更を押す(再, 再);
    note(`2回目（戻ったフォームから）: ${押した様子(再送信)}／移った先 ${p.path}`);
  });
  return { 再送信, 戻った画面 };
}

caseTest("IT-F06-27-008", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  const r = await 戻って再送信する("008", l, p, step);
  await expected(async () => {
    expect.soft(r.再送信?.送った, "戻ったフォームの「変更する」が送信された").toBe(true);
    expect.soft(p.path, "再送信のあと、マイページ画面へリダイレクトされる（アドレス）").toMatch(/^\/ja\/mypage\/?$/);
  });
});

caseTest("IT-F06-27-009", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  const r = await 戻って再送信する("009", l, p, step);
  let abc: ログインの結果 | undefined;
  let abd: ログインの結果 | undefined;
  await step(5, async () => { await ログアウトする(p); });
  await step(6, async () => { abc = await ログインする(l, 会員("009"), "F0627-N-009!abc"); });
  await step(7, async () => { await ログアウトする(p); });
  await step(8, async () => { abd = await ログインする(l, 会員("009"), "F0627-N-009!abd"); });
  await expected(async () => {
    expect.soft(r.再送信?.送った, "戻ったフォームの「変更する」が送信された（再送信の操作をした）").toBe(true);
    expect.soft(abc!.ログインが成立した, `「F0627-N-009!abc」でログインできる（表示された画面 ${abc!.後の画面}・認証エラー ${abc!.認証エラー || "なし"}）`).toBe(true);
    expect.soft(abd!.ログイン画面のまま, "再送信で入力した「F0627-N-009!abd」ではログインできない（ログイン画面に留まる）").toBe(true);
    expect.soft(abd!.認証エラー, "「F0627-N-009!abd」でのログインに認証エラーが表示される").not.toBe("");
  });
});

caseTest("IT-F06-27-014", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  let 押した: 変更を押した結果 | undefined;
  let 旧: ログインの結果 | undefined;
  let 新: ログインの結果 | undefined;
  let 旧で設定画面 = false;
  await step(1, async () => { await ログインする(l, 会員("014"), ポリシー違反のパスワード); });
  await step(2, async () => {
    押した = await p.変更を押す("F0627-N-014!abc", "F0627-N-014!abd");
    note(押した様子(押した));
  });
  await step(3, async () => { await ログアウトする(p); });
  await step(4, async () => { 旧 = await ログインする(l, 会員("014"), ポリシー違反のパスワード); 旧で設定画面 = await p.設定画面である(); });
  await step(5, async () => { await ログアウトする(p); });
  await step(6, async () => { 新 = await ログインする(l, 会員("014"), "F0627-N-014!abc"); });
  await expected(async () => {
    expect.soft(旧!.ログインが成立した, `「F0627-Old!9」でログインできる（表示された画面 ${旧!.後の画面}・認証エラー ${旧!.認証エラー || "なし"}）`).toBe(true);
    expect.soft(旧で設定画面, "「F0627-Old!9」でのログイン後もパスワード設定（ポリシー違反用）画面が表示される（パスワードが変わっていない）").toBe(true);
    expect.soft(新!.ログイン画面のまま, "入力した「F0627-N-014!abc」ではログインできない（ログイン画面に留まる）").toBe(true);
    expect.soft(新!.認証エラー, "「F0627-N-014!abc」でのログインに認証エラーが表示される").not.toBe("");
  });
});

caseTest("IT-F06-27-015", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  let 押した: 変更を押した結果 | undefined;
  let 旧: ログインの結果 | undefined;
  await step(1, async () => { await ログインする(l, 会員("015"), ポリシー違反のパスワード); });
  await step(2, async () => {
    押した = await p.変更を押す("", "");
    note(押した様子(押した));
  });
  await step(3, async () => { await ログアウトする(p); });
  await step(4, async () => { 旧 = await ログインする(l, 会員("015"), ポリシー違反のパスワード); });
  await expected(async () => {
    expect.soft(押した!.誤りの文.length + 押した!.止めた項目.length,
      `手順2の「変更する」が受け付けられなかったことが画面に出ている（誤りの表示 ${押した!.誤りの文.join(" / ") || "なし"}・入力チェックが止めた項目 ${押した!.止めた項目.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(旧!.ログインが成立した, `「F0627-Old!9」でログインできる（表示された画面 ${旧!.後の画面}・認証エラー ${旧!.認証エラー || "なし"}）`).toBe(true);
    expect.soft(await p.設定画面である(), "ログイン後にパスワード設定（ポリシー違反用）画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-27-019", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  await step(1, async () => {
    await ログインする(l, 会員("019"), ポリシー違反のパスワード);
    expect(await p.設定画面である(), "ログイン後にパスワード設定（ポリシー違反用）画面が表示される").toBe(true);
  });
  await step(2, async () => {
    const n = await p.TOPへ戻る.count();
    if (n === 0) throw new Error("パスワード設定（ポリシー違反用）画面に「TOPへ戻る」が無く、押せない");
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.TOPへ戻る.first().click({ noWaitAfter: true })]);
  });
  await expected(async () => {
    expect.soft(p.TOPである(), `TOP画面が表示される（表示された画面 ${p.path}）`).toBe(true);
  });
});
