/**
 * M13-10 イベント申込詳細・編集。正本: cases/M13-10_test_cases.tsv
 * 実装しないケース: 002（会員・プレイヤーを削除済みにする。共有の会員に触れる）・019（検索結果11人。会員11人が要る）・
 *   038（会員の氏名・プレイヤー名(英)を指定の値で作れない）。
 * 003・004・006・010〜012・014・017・018・041・042・044・045 は、アプリの画面が参加者の行を1行しか持たない（2行目の検索ボタンなど無い）ので、
 *   手順どおりの操作ができなければ期待結果の確かめで不合格になる（チーム人数の項目もアプリに無い）。
 * 画面で代えられない DB の設定（支払番号・支払会員を別の会員にする・チーム人数・会場名・未登録のIDの削除）を行わないケースは、
 * ケースの確かめに関わらないことを手順の注記に残す（条件付き）。シードの代え方は seeds/m13-10.ts の冒頭。
 */
import { Browser, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 申込の申込履歴ID, 申込の申込状況, 申込の参加者のプレイヤーID } from "../../db/m13_10";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { EntryEditPage, 申込一覧の行から開く } from "../../pages/admin/m13_10_entry_edit";
import { EntryListPage } from "../../pages/admin/m13_06_entry_list";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history_k";
import { 予約の一覧, 予約の一覧を読む, 日時の文 } from "../../pages/front/m13_10_event_history";
import { QK1302_ADMIN } from "../../seeds/m13-02-qk";
import { M1310_ADMIN_A, M1310_ADMIN_B, M1310_ADMIN_DPA, QK1310イベント名, QK1310会員, 申込の会員 } from "../../seeds/m13-10";
import { entryMemberNames } from "../../seeds/members";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 条件の注記 = (m: string) => note(`条件付き: ${m}`);
const 支払の注記 = () => 条件の注記("支払番号と、支払会員を参加者と別の会員にする設定は DB でしか行えないので行っていない（支払会員は参加者の会員のまま）。このケースはそれらを確かめない");

/** 管理者でログインし、申込IDのイベント申込詳細・編集画面を開いた画面の部品を返す（手順の「画面を開く」） */
async function 開く(page: Page, 申込ID: string): Promise<EntryEditPage> {
  const e = new EntryEditPage(page);
  await e.申込を開く(申込ID);
  await e.編集画面の読み込みを待つ();
  await expect(e.登録ボタン, "参加者が入っていると登録ボタンを押せる（画面のスクリプトが動き終わった）").toBeEnabled({ timeout: 30_000 });
  return e;
}

/** 登録ボタンを押す（送信されなければ落とす） */
async function 登録を押す(e: EntryEditPage): Promise<number> {
  const s = await e.登録を押して応答を待つ();
  if (s === null) throw new Error("登録ボタンを押したが、送信されなかった");
  note(`登録の応答 ${s}、画面のメッセージ: ${(await e.メッセージ()).join(" / ") || "なし"}`);
  return s;
}

/** 申込の状態（申込状況・参加者・申込履歴）を DB で読む */
const 申込の状態 = (id: string) => ({ 申込状況: 申込の申込状況(id), 参加者: 申込の参加者のプレイヤーID(id), 申込履歴: 申込の申込履歴ID(id) });
type 状態 = ReturnType<typeof 申込の状態>;

/** 「申込状況、参加者および申込履歴が更新前から変更されないこと」の確かめ（[実際, 期待, 何を確かめたか]） */
function 変わらない(前: 状態, 後: 状態, 控えた履歴: string[]): [unknown, unknown, string][] {
  return [
    [前.申込状況, "申込済み", "更新前の申込状況は申込済み（事前準備）"],
    [前.申込履歴, 控えた履歴, "更新前の申込履歴は控えた2件（事前準備）"],
    [後.申込状況, 前.申込状況, "申込状況が更新前から変わらない"],
    [後.参加者, 前.参加者, "参加者が更新前から変わらない"],
    [後.申込履歴, 前.申込履歴, "申込履歴が更新前から変わらない（増えない）"],
  ];
}

// ---- 005 未登録の申込 ----

caseTest("IT-M13-10-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  const e = new EntryEditPage(page);
  let status = 0;
  await step(1, async () => {
    条件の注記("申込ID 9131005 の DB での削除は行っていない（未登録であることも確かめていない）");
    status = await e.申込を開く("9131005");
  });
  await expected(async () => {
    expect.soft(status, "未登録の申込IDで開いた画面の応答（404）").toBe(404);
    await expect.soft(e.申込情報, "イベント申込情報の欄が表示されない（エラーの画面）").toHaveCount(0);
  });
});

// ---- 007 権限の無い店舗の申込の操作部 ----

caseTest("IT-M13-10-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-007〕");
  await loginAdmin(page, M1310_ADMIN_B);
  const e = new EntryEditPage(page);
  let status = 0;
  await step(1, async () => { status = await e.申込を開く(id); });
  await step(2, async () => {
    支払の注記();
    条件の注記("チーム人数「2」は DB でしか設定できず（画面に項目が無い）、行っていない。画面のプレイヤー情報は1行だけで、2人目の未登録の行は無い。1行目と画面下部の操作部の有無を確かめた");
  });
  await expected(async () => {
    expect(status, "店舗Bだけの管理者で店舗Aの申込のアドレスを開いた応答").toBe(200);
    expect(await e.編集画面である(id), "店舗Aの申込のイベント申込詳細・編集画面が表示されている（操作部の有無を見る前提）").toBe(true);
    expect.soft(await e.プレイヤー名の表示(), "1人目のプレイヤーの情報が表示されている").not.toBe("");
    await expect.soft(e.表示されたボタン("削除"), "削除の操作が表示されない").toHaveCount(0);
    await expect.soft(e.表示されたボタン("検索"), "検索の操作が表示されない").toHaveCount(0);
    await expect.soft(e.表示されたボタン("登録"), "登録の操作が表示されない").toHaveCount(0);
    await expect.soft(e.表示されたリンク("同日程の新規申込へ"), "同日程の新規申込への操作が表示されない").toHaveCount(0);
  });
});

