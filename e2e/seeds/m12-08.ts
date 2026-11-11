/**
 * M12-08 フォーマット売上分析 CSVダウンロード のシード。正本: cases/M12-08_seed_data.tsv
 * - 試験管理者: メンバー管理で登録（権限はシステム管理者・所属店舗は本店＝店舗ID 1）。
 * - ブラウザセッション: 専用ブラウザプロファイルは、ケースごとの新しいブラウザの状態（検索条件なし・検索未実行）で成り立つ。作るものは無い。
 * - 売上集計用のデータ（005〜027）: 下の説明を参照。
 *
 * 売上集計用のデータ（依頼者の方針 2026-11-10: テストデータは画面で作る。画面で作れない受注日・金額・タグの紐付けなどは、印つきの受注に限り DB へ書く。db/m12_08.ts）
 * - 受注: M05-01 と同じく、フロントの購入で印つきの受注を1件だけ画面で作り（基の受注）、その受注・配送先・明細の行を DB で写して、必要な数の受注にする。
 * - 売上分析タグ: 共有のマスタなので足さない。既存のタグのうち、名称も表示順も重複しない先頭の2件を使い、タグ1を「スタンダード」・「M1208-CBnnn-TAG」、
 *   タグ2を「モダン」に読み替える。
 * - 集計月: 共有の開発環境にはほかの人の受注があるため、シード表の月（2026-04 など）の代わりに、ほかの人の受注が1件も無い、遠い将来の年の同じ月を使う。
 *   年は探して決める（見つからなければ止める）。受注日の年はすべてこの年に読み替える（シード表の2023年は、その前の年）。
 * - カード商品: S-M12-08-REF が画面で作ったカード商品（カード詳細を指す印つきの商品）を使う。カード商品以外は基の受注の商品（グッズ商品）。
 * - 受注の店舗・配送方法: 集計対象（通販・店舗）の両方を選ぶので結果に影響しない。基の受注（本店・宅配便）のままにした。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  カード商品ID, ケースを控える, 月の日数, 受注の定め, 受注群を作る, 使う売上分析タグ, 作った受注, 明細の商品ID, 空いている年を探す,
} from "../db/m12_08";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { カードと商品を作る } from "../pages/admin/m12_deck_seed";
import { 受注を作る as 画面で受注を作る } from "./m05-01";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1208_ADMIN: Account = { loginId: "m1208_admin", password: "Passw0rd!M1208" };

defineSeed("S-M12-08-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-08試験管理者", account: M1208_ADMIN, メール: "m1208_admin@example.test" });
});
defineSeed("S-M12-08-SESSION-002", async () => { /* ケースごとの新しいブラウザの状態（検索未実行）で成り立つ */ });
defineSeed("S-M12-08-SESSION-003", async () => { /* ケースごとの新しいブラウザの状態（検索条件がセッションに無い）で成り立つ */ });

const pad = (n: number) => String(n).padStart(2, "0");

defineSeed("S-M12-08-REF", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(90_000);
    page.setDefaultNavigationTimeout(180_000);
    const [c] = await カードと商品を作る(page, [{
      カード名: "M1208-REF-CARD", セット名日: "M1208-REF-SETJ", セット名英: "M1208-REF-SETE", セット略称: "M1208R", 特殊タイプ: [],
      商品: { 商品コード: "M1208-REF-CP", 商品名日: "M1208-REF-PRODJ", 商品名英: "M1208-REF-PRODE" },
    }], seed.シードID, issue);
    if (!c.カード詳細ID || !c.商品ID) throw new Error("S-M12-08-REF: カード詳細・カード商品を作れなかった");
    notes.set("〔カードセットID-M1208-共有〕", c.カードセットID);
    notes.set("〔カードID-M1208-共有〕", c.カードID);
    notes.set("〔カード詳細ID-M1208-共有〕", c.カード詳細ID);
  });
  issue("読み替え: 店舗ID 1・受注状態（新規受付・キャンセル）・配送方法は既存のマスタを参照した。カード詳細はカードセット登録・カード登録の画面で作り、" +
    "カード商品（カード詳細を指す商品）はグッズ商品CSV登録とカード指定で作った（カード商品かどうかの判定に使うため）");
});

