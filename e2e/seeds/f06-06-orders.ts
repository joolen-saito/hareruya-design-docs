/**
 * F06-06 購入履歴一覧の画面シード（追加分）。正本: cases/F06-06_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。画面で作れない部分は、
 * E2E が作った実行の印つきのデータに限り DB へ書き込んでよい（db/f06_06.ts・db/f06_07.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 * 読み替え・DB で設定したことは、シードの報告（エビデンスの「シード作成時の問題」）に残す。
 *
 * 作り方（シード表の「DBシードで登録」「CSVで商品を登録」を、次のように読み替える）:
 * - 会員: フロントの会員情報登録で登録し、本会員にする（seeds/f06-member.ts の 本会員を作る）。メールアドレスの前半に実行の印を付ける。
 * - 注文: 会員でフロントにログインし、販売中の既存の商品1点を注文する（M05 のフロント注文の部品。支払方法は代金引換）。注文番号は完了画面から控え、注文IDはDBで引く。
 *   商品はシード表の商品（結合商品A など）を作らず、手元の販売中の既存の商品を使う（共有の商品に試験の値を足さない）。商品名はシード表と合わない。
 *   2点が要る注文は、DBで注文の明細に販売中の別の既存の商品を足す。
 * - 対応状況: 入金済み・入金待ちは管理画面の受注情報編集で変える。ほかの状態（ピック中・店頭予約・購入処理中など）は画面の遷移で作れないのでDBで設定する。
 *   BOステータス「購入済み」は手元の対応状況マスタに同じ名前が無く、同じ意味の「引渡し済み」で読み替える。
 * - 注文区分: 店頭受取はDBで配送方法・店舗を設定、スムーズ店頭受取はDBで配送方法を設定、スマレジ取引はDBでスマレジ取引ID・レシートNo.・店舗を設定、
 *   店頭受取→スマレジ取引は元の店頭受取注文の移行先に統合先の注文を関連付ける（スマレジ連携でしか入らない値）。
 * - 店舗: 「晴れる屋本店」「晴れる屋高松店」を店舗マスタから探し、無ければ店舗マスタの先頭・2番目で代える。
 * - シード表が固定の値（会員ID・注文ID・注文番号 OTC-… など）で書くものは、画面が振った値に読み替える。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import * as d6 from "../db/f06_06";
import { 注文を整える, 注文の受注ID } from "../db/f06_07_k";
import type { 注文の設定 } from "../db/f06_07_k";
import { getSeed } from "../lib/catalog";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { 対応状況をそろえる } from "../pages/admin/m05_01_orders";
import { 会員が注文する } from "../pages/front/m05_front_order";
import { mailOf } from "./f06-06";
import { 本会員を作る } from "./f06-member";

export type 作った注文 = { 番号: string; ID: string; 店名?: string; 商品名: string[]; 注文日: string; 状態: string };
const 記録 = new Map<string, 作った注文>();
/** 作った注文（キーは「002A」「043元1」など）。シード表が固定の値で書く注文も、このキーで引く */
export function 注文(キー: string): 作った注文 {
  const r = 記録.get(キー);
  if (!r) throw new Error(`注文 ${キー} をまだ作っていない（そのシードを作っていない）`);
  return r;
}

const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);
const 読み替えの注記 = "シード表は会員・商品・注文をDBシードまたはCSVで登録すると定めるが、会員はフロントの会員登録で、注文はフロントの注文（販売中の既存の商品1点・支払方法は代金引換）で画面から作った。会員ID・注文ID・注文番号は画面が振った値に読み替える。商品名はシード表の商品名でなく、注文した既存の商品の名前";

export const 本店名 = "晴れる屋本店";
export const 高松店名 = "晴れる屋高松店";
export const 本店 = () => d6.店を探す(本店名, 0);
export const 高松店 = () => d6.店を探す(高松店名, 1);

/** シード表が呼び名に挙げているときだけ控える */
function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

