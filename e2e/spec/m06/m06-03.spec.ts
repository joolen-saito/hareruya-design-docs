/**
 * M06-03 買取詳細。正本: cases/M06-03_test_cases.tsv
 *
 * 実装したケース: 002 003 004 006 009 011 012 013 014 015 016 017 018 021 022 023 024 025 026 034 050 051 052 054 055 056 057 058 063 064 065 066
 *                 076 077 078 079 081 084 087 088
 * 実装しないケース（スキップ候補）と理由:
 * - 001: ダブルチェック者（check01）のメンバーとその承認の行を作る指定がシード表に無い（承認の行は画面でもDBの窓口でも作っていない）
 * - 007 008 019 020 035-049 080 082 083 085 086 089-096: 削除済みのメンバー・商品の作成、検索対象商品（ID 7001・カテゴリー・高額商品コード）や
 *   原価試験用商品（BlackLotus など）、商品検索モーダルの選択、個別入力商品の実在庫登録、MTGバイヤー側の会員画面との連動、
 *   ほかの機能の画面（在庫履歴・在庫検索・買取商品履歴）の準備が要り、画面でも印つきのDB書き込みでも前提を作れない／作れる範囲を超える
 * - 028 029: 通常商品のNM・SP・MPの3規格を1商品に持たせられない（商品を規格ごとに分けると「全状態の展開」が確かめられない）
 * - 010 053 062: 「権限なし担当者」は権限のマスターに足す・既存の権限を変える（共有の設定の変更）必要がある
 * - 059 060 074 061: ECCUBE在庫の数量・総原価・原価単価・在庫履歴の表の値を、窓口で整えられない（共有のマスタ側）。061は未登録の個別入力商品つきの入庫の準備が要る
 * - 030-033 036-040 093: 高額商品コード・BlackLotus など原価試験用の商品が要る／商品検索モーダルのシード
 *
 * 決め打ちの識別の値（商品コード・商品名・申込者名）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 * 画面の操作で作る買取は、フロントの店頭買取査定申込で作った実行の印つきの買取。更新前の値はDBで足している（seeds/m06-03.ts の注記）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 買取の現状, 実在庫の現状, 実在庫履歴, 店舗在庫と履歴の件数 } from "../../db/m06_03";
import { OtcDetail, 数 } from "../../pages/admin/m06_03_detail";
import {
  M0603_ACCOUNTING, M0603_IT, M0603_OSAKA, M0603_STOCK, 共通商品, 在庫入庫担当者, 経理担当者,
} from "../../seeds/m06-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const A = () => rc(共通商品.A);
const B = () => rc(共通商品.B);
const C = () => rc(共通商品.C);

/** DBの時刻（秒）と、操作の前後の時刻（ミリ秒）のずれの許容（DBサーバーと試験端末の時計のずれ）。秒 */
const 時計のずれ = 120;
const 前後に収まる = (db: number | null, 前: number, 後: number): boolean => db !== null && db >= 前 / 1000 - 時計のずれ && db <= 後 / 1000 + 時計のずれ;
const 時計の注記 = `DBの更新時刻と操作の前後の時刻は、DBサーバーと試験端末の時計のずれを見て前後${時計のずれ}秒の範囲で比べた`;

const 注文ID = (notes: { get: (k: string) => string }, no: string) => notes.get(`〔注文ID-M0603-${no}〕`);

// ---------------------------------------------------------------- 表示

// 002: 適格請求書発行事業者情報・棚戻し済みの表示
caseTest("IT-M06-03-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.値("操作履歴", "適格請求書発行事業者情報"); });
  await expected(async () => {
    const 適格 = await d.ラジオ("操作履歴", "適格請求書発行事業者情報");
    const 棚戻し = await d.ラジオ("操作履歴", "棚戻し済み");
    expect.soft(適格.選択中, "適格請求書発行事業者情報の選択（登録済み＝事業者）").toEqual(["事業者"]);
    expect.soft(適格.全て無効, "適格請求書発行事業者情報が変更できない").toBe(true);
    expect.soft(棚戻し.選択中, "棚戻し済みの選択（未実施＝未）").toEqual(["未"]);
    expect.soft(棚戻し.全て無効, "棚戻し済みが変更できない").toBe(true);
  });
  note("適格請求書発行事業者情報の「登録済み」は画面の選択肢「事業者」、棚戻し済みの「未実施」は「未」に当たる");
});

