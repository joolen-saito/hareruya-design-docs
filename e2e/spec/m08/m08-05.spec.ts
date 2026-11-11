/**
 * M08-05 ポイント付与。流せる見込みのケース（実施不可でないもの＋仕分け直し recheck2）。正本: cases/M08-05_test_cases.tsv
 * 画面: ポイント付与画面・ポイント付与（キャンペーン、特別対応）画面・ポイント付与（余剰入金へのご返金、注文金額変更によるご送金）画面（pages/admin/m08_05_07.ts）。
 * シード: seeds/m08-05.ts。記録: review/M08-05_progress_2026-11-11_dev.md
 */
import { Page, test } from "@playwright/test";
import { CaseBody, expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { PointPage, ポイントの画面 } from "../../pages/admin/m08_05_07";
import { M0805_ADMIN } from "../../seeds/m08-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
const 会員編集 = (id: string) => new RegExp(`/customer/${id}/edit/?$`);

async function signIn(page: Page): Promise<PointPage> { await loginAdmin(page, M0805_ADMIN); return new PointPage(page); }

// ---- 画面の移動 ----

function 種類を選ぶ(n: string, リンク: "キャンペーン" | "返金", 先: RegExp): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    let status = 0;
    await step(1, async () => { expect((await p.開く(会員ID, "select"))?.status(), "ポイント付与画面の応答").toBe(200); });
    await step(2, async () => { status = (await p.押して移る(リンク === "キャンペーン" ? p.キャンペーンのリンク : p.返金のリンク))?.status() ?? 0; note(`移った先: ${path(page)}（応答 ${status}）`); });
    await expected(async () => {
      expect.soft(status, "移った先の応答").toBe(200);
      expect.soft(path(page), `ポイント付与（${リンク === "キャンペーン" ? "キャンペーン、特別対応" : "余剰入金へのご返金、注文金額変更によるご送金"}）画面のアドレス`).toMatch(先);
      expect.soft(path(page), "対象の会員のアドレス").toContain(`/customer/point/${会員ID}/`);
    });
  };
}
caseTest("IT-M08-05-001", 種類を選ぶ("001", "キャンペーン", /\/customer\/point\/\d+\/granted\/?$/));
caseTest("IT-M08-05-002", 種類を選ぶ("002", "返金", /\/customer\/point\/\d+\/purchase\/?$/));

function 戻る(n: string, 画面: ポイントの画面): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => { await p.押して移る(p.会員編集画面に戻る); note(`移った先: ${path(page)}`); });
    await expected(async () => { expect(path(page), `会員ID ${会員ID} の会員編集画面のアドレス`).toMatch(会員編集(会員ID)); });
  };
}
caseTest("IT-M08-05-003", 戻る("003", "select"));
caseTest("IT-M08-05-004", 戻る("004", "granted"));
caseTest("IT-M08-05-005", 戻る("005", "purchase"));

// ---- ポイント追加フォームの開閉・備考 ----

function 開閉(n: string, 画面: ポイントの画面): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    let 初め = false, 一回目 = false, 二回目 = true;
    await step(1, async () => {
      expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200);
      初め = await p.フォームが見えるか();
      note(`開いた直後のポイント追加フォーム: ${初め ? "表示" : "非表示"}`);
    });
    await step(2, async () => { await p.開閉を押す(); 一回目 = await p.フォームが見えるか(); note(`1回目の押下のあと: ${一回目 ? "表示" : "非表示"}`); });
    await step(3, async () => { await p.開閉を押す(); 二回目 = await p.フォームが見えるか(); note(`2回目の押下のあと: ${二回目 ? "表示" : "非表示"}`); });
    await expected(async () => {
      expect.soft(一回目, "1回目の押下でポイント追加フォームが表示される").toBe(true);
      expect.soft(二回目, "2回目の押下で非表示になる").toBe(false);
    });
  };
}
caseTest("IT-M08-05-006", 開閉("006", "granted"));
caseTest("IT-M08-05-007", 開閉("007", "purchase"));

function 備考(n: string, 画面: ポイントの画面, 初期: string, 選択肢: string[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    let 値 = "", 選べる: string[] = [];
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => { if (!(await p.フォームを見せる())) note("ポイント追加フォームは開いた時点で表示されていた（押さずに次へ）"); });
    await step(3, async () => { 値 = await p.備考の選ばれている値(); 選べる = await p.備考の選択肢(); note(`備考の初期値: ${値} / 選択肢: ${選べる.join("、")}`); });
    await expected(async () => {
      expect.soft(値, "備考の初期値").toBe(初期);
      expect.soft(選べる, "備考の選択肢").toEqual(選択肢);
    });
  };
}
caseTest("IT-M08-05-008", 備考("008", "granted", "キャンペーン", ["キャンペーン", "特別対応"]));
caseTest("IT-M08-05-009", 備考("009", "purchase", "余剰入金へのご返金", ["余剰入金へのご返金", "注文金額変更によるご返金"]));

// ---- 履歴の一覧 ----