type 資格 = { メール: string; パスワード: string };
async function 会員を用意する(browser: Browser, notes: Notes, seedId: string, 呼び名: string | null, 前半: string, パスワード: string, 名前 = { 姓: "試験会員", 名: "購入履歴" }): Promise<資格> {
  const id = await 本会員を作る(browser, { 姓: 名前.姓, 名: 名前.名, セイ: "シケンカイイン", メイ: "コウニュウリレキ", 前半, パスワード });
  if (呼び名) 控える(notes, seedId, 呼び名, id);
  return { メール: mailOf(前半), パスワード };
}

export type 種類 = "EC" | "店頭受取" | "スムーズ店頭受取";
type 店 = { id: string; 店名: string; 代替: boolean };
type 注文の指定 = {
  キー: string; 種類: 種類; 状態: string; 注文日?: string; 店?: 店;
  保持金額?: number; 支払方法ID?: number; 商品を2点にする?: boolean;
  スマレジ?: { 取引ID: string; レシートNo: string };
  /** 統合先（スマレジ取引）の受注ID。この注文を店頭受取の移行元にする */
  移行先の受注ID?: string;
  ラベル?: { 番号?: string; ID?: string; 日?: string };
};

/** 会員が注文し、DBで注文区分・店舗・日付・状態を設定し、控える。画面で変えられる状態（入金済み・入金待ち）は先に管理画面で変える */
async function 注文を作る(browser: Browser, notes: Notes, seedId: string, m: 資格, p: 注文の指定): Promise<作った注文> {
  const 番号 = await 会員が注文する(browser, m, `${seedId} 注文${p.キー}`);
  const ID = 注文の受注ID(番号);
  const 画面で = ["入金済み", "入金待ち"].includes(p.状態) && p.種類 === "EC" && !p.スマレジ && !p.移行先の受注ID;
  if (画面で) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 対応状況をそろえる(page, ID, p.状態, (x) => 記す(x));
    });
  }
  const 設定: 注文の設定 = {};
  const done: string[] = [];
  if (p.種類 === "店頭受取") 設定.店頭受取 = true;
  if (p.店) { 設定.店舗ID = p.店.id; if (p.店.代替) 記す(`店舗は手元の店舗マスタに無い名前があるので、店舗マスタの「${p.店.店名}」で代える`); }
  if (p.注文日) 設定.注文日 = p.注文日;
  if (p.支払方法ID) 設定.支払方法ID = p.支払方法ID;
  if (p.スマレジ) { 設定.スマレジ取引ID = `${p.スマレジ.取引ID}-${RUN_MARK}`; 設定.レシートNo = p.スマレジ.レシートNo; }
  if (p.移行先の受注ID) 設定.移行先の受注ID = p.移行先の受注ID;
  if (Object.keys(設定).length > 0) done.push(...注文を整える(ID, 設定));
  if (p.種類 === "スムーズ店頭受取") { d6.配送方法をスムーズ店頭受取にする(ID); done.push("配送方法をスムーズ店頭受取に"); }
  if (p.保持金額 !== undefined) { d6.注文金額合計を設定(ID, p.保持金額); done.push(`保持する注文金額合計を ${p.保持金額} 円に`); }
  if (p.商品を2点にする) {
    const 別 = d6.別の販売中の商品(ID);
    d6.別の商品の明細を足す(ID, 別, 1);
    done.push(`明細に別の販売中の商品（${別.商品名}）を足し`);
  }
  let 状態 = p.状態;
  if (!画面で) { 状態 = d6.対応状況を設定(ID, p.状態); done.push(`対応状況を「${状態}」に`); }
  if (状態 !== p.状態) 記す(`BOステータス「${p.状態}」は手元の対応状況マスタに同じ名前が無いので、同じ意味の「${状態}」で代える`);
  if (done.length) 記す(`画面で作った注文 ${番号} は、DBで${done.join("、")}設定した（フロントの注文の画面では作れない値）`);
  const r: 作った注文 = { 番号, ID, 店名: p.店?.店名, 商品名: d6.注文の商品名(ID), 注文日: d6.注文日の表示(ID), 状態 };
  記録.set(p.キー, r);
  if (p.ラベル?.番号) 控える(notes, seedId, p.ラベル.番号, 番号);
  if (p.ラベル?.ID) 控える(notes, seedId, p.ラベル.ID, ID);
  if (p.ラベル?.日) 控える(notes, seedId, p.ラベル.日, r.注文日);
  return r;
}

