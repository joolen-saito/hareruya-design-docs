/**
 * M13-13 イベント一括登録。正本: cases/M13-13_test_cases.tsv
 * 正本の「イベント申込一括CSV登録画面」は、メニュー「イベント管理」→「イベント一括登録」の画面（見出し「イベント一括登録CSVアップロード」）。
 * 027 だけは実装しない（CSV取込の区切り文字をセミコロンにするには、管理画面に無いアプリの設定ファイルの書き換えが要る）。
 * S-M13-13-MASTER（DBシード）は、画面で店舗・選択肢・支払方法があることを確かめる形で代えた（依頼者の方針 2026-11-09。seeds/m13-13.ts）。
 * 取込ファイルには会場の列を設けない（設計書 0214 sheet-20 L0047 で削除。取込画面の雛形にも無い）。
 */
import fs from "node:fs";
import { test } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { CSVの枠を外す, CSVの内容を画面の枠に出す } from "../../lib/evidence_other";
import { expect, caseTest } from "../../lib/case";
import { イベントと日程の総数, イベントの日程, 名前が語で始まるイベントの件数, 保存日程 } from "../../db/m13_13";
import { イベント名で探す, 保存されているイベント, 保存イベント } from "../../db/event";
import { アプリの時刻帯 } from "../../lib/app_config";
import { CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { SHARED_ENV } from "../../config/env";
import { EventBulkCsvPage, ダウンロードした文字, 雛形の見出し } from "../../pages/admin/m13_13_event_bulk_csv";
import { EntrySearchPage } from "../../pages/admin/m13_11_entry_search";
import { EventSearchPage } from "../../pages/front/f07_02_event_search";
import { 検索結果のカード, 結果なしの文 } from "../../pages/front/m13_13_event_cards";
import { QK1302_ADMIN, QK連携店舗 } from "../../seeds/m13-02-qk";
import {
  M1313_ADMIN, M1313_RI_ADMIN, QK大会名, RI大会名, m1313File, 連携店舗, TC東京, クレジットカード支払, 全項目イベント名, フリー入力エリアの値,
  名006, 名007, 名008, 名009, 名010, 名011, 名013, 頭020, 名021, 名022, 名026, 名028, 頭030, 名031, 頭032, 名036, 名037, 名038, 名040, 名042,
  名044, 名045, 名046, 名047, 名048, 名049,
} from "../../seeds/m13-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M13-13-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1313_ADMIN);
  const bulk = new EventBulkCsvPage(page);
  let download: import("@playwright/test").Download | undefined;
  await step(1, async () => { await bulk.開く(); });
  await step(2, async () => { download = await bulk.雛形をダウンロードする(); });
  await expected(async () => {
    expect(download, "雛形ファイルのダウンロード").toBeTruthy();
    const d = download!;
    expect.soft(await d.failure(), "ダウンロードの失敗の理由（無いこと）").toBeNull();
    expect.soft(d.suggestedFilename(), "ダウンロードしたファイルの名前").toMatch(/\.csv$/);
    const headers = 雛形の見出し(await ダウンロードした文字(d));
    note(`ダウンロードした雛形ファイル「${d.suggestedFilename()}」の1行目: ${headers.join(",")}`);
    expect.soft(headers[0], "雛形ファイルの1行目の先頭の項目").toBe("イベント名(日)");
  });
});

caseTest("IT-M13-13-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1313_ADMIN);
  // 事前準備③: 開始時のイベント総数とイベント日程総数を記録する
  const 開始時 = イベントと日程の総数();
  note(`開始時の総数: イベント ${開始時.イベント} 件・イベント日程 ${開始時.日程} 件（削除の印が付いた行も数える）`);
  const bulk = new EventBulkCsvPage(page);
  let 後 = 開始時;
  await step(1, async () => { await bulk.開く(); });
  await step(2, async () => { await bulk.ファイルを選ぶ(m1313File("M13-13-HEADER-ONLY-025.csv")); });
  await step(3, async () => {
    await bulk.アップロードする();
    note(`アップロード後の画面の赤の帯: ${(await bulk.エラーの文()).join(" / ") || "（なし）"}／緑の帯: ${(await bulk.成功の文()).join(" / ") || "（なし）"}`);
  });
  await step(4, async () => { 後 = イベントと日程の総数(); });
  await expected(async () => {
    expect.soft(後.イベント - 開始時.イベント, "取込で追加されたイベントの件数").toBe(0);
    expect.soft(後.日程 - 開始時.日程, "取込で追加されたイベント日程の件数").toBe(0);
  });
});

