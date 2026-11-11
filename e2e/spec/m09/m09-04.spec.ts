/**
 * M09-04 ページ管理（一覧・登録・編集・削除）。正本: integration_test/casegen/cases/M09-04_test_cases.tsv
 * 追加で実装（2026-11-11。開発者作成にするなど、印つきのページだけDBで整える）: 001 003 011 012 022 035 037 038 039 052 053 057 063。
 * まだ実装しない: 004 044 045 047 065 066 069 071 072（理由は review/M09-04_progress_2026-11-11.md）。
 * 実装した: 002 005 006 007 008 009 010 013 014 015 016 017 018 019 020 021 023 024 025 026 029 036 040 041 042 043 046 048 049 050 051 056 058 059 060 061 062 064 067 068 070。
 * 実装しない（シードがDBでの準備・ファイル配置を要する）: 001 003 004 011 012 022 035 037 038 039 044 045 047 052 053 057 063 065 066 069 071 072。
 * 決め打ちの識別の値（ページ名・URL・ファイル名）には実行の印を付ける（seeds/m09-04.ts の 識別）。255文字の境界値は印を付けない。
 * 公開側のアドレスは、正本の「https://www.hareruyamtg.com/ja/…」の本番の名前を、手元の環境の名前に置き換えて開く（環境の違い）。
 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { ページ管理, ページの値 } from "../../pages/admin/m09_04_page";
import { レイアウトの設定, ページIDで, ページ名で, URLで } from "../../db/m09_04_page";
import { ページのテンプレート } from "../../db/m09_template_files";
import { M0904_ADMIN, 識別, 試験PCレイアウト, 試験モバイルレイアウト, シードのページ } from "../../seeds/m09-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 本番ホスト = "https://www.hareruyamtg.com";
/** 手元の環境の名前を、正本の本番の名前に置き換える（比べるため） */
const 本番名にする = (t: string) => t.replace(/\s+/g, " ").trim().replace(/^https?:\/\/[^/]+/, 本番ホスト);
const 見えているID = async (pa: ページ管理) => (await pa.見えている行.evaluateAll((rs) => rs.map((r) => r.id.replace("ex-page-", "")))).sort((a, b) => Number(a) - Number(b));
const 全行数 = (page: Page) => page.locator("table.table tr[id^='ex-page-']").count();

type 公開 = { 状態: number; 本文: string; タイトル: string; 開いたアドレス: string };
/** 公開側のページを開く。正本のアドレス（言語＋ページのURL欄の値）をそのまま開く。開けないときは、別のタブで画面が示すアドレス（前置きにuser_dataを含む）も試して注記に残す */
async function 公開側を開く(page: Page, 言語: "ja" | "en", url: string): Promise<公開> {
  const 開く = `${BASE_URL}/${言語}/${url}`;
  const res = await page.goto(開く, { waitUntil: "load", timeout: 60_000 });
  const 状態 = res?.status() ?? 0;
  const r: 公開 = { 状態, 本文: (await page.locator("body").innerText().catch(() => "")).trim(), タイトル: await page.title(), 開いたアドレス: page.url() };
  if (状態 >= 400) {
    const p2 = await page.context().newPage();
    try {
      const alt = await p2.goto(`${BASE_URL}/${言語}/user_data/${url}`, { waitUntil: "load", timeout: 60_000 });
      note(`正本のアドレス（/${言語}/${url}）は応答 ${状態} だった。画面が示す前置き（/${言語}/user_data/）を付けたアドレスは応答 ${alt?.status() ?? 0}（補いの確認。判定には使わない）`);
    } finally { await p2.close(); }
  }
  return r;
}

async function ログインして(page: Page): Promise<ページ管理> {
  await loginAdmin(page, M0904_ADMIN);
  return new ページ管理(page);
}

// ---------- 一覧：検索・遷移 ----------
async function 検索ケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, 語: string, 期待: string[]) {
  const pa = await ログインして(page);
  let 読み込んだ行 = 0;
  await step(1, async () => { await pa.一覧を開く(); 読み込んだ行 = await 全行数(page); });
  await step(2, async () => { await pa.検索する(語); });
  expect.soft(読み込んだ行, "検索の前に読み込まれていた行の数（0件でない）").toBeGreaterThan(0);
  return { pa, 期待ID: 期待 };
}

caseTest("IT-M09-04-002", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-002");
  const { pa } = await 検索ケース(page, step, v.ページ名, []);
  await expected(async () => {
    expect.soft(await 見えているID(pa), "ページ名で絞り込んだ一覧に見えているページのID").toEqual([notes.get("〔ページID-M0904-002〕")]);
  });
});

caseTest("IT-M09-04-005", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-005");
  const { pa } = await 検索ケース(page, step, v.ファイル名.replace(/^user_data\//, ""), []);
  await expected(async () => {
    expect.soft(await 見えているID(pa), "ファイル名で絞り込んだ一覧に見えているページのID").toEqual([notes.get("〔ページID-M0904-005〕")]);
  });
});

caseTest("IT-M09-04-006", async ({ page, step, expected }) => {
  const { pa } = await 検索ケース(page, step, "MATCH-NONE-999", []);
  await expected(async () => {
    expect.soft(await pa.見えている行.count(), "「MATCH-NONE-999」で絞り込んだ一覧に見えているページの数").toBe(0);
  });
});

caseTest("IT-M09-04-007", async ({ page, step, expected }) => {
  const pa = await ログインして(page);
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.新規作成を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ページ管理(登録)）").toMatch(/\/admin\/content\/page\/new$/);
    await pwExpect(page.locator("#main_edit_name"), "ページ名の入力欄（登録画面）").toBeVisible();
  });
});

caseTest("IT-M09-04-008", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-008");
  const id = notes.get("〔ページID-M0904-008〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/content\/page\/\d+\/edit/, { timeout: 60_000 }), pa.行(id).getByRole("link", { name: v.ページ名, exact: true }).click({ timeout: 30_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ページ管理(登録・編集)）").toMatch(new RegExp(`/admin/content/page/${id}/edit$`));
  });
});

caseTest("IT-M09-04-009", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-009");
  const id = notes.get("〔ページID-M0904-009〕");
  const pa = await ログインして(page);
  let 値: Awaited<ReturnType<ページ管理["画面の値"]>>;
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { 値 = await pa.画面の値(); });
  await expected(async () => {
    expect.soft(値.ページ名, "ページ名").toBe(v.ページ名);
    expect.soft(値.URL, "URL").toBe(v.URL);
    expect.soft(値.ファイル名, "twigファイル（ファイル名）").toBe(v.ファイル名);
    expect.soft(値.コード, "コード（日本語）").toContain("日本語初期コード");
  });
});

