/**
 * F08-04 店頭買取査定申込 会員登録フォーム。正本: cases/F08-04_test_cases.tsv
 *
 * - 店舗は、ケースごとの店舗（店舗識別名 f0804_shop など）の代わりに F08-05 と共通の試験店舗（支店URL itf0805pd003）を使う（seeds/f08-04.ts の読み替え）。
 *   手順の店舗識別名は、この店舗の支店URLとして読む。
 * - 重複させる会員（016・033・034）のメールアドレスと、パスワード＝メールアドレスの値（033）は、会員のシードと同じ実行の印つきの値。
 *   ほかの会員登録フォームの入力は確認画面までで会員を作らないので、正本の値のまま入れる。
 * - 会員登録フォームは「次のページへ進む」で確認画面へ進めないとき、同じ会員登録フォームを確認画面のURLで再表示する。
 *   確認画面へ進んだかは、確認画面の確定のボタンが見えるかで判定する（URLでは判定しない）。
 * - 「新しいブラウザセッション」はケースごとのブラウザのコンテキスト。開発者ツールで見る・消す手順は、画面の部品で同じことを行う。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { OtcApplyPage, 申込入力, 申込者 } from "../../pages/front/f08_05_confirm";
import { OtcInputPage, 会員登録フォームのURL } from "../../pages/front/f08_02_input";
import { RegisterFormPage } from "../../pages/front/f08_04_register";
import { F0804の会員, IN_COMMON, PD_STORE, 申込者の } from "../../seeds/f08-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 支店URL = PD_STORE.支店URL;
const 店舗の読み替え = `手順の店舗識別名は、F08-05 と共通の試験店舗の支店URL「${支店URL}」として開いた（シード作成時の問題の読み替え）`;
const 入力値の補い = "シード表の入力値に職業が無いが、必須の欄なので「会社員」を選んだ。返却希望サプライは選んでいない";
const 重複メッセージ = "既に利用されているメールアドレスです。";
const 同一メッセージ = "メールアドレスとパスワードは異なる文字列を使用してください。";
const 待ち時間 = 10 * 60_000 + 30_000;

type 部品 = { i: OtcInputPage; a: OtcApplyPage; r: RegisterFormPage };
const 部品 = (c: CaseCtx): 部品 => ({ i: new OtcInputPage(c.page), a: new OtcApplyPage(c.page), r: new RegisterFormPage(c.page) });

const 氏名 = (n: string): 申込者 => 申込者の(`F0804-${n}-S`, `F0804-${n}-N`);

/** 手順1・2: 申込前ログイン画面を開き、「アカウントをお持ちでない方はこちら」で申込情報入力画面を開く */
async function 入力画面を開く(c: CaseCtx, p: 部品): Promise<void> {
  await c.step(1, async () => { await p.a.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await p.a.アカウントなしで進む(); });
}

/** 手順3: 申込情報を入力して「次のページへ進む」を押し、会員登録フォームを表示する */
async function 会員登録フォームを表示する(c: CaseCtx, p: 部品, 申込者: 申込者, 入力: 申込入力 = IN_COMMON, 言語: "JP" | "EN" = "JP"): Promise<void> {
  await c.step(3, async () => {
    if (言語 === "EN") { await p.i.入力画面で言語を選ぶ("EN"); await p.i.入力画面を待つ(); }
    await p.a.入力する(入力, 申込者);
    await p.i.次のページへ進むを押す();
    if (!(await p.i.会員登録フォームか())) throw new Error(`「次のページへ進む」を押したあと、会員登録フォームが表示されない（${p.i.パス}）`);
  });
}

async function 確認画面か(p: 部品): Promise<boolean> { return p.a.確定ボタン().isVisible(); }

/** 手順4〜6（会員登録の値を入れ、同意にチェックを入れて「次のページへ進む」を押す）。4・5・6 を順に行う */
async function 会員登録して進む(c: CaseCtx, p: 部品, v: { メール: string; メール確認?: string; パスワード: string; パスワード確認?: string }, 手順 = 4): Promise<void> {
  await c.step(手順, async () => {
    await p.r.会員登録の値を入れる({ メール: v.メール, メール確認: v.メール確認 ?? v.メール, パスワード: v.パスワード, パスワード確認: v.パスワード確認 ?? v.パスワード });
  });
  await c.step(手順 + 1, async () => { await p.r.同意にチェックを入れる(); });
  await c.step(手順 + 2, async () => { await p.r.次のページへ進むを押す(); });
}

