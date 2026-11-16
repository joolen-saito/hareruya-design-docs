/**
 * M10-07 税率設定。正本: cases/M10-07_test_cases.tsv
 * 税率設定は共有の設定。シードが足した税率と、ケースが足す税率は、基盤が必ず消す（seeds/m10-07.ts）。
 * 実装: 001・003・005・007・014〜019・022・024・025・027・029〜034・036〜041。実装しない: 006・028（商品・商品規格に紐づく税率の行を作れない）・044（固定ID 100044の基本税率設定の行を作れない）。
 * 手順の注記（アプリの作りに合わせた読み替え）:
 * - 税率設定は店舗で分かれない共有の画面。「専用店舗」は本店で操作し、税率の一覧は共有のため他の税率の行も並ぶ。確かめるのは、このケースのシードが足した行（ID）についてだけ。
 * - アプリは税率を削除すると行ごと消す（論理削除しない）。「論理削除されること」は「DBにも一覧にも無くなること」で確かめる。
 * - 編集対象の共通税率IDを指定して開く画面は無い（行の鉛筆で入力欄に切り替える）。005 は存在しないIDのアドレスを開いて404を確かめる。
 * - 追加・更新が入力チェックで通らないケースは、画面の送信が止まる場合も含め、送信ボタンを押した結果（DBの行・画面）で確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 共通税率の件数, 日時の共通税率, 税率を読む } from "../../db/m10_07_tax";
import { TaxPage } from "../../pages/admin/m10_07_tax";
import { M1007_ADMIN, ケースが足す税率を後始末に登録する, 税率IDの } from "../../seeds/m10-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
type 送信の結果 = Awaited<ReturnType<TaxPage["押して送信を待つ"]>>;
/** 送信が送られたことの確かめ（送られずに「追加されない」「留まる」「更新されない」では確かめにならない） */
const 送られた = (r: 送信の結果): void => { expect(r.応答, "登録の送信が送られた（送信の応答がある）").not.toBeNull(); };
/** 入力チェックで止まったこと（画面の送信の応答か、ブラウザの入力チェック）の確かめ */
const 検証で止まった = (r: 送信の結果): void => {
  note(r.応答 !== null ? `送信の応答 ${r.応答}` : `ブラウザの入力チェックで送信が止まった（${r.入力チェックで止まった.join("・")}）`);
  expect(r.応答 !== null || r.入力チェックで止まった.length > 0, "送信が送られたか、ブラウザの入力チェックで止まった").toBe(true);
};

// 001 新規追加状態の初期値
caseTest("IT-M10-07-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await expected(async () => { expect.soft(await p.新規の規則の選択(), "未登録の共通税率の課税規則の選択").toBe("四捨五入"); });
});

// 003 編集対象の表示
caseTest("IT-M10-07-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("003").B;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  await expected(async () => {
    const v = await p.行の入力値(B);
    expect.soft(v.税率, `ID ${B} の消費税率`).toBe("8");
    expect.soft(v.規則, `ID ${B} の課税規則`).toBe("切り捨て");
    expect.soft(v.日時, `ID ${B} の適用日時`).toBe("2030-01-01 09:00");
  });
});

// 005 存在しないID
caseTest("IT-M10-07-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let status = 0;
  await step(1, async () => { status = await p.開く("/setting/shop/tax/999"); });
  await expected(async () => { expect.soft(status, "存在しない共通税率ID 999 を指定した要求のHTTPステータス").toBe(404); });
});

// 007 並び順
caseTest("IT-M10-07-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const x = 税率IDの("007");
  let ids: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { ids = (await p.一覧を読む()).map((r) => r.id); });
  await expected(async () => {
    expect.soft(ids.filter((i) => [x.A, x.B, x.C].includes(i)), "適用日時の降順（C・B・A）に並ぶ").toEqual([x.C, x.B, x.A]);
    expect.soft(ids.includes(x.D), "削除済みのDは表示されない").toBe(false);
  });
});

// ---- 追加 ----
type 入力 = { 税率: string; 規則: string; 日時: string };
const 追加の日時: Record<string, string[]> = {
  "014": ["2032-01-01 10:00"], "015": ["2032-01-01 10:00"], "016": [], "017": [], "018": ["2032-01-02 10:00"], "019": ["2032-01-03 10:00"],
  "022": ["2032-02-01 10:30"], "024": ["2032-02-03 10:30"], "025": ["2032-03-01 10:00", "2032-03-02 10:00", "2032-03-03 10:00"],
  "027": ["2030-01-01 09:00"], "029": ["2030-01-01 09:00"],
};

