/**
 * M06-07 買取商品履歴CSV出力 のシード。正本: cases/M06-07_seed_data.tsv
 *
 * シード表のケース専用シード（FGSEL-013 など）は「DBシードで会員・店舗・作業者・商品・買取情報・買取明細・実在庫履歴を ID付きで投入する」。
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）
 * に従い、M06-05（seeds/m06-05-more.ts）と同じ作り方にする。読み替えとDBへの書き込みは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - 買取は、フロントの店頭買取査定申込（会員登録なし）で買取店舗A（M06-01 の試験店舗）に申込み、申込者の姓・名に実行の印を付ける。
 *   査定ID（正本の 70607013 など）は、画面が振った査定番号に読み替える（呼び名は無いので、このファイルの中で持ち回す）。
 * - 商品は、グッズ商品CSV登録で作る実行の印つきのサプライ品（商品コード・商品名に実行の印）。基準価格・販売価格は DB で正本の値に整える。
 * - ステータス・買取日時・キャンセル日・実在庫情報・実在庫履歴（変更前後の数・作業者・作成日時）・買取明細・会員の紐づけ・買取店舗は
 *   画面で作れないので、実行の印つきの買取にだけ DB で設定する／足す（db/m06_05.ts・db/m06_04_prep.ts・db/m06_07.ts）。
 * - 申込者（受注に記録された氏名）は、最後に DB で正本の値にする（それ以降は、その買取に書けない）。
 * - 会員（014）は、フロントの会員登録で本会員を作り、DB でその会員を買取に紐づける。会員IDは画面が振った値に読み替える。
 * - 買取店舗・作業者は、ケースが値を見る 016 だけ正本の名前（M0607-016-店舗・M0607-016-作業者）で画面から作る（あれば使う）。
 *   ほかのケースは値を見ないので、買取店舗は申込んだ買取店舗A のまま、作業者は試験作業者「M06-07試験作業者」にする。
 * - 会員（014 以外）は、ケースが値を見ないので紐づけない（非会員のまま）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { 会員を設定する, 受注ID, 実在庫と履歴を足す, 買取明細を足す, 商品規格を整える, 申込者を設定する, 買取店舗を設定する } from "../db/m06_05";
import { 買取を整える } from "../db/m06_04_prep";
import { 買取店舗を外す } from "../db/m06_07";
import { ensureMemberByStoreIdsFix as ensureMemberByStoreIds } from "../pages/admin/m04_24_reuse_k";
import { ensureStore, 使い回す店舗の入力 } from "../pages/admin/m04_24_reuse_k";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 店名を読む } from "../lib/store_pick";
import { 一件ずつ申込む } from "./m06-01";
import { 本会員を作る } from "./f06-member";

/** 016 の買取店舗（正本は「M0607-016-店舗」。使い回す E2E の店舗 5007 の、いまの店名） */
export const 店016の店名 = (): string => 店名を読む("5007");

export const M0607_ADMIN: Account = { loginId: "m0607fgadm", password: "Passw0rd-FGM0607ADM" };

const L_A = "〔店舗ID-M0601-共有A〕";
const NEEDS = ["S-M06-01-SHOPS", "S-M06-07-FGADM"];
const 既定の作業者 = "M06-07試験作業者";
const 既定の買取日時 = "2026-08-01 10:00:00";
const 既定の作成日時 = "2026-08-02 11:30:00";

defineSeed("S-M06-07-FGADM", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const a = notes.get(L_A);
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureMemberByStoreIds(page, {
      名前: "M06-07追加試験管理者", ログインID: M0607_ADMIN.loginId, メールアドレス: "m0607fgadm@example.test", パスワード: M0607_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [a],
    });
  });
  notes.set("〔管理者ID-M0607-共有〕", id);
});

// ---------------------------------------------------------------- 作るための部品

const 用意したメンバー = new Map<string, Promise<void>>();

/** 作業者（メンバー）を、あれば内容を確かめて使い、無ければ画面で登録する（所属店舗・編集可能店舗は買取店舗A） */
function 作業者を用意する(browser: Browser, notes: Notes, 名前: string, ログインID: string): Promise<void> {
  let p = 用意したメンバー.get(ログインID);
  if (!p) {
    const a = notes.get(L_A);
    p = withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await ensureMemberByStoreIds(page, {
        名前, ログインID, メールアドレス: `${ログインID}@example.test`, パスワード: "Passw0rd!M0607W",
        権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
      });
    });
    用意したメンバー.set(ログインID, p);
  }
  return p;
}

/** 商品（実行の印つきのサプライ品）を作り、基準価格・販売価格を正本の値に整える */
async function 商品を作る(browser: Browser, 品: { コード: string; 名前: string }[], issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, 品.map((p) => ({ コード: p.コード, 名前: p.名前, 基準価格: "3000", 買取価格: "1200" })), issue);
  });
  for (const p of 品) 商品規格を整える(p.コード, { 基準価格: 3000, 販売価格: 3000 });
}