const 注記 = (...m: string[]) => note([店舗の読み替え, 入力値の補い, ...m].join("。"));

// ================= 会員登録フォームの表示 =================

caseTest("IT-F08-04-001", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("001"));
  let n = -1;
  await c.step(4, async () => { await expect(p.r.フォーム(), "会員登録フォーム").toBeVisible(); n = await p.r.個人情報の取り扱いのボタンの数(); });
  await c.expected(async () => {
    expect.soft(n, "会員登録フォームの「個人情報の取り扱いについて」のボタンの数").toBe(0);
  });
  注記();
});

caseTest("IT-F08-04-002", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("002"));
  await c.step(4, async () => { await p.r.利用規約のボタンを押す(); });
  await c.expected(async () => {
    await expect.soft(p.r.利用規約のモーダル(), "共通の利用規約を表示するモーダル").toBeVisible();
  });
  注記("会員登録フォームの「利用規約」のボタンは、利用規約の欄の「詳細」ボタン");
});

caseTest("IT-F08-04-003", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("003"));
  let 状態: boolean | null = null;
  await c.step(4, async () => { 状態 = await p.r.同意の状態(); });
  await c.expected(async () => {
    expect.soft(状態, "会員登録フォームの利用規約同意するのチェックの状態（チェックなし）").toBe(false);
  });
  注記();
});

// ================= 会員登録して確認画面へ =================

caseTest("IT-F08-04-011", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("011"));
  await 会員登録して進む(c, p, { メール: "f0804-011-mail@example.invalid", パスワード: "F0804-011-Pw" });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    expect.soft(p.r.パス, "移った画面のパス（店頭買取査定申込確認画面）").toMatch(/\/otcbuy\/\w+\/confirm$/);
  });
  注記();
});

caseTest("IT-F08-04-013", async (c) => {
  const p = 部品(c);
  const pw = "F0804-013-Pw12Pw12Pw12Pw12Pw12Pw12Pw12Pw12Pw12Pw12";
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("013"));
  await 会員登録して進む(c, p, { メール: "f0804-013-mail@example.invalid", パスワード: pw });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    expect.soft(p.r.パス, "移った画面のパス（店頭買取査定申込確認画面）").toMatch(/\/otcbuy\/\w+\/confirm$/);
  });
  注記(`パスワードは${pw.length}文字`);
});

caseTest("IT-F08-04-016", async (c) => {
  const p = 部品(c);
  const m = F0804の会員("016");
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("016"));
  await 会員登録して進む(c, p, { メール: m.メール, パスワード: "F0804-016-Pw12" });
  let メール欄 = [""], パスワード欄 = [""];
  await c.expected(async () => {
    expect.soft(await 確認画面か(p), "店頭買取査定申込確認画面の確定のボタンが見える（見えない）").toBe(false);
    await expect.soft(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible();
    メール欄 = await p.r.欄の下の文("メールアドレス");
    パスワード欄 = await p.r.欄の下の文("パスワード");
    expect.soft(メール欄, "メールアドレス欄の下に出た文").toEqual([重複メッセージ]);
    expect.soft(パスワード欄, "パスワード欄の下に出た文（出ない）").toEqual([]);
  });
  注記(`メールアドレスは会員のシードと同じ実行の印つきの値（${m.メール}）`);
});

caseTest("IT-F08-04-018", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("018"));
  await c.step(4, async () => { await p.i.会員登録フォームのキャンセルを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "「キャンセル」を押したあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  注記();
});

caseTest("IT-F08-04-019", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("019"));
  let r = { パス: "", 知らせ: null as string | null };
  await c.step(4, async () => { r = await p.i.会員登録なしで進むを押す(); });
  await c.expected(async () => {
    expect.soft(r.知らせ, "会員登録の入力項目の入力を求める知らせ（出ない）").toBeNull();
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    expect.soft(r.パス, "押したあとの画面のパス（店頭買取査定申込確認画面）").toMatch(/\/otcbuy\/\w+\/confirm$/);
  });
  注記();
});

