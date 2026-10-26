/**
 * M04-25 在庫移動指示詳細。正本: cases/M04-25_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる 006〜010・014〜017・020・026・029〜034（17件）。
 * 001〜005・018・019 は、使用シードがDBフィクスチャ・DBへの直接設定（ID指定の在庫移動指示など）なので実装しない
 * （記録 e2e/review/M04-25_progress_2026-10-21.md）。
 *
 * 手順の読み方:
 * - 「在庫移動指示ID 〔…〕の在庫移動指示詳細画面を開く」は、詳細画面のアドレス（/product/stock/move-instruction/<ID>）を開く。
 *   正本は開き方を書いていない。詳細画面は確認・完了の画面ではなく、IDで開ける画面なので、アドレスで開く（検索の操作を足さない）。
 * - 項目は設計書の識別ID（design.txt L0068〜L0108）で画面の欄に当てる。画面の欄の名前が設計書と違うもの
 *   （1-4 在庫移動数＝「在庫移動」、1-11 総移動原価の合計＝「移動原価合計」）は注記に残す。設計書の項目に当たる欄が画面に無いもの
 *   （1-10 総販売価格の合計）は「欄が無い」として落とす。
 * - 金額の表示「¥12,000」は 12000、件数・点数の「1件」「1枚」「1点」は 1 として読む。閾値の項目名の「¥10,000以上の商品の合計」は、
 *   金額の書き方（¥・桁区切り）だけをそろえて「10000円以上の商品の合計」と比べる（閾値の値と「以上/未満の商品の合計」の文は変えない）。
 * - シードは、正本の外で承認する管理者を補い、在庫移動指示検索で店舗も選んでいる（seeds/m04-25.ts の冒頭）。どのケースもその上に成り立つ。
 */
import { Page, test } from "@playwright/test";
import { 紐づく在庫移動, 発送状況, 在庫移動指示, 送り状Noと備考, 送り状Noの形, 備考の形 } from "../../db/m04_25_move_instruction";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { Account, loginAdmin } from "../../lib/session";
import { pathOf, topMessages } from "../../pages/admin/m04_24_move_instruction";
import { readMoveIdOnScreen } from "../../pages/admin/m04_24_stock_move";
import { DetailMoveRow, InstructionDetailPage } from "../../pages/admin/m04_25_move_chain";
import { M0425_030_A, M0425_ADMIN } from "../../seeds/m04-25";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 「¥12,000」「1件」「1枚」「1点」を数にする。読めなければ NaN */
const num = (s: string | undefined) => (s === undefined ? NaN : Number(s.replace(/[¥,円件枚点\s]/g, "")));
/** 閾値の項目名の金額の書き方をそろえる（「¥10,000以上の商品の合計」→「10000円以上の商品の合計」） */
const thresholdLabel = (s: string) => s.replace(/¥([\d,]+)/g, (_, n: string) => `${n.replace(/,/g, "")}円`).replace(/(\d),(\d)/g, "$1$2");

async function openDetail(page: Page, account: Account, id: string): Promise<InstructionDetailPage> {
  page.setDefaultTimeout(180_000); page.setDefaultNavigationTimeout(180_000); await loginAdmin(page, account);
  const detail = new InstructionDetailPage(page);
  await detail.open(id);
  return detail;
}

