/**
 * F07-02 大会詳細検索 のシード（画面操作）。正本: cases/F07-02_seed_data.tsv
 * 検索用のイベントは、シード表の投入方法に書かれた「（n）イベント名(日)「…」・イベント名(英)「…」・…」の並びを読んで登録する
 * （値を二重に書き写さないため）。検索語（イベント名・賞品・フリーエリアに入れる語）には実行の印を付ける（rc）。前の実行の残りのイベントに当たらないため、
 * シード表が始めに定める「同じイベント名の既存イベントの削除」は行わない（イベントの残りは削除しない決まり）。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { EventInput } from "../pages/admin/event";
import { rc } from "../lib/run_marker";
import { registerEvent } from "../pages/admin/event";
import { registerSchedule, ScheduleInput } from "../pages/admin/schedule";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { SeedRow } from "../lib/catalog";
import { Account, withAdminSession } from "../lib/session";
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "../db/write_adapter";
import { ensureMember } from "../pages/admin/member";
import { EventSearchPage } from "../pages/front/f07_02_event_search";

type 検索用イベント = {
  日名: string; 英名: string; 開始: string; 規模?: string; 参加費?: string; ルール?: string; イベント公開?: string; 日程公開?: string;
  オンライン受付: boolean; 賞品?: string; フリー: { 番号: 1 | 2 | 3; 項目名?: string; 内容?: string }[];
};

/** 投入方法の文から、登録するイベントの並びを読む */
/** 検索語（正本の値）。イベント名・賞品・フリーエリアの中の検索語に実行の印を付け、前の実行の残りと取り違えない */
export const 検索語 = ["青空検索語", "期間確認", "カテゴリ確認", "詳細条件確認", "表示区分確認", "不正日付確認"];
/** 検索語に、実行の印とシード表の番号（3桁）を付ける。同じ検索語を使う別のシードのイベントが、検索結果に混ざらないようにする */
export const 語 = (k: string, 番号: string): string => `${rc(k)}${番号}`;
const 印付き = (t: string, 番号: string): string => 検索語.reduce((x, k) => x.split(k).join(語(k, 番号)), t);

