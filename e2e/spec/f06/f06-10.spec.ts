/**
 * F06-10 ポイント履歴。正本: cases/F06-10_test_cases.tsv
 * 実装するのは 31件すべて。記録 review/F06-10_progress_*.md
 *
 * テストデータ（seeds/f06-10.ts）: 会員は画面で作り、ポイント履歴（発行日・内容・注文との関連）は画面では指定できないので、
 * 実行の印つきの会員にDBで足した（db/f06_10.ts）。注文（006・008・009）は印つきの商品を会員がフロントで注文して作った。
 * ポイント失効日数（183日）は共有の設定なので書き換えない（アプリの設定の値のまま。有効期限の日付は発行日の183日後）。
 *
 * 解釈したこと:
 * - 画面の表示範囲は「[21 ~ 25 件] 25 件あります」の形で、正本の「21~25件 ／ 25件あります」と区切りの文字が違う。開始・終了・全件の数で比べた。
 * - 画面に「最初」「最後」のリンクは無い（ページ送りは 前・ページ番号・次）。リンクがあれば押し、無ければ押さずに手順の注記を残し、期待結果（移動先のページ）で落とす。
 * - ページ番号のリンクの範囲（6ページ目で3〜9 など）は、画面に出ているページ番号のリンクを数字で読んで比べる。最初のページ・最後のページへのリンクは別に出るので、
 *   「前後3つまで」は最後のページ（全件÷表示件数）のリンクを除いて数える。
 * - 画面の日付は日本語が「2026/8/1」、英語が「08/01/2026」の形。有効期限は発行日の183日後（2026-08-01 → 2027/1/31・01/31/2027）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { MypagePage } from "../../pages/front/f06_05_mypage";
import { HistoryDetailPage } from "../../pages/front/f06_07_history";
import { PointHistoryPage } from "../../pages/front/f06_10_point_history";
import { mailOf, passwordOf, 注文 } from "../../seeds/f06-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pad = (n: number) => String(n).padStart(3, "0");
/** 内容の連番を、新しい順（番号の大きい順）に 上〜下 で */
const 連番の内容 = (接頭: string, n: string, 上: number, 下: number): string[] => {
  const out: string[] = [];
  for (let i = 上; i >= 下; i--) out.push(`${接頭}-${pad(i)}-${n}`);
  return out;
};

async function ログインする(page: CaseCtx["page"], n: string, 前半: string): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), passwordOf(n));
}

/** ページ番号のリンクを押す。リンクが無ければ押さず、手順の注記を残す */
async function ページ番号を押す(h: PointHistoryPage, n: number): Promise<boolean> {
  const ok = await h.ページ番号を押す(n);
  if (!ok) note(`ページ送りにページ番号${n}のリンクが無く、押せなかった（表示されているリンク: ${(await h.ページ番号のリンク()).join("・") || "なし"}）`);
  return ok;
}

// ---- 002 ----
caseTest("IT-F06-10-002", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/point_history"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される（ポイント履歴一覧は表示されない）").toBe(true);
  });
});

// ---- 003 ----
caseTest("IT-F06-10-003", async ({ page, step, expected }) => {
  await ログインする(page, "003", "f0610-003");
  const h = new PointHistoryPage(page);
  let 上部 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 上部 = await h.画面上部の文(); });
  await expected(async () => {
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
    expect.soft(上部, "画面上部にログイン会員の名前「F06試験 会員」が表示されない").not.toMatch(/F06試験/);
  });
});

// ---- 005 ----
caseTest("IT-F06-10-005", async ({ page, step, expected }) => {
  await ログインする(page, "005", "f0610-005");
  const h = new PointHistoryPage(page);
  let 内容: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 内容 = await h.内容を上から(); });
  await expected(async () => {
    expect.soft(内容, "履歴の内容（上から）").toEqual(["HIST-105-005", "HIST-104-005", "HIST-103-005", "HIST-102-005"]);
    expect.soft(内容.some((c) => c.includes("OTHER-201-005")), "他会員の履歴 OTHER-201-005 が表示される").toBe(false);
  });
});

