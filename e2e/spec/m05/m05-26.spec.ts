/**
 * M05-26 出荷実績インポート登録。正本: cases/M05-26_test_cases.tsv
 *
 * 2026-11-10（依頼者の方針）: シード表が「DBで登録」とする受注・会員・ポイント・配送は、画面で作った受注の行をDBで写して作る（seeds/m05-26.ts）。
 * 画面で作れない部分（付与ポイント・会員ポイント残高・2件目の配送・出荷日の書き換え）は、実行の印つきのデータに限り db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） で書く。
 * 共有の設定（出荷完了メールの定型文・代表アドレス・CSV取込の区切り文字・スマレジ連携）は書き換えない。
 *
 * 実装しないケース（PM への報告に理由を残した）:
 *   021 … CSV取込の区切り文字をセミコロンに変える（共有のアプリケーション設定の書き換え）
 *   027・028 … メールの受信（受信箱）と代表アドレス（共有の設定）を確かめる
 *
 * 取込前の状態は、開始時（手順1の前）にDBで控える。ファイルの注文番号は、シードが作った受注の注文番号（数字11桁）。
 * DBの日時は日本時間で「YYYY/MM/DD HH:MM」に整えて比べる（画面の日時の欄は秒つきのことがあるので、画面の確認は前方一致）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { BASE_URL } from "../../config/env";
import {
  会員のポイントを読む, 会員のメール送信履歴, 受注のメール送信履歴, 受注の取込結果, 配送の出荷日を設定, 配送情報の出荷日一覧, 取込結果, 会員のポイント,
} from "../../db/m05_26";
import { 取込ファイル, ShippingResultImportPage, アップロード結果, 受注編集の出荷日, 会員のポイント履歴Page } from "../../pages/admin/m05_26_import";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { 本店の店名 } from "../../pages/admin/m05_admin_member";
import { 購入履歴の出荷日Page } from "../../pages/front/m05_26_history";
import { 会員のパスワード, 会員のメール, M0526_ADMIN, M0526_QF_ADMIN, M0526_RE_ADMIN, 作った, 受注の取得 } from "../../seeds/m05-26";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const H2 = ["注文番号", "出荷日"];
const H3 = ["注文番号", "出荷日", "送り状No."];
const 発送済み = "発送済み";
const 出荷指示 = "出荷指示";

type 状態 = { 結果: 取込結果; 配送: (string | null)[] };
const 状態を読む = (o: 作った): 状態 => ({ 結果: 受注の取込結果(o.受注ID), 配送: 配送情報の出荷日一覧(o.受注ID) });
type ファイル = ReturnType<typeof 取込ファイル>;
type 受注の引き = (キー?: string) => 作った;

async function 管理者で入る(page: import("@playwright/test").Page, a = M0526_ADMIN): Promise<ShippingResultImportPage> {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, a);
  return new ShippingResultImportPage(page);
}

type 確かめ = { 名前: string; 実際: unknown; 期待: unknown };

/** 受注の取込結果が、発送済み・指定の出荷日（受注と配送すべて）・送り状No.になっていることの確かめ */
function 発送済みの確かめ(後: 状態, 名前: string, 日時: string, 送り状?: string): 確かめ[] {
  const l: 確かめ[] = [
    { 名前: `${名前}のステータス`, 実際: 後.結果.ステータス, 期待: 発送済み },
    { 名前: `${名前}の受注情報の出荷日`, 実際: 後.結果.出荷日, 期待: 日時 },
  ];
  if (送り状 !== undefined) l.push({ 名前: `${名前}の送り状No.`, 実際: 後.結果.送り状No, 期待: 送り状 });
  l.push({ 名前: `${名前}の配送情報の件数`, 実際: 後.配送.length, 期待: 2 });
  l.push({ 名前: `${名前}の配送情報すべての出荷日が ${日時}（実際: ${後.配送.join("・")}）`, 実際: 後.配送.every((d) => d === 日時), 期待: true });
  return l;
}

/** 受注の取込前後が同じであることの確かめ */
function 不変の確かめ(前: 状態, 後: 状態, 名前: string): 確かめ[] {
  return [
    { 名前: `${名前}のステータスが取込前のまま`, 実際: 後.結果.ステータス, 期待: 前.結果.ステータス },
    { 名前: `${名前}の受注情報の出荷日が取込前のまま`, 実際: 後.結果.出荷日, 期待: 前.結果.出荷日 },
    { 名前: `${名前}の送り状No.が取込前のまま`, 実際: 後.結果.送り状No, 期待: 前.結果.送り状No },
    { 名前: `${名前}の配送情報の出荷日が取込前のまま`, 実際: 後.配送, 期待: 前.配送 },
  ];
}