caseTest("IT-M09-04-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-010〕");
  const pa = await ログインして(page);
  let 状態 = 0;
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => {
    const u = new URL(page.url());
    u.pathname = u.pathname.replace(`/page/${id}/edit`, "/page/999999/edit");
    const res = await page.goto(u.toString(), { waitUntil: "load" });
    状態 = res?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(await page.locator("#main_edit_name").count(), "ページ管理(登録・編集)画面のページ名の入力欄の数（表示されない＝0）").toBe(0);
    await pwExpect.soft(page.getByText("システムエラー"), "システムエラーの画面").toBeVisible({ timeout: 5_000 });
    expect.soft(状態, "応答の状態").toBeGreaterThanOrEqual(400);
  });
});

caseTest("IT-M09-04-013", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-013〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.設定欄("ページ設定").waitFor({ state: "visible", timeout: 30_000 }); });
  await expected(async () => {
    await pwExpect.soft(page.locator("#main_edit_name"), "ページ名の入力欄").toBeEditable();
    await pwExpect.soft(page.locator("#main_edit_url"), "URLの入力欄").toBeEditable();
    await pwExpect.soft(page.locator("#main_edit_file_name"), "twigファイル（ファイル名）の入力欄").toBeEditable();
    const 読取専用 = await page.evaluate(() => (window as unknown as { editor: { getReadOnly(): boolean } }).editor.getReadOnly());
    expect.soft(読取専用, "コード欄が読み取り専用").toBe(false);
  });
});

caseTest("IT-M09-04-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-014〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.行(id).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft(await pa.行(id).locator("a[data-bs-target^='#delete_']").isVisible(), `ID ${id} の行の削除ボタンが表示されている`).toBe(true);
  });
});

async function 言語切替ケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string, 言語: "日本語" | "英語") {
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.言語を選ぶ(言語); });
  return pa;
}
caseTest("IT-M09-04-015", async ({ page, notes, step, expected }) => {
  const pa = await 言語切替ケース(page, step, notes.get("〔ページID-M0904-015〕"), "日本語");
  await expected(async () => {
    const 前置き = 本番名にする(await pa.URLの前置き.innerText());
    expect.soft(前置き, "URL欄の左の文（手元の環境の名前を本番の名前に置き換えて比べる）").toContain(`${本番ホスト}/ja/`);
    expect.soft((await pa.ファイル名の後置き.innerText()).trim(), "twigファイル（ファイル名）欄の右の文").toBe(".ja.twig");
    expect.soft(new URL(page.url()).searchParams.get("locale") ?? "ja", "画面の言語").toBe("ja");
    note(`URL欄の左の文の実際: 「${本番名にする(await pa.URLの前置き.innerText())}」。手元の環境の名前を本番の名前に置き換えて比べた（環境の違い）`);
  });
});
caseTest("IT-M09-04-016", async ({ page, notes, step, expected }) => {
  const pa = await 言語切替ケース(page, step, notes.get("〔ページID-M0904-016〕"), "英語");
  await expected(async () => {
    const 前置き = 本番名にする(await pa.URLの前置き.innerText());
    expect.soft(前置き, "URL欄の左の文（手元の環境の名前を本番の名前に置き換えて比べる）").toContain(`${本番ホスト}/en/`);
    expect.soft((await pa.ファイル名の後置き.innerText()).trim(), "twigファイル（ファイル名）欄の右の文").toBe(".en.twig");
    expect.soft(new URL(page.url()).searchParams.get("locale"), "画面の言語").toBe("en");
    note(`URL欄の左の文の実際: 「${本番名にする(await pa.URLの前置き.innerText())}」。手元の環境の名前を本番の名前に置き換えて比べた（環境の違い）`);
  });
});

// ---------- 設定欄の開閉 ----------
type 表示 = { 名前: string; 表示: boolean }[];
async function 開閉(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string, 欄: "ページ設定" | "レイアウト設定" | "メタ設定", 項目: (pa: ページ管理) => { 名前: string; loc: import("@playwright/test").Locator }[]): Promise<{ 閉じた後: 表示; 開いた後: 表示 }> {
  const pa = await ログインして(page);
  const 見え = async () => Promise.all(項目(pa).map(async (i) => ({ 名前: i.名前, 表示: await i.loc.isVisible() })));
  const r = { 閉じた後: [] as 表示, 開いた後: [] as 表示 };
  const 動きを待つ = () => page.waitForTimeout(800); // 開閉のアニメーション
  await step(1, async () => { await pa.編集を開く(id); await pwExpect(pa.設定欄(欄)).toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await pa.開閉ボタン(欄).click({ timeout: 30_000 }); await 動きを待つ(); r.閉じた後 = await 見え(); });
  await step(3, async () => { await pa.開閉ボタン(欄).click({ timeout: 30_000 }); await 動きを待つ(); r.開いた後 = await 見え(); });
  return r;
}
const ページ設定の項目 = (pa: ページ管理) => [
  { 名前: "ページ名", loc: pa.page.locator("#main_edit_name") }, { 名前: "URL", loc: pa.page.locator("#main_edit_url") },
  { 名前: "twigファイル", loc: pa.page.locator("#main_edit_file_name") }, { 名前: "コード", loc: pa.page.locator("#editor") },
];
const レイアウト設定の項目 = (pa: ページ管理) => [
  { 名前: "PC", loc: pa.page.locator("#main_edit_PcLayout") }, { 名前: "モバイル", loc: pa.page.locator("#main_edit_SpLayout") },
];
const メタ設定の項目 = (pa: ページ管理) => [
  { 名前: "author", loc: pa.page.locator("#main_edit_author") }, { 名前: "description", loc: pa.page.locator("#main_edit_description") },
  { 名前: "keyword", loc: pa.page.locator("#main_edit_keyword") }, { 名前: "robot", loc: pa.page.locator("#main_edit_meta_robots") },
  { 名前: "metatag", loc: pa.page.locator("#main_edit_meta_tags") },
];
caseTest("IT-M09-04-017", async ({ page, notes, step, expected }) => {
  const r = await 開閉(page, step, notes.get("〔ページID-M0904-017〕"), "ページ設定", ページ設定の項目);
  await expected(async () => {
    for (const x of r.閉じた後) expect.soft(x.表示, `開閉ボタンを1回押したあとの「${x.名前}」の表示（非表示になる）`).toBe(false);
    for (const x of r.開いた後) expect.soft(x.表示, `開閉ボタンをもう1回押したあとの「${x.名前}」の表示（再表示される）`).toBe(true);
  });
});
caseTest("IT-M09-04-018", async ({ page, notes, step, expected }) => {
  const r = await 開閉(page, step, notes.get("〔ページID-M0904-018〕"), "レイアウト設定", レイアウト設定の項目);
  await expected(async () => {
    for (const x of r.閉じた後) expect.soft(x.表示, `開閉ボタンを1回押したあとの「${x.名前}」の表示（非表示になる）`).toBe(false);
    for (const x of r.開いた後) expect.soft(x.表示, `開閉ボタンをもう1回押したあとの「${x.名前}」の表示（再表示される）`).toBe(true);
  });
});
caseTest("IT-M09-04-019", async ({ page, notes, step, expected }) => {
  const r = await 開閉(page, step, notes.get("〔ページID-M0904-019〕"), "メタ設定", メタ設定の項目);
  await expected(async () => {
    for (const x of r.閉じた後) expect.soft(x.表示, `開閉ボタンを1回押したあとの「${x.名前}」の表示（非表示になる）`).toBe(false);
    for (const x of r.開いた後) expect.soft(x.表示, `開閉ボタンをもう1回押したあとの「${x.名前}」の表示（再表示される）`).toBe(true);
  });
});

