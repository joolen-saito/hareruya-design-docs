/**
 * F06-04 パスワード再発行。正本: cases/F06-04_test_cases.tsv
 * 実装しないケース: リセットキーを画面で指定できずDBへ直接設定するシードを使うもの、メールの受信そのものを確かめる 005・007・010。
 * 記録 review/F06-04_progress_2026-11-04.md
 * 仮会員機能（共有の設定）を有効にして会員を作るシードを使うケースは、書き換えが起きれば元の値へ戻してDBの参照で確かめる。
 */
import { Browser, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 関連データの件数 } from "../../db/f06_01";
import { パスワードの保存値, リセットキーの保存値, リセットの状態 } from "../../db/f06_04";
import { 有効期限を設定する } from "../../db/f06_04_prep";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { available } from "../../lib/db";
import { mailIds } from "../../lib/mail";
import { ForgotPage } from "../../pages/front/f06_04_forgot";
import { mailOf, キーを替えたURL, 仮会員のキー, 再発行URL, 存在しないキー, 仮会員機能を戻す } from "../../seeds/f06-04";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const キー読み替え = "シード表のリセットキー文字列・有効期限は画面で指定できないため、画面のパスワード再発行でアプリが発行したリセットキー（メールのURL）に読み替えた（シードの注記を参照）";
const 削除の補い = "事前準備は「会員が存在しない状態にし、存在する場合は削除」と定めるが、DBへは書き込まない決まりのため、メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、会員が0件であることをDBの参照で確かめた";

const 時刻帯の補い = "有効期限はアプリの時刻（日本時間）の壁時計の値がそのまま保存されており、DBの時刻帯（協定世界時）で実時刻と比べると9時間先になる。発行時刻の24時間後は、保存値と現在の日本時間の壁時計との差で確かめた";
async function 戻す(browser: Browser): Promise<void> {
  expect(await 仮会員機能を戻す(browser), "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
}

caseTest("IT-F06-04-001", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await expected(async () => {
    expect.soft(f.path, "パスワード再発行画面のアドレス").toBe("/ja/forgot");
    expect.soft(await f.再発行画面である, "メールアドレス入力画面が表示される").toBe(true);
    expect.soft(await f.次のページへ.isVisible(), "「次のページへ」ボタンが表示される").toBe(true);
  });
});
caseTest("IT-F06-04-002", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-04-003", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.押して遷移する(f.パンくずホーム); });
  await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

caseTest("IT-F06-04-004", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-004");
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { await f.申し込む(メール); });
    let r: ReturnType<typeof リセットの状態> = null;
    await step(3, async () => { supplement(時刻帯の補い); r = リセットの状態(メール); });
    await expected(async () => {
      expect.soft(r !== null, "会員がDBに1件ある").toBe(true);
      expect.soft(!!r?.リセットキー, "リセットキーが保存されている").toBe(true);
      const 時間 = r?.有効までの時間 ?? NaN;
      expect.soft(Math.round(時間 * 10) / 10, "有効期限までの時間（発行時刻の24時間後なら24時間の手前）").toBeLessThanOrEqual(24.1);
      expect.soft(Math.round(時間 * 10) / 10, "有効期限までの時間（24時間より短くない）").toBeGreaterThanOrEqual(23.9);
    });
  } finally { await 戻す(browser); }
});

function 送信完了へ(前半: string, 補い = "") {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    try {
      if (補い) supplement(補い);
      const f = new ForgotPage(page);
      await step(1, async () => { await f.再発行画面を開く(); });
      await step(2, async () => { await f.申し込む(mailOf(前半)); });
      await expected(async () => {
        expect.soft(f.完了画面か, `パスワード再発行メール送信完了画面へ遷移する（実際 ${f.path}）`).toBe(true);
      });
    } finally { await 戻す(browser); }
  };
}
caseTest("IT-F06-04-006", 送信完了へ("f0604-a-006"));
caseTest("IT-F06-04-011", 送信完了へ("f0604-temp-011"));

caseTest("IT-F06-04-008", async ({ page, step, expected }) => {
  supplement(削除の補い);
  const メール = mailOf("f0604-none");
  if (available) expect(関連データの件数(メール).会員, "事前: このメールアドレスの会員が0件").toBe(0);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.申し込む(メール); });
  await expected(async () => {
    expect.soft(f.完了画面か, `会員が存在しなくてもメール送信完了画面へ遷移する（実際 ${f.path}）`).toBe(true);
  });
});

