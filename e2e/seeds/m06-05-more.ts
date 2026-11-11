/**
 * M06-05 買取商品履歴(検索入力・検索結果) のシードのうち、シード表の投入方法に「DB」を含むもの（seeds/m06-05.ts の続き）。正本: cases/M06-05_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で、
 * 次のように作る。読み替えとDBへの書き込みは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - 買取は、フロントの店頭買取査定申込（会員登録なし）で申込み、申込者の姓・名に実行の印（rc）を付ける。画面が振る査定番号は、正本の決め打ちの値（650528-001 など）ではなく、画面が振った値に読み替える。
 * - 商品は、グッズ商品CSV登録で作った実行の印つきのサプライ品（商品コードに実行の印）。基準価格・販売価格・言語・状態は、DBで整える（db/m06_05.ts）。
 *   カードのマスタや共有の商品は使わない。商品コードの完全一致で検索するので、商品コードが実行ごとに違っても検索結果は同じ（ほかの実行の履歴が混ざらない）。
 * - ステータス・買取日時・買取キャンセル日・実在庫情報・実在庫履歴（変更前後の個数・作業者・作成日時）・買取明細・個別入力商品・査定担当者・会員・更新日時は画面で作れないので、
 *   実行の印つきの買取にだけ、DBで設定する／足す（db/m06_05.ts・db/m06_04_prep.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す）。
 * - 会員ID（6501・65010・605047501 など）は画面で指定できないので、本会員を画面で登録し、その会員を買取に紐づける。会員IDは画面が振った値になる。
 * - 買取店舗は、買取店舗A（M06-01 の試験店舗）で申込み、正本が東京店・大阪店とするものだけ、DBで既存の店舗（東京店・大阪店）を指すようにした（店舗は書き換えない）。
 * - 作らないシード: DELETED（削除済みの商品・規格・作業者は、外部キー制約などで作れない）・MAX-PAGING（12001件の大量データ）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { withAdminSession } from "../lib/session";
import {
  申込者を設定する, 会員を設定する, 査定担当者を設定する, 申込日時と更新日時を設定する, 買取店舗を設定する, 実在庫と履歴を足す, 買取明細を足す,
  実在庫に紐づく個別入力商品を足す, 商品規格を整える, 受注ID,
} from "../db/m06_05";
import { 買取を整える } from "../db/m06_04_prep";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 申込を行う, 査定IDを読む, 申込者の } from "./m06-common";
import { 一件ずつ申込む, 支店URL } from "./m06-01";
import { 本会員を作る } from "./f06-member";
import { 東京店のID, 大阪店のID } from "./m06-05";

const NEEDS = ["S-M06-01-SHOPS", "S-M06-05-SHOPS"];
const L_A = "〔店舗ID-M0601-共有A〕";

/** 既定の買取日時（日本時間）。正本が日時を決めていない履歴に使う */
const 既定の買取日時 = "2026-08-28 10:00:00";
export const 既定の作業者 = "M06-05試験作業者";

// ---------------------------------------------------------------- メンバー（作業者・査定担当者）

const 用意したメンバー = new Map<string, Promise<void>>();

/** 同じ名前のメンバーを、あれば内容を確かめて使い、無ければ画面で登録する（所属店舗・編集可能店舗は買取店舗A） */
function メンバーを用意する(browser: Browser, notes: Notes, 名前: string, ログインID: string): Promise<void> {
  let p = 用意したメンバー.get(ログインID);
  if (!p) {
    const a = notes.get(L_A);
    p = withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await ensureMemberByStoreIds(page, {
        名前, ログインID, メールアドレス: `${ログインID}@example.test`, パスワード: "Passw0rd!M0605W",
        権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
      });
    });
    用意したメンバー.set(ログインID, p);
  }
  return p;
}

const 作業者を用意する = (browser: Browser, notes: Notes) => メンバーを用意する(browser, notes, 既定の作業者, "m0605_worker");

// ---------------------------------------------------------------- 商品（実行の印つきのサプライ品）

export type 品 = {
  /** 商品コード（実行の印を付けた値を渡す） */
  コード: string;
  名前?: string;
  基準価格: number;
  販売価格?: number;
  /** 商品設定の買取価格（履歴の買取価格には使われない） */
  買取価格?: number;
  言語?: string;
  状態?: string;
};

