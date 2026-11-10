/**
 * F06-21 退会の続き。正本: cases/F06-21_test_cases.tsv
 * 実装するのは、なりすまし対策の照合値を書き換えるもの（020〜023）と、今回作った試験会員で退会を完了するもの（026〜028・032〜034）。
 * 実装しないケース:
 *  - 030・031・041: 退会完了メールを受信画面で確かめる（メール通知そのものの受信）
 *  - 038〜040: スマレジの試験環境、またはスマレジの環境設定の書き換えと再起動を要する
 * 既存の spec/f06/f06-21.spec.ts は変えない。記録 review/F06-21_progress_2026-11-09.md
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { available } from "../../lib/db";
import { 会員の送信履歴の件数, 会員の退会状態, 会員の選手情報 } from "../../db/f06_21_withdraw";
import { WithdrawExecPage } from "../../pages/front/f06_21_withdraw_exec";
import { mailOf, PW } from "../../seeds/f06-21";
import "../../seeds/f06-21-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 送信元の注記 = "退会完了メールの運営アドレス（送信元）は共有の設定のため書き換えず、既定のまま退会した。このケースは送信元を確かめない";
const 開発者ツールの注記 = "開発者ツールの代わりに、画面の要素をスクリプトで取り除く・値を変えることで同じ状態にしてから押した";

// ---- なりすまし対策の照合値の書き換え（共有の試験会員。退会は成立しない） ----
async function ログイン共有(w: WithdrawExecPage): Promise<void> { await w.ログインする(mailOf("f0621-ja"), PW); }

caseTest("IT-F06-21-020", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  await ログイン共有(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { const n = await w.照合値の入力要素を削除する(); note(`${開発者ツールの注記}（取り除いた入力要素 ${n} 個）`); expect.soft(n, "取り除いた照合値の入力要素の数").toBeGreaterThan(0); });
  await step(3, async () => { await w.押して遷移する(w.退会手続きへ); });
  await expected(async () => {
    expect.soft(await w.退会前画面である(), "退会前画面が表示される").toBe(true);
    expect.soft(await w.退会確認画面である(), "退会確認画面へ進まない").toBe(false);
  });
});
caseTest("IT-F06-21-021", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  await ログイン共有(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => {
    const n = await w.照合値を変える("invalid-token");
    note(`${開発者ツールの注記}（値を変えた入力要素 ${n} 個）`);
    expect.soft(await w.照合値の入力要素の値(), "照合値の入力要素の値").toEqual(Array(n).fill("invalid-token"));
  });
  await step(3, async () => { await w.押して遷移する(w.退会手続きへ); });
  await expected(async () => {
    expect.soft(await w.退会前画面である(), "退会前画面が表示される").toBe(true);
    expect.soft(await w.退会確認画面である(), "退会確認画面へ進まない").toBe(false);
  });
});
caseTest("IT-F06-21-022", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  await ログイン共有(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.パスワード欄.fill(PW, { timeout: 30_000 }); });
  await step(4, async () => { const n = await w.照合値の入力要素を削除する(); note(`${開発者ツールの注記}（取り除いた入力要素 ${n} 個）`); expect.soft(n, "取り除いた照合値の入力要素の数").toBeGreaterThan(0); });
  await step(5, async () => { await w.押して遷移する(w.退会する); });
  await expected(async () => {
    expect.soft(await w.退会前画面である(), "退会前画面が表示される").toBe(true);
    expect.soft(w.path, "退会完了画面へ進まない").not.toBe("/ja/mypage/withdraw_complete");
  });
});
caseTest("IT-F06-21-023", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  await ログイン共有(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.パスワード欄.fill(PW, { timeout: 30_000 }); });
  await step(4, async () => {
    const n = await w.照合値を変える("invalid-token");
    note(`${開発者ツールの注記}（値を変えた入力要素 ${n} 個）`);
    expect.soft(await w.照合値の入力要素の値(), "照合値の入力要素の値").toEqual(Array(n).fill("invalid-token"));
  });
  await step(5, async () => { await w.押して遷移する(w.退会する); });
  await expected(async () => {
    expect.soft(await w.退会前画面である(), "退会前画面が表示される").toBe(true);
    expect.soft(w.path, "退会完了画面へ進まない").not.toBe("/ja/mypage/withdraw_complete");
  });
});

// ---- 退会を完了する（今回作った試験会員） ----
async function 手順1から4(w: WithdrawExecPage, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<void> {
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.パスワード欄.fill(PW, { timeout: 30_000 }); });
  await step(4, async () => { await w.押して遷移する(w.退会する); });
}

caseTest("IT-F06-21-026", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  await w.ログインする(mailOf("f0621-ja-026"), PW);
  await 手順1から4(w, step);
  await expected(async () => {
    expect.soft(w.path, "遷移した画面（退会完了画面）").toBe("/ja/mypage/withdraw_complete");
    expect.soft(await w.退会完了画面である(), "退会完了画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-21-027", async ({ page, step, expected, notes }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  const 退会後 = [] as { メール: string; 削除済み: string }[];
  await step(1, async () => {
    await w.ログインする(mailOf("f0621-ja-027"), PW);
    await w.退会前から退会を完了する(PW);
  });
  await step(2, async () => {
    await w.ログインする(mailOf("f0621-ja2-027"), "Passw0rd!F0621Ja2");
    await w.退会前から退会を完了する("Passw0rd!F0621Ja2");
  });
  await step(3, async () => {
    for (const k of ["027A", "027B"]) {
      const s = available ? 会員の退会状態(notes.get(`〔会員データID-F0621-${k}〕`)) : null;
      退会後.push(s ?? { メール: "", 削除済み: "" });
    }
  });
  await expected(async () => {
    const [a, b] = 退会後;
    expect.soft(a.メール, "会員Aの退会後のメールアドレス（英数字＋@dummy.dummy）").toMatch(/^[0-9A-Za-z]+@dummy\.dummy$/);
    expect.soft(b.メール, "会員Bの退会後のメールアドレス（英数字＋@dummy.dummy）").toMatch(/^[0-9A-Za-z]+@dummy\.dummy$/);
    expect.soft(a.メール === b.メール, "2件のメールアドレスが同じ値").toBe(false);
    expect.soft(a.削除済み, "会員Aの削除フラグ").toBe("1");
    expect.soft(b.削除済み, "会員Bの削除フラグ").toBe("1");
  });
});

caseTest("IT-F06-21-028", async ({ page, step, expected, notes }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  let 選手 = { 未削除: -1, 削除済み: -1 };
  await w.ログインする(mailOf("f0621-ja-028"), PW);
  await 手順1から4(w, step);
  await step(5, async () => { 選手 = available ? 会員の選手情報(notes.get("〔会員データID-F0621-028〕")) : 選手; });
  await expected(async () => {
    expect.soft(選手.未削除, "試験会員に紐づく、削除されていない選手情報の数").toBe(0);
    expect.soft(選手.削除済み, "試験会員に紐づく、削除された選手情報の数").toBeGreaterThanOrEqual(1);
  });
});

caseTest("IT-F06-21-032", async ({ page, step, expected, notes }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  let 件数 = -1;
  await w.ログインする(mailOf("f0621-ja-032"), PW);
  await 手順1から4(w, step);
  await step(5, async () => { 件数 = available ? 会員の送信履歴の件数(notes.get("〔会員データID-F0621-032〕")) : 件数; });
  await expected(async () => { expect.soft(件数, "試験会員のメール送信履歴の件数").toBe(1); });
});

caseTest("IT-F06-21-033", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  await w.ログインする(mailOf("f0621-ja-033"), PW);
  await 手順1から4(w, step);
  await step(5, async () => {
    note("退会完了画面にマイページへのリンクが無いので、マイページのアドレスを開いた");
    await w.マイページを開く();
  });
  await expected(async () => {
    expect.soft(w.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await w.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-21-034", async ({ page, step, expected }) => {
  const w = new WithdrawExecPage(page);
  note(送信元の注記);
  await w.ログインする(mailOf("f0621-ja-034"), PW);
  await 手順1から4(w, step);
  await step(5, async () => { await w.ログインする(mailOf("f0621-ja-034"), PW); });
  await expected(async () => {
    expect.soft(w.path, "ログイン後の画面（マイページ以外）").not.toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(await w.ログイン画面である(), "会員ログイン画面のまま（マイページは表示されない）").toBe(true);
  });
});