export function イベントを読む(seed: SeedRow): 検索用イベント[] {
  const text = seed.投入方法;
  const 番号 = seed.シードID.slice(-3);
  const from = text.indexOf("その後、次の");
  if (from < 0) throw new Error(`${seed.シードID}: 投入方法に「その後、次の」が無い`);
  const parts = text.slice(from).split(/（\d+）(?=イベント名\(日\))/).slice(1);
  return parts.map((raw) => {
    const p = raw.split("登録のつど")[0];
    const one = (re: RegExp) => re.exec(p)?.[1];
    const 英 = one(/イベント名\(英\)「([^」]+)」/)!;
    const 日付 = /開始時間は?「(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?」/.exec(p) ?? /（例: (\d{4}-\d{2}-\d{2})）/.exec(p);
    const 年 = /開始時間は(\d{4})年の任意の日時/.exec(p)?.[1];
    // 年だけが決まる「任意の日時」は、英名の WEEKDAY / HOLIDAY に合わせた日（2025 は 10-14 火・10-19 日、2030 は 10-15 火・10-20 日）にする
    const 休日 = /HOLIDAY/.test(英);
    const 開始 = 日付 ? `${日付[1]} ${日付[2] ?? "10:00"}` : 年 === "2025" ? `2025-10-${休日 ? "19" : "14"} 10:00` : 年 === "2030" ? `2030-10-${休日 ? "20" : "15"} 10:00` : "";
    if (!開始) throw new Error(`${seed.シードID}: 開始時間を読めない（${p.slice(0, 80)}）`);
    const フリー = [...p.matchAll(/フリー入力エリア([123])(内容|項目名)\(日\)「([^」]+)」/g)].map((m) => ({ 番号: Number(m[1]) as 1 | 2 | 3, 種別: m[2], 値: 印付き(m[3], 番号) }));
    const 番号一覧 = [...new Set(フリー.map((f) => f.番号))];
    return {
      日名: 印付き(one(/イベント名\(日\)「([^」]+)」/)!, 番号), 英名: 英, 開始,
      規模: one(/イベント規模「([^」]+)」/), 参加費: one(/参加費「(\d+)」/), ルール: one(/ルール適用度「([^」]+)」/),
      イベント公開: one(/イベントの公開状態「([^」]+)」/), 日程公開: one(/日程の公開状態「([^」]+)」/),
      オンライン受付: /「オンライン受付あり」をチェックし(?!ない)/.test(p), 賞品: one(/賞品\(日\)「([^」]+)」/)?.replace(/^.*$/, (v) => 印付き(v, 番号)),
      フリー: 番号一覧.map((n) => ({ 番号: n, 項目名: フリー.find((f) => f.番号 === n && f.種別 === "項目名")?.値, 内容: フリー.find((f) => f.番号 === n && f.種別 === "内容")?.値 })),
    };
  });
}

function defineSearchSeed(seedId: string): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const events = イベントを読む(seed);
    // 控える番号は、状態・属性の「識別子=〔イベントID-…〕」の対応（識別子はイベント名(英)）で決める。対応の無いイベントは控えない
    const 控え = new Map([...(seed["状態・属性"] + seed.投入方法).matchAll(/([A-Z0-9][A-Z0-9-]*)=〔イベントID-F0702-([0-9A-Z]+)〕/g)].map((m) => [m[1], m[2]] as [string, string]));
    if (控え.size === 0) { const m = /〔イベントID-F0702-([0-9A-Z]+)〕/.exec(seed["状態・属性"]); if (m && events.length === 1) 控え.set(events[0].英名, m[1]); }
    // 識別子の無い呼び名（「開催済み1件目」など）は、残りのイベントに登録順で当てる
    const 全呼び名 = [...new Set([...(seed["状態・属性"] + seed.投入方法).matchAll(/〔イベントID-F0702-([0-9A-Z]+)〕/g)].map((m) => m[1]))];
    const 残り呼び名 = 全呼び名.filter((l) => ![...控え.values()].includes(l));
    for (const e of events.filter((x) => !控え.has(x.英名))) { const l = 残り呼び名.shift(); if (l) 控え.set(e.英名, l); }
    if (残り呼び名.length) throw new Error(`${seedId}: 控える呼び名 ${残り呼び名.join("・")} に当てるイベントが無い`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      // 「イベントに表示」がチェックされたフォーマット（公開側の詳細検索に並ぶフォーマット）。検索結果に出るには、イベントのフォーマットがこれである必要がある
      await page.goto(`${BASE_URL}/ja/events/list`);
      const フォーマット = ((await page.locator('label[for^="event-search-format-"]').first().textContent()) ?? "").trim();
      if (!フォーマット) throw new Error(`${seedId}: 「イベントに表示」がチェックされたフォーマットが1件も無い`);
      for (const [i, e] of events.entries()) {
        const v: EventInput = {
          イベント名日: e.日名, イベント名英: e.英名, 店舗: "Hareruya", フォーマット: [フォーマット], ルール適用度: e.ルール ?? "初心者歓迎",
          公開状態: e.イベント公開 ?? "公開", 定員: "16", 参加費: e.参加費 ?? "0",
          ...(e.規模 ? { イベント規模: e.規模 } : {}), ...(e.賞品 ? { 賞品日: e.賞品 } : {}),
          ...(e.フリー.length ? { フリー入力エリア: [1, 2, 3].map((n) => { const f = e.フリー.find((x) => x.番号 === n); return f ? { 項目名日: f.項目名, 内容日: f.内容 } : undefined; }) as EventInput["フリー入力エリア"] } : {}),
        };
        console.log(`[${seedId}] 登録 ${i + 1}/${events.length}: ${e.英名}`);
        const イベントID = await registerEvent(page, v);
        const 日程: ScheduleInput = {
          開始時間: e.開始, 受付あり: false, デッキ登録あり: false, 公開状態: e.日程公開 ?? "公開",
          ...(e.オンライン受付 ? { オンライン受付: { 開始: "2030-09-01 10:00", 終了: "2030-09-30 10:00" } } : {}),
        };
        const 日程ID = await registerSchedule(page, イベントID, 日程);
        const 呼び名 = 控え.get(e.英名);
        if (呼び名) {
          notes.set(`〔イベントID-F0702-${呼び名}〕`, イベントID);
          notes.set(`〔イベント詳細ID-F0702-${呼び名}〕`, 日程ID);
        }
      }
    });
  });
}

