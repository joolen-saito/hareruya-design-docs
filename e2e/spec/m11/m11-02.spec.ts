/**
 * M11-02 メンバー管理（実施不可の見直しで流せる見込みになったケース）。正本: cases/M11-02_test_cases.tsv
 * 実装しないケースと理由は記録 review/M11-02_progress_2026-11-11_dev.md。
 * 所属・権限は開発環境に既にあるものへ読み替え、店舗は店名が一致する店舗のうち番号のいちばん小さいものを番号で選ぶ（seeds/m11-02.ts）。
 */
import { Locator, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { ログインIDのメンバー, メンバーIDのメンバー, 編集可能店舗, メンバーの件数, メンバーIDがあるか, マスタの登録内容, メンバーの行 } from "../../db/m11_02";
import { MemberEditPage, 管理画面からログアウトする } from "../../pages/admin/m11_02_member";
import {
  所属, 権限, 店舗の, ログインID, メール, 試験管理者, 連携管理者, 新規のログインID, 自動ログアウトのメンバー, 連携の対象,
  自動ログアウトを1分にする, 自動ログアウトを戻す,
} from "../../seeds/m11-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 読み替え = () => note(`所属・権限は開発環境に既にあるものへ読み替えた（所属 トレード→${所属.トレード}・EC運営→${所属.EC運営}、権限 システム権限→${権限.システム権限}・店舗権限→${権限.店舗権限}）`);
const 読み替えを確かめる = () => supplement(`期待結果が見る所属・権限の値は、開発環境に既にあるものへ読み替えた値で確かめた（所属 トレード→${所属.トレード}・EC運営→${所属.EC運営}、権限 システム権限→${権限.システム権限}・店舗権限→${権限.店舗権限}。正本の所属・権限のマスタは全員が使うので作っていない）`);

async function 管理者で(page: Page): Promise<MemberEditPage> { await loginAdmin(page, 試験管理者); return new MemberEditPage(page); }
/** 項目の入力欄を含む行（隠れた選択欄でも、見える行で確かめる） */
const 項目の行 = (l: Locator): Locator => l.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' row ')][1]");
const 前の値 = (id: string): メンバーの行 => { const m = メンバーIDのメンバー(id); if (!m) throw new Error(`メンバーID ${id} が DB に無い`); return m; };
const 長い = (c: string, n: number) => c.repeat(n);

// ---- 新規登録状態の画面 ----
caseTest("IT-M11-02-001", async ({ page, step, expected }) => {
  const p = await 管理者で(page);
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { /* 入力項目は期待結果で確かめる */ await expect(p.メール欄, "メールアドレスの入力欄").toBeAttached(); });
  await expected(async () => {
    await expect.soft(p.メール欄, "メールアドレスの入力項目が表示される").toBeVisible();
    await expect.soft(項目の行(p.デフォルト検索表示店舗欄), "デフォルト検索表示店舗の入力項目が表示される").toBeVisible();
    await expect.soft(項目の行(p.編集可能店舗欄), "編集可能店舗の入力項目が表示される").toBeVisible();
    await expect.soft(項目の行(p.自動ログアウト欄), "自動ログアウト設定の入力項目が表示される").toBeVisible();
    await expect.soft(項目の行(p.スマレジ用アカウント欄), "スマレジ用アカウントの入力項目が表示される").toBeVisible();
  });
});

caseTest("IT-M11-02-004", async ({ page, step, expected }) => {
  const p = await 管理者で(page);
  let 非稼働 = false, 稼働 = true, 二段階 = true;
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => {
    非稼働 = await p.稼働の選択("非稼働").isChecked(); 稼働 = await p.稼働の選択("稼働").isChecked(); 二段階 = await p.二段階認証欄.isChecked();
  });
  await expected(async () => {
    expect.soft(非稼働 && !稼働, "稼働の初期状態が「非稼働」").toBe(true);
    expect.soft(二段階, "2段階認証の初期状態が「無効」（オフ）").toBe(false);
  });
});