/** 正本の商品コード（実行の印を付ける前） → 実際の商品コード */
export const コード = (正本: string): string => rc(正本);

type 履歴の指定 = { 正本のコード: string; 正本の名前: string; 作成日時?: string };
type 買取の指定 = {
  /** 申込のときの姓（実行の印を付ける前） */
  姓: string;
  履歴: 履歴の指定[];
  状態?: string;
  買取日時?: string | null;
  キャンセル日?: string | null;
  作業者?: string;
  /** 店舗名（あれば、その店舗を指す） */
  店?: { ID: string; 名: string };
  店を外す?: boolean;
  会員ID?: string;
  /** 最後に設定する申込者（受注に記録された氏名） */
  申込者?: [string, string];
};

/** 作った買取の査定ID（シードID → 査定ID）。正本の査定ID（70607013 など）を画面が振った値に読み替えたもの */
const 査定IDs = new Map<string, string>();
export function 査定IDの(seedId: string): string {
  const v = 査定IDs.get(seedId);
  if (!v) throw new Error(`${seedId} の買取がまだ作られていない`);
  return v;
}

/** 申込んで、DB で買取を整え、実在庫・実在庫履歴・買取明細を足す。査定IDを返す */
async function 買取を作る(browser: Browser, seedId: string, p: 買取の指定): Promise<string> {
  const 査定ID = await 一件ずつ申込む(browser, "A", rc(p.姓), rc("M0607太郎"), "カイトリシケン", "イチロウ");
  買取を整える(受注ID(査定ID), RUN_MARK, {
    状態: p.状態 ?? "買取成立", 成立日: p.買取日時 === undefined ? 既定の買取日時 : p.買取日時, 合計金額: null, キャンセル日: p.キャンセル日 ?? null,
  });
  if (p.店) 買取店舗を設定する(査定ID, p.店.ID, p.店.名);
  if (p.店を外す) 買取店舗を外す(査定ID);
  for (const h of p.履歴) {
    const c = コード(h.正本のコード);
    実在庫と履歴を足す(査定ID, c, { 数量: 1, 小計: 1200, 変更前: 10, 変更後: 11, 作業者: p.作業者 ?? 既定の作業者, 作成日時: h.作成日時 ?? 既定の作成日時 });
    買取明細を足す(査定ID, c, 1, 1200);
  }
  if (p.会員ID) 会員を設定する(査定ID, p.会員ID);
  if (p.申込者) 申込者を設定する(査定ID, p.申込者[0], p.申込者[1]); // 最後（姓・名から実行の印が消える）
  査定IDs.set(seedId, 査定ID);
  return 査定ID;
}

const 共通の注記 = [
  "買取はフロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付けた。正本の査定IDは、画面が振った査定番号に読み替えた",
  "ステータス・買取日時・実在庫情報・実在庫履歴（変更前10・変更後11・作成日時）・買取明細（数量1・単価1200）は画面で作れないので、DBで実行の印つきの買取に設定した／足した",
  "商品はグッズ商品CSV登録で作った実行の印つきのサプライ品（商品コード・商品名に実行の印）で、基準価格・販売価格（3000）はDBで整えた。正本の商品ID・明細ID・履歴IDは画面が振る値に読み替えた",
];
const 値を見ない注記 = "会員・買取店舗・作業者は、ケースが値を見ないので、会員は紐づけず（非会員）、買取店舗は申込んだ買取店舗A、作業者は試験作業者「M06-07試験作業者」にした（正本の会員ID・店舗・作業者の名前は使わない）";

function 注記する(seedId: string, ...追加: string[]): void {
  for (const m of [...共通の注記, ...追加]) reportSeedIssue(seedId, m);
}

const 一件の履歴 = (n: string): 履歴の指定[] => [{ 正本のコード: `M0607-FG${n}-P`, 正本の名前: `M0607-${n}-商品` }];

async function 品を作る(browser: Browser, 履歴: 履歴の指定[], issue: (m: string) => void): Promise<void> {
  await 商品を作る(browser, 履歴.map((h) => ({ コード: コード(h.正本のコード), 名前: rc(h.正本の名前) })), issue);
}

// ---------------------------------------------------------------- ケース専用のシード

/** 作った会員の会員ID（シードID → 会員ID）。正本の会員ID（71607014）を画面が振った値に読み替えたもの */
const 会員IDs = new Map<string, string>();
export function 会員IDの(seedId: string): string {
  const v = 会員IDs.get(seedId);
  if (!v) throw new Error(`${seedId} の会員がまだ作られていない`);
  return v;
}


defineSeed("S-M06-07-FGSEL-013", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = (["A", "B", "C"] as const).map((k) => ({ 正本のコード: `M0607-FG013-${k}`, 正本の名前: `M0607-013-商品${k}` }));
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG013", 履歴 });
  注記する(seed.シードID, 値を見ない注記, "1件の買取に、商品A・B・Cの実在庫と実在庫履歴を1件ずつ足した（作成日時は3件とも 2026-08-02 11:30:00）");
});

