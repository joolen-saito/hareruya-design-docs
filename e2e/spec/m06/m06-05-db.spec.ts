/**
 * M06-05 買取商品履歴(検索入力・検索結果)。正本: cases/M06-05_test_cases.tsv（spec/m06/m06-05.spec.ts の続き）
 *
 * シード表の投入方法に「DB」「MTGバイヤー」を含むケースを、依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。
 * 画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で実装した。シードは seeds/m06-05-more.ts。
 * 読み替えとDBへの書き込みは、シードの注記と、各ケースの手順の注記に残す。
 *
 * 実装しないケースと理由:
 * - 029: 12,001件の大量データ（商品コードMAX-PG-M0605の履歴）が要る
 * - 038・039: 削除済みの商品・商品規格・作業者に紐づく履歴は、外部キー制約があり、画面でもDBの印つきデータの範囲でも作れない
 *   （履歴の作業者のメンバーは履歴に紐づくと削除できない。実在庫のある商品は画面から削除できない）
 *
 * 決め打ちの識別の値（商品コード）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 * 共有の一覧は、ほかの実行・ほかの人の履歴が混ざるので、検索は印つきの商品コード・商品名・査定IDなどで絞って確かめる（読み替え）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { 会員IDを調べる, 商品コードの査定ID, 実在庫履歴を消す } from "../../db/m06_05";
import { HistoryPage, 履歴の行 } from "../../pages/admin/m06_05_history";
import { M0605_ALL, M0605_TOKYO } from "../../seeds/m06-05";
import "../../seeds/m06-05-more";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 数 = (t: string): number => Number(t.replace(/[^\d.-]/g, ""));
const 査定番号 = (rows: 履歴の行[]): string[] => rows.map((r) => r.査定番号).sort();
const 並べる = (...v: string[]): string[] => [...v].sort();
const 日 = (t: string): string => t.slice(0, 10);

const 商品コードで検索 = async (h: HistoryPage, code: string) => { await h.商品コードを入れる(code); await h.検索する(); };
const 査定IDで検索 = async (h: HistoryPage, id: string) => { await h.査定IDを入れる(id); await h.検索する(); };

const 絞り込みの注記 = "共有の一覧には、ほかの実行・ほかの人の履歴があるので、検索条件に印つきの商品コード（または商品名・査定番号）を加えて絞った";

// 003: 検索入力を開き直すと、検索条件とページ番号が破棄される
caseTest("IT-M06-05-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_TOKYO);
  const h = new HistoryPage(page);
  const code = rc("PG-M0605");
  let 既定の件数 = "";
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 商品コードで検索(h, code); 既定の件数 = await h.表示件数の選択中(); });
  await step(3, async () => { await h.表示件数を選ぶ("10件"); await h.ページへ移る(2); });
  await step(4, async () => { await h.open(); });
  await expected(async () => {
    await expect.soft(h.結果の表の行(), "履歴一覧が表示されない").toHaveCount(0);
    await expect.soft(h.ページング(), "ページ送りが表示されない").toHaveCount(0);
    await expect.soft(page.locator("#search_box__product_code input"), "商品コードの検索条件が破棄される").toHaveValue("");
    // 件数が既定値に戻ること: 検索し直した結果の件数の選択が、最初に検索したときの既定値と同じ
    await 商品コードで検索(h, code);
    expect.soft(await h.表示件数の選択中(), "開き直して検索し直したときの表示件数（最初の検索での既定値）").toBe(既定の件数);
  });
  note("既定表示件数を50件に設定する事前準備は、管理画面に設定の項目が無い共有の設定なので行っていない（アプリの設定値は10件）。件数が既定値に戻ることは、最初の検索のときの件数の選択と、開き直して検索し直したときの選択が同じであることで確かめた");
  note(`${絞り込みの注記}。履歴一覧が表示されないことは、開き直した直後の画面で確かめた`);
});

// 004: ステータスの選択肢
caseTest("IT-M06-05-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_TOKYO);
  const h = new HistoryPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { 選択肢 = await h.ステータスの選択肢(); });
  await expected(async () => {
    for (const n of ["入庫待ち", "未登録在庫あり", "入庫済み", "管理者取消"]) expect.soft(選択肢, `ステータスの選択肢（${n}）`).toContain(n);
    expect.soft(選択肢.filter((t) => /ダブルチェック|データ出力/.test(t)), "ステータスの選択肢にないもの（ダブルチェック済・データ出力済）").toEqual([]);
  });
});

// 005: 査定IDで検索
caseTest("IT-M06-05-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_TOKYO);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索(h, id); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.length, "表示された履歴の件数（商品2件）").toBe(2);
    expect.soft(rows.filter((r) => r.査定番号 !== id).map((r) => r.査定番号), "査定番号が違う履歴（表示されない）").toEqual([]);
    expect.soft(rows.map((r) => r.商品コード).sort(), "表示された履歴の商品コード（M6501-A-NMとM6501-B-SP）").toEqual(並べる(rc("M6501-A-NM"), rc("M6501-B-SP")));
  });
  note("東京店の査定番号は、買取店舗Aで申込んだ買取の買取店舗をDBで既存の店舗「東京店」にしたもの（デフォルト検索表示店舗が東京店の管理者の検索に出る）");
});

// 006: 会員IDで検索
caseTest("IT-M06-05-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  const 会員 = 会員IDを調べる(id);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.会員IDを入れる(会員); await h.検索する(); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.length, "表示された履歴の件数（会員の査定番号の商品2件）").toBe(2);
    expect.soft(rows.filter((r) => r.査定番号 !== id).map((r) => r.査定番号), "ほかの査定番号の履歴（表示されない）").toEqual([]);
    expect.soft(rows.filter((r) => r.商品コード === rc("M65010-C-NM")).length, "比較用の会員の履歴（表示されない）").toBe(0);
  });
  note(`会員ID 6501・65010 は画面で指定できないので、本会員を画面で登録して買取に紐づけた。検索には、その会員の会員ID（${会員}）を入れた。比較用の会員は別の本会員（会員IDの桁の包含は再現していない。検索は完全一致）`);
});

// 009: ステータスの絞り込み
caseTest("IT-M06-05-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c, d, e, f] = ["A", "B", "C", "D", "E", "F"].map((k) => notes.get(`〔査定番号-M0605-共有STATUSES-${k}〕`));
  await step(1, async () => { await h.open(); });
  await step(2, async () => {
    await h.商品コードを入れる(rc("M0605-STATUSES"));
    await h.ステータスにチェックを付ける(["入庫待ち", "入庫済み"]);
    await h.検索する();
  });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    expect.soft(got, "表示された履歴の査定番号（入庫待ちと入庫済み）").toEqual(並べる(a, c));
    expect.soft(got.filter((x) => [b, d, e, f].includes(x)), "表示されない履歴（未登録在庫あり・管理者取消・買取成立・買取キャンセル）").toEqual([]);
  });
  note(絞り込みの注記);
});

// 011: 基準価格は現在の基準価格
caseTest("IT-M06-05-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.査定IDを入れる(id); await h.基準価格を入れる("2200", "2200"); await h.検索する(); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.map((r) => r.商品コード), "表示された履歴の商品コード（基準価格2,200円のM6501-A-NMだけ）").toEqual([rc("M6501-A-NM")]);
  });
  note(絞り込みの注記);
});

// 012: 買取価格は実際の買取単価
caseTest("IT-M06-05-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.査定IDを入れる(id); await h.買取価格を入れる("1000", "1000"); await h.検索する(); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.map((r) => r.商品コード), "表示された履歴の商品コード（実際の買取単価1,000円のM6501-A-NMだけ）").toEqual([rc("M6501-A-NM")]);
  });
  note(絞り込みの注記);
});

const 商品名の共通部分 = () => rc("M0605-LANG");
const 言語の組 = (notes: { get(l: string): string }) => ["A", "B", "C", "D", "E"].map((k) => notes.get(`〔査定番号-M0605-共有LANG-${k}〕`));

// 013: 状態NM
caseTest("IT-M06-05-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c, d, e] = 言語の組(notes);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名を入れる(商品名の共通部分()); await h.状態にチェックを付ける(["NM"]); await h.検索する(); });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    expect.soft(got, "表示された履歴の査定番号（状態NM）").toEqual(並べる(a, c));
    expect.soft(got.filter((x) => [b, d, e].includes(x)), "表示されない履歴（SP・MP・HP）").toEqual([]);
  });
  note(`${絞り込みの注記}（商品名の共通部分で絞った）`);
});

// 016: 言語「その他言語」
caseTest("IT-M06-05-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c, d, e] = 言語の組(notes);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名を入れる(商品名の共通部分()); await h.言語にチェックを付ける(["その他言語"]); await h.検索する(); });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    expect.soft(got, "表示された履歴の査定番号（フランス語とドイツ語）").toEqual(並べる(c, d));
    expect.soft(got.filter((x) => [a, b, e].includes(x)), "表示されない履歴（日本語・英語）").toEqual([]);
  });
  note(`${絞り込みの注記}（商品名の共通部分で絞った）`);
});

// 017: 言語「日本語」と「その他言語」
caseTest("IT-M06-05-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c, d, e] = 言語の組(notes);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名を入れる(商品名の共通部分()); await h.言語にチェックを付ける(["日本語", "その他言語"]); await h.検索する(); });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    for (const [n, x] of [["日本語", a], ["フランス語", c], ["ドイツ語", d]] as const) expect.soft(got, `表示された履歴の査定番号（${n}）`).toContain(x);
    expect.soft(got, "表示されない履歴（英語）").not.toContain(b);
    void e;
  });
  note(`${絞り込みの注記}（商品名の共通部分で絞った）。日本語・HP の履歴（E）も日本語なので表示される（正本の期待結果は A・C・D と、B が表示されないことを定める）`);
});

// 018: 買取日時の範囲
caseTest("IT-M06-05-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c] = ["A", "B", "C"].map((k) => notes.get(`〔査定番号-M0605-共有DATES-${k}〕`));
  await step(1, async () => { await h.open(); });
  await step(2, async () => {
    await h.商品コードを入れる(rc("M0605-DATES"));
    await h.買取日時を入れる("2026-08-20 00:00", "2026-08-20 23:59");
    await h.検索する();
  });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    expect.soft(got, "表示された履歴の査定番号（買取成立日 2026-08-20 の A と、買取キャンセル日 2026-08-20 の B）").toEqual(並べる(a, b));
    expect.soft(got, "範囲外の履歴（表示されない）").not.toContain(c);
  });
  note(`${絞り込みの注記}。買取日時(From)(To)は日付だけ（2026/08/20）を指すので、その日の 00:00〜23:59 として入れた`);
});

// 020: 該当なし
caseTest("IT-M06-05-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 商品コードで検索(h, rc("NOT-FOUND-M0605")); });
  await expected(async () => {
    expect.soft(await h.結果の欄の文(), "0件の通知").toContain("検索条件に該当するデータがありませんでした。");
    await expect.soft(page.locator("form#search_form"), "同じ検索画面").toBeVisible();
    await expect.soft(h.結果の表の行(), "履歴一覧が表示されない").toHaveCount(0);
    await expect.soft(h.ページング(), "ページ送りが表示されない").toHaveCount(0);
  });
  note("商品コードNOT-FOUND-M0605の商品は登録していない（印つきの商品コードで検索する）。削除は行っていない");
});

const 基準の行 = (rows: 履歴の行[], code: string): 履歴の行 | undefined => rows.find((r) => r.商品コード === code);

// 021: 一覧の表示（申込者・基準価格・買取価格）
caseTest("IT-M06-05-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); await 査定IDで検索(h, id); });
  await step(2, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    const r = 基準の行(rows, rc("M6501-A-NM"));
    expect.soft(r?.申込者, "申込者").toBe("山田 太郎");
    expect.soft(r ? 数(r.基準価格) : null, "基準価格（現在の基準価格2,200円）").toBe(2200);
    expect.soft(r ? 数(r.買取価格) : null, "買取価格（実際の買取単価1,000円）").toBe(1000);
  });
  note("会員IDは一覧に表示されない列なので、この手順では確かめていない（会員IDの確かめは006・036）");
});

// 022: 買取数の取得元
caseTest("IT-M06-05-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const a = notes.get("〔査定番号-M0605-共有COUNTS-A〕");
  const b = notes.get("〔査定番号-M0605-共有COUNTS-B〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("COUNT-M0605")); });
  await step(2, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    expect.soft(rows.find((r) => r.査定番号 === a)?.買取数, "通常買取明細3件の査定番号の買取数").toBe("3");
    expect.soft(rows.find((r) => r.査定番号 === b)?.買取数, "実在庫情報に紐づく個別入力商品2件の査定番号の買取数").toBe("2");
  });
  note(絞り込みの注記);
});

// 023: 入庫数・増減数
caseTest("IT-M06-05-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); await 査定IDで検索(h, id); });
  await step(2, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    const r = 基準の行(rows, rc("M6501-A-NM"));
    expect.soft(r?.入庫数, "入庫数（変更後在庫8）").toBe("8");
    expect.soft(r?.増減数, "増減数（変更後8 − 変更前5）").toBe("3");
  });
});

// 025: ページ送りで検索条件と件数が引き継がれる
caseTest("IT-M06-05-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const code = rc("PG-M0605");
  await step(1, async () => { await h.open(); await 商品コードで検索(h, code); });
  await step(2, async () => { await h.表示件数を選ぶ("10件"); });
  await step(3, async () => { await h.ページへ移る(2); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.length, "2ページ目に表示された履歴の件数（残り1件）").toBe(1);
    expect.soft(rows.filter((r) => r.商品コード !== code).map((r) => r.商品コード), "商品コードの検索条件が違う履歴（表示されない）").toEqual([]);
    expect.soft(await h.表示件数の選択中(), "表示件数（10件が引き継がれる）").toBe("10件");
    expect.soft(await h.該当件数(), "該当件数（検索条件の11件）").toBe(11);
  });
});

// 026: 選択肢にない件数は採用されない
caseTest("IT-M06-05-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("PG-M0605")); });
  await step(2, async () => { await h.表示件数を選ぶ("10件"); });
  await step(3, async () => {
    // 開発者ツールで件数の選択肢に11件を追加して選ぶ（選択肢の値は、10件の選択肢のアドレスの page_count を 11 にしたもの）
    await h.表示件数の選択().evaluate((sel) => {
      const s = sel as HTMLSelectElement;
      const o = document.createElement("option");
      o.value = s.options[0].value.replace(/page_count=[^&]*/, "page_count=11");
      o.textContent = "11件";
      s.appendChild(o);
    });
    await Promise.all([page.waitForURL(/page_count=11/, { timeout: 30_000 }), h.表示件数の選択().selectOption({ label: "11件" })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft((await h.行を読む()).length, "表示された履歴の件数（直前の10件表示が維持される）").toBe(10);
    expect.soft(await h.表示件数の選択中(), "表示件数の選択（10件）").toBe("10件");
  });
});