// ---- 編集画面の表示 ----
caseTest("IT-M11-02-005", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  let a = "", b = "";
  await step(1, async () => { await p.編集を開く(notes.get("〔メンバーID-M1102-005〕")); });
  await step(2, async () => { a = await p.パスワード欄.inputValue(); b = await p.パスワード確認欄.inputValue(); });
  await expected(async () => {
    expect.soft(a.length > 0 && b.length > 0, "パスワード欄とパスワード(確認)欄に文字列が入っている").toBe(true);
    expect.soft(a === b, "両欄が同じ既定文字列").toBe(true);
    expect.soft(a !== "BeforePass1!" && b !== "BeforePass1!", "既存のパスワード「BeforePass1!」ではない").toBe(true);
  });
});

caseTest("IT-M11-02-006", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  await step(1, async () => { await p.編集を開く(notes.get("〔メンバーID-M1102-006〕")); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), p.メンバー管理リンク.click()]);
  });
  await expected(async () => {
    expect.soft(p.path(), "遷移した画面（メンバー管理一覧）").toMatch(/\/setting\/system\/member\/?$/);
  });
});

// ---- 新規登録 ----
/** 新規登録の入力（正本の値。名前・ログインID・メールには印を付ける。長さを確かめる値は付けない） */
function 新規(n: string, v: { 名前: string; 所属店舗?: "東京店" | "大阪店"; 所属?: "トレード" | "EC運営"; メール: string; パスワード: string; 権限?: "システム権限" | "店舗権限"; デフォルト?: "東京店" | "大阪店" | ""; 編集可能?: ("東京店" | "大阪店")[]; 稼働?: "稼働" | "非稼働"; 二段階?: boolean; 自動?: boolean; スマレジ?: boolean; 印なし?: boolean }) {
  return {
    名前: v.印なし ? v.名前 : rc(v.名前), ...(v.所属店舗 ? { 所属店舗ID: 店舗の(v.所属店舗) } : {}), ...(v.所属 ? { 所属: 所属[v.所属] } : {}),
    ログインID: 新規のログインID[n], メールアドレス: v.印なし ? v.メール : メール(v.メール), パスワード: v.パスワード,
    ...(v.権限 ? { 権限: 権限[v.権限] } : {}), ...(v.編集可能 ? { 編集可能店舗ID: v.編集可能.map((s) => 店舗の(s)) } : {}),
    ...(v.デフォルト !== undefined ? { デフォルト検索表示店舗ID: v.デフォルト ? 店舗の(v.デフォルト) : "" } : {}),
    ...(v.稼働 ? { 稼働: v.稼働 } : {}), ...(v.二段階 !== undefined ? { 二段階認証: v.二段階 } : {}),
    ...(v.自動 !== undefined ? { 自動ログアウト: v.自動 } : {}), ...(v.スマレジ !== undefined ? { スマレジ用アカウント: v.スマレジ } : {}),
  };
}
function 送った結果の注記(r: { 送った: boolean; 状態: number; path: string; 誤り: string[] }): void {
  note(`登録を押した結果: 要求 ${r.送った ? `送った（応答 ${r.状態}）` : "送られなかった（ブラウザの入力チェックが止めた）"}・移った先 ${r.path}${r.誤り.length ? `・誤りの表示: ${r.誤り.join(" / ")}` : ""}`);
}

caseTest("IT-M11-02-008", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  const v = 新規("008", { 名前: "必須項目メンバー", 所属: "トレード", メール: "required@example.com", パスワード: "Abcd1234!", 権限: "店舗権限", デフォルト: "東京店" });
  let rows: メンバーの行[] = [];
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(v); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { rows = ログインIDのメンバー(v.ログインID); });
  await expected(async () => {
    expect.soft(rows.length, "必須項目だけを入力したメンバーが1件追加される").toBe(1);
  });
});

