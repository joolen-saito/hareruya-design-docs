/**
 * M05-01 受注管理（受注情報検索）— DB への書き込みを使うシード（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 正本: cases/M05-01_seed_data.tsv。画面だけでは作れなかった受注の組（注文番号の部分一致の組・指定の日時・区分・金額・非会員・別の店舗・
 * スマレジ由来・会員の購入実績）を、次の方針で作る。
 *
 * - まず画面で受注を1件作る（seeds/m05-01.ts の 受注を作る。フロントの購入。1回の実行で1件だけ。「基の受注」）。
 * - 基の受注の受注・配送先・明細の行を DB で写して、必要な数の受注を足す（db/m05_01_order_write.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけで書く。
 *   親は印つきの受注。印は、この実行で作った試験商品の商品コード）。
 * - 写した受注を、シード表が「DBで設定」と定める値に整える。画面で作れる値（対応状況の一部・支払方法マスタの行）は画面で作ったものを使う。
 * - 注文番号: 受注の注文番号は11文字までの列。シード表の決め打ち（M0501-…）は入らないので、
 *   「E＋実行の印の下5桁＋ケース番号3桁（9文字）」の接頭辞に、2桁までの末尾を付けた値に読み替える。
 *   接頭辞は実行ごとに変わる。ケースの手順の注文番号の入力（M0501-… の部分一致）も、その接頭辞に読み替える（注文番号の読み替え）。
 * - 会員: 画面から作れる試験用の会員は1人だけなので、会員の購入実績を確かめるシードは、その会員を写した「印つきのメールアドレスの会員」を使う。
 * - 店舗: 試験店舗B（M05-01）は ADM シードが画面で作る。スマレジ由来・閉店の店舗は、店舗登録画面で作る固定の試験店舗（閉店だけ DB で閉店にする）。
 * - DB で整えた内容は、シードの注記に「DBで〜を〜に設定した」と残す。
 */
import { Browser } from "@playwright/test";
import {
  受注の整え, 受注を整える, 受注を複製する, 会員を複製する, 会員の購入実績を設定する, 店舗ID, 店舗を閉店にする, 顧客グループ, 配送方法, 配送方法ID, 日本時間, 実行日のn日前,
} from "../db/m05_01_order_write";
import { query } from "../lib/db";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { withAdminSession } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { OrderSearchPage } from "../pages/admin/m05_01_order_search_k";
import {
  M0501_ADMIN, M0501_BUYER, savePatterns, 支払方法を登録する, 受注を作る, 注文番号の読み替えを登録, 店舗Bの店名,
} from "./m05-01";

// ---------------------------------------------------------------- 注文番号の接頭辞

const TOKEN = RUN_MARK.slice(-5).toUpperCase().padStart(5, "0");

/** ケース番号3桁から、注文番号の接頭辞（E＋印の下5桁＋ケース番号＝9文字）。注文番号は11文字までなので末尾は2文字まで */
export function 接頭辞(ケース番号: string): string {
  return `E${TOKEN}${ケース番号}`;
}

// ---------------------------------------------------------------- 試験用の店舗

export const 店舗SM: M0424StoreInput = {
  店名: "試験スマレジ店舗（M05-01）", 店名カナ: "シケンスマレジテンポ", 店名英語: "Test Store Smaregi Mfive", 支店URL: "m0501storesm", 店名略称3文字: "R5S", ショップ名略称: "試験スマレジ",
  会社名: "M05-01試験会社", 会社名カナ: "シケンガイシャ", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿4-9-3", 住所2: "試験ビル3F", 電話番号: "03-0501-0003",
};
export const 店舗閉店: M0424StoreInput = {
  店名: "試験閉店店舗（M05-01）", 店名カナ: "シケンヘイテンテンポ", 店名英語: "Test Store Closed Mfive", 支店URL: "m0501storecl", 店名略称3文字: "R5C", ショップ名略称: "試験閉店",
  会社名: "M05-01試験会社", 会社名カナ: "シケンガイシャ", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿4-9-4", 住所2: "試験ビル4F", 電話番号: "03-0501-0004",
};

const storeIds = new Map<string, Promise<string>>();
/** 試験用の店舗（無ければ店舗登録画面で作る）の店舗ID。作った店舗は固定の名前で、2回目からは作らず探す */
function 試験店舗(browser: Browser, v: M0424StoreInput, issue: (m: string) => void): Promise<string> {
  let p = storeIds.get(v.店名);
  if (!p) {
    p = (async () => {
      try { return 店舗ID(v.店名); } catch { /* 無ければ作る */ }
      return withAdminSession(browser, SETUP_ADMIN, (page) => ensureStore(page, v, issue));
    })();
    p.catch(() => storeIds.delete(v.店名));
    storeIds.set(v.店名, p);
  }
  return p;
}

// ---------------------------------------------------------------- 基の受注・基の会員

let basePromise: Promise<{ 受注ID: string }> | null = null;
/** 画面で作る基の受注（1回の実行で1件だけ） */
function 基の受注(browser: Browser, issue: (m: string) => void): Promise<{ 受注ID: string }> {
  if (!basePromise) {
    basePromise = 受注を作る(browser, "M05-01 DB 書き込みシードの基の受注", "注文受領", issue);
    basePromise.catch(() => { basePromise = null; });
  }
  return basePromise;
}

