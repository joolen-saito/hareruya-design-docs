/**
 * F06-04 パスワード再発行の続き（-b）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケース。
 * 正本: cases/F06-04_test_cases.tsv。シードでの解釈は seeds/f06-04-b.ts と記録 review/F06-04_progress_2026-11-11_dev.md。
 * リセットキー・有効期限など画面で作れない状態は、E2E が画面で作った会員の行へだけ DB で書き足す（E2E_DB_WRITE=1 が要る）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { 会員の行に書く, 会員の状態とメール, 保存パスワード, リセットキー } from "../../db/f06_04_b";
import { mailIds, waitForMailTo } from "../../lib/mail";
import { hideDebugToolbar } from "../../lib/session";
import { ForgotPage } from "../../pages/front/f06_04_forgot";
import { ResetPage, 再設定のURL } from "../../pages/front/f06_04_reset";
import { 会員の, 形式不正のメール, 存在しないキー, 過去の期限 } from "../../seeds/f06-04-b";
import "../../seeds/f06-04"; // 受信メールの確かめ（S-F06-04-MAILBOX）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const キーの補い = "リセットキー・有効期限は画面で指定できないので、画面で登録した会員の行へ DB で書き足した。キーは正本の値の末尾に実行の印（英数字）を付けた値";
const ECTOP = /^\/(ja\/?)?$/;

/** 設計書の表示メッセージの共通エラー画面（見出し／本文）。空白・改行を除いて比べる */
const 画面の文 = {
  "E-1": { 見出し: "アクセスできません", 本文: "お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。" },
  "E-2": { 見出し: "アクセスできません", 本文: "有効期限が切れているか、無効なURLです。" },
  "404": { 見出し: "404 Page Not Found", 本文: "お探しのページが見つかりません。" },
} as const;
const 詰める = (t: string): string => t.replace(/[\s。]/g, "");