caseTest("IT-M10-07-014", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const v: 入力 = { 税率: "12", 規則: "四捨五入", 日時: "2032-01-01 10:00" };
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["014"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる(v); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await step(4, async () => { rows = 日時の共通税率(v.日時); });
  await expected(async () => {
    expect.soft(rows.length, "適用日時2032-01-01 10:00の共通税率の件数").toBe(1);
    expect.soft(rows[0]?.税率, "消費税率").toBe("12");
    expect.soft(rows[0]?.規則, "課税規則").toBe("四捨五入");
  });
});

caseTest("IT-M10-07-015", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["015"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "12", 規則: "四捨五入", 日時: "2032-01-01 10:00" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await expected(async () => { expect.soft(p.一覧の画面か, `税率設定画面（${p.パス}）へ遷移する`).toBe(true); });
});

caseTest("IT-M10-07-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "", 日時: "" }); });
  await step(3, async () => { 前 = 共通税率の件数(); 検証で止まった(await p.登録を押して待つ()); });
  await step(4, async () => { 後 = 共通税率の件数(); });
  await expected(async () => { expect.soft(後, "共通税率の件数（追加されない）").toBe(前); });
});

caseTest("IT-M10-07-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "", 日時: "" }); });
  await step(3, async () => { 検証で止まった(await p.登録を押して待つ()); });
  await expected(async () => { expect.soft(p.新規追加の画面か, `新規追加状態の税率設定画面に留まる（${p.パス}）`).toBe(true); });
});

caseTest("IT-M10-07-018", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["018"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "0", 規則: "四捨五入", 日時: "2032-01-02 10:00" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await step(4, async () => { rows = 日時の共通税率("2032-01-02 10:00"); });
  await expected(async () => {
    expect.soft(rows.length, "追加された共通税率の件数").toBe(1);
    expect.soft(rows[0]?.税率, "消費税率").toBe("0");
  });
});

caseTest("IT-M10-07-019", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["019"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "100", 規則: "四捨五入", 日時: "2032-01-03 10:00" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await step(4, async () => { rows = 日時の共通税率("2032-01-03 10:00"); });
  await expected(async () => {
    expect.soft(rows.length, "追加された共通税率の件数").toBe(1);
    expect.soft(rows[0]?.税率, "消費税率").toBe("100");
  });
});

caseTest("IT-M10-07-022", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["022"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => {
    await p.新規に入れる({ 規則: "四捨五入" });
    // 入力欄の種類を文字入力に書き換えて、全角数字をそのまま入れる
    await p.新規に入れる({ 税率: "２０", 日時: "２０３２-０２-０１ １０:３０" }, true);
  });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await step(4, async () => { rows = 日時の共通税率("2032-02-01 10:30"); });
  await expected(async () => {
    expect.soft(rows.length, "適用日時2032-02-01 10:30の共通税率の件数").toBe(1);
    expect.soft(rows[0]?.税率, "消費税率").toBe("20");
  });
});

caseTest("IT-M10-07-024", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["024"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "10.5", 規則: "四捨五入", 日時: "2032-02-03 10:30" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await step(4, async () => { rows = 日時の共通税率("2032-02-03 10:30"); });
  await expected(async () => {
    expect.soft(rows.length, "適用日時2032-02-03 10:30の共通税率の件数").toBe(1);
    expect.soft(/^\d+$/.test(rows[0]?.税率 ?? "x"), `追加された消費税率が小数点以下を持たない整数（${rows[0]?.税率}）`).toBe(true);
  });
});

caseTest("IT-M10-07-025", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const 三つ: 入力[] = [
    { 税率: "11", 規則: "四捨五入", 日時: "2032-03-01 10:00" }, { 税率: "12", 規則: "切り捨て", 日時: "2032-03-02 10:00" }, { 税率: "13", 規則: "切り上げ", 日時: "2032-03-03 10:00" },
  ];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["025"]);
  const 登録 = async (v: 入力) => { await p.新規追加状態で開く(); await p.新規に入れる(v); 送られた(await p.登録を押して待つ()); };
  await step(1, async () => { await 登録(三つ[0]); });
  await step(2, async () => { await 登録(三つ[1]); });
  await step(3, async () => { await 登録(三つ[2]); });
  const rows = new Map<string, ReturnType<typeof 日時の共通税率>>();
  await step(4, async () => { for (const v of 三つ) rows.set(v.日時, 日時の共通税率(v.日時)); });
  await expected(async () => {
    for (const v of 三つ) {
      const r = rows.get(v.日時) ?? [];
      expect.soft(r.length, `${v.日時}の共通税率の件数`).toBe(1);
      expect.soft(r[0]?.税率, `${v.日時}の消費税率`).toBe(v.税率);
      expect.soft(r[0]?.規則, `${v.日時}の課税規則`).toBe(v.規則);
    }
  });
});