caseTest("IT-M09-04-020", async ({ page, step, expected }) => {
  const pa = await ログインして(page);
  let コード = "";
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.新規作成を押す(); await pa.エディタを待つ(); });
  await step(3, async () => { コード = await pa.コードを読む(); });
  await expected(async () => {
    expect.soft(コード.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), "コード欄に初期表示された行（空行を除く）")
      .toEqual(["{% extends 'default_frame.twig' %}", "{% block main %}", "{% endblock %}"]);
  });
});

caseTest("IT-M09-04-021", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-021");
  const pa = await ログインして(page);
  let 開いた: Page | null = null;
  try {
    await step(1, async () => { await pa.編集を開く(notes.get("〔ページID-M0904-021〕"), "ja"); });
    await step(2, async () => {
      const [p] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }), pa.ページ確認ボタン.click({ timeout: 30_000 })]);
      開いた = p;
      await p.waitForLoadState("domcontentloaded").catch(() => {});
    });
    await expected(async () => {
      expect.soft(開いた !== null, "新しいタブが開いた").toBe(true);
      const url = 開いた ? (開いた as Page).url() : "";
      expect.soft(本番名にする(url), "新しいタブのアドレス（手元の環境の名前を本番の名前に置き換えて比べる）").toBe(`${本番ホスト}/ja/${v.URL}`);
    });
  } finally { await (開いた as Page | null)?.close().catch(() => {}); }
});

caseTest("IT-M09-04-023", async ({ page, notes, step, expected }) => {
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(notes.get("〔ページID-M0904-023〕")); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/admin\/content\/page$/, { timeout: 60_000 }), pa.一覧へのリンク.click({ timeout: 30_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ページ管理(一覧)）").toMatch(/\/admin\/content\/page$/);
    await pwExpect.soft(pa.検索ボックス, "一覧の検索ボックス").toBeVisible();
  });
});

