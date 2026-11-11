/** M14-06 カードセット管理(一覧) と M14-07 カードセット管理(画像ダウンロード)。正本: cases/M14-06_test_cases.tsv・M14-07_test_cases.tsv */
import { Dialog, Locator, Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { カードセットの値 } from "../../db/m14_08_cardset";
import { カードセットの件数, セットの画像, 略称のカードセットID } from "../../db/m14_06_cardset";
import { CardsetListPage } from "../../pages/admin/m14_06_cardset_list";
import { M1406_ADMIN, M1407_ADMIN } from "../../seeds/m14-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
function 日付(s: string): string {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : s;
}
const 共有の一覧の注記 = "一覧はほかの試験のカードセットも並ぶ共有の画面なので、このケースのカードセットは、ページをたどって控えたID（または実行の印つきの略称）で探した";

async function 一覧を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/cardset"));
  await page.waitForLoadState("load");
  await expect(page.locator("#admin_cardset_download_by_set"), "カードセット一覧の「画像ダウンロード(セット別)」").toBeVisible();
}

caseTest("IT-M14-06-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const r = { 見出し: [] as string[], 行: 0 };
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => {
    r.見出し = (await page.locator("table thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    r.行 = await page.locator('tbody tr:has(input[name="cardsetIds[]"])').count();
  });
  await expected(async () => {
    expect.soft(r.行, "一覧に表示されたカードセットの行数").toBeGreaterThan(0);
    expect.soft(r.見出し.filter((t) => /サイドメニュー|支店/.test(t)), "「サイドメニュー表示」「支店表示」の列").toEqual([]);
  });
});

caseTest("IT-M14-06-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.btn").filter({ hasText: /^\s*新規登録\s*$/ }).first().click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.endsWith("/cardset/new"), "遷移先がカードセット詳細(登録)画面").toBe(true);
    await expect.soft(page.locator("#admin_cardset_nameJp"), "カードセット名(日本語)の入力欄").toBeVisible();
  });
});

caseTest("IT-M14-06-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.btn").filter({ hasText: /ブロックの追加/ }).first().click({ timeout: 20_000 })]); });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname.endsWith("/data/mtg_master_data"), "遷移先がMTGマスターデータ画面").toBe(true);
    expect.soft(u.searchParams.get("entity"), "選ばれている種別（カードセットブロック）").toBe("cardsetblock");
    await expect.soft(page.locator("form#edit_form table.mtg-master-table"), "カードセットブロックのマスターデータ一覧").toBeVisible();
  });
});

/** 未選択で画像ダウンロードを押し、確認ダイアログでキャンセルする型 */
function ダイアログで取り消す(ログイン: typeof M1406_ADMIN, ボタン: string, 事前に外す: boolean, ダウンロード履歴: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, ログイン);
    let ダイアログ: Dialog | null = null;
    let 文 = "";
    let ダウンロード = 0;
    let クリック: Promise<unknown> = Promise.resolve();
    page.on("download", () => { ダウンロード += 1; });
    const 手順 = ダウンロード履歴 ? 1 : 0; // 履歴確認の手順がある型は番号が1つずれる
    let n = 1;
    if (ダウンロード履歴) await step(n++, async () => { ダウンロード = 0; });
    await step(n++, async () => { await 一覧を開く(page); });
    if (事前に外す) await step(n++, async () => { await page.locator("#chose_all").setChecked(false, { timeout: 20_000 }); await expect(page.locator('input[name="cardsetIds[]"]:checked'), "選択されているカードセット").toHaveCount(0); });
    await step(n++, async () => {
      // 確認ダイアログが開いている間はクリック操作が終わらないので、クリックは待たずに、ダイアログが出るのを待つ
      const wait = page.waitForEvent("dialog", { timeout: 20_000 });
      クリック = page.locator(ボタン).click({ timeout: 20_000, noWaitAfter: true }).catch(() => undefined);
      ダイアログ = await wait;
      文 = ダイアログ.message();
    });
    await step(n++, async () => { await ダイアログ!.dismiss(); await クリック; await page.waitForTimeout(1500); });
    if (ダウンロード履歴) await step(n++, async () => { /* ダウンロード数を期待結果で確かめる */ expect.soft(ダウンロード, "ダウンロードされたファイルの数").toBe(0); });
    void 手順;
    await expected(async () => {
      expect.soft(文, "確認ダイアログの文").toContain("ダウンロード");
      expect.soft(new URL(page.url()).pathname.replace(/\/$/, "").endsWith("/cardset"), "画面がカードセット一覧のまま").toBe(true);
      expect.soft(ダウンロード, "ダウンロードが実行されない").toBe(0);
    });
  };
}
// ---------------------------------------------------------------------------
// 一覧の項目・行の操作
// ---------------------------------------------------------------------------
async function 探す(L: CardsetListPage, 行: () => Locator, 方向: "先頭から" | "最後から", 説明: string): Promise<number> {
  const n = await L.行を探す(行, 方向);
  if (n === null) throw new Error(`${説明}の行が一覧に見つからない`);
  return n;
}