// 003: ステータス変更履歴
caseTest("IT-M06-03-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.表の行("ステータス変更履歴"); });
  await expected(async () => {
    const rows = await d.表の行("ステータス変更履歴");
    expect.soft(rows.map((r) => r[0]), "変更日時の並び（降順）").toEqual(["2026/09/01 12:00:00", "2026/09/01 11:00:00", "2026/09/01 10:00:00"]);
    expect.soft(rows.map((r) => r[1]), "各行のステータス").toEqual(["入庫待ち", "経理払い出し待ち", "買取成立"]);
    expect.soft(rows.map((r) => r[2]), "各行の変更者").toEqual([在庫入庫担当者, 経理担当者, 在庫入庫担当者]);
  });
  note("ステータスと変更者はシード表が値を決めていないので、買取成立（在庫入庫担当者）・経理払い出し待ち（経理担当者）・入庫待ち（在庫入庫担当者）とした");
});

// 004: 査定申込者情報
caseTest("IT-M06-03-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.値("査定申込者情報", "氏名"); });
  await expected(async () => {
    const 枠 = "査定申込者情報";
    expect.soft(await d.値(枠, "氏名"), "氏名").toBe("試験買取 太郎");
    expect.soft(await d.値(枠, "氏名カナ"), "氏名カナ").toBe("シケンカイトリ タロウ");
    expect.soft(await d.値(枠, "会員ID"), "会員ID").toBe(notes.get("〔会員ID-M0603-共有BASE〕"));
    expect.soft(await d.値(枠, "電話番号"), "電話番号").toBe("03-6301-0001");
    expect.soft(await d.値(枠, "職業"), "職業").toBe("会社員");
    expect.soft(await d.値(枠, "生年月日"), "生年月日").toBe("1990-01-01");
    expect.soft(await d.値(枠, "返却サプライ"), "返却サプライ").toBe("なし");
    await expect.soft(d.フリーコメント(), "フリーコメント").toHaveValue("更新前コメント");
  });
  note("氏名は姓「試験買取」・名「太郎」、カナは「シケンカイトリ」「タロウ」とした（シード表は続けた氏名だけを指定）。画面は姓と名を空白で区切って表示する");
});

// 006: ダブルチェック＆保存・ダブルチェック日時
caseTest("IT-M06-03-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await expect(d.枠("操作履歴")).toBeVisible(); });
  await expected(async () => {
    await expect.soft(page.getByRole("button", { name: /ダブルチェック.*保存/ }), "ダブルチェック＆保存の操作").toHaveCount(0);
    await expect.soft(page.getByText("ダブルチェック日時"), "ダブルチェック日時").toHaveCount(0);
    await expect.soft(page.getByText(/ダブルチェック.*保存/), "ダブルチェック＆保存の文言").toHaveCount(0);
  });
});

// 009: ステータス変更ボタン
caseTest("IT-M06-03-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_IT);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await Promise.all([page.waitForLoadState("load"), d.ステータス変更のリンク().click()]); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(page.url(), "ステータス変更画面のアドレス（その買取）").toMatch(new RegExp(`/otcbuyorder/status/${id}(\\?.*)?$`));
    await expect.soft(page.locator("form#form select").first(), "ステータス変更画面の変更後のステータス欄").toBeVisible();
  });
});

// 011: 戻るボタン
caseTest("IT-M06-03-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await Promise.all([page.waitForLoadState("load"), d.一覧へ戻るリンク().click()]); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(page.url(), "買取一覧画面のアドレス").toMatch(/\/otcbuyorder(\/page\/\d+)?(\?.*)?$/);
    await expect.soft(page.locator("form#search_form"), "買取一覧の検索欄").toBeVisible();
  });
  note("画面下部の戻るリンクの表示名は「店頭買取一覧」");
});

