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
import { defineSeed } from "../lib/seeds";
import { SeedRow } from "../lib/catalog";
import { withAdminSession } from "../lib/session";

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