caseTest("IT-M11-02-009", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替えを確かめる();
  const v = 新規("009", { 名前: "全項目メンバー", 所属: "トレード", メール: "all@example.com", パスワード: "Abcd1234!", 権限: "店舗権限", デフォルト: "東京店", 編集可能: ["東京店", "大阪店"], 稼働: "稼働", 二段階: true, 自動: true, スマレジ: false });
  let rows: メンバーの行[] = []; let 店舗: string[] = [];
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(v); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { rows = ログインIDのメンバー(v.ログインID); 店舗 = rows[0] ? 編集可能店舗(rows[0].ID) : []; });
  await expected(async () => {
    const m = rows[0];
    expect.soft(rows.length, "メンバーが1件登録される").toBe(1);
    expect.soft(m?.名前, "名前").toBe(v.名前);
    expect.soft(m?.所属, "所属").toBe(所属.トレード);
    expect.soft(m?.メール, "メールアドレス").toBe(v.メールアドレス);
    expect.soft(m?.権限, "権限（1件）").toBe(権限.店舗権限);
    expect.soft(m?.デフォルト検索表示店舗, "デフォルト検索表示店舗（東京店）").toBe(店舗の("東京店"));
    expect.soft(店舗, "編集可能店舗（東京店・大阪店の2件）").toEqual([店舗の("東京店"), 店舗の("大阪店")].sort((a, b) => Number(a) - Number(b)));
    expect.soft(m?.稼働, "稼働").toBe("稼働");
    expect.soft(m?.二段階認証, "2段階認証（有効）").toBe(true);
    expect.soft(m?.自動ログアウト, "自動ログアウト設定（有効）").toBe(true);
    expect.soft(m?.スマレジ用アカウント, "スマレジ用アカウント（無効）").toBe(false);
  });
});

caseTest("IT-M11-02-010", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  const v = 新規("010", { 名前: "遷移確認メンバー", 所属店舗: "東京店", 所属: "トレード", メール: "transition@example.com", パスワード: "Abcd1234!", 権限: "店舗権限", デフォルト: "東京店" });
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(v); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await expected(async () => {
    const m = /\/setting\/system\/member\/(\d+)\/edit$/.exec(p.path());
    expect.soft(!!m, `新しく保存されたメンバーのメンバー管理画面へ遷移する（実際 ${p.path()}）`).toBe(true);
    await expect.soft(p.名前欄, "画面の名前（遷移確認メンバー）").toHaveValue(v.名前);
    const row = ログインIDのメンバー(v.ログインID)[0];
    expect.soft(m?.[1], "遷移先のメンバーIDが新しく保存されたメンバー").toBe(row?.ID);
  });
});

caseTest("IT-M11-02-014", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  const v = 新規("014", { 名前: "暗号化確認メンバー", 所属: "トレード", メール: "hash_new@example.com", パスワード: "NewPass123!", 権限: "店舗権限", デフォルト: "東京店" });
  let rows: メンバーの行[] = [];
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(v); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { rows = ログインIDのメンバー(v.ログインID); });
  await expected(async () => {
    const pw = rows[0]?.パスワード ?? "";
    expect.soft(rows.length, "メンバーが1件登録される").toBe(1);
    expect.soft(pw !== "" && pw !== "NewPass123!", "パスワード列が平文「NewPass123!」ではない").toBe(true);
    expect.soft(pw.length >= 32, `パスワード列がハッシュ化された値（長さ ${pw.length}）`).toBe(true);
  });
});

