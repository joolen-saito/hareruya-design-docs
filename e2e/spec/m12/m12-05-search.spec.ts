/**
 * M12-05 入荷通知依頼 一覧表示(検索項目)（検索の動き。IT-M12-05-001・004〜007・010〜019・023〜026・030〜033）。
 * ケースの正本: integration_test/casegen/cases/M12-05_test_cases.tsv（002・003 は m12-05.spec.ts）
 * シードの作り方（画面で作り、依頼日時などだけDBで設定）: seeds/m12-05-requests.ts
 */
import { test } from "@playwright/test";
import { 商品の依頼を控える } from "../../db/m12_05";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { ProductRequestPage } from "../../pages/admin/m12_analysis";
import { M1205_ADMIN } from "../../seeds/m12-05";
import { 商品名 } from "../../seeds/m12-05-requests";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 検索語は、商品名の「検索語＋実行の印」（シードの注記を参照） */
const kwOf = (base: string): string => rc(base);
const ids = (rows: { 商品ID: string }[]): string[] => rows.map((r) => r.商品ID);
/** 検索結果の言語の欄は、言語のコード（JP・EN） */
const 表示言語 = { ja: "JP", en: "EN" } as const;

/** 実施月の1日・末日（日本時間。日付の入力欄の値の形 YYYY-MM-DD） */
function 当月(): { 初日: string; 末日: string } {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = now.getFullYear(), m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { 初日: `${y}-${pad(m + 1)}-01`, 末日: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}` };
}

caseTest("IT-M12-05-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("晴れる屋トレカ特選")); await p.検索する(); });
  await step(3, async () => { note("管理メニューを押す代わりに、入荷通知依頼 一覧表示(検索項目)画面のアドレスを開き直した"); await p.open(); });
  await expected(async () => {
    const v = await p.値を読む();
    const { 初日, 末日 } = 当月();
    expect.soft(v.キーワード, "キーワード検索が空").toBe("");
    expect.soft(v.依頼日From, "依頼日(From)が実施月1日").toBe(初日);
    expect.soft(v.依頼日To, "依頼日(To)が実施月末日").toBe(末日);
    expect.soft(v.並び順, "並び替え(並び順)が昇順").toBe("ASC");
    expect.soft(await p.結果の一覧.count(), "検索結果一覧が表示されない（件数）").toBe(0);
  });
});

caseTest("IT-M12-05-004", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  const kw = kwOf("晴れる屋トレカ特選");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kw); await p.検索する(); });
  await expected(async () => {
    expect.soft(ids(await p.結果の行()), "同一画面の検索結果一覧に商品ID 〔商品ID-M1205-004〕がある").toContain(notes.get("〔商品ID-M1205-004〕"));
    expect.soft(await p.CSVリンク.count(), "CSV出力リンクが表示される（件数）").toBeGreaterThan(0);
    expect.soft(await p.キーワード.inputValue(), "キーワード検索に「晴れる屋トレカ特選」が保持される（検索語＋実行の印）").toBe(kw);
  });
});

caseTest("IT-M12-05-005", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("言語確認商品")); });
  await step(3, async () => { await p.金額と言語と並び替えとタグを未指定にする(); await p.検索する(); });
  await expected(async () => {
    const got = ids(await p.結果の行());
    for (const x of ["A", "B", "C"]) expect.soft(got, `商品ID 〔商品ID-M1205-共有言語${x}〕が検索結果に表示される`).toContain(notes.get(`〔商品ID-M1205-共有言語${x}〕`));
  });
});

caseTest("IT-M12-05-006", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.キーワード.fill(kwOf("依頼日境界"), { timeout: 20_000 });
    await p.依頼日From.fill("", { timeout: 20_000 });
    await p.依頼日To.fill("2026-07-31", { timeout: 20_000 });
    await p.検索する();
  });
  await expected(async () => {
    const got = ids(await p.結果の行());
    expect.soft(got, "依頼日時が2026/07/31 23:59:59の商品ID 〔商品ID-M1205-006A〕が表示される").toContain(notes.get("〔商品ID-M1205-006A〕"));
    expect.soft(got, "2026/08/01 00:00:00の商品ID 〔商品ID-M1205-006B〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-006B〕"));
  });
});

caseTest("IT-M12-05-007", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("販売金額境界")); });
  await step(3, async () => {
    await p.金額From.fill("1500", { timeout: 20_000 });
    await p.金額To.fill("1000", { timeout: 20_000 });
    await p.検索する();
  });
  await expected(async () => {
    const got = ids(await p.結果の行());
    expect.soft(got, "販売金額1200円の商品ID 〔商品ID-M1205-共有金額B〕が表示される").toContain(notes.get("〔商品ID-M1205-共有金額B〕"));
    expect.soft(got, "販売金額1500円の商品ID 〔商品ID-M1205-共有金額C〕が表示される").toContain(notes.get("〔商品ID-M1205-共有金額C〕"));
    expect.soft(got, "販売金額1000円の商品ID 〔商品ID-M1205-共有金額A〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-共有金額A〕"));
    expect.soft(got, "販売金額1600円の商品ID 〔商品ID-M1205-共有金額D〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-共有金額D〕"));
  });
});

caseTest("IT-M12-05-010", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる("検索太郎"); await p.検索する(); });
  await expected(async () => {
    expect.soft(ids(await p.結果の行()), "会員名が「検索太郎」である商品ID 〔商品ID-M1205-010〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-010〕"));
    expect.soft(await p.該当なしの表示.count(), "該当なしのメッセージが表示される（件数）").toBeGreaterThan(0);
  });
});

caseTest("IT-M12-05-011", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  const got: Record<string, string[]> = {};
  await step(1, async () => { await p.open(); await p.依頼日From.fill("", { timeout: 20_000 }); await p.依頼日To.fill("", { timeout: 20_000 }); });
  await step(2, async () => { await p.キーワード.fill(kwOf("言語確認商品"), { timeout: 20_000 }); await p.言語を選ぶ(["日本語"]); await p.検索する(); got.日本語 = ids(await p.結果の行()); });
  await step(3, async () => { await p.言語を選ぶ(["英語"]); await p.検索する(); got.英語 = ids(await p.結果の行()); });
  await step(4, async () => { await p.言語を選ぶ(["その他言語"]); await p.検索する(); got.その他言語 = ids(await p.結果の行()); });
  await expected(async () => {
    expect.soft(got.日本語, "日本語選択時は商品ID 〔商品ID-M1205-共有言語A〕だけ").toEqual([notes.get("〔商品ID-M1205-共有言語A〕")]);
    expect.soft(got.英語, "英語選択時は商品ID 〔商品ID-M1205-共有言語B〕だけ").toEqual([notes.get("〔商品ID-M1205-共有言語B〕")]);
    expect.soft(got.その他言語, "その他言語選択時は商品ID 〔商品ID-M1205-共有言語C〕だけ").toEqual([notes.get("〔商品ID-M1205-共有言語C〕")]);
  });
});

caseTest("IT-M12-05-012", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("売上分析タグ確認")); });
  await step(3, async () => {
    await p.売上分析タグ.first().selectOption({ label: "タグT1" }, { timeout: 20_000 });
    await p.検索する();
  });
  await expected(async () => {
    const got = ids(await p.結果の行());
    expect.soft(got, "「タグT1」が設定された商品ID 〔商品ID-M1205-012A〕だけが表示される").toEqual([notes.get("〔商品ID-M1205-012A〕")]);
    expect.soft(got, "「タグT1」が設定されていない商品ID 〔商品ID-M1205-012B〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-012B〕"));
  });
});

caseTest("IT-M12-05-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("表示件数確認商品")); });
  await step(3, async () => {
    await p.表示件数.selectOption({ label: "10" }, { timeout: 20_000 }).catch(async () => { await p.表示件数.selectOption("10", { timeout: 20_000 }); });
    await p.検索する();
  });
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "11件の対象データのうち、1ページの検索結果に表示される行数").toBe(10);
  });
});

/** 手順が「画面を開く」「日付を空にして検索語を入れて検索する」の2つのケースの共通の手順 */
async function 集計を検索する(p: ProductRequestPage, step: (n: number, b: () => Promise<void>) => Promise<void>, kw: string): Promise<void> {
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kw); await p.検索する(); });
}

/** 1商品の行（通知待ち・削除の件数など）の確かめ */
type 期待の行 = { id: string; 言語?: string; 商品名?: string; 通知待ち?: string; 削除?: string; 見出し: string };
async function 行を確かめる(p: ProductRequestPage, 行: 期待の行[]): Promise<void> {
  const rows = await p.結果の行();
  for (const e of 行) {
    const r = rows.find((x) => x.商品ID === e.id);
    expect.soft(r !== undefined, `${e.見出し}: 商品ID ${e.id} の行がある`).toBe(true);
    if (!r) continue;
    if (e.言語) expect.soft(r.言語, `${e.見出し}: 言語`).toBe(e.言語);
    if (e.商品名) expect.soft(r.商品名, `${e.見出し}: 商品名`).toBe(e.商品名);
    if (e.通知待ち) expect.soft(r.通知待ち, `${e.見出し}: 通知待ち件数`).toBe(e.通知待ち);
    if (e.削除) expect.soft(r.削除, `${e.見出し}: 削除件数`).toBe(e.削除);
  }
}

caseTest("IT-M12-05-014", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("集計確認通知待ち"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-014〕"), 言語: 表示言語.ja, 商品名: 商品名("集計確認通知待ち"), 通知待ち: "1", 見出し: "商品ID 〔商品ID-M1205-014〕（同じ会員が異なる2規格へ登録した通知待ち件数が1）" }]);
  });
});

caseTest("IT-M12-05-015", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("集計確認削除"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-015〕"), 削除: "1", 見出し: "論理削除済みの依頼の商品ID 〔商品ID-M1205-015〕（同じ会員が異なる2規格へ登録した通知済/削除件数が1）" }]);
  });
});

caseTest("IT-M12-05-016", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("商品単位通知確認"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-016〕"), 言語: 表示言語.en, 商品名: 商品名("商品単位通知確認"), 見出し: "規格を指定せず商品単位で登録された依頼の商品ID 〔商品ID-M1205-016〕" }]);
  });
});

caseTest("IT-M12-05-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, "存在しない入荷通知ZZZ");
  await expected(async () => {
    expect.soft(await p.該当なしの表示.count(), "同一の検索結果画面に該当なしのメッセージが表示される（件数）").toBeGreaterThan(0);
    expect.soft(await p.結果の一覧.count(), "検索結果一覧が表示されない（件数）").toBe(0);
    expect.soft(await p.CSVリンク.count(), "CSV出力リンクが表示されない（件数）").toBe(0);
  });
});

caseTest("IT-M12-05-018", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  const 商品ID = notes.get("〔商品ID-M1205-018〕");
  let 前 = 商品の依頼を控える(商品ID);
  let 後 = 前;
  await step(1, async () => { 前 = 商品の依頼を控える(商品ID); });
  await step(2, async () => { await p.open(); });
  await step(3, async () => { await p.日付を空にしてキーワードを入れる(kwOf("集計確認通知待ち-018")); await p.検索する(); });
  await step(4, async () => { 後 = 商品の依頼を控える(商品ID); });
  await expected(async () => {
    expect.soft(前.length, "検索前の入荷通知依頼の件数（2規格への通知待ち2件）").toBe(2);
    expect.soft(後.length, "検索後の入荷通知依頼の件数が変化しない").toBe(前.length);
    expect.soft(後, "検索後の入荷通知依頼の各属性が変化しない").toEqual(前);
  });
});

caseTest("IT-M12-05-019", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  let rows: string[][] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(kwOf("CSV対象商品")); await p.検索する(); });
  await step(3, async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), p.CSVリンク.first().click({ timeout: 20_000 })]);
    const chunks: Buffer[] = [];
    for await (const c of await dl.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    rows = parseCsv(decodeCsvBytes(Buffer.concat(chunks)));
  });
  await expected(async () => {
    const first = rows.map((r) => r[0]);
    expect.soft(first, "CSVに検索条件と一致する商品ID 〔商品ID-M1205-019A〕が含まれる").toContain(notes.get("〔商品ID-M1205-019A〕"));
    expect.soft(first, "検索条件と一致しない商品ID 〔商品ID-M1205-019B〕が含まれない").not.toContain(notes.get("〔商品ID-M1205-019B〕"));
  });
});

caseTest("IT-M12-05-023", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.キーワード.fill(kwOf("依頼日From境界"), { timeout: 20_000 });
    await p.依頼日From.fill("2026-07-15", { timeout: 20_000 });
    await p.依頼日To.fill("", { timeout: 20_000 });
    await p.検索する();
  });
  await expected(async () => {
    const got = ids(await p.結果の行());
    expect.soft(got, "依頼日時が2026/07/15 12:00:00の商品ID 〔商品ID-M1205-023B〕が表示される").toContain(notes.get("〔商品ID-M1205-023B〕"));
    expect.soft(got, "2026/07/16 12:00:00の商品ID 〔商品ID-M1205-023C〕が表示される").toContain(notes.get("〔商品ID-M1205-023C〕"));
    expect.soft(got, "2026/07/14 12:00:00の商品ID 〔商品ID-M1205-023A〕が表示されない").not.toContain(notes.get("〔商品ID-M1205-023A〕"));
  });
});

caseTest("IT-M12-05-024", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("複数会員通知待ち"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-024〕"), 言語: 表示言語.ja, 商品名: 商品名("複数会員通知待ち"), 通知待ち: "2", 見出し: "商品ID 〔商品ID-M1205-024〕（通知待ち件数が2）" }]);
  });
});

caseTest("IT-M12-05-025", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("複数会員削除済み"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-025〕"), 言語: 表示言語.ja, 商品名: 商品名("複数会員削除済み"), 削除: "2", 見出し: "商品ID 〔商品ID-M1205-025〕（削除件数が2）" }]);
  });
});

caseTest("IT-M12-05-026", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("混在確認"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(2);
    await 行を確かめる(p, [
      { id: notes.get("〔商品ID-M1205-026A〕"), 商品名: 商品名("混在確認", "通知待ち"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1205-026A〕（通知待ち1・削除0）" },
      { id: notes.get("〔商品ID-M1205-026B〕"), 商品名: 商品名("混在確認", "削除済み"), 通知待ち: "0", 削除: "1", 見出し: "商品ID 〔商品ID-M1205-026B〕（通知待ち0・削除1）" },
    ]);
  });
});

caseTest("IT-M12-05-030", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("組合せ確認商品単位削除"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-030〕"), 言語: 表示言語.ja, 商品名: 商品名("組合せ確認商品単位削除"), 通知待ち: "0", 削除: "2", 見出し: "商品ID 〔商品ID-M1205-030〕（通知待ち0・削除2）" }]);
  });
});

caseTest("IT-M12-05-031", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("組合せ確認単一規格待ち"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-031〕"), 言語: 表示言語.ja, 商品名: 商品名("組合せ確認単一規格待ち"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1205-031〕（通知待ち1・削除0）" }]);
  });
});

caseTest("IT-M12-05-032", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("組合せ確認複数規格複数会員待ち"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-032〕"), 言語: 表示言語.ja, 商品名: 商品名("組合せ確認複数規格複数会員待ち"), 通知待ち: "2", 削除: "0", 見出し: "商品ID 〔商品ID-M1205-032〕（通知待ち2・削除0）" }]);
  });
});

caseTest("IT-M12-05-033", async ({ page, step, notes, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  await 集計を検索する(p, step, kwOf("組合せ確認複数規格併存"));
  await expected(async () => {
    expect.soft((await p.結果の行()).length, "検索結果の行数").toBe(1);
    await 行を確かめる(p, [{ id: notes.get("〔商品ID-M1205-033〕"), 言語: 表示言語.ja, 商品名: 商品名("組合せ確認複数規格併存"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1205-033〕（通知待ち1・削除0）" }]);
  });
});