// ---- 008 権限の無い店舗の申込への更新の要求 ----

caseTest("IT-M13-10-008", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔店舗Aイベント申込ID-M1310-008〕"); const b = notes.get("〔店舗Bイベント申込ID-M1310-008〕");
  const 前 = 申込の申込状況(a);
  await loginAdmin(page, M1310_ADMIN_B);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, b); });
  await step(2, async () => {
    await e.送信先を書き換える(a);
    await e.申込状況を選ぶ("キャンセル済み");
    note(`フォームの送信先を「${await e.送信先()}」、送るイベント申込IDを ${await e.送るイベント申込ID.inputValue()} に書き換えた`);
  });
  await step(3, async () => { 条件の注記("支払番号「PAY-100-008」は DB でしか設定できず、行っていない。このケースはそれを確かめない"); await 登録を押す(e); });
  let 後: string | null = null;
  await step(4, async () => { 後 = 申込の申込状況(a); });
  await expected(async () => {
    expect.soft(前, "更新前の店舗Aの申込の申込状況（事前準備）").toBe("申込済み");
    expect.soft(後, "店舗Aの申込の申込状況が申込済みから更新されない").toBe("申込済み");
  });
});

// ---- 009 支払方法・支払金額は操作できない ----

caseTest("IT-M13-10-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  let 前 = { 方法: "", 金額: "" };
  await step(1, async () => {
    e = await 開く(page, notes.get("〔イベント申込ID-M1310-009〕"));
    前 = { 方法: await e.選ばれている(e.支払方法), 金額: await e.支払金額.inputValue() };
    note(`開いたときの支払方法「${前.方法}」・支払金額「${前.金額}」`);
  });
  await step(2, async () => {
    支払の注記();
    const 試した: string[] = [];
    const 試す = async (名: string, l: Locator, keys: string[]) => {
      try { await l.click({ timeout: 3_000 }); 試した.push(`${名}: 押せた`); } catch { 試した.push(`${名}: 押せない`); }
      for (const k of keys) await page.keyboard.press(k);
    };
    await 試す("支払方法", e.支払方法, ["ArrowDown", "Enter"]);
    await 試す("支払金額", e.支払金額, ["Control+A", "Digit9", "Digit9"]);
    note(`マウスで押し、キーボードで選択・入力を試した（${試した.join("、")}）`);
  });
  await expected(async () => {
    await expect.soft(e.支払方法, "支払方法は無効で操作できない").toBeDisabled();
    await expect.soft(e.支払金額, "支払金額は入力できない").not.toBeEditable();
    expect.soft(await e.選ばれている(e.支払方法), "支払方法が変わっていない").toBe(前.方法);
    expect.soft(await e.支払金額.inputValue(), "支払金額が変わっていない").toBe(前.金額);
  });
});

// ---- 013 削除ボタンで行のプレイヤーを外す ----

caseTest("IT-M13-10-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  let 前 = "";
  await step(1, async () => {
    e = await 開く(page, notes.get("〔イベント申込ID-M1310-013〕"));
    前 = await e.プレイヤー名の表示();
    note(`押す前の1行目のプレイヤー名「${前}」・選ばれているプレイヤーID ${await e.選んだプレイヤーID.inputValue()}`);
  });
  await step(2, async () => {
    支払の注記();
    条件の注記("チーム人数「2」は DB でしか設定できず、行っていない。このケースは参加者の行の削除ボタンだけを見る");
    await e.削除ボタン.click();
  });
  await expected(async () => {
    expect(前, "押す前はプレイヤーの情報が表示されていた（事前準備）").not.toBe("");
    expect.soft(await e.プレイヤー名の表示(), "プレイヤー名が画面から消える").toBe("");
    expect.soft((await e.MTG本名.innerText()).trim(), "MTG Companion登録本名が画面から消える").toBe("");
    expect.soft(await e.選んだプレイヤーID.inputValue(), "その行に選ばれていたプレイヤーIDが消える").toBe("");
    await expect.soft(e.削除ボタン, "その行の削除ボタンが表示されなくなる").toBeHidden();
    await expect.soft(e.検索ボタン, "その行に検索ボタンが表示される").toBeVisible();
  });
});

// ---- 020 イベント申込一覧へ ----

caseTest("IT-M13-10-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-020〕")); });
  await step(2, async () => {
    支払の注記();
    await Promise.all([page.waitForURL(/\/event\/entry(\?|$)/, { waitUntil: "load" }), e.イベント申込一覧リンク.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "イベント申込一覧画面のアドレス").toMatch(/\/event\/entry$/);
    await expect.soft(new EntryListPage(page).イベント名, "イベント申込一覧の検索条件の欄が表示される").toBeVisible();
  });
});

// ---- 021 同日程の新規申込へ ----