/** 新規登録の手順1〜4（開く・入れる・押す・DB）。登録されたメンバーの行を返す */
async function 新規でDB(ctx: CaseCtx, n: string, v: Parameters<typeof 新規>[1], 一覧から = false): Promise<メンバーの行[]> {
  const { page, step } = ctx;
  const p = await 管理者で(page); 読み替え();
  const x = 新規(n, v);
  let rows: メンバーの行[] = [];
  await step(1, async () => { if (一覧から) await p.一覧から新規登録を開く(); else await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(x); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { rows = ログインIDのメンバー(x.ログインID); });
  return rows;
}
caseTest("IT-M11-02-041", async (ctx) => {
  const rows = await 新規でDB(ctx, "041", { 名前: "所属店舗保存メンバー-041", 所属店舗: "大阪店", 所属: "トレード", メール: "m1102-041-shop@example.com", パスワード: "Abcd1234!", 権限: "店舗権限" });
  await ctx.expected(async () => {
    expect.soft(rows.length, "メンバーが1件追加される").toBe(1);
    expect.soft(rows[0]?.所属店舗, "所属店舗（大阪店）").toBe(店舗の("大阪店"));
  });
});
caseTest("IT-M11-02-044", async (ctx) => {
  const id = 新規のログインID["044"];
  note(`ログインIDは値そのもの（50文字）を確かめるので実行の印を付けない（${id.length}文字）`);
  const rows = await 新規でDB(ctx, "044", { 名前: "ログインID最大長メンバー-044", 所属: "トレード", メール: "m1102-044@example.com", パスワード: "Abcd1234!", 権限: "店舗権限", 所属店舗: "東京店" });
  await ctx.expected(async () => {
    expect.soft(rows.length, "ログインID（50文字）のメンバーが1件追加される").toBe(1);
  });
});
caseTest("IT-M11-02-046", async (ctx) => {
  const rows = await 新規でDB(ctx, "046", { 名前: "パスワード最大長メンバー-046", 所属: "トレード", メール: "m1102-046@example.com", パスワード: 長い("Ab12", 12) + "Ab", 権限: "店舗権限", 所属店舗: "東京店" });
  await ctx.expected(async () => {
    expect.soft(rows.length, "パスワード50文字のメンバーが1件追加される").toBe(1);
  });
});
caseTest("IT-M11-02-048", async (ctx) => {
  const rows = await 新規でDB(ctx, "048", { 名前: "1件選択メンバー-048", 所属店舗: "東京店", 所属: "トレード", メール: "one-048@example.test", パスワード: "Passw0rd-M1102048", 権限: "店舗権限", デフォルト: "東京店", 編集可能: ["大阪店"] }, true);
  await ctx.expected(async () => {
    expect.soft(rows.length, "メンバーが1件追加される").toBe(1);
    expect.soft(rows[0] ? 編集可能店舗(rows[0].ID) : [], "編集可能店舗（大阪店の1件だけ）").toEqual([店舗の("大阪店")]);
  });
});

caseTest("IT-M11-02-043", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  const v = 新規("043", { 名前: "検索店舗未選択メンバー-043", 所属店舗: "東京店", 所属: "トレード", メール: "m1102-043-nodef@example.com", パスワード: "Abcd1234!", 権限: "店舗権限" });
  let rows: メンバーの行[] = [];
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる(v); 送った結果の注記(await p.登録を押す()); });
  await step(3, async () => { rows = ログインIDのメンバー(v.ログインID); });
  await expected(async () => {
    expect.soft(rows.length, "メンバーが1件追加される").toBe(1);
    expect.soft(rows[0]?.デフォルト検索表示店舗 ?? "（無い）", "デフォルト検索表示店舗が未設定").toBe("");
  });
});