function 基の会員ID(): string {
  const r = query(`select id from dtb_customer where email = $1 and del_flg = 0 order by id desc limit 1`, [M0501_BUYER.メール]);
  if (r.length === 0) throw new Error(`試験用の会員（${M0501_BUYER.メール}）が見つからない`);
  return String(r[0].id);
}

// ---------------------------------------------------------------- 定義

export type 店舗種別 = "本店" | "店舗B" | "スマレジ" | "閉店";
export type 定義 = {
  /** 正本の注文番号（シード表の決め打ちの値） */
  正本: string;
  /** 注文番号の末尾（2文字まで。省略時は通し番号2桁） */
  接尾?: string;
  整え?: 受注の整え;
  店舗?: 店舗種別;
  /** 同じキーの受注は、同じ「基の会員を写した印つきの会員」の受注にする */
  会員?: string;
  /** 顧客グループ（既存の先頭3件のうちの何番目か。0始まり） */
  会員グループ?: number;
  /** シード表が控えると定める呼び名 */
  控え?: { 注文番号?: string; 受注ID?: string };
  /** 注文番号を接頭辞に一致させない（手順の中で一致させる受注） */
  不一致の番号?: boolean;
};

export type 後の文脈 = {
  browser: Browser; notes: Notes; issue: (m: string) => void; 接頭辞: string;
  作った: Map<string, { 注文番号: string; 受注ID: string }>;
  会員: Map<string, string>;
};

export type 設定 = {
  /** 正本の接頭辞 → 注文番号の接頭辞に付ける末尾（検索の部分一致に使う語） */
  組: Record<string, string>;
  受注: 定義[] | ((ctx: { browser: Browser; issue: (m: string) => void }) => Promise<定義[]>);
  /** 注文番号の末尾を「正本の番号が小さいほど大きい番号」にし、受注日も小さい番号ほど新しくする（既定の並びが注文番号の降順のため） */
  降順?: boolean;
  /** 先に画面で登録する支払方法（印つきの名前） */
  支払方法?: string[];
  会員の控え?: string;
  注記?: string[];
  後?: (ctx: 後の文脈) => Promise<void>;
};

function 日時(ms: number): string {
  return new Date(ms + 9 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
}

/** DB で整える受注のシードを定義する（第1引数のシードIDは文字列で書く） */
export function defineDbOrderSeed(seedId: string, 設定: 設定): void {
  const caseNo = /-(\d{3})$/.exec(seedId)?.[1];
  if (!caseNo) throw new Error(`${seedId} の末尾にケース番号3桁が無い`);
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const P = 接頭辞(caseNo);
    for (const [正本の接頭辞, 末尾] of Object.entries(設定.組)) 注文番号の読み替えを登録(正本の接頭辞, `${P}${末尾}`);
    if (設定.支払方法?.length) await 支払方法を登録する(browser, 設定.支払方法, []);
    const defs = typeof 設定.受注 === "function" ? await 設定.受注({ browser, issue }) : 設定.受注;
    const base = await 基の受注(browser, issue);
    const 作った = new Map<string, { 注文番号: string; 受注ID: string }>();
    const 会員 = new Map<string, string>();
    const groups = defs.some((d) => d.会員グループ !== undefined) ? 顧客グループ(3) : [];
    const lines: string[] = [];
    const t0 = Date.now();
    let 閉店ID: string | null = null;

    for (const [i, d] of defs.entries()) {
      const 末尾 = d.接尾 ?? String(設定.降順 ? 100 - (i + 1) : i + 1).padStart(2, "0");
      const 番号 = d.不一致の番号 ? `Z${TOKEN}${caseNo}${末尾}`.slice(0, 11) : `${P}${末尾}`;
      const id = 受注を複製する(base.受注ID, 番号);
      作った.set(d.正本, { 注文番号: 番号, 受注ID: id });
      注文番号の読み替えを登録(d.正本, 番号);

      const v: 受注の整え = { ...d.整え };
      if (設定.降順 && v.受注日 === undefined) v.受注日 = 日時(t0 - i * 60_000);
      if (d.店舗 === "店舗B") v.店舗ID = 店舗ID(店舗Bの店名);
      else if (d.店舗 === "スマレジ") { v.店舗ID = await 試験店舗(browser, 店舗SM, issue); if (v.スマレジ取引ID === undefined) v.スマレジ取引ID = `M0501-${RUN_MARK}-${i + 1}`; }
      else if (d.店舗 === "閉店") { v.店舗ID = 閉店ID = await 試験店舗(browser, 店舗閉店, issue); }
      if (d.会員 !== undefined || d.会員グループ !== undefined) {
        const key = d.会員 ?? `グループ${d.会員グループ}`;
        let mid = 会員.get(key);
        if (!mid) {
          mid = 会員を複製する(基の会員ID(), `e2e-m0501-${caseNo}-${会員.size + 1}-${RUN_MARK}@example.test`, d.会員グループ !== undefined ? groups[d.会員グループ]?.id : undefined);
          会員.set(key, mid);
        }
        v.会員ID = mid;
      }
      const done = 受注を整える(id, v);
      lines.push(`${d.正本}（注文番号 ${番号}）: ${["受注を基の受注から写した", ...done].join("、")}`);
      if (d.控え?.注文番号) notes.set(d.控え.注文番号, 番号);
      if (d.控え?.受注ID) notes.set(d.控え.受注ID, id);
    }
    if (設定.会員の控え) notes.set(設定.会員の控え, [...会員.values()][0]);
    if (閉店ID) 店舗を閉店にする(閉店ID);

    issue("読み替え: 受注は、画面（フロントの購入）で1件作った受注の行をDBで写して作った（注文番号は画面が8桁で振り、画面で指定できないため）。" +
      "注文番号は11文字までなので、シード表の M0501-… は、実行ごとの接頭辞つきの値に読み替えた（ケースの手順の注文番号の入力も同じ）: " +
      Object.entries(設定.組).map(([k, e]) => `${k} → ${P}${e}`).join("・"));
    if (lines.length <= 6) for (const l of lines) issue(`DBで設定した: ${l}`);
    else { issue(`DBで設定した: ${lines.length}件の受注の注文番号（${lines[0]}、…）`); }
    for (const n of 設定.注記 ?? []) issue(n);
    if (設定.後) await 設定.後({ browser, notes, issue, 接頭辞: P, 作った, 会員 });
  });
}