// 028: 最終ページの履歴が無くなったら1つ前のページを表示する
caseTest("IT-M06-05-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  let 二ページ目の履歴ID = "";
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("PG-M0605-028")); });
  await step(2, async () => {
    await h.表示件数を選ぶ("10件");
    await h.ページへ移る(2);
    const rows = await h.行を読む();
    expect(rows.length, "2ページ目の履歴の件数").toBe(1);
    二ページ目の履歴ID = rows[0].履歴ID;
  });
  await step(3, async () => { 実在庫履歴を消す(二ページ目の履歴ID); });
  await step(4, async () => { await page.reload(); await page.waitForLoadState("load"); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.length, "表示された履歴の件数（残った10件）").toBe(10);
    expect.soft(rows.map((r) => r.履歴ID), "削除した履歴（表示されない）").not.toContain(二ページ目の履歴ID);
    expect.soft(await h.該当件数(), "該当件数").toBe(10);
  });
  note("履歴ID 659011028 は画面が振る値に読み替え、2ページ目に表示された1件（降順の11件目）の履歴IDを、DBで削除した（実行の印つきの買取に紐づく履歴だけ）");
});

// 030: 選択した履歴だけCSV
caseTest("IT-M06-05-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c] = ["A", "B", "C"].map((k) => notes.get(`〔査定番号-M0605-共有CSV-${k}〕`));
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("CSV-M0605")); });
  await step(2, async () => {
    const rows = await h.行を読む();
    for (const id of [a, b]) await h.行にチェックを付ける(rows.find((r) => r.査定番号 === id)!.履歴ID);
  });
  await step(3, async () => { records = await h.CSVを取る("選択した商品履歴取得"); });
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const got = (records ?? []).map((r) => r["査定番号"]).sort();
    expect.soft(got, "CSVのデータ行の査定番号（チェックを付けた2件だけ）").toEqual(並べる(a, b));
    expect.soft(got, "チェックを付けなかった履歴の行（含まれない）").not.toContain(c);
  });
});