caseTest("IT-M11-02-023", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  note("名前・ログインID・メールアドレス・パスワードは値そのもの（255文字）を確かめるので実行の印を付けない");
  const 名前 = 長い("あ", 255), id = 新規のログインID["023"], mail = 長い("a", 243) + "@example.com", pw = 長い("Ab12", 63) + "Ab1";
  let rows: メンバーの行[] = [];
  await step(1, async () => { await p.新規登録を開く(); });
  await step(2, async () => { await p.入れる({ 名前, 所属: 所属.トレード, ログインID: id, メールアドレス: mail, パスワード: pw, 権限: 権限.店舗権限, デフォルト検索表示店舗ID: 店舗の("東京店") }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { rows = ログインIDのメンバー(id); });
  await expected(async () => {
    const m = rows[0];
    expect.soft(rows.length, "メンバーが追加される").toBe(1);
    expect.soft(m?.名前.length ?? 0, "名前の文字数（255）").toBe(255);
    expect.soft(m?.ログインID.length ?? 0, "ログインIDの文字数（255）").toBe(255);
    expect.soft(m?.メール.length ?? 0, "メールアドレスの文字数（255）").toBe(255);
    expect.soft(!!m && m.パスワード !== pw && m.パスワード.length >= 32, "パスワードがハッシュ化して保持される").toBe(true);
  });
});

// ---- 件数が増えない（全員のメンバーの件数を比べる。ほかの回と並べない） ----
caseTest("IT-M11-02-021", async ({ page, step, expected }) => {
  const p = await 管理者で(page);
  let 前 = 0, 後 = 0;
  await step(1, async () => { 前 = メンバーの件数(); });
  await step(2, async () => { await p.新規登録を開く(); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーの件数(); });
  await expected(async () => { expect.soft(後, `メンバー件数が登録前（${前}件）から増加しない`).toBe(前); });
});

caseTest("IT-M11-02-024", async ({ page, step, expected }) => {
  const p = await 管理者で(page); 読み替え();
  note("名前・ログインID・メールアドレス・パスワードは値そのもの（256文字）を確かめるので実行の印を付けない");
  let 前 = 0, 後 = 0;
  await step(1, async () => { 前 = メンバーの件数(); });
  await step(2, async () => { await p.新規登録を開く(); });
  await step(3, async () => { await p.入れる({ 名前: 長い("あ", 256), 所属: 所属.トレード, ログインID: 新規のログインID["024"], メールアドレス: 長い("a", 244) + "@example.com", パスワード: 長い("Ab12", 64), 権限: 権限.店舗権限, デフォルト検索表示店舗ID: 店舗の("東京店") }); });
  await step(4, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(5, async () => { 後 = メンバーの件数(); });
  await expected(async () => { expect.soft(後, `メンバー件数が登録前（${前}件）から増加しない`).toBe(前); });
});

// ---- 編集 ----
caseTest("IT-M11-02-011", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page); 読み替えを確かめる();
  const id = notes.get("〔メンバーID-M1102-011〕");
  const v = { 名前: rc("編集後メンバー"), 所属: 所属.EC運営, ログインID: ログインID("m1102_edited"), メールアドレス: メール("edited@example.com"), 権限: 権限.システム権限, デフォルト検索表示店舗ID: 店舗の("大阪店"), 稼働: "稼働" as const, 二段階認証: true, 自動ログアウト: true };
  let m: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる(v); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { m = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = m as メンバーの行 | null;
    expect.soft(x?.名前, "名前").toBe(v.名前);
    expect.soft(x?.所属, "所属").toBe(所属.EC運営);
    expect.soft(x?.ログインID, "ログインID").toBe(v.ログインID);
    expect.soft(x?.メール, "メールアドレス").toBe(v.メールアドレス);
    expect.soft(x?.権限, "権限").toBe(権限.システム権限);
    expect.soft(x?.デフォルト検索表示店舗, "デフォルト検索表示店舗（大阪店）").toBe(店舗の("大阪店"));
    expect.soft(x?.稼働, "稼働").toBe("稼働");
    expect.soft(x?.二段階認証, "2段階認証（有効）").toBe(true);
    expect.soft(x?.自動ログアウト, "自動ログアウト設定（有効）").toBe(true);
  });
});

caseTest("IT-M11-02-012", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-012〕");
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前: rc("編集遷移確認メンバー") }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await expected(async () => { expect.soft(p.path(), "同じメンバーのメンバー管理画面に留まる").toMatch(new RegExp(`/setting/system/member/${id}/edit$`)); });
});

caseTest("IT-M11-02-015", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-015〕");
  const 前 = 前の値(id).パスワード; let 後 = "";
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ パスワード: "ChangedPass123!" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = 前の値(id).パスワード; });
  await expected(async () => {
    expect.soft(後 !== 前, "パスワード列が変更前と異なる").toBe(true);
    expect.soft(後 !== "ChangedPass123!" && 後.length >= 32, "平文「ChangedPass123!」ではないハッシュ化された値").toBe(true);
  });
});