caseTest("IT-F08-04-020", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("020"));
  await 会員登録して進む(c, p, { メール: "f0804-020-mail@example.invalid", パスワード: "F0804-020-Pw12" });
  let 値: string | null = null;
  await c.step(7, async () => { await p.a.確認画面を待つ(); 値 = await p.a.確認の値("メールアドレス"); });
  await c.expected(async () => {
    expect.soft(値, "店頭買取査定申込確認画面のメールアドレス").toBe("f0804-020-mail@example.invalid");
  });
  注記();
});

caseTest("IT-F08-04-021", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("021"));
  await 会員登録して進む(c, p, { メール: "f0804-021-mail@example.invalid", パスワード: "F0804-021-Pw12" });
  const 値: Record<string, string | null> = {};
  let 見出し: string[] = [];
  let 題 = "";
  await c.step(7, async () => {
    await p.a.確認画面を待つ();
    for (const k of ["メールアドレス(確認用)", "パスワード", "パスワード(確認用)"] as const) 値[k] = await p.a.確認の値(k);
    見出し = await p.a.確認の見出し("利用規約について");
    題 = (await c.page.locator("h1").first().innerText()).trim();
  });
  await c.expected(async () => {
    for (const k of ["メールアドレス(確認用)", "パスワード", "パスワード(確認用)"]) {
      expect.soft(値[k], `店頭買取査定申込確認画面の${k}の表示（項目がある）`).not.toBeNull();
    }
    expect.soft(見出し.length, "店頭買取査定申込確認画面の「利用規約について」の項目の数").toBeGreaterThanOrEqual(1);
    expect.soft(題, "店頭買取査定申込確認画面の見出し（査定申込み）").toBe("査定申込み");
  });
  注記("「利用規約について」は項目の見出し（利用規約）、「査定申込み」は画面の見出しとして確かめた");
});

caseTest("IT-F08-04-022", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("022"));
  await c.step(4, async () => { await p.i.会員登録なしで進むを押す(); });
  let 値: string | null = "";
  await c.step(5, async () => { await p.a.確認画面を待つ(); 値 = await p.a.確認の値("メールアドレス"); });
  await c.expected(async () => {
    expect.soft(値, "店頭買取査定申込確認画面のメールアドレスの項目（表示されない）").toBeNull();
  });
  注記();
});

// ================= 入力時間 =================

/** 手順「会員登録フォームを表示した時点から10分30秒、何も操作せずに待つ」と「前ログイン画面へ遷移していないときは再読み込みする」 */
async function 時間切れまで待つ(c: CaseCtx, p: 部品, 待つ手順: number): Promise<void> {
  await c.step(待つ手順, async () => { await c.page.waitForTimeout(待ち時間); });
  await c.step(待つ手順 + 1, async () => {
    await c.page.waitForLoadState("load");
    if (!(await p.r.申込前ログイン画面か())) {
      note(`10分30秒待っても前ログイン画面へ遷移していなかった（${p.r.パス}）ので、会員登録フォームを再読み込みした`);
      await p.r.再読み込みする();
    }
  });
}

caseTest("IT-F08-04-023", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("023"));
  await 時間切れまで待つ(c, p, 4);
  await c.expected(async () => {
    expect.soft(p.r.パス, "10分30秒のあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  注記("手順5の再読み込みは、遷移していなかったときだけ行い、行ったかを注記に残した");
});

caseTest("IT-F08-04-024", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("024"));
  await 時間切れまで待つ(c, p, 4);
  await c.step(6, async () => { await p.a.アカウントなしで進む(); });
  const v = { 姓: "?", 名: "?" };
  await c.step(7, async () => { v.姓 = await p.i.値("lastName"); v.名 = await p.i.値("firstName"); });
  await c.expected(async () => {
    expect.soft(v.姓, "店頭買取査定申込情報入力画面のお名前（姓）").toBe("");
    expect.soft(v.名, "店頭買取査定申込情報入力画面のお名前（名）").toBe("");
  });
  注記();
});