async function 商品を作る(browser: Browser, 商品: 品[], issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, 商品.map((p) => ({ コード: p.コード, 名前: p.名前 ?? p.コード, 基準価格: String(p.基準価格), 買取価格: String(p.買取価格 ?? 500) })), issue);
  });
  for (const p of 商品) 商品規格を整える(p.コード, { 基準価格: p.基準価格, 販売価格: p.販売価格 ?? p.基準価格, 言語: p.言語, 状態: p.状態 });
}

// ---------------------------------------------------------------- 履歴（買取・実在庫・実在庫履歴）

type 在庫の指定 = { 数量?: number; 小計?: number; 変更前?: number | null; 変更後?: number; 作業者?: string; 作成日時?: string };

type 注文の指定 = {
  /** 申込者の姓（実行の印を付ける前の値。同じシードの中で、前方一致しない値にする） */
  姓: string;
  状態?: string;
  /** 日本時間 'YYYY-MM-DD HH:MM:SS' */
  買取日時?: string;
  キャンセル日?: string;
  店?: "東京店" | "大阪店";
  会員ID?: string;
  査定担当者?: string;
  申込日時?: string;
  更新日時?: string;
  /** 印つきの商品コード */
  商品: string;
  在庫?: 在庫の指定;
  /** 買取明細の数量（1件ごと）。買取数になる */
  買取明細?: number[];
  /** 実在庫に紐づく個別入力商品の数量（1件ごと）。買取数になる */
  個別入力?: number[];
  /** 最後に設定する申込者（姓・名） */
  申込者?: [string, string];
};

const 名の元 = "M0605太郎";

/** 申込んだ買取（査定ID）に、DBで値を設定し、実在庫と履歴を足す。履歴IDを返す */
function 買取に書く(査定ID: string, p: 注文の指定): string {
  買取を整える(受注ID(査定ID), RUN_MARK, { 状態: p.状態 ?? "買取成立", 成立日: p.買取日時 ?? 既定の買取日時, 合計金額: null, キャンセル日: p.キャンセル日 ?? null });
  if (p.店) 買取店舗を設定する(査定ID, p.店 === "東京店" ? 東京店のID() : 大阪店のID(), p.店);
  const s = p.在庫 ?? {};
  const 数量 = s.数量 ?? 1;
  const 履歴ID = 実在庫と履歴を足す(査定ID, p.商品, {
    数量, 小計: s.小計 ?? 1000 * 数量, 変更前: s.変更前 === undefined ? 0 : s.変更前, 変更後: s.変更後 ?? 数量,
    作業者: s.作業者 ?? 既定の作業者, 作成日時: s.作成日時,
  });
  for (const q of p.買取明細 ?? []) 買取明細を足す(査定ID, p.商品, q, 1000);
  (p.個別入力 ?? []).forEach((q, i) => 実在庫に紐づく個別入力商品を足す(査定ID, p.商品, `個別入力商品${i + 1}`, q, 1000));
  if (p.査定担当者) 査定担当者を設定する(査定ID, p.査定担当者);
  if (p.会員ID) 会員を設定する(査定ID, p.会員ID);
  if (p.申込日時 || p.更新日時) 申込日時と更新日時を設定する(査定ID, { 申込: p.申込日時, 更新: p.更新日時 });
  if (p.申込者) 申込者を設定する(査定ID, p.申込者[0], p.申込者[1]); // 最後（姓・名から実行の印が消える）
  return 履歴ID;
}

/** 1件ずつ申込んでDBで整える。{ 査定ID, 履歴ID } を返す */
async function 作る(browser: Browser, p: 注文の指定): Promise<{ 査定ID: string; 履歴ID: string }> {
  const 査定ID = await 一件ずつ申込む(browser, "A", rc(p.姓), rc(名の元), "カイトリシケン", "イチロウ");
  return { 査定ID, 履歴ID: 買取に書く(査定ID, p) };
}

/** 同じ姓で件数ぶん申込み、申込の古い順に、指定の関数で整える */
async function 同じ姓で作る(browser: Browser, 姓: string, 件数: number, 指定: (i: number) => Omit<注文の指定, "姓">): Promise<{ 査定ID: string; 履歴ID: string }[]> {
  const 印つきの姓 = rc(姓);
  await 申込を行う(browser, 支店URL("A"), Array.from({ length: 件数 }, () => 申込者の(印つきの姓, rc(名の元), "カイトリシケン", "イチロウ")));
  const ids = await 査定IDを読む(browser, 印つきの姓, 件数);
  return ids.map((査定ID, i) => ({ 査定ID, 履歴ID: 買取に書く(査定ID, { 姓, ...指定(i) }) }));
}

