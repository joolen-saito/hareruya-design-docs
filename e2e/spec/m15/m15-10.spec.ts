/**
 * M15-10 アーキタイプ登録CSV。ケースの正本: integration_test/casegen/cases/M15-10_test_cases.tsv
 * 取込ファイルの名前（アーキタイプ名など）は、実行の印を付けた値で作る（ファイル名・フォーマット名(英)・色名は正本のまま）。
 * 実装しないケース（理由は記録 e2e/review/M15-10_progress_*.md）: 007（DBでの準備）、010 011 012 037 039 043 044 046（カード画像が画面から登録できない）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { アーキタイプを探す } from "../../db/m15_10_archetype";
import { csvの文面, アーキタイプCSV取込 } from "../../pages/admin/m15_10_archetype";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { 印, 既存名, 連携名, M1510_ADMIN, M1510L_ADMIN, PIONEER } from "../../seeds/m15-10";

type Step = Parameters<CaseBody>[0]["step"];
type Notes = Parameters<CaseBody>[0]["notes"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 値の注記 = () => note("名前（アーキタイプ名など）は、実行の印を付けた値で作った（ファイル名・フォーマット名(英)・色名は正本のまま）");

async function login(page: Page, a = M1510_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, a);
}

/** 手順 開始〜開始+2: 取込画面を開く・ファイルを選ぶ・アップロードを押す。アップロードへの応答のステータスを返す */
async function 取り込む(page: Page, step: Step, ファイル名: string, 中身: Buffer, 開始 = 1): Promise<{ 応答: number; 文言: string }> {
  const 画面 = new アーキタイプCSV取込(page);
  let 応答 = 0;
  await step(開始, async () => { await 画面.開く(); });
  await step(開始 + 1, async () => { await 画面.ファイルを選ぶ(ファイル名, 中身); });
  await step(開始 + 2, async () => { 応答 = await 画面.アップロードを押す(); });
  return { 応答, 文言: await 画面.文言() };
}
const 登録完了 = (文言: string) => 文言.includes("CSVファイルをアップロードしました");
const 行 = (日: string, 英: string, 代表 = "", 色 = "", フォーマット = PIONEER) => [日, 英, 代表, 色, フォーマット];
const 色 = (a: { カラー: string[] }) => [...a.カラー].sort();
const 一覧を開く = (page: Page) => page.goto(`${new URL(page.url()).origin}/admin/archetype`);

// ---- 画面の遷移 ----
caseTest("IT-M15-10-001", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 一覧を開く(page); await page.waitForLoadState("load"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "CSV取り込み" }).click()]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス").toMatch(/\/archetype\/csv_import$/);
    await expect.soft(page.getByText("アーキタイプ登録CSVアップロード").first(), "画面の見出し").toBeVisible();
  });
});
caseTest("IT-M15-10-002", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 一覧を開く(page); await page.waitForLoadState("load"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#admin_search_archetype button[type=submit]").click()]); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "CSV取り込み" }).click()]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス").toMatch(/\/archetype\/csv_import$/);
    await expect.soft(page.getByText("アーキタイプ登録CSVアップロード").first(), "画面の見出し").toBeVisible();
  });
});
caseTest("IT-M15-10-003", async ({ page, step, expected }) => {
  await login(page);
  const 画面 = new アーキタイプCSV取込(page);
  await step(1, async () => { await 画面.開く(); });
  let 開いた = false;
  await step(2, async () => {
    const chooser = page.waitForEvent("filechooser", { timeout: 15_000 }).then(() => true).catch(() => false);
    await 画面.ファイル選択ボタン.click();
    開いた = await chooser;
  });
  await expected(async () => { expect.soft(開いた, "ファイル選択ウィンドウが表示された").toBe(true); });
});

