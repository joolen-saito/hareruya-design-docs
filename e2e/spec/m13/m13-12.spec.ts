/**
 * M13-12 イベント新規申込登録。正本: cases/M13-12_test_cases.tsv
 * 実装しないケース: 011（既存データから検索語を取り除く準備が DB への直接の設定）、021（固定の日程IDの登録・削除が DB シード）。
 * 店舗ID 1301・1302 は、店舗登録画面の店名「店舗A」「店舗B」の店舗で代える（seeds/m13-12.ts の冒頭）。
 * 「ID 〔プレイヤーID〕を検索する」: プレイヤー検索の検索欄はプレイヤー名（会員の姓・名・カナ、プレイヤーの和名・英名）だけを照合し、
 * IDでは探せない（設計書 L0131）。そのプレイヤーの会員のお名前で検索し、ID欄がその番号の行を使う（手順の注記に残す）。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 日程の申込の内容, 日程の申込プレイヤーのプレイヤーID, 日程の申込履歴の件数, プレイヤーの日程への申込件数, 日程の申込の件数_削除済みを含む } from "../../db/m13_12";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { Account, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { EventForm } from "../../pages/admin/event";
import { EventListPage } from "../../pages/admin/m13_01_event_list";
import { EntrySearchPage } from "../../pages/admin/m13_11_entry_search";
import { EntryNewPage, 金額 } from "../../pages/admin/m13_12_entry_new";
import { tamperToken } from "../../pages/admin/devtools";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history_k";
import { QK1302_ADMIN } from "../../seeds/m13-02-qk";
import {
  M1312_ADMIN, M1312_RI_ADMIN, QKイベント名, QK会員, RIイベント名, RI会員の姓, ページ対象の検索語, 会員の姓, 会員の氏名, 権限制御の検索語,
} from "../../seeds/m13-12";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 整える = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
const IDで検索の注記 = (n: string) => note(`プレイヤー検索はIDでは探せない（検索欄はプレイヤー名だけを照合する。設計書 L0131）。会員のお名前「${会員の姓(n)}」で検索し、ID欄が控えたプレイヤーIDの行を使った`);

/** 新しいブラウザセッションで管理者としてログインし、日程のイベント新規申込登録画面を開いた画面の部品を返す */
async function 開いておく(page: Page, 日程ID: string, account: Account = M1312_ADMIN): Promise<EntryNewPage> {
  await loginAdmin(page, account);
  const f = new EntryNewPage(page);
  await f.開く(日程ID);
  await f.読み込みを待つ();
  return f;
}

/** 「ID 〔プレイヤーID〕を検索する」: お名前で検索し、ID欄がその番号の行があるページを出す */
async function IDのプレイヤーを検索する(f: EntryNewPage, n: string, プレイヤーID: string): Promise<void> {
  IDで検索の注記(n);
  await f.プレイヤーを検索する(会員の氏名(n));
  await f.IDの行のページへ(プレイヤーID);
}

// ---- 001 権限による新規登録操作の出し分け ----

caseTest("IT-M13-12-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1312_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    note("「会場を指定せず」は、店舗を何も選ばない状態（指定なし）とした。開催日(From)の初期値（実行日）より前の日程（2026-10-10・11）が出るように、開催日の From・To も空にした");
    await s.条件を入れて検索する([], 権限制御の検索語(), "", "");
  });
  let ds: string[] = []; let es: string[] = [];
  await step(3, async () => { ds = await s.新規登録ボタンの日程ID(); es = await s.表示されたイベントID(); });
  await expected(async () => {
    expect.soft(ds, "権限を保持する店舗Aのイベントの日程に新規登録操作が表示される").toContain(notes.get("〔イベント日程ID-M1312-001A〕"));
    expect.soft(es, "店舗Bのイベントが一覧に出ている（新規登録操作の有無を見る前提）").toContain(notes.get("〔イベントID-M1312-001B〕"));
    expect.soft(ds, "権限を保持しない店舗Bのイベントの日程には新規登録操作が表示されない").not.toContain(notes.get("〔イベント日程ID-M1312-001B〕"));
  });
});