caseTest("IT-M11-02-016", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-016〕");
  let 前 = "", 後 = "";
  await step(1, async () => { 前 = 前の値(id).パスワード; });
  await step(2, async () => { await p.編集を開く(id); });
  await step(3, async () => { await p.入れる({ 名前: rc("パスワード維持メンバー") }); });
  await step(4, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(5, async () => { 後 = 前の値(id).パスワード; });
  await expected(async () => { expect.soft(後 === 前 && 前 !== "", "パスワード保存値が変更前の値から変更されない").toBe(true); });
});

caseTest("IT-M11-02-017", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-017〕");
  const 前 = 前の値(id); let 後: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前: rc("不一致更新メンバー"), パスワード: "MatchPass123!", パスワード確認: "DifferentPass123!" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    expect.soft(x?.名前, "名前が変更前の値のまま").toBe(前.名前);
    expect.soft(x?.パスワード === 前.パスワード, "パスワード保存値が変更前の値のまま").toBe(true);
  });
});

caseTest("IT-M11-02-019", async ({ page, notes, step, expected }) => {
  if (ログインIDのメンバー("abcd").length > 0) throw new Error("ログインID「abcd」のメンバーが開発環境に既にいる（前の実行の残りかもしれない）。値そのもの（4文字）を確かめるので印を付けられず、このままでは流せない");
  const p = await 管理者で(page);
  note("ログインID・パスワードは値そのもの（4文字）を確かめるので実行の印を付けない");
  const id = notes.get("〔メンバーID-M1102-019〕");
  const 前 = 前の値(id); let 後: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ ログインID: "abcd", パスワード: "Ab12" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    expect.soft(x?.ログインID, "ログインIDが最小長4文字の「abcd」で更新される").toBe("abcd");
    expect.soft(!!x && x.パスワード !== 前.パスワード, "パスワード保存値が変更前とは異なるハッシュ値").toBe(true);
  });
});

caseTest("IT-M11-02-020", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-020〕");
  const 前 = 前の値(id); let 後: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ ログインID: "abc", パスワード: "Ab1" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    expect.soft(x?.ログインID, "ログインIDが変更前の値のまま").toBe(前.ログインID);
    expect.soft(x?.パスワード === 前.パスワード, "パスワード保存値が変更前の値のまま").toBe(true);
  });
});

caseTest("IT-M11-02-022", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-022〕");
  const 前 = 前の値(id); const 前の店舗 = 編集可能店舗(id); let 後: メンバーの行 | null = null; let 後の店舗: string[] = [];
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前: "", 所属: "", ログインID: "", メールアドレス: "", パスワード: "", 権限: "", デフォルト検索表示店舗ID: "" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); 後の店舗 = 編集可能店舗(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    const 本体 = (m: メンバーの行 | null) => m ? [m.名前, m.所属, m.ログインID, m.メール, m.パスワード].join("|") : "";
    expect.soft(本体(x), "メンバー本体（名前・所属・ログインID・メールアドレス・パスワード）が変更前のまま").toBe(本体(前));
    expect.soft(x?.権限, "権限が変更前のまま").toBe(前.権限);
    expect.soft([x?.所属店舗, x?.デフォルト検索表示店舗, ...後の店舗].join(","), "店舗設定（所属店舗・デフォルト検索表示店舗・編集可能店舗）が変更前のまま").toBe([前.所属店舗, 前.デフォルト検索表示店舗, ...前の店舗].join(","));
  });
});

caseTest("IT-M11-02-026", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-026〕");
  const 前 = 前の値(id); let 後: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前: 長い("あ", 256), ログインID: 長い("A", 256), メールアドレス: 長い("a", 244) + "@example.com", パスワード: 長い("Ab12", 64) }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    expect.soft(x?.名前, "名前が変更前のまま").toBe(前.名前);
    expect.soft(x?.ログインID, "ログインIDが変更前のまま").toBe(前.ログインID);
    expect.soft(x?.メール, "メールアドレスが変更前のまま").toBe(前.メール);
    expect.soft(x?.パスワード === 前.パスワード, "パスワード保存値が変更前のまま").toBe(true);
  });
});