caseTest("IT-M14-06-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const ids = ["A", "B", "C", "D"].map((s) => notes.get(`〔カードセットID-M1406-002${s}〕`));
  type 表示 = { 日付: string; シンボル: string | null; 略称: string; 名: string[] };
  const 結果: { id: string; db: ReturnType<typeof カードセットの値>; 表示: 表示 }[] = [];
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）");
    await L.件数を選ぶ(100);
    for (const id of ids) {
      await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
      const td = L.行(id).locator("td");
      const 表示: 表示 = {
        日付: 日付((await td.nth(1).innerText()).trim()),
        シンボル: await td.nth(2).locator("img").first().getAttribute("src").catch(() => null),
        略称: (await td.nth(3).innerText()).trim(),
        名: (await td.nth(4).innerText()).split("\n").map((t) => t.trim()).filter(Boolean),
      };
      結果.push({ id, db: カードセットの値(id), 表示 });
    }
  });
  await expected(async () => {
    expect.soft(結果.length, "照合したカードセットの数").toBe(4);
    for (const r of 結果) {
      const db = r.db;
      expect.soft(db, `カードセット ${r.id} がDBにある`).not.toBeNull();
      expect.soft(r.表示.日付, `カードセット ${r.id} のリリース日`).toBe(db?.リリース日);
      expect.soft(db?.シンボル画像 ?? null, `カードセット ${r.id} のシンボル（DBの値がある）`).not.toBeNull();
      expect.soft(r.表示.シンボル ?? "", `カードセット ${r.id} のシンボル（一覧の画像）`).toContain((db?.シンボル画像 ?? "\u0000").split("/").pop()!);
      expect.soft(r.表示.略称, `カードセット ${r.id} の略称`).toBe(db?.略称);
      expect.soft(r.表示.名, `カードセット ${r.id} のセット名(日)とセット名(英)`).toEqual([db?.名日, db?.名英]);
    }
  });
});

async function 特殊セットの欄(page: Page, notes: { get(l: string): string }, ラベル: string, 件数100: boolean): Promise<{ 行: number; アイコン: number }> {
  const L = new CardsetListPage(page);
  const id = notes.get(ラベル);
  if (件数100) await L.件数を選ぶ(100);
  await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
  return { 行: await L.行(id).count(), アイコン: await L.行(id).locator("td i.fa-tag").count() };
}

caseTest("IT-M14-06-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  let r = { 行: 0, アイコン: 0 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）"); r = await 特殊セットの欄(page, notes, "〔カードセットID-M1406-003〕", true); });
  await expected(async () => {
    expect.soft(r.行, "特殊セットのカードセットの行").toBe(1);
    expect.soft(r.アイコン, "特殊セット欄のアイコン").toBeGreaterThan(0);
  });
});

caseTest("IT-M14-06-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  let a = { 行: 0, アイコン: 0 }, b = { 行: 0, アイコン: 0 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）。特殊セットの比較のため、フラグを真にした側の行も見た");
    a = await 特殊セットの欄(page, notes, "〔カードセットID-M1406-042A〕", true);
    b = await 特殊セットの欄(page, notes, "〔カードセットID-M1406-042B〕", false);
  });
  await expected(async () => {
    expect.soft(a.アイコン, "特殊セットフラグを真にした側の行のアイコン（比較用）").toBeGreaterThan(0);
    expect.soft(b.行, "特殊セットフラグが設定されていないカードセットの行").toBe(1);
    expect.soft(b.アイコン, "特殊セットフラグが設定されていないカードセットの特殊セット欄のアイコン").toBe(0);
  });
});

