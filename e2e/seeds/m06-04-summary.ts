/**
 * M06-04 買取ステータス変更 の、買取集計・金額・明細が要るシード（DBで整える）。正本: cases/M06-04_seed_data.tsv
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で作った実行の印つきの買取にだけ、DBで値・明細・集計の行を入れる（db/m06_04_prep.ts）。
 *
 * 共通の作り方:
 * - 試験対象の買取は、フロントの店頭買取査定申込（会員登録なし）で作る（申込者の名に実行の印）。決め打ちの店頭買取受注ID・査定ID（600410026 など）は、
 *   画面が振った番号に読み替える。買取のステータス・買取成立日・査定合計金額・買取明細・個別入力商品・実在庫明細・既存の買取集計は、DBで入れる。
 * - 同じ日の「ほかの受注」（正本が決め打ちの査定IDで挙げる）は、試験対象の買取の申込者情報を写してDBで足す（名に同じ印を付ける）。
 * - 正本の「その日の受注と集計を全件退避して削除し、ケース終了時に戻す」は行わない（共有のデータを消さない）。代わりに、
 *   (1) 前の実行・同じ日を使う別ケースの印つきの買取は、買取成立日を空にして集計から外し、
 *   (2) その日に集計対象の実データの買取（印の無い、金額のある買取）が無いことを確かめ（あれば止める）、
 *   (3) 買取店舗A・Bのその日の買取集計だけを消して、正本の既存の集計の行を入れる。
 *   この読み替えは、シードの報告に残す。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 買取の日付, 買取集計 } from "../db/m06_04";
import * as prep from "../db/m06_04_prep";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { OtcOrderDetailPage } from "../pages/admin/m06_04_status";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { registerFrontMember } from "../pages/front/member_entry";
import { applyAsMember, PurchaseHistoryPage } from "../pages/front/m06_otc_buy";
import { QG_STORE, QG_MEMBER_PASSWORD } from "./m06-04";
import { 作った買取, 読み替えを登録する, 店舗Aで申込む } from "./m06-04-status";

const L_A = "〔店舗ID-M0604-共有A〕";
const L_B = "〔店舗ID-M0604-共有B〕";
const L_CARD = "〔部門ID-M0604-共有カード〕";
const L_SUP = "〔部門ID-M0604-共有サプライ〕";

/** 今日の日付（日本時間。YYYY-MM-DD） */
export const 今日の日 = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

type 部門名 = "カード" | "サプライ";
type 明細定め = { 部門: 部門名; 買取: number; 販売: number; 商品?: string };
type 個別定め = { 名前: string; 部門: 部門名; 買取: number; 販売: number };
type 受注定め = {
  /** 買取店舗（既定 A） */
  店?: "A" | "B";
  状態: string;
  /** 買取成立日（日本時間 'YYYY-MM-DD HH:MM:SS'。null は空） */
  成立日: string | null;
  明細?: 明細定め[];
  個別?: 個別定め[];
  キャンセル日?: string | null;
  入庫日時?: string | null;
  /** 実在庫明細（商品コードの実体は、明細の商品） */
  実在庫?: { 数量: number; 小計: number };
  /** 正本の決め打ちの査定ID（読み替えの記録に使う。主の買取は読み替えを登録する） */
  査定ID?: string;
};
type 集計定め = { 日: string; 店: "A" | "B"; 部門: 部門名; 買取: number; 販売: number };

type 集計シード = {
  needs?: string[];
  /** 申込者の姓・名（名には実行の印を付ける） */
  姓: string;
  名: string;
  /** 前の実行などの買取を集計から外すときの、名の先頭（4文字以上）。同じ日を使う別ケースの名の先頭も含める */
  家族: string[];
  主: 受注定め;
  /** 正本の決め打ちの査定ID（主の買取を読み替える） */
  主の査定ID?: string;
  他?: 受注定め[];
  集計?: 集計定め[];
  /** 商品マスタに登録する商品コード（印を付ける）。明細の商品 'M0604-STOCK-044' など */
  商品?: string[];
  控え?: (notes: Notes, 主: 作った買取, 印: string) => void;
  読み替え?: string;
};

let 連番 = 0;