type データの定め = {
  月: number;
  隣?: [number, number][];
  閏年のみ?: boolean;
  /** 年から受注の定めを作る */
  受注: (y: number) => 受注の定め[];
  /** 控える呼び名の末尾（受注・明細。受注が複数のとき A・B） */
  控え?: { 受注: string[]; 明細: string[] };
  /** 売上分析タグの控え（〔売上分析タグID-M1208-{ここ}〕）と、商品の控え（〔商品ID-M1208-{ここ}〕） */
  タグ控え?: string[];
  商品控え?: string;
  注記?: string[];
};

let basePromise: Promise<{ 受注ID: string }> | null = null;
function 基の受注(browser: Browser, issue: (m: string) => void): Promise<{ 受注ID: string }> {
  if (!basePromise) {
    basePromise = 画面で受注を作る(browser, "M12-08 の売上集計用データの基の受注", "注文受領", issue);
    basePromise.catch(() => { basePromise = null; });
  }
  return basePromise;
}

const day = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
/** シード表の「明細ID 1〜5」の組: スタンダード1000×2・250×2、モダン400×1、タグなしカード300×2、タグなし非カード200×1 */
const 基本の明細: 受注の定め["明細"] = [
  { 単価: 1000, 数量: 2, タグ: 1 }, { 単価: 250, 数量: 2, タグ: 1 }, { 単価: 400, 数量: 1, タグ: 2 },
  { 単価: 300, 数量: 2, カード: true }, { 単価: 200, 数量: 1 },
];
const 注 = {
  置き換え: "読み替え: シード表の集計月・受注日の年は、ほかの人の受注が無い遠い将来の年（実行ごとに探して決める）に読み替えた。売上分析タグは共有のマスタなので足さず、" +
    "既存のタグの先頭の2件を、タグ1＝シード表のスタンダード（CBの各ケースでは「M1208-CBnnn-TAG」）・タグ2＝モダンに読み替えた（ケースの確認もこの名称で行う）",
  DB: "DBで設定した: 受注は、画面（フロントの購入）で作った印つきの受注の行をDBで写し、受注日・対応状況・受注明細の単価・数量・商品・売上分析タグの紐付けを設定した" +
    "（受注日と金額・タグの紐付けは画面で指定できないため）。受注の店舗・配送方法は集計に影響しないので、基の受注のままにした",
  商品: "読み替え: カード商品は S-M12-08-REF で作ったカード商品、カード商品以外は基の受注の商品（グッズ商品）を使った。商品IDの控えは、その商品ID",
};

