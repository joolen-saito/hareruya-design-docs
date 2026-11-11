/** M16-03 祝日追加・削除。正本: cases/M16-03_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { HolidayPage } from "../../pages/admin/m16_03_holiday";
import { D, M1603_ADMIN, イベント名 } from "../../seeds/m16-03";
import { Browser } from "@playwright/test";
import type { Row } from "../../lib/db";
import { 後片付け, 斜線 } from "../../pages/admin/m16_03_setup";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ここ = /\/data\/holiday\/?$/;
/** ケースの終わりに、専用の日付に足した祝日と、このケースが登録したイベントを消す（消せなかったら注記に残す） */
async function 片付け(browser: Browser, 期間: [string, string][], イベント?: string[]): Promise<void> {
  for (const m of await 後片付け(browser, { 期間, イベント名: イベント, 管理者: M1603_ADMIN })) note(m);
}
const 同日 = (d: string): [string, string] => [d, d];

caseTest("IT-M16-03-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await expected(async () => {
    expect.soft(await h.追加枠が表示されている(), "祝日の新規登録枠が表示されている").toBe(true);
  });
});

caseTest("IT-M16-03-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.戻るを押す(); });
  await expected(async () => {
    expect.soft(await h.追加枠が表示されている(), "祝日の新規登録枠が表示されている").toBe(false);
  });
});

caseTest("IT-M16-03-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.属性を消す(h.名称欄, "maxlength"); });
  await step(4, async () => { await h.名称欄.fill("あ".repeat(65)); await h.日付欄.fill("2025-04-17"); });
  let r = { sent: false, status: 0, path: "" };
  await step(5, async () => { r = await h.送信する(h.追加ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "追加の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill(""); await h.取得終了日.fill("2025-01-13"); });
  await step(3, async () => { await h.属性を消す(h.取得開始日, "required"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill("2025-01-01"); await h.取得終了日.fill(""); });
  await step(3, async () => { await h.属性を消す(h.取得終了日, "required"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill("2025-05-02"); await h.取得終了日.fill("2025-05-01"); });
  let r = { sent: false, status: 0, path: "" };
  await step(3, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.属性を書き換える(h.取得開始日, "type", "text"); });
  await step(3, async () => { await h.取得開始日.fill("2025-02-30"); await h.取得終了日.fill("2025-03-01"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.名称欄.fill("期限不正祝日"); await h.日付欄.fill("2025-04-18"); });
  await step(4, async () => { await h.追加のトークン.evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
  let r = { sent: false, status: 0, path: "" };
  await step(5, async () => { r = await h.送信する(h.追加ボタン); });
  await expected(async () => {
    expect.soft(r.status, "追加の要求の応答（アクセス拒否）").toBe(403);
  });
});


// ---- ここから下は、専用の日付（seeds/m16-03.ts の D）に読み替えて実装したケース。読み替えはシードの注記に残してある ----

type 送信結果 = { sent: boolean; status: number; path: string };
const 未送信: 送信結果 = { sent: false, status: 0, path: "" };

caseTest("IT-M16-03-001", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let 一覧: { 名称: string; 日付: string }[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { 一覧 = await h.一覧の内容(); });
    await expected(async () => {
      const [a, b, c] = D.c001.map(斜線);
      const 位置 = (d: string) => 一覧.findIndex((r) => r.日付 === d);
      expect.soft(一覧.find((r) => r.日付 === a)?.名称, `${a} の行の名称`).toBe("元日");
      expect.soft(一覧.find((r) => r.日付 === b)?.名称, `${b} の行の名称`).toBe("建国記念の日");
      expect.soft(一覧.find((r) => r.日付 === c)?.名称, `${c} の行の名称`).toBe("こどもの日");
      expect.soft(位置(a) >= 0 && 位置(a) < 位置(b) && 位置(b) < 位置(c), "3件が日付の昇順に並んでいる").toBe(true);
      const 日付の並び = 一覧.map((r) => r.日付);
      expect.soft(日付の並び, "一覧全体が日付の昇順").toEqual([...日付の並び].sort());
      expect.soft(一覧.every((r) => /^\d{4}\/\d{2}\/\d{2}$/.test(r.日付)), "日付がすべて「2025/01/01」の形式").toBe(true);
    });
  } finally { await 片付け(browser, [[D.c001[0], D.c001[2]]]); }
});

caseTest("IT-M16-03-004", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let 行: Row[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("手動祝日"); await h.日付欄.fill(D.c004); });
    await step(4, async () => { const r = await h.送信する(h.追加ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
    await step(5, async () => { 行 = db.query("select name, date from mtb_holiday where date = $1", [D.c004]); });
    await expected(async () => {
      expect.soft(行.length, "その日付の祝日の件数").toBe(1);
      expect.soft(行[0]?.name, "名称").toBe("手動祝日");
      expect.soft(行[0]?.date, "日付").toBe(D.c004);
    });
  } finally { await 片付け(browser, [同日(D.c004)]); }
});

caseTest("IT-M16-03-005", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let r = 未送信;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("手動祝日"); await h.日付欄.fill(D.c005); });
    await step(4, async () => { r = await h.送信する(h.追加ボタン); });
    await expected(async () => {
      expect.soft(r.sent, "追加の要求が送られた").toBe(true);
      expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
    });
  } finally { await 片付け(browser, [同日(D.c005)]); }
});