/** 受注一覧の検索パターンだけを作るシード（既存の同名は消して作り直す） */
export function definePatternOnlySeed(seedId: string, make: { 名前: string; 注文番号: string }[]): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await savePatterns(browser, make);
  });
}


// ---------------------------------------------------------------- 定義の組み立て

const 連番 = (正本の接頭辞: string, 件数: number): 定義[] =>
  Array.from({ length: 件数 }, (_, i) => ({ 正本: `${正本の接頭辞}-${String(i + 1).padStart(2, "0")}` }));
const 組1 = (正本の接頭辞: string): Record<string, string> => ({ [正本の接頭辞]: "" });
const T9_15 = "2026-09-15 12:00:00";
const T9_25 = "2026-09-25 12:00:00";

type 日付キー = "入金日" | "出荷指示日" | "出荷日" | "キャンセル日" | "売上確定日" | "店頭予約日" | "更新日";
const 日付 = (キー: 日付キー, 値: string | null): 受注の整え => ({ [キー]: 値 }) as 受注の整え;

/** 期間の内と外の2受注 */
const 期間 = (接頭: string, キー: 日付キー): 設定 => ({
  組: 組1(接頭),
  受注: [{ 正本: `${接頭}-IN`, 整え: 日付(キー, T9_15) }, { 正本: `${接頭}-OUT`, 整え: 日付(キー, T9_25) }],
});
/** 期間の端（開始と同じ・開始の1分前・終了と同じ・終了の1分前）の4受注 */
const 端 = (接頭: string, キー: 日付キー): 設定 => ({
  組: 組1(接頭),
  受注: [
    { 正本: `${接頭}-FROM`, 整え: 日付(キー, "2026-09-10 00:00:00") },
    { 正本: `${接頭}-BEFOREFROM`, 整え: 日付(キー, "2026-09-09 23:59:00") },
    { 正本: `${接頭}-TO`, 整え: 日付(キー, "2026-09-20 00:00:00") },
    { 正本: `${接頭}-BEFORETO`, 整え: 日付(キー, "2026-09-19 23:59:00") },
  ],
});
/** 過去日（実行日の2日前・5日前・当日）の3受注 */
const 過去日 = (接頭: string, キー: 日付キー): 設定 => ({
  組: 組1(接頭),
  受注: [
    { 正本: `${接頭}-IN`, 整え: 日付(キー, 実行日のn日前(2)) },
    { 正本: `${接頭}-OLD`, 整え: 日付(キー, 実行日のn日前(5)) },
    { 正本: `${接頭}-TODAY`, 整え: 日付(キー, 実行日のn日前(0)) },
  ],
});
/** 入力済みと未入力の2受注 */
const 入力状態 = (接頭: string, キー: 日付キー): 設定 => ({
  組: 組1(接頭),
  受注: [{ 正本: `${接頭}-SET`, 整え: 日付(キー, T9_15) }, { 正本: `${接頭}-UNSET`, 整え: 日付(キー, null) }],
});
/** 2受注（A・B）の対応状況 */
const 状態2 = (接頭: string, a: string[], b: string[], 他: { a?: Partial<定義>; b?: Partial<定義> } = {}): 設定 => ({
  組: 組1(接頭),
  受注: [{ 正本: `${接頭}-A`, ...他.a, 整え: { 対応状況: a, ...他.a?.整え } }, { 正本: `${接頭}-B`, ...他.b, 整え: { 対応状況: b, ...他.b?.整え } }],
});
const 受注済 = ["注文受領"];
const キャンセル = ["キャンセル"];
const 引渡済 = ["引渡し済み", "引き渡し済み"];

// ---------------------------------------------------------------- 受注元・店舗