// 025: 買取金額は実在庫に登録された値
caseTest("IT-M06-03-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const code = A();
  let 表示: string[] | undefined; let 編集: string[] | undefined;
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => {
    表示 = (await d.実在庫の表示行()).find((r) => r[1] === code);
    await d.編集を押す();
    編集 = (await d.実在庫の編集行()).find((r) => r[1] === code);
  });
  await expected(async () => {
    expect.soft(表示 && 数(表示[5]), "表示モードの買取金額（現在の商品規格買取価格1,400円ではない）").toBe(1000);
    expect.soft(編集 && 数(編集[5]), "増減数編集モードの買取金額（現在の商品規格買取価格1,400円ではない）").toBe(1000);
  });
});

// 026: 基準価格
caseTest("IT-M06-03-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const code = A();
  let 表示: string[] | undefined; let 編集: string[] | undefined;
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => {
    表示 = (await d.実在庫の表示行()).find((r) => r[1] === code);
    await d.編集を押す();
    編集 = (await d.実在庫の編集行()).find((r) => r[1] === code);
  });
  await expected(async () => {
    expect.soft(表示 && 数(表示[4]), "表示モードの基準価格（販売価格2,500円ではない）").toBe(2200);
    expect.soft(編集 && 数(編集[4]), "増減数編集モードの基準価格（販売価格2,500円ではない）").toBe(2200);
  });
});

// 034: 商品追加でモーダル
caseTest("IT-M06-03-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.商品追加を押す(); });
  await expected(async () => {
    await expect.soft(d.商品検索モーダル(), "商品検索モーダル").toBeVisible();
    await expect.soft(d.商品検索モーダル().locator("#searchProductModalButton"), "モーダルの検索ボタン").toBeVisible();
  });
});

// 076: 買取明細情報
caseTest("IT-M06-03-076", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "076")); });
  await step(2, async () => { await d.表の行("買取情報", "状態"); });
  await expected(async () => {
    const rows = await d.表の行("買取情報", "状態");
    expect.soft(rows.length, "買取明細情報の行数").toBe(2);
    const r1 = rows[0] ?? []; const r2 = rows[1] ?? [];
    expect.soft([r1[0], r1[1], r1[2], r1[3], 数(r1[4] ?? ""), r1[5], 数(r1[6] ?? "")], "1行目").toEqual(["1", rc("M0603-076-A-NM"), rc("M0603-076-商品A"), "NM", 1200, "3", 3600]);
    expect.soft([r2[0], r2[1], r2[2], r2[3], 数(r2[4] ?? ""), r2[5], 数(r2[6] ?? "")], "2行目").toEqual(["2", rc("M0603-076-B-SP"), rc("M0603-076-商品B"), "SP", 700, "2", 1400]);
  });
  note("金額は「2,500」のように桁区切りで出るので、数字だけを取り出して比べた");
});

// 077: 個別入力商品情報
caseTest("IT-M06-03-077", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "077")); });
  await step(2, async () => { await d.表の行("買取情報", "実在庫情報登録"); });
  await expected(async () => {
    const rows = await d.表の行("買取情報", "実在庫情報登録");
    expect.soft(rows.length, "個別入力商品情報の行数").toBe(1);
    const r = rows[0] ?? [];
    expect.soft([r[0], r[2], 数(r[4] ?? ""), r[5], 数(r[6] ?? "")], "1行目（No・商品名・買取金額・数量・小計）").toEqual(["1", rc("M0603-077-個別商品"), 1500, "2", 3000]);
  });
});

