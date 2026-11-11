/**
 * M06-01 買取一覧(検索入力・検索結果) のシードのうち、シード表の投入方法に「DB」を含むもの（seeds/m06-01.ts の続き）。正本: cases/M06-01_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限り DB へ書いてよい」）で、
 * 次のように作る。読み替えと DB への書き込みは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - 買取は、フロントの店頭買取査定申込（会員登録なし）で申込み、申込者の姓に実行の印（rc）を付ける。ステータスは管理画面のステータス変更で変える。
 *   画面が振る査定ID・買取情報内部IDは、正本の決め打ちの値（M0601-MAX-… など）ではなく、画面が振った値に読み替える。
 * - シード表の「査定申込日時=2026-09-20」「棚戻し済み」は、ケースが確かめないものは設定せず、申込で入った値のまま（査定申込日時は申込の日時・棚戻し済みフラグは未完了）にした。
 *   確かめるもの（074 の棚戻し済み）だけ、DB で設定する（db/m06_01.ts。実行の印つきの買取にだけ書く）。
 * - 実在庫情報・買取明細・本人確認・住所3・最終更新者・成立の履歴は画面で作れないので、DB で実行の印つきの買取に足す（db/m06_01.ts）。
 *   商品は、グッズ商品CSV登録で作った実行の印つきのサプライ品（共有のマスタを書き換えない）。
 * - 作らないシード: 大量・共有の他データの削除が要るもの（SEARCH-015・DATE-AMOUNT-020/022/024/025・PAGE-MAX-033）、
 *   カード・棚番号などの共有のマスタの値が要るもの（RESTOCK-SORT-*・CBPDF*・PRODUCT-CSV-045/047/049・CBPRODCSV-082）、
 *   削除済みのメンバーが要るもの（LIST-HISTORY-039）、既定表示件数の設定が要るもの（SEARCH-002）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 棚戻し済みにする, 最終更新者を設定する, ステータス変更履歴を足す, 申込者名と買取金額を設定する, 住所3を設定する, 本人確認を設定する, 買取明細を足す, 実在庫を足す } from "../db/m06_01";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 申込を行う, 査定IDを読む, 申込者の } from "./m06-common";
import { ステータスを変える, 一件ずつ申込む, 支店URL, 試験者 } from "./m06-01";

type 店 = "A" | "B";
const NEEDS = ["S-M06-01-SHOPS", "S-M06-01-ADM-ALL"];
const ALPHA = "ABCDEFGHIJK";
const 呼び名 = (no: string, 枝 = "") => `〔査定ID-M0601-${no}${枝}〕`;

const 申込のまま = "査定申込日時・棚戻し済みフラグは、ケースが確かめないのでDBで設定せず、申込で入った値のまま（棚戻し未完了）にした";

// ---------------------------------------------------------------- 商品（実在庫・買取明細に使う、実行の印つきのサプライ品）

type 品 = { コード: string; 名前: string };

async function 商品を作る(browser: Browser, 商品: 品[], issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, 商品.map((p) => ({ コード: p.コード, 名前: p.名前, 基準価格: "1000", 買取価格: "500" })), issue);
  });
}

/** 名前を問わない実在庫に使う商品。1回の実行で1度だけ作る */
let 共通の商品: Promise<string> | undefined;
function 共通の在庫商品(browser: Browser, issue: (m: string) => void): Promise<string> {
  if (!共通の商品) {
    共通の商品 = (async () => {
      const コード = rc("M0601-STK");
      await 商品を作る(browser, [{ コード, 名前: コード }], issue);
      return コード;
    })();
  }
  return 共通の商品;
}

// ---------------------------------------------------------------- 1件ずつ作る買取

type 注文 = {
  呼び名: string;
  店?: 店;
  /** 申込者の姓（正本の値。実行の印を付ける） */
  姓: string;
  /** ステータス変更画面で順に変える先 */
  状態?: string[];
  /** 画面のあとにDBで足すもの。査定IDを渡す */
  あと?: (査定ID: string, issue: (m: string) => void, browser: Browser) => Promise<void> | void;
};

