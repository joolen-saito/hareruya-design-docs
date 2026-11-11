/**
 * M13-07 イベント申込一括編集。正本: cases/M13-07_test_cases.tsv
 * 12件すべてを書く。DB での準備（申込状況の設定・同じ語を含むイベントの削除）は画面で代えた（seeds/m13-07.ts。条件付き）。
 * - 検索語「M13-07権限店舗イベント」は、事前準備の「この語を含むイベントはこの1件だけ」を共有の環境で保つため、
 *   このケースのイベント名(日)（実行の印つき）で検索する。店舗・開始時間(From)は初期表示のまま（シードの日程は試験実行日の13:00）。
 * - 一括編集の対象は、このケースのシードが作った申込だけ（「すべて選ぶ」は使わない）。
 * - 申込履歴の件数は、シードの代え（画面で申込状況を変えた）で初期の件数が2件になる。件数を見るケースは、ケースの始めに読んだ件数からの増減で確かめる。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 申込の申込履歴の件数, 申込の申込状況 } from "../../db/m13_07";
import { expect, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { BulkEditPage, 一括更新の応答, 更新を押した結果 } from "../../pages/admin/m13_07_bulk_edit";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history_k";
import { イベントのカード, カードの開催日時, 画面の本文 } from "../../pages/front/m13_07_event_history";
import { QK1302_ADMIN } from "../../seeds/m13-02-qk";
import { M1307_ADMIN, QKイベント名, QK会員, 権限店舗のイベント名 } from "../../seeds/m13-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 試験管理者で開く(page: Page): Promise<BulkEditPage> {
  await loginAdmin(page, M1307_ADMIN);
  return new BulkEditPage(page);
}
/** このケースのイベント名(日)で検索する（検索語の読み替えと、初期表示のままの条件を注記に残す） */
async function 検索する(b: BulkEditPage, n: string): Promise<void> {
  const 名 = 権限店舗のイベント名(n);
  const r = await b.イベント名で検索する(名);
  note(`イベント名に「${名}」（このケースのイベント名(日)。実行の印つき）を入れて検索した。店舗「${r.店舗.join("・") || "指定なし"}」・開始時間(From)「${r.開始時間From}」は初期表示のまま`);
}
async function 更新して閉じる(b: BulkEditPage): Promise<更新を押した結果> {
  const r = await b.更新を押す();
  note(`「更新」を押すと、ダイアログ「${r.文}」が出た（一括更新の応答: ${r.応答 ? `${r.応答.status}` : "要求は送られていない"}）。OK を押して閉じた`);
  await r.閉じる();
  return r;
}
const 応答の注記 = (r: 一括更新の応答) => note(`送った要求への応答: ${r.status} ${r.本文.replace(/\s+/g, " ").slice(0, 200)}`);
const 履歴の注記 = (初期: Record<string, number>) =>
  note(`ケースの始めの申込履歴の件数: ${Object.entries(初期).map(([id, n]) => `申込ID ${id}=${n}件`).join("、")}（シードで申込状況を画面で変えたため、シード表の「1件」より1件多い）`);

// ---- 001・003: 2件をチェックして更新し、チェックしない1件と比べる ----