// ---- 006 ----
caseTest("IT-F06-10-006", async ({ page, notes, step, expected }) => {
  await ログインする(page, "006", "f0610-006");
  const h = new PointHistoryPage(page);
  const 行 = h.内容の行("HIST-104-006");
  let 件数 = 0, ポイント = "", 注文番号 = "", 有効期限 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    件数 = await 行.count();
    if (件数 > 0) {
      ポイント = (await h.項目(行.first(), "ポイント")).文;
      注文番号 = (await h.項目(行.first(), "注文番号")).文;
      有効期限 = (await h.項目(行.first(), "有効期限")).文;
    }
  });
  await expected(async () => {
    expect.soft(件数, "内容 HIST-104-006 の履歴行の数").toBe(1);
    expect.soft(ポイント, "ポイント").toBe("+300");
    expect.soft(注文番号, "注文番号").toBe(notes.get("〔注文番号-F0610-006〕"));
    expect.soft(有効期限, "有効期限（発行日 2026-08-01 の183日後）").toBe("2027/1/31");
  });
});

// ---- 007 ----
caseTest("IT-F06-10-007", async ({ page, step, expected }) => {
  await ログインする(page, "007", "f0610-007");
  const h = new PointHistoryPage(page);
  const 行 = h.内容の行("HIST-103-007");
  let 件数 = 0, ポイント = "", 注文番号 = "", 有効期限 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    件数 = await 行.count();
    if (件数 > 0) {
      ポイント = (await h.項目(行.first(), "ポイント")).文;
      注文番号 = (await h.項目(行.first(), "注文番号")).文;
      有効期限 = (await h.項目(行.first(), "有効期限")).文;
    }
  });
  await expected(async () => {
    expect.soft(件数, "内容 HIST-103-007 の履歴行の数").toBe(1);
    expect.soft(ポイント, "ポイント").toBe("-50");
    expect.soft(注文番号, "注文番号（表示されない）").toBe("");
    expect.soft(有効期限, "有効期限（表示されない）").toBe("");
  });
});

// ---- 008 ----
caseTest("IT-F06-10-008", async ({ page, step, expected }) => {
  await ログインする(page, "008", "f0610_smaregi-008");
  const h = new PointHistoryPage(page);
  const 行 = h.内容の行("SMAREGI-HIST-008");
  let 件数 = 0, 注文番号の欄 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    件数 = await 行.count();
    if (件数 > 0) 注文番号の欄 = (await h.項目(行.first(), "注文番号")).文;
  });
  await expected(async () => {
    expect.soft(件数, "内容 SMAREGI-HIST-008 の履歴行の数").toBe(1);
    expect.soft(注文番号の欄, "注文番号の欄にレシート番号が表示される").toBe("SR06100000801");
    expect.soft(注文番号の欄, "注文の注文番号は表示されない").not.toContain(注文("008").番号);
  });
});

// ---- 009 ----
caseTest("IT-F06-10-009", async ({ page, notes, step, expected }) => {
  await ログインする(page, "009", "f0610-009");
  const h = new PointHistoryPage(page);
  const 行 = h.内容の行("HIST-104-009");
  let 開いた: import("@playwright/test").Page | undefined;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 開いた = await h.別タブで押す(h.注文番号のリンク(行.first())); });
  await expected(async () => {
    expect.soft(開いた !== undefined, "注文番号のリンクを押して画面が開く").toBe(true);
    if (!開いた) return;
    const d = new HistoryDetailPage(開いた);
    expect.soft(new URL(開いた.url()).pathname, "開いた画面（購入履歴詳細）").toBe(`/ja/mypage/shopping_history_detail/${notes.get("〔注文ID-F0610-009〕")}`);
    expect.soft(await d.詳細画面である(), "購入履歴詳細画面が表示される").toBe(true);
    expect.soft(await d.値("注文番号"), "注文番号").toBe(notes.get("〔注文番号-F0610-009〕"));
  });
});