const 部門ID = (notes: Notes, 名: 部門名) => notes.get(名 === "カード" ? L_CARD : L_SUP);
const 店ID = (notes: Notes, 店: "A" | "B") => notes.get(店 === "A" ? L_A : L_B);

/** 受注の値・明細・個別入力・実在庫を入れる */
function 受注を整える(notes: Notes, 受注ID: string, 印: string, o: 受注定め, 商品コード: (原: string) => string): void {
  const 明細 = (o.明細 ?? []).map((m) => ({ ...m, 商品: m.商品 ? 商品コード(m.商品) : undefined }));
  const 個別 = o.個別 ?? [];
  const 合計 = 明細.reduce((s, m) => s + m.買取, 0) + 個別.reduce((s, m) => s + m.買取, 0);
  // 端数調整（査定合計金額 − 明細の合計 − 個別入力の合計）が出ないよう、査定合計金額は明細と個別入力の買取金額の合計にする
  prep.買取を整える(受注ID, 印, { 状態: o.状態, 成立日: o.成立日, 合計金額: 明細.length + 個別.length ? 合計 : null, キャンセル日: o.キャンセル日, 入庫日時: o.入庫日時 });
  for (const m of 明細) prep.明細を足す(受注ID, 印, { 部門ID: 部門ID(notes, m.部門), 買取金額: m.買取, 販売金額: m.販売, 商品コード: m.商品 });
  for (const v of 個別) prep.個別入力商品を足す(受注ID, 印, { 名前: v.名前, 部門ID: 部門ID(notes, v.部門), 買取金額: v.買取, 販売金額: v.販売 });
  if (o.実在庫) {
    const 商品 = 明細.find((m) => m.商品)?.商品;
    if (!商品) throw new Error("実在庫明細を足すには、商品つきの明細が要る");
    prep.実在庫明細を足す(受注ID, 印, 商品, o.実在庫.数量, o.実在庫.小計);
  }
}

const 日の部分 = (s: string | null) => (s ? s.slice(0, 10) : null);

/** 買取集計のシード（シード表1行＝1つ） */
function defineSummarySeed(seedId: string, d: 集計シード): void {
  defineSeed(seedId, { needs: ["S-M06-04-MASTER", ...(d.needs ?? [])] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const 商品コード = (原: string) => rc(原);
    if (d.商品?.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await サプライ品を登録する(page, d.商品!.map((c) => ({ コード: 商品コード(c), 名前: 商品コード(c), 基準価格: "1000", 買取価格: "500" })), issue);
      });
    }
    const 印 = rc(d.名);
    const 主 = await 店舗Aで申込む(browser, seed.シードID, d.姓, 印);
    if (d.主の査定ID) 読み替えを登録する(d.主の査定ID, 主);
    // 日: 受注の成立日と集計の日（主の成立日が空でも、その日に集計が作られる当日を含める）
    const 日 = [...new Set([...[d.主, ...(d.他 ?? [])].map((o) => 日の部分(o.成立日)), ...(d.集計 ?? []).map((c) => c.日)].filter((x): x is string => !!x))];
    const 店 = [店ID(notes, "A"), 店ID(notes, "B")];
    for (const 日付 of 日) {
      const 外した = prep.前の買取を集計から外す(日付, d.家族, [主.受注ID]);
      if (外した) issue(`${日付} を買取成立日に持つ前の印つきの買取 ${外した} 件を、DBで買取成立日を空にして集計から外した`);
      const 実 = prep.実データの買取の件数(日付, d.家族, [主.受注ID]);
      if (実 > 0) throw new Error(`${日付} を買取成立日に持つ、集計対象で金額のある買取（印つきでないもの）が ${実} 件ある。共有のデータは消せない決まりなので止めた（その日の買取集計を作り直すと、ほかの人のデータが変わる）`);
      const 消した = prep.その日の集計を消す(主.受注ID, 印, 日付, 店);
      if (消した) issue(`${日付} の買取店舗A・Bの買取集計 ${消した} 件を、DBで消した（その日に集計対象の実データの買取が無いことを確かめたうえで）`);
    }
    受注を整える(notes, 主.受注ID, 印, d.主, 商品コード);
    let n = 0;
    for (const o of d.他 ?? []) {
      n += 1;
      連番 += 1;
      const 査定ID = `S${RUN_MARK}${Date.now().toString(36)}${連番}`.slice(0, 32).toUpperCase();
      const id = prep.買取を写して足す(主.受注ID, 印, { 査定ID, 名: `${印}-${n}`, 状態: o.状態, 成立日: o.成立日, 合計金額: null, 店舗ID: o.店 === "B" ? 店ID(notes, "B") : undefined });
      受注を整える(notes, id, 印, o, 商品コード);
    }
    for (const c of d.集計 ?? []) prep.集計を足す(主.受注ID, 印, c.日, 店ID(notes, c.店), 部門ID(notes, c.部門), c.買取, c.販売);
    d.控え?.(notes, 主, 印);
    issue([
      `決め打ちの店頭買取受注ID・査定ID${d.主の査定ID ? ` ${d.主の査定ID}` : ""} は、画面が振った店頭買取受注ID ${主.受注ID}・査定ID ${主.査定ID} に読み替えた`,
      `買取のステータス・買取成立日・査定合計金額・買取明細・個別入力商品${d.他?.length ? `・ほかの受注 ${d.他.length} 件（申込者情報を写した）` : ""}${d.集計?.length ? `・既存の買取集計 ${d.集計.length} 件` : ""}は、画面で作れないので、DBで入れた`,
      "正本の「その日の受注と集計を全件退避して削除し、終了時に戻す」は行わない（共有のデータを消さない）。前の実行などの印つきの買取は買取成立日を空にして集計から外し、その日に集計対象の実データの買取が無いことを確かめ、買取店舗A・Bのその日の集計だけをDBで作り直した",
      d.読み替え ?? "",
    ].filter(Boolean).join("。"));
  });
}

