/**
 * F06-14 マイイベント・デッキ登録（続き）。正本: cases/F06-14_test_cases.tsv
 * 実装するのは、イベントの申込・デッキを画面から作れる 001〜017・019・020・023・031〜039・041・042（先の spec は 021・022・024〜026）。
 * 実装しない: 018（130大会の専用IDをDBで作り直すシード）・027（申込状態のマスタをDBで直接作るシード）。
 * 記録 review/F06-14_progress_2026-11-08.md
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { マイイベント } from "../../pages/front/f06_14_b_event_history";
import { 会員一覧, 大会一覧 } from "../../seeds/f06-14-b";
import "../../seeds/f06-14-b";

const 補い = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 支払い会員の補い = () => 補い("支払い会員は画面で指定できずDBでしか設定できないため設定していない（開発用のデータをDBで書き換えない決まり。参加者は画面で登録した）");
const 締切の秒の補い = () => 補い("デッキ登録締切の秒（23:59:59の59秒）は画面で指定できずDBでしか設定できないため、画面で指定できる23:59にした");
const 本店の補い = () => 補い("開催店舗の「本店」は、手元のDBの親店舗の表示名（Hareruya）で登録した");

const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string, 符号 = n) => { const d = 大会一覧.get(n)?.get(符号); if (!d) throw new Error(`大会 ${n}/${符号} が作られていない`); return d; };

async function ログインする(page: Page, n: string): Promise<マイイベント> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  if (Number(n) <= 26) 補い("正本のパスワード（F0614Pw0NN!）は11文字で、会員登録の最小12文字に満たないため、末尾に1文字足した");
  const e = new マイイベント(page);
  await e.ログインする(会員(n).メール, 会員(n).パスワード);
  return e;
}
/** マイイベント・デッキ登録画面を開き、一覧（またはゼロ件の案内）が出るまで待つ */
async function 一覧を開く(e: マイイベント): Promise<void> {
  await e.開く();
  await expect(e.行すべて.first().or(e.ゼロ件案内).first(), "一覧またはゼロ件の案内の表示").toBeVisible({ timeout: 60_000 });
}

// ---- 一覧に出るイベント・順序・件数 ----
caseTest("IT-F06-14-001", async ({ page, step, expected }) => {
  const e = await ログインする(page, "001");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  支払い会員の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(名, "表示されたイベント名に「本人申込大会-001」がある").toContain(大会("001", "001A").名);
    expect.soft(名, "表示されたイベント名に「他会員申込大会-001」がない").not.toContain(大会("001", "001B").名);
    expect.soft(名, "表示されたイベント名に「キャンセル大会-001」がない").not.toContain(大会("001", "001C").名);
  });
});
caseTest("IT-F06-14-002", async ({ page, step, expected }) => {
  const e = await ログインする(page, "002");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(名, "申込がなくデッキだけの「デッキのみ大会-002」が一覧にある").toContain(大会("002").名); });
});
caseTest("IT-F06-14-003", async ({ page, step, expected }) => {
  const e = await ログインする(page, "003");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  本店の補い();
  await expected(async () => {
    expect.soft(名, "表示順（開催日時の降順）").toEqual([大会("003", "003B").名, 大会("003", "003C").名, 大会("003", "003A").名]);
  });
});