type 照合 = [string, unknown, unknown][];
/** 再設定のエラー画面を読み、確かめる項目（何・実際・期待）を返す（確かめは呼ぶ側の期待結果・手順の中で行う） */
async function エラー画面の照合(r: ForgotPage, 種類: keyof typeof 画面の文, 何: string): Promise<照合> {
  const 見出し = await r.エラーの見出し();
  const 本文 = ((await r.エラー画面.locator("p").allInnerTexts().catch(() => [])) ?? []).join("");
  note(`表示された画面: ${r.path}・見出し「${見出し}」・本文「${本文.replace(/\s+/g, " ").trim()}」`);
  return [
    [`${何}（共通エラー画面の枠）`, await r.エラー画面.count(), 1],
    [`${何}の見出し（設計書の表示メッセージ）`, 詰める(見出し), 詰める(画面の文[種類].見出し)],
    [`${何}の本文（設計書の表示メッセージ）`, 詰める(本文), 詰める(画面の文[種類].本文)],
  ];
}
/** 「404 Page Not Found」の共通エラー画面（アプリの共通のエラー画面。枠の作りが再設定のエラー画面と違うので本文の文で見る） */
async function 見つからない画面の照合(r: ResetPage): Promise<照合> {
  const t = ((await r.page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").slice(0, 2000);
  note(`表示された画面: ${r.path}・画面の文の先頭「${t.slice(0, 160)}」`);
  return [
    ["「404 Page Not Found」の共通エラー画面（見出し）", t.includes(画面の文["404"].見出し), true],
    ["「404 Page Not Found」の共通エラー画面（本文）", t.includes(画面の文["404"].本文), true],
  ];
}

function 再設定画面(ctx: CaseCtx): ResetPage { return new ResetPage(ctx.page); }

// ---- URLのリセットキーの確かめ ----

caseTest("IT-F06-04-018", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const m = 会員の("S-F06-04-RESET-A-018");
  supplement(キーの補い);
  await step(1, async () => { const url = 再設定のURL(m.リセットキー!).replace(m.リセットキー!, ""); note(`開いたURL: ${url}`); await r.URLを開く(url); });
  await expected(async () => { for (const [l, a, b] of await エラー画面の照合(r, "E-1", "E-1.リセットキー書式エラー画面")) expect.soft(a, l).toBe(b); });
});
caseTest("IT-F06-04-019", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く("Reset-Key"); });
  await expected(async () => { for (const [l, a, b] of await エラー画面の照合(r, "E-1", "E-1.リセットキー書式エラー画面")) expect.soft(a, l).toBe(b); });
});
caseTest("IT-F06-04-020", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  await step(1, async () => { await r.キーで開く(存在しないキー); });
  await expected(async () => { for (const [l, a, b] of await エラー画面の照合(r, "E-2", "E-2.ユーザー存在チェックエラー画面")) expect.soft(a, l).toBe(b); });
});
/** キーを開くと E-2.ユーザー存在チェックエラー画面になるケース（期限切れ・仮会員・退会済み） */
function E2の画面(id: "021" | "022" | "063", seedId: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const r = 再設定画面(ctx);
    supplement(キーの補い + (id === "022" ? "。仮会員の状態も DB で書いた（共有の設定の仮会員機能は書き換えない）" : id === "063" ? "。退会済み（削除の印・会員の状態は空。メールアドレスは保つ）も DB で書いた" : ""));
    await step(1, async () => { await r.キーで開く(会員の(seedId).リセットキー!); });
    await expected(async () => { for (const [l, a, b] of await エラー画面の照合(r, "E-2", "E-2.ユーザー存在チェックエラー画面")) expect.soft(a, l).toBe(b); });
  };
}
caseTest("IT-F06-04-021", E2の画面("021", "S-F06-04-RESET-EXPIRED-021"));
caseTest("IT-F06-04-022", E2の画面("022", "S-F06-04-RESET-PROVISIONAL-022"));
caseTest("IT-F06-04-063", E2の画面("063", "S-F06-04-RESET-WITHDRAWN-063"));
caseTest("IT-F06-04-023", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-A-023").リセットキー!); });
  await expected(async () => {
    expect.soft(r.path, "パスワード再設定画面のアドレス").toMatch(/^\/ja\/forgot\/reset\//);
    expect.soft(await r.再設定画面である, "パスワード再設定画面（新しいパスワード欄）が表示される").toBe(true);
  });
});
caseTest("IT-F06-04-024", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-A-024").リセットキー!); });
  await step(2, async () => { await expect(r.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await r.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-04-025", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-A-025").リセットキー!); });
  await step(2, async () => { await r.押して遷移する(r.パンくずホーム); });
  await expected(async () => { expect.soft(r.path, "遷移した画面（本店ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-04-026", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い + "。登録画面はパスワードとメールアドレスが同じだと止めるので、メールアドレスの形のパスワードで登録し、メールアドレスをその文字列へ DB で書き換えた");
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-EQUAL-026").リセットキー!); });
  await expected(async () => {
    expect.soft(await r.再設定画面である, "パスワード再設定画面が表示される").toBe(true);
    const n = await r.同じ値の注意.count();
    if (n) note(`表示された注意: ${(await r.同じ値の注意.first().innerText()).trim()}`);
    expect.soft(n, "新しいパスワード欄の下に、異なる文字列の使用を促す注意が表示される").toBe(1);
  });
});
caseTest("IT-F06-04-027", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-A-027").リセットキー!); });
  await expected(async () => {
    expect.soft(await r.再設定画面である, "パスワード再設定画面が表示される").toBe(true);
    expect.soft(await r.同じ値の注意.count(), "異なる文字列の使用を促す注意が表示されない").toBe(0);
  });
});

// ---- 再設定の登録 ----