// ---- 013 ----
caseTest("IT-F06-10-013", async ({ page, step, expected }) => {
  await ログインする(page, "013", "f0610_page25-013");
  const h = new PointHistoryPage(page);
  let 件数表示 = "", 内容: string[] = [], 範囲: Awaited<ReturnType<PointHistoryPage["表示範囲"]>> = null;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 件数表示 = await h.表示件数(); 内容 = await h.内容を上から(); 範囲 = await h.表示範囲(); });
  await expected(async () => {
    expect.soft(件数表示, "表示件数の初期値").toBe("10");
    expect.soft(内容, "履歴の内容（上から）").toEqual(連番の内容("P25", "013", 25, 16));
    expect.soft([範囲?.開始, 範囲?.終了], `表示範囲（画面の表記: ${範囲?.文 ?? "なし"}）`).toEqual([1, 10]);
    expect.soft(範囲?.全件, "全件数").toBe(25);
  });
});

// ---- 014 ----
caseTest("IT-F06-10-014", async ({ page, step, expected }) => {
  await ログインする(page, "014", "f0610_page25-014");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 2); });
  await step(3, async () => { await h.表示件数を選ぶ(20); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("1");
    expect.soft(await h.表示件数(), "表示件数").toBe("20");
    expect.soft(await h.内容を上から(), "履歴の内容（上から）").toEqual(連番の内容("P25", "014", 25, 6));
  });
});

// ---- 015 ----
caseTest("IT-F06-10-015", async ({ page, step, expected }) => {
  await ログインする(page, "015", "f0610_page25-015");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.表示件数を選ぶ(20); });
  await step(3, async () => { await ページ番号を押す(h, 2); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("2");
    expect.soft(h.query.get("page_count"), "表示件数の指定（アドレス）").toBe("20");
    expect.soft(await h.表示件数(), "表示件数").toBe("20");
    expect.soft(await h.内容を上から(), "履歴の内容（上から）").toEqual(連番の内容("P25", "015", 5, 1));
  });
});

// ---- 016 ----
caseTest("IT-F06-10-016", async ({ page, step, expected }) => {
  await ログインする(page, "016", "f0610_page25-016");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 3); });
  await step(3, async () => { if (!(await h.最初を押す())) note(`ページ送りに「最初」のリンクが無く、押せなかった（リンクの表示: ${(await h.ページ送りの文字()).join("・")}）`); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ（1ページ目）").toBe("1");
  });
});

// ---- 017 ----
caseTest("IT-F06-10-017", async ({ page, step, expected }) => {
  await ログインする(page, "017", "f0610_page25-017");
  const h = new PointHistoryPage(page);
  let 文字: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 文字 = await h.ページ送りの文字(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("1");
    expect.soft(文字.includes("最初"), `ページ送りに「最初」のリンクが表示される（リンクの表示: ${文字.join("・")}）`).toBe(false);
  });
});

// ---- 018 ----
caseTest("IT-F06-10-018", async ({ page, step, expected }) => {
  await ログインする(page, "018", "f0610_page25-018");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { if (!(await h.最後を押す())) note(`ページ送りに「最後」のリンクが無く、押せなかった（リンクの表示: ${(await h.ページ送りの文字()).join("・")}）`); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ（最終ページの3ページ目）").toBe("3");
  });
});

// ---- 019 ----
caseTest("IT-F06-10-019", async ({ page, step, expected }) => {
  await ログインする(page, "019", "f0610_page25-019");
  const h = new PointHistoryPage(page);
  let 文字: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { if (!(await h.最後を押す())) note(`ページ送りに「最後」のリンクが無く、押せなかった（リンクの表示: ${(await h.ページ送りの文字()).join("・")}）`); });
  await step(3, async () => { 文字 = await h.ページ送りの文字(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ（最終ページの3ページ目）").toBe("3");
    expect.soft(文字.includes("最後"), `ページ送りに「最後」のリンクが表示される（リンクの表示: ${文字.join("・")}）`).toBe(false);
  });
});