caseTest("IT-M16-03-006", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const 名称 = "あ".repeat(64);
  let 行: Row[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill(名称); await h.日付欄.fill(D.c006); });
    await step(4, async () => { await h.送信する(h.追加ボタン); });
    await step(5, async () => { 行 = db.query("select name, date from mtb_holiday where date = $1", [D.c006]); });
    await expected(async () => {
      expect.soft(行.length, "その日付の祝日の件数").toBe(1);
      expect.soft(行[0]?.name, "名称（「あ」64文字）").toBe(名称);
      expect.soft(行[0]?.date, "日付").toBe(D.c006);
    });
  } finally { await 片付け(browser, [同日(D.c006)]); }
});

caseTest("IT-M16-03-010", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let 行: Row[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("重複祝日"); await h.日付欄.fill(D.c010); });
    await step(4, async () => { await h.送信する(h.追加ボタン); });
    await step(5, async () => { 行 = db.query("select id, name from mtb_holiday where date = $1", [D.c010]); });
    await expected(async () => {
      expect.soft(行.length, "その日付の祝日の件数（シードの1件だけ）").toBe(1);
      expect.soft(行[0]?.id, "残っている1件の祝日ID").toBe(notes.get("〔祝日ID-M1603-010〕"));
      expect.soft(行.some((r) => r.name === "重複祝日"), "「重複祝日」が追加されている").toBe(false);
    });
  } finally { await 片付け(browser, [同日(D.c010)]); }
});

caseTest("IT-M16-03-011", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let r = 未送信;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("重複祝日"); await h.日付欄.fill(D.c011); });
    await step(4, async () => { r = await h.送信する(h.追加ボタン); });
    await expected(async () => {
      expect.soft(r.sent, "追加の要求が送られた").toBe(true);
      expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
    });
  } finally { await 片付け(browser, [同日(D.c011)]); }
});

/** イベント詳細の祝日フラグ（イベント詳細ID → 「true」「false」） */
function 祝日フラグ(db: { query: (sql: string, p?: (string | number)[]) => Record<string, string | null>[] }, ids: string[]): Record<string, string | null> {
  const rows = db.query(`select id, holiday_flg from dtb_event_detail where id in (${ids.map((_, i) => `$${i + 1}`).join(", ")})`, ids);
  return Object.fromEntries(rows.map((r) => [r.id as string, r.holiday_flg]));
}