/** 画面上部のメッセージを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  const fieldErrors = (await page.locator(".invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}${fieldErrors.length ? `・欄のエラー: ${fieldErrors.join(" / ")}` : ""}`);
}

// ---- 画面の表示 ----

caseTest("IT-M04-25-006", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-006〕");
  const moveA = notes.get("〔在庫移動ID-M0425-006A〕");
  let detail: InstructionDetailPage;
  let shown = "";
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => {
    const rows = await detail.moveRows();
    note(`在庫移動情報の行（上から）: ${rows.map((r) => r.在庫移動ID).join("・")}`);
    expect(rows[0]?.在庫移動ID, "在庫移動情報の1行目は〔在庫移動ID-M0425-006A〕（事前準備）").toBe(moveA);
    const link = detail.在庫移動の表.first().locator("td").first().getByRole("link", { name: moveA, exact: true });
    await expect(link, "1行目の在庫移動振替IDのリンク").toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    note(`移った画面: ${pathOf(page.url())}・見出し「${(await page.locator("h2.c-pageTitle__title").innerText()).trim()}」・副題「${(await page.locator(".c-pageTitle__subTitle").innerText()).trim()}」`);
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "在庫移動・振替登録の画面（在庫移動の番号つき）のアドレス").toMatch(new RegExp(`/product/stock/move/(?:[a-z_]+/)?${moveA}$`));
    await expect.soft(page.locator("h2.c-pageTitle__title"), "画面の見出し").toHaveText(/^\s*在庫移動・振替登録\s*$/);
    shown = await readMoveIdOnScreen(page).catch((e: Error) => `読めない（${e.message.split("\n")[0]}）`);
    expect.soft(shown, "画面に表示された在庫移動・振替ID").toBe(moveA);
  });
});

caseTest("IT-M04-25-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-007〕");
  let detail: InstructionDetailPage;
  let enabled: boolean | null = null;
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => {
    await expect(detail.送り状Noの欄, "送り状No.（変更しない）").toHaveValue("TRACK-BEFORE-007");
    await expect(detail.備考の欄, "備考（変更しない）").toHaveValue("変更前備考");
    enabled = await detail.登録ボタン.isEnabled();
    note(`登録ボタン: ${enabled ? "押せる" : "押せない"}`);
  });
  await expected(async () => {
    expect(enabled, "登録ボタンが非活性").toBe(false);
  });
});

/** 008・009: 1つの欄を変えると「登録」が押せるようになること */
function activatesOnChange(label: string, field: "送り状No" | "備考", value: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(label);
    let detail: InstructionDetailPage;
    let before: boolean | null = null;
    await step(1, async () => {
      detail = await openDetail(page, M0425_ADMIN, id);
      before = await detail.登録ボタン.isEnabled();
      note(`変更する前の登録ボタン: ${before ? "押せる" : "押せない"}`);
    });
    await step(2, async () => {
      if (field === "送り状No") await detail.fillTrackingNo(value);
      else await detail.fillMemo(value);
    });
    await step(3, async () => { note(`変更したあとの登録ボタン: ${(await detail.登録ボタン.isEnabled()) ? "押せる" : "押せない"}`); });
    await expected(async () => {
      expect.soft(before, "変更する前は押せない（活性化した、と言えるための前提）").toBe(false);
      await expect.soft(detail.登録ボタン, "登録ボタンが活性").toBeEnabled();
    });
  };
}

caseTest("IT-M04-25-008", activatesOnChange("〔在庫移動指示ID-M0425-008〕", "送り状No", "TRACK-ACTIVE"));
caseTest("IT-M04-25-009", activatesOnChange("〔在庫移動指示ID-M0425-009〕", "備考", "活性確認備考"));

caseTest("IT-M04-25-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-017〕");
  let detail: InstructionDetailPage;
  let state = { 無効: false, 読み取り専用: false, 編集できる: true };
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => {
    await expect(detail.備考の欄, "備考入力欄").toBeVisible();
    state = await detail.memoEditable();
    note(`備考入力欄: 値「${await detail.備考の欄.inputValue()}」・${state.無効 ? "無効" : "有効"}・${state.読み取り専用 ? "読み取り専用" : "読み取り専用でない"}`);
  });
  await expected(async () => {
    expect(state.編集できる, "備考入力欄が編集できない").toBe(false);
  });
});

caseTest("IT-M04-25-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-020〕");
  let detail: InstructionDetailPage;
  await step(1, async () => {
    detail = await openDetail(page, M0425_ADMIN, id);
    await expect(detail.送り状Noの欄, "送状No.（事前準備: TRACK-42502007）").toHaveValue("TRACK-42502007");
  });
  await step(2, async () => {
    await expect(detail.削除ボタン, "削除ボタン").toHaveCount(1);
    note(`削除ボタン: ${(await detail.削除ボタン.isEnabled()) ? "押せる" : "押せない"}`);
  });
  await expected(async () => {
    await expect(detail.削除ボタン, "削除ボタンが非活性").toBeDisabled();
  });
});

caseTest("IT-M04-25-031", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-031〕");
  let detail: InstructionDetailPage;
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => { note(`送状No.のフォーム: ${(await detail.送り状Noの欄.count()) ? `値「${await detail.送り状Noの欄.inputValue()}」` : "無い"}`); });
  await expected(async () => {
    await expect.soft(detail.送り状Noの欄, "送状No.のフォームが表示される").toBeVisible();
    await expect.soft(detail.送り状Noの欄, "送状No.のフォームの値が空").toHaveValue("");
  });
});