/** 買取を1件ずつ作るシード（シード表1行＝1つ） */
function defineOrdersSeed(seedId: string, needs: string[], 注文: 注文[], 読み替え: string[] = [申込のまま]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const o of 注文) {
      const t = 試験者(rc(o.姓));
      const id = await 一件ずつ申込む(browser, o.店 ?? "A", t.姓, t.名, t.セイ, t.メイ);
      for (const s of o.状態 ?? []) await ステータスを変える(browser, [id], s);
      if (o.状態?.length) issue(`ステータスはステータス変更画面で「${o.状態.join("」→「")}」と変えた（査定ID ${id}）`);
      await o.あと?.(id, issue, browser);
      notes.set(o.呼び名, id);
    }
    for (const m of 読み替え) issue(m);
  });
}

/** 同じ姓で複数件を申込む（登録の古い順に並ぶ）。letters[i] は i 番目の呼び名の枝。新しい順なら、最後に申込んだものが A */
function defineSameNameSeed(seedId: string, needs: string[], v: {
  no: string; 姓: string; 件数: number; 店?: 店; 新しい順?: boolean; 状態?: string[];
  あと?: (ids: string[], issue: (m: string) => void, browser: Browser) => Promise<void> | void; 読み替え?: string[];
}): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const 姓 = rc(v.姓);
    await 申込を行う(browser, 支店URL(v.店 ?? "A"), Array.from({ length: v.件数 }, () => 申込者の(姓, "太郎", "カイトリシケン", "タロウ")));
    const 古い順 = await 査定IDを読む(browser, 姓, v.件数);
    const ids = v.新しい順 ? [...古い順].reverse() : 古い順;
    for (const s of v.状態 ?? []) await ステータスを変える(browser, 古い順, s);
    if (v.状態?.length) issue(`ステータスはステータス変更画面で「${v.状態.join("」→「")}」と変えた`);
    await v.あと?.(ids, issue, browser);
    ids.forEach((id, i) => notes.set(呼び名(v.no, ALPHA[i]), id));
    for (const m of v.読み替え ?? [申込のまま]) issue(m);
    if (v.件数 > 1) issue(`同じ姓（実行の印つき）で${v.件数}件を続けて申込んだ。${v.新しい順 ? "最後に申込んだものを A（最も新しい）" : "最初に申込んだものを A（買取情報内部IDが最も小さい）"}とした`);
  });
}

// ---- 検索入力（店舗の初期値）・ステータス・店舗の絞り込み

defineOrdersSeed("S-M06-01-SEARCH-003", NEEDS, [{ 呼び名: 呼び名("003"), 姓: "買取試験003" }]);
defineOrdersSeed("S-M06-01-SEARCH-004", NEEDS, [
  { 呼び名: 呼び名("004", "A"), 姓: "買取試験004A", 店: "A" },
  { 呼び名: 呼び名("004", "B"), 姓: "買取試験004B", 店: "B" },
]);
defineOrdersSeed("S-M06-01-SEARCH-005", NEEDS, [{ 呼び名: 呼び名("005"), 姓: "買取試験005", 店: "B" }]);
defineOrdersSeed("S-M06-01-SEARCH-016", NEEDS, [
  { 呼び名: 呼び名("016", "A"), 姓: "買取試験016A", 状態: ["買取キャンセル"] },
  { 呼び名: 呼び名("016", "B"), 姓: "買取試験016B" },
]);
defineOrdersSeed("S-M06-01-SEARCH-017", NEEDS, [{ 呼び名: 呼び名("017"), 姓: "買取試験017", 状態: ["買取キャンセル"] }]);
defineOrdersSeed("S-M06-01-SEARCH-019", NEEDS, [{ 呼び名: 呼び名("019"), 姓: "買取試験019", 店: "B" }]);
defineOrdersSeed("S-M06-01-SEARCH-026", NEEDS, [{ 呼び名: 呼び名("026"), 姓: "買取試験026" }], [
  申込のまま,
  "査定ID M0601-NOT-FOUND は画面が振る形の査定IDではないので、削除はしない（もともと存在しない）。登録していないことは、検索して見つからないことで確かめる",
]);
defineOrdersSeed("S-M06-01-SEARCH-028", NEEDS, [{ 呼び名: 呼び名("028"), 姓: "買取試験028" }]);
defineOrdersSeed("S-M06-01-SEARCH-041", NEEDS, [{ 呼び名: 呼び名("041"), 姓: "買取試験041" }]);
defineOrdersSeed("S-M06-01-SEARCH-055", NEEDS, [{ 呼び名: 呼び名("055"), 姓: "買取試験055" }]);
defineOrdersSeed("S-M06-01-LIST-HISTORY-040", NEEDS, [{ 呼び名: 呼び名("040"), 姓: "買取試験040" }]);