// 078: 実在庫情報（表示モード）
caseTest("IT-M06-03-078", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "078")); });
  await step(2, async () => { await d.実在庫の表示行(); });
  await expected(async () => {
    const rows = await d.実在庫の表示行();
    expect.soft(rows.length, "実在庫情報の行数").toBe(2);
    const r1 = rows[0] ?? []; const r2 = rows[1] ?? [];
    expect.soft([r1[0], r1[1], r1[2], r1[3], r1[6]], "1行目（No・商品コード・商品名・状態・数量）").toEqual(["1", rc("M0603-078-A-NM"), rc("M0603-078-商品"), "NM", "4"]);
    expect.soft([r2[0], r2[1], r2[2], r2[3], r2[6]], "2行目（No・商品コード・商品名・状態・数量）").toEqual(["2", rc("M0603-078-A-SP"), rc("M0603-078-商品"), "SP", "2"]);
  });
  note("NM・SPの2規格は1商品に作れないので、同じ商品名の別の商品にした");
});

// 079: 増減数編集モードの数量
caseTest("IT-M06-03-079", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "079")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.実在庫の編集行(); });
  await expected(async () => {
    const rows = await d.実在庫の編集行();
    const q = (code: string) => rows.find((r) => r[1] === code)?.[6];
    expect.soft(q(rc("M0603-079-A-NM")), "NMの数量").toBe("4");
    expect.soft(q(rc("M0603-079-A-SP")), "SPの数量").toBe("2");
    expect.soft(q(rc("M0603-079-A-MP")), "MPの数量").toBe("3");
  });
  note("NM・SP・MPの3規格は1商品に作れないので、同じ商品名の別の商品にした");
});

// 081: 査定合計金額
caseTest("IT-M06-03-081", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "081")); });
  await step(2, async () => { await d.値("買取情報", "査定合計金額"); });
  await expected(async () => {
    expect.soft(数(await d.値("買取情報", "査定合計金額")), "査定合計金額（明細2件の小計3,600円と1,400円の合計）").toBe(5000);
  });
});

// 084: 棚戻し済み
caseTest("IT-M06-03-084", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "084")); });
  await step(2, async () => { await d.ラジオ("操作履歴", "棚戻し済み"); });
  await expected(async () => {
    const r = await d.ラジオ("操作履歴", "棚戻し済み");
    expect.soft(r.選択中, "棚戻し済みの選択（実施済み＝済み）").toEqual(["済み"]);
    expect.soft(r.全て無効, "棚戻し済みが変更できない").toBe(true);
  });
});

// ---------------------------------------------------------------- フリーコメントの保存

// 012: コメント保存でコメント・最終更新者・更新日時
caseTest("IT-M06-03-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "012");
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.フリーコメントを入れる("コメント更新後"); });
  await step(3, async () => { 前 = Date.now(); await d.保存を押す(); 後 = Date.now(); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    const s = 買取の現状(id);
    expect.soft(s.コメント, "フリーコメント").toBe("コメント更新後");
    expect.soft(s.最終更新者, "最終更新者").toBe(在庫入庫担当者);
    expect.soft(前後に収まる(s.更新日時, 前, 後), `更新日時が保存した時刻（${s.更新日時}）`).toBe(true);
  });
  note(時計の注記);
});

// 013: 保存後の遷移
caseTest("IT-M06-03-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "013");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.フリーコメントを入れる("遷移確認コメント"); });
  await step(3, async () => { await d.保存を押す(); });
  await expected(async () => {
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

// 014: 増減数が全て0の保存
caseTest("IT-M06-03-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "014");
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.全行の増減数に入れる(0); });
  await step(4, async () => { await d.フリーコメントを入れる("増減なし更新"); });
  await step(5, async () => { 前 = Date.now(); await d.保存を押す(); 後 = Date.now(); });
  await step(6, async () => { 買取の現状(id); });
  await expected(async () => {
    const s = 買取の現状(id);
    expect.soft(s.コメント, "フリーコメント").toBe("増減なし更新");
    expect.soft(s.最終更新者, "最終更新者").toBe(在庫入庫担当者);
    expect.soft(前後に収まる(s.更新日時, 前, 後), `更新日時が保存した時刻（${s.更新日時}）`).toBe(true);
    expect.soft(実在庫の現状(id, A())?.数量, "BASE-A-NMの数量（更新前のまま）").toBe(5);
    expect.soft(実在庫の現状(id, B())?.数量, "BASE-B-NMの数量（更新前のまま）").toBe(3);
    expect.soft(実在庫の現状(id, C())?.数量, "BASE-C-SPの数量（更新前のまま）").toBe(1);
  });
  note(時計の注記);
});