function defineSalesDataSeed(seedId: string, d: データの定め): void {
  const caseNo = /-(\d{3})$/.exec(seedId)![1];
  defineSeed(seedId, { needs: ["S-M05-01-ADM", "S-M12-08-REF"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const y = 空いている年を探す(caseNo, { 月: d.月, データを置く月: d.隣, 閏年のみ: d.閏年のみ });
    const tags = 使う売上分析タグ(2);
    const base = await 基の受注(browser, issue);
    const cardProduct = カード商品ID(notes.get("〔カード詳細ID-M1208-共有〕"));
    const 受注 = 受注群を作る(base.受注ID, caseNo, d.受注(y), { タグID: tags.map((t) => t.id), カード商品ID: cardProduct });
    ケースを控える(caseNo, { 集計月: `${y}-${pad(d.月)}`, 日数: 月の日数(y, d.月), タグ名: tags.map((t) => t.名称), タグID: tags.map((t) => t.id), 受注 });
    控える(notes, d, tags.map((t) => t.id), 受注);
    issue(注.置き換え);
    issue(`${注.DB}（集計月 ${y}-${pad(d.月)}）`);
    issue(注.商品);
    for (const n of d.注記 ?? []) issue(n);
  });
}

/** シード表が控えると定める呼び名を控える */
function 控える(notes: Notes, d: データの定め, tagIds: string[], 受注: 作った受注[]): void {
  for (const k of d.タグ控え ?? []) notes.set(`〔売上分析タグID-M1208-${k}〕`, tagIds[0]);
  if (d.商品控え) notes.set(`〔商品ID-M1208-${d.商品控え}〕`, 明細の商品ID(受注[0].明細[0].明細ID));
  (d.控え?.受注 ?? []).forEach((k, i) => notes.set(`〔受注ID-M1208-${k}〕`, 受注[i].受注ID));
  (d.控え?.明細 ?? []).forEach((k, i) => notes.set(`〔受注明細ID-M1208-${k}〕`, 受注[i].明細[0].明細ID));
}

const ひとつ = (n: string) => ({ 控え: { 受注: [n], 明細: [n] }, タグ控え: [n], 商品控え: `${n}A` });
const ふたつ = (n: string) => ({ 控え: { 受注: [`${n}A`, `${n}B`], 明細: [`${n}A`, `${n}B`] }, タグ控え: [n], 商品控え: `${n}A` });

defineSalesDataSeed("S-M12-08-BASE-005", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 1), 状態: "新規受付", 明細: 基本の明細 }] });
defineSalesDataSeed("S-M12-08-BOUNDARY-006", {
  月: 4, 隣: [[0, 3], [0, 5]],
  受注: (y) => [
    { 日: day(y, 3, 31), 状態: "新規受付", 明細: [{ 単価: 4000, 数量: 1, タグ: 1 }] },
    { 日: day(y, 4, 1), 状態: "新規受付", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] },
    { 日: day(y, 4, 30), 状態: "新規受付", 明細: [{ 単価: 2000, 数量: 1, タグ: 1 }] },
    { 日: day(y, 5, 1), 状態: "新規受付", 明細: [{ 単価: 8000, 数量: 1, タグ: 1 }] },
  ],
});
defineSalesDataSeed("S-M12-08-CANCEL-007", {
  月: 4,
  受注: (y) => [
    { 日: day(y, 4, 15), 状態: "新規受付", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] },
    { 日: day(y, 4, 15), 状態: "キャンセル", 明細: [{ 単価: 9000, 数量: 1, タグ: 1 }] },
  ],
});
defineSalesDataSeed("S-M12-08-BASE-008", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 1), 状態: "新規受付", 明細: [{ 単価: 300, 数量: 2, カード: true }, { 単価: 200, 数量: 1 }] }] });
defineSalesDataSeed("S-M12-08-BASE-010", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 1), 状態: "新規受付", 明細: 基本の明細 }] });
defineSalesDataSeed("S-M12-08-REFRESH-011", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 10), 状態: "新規受付", 明細: [{ 単価: 1000, 数量: 1, タグ: 1, カード: true }] }] });
defineSalesDataSeed("S-M12-08-BASE-014", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 1), 状態: "新規受付", 明細: 基本の明細 }] });
defineSalesDataSeed("S-M12-08-BASE-015", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 1), 状態: "新規受付", 明細: 基本の明細 }] });
defineSalesDataSeed("S-M12-08-DAYS31-018", {
  月: 5, 隣: [[0, 4], [0, 6]],
  受注: (y) => [
    { 日: day(y, 4, 30), 状態: "新規受付", 明細: [{ 単価: 4000, 数量: 1, タグ: 1, カード: true }] },
    { 日: day(y, 5, 1), 状態: "新規受付", 明細: [{ 単価: 1000, 数量: 1, タグ: 1, カード: true }] },
    { 日: day(y, 5, 31), 状態: "新規受付", 明細: [{ 単価: 2000, 数量: 1, タグ: 1, カード: true }] },
    { 日: day(y, 6, 1), 状態: "新規受付", 明細: [{ 単価: 8000, 数量: 1, タグ: 1, カード: true }] },
  ],
});
defineSalesDataSeed("S-M12-08-HANDOVER-019", {
  月: 4,
  受注: (y) => [
    { 日: day(y, 4, 10), 状態: "新規受付", 明細: [{ 単価: 1000, 数量: 1, タグ: 1, カード: true }], 引き渡し先: 1 },
    { 日: day(y, 4, 10), 状態: "新規受付", 明細: [{ 単価: 1200, 数量: 1, タグ: 1, カード: true }], スマレジ由来: true },
  ],
  注記: ["DBで設定した: 元EC受注の移行先受注に、スマレジ由来の受注（スマレジ取引IDを設定した受注）を設定した（引き渡し済み）"],
});
defineSalesDataSeed("S-M12-08-CBTAGSHOP-020", {
  月: 1, 受注: (y) => [{ 日: day(y, 1, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }], ...ひとつ("020"),
  注記: ["読み替え: 受注は支店サイトの店頭受取でなく、本店の宅配便の受注の写し（通販・店舗の両方を集計に含めるので結果に影響しない）"],
});
defineSalesDataSeed("S-M12-08-CBHANDCARD-021", {
  月: 2, 閏年のみ: true,
  受注: (y) => [
    { 日: day(y, 2, 10), 状態: "入金済み", 明細: [{ 単価: 700, 数量: 1, カード: true }], 引き渡し先: 1 },
    { 日: day(y, 2, 10), 状態: "入金済み", 明細: [{ 単価: 800, 数量: 1, カード: true }], スマレジ由来: true },
  ],
  ...ふたつ("021"),
  注記: ["読み替え: 2024-02（29日）に当たる月として、うるう年の2月を探して使った。引き渡し済みの元EC受注の移行先受注にスマレジ由来の受注を設定した"],
});
defineSalesDataSeed("S-M12-08-CBHANDOTHER-022", {
  月: 3,
  受注: (y) => [
    { 日: day(y, 3, 10), 状態: "入金済み", 明細: [{ 単価: 500, 数量: 1 }], 引き渡し先: 1 },
    { 日: day(y, 3, 10), 状態: "入金済み", 明細: [{ 単価: 600, 数量: 1 }], スマレジ由来: true },
  ],
  ...ふたつ("022"),
  注記: ["DBで設定した: 引き渡し済みの元EC受注の移行先受注にスマレジ由来の受注を設定した"],
});
defineSalesDataSeed("S-M12-08-CBCARDSHOP-023", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 10), 状態: "入金済み", 明細: [{ 単価: 700, 数量: 1, カード: true }] }], ...ひとつ("023") });
defineSalesDataSeed("S-M12-08-CBHANDTAG-024", {
  月: 5,
  受注: (y) => [
    { 日: day(y, 5, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }], 引き渡し先: 1 },
    { 日: day(y, 5, 10), 状態: "入金済み", 明細: [{ 単価: 1200, 数量: 1, タグ: 1 }], スマレジ由来: true },
  ],
  ...ふたつ("024"),
  注記: ["DBで設定した: 引き渡し済みの元EC受注の移行先受注にスマレジ由来の受注を設定した"],
});
defineSalesDataSeed("S-M12-08-CBTAKUHAI-025", { 月: 6, 受注: (y) => [{ 日: day(y, 6, 10), 状態: "入金済み", 明細: [{ 単価: 500, 数量: 1 }] }], ...ひとつ("025") });
defineSalesDataSeed("S-M12-08-CBCANCEL-026", { 月: 7, 受注: (y) => [{ 日: day(y, 7, 10), 状態: "キャンセル", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }], ...ひとつ("026") });
defineSalesDataSeed("S-M12-08-CBOUTMONTH-027", {
  月: 8, 隣: [[-1, 8]],
  受注: (y) => [{ 日: day(y - 1, 8, 15), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }],
  ...ひとつ("027"),
  注記: ["読み替え: 集計月（2024-08）の外の受注日 2023-08-15 は、集計月の前の年の同じ月の15日にした"],
});

// 売上0件（009）: 受注を作らず、ほかの人の受注が無い月を確かめて決める。売上分析タグは既存の先頭の2件を使う
defineSeed("S-M12-08-NO-SALES-009", async ({ notes, seed }) => {
  const y = 空いている年を探す("009", { 月: 4 });
  const tags = 使う売上分析タグ(2);
  ケースを控える("009", { 集計月: `${y}-04`, 日数: 月の日数(y, 4), タグ名: tags.map((t) => t.名称), タグID: tags.map((t) => t.id), 受注: [] });
  notes.set("〔売上分析タグID-M1208-009A〕", tags[0].id);
  notes.set("〔売上分析タグID-M1208-009B〕", tags[1].id);
  reportSeedIssue(seed.シードID, 注.置き換え);
  reportSeedIssue(seed.シードID, `読み替え: 売上分析タグを新しく登録せず既存の2件を使った。集計月は、受注が1件も無い月 ${y}-04 を探して使った（受注を作らず、受注の削除もしていない）`);
});