// ---- 020 ----
caseTest("IT-F06-10-020", async ({ page, step, expected }) => {
  await ログインする(page, "020", "f0610_page101-020");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 6); });
  await step(3, async () => { await h.現在のページの位置を押す(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ（6ページ目のまま）").toBe("6");
    expect.soft(h.query.get("pageno"), "ページ番号の指定（アドレス）").toBe("6");
  });
});

// ---- 021 ----
caseTest("IT-F06-10-021", async ({ page, step, expected }) => {
  await ログインする(page, "021", "f0610_page101-021");
  const h = new PointHistoryPage(page);
  let リンク: number[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 6); });
  await step(3, async () => { リンク = await h.ページ番号のリンク(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("6");
    // 最後のページ（11）へのリンクは別に出るので除く
    const 範囲内 = リンク.filter((n) => n !== 11);
    expect.soft(範囲内.filter((n) => n !== 1), `6の前後3つのリンク（表示されているページ番号のリンク: ${リンク.join("・")}）`).toEqual([3, 4, 5, 7, 8, 9]);
    expect.soft(リンク.includes(2), "ページ番号2のリンクが表示される").toBe(false);
    expect.soft(リンク.includes(10), "ページ番号10のリンクが表示される").toBe(false);
  });
});

// ---- 022・023・024 ----
caseTest("IT-F06-10-022", async ({ page, step, expected }) => {
  await ログインする(page, "022", "f0610-022");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.パンくずの現在地を押す(); });
  await expected(async () => {
    expect.soft(h.path, "画面（ポイント履歴画面のまま）").toBe("/ja/mypage/point_history");
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-10-023", async ({ page, step, expected }) => {
  await ログインする(page, "023", "f0610-023");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.パンくずホーム); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（本店ECのトップ）").toMatch(/^\/ja\/?$/);
  });
});

caseTest("IT-F06-10-024", async ({ page, step, expected }) => {
  await ログインする(page, "024", "f0610-024");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.画面下部のマイページ); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(await h.マイページ画面である(), "マイページが表示される").toBe(true);
  });
});

// ---- 025 ----
caseTest("IT-F06-10-025", async ({ page, step, expected }) => {
  await ログインする(page, "025", "f0610_page25-025");
  const h = new PointHistoryPage(page);
  let p1: string[] = [], p2: string[] = [], p3: string[] = [];
  let 範囲: Awaited<ReturnType<PointHistoryPage["表示範囲"]>> = null;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { p1 = await h.内容を上から(); });
  await step(3, async () => { await ページ番号を押す(h, 2); p2 = await h.内容を上から(); });
  await step(4, async () => { await ページ番号を押す(h, 3); p3 = await h.内容を上から(); 範囲 = await h.表示範囲(); });
  await expected(async () => {
    const 全部 = [...p1, ...p2, ...p3];
    expect.soft(全部, "3ページを通した履歴の内容（ポイント履歴IDの降順で、重複・欠落なし）").toEqual(連番の内容("P25", "025", 25, 1));
    expect.soft(new Set(全部).size, "重複を除いた件数").toBe(全部.length);
    expect.soft(範囲?.全件, "画面の全件数").toBe(全部.length);
  });
});

// ---- 028・029 ----
caseTest("IT-F06-10-028", async ({ page, step, expected }) => {
  await ログインする(page, "028", "f0610_prev-028");
  const h = new PointHistoryPage(page);
  let 前へ = -1;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 前へ = await h.前へのリンク.count(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("1");
    expect.soft(前へ, "前へのリンクの数").toBe(0);
  });
});