caseTest("IT-M14-06-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-008〕");
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）");
    await L.件数を選ぶ(100);
    await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
    await L.操作を開く(L.行(id));
  });
  await expected(async () => {
    await expect.soft(L.編集(L.行(id)), `カードセット ${id} の「編集」`).toBeVisible();
    await expect.soft(L.削除(L.行(id)), `カードセット ${id} の「削除」`).toBeVisible();
  });
});

caseTest("IT-M14-06-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-009〕");
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）");
    await L.件数を選ぶ(100);
    await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
    await L.操作を開く(L.行(id));
  });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), L.編集(L.行(id)).click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.endsWith(`/cardset/${id}/edit`), "遷移先がそのカードセットの詳細(編集・削除)画面").toBe(true);
    await expect.soft(page.locator("#admin_cardset_nameJp"), "カードセット名(日本語)の入力欄").toBeVisible();
  });
});

caseTest("IT-M14-06-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const r = { 行: 0, 未選択: 0 };
  void ["A", "B", "C", "D"].map((s) => notes.get(`〔カードセットID-M1406-010${s}〕`));
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note("一覧に表示中のカードセットは、ほかの試験のものも含めてすべて選択されるかを確かめた（このケースの4件が1ページ目に出る保証が共有の一覧には無いため）");
    await L.全選択.check({ timeout: 20_000 });
    r.行 = await L.選択欄.count();
    r.未選択 = await page.locator('input[name="cardsetIds[]"]:not(:checked)').count();
  });
  await expected(async () => {
    expect.soft(r.行, "表示中のカードセットの数").toBeGreaterThanOrEqual(4);
    expect.soft(r.未選択, "選択されていないカードセット選択欄の数").toBe(0);
  });
});

caseTest("IT-M14-06-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const 名 = ["Alpha-012", "Bravo-012", "Charlie-012", "Delta-012"].map((n) => rc(n));
  const 並び選択: { 表示: string; 読み込み: boolean; 並び: string[] }[] = [];
  /** 4件の行を一覧のページをたどって集め、現れた順に並べる */
  async function 並びを読む(): Promise<string[]> {
    const found: { 名: string; 位置: number }[] = [];
    await L.ページを開く(1);
    const total = await L.総ページ数();
    for (let n = 1; n <= total && found.length < 4; n++) {
      if (n > 1) await L.ページを開く(n);
      const rows = await L.行すべて.allInnerTexts();
      rows.forEach((t, i) => { for (const x of 名) if (t.includes(x) && !found.some((f) => f.名 === x)) found.push({ 名: x, 位置: n * 1000 + i }); });
    }
    return found.sort((p, q) => p.位置 - q.位置).map((f) => f.名);
  }
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（4件の並びを読むため、はじめに表示件数を100件にした）。リリース日(降順)は初めから選ばれているので、選び直しても読み込みは起きない");
    await L.件数を選ぶ(100);
    for (const 表示 of ["リリース日（降順）", "リリース日（昇順）", "セット英名（降順）", "セット英名（昇順）"]) {
      const 読み込み = await L.並び順を選ぶ(表示);
      await expect(L.並び順欄.locator("option:checked"), `選んだ並び順「${表示}」`).toHaveText(new RegExp(表示.replace(/[（）]/g, "\\$&")));
      並び選択.push({ 表示, 読み込み, 並び: await 並びを読む() });
    }
  });
  await expected(async () => {
    const [a, b, c, d] = 名;
    const 期待: Record<string, string[]> = {
      "リリース日（降順）": [a, b, c, d], "リリース日（昇順）": [d, c, b, a], "セット英名（降順）": [d, c, b, a], "セット英名（昇順）": [a, b, c, d],
    };
    for (const r of 並び選択) expect.soft(r.並び.map((x) => x.replace(/-[0-9A-Z]+$/, "")), `並び順「${r.表示}」の4件の並び`).toEqual(期待[r.表示].map((x) => x.replace(/-[0-9A-Z]+$/, "")));
    for (const r of 並び選択.slice(1)) expect.soft(r.読み込み, `並び順「${r.表示}」を選んだときの読み込み`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ページング（10件表示で2ページ目ができる件数があればよいケース）
// ---------------------------------------------------------------------------
const ページングの注記 = "正本は12001件の登録だが、このケースは10件表示で2ページ目があればよいので、カードセットの総数が11件以上ある一覧で行った";

caseTest("IT-M14-06-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  let 途中 = 0, 後 = 0;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(ページングの注記); await L.件数を選ぶ(10); });
  await step(3, async () => { await L.ページ番号を押す(2); 途中 = await L.現在のページ番号(); });
  await step(4, async () => { await L.件数を選ぶ(50); 後 = await L.現在のページ番号(); });
  await expected(async () => {
    expect.soft(途中, "表示件数を選び直す前のページ").toBe(2);
    expect.soft(後, "表示件数を選び直した後のページ").toBe(1);
  });
});

caseTest("IT-M14-06-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  let 途中 = 0, 後 = 0;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(ページングの注記); await L.件数を選ぶ(10); });
  await step(3, async () => { await L.ページ番号を押す(2); 途中 = await L.現在のページ番号(); });
  await step(4, async () => { await L.並び順を選ぶ("セット英名（昇順）"); 後 = await L.現在のページ番号(); });
  await expected(async () => {
    expect.soft(途中, "並び順を選び直す前のページ").toBe(2);
    expect.soft(後, "並び順を選び直した後のページ").toBe(1);
  });
});

caseTest("IT-M14-06-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const r = { ページ: 0, 押せる: -1 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(ページングの注記); await L.件数を選ぶ(10); });
  await step(3, async () => { await L.ページ番号を押す(2); });
  await step(4, async () => { r.ページ = await L.現在のページ番号(); r.押せる = await L.ページ番号のリンク(2).count(); });
  await expected(async () => {
    expect.soft(r.ページ, "表示されているページ").toBe(2);
    expect.soft(r.押せる, "表示中のページ番号「2」を押せるリンクの数").toBe(0);
    await expect.soft(page.locator(".pagination .page-item.active span.page-link"), "表示中のページ番号「2」（押せない表示）").toHaveText(/^\s*2\s*$/);
  });
});