// ---------------------------------------------------------------- ファイル選択（管理者だけで足りる）

caseTest("IT-M05-26-001", async ({ page, step, expected, capture }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0526_ADMIN); // 事前準備: 管理者 m0526_admin でログインしている
  const imp = new ShippingResultImportPage(page);
  let 結果 = { 開いた: false, 複数選択: null as boolean | null, 受け付ける形式: null as string | null };
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { 結果 = await imp.ファイルを選択を押す(); await capture("「ファイルを選択」を押した直後の画面"); });
  await expected(async () => {
    expect.soft(結果.開いた, "インポートファイル選択ダイアログが開く").toBe(true);
  });
});

// ---------------------------------------------------------------- 1件を発送済みにする取込

type 更新の定め = {
  seed: string;
  ファイル: (注文番号: string, imp: ShippingResultImportPage) => Promise<ファイル> | ファイル;
  日時: string;
  送り状?: string;
  注記?: string[];
};
function 更新の本体(d: 更新の定め): CaseBody {
  return async ({ page, step, expected, capture }) => {
    const imp = await 管理者で入る(page);
    const o = 受注の取得(d.seed);
    for (const n of d.注記 ?? []) note(n);
    let r!: アップロード結果;
    let 後!: 状態;
    await step(1, async () => { await imp.open(); });
    await step(2, async () => {
      r = await imp.アップロードする(await d.ファイル(o.注文番号, imp));
      await capture("アップロード後の画面");
    });
    await step(3, async () => { 後 = 状態を読む(o); });
    await expected(async () => {
      for (const c of 発送済みの確かめ(後, `注文番号 ${o.注文番号}`, d.日時, d.送り状)) expect.soft(c.実際, c.名前).toEqual(c.期待);
    });
    note(`アップロード後の画面の表示: 完了「${r.完了.join(" / ")}」・エラー「${r.エラー.join(" / ")}」`);
  };
}

caseTest("IT-M05-26-002", 更新の本体({
  seed: "S-M05-26-FULL-002",
  日時: "2026/09/10 12:34", 送り状: "52601001",
  注記: ["64項目の見出しは、画面の「出荷実績登録CSVファイルフォーマット」の表に出ている順に並べ、注文番号・住所3・出荷日・送り状No.だけ値を入れ、ほかの項目は空にした"],
  ファイル: async (no, imp) => {
    const heads = await imp.形式の見出し();
    expect(heads.length, "画面のCSVファイルフォーマットの項目数").toBe(64);
    const val: Record<string, string> = { 注文番号: no, 住所3: "XXビル1F", 出荷日: "2026/09/10 12:34", "送り状No.": "52601001" };
    return 取込ファイル("m0526_full-002.csv", [heads, heads.map((h) => val[h] ?? "")]);
  },
}));
caseTest("IT-M05-26-003", 更新の本体({ seed: "S-M05-26-HEADER-003", 日時: "2026/09/11 10:20", ファイル: (no) => 取込ファイル("m0526_minimal-003.csv", [H2, [no, "2026/09/11 10:20"]]) }));
caseTest("IT-M05-26-004", 更新の本体({
  seed: "S-M05-26-HEADER-004", 日時: "2026/09/11 11:20", 送り状: "52601002",
  ファイル: (no) => 取込ファイル("m0526_reordered-004.csv", [["出荷日", "送り状No.", "注文番号"], ["2026/09/11 11:20", "52601002", no]]),
}));
caseTest("IT-M05-26-005", 更新の本体({
  seed: "S-M05-26-HEADER-005", 日時: "2026/09/11 12:20",
  注記: ["注文番号は先頭に0が3つ付く8桁（000＋数字5桁）で、CSVには先頭の0を除いた数字（シード表の52601に当たる）を書いた"],
  ファイル: (no) => 取込ファイル("m0526_zero_pad-005.csv", [H2, [String(Number(no)), "2026/09/11 12:20"]]),
}));
caseTest("IT-M05-26-018", 更新の本体({
  seed: "S-M05-26-ENCODING-018", 日時: "2026/09/12 10:00",
  ファイル: (no) => 取込ファイル("m0526_sjis-018.csv", [H2, [no, "2026/09/12 10:00"]], { 文字コード: "sjis" }),
}));
caseTest("IT-M05-26-019", 更新の本体({
  seed: "S-M05-26-ENCODING-019", 日時: "2026/09/12 11:00",
  ファイル: (no) => 取込ファイル("m0526_zwsp-019.csv", [["注文番号", "出​荷日"], [no, "2026/09/12 11:00"]]),
}));
caseTest("IT-M05-26-020", 更新の本体({
  seed: "S-M05-26-TSV-020", 日時: "2026/09/12 12:00",
  ファイル: (no) => 取込ファイル("m0526_tab-020.tsv", [H2, [no, "2026/09/12 12:00"]]),
}));

