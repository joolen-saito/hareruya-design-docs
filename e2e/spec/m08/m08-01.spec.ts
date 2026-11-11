/**
 * M08-01 会員検索一覧。正本: cases/M08-01_test_cases.tsv
 * 実装しないケース: 021（12001件の会員を作る＝大量）、043（顧客CSV出力項目の共有の設定を書き換える）、052（メールの受信を確かめる）。
 * 残りは、会員を0件にする初期化を行わず、実行の印つきの語で対象の会員に絞る読み替えで実装した（seeds/m08-01.ts の注記）。
 */
import { Dialog, Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { adminUrl } from "../../lib/session";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { M08CustomerMailPage } from "../../pages/admin/m08_customer_mail";
import { 会員CSVPage } from "../../pages/admin/m08_03_csv";
import { 会員を削除済みにする } from "../../db/m08_01_write";
import { mailOf } from "../../seeds/m08-common";
import { 会員一覧の検索パターンの名前の長さ, 会員一覧の検索パターン, 会員一覧用の検索パターンの件数, 会員の削除フラグ, 検索パターンID, 保存の中身の値 } from "../../db/m08_01";
import { M0801_ADMIN, 名前026, 名前032, 名前033, 名前034, 名前036, 名前037, 退会区分033, 検索語, 検索語009, 検索語alpha, 検索語メール, 組の語 } from "../../seeds/m08-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const isListPath = (p: string) => /^\/admin\/customer(\/page\/\d+)?\/?$/.test(p);

// ---- 検索入力画面の表示 ----
caseTest("IT-M08-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); });
  await expected(async () => {
    const text = await list.form.innerText();
    for (const w of ["誕生月", "DCIナンバー", "DCI確認フラグ", "移行インポート"]) {
      expect.soft(text.includes(w), `検索条件欄に「${w}」が表示されていない`).toBe(false);
    }
  });
});

caseTest("IT-M08-01-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let 開いた後 = false, 閉じた後 = true;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.toggleDetail(); 開いた後 = await list.詳細検索が開いているか(); });
  await step(3, async () => { await list.toggleDetail(); 閉じた後 = await list.詳細検索が開いているか(); });
  await expected(async () => {
    // 正本の期待結果は「非表示になった後、再度表示される」。1回目の後と2回目の後の表示を、その順に確かめる
    expect.soft(開いた後, "開閉ボタンを1回押した後は検索条件欄が非表示").toBe(false);
    expect.soft(閉じた後, "開閉ボタンをもう1回押した後は検索条件欄が再度表示").toBe(true);
  });
});

// ---- 検索パターンの保存 ----
caseTest("IT-M08-01-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("条件なしパターン", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 会員一覧の検索パターン> = [];
  await step(4, async () => { rows = 会員一覧の検索パターン("条件なしパターン"); });
  await expected(async () => { expect.soft(rows.length, "会員一覧用の「条件なしパターン」の件数（開始時は0件）").toBe(1); });
});

caseTest("IT-M08-01-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.closeReason.fill("不正利用", { timeout: 30_000 }); await list.patternName.fill("退会理由検索", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 会員一覧の検索パターン> = [];
  await step(4, async () => { rows = 会員一覧の検索パターン("退会理由検索"); });
  await expected(async () => {
    expect.soft(rows.length, "会員一覧用の「退会理由検索」の件数").toBe(1);
    expect.soft(rows[0]?.名前 ?? null, "保存された名称").toBe("退会理由検索");
    expect.soft(保存の中身の値(rows[0]?.保存の中身 ?? null, "close_reason"), "保存された退会区分").toBe("不正利用");
  });
});

caseTest("IT-M08-01-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const 名前 = "あ".repeat(30865);
  let 保存後の応答: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill(名前, { timeout: 60_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    保存後の応答 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  });
  let 保存された名前の長さ: number[] = [];
  await step(4, async () => {
    保存された名前の長さ = 会員一覧の検索パターンの名前の長さ("あ");
  });
  await expected(async () => {
    if (保存後の応答.length) note(`保存後の画面のメッセージ: ${保存後の応答.join(" / ")}`);
    expect.soft(保存された名前の長さ.includes(30865), "「あ」30865文字の検索パターン名が保存されている（保存された名前の文字数）").toBe(true);
  });
});