caseTest("IT-M13-13-039", async ({ page, step, expected }) => {
  const front = new EventSearchPage(page);
  const bulk = new EventBulkCsvPage(page);
  let 手順1の結果なしの文 = "";
  let 手順1のカード = 0;
  let 手順6のカード: Awaited<ReturnType<typeof 検索結果のカード>> = [];
  const 検索 = async () => {
    await front.open();
    await front.モーダルを開く();
    await front.条件を入れる({ キーワード: QK大会名 });
    const status = await front.検索する();
    note(`大会詳細検索（キーワード「${QK大会名}」）の結果の画面の応答: ${status}`);
  };
  await step(1, async () => {
    await 検索();
    手順1の結果なしの文 = await 結果なしの文(page);
    手順1のカード = (await 検索結果のカード(page)).length;
  });
  await step(2, async () => {
    note(`パスワードはシード表の「Passw0rd-QK」を管理画面が拒む（12文字以上）ので、シードで代えた「${QK1302_ADMIN.password}」でログインした（ケースはパスワードの値を確かめない）`);
    await loginAdmin(page, QK1302_ADMIN);
  });
  await step(3, async () => { await bulk.開く(); });
  await step(4, async () => {
    // ファイルを選ぶ窓は CSV のファイルを既定で絞るが、正本のファイルは拡張子 tsv。窓でファイルを選ぶ操作で選んだ
    await bulk.ファイルを選ぶ(m1313File("QK-1313-001.tsv"));
  });
  await step(5, async () => {
    await bulk.アップロードする();
    note(`アップロード後の画面の赤の帯: ${(await bulk.エラーの文()).join(" / ") || "（なし）"}／緑の帯: ${(await bulk.成功の文()).join(" / ") || "（なし）"}`);
  });
  await step(6, async () => {
    await 検索();
    手順6のカード = await 検索結果のカード(page);
  });
  await expected(async () => {
    expect.soft(手順1の結果なしの文, "手順1の検索結果の文").toContain("条件に合うイベントが見つかりませんでした");
    expect.soft(手順1のカード, "手順1の検索結果に出たイベントの数").toBe(0);
    expect.soft(手順6のカード.length, "手順6の検索結果に出た日程の数").toBe(1);
    const c = 手順6のカード[0];
    expect.soft(c?.イベント名, "手順6の日程のイベント名").toBe(QK大会名);
    expect.soft(c?.フォーマット, "手順6の日程のフォーマット").toEqual(["スタンダード"]);
    expect.soft(c?.開催日時の値, "手順6の日程の開催日時（機械向けの値）").toBe("2030-10-21T10:00");
    expect.soft(c?.開催日時の表示, "手順6の日程の開催日時（表示）").toContain("2030年10月21日 10時");
    expect.soft(c?.開催店舗, "手順6の日程の開催店舗").toBe(QK連携店舗);
  });
});