caseTest("IT-F08-04-025", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await c.step(3, async () => { await p.i.入力画面を待つ(); await c.page.waitForTimeout(6 * 60_000); });
  await c.step(4, async () => {
    await p.a.入力する(IN_COMMON, 氏名("025"));
    await p.i.次のページへ進むを押す();
    if (!(await p.i.会員登録フォームか())) throw new Error(`「次のページへ進む」を押したあと、会員登録フォームが表示されない（${p.i.パス}）`);
  });
  await c.step(5, async () => { await c.page.waitForTimeout(6 * 60_000); });
  let 表示 = false;
  await c.step(6, async () => { 表示 = await p.r.フォーム().isVisible(); });
  await c.expected(async () => {
    expect.soft(p.r.パス, "6分待ったあとの画面（申込前ログイン画面へ遷移しない）").not.toMatch(/\/entry$/);
    expect.soft(表示, "会員登録フォームが表示されたまま").toBe(true);
  });
  注記();
});

caseTest("IT-F08-04-039", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  const 入力 = (番号: string): 申込入力 => ({ ...IN_COMMON, 適格請求書発行事業者: "はい", 登録番号: `T0804039${番号}` });
  await 入力画面を開く(c, p);
  await c.step(3, async () => {
    await p.a.入力する(入力("000001"), 氏名("039"));
    await p.i.次のページへ進むを押す();
    if (!(await p.i.会員登録フォームか())) throw new Error(`「次のページへ進む」を押したあと、会員登録フォームが表示されない（${p.i.パス}）`);
  });
  await 時間切れまで待つ(c, p, 4);
  await c.step(6, async () => { await p.a.アカウントなしで進む(); });
  await c.step(7, async () => {
    await p.a.入力する(入力("000002"), 氏名("039"));
    await p.i.次のページへ進むを押す();
    if (!(await p.i.会員登録フォームか())) throw new Error(`「次のページへ進む」を押したあと、会員登録フォームが表示されない（${p.i.パス}）`);
  });
  await c.step(8, async () => { await p.a.会員登録をスキップする(); });
  let 値: string | null = null;
  await c.step(9, async () => { await p.a.確認画面を待つ(); 値 = await p.a.確認の値("適格請求書発行事業者確認"); });
  await c.expected(async () => {
    expect.soft(値 ?? "", "店頭買取査定申込確認画面の適格請求書発行事業者登録番号（1回目の値）").toContain("T0804039000001");
    expect.soft(値 ?? "", "店頭買取査定申込確認画面の適格請求書発行事業者登録番号（2回目の値は表示されない）").not.toContain("T0804039000002");
  });
  注記("適格請求書発行事業者登録番号は、確認画面の適格請求書発行事業者確認の項目に出る「登録番号: …」として読んだ");
});

caseTest("IT-F08-04-040", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("040"), { ...IN_COMMON, 言語: "EN" }, "EN");
  await 時間切れまで待つ(c, p, 4);
  let 言語 = "";
  let リンク = "";
  await c.step(6, async () => {
    await expect(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
    言語 = await p.i.申込前ログイン画面の言語();
    リンク = await p.r.ログイン画面のゲストのリンク();
  });
  await c.expected(async () => {
    expect.soft(p.r.パス, "表示された画面のパス（日本語表示の申込前ログイン画面）").toMatch(/^\/ja\/otcbuy\/\w+\/entry$/);
    expect.soft(言語, "Languageの選択状態").toBe("JP");
    expect.soft(リンク, "申込前ログイン画面のリンクの表示").toBe("アカウントをお持ちでない方はこちら");
  });
  注記("Language=EN は、申込情報入力画面の Language の選択を EN にして英語表示で入力した（国は日本、都道府県・職業は英語表示のそれに当たる選択肢）");
});

// ================= 入力のチェック =================