caseTest("IT-M13-07-001", async ({ page, notes, step, expected }) => {
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔申込ID-M1307-001${x}〕`));
  const b = await 試験管理者で開く(page);
  await step(1, async () => { await 検索する(b, "001"); });
  await step(2, async () => {
    await b.チェックする(A);
    await b.チェックする(B);
    expect(await b.チェックされているか(C), `申込ID ${C} はチェックしていない`).toBe(false);
  });
  await step(3, async () => { await b.一括編集を開く(); await b.申込状況を選ぶ("申込済み"); await 更新して閉じる(b); });
  const 状況: Record<string, string> = {};
  await step(4, async () => { for (const id of [A, B, C]) 状況[id] = 申込の申込状況(id); });
  await expected(async () => {
    expect.soft(状況[A], `チェックした申込ID ${A} の申込状況`).toBe("申込済み");
    expect.soft(状況[B], `チェックした申込ID ${B} の申込状況`).toBe("申込済み");
    expect.soft(状況[C], `チェックしていない申込ID ${C} の申込状況`).toBe("キャンセル済み");
  });
});

caseTest("IT-M13-07-003", async ({ page, notes, step, expected }) => {
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔申込ID-M1307-003${x}〕`));
  const 初期 = Object.fromEntries([A, B, C].map((id) => [id, 申込の申込履歴の件数(id)]));
  履歴の注記(初期);
  const b = await 試験管理者で開く(page);
  await step(1, async () => { await 検索する(b, "003"); });
  await step(2, async () => {
    await b.チェックする(A);
    await b.チェックする(B);
    expect(await b.チェックされているか(C), `申込ID ${C} はチェックしていない`).toBe(false);
  });
  await step(3, async () => { await b.一括編集を開く(); await b.申込状況を選ぶ("申込済み"); await 更新して閉じる(b); });
  const 件数: Record<string, number> = {};
  await step(4, async () => { for (const id of [A, B, C]) 件数[id] = 申込の申込履歴の件数(id); });
  await expected(async () => {
    note("「1件のまま」は、シードの代えで始めの件数が2件のため、始めの件数から変わらないことで確かめた");
    expect.soft(件数[A] - 初期[A], `チェックした申込ID ${A} の申込履歴の増えた件数（始め ${初期[A]}件）`).toBe(1);
    expect.soft(件数[B] - 初期[B], `チェックした申込ID ${B} の申込履歴の増えた件数（始め ${初期[B]}件）`).toBe(1);
    expect.soft(件数[C] - 初期[C], `チェックしていない申込ID ${C} の申込履歴の増えた件数（始め ${初期[C]}件）`).toBe(0);
  });
});

// ---- 002: 編集権限の無い店舗の申込IDを非同期で送る ----

caseTest("IT-M13-07-002", async ({ page, notes, step, expected }) => {
  const 権限外 = notes.get("〔申込ID-M1307-002B〕");
  const b = await 試験管理者で開く(page);
  await step(1, async () => {
    await 検索する(b, "002");
    expect(await b.行を読む(権限外), `検索結果に編集権限の無い店舗の申込ID ${権限外} の行は無い`).toBeUndefined();
    await b.一括編集を開く();
  });
  await step(2, async () => { await b.申込状況を選ぶ("申込済み"); });
  await step(3, async () => { 応答の注記(await b.非同期で送る([権限外])); });
  let 状況 = "";
  await step(4, async () => { 状況 = 申込の申込状況(権限外); });
  await expected(async () => {
    expect.soft(状況, `編集権限の無い店舗の申込ID ${権限外} の申込状況`).toBe("決済中");
  });
});

// ---- 004: 申込状況の選択肢ごとに更新する ----

caseTest("IT-M13-07-004", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔申込ID-M1307-004〕");
  const 順 = ["入金待ち", "申込済み", "入金期限切れ", "キャンセル済み", "支払番号が存在しない", "決済中"];
  const b = await 試験管理者で開く(page);
  await step(1, async () => {
    await 検索する(b, "004");
    expect(await b.行を読む(id), `検索結果に申込ID ${id} の行がある`).toBeDefined();
  });
  const 結果: [string, string][] = [];
  await step(2, async () => {
    for (const [i, s] of 順.entries()) {
      // 更新のあと画面が再読み込みされ（または入力領域が開いたままになり）、チェックの状態が決まらないので、2回目からは一覧を検索し直す
      if (i > 0) await b.イベント名で検索する(権限店舗のイベント名("004"));
      await b.チェックする(id);
      await b.一括編集を開く();
      await b.申込状況を選ぶ(s);
      await 更新して閉じる(b);
      結果.push([s, 申込の申込状況(id)]);
    }
    note("2回目からの更新の前に、同じ条件で一覧を検索し直して申込を表示した");
  });
  await expected(async () => {
    expect.soft(結果.length, "更新した回数").toBe(順.length);
    for (const [i, [s, got]] of 結果.entries()) expect.soft(got, `${i + 1}回目（「${s}」を選んで更新）のあとの申込状況`).toBe(s);
  });
});