caseTest("IT-M16-03-012", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔イベント詳細ID-M1603-012${x}〕`));
  let フラグ: Record<string, string | null> = {};
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("イベント反映祝日"); await h.日付欄.fill(D.c012[0]); });
    await step(4, async () => { await h.送信する(h.追加ボタン); });
    await step(5, async () => { フラグ = 祝日フラグ(db, [a, b, c]); });
    await expected(async () => {
      expect.soft(フラグ[a], `${D.c012[0]} 開始の日程（ID ${a}）の祝日フラグ`).toBe("true");
      expect.soft(フラグ[b], `${D.c012[0]} 開始の日程（ID ${b}）の祝日フラグ`).toBe("true");
      expect.soft(フラグ[c], `${D.c012[1]} 開始の日程（ID ${c}）の祝日フラグ`).toBe("false");
    });
  } finally { await 片付け(browser, [[D.c012[0], D.c012[1]]], [イベント名.c012]); }
});

caseTest("IT-M16-03-022", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let r = 未送信;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c022[0]); await h.取得終了日.fill(D.c022[1]); });
    await step(3, async () => { r = await h.送信する(h.決定ボタン); });
    await expected(async () => {
      expect.soft(r.sent, "決定の要求が送られた").toBe(true);
      expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
    });
  } finally { await 片付け(browser, [[D.c022[0], D.c022[1]]]); }
});

caseTest("IT-M16-03-024", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let r = 未送信;
  let 上部: string[] = [];
  let 追加された行 = 0;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c024[0]); await h.取得終了日.fill(D.c024[1]); });
    await step(3, async () => { r = await h.送信する(h.決定ボタン); 上部 = await h.画面上部のメッセージ(); 追加された行 = await h.日付の行("2032/02/23").count(); });
    await expected(async () => {
      expect.soft(r.sent, "決定の要求が送られた").toBe(true);
      expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
      note("「残りの祝日登録を続行」は、登録済みの日（2032/02/11）をスキップしたうえで、ほかの祝日（2032/02/23 天皇誕生日）が追加されたこと、で確かめた");
      expect.soft(上部.some((t) => t.includes("2032/02/11は、既に祝日が登録されているのでスキップします。")), "登録済みの日をスキップした旨のメッセージ").toBe(true);
      expect.soft(追加された行, "続行して追加された祝日（2032/02/23）の行数").toBe(1);
    });
  } finally { await 片付け(browser, [[D.c024[0], D.c024[1]]]); }
});

caseTest("IT-M16-03-025", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let 行: Row[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c025); await h.取得終了日.fill(D.c025); });
    await step(3, async () => { await h.送信する(h.決定ボタン); });
    await step(4, async () => { 行 = db.query("select id, name from mtb_holiday where date = $1", [D.c025]); });
    await expected(async () => {
      expect.soft(行.length, "その日付の祝日の件数（シードの1件だけ）").toBe(1);
      expect.soft(行[0]?.id, "残っている1件の祝日ID").toBe(notes.get("〔祝日ID-M1603-025〕"));
    });
  } finally { await 片付け(browser, [同日(D.c025)]); }
});

caseTest("IT-M16-03-026", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let r = 未送信;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c026); await h.取得終了日.fill(D.c026); });
    await step(3, async () => { r = await h.送信する(h.決定ボタン); });
    await expected(async () => {
      expect.soft(r.sent, "決定の要求が送られた").toBe(true);
      expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
    });
  } finally { await 片付け(browser, [同日(D.c026)]); }
});

caseTest("IT-M16-03-027", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔イベント詳細ID-M1603-027${x}〕`));
  let フラグ: Record<string, string | null> = {};
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c027[0]); await h.取得終了日.fill(D.c027[0]); });
    await step(3, async () => { await h.送信する(h.決定ボタン); });
    await step(4, async () => { フラグ = 祝日フラグ(db, [a, b, c]); });
    await expected(async () => {
      expect.soft(フラグ[a], `${D.c027[0]} 開始の日程（ID ${a}）の祝日フラグ`).toBe("true");
      expect.soft(フラグ[b], `${D.c027[0]} 開始の日程（ID ${b}）の祝日フラグ`).toBe("true");
      expect.soft(フラグ[c], `${D.c027[1]} 開始の日程（ID ${c}）の祝日フラグ`).toBe("false");
    });
  } finally { await 片付け(browser, [[D.c027[0], D.c027[1]]], [イベント名.c027]); }
});

caseTest("IT-M16-03-029", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-029〕");
  let 削除要求 = 0;
  page.on("request", (q) => { if (q.method() === "POST" && /\/data\/holiday\/\d+\/delete/.test(q.url())) 削除要求 += 1; });
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { dlg = await h.削除を選ぶ(id); });
    await step(3, async () => { await h.ダイアログに答える(dlg, false); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "表示されている画面（祝日追加・削除画面のまま）").toMatch(ここ);
      expect.soft(削除要求, "削除の要求が送られた回数").toBe(0);
      expect.soft(await h.削除リンク(id).count(), "祝日の行（削除リンク）が残っている").toBe(1);
    });
  } finally { await 片付け(browser, [同日(D.c029)]); }
});

caseTest("IT-M16-03-030", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-030〕");
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let 行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { dlg = await h.削除を選ぶ(id); });
    await step(3, async () => { await h.ダイアログに答える(dlg, false); });
    await step(4, async () => { 行 = db.query("select id from mtb_holiday where id = $1", [id]); });
    await expected(async () => {
      expect.soft(行.length, `祝日ID ${id} の祝日の件数（残っている）`).toBe(1);
    });
  } finally { await 片付け(browser, [同日(D.c030)]); }
});

caseTest("IT-M16-03-031", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-031〕");
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let 行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { dlg = await h.削除を選ぶ(id); });
    await step(3, async () => { await h.ダイアログに答える(dlg, true); });
    await step(4, async () => { 行 = db.query("select id from mtb_holiday where id = $1", [id]); });
    await expected(async () => {
      expect.soft(行.length, `祝日ID ${id} の祝日の件数（削除されている）`).toBe(0);
    });
  } finally { await 片付け(browser, [同日(D.c031)]); }
});