// ---------------------------------------------------------------- 取り込まれない・取り消される取込

type 不変の定め = {
  seed: string;
  /** 取込前後を比べる受注のキー */
  対象: string[];
  ファイル: (get: 受注の引き, imp: ShippingResultImportPage) => ファイル;
  /** 取り込み全体が取り消される（エラーが表示される）ケースは true */
  エラー?: boolean;
  注記?: string[];
};
function 不変の本体(d: 不変の定め): CaseBody {
  return async ({ page, step, expected, capture }) => {
    const imp = await 管理者で入る(page);
    const get: 受注の引き = (k = "") => 受注の取得(d.seed, k);
    const 前 = d.対象.map((k) => 状態を読む(get(k)));
    note("取込前の状態は、開始時にDBで控えた");
    for (const n of d.注記 ?? []) note(n);
    let r!: アップロード結果;
    let 後: 状態[] = [];
    await step(1, async () => { await imp.open(); });
    await step(2, async () => {
      r = await imp.アップロードする(d.ファイル(get, imp));
      await capture("アップロード後の画面");
    });
    await step(3, async () => { 後 = d.対象.map((k) => 状態を読む(get(k))); });
    await expected(async () => {
      const l = d.対象.flatMap((k, i) => 不変の確かめ(前[i], 後[i], `注文番号 ${get(k).注文番号}`));
      if (d.エラー) l.push({ 名前: `取り込み全体が取り消されてエラーが表示される（表示: ${r.エラー.join(" / ")}）`, 実際: r.エラー.length > 0, 期待: true });
      for (const c of l) expect.soft(c.実際, c.名前).toEqual(c.期待);
    });
  };
}

caseTest("IT-M05-26-006", 不変の本体({
  seed: "S-M05-26-SKIP-006", 対象: [""],
  ファイル: (g) => 取込ファイル("m0526_empty_shipping_date-006.csv", [H2, [g().注文番号, ""]]),
}));
caseTest("IT-M05-26-007", 不変の本体({
  seed: "S-M05-26-SKIP-007", 対象: [""],
  注記: ["非会員の注文番号 00052603 は、非会員にした受注の注文番号（数字11桁）に読み替えた"],
  ファイル: (g) => 取込ファイル("m0526_guest_empty_date-007.csv", [H2, [g().注文番号, ""]]),
}));
caseTest("IT-M05-26-009", 不変の本体({
  seed: "S-M05-26-ERRORS-009", 対象: [""], エラー: true,
  ファイル: (g) => 取込ファイル("m0526_blank_order_empty_date-009.csv", [H2, [g().注文番号, "2026/09/14 09:00"], ["", ""]]),
}));
caseTest("IT-M05-26-010", 不変の本体({
  seed: "S-M05-26-ERRORS-010", 対象: [""], エラー: true,
  ファイル: (g) => 取込ファイル("m0526_missing_order_empty_date-010.csv", [H2, [g().注文番号, "2026/09/14 09:00"], ["99999999", ""]]),
}));
caseTest("IT-M05-26-014", 不変の本体({
  seed: "S-M05-26-ERRORS-014", 対象: ["A"], エラー: true,
  ファイル: (g) => 取込ファイル("m0526_column_count-014.csv", [H2, [g("A").注文番号, "2026/09/14 09:00"], [g("B").注文番号, "2026/09/14 10:00", "EXTRA"]]),
}));
caseTest("IT-M05-26-016", 不変の本体({
  seed: "S-M05-26-ERRORS-016", 対象: [""], エラー: true,
  注記: ["非会員受注 00052603 は、非会員にした受注の注文番号（数字11桁）に読み替えた"],
  ファイル: (g) => 取込ファイル("m0526_guest_with_date-016.csv", [H2, [g().注文番号, "2026/09/14 09:00"], [g("NM").注文番号, "2026/09/14 11:00"]]),
}));
caseTest("IT-M05-26-017", 不変の本体({
  seed: "S-M05-26-ERRORS-017", 対象: ["A"], エラー: true,
  ファイル: (g) => 取込ファイル("m0526_invalid_date-017.csv", [H2, [g("A").注文番号, "2026/09/14 09:00"], [g("B").注文番号, "not-a-date"]]),
}));