// ---- ページング（11件）。ケース006・030〜034は「A が最も新しい」、029は「A が買取情報内部IDの昇順で先頭」

defineSameNameSeed("S-M06-01-PAGE-11-006", NEEDS, { no: "006", 姓: "境界ページ-006", 件数: 11, 新しい順: true });
defineSameNameSeed("S-M06-01-PAGE-11-030", NEEDS, { no: "030", 姓: "境界ページ-030", 件数: 11, 新しい順: true });
defineSameNameSeed("S-M06-01-PAGE-11-031", NEEDS, { no: "031", 姓: "境界ページ-031", 件数: 11, 新しい順: true });
defineSameNameSeed("S-M06-01-PAGE-11-032", NEEDS, { no: "032", 姓: "境界ページ-032", 件数: 11, 新しい順: true });
defineSameNameSeed("S-M06-01-PAGE-11-034", NEEDS, { no: "034", 姓: "境界ページ-034", 件数: 11, 新しい順: true });
defineSameNameSeed("S-M06-01-PAGE-11-029", NEEDS, { no: "029", 姓: "境界ページ", 件数: 11 });

// ---- 一覧の表示内容（最終更新者・申込者・買取金額・査定担当者）

defineOrdersSeed("S-M06-01-LIST-HISTORY-035", [...NEEDS, "S-M06-01-ADM-A"], [{
  呼び名: 呼び名("035"), 姓: "買取試験035",
  あと: (id, issue) => { 最終更新者を設定する(id, "M06-01試験管理者A"); issue("DBで最終更新者を、既存のメンバー「M06-01試験管理者A」（正本の最終更新者Aに読み替え）に設定した"); },
}]);
defineOrdersSeed("S-M06-01-LIST-HISTORY-036", NEEDS, [{
  呼び名: 呼び名("036"), 姓: "買取試験036",
  あと: (id, issue) => {
    申込者名と買取金額を設定する(id, "山田", "太郎", 123456);
    issue("DBで申込者を「山田 太郎」・買取金額を 123456 円に設定した（金額の列は整数なので、正本の 123456.75 円は小数部を入れられない。ケースは小数部が表示されないことを見る）");
  },
}]);
defineOrdersSeed("S-M06-01-LIST-HISTORY-037", [...NEEDS, "S-M06-01-ADM-A"], [{
  呼び名: 呼び名("037"), 姓: "買取試験037", 状態: ["買取成立"],
  あと: (id, issue) => {
    ステータス変更履歴を足す(id, 1, "M06-01試験管理者A", 2);
    issue("買取成立への変更は、ステータス変更画面で全店管理者（成立担当者B-037に読み替え）が行い、DBで既存のメンバー「M06-01試験管理者A」（成立担当者Aに読み替え）による2日前の買取成立の変更履歴を足した。最も新しい担当者は全店管理者");
  },
}], []);
defineOrdersSeed("S-M06-01-LIST-HISTORY-038", NEEDS, [{
  呼び名: 呼び名("038"), 姓: "買取試験038",
  あと: (id, issue) => { 最終更新者を設定する(id, "M06-01試験全店管理者"); issue("DBで最終更新者を、既存のメンバー「M06-01試験全店管理者」（最終更新者C-038に読み替え）に設定した。買取成立の履歴は作っていない"); },
}]);

// ---- 古物台帳入力用CSV