// ---- 適用日時の重複 ----
caseTest("IT-M10-07-027", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("027").B;
  let rows: ReturnType<typeof 日時の共通税率> = [];
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["027"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "20", 規則: "四捨五入", 日時: "2030-01-01 09:00" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await step(4, async () => { rows = 日時の共通税率("2030-01-01 09:00"); });
  await expected(async () => {
    expect.soft(rows.map((r) => r.id), `適用日時2030-01-01 09:00の共通税率はID ${B} の1件だけ`).toEqual([B]);
  });
});

caseTest("IT-M10-07-029", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  await ケースが足す税率を後始末に登録する(browser, 追加の日時["029"]);
  await step(1, async () => { await p.新規追加状態で開く(); });
  await step(2, async () => { await p.新規に入れる({ 税率: "20", 規則: "四捨五入", 日時: "2030-01-01 09:00" }); });
  await step(3, async () => { 送られた(await p.登録を押して待つ()); });
  await expected(async () => {
    expect.soft(p.新規追加の画面か, `新規追加状態の税率設定画面に留まる（${p.パス}）`).toBe(true);
    const v = await p.新規の入力値();
    expect.soft(v.税率, "入力内容を保持（消費税率）").toBe("20");
    expect.soft(v.規則, "入力内容を保持（課税規則）").toBe("四捨五入");
    expect.soft(v.日時, "入力内容を保持（適用日時）").toBe("2030-01-01 09:00");
  });
});

// ---- 更新 ----
caseTest("IT-M10-07-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("030").B;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  await step(3, async () => { await p.行に入れる(B, { 税率: "18", 規則: "切り上げ", 日時: "2032-06-01 11:00" }); });
  await step(4, async () => { 送られた(await p.決定を押して待つ(B)); });
  await step(5, async () => { r = 税率を読む(B); });
  await expected(async () => {
    expect.soft(r?.税率, `ID ${B} の消費税率`).toBe("18");
    expect.soft(r?.規則, `ID ${B} の課税規則`).toBe("切り上げ");
    expect.soft(r?.日時, `ID ${B} の適用日時`).toBe("2032-06-01 11:00");
  });
});

caseTest("IT-M10-07-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("031").B;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  await step(3, async () => { await p.行に入れる(B, { 税率: "18", 規則: "切り上げ", 日時: "2032-06-01 11:00" }); });
  await step(4, async () => { 送られた(await p.決定を押して待つ(B)); });
  await expected(async () => {
    expect.soft(p.一覧の画面か, `税率設定画面（${p.パス}）へ遷移する`).toBe(true);
    // 編集は一覧の画面の中で行うので、入力の誤りで同じ画面が描き直されてもアドレスは同じ。保存して移った画面であることを「保存しました」で見る
    await expect.soft(p.成功の表示, "保存して移った税率設定画面（保存しました）").toContainText("保存しました");
  });
});

caseTest("IT-M10-07-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("032").B;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  await step(3, async () => { await p.行に入れる(B, { 税率: "19", 規則: "四捨五入" }); });
  await step(4, async () => { 送られた(await p.決定を押して待つ(B)); });
  await step(5, async () => { r = 税率を読む(B); });
  await expected(async () => {
    expect.soft(r?.税率, `ID ${B} の消費税率`).toBe("19");
    expect.soft(r?.規則, `ID ${B} の課税規則`).toBe("四捨五入");
    expect.soft(r?.日時, `ID ${B} の適用日時（変更しない）`).toBe("2030-01-01 09:00");
  });
});

caseTest("IT-M10-07-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("033").B;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  await step(3, async () => { await p.行に入れる(B, { 税率: "20", 規則: "切り上げ", 日時: "2030-06-01 12:34" }); });
  await step(4, async () => { 送られた(await p.決定を押して待つ(B)); });
  await step(5, async () => { r = 税率を読む(B); });
  await expected(async () => {
    expect.soft(r?.税率, `ID ${B} の消費税率（更新されない）`).toBe("8");
    expect.soft(r?.規則, `ID ${B} の課税規則（更新されない）`).toBe("切り捨て");
    expect.soft(r?.日時, `ID ${B} の適用日時（更新されない）`).toBe("2030-01-01 09:00");
  });
});