for (const id of [
  "S-F07-02-KEYWORD-006", "S-F07-02-DATE-008", "S-F07-02-CATEGORY-009", "S-F07-02-CATEGORY-010",
  ...[13, 14, 15, 16, 17, 18, 19, 20, 21].map((n) => `S-F07-02-DETAIL-0${n}`),
  "S-F07-02-VISIBILITY-024", "S-F07-02-NORESULT-036", "S-F07-02-NORESULT-037", "S-F07-02-INVALID-DATE-040",
]) defineSearchSeed(id);

// ---------------------------------------------------------------------------------------------
// 共有の選択肢（S-F07-02-OPTIONS）と、フォーマット・会場を使うシード
//
// シード表の OPTIONS は「既存の全店舗を閉店・既存の全フォーマットの『イベントに表示』を外し、試験用の3店舗・3フォーマットだけにする」
// （共有の設定の書き換え）。依頼者の方針（2026-11-10）で行わず、既存の「イベントに表示」のフォーマットの先頭3件（表示順）を
// 「スタンダード試験」「モダン試験」「レガシー試験」（共有A・B・C）に、開店中の会場の先頭3件（番号順）を「東京試験店」「大阪試験店」「名古屋試験店」
// （共有A・B・C）に読み替える。控えた名前・ID は notes に残し、ケースは名前を決め打ちにせずそれを使う。
// ---------------------------------------------------------------------------------------------

/** イベント登録に使う試験管理者（会場A〜Cを編集できる。権限は「モールオペレーター」。「店舗オーナー」「店舗オペレーター」は所属店舗しか見えない） */
export const F0702_ADMIN: Account = { loginId: "f0702admin", password: "Passw0rd!F0702" };
const 英字 = ["A", "B", "C"] as const;

defineSeed("S-F07-02-OPTIONS", async ({ browser, notes, seed }) => {
  const { フォーマット, 会場 } = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const s = new EventSearchPage(page);
    await s.open();
    return { フォーマット: await s.フォーマットの選択肢(), 会場: [...(await s.会場の選択肢())].sort((a, b) => Number(a.id) - Number(b.id)) };
  });
  if (フォーマット.length < 3) throw new Error(`${seed.シードID}: 「イベントに表示」のフォーマットが ${フォーマット.length} 件しか無い（3件要る）`);
  if (会場.length < 3) throw new Error(`${seed.シードID}: 開店中の会場が ${会場.length} 件しか無い（3件要る）`);
  for (const [i, l] of 英字.entries()) {
    notes.set(`〔フォーマットID-F0702-共有${l}〕`, フォーマット[i].id);
    notes.set(`〔フォーマット名-F0702-共有${l}〕`, フォーマット[i].名前);
    notes.set(`〔会場ID-F0702-共有${l}〕`, 会場[i].id);
    notes.set(`〔会場名-F0702-共有${l}〕`, 会場[i].名前);
  }
  // 「全体の並びと全会場」を確かめるケースの期待値は、DBの参照で読む（画面の表示を、画面自身で確かめないため）
  const 順 = query('select name_jp from mtb_format where is_shown_in_event = true order by "rank", id').map((r) => r.name_jp ?? "");
  const 開店 = query("select shop_name from dtb_base_info where is_open_shop = true and shop_name is not null order by id").map((r) => r.shop_name ?? "");
  notes.set("〔フォーマット表示順-F0702〕", 順.join("／"));
  notes.set("〔開店中の会場-F0702〕", 開店.join("／"));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "F07-02 試験管理者", 所属店舗: 会場[0].名前, ログインID: F0702_ADMIN.loginId, メールアドレス: "f0702admin@example.test",
      パスワード: F0702_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 会場[0].名前, 編集可能店舗: 会場.slice(0, 3).map((v) => v.名前),
    });
  });
  reportSeedIssue(seed.シードID, "既存の全店舗の閉店・既存フォーマットの「イベントに表示」の取り下げは、共有の設定の書き換えなので行わない。既存の「イベントに表示」のフォーマットの先頭3件（表示順）をスタンダード試験・モダン試験・レガシー試験の代わり、開店中の会場の先頭3件（番号順）を東京試験店・大阪試験店・名古屋試験店の代わりに読み替えた（名前は控え〔フォーマット名-F0702-共有A〕などに残る）。イベント登録の管理者は権限「モールオペレーター」の試験管理者で代えた");
});