// ---- 002〜008・020・032・033 画面の表示と操作 ----

caseTest("IT-M13-12-002", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-002〕")); });
  let 名 = ""; let 金 = "";
  await step(2, async () => { 名 = await f.欄の表示("イベント名"); 金 = await f.支払金額.inputValue(); });
  await expected(async () => {
    note(`画面のイベント名の表示: 「${名}」。支払金額の欄の値: 「${金}」（桁区切りを除いて金額として比べた）`);
    expect.soft(名, "イベント名が「イベント名(日)（イベント名(英)） 開催日時」の書式で表示される").toBe("M13-12統合イベント（M13-12 Integration Event） 2026-10-10 13:00");
    expect.soft(金額(金), "支払金額に参加費2500が初期表示される").toBe("2500");
  });
});

caseTest("IT-M13-12-003", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-003〕")); });
  let 状況 = ""; let 方法 = "";
  await step(2, async () => { 状況 = await f.選ばれている(f.申込状況); 方法 = await f.選ばれている(f.支払方法); });
  await step(3, async () => {
    for (const [名, sel] of [["申込状況", f.申込状況], ["支払方法", f.支払方法]] as const) {
      const ほか = (await f.選択肢(sel)).find((o) => o !== (名 === "申込状況" ? 状況 : 方法));
      if (!(await sel.isEnabled())) { note(`${名}の欄は操作できない状態（無効）で、選択の操作を受け付けなかった（選択肢: ${(await f.選択肢(sel)).join("、")}）`); continue; }
      if (!ほか) { note(`${名}の欄は操作できるが、ほかの選択肢が無い（選択肢: ${(await f.選択肢(sel)).join("、")}）`); continue; }
      await sel.selectOption({ label: ほか });
      note(`${名}の欄で「${ほか}」を選んだ`);
    }
  });
  await expected(async () => {
    expect.soft(状況, "申込状況の初期表示").toBe("申込済み");
    expect.soft(方法, "支払方法の初期表示").toBe("管理者追加");
    expect.soft(await f.選ばれている(f.申込状況), "選択操作のあとも申込状況は申込済みのまま").toBe("申込済み");
    expect.soft(await f.選ばれている(f.支払方法), "選択操作のあとも支払方法は管理者追加のまま").toBe("管理者追加");
    expect.soft(f.申込状況, "申込状況の欄は変更できない（操作不可）").toBeDisabled();
    expect.soft(f.支払方法, "支払方法の欄は変更できない（操作不可）").toBeDisabled();
  });
});

caseTest("IT-M13-12-004", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-004〕")); });
  await step(2, async () => {
    try {
      await f.支払金額.click({ timeout: 5000 });
      await f.支払金額.fill("3000", { timeout: 5000 });
      note("支払金額の欄に 3000 を入力する操作を行えた");
    } catch (e) {
      note(`支払金額の欄は入力を受け付けなかった（${String(e).split("\n")[0].slice(0, 120)}）`);
    }
  });
  await expected(async () => {
    expect.soft(金額(await f.支払金額.inputValue()), "支払金額は2500のまま（変更できない）").toBe("2500");
    expect.soft(await f.支払金額.evaluate((e) => (e as HTMLInputElement).disabled || (e as HTMLInputElement).readOnly), "支払金額の欄は参照専用（入力できない）").toBe(true);
  });
});

caseTest("IT-M13-12-005", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-005〕")); });
  let 画面 = ""; let 見出し: string[] = [];
  await step(2, async () => {
    画面 = await f.本文(); 見出し = [...(await f.欄のラベル一覧()), ...(await f.プレイヤー表の見出し())];
    await f.ポップアップを開く();
  });
  await expected(async () => {
    note("プレイヤー検索ポップアップ画面は、手順どおり開いただけ（検索はしていない）の状態で見た");
    const ポップアップ = 整える(await f.ポップアップ.innerText());
    for (const w of ["席順", "DCIナンバー", "チームメンバー確認済"]) {
      expect.soft(見出し.filter((h) => h.includes(w)), `イベント新規申込登録画面の項目の見出しに「${w}」が無い`).toEqual([]);
      expect.soft(画面.includes(w), `イベント新規申込登録画面に「${w}」が表示されない`).toBe(false);
    }
    expect.soft(ポップアップ.includes("DCI"), "プレイヤー検索ポップアップ画面にDCIナンバーが表示されない").toBe(false);
  });
});