// ---------------------------------------------------------------- 増減数の更新

// 015: 増減数の更新
caseTest("IT-M06-03-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "015");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 2); await d.増減数を入れる(B(), 0); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫の現状(id, A()); });
  await expected(async () => {
    expect.soft(実在庫の現状(id, A())?.数量, "BASE-A-NMの数量（5から7）").toBe(7);
    expect.soft(実在庫の現状(id, B())?.数量, "BASE-B-NMの数量（3のまま）").toBe(3);
  });
});

// 016: 在庫履歴
caseTest("IT-M06-03-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "016");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 2); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫履歴(id, A()); });
  await expected(async () => {
    const h = 実在庫履歴(id, A());
    expect.soft(h, "BASE-A-NMの在庫履歴（変更前数量5・変更後数量7が1件）").toEqual([{ 変更前: 5, 変更後: 7 }]);
  });
});

// 017: 減らしすぎ
caseTest("IT-M06-03-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前の履歴 = 実在庫履歴(id, C()).length;
  const 前 = 実在庫の現状(id, C());
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(C(), -2); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫の現状(id, C()); });
  await expected(async () => {
    const 後 = 実在庫の現状(id, C());
    expect.soft(後?.数量, "BASE-C-SPの数量（1のまま）").toBe(1);
    expect.soft(後?.小計, "BASE-C-SPの買取金額（小計。更新前のまま）").toBe(前?.小計);
    expect.soft(実在庫履歴(id, C()).length, "BASE-C-SPの在庫履歴の件数（更新前のまま）").toBe(前の履歴);
  });
  note("買取金額は、実在庫の小計（数量1なので買取金額と同額）が更新前のままであることで確かめた");
});

// 018: 減らしすぎの遷移
caseTest("IT-M06-03-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(C(), -2); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await expected(async () => {
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

// 087: 複数商品の在庫履歴
caseTest("IT-M06-03-087", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "087");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 2); await d.増減数を入れる(B(), 2); await d.増減数を入れる(C(), 0); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫履歴(id, A()); });
  await expected(async () => {
    expect.soft(実在庫履歴(id, A()), "BASE-A-NMの在庫履歴").toEqual([{ 変更前: 5, 変更後: 7 }]);
    expect.soft(実在庫履歴(id, B()), "BASE-B-NMの在庫履歴").toEqual([{ 変更前: 3, 変更後: 5 }]);
    expect.soft(実在庫履歴(id, C()).length, "BASE-C-SPの在庫履歴の件数（0件のまま）").toBe(0);
  });
});

// 088: 更新者・更新日時
caseTest("IT-M06-03-088", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "088");
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 2); });
  await step(4, async () => { 前 = Date.now(); });
  await step(5, async () => { await d.追加品確定を押す(); 後 = Date.now(); });
  await step(6, async () => { 買取の現状(id); });
  await expected(async () => {
    const s = 買取の現状(id);
    expect.soft(s.最終更新者, "最終更新者（更新前の管理者から在庫入庫担当者へ）").toBe(在庫入庫担当者);
    expect.soft(前後に収まる(s.更新日時, 前, 後), `更新日時（更新前の2026-09-01 09:00から保存した時刻へ。${s.更新日時}）`).toBe(true);
  });
  note(`最終更新者の更新前（seed_admin）は、この環境の全権限の管理者に読み替えた。${時計の注記}`);
});

// ---------------------------------------------------------------- 他店舗の担当者

// 021: 編集可能店舗が違うと増減数を更新できない
caseTest("IT-M06-03-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_OSAKA);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 1); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫の現状(id, A()); });
  await expected(async () => {
    expect.soft(実在庫の現状(id, A())?.数量, "BASE-A-NMの数量（5のまま）").toBe(5);
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
  });
});