caseTest("IT-M16-03-032", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-032〕");
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let 応答: Awaited<ReturnType<HolidayPage["ダイアログに答える"]>> = null;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { dlg = await h.削除を選ぶ(id); });
    await step(3, async () => { 応答 = await h.ダイアログに答える(dlg, true); });
    await expected(async () => {
      expect.soft(応答 !== null, "確認でOKを押したあと、削除の要求が送られた（確認が閉じた）").toBe(true);
      expect.soft(new URL(page.url()).pathname, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
    });
  } finally { await 片付け(browser, [同日(D.c032)]); }
});

caseTest("IT-M16-03-033", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-033〕");
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔イベント詳細ID-M1603-033${x}〕`));
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let フラグ: Record<string, string | null> = {};
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { dlg = await h.削除を選ぶ(id); });
    await step(3, async () => { await h.ダイアログに答える(dlg, true); });
    await step(4, async () => { フラグ = 祝日フラグ(db, [a, b, c]); });
    await expected(async () => {
      expect.soft(フラグ[a], `${D.c033[0]} 開始の日程（ID ${a}）の祝日フラグ`).toBe("false");
      expect.soft(フラグ[b], `${D.c033[0]} 開始の日程（ID ${b}）の祝日フラグ`).toBe("false");
      expect.soft(フラグ[c], `${D.c033[1]} 開始の日程（ID ${c}）の祝日フラグ`).toBe("true");
    });
  } finally { await 片付け(browser, [[D.c033[0], D.c033[1]]], [イベント名.c033]); }
});

caseTest("IT-M16-03-035", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  let 行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.新規登録を押す(); });
    await step(3, async () => { await h.名称欄.fill("期限不正祝日"); await h.日付欄.fill(D.c035); });
    await step(4, async () => { await h.追加のトークン.evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
    await step(5, async () => { await h.送信する(h.追加ボタン); });
    await step(6, async () => { 行 = db.query("select id from mtb_holiday where name = $1", ["期限不正祝日"]); });
    await expected(async () => {
      expect.soft(行.length, "名称が「期限不正祝日」の祝日の件数").toBe(0);
    });
  } finally { await 片付け(browser, [同日(D.c035)]); }
});

caseTest("IT-M16-03-036", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-036〕");
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let 応答: Awaited<ReturnType<HolidayPage["ダイアログに答える"]>> = null;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.削除要求のトークンを書き換える(id, "invalid-token"); });
    await step(3, async () => { dlg = await h.削除を選ぶ(id); });
    await step(4, async () => { 応答 = await h.ダイアログに答える(dlg, true); });
    await expected(async () => {
      expect.soft(応答?.status() ?? 0, "削除の要求の応答（アクセス拒否）").toBe(403);
    });
  } finally { await 片付け(browser, [同日(D.c036)]); }
});

caseTest("IT-M16-03-037", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const id = notes.get("〔祝日ID-M1603-037〕");
  let dlg: Awaited<ReturnType<HolidayPage["削除を選ぶ"]>>;
  let 行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.削除要求のトークンを書き換える(id, "invalid-token"); });
    await step(3, async () => { dlg = await h.削除を選ぶ(id); });
    await step(4, async () => { await h.ダイアログに答える(dlg, true); });
    await step(5, async () => { 行 = db.query("select id from mtb_holiday where id = $1", [id]); });
    await expected(async () => {
      expect.soft(行.length, `祝日ID ${id} の祝日の件数（残っている）`).toBe(1);
    });
  } finally { await 片付け(browser, [同日(D.c037)]); }
});

caseTest("IT-M16-03-042", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const idA = notes.get("〔祝日ID-M1603-042A〕");
  const page2 = await page.context().newPage();
  const h2 = new HolidayPage(page2);
  let 応答2: Awaited<ReturnType<HolidayPage["ダイアログに答える"]>> = null;
  try {
    await step(1, async () => { await h.open(); await h2.open(); });
    await step(2, async () => { const d = await h.削除を選ぶ(idA); await h.ダイアログに答える(d, true); });
    await step(3, async () => { const d = await h2.削除を選ぶ(idA); 応答2 = await h2.ダイアログに答える(d, true); });
    await expected(async () => {
      expect.soft(応答2?.status() ?? 0, "2つ目のタブの削除の要求の応答（エラー応答）").toBeGreaterThanOrEqual(400);
      expect.soft(await page2.getByText("削除しました").count(), "「削除しました」の表示数").toBe(0);
    });
  } finally { await page2.close().catch(() => {}); await 片付け(browser, [[D.c042[0], D.c042[1]]]); }
});

caseTest("IT-M16-03-043", async ({ page, browser, notes, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const idA = notes.get("〔祝日ID-M1603-043A〕");
  const idB = notes.get("〔祝日ID-M1603-043B〕");
  const page2 = await page.context().newPage();
  const h2 = new HolidayPage(page2);
  let 行: Row[] = [];
  try {
    await step(1, async () => { await h.open(); await h2.open(); });
    await step(2, async () => { const d = await h.削除を選ぶ(idA); await h.ダイアログに答える(d, true); });
    await step(3, async () => { const d = await h2.削除を選ぶ(idA); await h2.ダイアログに答える(d, true); });
    await step(4, async () => { 行 = db.query("select id, name, date from mtb_holiday where id = $1", [idB]); });
    await expected(async () => {
      expect.soft(行.length, `祝日ID ${idB} の祝日の件数（残っている）`).toBe(1);
      expect.soft(行[0]?.name, "名称").toBe("祝日M1603-043-B");
      expect.soft(行[0]?.date, "日付").toBe(D.c043[1]);
    });
  } finally { await page2.close().catch(() => {}); await 片付け(browser, [[D.c043[0], D.c043[1]]]); }
});

caseTest("IT-M16-03-048", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const 件数 = () => db.query("select id from mtb_holiday where date = $1", [D.c048]).length;
  let 上部: string[] = [];
  let 一回目 = -1;
  let 二回目 = -1;
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(D.c048); await h.取得終了日.fill(D.c048); });
    await step(3, async () => { await h.送信する(h.決定ボタン); });
    await step(4, async () => { 一回目 = 件数(); expect.soft(一回目, "1回目の実行後の、その日付の祝日の件数").toBe(1); });
    await step(5, async () => { await h.取得開始日.fill(D.c048); await h.取得終了日.fill(D.c048); });
    await step(6, async () => { await h.送信する(h.決定ボタン); });
    await step(7, async () => { 上部 = await h.画面上部のメッセージ(); 二回目 = 件数(); });
    await expected(async () => {
      expect.soft(上部.some((t) => t.includes("指定された期間に、登録可能な祝日がありませんでした。")), "管理画面上部のメッセージ").toBe(true);
      expect.soft(二回目, "2回目の実行後の、その日付の祝日の件数（1回目と同じ）").toBe(一回目);
    });
  } finally { await 片付け(browser, [同日(D.c048)]); }
});

caseTest("IT-M16-03-049", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const [始, 終] = D.c049;
  let 上部: string[] = [];
  let 始の行: Row[] = [];
  let 終の行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(始); await h.取得終了日.fill(終); });
    await step(3, async () => { await h.送信する(h.決定ボタン); });
    await step(4, async () => { 上部 = await h.画面上部のメッセージ(); });
    await step(5, async () => {
      始の行 = db.query("select name from mtb_holiday where date = $1", [始]);
      終の行 = db.query("select id from mtb_holiday where date = $1", [終]);
    });
    await expected(async () => {
      expect.soft(上部.some((t) => t.includes(`${斜線(始)}は、既に祝日が登録されているのでスキップします。`)), "スキップのメッセージ（日付は登録済みの日）").toBe(true);
      expect.soft(上部.some((t) => t.includes("1件の祝日が登録されました。")), "登録件数のメッセージ（1件）").toBe(true);
      expect.soft(始の行.length, `${始} の祝日の件数`).toBe(1);
      expect.soft(始の行[0]?.name, `${始} の祝日の名称（シードのまま）`).toBe("既存祝日M1603-CB049");
      expect.soft(終の行.length, `${終} の祝日の件数（追加された）`).toBe(1);
    });
  } finally { await 片付け(browser, [[始, 終]]); }
});

caseTest("IT-M16-03-050", async ({ page, browser, step, expected, db }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  const [始, 終] = D.c050;
  let 上部: string[] = [];
  let 行: unknown[] = [];
  try {
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.取得開始日.fill(始); await h.取得終了日.fill(終); });
    await step(3, async () => { await h.送信する(h.決定ボタン); });
    await step(4, async () => { 上部 = await h.画面上部のメッセージ(); });
    await step(5, async () => { 行 = db.query("select id from mtb_holiday where date between $1 and $2", [始, 終]); });
    await expected(async () => {
      expect.soft(上部.some((t) => t.includes("指定された期間に、登録可能な祝日がありませんでした。")), "管理画面上部のメッセージ").toBe(true);
      expect.soft(行.length, `${始} から ${終} までの祝日の件数`).toBe(0);
    });
  } finally { await 片付け(browser, [[始, 終]]); }
});