// ---- 005・006: チェックせずに更新する ----

caseTest("IT-M13-07-005", async ({ page, step, expected }) => {
  const b = await 試験管理者で開く(page);
  const 印 = `m1307-005-${Date.now()}`;
  await step(1, async () => { await 検索する(b, "005"); await b.印を付ける(印); });
  await step(2, async () => {
    expect(await b.チェックされた行.count(), "チェックした申込の数").toBe(0);
    await b.一括編集を開く();
  });
  let 押した: 更新を押した結果 | undefined;
  await step(3, async () => {
    await b.申込状況を選ぶ("申込済み");
    押した = await b.更新を押す();
    note(`「更新」を押すと、ダイアログ「${押した.文}」が出た（一括更新の要求: ${押した.応答 ? `送られた ${押した.応答.status}` : "送られていない"}）`);
  });
  let 移った = true;
  await step(4, async () => { 移った = (await 押した!.閉じる()).画面が移った; });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示中の画面のアドレス（イベント申込一覧）").toMatch(/\/event\/entry(\/page\/\d+)?$/);
    await expect.soft(b.一覧.イベント名, "イベント申込一覧の検索条件の欄").toBeVisible();
    expect.soft(移った, "ダイアログを閉じたあと画面が移った（再読み込みを含む）").toBe(false);
    expect.soft(await b.印が残っているか(印), "手順1の画面がそのまま残っている（移動・再読み込みが無い）").toBe(true);
  });
});