caseTest("IT-M13-12-006", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-006〕")); });
  await step(2, async () => { await f.プレイヤー名.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft(f.検索ボタン, "プレイヤー未登録の行に検索ボタンが表示される").toBeVisible();
    expect.soft(f.削除ボタン, "削除ボタンは表示されない").toBeHidden();
    expect.soft(f.登録ボタン, "権限を保持する店舗Aのイベントに登録ボタンが表示される").toBeVisible();
  });
});

caseTest("IT-M13-12-007", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-007〕")); });
  await step(2, async () => { await f.検索ボタン.click(); });
  await expected(async () => {
    await expect(f.ポップアップ, "プレイヤー検索ポップアップ画面が表示される").toBeVisible();
    await expect.soft(f.ポップアップ.locator(".modal-title"), "ポップアップの見出し").toHaveText("プレイヤー検索");
  });
});

caseTest("IT-M13-12-008", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage; const d = notes.get("〔イベント日程ID-M1312-008〕");
  await step(1, async () => { f = await 開いておく(page, d); });
  await step(2, async () => { await f.ポップアップを開く(); });
  await step(3, async () => { await f.ポップアップの閉じるボタン.click(); });
  await expected(async () => {
    await expect.soft(f.ポップアップ, "プレイヤー検索ポップアップ画面が閉じる").toBeHidden();
    expect.soft(await f.新規申込登録画面である(d), "イベント新規申込登録画面が表示されている").toBe(true);
    await expect.soft(f.フォーム, "イベント新規申込登録画面の入力フォーム").toBeVisible();
  });
});

// ---- 012〜017 プレイヤー検索ポップアップ ----

caseTest("IT-M13-12-012", async ({ page, notes, step, expected }) => {
  const f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-012〕"));
  await step(1, async () => { await f.ポップアップを開く(); });
  await step(2, async () => { await f.プレイヤーを検索する(ページ対象の検索語()); });
  let 前 = 0;
  await step(3, async () => { 前 = await f.表示中のページ(); await f.ページを選ぶ(2); });
  await expected(async () => {
    expect.soft(前, "ページングを選ぶ前は1ページ目").toBe(1);
    expect.soft(await f.表示中のページ(), "プレイヤー検索結果の2ページ目へ遷移する").toBe(2);
    expect.soft((await f.結果の行の中身()).map((r) => r.ID), "2ページ目に11件目（ページ対象選手11）が出る").toContain(notes.get("〔プレイヤーID-M1312-012K〕"));
    expect.soft((await f.結果の行の中身()).map((r) => r.ID), "2ページ目に1件目（ページ対象選手01）は出ない").not.toContain(notes.get("〔プレイヤーID-M1312-012A〕"));
  });
});

caseTest("IT-M13-12-013", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage; const p = notes.get("〔プレイヤーID-M1312-013〕");
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-013〕")); await f.ポップアップを開く(); });
  await step(2, async () => { await f.プレイヤーを検索する(会員の姓("013")); });
  await step(3, async () => { await f.IDの行のページへ(p); await f.結果の行のID(p).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    const 行 = f.結果の行のID(p);
    await expect(行, `ID ${p} の行が表示される`).toHaveCount(1);
    await expect.soft(f.決定ボタン(行), "申込済みのプレイヤーの行に押せる決定ボタンが無い").toHaveCount(0);
    await expect.soft(f.操作欄のボタン(行), "決定欄のボタンは押せない状態").toBeDisabled();
    note(`ID ${p} の行の決定欄の表示: 「${整える(await f.操作欄のボタン(行).innerText().catch(() => ""))}」`);
  });
});