const 古物の準備 = (住所3?: string) => (id: string, issue: (m: string) => void): void => {
  本人確認を設定する(id);
  if (住所3) 住所3を設定する(id, 住所3);
  issue(`DBで本人確認の種類（既存のマスタの先頭）${住所3 ? `と住所3「${住所3}」` : ""}を設定した`);
};
defineOrdersSeed("S-M06-01-OLDGOODS-042", NEEDS, [
  { 呼び名: 呼び名("042", "A"), 姓: "買取試験042A", あと: 古物の準備("丸の内1-1") },
  { 呼び名: 呼び名("042", "B"), 姓: "買取試験042B", あと: 古物の準備("梅田2-2") },
  { 呼び名: 呼び名("042", "C"), 姓: "買取試験042C", あと: 古物の準備() },
]);
defineOrdersSeed("S-M06-01-OLDGOODS-043", NEEDS, [{ 呼び名: 呼び名("043"), 姓: "買取試験043", あと: 古物の準備("丸の内1-1") }]);
defineOrdersSeed("S-M06-01-OLDGOODS-044", NEEDS, [
  { 呼び名: 呼び名("044", "A"), 姓: "買取試験044A", あと: 古物の準備() },
  { 呼び名: 呼び名("044", "B"), 姓: "買取試験044B", あと: 古物の準備() },
]);

// ---- 戻しリスト（実在庫情報）

const 入庫待ち = ["入庫待ち"];

/** 共通の商品の実在庫（数量1・小計500）を足す */
const 在庫を足す = (数量 = 1) => async (id: string, issue: (m: string) => void, browser: Browser): Promise<void> => {
  const コード = await 共通の在庫商品(browser, issue);
  実在庫を足す(id, コード, 数量, 500 * 数量);
  issue(`DBで実在庫情報（実行の印つきのサプライ品 ${コード}・数量${数量}）を足した`);
};