type 登録 = {
  /** 控える呼び名の末尾（「022A」「042」など） */
  呼び名: string; 日名: string; 英名: string; 開始: string;
  /** 共有のフォーマット（0=A,1=B,2=C）。書かなければ A。複数可 */
  形式?: number[]; 会場?: number; ルール?: string; 規模?: string; 参加費?: string; オンライン?: boolean;
};

async function 登録する(seedId: string, ctx: SeedCtx, 一覧: 登録[]): Promise<void> {
  const { browser, notes } = ctx;
  const 形式名 = (i: number) => notes.get(`〔フォーマット名-F0702-共有${英字[i]}〕`);
  const 会場名 = (i: number) => notes.get(`〔会場名-F0702-共有${英字[i]}〕`);
  await withAdminSession(browser, F0702_ADMIN, async (page) => {
    for (const [i, e] of 一覧.entries()) {
      console.log(`[${seedId}] 登録 ${i + 1}/${一覧.length}: ${e.英名}`);
      const イベントID = await registerEvent(page, {
        イベント名日: e.日名, イベント名英: e.英名, 店舗: 会場名(e.会場 ?? 0), フォーマット: (e.形式 ?? [0]).map(形式名),
        ルール適用度: e.ルール ?? "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: e.参加費 ?? "0",
        ...(e.規模 ? { イベント規模: e.規模 } : {}), ...(e.参加費 && e.参加費 !== "0" ? { 支払方法: ["クレジットカード決済"] } : {}),
      });
      const 日程ID = await registerSchedule(page, イベントID, {
        開始時間: e.開始, 受付あり: false, デッキ登録あり: false, 公開状態: "公開",
        ...(e.オンライン ? { オンライン受付: { 開始: "2030-09-01 10:00", 終了: "2030-09-30 10:00" } } : {}),
      });
      notes.set(`〔イベントID-F0702-${e.呼び名}〕`, イベントID);
      notes.set(`〔イベント詳細ID-F0702-${e.呼び名}〕`, 日程ID);
    }
  });
}

const 補足 = "シード表の始めの手順（同じ名前の既存イベントの削除）は行わず、検索語に実行の印と番号を付けて前の実行の残りに当たらないようにした";
/** 共有のシード（OPTIONS）に頼り、画面でイベントを登録するシード */
function defineEventsSeed(seedId: string, 作る: (番号: string) => 登録[], 注記?: string): void {
  defineSeed(seedId, { needs: ["S-F07-02-OPTIONS"] }, async (ctx) => {
    await 登録する(seedId, ctx, 作る(seedId.slice(-3)));
    reportSeedIssue(seedId, 補足 + (注記 ? `。${注記}` : ""));
  });
}

const 平日 = "2030-10-15 10:00";
/** 検索語（実行の印と番号つき）を日名の先頭へ */
const 日 = (k: string, n: string, 後 = "") => `${語(k, n)}${後}`;

defineEventsSeed("S-F07-02-COMBINED-002", (n) => [{ 呼び名: "002", 日名: 日("統合条件", n), 英名: "COMB-ALL-002", 開始: 平日 }]);