// ---- 処理状態 ----
caseTest("IT-F06-14-004", async ({ page, step, expected }) => {
  const e = await ログインする(page, "004");
  const 行 = e.行(大会("004").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await e.処理状態(行); });
  本店の補い();
  await expected(async () => { expect.soft(状態, "「当日開催大会-004」の処理状態（申込状態の名称）").toBe("申込完了"); });
});
caseTest("IT-F06-14-005", async ({ page, step, expected }) => {
  const e = await ログインする(page, "005");
  const 行 = e.行(大会("005").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await e.処理状態(行); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "「前日決済中大会-005」の処理状態").toBe("イベント終了"); });
});
caseTest("IT-F06-14-006", async ({ page, step, expected }) => {
  const e = await ログインする(page, "006");
  const 行 = e.行(大会("006").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await e.処理状態(行); });
  本店の補い();
  await expected(async () => { expect.soft(状態, "「翌日決済中大会-006」の処理状態").toBe("決済中"); });
});
caseTest("IT-F06-14-007", async ({ page, step, expected }) => {
  const e = await ログインする(page, "007");
  const 行 = e.行(大会("007").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 遷移先: Page = page;
  await step(2, async () => { 遷移先 = await e.ヘルプを押す(行); });
  本店の補い();
  await expected(async () => {
    expect.soft(new URL(遷移先.url()).pathname, "遷移したヘルプ画面").toMatch(/\/help\//);
    expect.soft(遷移先.url(), "遷移したヘルプ画面（決済中の項目へ）").toContain("#block4");
  });
});
caseTest("IT-F06-14-008", async ({ page, step, expected }) => {
  const e = await ログインする(page, "008");
  const 行 = e.行(大会("008").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await e.処理状態(行); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(状態, "「翌日申込完了大会-008」の処理状態の欄が表示されている").not.toBeNull();
    expect.soft(await e.ヘルプ(行).count(), "「翌日申込完了大会-008」のヘルプの数").toBe(0);
  });
});
caseTest("IT-F06-14-009", async ({ page, step, expected }) => {
  const e = await ログインする(page, "009");
  const 行 = e.行(大会("009").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await e.処理状態(行); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "「デッキのみ大会-009」の処理状態").toBe("未登録"); });
});
caseTest("IT-F06-14-010", async ({ page, step, expected }) => {
  const e = await ログインする(page, "010");
  const 行 = e.行(大会("010").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状況: string | null = null;
  await step(2, async () => { 状況 = await e.デッキ登録状況(行); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(状況, "「デッキのみ大会-010」のデッキ登録状況").toBe("登録済み"); });
});

// ---- デッキ登録/編集の導線 ----
caseTest("IT-F06-14-012", async ({ page, step, expected }) => {
  const e = await ログインする(page, "012");
  const d = 大会("012");
  const 行 = e.行(d.名);
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.押して遷移する(e.デッキ登録編集のボタン(行).filter({ hasText: "デッキ編集" })); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（大会デッキ登録編集）").toBe(`/ja/deckentry/${d.日程ID}/edit`);
    expect.soft(await page.locator(".p-hareruya-deckentry-edit__event-title").first().innerText().catch(() => ""), "大会デッキ登録編集画面の大会名").toContain(d.名);
  });
});
caseTest("IT-F06-14-013", async ({ page, step, expected }) => {
  const e = await ログインする(page, "013");
  const d = 大会("013");
  const 行 = e.行(d.名);
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.押して遷移する(e.デッキ登録編集のボタン(行).filter({ hasText: "デッキ登録" })); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（大会デッキ登録編集）").toBe(`/ja/deckentry/${d.日程ID}/edit`);
    expect.soft(await page.locator(".p-hareruya-deckentry-edit__event-title").first().innerText().catch(() => ""), "大会デッキ登録編集画面の大会名").toContain(d.名);
  });
});

// ---- デッキ登録状況・ボタンが出ない場合 ----
async function デッキ項目が出ない(e: マイイベント, n: string): Promise<{ 状況: string | null; ボタン数: number }> {
  const 行 = e.行(大会(n).名);
  await expect(行, `「${大会(n).名}」の行の表示`).toBeVisible({ timeout: 30_000 });
  const 処理状態 = await e.処理状態(行);
  test.info().annotations.push({ type: "手順の注記", description: `一覧の処理状態の表示は「${処理状態}」だった` });
  return { 状況: await e.デッキ登録状況(行), ボタン数: await e.デッキ登録編集のボタン(行).count() };
}
function デッキ項目なし(n: string, 見出し: string, 補う: () => void) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
  const e = await ログインする(page, n);
  await step(1, async () => { await 一覧を開く(e); });
  let r = { 状況: null as string | null, ボタン数: -1 };
  await step(2, async () => { r = await デッキ項目が出ない(e, n); });
  補う(); 本店の補い();
  await expected(async () => {
    expect.soft(r.状況, `${見出し}のデッキ登録状況の欄`).toBeNull();
    expect.soft(r.ボタン数, `${見出し}のデッキ登録/編集ボタンの数`).toBe(0);
  });
  };
}
caseTest("IT-F06-14-014", デッキ項目なし("014", "「前日決済中大会-014」", 締切の秒の補い));
caseTest("IT-F06-14-015", デッキ項目なし("015", "「締切超過大会-015」", 締切の秒の補い));
caseTest("IT-F06-14-016", デッキ項目なし("016", "「登録終了大会-016」", 締切の秒の補い));
caseTest("IT-F06-14-017", デッキ項目なし("017", "「デッキ対象外大会-017」", () => undefined));