caseTest("IT-M11-02-030", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-030〕");
  let 前 = { 権限: "", 稼働: "", 店舗: "" }, 後 = { 権限: "", 稼働: "", 店舗: "" };
  await step(1, async () => { 前 = マスタの登録内容(); });
  await step(2, async () => { await p.編集を開く(id); });
  await step(3, async () => { await p.入れる({ 名前: rc("マスター非更新メンバー") }); });
  await step(4, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(5, async () => { 後 = マスタの登録内容(); });
  await expected(async () => {
    expect.soft(後.権限 === 前.権限, "権限マスターの登録内容が変わらない").toBe(true);
    expect.soft(後.稼働 === 前.稼働, "稼働マスターの登録内容が変わらない").toBe(true);
    expect.soft(後.店舗 === 前.店舗, "店舗マスターの登録内容が変わらない").toBe(true);
  });
});

caseTest("IT-M11-02-031", async ({ page, notes, step, expected }) => {
  if (メンバーIDがあるか("999999")) throw new Error("メンバーID 999999 が開発環境に既にある（正本はシードで未登録と定める）");
  const p = await 管理者で(page);
  let 状態 = 0, 名前欄 = 0;
  await step(1, async () => { await p.編集を開く(notes.get("〔メンバーID-M1102-031〕")); });
  await step(2, async () => {
    const u = page.url().replace(/\/member\/\d+\/edit/, "/member/999999/edit");
    const res = await page.goto(u, { timeout: 60_000 }); 状態 = res?.status() ?? 0; 名前欄 = await p.名前欄.count();
  });
  await expected(async () => {
    expect.soft(状態, "対象が見つからないことを示す応答").toBe(404);
    expect.soft(名前欄, "メンバー管理画面が表示されない").toBe(0);
  });
});

caseTest("IT-M11-02-033", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-033〕");
  let タグ: string[] = []; let 店舗: string[] = [];
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 編集可能店舗ID: [店舗の("東京店"), 店舗の("大阪店")] }); });
  await step(3, async () => {
    タグ = (await p.編集可能店舗欄.locator("xpath=following-sibling::span[contains(@class,'select2')][1]").locator(".select2-selection__choice").allInnerTexts()).map((t) => t.replace(/^×/, "").trim());
    note(`編集可能店舗のタグ: ${タグ.join("、") || "（無い）"}`);
  });
  await step(4, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(5, async () => { 店舗 = 編集可能店舗(id); });
  await expected(async () => {
    expect.soft([...タグ].sort(), "「東京店」と「大阪店」がタグとして複数選択される").toEqual(["大阪店", "東京店"]);
    expect.soft(店舗, "編集可能店舗として2件登録される").toEqual([店舗の("東京店"), 店舗の("大阪店")].sort((a, b) => Number(a) - Number(b)));
  });
});

caseTest("IT-M11-02-055", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-055〕"); let 後: メンバーの行 | null = null;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 稼働: "非稼働" }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => { expect.soft((後 as メンバーの行 | null)?.稼働, "稼働が「非稼働」に更新される").toBe("非稼働"); });
});

caseTest("IT-M11-02-056", async ({ page, notes, step, expected }) => {
  const p = await 管理者で(page);
  const id = notes.get("〔メンバーID-M1102-056〕"); let 後: メンバーの行 | null = null;
  const 名前 = rc("CB稼働維持後メンバー-M1102-CB056");
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前 }); });
  await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    const x = 後 as メンバーの行 | null;
    expect.soft(x?.名前, "名前が更新される").toBe(名前);
    expect.soft(x?.稼働, "稼働は「稼働」のまま").toBe("稼働");
  });
});