const 受注元 = (接頭: string): 設定 => ({
  組: 組1(接頭),
  受注: [{ 正本: `${接頭}-HQ` }, { 正本: `${接頭}-BR`, 店舗: "店舗B" }, { 正本: `${接頭}-SM`, 店舗: "スマレジ" }],
});
defineDbOrderSeed("S-M05-01-SOURCE-002", 受注元("M0501-SOURCE-002"));
defineDbOrderSeed("S-M05-01-SOURCE-003", 受注元("M0501-SOURCE-003"));
defineDbOrderSeed("S-M05-01-STOREOR-079", 受注元("M0501-079"));
defineDbOrderSeed("S-M05-01-STOREALLPLUS-080", 受注元("M0501-080"));
defineDbOrderSeed("S-M05-01-STORECLOSED-081", {
  組: 組1("M0501-081"),
  受注: [{ 正本: "M0501-081-HQ" }, { 正本: "M0501-081-BR", 店舗: "店舗B" }, { 正本: "M0501-081-CL", 店舗: "閉店" }],
  注記: ["読み替え: 閉店の店舗「M0501-081-CLOSED」は、店舗登録画面で作った固定の試験店舗「試験閉店店舗（M05-01）」を、DBで閉店にして使った（閉店にするのは、印つきの受注を配送先に持つ試験店舗だけ）"],
});
defineDbOrderSeed("S-M05-01-STORECLOSEDPLUS-137", {
  組: 組1("M0501-137"),
  受注: [{ 正本: "M0501-137-HQ" }, { 正本: "M0501-137-BR", 店舗: "店舗B" }, { 正本: "M0501-137-CL", 店舗: "閉店" }],
  注記: ["読み替え: 閉店の店舗「M0501-137-CLOSED」は、店舗登録画面で作った固定の試験店舗「試験閉店店舗（M05-01）」を、DBで閉店にして使った"],
});
defineDbOrderSeed("S-M05-01-DUP-004", {
  組: 組1("M0501-DUP-004"),
  受注: [{ 正本: "M0501-DUP-004-EC" }, { 正本: "M0501-DUP-004-SM", 整え: { スマレジ取引ID: `M0501-DUP-${RUN_MARK}` } }],
  後: async ({ 作った, issue }) => {
    受注を整える(作った.get("M0501-DUP-004-EC")!.受注ID, { 引渡し後の受注ID: 作った.get("M0501-DUP-004-SM")!.受注ID });
    issue("DBで設定した: EC-CUBE受注 M0501-DUP-004-EC の取り込み元として、スマレジ由来の受注 M0501-DUP-004-SM の受注IDを関連付けた");
  },
});
defineDbOrderSeed("S-M05-01-PREVNO-082", {
  組: 組1("M0501-082"),
  受注: [
    { 正本: "M0501-082-A", 整え: { 対応状況: 引渡済 }, 控え: { 注文番号: "〔注文番号-M0501-082A〕" } },
    { 正本: "M0501-082-B", 控え: { 注文番号: "〔注文番号-M0501-082B〕" } },
  ],
  後: async ({ 作った, issue }) => {
    受注を整える(作った.get("M0501-082-A")!.受注ID, { 引渡し後の受注ID: 作った.get("M0501-082-B")!.受注ID });
    issue("DBで設定した: 引き渡し前の受注 A の引き渡し後の受注として B の受注IDを関連付けた");
  },
});
defineDbOrderSeed("S-M05-01-CBSMNOTCANCEL-167", {
  組: 組1("M0501-CB167"),
  受注: [{ 正本: "M0501-CB167-A", 店舗: "スマレジ", 整え: { 対応状況: キャンセル } }, { 正本: "M0501-CB167-B", 整え: { 対応状況: ["入金済み"] } }],
});
defineDbOrderSeed("S-M05-01-CBALLSMOK-170", { 組: 組1("M0501-CB170"), 受注: [{ 正本: "M0501-CB170-A", 店舗: "スマレジ", 整え: { 対応状況: 受注済 } }] });
defineDbOrderSeed("S-M05-01-CBSMCANCELONLY-173", {
  組: 組1("M0501-CB173"),
  受注: [{ 正本: "M0501-CB173-A", 店舗: "スマレジ", 整え: { 対応状況: キャンセル } }, { 正本: "M0501-CB173-B", 整え: { 対応状況: キャンセル } }],
});
defineDbOrderSeed("S-M05-01-CBCANCELUNSEL-165", 状態2("M0501-CB165", キャンセル, 受注済));
defineDbOrderSeed("S-M05-01-CBOTHERSTORE-166", 状態2("M0501-CB166", 受注済, キャンセル, { a: { 店舗: "店舗B" } }));
defineDbOrderSeed("S-M05-01-CBALLCANCELUNSEL-169", 状態2("M0501-CB169", キャンセル, 受注済, { a: { 店舗: "店舗B" }, b: { 店舗: "店舗B" } }));
defineDbOrderSeed("S-M05-01-CBOTHERNOTCANCEL-172", 状態2("M0501-CB172", キャンセル, ["入金済み"], { a: { 店舗: "店舗B" } }));

// ---------------------------------------------------------------- 警告表示（出荷日・キャンセル日・スマレジ連携エラー区分）

defineDbOrderSeed("S-M05-01-CBWARNBOTH-175", {
  組: 組1("M0501-CB175"),
  受注: [{ 正本: "M0501-CB175-A", 整え: { 対応状況: 受注済, 出荷日: T9_15, キャンセル日: null, スマレジ連携エラー: true } }],
});
defineDbOrderSeed("S-M05-01-CBWARNLINKONLY-178", {
  組: 組1("M0501-CB178"),
  受注: [{ 正本: "M0501-CB178-A", 整え: { 対応状況: ["入金済み"], 出荷日: null, キャンセル日: null, スマレジ連携エラー: true } }],
});

// ---------------------------------------------------------------- 表示