// ---- 金額の表示 ----

type InfoRead = { values: Record<string, string>; rows: DetailMoveRow[]; headers: string[] };

async function readInfo(detail: InstructionDetailPage): Promise<InfoRead> {
  const values = await detail.infoValues();
  const rows = await detail.moveRows();
  const headers = await detail.moveHeaders();
  note(`在庫移動指示情報: ${Object.entries(values).map(([k, v]) => `${k}=${v}`).join("・")}`);
  note(`在庫移動情報の見出し: ${headers.join("・")}`);
  note(`在庫移動情報の行: ${rows.map((r) => JSON.stringify(r)).join(" / ")}`);
  return { values, rows, headers };
}

/** 在庫移動指示情報の欄（ラベル → 値）から、閾値の「以上」「未満」の欄を探す */
function thresholdItems(values: Record<string, string>, kind: "以上" | "未満"): [string, string][] {
  return Object.entries(values).filter(([k]) => k.endsWith(`${kind}の商品の合計`));
}

caseTest("IT-M04-25-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-029〕");
  let detail: InstructionDetailPage;
  let r: InfoRead = { values: {}, rows: [], headers: [] };
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => { r = await readInfo(detail); });
  await step(3, async () => { note(`在庫移動情報の行数: ${r.rows.length}`); });
  await expected(async () => {
    const v = r.values;
    note("設計書の項目と画面の欄の当て方: 1-4 在庫移動数＝「在庫移動」、1-5 移動点数＝「移動点数」、1-11 総移動原価の合計＝「移動原価合計」、1-12・1-13＝「¥10,000以上（未満）の商品の合計」。在庫移動情報の 2-7・2-8 は見出し「高額商品合計」「通常商品合計」の列");
    expect.soft(num(v["在庫移動"]), "在庫移動数").toBe(1);
    expect.soft(num(v["移動点数"]), "移動点数").toBe(1);
    expect.soft(v["総販売価格の合計"], "総販売価格の合計の欄（設計書 1-10。画面にあるのは「基準価格合計」）").not.toBeUndefined();
    expect.soft(num(v["総販売価格の合計"]), "総販売価格の合計").toBe(15000);
    expect.soft(num(v["移動原価合計"]), "総移動原価の合計").toBe(9000);
    const over = thresholdItems(v, "以上");
    const under = thresholdItems(v, "未満");
    expect.soft(over.map(([k]) => thresholdLabel(k)), "閾値の「以上」の欄").toEqual(["10000円以上の商品の合計"]);
    expect.soft(over.map(([, x]) => num(x)), "「10000円以上の商品の合計」").toEqual([12000]);
    expect.soft(under.map(([k]) => thresholdLabel(k)), "閾値の「未満」の欄").toEqual(["10000円未満の商品の合計"]);
    expect.soft(under.map(([, x]) => num(x)), "「10000円未満の商品の合計」").toEqual([0]);
    expect(r.rows, "在庫移動情報は1行").toHaveLength(1);
    const row = r.rows[0];
    expect.soft(num(row.基準価格合計), "在庫移動情報の基準価格合計").toBe(12000);
    expect.soft(num(row.移動原価合計), "在庫移動情報の移動原価合計").toBe(9000);
    expect.soft(num(row.高額商品合計), "在庫移動情報の「10000円以上の商品の合計」（列「高額商品合計」）").toBe(12000);
    expect.soft(num(row.通常商品合計), "在庫移動情報の「10000円未満の商品の合計」（列「通常商品合計」）").toBe(0);
    expect.soft(num(row.移動点数), "在庫移動情報の移動点数").toBe(1);
  });
});