// ---- デフォルト検索表示店舗の連携 ----
function 連携(n: "039" | "040", 画面: "受注" | "在庫履歴") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const p = new MemberEditPage(page);
    const id = notes.get(`〔メンバーID-M1102-${n}〕`);
    let 選択: { 値: string[]; 文字: string[] } = { 値: [], 文字: [] };
    await step(1, async () => { await loginAdmin(page, 連携管理者); });
    await step(2, async () => {
      await p.編集を開く(id);
      expect((await p.選択中(p.デフォルト検索表示店舗欄)).値, "開いた時点のデフォルト検索表示店舗（東京店）").toEqual([店舗の("東京店")]);
    });
    await step(3, async () => { await p.入れる({ デフォルト検索表示店舗ID: 店舗の("大阪店") }); 送った結果の注記(await p.登録を押す()); });
    await step(4, async () => {
      await expect(page.locator(".alert-success").first(), "完了メッセージ「メンバーを保存しました。」").toContainText("メンバーを保存しました。");
      await 管理画面からログアウトする(page);
    });
    await step(5, async () => { await loginAdmin(page, 連携の対象[n]); });
    await step(6, async () => {
      if (画面 === "受注") { await page.goto(adminUrl("/order"), { timeout: 60_000 }); await page.waitForLoadState("load"); return; }
      const link = page.locator('a[href$="/product/stock/history"]').first();
      if (await link.count()) await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click({ force: true })]);
      else { note("メニューに在庫履歴検索一覧のリンクが見つからず、同じアドレスを開いた"); await page.goto(adminUrl("/product/stock/history"), { timeout: 60_000 }); }
      await page.waitForLoadState("load");
    });
    await step(7, async () => {
      const sel = 画面 === "受注" ? page.locator("#admin_search_order_tenants") : page.locator("#admin_stock_history_base_info");
      選択 = await new MemberEditPage(page).選択中(sel);
      note(`検索条件「店舗」の選択: ${選択.文字.join("、") || "（無い）"}（番号 ${選択.値.join("、") || "なし"}）`);
    });
    await expected(async () => {
      expect.soft(選択.値, "検索条件「店舗」に大阪店が選択されている").toEqual([店舗の("大阪店")]);
      expect.soft(選択.文字, "選択されている店舗の名前").toEqual(["大阪店"]);
    });
  };
}
caseTest("IT-M11-02-039", 連携("039", "受注"));
caseTest("IT-M11-02-040", 連携("040", "在庫履歴"));

// ---- 自動ログアウト（共有の設定。基盤が1本だけで流す） ----
async function 戻しを確かめる(browser: CaseCtx["browser"]): Promise<void> {
  expect(await 自動ログアウトを戻す(browser), "共有の設定（自動ログアウト時間）を元の値へ戻せた").toBe("");
}
caseTest("IT-M11-02-032", async ({ page, browser, notes, step, expected }) => {
  try {
    await 自動ログアウトを1分にする(browser);
    const p = await 管理者で(page);
    const id = notes.get("〔メンバーID-M1102-032〕");
    await step(1, async () => { await p.編集を開く(id); });
    await step(2, async () => { await p.入れる({ 自動ログアウト: true }); });
    await step(3, async () => { 送った結果の注記(await p.登録を押す()); });
    await step(4, async () => { await 管理画面からログアウトする(page); });
    await step(5, async () => { await loginAdmin(page, 自動ログアウトのメンバー["032"]); await page.goto(adminUrl("/setting/system/member"), { timeout: 60_000 }); await page.waitForLoadState("load"); });
    await step(6, async () => { await page.waitForTimeout(65_000); });
    await step(7, async () => { await page.reload({ timeout: 60_000 }); await page.waitForLoadState("load"); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "1分の無操作のあと、管理画面のログイン状態が解除される（ログイン画面へ移る）").toMatch(/\/login$/);
    });
  } finally { await 戻しを確かめる(browser); }
});

caseTest("IT-M11-02-052", async ({ page, browser, step, expected }) => {
  try {
    await 自動ログアウトを1分にする(browser);
    await step(1, async () => { await loginAdmin(page, 自動ログアウトのメンバー["052"]); await page.goto(adminUrl("/setting/system/member"), { timeout: 60_000 }); await page.waitForLoadState("load"); });
    await step(2, async () => { await page.waitForTimeout(125_000); });
    await step(3, async () => { await page.reload({ timeout: 60_000 }); await page.waitForLoadState("load"); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "2分の無操作のあとも、メンバー管理一覧画面が表示される（ログイン状態が維持される）").toMatch(/\/setting\/system\/member\/?$/);
    });
  } finally { await 戻しを確かめる(browser); }
});