// 022: 編集可能店舗が違うとコメントを更新できない
caseTest("IT-M06-03-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_OSAKA);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前 = 買取の現状(id);
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.フリーコメントを入れる("他店舗更新"); });
  await step(3, async () => { await d.保存を押す(); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    const s = 買取の現状(id);
    expect.soft(s.コメント, "フリーコメント（更新前のまま）").toBe("更新前コメント");
    expect.soft(s.最終更新者, "最終更新者（更新されない）").toBe(前.最終更新者);
    expect.soft(s.更新日時, "更新日時（更新されない）").toBe(前.更新日時);
  });
});

// ---------------------------------------------------------------- 編集モードの解除

// 023: 解除を取り消す
caseTest("IT-M06-03-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  let 文 = "";
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), -1); });
  await step(4, async () => { await d.編集解除を押す(); });
  await step(5, async () => { 文 = await d.確認ダイアログに応える(false); });
  await expected(async () => {
    expect.soft(文, "確認ダイアログの文").toContain("解除しますか");
    await expect.soft(d.編集モードの表(), "増減数編集モード").toBeVisible();
    await expect.soft(d.編集ボタン(), "ボタンの表示名（編集解除）").toHaveText("編集解除");
    expect.soft(await d.増減数の値(A()), "BASE-A-NMの増減数").toBe("-1");
  });
});

// 024: 解除を確定する
caseTest("IT-M06-03-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), -1); });
  await step(4, async () => { await d.編集解除を押す(); });
  await step(5, async () => { await d.確認ダイアログに応える(true); });
  await expected(async () => {
    await expect.soft(d.表示モードの表(), "実在庫情報の表示モード").toBeVisible();
    await expect.soft(d.編集モードの表(), "増減数編集モード（閉じている）").toBeHidden();
    await expect.soft(d.編集ボタン(), "ボタンの表示名（編集）").toHaveText("編集");
    expect.soft(await d.増減数の値(A()), "入力した増減数が破棄されている").toBe("");
  });
});

// ---------------------------------------------------------------- 経理払い出し済

const 経理の確かめ = async (id: string, d: OtcDetail, page: import("@playwright/test").Page) => {
  expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
};

// 050: 個別入力商品なし → 入庫待ち
caseTest("IT-M06-03-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "050");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.経理払い出し済を押す(); });
  await step(3, async () => { await d.確認ダイアログに応える(true); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => { expect.soft(買取の現状(id).ステータス, "ステータス").toBe("入庫待ち"); });
});

// 051: 個別入力商品あり → 未登録在庫あり
caseTest("IT-M06-03-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "051");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.経理払い出し済を押す(); });
  await step(3, async () => { await d.確認ダイアログに応える(true); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => { expect.soft(買取の現状(id).ステータス, "ステータス").toBe("未登録在庫あり"); });
});

// 052: 取り消す
caseTest("IT-M06-03-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有ACCOUNTING-NONE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.経理払い出し済を押す(); });
  await step(3, async () => { await d.確認ダイアログに応える(false); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(買取の現状(id).ステータス, "ステータス（経理払い出し待ちのまま）").toBe("経理払い出し待ち");
    await 経理の確かめ(id, d, page);
  });
});

// 054: 入庫済みの買取
caseTest("IT-M06-03-054", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有INVALID");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.経理払い出し済を押す(); });
  await step(3, async () => { await d.確認ダイアログに応える(true); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(買取の現状(id).ステータス, "ステータス（入庫済みのまま）").toBe("入庫済み");
    await 経理の確かめ(id, d, page);
  });
});

// 055: トークンの入力要素を削除
caseTest("IT-M06-03-055", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有ACCOUNTING-NONE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.トークンを消す("update_status_account_team_paid"); });
  await step(3, async () => { await d.経理払い出し済を押す(); });
  await step(4, async () => { await d.確認ダイアログに応える(true); });
  await step(5, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(買取の現状(id).ステータス, "ステータス（経理払い出し待ちのまま）").toBe("経理払い出し待ち");
    await 経理の確かめ(id, d, page);
  });
  note("開発者ツールでの入力要素の削除は、画面のスクリプト（要素の削除）で行った");
});

