/**
 * M13-02 イベント登録/編集（イベント属性の登録・更新。IT-M13-02-005、008〜029、032）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openEventCreate, openEventEdit, EventForm } from "../../pages/admin/event";
import { 保存イベント, 保存されているイベント, イベント名で探す, 登録者のイベント件数, 最大のイベントID } from "../../db/event";
import { 管理者ID } from "../../db/member";
import { M1302_ADMIN, M1302_ADMIN_014 } from "../../seeds/m13-02";

/** 手順どおりにできなかったが試験は続けられること（空にできない項目など）を、報告に残す */
const note = (m: string | null) => { if (m) test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 途中で落ちても残りの確かめを続ける。落ちたことは不合格として残る */
async function softly(what: string, fn: () => Promise<void>): Promise<void> {
  try { await fn(); } catch (e) { expect.soft((e as Error).message.split("\n")[0], what).toBe("（問題なし）"); }
}
const あ = (n: number) => "あ".repeat(n);
const 必ずある = (e: 保存イベント | null, id: string): 保存イベント => { if (!e) throw new Error(`イベントID ${id} がDBに無い`); return e; };
const 行末をそろえる = (v: string) => v.replace(/\r\n/g, "\n");

caseTest("IT-M13-02-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-005〕")); });
  const 使える: Record<string, boolean> = {};
  let 支払方法: string[] = [];
  await step(2, async () => {
    await expect(form.イベント名日).toBeVisible();
    for (const h of ["イベント規模", "チーム戦フラグ", "フリー入力エリア1", "フリー入力エリア2", "フリー入力エリア3", "備考(日)", "備考(英)", "チーム人数"]) 使える[h] = await form.usable(h);
    支払方法 = await form.支払方法の選択肢();
  });
  await expected(async () => {
    for (const h of ["イベント規模", "チーム戦フラグ", "フリー入力エリア1", "フリー入力エリア2", "フリー入力エリア3"]) expect.soft(使える[h], `${h}が使用できる`).toBe(true);
    for (const h of ["備考(日)", "備考(英)", "チーム人数"]) expect.soft(使える[h], `${h}が使用できない`).toBe(false);
    expect.soft(支払方法, "コンビニ決済が使用できない").not.toContain("コンビニ決済");
  });
});

caseTest("IT-M13-02-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  const area = (n: number) => ({ 項目名日: `案内${n}`, 項目名英: `Guide ${n}`, 内容日: `内容${n}`, 内容英: `Content ${n}` });
  await step(2, async () => {
    await expect.soft(form.会場, "会場の入力項目が無く、会場A を入力できない").toBeVisible({ timeout: 2000 });
    await softly("イベント属性とイベント説明の入力", () => form.fill({
      イベント名日: "結合試験イベント", イベント名英: "Integration Event", 店舗: "店舗A", フォーマット: ["スタンダード", "モダン"], ルール適用度: "初心者歓迎",
      公開状態: "公開", イベント規模: "大型イベント", バナーURL日: "https://example.com/event-jp", バナーURL英: "https://example.com/event-en",
      定員: "16", チーム戦: true, 支払方法: ["クレジットカード決済"], 参加費: "500", 賞品日: "賞品A", 賞品英: "Prize A",
      フリー入力エリア: [area(1), area(2), area(3)],
    }));
  });
  await step(3, async () => { await form.submit(form.登録ボタン); });
  let found: 保存イベント[] = [];
  await step(4, async () => { found = イベント名で探す("結合試験イベント"); });
  await expected(async () => {
    expect(found.length, "イベント名(日)「結合試験イベント」のイベントの件数").toBe(1);
    const { イベントID: _i, 登録者の管理者ID: _m, 更新日時: _u, ...got } = found[0];
    expect.soft(got).toEqual({
      "イベント名(日)": "結合試験イベント", "イベント名(英)": "Integration Event", 店舗: "店舗A", フォーマット: ["スタンダード", "モダン"], ルール適用度: "初心者歓迎",
      公開状態: "公開", イベント規模: "大型イベント", "バナーURL(日)": "https://example.com/event-jp", "バナーURL(英)": "https://example.com/event-en",
      定員: "16", チーム戦: "真", 支払方法: ["クレジットカード決済"], 参加費: "500", "賞品(日)": "賞品A", "賞品(英)": "Prize A",
      フリー入力エリア: [1, 2, 3].map((n) => ({ "項目名(日)": `案内${n}`, "項目名(英)": `Guide ${n}`, "内容(日)": `内容${n}`, "内容(英)": `Content ${n}`, 初期表示は閉じる: "偽" })),
    });
  });
});