const 成立日 = (日: string, 時分 = "10:00:00") => `${日} ${時分}`;

// ---------------------------------------------------------------- 026〜029・043・044・052・053（決め打ちの日）

const 家族共通 = ["SUMM"];

defineSummarySeed("S-M06-04-SUMMARY-IN-026", {
  姓: "M0604", 名: "SUMM026", 家族: 家族共通, 主の査定ID: "600410026",
  主: { 状態: "経理払い出し待ち", 成立日: 成立日("2026-08-20", "09:00:00"), 明細: [{ 部門: "カード", 買取: 1000, 販売: 1600 }], 個別: [{ 名前: "個別入力商品026", 部門: "カード", 買取: 200, 販売: 500 }] },
  他: [
    { 状態: "入庫待ち", 成立日: 成立日("2026-08-20", "10:00:00"), 明細: [{ 部門: "カード", 買取: 300, 販売: 600 }] },
    { 店: "B", 状態: "入庫待ち", 成立日: 成立日("2026-08-20", "11:00:00"), 明細: [{ 部門: "サプライ", 買取: 400, 販売: 800 }] },
    { 状態: "ダブルチェック済み", 成立日: 成立日("2026-08-20", "12:00:00"), 明細: [{ 部門: "カード", 買取: 9000, 販売: 9000 }] },
    { 状態: "データ出力済み", 成立日: 成立日("2026-08-20", "13:00:00"), 明細: [{ 部門: "カード", 買取: 8000, 販売: 8000 }] },
  ],
  集計: [{ 日: "2026-08-20", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }, { 日: "2026-08-20", 店: "B", 部門: "サプライ", 買取: 1, 販売: 1 }],
  読み替え: "ダブルチェック済み・データ出力済みの買取は、集計対象でないステータスの番号（3・4）で足した。データ出力済みの買取金額8000円は、明細1件（買取8000円・販売8000円）で表した",
});