// ---------------------------------------------------------------- 画面の表示だけを確かめる取込

caseTest("IT-M05-26-008", async ({ page, step, expected, capture }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-SKIP-008");
  note("非会員の注文番号 00052603008 は、非会員にした受注の注文番号（数字11桁）に読み替えた");
  let r!: アップロード結果;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { r = await imp.アップロードする(取込ファイル("m0526_guest_empty_date-008.csv", [H2, [o.注文番号, ""]])); });
  await step(3, async () => { r = await imp.結果を読む(r.応答); await capture("再表示された画面"); });
  await expected(async () => {
    expect.soft(r.エラー, "エラーが表示されない").toEqual([]);
    expect.soft(r.取込画面, "出荷実績インポート登録画面が再表示される").toBe(true);
  });
});

caseTest("IT-M05-26-015", async ({ page, step, expected, capture }) => {
  const imp = await 管理者で入る(page);
  const get: 受注の引き = (k = "") => 受注の取得("S-M05-26-ERRORS-015", k);
  let r!: アップロード結果;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => {
    r = await imp.アップロードする(取込ファイル("m0526_column_count-015.csv", [H2, [get("A").注文番号, "2026/09/14 09:00"], [get("B").注文番号, "2026/09/14 10:00", "EXTRA"]]));
  });
  let 表示 = "";
  await step(3, async () => { 表示 = r.エラー.join(" / "); await capture("アップロード欄のエラー"); });
  await expected(async () => {
    expect.soft(/(^|\D)3\s*行目/.test(表示), `見出し行を1行目として数えた3行目がエラー対象として表示される（表示: ${表示}）`).toBe(true);
  });
});

caseTest("IT-M05-26-034", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-HEADER-034");
  let r!: アップロード結果;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { r = await imp.アップロードする(取込ファイル("m0526_minimal-034.csv", [H2, [o.注文番号, "2026/09/11 10:20"]])); });
  await expected(async () => {
    expect.soft(r.エラー, "エラーが表示されない").toEqual([]);
    expect.soft(r.完了.some((t) => t.includes("登録が完了しました")), `登録の完了が表示される（表示: ${r.完了.join(" / ")}）`).toBe(true);
    expect.soft(r.取込画面, "出荷実績インポート登録画面が表示される").toBe(true);
  });
});

caseTest("IT-M05-26-035", async ({ page, step, expected, capture }) => {
  const imp = await 管理者で入る(page);
  const get: 受注の引き = (k = "") => 受注の取得("S-M05-26-ERRORS-035", k);
  const a = get("A").注文番号, b = get("B").注文番号, g = get("NM").注文番号;
  note("非会員の注文番号 00052603035 は、非会員にした受注の注文番号（数字11桁）に読み替えた。ヘッダ不一致は注文番号の見出しが無いファイル、データ行なしは見出し行だけのファイルにした");
  const files: ファイル[] = [
    取込ファイル("m0526_missing_order_header-035.csv", [["出荷日", "送り状No."], ["2026/09/14 09:00", "52603501"]]),
    取込ファイル("m0526_header_only-035.csv", [H2]),
    取込ファイル("m0526_column_count-035.csv", [H2, [a, "2026/09/14 09:00"], [b, "2026/09/14 10:00", "EXTRA"]]),
    取込ファイル("m0526_blank_order_empty_date-035.csv", [H2, [a, "2026/09/14 09:00"], ["", ""]]),
    取込ファイル("m0526_guest_with_date-035.csv", [H2, [a, "2026/09/14 09:00"], [g, "2026/09/14 11:00"]]),
  ];
  const 結果: アップロード結果[] = [];
  for (const [i, f] of files.entries()) {
    await step(i + 1, async () => {
      if (i === 0) await imp.open();
      結果.push(await imp.アップロードする(f));
      await capture(`${f.名前} のアップロード後の画面`);
    });
  }
  await expected(async () => {
    for (const [i, f] of files.entries()) expect.soft(結果[i].取込画面, `${f.名前} のエラー後に出荷実績インポート登録画面が再表示される`).toBe(true);
  });
});

// ---------------------------------------------------------------- 送り状No.

caseTest("IT-M05-26-037", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-INVOICE-ALNUM-037");
  let r!: アップロード結果;
  let 後!: 状態;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { r = await imp.アップロードする(取込ファイル("m0526_invoice_alnum-037.csv", [H3, [o.注文番号, "2026/09/17 10:00", "AB-12x"]])); });
  await step(3, async () => { 後 = 状態を読む(o); });
  await expected(async () => {
    expect.soft(r.エラー, "取込がエラーにならない").toEqual([]);
    expect.soft(後.結果.送り状No, "送り状No.が変換されずにAB-12xのまま保存される").toBe("AB-12x");
  });
});