caseTest("IT-M14-06-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const r = { 前へ: -1, 途中: 0, 後: 0 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(ページングの注記); await L.件数を選ぶ(10); });
  await step(3, async () => { await L.ページ番号を押す(2); r.途中 = await L.現在のページ番号(); });
  await step(4, async () => { r.前へ = await L.前へ().count(); await L.前へを押す(); r.後 = await L.現在のページ番号(); });
  await expected(async () => {
    expect.soft(r.途中, "「前へ」を押す前のページ").toBe(2);
    expect.soft(r.前へ, "2ページ目の「前へ」のリンクの数").toBeGreaterThan(0);
    expect.soft(r.後, "「前へ」を押した後のページ").toBe(1);
  });
});

caseTest("IT-M14-06-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const r = { ページング: false, 前へ: -1, ページ: 0 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(ページングの注記);
    r.ページング = await L.ページング.first().isVisible();
    r.ページ = await L.現在のページ番号();
    r.前へ = await L.前へ().count();
  });
  await expected(async () => {
    expect.soft(r.ページング, "ページング操作部が表示される").toBe(true);
    expect.soft(r.ページ, "表示されているページ").toBe(1);
    expect.soft(r.前へ, "1ページ目の「前へ」の数").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------
const 実行の注記 = "確認ポップアップの実行のボタンは、画面では「削除」の表示。そのボタンを押した";

caseTest("IT-M14-06-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-023〕");
  let 件数 = -1;
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）");
    await L.件数を選ぶ(100);
    await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
    await L.操作を開く(L.行(id));
  });
  await step(3, async () => { await L.削除を押す(L.行(id)); });
  await step(4, async () => { note(実行の注記); await L.ポップアップで実行する(); });
  await step(5, async () => { 件数 = カードセットの件数(id); });
  await expected(async () => { expect.soft(件数, `収録カードを持たないカードセット ${id} のDBの件数`).toBe(0); });
});

caseTest("IT-M14-06-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-024〕");
  const r = { 前: 0, 後: 0, 成功: [] as string[], 行: -1 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { await L.件数を選ぶ(10); });
  await step(3, async () => {
    note(共有の一覧の注記 + "。このカードセットは古いリリース日にしてあるので、最後のページからさかのぼって、行のあるページへ移った");
    r.前 = await 探す(L, () => L.行(id), "最後から", `カードセット ${id}`);
  });
  await step(4, async () => { await L.操作を開く(L.行(id)); });
  await step(5, async () => { await L.削除を押す(L.行(id)); });
  await step(6, async () => { note(実行の注記); await L.ポップアップで実行する(); r.後 = await L.現在のページ番号(); r.成功 = await L.メッセージ("success"); r.行 = await L.行(id).count(); });
  await expected(async () => {
    expect.soft(r.前, "削除前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2);
    expect.soft(r.成功.join(" "), "削除の完了メッセージ").toContain("削除しました");
    expect.soft(r.後, "削除後に表示されているページ（保持していたページ）").toBe(r.前);
    expect.soft(r.行, "削除したカードセットの行").toBe(0);
  });
});