/** 呼び名の付け方（シード表は 〔注文番号-F0606-031〕 のように書く） */
const ラベル = (n: string, 枝 = "") => ({ 番号: `〔注文番号-F0606-${n}${枝}〕`, ID: `〔注文ID-F0606-${n}${枝}〕`, 日: `〔注文日-F0606-${n}${枝}〕` });
export const pw = (n: string) => `Pw-F0606-${n}!`;

// ---- 参照マスタ（作らない。手元の既存のマスタを読んで確かめる） ----
// S-F06-06-MASTER は seeds/f06-06-master.ts に1か所で定める（f06-06-d と f06-06-orders の二重の定義をまとめた 2026-11-11）
import "./f06-06-master";

// ---- 010: 表示項目（EC・2商品・保持金額） ----
defineSeed("S-F06-06-DISPLAY-010", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-DISPLAY-010";
  const m = await 会員を用意する(browser, notes, id, "〔会員ID-F0606-010〕", "display-f0606-010", pw("010"));
  await 注文を作る(browser, notes, id, m, {
    キー: "010", 種類: "EC", 状態: "入金済み", 注文日: "2026-01-10", 支払方法ID: 5, 保持金額: 9999, 商品を2点にする: true, ラベル: ラベル("010"),
  });
});

// ---- 1件の注文の表示（011・013・015・016・024・025・026・030） ----
function 一件(seedId: string, n: string, 前半: string, パスワード: string, p: (() => Omit<注文の指定, "キー" | "ラベル">), 名前?: { 姓: string; 名: string }): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    記す(読み替えの注記);
    const m = await 会員を用意する(browser, notes, seedId, `〔会員ID-F0606-${n}〕`, 前半, パスワード, 名前);
    await 注文を作る(browser, notes, seedId, m, { ...p(), キー: n, ラベル: ラベル(n) });
  });
}
一件("S-F06-06-DISPLAY-015", "015", "display-f0606-015", pw("015"), () => ({ 種類: "EC", 状態: "入金済み" }));
一件("S-F06-06-DISPLAY-016", "016", "display-f0606-016", pw("016"), () => ({ 種類: "EC", 状態: "入金済み" }));
一件("S-F06-06-DISPLAY-013", "013", "display-f0606-013", pw("013"), () => ({
  種類: "EC", 状態: "出荷完了", 注文日: "2026-04-01", 店: 高松店(), スマレジ: { 取引ID: "SMTR-F0606-013", レシートNo: "R060600000013" },
}));
一件("S-F06-06-SMCANCEL-026", "026", "smcancel-f0606-026", pw("026"), () => ({
  種類: "EC", 状態: "キャンセル", 注文日: "2026-06-01", 店: 高松店(), スマレジ: { 取引ID: "SMTR-F0606-026", レシートNo: "R060600000026" },
}));

// ---- 014: 9状態 ----
defineSeed("S-F06-06-STATUS-014", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-STATUS-014";
  const m = await 会員を用意する(browser, notes, id, "〔会員ID-F0606-014〕", "status-f0606-014", pw("014"));
  const 本 = 本店();
  const 一覧: [種類, string][] = [
    ["店頭受取", "ピック中"], ["EC", "入金待ち"], ["EC", "入金済み"], ["スムーズ店頭受取", "ピック完了"], ["EC", "出荷指示"],
    ["スムーズ店頭受取", "店頭予約"], ["EC", "出荷完了"], ["店頭受取", "購入済み"], ["EC", "キャンセル"],
  ];
  for (const [i, [種, 状]] of 一覧.entries()) {
    const k = String(i + 1).padStart(2, "0");
    await 注文を作る(browser, notes, id, m, {
      キー: `014-${k}`, 種類: 種, 状態: 状, 店: 種 === "EC" ? undefined : 本,
      ラベル: { 番号: `〔注文番号-F0606-014-${k}〕`, ID: `〔注文ID-F0606-014-${k}〕` },
    });
  }
});