caseTest("IT-F06-04-009", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-temp-009");
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { await f.申し込む(メール); });
    let r: ReturnType<typeof リセットの状態> = null;
    await step(3, async () => { r = リセットの状態(メール); });
    await expected(async () => {
      expect.soft(r !== null, "仮会員がDBに1件ある").toBe(true);
      expect.soft(r?.リセットキー ?? null, "リセットキー（発行されていない）").toBeNull();
    });
  } finally { await 戻す(browser); }
});

// ---- 送信完了画面の部品 ----
async function 送信完了まで(f: ForgotPage, 前半: string): Promise<void> {
  await f.再発行画面を開く();
  await f.申し込む(mailOf(前半));
}
caseTest("IT-F06-04-014", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-014"); });
    await step(2, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
    await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-015", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-015"); });
    await step(2, async () => { await f.押して遷移する(f.パンくずホーム); });
    await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-016", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-016"); });
    await step(2, async () => { await expect(f.ホームへ戻る, "「ホームへ戻る」ボタン").toBeVisible({ timeout: 30_000 }); await f.押して遷移する(f.ホームへ戻る); });
    await expected(async () => { expect.soft(f.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});

// ---- メールのURL ----
caseTest("IT-F06-04-017", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-017");
    let before = new Set<number>();
    let url = "";
    await step(1, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(2, async () => { url = await f.メールのURL(メール, before); });
    await step(3, async () => { await f.URLを開く(url); });
    await expected(async () => {
      expect.soft(f.path, "パスワード再設定画面のアドレス").toMatch(/^\/ja\/forgot\/reset\//);
      expect.soft(await f.再設定画面である, "パスワード再設定画面（パスワード入力欄）が表示される").toBe(true);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-04-061", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-061");
    let before = new Set<number>();
    const urls: string[] = [];
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { before = await mailIds(); await f.申し込む(メール); });
    await step(3, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(4, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(5, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(6, async () => { await f.URLを開く(urls[0]); });
    await expected(async () => {
      expect.soft(urls[0] !== urls[1], "1回目と2回目のURLが異なる").toBe(true);
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe("アクセスできません");
      expect.soft(await f.エラーの文(), "ユーザー存在チェックエラー画面（E-2）の文言（設計書の表示メッセージ）").toBe("有効期限が切れているか、無効なURLです。");
    });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-062", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-062");
    let before = new Set<number>();
    const urls: string[] = [];
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { before = await mailIds(); await f.申し込む(メール); });
    await step(3, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(4, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(5, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(6, async () => { await f.URLを開く(urls[1]); });
    await expected(async () => {
      expect.soft(urls[0] !== urls[1], "1回目と2回目のURLが異なる").toBe(true);
      expect.soft(await f.再設定画面である, "パスワード再設定画面（パスワード入力欄）が表示される").toBe(true);
    });
  } finally { await 戻す(browser); }
});

// ---------------------------------------------------------------------------
// 以下: リセットキーを持つ会員を使うケース（依頼者の方針 2026-11-10。メールのURLはシードが控えたもの）
// ---------------------------------------------------------------------------
const E1の文 = "お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。";
const 空白なし = (t: string) => t.replace(/\s+/g, "");
const キー = (url: string) => /\/forgot\/reset\/([^/?#]*)/.exec(url)?.[1] ?? "";


// ---- 書式エラー（E-1） ----
caseTest("IT-F06-04-018", async ({ page, step, expected }) => {
  note(キー読み替え + "。リセットキー文字列だけを削除したURLは、控えたメールのURLの最後のリセットキーを空にしたもの");
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(キーを替えたURL(再発行URL("018"), "")); });
  await expected(async () => {
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "リセットキー書式エラー画面（E-1）の見出し").toBe("アクセスできません");
      expect.soft(空白なし(await f.エラーの文()), "リセットキー書式エラー画面（E-1）の文言（設計書の表示メッセージ）").toBe(空白なし(E1の文));
  });
});
caseTest("IT-F06-04-019", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(キーを替えたURL(再発行URL("019"), "Reset-Key")); });
  await expected(async () => {
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "リセットキー書式エラー画面（E-1）の見出し").toBe("アクセスできません");
      expect.soft(空白なし(await f.エラーの文()), "リセットキー書式エラー画面（E-1）の文言（設計書の表示メッセージ）").toBe(空白なし(E1の文));
  });
});
caseTest("IT-F06-04-047", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(キーを替えたURL(再発行URL("047"), "Reset-Key")); });
  await step(2, async () => { await f.押して遷移する(f.トップページへ); });
  await expected(async () => { expect.soft(f.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

// ---- ユーザー存在チェックエラー（E-2） ----
caseTest("IT-F06-04-020", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(`${BASE_URL}/ja/forgot/reset/${存在しないキー}`); });
  await expected(async () => {
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe("アクセスできません");
      expect.soft(await f.エラーの文(), "ユーザー存在チェックエラー画面（E-2）の文言（設計書の表示メッセージ）").toBe("有効期限が切れているか、無効なURLです。");
  });
});
function 期限切れ等のE2(n: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    note(キー読み替え);
    const f = new ForgotPage(page);
    await step(1, async () => { await f.URLを開く(再発行URL(n)); });
    await expected(async () => {
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe("アクセスできません");
      expect.soft(await f.エラーの文(), "ユーザー存在チェックエラー画面（E-2）の文言（設計書の表示メッセージ）").toBe("有効期限が切れているか、無効なURLです。");
  });
  };
}
caseTest("IT-F06-04-021", 期限切れ等のE2("021"));
caseTest("IT-F06-04-063", 期限切れ等のE2("063"));
caseTest("IT-F06-04-022", async ({ page, browser, step, expected }) => {
  try {
    note("仮会員にリセットキーを持たせる設定は画面でできないため、DBで実行の印つきのリセットキーを設定した（シードの注記を参照）");
    const f = new ForgotPage(page);
    await step(1, async () => { await f.URLを開く(`${BASE_URL}/ja/forgot/reset/${仮会員のキー}`); });
    await expected(async () => {
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe("アクセスできません");
      expect.soft(await f.エラーの文(), "ユーザー存在チェックエラー画面（E-2）の文言（設計書の表示メッセージ）").toBe("有効期限が切れているか、無効なURLです。");
  });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-048", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("048")); });
  await step(2, async () => { await f.押して遷移する(f.トップページへ); });
  await expected(async () => { expect.soft(f.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

// ---- 再設定画面の表示 ----
caseTest("IT-F06-04-023", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("023")); });
  await expected(async () => {
    expect.soft(f.path, "パスワード再設定画面のアドレス").toMatch(/^\/ja\/forgot\/reset\//);
    expect.soft(await f.再設定画面である, "パスワード再設定画面（パスワード入力欄）が表示される").toBe(true);
  });
});
caseTest("IT-F06-04-024", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("024")); });
  await step(2, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-04-025", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("025")); });
  await step(2, async () => { await f.押して遷移する(f.パンくずホーム); });
  await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-04-026", async ({ page, step, expected }) => {
  note(キー読み替え + "。保存パスワードがメールアドレスと同じ会員は、管理画面の会員編集でメールアドレスを替えて作った");
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("026")); await expect(f.新しいパスワード欄, "新しいパスワード欄").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await f.異なる文字列の注意の数(), "新しいパスワード欄の下に「メールアドレスとは異なるパスワードを設定してください。」の注意が表示される（件数）").toBe(1);
  });
});
caseTest("IT-F06-04-027", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.URLを開く(再発行URL("027")); await expect(f.新しいパスワード欄, "新しいパスワード欄").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await f.異なる文字列の注意の数(), "新しいパスワード欄の下に「メールアドレスとは異なるパスワードを設定してください。」の注意が表示されない（件数）").toBe(0);
  });
});