caseTest("IT-M14-06-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-025〕");
  notes.get("〔カード詳細ID-M1406-025〕");
  let 件数 = -1;
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(共有の一覧の注記 + "（探しやすいよう、はじめに表示件数を100件にした）");
    await L.件数を選ぶ(100);
    await 探す(L, () => L.行(id), "先頭から", `カードセット ${id}`);
    await L.操作を開く(L.行(id));
  });
  await step(3, async () => { await L.削除を押す(L.行(id)); });
  await step(4, async () => { note(実行の注記); await L.ポップアップで実行する(); });
  await step(5, async () => { 件数 = カードセットの件数(id); });
  await expected(async () => { expect.soft(件数, `収録カードを持つカードセット ${id} のDBの件数（削除されない）`).toBe(1); });
});

caseTest("IT-M14-06-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const id = notes.get("〔カードセットID-M1406-026〕");
  notes.get("〔カード詳細ID-M1406-026〕");
  const r = { 前: 0, 後: 0, エラー: [] as string[], 行: -1 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { await L.件数を選ぶ(10); });
  await step(3, async () => {
    note(共有の一覧の注記 + "。このカードセットは古いリリース日にしてあるので、最後のページからさかのぼって、行のあるページへ移った");
    r.前 = await 探す(L, () => L.行(id), "最後から", `カードセット ${id}`);
  });
  await step(4, async () => { await L.操作を開く(L.行(id)); });
  await step(5, async () => { await L.削除を押す(L.行(id)); });
  await step(6, async () => { note(実行の注記); await L.ポップアップで実行する(); r.後 = await L.現在のページ番号(); r.エラー = await L.メッセージ("danger"); r.行 = await L.行(id).count(); });
  await expected(async () => {
    expect.soft(r.前, "削除前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2);
    expect.soft(r.エラー.join(" "), "削除できないことを示すエラーメッセージ").toContain("削除することができません");
    expect.soft(r.後, "削除後に表示されているページ（保持していたページ）").toBe(r.前);
    expect.soft(r.行, "そのカードセットの行が一覧に残っている").toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 画像ダウンロード（画像の実体を用意できないため、ZIP の中身を見るケースは実装しない。エラー・取得できない画像のケースだけ）
// ---------------------------------------------------------------------------
const 画像の注記 = "画像の実体（取得できる画像）は画面から用意できないので、カードの画像URLの先に実体は無い。このケースが確かめるのは、画像の取得結果に依らない動作";
const 古い2件の注記 = "2件は古いリリース日にして、一覧の最後のほうのページに続けて並ぶようにしてある。そのページへは、最後のページからさかのぼって移った";

/** 古い日付の2セット（SET-A, SET-B）を選んでダウンロードする型 */
function 二つのセットを選ぶ(n: string): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1406_ADMIN);
    const L = new CardsetListPage(page);
    const a = rc(`SET-A-${n}`), b = rc(`SET-B-${n}`);
    const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0, 順: false };
    await step(1, async () => { await L.open(); });
    await step(2, async () => { await L.件数を選ぶ(10); });
    await step(3, async () => {
      note(画像の注記 + "。" + 古い2件の注記);
      r.前 = await 探す(L, () => L.略称の行(a), "最後から", `SET-A-${n}`);
    });
    await step(4, async () => {
      const 行 = await L.行すべて.evaluateAll((rs, [x, y]) => {
        const at = (k: string) => rs.findIndex((tr) => Array.from(tr.querySelectorAll("td")).some((td) => (td.textContent ?? "").trim() === k));
        return [at(x), at(y)];
      }, [a, b]);
      if (行[1] < 0) throw new Error(`SET-B-${n} が SET-A-${n} と同じページに並ばなかった（ページの境目に当たった。流し直す）`);
      r.順 = 行[0] >= 0 && 行[0] < 行[1];
      await L.略称の行(a).locator('input[name="cardsetIds[]"]').check();
      await L.略称の行(b).locator('input[name="cardsetIds[]"]').check();
    });
    await step(5, async () => {
      const d = await L.画像ダウンロードを押す("セット別");
      r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号();
    });
    await expected(async () => {
      expect.soft(r.順, `一覧の並びが SET-A-${n}, SET-B-${n} の順`).toBe(true);
      expect.soft(r.ダウンロード, "ZIPファイルがダウンロードされた").toBe(false);
      expect.soft(r.エラー.length, "エラーメッセージの数").toBeGreaterThan(0);
      if (n === "034") {
        expect.soft(r.エラー.join(" "), "カードがない旨のエラーメッセージ").toContain("カードがありません");
        expect.soft(r.前, "押す前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2);
        expect.soft(r.後, "エラー後に戻ったページ（保持していたページ）").toBe(r.前);
      }
    });
  };
}
caseTest("IT-M14-06-033", 二つのセットを選ぶ("033"));
caseTest("IT-M14-06-034", 二つのセットを選ぶ("034"));

caseTest("IT-M14-06-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const code = rc("SET-A-036");
  let id = "";
  let 前: boolean[] = [];
  let 後: boolean[] = [];
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(画像の注記 + "。正本は3件のカード詳細のうち2件が取得可能な画像だが、取得可能な画像は用意できないので、実体の無い画像1件のカード詳細だけにした");
    await L.件数を選ぶ(100);
    await 探す(L, () => L.略称の行(code), "先頭から", "SET-A-036");
    await L.略称の行(code).locator('input[name="cardsetIds[]"]').check();
    id = 略称のカードセットID(code) ?? "";
    前 = セットの画像(id).map((x) => x.デッドリンク);
  });
  await step(3, async () => { await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { 後 = セットの画像(id).map((x) => x.デッドリンク); });
  await expected(async () => {
    expect.soft(前, "ダウンロード前のデッドリンク（偽）").toEqual([false]);
    expect.soft(後, "ダウンロード後、取得できなかった画像のデッドリンク（真）").toEqual([true]);
  });
});