caseTest("IT-F06-14-019", async ({ page, step, expected }) => {
  const e = await ログインする(page, "019");
  await step(1, async () => { await 一覧を開く(e); });
  本店の補い();
  await expected(async () => {
    expect.soft(await e.見出し行.count(), "一覧の見出し行の数").toBe(0);
    expect.soft(await e.行すべて.count(), "イベント行の数").toBe(0);
    expect.soft(await e.ゼロ件案内.count(), "0件案内の表示").toBeGreaterThan(0);
    expect.soft(e.path, "留まっている画面（マイイベント・デッキ登録）").toBe("/ja/mypage/event_history");
  });
});
caseTest("IT-F06-14-020", async ({ page, step, expected }) => {
  const e = await ログインする(page, "020");
  const 行 = e.行(大会("020").名);
  await step(1, async () => { await 一覧を開く(e); });
  let 表示: string[] = [];
  await step(2, async () => { 表示 = await e.フォーマットの表示(行); });
  本店の補い();
  await expected(async () => {
    expect.soft(表示, "フォーマットのアイコンに略称「STD」がある").toContain("STD");
    expect.soft(表示, "フォーマットのアイコンに略称「MOD」がある").toContain("MOD");
  });
});
caseTest("IT-F06-14-023", async ({ page, step, expected }) => {
  const e = await ログインする(page, "023");
  const d = 大会("023");
  const 行 = e.行(d.名);
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.押して遷移する(e.イベント名のリンク(行)); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（イベント詳細）").toBe(`/ja/events/${d.日程ID}/detail`);
    expect.soft((await page.locator("body").innerText()).includes(d.名), "イベント詳細画面に「デッキのみ大会-023」の大会名がある").toBe(true);
  });
});

// ---- 複数種類が混ざる一覧・件数 ----
caseTest("IT-F06-14-031", async ({ page, step, expected }) => {
  const e = await ログインする(page, "031");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  支払い会員の補い(); 締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(名, "表示順（開催日時の降順）の3件").toEqual([大会("031", "031C").名, 大会("031", "031B").名, 大会("031", "031A").名]);
  });
});
caseTest("IT-F06-14-032", async ({ page, step, expected }) => {
  const e = await ログインする(page, "032");
  let 名: string[] = [];
  let ラベル: number | null = null;
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); ラベル = await e.件数ラベル(); });
  支払い会員の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(名, "一覧に表示された2行（件数確認大会F0614-032AとB）").toEqual([大会("032", "032B").名, 大会("032", "032A").名]);
    expect.soft(名, "キャンセルの「件数確認キャンセル大会-032」は表示されない").not.toContain(大会("032", "032C").名);
    expect.soft(ラベル, "件数ラベルの件数").toBe(2);
  });
});
async function 状態を読む(e: マイイベント, n: string, 英語 = false): Promise<string | null> {
  const 名 = 英語 ? 大会(n).英名 : 大会(n).名;
  const 行 = e.行(名);
  await expect(行, `「${名}」の行の表示`).toBeVisible({ timeout: 30_000 });
  return e.処理状態(行);
}
caseTest("IT-F06-14-033", async ({ page, step, expected }) => {
  const e = await ログインする(page, "033");
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await 状態を読む(e, "033"); });
  支払い会員の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "「前日申込完了大会-033」の処理状態").toBe("イベント終了"); });
});