// ---- 新規登録・更新 ----
caseTest("IT-M15-10-004", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日 = 印("新規アーキタイプ-004"), 英 = 印("New Archetype-M1510-004");
  await 取り込む(page, step, "valid-new-004.csv", csvの文面([行(日, 英)]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(日); });
  await expected(async () => {
    expect.soft(r.length, "アーキタイプ名（日本語）「新規アーキタイプ-004」のアーキタイプの数").toBe(1);
    expect.soft(r[0]?.フォーマット英名, "フォーマット").toBe(PIONEER);
    expect.soft(アーキタイプを探す(日, 英).length, "アーキタイプ名（英語）「New Archetype-M1510-004」も一致する数").toBe(1);
  });
});
caseTest("IT-M15-10-005", async ({ page, step, expected }) => {
  await login(page); 値の注記();
  const 結果 = await 取り込む(page, step, "valid-new-005.csv", csvの文面([行(印("新規アーキタイプ-005"), 印("New Archetype-005"))]));
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "アップロード画面へ戻った").toMatch(/\/archetype\/csv_import$/);
    expect.soft(登録完了(await new アーキタイプCSV取込(page).文言()) || 登録完了(結果.文言), "登録完了メッセージ").toBe(true);
  });
});
caseTest("IT-M15-10-006", async ({ page, notes, step, expected, db }) => {
  void db; void notes;
  await login(page); 値の注記();
  const n = 既存名["006"];
  await 取り込む(page, step, "update-blank-006.csv", csvの文面([行(n.日, n.英)]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(n.日, n.英, PIONEER); });
  await expected(async () => {
    expect.soft(r.length, "同じキーのアーキタイプの数（新規追加されない）").toBe(1);
    expect.soft(r[0]?.ID, "更新されたアーキタイプのID〔アーキタイプID-M1510-006〕").toBe(notes.get("〔アーキタイプID-M1510-006〕"));
    expect.soft(r[0]?.公開状態, "公開状態").toBe("公開");
  });
});
caseTest("IT-M15-10-008", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const n = 既存名["008"];
  const 相違日 = 印("相違JP");
  await 取り込む(page, step, "key-nonmatch.csv", csvの文面([行(相違日, n.英), 行(n.日, 印("Different EN")), 行(n.日, n.英, "", "", "Modern")]));
  let a: ReturnType<typeof アーキタイプを探す> = [], b: typeof a = [], c: typeof a = [], 元: typeof a = [];
  await step(4, async () => {
    a = アーキタイプを探す(相違日, n.英, PIONEER); b = アーキタイプを探す(n.日, 印("Different EN"), PIONEER); c = アーキタイプを探す(n.日, n.英, "Modern");
    元 = アーキタイプを探す(n.日, n.英, PIONEER);
  });
  await expected(async () => {
    expect.soft(a.length, "日本語名だけが異なる行のアーキタイプの数").toBe(1);
    expect.soft(b.length, "英語名だけが異なる行のアーキタイプの数").toBe(1);
    expect.soft(c.length, "フォーマットだけが異なる行のアーキタイプの数").toBe(1);
    expect.soft(元.map((x) => x.ID), "もとのアーキタイプ（増えない）").toEqual([notes.get("〔アーキタイプID-M1510-008〕")]);
  });
});