/** 再設定画面を開いて、メールアドレスと新しいパスワードを入れて「変更する」を押す（DB の保存パスワードを前後で控える） */
function 変更して保存値を見る(番号: string, 新しいパスワード: string, 直接入れる = false) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const r = 再設定画面(ctx);
    const m = 会員の(`S-F06-04-RESET-A-${番号}`);
    supplement(キーの補い);
    const 前 = 保存パスワード(m.会員ID);
    let 後: string | null = null;
    const 読む = () => { 後 = 保存パスワード(m.会員ID); note("更新後の保存値を DB で読んだ（記録には書かない）"); };
    await step(1, async () => { await r.キーで開く(m.リセットキー!); });
    if (直接入れる) {
      await step(2, async () => { await expect(r.メールアドレス欄, "メールアドレス欄").toBeVisible({ timeout: 30_000 }); await r.メールアドレス欄.fill(m.メール); });
      await step(3, async () => { note(`新しいパスワードの文字数: ${新しいパスワード.length}（入力欄の値として直接入れた）`); await r.パスワードを直接入れる(新しいパスワード); });
      await step(4, async () => { await r.変更するを押す(); note(`押したあとの画面: ${r.path}`); });
      await step(5, async () => { 読む(); });
    } else {
      await step(2, async () => { note(`新しいパスワードの文字数: ${新しいパスワード.length}`); await r.入れる(m.メール, 新しいパスワード); });
      await step(3, async () => { await r.変更するを押す(); note(`押したあとの画面: ${r.path}`); });
      await step(4, async () => { 読む(); });
    }
    await expected(async () => {
      expect.soft(前 !== null && 後 !== null, "会員の保存パスワードを読めた").toBe(true);
      expect.soft(後 !== 前, "パスワードの保存値が開始時の値（BeforeReset!604 の保存値）から更新される").toBe(true);
      if (番号 === "034") expect.soft(後 === 新しいパスワード, "保存値が平文「Changed!604A」と同じ").toBe(false);
    });
  };
}
caseTest("IT-F06-04-030", 変更して保存値を見る("030", "Aa1!xxxxxxxxxxxxxxxxxxxxxxxxxxxx"));
caseTest("IT-F06-04-031", 変更して保存値を見る("031", "Aa1!xxxxxxxxxxxxxxxxxxxxxxxxxxxxx", true));
caseTest("IT-F06-04-034", 変更して保存値を見る("034", "Changed!604A"));

caseTest("IT-F06-04-033", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const A = 会員の("S-F06-04-RESET-A-033"), B = 会員の("S-F06-04-REG-B-033");
  supplement(キーの補い);
  const A前 = 保存パスワード(A.会員ID), B前 = 保存パスワード(B.会員ID);
  await step(1, async () => { await r.キーで開く(A.リセットキー!); });
  await step(2, async () => { await r.入れる(B.メール, "TargetKey!604"); });
  await step(3, async () => {
    await r.変更するを押す();
    const err = (await r.page.locator(".c-hareruya-form-input__field-error, [role=alert]").allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean);
    note(`押したあとの画面: ${r.path}${err.length ? `・表示された文: ${err.join(" / ")}` : ""}`);
  });
  let A後: string | null = null, B後: string | null = null;
  await step(4, async () => { A後 = 保存パスワード(A.会員ID); B後 = 保存パスワード(B.会員ID); note("A-033・B-033 の保存値を DB で読んだ（記録には書かない）"); });
  await expected(async () => {
    expect.soft(A後 !== A前, "URLのリセットキーを持つ再設定本会員A-033のパスワードが更新される").toBe(true);
    expect.soft(B後, "入力したメールアドレスを持つ本会員B-033のパスワードは更新されない").toBe(B前);
  });
});
caseTest("IT-F06-04-035", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const m = 会員の("S-F06-04-RESET-A-035");
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(m.リセットキー!); });
  await step(2, async () => { await r.入れる(m.メール, "Changed!604A"); });
  await step(3, async () => { await r.変更するを押す(); note(`押したあとの画面: ${r.path}`); });
  let キー: string | null | undefined;
  await step(4, async () => { キー = リセットキー(m.会員ID); note(`変更後のリセットキー: ${キー === null ? "未設定" : "設定あり"}`); });
  await expected(async () => { expect.soft(キー, "リセットキーが削除される（未設定）").toBeNull(); });
});