caseTest("IT-M13-02-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  await step(2, async () => {
    await form.fill({ イベント名日: "正常登録イベント-009", イベント名英: "Valid Event 009", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "500" });
  });
  await step(3, async () => { await form.submit(form.登録ボタン); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(/\/event\/\d+\/edit/);
    await expect(form.イベント名日, "新しく保存されたイベントの編集画面である").toHaveValue("正常登録イベント-009");
  });
});

caseTest("IT-M13-02-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-010〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.fill({ イベント名日: "更新後イベント", イベント名英: "Updated Event", イベント規模: "特別イベント", 定員: "32", 参加費: "1000" }); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    expect.soft(got["イベント名(日)"], "イベント名(日)").toBe("更新後イベント");
    expect.soft(got["イベント名(英)"], "イベント名(英)").toBe("Updated Event");
    expect.soft(got.イベント規模, "イベント規模").toBe("特別イベント");
    expect.soft(got.定員, "定員").toBe("32");
    expect.soft(got.参加費, "参加費").toBe("1000");
  });
});

caseTest("IT-M13-02-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-011〕")); });
  await step(2, async () => { await form.fill({ イベント名日: "遷移確認イベント" }); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  await expected(async () => {
    await expect(page, "イベント一覧画面へ遷移する").toHaveURL(/\/event(\/page\/\d+)?(\?.*)?$/);
  });
});

caseTest("IT-M13-02-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-012〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => {
    const form = await openEventCreate(page);
    await form.fill({ イベント名日: "登録者確認イベント", イベント名英: "Before Event-012", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "500" });
    await form.submit(form.登録ボタン);
  });
  await step(2, async () => {
    const form = await openEventEdit(page, id);
    await form.fill({ イベント名日: "更新者確認イベント" });
    await form.submit(form.更新ボタン);
  });
  let 新規: 保存イベント[] = [];
  let 更新!: 保存イベント;
  await step(3, async () => { 新規 = イベント名で探す("登録者確認イベント"); 更新 = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    expect(新規.length, "新規登録したイベントの件数").toBe(1);
    expect.soft(更新["イベント名(日)"], "更新したイベントのイベント名(日)").toBe("更新者確認イベント");
    // 正本の期待は「ログイン中の管理者ID 1302」。両方を確かめる（ログイン中の管理者であること／その管理者IDが 1302 であること）
    const ログイン中 = 管理者ID(M1302_ADMIN.loginId);
    expect.soft(新規[0].登録者の管理者ID, "新規登録したイベントの登録者が、ログイン中の管理者である").toBe(ログイン中);
    expect.soft(更新.登録者の管理者ID, "更新したイベントの登録者が、ログイン中の管理者である").toBe(ログイン中);
    expect.soft(新規[0].登録者の管理者ID, "新規登録したイベントの登録者の管理者ID").toBe("1302");
    expect.soft(更新.登録者の管理者ID, "更新したイベントの登録者の管理者ID").toBe("1302");
  });
});

