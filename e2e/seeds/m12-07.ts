/**
 * M12-07 フォーマット売上分析 集計一覧表示 のシード。正本: cases/M12-07_seed_data.tsv
 *
 * 売上集計用のデータ（003・025〜036）:
 * 依頼者の方針 2026-11-10: テストデータは画面で作る。画面で作れない受注日・金額・タグの紐付けなどは、実行の印つきの受注に限り DB へ書く（db/m12_08.ts・db/m12_07.ts）。
 * - 受注: M12-08 と同じく、フロントの購入で印つきの受注を1件だけ画面で作り（基の受注。本店・宅配便）、その受注・配送先・明細の行を DB で写して必要な数の受注にする。
 * - 売上分析タグ: 共有のマスタなので足さない。既存のタグのうち、名称も表示順も重複しない先頭の2件を使い、タグ1を「スタンダード」、タグ2を「モダン」に読み替える。
 * - 集計月: 共有の開発環境にはほかの人の受注があるため、シード表の月（2026-04・2025-01 など）の代わりに、ほかの人の受注が1件も無い、遠い将来の年の同じ月を使う。
 *   2025-02 は28日の月なので、うるう年でない年を探す。受注日の年もこの年に読み替える（036 の前年は、その前の年）。
 * - 店舗: 受注の店舗・配送方法は、通販＝本店の宅配便（基の受注のまま）、店舗＝配送方法を店頭受取にした受注で表す（支店の受注にはしない。支店は共有の店舗）。
 *   アプリの集計は、本店の宅配便だけを通販、それ以外を店舗とするので、結果は同じになる。
 * - カード商品: S-M12-08-REF が画面で作ったカード商品（カード詳細を指す印つきの商品）。カード商品以外は基の受注の商品（グッズ商品）。
 */
import { Browser } from "@playwright/test";
import { ケースを控える, 定め, 受注を作る, 月の日数, 空いている年 } from "../db/m12_07";
import { カード商品ID, 使う売上分析タグ, 作った受注, 明細の商品ID } from "../db/m12_08";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account } from "../lib/session";
import { 受注を作る as 画面で受注を作る } from "./m05-01";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1207_ADMIN: Account = { loginId: "m1207_admin", password: "Passw0rd!M1207" };

defineSeed("S-M12-07-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-07試験管理者", account: M1207_ADMIN, メール: "m1207_admin@example.test" });
});

const pad = (n: number) => String(n).padStart(2, "0");
const day = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

defineSeed("S-M12-07-MASTER", { needs: ["S-M12-07-ADM"] }, async ({ notes, seed }) => {
  const tags = 使う売上分析タグ(2);
  notes.set("〔売上分析タグID-M1207-共有A〕", tags[0].id);
  notes.set("〔売上分析タグID-M1207-共有B〕", tags[1].id);
  reportSeedIssue(seed.シードID, `読み替え: 売上分析タグは共有のマスタなので登録せず、既存のタグ（名称・表示順が重複しない先頭の2件）「${tags[0].名称}」「${tags[1].名称}」を、` +
    "シード表の「スタンダード」「モダン」に読み替えた（ケースの確認もこの名称で行う）。本店・支店・配送方法（宅配便・店頭受取）は既存のマスタを参照した");
});

type データの定め = {
  月: number;
  隣?: [number, number][];
  非閏年のみ?: boolean;
  受注: (y: number) => 定め[];
  /** 控える呼び名の末尾（受注・明細。受注が複数のとき A・B） */
  控え: { 受注: string[]; 明細: string[]; 商品: string };
  注記?: string[];
};

let basePromise: Promise<{ 受注ID: string }> | null = null;
function 基の受注(browser: Browser, issue: (m: string) => void): Promise<{ 受注ID: string }> {
  if (!basePromise) {
    basePromise = 画面で受注を作る(browser, "M12-07 の売上集計用データの基の受注", "注文受領", issue);
    basePromise.catch(() => { basePromise = null; });
  }
  return basePromise;
}