// ---- 017: EC・店頭受取・統合先・スマレジ単独の4件 ----
defineSeed("S-F06-06-DISPLAY-017", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-DISPLAY-017";
  const m = await 会員を用意する(browser, notes, id, "〔会員ID-F0606-017〕", "display-f0606-017", pw("017"));
  const 本 = 本店(), 高 = 高松店();
  await 注文を作る(browser, notes, id, m, { キー: "017A", 種類: "EC", 状態: "入金済み", ラベル: ラベル("017", "A") });
  await 注文を作る(browser, notes, id, m, { キー: "017B", 種類: "店頭受取", 状態: "出荷完了", 注文日: "2026-09-01", 店: 本, ラベル: ラベル("017", "B") });
  const 統合先 = await 注文を作る(browser, notes, id, m, {
    キー: "017統合先", 種類: "EC", 状態: "出荷完了", 注文日: "2026-09-10", 店: 本, スマレジ: { 取引ID: "SMTR-F0606-017-M", レシートNo: "R060600000117" },
  });
  for (const k of [1, 2]) {
    await 注文を作る(browser, notes, id, m, { キー: `017元${k}`, 種類: "店頭受取", 状態: "出荷完了", 注文日: `2026-09-0${k + 1}`, 店: 本, 移行先の受注ID: 統合先.ID });
  }
  await 注文を作る(browser, notes, id, m, {
    キー: "017単独", 種類: "EC", 状態: "出荷完了", 注文日: "2026-09-12", 店: 高, スマレジ: { 取引ID: "SMTR-F0606-017-S", レシートNo: "R060600000217" },
  });
  記す("統合先の元の2注文（シード表の注文ID 606340103・606340104）は、画面が振った注文番号の注文を店頭受取注文にして統合先へ関連付けた");
});