caseTest("IT-M13-12-014", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔プレイヤーID-M1312-014〕");
  const f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-014〕"));
  await f.ポップアップを開く();
  await step(1, async () => { await IDのプレイヤーを検索する(f, "014", p); });
  await step(2, async () => { await f.決定する(p); });
  await step(3, async () => {
    if (!(await f.検索ボタン.isVisible())) {
      throw new Error("決定のあと、プレイヤー情報欄の検索ボタンは表示されず（削除ボタンに代わる）、プレイヤー検索ポップアップ画面を開き直す操作が画面に無い");
    }
    await f.ポップアップを開く();
  });
  await step(4, async () => { await IDのプレイヤーを検索する(f, "014", p); });
  await expected(async () => {
    const 行 = f.結果の行のID(p);
    await expect(行, `ID ${p} の行が表示される`).toHaveCount(1);
    await expect.soft(f.決定ボタン(行), "選択済みのプレイヤーの行に押せる決定ボタンが無い").toHaveCount(0);
    await expect.soft(f.操作欄のボタン(行), "決定欄のボタンは押せない状態").toBeDisabled();
  });
});

caseTest("IT-M13-12-015", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔プレイヤーID-M1312-015〕"); const d = notes.get("〔イベント日程ID-M1312-015〕");
  const f = await 開いておく(page, d);
  await f.ポップアップを開く();
  await step(1, async () => { await IDのプレイヤーを検索する(f, "015", p); });
  await step(2, async () => { await f.決定ボタン(f.結果の行のID(p)).click(); });
  await expected(async () => {
    await expect.soft(f.ポップアップ, "ポップアップが閉じ、イベント新規申込登録画面へ戻る").toBeHidden();
    expect.soft(await f.新規申込登録画面である(d), "イベント新規申込登録画面").toBe(true);
    expect.soft(await f.選んだプレイヤーID.inputValue(), `プレイヤー情報欄にID ${p} のプレイヤーが挿入される`).toBe(p);
    await expect.soft(f.プレイヤー名, "プレイヤー情報欄のプレイヤー名").toHaveText(会員の氏名("015"));
    await expect.soft(f.削除ボタン, "削除ボタンが表示される").toBeVisible();
    await expect.soft(f.検索ボタン, "検索ボタンは表示されない").toBeHidden();
  });
});

caseTest("IT-M13-12-016", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔プレイヤーID-M1312-016〕");
  const f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-016〕"));
  await f.ポップアップを開く();
  await step(1, async () => { await IDのプレイヤーを検索する(f, "016", p); });
  await step(2, async () => { await f.決定する(p); });
  let 支払会員 = "";
  await step(3, async () => { 支払会員 = await f.欄の表示("支払会員"); });
  await expected(async () => {
    expect.soft(支払会員, "支払会員に1行目のプレイヤーの会員の氏名が表示される").toBe("会員姓桜井 会員名光");
  });
});

caseTest("IT-M13-12-017", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔プレイヤーID-M1312-017〕");
  const f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-017〕"));
  await f.ポップアップを開く();
  await step(1, async () => { await IDのプレイヤーを検索する(f, "017", p); });
  await step(2, async () => { await f.決定する(p); expect(await f.選んだプレイヤーID.inputValue(), "決定でプレイヤーが挿入された").toBe(p); });
  await step(3, async () => { await f.削除ボタン.click(); });
  await expected(async () => {
    expect.soft(await f.選んだプレイヤーID.inputValue(), "挿入されていたプレイヤーIDが削除される").toBe("");
    await expect.soft(f.プレイヤー名, "プレイヤー名が削除される").toHaveText("");
    await expect.soft(f.検索ボタン, "検索ボタンが表示される").toBeVisible();
    await expect.soft(f.削除ボタン, "削除ボタンは表示されない").toBeHidden();
  });
});

// ---- 018・019 登録 ----

/** 手順1〜4（開く・検索・決定・登録）。018・019 で共通 */
async function 選んで登録する(page: Page, step: (n: number, body: () => Promise<void>) => Promise<void>, n: string, 日程ID: string, p: string): Promise<EntryNewPage> {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, 日程ID); });
  await step(2, async () => { await f.ポップアップを開く(); await IDのプレイヤーを検索する(f, n, p); });
  await step(3, async () => { await f.決定する(p); });
  await step(4, async () => {
    if (!(await f.登録を押す())) throw new Error("登録ボタンを押したが、送信されなかった");
  });
  return f;
}