caseTest("IT-F08-04-033", async (c) => {
  const p = 部品(c);
  const m = F0804の会員("033");
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("033"));
  await 会員登録して進む(c, p, { メール: m.メール, パスワード: m.メール });
  const 文: Record<string, string[]> = {};
  await c.step(7, async () => {
    await expect(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible();
    文["メールアドレス"] = await p.r.欄の下の文("メールアドレス");
    文["パスワード"] = await p.r.欄の下の文("パスワード");
  });
  await c.expected(async () => {
    expect.soft(await 確認画面か(p), "店頭買取査定申込確認画面の確定のボタンが見える（見えない）").toBe(false);
    expect.soft(文["メールアドレス"], "メールアドレス欄の下に出た文").toEqual([重複メッセージ]);
    expect.soft(文["パスワード"], "パスワード欄の下に出た文").toEqual([同一メッセージ]);
  });
  注記(`メールアドレスとパスワードは、会員のシードと同じ実行の印つきのメールアドレス（${m.メール}）`);
});

caseTest("IT-F08-04-034", async (c) => {
  const p = 部品(c);
  const m = F0804の会員("034");
  const 入れた = { メール: m.メール, メール確認: m.メール, パスワード: "F0804-034-Pw12", パスワード確認: "F0804-034-Pw12" };
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("034"));
  await 会員登録して進む(c, p, { メール: m.メール, パスワード: "F0804-034-Pw12" });
  let 欄 = { メール: "", メール確認: "", パスワード: "", パスワード確認: "" };
  await c.step(7, async () => { await expect(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible(); });
  await c.step(8, async () => { 欄 = await p.r.入力欄の値(); });
  await c.expected(async () => {
    expect.soft(await 確認画面か(p), "店頭買取査定申込確認画面の確定のボタンが見える（見えない）").toBe(false);
    expect.soft(欄.メール, "再表示されたメールアドレス").toBe(入れた.メール);
    expect.soft(欄.メール確認, "再表示されたメールアドレス（確認用）").toBe(入れた.メール確認);
    expect.soft(欄.パスワード, "再表示されたパスワードの入力欄の値").toBe(入れた.パスワード);
    expect.soft(欄.パスワード確認, "再表示されたパスワード（確認用）の入力欄の値").toBe(入れた.パスワード確認);
  });
  注記(`メールアドレスは会員のシードと同じ実行の印つきの値（${m.メール}）。パスワードの入力欄の値は、開発者ツールの代わりに画面の部品で入力欄の値を読んだ`);
});

caseTest("IT-F08-04-035", async (c) => {
  const p = 部品(c);
  const 同じ = "f0804-035-same@example.invalid";
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("035"));
  await 会員登録して進む(c, p, { メール: 同じ, パスワード: 同じ });
  let 状態: boolean | null = null;
  await c.step(7, async () => { await expect(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible(); 状態 = await p.r.同意の状態(); });
  await c.expected(async () => {
    await expect.soft(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible();
    expect.soft(状態, "再表示された会員登録フォームの利用規約同意するのチェックの状態（チェックなし）").toBe(false);
  });
  注記();
});

caseTest("IT-F08-04-036", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("036"));
  await 会員登録して進む(c, p, { メール: "f0804-036-case@example.invalid", パスワード: "F0804-036-CASE@EXAMPLE.INVALID" });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    await expect.soft(p.r.フォーム(), "会員登録フォームの数（再表示されない）").toHaveCount(0);
  });
  注記("パスワードは、メールアドレスの英字の大文字小文字だけを変えた値（半角英字の大文字で入れた）");
});

caseTest("IT-F08-04-037", async (c) => {
  const p = 部品(c);
  const 正 = "f0804-037-mail@example.invalid";
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("037"));
  await 会員登録して進む(c, p, { メール: ` ${正} `, メール確認: `${正}  `, パスワード: "F0804-037-Pw12" });
  let 表示: [string | null, string | null] = [null, null];
  let 隠し: string[] = [];
  await c.step(7, async () => {
    await p.a.確認画面を待つ();
    表示 = [await p.r.確認の表示文字("email"), await p.r.確認の表示文字("email-confirm")];
    隠し = await p.r.確認の隠し項目の値();
  });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    expect.soft(表示[0], "確認画面のメールアドレスの表示値（前後の空白を含めて）").toBe(正);
    expect.soft(表示[1], "確認画面のメールアドレス（確認用）の表示値（前後の空白を含めて）").toBe(正);
    expect.soft(隠し, "確認画面のメールアドレスの隠し項目の値").toEqual([正, 正]);
  });
  注記("前後の空白は、入力欄に与えたまま入力した（ブラウザが入力欄の種類によって取り除くことがある）。表示値は、開発者ツールの代わりに画面の部品で文字列そのままを読んだ");
});