caseTest("IT-M13-10-021", async ({ page, notes, step, expected }) => {
  const d = notes.get("〔イベント日程ID-M1310-021〕");
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-021〕")); });
  await step(2, async () => {
    支払の注記();
    await Promise.all([page.waitForURL(/\/entry_registration\/new\/\d+$/, { waitUntil: "load" }), e.同日程の新規申込へ.click()]);
    await e.読み込みを待つ();
  });
  await expected(async () => {
    expect.soft(await e.新規申込登録画面である(d), `日程ID ${d} のイベント申込新規登録画面（申込IDの欄が無い）`).toBe(true);
  });
});

// ---- 022 申込状況6種の更新 ----

const 申込状況6種 = ["決済中", "入金待ち", "申込済み", "入金期限切れ", "キャンセル済み", "支払番号が存在しない"];

caseTest("IT-M13-10-022", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-022〕");
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  let 選択肢: string[] = [];
  const 結果: [string, string | null][] = [];
  const 選んで登録 = async (状況: string) => {
    await e.申込状況を選ぶ(状況);
    await 登録を押す(e);
    await e.編集画面の読み込みを待つ();
    結果.push([状況, 申込の申込状況(id)]);
  };
  await step(1, async () => {
    e = await 開く(page, id);
    選択肢 = await e.選択肢(e.申込状況);
    note(`申込状況の選択肢: ${選択肢.join("、")}`);
  });
  await step(2, async () => { 支払の注記(); await 選んで登録("決済中"); });
  await step(3, async () => { for (const s of 申込状況6種.slice(1)) await 選んで登録(s); });
  await expected(async () => {
    for (const s of 申込状況6種) expect.soft(選択肢, `申込状況の選択肢に「${s}」がある（事前準備）`).toContain(s);
    for (const [s, got] of 結果) expect.soft(got, `「${s}」を選んで登録したあとの申込状況`).toBe(s);
    expect.soft(結果.map(([s]) => s), "6種すべてを選んで登録した").toEqual(申込状況6種);
  });
});

// ---- 023 登録後は詳細・編集画面へ戻る ----

caseTest("IT-M13-10-023", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-023〕");
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { 支払の注記(); await e.申込状況を選ぶ("キャンセル済み"); });
  await step(3, async () => { await 登録を押す(e); });
  await expected(async () => {
    expect.soft(await e.編集画面である(id), `申込ID ${id} のイベント申込詳細・編集画面`).toBe(true);
  });
});

// ---- 024 参加者の入れ替え ----

caseTest("IT-M13-10-024", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-024〕"); const 検索ID = notes.get("〔検索プレイヤーID-M1310-024〕");
  const [, 氏名2] = await entryMemberNames(browser, 2);
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.削除ボタン.click(); await expect(e.検索ボタン, "削除で検索ボタンに切り替わる").toBeVisible(); });
  await step(3, async () => { await e.ポップアップを開く(); });
  await step(4, async () => {
    note(`検索語「会員姓一」は、検索用の会員を代えた会員の氏名「${氏名2}」で代えた（会員を作らない。seeds/m13-10.ts）`);
    await e.プレイヤーを検索する(氏名2);
    await e.IDの行のページへ(検索ID);
    await e.決定する(検索ID);
  });
  await step(5, async () => {
    支払の注記();
    条件の注記("チーム人数「1」は DB でしか設定できず、行っていない（画面のプレイヤー情報はもともと1行）");
    await 登録を押す(e);
  });
  let 後: string[] = [];
  await step(6, async () => { 後 = 申込の参加者のプレイヤーID(id); });
  await expected(async () => {
    expect.soft(後, "申込の参加者が検索したプレイヤーだけになる").toEqual([検索ID]);
  });
});

// ---- 025 更新で申込履歴が1件増える ----

caseTest("IT-M13-10-025", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-025〕");
  const 前 = 申込の申込履歴ID(id);
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { 支払の注記(); await e.申込状況を選ぶ("キャンセル済み"); });
  await step(3, async () => { await 登録を押す(e); });
  let 後: string[] = [];
  await step(4, async () => { 後 = 申込の申込履歴ID(id); });
  await expected(async () => {
    expect.soft(前, "更新前の申込履歴は控えた2件（事前準備）").toEqual([notes.get("〔申込履歴ID-M1310-025A〕"), notes.get("〔申込履歴ID-M1310-025B〕")]);
    expect.soft(後.length, "申込履歴の件数が更新前から1件増える").toBe(前.length + 1);
    expect.soft(後.slice(0, 前.length), "更新前の申込履歴はそのまま残る").toEqual(前);
  });
});

// ---- 026・028・030・032・033 不正な更新では何も変わらない ----

type 不正 = { 申込: string; 履歴: [string, string]; 書き換え: (e: EntryEditPage, notes: CaseCtx["notes"]) => Promise<void> };

/** 026・028: 開く → 書き換える → キャンセル済みを選ぶ → 登録 → DB */
function 書き換えてキャンセル(v: 不正) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(v.申込);
    const 前 = 申込の状態(id);
    await loginAdmin(page, M1310_ADMIN_A);
    let e!: EntryEditPage;
    let 後!: 状態;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await v.書き換え(e, notes); });
    await step(3, async () => { await e.申込状況を選ぶ("キャンセル済み"); });
    await step(4, async () => { 支払の注記(); await 登録を押す(e); });
    await step(5, async () => { 後 = 申込の状態(id); });
    await expected(async () => { for (const [a, b, m] of 変わらない(前, 後, v.履歴.map((l) => notes.get(l)))) expect.soft(a, m).toEqual(b); });
  };
}