// 031: 何も選ばずに選択した商品履歴取得
caseTest("IT-M06-05-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  let records: Record<string, string>[] | null = [];
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("CSV-M0605")); });
  await step(2, async () => { records = await h.CSVを取る("選択した商品履歴取得", 8_000); });
  await expected(async () => {
    expect.soft(records, "ダウンロードされない").toBeNull();
    await expect.soft(h.上部のエラー().first(), "管理画面上部にエラーが表示される").toBeVisible();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（検索直後の買取商品履歴(検索結果)）").toMatch(/\/otcbuyorder\/history(\/page\/\d+)?$/);
    expect.soft((await h.行を読む()).length, "検索結果の履歴の件数（検索直後の3件）").toBe(3);
  });
});

// 033: 検索結果全件取得は表示中のページに限らない
caseTest("IT-M06-05-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const code = rc("PG-M0605");
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 商品コードで検索(h, code); });
  await step(2, async () => { await h.表示件数を選ぶ("10件"); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const rows = records ?? [];
    expect.soft(rows.length, "CSVのデータ行の件数（検索条件に一致する11件）").toBe(11);
    expect.soft(rows.filter((r) => r["商品コード"] !== code).length, "商品コードが違う行（含まれない）").toBe(0);
    expect.soft(new Set(rows.map((r) => r["査定番号"])).size, "査定番号の種類（11件が重複なく出る）").toBe(11);
  });
});