defineSummarySeed("S-M06-04-SUMMARY-TARGET-027", {
  姓: "M0604", 名: "SUMM027", 家族: 家族共通, 主の査定ID: "600420027",
  主: { 状態: "買取成立", 成立日: 成立日("2026-08-21", "10:00:00"), 明細: [{ 部門: "カード", 買取: 700, 販売: 1000 }] },
  他: [{ 状態: "入庫待ち", 成立日: 成立日("2026-08-21", "11:00:00"), 明細: [{ 部門: "カード", 買取: 200, 販売: 300 }] }],
  集計: [{ 日: "2026-08-21", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
});

defineSummarySeed("S-M06-04-SUMMARY-OUT-028", {
  姓: "M0604", 名: "SUMM028", 家族: 家族共通, 主の査定ID: "600430028",
  主: { 状態: "入庫待ち", 成立日: 成立日("2026-08-22", "10:00:00"), 明細: [{ 部門: "カード", 買取: 800, 販売: 1200 }] },
  他: [{ 状態: "入庫待ち", 成立日: 成立日("2026-08-22", "11:00:00"), 明細: [{ 部門: "カード", 買取: 250, 販売: 400 }] }],
  集計: [{ 日: "2026-08-22", 店: "A", 部門: "カード", 買取: 1050, 販売: 1600 }],
});

defineSummarySeed("S-M06-04-SUMMARY-NONTARGET-029", {
  姓: "M0604", 名: "SUMM029", 家族: 家族共通, 主の査定ID: "600440029",
  主: { 状態: "査定前", 成立日: 成立日("2026-08-23", "10:00:00"), 明細: [{ 部門: "カード", 買取: 100, 販売: 200 }] },
  集計: [{ 日: "2026-08-23", 店: "A", 部門: "カード", 買取: 999, 販売: 999 }],
});

defineSummarySeed("S-M06-04-SUMMARY-ENTER-043", {
  姓: "M0604", 名: "SUMM043", 家族: 家族共通, 主の査定ID: "600450043",
  主: { 状態: "管理者取消", 成立日: 成立日("2026-08-24", "10:00:00"), 明細: [{ 部門: "カード", 買取: 600, 販売: 900 }] },
  他: [{ 状態: "入庫待ち", 成立日: 成立日("2026-08-24", "11:00:00"), 明細: [{ 部門: "カード", 買取: 250, 販売: 400 }] }],
  集計: [{ 日: "2026-08-24", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
});

defineSummarySeed("S-M06-04-SUMMARY-STOCKED-044", {
  姓: "M0604", 名: "SUMM044", 家族: 家族共通, 主の査定ID: "600460044", 商品: ["M0604-STOCK-044"],
  主: {
    状態: "入庫待ち", 成立日: 成立日("2026-08-25", "10:00:00"), 入庫日時: null,
    明細: [{ 部門: "カード", 買取: 700, 販売: 1100, 商品: "M0604-STOCK-044" }], 実在庫: { 数量: 1, 小計: 700 },
  },
  他: [{ 状態: "買取成立", 成立日: 成立日("2026-08-25", "11:00:00"), 明細: [{ 部門: "カード", 買取: 150, 販売: 250 }] }],
  集計: [{ 日: "2026-08-25", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
  読み替え: "商品「M0604-STOCK-044」（実行の印つき）はグッズ商品CSV登録で作った。買取店舗AのECCUBE在庫5は入れていない（在庫の行が無ければ入庫の処理が新しく作る。ケースは買取集計だけを確かめる）",
});

defineSummarySeed("S-M06-04-SUMMARY-ONLY-052", {
  姓: "M0604", 名: "SUMM052", 家族: 家族共通, 主の査定ID: "600520052",
  主: { 状態: "入庫待ち", 成立日: 成立日("2026-07-14", "10:00:00"), 明細: [{ 部門: "カード", 買取: 800, 販売: 1200 }] },
  集計: [{ 日: "2026-07-14", 店: "A", 部門: "カード", 買取: 800, 販売: 1200 }],
});

defineSummarySeed("S-M06-04-SUMMARY-OTHERDAY-053", {
  姓: "M0604", 名: "SUMM053", 家族: 家族共通, 主の査定ID: "600530053",
  主: { 状態: "入庫待ち", 成立日: 成立日("2026-07-16", "10:00:00"), 明細: [{ 部門: "カード", 買取: 700, 販売: 1000 }] },
  他: [
    { 状態: "入庫待ち", 成立日: 成立日("2026-07-16", "11:00:00"), 明細: [{ 部門: "カード", 買取: 200, 販売: 300 }] },
    { 状態: "入庫待ち", 成立日: 成立日("2026-07-13", "10:00:00"), 明細: [{ 部門: "カード", 買取: 100, 販売: 200 }] },
  ],
  集計: [{ 日: "2026-07-16", 店: "A", 部門: "カード", 買取: 900, 販売: 1300 }, { 日: "2026-07-13", 店: "A", 部門: "カード", 買取: 999, 販売: 999 }],
});

// ---------------------------------------------------------------- 当日（051・065）。同じ日を使うので、家族に互いの名の先頭を含める

const 当日の家族 = ["SUMM051", "M0604-CB065-B"];

defineSummarySeed("S-M06-04-ACCOUNTING-SUMMARY-051", {
  姓: "M0604", 名: "SUMM051", 家族: 当日の家族, 主の査定ID: "600510051",
  主: { 状態: "経理払い出し待ち", 成立日: null, 明細: [{ 部門: "カード", 買取: 900, 販売: 1400 }] },
  集計: [{ 日: 今日の日(), 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
  控え: (notes) => notes.set("〔当日-M0604-051〕", 今日の日()),
});

defineSummarySeed("S-M06-04-CBPENDINGTOSUCCESS-065", {
  姓: "M0604-CB065-A", 名: "M0604-CB065-B", 家族: 当日の家族,
  主: { 状態: "入庫待ち", 成立日: null, 明細: [{ 部門: "カード", 買取: 400, 販売: 650 }] },
  控え: (notes, 主) => { notes.set("〔店頭買取受注ID-M0604-065〕", 主.受注ID); notes.set("〔査定ID-M0604-065〕", 主.査定ID); },
});

// ---------------------------------------------------------------- 決め打ちの日（2027-03-xx）

defineSummarySeed("S-M06-04-CBSUMMARYOUT-066", {
  姓: "M0604-CB066-A", 名: "M0604-CB066-B", 家族: ["M0604-CB066-B"], 主の査定ID: "8806601",
  主: { 状態: "未登録在庫あり", 成立日: 成立日("2027-03-11", "10:00:00"), キャンセル日: null, 明細: [{ 部門: "カード", 買取: 800, 販売: 1200 }] },
  他: [{ 状態: "買取成立", 成立日: 成立日("2027-03-11", "11:00:00"), 明細: [{ 部門: "カード", 買取: 250, 販売: 400 }] }],
  集計: [{ 日: "2027-03-11", 店: "A", 部門: "カード", 買取: 1050, 販売: 1600 }],
});

defineSummarySeed("S-M06-04-CBSUMMARYACC-067", {
  姓: "M0604-CB067-A", 名: "M0604-CB067-B", 家族: ["M0604-CB067-B"], 主の査定ID: "8806701",
  主: { 状態: "買取成立", 成立日: 成立日("2027-03-12", "10:00:00"), 明細: [{ 部門: "カード", 買取: 700, 販売: 1100 }] },
  他: [{ 状態: "入庫待ち", 成立日: 成立日("2027-03-12", "11:00:00"), 明細: [{ 部門: "カード", 買取: 350, 販売: 500 }] }],
  集計: [{ 日: "2027-03-12", 店: "A", 部門: "カード", 買取: 900, 販売: 1500 }],
});

defineSummarySeed("S-M06-04-CBSUMMARYSTOCKED-069", {
  姓: "M0604-CB069-A", 名: "M0604-CB069-B", 家族: ["M0604-CB069-B"], 主の査定ID: "8806901", 商品: ["M0604-CB069-STOCK"],
  主: {
    状態: "買取キャンセル", 成立日: 成立日("2027-03-14", "10:00:00"), 入庫日時: null,
    明細: [{ 部門: "カード", 買取: 700, 販売: 1100, 商品: "M0604-CB069-STOCK" }], 実在庫: { 数量: 1, 小計: 700 },
  },
  他: [{ 状態: "買取成立", 成立日: 成立日("2027-03-14", "11:00:00"), 明細: [{ 部門: "カード", 買取: 150, 販売: 250 }] }],
  集計: [{ 日: "2027-03-14", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
  読み替え: "商品「M0604-CB069-STOCK」（実行の印つき）はグッズ商品CSV登録で作った。買取店舗AのECCUBE在庫5は入れていない（在庫の行が無ければ入庫の処理が新しく作る）",
});

defineSummarySeed("S-M06-04-CBACCBTNDATED-072", {
  姓: "M0604-CB072-A", 名: "M0604-CB072-B", 家族: ["M0604-CB072-B"],
  主: { 状態: "経理払い出し待ち", 成立日: 成立日("2027-03-17", "10:00:00"), キャンセル日: null, 入庫日時: null, 明細: [{ 部門: "カード", 買取: 500, 販売: 800 }] },
  他: [{ 状態: "買取成立", 成立日: 成立日("2027-03-17", "11:00:00"), 明細: [{ 部門: "カード", 買取: 120, 販売: 200 }] }],
  集計: [{ 日: "2027-03-17", 店: "A", 部門: "カード", 買取: 1, 販売: 1 }],
  控え: (notes, 主) => { notes.set("〔店頭買取受注ID-M0604-072〕", 主.受注ID); notes.set("〔査定ID-M0604-072〕", 主.査定ID); },
});

// ---------------------------------------------------------------- 046 会員の買取（査定合計金額45678円）

const qg001Email = () => `${rc("qg0604-001")}@example.test`;

defineSeed("S-M06-04-QG-ORDER-046", { needs: ["S-M06-04-QG-STORE"] }, async ({ browser, notes, seed }) => {
  const email = qg001Email();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: "QG0604-001-会員", 名: "試験", セイ: "キュージー", メイ: "シケン", メール: email, パスワード: QG_MEMBER_PASSWORD });
  } finally {
    await context.close();
  }
  const context2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context2);
    const page = await context2.newPage();
    page.setDefaultTimeout(60_000);
    await applyAsMember(page, QG_STORE.支店URL, { メール: email, パスワード: QG_MEMBER_PASSWORD }, { 姓: "QG0604-001-会員", 名: "試験", セイ: "キュージー", メイ: "シケン" });
    const history = new PurchaseHistoryPage(page);
    await history.openList();
    notes.set("〔買取番号-M0604-QG001〕", await history.最新の買取番号());
  } finally {
    await context2.close();
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const customerId = await customerIdByEmail(page, email);
    if (!customerId) throw new Error(`会員 ${email} が会員一覧に出ない`);
    notes.set("〔会員ID-M0604-QG001〕", customerId);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる(notes.get("〔買取番号-M0604-QG001〕"));
    await list.検索する();
    const rows = await list.行();
    if (rows.length !== 1 || rows[0].ステータス !== "査定前" || rows[0].買取店舗 !== QG_STORE.店名) {
      throw new Error(`QG0604-001-会員の買取が「査定前」の1件でない（${JSON.stringify(rows)}）`);
    }
  });
  prep.会員の買取の査定合計金額を設定する(notes.get("〔買取番号-M0604-QG001〕"), rc("qg0604-001"), 45678);
  reportSeedIssue(seed.シードID, "会員の登録は管理画面に新規登録の画面が無いので、フロントの会員登録（本登録のメール）で作った。査定金額合計45678円は画面で指定できないので、DBで買取の査定合計金額を45678にした");
});

// ---------------------------------------------------------------- 054・055（MTGバイヤーでの査定を、DBの個別入力商品に読み替える）

export const M0604_RF: Account = { loginId: "m0604_rf", password: "Passw0rd-M0604RF" };

defineSeed("S-M06-04-RF-ADM", { needs: ["S-M06-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-04連携担当者", ログインID: M0604_RF.loginId, メールアドレス: "m0604_rf@example.test", パスワード: M0604_RF.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
  reportSeedIssue(seed.シードID, "東京店舗は、M06-01 と共通の試験店舗「買取店舗A」に読み替えた。ITチームの所属・買取関連の権限は、権限「システム管理者」・先頭の所属に読み替えた。デフォルト検索表示店舗は全店でなく買取店舗Aにした");
});

/** 部門を名前で探し、無ければ登録する（部門のIDを返す） */
async function 部門を用意する(browser: Browser, 名: string, コード: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const dept = new DepartmentPage(page);
    await dept.openNew();
    const found = (await dept.allRows()).filter((r) => r.部門名 === 名);
    if (found.length > 1) throw new Error(`部門「${名}」が${found.length}件ある。どれを使うか決められない`);
    if (found.length === 1) return found[0].ID;
    return dept.register({ 部門名: 名, 部門コード: コード, 免税区分: "対象外", MTGBuyer表示フラグ: true }, `部門「${名}」の登録`);
  });
}

defineSeed("S-M06-04-RF-CONFIG", async ({ browser, notes, seed }) => {
  notes.set("〔部門ID-M0604-RF共有〕", await 部門を用意する(browser, "RF0604固定価格部門", "9060400"));
  reportSeedIssue(seed.シードID, "共有の設定（追加システム設定の固定価格商品部門ID）は書き換えず、部門「RF0604固定価格部門」を用意しただけ。ケースの買取は査定合計金額を個別入力商品の合計と同じにしてあり、端数調整が出ないので、固定価格商品部門は集計の結果に関わらない");
});

/** RF の買取（東京店舗＝買取店舗A）。個別入力商品1点をDBで入れる。MTGバイヤーの査定・印刷・経理払い出し待ちの操作はDBの値で置き換える */
function defineRfOrderSeed(seedId: string, no: "001" | "002", 成立する: boolean): void {
  defineSeed(seedId, { needs: ["S-M06-04-RF-ADM", "S-M06-04-MASTER"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const 部門名 = `RF0604-${no}部門`;
    const 部門 = await 部門を用意する(browser, 部門名, no === "001" ? "9060401" : "9060402");
    notes.set(`〔部門ID-M0604-${no}〕`, 部門);
    const 印 = rc(`ORDER${no}`);
    const 買取 = await 店舗Aで申込む(browser, seed.シードID, "RF買取", 印);
    読み替えを登録する(`RF${no}`, 買取);
    const 今日 = 今日の日();
    const 店 = notes.get(L_A);
    const 外した = prep.前の買取を集計から外す(今日, [`ORDER${no}`], [買取.受注ID]);
    if (外した) issue(`前の印つきの買取 ${外した} 件を、DBで買取成立日を空にして集計から外した`);
    const 消した = prep.その日の集計を消す(買取.受注ID, 印, 今日, [店], 部門);
    if (消した) issue(`当日の部門「${部門名}」の買取集計 ${消した} 件を、DBで消した（この部門は、このケースの買取だけが使う）`);
    prep.買取を整える(買取.受注ID, 印, { 状態: "経理払い出し待ち", 成立日: null, 合計金額: 1000 });
    prep.個別入力商品を足す(買取.受注ID, 印, { 名前: `RF0604-${no}個別商品`, 部門ID: 部門, 買取金額: 1000, 販売金額: 3000 });
    notes.set(`〔査定番号-M0604-${no}〕`, 買取.査定番号);
    issue(`MTGバイヤー（買取端末のアプリ）での査定・印刷・経理払い出し待ちの操作は、DBで置き換えた: 買取 ${買取.受注ID} をステータス「経理払い出し待ち」・査定合計金額1000にし、個別入力商品「RF0604-${no}個別商品」（買取1000円・枚数1・基準価格3000円・部門「${部門名}」）を足した。東京店舗は買取店舗Aに読み替えた`);
    if (成立する) {
      await withAdminSession(browser, M0604_RF, async (page) => {
        page.setDefaultTimeout(60_000);
        const d = new OtcOrderDetailPage(page);
        const st = await d.open(買取.受注ID);
        if (st >= 400) throw new Error(`買取詳細が開けない（応答 ${st}）`);
        await new OtcDetailPage(page).ステータスを変える("買取成立");
      });
      const 行 = 買取集計(今日, [店]).filter((r) => r.部門ID === 部門);
      if (行.length !== 1 || 行[0].買取金額 !== 1000) throw new Error(`買取成立にしたあとの当日の集計に、部門「${部門名}」の買取金額1000円の行が1件にならない（${JSON.stringify(行)}）`);
      issue(`ステータス変更画面（${M0604_RF.loginId}）で「買取成立」にした。アプリは買取成立の保存で続けて未登録在庫ありにするので、ステータスは買取成立でなく「未登録在庫あり」（個別入力商品あり）になっている。買取成立日は ${買取の日付(買取.受注ID).成立日}`);
    }
  });
}
defineRfOrderSeed("S-M06-04-RF-ORDER-054", "001", false);
defineRfOrderSeed("S-M06-04-RF-ORDER-055", "002", true);