/** 030: 開く → 書き換える → 登録 → DB */
function 書き換えだけ(v: 不正) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(v.申込);
    const 前 = 申込の状態(id);
    await loginAdmin(page, M1310_ADMIN_A);
    let e!: EntryEditPage;
    let 後!: 状態;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await v.書き換え(e, notes); });
    await step(3, async () => { 支払の注記(); await 登録を押す(e); });
    await step(4, async () => { 後 = 申込の状態(id); });
    await expected(async () => { for (const [a, b, m] of 変わらない(前, 後, v.履歴.map((l) => notes.get(l)))) expect.soft(a, m).toEqual(b); });
  };
}

/** 032・033: 開く → キャンセル済みを選ぶ → 書き換える → 登録 → DB */
function キャンセルして書き換え(v: 不正) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(v.申込);
    const 前 = 申込の状態(id);
    await loginAdmin(page, M1310_ADMIN_A);
    let e!: EntryEditPage;
    let 後!: 状態;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await e.申込状況を選ぶ("キャンセル済み"); });
    await step(3, async () => { await v.書き換え(e, notes); });
    await step(4, async () => { 支払の注記(); await 登録を押す(e); });
    await step(5, async () => { 後 = 申込の状態(id); });
    await expected(async () => { for (const [a, b, m] of 変わらない(前, 後, v.履歴.map((l) => notes.get(l)))) expect.soft(a, m).toEqual(b); });
  };
}

caseTest("IT-M13-10-026", 書き換えてキャンセル({
  申込: "〔イベント申込ID-M1310-026〕", 履歴: ["〔申込履歴ID-M1310-026A〕", "〔申込履歴ID-M1310-026B〕"],
  書き換え: async (e) => {
    条件の注記("プレイヤーID 9131026 の DB での削除は行っていない（未登録であることも確かめていない）");
    await e.プレイヤーIDを書き換える("9131026");
  },
}));

caseTest("IT-M13-10-028", 書き換えてキャンセル({
  申込: "〔編集中イベント申込ID-M1310-028〕", 履歴: ["〔申込履歴ID-M1310-028A〕", "〔申込履歴ID-M1310-028B〕"],
  書き換え: async (e, notes) => { await e.プレイヤーIDを書き換える(notes.get("〔重複プレイヤーID-M1310-028〕")); },
}));

caseTest("IT-M13-10-030", 書き換えだけ({
  申込: "〔イベント申込ID-M1310-030〕", 履歴: ["〔申込履歴ID-M1310-030A〕", "〔申込履歴ID-M1310-030B〕"],
  書き換え: async (e) => {
    条件の注記("申込状況ID 9131030 の DB での削除は行っていない（未登録であることも確かめていない）");
    await e.申込状況の値を書き換える("9131030");
    note(`申込状況の選ばれている値を ${await e.申込状況の値()} に書き換えた`);
  },
}));

caseTest("IT-M13-10-032", キャンセルして書き換え({
  申込: "〔イベント申込ID-M1310-032〕", 履歴: ["〔申込履歴ID-M1310-032A〕", "〔申込履歴ID-M1310-032B〕"],
  書き換え: async (e) => { await tamperToken(e.フォーム, "なし"); },
}));

caseTest("IT-M13-10-033", キャンセルして書き換え({
  申込: "〔イベント申込ID-M1310-033〕", 履歴: ["〔申込履歴ID-M1310-033A〕", "〔申込履歴ID-M1310-033B〕"],
  書き換え: async (e) => { await tamperToken(e.フォーム, "invalid-token"); },
}));

// ---- 027・029・031 不正な更新では画面に留まる ----

function 留まるケース(申込: string, 書き換え: (e: EntryEditPage, notes: CaseCtx["notes"]) => Promise<void>) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(申込);
    await loginAdmin(page, M1310_ADMIN_A);
    let e!: EntryEditPage;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await 書き換え(e, notes); });
    await step(3, async () => { 支払の注記(); await 登録を押す(e); });
    await expected(async () => {
      expect.soft(await e.編集画面である(id), `申込ID ${id} のイベント申込詳細・編集画面`).toBe(true);
      await expect.soft(e.成功のメッセージ.filter({ hasText: "保存しました" }), "保存が成功していない（画面に留まった。保存して戻ったのではない）").toHaveCount(0);
    });
  };
}

caseTest("IT-M13-10-027", 留まるケース("〔イベント申込ID-M1310-027〕", async (e) => {
  条件の注記("プレイヤーID 9131027 の DB での削除は行っていない（未登録であることも確かめていない）");
  await e.プレイヤーIDを書き換える("9131027");
}));

caseTest("IT-M13-10-029", 留まるケース("〔編集中イベント申込ID-M1310-029〕", async (e, notes) => {
  await e.プレイヤーIDを書き換える(notes.get("〔重複プレイヤーID-M1310-029〕"));
}));

caseTest("IT-M13-10-031", 留まるケース("〔イベント申込ID-M1310-031〕", async (e) => {
  条件の注記("申込状況ID 9131031 の DB での削除は行っていない（未登録であることも確かめていない）");
  await e.申込状況の値を書き換える("9131031");
  note(`申込状況の選ばれている値を ${await e.申込状況の値()} に書き換えた`);
}));

// ---- 037 会場の項目が無い ----

caseTest("IT-M13-10-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  let ラベル: string[] = [];
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-037〕")); });
  await step(2, async () => {
    支払の注記();
    条件の注記("会場名「M1310-037-会場名」とチーム人数「2」は DB でしか設定できず、行っていない（会場の項目は設計書で無くなった。設計書 L0079）");
    ラベル = await e.欄のラベル一覧();
    note(`イベント申込情報の項目（上から）: ${ラベル.join("、")}`);
  });
  await expected(async () => {
    expect(ラベル, "イベント申込情報の項目が読めている（イベント名の項目がある）").toContain("イベント名");
    expect.soft(ラベル, "イベント申込情報に「会場」の項目が無い").not.toContain("会場");
  });
});