// ---- パスワードの再設定（DB確認つき） ----
type 保存値 = { 前: string | null; 後: string | null };
caseTest("IT-F06-04-030", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-030");
  const 新 = "Aa1!" + "x".repeat(28);
  const v: 保存値 = { 前: null, 後: null };
  await step(1, async () => { await f.URLを開く(再発行URL("030")); v.前 = パスワードの保存値(メール); });
  await step(2, async () => { await f.再設定を入力する(メール, 新); });
  await step(3, async () => { await f.変更するを押す(); });
  await step(4, async () => { v.後 = パスワードの保存値(メール); });
  await expected(async () => {
    expect.soft(v.前 !== null && v.前 !== "", "事前: 会員のパスワードの保存値がある").toBe(true);
    expect.soft(v.後 !== v.前 && !!v.後, "パスワードの保存値が更新されている").toBe(true);
    expect.soft(v.後 !== 新, "保存値は入力した平文ではない").toBe(true);
  });
});
caseTest("IT-F06-04-031", async ({ page, step, expected }) => {
  note(キー読み替え + "。開発者ツールの代わりに、ブラウザの操作でパスワード欄へ半角33文字を入れた（入力欄の文字数の上限は50文字のため、そのまま入る）");
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-031");
  const v: 保存値 = { 前: null, 後: null };
  await step(1, async () => { await f.URLを開く(再発行URL("031")); v.前 = パスワードの保存値(メール); });
  await step(2, async () => { await f.メール欄.fill(メール); });
  await step(3, async () => {
    const 新 = "Aa1!" + "x".repeat(29);
    await f.新しいパスワード欄.fill(新);
    await f.新しいパスワード確認欄.fill(新);
  });
  await step(4, async () => { await f.変更するを押す(); });
  await step(5, async () => { v.後 = パスワードの保存値(メール); });
  await expected(async () => {
    expect.soft(v.前 !== null && v.前 !== "", "事前: 会員のパスワードの保存値がある").toBe(true);
    expect.soft(v.後 !== v.前 && !!v.後, "パスワードの保存値が「BeforeReset!604」の保存値から更新されている").toBe(true);
  });
});
caseTest("IT-F06-04-033", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const A = mailOf("f0604-reset-a-033");
  const B = mailOf("f0604-b-033");
  const 前 = { A: null as string | null, B: null as string | null };
  const 後 = { A: null as string | null, B: null as string | null };
  await step(1, async () => { await f.URLを開く(再発行URL("033")); });
  await step(2, async () => { 前.A = パスワードの保存値(A); 前.B = パスワードの保存値(B); await f.再設定を入力する(B, "TargetKey!604"); });
  await step(3, async () => { await f.変更するを押す(); });
  await step(4, async () => { 後.A = パスワードの保存値(A); 後.B = パスワードの保存値(B); });
  await expected(async () => {
    expect.soft(前.A !== null && 前.B !== null, "事前: 両方の会員のパスワードの保存値がある").toBe(true);
    expect.soft(後.A !== 前.A, "URLのリセットキーを持つ会員Aのパスワードが更新されている").toBe(true);
    expect.soft(後.B, "入力したメールアドレスを持つ会員Bのパスワードは更新されない").toBe(前.B);
  });
});
caseTest("IT-F06-04-034", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-034");
  const v: 保存値 = { 前: null, 後: null };
  await step(1, async () => { await f.URLを開く(再発行URL("034")); v.前 = パスワードの保存値(メール); });
  await step(2, async () => { await f.再設定を入力する(メール, "Changed!604A"); });
  await step(3, async () => { await f.変更するを押す(); });
  await step(4, async () => { v.後 = パスワードの保存値(メール); });
  await expected(async () => {
    expect.soft(v.後 !== v.前 && !!v.後, "パスワード欄が更新されている").toBe(true);
    expect.soft(!!v.後 && v.後 !== "Changed!604A" && !v.後.includes("Changed!604A"), "平文「Changed!604A」とは異なる暗号化された値が保存される").toBe(true);
  });
});
caseTest("IT-F06-04-035", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-035");
  const v = { 前: undefined as string | null | undefined, 後: undefined as string | null | undefined };
  await step(1, async () => { await f.URLを開く(再発行URL("035")); v.前 = リセットキーの保存値(メール); });
  await step(2, async () => { await f.再設定を入力する(メール, "Changed!604A"); });
  await step(3, async () => { await f.変更するを押す(); });
  await step(4, async () => { v.後 = リセットキーの保存値(メール); });
  await expected(async () => {
    expect.soft(!!v.前, "事前: リセットキーが保存されている").toBe(true);
    expect.soft(v.後 !== undefined, "会員がDBに1件ある").toBe(true);
    expect.soft(v.後 ?? null, "リセットキーが削除されている").toBeNull();
  });
});
caseTest("IT-F06-04-037", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-037");
  await step(1, async () => { await f.URLを開く(再発行URL("037")); });
  await step(2, async () => { await f.再設定を入力する(メール, "Changed!604A"); });
  await step(3, async () => { await f.変更するを押す(); });
  await expected(async () => { expect.soft(f.再設定完了画面か, `パスワード再設定完了画面へ遷移する（実際 ${f.path}）`).toBe(true); });
});
caseTest("IT-F06-04-039", async ({ page, step, expected }) => {
  note(キー読み替え + "。開発者ツールのNetwork記録の代わりに、ブラウザが送るリクエスト（アドレスと送信内容）を記録した");
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-039");
  const url = 再発行URL("039");
  const posts: { url: string; body: string }[] = [];
  await step(1, async () => { await f.URLを開く(url); });
  await step(2, async () => {
    page.on("request", (r) => { if (r.method() === "POST" && /\/forgot\/reset\//.test(r.url())) posts.push({ url: r.url(), body: r.postData() ?? "" }); });
  });
  await step(3, async () => { await f.再設定を入力する(メール, "TokenCheck!604"); });
  await step(4, async () => { await f.変更するを押す(); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(posts.length >= 1, "パスワード再設定の送信が記録されている").toBe(true);
    expect.soft(posts[0]?.url.includes(`/forgot/reset/${キー(url)}`), "送信先にURLのリセットキーが含まれる").toBe(true);
    expect.soft(/(^|&)_token=[^&]+/.test(posts[0]?.body ?? ""), "送信内容になりすまし対策トークンが含まれる").toBe(true);
  });
});

// ---- 2つのブラウザで同じURL ----
async function 別のブラウザを開く(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { context, f: new ForgotPage(await context.newPage()) };
}
caseTest("IT-F06-04-042", async ({ page, browser, step, expected }) => {
  note(キー読み替え);
  const A = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-042");
  const B = await 別のブラウザを開く(browser);
  try {
    await step(1, async () => { await A.URLを開く(再発行URL("042")); await B.f.URLを開く(再発行URL("042")); });
    await step(2, async () => { await B.f.再設定する(メール, "FirstChange!604"); });
    await step(3, async () => { await A.再設定する(メール, "SecondChange!604"); });
    await expected(async () => { expect.soft(await A.共通エラー404か(), "ブラウザAに「404 Page Not Found」の共通エラー画面が表示される").toBe(true); });
  } finally { await B.context.close(); }
});
caseTest("IT-F06-04-043", async ({ page, browser, step, expected }) => {
  note(キー読み替え);
  const A = new ForgotPage(page);
  const メール = mailOf("f0604-reset-a-043");
  const B = await 別のブラウザを開く(browser);
  const v = { Bの後: null as string | null, Aの後: null as string | null };
  try {
    await step(1, async () => { await A.URLを開く(再発行URL("043")); await B.f.URLを開く(再発行URL("043")); });
    await step(2, async () => { await B.f.再設定する(メール, "FirstChange!604"); });
    await step(3, async () => { v.Bの後 = パスワードの保存値(メール); });
    await step(4, async () => { await A.再設定する(メール, "SecondChange!604"); });
    await step(5, async () => { v.Aの後 = パスワードの保存値(メール); });
    await expected(async () => {
      expect.soft(!!v.Bの後, "事前: ブラウザBの更新直後の保存値がある").toBe(true);
      expect.soft(v.Aの後, "ブラウザAの送信後も、パスワードがブラウザBの更新直後の保存値から変更されない").toBe(v.Bの後);
    });
  } finally { await B.context.close(); }
});

// ---- 再設定完了画面 ----
function 完了画面から(n: string, 動作: "現在地" | "ホーム" | "戻る") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    note(キー読み替え);
    const f = new ForgotPage(page);
    const 前半 = `f0604-reset-a-${n}`;
    await step(1, async () => { await f.URLを開く(再発行URL(n)); });
    await step(2, async () => { await f.再設定を入力する(mailOf(前半), "Changed!604A"); });
    await step(3, async () => { await f.変更するを押す(); expect(f.再設定完了画面か, "パスワード再設定完了画面が表示される").toBe(true); });
    if (動作 === "現在地") {
      await step(4, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
      await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
    } else if (動作 === "ホーム") {
      await step(4, async () => { await f.押して遷移する(f.パンくずホーム); });
      await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
    } else {
      await step(4, async () => { await f.押して遷移する(f.戻る); });
      await expected(async () => { expect.soft(f.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
    }
  };
}
caseTest("IT-F06-04-044", 完了画面から("044", "現在地"));
caseTest("IT-F06-04-045", 完了画面から("045", "ホーム"));
caseTest("IT-F06-04-046", 完了画面から("046", "戻る"));

// ---- 退会済み ----
caseTest("IT-F06-04-059", async ({ page, step, expected }) => {
  note("元のメールアドレスのまま退会済みの会員は画面で作れないため、DBで会員を退会済みに設定した（シードの注記を参照）");
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-w-059");
  const v = { キー: undefined as string | null | undefined };
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.申し込む(メール); });
  await step(3, async () => { v.キー = リセットキーの保存値(メール); });
  await expected(async () => {
    expect.soft(v.キー !== undefined, "退会済み会員がDBに1件ある").toBe(true);
    expect.soft(v.キー ?? null, "リセットキーが発行されていない").toBeNull();
  });
});

// ---- 期限が途中で切れる／書式が壊される ----
caseTest("IT-F06-04-064", async ({ page, step, expected }) => {
  note(キー読み替え + "。手順2はDBで有効期限を書き換える（実行の印つきの会員のみ）");
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-064");
  await step(1, async () => { await f.URLを開く(再発行URL("064")); });
  await step(2, async () => { 有効期限を設定する(メール, "2000-01-01 00:00:00"); });
  await step(3, async () => { await f.再設定する(メール, "Changed-F0604064"); });
  await expected(async () => { expect.soft(await f.共通エラー404か(), "「404 Page Not Found」の共通エラー画面が表示される").toBe(true); });
});
caseTest("IT-F06-04-065", async ({ page, step, expected }) => {
  note(キー読み替え);
  const f = new ForgotPage(page);
  const メール = mailOf("f0604-reset-065");
  const v: 保存値 = { 前: null, 後: null };
  await step(1, async () => { await f.URLを開く(再発行URL("065")); });
  await step(2, async () => { v.前 = パスワードの保存値(メール); });
  await step(3, async () => { 有効期限を設定する(メール, "2000-01-01 00:00:00"); });
  await step(4, async () => { await f.再設定する(メール, "Changed-F0604065"); });
  await step(5, async () => { v.後 = パスワードの保存値(メール); });
  await expected(async () => {
    expect.soft(!!v.前, "事前: 手順2で保存値を記録できた").toBe(true);
    expect.soft(v.後, "パスワードが手順2で記録した保存値から変更されない").toBe(v.前);
  });
});
caseTest("IT-F06-04-066", async ({ page, step, expected }) => {
  note(キー読み替え + "。開発者ツールの代わりに、画面のスクリプトでフォームの送信先のリセットキーを書き換えた");
  const f = new ForgotPage(page);
  const メール = mailOf("cbf0604-066");
  const v: 保存値 = { 前: null, 後: null };
  await step(1, async () => { await f.URLを開く(再発行URL("066")); v.前 = パスワードの保存値(メール); });
  await step(2, async () => { await f.再設定を入力する(メール, "Passw0rd-NEWCBF0604066"); });
  await step(3, async () => {
    const 送信先 = キーを替えたURL(page.url(), "Reset-Key");
    await page.locator("form#form1").evaluate((el, u) => { (el as HTMLFormElement).setAttribute("action", u); }, 送信先);
  });
  await step(4, async () => { await f.変更するを押す(); });
  await step(5, async () => { v.後 = パスワードの保存値(メール); });
  await expected(async () => {
    expect.soft(await f.エラーの見出し(), "「アクセスできません」の共通エラー画面が表示される").toBe("アクセスできません");
    expect.soft(!!v.前, "事前: パスワードの保存値がある").toBe(true);
    expect.soft(v.後, "パスワードが「Passw0rd-CBF0604066」の保存値から更新されない").toBe(v.前);
  });
});