function 控える(notes: Notes, d: データの定め, 受注: 作った受注[]): void {
  notes.set(`〔商品ID-M1207-${d.控え.商品}〕`, 明細の商品ID(受注[0].明細[0].明細ID));
  d.控え.受注.forEach((k, i) => notes.set(`〔受注ID-M1207-${k}〕`, 受注[i].受注ID));
  d.控え.明細.forEach((k, i) => notes.set(`〔受注明細ID-M1207-${k}〕`, 受注[i].明細[0].明細ID));
}

function defineSalesDataSeed(seedId: string, d: データの定め): void {
  const no = /-(\d{3})$/.exec(seedId)![1];
  const caseNo = `A${no.slice(1)}`;
  defineSeed(seedId, { needs: ["S-M12-07-MASTER", "S-M05-01-ADM", "S-M12-08-REF"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const y = 空いている年(caseNo, { 月: d.月, データを置く月: d.隣, 非閏年のみ: d.非閏年のみ });
    const tags = 使う売上分析タグ(2);
    const base = await 基の受注(browser, issue);
    const cardProduct = カード商品ID(notes.get("〔カード詳細ID-M1208-共有〕"));
    const 受注 = 受注を作る(base.受注ID, caseNo, d.受注(y), { タグID: tags.map((t) => t.id), カード商品ID: cardProduct });
    ケースを控える(no, { 集計月: `${y}-${pad(d.月)}`, 日数: 月の日数(y, d.月), タグ名: tags.map((t) => t.名称), タグID: tags.map((t) => t.id), 受注 });
    控える(notes, d, 受注);
    issue(`読み替え: シード表の集計月・受注日の年は、ほかの人の受注が無い遠い将来の年（実行ごとに探して決める）に読み替えた（集計月 ${y}-${pad(d.月)}）。売上分析タグは共有のマスタなので足さず、` +
      `既存のタグの先頭の2件を、タグ1＝シード表のスタンダード（「${tags[0].名称}」）・タグ2＝モダン（「${tags[1].名称}」）に読み替えた`);
    issue("DBで設定した: 受注は、画面（フロントの購入）で作った印つきの受注の行をDBで写し、受注日・対応状況・受注明細の単価・数量・商品・売上分析タグの紐付けを設定した" +
      "（画面では指定できないため）。店舗の受注は、配送先の配送方法を店頭受取にした（支店の受注にはしていない。本店の宅配便以外は店舗として集計される）");
    issue("読み替え: カード商品は S-M12-08-REF で作ったカード商品、カード商品以外は基の受注の商品（グッズ商品）を使った。商品コードは印つきの基の受注の商品のまま");
    for (const n of d.注記 ?? []) issue(n);
  });
}

const ひとつ = (n: string) => ({ 受注: [n], 明細: [n], 商品: `${n}A` });
const ふたつ = (n: string) => ({ 受注: [`${n}A`, `${n}B`], 明細: [`${n}A`, `${n}B`], 商品: `${n}A` });

defineSalesDataSeed("S-M12-07-DATA-003", {
  月: 4,
  受注: (y) => [
    { 日: day(y, 4, 1), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] },
    { 日: day(y, 4, 2), 状態: "入金済み", 明細: [{ 単価: 200, 数量: 1, タグ: 2 }], 店頭受取: true },
  ],
  控え: ふたつ("003"),
});
defineSalesDataSeed("S-M12-07-CBTSUHANTENPO-025", { 月: 1, 受注: (y) => [{ 日: day(y, 1, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }], 店頭受取: true }], 控え: ひとつ("025") });
defineSalesDataSeed("S-M12-07-CBTSUHANCARD-026", {
  月: 2, 非閏年のみ: true, 受注: (y) => [{ 日: day(y, 2, 10), 状態: "入金済み", 明細: [{ 単価: 700, 数量: 1, カード: true }] }], 控え: ひとつ("026"),
  注記: ["読み替え: 2025-02（28日）に当たる月として、うるう年でない年の2月を探して使った"],
});
defineSalesDataSeed("S-M12-07-CBTSUHANOTHER-027", { 月: 3, 受注: (y) => [{ 日: day(y, 3, 10), 状態: "入金済み", 明細: [{ 単価: 500, 数量: 1 }], 店頭受取: true }], 控え: ひとつ("027") });
defineSalesDataSeed("S-M12-07-CBTENPOCARD-028", { 月: 4, 受注: (y) => [{ 日: day(y, 4, 10), 状態: "入金済み", 明細: [{ 単価: 700, 数量: 1, カード: true }], 店頭受取: true }], 控え: ひとつ("028") });
defineSalesDataSeed("S-M12-07-CBTENPOTAG-029", { 月: 5, 受注: (y) => [{ 日: day(y, 5, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }], 控え: ひとつ("029") });
defineSalesDataSeed("S-M12-07-CBTENPOOTHER-030", { 月: 6, 受注: (y) => [{ 日: day(y, 6, 10), 状態: "入金済み", 明細: [{ 単価: 500, 数量: 1 }] }], 控え: ひとつ("030") });
defineSalesDataSeed("S-M12-07-CBHANDCARD-031", {
  月: 7,
  受注: (y) => [
    { 日: day(y, 7, 10), 状態: "入金済み", 明細: [{ 単価: 700, 数量: 1, カード: true }], 店頭受取: true, 引き渡し先: 1 },
    { 日: day(y, 7, 10), 状態: "入金済み", 明細: [{ 単価: 800, 数量: 1, カード: true }], 店頭受取: true, スマレジ由来: true },
  ],
  控え: ふたつ("031"),
  注記: ["DBで設定した: 元EC受注の移行先受注に、スマレジ由来の受注（スマレジ取引IDを設定した受注）を設定した（引き渡し済み）"],
});
defineSalesDataSeed("S-M12-07-CBHANDOTHER-032", {
  月: 8,
  受注: (y) => [
    { 日: day(y, 8, 10), 状態: "入金済み", 明細: [{ 単価: 500, 数量: 1 }], 引き渡し先: 1 },
    { 日: day(y, 8, 10), 状態: "入金済み", 明細: [{ 単価: 600, 数量: 1 }], スマレジ由来: true },
  ],
  控え: ふたつ("032"),
  注記: ["DBで設定した: 元EC受注の移行先受注に、スマレジ由来の受注を設定した（引き渡し済み）"],
});
defineSalesDataSeed("S-M12-07-CBBOTHTAG-033", { 月: 9, 受注: (y) => [{ 日: day(y, 9, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }], 店頭受取: true }], 控え: ひとつ("033") });
defineSalesDataSeed("S-M12-07-CBHANDTAG-034", {
  月: 10,
  受注: (y) => [
    { 日: day(y, 10, 10), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }], 店頭受取: true, 引き渡し先: 1 },
    { 日: day(y, 10, 10), 状態: "入金済み", 明細: [{ 単価: 1200, 数量: 1, タグ: 1 }], 店頭受取: true, スマレジ由来: true },
  ],
  控え: ふたつ("034"),
  注記: ["DBで設定した: 元EC受注の移行先受注に、スマレジ由来の受注を設定した（引き渡し済み）"],
});
defineSalesDataSeed("S-M12-07-CBCANCEL-035", { 月: 11, 受注: (y) => [{ 日: day(y, 11, 10), 状態: "キャンセル", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }], 控え: ひとつ("035") });
defineSalesDataSeed("S-M12-07-CBOUTMONTH-036", {
  月: 12, 隣: [[-1, 12]],
  受注: (y) => [{ 日: day(y - 1, 12, 15), 状態: "入金済み", 明細: [{ 単価: 1000, 数量: 1, タグ: 1 }] }],
  控え: ひとつ("036"),
  注記: ["読み替え: 集計月（2025-12）の外の受注日 2024-12-15 は、集計月の前の年の同じ月の15日にした"],
});
