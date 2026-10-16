/**
 * M13-02 イベント登録/編集 のシードの作り方（画面操作）。
 * 値はシード表（integration_test/casegen/cases/M13-02_seed_data.tsv）の状態・属性と投入方法のとおり。
 */
import { SETUP_ADMIN } from "../config/env";
import { entryMemberNames } from "./members";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { Page } from "@playwright/test";
import { EventInput, FreeArea, ensureNoEvent, openEventCreate, openEventSearchPage, registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { registerDeck } from "../pages/admin/deck";
import { registerEntries } from "../pages/admin/entry";
import { registerSchedule, ScheduleInput, turnOffOnlineEntry } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";

/** S-M13-02-ADM の試験管理者（店舗Aだけに編集権限を持つ） */
export const M1302_ADMIN: Account = { loginId: "m1302_admin", password: "Passw0rd!M1302" };

defineSeed("S-M13-02-MASTERS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1302-共有A〕", await ensureTenant(page, { 店名: "店舗A", 店名カナ: "テンポエー", 店名英語: "Shop A", 支店URL: "m1302a", 店名略称3文字: "テA", ショップ名略称: "店舗A" }, issue));
    notes.set("〔店舗ID-M1302-共有B〕", await ensureTenant(page, { 店名: "店舗B", 店名カナ: "テンポビー", 店名英語: "Shop B", 支店URL: "m1302b", 店名略称3文字: "テB", ショップ名略称: "店舗B" }, issue));
    // シード表の投入方法: 初期データの選択肢が、イベント登録画面の各選択欄に表示されることを確かめる。
    // 無い選択肢は、作れなかったことにせず問題として報告する（その選択肢を使うケースは、選ぶところで落ちる）
    const form = await openEventCreate(page);
    const 求める選択肢: [string, string[], string[]][] = [
      ["フォーマット", ["スタンダード", "モダン"], await form.options(form.フォーマット)],
      ["ルール適用度", ["初心者歓迎", "カジュアル対戦", "上級者向け"], await form.options(form.ルール適用度)],
      ["公開状態", ["公開"], await form.options(form.公開状態)],
      ["イベント規模", ["おすすめイベント", "デイリーイベント", "特別イベント", "大型イベント"], await form.options(form.イベント規模)],
      ["支払方法", ["クレジットカード決済"], await form.支払方法の選択肢()],
    ];
    for (const [欄, 求める, ある] of 求める選択肢) {
      const 無い = 求める.filter((x) => !ある.includes(x));
      if (無い.length) issue(`イベント登録画面の${欄}に、シード表の選択肢「${無い.join("」「")}」が無い（ある選択肢: ${ある.join("、")}）`);
    }
  });
});

// 店舗Aが先に要る（シード表の投入方法: 店舗Aだけに編集権限を設定する）。店舗は S-M13-02-MASTERS が作る
defineSeed("S-M13-02-ADM", { needs: ["S-M13-02-MASTERS"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-02 試験管理者", 所属店舗: "店舗A", ログインID: M1302_ADMIN.loginId, メールアドレス: "m1302_admin@example.test",
      パスワード: M1302_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    });
  });
});

/**
 * 「編集前イベント-NNN」の形のイベントに共通の値（イベント名・店舗・フォーマット・ルール適用度・公開状態・定員・参加費）。
 * シードごとに入れる項目は over で与える。書いていない項目は、シード表のとおり初期表示のままにする。
 */
export function baseEvent(n: string, over: EventInput = {}): EventInput {
  return {
    イベント名日: `編集前イベント-${n}`, イベント名英: `Before Event-${n}`, 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
    公開状態: "公開", 定員: "16", 参加費: "500", ...over,
  };
}

const クレカ = { 支払方法: ["クレジットカード決済"] };
const バナー = { バナーURL日: "https://example.com/before-jp", バナーURL英: "https://example.com/before-en" };
const 賞品 = { 賞品日: "編集前賞品", 賞品英: "Before Prize" };
/** フリー入力エリア1〜3。項目名(日)=項目n・項目名(英)=Item{n}-NNN・内容(日)=内容n・内容(英)=Content{n}-NNN のうち、which に挙げたものだけ入れる */
function フリー(n: string, which: ("項目名" | "内容")[], 初期表示は閉じる?: boolean): Pick<EventInput, "フリー入力エリア"> {
  const area = (i: number): FreeArea => ({
    ...(which.includes("項目名") ? { 項目名日: `項目${i}`, 項目名英: `Item${i}-${n}` } : {}),
    ...(which.includes("内容") ? { 内容日: `内容${i}`, 内容英: `Content${i}-${n}` } : {}),
    ...(初期表示は閉じる === undefined ? {} : { 初期表示は閉じる }),
  });
  return { フリー入力エリア: [area(1), area(2), area(3)] };
}