// ---- 検索パターンの更新 ----
caseTest("IT-M08-01-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const id = notes.get("〔検索パターンID-M0801-031〕");
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-031"); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("退会理由更新", { timeout: 30_000 }); await list.closeReason.fill("BAN", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 検索パターンID> = [];
  let 件数 = -1;
  await step(4, async () => { rows = 検索パターンID(id); 件数 = 会員一覧用の検索パターンの件数(); });
  await expected(async () => {
    expect.soft(rows[0]?.名前 ?? null, `検索パターンID ${id} の名称`).toBe("退会理由更新");
    expect.soft(保存の中身の値(rows[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${id} の退会区分`).toBe("BAN");
    expect.soft(件数, "会員一覧用検索パターンの件数（追加されない）").toBe(1);
  });
});

caseTest("IT-M08-01-060", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const a = notes.get("〔検索パターンID-M0801-060A〕"), b = notes.get("〔検索パターンID-M0801-060B〕");
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-060A"); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("退会理由更新-060", { timeout: 30_000 }); await list.closeReason.fill("BAN", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let ra: ReturnType<typeof 検索パターンID> = [], rb: ReturnType<typeof 検索パターンID> = [];
  let 件数 = -1;
  await step(4, async () => { ra = 検索パターンID(a); rb = 検索パターンID(b); 件数 = 会員一覧用の検索パターンの件数(); });
  await expected(async () => {
    expect.soft(ra[0]?.名前 ?? null, `検索パターンID ${a} の名称`).toBe("退会理由更新-060");
    expect.soft(保存の中身の値(ra[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${a} の退会区分`).toBe("BAN");
    expect.soft(rb[0]?.名前 ?? null, `検索パターンID ${b} の名称（変わらない）`).toBe("退会理由パターン-060B");
    expect.soft(保存の中身の値(rb[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${b} の退会区分（変わらない）`).toBe("不正利用");
    expect.soft(件数, "会員一覧用検索パターンの件数（2件のまま）").toBe(2);
  });
});

// ---- 検索パターンの削除 ----
caseTest("IT-M08-01-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let 通常 = -1, 検索時 = -1;
  await step(1, async () => { await list.open(); 通常 = await list.deleteButton.count(); });
  await step(2, async () => { await list.selectPattern(名前034()); });
  await step(3, async () => { await list.showDetail(); 検索時 = await list.deleteButton.filter({ visible: true }).count(); });
  await expected(async () => {
    expect.soft(通常, "通常表示での検索パターン削除ボタンの数（表示されない）").toBe(0);
    expect.soft(検索時, "検索パターンでの検索時の検索パターン削除ボタンの数（表示される）").toBe(1);
  });
});

caseTest("IT-M08-01-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let pending: Awaited<ReturnType<M08CustomerListPage["削除ボタンを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await list.selectPattern(名前036()); });
  await step(2, async () => { pending = await list.削除ボタンを押す(); });
  await step(3, async () => { await pending!.OKを押す(); });
  await expected(async () => {
    expect.soft(pending?.文 ?? "", "出た確認ダイアログの文").not.toBe("");
    expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
  });
});

caseTest("IT-M08-01-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const 応答: { url: string; status: number }[] = [];
  page.on("response", (r) => { if (r.request().resourceType() === "document") 応答.push({ url: r.url(), status: r.status() }); });
  await step(1, async () => { await list.open(); await list.selectPattern(名前037()); });
  await step(2, async () => {
    await page.goto(adminUrl("/customer/pattern/999999"), { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  await step(3, async () => { note("開発者ツールのネットワーク情報の代わりに、ページの読み込みの応答（HTTPステータス）を記録して確かめた"); });
  await expected(async () => {
    const r = 応答.filter((x) => /\/customer\/pattern\/999999$/.test(new URL(x.url).pathname));
    expect.soft(r.length, "検索パターンID 999999の要求の数").toBeGreaterThan(0);
    expect.soft(r[r.length - 1]?.status ?? 0, "検索パターンID 999999の要求のHTTPステータス").toBe(404);
  });
});

caseTest("IT-M08-01-061", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const a = notes.get("〔検索パターンID-M0801-061A〕"), b = notes.get("〔検索パターンID-M0801-061B〕");
  let pending: Awaited<ReturnType<M08CustomerListPage["削除ボタンを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-061A"); });
  await step(2, async () => { pending = await list.削除ボタンを押す(); });
  await step(3, async () => { await pending!.OKを押す(); });
  let ra: ReturnType<typeof 検索パターンID> = [], rb: ReturnType<typeof 検索パターンID> = [];
  await step(4, async () => { ra = 検索パターンID(a); rb = 検索パターンID(b); });
  await expected(async () => {
    expect.soft(ra.length, `検索パターンID ${a} の残り（DBから削除される）`).toBe(0);
    expect.soft(rb[0]?.名前 ?? null, `検索パターンID ${b} の名称（残る）`).toBe("退会理由パターン-061B");
    await list.open();
    expect.soft(await list.patternLinkNames(), "会員検索一覧(検索入力)画面の検索パターン欄").toEqual(["退会理由パターン-061B"]);
  });
});

// ---- 会員の削除 ----
function 会員削除(k: "054" | "055") {
  return async ({ page, notes, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    await loginAdmin(page, M0801_ADMIN);
    const list = new M08CustomerListPage(page);
    const id = notes.get(`〔会員ID-M0801-${k}〕`);
    await step(1, async () => { await list.open(); await list.searchMulti(id); });
    await step(2, async () => { await list.削除リンクを押す(id); });
    await step(3, async () => {
      note("削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」ボタンを「OK」として押した");
      await list.確認モーダルで削除する(id);
    });
    if (k === "054") {
      let flg: string | null = null;
      await step(4, async () => { flg = 会員の削除フラグ(id); });
      await expected(async () => { expect.soft(flg, `会員ID ${id} の削除フラグ（1＝削除済み）`).toBe("1"); });
    } else {
      await expected(async () => {
        expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
        expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
      });
    }
  };
}
caseTest("IT-M08-01-054", 会員削除("054"));
caseTest("IT-M08-01-055", 会員削除("055"));

caseTest("IT-M08-01-062", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const id = notes.get("〔会員ID-M0801-062〕");
  const tab1 = new M08CustomerListPage(page);
  const tab2page = await page.context().newPage();
  const tab2 = new M08CustomerListPage(tab2page);
  try {
    await step(1, async () => { await tab1.open(); await tab1.searchMulti(id); await expect(tab1.row(id), "タブ1に会員の行が表示されている").toHaveCount(1); });
    await step(2, async () => {
      await tab2.open(); await tab2.searchMulti(id);
      await tab2.削除リンクを押す(id); await tab2.確認モーダルで削除する(id);
    });
    await step(3, async () => { await page.bringToFront(); await tab1.削除リンクを押す(id); });
    await step(4, async () => { await tab1.確認モーダルで削除する(id); });
    let 文: string[] = [];
    await step(5, async () => { 文 = (await tab1.flashes.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t)); });
    await expected(async () => {
      expect.soft(文.some((t) => t.includes("既に削除されています")), `会員一覧画面のフラッシュメッセージ（${文.join(" / ")}）`).toBe(true);
    });
  } finally {
    await tab2page.close();
  }
});

// =====================================================================================================
// 残りのケース（2026-11-11 追加）。シードは「会員を0件にする」を行わず、実行の印つきの語で対象の会員に絞る読み替え（seeds/m08-01.ts の注記）。
// 実装しないケース: 021（12001件の会員）、043（顧客CSV出力項目の設定=共有の設定を書き換える）、052（メールの受信を確かめる）。
// =====================================================================================================
const 読み替え注記 = "他の会員が混ざらないよう、会員ID・メールアドレス・お名前の欄に実行の印つきの語を併せて入れて対象の会員に絞った（正本の「会員検索対象はこの数件だけ」を、印つきの語で絞る形に読み替えた）";

async function 一覧を開く(page: Page): Promise<M08CustomerListPage> {
  await loginAdmin(page, M0801_ADMIN);
  return new M08CustomerListPage(page);
}
/** 画面全体の文（隠れている部分も含む。スクリプト・スタイルは除く） */
async function 画面の全文(page: Page): Promise<string> {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true) as HTMLElement;
    c.querySelectorAll("script, style").forEach((e) => e.remove());
    return (c.textContent ?? "").replace(/\s+/g, " ");
  });
}
const 空白をそろえる = (t: string): string => t.replace(/\s+/g, " ").trim();
const CSVの会員ID = (行: string[][]): { 列がある: boolean; ids: string[] } => {
  const i = (行[0] ?? []).indexOf("会員ID");
  return { 列がある: i >= 0, ids: i < 0 ? [] : 行.slice(1).map((r) => r[i]) };
};

// ---- 検索入力・検索結果の表示（002・009・016・017） ----
caseTest("IT-M08-01-002", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0801-002${x}〕`));
  let 全文 = "", 入力欄 = "", ids: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note(`${読み替え注記}。検索語「m0801@example.test」は、メールアドレスの後ろ側が同じ実行の印つきの語（${検索語メール("002")}）にした`);
    await list.searchMulti(検索語メール("002"));
  });
  await step(3, async () => { 全文 = await 画面の全文(page); 入力欄 = (await list.form.textContent()) ?? ""; ids = await list.結果の会員ID(); });
  await expected(async () => {
    expect.soft(ids.sort(), "検索結果の会員ID（未削除の2件だけ）").toEqual([a, b].sort());
    expect.soft(ids.includes(c), `削除済みの会員ID ${c} が検索結果に出ない`).toBe(false);
    expect.soft(入力欄.includes("顧客分析タグ"), "検索入力に「顧客分析タグ」が表示されない").toBe(false);
    for (const w of ["顧客分析タグ", "既存タグ削除", "新規タグ追加", "会員顧客分析タグダウンロード"]) {
      expect.soft(全文.includes(w), `検索結果の画面に「${w}」が表示されない`).toBe(false);
    }
  });
});

caseTest("IT-M08-01-009", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const c = notes.get("〔会員ID-M0801-009C〕");
  let ids: string[] = [], 件数: number | null = null;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note("検索語「deleted803」は、削除済みの会員のメールアドレスだけが含む実行の印つきの語（deleted803-m0801-009-<印>）にした");
    await list.searchMulti(検索語009());
    ids = await list.結果の会員ID(); 件数 = await list.該当件数();
  });
  await expected(async () => {
    expect.soft(ids.includes(c), `削除済みの会員ID ${c} が検索結果に表示されない`).toBe(false);
    expect.soft(件数, "該当件数（同じ語を持つ未削除の会員は0件）").toBe(0);
  });
});