caseTest("IT-M05-26-040", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-INVOICE-NONINT-040");
  let r!: アップロード結果;
  let 後!: 状態;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { r = await imp.アップロードする(取込ファイル("m0526_invoice_nonint-040.csv", [H3, [o.注文番号, "2026/09/17 11:00", "M0526-040-X"]])); });
  await step(3, async () => { 後 = 状態を読む(o); });
  await expected(async () => {
    expect.soft(後.結果.送り状No, "送り状No.が、整数でない値M0526-040-Xのまま保存されない").not.toBe("M0526-040-X");
  });
  note(`アップロード後の画面の表示: 完了「${r.完了.join(" / ")}」・エラー「${r.エラー.join(" / ")}」。送り状No.の保存値: ${後.結果.送り状No ?? "（空）"}`);
});

// ---------------------------------------------------------------- 出荷日が登録済みの受注

const 既存ファイル = (testId: string, no: string) => 取込ファイル(`m0526_existing_shipping_date-${testId}.csv`, [H3, [no, "2026/09/13 10:00", "52604002"]]);

caseTest("IT-M05-26-022", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-EXISTING-022");
  const 前 = 状態を読む(o);
  note("取込前の状態は、開始時にDBで控えた");
  let 後!: 状態;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { await imp.アップロードする(既存ファイル("022", o.注文番号)); });
  await step(3, async () => { 後 = 状態を読む(o); });
  await expected(async () => {
    expect.soft(後.結果.ステータス, "受注情報のステータスが取込前のまま").toBe(前.結果.ステータス);
    expect.soft(後.結果.出荷日, "受注情報の出荷日が取込前のまま").toBe(前.結果.出荷日);
    expect.soft(後.結果.送り状No, "送り状No.が取込前のまま").toBe(前.結果.送り状No);
    expect.soft(後.配送.length, "配送情報の件数").toBe(2);
    expect.soft(後.配送.every((d) => d === "2026/09/13 10:00"), `2件すべての配送情報の出荷日が2026/09/13 10:00（実際: ${後.配送.join("・")}）`).toBe(true);
  });
});

caseTest("IT-M05-26-023", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-EXISTING-023");
  let 前!: 会員のポイント, 後!: 会員のポイント;
  await step(1, async () => { 前 = 会員のポイントを読む(o.会員ID!); });
  await step(2, async () => { await imp.open(); await imp.アップロードする(既存ファイル("023", o.注文番号)); });
  await step(3, async () => { 後 = 会員のポイントを読む(o.会員ID!); });
  await expected(async () => {
    expect.soft(後.残高, "会員ポイント残高が取込前から変わらない").toBe(前.残高);
    expect.soft(後.履歴件数, "ポイント履歴件数が取込前から変わらない").toBe(前.履歴件数);
  });
});

caseTest("IT-M05-26-024", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-EXISTING-024");
  let 前 = -1, 後 = -1;
  await step(1, async () => { 前 = 受注のメール送信履歴(o.受注ID).length; });
  await step(2, async () => { await imp.open(); await imp.アップロードする(既存ファイル("024", o.注文番号)); });
  await step(3, async () => { 後 = 受注のメール送信履歴(o.受注ID).length; });
  await expected(async () => {
    expect.soft(後, "メール送信履歴件数が取込前から変わらない").toBe(前);
  });
});

// ---------------------------------------------------------------- ポイント

caseTest("IT-M05-26-025", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-POINTS-025");
  let 前!: 会員のポイント, 後!: 会員のポイント;
  await step(1, async () => { 前 = 会員のポイントを読む(o.会員ID!); });
  await step(2, async () => { await imp.open(); await imp.アップロードする(取込ファイル("m0526_positive_points-025.csv", [H2, [o.注文番号, "2026/09/15 10:00"]])); });
  await step(3, async () => { 後 = 会員のポイントを読む(o.会員ID!); });
  await expected(async () => {
    expect.soft(後.残高, "会員ポイント残高に付与ポイント100が加算される").toBe(前.残高 + 100);
    expect.soft(後.履歴件数, "ポイント履歴が1件追加される").toBe(前.履歴件数 + 1);
    expect.soft(後.購入取得.map((h) => h.増減量), "購入によるポイント取得として100ポイントの履歴が1件").toEqual([100]);
  });
});