caseTest("IT-M13-12-018", async ({ page, notes, step, expected }) => {
  const d = notes.get("〔イベント日程ID-M1312-018〕"); const p = notes.get("〔プレイヤーID-M1312-018〕");
  await 選んで登録する(page, step, "018", d, p);
  let 申込: ReturnType<typeof 日程の申込の内容> = []; let 選手: string[] = []; let 履歴 = 0;
  await step(5, async () => { 申込 = 日程の申込の内容(d); 選手 = 日程の申込プレイヤーのプレイヤーID(d); 履歴 = 日程の申込履歴の件数(d); });
  await expected(async () => {
    expect.soft(申込.length, "日程の申込が1件追加される").toBe(1);
    expect.soft(申込[0]?.支払金額, "申込の支払金額").toBe("2500");
    expect.soft(申込[0]?.申込状況, "申込の申込状況").toBe("申込済み");
    expect.soft(申込[0]?.支払方法, "申込の支払方法").toBe("管理者追加");
    expect.soft(選手, `ID ${p} の申込プレイヤーが1件追加される`).toEqual([p]);
    expect.soft(履歴, "申込履歴が1件追加される").toBe(1);
  });
});

caseTest("IT-M13-12-019", async ({ page, notes, step, expected }) => {
  await 選んで登録する(page, step, "019", notes.get("〔イベント日程ID-M1312-019〕"), notes.get("〔プレイヤーID-M1312-019〕"));
  await expected(async () => {
    note(`登録後の画面のアドレス: ${new URL(page.url()).pathname}`);
    expect.soft(new URL(page.url()).pathname, "イベント申込登録（検索結果）画面へ遷移する").toMatch(/\/entry_registration$/);
    await expect.soft(page.locator(".c-pageTitle__title"), "画面の見出し").toHaveText("イベント申込登録");
  });
});

caseTest("IT-M13-12-020", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-020〕")); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), f.イベント申込登録リンク.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "イベント申込登録（検索結果）画面へ遷移する").toMatch(/\/entry_registration$/);
    await expect.soft(page.locator(".c-pageTitle__title"), "画面の見出し").toHaveText("イベント申込登録");
    await expect.soft(new EntrySearchPage(page).検索イベント名, "イベント申込登録の検索の欄").toBeVisible();
  });
});

// ---- 024〜027 重複・なりすまし対策トークン ----

function 重複を送る(n: "024" | "025", DB確認: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const d = notes.get(`〔イベント日程ID-M1312-${n}〕`); const p = notes.get(`〔プレイヤーID-M1312-${n}〕`);
    let f!: EntryNewPage;
    await step(1, async () => { f = await 開いておく(page, d); });
    await step(2, async () => {
      note("開発者ツールで行うのと同じに、画面に見えない「参加者として選んだプレイヤーID」の欄に値を入れ、プレイヤーを選ぶまで押せない登録ボタンを押せるようにした");
      await f.プレイヤーIDを書き換える(p);
    });
    await step(3, async () => { if (!(await f.登録を押す())) throw new Error("登録ボタンを押したが、送信されなかった"); });
    let 件数 = -1;
    if (DB確認) await step(4, async () => { 件数 = プレイヤーの日程への申込件数(p, d); });
    await expected(async () => {
      if (DB確認) {
        expect.soft(件数, `ID ${p} とイベント日程の申込が既存の1件から増えない`).toBe(1);
      } else {
        note(`送信後の画面のアドレス: ${new URL(page.url()).pathname}。画面上部のメッセージ: ${(await page.locator(".alert").allInnerTexts()).map(整える).join(" / ") || "なし"}`);
        expect.soft(await f.新規申込登録画面である(d), "イベント新規申込登録画面へ戻る").toBe(true);
      }
    });
  };
}
caseTest("IT-M13-12-024", 重複を送る("024", false));
caseTest("IT-M13-12-025", 重複を送る("025", true));