caseTest("IT-M08-01-016", async ({ page, step, expected }) => {
  const list = await 一覧を開く(page);
  let ids: string[] = [], 件数: number | null = null;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.searchMulti("not-found-m0801"); ids = await list.結果の会員ID(); 件数 = await list.該当件数(); });
  await expected(async () => {
    expect.soft(件数, "検索結果の該当件数").toBe(0);
    expect.soft(ids.length, "検索結果の行数").toBe(0);
  });
});

caseTest("IT-M08-01-017", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0801-017${x}〕`));
  let ids: string[] = [], 件数: number | null = null; const 文: Record<string, string> = {};
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note(`${読み替え注記}。検索語「m0801@example.test」は、メールアドレスの後ろ側が同じ実行の印つきの語（${検索語メール("017")}）にした`);
    await list.searchMulti(検索語メール("017"));
  });
  await step(3, async () => {
    ids = await list.結果の会員ID(); 件数 = await list.該当件数();
    for (const id of [a, b]) if (ids.includes(id)) 文[id] = await list.行の文(id);
  });
  await expected(async () => {
    expect.soft(件数, "該当件数").toBe(2);
    expect.soft(ids.slice().sort(), "検索結果の会員ID（削除済みの C は出ない）").toEqual([a, b].sort());
    expect.soft(ids.includes(c), `削除済みの会員ID ${c} が表示されない`).toBe(false);
    expect.soft(文[a] ?? "", `会員ID ${a} の行（会員ID・会員名・メールアドレス）`).toContain("晴屋 太郎-017");
    expect.soft(文[a] ?? "", `会員ID ${a} の行`).toContain(mailOf("alpha801-m0801-017"));
    expect.soft(文[a] ?? "", `会員ID ${a} の行`).toContain(a);
    expect.soft(文[b] ?? "", `会員ID ${b} の行`).toContain("晴屋 花子-017");
    expect.soft(文[b] ?? "", `会員ID ${b} の行`).toContain(mailOf("beta802-m0801-017"));
    expect.soft(文[b] ?? "", `会員ID ${b} の行`).toContain(b);
  });
});

caseTest("IT-M08-01-015", async ({ page, step, expected }) => {
  const list = await 一覧を開く(page);
  let ids: string[] = [], 文 = "";
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note("日付の欄は日付だけの入力欄で、画面からは不正な日付を入れられないため、入力欄の種類を文字に変えて「2026/13/40 00:00」を入れた（開発者ツールで直接入れる操作に当たる）");
    await list.日付の欄に文字を直接入れる("birth_start", "2026/13/40 00:00");
  });
  await step(3, async () => {
    await list.検索する();
    ids = await list.結果の会員ID();
    文 = 空白をそろえる(await page.locator(".card-body").first().innerText().catch(() => ""));
  });
  await expected(async () => {
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が再表示されている").toBe(true);
    expect.soft(ids.length, `検索結果の行数（検証失敗後は空の一覧。画面の文: ${文}）`).toBe(0);
  });
});

// ---- 検索条件のクリア・各条件の検索（004・010〜013） ----
caseTest("IT-M08-01-004", async ({ page, step, expected }) => {
  const list = await 一覧を開く(page);
  let 入力後: string[] = [], クリア後: string[] = ["未実施"];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note("日付の欄は日付だけの入力欄なので、「2026/01/01 00:00」などは日付の部分だけを入れた。本人確認ステータスの「本人確認済み」は、選択肢の表示が「オンライン本人確認済み」なので、末尾が合う選択肢を選んだ");
    await list.検索語を入れる("80201");
    await list.チェックを入れる("customer_status", "本会員");
    await list.チェックを入れる("sex", "男性");
    await list.日付を入れる("birth_start", "1990/06/01 00:00"); await list.日付を入れる("birth_end", "1990/06/30 23:59");
    await list.国を選ぶ(["日本", "Japan"]);
    await list.都道府県を選ぶ("東京都");
    await list.欄に入れる("phone_number", "03-1234-5678");
    await list.日付を入れる("create_date_start", "2026/01/01 00:00"); await list.日付を入れる("create_date_end", "2026/01/31 23:59");
    await list.日付を入れる("update_date_start", "2026/02/01 00:00"); await list.日付を入れる("update_date_end", "2026/02/28 23:59");
    await list.欄に入れる("buy_product_name", "M0801-P001");
    await list.欄に入れる("sell_total_start", "4900"); await list.欄に入れる("sell_total_end", "5100");
    await list.欄に入れる("sell_times_start", "1"); await list.欄に入れる("sell_times_end", "3");
    await list.欄に入れる("buy_total_start", "11000"); await list.欄に入れる("buy_total_end", "13000");
    await list.欄に入れる("buy_times_start", "2"); await list.欄に入れる("buy_times_end", "4");
    await list.欄に入れる("smaregi_buy_total_start", "7000"); await list.欄に入れる("smaregi_buy_total_end", "9000");
    await list.欄に入れる("smaregi_buy_times_start", "3"); await list.欄に入れる("smaregi_buy_times_end", "5");
    await list.日付を入れる("last_buy_start", "2026/01/15 00:00"); await list.日付を入れる("last_buy_end", "2026/02/15 23:59");
    await list.チェックを入れる("identity_confirm_status", "本人確認済み");
    await list.欄に入れる("dci_name", "Mtg Test Player");
    await list.欄に入れる("close_reason", "不正利用");
    入力後 = await list.空でない欄();
    expect(入力後.length, `入力した条件が欄に入っている（${入力後.length}項目）`).toBeGreaterThanOrEqual(20);
  });
  await step(3, async () => { await list.条件をクリアする(); クリア後 = await list.空でない欄(); });
  await expected(async () => {
    expect.soft(クリア後, "入力した検索条件がすべて空欄または未選択（残っている欄）").toEqual([]);
  });
});

type 条件 = { 文: string; 入れる: (l: M08CustomerListPage) => Promise<void> };
/** 条件を1つずつ変えて検索する手順（クリア→語を入れ直す→条件→検索）。各手順で出た会員IDを返す */
function 条件ごとの検索(k: string, 条件s: 条件[]) {
  return async ({ page, notes, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    const list = await 一覧を開く(page);
    const a = notes.get(`〔会員ID-M0801-${k}A〕`), b = notes.get(`〔会員ID-M0801-${k}B〕`);
    const 結果: string[][] = [];
    for (let i = 0; i < 条件s.length; i++) {
      await step(i + 1, async () => {
        if (i === 0) { await list.open(); note(`${読み替え注記}（クリアのたびに入れ直す）。日付の欄は日付だけの入力欄なので、日付の部分だけを入れた。本人確認ステータスの「本人確認済み」は、末尾が合う選択肢（オンライン本人確認済み）を選んだ`); }
        else await list.条件をクリアする();
        await list.検索語を入れる(検索語(k));
        await 条件s[i].入れる(list);
        await list.検索する();
        結果.push(await list.結果の会員ID());
      });
    }
    await expected(async () => {
      for (let i = 0; i < 条件s.length; i++) {
        expect.soft(結果[i], `${条件s[i].文}の検索結果の会員ID（${a} だけ）`).toEqual([a]);
        expect.soft(結果[i].includes(b), `${条件s[i].文}の検索結果に会員ID ${b} が出ない`).toBe(false);
      }
    });
  };
}
const 範囲 = (文: string, 欄: string, 下: string, 上: string): 条件 => ({ 文, 入れる: async (l) => { await l.欄に入れる(`${欄}_start`, 下); await l.欄に入れる(`${欄}_end`, 上); } });
const 日付範囲 = (文: string, 欄: string, 下: string, 上: string): 条件 => ({ 文, 入れる: async (l) => { await l.日付を入れる(`${欄}_start`, 下); await l.日付を入れる(`${欄}_end`, 上); } });
caseTest("IT-M08-01-010", 条件ごとの検索("010", [
  { 文: "会員種別「本会員」", 入れる: async (l) => { await l.チェックを入れる("customer_status", "本会員"); } },
  { 文: "性別「男性」", 入れる: async (l) => { await l.チェックを入れる("sex", "男性"); } },
  { 文: "国「日本」", 入れる: async (l) => { await l.国を選ぶ(["日本", "Japan"]); } },
  { 文: "都道府県「東京都」", 入れる: async (l) => { await l.都道府県を選ぶ("東京都"); } },
  { 文: "本人確認ステータス「本人確認済み」", 入れる: async (l) => { await l.チェックを入れる("identity_confirm_status", "本人確認済み"); } },
]));
caseTest("IT-M08-01-011", 条件ごとの検索("011", [
  日付範囲("生年月日 1990/06/01〜1990/06/30", "birth", "1990/06/01 00:00", "1990/06/30 23:59"),
  日付範囲("登録日 2026/01/01〜2026/01/31", "create_date", "2026/01/01 00:00", "2026/01/31 23:59"),
  日付範囲("更新日 2026/02/01〜2026/02/28", "update_date", "2026/02/01 00:00", "2026/02/28 23:59"),
  日付範囲("最終購入日 2026/01/15〜2026/02/15", "last_buy", "2026/01/15 00:00", "2026/02/15 23:59"),
]));
caseTest("IT-M08-01-012", 条件ごとの検索("012", [
  範囲("買取総額 4900〜5100", "sell_total", "4900", "5100"),
  範囲("買取件数 1〜3", "sell_times", "1", "3"),
  範囲("EC購入金額 11000〜13000", "buy_total", "11000", "13000"),
  範囲("EC購入回数 2〜4", "buy_times", "2", "4"),
  範囲("スマレジ購入金額 7000〜9000", "smaregi_buy_total", "7000", "9000"),
  範囲("スマレジ購入回数 3〜5", "smaregi_buy_times", "3", "5"),
]));
caseTest("IT-M08-01-013", 条件ごとの検索("013", [
  { 文: "電話番号「03-1234-5678」", 入れる: async (l) => { await l.欄に入れる("phone_number", "03-1234-5678"); } },
  { 文: "購入商品名・コード「M0801-P001」", 入れる: async (l) => { await l.欄に入れる("buy_product_name", "M0801-P001"); } },
  { 文: "購入商品名・コード「検索用商品A」", 入れる: async (l) => { await l.欄に入れる("buy_product_name", "検索用商品A"); } },
  { 文: "MTG Companion登録本名「Mtg Test Player」", 入れる: async (l) => { await l.欄に入れる("dci_name", "Mtg Test Player"); } },
]));

// ---- 件数・ページング（018〜023） ----
caseTest("IT-M08-01-018", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const 語 = 組の語("maxpage", "018");
  notes.get("〔会員ID-M0801-018-01〕"); notes.get("〔会員ID-M0801-018-51〕");
  let 検索語の値 = "x", 行 = -1, 件数 = "", ページ: string | null = "x";
  await step(1, async () => { note("会員は51人（先頭と最後の会員IDを控えた）"); await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(50); });
  await step(3, async () => { await list.ページを開く(2); });
  await step(4, async () => { await list.サイドメニューから開く(); });
  await expected(async () => {
    検索語の値 = await list.multi.inputValue();
    行 = (await list.結果の会員ID()).length;
    // 初期表示では表示件数と現在のページが見えないので、同じ語でもう一度検索して、保持されている件数とページを確かめる
    await list.検索語を入れる(語); await list.検索する();
    件数 = await list.選択中の件数(); ページ = await list.現在のページ();
    expect.soft(検索語の値, "新たに開いた会員検索一覧の会員ID・メールアドレス・お名前の欄（保持されていた検索条件が引き継がれない）").toBe("");
    expect.soft(行, "新たに開いた画面の検索結果の行数（保持されていたページ番号2の結果が出ない）").toBe(0);
    expect.soft(件数, "同じ語で検索し直したときの表示件数（保持されていた50件が引き継がれず既定の10件）").toBe("10件");
    expect.soft(ページ, "同じ語で検索し直したときの現在のページ").toBe("1");
  });
});

function ページング1(k: "019" | "022") {
  return async ({ page, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    const list = await 一覧を開く(page);
    const 語 = 組の語("paging", k);
    await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(語); });
    await step(2, async () => { await list.件数を選ぶ(10); });
    if (k === "019") {
      await step(3, async () => { await list.ページを開く(2); });
    } else {
      await step(3, async () => {
        note("開発者ツールで件数の選択肢の送信値を変える操作は、選択欄の選択肢の値（移り先のアドレスの page_count=10）を page_count=11 に書き換えて選ぶ形で行った");
        await list.件数の送信値を書き換えて選ぶ(10, 11);
      });
      await step(4, async () => { await list.ページを開く(2); });
    }
    await expected(async () => {
      expect.soft(await list.multi.inputValue(), "保持された検索条件（会員ID・メールアドレス・お名前）").toBe(語);
      expect.soft(await list.選択中の件数(), k === "019" ? "保持された表示件数" : "表示件数（11は無視され、10が保持される）").toBe("10件");
      expect.soft(await list.現在のページ(), "現在のページ（2ページ目）").toBe("2");
      expect.soft((await list.結果の会員ID()).length, "2ページ目の行数（11人のうち10人は1ページ目）").toBe(1);
    });
  };
}
caseTest("IT-M08-01-019", ページング1("019"));
caseTest("IT-M08-01-022", ページング1("022"));

caseTest("IT-M08-01-020", async ({ page, step, expected }) => {
  const list = await 一覧を開く(page);
  const 語 = 組の語("paging", "020");
  let 押した = "";
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); });
  await step(3, async () => { await list.ページを開く(2); });
  await step(4, async () => { const ids = await list.結果の会員ID(); 押した = ids[0]; await list.会員名を押す(押した); });
  await step(5, async () => {
    const link = page.locator('a[href*="/customer/page/"][href*="resume=1"]').first();
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), link.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(isListPath(new URL(page.url()).pathname), `会員検索一覧画面へ戻る（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.multi.inputValue(), "復元された検索条件").toBe(語);
    expect.soft(await list.現在のページ(), "復元されたページ番号").toBe("2");
    expect.soft((await list.結果の会員ID()).includes(押した), `2ページ目の会員ID ${押した} が表示されている`).toBe(true);
  });
});