caseTest("IT-F08-04-038", async (c) => {
  const p = 部品(c);
  const pw = "F0804-038-Pw１２";
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("038"));
  await 会員登録して進む(c, p, { メール: "f0804-038-mail@example.invalid", パスワード: pw });
  let エラー: string[] = [];
  let 全体: string[] = [];
  await c.step(7, async () => { エラー = await p.r.確認のエラーの文("パスワード"); 全体 = await p.r.確認画面のエラーの文(); });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    await expect.soft(p.r.フォーム(), "会員登録フォームの数（再表示されない）").toHaveCount(0);
    expect.soft(エラー.length + 全体.length, "確認画面に出たパスワードの形式エラーの表示の数").toBeGreaterThan(0);
  });
  注記(`パスワードの形式エラーは、確認画面のパスワードの枠と画面内の赤字・エラー表示を読んだ（出た文: ${[...エラー, ...全体].join(" / ") || "なし"}）`);
});

caseTest("IT-F08-04-043", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("043"));
  await 会員登録して進む(c, p, { メール: "f0804-043-a..b@example.invalid", パスワード: "F0804-043-Pw12" });
  let エラー: string[] = [];
  await c.step(7, async () => { エラー = [...(await p.r.確認のエラーの文("メールアドレス")), ...(await p.r.確認画面のエラーの文())]; });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    await expect.soft(p.r.フォーム(), "会員登録フォームの数（再表示されない）").toHaveCount(0);
    expect.soft(エラー.length, "確認画面に出たメールアドレスの形式エラーの表示の数").toBeGreaterThan(0);
  });
  注記(`メールアドレスの形式エラーは、確認画面のメールアドレスの枠と画面内の赤字・エラー表示を読んだ（出た文: ${エラー.join(" / ") || "なし"}）`);
});

caseTest("IT-F08-04-044", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("044"));
  await 会員登録して進む(c, p, { メール: "f0804-044-a.@example.invalid", パスワード: "F0804-044-Pw12" });
  let エラー: string[] = [];
  await c.step(7, async () => { エラー = [...(await p.r.確認のエラーの文("メールアドレス")), ...(await p.r.確認画面のエラーの文())]; });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    await expect.soft(p.r.フォーム(), "会員登録フォームの数（再表示されない）").toHaveCount(0);
    expect.soft(エラー.length, "確認画面に出たメールアドレスの形式エラーの表示の数").toBeGreaterThan(0);
  });
  注記(`メールアドレスの形式エラーは、確認画面のメールアドレスの枠と画面内の赤字・エラー表示を読んだ（出た文: ${エラー.join(" / ") || "なし"}）`);
});

caseTest("IT-F08-04-045", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("CB045"));
  await 会員登録して進む(c, p, { メール: "f0804-cb045-mail@example.test", パスワード: "F0804-CB045-Pw12" });
  await c.expected(async () => {
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
    await expect.soft(p.r.フォーム(), "会員登録フォームの数（再表示されない）").toHaveCount(0);
  });
  注記("メールアドレスの会員・プレイヤーを0件にする準備は、会員・プレイヤーを作らないので行っていない");
});