caseTest("IT-F06-10-029", async ({ page, step, expected }) => {
  await ログインする(page, "029", "f0610_next-029");
  const h = new PointHistoryPage(page);
  let 次へ = -1;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { if (!(await h.最後を押す())) note(`ページ送りに「最後」のリンクが無く、押せなかった（リンクの表示: ${(await h.ページ送りの文字()).join("・")}）`); });
  await step(3, async () => { 次へ = await h.次へのリンク.count(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ（最終ページの3ページ目）").toBe("3");
    expect.soft(次へ, "次へのリンクの数").toBe(0);
  });
});

// ---- 030 ----
caseTest("IT-F06-10-030", async ({ page, step, expected }) => {
  await ログインする(page, "030", "f0610_pagenum-030");
  const h = new PointHistoryPage(page);
  let リンク: number[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 4); });
  await step(3, async () => { await ページ番号を押す(h, 6); });
  await step(4, async () => { リンク = await h.ページ番号のリンク(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("6");
    const 範囲内 = リンク.filter((n) => n !== 1 && n !== 11);
    expect.soft(範囲内, `6の前後3つのリンク（表示されているページ番号のリンク: ${リンク.join("・")}）`).toEqual([3, 4, 5, 7, 8, 9]);
    expect.soft(リンク.includes(2), "ページ番号2のリンクが表示される").toBe(false);
    expect.soft(リンク.includes(10), "ページ番号10のリンクが表示される").toBe(false);
  });
});

// ---- 031 ----
caseTest("IT-F06-10-031", async ({ page, step, expected }) => {
  await ログインする(page, "031", "f0610_page25-031");
  const h = new PointHistoryPage(page);
  let 範囲: Awaited<ReturnType<PointHistoryPage["表示範囲"]>> = null;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 3); });
  await step(3, async () => { 範囲 = await h.表示範囲(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("3");
    expect.soft([範囲?.開始, 範囲?.終了, 範囲?.全件], `表示範囲（開始・終了・全件。画面の表記: ${範囲?.文 ?? "なし"}）`).toEqual([21, 25, 25]);
  });
});

// ---- 032・033 ----
caseTest("IT-F06-10-032", async ({ page, step, expected }) => {
  await ログインする(page, "032", "f0610_page25-032");
  const h = new PointHistoryPage(page);
  let 前へ = -1, 次へ = -1;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 2); });
  await step(3, async () => { 前へ = await h.前へのリンク.count(); 次へ = await h.次へのリンク.count(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("2");
    expect.soft(前へ > 0, "前へのリンクが表示される").toBe(true);
    expect.soft(次へ > 0, "次へのリンクが表示される").toBe(true);
  });
});

caseTest("IT-F06-10-033", async ({ page, step, expected }) => {
  await ログインする(page, "033", "f0610_page4-033");
  const h = new PointHistoryPage(page);
  let 前へ = -1, 次へ = -1;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 前へ = await h.前へのリンク.count(); 次へ = await h.次へのリンク.count(); });
  await expected(async () => {
    expect.soft((await h.内容を上から()).length, "履歴の行の数（1ページに収まる）").toBe(4);
    expect.soft(前へ, "前へのリンクの数").toBe(0);
    expect.soft(次へ, "次へのリンクの数").toBe(0);
  });
});

// ---- 034 ----
caseTest("IT-F06-10-034", async ({ page, step, expected }) => {
  await ログインする(page, "034", "f0610_page101-034");
  const h = new PointHistoryPage(page);
  let リンク: number[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await ページ番号を押す(h, 2); });
  await step(3, async () => { リンク = await h.ページ番号のリンク(); });
  await expected(async () => {
    expect.soft(await h.現在のページ(), "表示されているページ").toBe("2");
    // 最後のページ（11）へのリンクは別に出るので、前後のリンクの数から除く
    const 前 = リンク.filter((n) => n < 2);
    const 後 = リンク.filter((n) => n > 2 && n !== 11);
    expect.soft(前, `2の前に表示されるページ番号（表示されているページ番号のリンク: ${リンク.join("・")}）`).toEqual([1]);
    expect.soft(後.length <= 3, `2の後に表示されるページ番号は最大3つ（${後.join("・")}）`).toBe(true);
    expect.soft(リンク.includes(6), "ページ番号6のリンクが表示される").toBe(false);
  });
});