// 036: CSVの内容
caseTest("IT-M06-05-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-共有BASE〕");
  const 会員 = 会員IDを調べる(id);
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 査定IDで検索(h, id); });
  await step(2, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(3, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const r = (records ?? []).find((x) => x["商品コード"] === rc("M6501-A-NM"));
    expect.soft(r?.["会員ID"], "会員ID").toBe(会員);
    expect.soft(r?.["申込者"], "申込者").toBe("山田 太郎");
    expect.soft(r ? 数(r["基準価格"]) : null, "基準価格（現在値2,200円）").toBe(2200);
    expect.soft(r ? 数(r["買取価格"]) : null, "買取価格（実際の買取単価1,000円）").toBe(1000);
    expect.soft(r?.["買取数"], "買取数").toBe("2");
    expect.soft(r?.["増減数"], "増減数").toBe("3");
  });
  note(`会員ID 6501 は画面で指定できないので、本会員を画面で登録して買取に紐づけた会員の会員ID（${会員}）に読み替えた`);
});

// 037: 並び順（画面とCSV）
caseTest("IT-M06-05-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  let 画面: 履歴の行[] = [];
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("SORT-M0605")); 画面 = await h.行を読む(); });
  await step(2, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(3, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const 並び = (日付: string[], 三十: string, 二十九: string, what: string) => {
      expect.soft(日付.length, `${what}の行数`).toBe(3);
      expect.soft(日付.lastIndexOf(三十), `${what}で最後の2026-08-30の行の位置`).toBeLessThan(日付.indexOf(二十九));
    };
    並び(画面.map((r) => 日(r.買取日時)), "2026/08/30", "2026/08/29", "画面");
    並び((records ?? []).map((r) => r["買取日時"].slice(0, 11)), "2026年08月30日", "2026年08月29日", "CSV");
  });
});