caseTest("IT-F08-04-046", async (c) => {
  const p = 部品(c);
  const 同じ = "f0804-cb046-same@example.test";
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("CB046"));
  await 会員登録して進む(c, p, { メール: 同じ, パスワード: 同じ });
  let メール欄 = [""], パスワード欄 = [""];
  await c.expected(async () => {
    expect.soft(await 確認画面か(p), "店頭買取査定申込確認画面の確定のボタンが見える（見えない）").toBe(false);
    await expect.soft(p.r.フォーム(), "再表示された会員登録フォーム").toBeVisible();
    メール欄 = await p.r.欄の下の文("メールアドレス");
    パスワード欄 = await p.r.欄の下の文("パスワード");
    expect.soft(パスワード欄, "パスワード欄の下に出た文").toEqual([同一メッセージ]);
    expect.soft(メール欄, "メールアドレス欄の下に出た文（F08-04-MSG-001は出ない）").toEqual([]);
  });
  注記("メールアドレスの会員・プレイヤーを0件にする準備は、会員・プレイヤーを作らないので行っていない");
});

// ================= 41・42: 申込情報の併合 =================

caseTest("IT-F08-04-041", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("041"));
  await 会員登録して進む(c, p, { メール: "f0804-041-mail@example.invalid", パスワード: "F0804-041-Pw12" });
  let 値: string | null = null;
  await c.step(7, async () => { await p.a.確認画面を待つ(); 値 = await p.a.確認の値("お名前"); });
  await c.expected(async () => {
    expect.soft(値 ?? "", "店頭買取査定申込確認画面のお名前（姓）").toContain("F0804-041-S");
    expect.soft(値 ?? "", "店頭買取査定申込確認画面のお名前（名）").toContain("F0804-041-N");
  });
  注記();
});

caseTest("IT-F08-04-042", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await 会員登録フォームを表示する(c, p, 氏名("042"), { ...IN_COMMON, 適格請求書発行事業者: "はい", 登録番号: "T0804042000001" });
  await 会員登録して進む(c, p, { メール: "f0804-042-mail@example.invalid", パスワード: "F0804-042-Pw12" });
  let 値: string | null = null;
  await c.step(7, async () => { await p.a.確認画面を待つ(); 値 = await p.a.確認の値("適格請求書発行事業者確認"); });
  await c.expected(async () => {
    expect.soft(値 ?? "", "店頭買取査定申込確認画面の適格請求書発行事業者登録番号").toContain("T0804042000001");
  });
  注記("適格請求書発行事業者登録番号は、確認画面の適格請求書発行事業者確認の項目に出る「登録番号: …」として読んだ");
});

// ================= 直接の送信・セッション =================

caseTest("IT-F08-04-026", async (c) => {
  const p = 部品(c);
  let r = { status: 0, パス: "" };
  await c.step(1, async () => {
    await c.page.goto("about:blank");
    r = await p.r.直接POSTする(会員登録フォームのURL(支店URL));
  });
  await c.expected(async () => {
    expect.soft(r.パス, "送ったあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。申込前ログイン画面を開くとエントリーが始まってしまうため、店舗の画面を開かない白紙の画面に試験用のフォーム（入力項目なし）を作って、会員登録フォームのURLへ POST で送った`);
});

caseTest("IT-F08-04-027", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  let パス = "";
  await c.step(3, async () => { パス = (await p.r.直接POSTする(会員登録フォームのURL(支店URL))).パス; });
  await c.expected(async () => {
    expect.soft(パス, "送ったあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。申込情報入力画面を開いたまま、その画面に試験用のフォーム（入力項目なし）を作って、会員登録フォームのURLへ POST で送った`);
});

caseTest("IT-F08-04-028", async (c) => {
  const p = 部品(c);
  let r = { status: 0, パス: "" };
  await c.step(1, async () => {
    await c.page.goto("about:blank");
    r = await p.r.直接POSTする(会員登録フォームのURL("f0804_028_nostore"));
  });
  await c.expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(404);
  });
  note("存在しない店舗識別名 f0804_028_nostore は、そのまま使った。白紙の画面に試験用のフォーム（入力項目なし）を作って、会員登録フォームのURLへ POST で送った");
});

caseTest("IT-F08-04-048", async (c) => {
  const p = 部品(c);
  await 入力画面を開く(c, p);
  await c.step(3, async () => { await p.a.入力する(IN_COMMON, 氏名("CB048")); });
  await c.step(4, async () => { await p.i.クッキーを消す(); });
  await c.step(5, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "押したあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  注記("開発者ツールの代わりに、このブラウザのクッキーを全て消した");
});