defineOrdersSeed("S-M06-01-RESTOCK-050", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("050"), 姓: "買取試験050", 状態: 入庫待ち, あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-RESTOCK-051", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("051"), 姓: "買取試験051", 状態: 入庫待ち, あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-RESTOCK-DONE-072", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("072"), 姓: "買取試験072", 状態: ["入庫済み"], あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-RESTOCK-KEEP-073", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("073"), 姓: "買取試験073", 状態: 入庫待ち, あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-RESTOCK-065", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("065"), 姓: "買取試験065", 状態: 入庫待ち, あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-DPAGAIN-079", [...NEEDS, "S-M06-01-ADM-A"], [{ 呼び名: 呼び名("079"), 姓: "買取試験079", 状態: 入庫待ち, あと: 在庫を足す() }]);
defineOrdersSeed("S-M06-01-RESTOCK-ERROR-056", NEEDS, [{ 呼び名: 呼び名("056"), 姓: "買取試験056", 状態: 入庫待ち }], [
  申込のまま,
  "内部ID 999999 の買取情報は、削除せず、もともと存在しないことを前提にした（ケースはチェックボックスの値を 999999 に差し替えて確かめる）",
]);
defineOrdersSeed("S-M06-01-RESTOCK-ERROR-063", NEEDS, [{ 呼び名: 呼び名("063"), 姓: "買取試験063", 状態: 入庫待ち }], [
  申込のまま,
  "内部ID 999999 の買取情報は、削除せず、もともと存在しないことを前提にした（ケースはチェックボックスの値を 999999 に差し替えて確かめる）",
]);

/** 名前つきの商品を作り、実在庫を足す */
const 名前つきの在庫 = (商品: 品, 数量: number) => async (id: string, issue: (m: string) => void, browser: Browser): Promise<void> => {
  await 商品を作る(browser, [商品], issue);
  実在庫を足す(id, 商品.コード, 数量, 500 * 数量);
  issue(`DBで実在庫情報（実行の印つきのサプライ品「${商品.名前}」・数量${数量}）を足した`);
};

// 052: 買取明細（明細商品-052・数量9）と実在庫情報（実在庫商品-052・数量2）
defineSeed("S-M06-01-RESTOCK-052", { needs: [...NEEDS, "S-M06-01-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const t = 試験者(rc("買取試験052"));
  const id = await 一件ずつ申込む(browser, "A", t.姓, t.名, t.セイ, t.メイ);
  await ステータスを変える(browser, [id], "入庫待ち");
  const 明細 = { コード: rc("M0601-052-D"), 名前: rc("明細商品-052") };
  const 実在庫 = { コード: rc("M0601-052-S"), 名前: rc("実在庫商品-052") };
  await 商品を作る(browser, [明細, 実在庫], issue);
  買取明細を足す(id, 明細.コード, 9, 500);
  実在庫を足す(id, 実在庫.コード, 2, 1000);
  issue(`ステータスはステータス変更画面で「入庫待ち」にした。DBで買取明細（「${明細.名前}」・数量9）と実在庫情報（「${実在庫.名前}」・数量2）を足した（商品は実行の印つきのサプライ品）。${申込のまま}`);
  notes.set(呼び名("052"), id);
});

// ---- 複数件の選択

defineSameNameSeed("S-M06-01-DPFLAG-074", NEEDS, {
  no: "074", 姓: "買取試験M0601-074", 件数: 2, 状態: 入庫待ち,
  あと: (ids, issue) => { 棚戻し済みにする(ids[1]); issue("DBで B を棚戻し済みに設定した"); },
  読み替え: [],
});

defineSeed("S-M06-01-DPCSV-075", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 姓 = rc("買取試験M0601-075");
  await 申込を行う(browser, 支店URL("A"), [申込者の(姓, "太郎", "カイトリシケン", "タロウ"), 申込者の(姓, "太郎", "カイトリシケン", "タロウ")]);
  const [a, b] = await 査定IDを読む(browser, 姓, 2);
  const 商品A = { コード: rc("M0601-075-A"), 名前: rc("商品M0601-075A") };
  const 商品B = { コード: rc("M0601-075-B"), 名前: rc("商品M0601-075B") };
  await 商品を作る(browser, [商品A, 商品B], issue);
  買取明細を足す(a, 商品A.コード, 1, 500);
  買取明細を足す(b, 商品B.コード, 1, 500);
  issue(`DBで通常明細を足した（A=「${商品A.名前}」・B=「${商品B.名前}」・各1件。実行の印つきのサプライ品）`);
  notes.set(呼び名("075", "A"), a);
  notes.set(呼び名("075", "B"), b);
});

defineSameNameSeed("S-M06-01-DPRESTOCK-076", [...NEEDS, "S-M06-01-ADM-A"], {
  no: "076", 姓: "買取試験M0601-076", 件数: 2, 状態: 入庫待ち,
  あと: async (ids, issue, browser) => { for (const id of ids) await 在庫を足す()(id, issue, browser); },
  読み替え: [申込のまま],
});

defineSeed("S-M06-01-DPRESTOCK-077", { needs: [...NEEDS, "S-M06-01-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 姓 = rc("買取試験M0601-077");
  await 申込を行う(browser, 支店URL("A"), [申込者の(姓, "太郎", "カイトリシケン", "タロウ"), 申込者の(姓, "太郎", "カイトリシケン", "タロウ")]);
  const [a, b] = await 査定IDを読む(browser, 姓, 2);
  await ステータスを変える(browser, [a, b], "入庫待ち");
  const 商品A = { コード: rc("M0601-077-A"), 名前: rc("在庫商品M0601-077A") };
  const 商品B = { コード: rc("M0601-077-B"), 名前: rc("在庫商品M0601-077B") };
  await 商品を作る(browser, [商品A, 商品B], issue);
  実在庫を足す(a, 商品A.コード, 1, 500);
  実在庫を足す(b, 商品B.コード, 1, 500);
  issue(`ステータスはステータス変更画面で「入庫待ち」にした。DBで実在庫情報（A=「${商品A.名前}」・B=「${商品B.名前}」。実行の印つきのサプライ品）を足した。${申込のまま}`);
  notes.set(呼び名("077", "A"), a);
  notes.set(呼び名("077", "B"), b);
});

defineSeed("S-M06-01-DPMIX-078", { needs: [...NEEDS, "S-M06-01-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 姓 = rc("買取試験M0601-078");
  await 申込を行う(browser, 支店URL("A"), [申込者の(姓, "太郎", "カイトリシケン", "タロウ"), 申込者の(姓, "太郎", "カイトリシケン", "タロウ")]);
  const [a, b] = await 査定IDを読む(browser, 姓, 2);
  await ステータスを変える(browser, [a], "入庫待ち");
  await 在庫を足す()(a, issue, browser);
  issue(`A はステータス変更画面で「入庫待ち」にした。B は査定前のまま。${申込のまま}`);
  notes.set(呼び名("078", "A"), a);
  notes.set(呼び名("078", "B"), b);
});