// ---- 035・036（英語表示） ----
async function 英語のポイント履歴を開く(page: CaseCtx["page"], n: string, 前半: string, step: CaseCtx["step"]): Promise<PointHistoryPage> {
  const m = new MypagePage(page, "en");
  await m.ログインする(mailOf(前半), passwordOf(n));
  const h = new PointHistoryPage(page, "en");
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { await m.メニューを押す("ポイント履歴"); });
  return h;
}

caseTest("IT-F06-10-035", async ({ page, step, expected }) => {
  const h = await 英語のポイント履歴を開く(page, "035", "cbf0610-035", step);
  let 件数 = 0, 日 = "", ポイント = "", 期限 = "";
  await step(3, async () => {
    const 行 = h.日付の行("08/01/2026");
    件数 = await 行.count();
    if (件数 > 0) {
      日 = (await h.項目(行.first(), "Date")).文;
      ポイント = (await h.項目(行.first(), "Points")).文;
      期限 = (await h.項目(行.first(), "Expires")).文;
    }
  });
  await expected(async () => {
    expect.soft(h.path, "画面（英語のポイント履歴）").toBe("/en/mypage/point_history");
    expect.soft(件数, "発行日 2026-08-01 の履歴行の数").toBe(1);
    expect.soft(日, "利用or獲得日（Date (earned/used)）").toBe("08/01/2026");
    expect.soft(ポイント, "ポイント（Points）").toBe("+300");
    expect.soft(期限, "有効期限（Expires。発行日の183日後）").toBe("01/31/2027");
  });
});

caseTest("IT-F06-10-036", async ({ page, step, expected }) => {
  const h = await 英語のポイント履歴を開く(page, "036", "cbf0610-036", step);
  let 件数 = 0, 日 = "", ポイント = "", 期限 = "", 期限の項目 = false;
  await step(3, async () => {
    const 行 = h.日付の行("07/15/2026");
    件数 = await 行.count();
    if (件数 > 0) {
      日 = (await h.項目(行.first(), "Date")).文;
      ポイント = (await h.項目(行.first(), "Points")).文;
      const e = await h.項目(行.first(), "Expires");
      期限 = e.文; 期限の項目 = e.有;
    }
  });
  await expected(async () => {
    expect.soft(h.path, "画面（英語のポイント履歴）").toBe("/en/mypage/point_history");
    expect.soft(件数, "発行日 2026-07-15 の履歴行の数").toBe(1);
    expect.soft(日, "利用or獲得日（Date (earned/used)）").toBe("07/15/2026");
    expect.soft(ポイント, "ポイント（Points）").toBe("-50");
    expect.soft(期限の項目 && 期限 !== "", `有効期限（Expires）が表示される（欄の文: 「${期限}」）`).toBe(false);
  });
});

// ---- 011・012 ----
caseTest("IT-F06-10-011", async ({ page, step, expected }) => {
  await ログインする(page, "011", "f0610_empty-011");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  let 行数 = -1;
  await step(2, async () => { 行数 = await h.履歴の行.count(); });
  await expected(async () => {
    expect.soft(h.path, "ポイント履歴画面に留まる").toBe("/ja/mypage/point_history");
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
    expect.soft(行数, "履歴の行の数").toBe(0);
  });
});

caseTest("IT-F06-10-012", async ({ page, step, expected }) => {
  await ログインする(page, "012", "f0610_empty-012");
  const h = new PointHistoryPage(page);
  await step(1, async () => { await h.開く(); });
  let 文 = "";
  await step(2, async () => { 文 = await h.一覧上部の文(); });
  await expected(async () => {
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
    expect.soft(文, "一覧上部に「次に消失するポイント」が表示されない").not.toMatch(/次に|消失|失効/);
    expect.soft(await h.次に消失するポイントの行数(), "一覧上部のポイント情報の行の数（現在のポイントだけ）").toBe(1);
  });
});