// ---- 039 未登録の申込への送信 ----

caseTest("IT-M13-10-039", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  let status: number | null = null;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-039〕")); });
  await step(2, async () => {
    条件の注記("申込ID 9131039 の DB での削除は行っていない（未登録であることも確かめていない）");
    await e.送信先のアドレスを書き換える("9131039");
    note(`フォームの送信先を「${await e.送信先()}」に書き換えた`);
  });
  await step(3, async () => { await e.申込状況を選ぶ("入金待ち"); });
  await step(4, async () => { 支払の注記(); status = await 登録を押す(e); });
  await expected(async () => {
    expect.soft(status, "送信の応答（404のエラー画面）").toBe(404);
    await expect.soft(page.getByText("保存しました", { exact: true }), "更新成功のメッセージが表示されない").toHaveCount(0);
    await expect.soft(page.getByText("保存に失敗しました", { exact: true }), "更新失敗のメッセージが表示されない").toHaveCount(0);
  });
});

// ---- 040 QK連携（マイイベント・デッキ登録の前後） ----

async function 別のブラウザ(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  const p = await ctx.newPage();
  p.setDefaultTimeout(60_000);
  return { page: p, close: () => ctx.close() };
}

caseTest("IT-M13-10-040", async ({ page, browser, notes, step, expected, capture }) => {
  const A会員 = QK1310会員("A"); const B会員 = QK1310会員("B"); const 名 = QK1310イベント名();
  const id = notes.get("〔申込ID-M1310-QK001〕");
  const A = new EventHistoryPage(page);
  const B = await 別のブラウザ(browser);
  const C = await 別のブラウザ(browser);
  try {
    const BH = new EventHistoryPage(B.page);
    const 読む: Record<string, 予約の一覧> = {};
    await step(1, async () => { await A.ログインする(A会員.メール, A会員.パスワード); await A.開く(); 読む.手順1 = await 予約の一覧を読む(page, 名); });
    await step(2, async () => {
      await BH.ログインする(B会員.メール, B会員.パスワード); await BH.開く(); 読む.手順2 = await 予約の一覧を読む(B.page, 名);
      await B.page.screenshot().then((buf) => test.info().attach("ブラウザBのマイイベント・デッキ登録（手順2）", { body: buf, contentType: "image/png" }));
    });
    await step(3, async () => { await loginAdmin(C.page, QK1302_ADMIN); });
    const e = new EntryEditPage(C.page);
    await step(4, async () => {
      const list = new EntryListPage(C.page);
      await list.開く();
      await list.イベント名.fill(名);
      await list.開始時間を空にする();
      note("店舗は初期表示（QK連携店舗）のまま、開始時間の条件は空にして検索した");
      await list.検索する();
      await 申込一覧の行から開く(C.page, id);
      await e.編集画面の読み込みを待つ();
    });
    await step(5, async () => {
      await e.削除ボタン.click();
      await e.ポップアップを開く();
      await e.プレイヤーを検索する(`${B会員.姓} ${B会員.名}`);
      const b = e.結果の行.locator(".js-entry-player-select");
      if ((await b.count()) !== 1) throw new Error(`プレイヤー検索「${B会員.姓} ${B会員.名}」の決定ボタンが ${await b.count()} 個（1個のはず）`);
      await b.click();
      await expect(e.ポップアップ).toBeHidden();
      await 登録を押す(e);
      await C.page.screenshot().then((buf) => test.info().attach("ブラウザCの登録後の画面", { body: buf, contentType: "image/png" }));
    });
    await step(6, async () => { await A.開く(); 読む.手順6 = await 予約の一覧を読む(page, 名); await capture("ブラウザAのマイイベント・デッキ登録（手順6）"); });
    await step(7, async () => {
      await BH.開く(); 読む.手順7 = await 予約の一覧を読む(B.page, 名);
      await B.page.screenshot().then((buf) => test.info().attach("ブラウザBのマイイベント・デッキ登録（手順7）", { body: buf, contentType: "image/png" }));
    });
    await expected(async () => {
      note(`開催日時の表示: 手順1「${読む.手順1.開催日時}」・手順7「${読む.手順7.開催日時}」（日時の値で比べた）`);
      expect.soft(読む.手順1.イベントの件数, `手順1の会員Aの一覧にイベント名「${名}」が表示される`).toBe(1);
      expect.soft(日時の文(読む.手順1.開催日時), "手順1の開催日時が2030年10月22日10時00分").toBe("2030年10月22日10時00分");
      expect.soft(読む.手順2.本文.includes("予約済みの大会はありません。"), "手順2の会員Bの一覧に「予約済みの大会はありません。」と表示される").toBe(true);
      expect.soft(読む.手順6.本文.includes("予約済みの大会はありません。"), "手順6の会員Aの一覧に「予約済みの大会はありません。」と表示される").toBe(true);
      expect.soft(読む.手順7.イベントの件数, `手順7の会員Bの一覧にイベント名「${名}」が表示される`).toBe(1);
      expect.soft(日時の文(読む.手順7.開催日時), "手順7の開催日時が2030年10月22日10時00分").toBe("2030年10月22日10時00分");
    });
  } finally {
    await B.close();
    await C.close();
  }
});

// ---- 043 2回の更新で申込履歴が2件増える ----