caseTest("IT-M13-02-013", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-013〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  const 空 = { 項目名日: "", 項目名英: "", 内容日: "", 内容英: "", 初期表示は閉じる: false };
  await step(2, async () => { await form.fill({ バナーURL日: "", バナーURL英: "", チーム戦: false, 支払方法: [], 賞品日: "", 賞品英: "", フリー入力エリア: [空, 空, 空] }); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    const { イベントID: _i, 登録者の管理者ID: _m, 更新日時: _u, イベント規模: _s, ...rest } = got;
    expect.soft(rest).toEqual({
      "イベント名(日)": "編集前イベント-013", "イベント名(英)": "Before Event-013", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開",
      "バナーURL(日)": "", "バナーURL(英)": "", 定員: "16", チーム戦: "偽", 支払方法: [], 参加費: "500", "賞品(日)": "", "賞品(英)": "",
      フリー入力エリア: [1, 2, 3].map(() => ({ "項目名(日)": "", "項目名(英)": "", "内容(日)": "", "内容(英)": "", 初期表示は閉じる: "偽" })),
    });
  });
});

/** 必須項目（イベント名(日)・イベント名(英)・店舗・会場・フォーマット・ルール適用度・公開状態・定員・参加費）を空にする */
async function 必須項目を空にする(form: EventForm): Promise<void> {
  const fields: [string, ReturnType<EventForm["field"]>][] = [
    ["イベント名(日)", form.イベント名日], ["イベント名(英)", form.イベント名英], ["店舗", form.店舗], ["会場", form.会場], ["フォーマット", form.フォーマット],
    ["ルール適用度", form.ルール適用度], ["公開状態", form.公開状態], ["定員", form.定員], ["参加費", form.参加費],
  ];
  for (const [what, f] of fields) note(await form.clear(f, what));
}

caseTest("IT-M13-02-014", async ({ page, notes, step, expected }) => {
  const 管理者 = notes.get("〔管理者ID-M1302-014〕");
  expect(登録者のイベント件数(管理者), "事前準備: この管理者を登録者とするイベントが0件").toBe(0);
  const 前の最大 = 最大のイベントID();
  await loginAdmin(page, M1302_ADMIN_014);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  await step(2, async () => { await 必須項目を空にする(form); });
  await step(3, async () => { await form.submit(form.登録ボタン); });
  let 件数 = -1, 後の最大 = "";
  await step(4, async () => { 件数 = 登録者のイベント件数(管理者); 後の最大 = 最大のイベントID(); });
  await expected(async () => {
    expect.soft(件数, "この管理者を登録者とするイベントの件数").toBe(0);
    // 登録者が別の管理者・登録者なしで追加されていないこと（送信の前後で、新しいイベントIDが振られていない）
    expect.soft(後の最大, "送信の前後で、いちばん新しいイベントID").toBe(前の最大);
  });
});

/** 編集画面で入力して更新し、DBの保存内容が更新の前と同じこと（更新されないこと）を確かめるケース */
function 更新されない(n: string, 入力: (form: EventForm) => Promise<void>, 見る項目?: (keyof 保存イベント)[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    const before = 必ずある(保存されているイベント(id), id);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => { await 入力(form); });
    await step(3, async () => { await form.submit(form.更新ボタン); });
    let after!: 保存イベント;
    await step(4, async () => { after = 必ずある(保存されているイベント(id), id); });
    await expected(async () => {
      if (見る項目) for (const k of 見る項目) expect.soft(after[k], String(k)).toEqual(before[k]);
      else expect.soft(after, "保存内容が更新の前と同じ").toEqual(before);
    });
  };
}

caseTest("IT-M13-02-015", 更新されない("015", 必須項目を空にする));

const 文字数ケースの項目名 = (v: string) => ({ イベント名日: v, イベント名英: v, バナーURL日: v, バナーURL英: v, フリー入力エリア: [1, 2, 3].map(() => ({ 項目名日: v, 項目名英: v })) as [object, object, object] });
const 文字数ケースの内容 = (v: string) => ({ 賞品日: v, 賞品英: v, フリー入力エリア: [1, 2, 3].map(() => ({ 内容日: v, 内容英: v })) as [object, object, object] });

caseTest("IT-M13-02-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-016〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.fill(文字数ケースの項目名(あ(255))); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    for (const k of ["イベント名(日)", "イベント名(英)", "バナーURL(日)", "バナーURL(英)"] as const) expect.soft(got[k], k).toBe(あ(255));
    got.フリー入力エリア.forEach((a, i) => {
      expect.soft(a["項目名(日)"], `フリー入力エリア${i + 1}の項目名(日)`).toBe(あ(255));
      expect.soft(a["項目名(英)"], `フリー入力エリア${i + 1}の項目名(英)`).toBe(あ(255));
    });
  });
});

