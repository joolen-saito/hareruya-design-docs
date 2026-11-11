/**
 * M08-07 メール送信履歴（メール配信履歴画面）。流せる見込みのケース（実施不可でないもの＋仕分け直し recheck2）。正本: cases/M08-07_test_cases.tsv
 * 画面: 会員検索一覧(検索結果)の「メール履歴」アイコン → メール配信履歴画面（/customer/mail/{会員ID}/history。pages/admin/m08_05_07.ts）。
 * テンプレートA・Bは、開発環境に既にあるメールテンプレートで読み替える（seeds/m08-07.ts の テンプレートAB。全員が使うテンプレートを足さない）。
 * メール受信確認画面の代わりに、開発環境のメールの受け口（E2E_MAIL_URL）を読む（pages/admin/m05_06_mailbox.ts。読むだけ）。
 * シード: seeds/m08-07.ts。記録: review/M08-07_progress_2026-11-11_dev.md
 */
import { Page, test } from "@playwright/test";
import { メール履歴, メールテンプレートの件名 } from "../../db/m08_05_07";
import { CaseBody, expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 受け口を控える, 届いたメール } from "../../pages/admin/m05_06_mailbox";
import { searchCustomer } from "../../pages/admin/f06_customer";
import { MailHistoryPage, メール履歴のアイコンを押す } from "../../pages/admin/m08_05_07";
import { markedMail } from "../../seeds/f06-member";
import { M0807_ADMIN, テンプレートAB, 共有の会員の } from "../../seeds/m08-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
const 件名A = ["送信時件名A-2", "送信時件名B-1", "送信時件名A-1", "テンプレート未指定履歴"];
type 一覧 = Awaited<ReturnType<MailHistoryPage["一覧"]>>;

async function signIn(page: Page): Promise<MailHistoryPage> { await loginAdmin(page, M0807_ADMIN); return new MailHistoryPage(page); }
async function 開く(page: Page, 会員ID: string): Promise<MailHistoryPage> {
  const h = await signIn(page);
  expect((await h.開く(会員ID))?.status(), "メール配信履歴画面の応答").toBe(200);
  return h;
}
function テンプレートの注記(): void {
  const { A, B } = テンプレートAB();
  note(`テンプレートA・Bは、開発環境に既にあるテンプレートで読み替えた（A＝ID ${A.ID}「${A.名前}」、B＝ID ${B.ID}「${B.名前}」。条件付き）`);
}

// ---- 一覧の表示 ----

caseTest("IT-M08-07-001", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0807-共有A〕");
  let rows: 一覧 = [];
  await signIn(page);
  await step(1, async () => { await searchCustomer(page, 共有の会員の("A").メール); note("会員検索一覧(検索結果)は、会員Aのメールアドレスで検索して開いた"); });
  await step(2, async () => {
    await メール履歴のアイコンを押す(page, 会員ID);
    rows = await new MailHistoryPage(page).一覧();
    note(`移った先: ${path(page)} / 一覧の件名: ${rows.map((r) => r.件名).join("、")}`);
  });
  await expected(async () => {
    expect.soft(path(page), `会員ID ${会員ID} のメール配信履歴画面`).toMatch(new RegExp(`/customer/mail/${会員ID}/history/?$`));
    expect.soft(rows.map((r) => r.件名).sort(), "会員Aに紐づく4件だけが表示される").toEqual([...件名A].sort());
  });
});

caseTest("IT-M08-07-002", async ({ page, notes, step, expected }) => {
  let rows: 一覧 = []; let h: MailHistoryPage; let 選択 = "";
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); });
  await step(2, async () => { rows = await h.一覧(); 選択 = await h.絞り込みの選ばれている値(); note(`絞り込みの値: 「${選択}」 / 件名: ${rows.map((r) => r.件名).join("、")}`); });
  await expected(async () => {
    expect.soft(選択, "テンプレートを選択していない初期表示").toBe("");
    expect.soft(rows.map((r) => r.件名).sort(), "会員Aに紐づく4件がすべて表示される").toEqual([...件名A].sort());
  });
});

caseTest("IT-M08-07-003", async ({ page, notes, step, expected }) => {
  let opts: { 値: string; 名前: string }[] = []; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); テンプレートの注記(); });
  await step(2, async () => { opts = await h.絞り込みの選択肢(); note(`選択肢の数: ${opts.length}（先頭: ${opts.slice(0, 4).map((o) => `${o.値}:${o.名前}`).join("、")}）`); });
  await expected(async () => {
    const 値 = opts.map((o) => o.値);
    expect.soft(値, "テンプレートAを選択できる").toContain(notes.get("〔テンプレートID-M0807-共有A〕"));
    expect.soft(値, "テンプレートBを選択できる").toContain(notes.get("〔テンプレートID-M0807-共有B〕"));
  });
});