const 共通の注記 = [
  "買取はフロントの店頭買取査定申込（会員登録なし）で申込み、申込者の姓・名に実行の印を付けた。査定番号は画面が振った値に読み替えた",
  "ステータス・買取日時・実在庫情報・実在庫履歴・買取明細は画面で作れないので、DBで実行の印つきの買取に設定した／足した",
  "商品はグッズ商品CSV登録で作った実行の印つきのサプライ品で、基準価格・販売価格・言語・状態はDBで整えた（商品コードは実行の印つきの値）",
];

const 注記する = (issue: (m: string) => void, ...追加: string[]) => { for (const m of [...共通の注記, ...追加]) issue(m); };

const 会員の注記 = "会員ID（正本は決め打ち）は画面で指定できないので、本会員を画面で登録し、DBでその会員を買取に紐づけた。会員IDは画面が振った値";

function 会員を作る(browser: Browser, 前半: string, 名: string): Promise<string> {
  return 本会員を作る(browser, { 姓: "M0605試験", 名, セイ: "シケン", メイ: "カイイン", 前半, パスワード: "Passw0rd!M0605K" });
}

// ---------------------------------------------------------------- 共有のシード

// BASE: 会員6501と65010を、本会員2人に読み替える。商品M6501-A-NM・M6501-B-SP、比較用の商品
defineSeed("S-M06-05-BASE", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  await メンバーを用意する(browser, notes, "試験佐藤一郎", "m0605_sato");
  await メンバーを用意する(browser, notes, "試験鈴木次郎", "m0605_suzuki");
  const A = rc("M6501-A-NM");
  const B = rc("M6501-B-SP");
  const C = rc("M65010-C-NM");
  await 商品を作る(browser, [
    { コード: A, 基準価格: 2200, 販売価格: 2500, 買取価格: 1400 },
    { コード: B, 基準価格: 2500, 販売価格: 2200, 買取価格: 1000, 言語: "英語", 状態: "SP" },
    { コード: C, 基準価格: 3000, 販売価格: 3000 },
  ], issue);
  const 会員1 = await 会員を作る(browser, "m0605-base-a", "会員甲");
  const 会員2 = await 会員を作る(browser, "m0605-base-b", "会員乙");
  const o1 = await 一件ずつ申込む(browser, "A", rc("M0605-BASE-1"), rc(名の元), "カイトリシケン", "イチロウ");
  // 商品M6501-A-NM: 実際の買取単価1,000円（数量2・小計2,000円）、買取数2、変更前在庫5・変更後在庫8
  買取に書く(o1, { 姓: "M0605-BASE-1", 店: "東京店", 会員ID: 会員1, 査定担当者: "試験佐藤一郎", 商品: A, 在庫: { 数量: 2, 小計: 2000, 変更前: 5, 変更後: 8 }, 買取明細: [2] });
  // 商品M6501-B-SP: 実際の買取単価3,000円
  const 履歴B = 実在庫と履歴を足す(o1, B, { 数量: 1, 小計: 3000, 変更前: 0, 変更後: 1, 作業者: 既定の作業者 });
  void 履歴B;
  // 比較の履歴（会員65010・査定担当者試験鈴木次郎）
  const o2 = await 一件ずつ申込む(browser, "A", rc("M0605-BASE-2"), rc(名の元), "カイトリシケン", "イチロウ");
  買取に書く(o2, { 姓: "M0605-BASE-2", 店: "東京店", 会員ID: 会員2, 査定担当者: "試験鈴木次郎", 商品: C, 申込者: ["鈴木", "次郎"] });
  // 申込者「山田 太郎」は最後に設定する（姓・名から実行の印が消えるため）
  申込者を設定する(o1, "山田", "太郎");
  notes.set("〔査定番号-M0605-共有BASE〕", o1);
  注記する(issue, 会員の注記, "査定番号〔…共有BASE〕の買取は買取店舗A（M06-01 の試験店舗）で申込み、DBで既存の店舗「東京店」を指すようにした。商品M6501-B-SP の規格は、グッズ商品CSV登録で作った1件の言語・状態をDBで英語・SPにした（規格を2件にして削除する操作はしていない）。商品名は商品コードと同じ値にした");
});