caseTest("IT-M08-05-010", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const 会員ID = notes.get("〔会員ID-M0805-010〕");
  const ids = ["〔履歴ID-M0805-010C〕", "〔履歴ID-M0805-010B〕", "〔履歴ID-M0805-010A〕"].map((l) => notes.get(l));
  let キャンペーン: Awaited<ReturnType<PointPage["履歴"]>> = [], 返金: typeof キャンペーン = [];
  await step(1, async () => {
    expect((await p.開く(会員ID, "granted"))?.status(), "画面の応答").toBe(200);
    キャンペーン = await p.履歴(); note(`キャンペーン、特別対応の画面の履歴ID: ${キャンペーン.map((r) => r.ID).join("、")}`);
  });
  await step(2, async () => {
    expect((await p.開く(会員ID, "purchase"))?.status(), "画面の応答").toBe(200);
    返金 = await p.履歴(); note(`返金の画面の履歴ID: ${返金.map((r) => r.ID).join("、")}`);
  });
  await expected(async () => {
    expect.soft(キャンペーン.map((r) => r.ID), "キャンペーン、特別対応の画面の履歴IDの順（C・B・A）").toEqual(ids);
    expect.soft(返金.map((r) => r.ID), "返金の画面の履歴IDの順（C・B・A）").toEqual(ids);
    expect.soft(返金, "両画面で同じ内容が表示される").toEqual(キャンペーン);
    expect.soft(キャンペーン.map((r) => r.備考), "キャンペーン・特別対応・返金の履歴がすべて含まれる").toEqual(["特別対応", "余剰入金へのご返金", "キャンペーン"]);
  });
});

// ---- 存在しない会員・選手情報なし ----

function 無い会員(n: string, 画面: ポイントの画面): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    let status = 0;
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => { status = (await p.会員IDを置き換えて開く("99999999"))?.status() ?? 0; note(`会員ID 99999999 のアドレス ${path(page)} の応答: ${status}`); });
    await expected(async () => { expect(status, "ページが見つからない扱い（404）").toBe(404); });
  };
}
caseTest("IT-M08-05-011", 無い会員("011", "select"));
caseTest("IT-M08-05-012", 無い会員("012", "granted"));

caseTest("IT-M08-05-013", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const 会員ID = notes.get("〔会員ID-M0805-013〕");
  let status = 0;
  await step(1, async () => { expect((await p.開く(会員ID, "select"))?.status(), "ポイント付与画面の応答").toBe(200); });
  await step(2, async () => { status = (await p.押して移る(p.キャンペーンのリンク))?.status() ?? 0; note(`移った先: ${path(page)}（応答 ${status}）`); });
  await expected(async () => { expect(status, "ページが見つからない扱い（404）").toBe(404); });
});

// ---- ポイント発行日のカレンダー ----

function 発行日(n: string, 画面: ポイントの画面): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    let 値 = "";
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => { if (!(await p.フォームを見せる())) note("ポイント追加フォームは開いた時点で表示されていた（押さずに次へ）"); });
    await step(3, async () => {
      const type = await p.発行日.getAttribute("type");
      // ポイント発行日はブラウザ標準の日付入力（type=date）で、選ぶ部品はブラウザのもの。欄へ日付そのものを入れる操作で代える
      await p.発行日.fill("2026-09-03");
      値 = await p.発行日.inputValue();
      note(`ポイント発行日の欄（type=${type ?? "なし"}）のカレンダーでの選択は、欄へ日付（2026年9月3日）を直接入れる操作で代えた（条件付き）。入力値: ${値}`);
    });
    await expected(async () => { expect(値, "ポイント発行日").toBe("2026-09-03"); });
  };
}
caseTest("IT-M08-05-041", 発行日("041", "granted"));
caseTest("IT-M08-05-042", 発行日("042", "purchase"));

// ---- 表示値 ----

type 表示値 = { 残高: number; 増減量: string; 備考: string; 発行日: string; 設定日: string; 有効期限: string };
function 表示値(n: string, 画面: ポイントの画面, v: 表示値): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const p = await signIn(page);
    const 会員ID = notes.get(`〔会員ID-M0805-${n}〕`);
    const 履歴ID = notes.get(`〔履歴ID-M0805-${n}〕`);
    const 注文番号 = notes.get(`〔注文番号-M0805-${n}〕`);
    let 残高: number | null = null, 見出し: string[] = [], 行: Awaited<ReturnType<PointPage["履歴"]>>[number] | undefined;
    await step(1, async () => { expect((await p.開く(会員ID, 画面))?.status(), "画面の応答").toBe(200); });
    await step(2, async () => {
      残高 = await p.ポイント残高(); 見出し = await p.履歴の見出し(); 行 = (await p.履歴())[0];
      note(`ポイント残高: ${残高} / 見出し: ${見出し.join("・")} / 1行目: ${JSON.stringify(行)}`);
    });
    await expected(async () => {
      expect.soft(残高, "ポイント残高").toBe(v.残高);
      expect.soft(行?.ID, "1行目のID").toBe(履歴ID);
      expect.soft(行?.会員名, "1行目の会員名").toBe("結合 花子");
      expect.soft(行?.注文番号, "1行目の注文番号").toBe(注文番号);
      expect.soft(行?.増減量, "1行目の増減量").toBe(v.増減量);
      expect.soft(行?.備考, "1行目の備考").toBe(v.備考);
      expect.soft(行?.発行日, "1行目の発行日").toBe(v.発行日);
      expect.soft(行?.設定日, "1行目の設定日").toBe(v.設定日);
      expect.soft(行?.有効期限, "1行目の有効期限（発行日の183日後）").toBe(v.有効期限);
    });
  };
}
caseTest("IT-M08-05-044", 表示値("044", "granted", { 残高: 730, 増減量: "150", 備考: "特別対応", 発行日: "2026/09/01", 設定日: "2026/09/05", 有効期限: "2027/03/03" }));
caseTest("IT-M08-05-045", 表示値("045", "purchase", { 残高: 940, 増減量: "-80", 備考: "注文金額変更によるご返金", 発行日: "2026/08/10", 設定日: "2026/08/12", 有効期限: "2027/02/09" }));