// ---- 英語表示 ----
caseTest("IT-F06-14-034", async ({ page, step, expected }) => {
  const e = await ログインする(page, "034");
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.英語に切り替える(); });
  let 状態: string | null = null;
  await step(3, async () => { 状態 = await 状態を読む(e, "034", true); });
  支払い会員の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "英語表示の「English Paying Event-F0614-034」の処理状態").toBe("Proceeding Payment"); });
});
caseTest("IT-F06-14-035", async ({ page, step, expected }) => {
  const e = await ログインする(page, "035");
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.英語に切り替える(); });
  let 吹き出し = { 表示: false, 文: "" };
  await step(3, async () => {
    const 行 = e.行(大会("035").英名);
    await expect(行, "英語表示の行の表示").toBeVisible({ timeout: 30_000 });
    吹き出し = await e.ヘルプのツールチップ(行);
  });
  支払い会員の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(吹き出し.表示, "ヘルプアイコンのツールチップの表示").toBe(true);
    expect.soft(吹き出し.文, "ツールチップの文").toBe("Your payment procedure has been interrupted or suspended. Please try your registration 30 minutes after.");
  });
});
caseTest("IT-F06-14-036", async ({ page, step, expected }) => {
  const e = await ログインする(page, "036");
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { await e.英語に切り替える(); });
  let 状態: string | null = null;
  await step(3, async () => { 状態 = await 状態を読む(e, "036", true); });
  支払い会員の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "英語表示の「English Finished Event-F0614-036」の処理状態").toBe("Event Finished"); });
});

// ---- 組み合わせ ----
caseTest("IT-F06-14-037", async ({ page, step, expected }) => {
  const e = await ログインする(page, "037");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  支払い会員の補い(); 締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(名, "申込とデッキ登録の両方がある「申込デッキ大会F0614-CB037」が一覧にある").toContain(大会("037").名); });
});
caseTest("IT-F06-14-038", async ({ page, step, expected }) => {
  const e = await ログインする(page, "038");
  let 名: string[] = [];
  await step(1, async () => { await 一覧を開く(e); });
  await step(2, async () => { 名 = await e.表示されたイベント名(); });
  支払い会員の補い(); 締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(名, "申込だけでデッキ登録のない「申込のみ大会F0614-CB038」が一覧にある").toContain(大会("038").名); });
});
caseTest("IT-F06-14-039", async ({ page, step, expected }) => {
  const e = await ログインする(page, "039");
  await step(1, async () => { await 一覧を開く(e); });
  let 状態: string | null = null;
  await step(2, async () => { 状態 = await 状態を読む(e, "039"); });
  締切の秒の補い(); 本店の補い();
  await expected(async () => { expect.soft(状態, "「デッキのみ前日大会F0614-CB039」の処理状態").toBe("イベント終了"); });
});
caseTest("IT-F06-14-041", async ({ page, step, expected }) => {
  const e = await ログインする(page, "041");
  const d = 大会("041");
  const 行 = e.行(d.名);
  await step(1, async () => { await 一覧を開く(e); });
  let 状況: string | null = null;
  let ボタン = "";
  await step(2, async () => {
    await expect(行, "「デッキ項目表示大会F0614-CB041」の行の表示").toBeVisible({ timeout: 30_000 });
    状況 = await e.デッキ登録状況(行);
    ボタン = ((await e.デッキ登録編集のボタン(行).first().innerText().catch(() => "")) ?? "").trim();
  });
  支払い会員の補い(); 締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(状況, "デッキ登録状況").toBe("デッキ未登録");
    expect.soft(ボタン, "デッキ登録/編集のボタン").toBe("デッキ登録");
  });
});
caseTest("IT-F06-14-042", async ({ page, step, expected }) => {
  const e = await ログインする(page, "042");
  await step(1, async () => { await 一覧を開く(e); });
  let r = { 状況: null as string | null, ボタン数: -1 };
  await step(2, async () => { r = await デッキ項目が出ない(e, "042"); });
  支払い会員の補い(); 締切の秒の補い(); 本店の補い();
  await expected(async () => {
    expect.soft(r.状況, "「デッキ項目非表示終了大会F0614-CB042」のデッキ登録状況の欄").toBeNull();
    expect.soft(r.ボタン数, "デッキ登録/編集ボタンの数").toBe(0);
  });
});