// STATUSES: 商品コード1件、6つのステータスの買取
defineSeed("S-M06-05-STATUSES", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-STATUSES");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  const 状態 = ["入庫待ち", "未登録在庫あり", "入庫済み", "管理者取消", "買取成立", "買取キャンセル"];
  for (const [i, s] of 状態.entries()) {
    const k = "ABCDEF"[i];
    const r = await 作る(browser, { 姓: `M0605-ST-${k}`, 状態: s, 商品: P });
    notes.set(`〔査定番号-M0605-共有STATUSES-${k}〕`, r.査定ID);
  }
  注記する(issue, `ステータスはDBで設定した（${状態.join("・")}。画面のステータス変更は通していない）。6件は同じ商品コード（実行の印つき）で、検索はその商品コードで絞って確かめる（共有の一覧の読み替え）`);
});

// LANG-STATE: 言語・状態の組み合わせ5件（商品5件）
defineSeed("S-M06-05-LANG-STATE", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const 組 = [["日本語", "NM"], ["英語", "SP"], ["フランス語", "NM"], ["ドイツ語", "MP"], ["日本語", "HP"]];
  const 名前の元 = rc("M0605-LANG");
  await 商品を作る(browser, 組.map(([言語, 状態], i) => ({ コード: rc(`M0605-LANG-${"ABCDE"[i]}`), 名前: `${名前の元}-${"ABCDE"[i]}`, 基準価格: 1000, 言語, 状態 })), issue);
  for (const [i] of 組.entries()) {
    const k = "ABCDE"[i];
    const r = await 作る(browser, { 姓: `M0605-LANG-${k}`, 商品: rc(`M0605-LANG-${k}`) });
    notes.set(`〔査定番号-M0605-共有LANG-${k}〕`, r.査定ID);
  }
  注記する(issue, "言語・状態の組ごとに商品を1件ずつ作り（商品名は共通の印つきの値＋A〜E）、言語・状態はDBで設定した。シード表の「MTGバイヤーでの査定・買取成立」は行わず、DBで買取成立にした。検索は、商品名の共通部分で絞って確かめる（共有の一覧の読み替え）");
});

// DATES: 買取日時の範囲
defineSeed("S-M06-05-DATES", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-DATES");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  const a = await 作る(browser, { 姓: "M0605-DT-A", 商品: P, 買取日時: "2026-08-20 10:00:00" });
  const b = await 作る(browser, { 姓: "M0605-DT-B", 商品: P, 状態: "買取キャンセル", 買取日時: "2026-08-10 10:00:00", キャンセル日: "2026-08-20 10:00:00" });
  const c = await 作る(browser, { 姓: "M0605-DT-C", 商品: P, 買取日時: "2026-08-19 10:00:00" });
  notes.set("〔査定番号-M0605-共有DATES-A〕", a.査定ID);
  notes.set("〔査定番号-M0605-共有DATES-B〕", b.査定ID);
  notes.set("〔査定番号-M0605-共有DATES-C〕", c.査定ID);
  注記する(issue, "買取成立日は買取日時（日本時間）として、日付だけの正本の値に 10:00:00 を補った（A=2026-08-20、B=2026-08-10、C=2026-08-19）。B の買取キャンセル日（2026-08-20）はDBで設定した。検索は商品コード（実行の印つき）で絞って確かめる");
});

// COUNTS: 買取数の取得元
defineSeed("S-M06-05-COUNTS", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("COUNT-M0605");
  await 商品を作る(browser, [{ コード: P, 基準価格: 9999 }], issue);
  const a = await 作る(browser, { 姓: "M0605-CNT-A", 商品: P, 在庫: { 小計: 9999 }, 買取明細: [1, 1, 1] });
  const b = await 作る(browser, { 姓: "M0605-CNT-B", 商品: P, 在庫: { 小計: 9999 }, 個別入力: [1, 1] });
  notes.set("〔査定番号-M0605-共有COUNTS-A〕", a.査定ID);
  notes.set("〔査定番号-M0605-共有COUNTS-B〕", b.査定ID);
  注記する(issue, "A は買取明細3件（各数量1）、B は実在庫の商品に紐づく個別入力商品2件（各数量1）をDBで足した。基準価格・買取単価は9,999円。検索は商品コード（実行の印つき）で行う");
});