caseTest("IT-M08-01-023", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const 語 = 組の語("paging", "023");
  const a = notes.get("〔会員ID-M0801-023A〕"), k = notes.get("〔会員ID-M0801-023K〕");
  let p1: string[] = [], p2: string[] = [];
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); });
  await step(3, async () => { p1 = await list.結果の会員ID(); });
  await step(4, async () => { await list.ページを開く(2); p2 = await list.結果の会員ID(); });
  await expected(async () => {
    const 全部 = [...p1, ...p2];
    expect.soft(全部.length, "2ページを通した行数").toBe(11);
    expect.soft(new Set(全部).size, "重複のない会員ID数").toBe(11);
    expect.soft(全部.includes(a) && 全部.includes(k), `会員ID ${a} と ${k} が表示されている`).toBe(true);
    expect.soft(全部.every((id) => Number(id) >= Number(a) && Number(id) <= Number(k)), `すべて会員ID ${a} から ${k} の範囲（欠落・ほかの会員の混入がない）`).toBe(true);
  });
});

// ---- 検索パターン（026・028・032・033） ----
caseTest("IT-M08-01-026", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const id = notes.get("〔会員ID-M0801-026〕");
  let ids: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    note("検索語「alpha801」と検索パターン名「会員A検索」は、前の実行の残りと取り違えないよう実行の印を付けた値にした");
    await list.showDetail(); await list.検索語を入れる(検索語alpha("026")); await list.patternName.fill(名前026(), { timeout: 30_000 });
  });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    ids = await list.結果の会員ID();
  });
  await expected(async () => { expect.soft(ids, `検索パターン保存後の検索結果の会員ID（${id} だけ）`).toEqual([id]); });
});