function トークンを変えて送る(n: "026" | "027", token: "なし" | string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const d = notes.get(`〔イベント日程ID-M1312-${n}〕`); const p = notes.get(`〔プレイヤーID-M1312-${n}〕`);
    let f!: EntryNewPage;
    await step(1, async () => {
      f = await 開いておく(page, d);
      await f.ポップアップを開く(); await IDのプレイヤーを検索する(f, n, p); await f.決定する(p);
    });
    await step(2, async () => { await tamperToken(f.送信フォーム, token); });
    await step(3, async () => { if (!(await f.登録を押す())) throw new Error("登録ボタンを押したが、送信されなかった"); });
    let 件数 = -1;
    await step(4, async () => { 件数 = 日程の申込の件数_削除済みを含む(d); });
    await expected(async () => {
      expect.soft(件数, "イベント日程の申込が追加されない（0件のまま）").toBe(0);
    });
  };
}
caseTest("IT-M13-12-026", トークンを変えて送る("026", "なし"));
caseTest("IT-M13-12-027", トークンを変えて送る("027", "invalid-token"));

// ---- 032〜034 表示 ----

caseTest("IT-M13-12-032", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-032〕")); });
  let 店舗 = ""; let フォーマット = "";
  await step(2, async () => { 店舗 = await f.欄の表示("店舗"); フォーマット = await f.欄の表示("フォーマット"); });
  await expected(async () => {
    expect.soft(店舗, "店舗に「店舗A」が表示される").toBe("店舗A");
    expect.soft(フォーマット, "フォーマットに「スタンダード」が表示される").toBe("スタンダード");
    const 入力欄 = await f.申込情報.locator("div.row").filter({ has: page.locator("label.col-form-label", { hasText: /^\s*(店舗|フォーマット)\s*$/ }) }).locator("input:not([type=hidden]), select, textarea").count();
    expect.soft(入力欄, "店舗・フォーマットは入力欄でなくラベルで表示される").toBe(0);
  });
});