// 040: 並び順の指定が不正なとき
caseTest("IT-M06-05-040", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await step(1, async () => {
    await h.open();
    await 商品コードで検索(h, rc("SORT-M0605"));
    expect(await h.行を読む(), "一覧が表示される").toHaveLength(3);
  });
  await step(2, async () => {
    await page.goto(adminUrl("/otcbuyorder/history/search?order=INVALID"), { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    await expect.soft(h.上部のエラー().first(), "管理画面上部にエラーが表示される").toBeVisible();
    await expect.soft(h.結果の表の行(), "履歴一覧を伴わない").toHaveCount(0);
    await expect.soft(page.locator("form#search_form"), "買取商品履歴の検索画面（初期表示と同じ画面）").toBeVisible();
  });
  note("既定表示件数の設定（50件）は共有の設定なので行っていない。手順のアドレス（買取商品履歴検索のパス）は、正本のとおり /otcbuyorder/history/search に ?order=INVALID を付けて開いた");
});

// 043: 該当件数
caseTest("IT-M06-05-043", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  let 件数 = -1;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 商品コードで検索(h, rc("M0605-043-P")); });
  await step(3, async () => { 件数 = await h.該当件数(); });
  await expected(async () => {
    expect.soft(件数, "該当件数（商品コードM0605-043-Pの3件）").toBe(3);
    expect.soft((await h.行を読む()).length, "表示された履歴の件数").toBe(3);
  });
});

// 044: 買取店舗
caseTest("IT-M06-05-044", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-044〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索(h, id); });
  await step(3, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    expect.soft(基準の行(rows, rc("M0605-044-P"))?.買取店舗, "商品M0605-044-Pの行の買取店舗").toBe("大阪店");
  });
  note("買取は買取店舗Aで申込み、買取店舗をDBで既存の店舗「大阪店」にした");
});