caseTest("IT-M14-06-041", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const code = rc("MISS-041");
  const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => {
    note(画像の注記 + "。共有の一覧で行を探すため、はじめに表示件数を100件にした");
    await L.件数を選ぶ(100);
    r.前 = await 探す(L, () => L.略称の行(code), "先頭から", "MISS-041");
    await L.略称の行(code).locator('input[name="cardsetIds[]"]').check();
  });
  await step(3, async () => {
    const d = await L.画像ダウンロードを押す("セット別");
    r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号();
  });
  await expected(async () => {
    expect.soft(r.エラー.join(" "), "画像が存在しない旨のエラーメッセージ").toContain("ダウンロードできる画像がありません");
    expect.soft(r.ダウンロード, "ZIPファイルが返された").toBe(false);
    expect.soft(r.後, "エラー後に戻ったページ（保持していたページ番号）").toBe(r.前);
  });
});

caseTest("IT-M14-06-043", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const L = new CardsetListPage(page);
  const code = rc("M1406-043-A");
  const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0, 選択: -1 };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { await L.件数を選ぶ(10); });
  await step(3, async () => {
    note("このカードセットは古いリリース日にしてあるので、最後のページからさかのぼって、行のあるページへ移った");
    r.前 = await 探す(L, () => L.略称の行(code), "最後から", "M1406-043-A");
  });
  await step(4, async () => {
    await L.略称の行(code).locator('input[name="cardsetIds[]"]').check();
    r.選択 = await page.locator('input[name="cardsetIds[]"]:checked').count();
  });
  await step(5, async () => {
    const d = await L.画像ダウンロードを押す("セット別");
    r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号();
  });
  await expected(async () => {
    expect.soft(r.選択, "選択したカードセットの数").toBe(1);
    expect.soft(r.エラー.join(" "), "収録カードが無い旨のエラーメッセージ").toContain("カードがありません");
    expect.soft(r.ダウンロード, "ZIPファイルがダウンロードされた").toBe(false);
    expect.soft(r.前, "押す前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2);
    expect.soft(r.後, "エラー後に戻ったページ（保持していたページ）").toBe(r.前);
  });
});

caseTest("IT-M14-06-030", ダイアログで取り消す(M1406_ADMIN, "#admin_cardset_download_by_set", false, false));
caseTest("IT-M14-07-003", ダイアログで取り消す(M1407_ADMIN, "#admin_cardset_download_by_set", true, false));
caseTest("IT-M14-07-004", ダイアログで取り消す(M1407_ADMIN, "#admin_cardset_download_by_set", true, true));