caseTest("IT-M13-10-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-043〕");
  const 前 = 申込の申込履歴ID(id);
  await loginAdmin(page, M1310_ADMIN_DPA);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.申込状況を選ぶ("入金待ち"); });
  await step(3, async () => { await 登録を押す(e); });
  await step(4, async () => {
    if (!(await e.編集画面である(id))) throw new Error(`登録のあと、申込ID ${id} のイベント申込詳細・編集画面が表示されない（${page.url()}）`);
    await e.編集画面の読み込みを待つ();
    await expect(e.登録ボタン, "表示された画面の登録ボタン").toBeEnabled({ timeout: 30_000 });
    await e.申込状況を選ぶ("申込済み");
  });
  await step(5, async () => { await 登録を押す(e); });
  let 後: string[] = [];
  await step(6, async () => { 後 = 申込の申込履歴ID(id); });
  await expected(async () => {
    expect.soft(前, "更新前の申込履歴は控えた1件（事前準備）").toEqual([notes.get("〔申込履歴ID-M1310-043A〕")]);
    expect.soft(後.length, "申込履歴が更新前の1件から3件になる").toBe(3);
  });
});


// ---- 参加プレイヤーの行・プレイヤー検索（2行目以降）----
// アプリの画面は参加者の行を1行しか持たないことがある。手順の操作ができなければ、その旨を注記に残し、期待結果の確かめで不合格にする。

const チーム人数の注記 = (n: number) => 条件の注記(`チーム人数${n}人の設定は、アプリに項目が無く行っていない`);
const 数順 = (a: string[]) => [...a].sort((x, y) => Number(x) - Number(y));

/** n 行目の検索ボタンでモーダルを開く。無ければ注記に残して false */
async function 行の検索を開く(e: EntryEditPage, n: number): Promise<boolean> {
  const ok = await e.行の検索を押す(n);
  if (!ok) note(`${n}行目の検索ボタンが画面に無い（参加プレイヤーの行は ${await e.行の数()} 行）。押していない`);
  return ok;
}

/** 登録ボタンを押す。押せなければ注記に残して null（送信されなければ null） */
async function 登録を試す(e: EntryEditPage): Promise<number | null> {
  if (!(await e.登録ボタン.isEnabled())) { note("登録ボタンが押せない状態で、押していない"); return null; }
  const s = await e.登録を押して応答を待つ();
  note(`登録の応答 ${s ?? "なし"}、画面のメッセージ: ${(await e.メッセージ()).join(" / ") || "なし"}`);
  return s;
}

/** 選ばれているプレイヤーIDが pid の行の番号（無ければ null） */
async function 行の番号(e: EntryEditPage, pid: string): Promise<number | null> {
  const n = await e.行の数();
  for (let i = 1; i <= n; i++) if ((await e.行の選ばれたプレイヤーID(i).inputValue().catch(() => "")) === pid) return i;
  return null;
}

caseTest("IT-M13-10-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let 行 = 0;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-003〕")); });
  await step(2, async () => { チーム人数の注記(3); 支払の注記(); 行 = await e.行の数(); note(`参加プレイヤーの行数 ${行}`); });
  await expected(async () => {
    expect.soft(行, "チーム人数3人に合わせて参加プレイヤーの行が3行表示される").toBe(3);
  });
});

caseTest("IT-M13-10-004", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-004〕");
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let 行 = 0;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); 行 = await e.行の数(); note(`参加プレイヤーの行数 ${行}`); });
  await expected(async () => {
    expect(申込の参加者のプレイヤーID(id).length, "既存の参加者が3人（事前準備）").toBe(3);
    expect.soft(行, "既存の参加者数3人に合わせて参加プレイヤーの行が3行表示される").toBe(3);
  });
});

caseTest("IT-M13-10-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-006〕")); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); note(`参加プレイヤーの行数 ${await e.行の数()}`); });
  await expected(async () => {
    await expect.soft(e.行の削除ボタン(1), "1行目に削除の操作が表示される").toHaveCount(1);
    await expect.soft(e.行の検索ボタン(2), "2行目に検索の操作が表示される").toHaveCount(1);
    await expect.soft(e.表示されたボタン("登録"), "画面下部に登録の操作が表示される").toHaveCount(1);
    await expect.soft(e.表示されたリンク("同日程の新規申込へ"), "画面下部に同日程の新規申込への操作が表示される").toHaveCount(1);
  });
});

caseTest("IT-M13-10-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let 開いた = false; let 画面 = ""; let モーダル = "";
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-010〕")); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); 画面 = await e.本文(); });
  await step(3, async () => { 開いた = await 行の検索を開く(e, 2); if (開いた) モーダル = (await e.ポップアップ.innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    for (const 語 of ["席順", "DCIナンバー", "チームメンバー確認済み"]) expect.soft(画面.includes(語), `イベント申込詳細・編集画面に「${語}」が表示されない`).toBe(false);
    expect.soft(開いた, "2行目の検索ボタンを押してプレイヤー検索モーダルが開いた").toBe(true);
    expect.soft(モーダル.includes("DCI"), "プレイヤー検索モーダルにDCIナンバーが表示されない").toBe(false);
  });
});

caseTest("IT-M13-10-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let 開いた = false;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-011〕")); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); 開いた = await 行の検索を開く(e, 2); });
  await expected(async () => {
    expect.soft(開いた, "2行目の検索ボタンを押せた").toBe(true);
    await expect.soft(e.ポップアップ, "プレイヤー検索モーダルが開く").toBeVisible();
  });
});