// ---- 031〜041・047・048: 注文の種類 × BOステータス ----
function 組合せ(seedId: string, n: string, 種: 種類, 状態: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    記す(読み替えの注記);
    const m = await 会員を用意する(browser, notes, seedId, `〔会員ID-F0606-${n}〕`, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`);
    await 注文を作る(browser, notes, seedId, m, { キー: n, 種類: 種, 状態, 店: 種 === "EC" ? undefined : 本店(), ラベル: ラベル(n) });
  });
}
組合せ("S-F06-06-CBEC-031", "031", "EC", "出荷指示");
組合せ("S-F06-06-CBEC-032", "032", "EC", "出荷完了");
組合せ("S-F06-06-CBEC-033", "033", "EC", "キャンセル");
組合せ("S-F06-06-CBSMOOTH-034", "034", "スムーズ店頭受取", "ピック完了");
組合せ("S-F06-06-CBSMOOTH-035", "035", "スムーズ店頭受取", "出荷指示");
組合せ("S-F06-06-CBSMOOTH-036", "036", "スムーズ店頭受取", "店頭予約");
組合せ("S-F06-06-CBSMOOTH-037", "037", "スムーズ店頭受取", "購入済み");
組合せ("S-F06-06-CBSMOOTH-038", "038", "スムーズ店頭受取", "キャンセル");
組合せ("S-F06-06-CBOTC-039", "039", "店頭受取", "ピック中");
組合せ("S-F06-06-CBOTC-040", "040", "店頭受取", "ピック完了");
組合せ("S-F06-06-CBOTC-041", "041", "店頭受取", "購入済み");
組合せ("S-F06-06-CBEC-047", "047", "EC", "入金待ち");
組合せ("S-F06-06-CBEC-048", "048", "EC", "入金済み");

defineSeed("S-F06-06-CBSMONLY-042", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-CBSMONLY-042";
  const m = await 会員を用意する(browser, notes, id, "〔会員ID-F0606-042〕", "cbf0606-042", "Passw0rd-CBF0606042");
  await 注文を作る(browser, notes, id, m, {
    キー: "042", 種類: "EC", 状態: "購入済み", 注文日: "2026-07-01", 店: 高松店(), スマレジ: { 取引ID: "SMTR-F0606-CB042", レシートNo: "R0606CB0420" },
  });
});

/** 店頭受取受注（元）→スマレジ取引（統合先）。統合先のレシート番号は R0606CB0<番号の下2桁>0 */
function 統合(seedId: string, n: string, 状態: string, 元の注文日: string[]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    記す(読み替えの注記);
    const m = await 会員を用意する(browser, notes, seedId, `〔会員ID-F0606-${n}〕`, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`);
    const 本 = 本店();
    const 先 = await 注文を作る(browser, notes, seedId, m, {
      キー: `${n}先`, 種類: "EC", 状態, 注文日: "2026-08-10", 店: 本, スマレジ: { 取引ID: `SMTR-F0606-CB${n}`, レシートNo: レシートNo(n) },
    });
    for (const [i, 日] of 元の注文日.entries()) {
      await 注文を作る(browser, notes, seedId, m, { キー: `${n}元${i + 1}`, 種類: "店頭受取", 状態: "ピック中", 注文日: 日, 店: 本, 移行先の受注ID: 先.ID });
    }
    記す("店頭受取注文の注文番号（シード表は OTC-F0606-CB… の固定の値）は、画面が振った注文番号で読み替えた。レシート番号はシード表の値");
  });
}
export const レシートNo = (n: string) => `R0606CB0${n.slice(1)}0`;
統合("S-F06-06-CBMRG1-043", "043", "購入済み", ["2026-08-05"]);
統合("S-F06-06-CBMRG1-044", "044", "キャンセル", ["2026-08-05"]);
統合("S-F06-06-CBMRGN-045", "045", "購入済み", ["2026-08-03", "2026-08-02"]);
統合("S-F06-06-CBMRGN-046", "046", "キャンセル", ["2026-08-03", "2026-08-02"]);

// ---- 027: 管理画面の対応状況の変更が購入履歴の処理状態に反映される ----
defineSeed("S-F06-06-QF-ADM", async () => {
  記す("管理者（シード表は qf-f0606-admin）は作らず、手元の環境の既存の全権限の管理者（試験の準備に使う管理者）で受注情報編集を操作する");
});
defineSeed("S-F06-06-QF-ORDER-027", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-QF-ORDER-027";
  const m = await 会員を用意する(browser, notes, id, null, "qf-f0606-001", "Passw0rd-QF0606", { 姓: "QF購入履歴001", 名: "太郎" });
  await 注文を作る(browser, notes, id, m, { キー: "QF001", 種類: "EC", 状態: "入金待ち", ラベル: { 番号: "〔注文番号-F0606-QF001〕" } });
  記す("シード表は商品「QF購入履歴商品-001」・銀行振込で注文すると定めるが、販売中の既存の商品を代金引換で注文した。注文の対応状況は管理画面の受注情報編集で入金待ちにした");
});

// ---- 019: 再度購入 ----
defineSeed("S-F06-06-REPURCHASE-019", async ({ browser, notes }) => {
  記す(読み替えの注記);
  const id = "S-F06-06-REPURCHASE-019";
  const m = await 会員を用意する(browser, notes, id, "〔会員ID-F0606-019〕", "repurchase-f0606-019", pw("019"));
  const o = await 注文を作る(browser, notes, id, m, { キー: "019", 種類: "EC", 状態: "入金済み", 商品を2点にする: true, ラベル: ラベル("019") });
  d6.先頭の明細の数量を設定(o.ID, 2);
  記す(`先頭の商品の明細の数量を、DBで2に設定した（もう1点の商品 ${o.商品名[1] ?? ""} は数量1）。シード表の商品 REP-A-019・REP-B-019 は作らず既存の販売中の商品で読み替えた`);
});