// ---- カラー ----
caseTest("IT-M15-10-013", async ({ page, notes, step, expected, db }) => {
  void db; void notes;
  await login(page); 値の注記();
  const n = 既存名["013"];
  await 取り込む(page, step, "color-replace.csv", csvの文面([行(n.日, n.英, "", "青,白,青")]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(n.日, n.英, PIONEER); });
  await expected(async () => {
    expect.soft(r.map((x) => x.ID), "更新されたアーキタイプのID〔アーキタイプID-M1510-013〕").toEqual([notes.get("〔アーキタイプID-M1510-013〕")]);
    expect.soft(r[0] ? 色(r[0]) : [], "カラー（重複を除いた青と白）").toEqual(["白", "青"]);
  });
});
caseTest("IT-M15-10-014", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const n = 既存名["014"];
  await 取り込む(page, step, "color-partial.csv", csvの文面([行(n.日, n.英, "", "青,未定義色A,青")]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(n.日, n.英, PIONEER); });
  await expected(async () => {
    expect.soft(r.map((x) => x.ID), "更新されたアーキタイプのID〔アーキタイプID-M1510-014〕").toEqual([notes.get("〔アーキタイプID-M1510-014〕")]);
    expect.soft(r[0] ? 色(r[0]) : [], "カラー（解決できた青だけ）").toEqual(["青"]);
  });
});
caseTest("IT-M15-10-015", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const a = 既存名["015A"], b = 既存名["015B"];
  await 取り込む(page, step, "color-preserve.csv", csvの文面([行(a.日, a.英), 行(b.日, b.英, "", ",,,")]));
  let ra: ReturnType<typeof アーキタイプを探す> = [], rb: typeof ra = [];
  await step(4, async () => { ra = アーキタイプを探す(a.日, a.英, PIONEER); rb = アーキタイプを探す(b.日, b.英, PIONEER); });
  await expected(async () => {
    expect.soft(ra.map((x) => x.ID), "〔アーキタイプID-M1510-015A〕が更新対象").toEqual([notes.get("〔アーキタイプID-M1510-015A〕")]);
    expect.soft(ra[0] ? 色(ra[0]) : [], "「色」が空のアーキタイプのカラー（緑のまま）").toEqual(["緑"]);
    expect.soft(rb.map((x) => x.ID), "〔アーキタイプID-M1510-015B〕が更新対象").toEqual([notes.get("〔アーキタイプID-M1510-015B〕")]);
    expect.soft(rb[0] ? 色(rb[0]) : [], "「色」がカンマだけのアーキタイプのカラー（黒のまま）").toEqual(["黒"]);
  });
});
caseTest("IT-M15-10-016", async ({ page, step, expected }) => {
  await login(page); 値の注記();
  const n = 既存名["016"];
  await 取り込む(page, step, "color-invalid.csv", csvの文面([行(n.日, n.英, "", "未定義色A,未定義色B")]));
  await expected(async () => {
    const 文言 = await new アーキタイプCSV取込(page).文言();
    expect.soft(new URL(page.url()).pathname, "アップロード画面へ戻った").toMatch(/\/archetype\/csv_import$/);
    expect.soft(文言, "エラーの文言（項目名「色」）").toContain("色");
    expect.soft(文言, "エラーの文言（CSVの2行目）").toMatch(/2\s*行目|2行|行目.*2/);
  });
});

// ---- フォーマット ----
caseTest("IT-M15-10-017", async ({ page, step, expected }) => {
  await login(page); 値の注記();
  await 取り込む(page, step, "format-unknown-017.csv", csvの文面([行(印("未登録フォーマットJP-017"), 印("Unknown Format EN-017"), "", "", "UnknownFormat")]));
  await expected(async () => {
    const 文言 = await new アーキタイプCSV取込(page).文言();
    expect.soft(new URL(page.url()).pathname, "アップロード画面にとどまった").toMatch(/\/archetype\/csv_import$/);
    expect.soft(文言, "フォーマットが存在しないことを示すメッセージ").toContain("フォーマット");
    expect.soft(文言.includes("UnknownFormat") || /存在しません|見つかりません|登録されていません/.test(文言), "存在しないことの文言").toBe(true);
  });
});
caseTest("IT-M15-10-018", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日 = 印("未登録フォーマットJP-018");
  await 取り込む(page, step, "format-unknown-018.csv", csvの文面([行(日, 印("Unknown Format EN-018"), "", "", "UnknownFormat")]));
  let n = -1;
  await step(4, async () => { n = アーキタイプを探す(日).length; });
  await expected(async () => { expect.soft(n, "「未登録フォーマットJP-018」のアーキタイプの数").toBe(0); });
});

// ---- 文字の正規化・取り消し ----
caseTest("IT-M15-10-027", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日 = 印("正規化JP");
  await 取り込む(page, step, "normalized.csv", csvの文面([行(`​${日}`, 印("Normalized EN"))], { bom: true, crlf: true }));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(日); });
  await expected(async () => {
    expect.soft(r.length, "ゼロ幅スペースとBOMを含まない名前「正規化JP」のアーキタイプの数").toBe(1);
    expect.soft(r.length ? アーキタイプを探す(`​${日}`).length : -1, "ゼロ幅スペースを含む名前のアーキタイプの数").toBe(0);
  });
});
caseTest("IT-M15-10-028", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日1 = 印("取消確認1行目JP");
  await 取り込む(page, step, "rollback-required-error.csv", csvの文面([行(日1, 印("Rollback First EN")), 行(印("取消確認2行目JP"), "")]));
  let n = -1, 文言 = "";
  await step(4, async () => { n = アーキタイプを探す(日1).length; 文言 = await new アーキタイプCSV取込(page).文言(); });
  await expected(async () => {
    expect.soft(文言.length > 0, "エラーが表示された（取り込みが失敗した）").toBe(true);
    expect.soft(n, "エラーより前の行「取消確認1行目JP」のアーキタイプの数").toBe(0);
  });
});