caseTest("IT-M13-10-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let 開いた = false;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-012〕")); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); 開いた = await 行の検索を開く(e, 2); });
  await step(3, async () => { if (開いた) await e.ポップアップの閉じるボタン.click(); });
  await expected(async () => {
    expect.soft(開いた, "2行目の検索ボタンを押してプレイヤー検索モーダルを開いた（閉じる前提）").toBe(true);
    await expect.soft(e.ポップアップ, "プレイヤー検索モーダルが閉じる").toBeHidden();
  });
});

caseTest("IT-M13-10-014", async ({ page, browser, notes, step, expected }) => {
  const 検索ID = notes.get("〔追加プレイヤーID-M1310-014〕");
  const [, 氏名2] = await entryMemberNames(browser, 2);
  await loginAdmin(page, M1310_ADMIN_A);
  let e!: EntryEditPage; let ok = false;
  await step(1, async () => { e = await 開く(page, notes.get("〔イベント申込ID-M1310-014〕")); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); ok = await 行の検索を開く(e, 2); });
  await step(3, async () => { note("検索語は、シード表の「会員姓一」の会員の代わりに、会員登録済みの会員の氏名を使った"); if (ok) await e.プレイヤーを検索する(氏名2); });
  await step(4, async () => { if (ok) { await e.IDの行のページへ(検索ID); await e.決定する(検索ID); } });
  await expected(async () => {
    expect.soft(ok, "2行目の検索ボタンを押してモーダルを開けた").toBe(true);
    expect.soft(await e.行の選ばれたプレイヤーID(2).inputValue().catch(() => ""), "2行目に検索したプレイヤーのIDが入る").toBe(検索ID);
    expect.soft((await e.行のプレイヤー名(2).innerText().catch(() => "")).trim(), "2行目にプレイヤーの情報（会員の氏名）が挿入される").not.toBe("");
    await expect.soft(e.行の削除ボタン(2), "2行目の検索ボタンが削除ボタンへ切り替わる（削除ボタンが表示される）").toHaveCount(1);
    await expect.soft(e.行の検索ボタン(2), "2行目の検索ボタンが表示されなくなる").toHaveCount(0);
  });
});

/** 017・018: 2行目からモーダルを開いて氏名で検索し、プレイヤーの行の操作部（決定できるか）を確かめる */
function 決定できない(申込: string, 検索語を決める: (browser: Browser) => Promise<string>, プレイヤー: string, 何を: string) {
  return async ({ page, browser, notes, step, expected }: CaseCtx) => {
    const pid = notes.get(プレイヤー);
    const 語 = await 検索語を決める(browser);
    await loginAdmin(page, M1310_ADMIN_A);
    let e!: EntryEditPage; let ok = false; let 行あり = 0; let 決定 = 0; let 操作 = "";
    await step(1, async () => { e = await 開く(page, notes.get(申込)); });
    await step(2, async () => { チーム人数の注記(2); 支払の注記(); ok = await 行の検索を開く(e, 2); });
    await step(3, async () => {
      note("検索語は、シード表の名前の代わりに、会員登録済みの会員の氏名を使った");
      if (ok) {
        await e.プレイヤーを検索する(語);
        const 行 = e.結果の行のID(pid);
        行あり = await 行.count(); 決定 = await e.決定ボタン(行).count();
        操作 = (await e.操作欄のボタン(行).allInnerTexts()).map((t) => t.trim()).join("、");
        note(`プレイヤーID ${pid} の行の操作部のボタン: ${操作 || "なし"}`);
      }
    });
    await expected(async () => {
      expect.soft(ok, "2行目の検索ボタンを押してモーダルを開けた").toBe(true);
      expect.soft(行あり, `検索結果にプレイヤーID ${pid} の行がある`).toBe(1);
      expect.soft(決定, `${何を}決定できない（決定ボタンが押せる状態で出ない）`).toBe(0);
    });
  };
}

caseTest("IT-M13-10-017", 決定できない("〔編集中イベント申込ID-M1310-017〕", async (b) => (await entryMemberNames(b, 2))[1], "〔重複プレイヤーID-M1310-017〕", "同じ日程の別の申込に登録されているプレイヤーを"));
caseTest("IT-M13-10-018", 決定できない("〔イベント申込ID-M1310-018〕", async (b) => (await entryMemberNames(b, 1))[0], "〔参加者プレイヤーID-M1310-018A〕", "編集中の申込ですでに選ばれているプレイヤーを"));

caseTest("IT-M13-10-041", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔編集中イベント申込ID-M1310-041〕"); const 編集中 = notes.get("〔編集中プレイヤーID-M1310-041〕"); const 別日程 = notes.get("〔別日程プレイヤーID-M1310-041〕");
  const [, 氏名2] = await entryMemberNames(browser, 2);
  await loginAdmin(page, M1310_ADMIN_DPA);
  let e!: EntryEditPage; let ok = false; let 後: string[] = [];
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { チーム人数の注記(2); 支払の注記(); ok = await 行の検索を開く(e, 2); });
  await step(3, async () => { note("検索語は、シード表の「別日程姓041」の会員の代わりに、会員登録済みの会員の氏名を使った"); if (ok) await e.プレイヤーを検索する(氏名2); });
  await step(4, async () => { if (ok) { await e.IDの行のページへ(別日程); await e.決定する(別日程); } });
  await step(5, async () => { if (ok) await 登録を試す(e); });
  await step(6, async () => { 後 = 申込の参加者のプレイヤーID(id); note(`DBの参加者: ${後.join("、")}`); });
  await expected(async () => {
    expect.soft(ok, "2行目の検索ボタンを押してモーダルを開けた").toBe(true);
    expect.soft(数順(後), "参加者が編集中のプレイヤーと別日程のプレイヤーの2人となる").toEqual(数順([編集中, 別日程]));
  });
});