caseTest("IT-M04-25-030", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-030〕");
  let detail: InstructionDetailPage;
  let r: InfoRead = { values: {}, rows: [], headers: [] };
  await step(1, async () => { detail = await openDetail(page, M0425_030_A.account, id); });
  await step(2, async () => { r = await readInfo(detail); });
  await step(3, async () => { note(`在庫移動情報の行数: ${r.rows.length}`); });
  await expected(async () => {
    const v = r.values;
    const labels = Object.keys(v).map(thresholdLabel);
    expect.soft(v["総販売価格の合計"], "総販売価格の合計の欄（設計書 1-10。画面にあるのは「基準価格合計」）").not.toBeUndefined();
    expect.soft(num(v["総販売価格の合計"]), "総販売価格の合計").toBe(28000);
    expect.soft(num(v["移動原価合計"]), "総移動原価の合計（画面の「移動原価合計」）").toBe(16000);
    expect.soft(labels, "在庫移動指示情報の項目名「10000円以上の商品の合計」").toContain("10000円以上の商品の合計");
    expect.soft(labels, "在庫移動指示情報の項目名「10000円未満の商品の合計」").toContain("10000円未満の商品の合計");
    expect.soft(num(Object.entries(v).find(([k]) => thresholdLabel(k) === "10000円以上の商品の合計")?.[1]), "「10000円以上の商品の合計」").toBe(12000);
    expect.soft(num(Object.entries(v).find(([k]) => thresholdLabel(k) === "10000円未満の商品の合計")?.[1]), "「10000円未満の商品の合計」").toBe(10000);
    const all = [...labels, ...r.headers.map(thresholdLabel)];
    expect.soft(all.filter((l) => /^5000円(以上|未満)の商品の合計$/.test(l)), "「5000円以上の商品の合計」「5000円未満の商品の合計」の項目名は表示されない").toEqual([]);
    expect(r.rows, "在庫移動情報は1行").toHaveLength(1);
    const headers = r.headers.map(thresholdLabel);
    expect.soft(headers, "在庫移動情報の項目名「10000円以上の商品の合計」").toContain("10000円以上の商品の合計");
    expect.soft(headers, "在庫移動情報の項目名「10000円未満の商品の合計」").toContain("10000円未満の商品の合計");
    expect.soft(num(r.rows[0].高額商品合計), "在庫移動情報の1行の高額の合計の値").toBe(12000);
    expect.soft(num(r.rows[0].通常商品合計), "在庫移動情報の1行の高額でない合計の値").toBe(10000);
  });
});

// ---- 登録（DBで確かめる） ----

/** 送り状No.・備考を変えて「登録」を押し、応答と画面のメッセージを注記に残す */
async function register(page: Page, detail: InstructionDetailPage, id: string): Promise<void> {
  const status = await detail.pressRegister(id);
  note(`登録の応答: ${status}・移った画面: ${pathOf(page.url())}`);
  await noteMessages(page, "登録のあと");
}

caseTest("IT-M04-25-010", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-010〕");
  let detail: InstructionDetailPage;
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => {
    await detail.fillTrackingNo("追跡ＡＢＣ-123");
    await detail.fillMemo("備考ＡＢＣ-123");
  });
  await step(3, async () => { await register(page, detail, id); });
  let saved: ReturnType<typeof 送り状Noと備考> = null;
  await step(4, async () => { void db.available; saved = 送り状Noと備考(id); note(`DBの値: ${JSON.stringify(saved)}`); });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がある`).not.toBeNull();
    expect.soft(saved!.送り状No, "送り状No.").toBe("追跡ＡＢＣ-123");
    expect.soft(saved!.備考, "備考").toBe("備考ＡＢＣ-123");
  });
});

caseTest("IT-M04-25-014", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-014〕");
  const moveId = notes.get("〔在庫移動ID-M0425-014〕");
  let detail: InstructionDetailPage;
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => { await detail.fillTrackingNo(" 　"); note("送り状No.を「半角空白1つ＋全角空白1つ」に変えた"); });
  await step(3, async () => { await register(page, detail, id); });
  let saved: ReturnType<typeof 在庫移動指示> = null;
  let moves: ReturnType<typeof 紐づく在庫移動> = [];
  await step(4, async () => {
    void db.available;
    saved = 在庫移動指示(id);
    moves = 紐づく在庫移動(id);
    note(`DBの送り状No.: ${JSON.stringify(saved?.送り状No ?? null)}・紐づく在庫移動: ${moves.map((m) => `${m.在庫移動ID}=${m.ステータス}`).join("・")}`);
  });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がある`).not.toBeNull();
    expect.soft(saved!.送り状No, "送り状No.は変わらない").toBe("TRACK-BEFORE-014");
    expect.soft(発送状況(saved!), "発送状況は「済」のまま").toBe("済");
    expect.soft(moves, "紐づく在庫移動のステータスは「移動中」のまま").toEqual([{ 在庫移動ID: moveId, ステータス: "移動中" }]);
  });
});