/** 店舗Aに編集権限を持つ試験管理者で、イベント登録画面からイベントを登録し、イベントIDを控える */
function defineEventSeed(seedId: string, label: string, input: EventInput, after?: (page: Page) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1302_ADMIN, async (page) => {
      notes.set(label, await registerEvent(page, input));
      if (after) await after(page);
    });
  });
}

/** 入力値は投入不要。そのイベント名のイベントを検索し、あれば削除して0件を確かめる */
function defineNoEventSeed(seedId: string, イベント名日: string): void {
  defineSeed(seedId, { needs: ["S-M13-02-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M1302_ADMIN, (page) => ensureNoEvent(page, イベント名日));
  });
}

const 規模 = { イベント規模: "おすすめイベント" };

defineEventSeed("S-M13-02-BASE-002", "〔イベントID-M1302-002〕", baseEvent("002", { ...規模, ...バナー, チーム戦: false, ...クレカ, ...賞品, ...フリー("002", ["項目名", "内容"], false) }));
defineEventSeed("S-M13-02-BASE-005", "〔イベントID-M1302-005〕", baseEvent("005", { ...規模, チーム戦: false, ...クレカ }));
defineNoEventSeed("S-M13-02-NEW-008", "結合試験イベント");
defineNoEventSeed("S-M13-02-NEW-009", "正常登録イベント-009");
defineEventSeed("S-M13-02-BASE-010", "〔イベントID-M1302-010〕", baseEvent("010", { ...規模, チーム戦: false, ...クレカ }));
defineEventSeed("S-M13-02-BASE-011", "〔イベントID-M1302-011〕", baseEvent("011", クレカ));
defineEventSeed("S-M13-02-BASE-012", "〔イベントID-M1302-012〕", baseEvent("012", クレカ), (page) => ensureNoEvent(page, "登録者確認イベント"));
defineEventSeed("S-M13-02-BASE-013", "〔イベントID-M1302-013〕", baseEvent("013", { ...バナー, チーム戦: true, ...クレカ, ...賞品, ...フリー("013", ["項目名", "内容"]) }));
defineEventSeed("S-M13-02-BASE-015", "〔イベントID-M1302-015〕", baseEvent("015", クレカ));
defineEventSeed("S-M13-02-BASE-016", "〔イベントID-M1302-016〕", baseEvent("016", { ...バナー, ...フリー("016", ["項目名"]) }));
defineEventSeed("S-M13-02-BASE-017", "〔イベントID-M1302-017〕", baseEvent("017", { ...バナー, ...フリー("017", ["項目名"]) }));
defineEventSeed("S-M13-02-BASE-018", "〔イベントID-M1302-018〕", baseEvent("018", { ...賞品, ...フリー("018", ["内容"]) }));
defineEventSeed("S-M13-02-BASE-019", "〔イベントID-M1302-019〕", baseEvent("019", { ...賞品, ...フリー("019", ["内容"]) }));
defineEventSeed("S-M13-02-BASE-020", "〔イベントID-M1302-020〕", baseEvent("020"));
defineEventSeed("S-M13-02-BASE-021", "〔イベントID-M1302-021〕", baseEvent("021"));
defineEventSeed("S-M13-02-BASE-022", "〔イベントID-M1302-022〕", baseEvent("022"));
defineEventSeed("S-M13-02-BASE-023", "〔イベントID-M1302-023〕", baseEvent("023"));
defineEventSeed("S-M13-02-BASE-024", "〔イベントID-M1302-024〕", baseEvent("024"));
defineEventSeed("S-M13-02-BASE-025", "〔イベントID-M1302-025〕", baseEvent("025", バナー));
defineNoEventSeed("S-M13-02-NEW-026", "権限外登録イベント-026");
defineEventSeed("S-M13-02-BASE-027", "〔イベントID-M1302-027〕", baseEvent("027", { イベント名英: "Before Event-M1302-027" }));
defineEventSeed("S-M13-02-BASE-028", "〔イベントID-M1302-028〕", baseEvent("028", 規模));
defineEventSeed("S-M13-02-BASE-029", "〔イベントID-M1302-029〕", baseEvent("029", { チーム戦: false }));
defineEventSeed("S-M13-02-BASE-032", "〔イベントID-M1302-032〕", baseEvent("032", { ...賞品, ...フリー("032", ["内容"]) }));

/** S-M13-02-ADM-014 の管理者（IT-M13-02-014 専用。この管理者を登録者とするイベントは0件） */
export const M1302_ADMIN_014: Account = { loginId: "m1302_admin-014", password: "M1302014Passw0rd" };

defineSeed("S-M13-02-ADM-014", { needs: ["S-M13-02-MASTERS"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔管理者ID-M1302-014〕", await ensureMember(page, {
      名前: "M13-02 管理者014", 所属店舗: "店舗A", ログインID: M1302_ADMIN_014.loginId, メールアドレス: "m1302_admin-014@example.test",
      パスワード: M1302_ADMIN_014.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    }));
  });
});