// 056: トークンを不正な値に変更
caseTest("IT-M06-03-056", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有ACCOUNTING-NONE");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.トークンを変える("update_status_account_team_paid", "invalid-token"); });
  await step(3, async () => { await d.経理払い出し済を押す(); });
  await step(4, async () => { await d.確認ダイアログに応える(true); });
  await step(5, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(買取の現状(id).ステータス, "ステータス（経理払い出し待ちのまま）").toBe("経理払い出し待ち");
    await 経理の確かめ(id, d, page);
  });
  note("開発者ツールでの値の変更は、画面のスクリプト（入力値の書き換え）で行った");
});

// 057: 処理後の遷移
caseTest("IT-M06-03-057", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_ACCOUNTING);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "057");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.経理払い出し済を押す(); });
  await step(3, async () => { await d.確認ダイアログに応える(true); });
  await expected(async () => {
    await 経理の確かめ(id, d, page);
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

// ---------------------------------------------------------------- 入庫済みにする

// 058: 入庫済み・入庫日時・最終更新者
caseTest("IT-M06-03-058", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "058");
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 前 = Date.now(); await d.入庫済みにするを押す(); 後 = Date.now(); });
  await step(3, async () => { 買取の現状(id); });
  await step(4, async () => { await d.値("操作履歴", "入庫日時"); });
  await expected(async () => {
    const s = 買取の現状(id);
    expect.soft(s.ステータス, "ステータス").toBe("入庫済み");
    expect.soft(前後に収まる(s.入庫日時, 前, 後), `入庫日時がボタンを押した時刻（${s.入庫日時}）`).toBe(true);
    expect.soft(s.最終更新者, "最終更新者").toBe(在庫入庫担当者);
    expect.soft(await d.値("操作履歴", "入庫日時"), "画面の入庫日時（DBの入庫日時と同じ）").toBe(s.入庫日時の表示);
  });
  note(時計の注記);
});

// 066: 入庫済み処理後の遷移
caseTest("IT-M06-03-066", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "066");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.入庫済みにするを押す(); });
  await expected(async () => {
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

const 変化の確かめ = (id: string, 商品: string[]) => ({ ステータス: 買取の現状(id).ステータス, 店舗: 商品.map(店舗在庫と履歴の件数) });
const 共有BASEの商品 = () => [A(), B(), C(), rc(共通商品.D)];

// 063: 他店舗の担当者は入庫済みにできない
caseTest("IT-M06-03-063", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_OSAKA);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前 = { ステータス: 買取の現状(id).ステータス, 店舗: 共有BASEの商品().map(店舗在庫と履歴の件数) };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.入庫済みにするを押す(); });
  await step(3, async () => { 買取の現状(id); });
  await expected(async () => { expect.soft(変化の確かめ(id, 共有BASEの商品()), "ステータス、ECCUBE在庫と在庫履歴の件数（更新前のまま）").toEqual(前); });
});

// 064: トークンの入力要素を削除
caseTest("IT-M06-03-064", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前 = { ステータス: 買取の現状(id).ステータス, 店舗: 共有BASEの商品().map(店舗在庫と履歴の件数) };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.トークンを消す("update_status_restocked"); });
  await step(3, async () => { await d.入庫済みにするを押す(); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(変化の確かめ(id, 共有BASEの商品()), "ステータス、ECCUBE在庫と在庫履歴の件数（更新前のまま）").toEqual(前);
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
  });
  note("開発者ツールでの入力要素の削除は、画面のスクリプト（要素の削除）で行った");
});

// 065: トークンを不正な値に変更
caseTest("IT-M06-03-065", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前 = { ステータス: 買取の現状(id).ステータス, 店舗: 共有BASEの商品().map(店舗在庫と履歴の件数) };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.トークンを変える("update_status_restocked", "invalid-token"); });
  await step(3, async () => { await d.入庫済みにするを押す(); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(変化の確かめ(id, 共有BASEの商品()), "ステータス、ECCUBE在庫と在庫履歴の件数（更新前のまま）").toEqual(前);
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
  });
  note("開発者ツールでの値の変更は、画面のスクリプト（入力値の書き換え）で行った");
});