defineDbOrderSeed("S-M05-01-DISPLAY-009", {
  組: 組1("M0501-009"),
  受注: async () => {
    const dlv = 配送方法ID("宅配便");
    return [{
      正本: "M0501-009-A",
      控え: { 注文番号: "〔注文番号-M0501-009〕", 受注ID: "〔受注ID-M0501-009〕" },
      整え: {
        氏名: ["晴屋", "太郎"], 支払方法の表示名: "銀行振込", 購入金額: 12345, 出荷指示日: "2026-09-02 12:00:00",
        配送先: { 配送方法名: "宅配便", ...(dlv ? { 配送方法ID: dlv } : {}) },
      },
    }];
  },
  注記: ["読み替え: 支払方法「銀行振込」は、支払方法の表示名（受注の支払方法の文字）として設定した。購入金額12345円は、購入金額と合計の両方に設定した"],
});
defineDbOrderSeed("S-M05-01-DISPLAY-010", {
  組: 組1("M0501-010"),
  受注: [{ 正本: "M0501-010-A", 控え: { 注文番号: "〔注文番号-M0501-010〕", 受注ID: "〔受注ID-M0501-010〕" }, 整え: { 会員ID: null } }],
});
defineDbOrderSeed("S-M05-01-DISPLAY-011", {
  組: 組1("M0501-DISPLAY-011"),
  受注: [{ 正本: "M0501-DISPLAY-011-A", 整え: { 当日受取: true } }, { 正本: "M0501-DISPLAY-011-B", 整え: { 当日受取: false } }],
});

// ---------------------------------------------------------------- ページング（11受注）

defineDbOrderSeed("S-M05-01-PAGING-013", { 組: 組1("M0501-PAGE-013"), 降順: true, 受注: 連番("M0501-PAGE-013", 11) });
defineDbOrderSeed("S-M05-01-PAGING-014", { 組: 組1("M0501-PAGE-014"), 降順: true, 受注: 連番("M0501-PAGE-014", 11) });
defineDbOrderSeed("S-M05-01-PAGING-015", { 組: 組1("M0501-PAGE-015"), 降順: true, 受注: 連番("M0501-PAGE-015", 11) });
defineDbOrderSeed("S-M05-01-PAGING-028", { 組: 組1("M0501-PAGE-028"), 降順: true, 受注: 連番("M0501-PAGE-028", 11) });
defineDbOrderSeed("S-M05-01-INITPAGE-074", { 組: 組1("M0501-074"), 降順: true, 受注: 連番("M0501-074", 11) });
const 検索パターンつき11 = (接頭: string): 設定 => ({
  組: 組1(接頭), 受注: 連番(接頭, 11),
  後: async ({ browser, 接頭辞 }) => { await savePatterns(browser, [{ 名前: rc(`${接頭}-PAT`), 注文番号: 接頭辞 }]); },
});
defineDbOrderSeed("S-M05-01-PATSESSION-066", 検索パターンつき11("M0501-066"));
defineDbOrderSeed("S-M05-01-PATPAGE1-067", 検索パターンつき11("M0501-067"));
defineDbOrderSeed("S-M05-01-PATPERPAGE-068", 検索パターンつき11("M0501-068"));

// ---------------------------------------------------------------- メール一括・送り状CSV

defineDbOrderSeed("S-M05-01-CSV-027", { 組: 組1("M0501-CSV-027"), 受注: ["A", "B", "C"].map((k) => ({ 正本: `M0501-CSV-027-${k}` })) });
defineDbOrderSeed("S-M05-01-CSV-032", { 組: 組1("M0501-CSV-032"), 受注: ["A", "B", "C"].map((k) => ({ 正本: `M0501-CSV-032-${k}` })) });

// ---------------------------------------------------------------- 検索パターンの件数

const パターン後 = (パターン名: string, 条件: (接頭辞: string) => string) =>
  async ({ browser, 接頭辞 }: 後の文脈): Promise<void> => { await savePatterns(browser, [{ 名前: rc(パターン名), 注文番号: 条件(接頭辞) }]); };