// 045: 作業者
caseTest("IT-M06-05-045", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-045〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索(h, id); });
  await step(3, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    expect.soft(基準の行(rows, rc("M0605-045-P"))?.作業者, "商品M0605-045-Pの行の作業者（査定担当者の「査定M0605-045-S」ではない）").toBe("作業者M0605-045-W");
  });
});

// 046: 更新日時は実在庫履歴の作成日時
caseTest("IT-M06-05-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-046〕");
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索(h, id); });
  await step(3, async () => { rows = await h.行を読む(); });
  await expected(async () => {
    const 更新 = 基準の行(rows, rc("M0605-046-P"))?.更新日時 ?? "";
    expect.soft(更新, "更新日時（実在庫履歴の作成日時）").toBe("2026/08/21 13:45:10");
    expect.soft(更新, "買取日時（表示されない）").not.toContain("2026/08/20 10:00:00");
    expect.soft(更新, "店頭買取注文の更新日時（表示されない）").not.toContain("2026/08/25 09:00:00");
  });
});

// 047: ステータス1つで絞る
caseTest("IT-M06-05-047", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c] = [1, 2, 3].map((i) => 商品コードの査定ID(rc(`M0605-047-P${i}`)));
  const 会員 = 会員IDを調べる(b);
  await step(1, async () => { await h.open(); });
  await step(2, async () => {
    await h.会員IDを入れる(会員);
    await h.ステータスにチェックを付ける(["未登録在庫あり"]);
    await h.検索する();
  });
  await expected(async () => {
    const got = 査定番号(await h.行を読む());
    expect.soft(got, "表示された履歴の査定番号（未登録在庫ありの1件）").toEqual([b]);
    expect.soft(got.filter((x) => x === a || x === c), "表示されない履歴（入庫待ち・入庫済み）").toEqual([]);
  });
  note(`会員ID 605047501 は画面で指定できないので、本会員を画面で登録して買取に紐づけた会員の会員ID（${会員}）に読み替えた。査定番号 M0605-047-A・B・C は、商品コードM0605-047-P1・P2・P3 の履歴の画面が振った査定番号（A=${a}、B=${b}、C=${c}）`);
});

// 048: 基準価格は現在の基準価格
caseTest("IT-M06-05-048", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定番号-M0605-048〕");
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 商品コードで検索(h, rc("M0605-048-P")); });
  await expected(async () => {
    const rows = await h.行を読む();
    expect.soft(rows.map((r) => r.査定番号), "表示された履歴の査定番号").toEqual([id]);
    expect.soft(rows[0] ? 数(rows[0].基準価格) : null, "基準価格（現在値2,200円。買取時の1,800円ではない）").toBe(2200);
  });
});

// 049: 1件だけ選んでCSV
caseTest("IT-M06-05-049", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c] = ["A", "B", "C"].map((k) => notes.get(`〔査定番号-M0605-049-${k}〕`));
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("M0605-049-P")); });
  await step(2, async () => {
    const rows = await h.行を読む();
    await h.行にチェックを付ける(rows.find((r) => r.査定番号 === a)!.履歴ID);
  });
  await step(3, async () => { records = await h.CSVを取る("選択した商品履歴取得"); });
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const got = (records ?? []).map((r) => r["査定番号"]).sort();
    expect.soft(got, "CSVのデータ行の査定番号（チェックを付けた1件だけ）").toEqual([a]);
    expect.soft(got.filter((x) => x === b || x === c), "チェックを付けなかった履歴の行（含まれない）").toEqual([]);
  });
});

// 052: 全件取得ならチェックに関わらず全件
caseTest("IT-M06-05-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  const [a, b, c] = ["A", "B", "C"].map((k) => notes.get(`〔査定番号-M0605-CB052-${k}〕`));
  let records: Record<string, string>[] | null = null;
  await step(1, async () => { await h.open(); await 商品コードで検索(h, rc("M0605-CB052-P")); });
  await step(2, async () => {
    const rows = await h.行を読む();
    await h.行にチェックを付ける(rows.find((r) => r.査定番号 === a)!.履歴ID);
  });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    expect.soft((records ?? []).map((r) => r["査定番号"]).sort(), "CSVのデータ行の査定番号（チェックの有無に関わらず3件）").toEqual(並べる(a, b, c));
  });
});