caseTest("IT-M08-07-004", async ({ page, notes, step, expected }) => {
  let rows: 一覧 = []; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); });
  await step(2, async () => { rows = await h.一覧(); note(`件名（上から）: ${rows.map((r) => `${r.件名}（${r.処理日}）`).join("、")}`); });
  await expected(async () => { expect(rows.map((r) => r.件名), "件名が処理日の降順").toEqual(件名A); });
});

function 絞り込む(k: "A" | "B", 件名: string[], 選択を確かめる: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let rows: 一覧 = []; let h: MailHistoryPage; let 選択 = "";
    const tid = notes.get(`〔テンプレートID-M0807-共有${k}〕`);
    await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); テンプレートの注記(); });
    await step(2, async () => {
      const moved = await h.絞り込みを選ぶ(tid);
      選択 = await h.絞り込みの選ばれている値(); rows = await h.一覧();
      note(`テンプレート${k}を選んだ（追加のボタン操作なし）。画面の読み込み直し: ${moved ? "あり" : "なし"} / 選ばれている値: ${選択} / 件名: ${rows.map((r) => r.件名).join("、")}`);
    });
    if (!選択を確かめる) await step(3, async () => { rows = await h.一覧(); note(`一覧の件名: ${rows.map((r) => r.件名).join("、")}`); });
    await expected(async () => {
      expect.soft(rows.map((r) => r.件名), `テンプレート${k}を使用した履歴だけ`).toEqual(件名);
      if (選択を確かめる) expect.soft(選択, "画面更新後もテンプレートBが選択された状態").toBe(tid);
    });
  };
}
caseTest("IT-M08-07-005", 絞り込む("A", ["送信時件名A-2", "送信時件名A-1"], false));
caseTest("IT-M08-07-006", 絞り込む("B", ["送信時件名B-1"], true));

caseTest("IT-M08-07-007", async ({ page, notes, step, expected }) => {
  let rows: 一覧 = []; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); });
  await step(2, async () => { rows = await h.一覧(); note(`「テンプレート未指定履歴」の行: ${JSON.stringify(rows.find((r) => r.件名 === "テンプレート未指定履歴"))}`); });
  await expected(async () => { expect(rows.find((r) => r.件名 === "テンプレート未指定履歴")?.通知メール, "通知メール欄").toBe("テンプレート無し"); });
});

caseTest("IT-M08-07-008", async ({ page, notes, step, expected }) => {
  let pop = { 件名: "", 本文: "" }; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); });
  await step(2, async () => { pop = await h.件名を押す("送信時件名A-2"); note(`ポップアップ: ${JSON.stringify(pop)}`); });
  await expected(async () => {
    expect.soft(pop.件名, "ポップアップの件名").toBe("送信時件名A-2");
    expect.soft(pop.本文, "ポップアップの本文").toBe("本文A-2");
  });
});

caseTest("IT-M08-07-009", async ({ page, notes, step, expected }) => {
  let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); });
  await step(2, async () => { await h.件名を押す("送信時件名A-2"); });
  await step(3, async () => { await h.ポップアップを閉じる(); });
  await expected(async () => { await expect(h.開いているポップアップ, "表示されていたポップアップが非表示になる").toHaveCount(0); });
});

caseTest("IT-M08-07-010", async ({ page, notes, step, expected }) => {
  let rows: 一覧 = []; let h: MailHistoryPage; let 現在の件名 = "";
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-共有A〕")); テンプレートの注記(); });
  await step(2, async () => {
    rows = await h.一覧();
    現在の件名 = メールテンプレートの件名(notes.get("〔テンプレートID-M0807-共有A〕"));
    note(`「送信時件名A-2」の行: ${JSON.stringify(rows.find((r) => r.件名 === "送信時件名A-2"))}。「現在のテンプレートA件名」は、読み替えたテンプレートAのいまの件名「${現在の件名}」で読み替えた`);
  });
  await expected(async () => {
    const r = rows.find((x) => x.件名 === "送信時件名A-2");
    expect.soft(r?.通知メール, "通知メール欄にテンプレートAの現在の件名").toBe(現在の件名);
    expect.soft(r?.件名, "件名欄に送信時に保持した件名").toBe("送信時件名A-2");
  });
});

caseTest("IT-M08-07-011", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let status = 0;
  await step(1, async () => { status = (await h.開く("999999"))?.status() ?? 0; note(`会員ID 999999 のメール配信履歴画面の応答: ${status}`); });
  await expected(async () => {
    expect.soft(status, "ページが見つからない扱い（404）").toBe(404);
    expect.soft(await h.絞り込み.count(), "絞り込み欄が表示されない").toBe(0);
    expect.soft(await page.locator("#pointHistory").count(), "メール配信履歴の一覧が表示されない").toBe(0);
  });
});