defineDbOrderSeed("S-M05-01-PATRELOAD-059", {
  組: 組1("M0501-059"), 受注: ["A", "B", "C"].map((k) => ({ 正本: `M0501-059-${k}` })), 後: パターン後("M0501-059-PAT", (p) => p),
});
defineDbOrderSeed("S-M05-01-PATALL-060", {
  組: { "M0501-060-A": "A", "M0501-060-B": "B", "M0501-060": "" },
  受注: ["A1", "A2", "B1", "B2", "B3"].map((k) => ({ 正本: `M0501-060-${k}`, 接尾: k })),
  後: async ({ browser, 接頭辞 }) => {
    await savePatterns(browser, [{ 名前: rc("M0501-060-PAT-A"), 注文番号: `${接頭辞}A` }, { 名前: rc("M0501-060-PAT-B"), 注文番号: `${接頭辞}B` }]);
  },
});
defineDbOrderSeed("S-M05-01-PATDUP-062", {
  組: 組1("M0501-062"), 受注: [{ 正本: "M0501-062-A", 整え: { 明細数: 2 } }, { 正本: "M0501-062-B" }], 後: パターン後("M0501-062-PAT", (p) => p),
});
defineDbOrderSeed("S-M05-01-LISTCOUNT-159", {
  組: 組1("M0501-159"), 受注: [{ 正本: "M0501-159-A", 整え: { 明細数: 2 } }, { 正本: "M0501-159-B" }],
});
// 063・160: 受注 B は、手順の中で「DBで登録」に当たる操作（注文番号を接頭辞に一致させる）をするまで、検索パターンの条件に一致しない注文番号にしておく
defineDbOrderSeed("S-M05-01-PATCACHE-063", {
  組: 組1("M0501-063"),
  受注: [{ 正本: "M0501-063-A" }, { 正本: "M0501-063-B", 不一致の番号: true}],
  後: async (ctx) => {
    await パターン後("M0501-063-PAT", (p) => p)(ctx);
    ctx.issue("読み替え: 手順3の「DBで受注M0501-063-Bを登録する」は、シードで画面から作って写した受注 B（注文番号は検索パターンの条件に一致しない値）の注文番号を、条件に一致する値に書き換えることで行う");
  },
});
defineDbOrderSeed("S-M05-01-PATCACHE-160", {
  組: 組1("M0501-160"),
  受注: [{ 正本: "M0501-160-A" }, { 正本: "M0501-160-B", 不一致の番号: true }],
  後: async (ctx) => {
    await パターン後("M0501-160-PAT", (p) => p)(ctx);
    ctx.issue("読み替え: 手順3の「DBで受注M0501-160-Bを登録する」は、シードで画面から作って写した受注 B（注文番号は検索パターンの条件に一致しない値）の注文番号を、条件に一致する値に書き換えることで行う");
  },
});
defineDbOrderSeed("S-M05-01-VALCOUNT-070", {
  組: 組1("M0501-070"), 受注: [{ 正本: "M0501-070-A", 整え: { 注文者セイ: rc("M0501-070-BAD") } }],
  後: async ({ browser, 接頭辞 }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      await p.removePatternIfExists(rc("M0501-070-PAT"));
      await p.savePattern({ 注文番号: 接頭辞, フリガナ: rc("M0501-070-BAD"), パターン名: rc("M0501-070-PAT") });
    });
  },
});
definePatternOnlySeed("S-M05-01-PATDELNONE-162", [{ 名前: rc("M0501-162-PAT"), 注文番号: rc("M0501-162") }]);
definePatternOnlySeed("S-M05-01-PATDELKEEP-164", [
  { 名前: rc("M0501-164-PAT"), 注文番号: rc("M0501-164") }, { 名前: rc("M0501-164-KEEP"), 注文番号: rc("M0501-164K") },
]);

// ---------------------------------------------------------------- 対応状況・支払方法・備考・性別・金額・自由入力

defineDbOrderSeed("S-M05-01-STATUS-005", 状態2("M0501-STATUS-005", 受注済, 引渡済));
defineDbOrderSeed("S-M05-01-CANCELOUT-078", 状態2("M0501-078", 受注済, キャンセル));
defineDbOrderSeed("S-M05-01-CANCELIN-158", 状態2("M0501-158", 受注済, キャンセル));
defineDbOrderSeed("S-M05-01-STATUSFILTER-088", {
  組: 組1("M0501-088"),
  受注: [["A", "入金待ち"], ["B", "入金済み"], ["C", "出荷指示"], ["D", "注文受領"]].map(([k, s]) => ({ 正本: `M0501-088-${k}`, 整え: { 対応状況: [s] } })),
});
defineDbOrderSeed("S-M05-01-PAYFILTER-090", {
  組: 組1("M0501-090"),
  支払方法: [rc("M0501-090-PAY1"), rc("M0501-090-PAY2")],
  受注: [{ 正本: "M0501-090-A", 整え: { 支払方法: rc("M0501-090-PAY1") } }, { 正本: "M0501-090-B", 整え: { 支払方法: rc("M0501-090-PAY2") } }],
});
const 備考 = (接頭: string): 設定 => ({
  組: 組1(接頭),
  受注: [{ 正本: `${接頭}-A`, 整え: { 注文備考: rc(`${接頭}-NOTE`) } }, { 正本: `${接頭}-B`, 整え: { 注文備考: null } }],
});
defineDbOrderSeed("S-M05-01-NOTEYES-092", 備考("M0501-092"));
defineDbOrderSeed("S-M05-01-NOTEBOTH-093", 備考("M0501-093"));
defineDbOrderSeed("S-M05-01-NOTENO-140", 備考("M0501-140"));
defineDbOrderSeed("S-M05-01-GENDER-098", {
  組: 組1("M0501-098"), 受注: [{ 正本: "M0501-098-A", 整え: { 性別ID: 1 } }, { 正本: "M0501-098-B", 整え: { 性別ID: 2 } }],
});
defineDbOrderSeed("S-M05-01-AMOUNT-115", {
  組: 組1("M0501-115"),
  受注: [["L", 999], ["MIN", 1000], ["MID", 1500], ["MAX", 2000], ["H", 2001]].map(([k, n], i) => ({ 正本: `M0501-115-${k}`, 接尾: `0${i + 1}`, 整え: { 購入金額: n as number } })),
});
const ヒット = (キー: string) => `前${rc(`M0501-${キー}-HIT`)}後`;
defineDbOrderSeed("S-M05-01-SHIPFREE-119", {
  組: 組1("M0501-119"),
  受注: [
    { 正本: "M0501-119-ADDR1", 整え: { 配送先: { 住所1: ヒット("119") } } },
    { 正本: "M0501-119-ADDR2", 整え: { 配送先: { 住所2: ヒット("119") } } },
    { 正本: "M0501-119-SEI", 整え: { 配送先: { 姓: ヒット("119") } } },
    { 正本: "M0501-119-MEI", 整え: { 配送先: { 名: ヒット("119") } } },
    { 正本: "M0501-119-COMP", 整え: { 配送先: { 会社名: ヒット("119") } } },
    { 正本: "M0501-119-INV", 整え: { 送り状No: ヒット("119") } },
    { 正本: "M0501-119-NONE" },
  ],
});
defineDbOrderSeed("S-M05-01-FREE1-129", {
  組: 組1("M0501-129"),
  受注: [
    { 正本: "M0501-129-COMP", 整え: { 注文者会社名: ヒット("129") } },
    { 正本: "M0501-129-NOTE", 整え: { 注文備考: ヒット("129") } },
    { 正本: "M0501-129-MEMO", 整え: { ショップ用メモ: ヒット("129") } },
    { 正本: "M0501-129-CODE", 整え: { 明細の商品コード: ヒット("129") } },
    { 正本: "M0501-129-NONE" },
  ],
});
defineDbOrderSeed("S-M05-01-DLVFILTER-131", {
  組: 組1("M0501-131"),
  受注: async () => {
    const d = 配送方法(3);
    if (d.length < 3) throw new Error(`配送方法が${d.length}件しか無い（3件要る）`);
    d.forEach((x, i) => 注文番号の読み替えを登録(`M0501-131-DLV${i + 1}`, x.名前));
    return d.map((x, i) => ({ 正本: `M0501-131-${"ABC"[i]}`, 整え: { 配送先: { 配送方法ID: x.id, 配送方法名: x.名前 } } }));
  },
  注記: ["読み替え: 配送方法「M0501-131-DLV1〜3」は、配送方法の追加が共有の設定を変えるので足さず、配送方法マスタの既存の先頭3件に読み替えた（受注の配送先の配送方法をDBで結びつけた）"],
});
defineDbOrderSeed("S-M05-01-GRPFILTER-132", {
  組: 組1("M0501-132"),
  受注: async () => {
    const g = 顧客グループ(3);
    if (g.length < 3) throw new Error(`顧客グループが${g.length}件しか無い（3件要る）`);
    g.forEach((x, i) => 注文番号の読み替えを登録(`M0501-132-GRP${i + 1}`, x.名前));
    return g.map((_, i) => ({ 正本: `M0501-132-${"ABC"[i]}`, 会員グループ: i }));
  },
  注記: ["読み替え: 顧客グループ「M0501-132-GRP1〜3」は、顧客グループの既存の先頭3件に読み替えた。注文者の会員は、試験用の会員を写した印つきの会員を3人作り、それぞれの顧客グループをDBで設定した"],
});