caseTest("IT-M08-01-028", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const id = notes.get("〔会員ID-M0801-028〕");
  let 前: string[] = [], 後: string[] = [];
  await step(1, async () => { note("検索語「alpha801」は、実行の印つきの語（alpha801-028-<印>）にした"); await list.open(); await list.searchMulti(検索語alpha("028")); 前 = await list.結果の会員ID(); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    後 = await list.結果の会員ID();
  });
  await expected(async () => {
    expect.soft(前, "保存前の検索結果").toEqual([id]);
    expect.soft(後, "検索パターン名が空欄の保存後に再表示された検索結果（保存前と同じ）").toEqual(前);
  });
});

caseTest("IT-M08-01-032", async ({ page, step, expected }) => {
  const list = await 一覧を開く(page);
  let 名前: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { 名前 = await list.patternLinkNames(); });
  await expected(async () => {
    expect.soft(名前, "検索パターン欄に会員一覧用の「退会理由パターン-032」が表示される").toContain(名前032());
    expect.soft(名前.some((n) => n.includes("商品検索パターン-032")), "商品一覧用の「商品検索パターン-032」が検索パターン欄に表示されない").toBe(false);
  });
});

caseTest("IT-M08-01-033", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const a = notes.get("〔会員ID-M0801-033A〕");
  const 語 = 組の語("paging", "033");
  let ids: string[] = [], 退会区分 = "";
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); await list.ページを開く(2); });
  await step(3, async () => {
    note("退会区分「不正利用」は、ほかの会員と取り違えないよう実行の印を付けた値（パターンの退会区分と会員の退会区分で同じ）にした");
    await list.selectPattern(名前033());
    await list.showDetail();
    ids = await list.結果の会員ID(); 退会区分 = await list.closeReason.inputValue();
  });
  await expected(async () => {
    expect.soft(退会区分, "検索パターンの退会区分が検索条件に入っている").toBe(退会区分033());
    expect.soft(ids, `1ページ目の検索結果の会員ID（${a} だけ）`).toEqual([a]);
    expect.soft(await list.現在のページ(), "ページングは1ページ目（結果は1件）").toBeNull();
  });
});