/** 042・045: 外すプレイヤーの行の削除ボタンを押す。行が無ければ注記に残して null */
async function 外す(e: EntryEditPage, pid: string): Promise<number | null> {
  const n = await 行の番号(e, pid);
  if (n === null) { note(`プレイヤーID ${pid} の行が画面に無い（参加プレイヤーの行は ${await e.行の数()} 行）。削除ボタンを押していない`); return null; }
  await e.行の削除ボタン(n).click();
  return n;
}

caseTest("IT-M13-10-042", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-042〕");
  const A = notes.get("〔参加者プレイヤーID-M1310-042A〕"); const 外すID = notes.get("〔参加者プレイヤーID-M1310-042B〕"); const C = notes.get("〔参加者プレイヤーID-M1310-042C〕"); const 追加 = notes.get("〔追加プレイヤーID-M1310-042〕");
  const 追加氏名 = (await 申込の会員(browser, 4))[3];
  await loginAdmin(page, M1310_ADMIN_DPA);
  let e!: EntryEditPage; let 行: number | null = null; let ok = false; let 後: string[] = [];
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { チーム人数の注記(3); 支払の注記(); 行 = await 外す(e, 外すID); });
  await step(3, async () => { if (行 !== null) ok = await 行の検索を開く(e, 行); });
  await step(4, async () => {
    note("検索語は、シード表の「追加姓042」の会員の代わりに、会員登録済みの会員の氏名を使った");
    if (ok) { await e.プレイヤーを検索する(追加氏名); await e.IDの行のページへ(追加); await e.決定する(追加); }
  });
  await step(5, async () => { if (ok) await 登録を試す(e); });
  await step(6, async () => { 後 = 申込の参加者のプレイヤーID(id); note(`DBの参加者: ${後.join("、")}`); });
  await expected(async () => {
    expect.soft(行 !== null && ok, "外すプレイヤーの行の削除ボタンと、その行の検索ボタンを押せた").toBe(true);
    expect.soft(数順(後), "参加者が継続の2人と追加の1人の3人となる").toEqual(数順([A, C, 追加]));
    expect.soft(後.includes(外すID), "外したプレイヤーが含まれない").toBe(false);
  });
});

caseTest("IT-M13-10-044", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-044〕");
  const 参加者 = ["A", "B", "C"].map((x) => notes.get(`〔参加者プレイヤーID-M1310-044${x}〕`));
  const 履歴A = notes.get("〔申込履歴ID-M1310-044A〕");
  await loginAdmin(page, M1310_ADMIN_DPA);
  let e!: EntryEditPage; let 前: 状態 = 申込の状態(id); let 後: 状態 = 前;
  await step(1, async () => { 前 = 申込の状態(id); e = await 開く(page, id); });
  await step(2, async () => { チーム人数の注記(3); 支払の注記(); await e.申込状況を選ぶ("キャンセル済み"); });
  await step(3, async () => { await 登録を試す(e); });
  await step(4, async () => { 後 = 申込の状態(id); note(`DB: 申込状況 ${後.申込状況}・参加者 ${後.参加者.join("、")}・申込履歴 ${後.申込履歴.length} 件`); });
  await expected(async () => {
    expect(前.申込状況, "更新前の申込状況は申込済み（事前準備）").toBe("申込済み");
    expect(前.申込履歴, "更新前の申込履歴は控えた1件（事前準備）").toEqual([履歴A]);
    expect(数順(前.参加者), "更新前の参加者は3人（事前準備）").toEqual(数順(参加者));
    expect.soft(後.申込状況, "申込状況がキャンセル済みに更新される").toBe("キャンセル済み");
    expect.soft(数順(後.参加者), "参加者が3人のまま").toEqual(数順(参加者));
    expect.soft(後.申込履歴.length, "申込履歴が1件から2件になる").toBe(2);
  });
});

caseTest("IT-M13-10-045", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベント申込ID-M1310-045〕");
  const A = notes.get("〔参加者プレイヤーID-M1310-045A〕"); const 外すID = notes.get("〔参加者プレイヤーID-M1310-045B〕"); const C = notes.get("〔参加者プレイヤーID-M1310-045C〕");
  const 履歴A = notes.get("〔申込履歴ID-M1310-045A〕");
  await loginAdmin(page, M1310_ADMIN_DPA);
  let e!: EntryEditPage; let 前: 状態 = 申込の状態(id); let 後: 状態 = 前; let 行: number | null = null;
  await step(1, async () => { 前 = 申込の状態(id); e = await 開く(page, id); });
  await step(2, async () => { チーム人数の注記(3); 支払の注記(); 行 = await 外す(e, 外すID); });
  await step(3, async () => { await 登録を試す(e); });
  await step(4, async () => { 後 = 申込の状態(id); note(`DB: 参加者 ${後.参加者.join("、")}・申込履歴 ${後.申込履歴.length} 件`); });
  await expected(async () => {
    expect(前.申込履歴, "更新前の申込履歴は控えた1件（事前準備）").toEqual([履歴A]);
    expect(数順(前.参加者), "更新前の参加者は3人（事前準備）").toEqual(数順([A, 外すID, C]));
    expect.soft(行 !== null, "外すプレイヤーの行の削除ボタンを押せた").toBe(true);
    expect.soft(数順(後.参加者), "参加者が継続の2人となる").toEqual(数順([A, C]));
    expect.soft(後.参加者.includes(外すID), "外したプレイヤーが含まれない").toBe(false);
    expect.soft(後.申込履歴.length, "申込履歴が1件から2件になる").toBe(2);
  });
});