// ---------------------------------------------------------------- 日付の条件

defineDbOrderSeed("S-M05-01-PERIODMULTI-099", {
  組: 組1("M0501-099"),
  受注: [
    { 正本: "M0501-099-IN", 整え: { 入金日: T9_15, 出荷指示日: T9_15, 更新日: T9_15 } },
    { 正本: "M0501-099-OUTPAY", 整え: { 入金日: T9_25, 出荷指示日: T9_15, 更新日: T9_15 } },
    { 正本: "M0501-099-OUTSHIP", 整え: { 入金日: T9_15, 出荷指示日: T9_25, 更新日: T9_15 } },
    { 正本: "M0501-099-OUTUPD", 整え: { 入金日: T9_15, 出荷指示日: T9_15, 更新日: T9_25 } },
  ],
});
defineDbOrderSeed("S-M05-01-PERIOD-100", 期間("M0501-100", "出荷日"));
defineDbOrderSeed("S-M05-01-PERIOD-101", 期間("M0501-101", "キャンセル日"));
defineDbOrderSeed("S-M05-01-PERIOD-102", 期間("M0501-102", "売上確定日"));
defineDbOrderSeed("S-M05-01-PERIOD-103", 期間("M0501-103", "店頭予約日"));
defineDbOrderSeed("S-M05-01-PERIODEDGE-104", 端("M0501-104", "入金日"));
defineDbOrderSeed("S-M05-01-RELDAY-105", 過去日("M0501-105", "入金日"));
defineDbOrderSeed("S-M05-01-RELDAY-106", 過去日("M0501-106", "出荷指示日"));
defineDbOrderSeed("S-M05-01-RELDAY-107", 過去日("M0501-107", "出荷日"));
defineDbOrderSeed("S-M05-01-RELDAY-108", 過去日("M0501-108", "キャンセル日"));
defineDbOrderSeed("S-M05-01-RELDAY-109", 過去日("M0501-109", "売上確定日"));
defineDbOrderSeed("S-M05-01-RELDAY-110", 過去日("M0501-110", "店頭予約日"));
defineDbOrderSeed("S-M05-01-RELDAY-111", 過去日("M0501-111", "更新日"));
defineDbOrderSeed("S-M05-01-EDGE1-146", 端("M0501-146", "出荷指示日"));
defineDbOrderSeed("S-M05-01-EDGE2-147", 端("M0501-147", "出荷日"));
defineDbOrderSeed("S-M05-01-EDGE3-148", 端("M0501-148", "キャンセル日"));
defineDbOrderSeed("S-M05-01-EDGE4-149", 端("M0501-149", "売上確定日"));
defineDbOrderSeed("S-M05-01-EDGE5-150", 端("M0501-150", "店頭予約日"));
defineDbOrderSeed("S-M05-01-EDGE6-151", 端("M0501-151", "更新日"));
defineDbOrderSeed("S-M05-01-STATEBOTH-114", 入力状態("M0501-114", "入金日"));
defineDbOrderSeed("S-M05-01-BOTH1-152", 入力状態("M0501-152", "出荷指示日"));
defineDbOrderSeed("S-M05-01-BOTH2-153", 入力状態("M0501-153", "出荷日"));
defineDbOrderSeed("S-M05-01-BOTH3-154", 入力状態("M0501-154", "キャンセル日"));
defineDbOrderSeed("S-M05-01-BOTH4-155", 入力状態("M0501-155", "売上確定日"));
defineDbOrderSeed("S-M05-01-BOTH5-156", 入力状態("M0501-156", "店頭予約日"));
defineDbOrderSeed("S-M05-01-NOUPDATE-075", {
  組: 組1("M0501-075"),
  受注: [{ 正本: "M0501-075-A", 整え: { 対応状況: 受注済 } }, { 正本: "M0501-075-B", 整え: { 対応状況: ["入金待ち"] } }],
  // 更新日は、画面での操作を終えたあと（受注の整えの最後）に設定する
  後: async ({ 作った, issue }) => {
    for (const k of ["M0501-075-A", "M0501-075-B"]) 受注を整える(作った.get(k)!.受注ID, { 更新日: "2026-09-01 10:00:00" });
    issue("DBで設定した: 2受注の更新日時を 2026-09-01 10:00:00 に（シード作成の操作をすべて終えたあとに設定した）");
  },
});