// ---- CSV出力・メール一括送信・遷移（040〜050・059） ----
caseTest("IT-M08-01-040", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const csv = new 会員CSVPage(page);
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0801-040${x}〕`));
  let 全選択: Record<string, boolean> = {}, 全解除: Record<string, boolean> = {};
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", "040")); });
  await step(2, async () => { await csv.見出しのチェック.check({ timeout: 30_000 }); 全選択 = await csv.全部のチェック状態(); });
  await step(3, async () => { await csv.見出しのチェック.uncheck({ timeout: 30_000 }); 全解除 = await csv.全部のチェック状態(); });
  await expected(async () => {
    expect.soft(Object.keys(全選択).sort(), "表示中の会員").toEqual(ids.slice().sort());
    expect.soft(Object.values(全選択).every((v) => v), "ヘッダーのチェックを押すと表示中の会員3件がすべて選択される").toBe(true);
    expect.soft(Object.values(全解除).every((v) => !v), "再度押すと3件がすべて未選択になる").toBe(true);
  });
});

caseTest("IT-M08-01-041", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const csv = new 会員CSVPage(page);
  const a = notes.get("〔会員ID-M0801-041A〕"), k = notes.get("〔会員ID-M0801-041K〕");
  const 語 = 組の語("paging", "041");
  let 一ページ目の方 = "", 二ページ目の方 = "";
  let 結果: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); });
  await step(3, async () => {
    note(`一覧の並びは更新日の新しい順（同じ更新日なら会員IDの大きい順）なので、1ページ目には ${k}、2ページ目には ${a} が出る。正本の「1ページ目で ${a}、2ページ目で ${k}」は、1ページ目にある方・2ページ目にある方を選ぶ形に読み替えた（ページをまたいだ選択が引き継がれないことを確かめる意図は同じ）`);
    const ids = await list.結果の会員ID();
    一ページ目の方 = ids.includes(a) ? a : k; 二ページ目の方 = 一ページ目の方 === a ? k : a;
    await csv.チェックする([一ページ目の方]);
  });
  await step(4, async () => { await list.ページを開く(2); await csv.チェックする([二ページ目の方]); });
  await step(5, async () => { 結果 = await csv.CSVダウンロードを選ぶ(); });
  await expected(async () => {
    expect.soft(結果.行 !== undefined, "CSVがダウンロードされた").toBe(true);
    const r = CSVの会員ID(結果.行 ?? []);
    expect.soft(r.列がある, "CSVのヘッダーに「会員ID」の列がある（顧客CSV出力項目の設定は書き換えず、いまの設定のまま）").toBe(true);
    expect.soft(r.ids, `CSVのデータ行の会員ID（2ページ目で選択した ${二ページ目の方} だけ）`).toEqual([二ページ目の方]);
    expect.soft(r.ids.includes(一ページ目の方), `1ページ目で選択した会員ID ${一ページ目の方} が出力されない`).toBe(false);
  });
});

caseTest("IT-M08-01-042", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const csv = new 会員CSVPage(page);
  const a = notes.get("〔会員ID-M0801-042A〕"), c = notes.get("〔会員ID-M0801-042C〕");
  let 結果: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", "042")); });
  await step(2, async () => { await csv.チェックする([a, c]); });
  await step(3, async () => { 結果 = await csv.CSVダウンロードを選ぶ(); });
  await expected(async () => {
    expect.soft(結果.行 !== undefined, "CSVがダウンロードされた").toBe(true);
    const r = CSVの会員ID(結果.行 ?? []);
    expect.soft(r.列がある, "CSVのヘッダーに「会員ID」の列がある（顧客CSV出力項目の設定は書き換えず、いまの設定のまま）").toBe(true);
    expect.soft(r.ids.slice().sort(), `CSVのデータ行の会員ID（${a} と ${c} の2件だけ）`).toEqual([a, c].sort());
  });
});

function 未選択で押す(k: "044" | "045") {
  return async ({ page, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    const list = await 一覧を開く(page);
    const csv = new 会員CSVPage(page);
    const mail = new M08CustomerMailPage(page);
    let ダウンロードなし: { 画面の文: string[] } | undefined; let 遷移した = true; let ダイアログ: string | null = null;
    await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", k)); });
    await step(2, async () => {
      note("会員を選ばずに押すと、画面の動き（ブラウザの警告のダイアログ）でエラーが出て、送信されない");
      if (k === "044") { const r = await csv.CSVダウンロードを選ぶ(); ダウンロードなし = r.ダウンロードなし; }
      else { const r = await mail.その他からメール一括送信を押す(); 遷移した = r.遷移した; ダイアログ = r.ダイアログ; }
    });
    await expected(async () => {
      if (k === "044") {
        expect.soft(ダウンロードなし !== undefined, "CSVファイルがダウンロードされない").toBe(true);
        expect.soft((ダウンロードなし?.画面の文 ?? []).join(" "), "画面に表示されたエラー（選択されていない旨）").toContain("選択されていません");
      } else {
        expect.soft(遷移した, "メール一括送信画面へ遷移しない").toBe(false);
        expect.soft(ダイアログ ?? "", "会員検索一覧画面に表示されたエラー（選択されていない旨）").toContain("選択されていません");
        expect.soft(await list.form.isVisible(), "会員検索一覧画面のまま").toBe(true);
      }
    });
  };
}
caseTest("IT-M08-01-044", 未選択で押す("044"));
caseTest("IT-M08-01-045", 未選択で押す("045"));

caseTest("IT-M08-01-046", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const mail = new M08CustomerMailPage(page);
  const a = notes.get("〔会員ID-M0801-046A〕"), c = notes.get("〔会員ID-M0801-046C〕");
  let 動き = { 遷移した: false, ダイアログ: null as string | null }; let リスト = "";
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", "046")); });
  await step(2, async () => { await mail.一覧で選ぶ([a, c]); });
  await step(3, async () => { 動き = await mail.その他からメール一括送信を押す(); if (動き.遷移した) リスト = await mail.会員IDリストを読む(); });
  await expected(async () => {
    expect.soft(動き.遷移した, "メール一括送信画面へ遷移する").toBe(true);
    expect.soft(await mail.入力画面である(), "メール一括送信画面が表示されている").toBe(true);
    expect.soft(リスト.split(/[,\s]+/).filter(Boolean).sort(), `一括送信対象の会員ID（${a} と ${c} だけ）`).toEqual([a, c].sort());
  });
});

function 遷移(k: "047" | "048" | "049" | "050") {
  return async ({ page, notes, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    const list = await 一覧を開く(page);
    const id = notes.get(`〔会員ID-M0801-${k}〕`);
    let 道筋 = "";
    await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", k)); });
    await step(2, async () => {
      if (k === "047") { await list.会員名を押す(id); 道筋 = new URL(page.url()).pathname; }
      else if (k === "048") 道筋 = await list.サブメニューの項目を押す(id, "編集");
      else if (k === "049") 道筋 = await list.メール履歴を押す(id);
      else 道筋 = await list.サブメニューの項目を押す(id, "メール通知");
    });
    await expected(async () => {
      const 期待 = k === "047" || k === "048" ? new RegExp(`/customer/${id}/edit$`) : k === "049" ? new RegExp(`/customer/mail/${id}/history$`) : new RegExp(`/customer/manual_mail/${id}(/\\d+)?$`);
      const 画面 = k === "047" || k === "048" ? "会員登録編集画面" : k === "049" ? "メール配信履歴画面" : "手動メール通知画面";
      expect.soft(期待.test(道筋), `会員ID ${id} の${画面}へ遷移（${道筋}）`).toBe(true);
    });
  };
}
caseTest("IT-M08-01-047", 遷移("047"));
caseTest("IT-M08-01-048", 遷移("048"));
caseTest("IT-M08-01-049", 遷移("049"));
caseTest("IT-M08-01-050", 遷移("050"));

caseTest("IT-M08-01-059", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const mail = new M08CustomerMailPage(page);
  const csv = new 会員CSVPage(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0801-059${x}〕`));
  let 対象: { 会員ID: string; 氏名: string }[] = []; let 確認画面 = false;
  await step(1, async () => { note(読み替え注記); await list.open(); await list.searchMulti(組の語("csv", "059")); });
  await step(2, async () => { await csv.チェックする([b]); });
  await step(3, async () => { await mail.その他からメール一括送信を押す(); });
  await step(4, async () => { await mail.入力する("一括M0801-059", "本文M0801-059"); await mail.送信内容を確認を押す(); 確認画面 = await mail.確認画面である(); 対象 = await mail.配信対象者(); });
  await expected(async () => {
    expect.soft(確認画面, "メール一括送信確認画面が表示されている").toBe(true);
    expect.soft(対象, `配信対象者（${b}「晴屋 二郎-059」だけ）`).toEqual([{ 会員ID: b, 氏名: "晴屋 二郎-059" }]);
    expect.soft(対象.some((x) => x.会員ID === a || x.会員ID === c), `${a} と ${c} は配信対象者に表示されない`).toBe(false);
  });
});