// SORT: 買取日時の並び
defineSeed("S-M06-05-SORT", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("SORT-M0605");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  const a = await 作る(browser, { 姓: "M0605-SORT-A", 商品: P, 買取日時: "2026-08-30 10:00:00", 申込日時: "2026-08-01 10:00:00" });
  const b = await 作る(browser, { 姓: "M0605-SORT-B", 商品: P, 買取日時: "2026-08-30 10:00:00", 申込日時: "2026-08-02 10:00:00" });
  const c = await 作る(browser, { 姓: "M0605-SORT-C", 商品: P, 買取日時: "2026-08-29 10:00:00", 申込日時: "2026-08-03 10:00:00" });
  notes.set("〔査定番号-M0605-共有SORT-A〕", a.査定ID);
  notes.set("〔査定番号-M0605-共有SORT-B〕", b.査定ID);
  notes.set("〔査定番号-M0605-共有SORT-C〕", c.査定ID);
  注記する(issue, "査定申込日時・買取日時をDBで設定した（買取日時は正本の日付に 10:00:00 を補った）");
});

// PAGING: 商品コード1件の11件
defineSeed("S-M06-05-PAGING", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("PG-M0605");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  const rs = await 同じ姓で作る(browser, "M0605-PG", 11, (i) => ({ 商品: P, 店: "東京店", 買取日時: `2026-08-28 10:${String(i).padStart(2, "0")}:00` }));
  notes.set("〔履歴ID-M0605-共有PAGING〕", rs.map((r) => r.履歴ID).join("、"));
  注記する(issue, "履歴は同じ姓（実行の印つき）の11件の買取に1件ずつ足した。買取店舗はDBで既存の店舗「東京店」を指すようにした（東京店が既定の検索店舗の管理者でも検索に出るため）。買取日時は 10:00〜10:10 とした。履歴IDは画面（買取商品履歴の一覧）の行の値で、DBで足した履歴の画面での値");
});

// CSV: 3件
defineSeed("S-M06-05-CSV", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("CSV-M0605");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  for (const k of ["A", "B", "C"]) {
    const r = await 作る(browser, { 姓: `M0605-CSV-${k}`, 商品: P });
    notes.set(`〔査定番号-M0605-共有CSV-${k}〕`, r.査定ID);
  }
  注記する(issue, "CSVの取得元情報は、各買取に足した実在庫・実在庫履歴・買取明細。会員・申込者・店舗・作業者・買取数・変更前後在庫・買取日時は、正本が値を決めていないので、既定の値にした");
});

// ---------------------------------------------------------------- ケース専用のシード

// PAGING-028: 空ページ補正（11件目だけ最も古い買取日時）
defineSeed("S-M06-05-PAGING-028", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("PG-M0605-028");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  await 同じ姓で作る(browser, "M0605-PG028", 11, (i) => ({ 商品: P, 店: "東京店", 買取日時: `2026-08-28 10:${String(i).padStart(2, "0")}:00` }));
  注記する(issue, "正本の決め打ちの値（注文ID・実在庫ID・履歴ID・商品ID・会員ID・査定番号）は画面が振る値に読み替えた。買取日時は、1件目（最も古い）が 10:00、ほかが 10:01〜10:10 で、降順の11件目が10:00の履歴になる。買取店舗はDBで既存の店舗「東京店」を指すようにした");
});

// COUNT-043: 商品コードPが3件、Qが1件
defineSeed("S-M06-05-COUNT-043", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-043-P");
  const Q = rc("M0605-043-Q");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }, { コード: Q, 基準価格: 1000 }], issue);
  for (const k of ["A", "B", "C"]) notes.set(`〔査定番号-M0605-043${k}〕`, (await 作る(browser, { 姓: `M0605-043-${k}`, 商品: P })).査定ID);
  notes.set("〔査定番号-M0605-043D〕", (await 作る(browser, { 姓: "M0605-043-D", 商品: Q })).査定ID);
  注記する(issue);
});

// SHOP-044: 買取店舗=大阪店
defineSeed("S-M06-05-SHOP-044", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-044-P");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  notes.set("〔査定番号-M0605-044〕", (await 作る(browser, { 姓: "M0605-044", 商品: P, 店: "大阪店" })).査定ID);
  注記する(issue, "買取は買取店舗Aで申込み、DBで既存の店舗「大阪店」を指すようにした");
});