caseTest("IT-M05-26-026", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const a = 受注の取得("S-M05-26-POINTS-026", "A"), b = 受注の取得("S-M05-26-POINTS-026", "B");
  let 前: 会員のポイント[] = [], 後: 会員のポイント[] = [];
  await step(1, async () => { 前 = [a, b].map((x) => 会員のポイントを読む(x.会員ID!)); });
  await step(2, async () => {
    await imp.open();
    await imp.アップロードする(取込ファイル("m0526_no_points-026.csv", [H2, [a.注文番号, "2026/09/15 11:00"], [b.注文番号, "2026/09/15 12:00"]]));
  });
  await step(3, async () => { 後 = [a, b].map((x) => 会員のポイントを読む(x.会員ID!)); });
  await expected(async () => {
    for (const [i, n] of ["付与ポイントが0の注文番号", "付与ポイントが空の注文番号"].entries()) {
      expect.soft(後[i].残高, `${n}の会員ポイント残高が取込前から変わらない`).toBe(前[i].残高);
      expect.soft(後[i].履歴件数, `${n}のポイント履歴件数が取込前から変わらない`).toBe(前[i].履歴件数);
    }
  });
});

caseTest("IT-M05-26-051", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-CBZEROPT-051");
  let 前!: 会員のポイント, 後!: 会員のポイント, 状!: 状態;
  let メール: ReturnType<typeof 受注のメール送信履歴> = [];
  await step(1, async () => { 前 = 会員のポイントを読む(o.会員ID!); });
  await step(2, async () => { await imp.open(); await imp.アップロードする(取込ファイル("m0526_zero_points-051.csv", [H2, [o.注文番号, "2026/09/15 10:00"]])); });
  await step(3, async () => { 後 = 会員のポイントを読む(o.会員ID!); 状 = 状態を読む(o); メール = 受注のメール送信履歴(o.受注ID); });
  await expected(async () => {
    expect.soft(後.残高, "会員ポイント残高が500のまま").toBe(500);
    expect.soft(後.残高, "会員ポイント残高が取込前から変わらない").toBe(前.残高);
    expect.soft(後.履歴件数, "ポイント履歴が0件のまま").toBe(0);
    for (const c of 発送済みの確かめ(状, `注文番号 ${o.注文番号}`, "2026/09/15 10:00")) expect.soft(c.実際, c.名前).toEqual(c.期待);
    expect.soft(メール.length, "メール送信履歴に出荷完了メールが残る").toBeGreaterThanOrEqual(1);
    expect.soft(メール.every((m) => m.件名 !== "" && m.本文 !== ""), "メール送信履歴に件名と本文が残る").toBe(true);
  });
});

// ---------------------------------------------------------------- 複数行

caseTest("IT-M05-26-042", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const a = 受注の取得("S-M05-26-MULTIROW-042", "A"), b = 受注の取得("S-M05-26-MULTIROW-042", "B");
  let 後A!: 状態, 後B!: 状態;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => {
    await imp.アップロードする(取込ファイル("m0526_two_orders-042.csv", [H3, [a.注文番号, "2026/09/16 10:00", "52604201"], [b.注文番号, "2026/09/16 11:00", "52604202"]]));
  });
  await step(3, async () => { 後A = 状態を読む(a); 後B = 状態を読む(b); });
  await expected(async () => {
    for (const c of [...発送済みの確かめ(後A, `注文番号 ${a.注文番号}`, "2026/09/16 10:00", "52604201"), ...発送済みの確かめ(後B, `注文番号 ${b.注文番号}`, "2026/09/16 11:00", "52604202")]) expect.soft(c.実際, c.名前).toEqual(c.期待);
  });
});

caseTest("IT-M05-26-043", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const a = 受注の取得("S-M05-26-MULTIPOINT-043", "A"), b = 受注の取得("S-M05-26-MULTIPOINT-043", "B");
  let 後: 会員のポイント[] = [];
  await step(1, async () => { await imp.open(); });
  await step(2, async () => {
    await imp.アップロードする(取込ファイル("m0526_two_points-043.csv", [H3, [a.注文番号, "2026/09/17 10:00", "52604301"], [b.注文番号, "2026/09/17 11:00", "52604302"]]));
  });
  await step(3, async () => { 後 = [a, b].map((x) => 会員のポイントを読む(x.会員ID!)); });
  await expected(async () => {
    for (const [i, n] of ["会員A", "会員B"].entries()) {
      expect.soft(後[i].残高, `${n}の会員ポイント残高が600`).toBe(600);
      expect.soft(後[i].購入取得.map((h) => h.増減量), `${n}の購入によるポイント取得として100ポイントの履歴が1件`).toEqual([100]);
    }
  });
});