/** 再設定画面で変更して、完了画面まで進む */
async function 完了画面まで(r: ResetPage, 番号: string, step: CaseCtx["step"]): Promise<void> {
  const m = 会員の(`S-F06-04-RESET-A-${番号}`);
  await step(1, async () => { await r.キーで開く(m.リセットキー!); });
  await step(2, async () => { await r.入れる(m.メール, "Changed!604A"); });
  await step(3, async () => { await r.変更するを押す(); expect(r.完了画面である, `パスワード再設定完了画面へ移った（実際 ${r.path}）`).toBe(true); });
}
caseTest("IT-F06-04-037", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const m = 会員の("S-F06-04-RESET-A-037");
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(m.リセットキー!); });
  await step(2, async () => { await r.入れる(m.メール, "Changed!604A"); });
  await step(3, async () => { await r.変更するを押す(); });
  await expected(async () => {
    expect.soft(r.完了画面である, `パスワード再設定完了画面が表示される（実際 ${r.path}）`).toBe(true);
    expect.soft(await r.page.locator(".p-hareruya-entry-complete__message-text").innerText().catch(() => ""), "完了画面の本文（設計書の表示メッセージ）").toContain("パスワードを変更しました");
  });
});
caseTest("IT-F06-04-044", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await 完了画面まで(r, "044", step);
  await step(4, async () => { await expect(r.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await r.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-04-045", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await 完了画面まで(r, "045", step);
  await step(4, async () => { await r.押して遷移する(r.パンくずホーム); });
  await expected(async () => { expect.soft(r.path, "遷移した画面（本店ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-04-046", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await 完了画面まで(r, "046", step);
  await step(4, async () => { await r.押して遷移する(r.完了画面の戻る); });
  await expected(async () => { expect.soft(r.path, "遷移した画面（ECTOP）").toMatch(ECTOP); });
});

caseTest("IT-F06-04-039", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const m = 会員の("S-F06-04-RESET-A-039");
  supplement(キーの補い + "。開発者ツールの Network の代わりに、ブラウザが送った要求を Playwright で読んだ");
  let url = "", body = "";
  await step(1, async () => { await r.キーで開く(m.リセットキー!); });
  await step(2, async () => { note("送る要求の記録を始めた（「変更する」を押したときの要求を読む）"); });
  await step(3, async () => { await r.入れる(m.メール, "TokenCheck!604"); });
  await step(4, async () => { const req = await r.変更するを押す(); url = req.url(); body = req.postData() ?? ""; });
  await step(5, async () => {
    const 項目の数 = [...new URLSearchParams(body).keys()].length;
    note(`送信先のURL: ${url.replace(m.リセットキー!, "〔リセットキー〕")}・送った項目の数: ${項目の数}`);
  });
  await expected(async () => {
    expect.soft(new URL(url).pathname.endsWith(`/forgot/reset/${m.リセットキー}`), "送信に URL のリセットキーが含まれる").toBe(true);
    const token = new URLSearchParams(body).get("_token") ?? "";
    expect.soft(token.length > 0, "送信になりすまし対策トークンが含まれる").toBe(true);
  });
});

/** ブラウザA・Bで同じ再設定画面を開き、Bで変更したあと、Aで変更する */
function 二つのブラウザ(番号: "042" | "043") {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, browser, step, expected } = ctx;
    const m = 会員の(`S-F06-04-RESET-A-${番号}`);
    supplement(キーの補い + "。ブラウザBは同じブラウザの別のセッション（Cookie を共有しない新しいコンテキスト）");
    const A = new ResetPage(page);
    const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    let B後 = "";
    try {
      await hideDebugToolbar(ctxB);
      const B = new ResetPage(await ctxB.newPage());
      await step(1, async () => { await A.キーで開く(m.リセットキー!); await B.キーで開く(m.リセットキー!); expect(await A.再設定画面である && await B.再設定画面である, "ブラウザA・Bともパスワード再設定画面").toBe(true); });
      await step(2, async () => { await B.入れる(m.メール, "FirstChange!604"); await B.変更するを押す(); note(`ブラウザBの押したあとの画面: ${B.path}`); });
      if (番号 === "042") {
        await step(3, async () => { await A.入れる(m.メール, "SecondChange!604"); await A.変更するを押す(); });
        await expected(async () => { for (const [l, a, b] of await 見つからない画面の照合(A)) expect.soft(a, l).toBe(b); });
      } else {
        await step(3, async () => { B後 = 保存パスワード(m.会員ID) ?? ""; note("ブラウザBの更新直後の保存値を控えた（記録には書かない）"); });
        await step(4, async () => { await A.入れる(m.メール, "SecondChange!604"); await A.変更するを押す(); note(`ブラウザAの押したあとの画面: ${A.path}`); });
        let A後 = "";
        await step(5, async () => { A後 = 保存パスワード(m.会員ID) ?? ""; note("ブラウザAの送信後の保存値を DB で読んだ（記録には書かない）"); });
        await expected(async () => { expect.soft(A後, "ブラウザAの送信後も、ブラウザBの更新直後の保存値から変わらない").toBe(B後); });
      }
    } finally { await ctxB.close(); }
  };
}
caseTest("IT-F06-04-042", 二つのブラウザ("042"));
caseTest("IT-F06-04-043", 二つのブラウザ("043"));

// ---- エラー画面のボタン ----
caseTest("IT-F06-04-047", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く("Reset-Key"); for (const [l, a, b] of await エラー画面の照合(r, "E-1", "E-1.リセットキー書式エラー画面")) expect.soft(a, l).toBe(b); });
  await step(2, async () => { await r.押して遷移する(r.エラー画面のトップページへ); });
  await expected(async () => { expect.soft(r.path, "遷移した画面（ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-04-048", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  supplement(キーの補い);
  await step(1, async () => { await r.キーで開く(会員の("S-F06-04-RESET-EXPIRED-048").リセットキー!); for (const [l, a, b] of await エラー画面の照合(r, "E-2", "E-2.ユーザー存在チェックエラー画面")) expect.soft(a, l).toBe(b); });
  await step(2, async () => { await r.押して遷移する(r.エラー画面のトップページへ); });
  await expected(async () => { expect.soft(r.path, "遷移した画面（ECTOP）").toMatch(ECTOP); });
});

// ---- 画面を開いたあとに有効期限が切れる ----
function 開いたあと期限切れ(番号: "064" | "065") {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const r = 再設定画面(ctx);
    const m = 会員の(`S-F06-04-RESET-A-${番号}`);
    supplement(キーの補い + "。手順の「DBで有効期限を更新する」は、E2E の会員の行へだけ書く窓口で行った");
    const 期限を過去にする = () => 会員の行に書く(`IT-F06-04-${番号}`, m.会員ID, { 有効期限: 過去の期限 });
    const 新 = `Changed-F0604${番号}`;
    await step(1, async () => { await r.キーで開く(m.リセットキー!); expect(await r.再設定画面である, "パスワード再設定画面").toBe(true); });
    if (番号 === "064") {
      await step(2, async () => { 期限を過去にする(); note(`有効期限を ${過去の期限} にした`); });
      await step(3, async () => { await r.入れる(m.メール, 新); await r.変更するを押す(); });
      await expected(async () => { for (const [l, a, b] of await 見つからない画面の照合(r)) expect.soft(a, l).toBe(b); });
    } else {
      let 前 = "";
      await step(2, async () => { 前 = 保存パスワード(m.会員ID) ?? ""; note("開始時の保存値を控えた（記録には書かない）"); });
      await step(3, async () => { 期限を過去にする(); note(`有効期限を ${過去の期限} にした`); });
      await step(4, async () => { await r.入れる(m.メール, 新); await r.変更するを押す(); note(`押したあとの画面: ${r.path}`); });
      let 後 = "";
      await step(5, async () => { 後 = 保存パスワード(m.会員ID) ?? ""; note("送信後の保存値を DB で読んだ（記録には書かない）"); });
      await expected(async () => { expect.soft(後, "パスワードが手順2で控えた保存値から変わらない").toBe(前); });
    }
  };
}
caseTest("IT-F06-04-064", 開いたあと期限切れ("064"));
caseTest("IT-F06-04-065", 開いたあと期限切れ("065"));

caseTest("IT-F06-04-066", async (ctx) => {
  const { step, expected } = ctx;
  const r = 再設定画面(ctx);
  const m = 会員の("S-F06-04-CBRESET-066");
  supplement(キーの補い + "。開発者ツールの代わりに、フォームの送信先をスクリプトで書き換えた");
  const 前 = 保存パスワード(m.会員ID);
  await step(1, async () => { await r.キーで開く(m.リセットキー!); });
  await step(2, async () => { await r.入れる(m.メール, "Passw0rd-NEWCBF0604066"); });
  await step(3, async () => { const a = await r.送信先のキーを変える("Reset-Key"); note(`書き換えた送信先: ${new URL(a).pathname}`); });
  await step(4, async () => { await r.変更するを押す(); for (const [l, a, b] of await エラー画面の照合(r, "E-1", "手順4の「アクセスできません」の共通エラー画面")) expect.soft(a, l).toBe(b); });
  let 後: string | null = null;
  await step(5, async () => { 後 = 保存パスワード(m.会員ID); note("送信後の保存値を DB で読んだ（記録には書かない）"); });
  await expected(async () => {
    expect.soft(後, "パスワードが「Passw0rd-CBF0604066」の保存値から更新されない").toBe(前);
  });
});

// ---- 再発行の申し込み（形式不正・退会済み） ----
caseTest("IT-F06-04-056", async (ctx) => {
  const { page, step, expected } = ctx;
  const f = new ForgotPage(page);
  const 宛先 = 形式不正のメール();
  supplement("@ の無いメールアドレスの会員は、正しい形で登録してメールアドレスを DB で書き換えた。メールの受け口は開発環境の全員が使うため「宛先を問わず0件」は確かめられず、入れた宛先あてのメールが届かないことを60秒待って確かめた");
  let before = new Set<number>();
  await step(1, async () => { await f.再発行画面を開く(); before = await mailIds(); });
  await step(2, async () => { await page.locator("form#form1").evaluate((e) => e.setAttribute("novalidate", "novalidate")); });
  await step(3, async () => { await f.申し込む(宛先); note(`押したあとの画面: ${f.path}`); });
  let 届いた = "";
  await step(4, async () => { 届いた = await waitForMailTo(宛先, before, 60_000).then((m) => m.subject).catch(() => ""); });
  await expected(async () => { expect.soft(届いた, `宛先 ${宛先} あてのメールが届かない`).toBe(""); });
});
caseTest("IT-F06-04-059", async (ctx) => {
  const { page, step, expected } = ctx;
  const f = new ForgotPage(page);
  const m = 会員の("S-F06-04-WITHDRAWN-059");
  supplement("退会済み（削除の印・会員の状態は空。メールアドレスは保つ）は画面で作れないので、画面で登録した会員の行へ DB で書いた");
  const s = 会員の状態とメール(m.会員ID);
  note(`開始時の会員: 状態「${s?.状態 ?? ""}」・削除の印 ${s?.削除 ? "あり" : "なし"}`);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.申し込む(m.メール); note(`押したあとの画面: ${f.path}`); });
  let キー: string | null | undefined;
  await step(3, async () => { キー = リセットキー(m.会員ID); note(`申し込んだあとのリセットキー: ${キー === null ? "未設定" : "設定あり"}`); });
  await expected(async () => { expect.soft(キー, "退会済み会員にリセットキーが発行されない").toBeNull(); });
});
caseTest("IT-F06-04-060", async (ctx) => {
  const { page, step, expected } = ctx;
  const f = new ForgotPage(page);
  const m = 会員の("S-F06-04-WITHDRAWN-060");
  supplement("退会済み（削除の印・会員の状態は空。メールアドレスは保つ）は DB で書いた。宛先あての受信メールは、申し込む前の番号を控えて、それより後に届いたものだけを数えた（60秒待つ）");
  let before = new Set<number>();
  await step(1, async () => { await f.再発行画面を開く(); before = await mailIds(); });
  await step(2, async () => { await f.申し込む(m.メール); note(`押したあとの画面: ${f.path}`); });
  let 届いた = "";
  await step(3, async () => { 届いた = await waitForMailTo(m.メール, before, 60_000).then((x) => x.subject).catch(() => ""); });
  await expected(async () => { expect.soft(届いた, `宛先 ${m.メール} あてのパスワード再発行メールが送信されない`).toBe(""); });
});