// ---------------------------------------------------------------- 会員の購入実績（印つきのメールアドレスの専用の会員）

const 専用の会員 = "専用の会員";
const 会員の読み替え = "読み替え: 会員は、試験用の会員（フロントの会員登録で作れる1人）を写した、実行の印つきのメールアドレスの専用の会員にした（購入実績を、ほかの受注の影響なしに確かめるため）";
defineDbOrderSeed("S-M05-01-DEL-FIRSTBUY-045", {
  組: 組1("M0501-045"), 会員の控え: "〔会員ID-M0501-045〕", 注記: [会員の読み替え],
  受注: [
    { 正本: "M0501-045-A", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-045A〕" }, 整え: { 対応状況: 受注済, 購入金額: 100 } },
    { 正本: "M0501-045-B", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-045B〕" }, 整え: { 対応状況: 受注済, 購入金額: 200, 受注日: "2026-08-01 10:00:00" } },
  ],
  後: async ({ 会員, issue }) => {
    会員の購入実績を設定する(会員.get(専用の会員)!, { 購入回数: 2, 購入金額: 300, 初回購入日時: null, 最終購入日時: null });
    issue("DBで設定した: 会員の初回購入日時を未設定、購入回数を 2 回、購入金額を 300 円に");
  },
});
defineDbOrderSeed("S-M05-01-DEL-MEMBER-043", {
  組: 組1("M0501-043"), 会員の控え: "〔会員ID-M0501-043〕",
  注記: [会員の読み替え, "読み替え: 対応状況「取寄せ中」は対応状況マスタの「対応中」、「対応済み」は「引渡し済み」に当たるとして、DBで設定した"],
  受注: [
    { 正本: "M0501-043-T", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-043〕" }, 整え: { 対応状況: 受注済, 購入金額: 600 } },
    { 正本: "M0501-043-1", 会員: 専用の会員, 整え: { 対応状況: 受注済, 購入金額: 100 } },
    { 正本: "M0501-043-2", 会員: 専用の会員, 整え: { 対応状況: ["入金待ち"], 購入金額: 200 } },
    { 正本: "M0501-043-3", 会員: 専用の会員, 整え: { 対応状況: ["取寄せ中", "取り寄せ中", "対応中"], 購入金額: 300 } },
    { 正本: "M0501-043-4", 会員: 専用の会員, 整え: { 対応状況: ["出荷完了"], 購入金額: 400 } },
    { 正本: "M0501-043-5", 会員: 専用の会員, 整え: { 対応状況: ["対応済み", "引渡し済み", "引き渡し済み"], 購入金額: 500 } },
    { 正本: "M0501-043-6", 会員: 専用の会員, 整え: { 対応状況: キャンセル, 購入金額: 9000 } },
  ],
  後: async ({ 会員, issue }) => {
    会員の購入実績を設定する(会員.get(専用の会員)!, { 購入回数: 6, 購入金額: 2100, 初回購入日時: null, 最終購入日時: null });
    issue("DBで設定した: 会員の購入回数を 6 回、購入金額を 2100 円に");
  },
});
defineDbOrderSeed("S-M05-01-CBDELMEMFIRST-174", {
  組: 組1("M0501-174"), 会員の控え: "〔会員ID-M0501-174〕", 注記: [会員の読み替え],
  受注: [
    { 正本: "M0501-174-A", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-174A〕" }, 整え: { 対応状況: 受注済, 購入金額: 100 } },
    { 正本: "M0501-174-B", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-174B〕" }, 整え: { 対応状況: 受注済, 購入金額: 200 } },
    { 正本: "M0501-174-C", 会員: 専用の会員, 控え: { 注文番号: "〔注文番号-M0501-174C〕" }, 整え: { 対応状況: ["入金待ち"], 購入金額: 300 } },
  ],
  後: async ({ 会員, issue }) => {
    会員の購入実績を設定する(会員.get(専用の会員)!, { 購入回数: 3, 購入金額: 600, 初回購入日時: "2026-07-01 10:00:00", 最終購入日時: null });
    issue("DBで設定した: 会員の購入回数を 3 回、購入金額を 600 円、初回購入日時を 2026-07-01 10:00:00 に");
  },
});

void 日本時間;