// WORKER-045: 作業者と査定担当者
defineSeed("S-M06-05-WORKER-045", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await メンバーを用意する(browser, notes, "作業者M0605-045-W", "m0605_w045");
  await メンバーを用意する(browser, notes, "査定M0605-045-S", "m0605_s045");
  const P = rc("M0605-045-P");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  notes.set("〔査定番号-M0605-045〕", (await 作る(browser, { 姓: "M0605-045", 商品: P, 査定担当者: "査定M0605-045-S", 在庫: { 作業者: "作業者M0605-045-W" } })).査定ID);
  注記する(issue, "作業者・査定担当者は、正本の名前のメンバーを画面で登録して使った（登録済みなら使う）");
});

// UPDATED-046: 更新日時は実在庫履歴の作成日時
defineSeed("S-M06-05-UPDATED-046", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-046-P");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
  notes.set("〔査定番号-M0605-046〕", (await 作る(browser, {
    姓: "M0605-046", 商品: P, 買取日時: "2026-08-20 10:00:00", 更新日時: "2026-08-25 09:00:00", 在庫: { 作成日時: "2026-08-21 13:45:10" },
  })).査定ID);
  注記する(issue, "買取日時 2026-08-20 10:00:00、店頭買取注文の更新日時 2026-08-25 09:00:00、実在庫履歴の作成日時 2026-08-21 13:45:10 をDBで設定した（日本時間）");
});

// STATUS1-047: 会員1人の3件（入庫待ち・未登録在庫あり・入庫済み）
defineSeed("S-M06-05-STATUS1-047", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const 会員 = await 会員を作る(browser, "m0605-047", "会員丙");
  const 組 = [["A", "入庫待ち"], ["B", "未登録在庫あり"], ["C", "入庫済み"]];
  await 商品を作る(browser, 組.map(([k], i) => ({ コード: rc(`M0605-047-P${i + 1}`), 基準価格: 1000 })), issue);
  for (const [i, [k, s]] of 組.entries()) await 作る(browser, { 姓: `M0605-047-${k}`, 状態: s, 商品: rc(`M0605-047-P${i + 1}`), 会員ID: 会員 });
  注記する(issue, 会員の注記, "査定番号M0605-047-A・B・C は画面が振った査定番号に読み替えた（商品コードM0605-047-P1・P2・P3 の履歴で区別する）");
});

// PRICE-048: 買取後に基準価格を変えた
defineSeed("S-M06-05-PRICE-048", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes);
  const P = rc("M0605-048-P");
  await 商品を作る(browser, [{ コード: P, 基準価格: 1800 }], issue);
  const r = await 作る(browser, { 姓: "M0605-048", 商品: P, 在庫: { 小計: 1800 } });
  notes.set("〔査定番号-M0605-048〕", r.査定ID);
  商品規格を整える(P, { 基準価格: 2200, 販売価格: 2200 });
  注記する(issue, "買取時の基準価格1,800円で商品を作って履歴を足したあと、DBで商品の基準価格を2,200円に変えた（画面の商品規格の編集は通していない）");
});

// CSV1-049 / CBCSVALL-052: 3件
for (const [id, 商品, 前, 呼び名の元, 注] of [
  ["S-M06-05-CSV1-049", "M0605-049-P", "M0605-049", "049-", "CSVの取得元情報は、各買取に足した実在庫・実在庫履歴・買取明細"],
  ["S-M06-05-CBCSVALL-052", "M0605-CB052-P", "M0605-CB052", "CB052-", "CSVの取得元情報は、各買取に足した実在庫・実在庫履歴・買取明細。商品コードに一致する履歴はこの3件だけ（商品コードに実行の印を付けた）"],
] as const) {
  defineSeed(id, { needs: NEEDS }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await 作業者を用意する(browser, notes);
    const P = rc(商品);
    await 商品を作る(browser, [{ コード: P, 基準価格: 1000 }], issue);
    for (const k of ["A", "B", "C"]) notes.set(`〔査定番号-M0605-${呼び名の元}${k}〕`, (await 作る(browser, { 姓: `${前}-${k}`, 商品: P })).査定ID);
    注記する(issue, 注);
  });
}