caseTest("IT-M05-26-044", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const a = 受注の取得("S-M05-26-MULTIPOINT-044", "A"), b = 受注の取得("S-M05-26-MULTIPOINT-044", "B");
  let 件数: number[] = [];
  await step(1, async () => { await imp.open(); });
  await step(2, async () => {
    await imp.アップロードする(取込ファイル("m0526_two_points-044.csv", [H3, [a.注文番号, "2026/09/17 10:00", "52604401"], [b.注文番号, "2026/09/17 11:00", "52604402"]]));
  });
  await step(3, async () => { 件数 = [a, b].map((x) => 会員のメール送信履歴(x.会員ID!).length); });
  await expected(async () => {
    expect.soft(件数[0], "会員Aの出荷完了メールの送信履歴が1件追加される").toBe(1);
    expect.soft(件数[1], "会員Bの出荷完了メールの送信履歴が1件追加される").toBe(1);
  });
});

caseTest("IT-M05-26-045", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const a = 受注の取得("S-M05-26-MIXED-045", "A"), b = 受注の取得("S-M05-26-MIXED-045", "B");
  const 前B = 状態を読む(b);
  note("取込前の状態は、開始時にDBで控えた");
  let 後A!: 状態, 後B!: 状態;
  await step(1, async () => { await imp.open(); });
  await step(2, async () => {
    await imp.アップロードする(取込ファイル("m0526_mixed_dates-045.csv", [H3, [a.注文番号, "2026/09/18 10:00", "52604501"], [b.注文番号, "", "52604502"]]));
  });
  await step(3, async () => { 後A = 状態を読む(a); 後B = 状態を読む(b); });
  await expected(async () => {
    for (const c of [...発送済みの確かめ(後A, `注文番号 ${a.注文番号}`, "2026/09/18 10:00", "52604501"), ...不変の確かめ(前B, 後B, `注文番号 ${b.注文番号}`)]) expect.soft(c.実際, c.名前).toEqual(c.期待);
  });
});

// ---------------------------------------------------------------- 同じファイルの再取込

const 再取込ファイル = (n: string, no: string, 送り状: string) => 取込ファイル(`m0526_reimport-${n}.csv`, [H3, [no, "2026/09/19 10:00", 送り状]]);

caseTest("IT-M05-26-046", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-REIMPORT-046");
  const f = 再取込ファイル("046", o.注文番号, "52604601");
  let 後!: 状態;
  await step(1, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(2, async () => {
    配送の出荷日を設定(o.受注ID, "2026-09-01 09:00:00");
    note("DBで配送情報の出荷日を2026/09/01 09:00に更新した（実行の印つきの受注の配送情報）");
  });
  await step(3, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(4, async () => { 後 = 状態を読む(o); });
  await expected(async () => {
    for (const c of 発送済みの確かめ(後, `注文番号 ${o.注文番号}`, "2026/09/19 10:00", "52604601")) expect.soft(c.実際, c.名前).toEqual(c.期待);
  });
});

caseTest("IT-M05-26-047", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-REIMPORT-047");
  const f = 再取込ファイル("047", o.注文番号, "52604701");
  let 途中!: 会員のポイント, 後!: 会員のポイント;
  await step(1, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(2, async () => {
    途中 = 会員のポイントを読む(o.会員ID!);
    expect.soft(途中.残高, "1回目のあとの会員ポイント残高が600").toBe(600);
    expect.soft(途中.履歴件数, "1回目のあとのポイント履歴が1件").toBe(1);
  });
  await step(3, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(4, async () => { 後 = 会員のポイントを読む(o.会員ID!); });
  await expected(async () => {
    expect.soft(後.残高, "2回目のアップロード後も会員ポイント残高が600").toBe(600);
    expect.soft(後.購入取得.length, "購入によるポイント取得の履歴が1件のまま").toBe(1);
  });
});

caseTest("IT-M05-26-048", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page);
  const o = 受注の取得("S-M05-26-REIMPORT-048");
  const f = 再取込ファイル("048", o.注文番号, "52604801");
  let 途中 = -1, 後 = -1;
  await step(1, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(2, async () => {
    途中 = 会員のメール送信履歴(o.会員ID!).length;
    expect.soft(途中, "1回目のあとのメール送信履歴が1件").toBe(1);
  });
  await step(3, async () => { await imp.open(); await imp.アップロードする(f); });
  await step(4, async () => { 後 = 会員のメール送信履歴(o.会員ID!).length; });
  await expected(async () => {
    expect.soft(後, "2回目のアップロード後も出荷完了メールの送信履歴が1件のまま").toBe(1);
  });
});

// ---------------------------------------------------------------- 取込の前後に別の画面で見える内容を確かめる

caseTest("IT-M05-26-041", async ({ page, browser, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const o = 受注の取得("S-M05-26-QF-ORDER-041");
  note(`ブラウザAの会員は、シード表の qf-m0526-001@example.test に代えて、写した会員（${会員のメール(o.会員ID!)}）を使った。ブラウザBの管理者は qf-m0526-admin`);
  const contextA = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextA);
    const pageA = await contextA.newPage();
    const 履歴 = new 購入履歴の出荷日Page(pageA);
    let 前 = "?", 後 = "?";
    let r!: アップロード結果;
    await step(1, async () => { await 履歴.ログインして購入履歴を開く({ メール: 会員のメール(o.会員ID!), パスワード: 会員のパスワード }); });
    await step(2, async () => { await 履歴.詳細を開く(o.注文番号); 前 = await 履歴.出荷日欄(); });
    const imp = await 管理者で入る(page, M0526_QF_ADMIN);
    await step(3, async () => { await imp.open(); });
    await step(4, async () => { r = await imp.アップロードする(取込ファイル("qf-m0526-001.csv", [H2, [o.注文番号, "2026/10/01 10:00"]])); });
    await step(5, async () => {
      expect.soft(r.完了.some((t) => t.includes("登録が完了しました。")), `「登録が完了しました。」が表示される（表示: ${r.完了.join(" / ")}）`).toBe(true);
    });
    await step(6, async () => { await 履歴.開き直す(); 後 = await 履歴.出荷日欄(); });
    await expected(async () => {
      expect.soft(前, "手順2では出荷日欄が空欄").toBe("");
      expect.soft(後, "手順6では出荷日欄に「2026年10月01日」と表示される").toBe("2026年10月01日");
    });
  } finally {
    await contextA.close();
  }
});