// ---- 日程を持つイベント（「日程操作イベント-NNN」）

/** シード表が値を定めていない項目（イベント名(英)・フォーマット・ルール適用度・定員・参加費）は、投入方法に書いてある値を入れる */
function dateEvent(n: string, over: EventInput = {}): EventInput {
  return {
    イベント名日: `日程操作イベント-${n}`, イベント名英: `Date Event-${n}`, 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
    公開状態: "公開", 定員: "16", 参加費: "500", ...over,
  };
}
/** 受付あり・デッキ登録ありのチェックを外し、オンライン受付ありは入れないままの日程 */
const 日程 = (開始時間: string): ScheduleInput => ({ 開始時間, 受付あり: false, デッキ登録あり: false });

/**
 * 試験管理者でイベントを登録し、日程を順に登録して、イベントIDと日程IDを控える。
 * schedules は [日程IDの呼び名の末尾（"" や "A"）, 日程] の並び。
 */
function defineDatesSeed(seedId: string, n: string, input: EventInput, schedules: [string, ScheduleInput][], account: Account = M1302_ADMIN, needs = ["S-M13-02-ADM"]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    await withAdminSession(browser, account, async (page) => {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-${n}〕`, id);
      for (const [suffix, v] of schedules) notes.set(`〔日程ID-M1302-${n}${suffix}〕`, await registerSchedule(page, id, v));
    });
  });
}

defineDatesSeed("S-M13-02-DATES-003", "003", dateEvent("003"), [["A", 日程("2026-12-01 10:00")], ["B", 日程("2026-11-01 10:00")], ["C", 日程("2026-10-01 10:00")], ["D", 日程("2026-09-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-006", "006", dateEvent("006"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-035", "035", dateEvent("035"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-036", "036", dateEvent("036"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-037", "037", dateEvent("037"), [["", 日程("2026-11-01 10:00")]]);
defineEventSeed("S-M13-02-BASE-038", "〔イベントID-M1302-038〕", baseEvent("038"));
defineDatesSeed("S-M13-02-DATES-040", "040", dateEvent("040"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-041", "041", dateEvent("041"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-042", "042", dateEvent("042"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-043", "043", dateEvent("043"), [["A", 日程("2026-11-01 10:00")], ["B", 日程("2026-12-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-044", "044", dateEvent("044"), [["A", 日程("2026-11-01 10:00")], ["B", 日程("2026-12-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-045", "045", dateEvent("045"), [["", 日程("2026-11-01 10:00")]]);

// ---- 店舗Bのイベント（試験管理者には編集権限が無い）

/** 店舗Bに編集権限を持つ管理者。シード表の投入方法: 無ければメンバー登録画面で編集可能店舗に「店舗B」を選んで登録しておく */
export const M1302_ADMIN_B: Account = { loginId: "m1302_admin_b", password: "Passw0rd!M1302B" };

async function ensureAdminB(browser: import("@playwright/test").Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-02 店舗B管理者", 所属店舗: "店舗B", ログインID: M1302_ADMIN_B.loginId, メールアドレス: "m1302_admin_b@example.test",
      パスワード: M1302_ADMIN_B.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗B", 編集可能店舗: ["店舗B"],
    });
  });
}

/** 店舗Bのイベント（イベント名は投入方法のとおり）と日程1件を、店舗Bの管理者で登録する */
function defineNoAuthSeed(seedId: string, n: string, input: EventInput, schedules: [string, ScheduleInput][]): void {
  defineSeed(seedId, { needs: ["S-M13-02-MASTERS"] }, async ({ browser, notes }) => {
    await ensureAdminB(browser);
    await withAdminSession(browser, M1302_ADMIN_B, async (page) => {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-${n}〕`, id);
      for (const [suffix, v] of schedules) notes.set(`〔日程ID-M1302-${n}${suffix}〕`, await registerSchedule(page, id, v));
    });
  });
}