caseTest("IT-M10-07-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const B = 税率IDの("034").B;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.編集にする(B); });
  // 課税規則の選択肢に空は無いので、入力欄を空にできる消費税率と適用日時を空にする
  await step(3, async () => { await p.行に入れる(B, { 税率: "", 日時: "" }); note("課税規則は選択式で空にできない（選択肢に空が無い）ため、消費税率と適用日時を空にした"); });
  await step(4, async () => { 検証で止まった(await p.決定を押して待つ(B)); });
  await step(5, async () => { r = 税率を読む(B); });
  await expected(async () => {
    expect.soft(r?.税率, `ID ${B} の消費税率（更新されない）`).toBe("8");
    expect.soft(r?.規則, `ID ${B} の課税規則（更新されない）`).toBe("切り捨て");
    expect.soft(r?.日時, `ID ${B} の適用日時（更新されない）`).toBe("2030-01-01 09:00");
  });
});

// ---- 削除 ----
caseTest("IT-M10-07-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const C = 税率IDの("036").C;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.削除のモーダルを開く(C); });
  await step(3, async () => { 送られた(await p.モーダルで削除して待つ(C)); });
  await step(4, async () => { r = 税率を読む(C); });
  await expected(async () => { expect.soft(r, `基本税率設定ではないID ${C} が削除される（DBに行が無い）`).toBeNull(); });
});

caseTest("IT-M10-07-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const C = 税率IDの("037").C;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.削除のモーダルを開く(C); });
  await step(3, async () => { 送られた(await p.モーダルで削除して待つ(C)); });
  await expected(async () => {
    expect.soft(p.一覧の画面か, `税率設定画面（${p.パス}）へ遷移する`).toBe(true);
    // 削除は一覧の画面から送るので、アドレスだけでは移ったか分からない。削除して移った画面であることを「削除しました」で見る
    await expect.soft(p.成功の表示, "削除して移った税率設定画面（削除しました）").toContainText("削除しました");
  });
});

caseTest("IT-M10-07-038", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const C = 税率IDの("038").C;
  let r: ReturnType<typeof 税率を読む> = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.削除のモーダルを開く(C); });
  await step(3, async () => { await p.モーダルでキャンセルする(C); });
  await step(4, async () => { r = 税率を読む(C); });
  await expected(async () => { expect.soft(r?.id, `ID ${C} が削除されていない（DBに行がある）`).toBe(C); });
});

caseTest("IT-M10-07-039", async ({ page, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const C = 税率IDの("039").C;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.削除のモーダルを開く(C); });
  await step(3, async () => { await p.モーダルでキャンセルする(C); });
  await expected(async () => { expect.soft(p.一覧の画面か, `税率設定画面に留まる（${p.パス}）`).toBe(true); });
});

/** 二つ目のブラウザ（ブラウザB）で管理者にログインする */
async function ブラウザB(browser: import("@playwright/test").Browser) {
  const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(c);
  const page = await c.newPage();
  await loginAdmin(page, M1007_ADMIN);
  return { c, page };
}

caseTest("IT-M10-07-040", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const x = 税率IDの("040");
  const b = await ブラウザB(browser);
  try {
    const pb = new TaxPage(b.page);
    await step(1, async () => { await p.開く(); await p.削除のモーダルを開く(x.C); });
    await step(2, async () => { await pb.開く(); await pb.削除のモーダルを開く(x.C); 送られた(await pb.モーダルで削除して待つ(x.C)); });
    await step(3, async () => { 送られた(await p.モーダルで削除して待つ(x.C)); });
    let a: ReturnType<typeof 税率を読む> = null; let bb: ReturnType<typeof 税率を読む> = null;
    await step(4, async () => { a = 税率を読む(x.A); bb = 税率を読む(x.B); });
    await expected(async () => {
      expect.soft(a?.id, `ID ${x.A} が削除されていない`).toBe(x.A);
      expect.soft(bb?.id, `ID ${x.B} が削除されていない`).toBe(x.B);
    });
  } finally { await b.c.close(); }
});

caseTest("IT-M10-07-041", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1007_ADMIN);
  const p = new TaxPage(page);
  const x = 税率IDの("041");
  const b = await ブラウザB(browser);
  try {
    const pb = new TaxPage(b.page);
    await step(1, async () => { await p.開く(); await p.削除のモーダルを開く(x.C); });
    await step(2, async () => { await pb.開く(); await pb.削除のモーダルを開く(x.C); 送られた(await pb.モーダルで削除して待つ(x.C)); });
    await step(3, async () => { 送られた(await p.モーダルで削除して待つ(x.C)); });
    await expected(async () => { expect.soft(p.一覧の画面か, `ブラウザAが税率設定画面へ戻る（${p.パス}）`).toBe(true); });
  } finally { await b.c.close(); }
});