caseTest("IT-M13-02-017", 更新されない("017", (form) => form.fill(文字数ケースの項目名(あ(256)))));

caseTest("IT-M13-02-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-018〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.fill(文字数ケースの内容(あ(4096))); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    for (const k of ["賞品(日)", "賞品(英)"] as const) expect.soft(got[k] === あ(4096), `${k}が「あ」4096文字（実際は ${got[k].length} 文字）`).toBe(true);
    got.フリー入力エリア.forEach((a, i) => {
      for (const k of ["内容(日)", "内容(英)"] as const) expect.soft(a[k] === あ(4096), `フリー入力エリア${i + 1}の${k}が「あ」4096文字（実際は ${a[k].length} 文字）`).toBe(true);
    });
  });
});

caseTest("IT-M13-02-019", 更新されない("019", (form) => form.fill(文字数ケースの内容(あ(4097)))));

/** 定員と参加費を入力して更新し、DBの定員と参加費を確かめるケース */
function 定員参加費が更新される(n: string, 定員: string, 参加費: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => { await form.fill({ 定員, 参加費 }); });
    await step(3, async () => { await form.submit(form.更新ボタン); });
    let got!: 保存イベント;
    await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
    await expected(async () => {
      expect.soft(got.定員, "定員").toBe(定員);
      expect.soft(got.参加費, "参加費").toBe(参加費);
    });
  };
}
/** 定員16・参加費500 が更新されないことを確かめるケース */
function 定員参加費が更新されない(n: string, 入力: (form: EventForm) => Promise<void>): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => { await 入力(form); });
    await step(3, async () => { await form.submit(form.更新ボタン); });
    let got!: 保存イベント;
    await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
    await expected(async () => {
      expect.soft(got.定員, "定員").toBe("16");
      expect.soft(got.参加費, "参加費").toBe("500");
    });
  };
}

caseTest("IT-M13-02-020", 定員参加費が更新される("020", "1", "0"));
caseTest("IT-M13-02-021", 定員参加費が更新されない("021", (form) => form.fill({ 定員: "0", 参加費: "-1" })));
caseTest("IT-M13-02-022", 定員参加費が更新される("022", "99999999", "99999999"));
caseTest("IT-M13-02-023", 定員参加費が更新されない("023", (form) => form.fill({ 定員: "100000000", 参加費: "100000000" })));
caseTest("IT-M13-02-024", 定員参加費が更新されない("024", async (form) => { await form.forceValue(form.定員, "1.5"); await form.forceValue(form.参加費, "abc"); }));

caseTest("IT-M13-02-025", 更新されない("025", (form) => form.fill({ バナーURL日: "https://admin.hareruyamtg.com/jp", バナーURL英: "https://admin.hareruyamtg.com/en" }), ["バナーURL(日)", "バナーURL(英)"]));

caseTest("IT-M13-02-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  await step(2, async () => {
    await form.fill({ イベント名日: "権限外登録イベント-026", イベント名英: "Unauthorized Event 026", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "500" });
  });
  await step(3, async () => { await form.forceOption(form.店舗, notes.get("〔店舗ID-M1302-共有B〕")); });
  await step(4, async () => { await form.submit(form.登録ボタン); });
  let found: 保存イベント[] = [];
  await step(5, async () => { found = イベント名で探す("権限外登録イベント-026"); });
  await expected(async () => {
    // 同じイベント名は事前準備で0件にしてある。店舗Bに限らず、このイベント名のイベントが1件も追加されていないこと
    expect(found.map((e) => `イベントID ${e.イベントID}（${e.店舗}）`), "入力したイベント名のイベントが追加されていない").toEqual([]);
  });
});