defineNoAuthSeed("S-M13-02-NOAUTH-007", "007", dateEvent("007", { イベント名日: "権限外イベント-007", イベント名英: "No Auth Event-007", 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);

// ---- 削除・権限・なりすまし対策トークンのケース用

defineSeed("S-M13-02-OTHER-DATE-052", { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1302_ADMIN, async (page) => {
    for (const [x, input] of [["A", dateEvent("052")], ["B", dateEvent("052", { イベント名日: "他イベント-052", イベント名英: "Other Event-052" })]] as const) {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-052${x}〕`, id);
      notes.set(`〔日程ID-M1302-052${x}〕`, await registerSchedule(page, id, 日程("2026-11-01 10:00")));
    }
  });
});
defineNoAuthSeed("S-M13-02-NOAUTH-053", "053", dateEvent("053", { イベント名日: "権限外イベント-053", イベント名英: "No Auth Event-053", 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-054", "054", dateEvent("054"), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-055", "055", dateEvent("055"), [["", 日程("2026-11-01 10:00")]]);
defineEventSeed("S-M13-02-BASE-056", "〔イベントID-M1302-056〕", baseEvent("056"));
defineEventSeed("S-M13-02-BASE-058", "〔イベントID-M1302-058〕", baseEvent("058"));
defineNoAuthSeed("S-M13-02-NOAUTH-059", "059", dateEvent("059", { イベント名日: "権限外イベント-059", イベント名英: "No Auth Event-059", 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);
defineEventSeed("S-M13-02-BASE-060", "〔イベントID-M1302-060〕", baseEvent("060"));
defineEventSeed("S-M13-02-BASE-061", "〔イベントID-M1302-061〕", baseEvent("061"));
defineDatesSeed("S-M13-02-DATES-062", "062", dateEvent("062"), [["", 日程("2026-11-01 10:00")]]);

// ---- IT-M13-02-066〜083 用

const evt = (n: string, over: EventInput = {}): EventInput => dateEvent(n, { イベント名日: `M1302-${n}-EVT`, イベント名英: `M1302-${n}-EVT-EN`, ...over });

defineNoAuthSeed("S-M13-02-NOAUTH-066", "066", evt("066", { イベント名日: "M1302-066-BEFORE", イベント名英: "M1302-066-BEFORE-EN", 店舗: "店舗B" }), []);
defineEventSeed("S-M13-02-BASE-067", "〔イベントID-M1302-067〕", evt("067", { チーム戦: false }));
defineEventSeed("S-M13-02-BASE-068", "〔イベントID-M1302-068〕", evt("068", { チーム戦: false }));
// 入力値は投入不要（フォーマットのスタンダード・モダンは共有のマスターを使う）
defineSeed("S-M13-02-NEW-069", { needs: ["S-M13-02-MASTERS"] }, async () => {});
defineEventSeed("S-M13-02-BASE-070", "〔イベントID-M1302-070〕", evt("070"));
defineEventSeed("S-M13-02-BASE-071", "〔イベントID-M1302-071〕", evt("071"));

/** S-M13-02-ADM-072 の管理者（IT-M13-02-072 専用） */
export const M1302_ADMIN_072: Account = { loginId: "M1302-072-ADM", password: "M1302-072-Pw" };
defineSeed("S-M13-02-ADM-072", { needs: ["S-M13-02-MASTERS"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔管理者ID-M1302-072〕", await ensureMember(page, {
      名前: "M13-02 管理者072", 所属店舗: "店舗A", ログインID: M1302_ADMIN_072.loginId, メールアドレス: "m1302-072-adm@example.test",
      パスワード: M1302_ADMIN_072.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    }));
  });
});

defineDatesSeed("S-M13-02-DATES-073", "073", evt("073", クレカ), [["", {
  開始時間: "2026-11-01 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:50" }, デッキ登録あり: true, デッキ登録締切: "2026-10-31 18:00",
  オンライン受付: { 開始: "2026-10-25 12:00", 終了: "2026-10-31 23:00" },
}]]);
defineNoAuthSeed("S-M13-02-NOAUTH-074", "074", evt("074", { 店舗: "店舗B" }), []);
defineNoAuthSeed("S-M13-02-NOAUTH-075", "075", evt("075", { 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);
defineSeed("S-M13-02-OTHER-DATE-076", { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1302_ADMIN, async (page) => {
    for (const [x, input] of [["A", evt("076")], ["B", evt("076", { イベント名日: "M1302-076-OTHER", イベント名英: "M1302-076-OTHER-EN" })]] as const) {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-076${x}〕`, id);
      notes.set(`〔日程ID-M1302-076${x}〕`, await registerSchedule(page, id, 日程("2026-11-01 10:00")));
    }
  });
});
defineNoAuthSeed("S-M13-02-NOAUTH-079", "079", evt("079", { 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);
// 投入不要（新規イベント登録画面を未入力のまま開く）
defineSeed("S-M13-02-NEW-081", { needs: ["S-M13-02-ADM"] }, async () => {});
defineNoAuthSeed("S-M13-02-NOAUTH-083", "083", evt("083", { 店舗: "店舗B" }), [["", 日程("2026-11-01 10:00")]]);

// ---- 申込のある日程（イベント申込登録の検索に出るのはオンライン受付ありの日程だけなので、申込を登録する日程はオンライン受付ありで登録する）

const オンライン日程 = (開始時間: string, 開始: string, 終了: string): ScheduleInput => ({ 開始時間, 受付あり: false, デッキ登録あり: false, オンライン受付: { 開始, 終了 } });
const 十一月オンライン = オンライン日程("2026-11-01 10:00", "2026-10-25 12:00", "2026-10-31 23:00");
const 十二月オンライン = オンライン日程("2026-12-01 10:00", "2026-11-24 12:00", "2026-11-30 23:00");


/**
 * イベントと日程を登録し、申込日程（呼び名の末尾 entry.suffix の日程）に申込を登録して、イベントID・日程ID・申込IDを控える。
 * entry.labels は申込IDの呼び名の末尾（"" や "A"）。
 */
function defineEntrySeed(seedId: string, n: string, input: EventInput, schedules: [string, ScheduleInput][], entry: { suffix: string; labels: string[] }, after?: (page: Page, イベントID: string, 日程ID: string) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
    // 申込に使う会員（会員登録済み。いなければフロントの新規会員登録画面で登録する）。人数ぶんを先頭から使う
    const 会員 = await entryMemberNames(browser, entry.labels.length);
    await withAdminSession(browser, M1302_ADMIN, async (page) => {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-${n}〕`, id);
      for (const [suffix, v] of schedules) notes.set(`〔日程ID-M1302-${n}${suffix}〕`, await registerSchedule(page, id, v));
      const 申込日程 = schedules.find(([suffix]) => suffix === entry.suffix)![1];
      const ids = await registerEntries(page, input.イベント名日!, notes.get(`〔日程ID-M1302-${n}${entry.suffix}〕`), 申込日程.開始時間, 会員);
      entry.labels.forEach((l, i) => notes.set(`〔申込ID-M1302-${n}${l}〕`, ids[i]));
      if (after) await after(page, id, notes.get(`〔日程ID-M1302-${n}${entry.suffix}〕`));
    });
  });
}

const 無料 = { 参加費: "0" };
defineEntrySeed("S-M13-02-DATES-004", "004", dateEvent("004", 無料), [["A", 日程("2026-11-01 10:00")], ["B", 十二月オンライン]], { suffix: "B", labels: ["A", "B"] });
// 申込を登録したあと、日程編集画面で「オンライン受付あり」を外して保存する（オンライン受付なしにする）
defineEntrySeed("S-M13-02-APPLIED-033", "033", dateEvent("033", { イベント名日: "申込済みイベント-033", イベント名英: "Applied Event-033", ...無料, ...クレカ }), [["", 十一月オンライン]], { suffix: "", labels: [""] }, turnOffOnlineEntry);
defineDatesSeed("S-M13-02-PAID-ONLINE-034", "034", dateEvent("034", { イベント名日: "有料オンライン受付イベント-034", イベント名英: "Paid Online Event-034", ...クレカ }), [["", 十一月オンライン]]);
defineEntrySeed("S-M13-02-DATES-039", "039", dateEvent("039", 無料), [["", 十一月オンライン]], { suffix: "", labels: ["A", "B"] });
defineEntrySeed("S-M13-02-DATES-047", "047", dateEvent("047", 無料), [["", 十一月オンライン]], { suffix: "", labels: [""] });
defineEntrySeed("S-M13-02-DATES-049", "049", dateEvent("049", 無料), [["", 十一月オンライン]], { suffix: "", labels: [""] });
defineEntrySeed("S-M13-02-DATES-051", "051", dateEvent("051", 無料), [["A", 日程("2026-11-01 10:00")], ["B", 十二月オンライン]], { suffix: "B", labels: [""] });
defineEntrySeed("S-M13-02-DATES-078", "078", evt("078", 無料), [["", 十一月オンライン]], { suffix: "", labels: [""] });
defineEntrySeed("S-M13-02-DATES-082", "082", evt("082", 無料), [["A", 日程("2026-11-01 10:00")], ["B", 十二月オンライン]], { suffix: "B", labels: [""] });

// ---- デッキ登録のある日程

/** イベントと日程を登録し、呼び名の末尾 deckSuffix の日程にデッキ「M1302-NNN-DECK」を登録して、イベントID・日程ID・デッキIDを控える */
function defineDeckSeed(seedId: string, n: string, input: EventInput, schedules: [string, ScheduleInput][], deckSuffix: string): void {
  defineSeed(seedId, { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1302_ADMIN, async (page) => {
      const id = await registerEvent(page, input);
      notes.set(`〔イベントID-M1302-${n}〕`, id);
      for (const [suffix, v] of schedules) notes.set(`〔日程ID-M1302-${n}${suffix}〕`, await registerSchedule(page, id, v));
      const 対象 = schedules.find(([suffix]) => suffix === deckSuffix)![1];
      notes.set(`〔デッキID-M1302-${n}〕`, await registerDeck(page, {
        デッキ名: `M1302-${n}-DECK`, フォーマット: "スタンダード", イベント名: input.イベント名日!, 日程ID: notes.get(`〔日程ID-M1302-${n}${deckSuffix}〕`), 開催日: 対象.開始時間,
      }));
    });
  });
}

defineDeckSeed("S-M13-02-DATES-046", "046", dateEvent("046"), [["", 日程("2026-11-01 10:00")]], "");
defineDeckSeed("S-M13-02-DATES-048", "048", dateEvent("048"), [["", 日程("2026-11-01 10:00")]], "");
defineDeckSeed("S-M13-02-DATES-050", "050", dateEvent("050"), [["A", 日程("2026-11-01 10:00")], ["B", 日程("2026-12-01 10:00")]], "B");
defineDeckSeed("S-M13-02-DATES-077", "077", evt("077"), [["", 日程("2026-11-01 10:00")]], "");
defineDeckSeed("S-M13-02-DATES-080", "080", evt("080"), [["A", 日程("2026-11-01 10:00")], ["B", 日程("2026-12-01 10:00")]], "B");

// ---- 公開側のイベント詳細画面で見る日程（フリー入力エリアは空のまま登録する）

defineDatesSeed("S-M13-02-DATES-030", "030", dateEvent("030", { フリー入力エリア: [{ 初期表示は閉じる: false }, { 初期表示は閉じる: false }, { 初期表示は閉じる: false }] }), [["", 日程("2026-11-01 10:00")]]);
defineDatesSeed("S-M13-02-DATES-031", "031", dateEvent("031"), [["A", 日程("2026-11-01 10:00")], ["B", 日程("2026-09-01 10:00")]]);

// ---- 検索結果のページ送り（イベント31件）

defineSeed("S-M13-02-PAGING-057", { needs: ["S-M13-02-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1302_ADMIN, async (page) => {
    const ids: string[] = [];
    for (let i = 1; i <= 31; i++) {
      const no = String(i).padStart(2, "0");
      ids.push(await registerEvent(page, dateEvent("057", { イベント名日: `M1302-PAGING-057-${no}`, イベント名英: `M1302-PAGING-057-${no}-EN` })));
    }
    // イベント名で検索し、表示件数10・ID降順に設定して、検索結果が31件であること、3ページ目の先頭が11件目に登録したイベントであることを確かめる
    const { ids: page3, 件数 } = await openEventSearchPage(page, "M1302-PAGING-057", 10, 3);
    if (件数 !== 31) throw new Error(`イベント名「M1302-PAGING-057」の検索結果が ${件数} 件（シード表は、この31件だけであることを求めている）`);
    if (page3[0] !== ids[10]) throw new Error(`検索結果3ページ目の先頭がイベントID ${page3[0]}（11件目に登録したイベントID ${ids[10]} のはず）`);
    notes.set("〔イベントID-M1302-057A〕", ids[0]);
    notes.set("〔イベントID-M1302-057B〕", ids[30]);
    notes.set("〔イベントID-M1302-057C〕", ids[10]);
  });
});