caseTest("IT-M08-07-012", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔会員ID-M0807-共有A〕"), b = notes.get("〔会員ID-M0807-共有B〕");
  const 前 = [...メール履歴(a), ...メール履歴(b)];
  let 後: typeof 前 = []; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, a); });
  await step(2, async () => { await h.絞り込みを選ぶ(notes.get("〔テンプレートID-M0807-共有B〕")); });
  await step(3, async () => { await h.件名を押す("送信時件名B-1"); });
  await step(4, async () => { await h.ポップアップを閉じる(); });
  await step(5, async () => { 後 = [...メール履歴(a), ...メール履歴(b)]; note(`操作の前後のメール履歴（会員A・B）: 前 ${前.length} 件・後 ${後.length} 件`); });
  await expected(async () => {
    expect.soft(前.length, "S-M08-07-HISTORIES の件数（操作前）").toBe(5);
    expect.soft(後, "件数・会員・テンプレート・処理日・件名・本文が操作前から変わらない").toEqual(前);
  });
});

// ---- 単独の会員 ----

caseTest("IT-M08-07-015", async ({ page, notes, step, expected }) => {
  let rows: 一覧 = []; let h: MailHistoryPage;
  await step(1, async () => { h = await 開く(page, notes.get("〔会員ID-M0807-015〕")); });
  await step(2, async () => { rows = await h.一覧(); note(`行: ${JSON.stringify(rows)}`); });
  await expected(async () => { expect(rows.find((r) => r.件名 === "M0807-015-件名")?.処理日, "処理日欄").toBe("2026/03/07"); });
});

function 届かない(n: "016" | "017"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const 会員ID = notes.get(`〔会員ID-M0807-${n}〕`);
    const メール = markedMail(`m0807-${n}-a`);
    let 控え = new Set<number>(); let h: MailHistoryPage; let 届いた = -1;
    await step(1, async () => {
      控え = await 受け口を控える();
      note(`メール受信箱は消さない（ほかの方の試験のメールも入っているため）。手順の前に受け口の番号を控え、そのあとに ${メール} あてに届いたものを数える（条件付き）`);
      h = await 開く(page, 会員ID);
    });
    if (n === "016") {
      await step(2, async () => { await h.件名を押す("M0807-016-件名"); });
      await step(3, async () => { await h.ポップアップを閉じる(); });
      await step(4, async () => { 届いた = (await 届いたメール(メール, 控え, 0, 15)).length; note(`手順のあとに ${メール} あてに届いたメール: ${届いた} 通`); });
    } else {
      await step(2, async () => { await h.絞り込みを選ぶ(notes.get("〔テンプレートID-M0807-017〕")); テンプレートの注記(); });
      await step(3, async () => { 届いた = (await 届いたメール(メール, 控え, 0, 15)).length; note(`手順のあとに ${メール} あてに届いたメール: ${届いた} 通`); });
    }
    await expected(async () => { expect(届いた, `${メール} あての受信箱が0件のまま（1通も届いていない）`).toBe(0); });
  };
}
caseTest("IT-M08-07-016", 届かない("016"));
caseTest("IT-M08-07-017", 届かない("017"));

function 組み合わせ(n: "018" | "019" | "020" | "021", 選ぶ: "A" | null, 見える: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let rows: 一覧 = []; let h: MailHistoryPage; let 選択 = "";
    await step(1, async () => { h = await 開く(page, notes.get(`〔会員ID-M0807-CB${n}〕`)); テンプレートの注記(); });
    await step(2, async () => {
      if (選ぶ) await h.絞り込みを選ぶ(notes.get(`〔テンプレートID-M0807-CB${n}-A〕`));
      選択 = await h.絞り込みの選ばれている値(); rows = await h.一覧();
      note(`絞り込みの値: 「${選択}」 / 件名: ${rows.map((r) => r.件名).join("、") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(選択, 選ぶ ? "テンプレートAを選択した状態" : "「すべてのメールを表示する」の状態").toBe(選ぶ ? notes.get(`〔テンプレートID-M0807-CB${n}-A〕`) : "");
      if (見える) expect.soft(rows.map((r) => r.件名), `件名「M0807-CB${n}-件名」の履歴が1件表示される`).toEqual([`M0807-CB${n}-件名`]);
      else expect.soft(rows.length, "一覧が0件").toBe(0);
    });
  };
}
caseTest("IT-M08-07-018", 組み合わせ("018", null, true));
caseTest("IT-M08-07-019", 組み合わせ("019", null, true));
caseTest("IT-M08-07-020", 組み合わせ("020", "A", true));
caseTest("IT-M08-07-021", 組み合わせ("021", "A", false));