caseTest("IT-M13-02-027", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-027〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.forceOption(form.店舗, notes.get("〔店舗ID-M1302-共有B〕")); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(4, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    expect(got.店舗, "店舗").toBe("店舗A");
  });
});

caseTest("IT-M13-02-028", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-028〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await openEventEdit(page, id); });
  /** 選んで更新し、DBの値を記録する。選べない・更新できないときは、その理由を記録する */
  const 記録: { 項目: "イベント規模" | "ルール適用度"; 選択: string; 保存値: string }[] = [];
  const 選んで更新 = async (項目: "イベント規模" | "ルール適用度", 選択: string) => {
    let 保存値: string;
    try {
      const form = await openEventEdit(page, id);
      await form.fill({ [項目]: 選択 });
      await form.submit(form.更新ボタン);
      保存値 = 必ずある(保存されているイベント(id), id)[項目];
    } catch (e) {
      保存値 = `（更新できない: ${(e as Error).message.split("\n")[0]}）`;
    }
    記録.push({ 項目, 選択, 保存値 });
  };
  await step(2, async () => { for (const v of ["大型イベント", "特別イベント", "デイリーイベント", "おすすめイベント"]) await 選んで更新("イベント規模", v); });
  await step(3, async () => { for (const v of ["初心者歓迎", "カジュアル対戦", "上級者向け"]) await 選んで更新("ルール適用度", v); });
  await expected(async () => {
    expect(記録.length).toBe(7);
    for (const r of 記録) expect.soft(r.保存値, `${r.項目}で「${r.選択}」を選んで更新したときの保存値`).toBe(r.選択);
  });
});

caseTest("IT-M13-02-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-029〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  let オン = "", オフ = "";
  await step(2, async () => { await form.fill({ チーム戦: true }); await form.submit(form.更新ボタン); オン = 必ずある(保存されているイベント(id), id).チーム戦; });
  await step(3, async () => { form = await openEventEdit(page, id); });
  await step(4, async () => { await form.fill({ チーム戦: false }); await form.submit(form.更新ボタン); オフ = 必ずある(保存されているイベント(id), id).チーム戦; });
  await expected(async () => {
    expect.soft(オン, "チーム戦をオンにして更新したときの保存値").toBe("真");
    expect.soft(オフ, "チーム戦をオフにして更新したときの保存値").toBe("偽");
  });
});

caseTest("IT-M13-02-032", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-032〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  const 二行 = (名前: string) => `${名前}の1行目\n${名前}の2行目`;
  const 入力値 = { 賞品日: 二行("賞品(日)"), 賞品英: 二行("Prize"), 内容日: (n: number) => 二行(`内容${n}(日)`), 内容英: (n: number) => 二行(`Content${n}`) };
  await step(2, async () => {
    await form.fill({ 賞品日: 入力値.賞品日, 賞品英: 入力値.賞品英, フリー入力エリア: [1, 2, 3].map((n) => ({ 内容日: 入力値.内容日(n), 内容英: 入力値.内容英(n) })) as [object, object, object] });
  });
  await step(3, async () => { await form.改行タグ挿入ボタン.click(); });
  await step(4, async () => { await form.submit(form.更新ボタン); });
  let got!: 保存イベント;
  await step(5, async () => { got = 必ずある(保存されているイベント(id), id); });
  await expected(async () => {
    const 各行にbr = (v: string) => v.split("\n").map((l) => `${l}<br>`).join("\n");
    expect.soft(行末をそろえる(got["賞品(日)"]), "賞品(日)").toBe(各行にbr(入力値.賞品日));
    expect.soft(行末をそろえる(got["賞品(英)"]), "賞品(英)").toBe(各行にbr(入力値.賞品英));
    got.フリー入力エリア.forEach((a, i) => {
      expect.soft(行末をそろえる(a["内容(日)"]), `フリー入力エリア${i + 1}の内容(日)`).toBe(各行にbr(入力値.内容日(i + 1)));
      expect.soft(行末をそろえる(a["内容(英)"]), `フリー入力エリア${i + 1}の内容(英)`).toBe(各行にbr(入力値.内容英(i + 1)));
    });
  });
});
