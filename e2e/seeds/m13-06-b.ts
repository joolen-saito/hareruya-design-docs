/**
 * M13-06 イベント申込一覧（検索入力）の追加シード（画面操作）。正本: cases/M13-06_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）で、シード表の「DBで準備」は画面で作る。画面で作れない値（申込日時・支払番号）だけ、実行の印つきの申込に限り DB へ書く
 * （db/m13_06_prep.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） 経由。書いたことは各シードの注記に残す）。
 *
 * - イベント情報検索のモーダル（MODAL-005・006・056）: 日程は画面で登録する。005・056 はモーダルの開催日（2026/09/01〜09/30）で探すので、日程の開催日はシード表のまま（読み替えない）。
 *   006 は開催日を指定せず（初期値は画面を開いた日の3か月前から）検索するので、開催日の年だけを実行した日以後へ読み替える（既存のシードと同じ）。
 * - 「晴大会」（FILTER-030・031）: ほかのシードの検索語と混ざらないよう、印をつけた「晴大会030」「晴大会031」に読み替える（手順の検索語も同じ値）。
 *   プレイヤー名「晴屋 太郎」は、姓に印をつけた「晴屋031」・名「太郎」で代える。
 * - 申込日時・支払番号（FILTER-023・DECKAPP-062・DECKPAY-067）: DB で、印つきの申込に設定した。
 * - 一括更新（BULK-026・BULK1-074）: 申込状況「入金待ち」は画面の申込詳細・編集で変える。この変更で各申込に申込履歴が付くので、
 *   「申込履歴0件」は成り立たない（ケースは、ケースの始めに読んだ件数からの増減で確かめる）。
 * - 作らないシード（ケースを実装しない）: MAX-032（申込12001件・デッキ12001件の大量登録）。
 */
import { 申込日時と支払番号を設定する } from "../db/m13_06_prep";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { 申込を登録する } from "../pages/admin/m13_06_entry_list";
import { registerSchedule, ScheduleInput } from "../pages/admin/schedule";
import {
  defineEntrySeed, M1306_ADMIN, M1306_IKEBUKURO_ADMIN, イベント, 会員を登録する, 日程, 検証会員, 池袋店の管理者を用意する, 申込, 英名,
  開催日の読み替えを残す,
} from "./m13-06";

/** シード表のまま（開催日を読み替えない）の日程。オンライン受付ありなら 2026-08-01〜08-31 */
const 固定日程 = (開始時間: string, オンライン: boolean): ScheduleInput => ({
  開始時間, 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false,
  ...(オンライン ? { オンライン受付: { 開始: "2026-08-01 00:00", 終了: "2026-08-31 00:00" } } : {}),
});

// ---- イベント情報検索のモーダル ----

defineSeed("S-M13-06-MODAL-005", { needs: ["S-M13-06-ADM"] }, async ({ browser }) => {
  const k = rc("M1306MODAL-005");
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    const a = await registerEvent(page, イベント(`${k}-A`, 英名("005A"), "新宿店"));
    await registerSchedule(page, a, 固定日程("2026-09-10 10:00", true));
    const b = await registerEvent(page, イベント(`${k}-B`, 英名("005B"), "新宿店"));
    await registerSchedule(page, b, 固定日程("2026-09-11 10:00", false));
  });
  await 池袋店の管理者を用意する(browser);
  await withAdminSession(browser, M1306_IKEBUKURO_ADMIN, async (page) => {
    const c = await registerEvent(page, イベント(`${k}-C`, 英名("005C"), "池袋店"));
    await registerSchedule(page, c, 固定日程("2026-09-12 10:00", true));
  });
});
/** 005 のイベント名（検索語に、末尾の A・B・C を付けたもの） */
export const モーダル005 = () => ({ 語: rc("M1306MODAL-005"), A: `${rc("M1306MODAL-005")}-A`, B: `${rc("M1306MODAL-005")}-B`, C: `${rc("M1306MODAL-005")}-C` });

/** 006: 新宿店・オンライン受付ありの日程12件（11イベント。最後のイベントだけ2日程） */
export const モーダル006の語 = () => rc("M1306MODAL-006");
defineSeed("S-M13-06-MODAL-006", { needs: ["S-M13-06-ADM"] }, async ({ browser, seed }) => {
  const k = モーダル006の語();
  開催日の読み替えを残す(seed.シードID, "2026-09-10 10:00");
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    for (let i = 1; i <= 11; i++) {
      const nn = String(i).padStart(2, "0");
      const id = await registerEvent(page, イベント(`${k}-${nn}`, 英名(`006-${nn}`), "新宿店"));
      await registerSchedule(page, id, 日程("2026-09-10 10:00"));
      if (i === 11) await registerSchedule(page, id, 日程("2026-09-11 10:00"));
    }
  });
});