caseTest("IT-M13-13-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1313_RI_ADMIN);
  const search = new EntrySearchPage(page);
  const bulk = new EventBulkCsvPage(page);
  const 店舗ID = notes.get("〔店舗ID-M1313-RI共有〕");
  const 行の文 = async () => (await search.結果の行.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  let 取込前の行: string[] = [];
  let 取込後の行: string[] = [];
  await step(1, async () => { await search.開く(); });
  await step(2, async () => {
    await search.条件を入れて検索する([連携店舗], RI大会名);
    取込前の行 = await 行の文();
    note(`取込前の検索（店舗「${連携店舗}」＝店舗ID ${店舗ID}）の一覧の行: ${取込前の行.length} 行`);
    expect(取込前の行.filter((t) => t.includes(RI大会名)), "取込前の一覧に出た対象のイベントの行").toEqual([]);
  });
  await step(3, async () => { await bulk.メニューから開く(); });
  await step(4, async () => { await bulk.ファイルを選ぶ(m1313File("M13-13-RI-001.csv")); });
  await step(5, async () => {
    await bulk.アップロードする();
    note(`アップロード後の画面の赤の帯: ${(await bulk.エラーの文()).join(" / ") || "（なし）"}／緑の帯: ${(await bulk.成功の文()).join(" / ") || "（なし）"}`);
  });
  await step(6, async () => {
    await search.開く();
    await search.条件を入れて検索する([連携店舗], RI大会名);
    取込後の行 = await 行の文();
  });
  await expected(async () => {
    const 行 = 取込後の行.filter((t) => t.includes(RI大会名));
    expect.soft(行.length, "取込後の一覧に出た、イベント名「RI取込大会-001」の行の数").toBeGreaterThan(0);
    // 開始時間の書式は画面の作り（2026/12/18 10:00 か 2026-12-18 10:00）。区切りを問わず日時として探す
    expect.soft(行.some((t) => /2026[-/]12[-/]18 10:00/.test(t)), "取込後の一覧の行に出た日程の開始時間 2026-12-18 10:00").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 取込してDBで確かめるケース（S-M13-13-MASTER を使うもの）
// ---------------------------------------------------------------------------

/** 取込ファイルの中身（確かめに関わる列）を手順の画像に出すときの、列の指定（名前そのものか、名前の形）。「見出し」は見出し行だけ */
type 見せる列 = (string | RegExp)[] | "見出し";

/** 目に見えない値（ゼロ幅スペース・改行・空）を、画面で読める記号にする */
const 見える形 = (s: string): string => (s === "" ? "（空）" : s.replace(/\u200B/g, "⟦ゼロ幅スペース⟧").replace(/\r\n/g, "⟦CRLF⟧").replace(/\r/g, "⟦CR⟧").replace(/\n/g, "⟦LF⟧"));
const 見出しの形 = (s: string): string => s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");

/**
 * これから取り込むファイルの中身を、画面の上の枠に出す（手順の画像に写る。ファイルを選んだ直後に呼び、アップロードの前に外す）。
 * 確かめに関わる列だけを出し、ゼロ幅スペース・CR・LF・空の欄は見える記号に置き換える（置き換えたことは注記に残す）
 */
async function 取込ファイルの中身を出す(page: import("@playwright/test").Page, file: string, 列: 見せる列): Promise<void> {
  const text = decodeCsvBytes(fs.readFileSync(m1313File(file)));
  const 全 = parseCsv(text);
  const head = 全[0] ?? [];
  const 行末 = /\r\n/.test(text.replace(/"(?:[^"]|"")*"/g, "")) ? "CRLF" : "LF";
  if (列 === "見出し") {
    const 行 = [["列の番号", "見出し"], ...head.map((h, i) => [String(i + 1), h])];
    await CSVの内容を画面の枠に出す(page, [{ 題: `取り込むファイル「${file}」の見出し行（全 ${head.length} 項目。「会場」の列は${head.includes("会場") ? "ある" : "無い"}）`, 行 }], 100);
    return;
  }
  const first = head.findIndex((h) => 見出しの形(h).startsWith("イベント名(日)"));
  const hit = (h: string) => 列.some((c) => (typeof c === "string" ? 見出しの形(c) === 見出しの形(h) : c.test(見出しの形(h))));
  const idx = head.map((h, i) => i).filter((i) => i === first || hit(head[i]));
  const 見る = [idx.map((i) => head[i]), ...全.slice(1).map((r) => idx.map((i) => 見える形(r[i] ?? "")))];
  const 見えない = 全.slice(1).some((r) => idx.some((i) => /[\u200B\r\n]/.test(r[i] ?? "") || (r[i] ?? "") === ""));
  await CSVの内容を画面の枠に出す(page, [{ 題: `取り込むファイル「${file}」の中身（確かめに関わる ${idx.length} 列だけ。全 ${head.length} 列。ファイルの行末は ${行末}）`, 行: 見る }]);
  if (見えない) note("取込ファイルの画像では、目に見えない値を記号で表した（⟦ゼロ幅スペース⟧＝U+200B、⟦CR⟧・⟦LF⟧・⟦CRLF⟧＝改行、（空）＝値が入っていない欄）");
}

/** 手順1〜3: イベント一括登録画面を開き、取込ファイルを選んでアップロードする。アップロード後の画面の帯の文を注記に残す。列を指定すると、選んだファイルの中身をその手順の画像に出す */
async function 取り込む({ page, step }: CaseCtx, file: string, 列?: 見せる列): Promise<EventBulkCsvPage> {
  await loginAdmin(page, M1313_ADMIN);
  const bulk = new EventBulkCsvPage(page);
  await step(1, async () => { await bulk.開く(); });
  await step(2, async () => {
    await bulk.ファイルを選ぶ(m1313File(file));
    if (列) await 取込ファイルの中身を出す(page, file, 列);
  });
  await step(3, async () => {
    await CSVの枠を外す(page);
    await bulk.アップロードする();
    note(`アップロード後の画面の赤の帯: ${(await bulk.エラーの文()).join(" / ") || "（なし）"}／緑の帯: ${(await bulk.成功の文()).join(" / ") || "（なし）"}`);
  });
  return bulk;
}

type 保存 = { イベント: 保存イベント[]; 日程: 保存日程[][] };
/**
 * 保存された日時を読む時刻帯。手元の環境ではアプリの時刻帯を読む。共有の環境ではアプリの設定を読む手段が無いので日本時間とみなし、注記に残す
 * （画面で入れた時刻と画面に出る時刻が同じことは、ほかの機能の開発環境の実行で見ている）
 */
function 時刻帯(): string {
  if (!SHARED_ENV) return アプリの時刻帯();
  const m = "共有の環境ではアプリの時刻帯を読めないため、保存された日時は日本時間（Asia/Tokyo）として読んだ";
  if (!test.info().annotations.some((a) => a.description === m)) note(m);
  return "Asia/Tokyo";
}
/** イベント名(日)が一致するイベントと、それぞれの日程（DB） */
function 読む(名前: string): 保存 {
  const tz = 時刻帯();
  const イベント = イベント名で探す(名前);
  return { イベント, 日程: イベント.map((e) => イベントの日程(e.イベントID, tz)) };
}

/**
 * イベントが1件、その日程が n 件であること（日程数を書かなければ日程の件数は確かめない）。1件目のイベントと1件目の日程を返す。
 * 件数は確かめの場面で DB を読み直して確かめる（帯に照会と読み取った値が出る）
 */
function 一件(名前: string, 日程数?: number): { e?: 保存イベント; d?: 保存日程 } {
  expect.soft(イベント名で探す(名前).length, `イベント名(日)が「${名前}」のイベントの件数`).toBe(1);
  if (日程数 !== undefined) expect.soft(読む(名前).日程[0]?.length ?? 0, `「${名前}」のイベント日程の件数`).toBe(日程数);
  const r = 読む(名前);
  return { e: r.イベント[0], d: r.日程[0]?.[0] };
}

const クレカ有効 = (e?: 保存イベント) => (e?.支払方法 ?? []).includes(クレジットカード支払);

type 見る値 = { e?: 保存イベント; d?: 保存日程 };
/** 期待結果の確かめ1つ: [確かめの名前, 値の取り出し方, 期待する値] */
type 確かめ = [string, (x: 見る値) => unknown, unknown];

/** 1データ行のファイルを取り込み、イベント1件（と日程の件数）を確かめ、続けて確かめの表を確かめる。エラーなしを求めるケースは、取込後の画面のエラーが無く取込完了が出たことも確かめる */
function 一件のケース(file: string, 名前: string, 日程数: number | undefined, 表: 確かめ[] = [], 注記?: string, エラーなし = false, 列?: 見せる列) {
  return async (ctx: CaseCtx) => {
    const bulk = await 取り込む(ctx, file, 列);
    let r: 保存 = { イベント: [], 日程: [] };
    await ctx.step(4, async () => { r = 読む(名前); });
    await ctx.expected(async () => {
      if (注記) note(注記);
      if (エラーなし) {
        // 正本の「エラーにならず」: 取込後の画面に赤の帯（エラー）が無く、緑の帯（取込完了）が出ていること
        expect.soft(await bulk.エラーの文(), "取込後の画面のエラー（無いこと）").toEqual([]);
        expect.soft((await bulk.成功の文()).length, "取込後の画面の取込完了の表示").toBeGreaterThan(0);
      }
      r = 読む(名前); // 確かめの場面で読み直す（帯に照会と読み取った値が出る）
      expect.soft(r.イベント.length, `イベント名(日)が「${名前}」のイベントの件数`).toBe(1);
      if (日程数 !== undefined) expect.soft(r.日程[0]?.length ?? 0, `「${名前}」のイベント日程の件数`).toBe(日程数);
      const x: 見る値 = { e: r.イベント[0], d: r.日程[0]?.[0] };
      for (const [what, get, want] of 表) expect.soft(get(x), what).toEqual(want);
    });
  };
}

/**
 * 登録されないことを確かめるケース（イベント名(日)の一致、または頭の一致で0件）。
 * 0件だけでは、ファイル形式の誤り（区切り文字の違いなど）でファイル全体が拒まれても合格になるので、
 * 取込後の画面のエラーに、正本が指す行（ファイルの行番号。見出しが1行目）と項目のエラーが出ていることも確かめる
 */
function 登録されないケース(file: string, 名前: string[], 頭: string | undefined, 拒否: { 行: number; 語: string[]; 何: string }, 未検証: [string, string][] = []) {
  return async (ctx: CaseCtx) => {
    const bulk = await 取り込む(ctx, file);
    const n: Record<string, number> = {};
    await ctx.step(4, async () => {
      for (const x of 名前) n[x] = イベント名で探す(x).length;
      if (頭) n[`${頭}…`] = 名前が語で始まるイベントの件数(頭);
    });
    await ctx.expected(async () => {
      // 件数は確かめの場面で DB を読み直して確かめる（帯に照会と読み取った値が出る）
      for (const x of 名前) expect.soft(イベント名で探す(x).length, `イベント名(日)が「${x}」のイベントの件数`).toBe(0);
      if (頭) expect.soft(名前が語で始まるイベントの件数(頭), `イベント名(日)が「${頭}…」のイベントの件数`).toBe(0);
      const errs = await bulk.エラーの文();
      const 行の = new RegExp(`(^|[^0-9])${拒否.行}\\s*行目|行\\s*${拒否.行}\\s*[:：]`);
      expect.soft(errs.some((t) => 行の.test(t) && 拒否.語.every((w) => t.includes(w))), `取込後の画面に、ファイルの${拒否.行}行目の${拒否.何}のエラーが出る（表示: ${errs.join(" / ") || "なし"}）`).toBe(true);
      // 正本が求めるが、画面・ファイルの作りで確かめられない項目は、期待を弱めず不一致として残す
      for (const [what, why] of 未検証) expect.soft(why, what).toBe("確かめた");
    });
  };
}

caseTest("IT-M13-13-002", 一件のケース("M13-13-ALL-002.csv", 全項目イベント名("002"), undefined, [
  ["イベント名(日)", (x) => x.e?.["イベント名(日)"], 全項目イベント名("002")],
  ["イベント名(英)", (x) => x.e?.["イベント名(英)"], "Integration Event Full-002"],
  ["店舗（名称に対応する店舗）", (x) => x.e?.店舗, TC東京],
  ["フォーマット（名称に対応するフォーマット）", (x) => x.e?.フォーマット, ["パウパー"]],
  ["ルール適用度（名称に対応するマスタ）", (x) => x.e?.ルール適用度, "カジュアル"],
  ["公開状態（名称に対応するマスタ）", (x) => x.e?.公開状態, "公開"],
  ["定員", (x) => x.e?.定員, "100"],
  ["チーム戦（1＝あり）", (x) => x.e?.チーム戦, "真"],
  ["参加費", (x) => x.e?.参加費, "2000"],
  // 会場は、設計書（L0047）で項目が削除され、アプリにも保存先・入力欄が無い。取込ファイルにも列を設けていないので確かめられない（期待は弱めず、確かめられないことを不一致として残す）
  ["会場「TC 東京」と、名称に対応する会場のマスタの設定（設計書で項目が削除され、確かめる先が無い）", () => "会場の項目が無い", "会場がCSVの値で登録されている"],
]));

caseTest("IT-M13-13-003", 一件のケース("M13-13-ALL-003.csv", 全項目イベント名("003"), undefined, [
  ["バナーURL(日)", (x) => x.e?.["バナーURL(日)"], "https://files.hareruyamtg.com/banner/jp.jpeg"],
  ["バナーURL(英)", (x) => x.e?.["バナーURL(英)"], "https://files.hareruyamtg.com/banner/en.jpeg"],
  [`クレジットカード支払い（あり＝支払方法に「${クレジットカード支払}」）`, (x) => クレカ有効(x.e), true],
  ["賞品(日)", (x) => x.e?.["賞品(日)"], "参加賞"],
  ["賞品(英)", (x) => x.e?.["賞品(英)"], "Entry Prize"],
  ...フリー入力エリアの値("003").flatMap((a, i): 確かめ[] => [
    [`フリー入力エリア${i + 1}の項目名(日)`, (x) => x.e?.フリー入力エリア[i]?.["項目名(日)"], a["項目名(日)"]],
    [`フリー入力エリア${i + 1}の項目名(英)`, (x) => x.e?.フリー入力エリア[i]?.["項目名(英)"], a["項目名(英)"]],
    [`フリー入力エリア${i + 1}の内容(日)`, (x) => x.e?.フリー入力エリア[i]?.["内容(日)"], a["内容(日)"]],
    [`フリー入力エリア${i + 1}の内容(英)`, (x) => x.e?.フリー入力エリア[i]?.["内容(英)"], a["内容(英)"]],
    [`フリー入力エリア${i + 1}のアコーディオン表示（CSVの値 ${a.アコーディオン表示}）`, (x) => x.e?.フリー入力エリア[i]?.初期表示は閉じる, a.アコーディオン表示 === "1" ? "真" : "偽"],
  ]),
], undefined, false, ["クレジットカード支払い", /^バナーURL/, /^賞品\s*\(日\)|^賞品\s*\(英\)|^賞品（日）|^賞品（英）/, /^フリー入力エリア/]));

caseTest("IT-M13-13-004", 一件のケース("M13-13-ALL-004.csv", 全項目イベント名("004"), 1, [
  ["開始時間", (x) => x.d?.開始時間, "2026-10-10 15:00"],
  ["受付（あり＝受付時間が入っている）", (x) => !!x.d && x.d.受付時間From !== "" && x.d.受付時間To !== "", true],
  ["受付時間From（13:00）", (x) => x.d?.受付時間From, "2026-10-10 13:00"],
  ["受付時間To（14:30）", (x) => x.d?.受付時間To, "2026-10-10 14:30"],
  ["デッキ登録（あり）", (x) => x.d?.デッキ登録, "真"],
  ["デッキ登録締切", (x) => x.d?.デッキ登録締切, "2026-10-10 14:00"],
  ["オンライン受付（あり）", (x) => x.d?.オンライン受付, "真"],
  ["オンライン受付時間From", (x) => x.d?.オンライン受付時間From, "2026-10-01 12:00"],
  ["オンライン受付時間To", (x) => x.d?.オンライン受付時間To, "2026-10-10 12:00"],
  ["定員_日程", (x) => x.d?.定員, "32"],
  ["参加費_日程", (x) => x.d?.参加費, "1500"],
  ["公開状態_日程", (x) => x.d?.公開状態, "非公開"],
  ["賞品_日程(日)", (x) => x.d?.["賞品(日)"], "日程参加賞"],
  ["賞品_日程(英)", (x) => x.d?.["賞品(英)"], "Schedule Prize"],
], "受付の有無はアプリに項目が無く、受付時間（From・To）が入っていることで表される。受付=あり は受付時間が入っていることで確かめた（受付時間は開始時間の日付と合わせて保存される）", false, ["開始時間", "受付", "受付時間From", "受付時間To", "デッキ登録", "デッキ登録締切", "オンライン受付", "オンライン受付時間From", "オンライン受付時間To", "定員_日程", "参加費_日程", "公開状態_日程", /^賞品_日程/]));

caseTest("IT-M13-13-005", async (ctx) => {
  const bulk = await 取り込む(ctx, "M13-13-ALL-005.csv");
  await ctx.expected(async () => {
    expect.soft(bulk.この画面か(), `取込後に表示している画面（イベント一括登録画面。いまのアドレス ${ctx.page.url()}）`).toBe(true);
    expect.soft(await bulk.エラーの文(), "取込後の画面のエラーの帯（無いこと）").toEqual([]);
    await expect.soft(bulk.成功の帯.first(), "取込完了の表示").toBeVisible();
  });
});

caseTest("IT-M13-13-006", async (ctx) => {
  await 取り込む(ctx, "M13-13-MULTI-006.csv");
  let a: 保存 = { イベント: [], 日程: [] };
  let b: 保存 = { イベント: [], 日程: [] };
  await ctx.step(4, async () => { a = 読む(名006.A); b = 読む(名006.B); });
  await ctx.expected(async () => {
    expect.soft(一件(名006.A, 1).d?.開始時間, "一括イベントA-006 の日程の開始時間").toBe("2026-10-20 15:00");
    expect.soft(一件(名006.B, 1).d?.開始時間, "一括イベントB-006 の日程の開始時間").toBe("2026-10-21 15:00");
  });
});

caseTest("IT-M13-13-007", 一件のケース("M13-13-PARENT-ONLY-007.csv", 名007, 0));

caseTest("IT-M13-13-008", 一件のケース("M13-13-DEFAULTS-008.csv", 名008, undefined, [
  ["日程の定員（親イベントの定員80）", (x) => x.d?.定員, "80"],
  ["日程の参加費（親イベントの参加費1200）", (x) => x.d?.参加費, "1200"],
], undefined, false, ["定員", "参加費", "定員_日程", "参加費_日程"]));

caseTest("IT-M13-13-009", async (ctx) => {
  const 既存ID = ctx.notes.get("〔イベントID-M1313-009〕");
  await 取り込む(ctx, "M13-13-NEW-ONLY-009.csv");
  let 既存: 保存イベント | null = null;
  let 同名: 保存イベント[] = [];
  await ctx.step(4, async () => { 既存 = 保存されているイベント(既存ID); 同名 = イベント名で探す(名009); });
  await ctx.expected(async () => {
    expect.soft((既存 as 保存イベント | null)?.参加費, `登録済みイベント（イベントID ${既存ID}）の参加費`).toBe("500");
    const 新 = 同名.filter((e) => e.イベントID !== 既存ID);
    expect.soft(新.length, "既存イベントと別のIDで追加されたイベントの件数").toBe(1);
    expect.soft(新[0]?.参加費, "追加されたイベントの参加費").toBe("900");
  });
});

caseTest("IT-M13-13-010", 一件のケース("M13-13-FORMATS-010.csv", 名010, undefined, [
  ["設定されたフォーマット", (x) => [...(x.e?.フォーマット ?? [])].sort(), ["パウパー", "モダン"].sort()],
]));

caseTest("IT-M13-13-011", async (ctx) => {
  await 取り込む(ctx, "M13-13-PAYMENTS-011.csv", ["クレジットカード支払い", "参加費"]);
  await ctx.step(4, async () => { for (const n of Object.values(名011)) イベント名で探す(n); });
  await ctx.expected(async () => {
    for (const [k, want] of [["あり", true], ["なし", false], ["空", false]] as const) {
      expect.soft(イベント名で探す(名011[k]).length, `クレジットカード支払い「${k}」のイベントの件数`).toBe(1);
      // 支払方法は、読み取った支払方法の名前（無ければ「（なし）」）を帯に出して確かめる
      const 支払 = イベント名で探す(名011[k])[0]?.支払方法 ?? [];
      const 読んだ支払方法 = 支払.length ? 支払.join("・") : "（なし）";
      const m = `クレジットカード支払い「${k}」のイベントの支払方法に「${クレジットカード支払}」がある`;
      if (want) expect.soft(読んだ支払方法, m).toContain(クレジットカード支払);
      else expect.soft(読んだ支払方法, m.replace("がある", "が無い")).not.toContain(クレジットカード支払);
    }
  });
});

caseTest("IT-M13-13-013", 登録されないケース("M13-13-UNEDITABLE-013.csv", [名013], undefined, { 行: 2, 語: ["店舗"], 何: "編集できない店舗" }));
// 1データ行目（ファイルの2行目）の存在しない店舗で取込が止まる。会場は列が無く（設計書 L0047 で削除）、不存在の会場の行を作れない
caseTest("IT-M13-13-020", 登録されないケース("M13-13-MASTER-MISSING-020.csv", [], 頭020, { 行: 2, 語: ["店舗", "マスター"], 何: "店舗のマスタが存在しない" }, [
  ["会場のマスタが存在しない行が登録されないこと（会場の列が無く、不存在の会場の行を作れない）", "会場の列が無く、確かめられない"],
]));
// 2データ行目（ファイルの3行目）の店舗が空
caseTest("IT-M13-13-021", 登録されないケース("M13-13-ROLLBACK-021.csv", [名021.正常, 名021.不正], undefined, { 行: 3, 語: ["店舗"], 何: "店舗" }));

caseTest("IT-M13-13-022", async (ctx) => {
  const bulk = await 取り込む(ctx, "M13-13-MULTI-ERROR-022.csv");
  await ctx.expected(async () => {
    const errs = await bulk.エラーの文();
    const 行の = (n: number) => new RegExp(`(^|[^0-9])${n}\\s*行目|行\\s*${n}\\s*[:：]`);
    const has = (n: number, 列: string) => errs.some((t) => 行の(n).test(t) && t.includes(列));
    expect.soft(errs.length, "エラーの一覧の件数（2件以上）").toBeGreaterThanOrEqual(2);
    expect.soft(has(2, "イベント名(日)"), `CSVの2行目の「イベント名(日)」のエラー（表示: ${errs.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(has(3, "店舗"), `CSVの3行目の「店舗」のエラー（表示: ${errs.join(" / ") || "なし"}）`).toBe(true);
  });
});

caseTest("IT-M13-13-026", 一件のケース("M13-13-TSV-026.tsv", 名026, 1, [
  ["日程の開始時間", (x) => x.d?.開始時間, "2026-12-20 15:00"],
]));

caseTest("IT-M13-13-028", async (ctx) => {
  await 取り込む(ctx, "M13-13-SAME-NAME-028.csv");
  let r: 保存 = { イベント: [], 日程: [] };
  await ctx.step(4, async () => { r = 読む(名028); });
  await ctx.expected(async () => {
    expect.soft(r.イベント.length, `イベント名(日)が「${名028}」のイベントの件数`).toBe(2);
    expect.soft(r.日程.map((d) => d.length), "各イベントの日程の件数").toEqual(r.イベント.map(() => 1));
  });
});

caseTest("IT-M13-13-030", async ({ page, step, expected }) => {
  // 4998行・4999行のイベントを登録する取込を2回行うので長くかかる
  test.setTimeout(3_600_000);
  await loginAdmin(page, M1313_ADMIN);
  const bulk = new EventBulkCsvPage(page);
  const 帯 = async () => ({ 赤: await bulk.エラーの文(), 緑: await bulk.成功の文() });
  let 手順2: { 赤: string[]; 緑: string[] } = { 赤: [], 緑: [] };
  let 手順3: { 赤: string[]; 緑: string[] } = { 赤: [], 緑: [] };
  let 超過の件数 = -1;
  await step(1, async () => { await bulk.開く(); });
  await step(2, async () => {
    await bulk.ファイルを選ぶ(m1313File("M13-13-LINES-4999-030.csv"));
    await bulk.アップロードする();
    手順2 = await 帯();
    note(`手順2のあとの画面: 赤の帯 ${手順2.赤.join(" / ") || "（なし）"}／緑の帯 ${手順2.緑.join(" / ") || "（なし）"}`);
  });
  await step(3, async () => {
    await bulk.ファイルを選ぶ(m1313File("M13-13-LINES-5000-030.csv"));
    await bulk.アップロードする();
    手順3 = await 帯();
    note(`手順3のあとの画面: 赤の帯 ${手順3.赤.join(" / ") || "（なし）"}／緑の帯 ${手順3.緑.join(" / ") || "（なし）"}`);
  });
  await step(4, async () => { 超過の件数 = 名前が語で始まるイベントの件数(頭030.超過); });
  await expected(async () => {
    const 上限 = (t: string) => /行を超える/.test(t);
    expect.soft(手順2.赤.filter(上限), "手順2の上限超過のエラー（出ないこと）").toEqual([]);
    expect.soft(手順2.赤, "手順2のエラー（取込が完了し、エラーが無いこと）").toEqual([]);
    expect.soft(手順2.緑.length, "手順2の取込完了の表示").toBeGreaterThan(0);
    expect.soft(手順3.赤.some(上限), `手順3の上限超過のエラー（表示: ${手順3.赤.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(超過の件数, `イベント名(日)が「${頭030.超過}」で始まるイベントの件数`).toBe(0);
  });
});

caseTest("IT-M13-13-031", 一件のケース("M13-13-NORMALIZE-031.csv", 名031, undefined, [
  ["イベント名(日)にゼロ幅スペースを含む", (x) => (x.e?.["イベント名(日)"] ?? "\u200B").includes("\u200B"), false],
  ["フリー入力エリア1の内容(日)（「一行目」と「二行目」の間はLFだけ。改行を見えるように書いた形）", (x) => JSON.stringify(x.e?.フリー入力エリア[0]?.["内容(日)"] ?? ""), JSON.stringify("一行目\n二行目")],
  ["フリー入力エリア1の内容(日)にCRを含む", (x) => (x.e?.フリー入力エリア[0]?.["内容(日)"] ?? "\r").includes("\r"), false],
], undefined, false, ["フリー入力エリア1項目名(日)", "フリー入力エリア1内容(日)"]));

// 2データ行目（ファイルの3行目）の店舗が空
caseTest("IT-M13-13-032", 登録されないケース("M13-13-BREAK-032.csv", [`${頭032}前行`, `${頭032}不正行`, `${頭032}後行`], 頭032, { 行: 3, 語: ["店舗"], 何: "店舗" }));

caseTest("IT-M13-13-036", 一件のケース("M13-13-FREE-ONLINE-036.csv", 名036, 1, [], undefined, true, ["クレジットカード支払い", "参加費", "オンライン受付", "参加費_日程"]));
caseTest("IT-M13-13-037", 一件のケース("M13-13-NOONLINE-PAID-037.csv", 名037, 1, [], undefined, true, ["クレジットカード支払い", "参加費", "受付", "オンライン受付"]));
caseTest("IT-M13-13-038", 一件のケース("M13-13-NOVENUE-038.csv", 名038, 1, [], undefined, true, "見出し"));

caseTest("IT-M13-13-040", async (ctx) => {
  await 取り込む(ctx, "M13-13-MIXED-040.csv");
  let a: 保存 = { イベント: [], 日程: [] };
  let b: 保存 = { イベント: [], 日程: [] };
  await ctx.step(4, async () => { a = 読む(名040.A); b = 読む(名040.B); });
  await ctx.expected(async () => {
    expect.soft(一件(名040.A, 1).d?.開始時間, "混在日程ありイベント-M1313-040A の日程の開始時間").toBe("2026-10-20 15:00");
    expect.soft(一件(名040.B, 0).e?.["イベント名(日)"], "混在日程なしイベント-M1313-040B のイベント").toBe(名040.B);
  });
});

caseTest("IT-M13-13-042", 一件のケース("M13-13-FEE-ZERO-042.csv", 名042, 1, [], undefined, true, ["クレジットカード支払い", "参加費", "オンライン受付", "参加費_日程"]));

const カード有: 確かめ = [`イベントの支払方法に「${クレジットカード支払}」がある`, (x) => クレカ有効(x.e), true];
const 日程のオンライン = (on: boolean): 確かめ => ["日程のオンライン受付", (x) => x.d?.オンライン受付, on ? "真" : "偽"];
const 日程の参加費 = (v: string): 確かめ => ["日程の参加費", (x) => x.d?.参加費, v];
caseTest("IT-M13-13-044", 一件のケース("M13-13-CB044.csv", 名044, 1, [カード有, 日程のオンライン(true), 日程の参加費("0")]));
caseTest("IT-M13-13-045", 一件のケース("M13-13-CB045.csv", 名045, 1, [カード有, 日程のオンライン(false), 日程の参加費("0")]));
caseTest("IT-M13-13-046", 一件のケース("M13-13-CB046.csv", 名046, 1, [カード有, 日程のオンライン(true), 日程の参加費("1200")]));
caseTest("IT-M13-13-047", 一件のケース("M13-13-CB047.csv", 名047, 1, [カード有, 日程のオンライン(false), 日程の参加費("800")]));
caseTest("IT-M13-13-048", 一件のケース("M13-13-CB048.csv", 名048, 0, [カード有]));
caseTest("IT-M13-13-049", 一件のケース("M13-13-CB049.csv", 名049, 0, [
  [`イベントの支払方法に「${クレジットカード支払}」がある（有効にならないこと）`, (x) => クレカ有効(x.e), false],
]));