// ---------- 新規登録 ----------
caseTest("IT-M09-04-024", async ({ page, step, expected }) => {
  const 名 = 識別("全項目登録ページ"); const 場所 = 識別("user_data/all_fields");
  const pa = await ログインして(page);
  let 行: ReturnType<typeof ページ名で> = []; let レイアウト: ReturnType<typeof レイアウトの設定> = [];
  await step(1, async () => { await pa.新規画面を開く(); });
  await step(2, async () => { await pa.入力する({ ページ名: 名, URL: 場所, ファイル名: 場所, コード: "{% extends 'default_frame.twig' %}{% block main %}全項目登録{% endblock %}" }); });
  await step(3, async () => {
    await pa.入力する({ PC: 試験PCレイアウト(), モバイル: 試験モバイルレイアウト(), author: "Test Author", description: "Test Description", keyword: "test-keyword", robot: "index,follow", metatag: '<meta name="test" content="all-fields">' });
  });
  await step(4, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(5, async () => { 行 = ページ名で(名); if (行.length) レイアウト = レイアウトの設定(行[0].ページID); });
  await expected(async () => {
    expect.soft(行.length, "ページ名「全項目登録ページ」（印つき）のページの件数").toBe(1);
    const r = 行[0];
    expect.soft(r?.URL, "URL").toBe(場所);
    expect.soft(r?.ファイル名, "twigファイル（ファイル名）").toBe(場所);
    expect.soft(r?.author, "author").toBe("Test Author");
    expect.soft(r?.description, "description").toBe("Test Description");
    expect.soft(r?.keyword, "keyword").toBe("test-keyword");
    expect.soft(r?.robot, "robot").toBe("index,follow");
    expect.soft(r?.metatag, "metatag").toBe('<meta name="test" content="all-fields">');
    expect.soft(r?.利用者作成, "編集可否区分が利用者作成").toBe(true);
    expect.soft(レイアウト.find((l) => l.端末種別 === "PC")?.名称, "PCのレイアウト").toBe(試験PCレイアウト());
    expect.soft(レイアウト.find((l) => l.端末種別 === "モバイル")?.名称, "モバイルのレイアウト").toBe(試験モバイルレイアウト());
    note("端末種別は、ページ自体の項目ではなく設定したレイアウトの端末種別（PCのレイアウトが設定された）で確かめた");
  });
});

caseTest("IT-M09-04-025", async ({ page, step, expected }) => {
  const 名 = 識別("日英生成ページ"); const 場所 = 識別("user_data/bilingual");
  const pa = await ログインして(page);
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await step(1, async () => { await pa.新規画面を開く("ja"); });
  await step(2, async () => { await pa.入力する({ ページ名: 名, URL: 場所, ファイル名: 場所, コード: "{% extends 'default_frame.twig' %}{% block main %}日英生成確認{% endblock %}" }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { ja = await 公開側を開く(page, "ja", 場所); });
  await step(5, async () => { en = await 公開側を開く(page, "en", 場所); });
  await expected(async () => {
    expect.soft(ja?.状態, "日本語のアドレスの応答").toBe(200);
    expect.soft(ja?.本文, "日本語のアドレスに表示された内容").toContain("日英生成確認");
    expect.soft(en?.状態, "英語のアドレスの応答").toBe(200);
    expect.soft(en?.本文, "英語のアドレスに表示された内容").toContain("日英生成確認");
  });
});

caseTest("IT-M09-04-026", async ({ page, step, expected }) => {
  const 名 = 識別("任意項目空ページ"); const 場所 = 識別("user_data/optional_empty");
  const pa = await ログインして(page);
  let 行: ReturnType<typeof ページ名で> = []; let レイアウト: ReturnType<typeof レイアウトの設定> = [];
  await step(1, async () => { await pa.新規画面を開く(); });
  await step(2, async () => { await pa.入力する({ ページ名: 名, URL: 場所, ファイル名: 場所, コード: "{% extends 'default_frame.twig' %}{% block main %}任意項目空{% endblock %}" }); });
  await step(3, async () => { await pa.入力する({ PC: null, モバイル: null, author: "", description: "", keyword: "", robot: "", metatag: "" }); });
  await step(4, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(5, async () => { 行 = ページ名で(名); if (行.length) レイアウト = レイアウトの設定(行[0].ページID); });
  await expected(async () => {
    expect.soft(行.length, "ページ名「任意項目空ページ」（印つき）のページの件数").toBe(1);
    const r = 行[0];
    for (const [k, v] of [["author", r?.author], ["description", r?.description], ["keyword", r?.keyword], ["robot", r?.robot], ["metatag", r?.metatag]] as const) {
      expect.soft(v ?? "", `${k}（空）`).toBe("");
    }
    expect.soft(レイアウト.length, "設定されたレイアウトの数（PC・モバイルとも未設定）").toBe(0);
    expect.soft(r?.利用者作成, "編集可否区分が利用者作成").toBe(true);
  });
});

caseTest("IT-M09-04-058", async ({ page, step, expected }) => {
  const 名 = 識別("登録後遷移ページ-M0904-058"); const 場所 = 識別("user_data/m0904-058-after");
  const pa = await ログインして(page);
  let 画面: { ページ名: string; URL: string } = { ページ名: "", URL: "" };
  await step(1, async () => { await pa.新規画面を開く("ja"); });
  await step(2, async () => { await pa.入力する({ ページ名: 名, URL: 場所, ファイル名: 場所, コード: "{% extends 'default_frame.twig' %}{% block main %}登録後遷移M0904-058{% endblock %}" }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { const v = await pa.画面の値().catch(() => null); 画面 = { ページ名: v?.ページ名 ?? "", URL: v?.URL ?? "" }; });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（登録したページの登録・編集画面）").toMatch(/\/admin\/content\/page\/\d+\/edit$/);
    expect.soft(画面.ページ名, "ページ名欄").toBe(名);
    expect.soft(画面.URL, "URL欄").toBe(場所);
  });
});

caseTest("IT-M09-04-067", async ({ page, step, expected }) => {
  const 名 = 識別("CB英語選択登録ページM0904CB067"); const 場所 = 識別("user_data/m0904cb067-new");
  const pa = await ログインして(page);
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await step(1, async () => { await pa.一覧を開く(); await pa.新規作成を押す(); await pa.エディタを待つ(); });
  await step(2, async () => { await pa.言語を選ぶ("英語"); });
  await step(3, async () => { await pa.入力する({ ページ名: 名, URL: 場所, ファイル名: 場所, コード: "{% extends 'default_frame.twig' %}{% block main %}英語選択登録確認M0904CB067{% endblock %}" }); });
  await step(4, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(5, async () => { ja = await 公開側を開く(page, "ja", 場所); });
  await step(6, async () => { en = await 公開側を開く(page, "en", 場所); });
  await expected(async () => {
    expect.soft(ja?.本文, "日本語のアドレスに表示された内容").toContain("英語選択登録確認M0904CB067");
    expect.soft(en?.本文, "英語のアドレスに表示された内容").toContain("英語選択登録確認M0904CB067");
  });
});

// ---------- 更新 ----------
const 長さ = (c: string, n: number) => c.repeat(n);
caseTest("IT-M09-04-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-029〕");
  const pa = await ログインして(page);
  let 行: ReturnType<typeof ページIDで> = null; let 結果: Awaited<ReturnType<ページ管理["登録して結果を読む"]>> | null = null;
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => {
    await pa.入力する({ ページ名: 長さ("あ", 255), URL: 長さ("u", 255), ファイル名: 長さ("f", 255), author: 長さ("m", 255), description: 長さ("m", 255), keyword: 長さ("m", 255), robot: 長さ("m", 255) });
  });
  await step(3, async () => { 結果 = await pa.登録して結果を読む(); if (!結果.成功) note(`登録できなかった: ${結果.システムエラー ? "システムエラー" : 結果.入力エラー.join(" / ")}`); });
  await step(4, async () => { 行 = ページIDで(id); });
  await expected(async () => {
    expect.soft(行?.ページ名 ?? "", "ページ名（255文字）").toBe(長さ("あ", 255));
    expect.soft(行?.URL ?? "", "URL（255文字）").toBe(長さ("u", 255));
    expect.soft(行?.ファイル名 ?? "", "twigファイル（255文字）").toBe(長さ("f", 255));
    expect.soft(行?.author ?? "", "author（255文字）").toBe(長さ("m", 255));
    expect.soft(行?.description ?? "", "description（255文字）").toBe(長さ("m", 255));
    expect.soft(行?.keyword ?? "", "keyword（255文字）").toBe(長さ("m", 255));
    expect.soft(行?.robot ?? "", "robot（255文字）").toBe(長さ("m", 255));
  });
});

caseTest("IT-M09-04-036", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-036〕");
  const pa = await ログインして(page);
  let 行: ReturnType<typeof ページIDで> = null;
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.入力する({ ページ名: "自身URL更新ページ" }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { 行 = ページIDで(id); });
  await expected(async () => { expect.soft(行?.ページ名, `ID ${id} のページ名`).toBe("自身URL更新ページ"); });
});

caseTest("IT-M09-04-040", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-040〕");
  const 場所 = 識別("user_data/updated_page");
  const pa = await ログインして(page);
  let 行: ReturnType<typeof ページIDで> = null; let レイアウト: ReturnType<typeof レイアウトの設定> = [];
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.入力する({ ページ名: "全項目更新ページ", URL: 場所, ファイル名: 場所 }); });
  await step(3, async () => {
    await pa.入力する({ PC: 試験PCレイアウト(), モバイル: 試験モバイルレイアウト(), author: "Updated Author", description: "Updated Description", keyword: "updated-keyword", robot: "noindex,follow", metatag: '<meta name="test" content="updated">' });
  });
  await step(4, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(5, async () => { 行 = ページIDで(id); レイアウト = レイアウトの設定(id); });
  await expected(async () => {
    expect.soft(行?.ページ名, "ページ名").toBe("全項目更新ページ");
    expect.soft(行?.URL, "URL").toBe(場所);
    expect.soft(行?.ファイル名, "twigファイル（ファイル名）").toBe(場所);
    expect.soft(行?.author, "author").toBe("Updated Author");
    expect.soft(行?.description, "description").toBe("Updated Description");
    expect.soft(行?.keyword, "keyword").toBe("updated-keyword");
    expect.soft(行?.robot, "robot").toBe("noindex,follow");
    expect.soft(行?.metatag, "metatag").toBe('<meta name="test" content="updated">');
    expect.soft(レイアウト.find((l) => l.端末種別 === "PC")?.名称, "PCのレイアウト").toBe(試験PCレイアウト());
    expect.soft(レイアウト.find((l) => l.端末種別 === "モバイル")?.名称, "モバイルのレイアウト").toBe(試験モバイルレイアウト());
  });
});