caseTest("IT-M13-07-006", async ({ page, notes, step, expected }) => {
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔申込ID-M1307-006${x}〕`));
  const 初期状況 = Object.fromEntries(ids.map((id) => [id, 申込の申込状況(id)]));
  const 初期件数 = Object.fromEntries(ids.map((id) => [id, 申込の申込履歴の件数(id)]));
  note(`ケースの始めの申込状況: ${ids.map((id) => `申込ID ${id}=${初期状況[id]}`).join("、")}`);
  履歴の注記(初期件数);
  const b = await 試験管理者で開く(page);
  await step(1, async () => { await 検索する(b, "006"); });
  await step(2, async () => {
    expect(await b.チェックされた行.count(), "チェックした申込の数").toBe(0);
    await b.一括編集を開く();
  });
  await step(3, async () => { await b.申込状況を選ぶ("申込済み"); await 更新して閉じる(b); });
  const 状況: Record<string, string> = {}; const 件数: Record<string, number> = {};
  await step(4, async () => { for (const id of ids) { 状況[id] = 申込の申込状況(id); 件数[id] = 申込の申込履歴の件数(id); } });
  await expected(async () => {
    for (const id of ids) {
      expect.soft(状況[id], `申込ID ${id} の申込状況（始めと同じ）`).toBe(初期状況[id]);
      expect.soft(件数[id], `申込ID ${id} の申込履歴の件数（始めと同じ）`).toBe(初期件数[id]);
    }
  });
});

// ---- 007・008: 1件をチェックして更新したときの応答と画面 ----

caseTest("IT-M13-07-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔申込ID-M1307-007〕");
  const b = await 試験管理者で開く(page);
  await step(1, async () => { await 検索する(b, "007"); });
  await step(2, async () => { await b.チェックする(id); });
  let 押した: 更新を押した結果 | undefined;
  await step(3, async () => {
    await b.一括編集を開く();
    await b.申込状況を選ぶ("申込済み");
    押した = await 更新して閉じる(b);
  });
  await expected(async () => {
    const r = 押した!;
    expect.soft(r.応答 !== null, "一括更新の要求が送られ、応答があった").toBe(true);
    expect.soft(r.応答?.status ?? 0, "一括更新の応答の状態（成功）").toBe(200);
    let 応答の文 = "";
    try { const j = JSON.parse(r.応答?.本文 ?? "") as { message?: string[] }; 応答の文 = (j.message ?? []).join("\n"); } catch { /* JSON でない */ }
    expect.soft(r.文.trim(), "表示されたダイアログの文").not.toBe("");
    expect.soft(r.文, "表示されたダイアログの文が、一括更新の応答のメッセージ").toBe(応答の文);
  });
});

caseTest("IT-M13-07-008", async ({ page, notes, step, expected, capture }) => {
  const id = notes.get("〔申込ID-M1307-008〕");
  const b = await 試験管理者で開く(page);
  const 印 = `m1307-008-${Date.now()}`;
  await step(1, async () => { await 検索する(b, "008"); });
  await step(2, async () => {
    expect(await b.行の申込状況(id), `画面上の申込ID ${id} の申込状況`).toBe("決済中");
    await b.チェックする(id);
  });
  let 押した: 更新を押した結果 | undefined;
  await step(3, async () => {
    await b.印を付ける(印);
    await b.一括編集を開く();
    await b.申込状況を選ぶ("申込済み");
    押した = await b.更新を押す();
    note(`「更新」を押すと、ダイアログ「${押した.文}」が出た（一括更新の応答: ${押した.応答 ? `${押した.応答.status}` : "要求は送られていない"}）`);
  });
  let 移った = true;
  await step(4, async () => { 移った = (await 押した!.閉じる()).画面が移った; });
  await expected(async () => {
    expect.soft(移った, "ダイアログを閉じたあと画面が移った（再読み込みを含む）").toBe(false);
    expect.soft(await b.印が残っているか(印), "更新を押す前の画面がそのまま残っている（移動・再読み込みが無い）").toBe(true);
    await expect.soft(b.入力領域, "一括編集の入力領域が開いたまま").toBeVisible();
    const 行の状況 = await b.行の申込状況(id).catch((e: Error) => `（読めない: ${e.message}）`);
    expect.soft(行の状況, `一覧上の申込ID ${id} の申込状況`).toBe("決済中");
    const 行 = (await b.行を読む(id))?.行;
    if (行) { await 行.scrollIntoViewIfNeeded().catch(() => undefined); await capture("確かめた申込の行"); }
  });
});

// ---- 009・010: 非同期でない（通常のフォームの）送信 ----

async function 通常のフォームで送るまで(b: BulkEditPage, n: string, id: string, step: (n: number, body: () => Promise<void>) => Promise<void>): Promise<一括更新の応答> {
  await step(1, async () => {
    await 検索する(b, n);
    expect(await b.行を読む(id), `検索結果に申込ID ${id} の行がある`).toBeDefined();
    await b.一括編集を開く();
  });
  await step(2, async () => { await b.申込状況を選ぶ("申込済み"); });
  let r: 一括更新の応答 = { status: 0, 本文: "" };
  await step(3, async () => { r = await b.通常のフォームで送る([id]); 応答の注記(r); });
  return r;
}

caseTest("IT-M13-07-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔申込ID-M1307-009〕");
  const b = await 試験管理者で開く(page);
  const r = await 通常のフォームで送るまで(b, "009", id, step);
  let 表示 = "";
  await step(4, async () => { 表示 = (await page.locator("body").innerText().catch(() => "")).trim(); });
  await expected(async () => {
    expect.soft(r.status, "非同期でない送信への応答の状態（失敗＝400以上）").toBeGreaterThanOrEqual(400);
    expect.soft(r.status, "非同期でない送信への応答の状態（失敗＝500未満。アプリの異常でない）").toBeLessThan(500);
    expect.soft(表示, "ブラウザに表示された応答（メッセージがある）").toMatch(/"message"\s*:/);
  });
});

caseTest("IT-M13-07-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔申込ID-M1307-010〕");
  const 初期 = 申込の申込履歴の件数(id);
  履歴の注記({ [id]: 初期 });
  const b = await 試験管理者で開く(page);
  await 通常のフォームで送るまで(b, "010", id, step);
  let 状況 = ""; let 件数 = -1;
  await step(4, async () => { 状況 = 申込の申込状況(id); 件数 = 申込の申込履歴の件数(id); });
  await expected(async () => {
    note("「1件のまま」は、シードの代えで始めの件数が2件のため、始めの件数から変わらないことで確かめた");
    expect.soft(状況, `申込ID ${id} の申込状況`).toBe("決済中");
    expect.soft(件数, `申込ID ${id} の申込履歴の件数（始め ${初期}件のまま）`).toBe(初期);
  });
});

// ---- 015: 1件だけチェックして申込履歴が1件増える ----

caseTest("IT-M13-07-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔申込ID-M1307-015〕");
  const 初期 = 申込の申込履歴の件数(id);
  履歴の注記({ [id]: 初期 });
  const b = await 試験管理者で開く(page);
  await step(1, async () => { await 検索する(b, "015"); });
  await step(2, async () => {
    await b.チェックする(id);
    expect(await b.チェックされた行.count(), "チェックした申込の数").toBe(1);
  });
  await step(3, async () => { await b.一括編集を開く(); await b.申込状況を選ぶ("申込済み"); await 更新して閉じる(b); });
  let 件数 = -1;
  await step(4, async () => { 件数 = 申込の申込履歴の件数(id); });
  await expected(async () => {
    note(`「2件となる」は、シード表の始めの1件に1件足した数。シードの代えで始めの件数が ${初期}件のため、始めの件数に1件足した数で確かめた`);
    expect.soft(件数 - 初期, `申込ID ${id} の申込履歴の増えた件数（始め ${初期}件）`).toBe(1);
  });
});

// ---- 014: QK連携（一括編集でキャンセル済みにした申込がマイイベント・デッキ登録から消える） ----

async function 別のブラウザ(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  const p = await ctx.newPage();
  p.setDefaultTimeout(60_000);
  return { page: p, close: () => ctx.close() };
}

caseTest("IT-M13-07-014", async ({ page, browser, notes, step, expected, capture }) => {
  const m = QK会員();
  const 名 = QKイベント名();
  const id = notes.get("〔申込ID-M1307-QK001〕");
  const A = new EventHistoryPage(page);
  const B = await 別のブラウザ(browser);
  try {
    let 前の件数 = 0; let 前の日時 = "";
    await step(1, async () => {
      await A.ログインする(m.メール, m.パスワード);
      await A.開く();
      前の件数 = await イベントのカード(page, 名).count();
      前の日時 = 前の件数 ? await カードの開催日時(イベントのカード(page, 名)) : "";
    });
    await step(2, async () => { await loginAdmin(B.page, QK1302_ADMIN); });
    const b = new BulkEditPage(B.page);
    await step(3, async () => {
      const r = await b.イベント名で検索する(名);
      note(`ブラウザBでイベント名「${名}」（実行の印つき）を入れて検索した。店舗「${r.店舗.join("・") || "指定なし"}」・開始時間(From)「${r.開始時間From}」は初期表示のまま`);
    });
    await step(4, async () => {
      await b.チェックする(id);
      await b.一括編集を開く();
      await b.申込状況を選ぶ("キャンセル済み");
      await 更新して閉じる(b);
      await B.page.screenshot().then((buf) => test.info().attach("ブラウザBの更新後の画面", { body: buf, contentType: "image/png" }));
    });
    let 後の本文 = "";
    await step(5, async () => { await A.開く(); 後の本文 = await 画面の本文(page); await capture("ブラウザAのマイイベント・デッキ登録（更新後）"); });
    await expected(async () => {
      expect.soft(前の件数, `手順1の一覧のイベント名「${名}」のカードの数`).toBe(1);
      note(`手順1の一覧の開催日時の表示: 「${前の日時}」（日時の値で比べた）`);
      const mm = /^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})$/.exec(前の日時);
      const 値 = mm ? `${mm[1]}年${Number(mm[2])}月${Number(mm[3])}日${mm[4].padStart(2, "0")}時${mm[5]}分` : 前の日時;
      expect.soft(値, "手順1の一覧の開催日時").toBe("2030年10月23日10時00分");
      await expect.soft(イベントのカード(page, 名), `手順5の一覧のイベント名「${名}」のカード`).toHaveCount(0);
      expect.soft(後の本文.includes("予約済みの大会はありません。"), "手順5の一覧に「予約済みの大会はありません。」と表示される").toBe(true);
    });
  } finally {
    await B.close();
  }
});