caseTest("IT-M13-12-033", async ({ page, notes, step, expected }) => {
  let f!: EntryNewPage;
  await step(1, async () => { f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-033〕")); });
  let ラベル: string[] = [];
  await step(2, async () => { ラベル = await f.欄のラベル一覧(); note(`イベント申込情報の欄の並び: ${ラベル.join("、")}`); });
  await expected(async () => {
    expect.soft(ラベル, "店舗の欄の並びに会場の項目が無い").not.toContain("会場");
    expect.soft(ラベル, "店舗の欄は表示されている（並びを読めた前提）").toContain("店舗");
  });
});

caseTest("IT-M13-12-034", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔プレイヤーID-M1312-034〕");
  const f = await 開いておく(page, notes.get("〔イベント日程ID-M1312-034〕"));
  await f.ポップアップを開く();
  await step(1, async () => { await IDのプレイヤーを検索する(f, "034", p); });
  await step(2, async () => { await f.決定する(p); });
  let 本名 = "";
  await step(3, async () => { 本名 = 整える(await f.MTG本名.innerText()); });
  await expected(async () => {
    note(`MTG Companion登録本名の表示: 「${本名}」`);
    expect.soft(await f.プレイヤー表の見出し(), "プレイヤー情報の見出しにMTG Companion登録本名がある").toContain("MTG Companion登録本名");
    expect.soft(本名.split(" "), "MTG Companion登録本名に姓「M1312-034-Yamada」が表示される").toContain("M1312-034-Yamada");
    expect.soft(本名.split(" "), "MTG Companion登録本名に名「M1312-034-Taro」が表示される").toContain("M1312-034-Taro");
    expect.soft(await f.MTG本名.locator("input, select, textarea").count(), "入力欄でなくラベルで表示される").toBe(0);
  });
});

// ---- 035 QK連携（マイイベント・デッキ登録の前後） ----

async function 別のブラウザ(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  const p = await ctx.newPage();
  p.setDefaultTimeout(60_000);
  return { page: p, close: () => ctx.close() };
}

caseTest("IT-M13-12-035", async ({ page, browser, step, expected, capture }) => {
  const m = QK会員();
  const A = new EventHistoryPage(page);
  const B = await 別のブラウザ(browser);
  try {
    let 前 = "";
    await step(1, async () => { await A.ログインする(m.メール, m.パスワード); await A.開く(); 前 = 整える(await page.locator("main, body").first().innerText()); });
    await step(2, async () => { await loginAdmin(B.page, QK1302_ADMIN); });
    const f = new EntryNewPage(B.page);
    await step(3, async () => {
      const s = new EntrySearchPage(B.page);
      note("開催日(From)の初期値（実行日）はそのまま、店舗は初期表示（QK連携店舗）のままで検索した");
      const link = B.page.locator("table.table tbody tr").filter({ hasText: QKイベント名() }).getByRole("link", { name: "新規登録" });
      // 共有の開発環境では、登録した直後のイベントが検索結果にすぐ出ないことがある。0件のときは間をおいて検索し直す（最大で約1分）
      let n = 0;
      for (let i = 0; ; i++) {
        await s.開く();
        await s.検索イベント名.fill(QKイベント名());
        await s.検索する();
        n = await link.count();
        if (n === 1 || i >= 5) break;
        await B.page.waitForTimeout(10_000);
      }
      if (n !== 1) note(`検索結果に新規登録が ${n} 件だった（約1分おいて検索し直しても同じ）`);
      if (n !== 1) throw new Error(`イベント申込登録の検索結果に、イベント「${QKイベント名()}」の日程の新規登録が ${n} 件（1件のはず）。結果: ${整える(await B.page.locator("table.table, .c-contentsArea").first().innerText()).slice(0, 200)}`);
      await Promise.all([B.page.waitForURL(/\/entry_registration\/new\/\d+$/, { waitUntil: "load" }), link.click()]);
      await f.読み込みを待つ();
    });
    await step(4, async () => {
      await f.ポップアップを開く();
      await f.プレイヤーを検索する(`${m.姓} ${m.名}`);
      const b = f.結果の行.locator(".js-entry-player-select");
      if ((await b.count()) !== 1) throw new Error(`プレイヤー検索「${m.姓} ${m.名}」の決定ボタンが ${await b.count()} 個（1個のはず）`);
      await b.click();
      await expect(f.ポップアップ).toBeHidden();
      await f.登録ボタン.click();
      await B.page.waitForLoadState("load");
      await B.page.screenshot().then((buf) => test.info().attach("ブラウザBの登録後の画面", { body: buf, contentType: "image/png" }));
    });
    await step(5, async () => { await A.開く(); await capture("ブラウザAのマイイベント・デッキ登録（登録後）"); });
    await expected(async () => {
      expect.soft(前.includes("予約済みの大会はありません。"), "手順1の一覧に「予約済みの大会はありません。」と表示される").toBe(true);
      const card = page.locator(".p-hareruya-deckentry-list__card").filter({ hasText: QKイベント名() });
      await expect.soft(card, `手順5の一覧にイベント名「${QKイベント名()}」が表示される`).toHaveCount(1);
      const 日時 = 整える(await card.first().locator(".p-hareruya-deckentry-list__card-row").filter({ hasText: "開催" }).locator("dd").innerText().catch(() => ""));
      note(`手順5の一覧の開催日時の表示: 「${日時}」（日時の値で比べた）`);
      const mm = /^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})$/.exec(日時);
      const 値 = mm ? `${mm[1]}年${Number(mm[2])}月${Number(mm[3])}日${mm[4].padStart(2, "0")}時${mm[5]}分` : 日時;
      expect.soft(値, "開催日時が2030年10月21日10時00分").toBe("2030年10月21日10時00分");
    });
  } finally {
    await B.close();
  }
});

// ---- 036 連携（申込の前後のイベント編集の日程一覧） ----