for (const n of ["011", "012"]) {
  defineEventsSeed(`S-F07-02-FORMAT-VENUE-${n}`, (x) => [
    { 呼び名: `${x}A`, 日名: 日("形式場所確認", x), 英名: `FV-STANDARD-${x}`, 開始: 平日, 形式: [0], 会場: 0 },
    { 呼び名: `${x}B`, 日名: 日("形式場所確認", x), 英名: `FV-MODERN-${x}`, 開始: 平日, 形式: [1], 会場: 1 },
    { 呼び名: `${x}C`, 日名: 日("形式場所確認", x), 英名: `FV-LEGACY-${x}`, 開始: 平日, 形式: [2], 会場: 2 },
  ]);
}

/** 統合条件の比較データ。022 は全条件、023 は期間・形式・会場・平日・過去 */
defineEventsSeed("S-F07-02-COMBINED-022", (n) => {
  const 全 = { 日名: 日("統合条件", n), 開始: 平日, ルール: "初心者歓迎", 規模: "大型イベント", 参加費: "0", オンライン: true, 形式: [0], 会場: 0 };
  return [
    { ...全, 呼び名: "022A", 英名: "COMB-ALL-022" },
    { ...全, 呼び名: "022B", 英名: "COMB-TERM-022", 日名: "COMB-TERM-022" },
    { ...全, 呼び名: "022C", 英名: "COMB-DATE-022", 開始: "2030-12-10 10:00" },
    { ...全, 呼び名: "022D", 英名: "COMB-REL-022", ルール: "カジュアル対戦" },
    { ...全, 呼び名: "022E", 英名: "COMB-ONLINE-022", オンライン: false },
    { ...全, 呼び名: "022F", 英名: "COMB-FORMAT-022", 形式: [1] },
    { ...全, 呼び名: "022G", 英名: "COMB-VENUE-022", 会場: 1 },
    { ...全, 呼び名: "022H", 英名: "COMB-SCALE-022", 規模: undefined },
    { ...全, 呼び名: "022I", 英名: "COMB-FEE-022", 参加費: "1000" },
  ];
}, "「初心者歓迎以外」のルール適用度は「カジュアル対戦」、期間外の日は 2030-12-10 とした");

defineEventsSeed("S-F07-02-COMBINED-023", (n) => {
  const 全 = { 日名: 日("統合条件", n), 開始: 平日, 形式: [0], 会場: 0 };
  return [
    { ...全, 呼び名: "023A", 英名: "COMB-ALL-023" },
    { ...全, 呼び名: "023B", 英名: "COMB-TERM-023", 日名: "COMB-TERM-023" },
    { ...全, 呼び名: "023C", 英名: "COMB-DATE-023", 開始: "2030-12-10 10:00" },
    { ...全, 呼び名: "023D", 英名: "COMB-FORMAT-023", 形式: [2] },
    { ...全, 呼び名: "023E", 英名: "COMB-VENUE-023", 会場: 1 },
    { ...全, 呼び名: "023F", 英名: "COMB-HOLIDAY-023", 開始: "2030-10-19 10:00" },
    { ...全, 呼び名: "023G", 英名: "COMB-PAST-023", 開始: "2025-10-14 10:00" },
  ];
}, "期間外の日は 2030-12-10、2025年の日は 2025-10-14 とした");