/** 日本語・英語のコードを別々に確かめるケース（041・064・068） */
async function コード更新ケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string, v: { URL: string; ファイル名: string }, 選ぶ言語: "日本語" | "英語", 新コード: string, 直接開く: boolean) {
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.言語を選ぶ(選ぶ言語); });
  await step(3, async () => {
    await pa.コードを入れる(新コード);
    const r = await pa.登録して結果を読む();
    if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`);
  });
  void 直接開く;
  return pa;
}
caseTest("IT-M09-04-041", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-041");
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await コード更新ケース(page, step, notes.get("〔ページID-M0904-041〕"), v, "日本語", "{% extends 'default_frame.twig' %}{% block main %}日本語更新コード{% endblock %}", true);
  await step(4, async () => { ja = await 公開側を開く(page, "ja", v.URL); });
  await step(5, async () => { en = await 公開側を開く(page, "en", v.URL); });
  await expected(async () => {
    expect.soft(ja?.本文, "日本語のアドレスに表示された内容").toContain("日本語更新コード");
    expect.soft(en?.本文, "英語のアドレスに表示された内容（更新前）").toContain("English initial code");
  });
});

caseTest("IT-M09-04-064", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-DPEN-064");
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await コード更新ケース(page, step, notes.get("〔ページID-M0904-064〕"), v, "英語", "{% extends 'default_frame.twig' %}{% block main %}English updated M0904-064{% endblock %}", true);
  await step(4, async () => { en = await 公開側を開く(page, "en", v.URL); });
  await step(5, async () => { ja = await 公開側を開く(page, "ja", v.URL); });
  await expected(async () => {
    expect.soft(en?.本文, "英語のアドレスに表示された内容").toContain("English updated M0904-064");
    expect.soft(ja?.本文, "日本語のアドレスに表示された内容（更新前）").toContain("日本語初期M0904-064");
  });
});

caseTest("IT-M09-04-068", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-CBEDIT-068");
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await コード更新ケース(page, step, notes.get("〔ページID-M0904-068〕"), v, "日本語", "{% extends 'default_frame.twig' %}{% block main %}日本語更新M0904CB068{% endblock %}", false);
  await step(4, async () => { ja = await 公開側を開く(page, "ja", v.URL); });
  await step(5, async () => { en = await 公開側を開く(page, "en", v.URL); });
  await expected(async () => {
    expect.soft(ja?.本文, "日本語のアドレスに表示された内容").toContain("日本語更新M0904CB068");
    expect.soft(en?.本文, "英語のアドレスに表示された内容（更新前）").toContain("English initial M0904CB068");
  });
});

caseTest("IT-M09-04-042", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-RENAME-042");
  const id = notes.get("〔ページID-M0904-042〕");
  const pa = await ログインして(page);
  let ja: 公開 | null = null; let en: 公開 | null = null;
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { await pa.入力する({ ファイル名: 識別("user_data/rename_after") }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { ja = await 公開側を開く(page, "ja", v.URL); });
  await step(5, async () => { en = await 公開側を開く(page, "en", v.URL); });
  await expected(async () => {
    expect.soft(ja?.状態, "日本語のアドレスの応答（ページが表示される）").toBe(200);
    expect.soft(en?.状態, "英語のアドレスの応答（ページが表示される）").toBe(200);
    expect.soft(ページIDで(id)?.ファイル名, `ID ${id} の変更後のファイル名`).toBe(識別("user_data/rename_after"));
  });
});

caseTest("IT-M09-04-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-043〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.入力する({ ページ名: "保存遷移確認ページ" }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（保存したページの登録・編集画面）").toMatch(new RegExp(`/admin/content/page/${id}/edit$`));
  });
});

async function タイトルケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string, v: { URL: string }, コード: string): Promise<公開> {
  const pa = await ログインして(page);
  let r: 公開 | null = null;
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { await pa.コードを入れる(コード); });
  await step(3, async () => { const x = await pa.登録して結果を読む(); if (!x.成功) note(`登録できなかった: ${x.システムエラー ? "システムエラー" : x.入力エラー.join(" / ")}`); });
  await step(4, async () => { r = await 公開側を開く(page, "ja", v.URL); });
  await step(5, async () => { /* ブラウザに表示されたtitleタグを確認する（公開側を開いたときに読んだ値） */ expect.soft((r as 公開 | null)?.タイトル !== undefined, "titleタグを読めた").toBe(true); });
  return r as unknown as 公開;
}
const タイトル末尾 = " | 日本最大級 MTG通販サイト『晴れる屋』";
caseTest("IT-M09-04-046", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-046");
  let 結果!: 公開;
  const 本体 = async () => { 結果 = await タイトルケース(page, step, notes.get("〔ページID-M0904-046〕"), v, "{% extends 'default_frame.twig' %}{% set noShopName = true %}{% block main %}タイトル確認{% endblock %}"); };
  await 本体();
  await expected(async () => {
    expect.soft(結果?.本文, "公開側に表示された内容（ページが表示されている）").toContain("タイトル確認");
    expect.soft(結果?.タイトル.endsWith(タイトル末尾), `titleタグ「${結果?.タイトル}」の末尾に「${タイトル末尾}」が付く`).toBe(false);
  });
});
caseTest("IT-M09-04-060", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-060");
  const 結果 = await タイトルケース(page, step, notes.get("〔ページID-M0904-060〕"), v, "{% extends 'default_frame.twig' %}{% block main %}タイトル確認M0904-060{% endblock %}");
  await expected(async () => {
    expect.soft(結果?.本文, "公開側に表示された内容（ページが表示されている）").toContain("タイトル確認M0904-060");
    expect.soft(結果?.タイトル.endsWith(タイトル末尾), `titleタグ「${結果?.タイトル}」の末尾に「${タイトル末尾}」が付く`).toBe(true);
  });
});

caseTest("IT-M09-04-061", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-PAGE-061");
  const id = notes.get("〔ページID-M0904-061〕");
  const pa = await ログインして(page);
  let 結果: Awaited<ReturnType<ページ管理["登録して結果を読む"]>> | null = null; let 画面URL = "";
  await step(1, async () => { await pa.編集を開く(id); });
  await step(2, async () => { await pa.入力する({ URL: 識別("user_data/m0904-061-trail/") }); });
  await step(3, async () => { 結果 = await pa.登録して結果を読む(); });
  await step(4, async () => { await pa.一覧を開く(); await pa.行(id).getByRole("link").first().click({ timeout: 30_000 }); await pa.エディタを待つ(); 画面URL = (await pa.画面の値()).URL; });
  await expected(async () => {
    expect.soft(結果?.成功, "末尾がスラッシュのURLでの登録が成功しない（入力エラー）").toBe(false);
    expect.soft(画面URL, "開き直したURL欄").toBe(v.URL);
  });
});

caseTest("IT-M09-04-059", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-LANG-059");
  const id = notes.get("〔ページID-M0904-059〕");
  const pa = await ログインして(page);
  let 英語: string | null = null;
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { await pa.入力する({ ファイル名: 識別("user_data/m0904-059-after") }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { 英語 = ページのテンプレート(v.ファイル名, "en"); });
  await expected(async () => {
    expect.soft(英語 === null ? null : 英語.trim(), "英語のtwigファイル（変更前のファイル名）の内容").toBe("{% extends 'default_frame.twig' %}{% block main %}English initial M0904-059{% endblock %}");
  });
});

caseTest("IT-M09-04-062", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-062〕");
  const 後 = 識別("user_data/m0904-062-after");
  const pa = await ログインして(page);
  let 英語: string | null = "";
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { await pa.入力する({ ファイル名: 後 }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { 英語 = ページのテンプレート(後, "en"); });
  await expected(async () => { expect.soft(英語, "英語のtwigファイル（変更後のファイル名）の有無（無い）").toBeNull(); });
});

caseTest("IT-M09-04-070", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-CBRENAME-070");
  const id = notes.get("〔ページID-M0904-070〕");
  const 後 = 識別("m0904cb070-after/user_data");
  const pa = await ログインして(page);
  let 新英: string | null = null; let 新日: string | null = null; let 旧英: string | null = null;
  await step(1, async () => { await pa.編集を開く(id, "en"); });
  await step(2, async () => { await pa.入力する({ ファイル名: 後 }); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  await step(4, async () => { 新英 = ページのテンプレート(後, "en"); 新日 = ページのテンプレート(後, "ja"); 旧英 = ページのテンプレート(v.ファイル名, "en"); });
  await expected(async () => {
    expect.soft(新英 !== null, "変更後の英語のtwigファイルが存在する").toBe(true);
    expect.soft(新日 === null, "変更後の日本語のtwigファイルが存在しない").toBe(true);
    expect.soft(旧英 === null, "変更前の英語のtwigファイルが存在しない").toBe(true);
  });
});

// ---------- 一覧：表示・削除 ----------
caseTest("IT-M09-04-056", async ({ page, notes, step, expected }) => {
  const v = シードのページ("S-M09-04-LAYPAGE-056");
  const id = notes.get("〔ページID-M0904-056〕");
  const pa = await ログインして(page);
  let レイアウト名欄 = "";
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.検索する(v.ページ名); });
  await step(3, async () => { await pwExpect(pa.行(id)).toBeVisible({ timeout: 30_000 }); レイアウト名欄 = (await pa.行(id).locator("td").nth(4).innerText()).replace(/\s+/g, " ").trim(); });
  await expected(async () => {
    expect.soft(レイアウト名欄, `ID ${id} の行のレイアウト名欄`).toContain(試験PCレイアウト());
  });
});

async function 削除前(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string) {
  const pa = await ログインして(page);
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.行の削除を押す(id); });
  return pa;
}
caseTest("IT-M09-04-048", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-048〕");
  const pa = await 削除前(page, step, id);
  let 行: ReturnType<typeof ページIDで> = null;
  await step(3, async () => { await pa.モーダルでキャンセルする(id); });
  await step(4, async () => { 行 = ページIDで(id); });
  await expected(async () => { expect.soft(行?.ページID, `ID ${id} のページがDBに残っている`).toBe(id); });
});
caseTest("IT-M09-04-049", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-049〕");
  const pa = await 削除前(page, step, id);
  let 行: ReturnType<typeof ページIDで> = null;
  await step(3, async () => { await pa.モーダルで削除する(id); });
  await step(4, async () => { 行 = ページIDで(id); });
  await expected(async () => { expect.soft(行, `ID ${id} のページがDBに無い`).toBeNull(); });
});
caseTest("IT-M09-04-050", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-050〕");
  const pa = await 削除前(page, step, id);
  await step(3, async () => { await pa.モーダルで削除する(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（ページ管理(一覧)）").toMatch(/\/admin\/content\/page$/);
    await pwExpect.soft(pa.検索ボックス, "一覧の検索ボックス").toBeVisible();
  });
});

caseTest("IT-M09-04-051", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-051〕");
  const paA = await ログインして(page);
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    await loginAdmin(pageB, M0904_ADMIN);
    const paB = new ページ管理(pageB);
    await step(1, async () => { await paA.一覧を開く(); await paA.行の削除を押す(id); });
    await step(2, async () => { await paB.一覧を開く(); await paB.行の削除を押す(id); await paB.モーダルで削除する(id); });
    await step(3, async () => {
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === "POST" && /\/content\/page\/\d+\/delete/.test(r.url()), { timeout: 60_000 }),
        paA.モーダル(id).getByRole("link", { name: "削除" }).click({ timeout: 30_000 }),
      ]);
      await pwExpect(page.locator(".alert").filter({ hasNotText: "デバッグモード" }).first()).toBeVisible({ timeout: 60_000 });
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "ブラウザAに表示された画面のアドレス（ページ管理(一覧)）").toMatch(/\/admin\/content\/page$/);
      await pwExpect.soft(paA.検索ボックス, "ブラウザAの一覧の検索ボックス").toBeVisible();
    });
  } finally { await ctxB.close(); }
});

// ---------- 追加分（2026-11-11） ----------
/** 見えている行のID（画面の並びのまま） */
const 並びのID = async (pa: ページ管理) => pa.見えている行.evaluateAll((rs) => rs.map((r) => r.id.replace("ex-page-", "")));

caseTest("IT-M09-04-001", async ({ page, notes, step, expected }) => {
  const 開発者 = notes.get("〔ページID-M0904-001開発者〕"); const モバイル = notes.get("〔ページID-M0904-001モバイル〕"); const PC = notes.get("〔ページID-M0904-001PC〕");
  const pa = await ログインして(page);
  let ids: string[] = [];
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { ids = await 並びのID(pa); });
  note("既存のページ情報は置き換えない（書き換え・削除をしない方針）ので、「ほかのページが無い」ことは確かめない。印つきの3件（PC・開発者作成／モバイル用レイアウトのみ・利用者作成／PC・利用者作成）で、PCのページが表示され、モバイルのページと ID 0 が表示されず、ID昇順であることを確かめる");
  await expected(async () => {
    expect.soft(ids.includes(開発者), `PC・開発者作成のページ（ID ${開発者}）が表示されている`).toBe(true);
    expect.soft(ids.includes(PC), `PC・利用者作成のページ（ID ${PC}）が表示されている`).toBe(true);
    expect.soft(ids.includes(モバイル), `モバイルのページ（ID ${モバイル}）が表示されない`).toBe(false);
    expect.soft(ids.includes("0"), "ID 0 のページが表示されない").toBe(false);
    const 昇順 = ids.every((v, i) => i === 0 || Number(ids[i - 1]) < Number(v));
    expect.soft(昇順, "表示されたページがID昇順").toBe(true);
  });
});

caseTest("IT-M09-04-003", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-003〕");
  const 語 = 識別("route_only_beta-003");
  const pa = await ログインして(page);
  let 読み込んだ行 = 0; let ids: string[] = []; let ルーティング名欄 = "";
  await step(1, async () => { await pa.一覧を開く(); 読み込んだ行 = await 全行数(page); });
  await step(2, async () => { await pa.検索する(語); ids = await 並びのID(pa); if (ids.includes(id)) ルーティング名欄 = (await pa.行(id).locator("td").nth(1).innerText()).trim(); });
  note("ルーティング名に対応付ける表示URLは設定していない（画面のルート定義は書き換えない方針）。ルーティング名欄の値の一致で確かめる");
  await expected(async () => {
    expect.soft(読み込んだ行, "検索の前に読み込まれていた行の数（0件でない）").toBeGreaterThan(0);
    expect.soft(ids, "検索語に一致して表示されたページのID").toEqual([id]);
    expect.soft(ルーティング名欄, "そのページのルーティング名欄").toContain(語);
  });
});

caseTest("IT-M09-04-011", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-011〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { await pa.設定欄("ページ設定").waitFor({ state: "visible", timeout: 30_000 }); });
  note("開発者作成のページはDBで設定した（画面では登録できない）。日英テンプレートは置いていないので、コード欄の中身は空");
  await expected(async () => {
    expect.soft(await page.locator("#main_edit_url").count(), "URLの入力欄の数").toBe(0);
    expect.soft(await page.locator("#main_edit_file_name").count(), "twigファイルの入力欄の数").toBe(0);
    const 読取専用 = await page.evaluate(() => (window as unknown as { editor: { getReadOnly(): boolean } }).editor.getReadOnly());
    expect.soft(読取専用, "コード欄が読み取り専用（入力できない）").toBe(true);
  });
});

caseTest("IT-M09-04-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-012〕");
  const pa = await ログインして(page);
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.行(id).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    await pwExpect.soft(pa.行(id), `ID ${id} の行が一覧にある`).toBeVisible();
    expect.soft(await pa.行(id).locator("a[data-bs-target^='#delete_']").count(), `ID ${id} の行の削除ボタンの数`).toBe(0);
  });
});

caseTest("IT-M09-04-022", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-022〕");
  const pa = await ログインして(page);
  let 表示 = "";
  await step(1, async () => { await pa.編集を開く(id, "ja"); });
  await step(2, async () => { 表示 = (await page.locator("#pageDetail .row").filter({ hasText: "最終更新日時" }).first().innerText()).replace(/\s+/g, " ").trim(); });
  note("最終更新日時は、DBで 2025/10/25 10:30（日本時間）に設定した（画面で指定できないため）");
  await expected(async () => { expect.soft(表示, "最終更新日時の欄").toContain("2025/10/25 10:30"); });
});

async function 重複登録ケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, id: string | null, 入力: ページの値) {
  const pa = await ログインして(page);
  await step(1, async () => { if (id) await pa.編集を開く(id); else await pa.新規画面を開く("ja"); });
  await step(2, async () => { await pa.入力する(入力); });
  await step(3, async () => { const r = await pa.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  return pa;
}

caseTest("IT-M09-04-035", async ({ page, notes, step, expected }) => {
  const 共有 = notes.get("〔ページID-M0904-共有〕");
  const 名 = 識別("URL重複新規ページ"); const url = 識別("user_data/duplicate_url");
  await 重複登録ケース(page, step, null, { ページ名: 名, URL: url, ファイル名: 識別("user_data/new_unique_file"), コード: "{% extends 'default_frame.twig' %}{% block main %}URL重複{% endblock %}" });
  let 同名: ReturnType<typeof ページ名で> = []; let 同URL: ReturnType<typeof URLで> = [];
  await step(4, async () => { 同名 = ページ名で(名); 同URL = URLで(url); });
  note("既存の利用者作成ページは、画面で作った印つきのページ（ID は 〔ページID-M0904-共有〕）で読み替えた");
  await expected(async () => {
    expect.soft(同名.length, "ページ名「URL重複新規ページ」（印つき）のページの件数").toBe(0);
    expect.soft(同URL.map((r) => r.ページID), "そのURLを持つページ（既存の1件だけ）").toEqual([共有]);
  });
});

type 重複更新 = { 番号: string; 項目: "URL" | "ファイル名"; 新名: string; 新ファイル: string };
async function 重複更新ケース(page: Page, notes: { get(k: string): string }, step: (n: number, f: () => Promise<void>) => Promise<void>, c: 重複更新) {
  const { 番号, 項目, 新名, 新ファイル } = c;
  const id = notes.get(`〔ページID-M0904-${番号}〕`);
  const v = シードのページ(`S-M09-04-PAGE-${番号}`);
  const 入力: ページの値 = 項目 === "URL" ? { ページ名: 識別(新名), URL: 識別("user_data/duplicate_url") } : { ページ名: 識別(新名), ファイル名: 識別(新ファイル) };
  await 重複登録ケース(page, step, id, 入力);
  return { id, v };
}
caseTest("IT-M09-04-037", async ({ page, notes, step, expected }) => {
  let 行: ReturnType<typeof ページIDで> = null;
  const { id, v } = await 重複更新ケース(page, notes, step, { 番号: "037", 項目: "URL", 新名: "他ページURL更新試験", 新ファイル: "" });
  await step(4, async () => { 行 = ページIDで(id); });
  note("基準のページは、画面で作った印つきのページで読み替えた");
  await expected(async () => {
    expect.soft(行?.ページ名, `ID ${id} のページ名が更新前の値のまま`).toBe(v.ページ名);
    expect.soft(行?.URL, `ID ${id} のURLが更新前の値のまま`).toBe(v.URL);
  });
});
caseTest("IT-M09-04-038", async ({ page, notes, step, expected }) => {
  let 行: ReturnType<typeof ページIDで> = null;
  const { id, v } = await 重複更新ケース(page, notes, step, { 番号: "038", 項目: "ファイル名", 新名: "利用者ファイル重複試験", 新ファイル: "user_data/duplicate_user_file" });
  await step(4, async () => { 行 = ページIDで(id); });
  note("基準のページは、画面で作った印つきのページで読み替えた");
  await expected(async () => {
    expect.soft(行?.ページ名, `ID ${id} のページ名が更新前の値のまま`).toBe(v.ページ名);
    expect.soft(行?.ファイル名, `ID ${id} のtwigファイルが更新前の値のまま`).toBe(v.ファイル名);
  });
});
caseTest("IT-M09-04-039", async ({ page, notes, step, expected }) => {
  let 行: ReturnType<typeof ページIDで> = null;
  const { id, v } = await 重複更新ケース(page, notes, step, { 番号: "039", 項目: "ファイル名", 新名: "標準ファイル重複試験", 新ファイル: "default/duplicate_standard_file" });
  await step(4, async () => { 行 = ページIDで(id); });
  note("ID 40 の開発者作成ページは、画面で作った印つきのページ（DBで編集可否区分を既定にした）で読み替えた");
  await expected(async () => {
    expect.soft(行?.ページ名, `ID ${id} のページ名が更新前の値のまま`).toBe(v.ページ名);
    expect.soft(行?.ファイル名, `ID ${id} のtwigファイルが更新前の値のまま`).toBe(v.ファイル名);
  });
});

function TOPを確かめる(): string {
  const top = ページIDで("1");
  if (!top || top.URL !== "homepage" || top.ファイル名 !== "index" || !top.既定) {
    throw new Error(`初期データのTOPページ（ID 1）がシード表の前提（URL=homepage・twigファイル=index・編集可否区分=既定）と違う: ${JSON.stringify(top)}（共有のデータなので書き換えない。止める）`);
  }
  return top.ページID;
}

caseTest("IT-M09-04-052", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-052〕");
  const topId = TOPを確かめる();
  const pa = await ログインして(page);
  let TOP入力欄 = -1; let TOP表示 = ""; let 利用者入力欄 = false;
  await step(1, async () => { await pa.編集を開く(topId, "ja"); TOP入力欄 = await page.locator("#main_edit_url").count(); TOP表示 = (await page.locator("#pageDetail .row").filter({ hasText: "URL" }).first().innerText()).replace(/\s+/g, " ").trim(); });
  await step(2, async () => { await pa.編集を開く(id, "ja"); 利用者入力欄 = await page.locator("#main_edit_url").isVisible(); });
  await expected(async () => {
    expect.soft(TOP入力欄, "TOPページのURLの入力欄の数").toBe(0);
    expect.soft(TOP表示, "TOPページのURL欄に現在のURLが表示されている").toContain(new URL(BASE_URL).host);
    expect.soft(利用者入力欄, `利用者作成のID ${id} のURLの入力欄が表示されている`).toBe(true);
  });
});

caseTest("IT-M09-04-053", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ページID-M0904-053〕");
  const topId = TOPを確かめる();
  const pa = await ログインして(page);
  let TOP入力欄 = -1; let TOP表示 = ""; let 利用者入力欄 = false;
  await step(1, async () => { await pa.編集を開く(topId, "ja"); TOP入力欄 = await page.locator("#main_edit_file_name").count(); TOP表示 = (await page.locator("#pageDetail .row").filter({ hasText: "ファイル名" }).first().innerText()).replace(/\s+/g, " ").trim(); });
  await step(2, async () => { await pa.編集を開く(id, "ja"); 利用者入力欄 = await page.locator("#main_edit_file_name").isVisible(); });
  await expected(async () => {
    expect.soft(TOP入力欄, "TOPページのファイル名の入力欄の数").toBe(0);
    expect.soft(TOP表示, "TOPページのファイル名欄に現在のファイル名が表示されている").toContain("index.ja.twig");
    expect.soft(利用者入力欄, `利用者作成のID ${id} のファイル名の入力欄が表示されている`).toBe(true);
  });
});

caseTest("IT-M09-04-057", async ({ page, notes, step, expected }) => {
  const 名 = 識別("PC同URL新規ページ-M0904-057");
  const モバイルID = notes.get("〔ページID-M0904-057〕");
  const pa = await ログインして(page);
  let 登録: Awaited<ReturnType<ページ管理["登録して結果を読む"]>> | null = null; let ids: string[] = []; let モバイル表示 = 0;
  await step(1, async () => { await pa.新規画面を開く("ja"); });
  await step(2, async () => { await pa.入力する({ ページ名: 名, URL: 識別("user_data/m0904-057-same-url"), ファイル名: 識別("user_data/m0904-057-new-file"), コード: "{% extends 'default_frame.twig' %}{% block main %}PC同URL確認M0904-057{% endblock %}" }); });
  await step(3, async () => { 登録 = await pa.登録して結果を読む(); });
  await step(4, async () => { await pa.一覧を開く(); });
  await step(5, async () => {
    await pa.検索する(名); ids = await 並びのID(pa);
    for (const id of ids) モバイル表示 += await pa.行(id).locator("td").nth(4).locator("i.fa-mobile").count();
  });
  note("モバイルのページは、モバイル欄にレイアウトだけを設定した印つきのページ（ID は 〔ページID-M0904-057〕）。新しいページはレイアウトを設定せずに登録した（PC端末種別の指定は手順に無い）");
  await expected(async () => {
    expect.soft(登録?.成功, `登録が成功する（入力エラー: ${登録?.入力エラー.join(" / ") ?? ""}）`).toBe(true);
    expect.soft(ids.length, "ページ名「PC同URL新規ページ-M0904-057」（印つき）の表示件数").toBe(1);
    expect.soft(ids.includes(モバイルID), "モバイルのページは検索結果に含まれない").toBe(false);
    expect.soft(モバイル表示, "表示された行にモバイル端末種別のレイアウト表示が無い").toBe(0);
  });
});

caseTest("IT-M09-04-063", async ({ page, notes, step, expected }) => {
  const 開発者 = notes.get("〔ページID-M0904-063開発者〕"); const 利用者 = notes.get("〔ページID-M0904-063〕");
  const pa = await ログインして(page);
  let ids: string[] = [];
  await step(1, async () => { await pa.一覧を開く(); });
  await step(2, async () => { await pa.検索する("m0904-063"); });
  await step(3, async () => { await pwExpect(pa.行(開発者)).toBeVisible({ timeout: 30_000 }); await pwExpect(pa.行(利用者)).toBeVisible({ timeout: 30_000 }); ids = await 並びのID(pa); });
  await step(4, async () => { await pa.行(開発者).scrollIntoViewIfNeeded(); });
  await step(5, async () => { await pa.行(利用者).scrollIntoViewIfNeeded(); });
  note("検索語「m0904-063」には前の実行の印つきのページも当たるので、2行だけとはせず、この実行の2行が並ぶことで確かめた。開発者作成のページは画面で作った印つきのページをDBで開発者作成にしたもの");
  await expected(async () => {
    expect.soft(ids.includes(開発者) && ids.includes(利用者), "この実行の開発者作成ページと利用者作成ページの2行が並んでいる").toBe(true);
    expect.soft(await pa.行(開発者).locator("a[data-bs-target^='#delete_']").count(), `ID ${開発者} の行の削除ボタンの数`).toBe(0);
    expect.soft(await pa.行(利用者).locator("a[data-bs-target^='#delete_']").count(), `ID ${利用者} の行の削除ボタンの数`).toBe(1);
  });
});
void rc;
