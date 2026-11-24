/**
 * M08-05 ポイント付与（014〜016：ポイントを付与して保存し、DB の履歴・残高を確かめる）。正本: cases/M08-05_test_cases.tsv
 * 11/23 の見直しで流せない一覧から外したケース。判定済みの spec/m08/m08-05.spec.ts の指紋を守るため、別のファイルに書いた（2026-11-24）。
 * 画面: ポイント付与（キャンペーン、特別対応）画面・ポイント付与（余剰入金へのご返金、注文金額変更によるご送金）画面（pages/admin/m08_05_07.ts）。
 * シード: seeds/m08-05-b.ts（会員・受注・残高）・seeds/m08-05.ts（試験管理者）。
 */
import { test } from "@playwright/test";
import { CaseBody, expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ポイント履歴, ポイント残高, ポイント履歴の行 } from "../../db/m08_05_07";
import { PointPage } from "../../pages/admin/m08_05_07";
import { M0805_ADMIN } from "../../seeds/m08-05";
import "../../seeds/m08-05-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type 付与の値 = { 注文番号つき: boolean; 増減量: number; 備考: string; 発行日: string };

/** 014・015: 注文番号つきで付与し、DB のポイント履歴が1件だけ足され、その中身が入れた値であること */
function 履歴が足される(n: string, 画面: "granted" | "purchase", v: 付与の値): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M0805_ADMIN);
    const p = new PointPage(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    const 注文番号 = v.注文番号つき ? notes.get(`〔注文番号-M0805-${n}〕`) : "";
    const 受注ID = v.注文番号つき ? notes.get(`〔受注ID-M0805-${n}〕`) : "";
    const 前 = new Set(ポイント履歴(会員ID).map((h) => h.履歴ID));
    let 足された: ポイント履歴の行[] = [];
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => {
      await p.付与の欄に入れる({ 注文番号, 増減量: v.増減量, 備考: v.備考, 発行日: v.発行日 }, "付与のフォーム");
      note(`入れた値: 注文番号 ${注文番号 || "（空）"}・ポイント増減量 ${v.増減量}・ポイント発行日 ${v.発行日}・備考 ${v.備考}`);
    });
    await step(3, async () => { await p.付与を保存する("ポイント付与の保存"); });
    await step(4, async () => {
      足された = ポイント履歴(会員ID).filter((h) => !前.has(h.履歴ID));
      note(`DB のポイント履歴で足された行: ${JSON.stringify(足された)}（受注は注文番号ではなく受注IDで結び付く。注文番号 ${注文番号} の受注ID は ${受注ID}）`);
    });
    await expected(async () => {
      expect(足された.length, "足されたポイント履歴の件数").toBe(1);
      const h = 足された[0];
      expect.soft(h?.受注ID, `注文番号 ${注文番号} の受注（受注ID ${受注ID}）`).toBe(受注ID);
      expect.soft(h?.増減量, "増減量").toBe(v.増減量);
      expect.soft(h?.発行日, "発行日").toBe(v.発行日.replace(/-/g, "/"));
      expect.soft(h?.備考, "備考").toBe(v.備考);
    });
  };
}
caseTest("IT-M08-05-014", 履歴が足される("014", "granted", { 注文番号つき: true, 増減量: 100, 備考: "特別対応", 発行日: "2026-09-03" }));
caseTest("IT-M08-05-015", 履歴が足される("015", "purchase", { 注文番号つき: true, 増減量: 100, 備考: "注文金額変更によるご返金", 発行日: "2026-09-03" }));

/** 016: 注文番号を空で付与し、DB の選手情報のポイント残高が 1000 → 1100 になること */
caseTest("IT-M08-05-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0805_ADMIN);
  const p = new PointPage(page);
  const 会員ID = notes.get("〔会員ID-M0805-016〕");
  const 前の残高 = ポイント残高(会員ID);
  let 後の残高: number | null = null;
  note(`付与の前の DB のポイント残高: ${前の残高}`);
  await step(1, async () => { expect((await p.開く(会員ID, "granted"))?.status(), "画面の応答").toBe(200); });
  await step(2, async () => {
    await p.付与の欄に入れる({ 注文番号: "", 増減量: 100, 備考: "キャンペーン", 発行日: "2026-09-03" }, "付与のフォーム");
    note("入れた値: 注文番号（空）・ポイント増減量 100・ポイント発行日 2026-09-03・備考 キャンペーン");
  });
  await step(3, async () => { await p.付与を保存する("ポイント付与の保存"); });
  await step(4, async () => { 後の残高 = ポイント残高(会員ID); note(`DB の選手情報のポイント残高: ${後の残高}`); });
  await expected(async () => {
    expect.soft(前の残高, "更新前のポイント残高").toBe(1000);
    expect(後の残高, "更新後のポイント残高").toBe(1100);
  });
});