defineSeed("S-M13-06-MODAL-056", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes }) => {
  await 池袋店の管理者を用意する(browser);
  await withAdminSession(browser, M1306_IKEBUKURO_ADMIN, async (page) => {
    const id = await registerEvent(page, イベント(rc("M1306-056"), 英名("056"), "池袋店"));
    notes.set("〔イベントID-M1306-056〕", id);
    notes.set("〔日程ID-M1306-056〕", await registerSchedule(page, id, 固定日程("2026-09-15 10:00", true)));
  });
});

// ---- 申込の一覧表示（新宿店2件・池袋店1件） ----

export const 申込023 = { 語: () => rc("M1306-023"), 姓: (x: "A" | "B" | "C") => rc(`検証M1306-023${x}`), 支払番号: (x: "A" | "B" | "C") => `PAY-M1306-023${x}` };
defineSeed("S-M13-06-FILTER-023", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes, seed }) => {
  const k = 申込023.語();
  開催日の読み替えを残す(seed.シードID, "2026-09-10 10:00");
  for (const x of ["A", "B", "C"] as const) await 会員を登録する(browser, 検証会員(申込023.姓(x)), `023-${x}`);
  await 池袋店の管理者を用意する(browser);
  const 作る = async (account: typeof M1306_ADMIN, x: "A" | "B" | "C", 店舗: "新宿店" | "池袋店") =>
    withAdminSession(browser, account, async (page) => {
      const 名日 = `${k}${x}`;
      const id = await registerEvent(page, イベント(名日, 英名(`023${x}`), 店舗));
      const d = await registerSchedule(page, id, 日程("2026-09-10 10:00"));
      const e = await 申込を登録する(page, 名日, d, 申込023.姓(x));
      notes.set(`〔申込ID-M1306-023${x}〕`, e);
      return e;
    });
  const ids = [await 作る(M1306_ADMIN, "A", "新宿店"), await 作る(M1306_ADMIN, "B", "新宿店"), await 作る(M1306_IKEBUKURO_ADMIN, "C", "池袋店")];
  for (const [i, x] of (["A", "B", "C"] as const).entries()) 申込日時と支払番号を設定する(ids[i], null, 申込023.支払番号(x), RUN_MARK);
  reportSeedIssue(seed.シードID, "一覧に表示する支払番号（PAY-M1306-023A〜C）を、DBで印つきの申込に設定した（画面には設定する操作が無い）。イベント名は検索語に A・B・C を付けた3件");
});

// ---- 一括更新（入金待ち2件） ----

defineEntrySeed("S-M13-06-BULK-026", "026", { 名日: rc("M1306BULK-026"), 申込: [申込("026", "A", { 状況: "入金待ち" }), 申込("026", "B", { 状況: "入金待ち" })] });
defineEntrySeed("S-M13-06-BULK1-074", "074", { 名日: rc("M1306BULK-074"), 申込: [申込("074", "A", { 状況: "入金待ち" }), 申込("074", "B", { 状況: "入金待ち" })] });

// ---- 晴大会（030・031） ----

export const 晴大会 = (n: "030" | "031") => rc(`晴大会${n}`);
defineEntrySeed("S-M13-06-FILTER-030", "030", { 名日: 晴大会("030"), 申込: [申込("030", "")] });
export const 晴屋031 = { 姓: () => rc("晴屋031"), 名: "太郎" };
defineEntrySeed("S-M13-06-FILTER-031", "031", { 名日: 晴大会("031"), 申込: [{ label: "〔申込ID-M1306-031〕", 姓: 晴屋031.姓(), 名: 晴屋031.名, デッキ: {} }] });

// ---- デッキ登録の行（062・067） ----

export const 申込日時062 = "2026-08-05 09:30";
export const 申込日時067 = "2026-08-06 10:00";
function define支払の行(seedId: string, n: "062" | "067", 申込日時: string, 支払番号: string): void {
  defineEntrySeed(seedId, n, {
    名日: rc(`M1306-${n}`),
    申込: [{ label: `〔申込ID-M1306-${n}〕`, 姓: rc(`検証M1306-${n}`), 状況: "入金待ち", デッキ: { label: `〔デッキID-M1306-${n}〕` } }],
    後処理: (ids: string[]) => {
      申込日時と支払番号を設定する(ids[0], 申込日時, 支払番号, RUN_MARK);
      reportSeedIssue(seedId, `申込日時（${申込日時}）と支払番号（${支払番号}）を、DBで印つきの申込に設定した（画面には設定する操作が無い）。支払方法は申込登録の初期表示のまま（コンビニ決済には変えていない）`);
    },
  });
}
define支払の行("S-M13-06-DECKAPP-062", "062", 申込日時062, "PAY-M1306-062");
define支払の行("S-M13-06-DECKPAY-067", "067", 申込日時067, "PAY-M1306-067");