caseTest("IT-M13-12-036", async ({ page, notes, step, expected, capture }) => {
  const e = notes.get("〔イベントID-M1312-RI001〕"); const d = notes.get("〔日程ID-M1312-RI001〕");
  await loginAdmin(page, M1312_RI_ADMIN);
  const 編集を開く = async (): Promise<EventForm> => {
    const l = new EventListPage(page);
    await l.開く();
    await l.日付を入れる(l.開催日From, ""); await l.日付を入れる(l.開催日To, "");
    await l.名前略称で検索する(RIイベント名());
    await l.編集ボタンを押す(e);
    await Promise.all([page.waitForURL(new RegExp(`/event/${e}/edit$`), { waitUntil: "load" }), l.メニュー項目(e, "編集").click()]);
    const form = new EventForm(page);
    await expect(form.日程行(d), "日程一覧に開始時間 2026-12-14 10:00 の日程の行").toBeVisible();
    return form;
  };
  let form!: EventForm;
  await step(1, async () => {
    note("イベント一覧は、開催日(From)の初期値が入ったままだと日程の範囲で絞られるので、開催日を空にしてイベント名で検索した");
    form = await 編集を開く();
  });
  let 前の人数 = ""; let 前のヒント: string | null = null; let 前に入った = false;
  await step(2, async () => {
    前の人数 = await form.申込人数(d);
    const box = form.日程チェック(d);
    await box.hover();
    前のヒント = await box.getAttribute("title");
    await box.check();
    前に入った = await box.isChecked();
    await capture("登録前: 一括削除用チェックボックスにチェックを入れた");
    await box.uncheck();
  });
  await step(3, async () => {
    const s = new EntrySearchPage(page);
    await s.開く();
    await s.条件を入れて検索する(["連携店舗M1312"], RIイベント名(), "", "");
  });
  const f = new EntryNewPage(page);
  await step(4, async () => {
    const row = new EntrySearchPage(page).日程の行(d);
    await expect(row, "開始時間 2026-12-14 10:00 の日程の行").toHaveCount(1);
    await Promise.all([page.waitForURL(new RegExp(`/entry_registration/new/${d}$`), { waitUntil: "load" }), row.getByRole("link", { name: "新規登録" }).click()]);
    await f.読み込みを待つ();
  });
  await step(5, async () => {
    await f.ポップアップを開く();
    await f.プレイヤーを検索する(RI会員の姓());
    const b = f.結果の行.locator(".js-entry-player-select");
    if ((await b.count()) !== 1) throw new Error(`プレイヤー検索「${RI会員の姓()}」の決定ボタンが ${await b.count()} 個（1個のはず）`);
    await b.click();
    await expect(f.ポップアップ).toBeHidden();
  });
  await step(6, async () => { if (!(await f.登録を押す())) throw new Error("登録ボタンを押したが、送信されなかった"); });
  await step(7, async () => { form = await 編集を開く(); });
  let 後の人数 = ""; let 後のヒント: string | null = null; let 後に入った = true;
  await step(8, async () => {
    後の人数 = await form.申込人数(d);
    const box = form.日程チェック(d);
    await box.hover({ force: true });
    後のヒント = await box.getAttribute("title");
    await box.click({ force: true, timeout: 5000 }).catch((err) => note(`チェックを入れる操作を受け付けなかった（${String(err).split("\n")[0].slice(0, 100)}）`));
    後に入った = await box.isChecked();
  });
  await expected(async () => {
    note(`ツールチップは、一括削除用チェックボックスに付く説明（カーソルを合わせると出る文）で確かめた。登録前: 「${前のヒント ?? ""}」、登録後: 「${後のヒント ?? ""}」`);
    expect.soft(前の人数.split("/")[0].trim(), "手順2の申込人数は0件").toBe("0");
    expect.soft(前のヒント ?? "", "手順2ではツールチップが表示されない").toBe("");
    expect.soft(前に入った, "手順2ではクリックでチェックを入れられる").toBe(true);
    expect.soft(後の人数.split("/")[0].trim(), "手順7の申込人数が1件に変わる").toBe("1");
    expect.soft(後のヒント, "カーソルを合わせると「申込があるため削除できません」が表示される").toBe("申込があるため削除できません");
    expect.soft(後に入った, "チェックを入れられない").toBe(false);
    await expect.soft(form.日程チェック(d), "一括削除用チェックボックスは操作できない状態").toBeDisabled();
  });
});