defineSeed("S-M06-07-FGMEM-014", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 一件の履歴("014");
  await 品を作る(browser, 履歴, issue);
  const 会員ID = await 本会員を作る(browser, { 姓: "M0607-014姓", 名: "M0607-014名", セイ: "シケン", メイ: "カイイン", 前半: "m0607-014", パスワード: "Passw0rd!M0607K" });
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG014", 履歴, 会員ID, 申込者: ["M0607-014受注姓", "M0607-014受注名"] });
  会員IDs.set(seed.シードID, 会員ID);
  注記する(seed.シードID,
    "会員（姓 M0607-014姓・名 M0607-014名）は、フロントの会員登録で本会員を作り、DBでその会員を買取に紐づけた。正本の会員ID 71607014 は、画面が振った会員IDに読み替えた",
    "受注に記録された氏名（申込者）は、最後にDBで「M0607-014受注姓」「M0607-014受注名」にした（会員の氏名とは別の値）",
    "買取店舗・作業者は、ケースが値を見ないので、買取店舗は申込んだ買取店舗A、作業者は試験作業者「M06-07試験作業者」にした");
});

defineSeed("S-M06-07-FGNMB-015", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 一件の履歴("015");
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG015", 履歴, 申込者: ["M0607-015受注姓", "M0607-015受注名"] });
  注記する(seed.シードID,
    "会員は紐づけない（フロントの会員登録なしの申込のまま）。受注に記録された氏名（申込者）は、最後にDBで「M0607-015受注姓」「M0607-015受注名」にした",
    "買取店舗・作業者は、ケースが値を見ないので、買取店舗は申込んだ買取店舗A、作業者は試験作業者「M06-07試験作業者」にした");
});

defineSeed("S-M06-07-FGSTO-016", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  // 店舗は作らない（依頼者 2026-11-15）。「M0607-016-店舗」は、使い回す E2E の店舗 5007（買取店舗Aの 4973 とは別の店舗）で表す
  const 店名 = 店016の店名();
  const 店ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, 使い回す店舗の入力("5007", "M0607-016-店舗"), issue);
  });
  await 作業者を用意する(browser, notes, "M0607-016-作業者", "m0607_w016");
  const 履歴 = 一件の履歴("016");
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG016", 履歴, 店: { ID: 店ID, 名: 店名 }, 作業者: "M0607-016-作業者" });
  注記する(seed.シードID,
    "買取店舗「M0607-016-店舗」は使い回す E2E の店舗 5007（店舗は作らない決まり。依頼者 2026-11-15）で表した。作業者「M0607-016-作業者」はメンバー管理で、決まった名前で1度だけ作り使い回す（あれば内容を確かめて使う）。正本の店舗ID・管理画面ユーザIDは画面が振った値に読み替えた",
    "買取は買取店舗Aで申込み、DBで買取店舗を「M0607-016-店舗」にした。実在庫履歴の作業者は「M0607-016-作業者」",
    "会員は、ケースが値を見ないので紐づけない（非会員）");
});

defineSeed("S-M06-07-FGNST-017", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 一件の履歴("017");
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG017", 履歴, 店を外す: true });
  注記する(seed.シードID, "買取は買取店舗Aで申込み、DBで買取店舗を未設定にした", "会員・作業者は、ケースが値を見ないので、会員は紐づけず、作業者は試験作業者「M06-07試験作業者」にした");
});

defineSeed("S-M06-07-FGCAN-018", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 一件の履歴("018");
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG018", 履歴, 状態: "買取キャンセル", 買取日時: null, キャンセル日: "2026-08-04 15:00:00" });
  注記する(seed.シードID, 値を見ない注記,
    "買取成立日時は空、キャンセル日 2026-08-04 15:00:00 をDBで設定した。ステータスは正本が定めないので、キャンセル日に合わせて「買取キャンセル」にした");
});

defineSeed("S-M06-07-FGERR-019", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 一件の履歴("019");
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG019", 履歴 });
  注記する(seed.シードID, 値を見ない注記);
});

/** 020 の12件の商品コード（正本の値。P01〜P12） */
export const 二十番の商品コード = Array.from({ length: 12 }, (_, i) => `M0607-FG020-P${String(i + 1).padStart(2, "0")}`);

defineSeed("S-M06-07-FGPAG-020", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 作業者を用意する(browser, notes, 既定の作業者, "m0607_worker");
  const 履歴 = 二十番の商品コード.map((c, i) => ({ 正本のコード: c, 正本の名前: "M0607-020-商品", 作成日時: `2026-08-02 10:${String(i + 1).padStart(2, "0")}:00` }));
  await 品を作る(browser, 履歴, issue);
  await 買取を作る(browser, seed.シードID, { 姓: "M0607-FG020", 履歴 });
  注記する(seed.シードID, 値を見ない注記, "1件の買取に、商品P01〜P12の実在庫と実在庫履歴を1件ずつ足した（作成日時は 2026-08-02 10:01:00〜10:12:00）");
});