/** 015・016: 備考を入れて「登録」し、DBの備考を確かめる */
function savesMemo(label: string, memo: string) {
  return async ({ page, notes, step, expected, db }: CaseCtx) => {
    const id = notes.get(label);
    let detail: InstructionDetailPage;
    await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
    await step(2, async () => { await detail.fillMemo(memo); });
    await step(3, async () => { await register(page, detail, id); });
    let saved: ReturnType<typeof 送り状Noと備考> = null;
    await step(4, async () => { void db.available; saved = 送り状Noと備考(id); note(`DBの備考: ${JSON.stringify(saved?.備考 ?? null)}`); });
    await expected(async () => {
      expect(saved, `在庫移動指示 ${id} がある`).not.toBeNull();
      expect(saved!.備考, "備考").toBe(memo);
    });
  };
}

caseTest("IT-M04-25-015", savesMemo("〔在庫移動指示ID-M0425-015〕", "出庫承認済み備考"));
caseTest("IT-M04-25-016", savesMemo("〔在庫移動指示ID-M0425-016〕", "移動中備考"));

caseTest("IT-M04-25-026", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔在庫移動指示ID-M0425-026〕");
  const value = "A".repeat(16383);
  let detail: InstructionDetailPage;
  await step(1, async () => { detail = await openDetail(page, M0425_ADMIN, id); });
  await step(2, async () => {
    await detail.fillTrackingNo(value);
    await detail.fillMemo(value);
    note(`入れた長さ: 送り状No. ${(await detail.送り状Noの欄.inputValue()).length}文字・備考 ${(await detail.備考の欄.inputValue()).length}文字`);
  });
  await step(3, async () => { await register(page, detail, id); });
  let t: ReturnType<typeof 送り状Noの形> = null;
  let m: ReturnType<typeof 備考の形> = null;
  await step(4, async () => {
    void db.available;
    t = 送り状Noの形(id);
    m = 備考の形(id);
    note(`DBの送り状No.: ${JSON.stringify(t)}・備考: ${JSON.stringify(m)}`);
  });
  await expected(async () => {
    expect.soft(t, "送り状No.が半角英字「A」16383文字").toEqual({ バイト数: 16383, 文字数: 16383, 半角大文字Aだけ: true });
    expect.soft(m, "備考が半角英字「A」16383文字").toEqual({ 文字数: 16383, バイト数: 16383, 半角大文字Aだけ: true });
  });
});

/** 032〜034: 送り状No.だけを変えて「登録」し、送り状No.が変わり備考は変わらないこと */
function changesTrackingOnly(n: string) {
  return async ({ page, notes, step, expected, db }: CaseCtx) => {
    const id = notes.get(`〔在庫移動指示ID-M0425-${n}〕`);
    let detail: InstructionDetailPage;
    let before: ReturnType<typeof 送り状Noと備考> = null;
    await step(1, async () => {
      detail = await openDetail(page, M0425_ADMIN, id);
      void db.available;
      before = 送り状Noと備考(id);
      note(`変更する前のDBの値: ${JSON.stringify(before)}・紐づく在庫移動: ${紐づく在庫移動(id).map((m) => `${m.在庫移動ID}=${m.ステータス}`).join("・")}`);
    });
    await step(2, async () => { await detail.fillTrackingNo(`M0425-${n}-AFTER-TRACK`); });
    await step(3, async () => { await register(page, detail, id); });
    let saved: ReturnType<typeof 送り状Noと備考> = null;
    await step(4, async () => { saved = 送り状Noと備考(id); note(`DBの値: ${JSON.stringify(saved)}`); });
    await expected(async () => {
      expect.soft(before?.送り状No, "変更する前の送り状No.").toBe(`M0425-${n}-BEFORE-TRACK`);
      expect(saved, `在庫移動指示 ${id} がある`).not.toBeNull();
      expect.soft(saved!.送り状No, "送り状No.が更新される").toBe(`M0425-${n}-AFTER-TRACK`);
      expect.soft(saved!.備考, "備考は変わらない").toBe(`M0425-${n}-BEFORE-MEMO`);
    });
  };
}

caseTest("IT-M04-25-032", changesTrackingOnly("CB032"));
caseTest("IT-M04-25-033", changesTrackingOnly("CB033"));
caseTest("IT-M04-25-034", changesTrackingOnly("CB034"));