defineEventsSeed("S-F07-02-RESULT-026", (n) => [
  { 呼び名: "026A", 日名: 日("結果表示確認", n, " EARLY"), 英名: "RESULT-EARLY-026", 開始: "2030-12-01 09:00", 会場: 0, 形式: [0], ルール: "初心者歓迎" },
  { 呼び名: "026B", 日名: 日("結果表示確認", n, " MIDDLE"), 英名: "RESULT-MIDDLE-026", 開始: "2030-12-10 14:00", 会場: 1, 形式: [1] },
  { 呼び名: "026C", 日名: 日("結果表示確認", n, " LATE"), 英名: "RESULT-LATE-026", 開始: "2030-12-20 18:00", 会場: 2, 形式: [2] },
]);
for (const n of ["027", "028"]) {
  defineEventsSeed(`S-F07-02-RESULT-${n}`, (x) => [
    { 呼び名: `${x}A`, 日名: 日("結果表示確認", x, " EARLY"), 英名: `RESULT-EARLY-${x}`, 開始: "2030-12-01 09:00", 形式: [0] },
    { 呼び名: `${x}B`, 日名: 日("結果表示確認", x, " MIDDLE"), 英名: `RESULT-MIDDLE-${x}`, 開始: "2030-12-10 14:00", 形式: [0, 1] },
    { 呼び名: `${x}C`, 日名: 日("結果表示確認", x, " LATE"), 英名: `RESULT-LATE-${x}`, 開始: "2030-12-20 18:00", 形式: [2] },
  ]);
}
defineEventsSeed("S-F07-02-RESULT-035", (n) => [
  { 呼び名: "035A", 日名: 日("結果表示確認", n, " EARLY"), 英名: "RESULT-EARLY-035", 開始: "2030-12-01 09:00" },
  { 呼び名: "035B", 日名: 日("結果表示確認", n, " MIDDLE"), 英名: "RESULT-MIDDLE-035", 開始: "2030-12-10 14:00" },
  { 呼び名: "035C", 日名: 日("結果表示確認", n, " LATE"), 英名: "RESULT-LATE-035", 開始: "2030-12-20 18:00" },
]);
for (const n of ["033", "034"]) {
  defineEventsSeed(`S-F07-02-CHIPS-${n}`, (x) => [
    { 呼び名: `${x}A`, 日名: 日("チップ確認", x, "スタンダード"), 英名: `CHIP-STANDARD-${x}`, 開始: "2030-11-10 10:00", ルール: "初心者歓迎", 形式: [0], 会場: 0 },
    { 呼び名: `${x}B`, 日名: 日("チップ確認", x, "モダン"), 英名: `CHIP-MODERN-${x}`, 開始: "2030-11-11 10:00", ルール: "初心者歓迎", 形式: [1], 会場: 0 },
  ]);
}
/** 識別子（イベント名）だけで検索する単発のシード。識別子に実行の印と番号を付ける（検索は印つきの識別子で行う） */
const 識別 = (x: string, 末?: string) => `${語(`F0702-${x}`, x)}${末 ? `-${末}` : ""}`;
export const 識別語 = 識別;
defineEventsSeed("S-F07-02-NOINDEX-042", () => [{ 呼び名: "042", 日名: 識別("042", "A"), 英名: 識別("042", "A"), 開始: 平日 }]);
defineEventsSeed("S-F07-02-CRUMB-043", () => [{ 呼び名: "043", 日名: 識別("043", "A"), 英名: 識別("043", "A"), 開始: 平日 }]);
defineEventsSeed("S-F07-02-TOTAL-044", () => (["A", "B", "C"] as const).map((l) => ({ 呼び名: `044${l}`, 日名: 識別("044", l), 英名: 識別("044", l), 開始: 平日 })));
defineEventsSeed("S-F07-02-TITLE-045", () => (["A", "B", "C"] as const).map((l, i) => ({ 呼び名: `045${l}`, 日名: 識別("045", l), 英名: 識別("045", l), 開始: 平日, 形式: [i] })));

defineSeed("S-F07-02-NOFORMAT-046", { needs: ["S-F07-02-OPTIONS"] }, async (ctx) => {
  const 英 = rc("F0702-046-NOFORMAT");
  await 登録する(ctx.seed.シードID, ctx, [{ 呼び名: "046", 日名: 語("フォーマット未設定確認", "046"), 英名: 英, 開始: 平日, 形式: [0] }]);
  const イベントID = ctx.notes.get("〔イベントID-F0702-046〕");
  const n = writeTestData({
    理由: "F07-02-046: 画面ではフォーマットを0件にして保存できないため、この実行で作ったイベントのフォーマットの紐づけをすべて削除する",
    sql: "delete from dtb_event_format where event_id = $1", params: [イベントID],
    対象の確かめ: "select name_en, name_jp from dtb_event where id = $1", 確かめのparams: [イベントID], 印: RUN_MARK, 最大行数: 5,
  });
  reportSeedIssue(ctx.seed.シードID, `${補足}。DBで、この実行で作ったイベントのフォーマットの紐づけ ${n} 行を削除し、フォーマットを0件にした（画面はフォーマットを1つ以上選ばないと保存できないため。シード表も同じ）。イベント名(英)は実行の印つき`);
});