// ---- なりすまし対策 ----
caseTest("IT-M15-10-029", async ({ page, step, expected }) => {
  await login(page); 値の注記();
  const 画面 = new アーキタイプCSV取込(page);
  let 応答 = 0;
  await step(1, async () => { await 画面.開く(); });
  await step(2, async () => { await 画面.ファイルを選ぶ("csrf-missing.csv", csvの文面([行(印("トークン欠落JP"), 印("Missing Token EN"))])); });
  await step(3, async () => { await 画面.トークン欄().evaluate((e) => e.remove()); });
  await step(4, async () => { 応答 = await 画面.アップロードを押す(); });
  await expected(async () => { expect.soft(応答, "アップロードへの応答（HTTPステータス）").toBe(403); });
});
caseTest("IT-M15-10-030", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 画面 = new アーキタイプCSV取込(page);
  const 日 = 印("トークン改ざんJP");
  await step(1, async () => { await 画面.開く(); });
  await step(2, async () => { await 画面.ファイルを選ぶ("csrf-tamper.csv", csvの文面([行(日, 印("Tampered Token EN"))])); });
  await step(3, async () => { await 画面.トークン欄().evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
  await step(4, async () => { await 画面.アップロードを押す(); });
  let n = -1;
  await step(5, async () => { n = アーキタイプを探す(日).length; });
  await expected(async () => { expect.soft(n, "「トークン改ざんJP」のアーキタイプの数").toBe(0); });
});

// ---- 機能間のつながり ----
/** 連携のケース: 手順 開始: 取込画面を開く、開始+1: ファイルを選んでアップロードする */
async function 連携で取り込む(page: Page, step: Step, ファイル名: string, 中身: Buffer, 開始: number): Promise<void> {
  const 画面 = new アーキタイプCSV取込(page);
  await step(開始, async () => { await 画面.開く(); });
  await step(開始 + 1, async () => { await 画面.ファイルを選ぶ(ファイル名, 中身); await 画面.アップロードを押す(); });
}

caseTest("IT-M15-10-034", async ({ page, step, expected }) => {
  note("名前（アーキタイプ名・フォーマット名）は、半角英数字だけの欄に合わせ、実行の印を末尾に付けた値で作った。管理者の権限は「システム管理者」");
  const 日 = 連携名("ArcM1510L001"), 形 = 連携名("FmtM1510L001");
  await step(1, async () => { await login(page, M1510L_ADMIN); });
  await 連携で取り込む(page, step, "ArcM1510L001.csv", csvの文面([[日, 日, "", "", 形]]), 2);
  let 完了 = false;
  await step(4, async () => { 完了 = 登録完了(await new アーキタイプCSV取込(page).文言()) && /\/archetype\/csv_import$/.test(new URL(page.url()).pathname); });
  const l = new デッキ一覧(page);
  await step(5, async () => { await l.開く(); });
  let 選択肢: string[] = [];
  await step(6, async () => {
    await page.locator("#admin_search_deck_archetypes + .select2-container .select2-selection").click().catch(() => null);
    選択肢 = (await l.f("archetypes").locator("option").allInnerTexts()).map((t) => t.trim());
  });
  await expected(async () => {
    expect.soft(完了, "登録完了メッセージが表示され、取込画面へ戻った").toBe(true);
    expect.soft(選択肢.some((t) => t.includes(日) && t.includes(形)), `アーキタイプの選択肢に「${日}」とフォーマット名「${形}」の両方を含むものがある`).toBe(true);
  });
});
caseTest("IT-M15-10-035", async ({ page, step, expected }) => {
  note("名前（アーキタイプ名・フォーマット名）は、半角英数字だけの欄に合わせ、実行の印を末尾に付けた値で作った。管理者の権限は「システム管理者」");
  const 日 = 連携名("ArcM1510L002"), 形 = 連携名("FmtM1510L002");
  await step(1, async () => { await login(page, M1510L_ADMIN); });
  await 連携で取り込む(page, step, "ArcM1510L002.csv", csvの文面([[日, 日, "", "青,白", 形]]), 2);
  let 完了 = false;
  await step(4, async () => { 完了 = 登録完了(await new アーキタイプCSV取込(page).文言()); });
  await step(5, async () => { await 一覧を開く(page); await page.waitForLoadState("load"); });
  await step(6, async () => {
    await page.locator('[name="admin_search_archetype[multi]"]').first().fill(日);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#admin_search_archetype button[type=submit]").click()]);
  });
  let 行テキスト = "";
  await step(7, async () => {
    const r = page.locator(".archetype-result-table tbody tr", { hasText: 日 }).first();
    await expect(r, "検索結果の該当行").toBeVisible();
    行テキスト = (await r.innerText()).replace(/\s+/g, " ");
  });
  await expected(async () => {
    expect.soft(完了, "登録完了メッセージが表示された").toBe(true);
    expect.soft(行テキスト, "日本語名と英語名").toContain(`${日} / ${日}`);
    expect.soft(行テキスト, "フォーマット名").toContain(形);
    expect.soft(行テキスト, "カラー「青/白」").toMatch(/(青\/白|白\/青)/);
  });
});
caseTest("IT-M15-10-036", async ({ page, step, expected }) => {
  note("名前（アーキタイプ名・フォーマット名）は、半角英数字だけの欄に合わせ、実行の印を末尾に付けた値で作った。管理者の権限は「システム管理者」");
  const 日 = 連携名("ArcM1510L003"), 形 = 連携名("FmtM1510L003");
  await step(1, async () => { await login(page, M1510L_ADMIN); });
  await 連携で取り込む(page, step, "ArcM1510L003.csv", csvの文面([[日, 日, "", "青,白", 形]]), 2);
  let 完了 = false;
  await step(4, async () => { 完了 = 登録完了(await new アーキタイプCSV取込(page).文言()); });
  await step(5, async () => { await 一覧を開く(page); await page.waitForLoadState("load"); });
  await step(6, async () => {
    await page.locator('[name="admin_search_archetype[multi]"]').first().fill(日);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#admin_search_archetype button[type=submit]").click()]);
  });
  await step(7, async () => {
    const リンク = page.locator(".archetype-result-table tbody tr", { hasText: 日 }).first().locator(`a[href$="/edit"]`).first();
    await expect(リンク, "検索結果の該当行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), リンク.click()]);
  });
  await expected(async () => {
    const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
    const チェック = async (c: string) => page.locator(".archetype-colors .form-check", { hasText: c }).locator("input[type=checkbox]").isChecked();
    expect.soft(完了, "登録完了メッセージが表示された").toBe(true);
    expect.soft((await f("Disp").locator("option:checked").innerText()).trim(), "公開状態").toBe("公開");
    expect.soft(await チェック("青"), "カラー「青」のチェック").toBe(true);
    expect.soft(await チェック("白"), "カラー「白」のチェック").toBe(true);
    expect.soft(await チェック("赤"), "カラー「赤」のチェック（外れている）").toBe(false);
    expect.soft((await f("Format").locator("option:checked").innerText()).trim(), "フォーマット").toBe(形);
  });
});

// ---- 混在・重ね取込・代表カードなし ----
caseTest("IT-M15-10-038", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const n = 既存名["038"], 新日 = 印("新規混在JP-M1510-038"), 新英 = 印("Mixed-New-EN-M1510-038");
  await 取り込む(page, step, "dpm1510-038-mixed.csv", csvの文面([行(n.日, n.英), 行(新日, 新英)]));
  let 既存: ReturnType<typeof アーキタイプを探す> = [], 新規: typeof 既存 = [];
  await step(4, async () => { 既存 = アーキタイプを探す(n.日, n.英, PIONEER); 新規 = アーキタイプを探す(新日, 新英, PIONEER); });
  await expected(async () => {
    expect.soft(既存.map((x) => x.ID), "既存のアーキタイプ〔アーキタイプID-M1510-038〕が更新対象（重複して増えない）").toEqual([notes.get("〔アーキタイプID-M1510-038〕")]);
    expect.soft(既存[0]?.公開状態, "既存の公開状態").toBe("公開");
    expect.soft(新規.length, "新規「新規混在JP-M1510-038」のアーキタイプの数").toBe(1);
  });
});
caseTest("IT-M15-10-040", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日 = 印("重ね取込JP-M1510-040"), 英 = 印("Twice-EN-M1510-040");
  const 画面 = new アーキタイプCSV取込(page);
  const 中身 = csvの文面([行(日, 英)]);
  await 取り込む(page, step, "dpm1510-040-twice.csv", 中身);
  await step(4, async () => { await 画面.開く(); await 画面.ファイルを選ぶ("dpm1510-040-twice.csv", 中身); });
  await step(5, async () => { await 画面.アップロードを押す(); });
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(6, async () => { r = アーキタイプを探す(日, 英, PIONEER); });
  await expected(async () => { expect.soft(r.filter((x) => !x.削除済み).length, "削除されていないアーキタイプの数").toBe(1); });
});
caseTest("IT-M15-10-041", async ({ page, step, expected, db }) => {
  void db;
  await login(page); 値の注記();
  const 日 = 印("新規JP-M1510-CB041"), 英 = 印("New EN-M1510-CB041");
  await 取り込む(page, step, "m1510-cb041.csv", csvの文面([行(日, 英, "", "青,未定義色A")]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(日, 英, PIONEER); });
  await expected(async () => {
    expect.soft(r.length, "新規登録されたアーキタイプの数").toBe(1);
    expect.soft(r[0]?.公開状態, "公開状態").toBe("公開");
    expect.soft(r[0]?.代表カード画像あり, "代表カード画像がある").toBe(false);
    expect.soft(r[0] ? 色(r[0]) : [], "カラー（青だけ）").toEqual(["青"]);
  });
});
caseTest("IT-M15-10-042", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page);
  note("代表カード名の「Unknown Card」は、手元に同名のカードが無い状態で取り込んだ（代表カード画像は未設定のまま）。カード画像のシードは画面から作れないため使っていない。名前は実行の印つき");
  const n = 既存名["042"];
  await 取り込む(page, step, "m1510-cb042.csv", csvの文面([行(n.日, n.英, "Unknown Card", "青,白")]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(n.日, n.英, PIONEER); });
  await expected(async () => {
    expect.soft(r.map((x) => x.ID), "更新されたアーキタイプ〔アーキタイプID-M1510-042〕（増えない）").toEqual([notes.get("〔アーキタイプID-M1510-042〕")]);
    expect.soft(r[0]?.公開状態, "公開状態").toBe("公開");
    expect.soft(r[0]?.代表カード画像あり, "代表カード画像がある").toBe(false);
    expect.soft(r[0] ? 色(r[0]) : [], "カラー（青と白へ置き換わった）").toEqual(["白", "青"]);
  });
});
caseTest("IT-M15-10-045", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page);
  note("代表カード名の「Unknown Card」は、手元に同名のカードが無い状態で取り込んだ（代表カード画像は未設定のまま）。カード画像のシードは画面から作れないため使っていない。名前は実行の印つき");
  const n = 既存名["045"];
  await 取り込む(page, step, "m1510-cb045.csv", csvの文面([行(n.日, n.英, "Unknown Card", "緑,未定義色A")]));
  let r: ReturnType<typeof アーキタイプを探す> = [];
  await step(4, async () => { r = アーキタイプを探す(n.日, n.英, PIONEER); });
  await expected(async () => {
    const 削除済み = r.filter((x) => x.削除済み), 生きている = r.filter((x) => !x.削除済み);
    expect.soft(削除済み.map((x) => x.ID), "削除済みの〔アーキタイプID-M1510-045〕は削除済みのまま").toEqual([notes.get("〔アーキタイプID-M1510-045〕")]);
    expect.soft(生きている.length, "同じキーの削除されていないアーキタイプの数（別のIDで新規1件）").toBe(1);
    expect.soft(生きている[0]?.公開状態, "公開状態").toBe("公開");
    expect.soft(生きている[0]?.代表カード画像あり, "代表カード画像がある").toBe(false);
    expect.soft(生きている[0] ? 色(生きている[0]) : [], "カラー（緑だけ）").toEqual(["緑"]);
  });
});