// ---- 仮会員メール再送・削除（051・053・056） ----
caseTest("IT-M08-01-051", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const a = notes.get("〔会員ID-M0801-051A〕"), b = notes.get("〔会員ID-M0801-051B〕");
  let 項目A: string[] = [], 項目B: string[] = [];
  await step(1, async () => { note("会員IDで検索する（会員IDの一部が合うほかの会員が出ても、対象の行だけを見る）"); await list.open(); await list.searchMulti(a); });
  await step(2, async () => { await list.サブメニューを開く(a); 項目A = await list.サブメニューの項目(a); });
  await step(3, async () => { await list.条件をクリアする(); await list.検索語を入れる(b); await list.検索する(); });
  await step(4, async () => { await list.サブメニューを開く(b); 項目B = await list.サブメニューの項目(b); });
  await expected(async () => {
    expect.soft(項目A, `仮会員の会員ID ${a} のサブメニューに「仮会員メール再送」が表示される`).toContain("仮会員メール再送");
    expect.soft(項目B.includes("仮会員メール再送"), `本会員の会員ID ${b} のサブメニューに「仮会員メール再送」が表示されない（${項目B.join("・")}）`).toBe(false);
    expect.soft(項目B.length, `本会員のサブメニューは開いている（${項目B.join("・")}）`).toBeGreaterThan(0);
  });
});

caseTest("IT-M08-01-053", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const id = notes.get("〔会員ID-M0801-053〕");
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await list.仮会員メール再送を押す(id); });
  await step(3, async () => { await list.再送モーダルで送信する(id); });
  await expected(async () => {
    expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
  });
});

caseTest("IT-M08-01-056", async ({ page, notes, step, expected }) => {
  const list = await 一覧を開く(page);
  const id = notes.get("〔会員ID-M0801-056〕");
  await step(1, async () => { await list.open(); await list.searchMulti(id); await expect(list.row(id), "検索結果に会員の行がある").toHaveCount(1); });
  await step(2, async () => { note(`DBで会員ID ${id} の削除フラグを有効にした（実行の印つきの会員だけに書く）`); 会員を削除済みにする(id); });
  await step(3, async () => { await list.削除リンクを押す(id); });
  await step(4, async () => {
    note("削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」ボタンを「OK」として押した");
    await list.確認モーダルで削除する(id);
  });
  await expected(async () => {
    expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
  });
});