caseTest("IT-M05-26-049", async ({ page, step, expected }) => {
  const imp = await 管理者で入る(page, M0526_RE_ADMIN);
  const o = 受注の取得("S-M05-26-RE-POINTS-049");
  const pt = new 会員のポイント履歴Page(page);
  let 前: { 注文番号: string; 増減量: string }[] = [], 後: { 注文番号: string; 増減量: string }[] = [];
  await step(1, async () => { await pt.検索して編集画面を開く(o.会員ID!); });
  await step(2, async () => { 前 = await pt.ポイント確認を押す(); });
  await step(3, async () => { await imp.open(); });
  await step(4, async () => { await imp.アップロードする(取込ファイル("m0526re_points-001.csv", [H3, [o.注文番号, "2026/09/21 10:00", "52609001"]])); });
  await step(5, async () => { await pt.検索して編集画面を開く(o.会員ID!); 後 = await pt.ポイント確認を押す(); });
  await expected(async () => {
    expect.soft(前.length, "手順2のポイント履歴確認画面には行が表示されない").toBe(0);
    expect.soft(後.map((h) => h.増減量), "手順5のポイント履歴確認画面には増減量100の行が1件表示される").toEqual(["100"]);
  });
});

caseTest("IT-M05-26-050", async ({ page, browser, step, expected }) => {
  const imp = await 管理者で入る(page, M0526_RE_ADMIN);
  const o = 受注の取得("S-M05-26-RE-EDIT-050");
  const 本店 = await 本店の店名(browser);
  const edit = new OrderEditPage(page);
  let 前 = "?", 後 = "?";
  await step(1, async () => { await edit.openByOrderNo(o.注文番号, 本店); });
  await step(2, async () => { 前 = await 受注編集の出荷日(page); });
  await step(3, async () => { await imp.open(); });
  await step(4, async () => { await imp.アップロードする(取込ファイル("m0526re_edit-002.csv", [H3, [o.注文番号, "2026/09/22 10:00", "52609002"]])); });
  await step(5, async () => { await edit.openByOrderNo(o.注文番号, 本店); 後 = await 受注編集の出荷日(page); });
  await expected(async () => {
    expect.soft(前, "手順2の受注情報編集画面では出荷日が空").toBe("");
    expect.soft(後.startsWith("2026/09/22 10:00"), `手順5の受注情報編集画面では出荷日が「2026/09/22 10:00」と表示される（表示: ${後}）`).toBe(true);
  });
  note("受注情報編集画面の出荷日は秒つきで出ることがあるので、日時の前方一致で比べた");
});
