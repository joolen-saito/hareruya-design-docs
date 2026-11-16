/**
 * M07-01 買取検索一覧 の戻しリストの並び順（065・101〜112）のシード。正本: cases/M07-01_seed_data.tsv
 *
 * ≪共有の設定を書き換えて戻すもの≫（S-M07-01-RETURN-CONFIG。夜に1本だけで流す回 E2E_ALLOW_SHARED=1 か、手元の環境でだけ書き換える）:
 * - 本店の高額商品閾値1〜3（店舗基本設定）: いまの値が 1000/5000/未設定 でなければ、書き換える前に店舗基本設定の全項目を画面から控え、
 *   閾値の3項目だけを入れて保存する。ケースの終わりに、基盤（lib/shared_restore.ts）が画面で全項目を控えた値へ戻し、開き直して同じかを確かめる。
 * - 色順マスタの赤・青: 赤の並び順が青より小さくなければ、色順の全行を控え、赤の並び順だけを「青の並び順 − 1」にして登録する。
 *   ケースの終わりに、全行を控えた値へ戻して登録し、開き直して同じかを確かめる。
 * - 略称タグ TAG-C・TAG-A のアルファベット順ソートフラグ: TAG-C を外し、TAG-A を付ける。違うときだけ、その行の値を控えて書き換え、
 *   ケースの終わりに控えた値へ戻して確かめる。名称の行が無いときは、シード表どおり新しく登録し、ケースの終わりに消して確かめる。
 * どれも、いまの値がすでに前提どおりなら書き換えない（書き換えるのは前提に要る項目だけ）。
 *
 * ≪印つきで足すもの≫（ケースごと）: カード（英語名に実行の印）・略称タグ（名称に実行の印）・商品（商品コード・商品名に実行の印）・会員・買取。
 * - 棚番号は、名称の形が「大文字1字-数字3桁」に決められていて印を付けられない。シード表の名称のまま、あれば使い、無ければ登録する
 *   （あった行の並び順が、このシードの棚どうしの大小と合わなければ、共有の行を書き換えずに止める）。消さない（規格が使うので画面から消せない）。
 * - カードのカードセットは、決まった印つきのカードセット（M07-01試験カードセット-E2E）を、あれば使い、無ければ登録する。
 * - 065 の商品には共有の略称タグ TAG-A・TAG-C を付けるので、付ける前に「ケースの終わりに 065 の商品から TAG-A・TAG-C を外す」ことを登録する
 *   （共有の略称タグに印つきの商品を残さない。CONFIG が新しく登録した TAG-A・TAG-C を消せるようにする）。
 *
 * シード表との違い（シードの注記にも出す）:
 * - 会員は、フロントの会員登録＋管理画面の会員登録編集（本会員）で作る（m07-01-b.ts の 申し込む。本登録のメールは読まない）。
 *   メールアドレスは実行の印つき、パスワードは M07 の会員の共通の値。お名前の姓（注文者名）は実行の印つき。
 * - 買取番号は申込完了画面の番号を控え、一覧で注文者名の行と同じことを確かめる。
 * - 実在庫の「商品追加」は、1品ずつ「追加品確定」まで行う（シード表は2品を足してから1回確定する）。足す順はシード表どおり Y → X。
 * - 商品登録編集の「カード指定」のあと、商品カテゴリを単体カードにする（m07_09_card.ts の部品の作り。カード商品として登録するため）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { rc, rcFixed, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { ShopBasicPage, 控え } from "../pages/admin/m10_01_shop";
import {
  一覧の行, 本店の閾値を入れて保存する, 本店の閾値を読む, 閾値, 色順の全行, 色順の並び順を入れて登録する, 色順の項目, 色順を控えへ戻す,
  略称タグの全件, 略称タグを開いて読む, 略称タグを書き換える, 略称タグを新しく登録する, 略称タグを消す, 棚番号の全件, 棚番号を新しく登録する,
  商品の略称タグ, 商品の略称タグを外す,
} from "../pages/admin/m07_01_return_config";
import { カード詳細, マスタの行, マスタを読む, 商品をカードにする, 実在庫に規格を追加する, 規格を整える, 規格を足す } from "../pages/admin/m07_09_card";
import { カードを登録する, 略称タグを登録する } from "../pages/admin/m06_11_setup";
import { ensureCardset } from "../pages/admin/product_masters";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { 申し込む, 注文者名, 状況 } from "./m07-01-b";
import { 商品IDを画面で引く } from "./m07-03-b";

type Issue = (m: string) => void;
const ADM = "S-M07-01-ADM";
const CONFIG = "S-M07-01-RETURN-CONFIG";

/** 共有の設定を書き換えてよいのは、手元の環境か、夜に1本だけで流す回（E2E_ALLOW_SHARED=1）だけ */
function 書き換えを許す(対象: string): void {
  if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
    throw new Error(`共有の環境では${対象}（共有の設定）を書き換えない。夜に1本だけで流す回でだけ書き換える`);
  }
}

// ---------------------------------------------------------------------------
// S-M07-01-RETURN-CONFIG（共有の設定。書き換えて、ケースの終わりに戻す）
// ---------------------------------------------------------------------------

/** シード表の本店の高額商品閾値（第1=1000円、第2=5000円、第3=未設定） */
export const 前提の閾値: 閾値 = ["1000", "5000", ""];
const 閾値の文 = (v: 閾値) => v.map((x) => x || "未設定").join("/");

async function 閾値をそろえる(browser: Browser, page: Page, seedId: string, issue: Issue): Promise<void> {
  const now = await 本店の閾値を読む(page);
  if (now.join("/") === 前提の閾値.join("/")) {
    issue(`本店の高額商品閾値は、すでに ${閾値の文(前提の閾値)} だったので書き換えなかった`);
    return;
  }
  書き換えを許す("本店の高額商品閾値");
  const p = new ShopBasicPage(page);
  await p.open();
  const 元: 控え = await p.全部読む();
  const 対象 = `本店の店舗基本設定（全項目。高額商品閾値を書き換える前。${seedId}）`;
  registerRestore(対象, 元,
    async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
      q.setDefaultTimeout(60_000);
      await new ShopBasicPage(q).控えへ戻して保存する(元, `${対象}を元の値へ戻す`);
    }),
    async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
      q.setDefaultTimeout(60_000);
      const r = new ShopBasicPage(q);
      await r.open();
      const 今 = await r.全部読む();
      return Object.keys(元).every((k) => 今[k] === 元[k]) && Object.keys(今).every((k) => k in 元);
    }));
  await 本店の閾値を入れて保存する(page, 前提の閾値, `${seedId}: 本店の高額商品閾値を ${閾値の文(前提の閾値)} にする`);
  const after = await 本店の閾値を読む(page);
  if (after.join("/") !== 前提の閾値.join("/")) throw new Error(`${seedId}: 本店の高額商品閾値を ${閾値の文(前提の閾値)} にして保存したが、開き直すと ${閾値の文(after)}`);
  issue(`本店の高額商品閾値を ${閾値の文(now)} から ${閾値の文(前提の閾値)} に書き換えた（共有の設定。店舗基本設定の全項目を画面で控え、ケースの終わりに画面で戻して、開き直して同じかを確かめる）`);
}

type マスタの行16 = Awaited<ReturnType<typeof 色順の全行>>[number];

/** 色順の行（名称 → 行）。名称がちょうど1行であること */
function 色順の行(rows: マスタの行16[], 名: string): マスタの行16 {
  const hit = rows.filter((r) => r.値[色順の項目(r).名称] === 名);
  if (hit.length !== 1) throw new Error(`色順マスタに名称「${名}」の行が ${hit.length} 行ある（1行のはず）`);
  return hit[0];
}

async function 色順をそろえる(browser: Browser, page: Page, seedId: string, issue: Issue): Promise<void> {
  const 前 = await 色順の全行(page);
  const 赤 = 色順の行(前, "赤"), 青 = 色順の行(前, "青");
  const k = 色順の項目(赤).並び順;
  const r = Number(赤.値[k]), b = Number(青.値[k]);
  if (r < b) {
    issue(`色順マスタは、すでに赤（並び順 ${r}）が青（並び順 ${b}）より前だったので書き換えなかった`);
    return;
  }
  書き換えを許す("色順マスタの赤・青の並び順");
  if (b < 1) throw new Error(`${seedId}: 青の並び順が ${b} で、赤をそれより小さくできない（並び順は0以上）`);
  const 対象 = `MTGマスターデータ「色順」（全${前.length}行。赤の並び順を書き換える前。${seedId}）`;
  registerRestore(対象, { 行: 前 },
    async () => withAdminSession(browser, SETUP_ADMIN, async (q) => { q.setDefaultTimeout(60_000); await 色順を控えへ戻す(q, 前, `${対象}を元の値へ戻す`); }),
    async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
      q.setDefaultTimeout(60_000);
      const 今 = await 色順の全行(q);
      return 前.every((x) => JSON.stringify(今.find((y) => y.番号 === x.番号)?.値 ?? null) === JSON.stringify(x.値));
    }));
  await 色順の並び順を入れて登録する(page, 赤.番号, k, String(b - 1), `${seedId}: 色順マスタの赤の並び順を ${b - 1} にする`);
  const 後 = await 色順の全行(page);
  const r2 = Number(色順の行(後, "赤").値[k]), b2 = Number(色順の行(後, "青").値[k]);
  if (!(r2 < b2)) throw new Error(`${seedId}: 色順マスタの赤の並び順を入れて登録したが、開き直すと赤 ${r2}・青 ${b2}`);
  issue(`色順マスタの赤の並び順を ${r} から ${b - 1} に書き換えた（青は ${b}。共有のマスタ。色順の全行を画面で控え、ケースの終わりに戻して確かめる）`);
}

/** シード表の略称タグの設定（TAG-C はコレクター番号順＝フラグを外す、TAG-A は英語カード名順＝フラグを付ける） */
const 略称タグの前提: [string, boolean][] = [["TAG-C", false], ["TAG-A", true]];

async function 略称タグをそろえる(browser: Browser, page: Page, seedId: string, issue: Issue): Promise<void> {
  for (const [名, フラグ] of 略称タグの前提) {
    const 全 = await 略称タグの全件(page);
    const hit = 全.filter((t) => t.名称 === 名);
    if (hit.length > 1) throw new Error(`${seedId}: 略称タグ「${名}」が ${hit.length} 行ある`);
    if (hit.length === 0) {
      書き換えを許す(`略称タグ「${名}」の登録`);
      // 並び順はシード表が決めていない。名称の順（TAG-A が TAG-C より前）になるように、相手があればその前後、無ければ TAG-A=1・TAG-C=2
      const 相手 = 全.find((t) => t.名称 === (名 === "TAG-A" ? "TAG-C" : "TAG-A"));
      const 並び順 = 相手
        ? (名 === "TAG-A" ? (相手.並び順 >= 1 ? 相手.並び順 - 1 : 相手.並び順 + 1) : (相手.並び順 < 32767 ? 相手.並び順 + 1 : 相手.並び順 - 1))
        : (名 === "TAG-A" ? 1 : 2);
      const 作った: { ID: string | null } = { ID: null };
      const 対象 = `略称タグ「${名}」（無かったので新しく登録する行。${seedId}）`;
      registerRestore(対象, { 名称: 名, 無かった: true },
        async () => {
          if (!作った.ID) return;
          await withAdminSession(browser, SETUP_ADMIN, async (q) => { q.setDefaultTimeout(60_000); await 略称タグを消す(q, 作った.ID!, `${対象}を消す`); });
        },
        async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
          q.setDefaultTimeout(60_000);
          const 今 = await 略称タグの全件(q);
          return !今.some((t) => (作った.ID !== null && t.ID === 作った.ID));
        }));
      作った.ID = await 略称タグを新しく登録する(page, { 名称: 名, 並び順: String(並び順), アルファベット順: フラグ }, `${seedId}: 略称タグ「${名}」の登録`);
      issue(`略称タグ「${名}」が無かったので、シード表どおり新しく登録した（並び順 ${並び順}・アルファベット順ソートフラグ ${フラグ ? "あり" : "なし"}。並び順はシード表が決めていないので、TAG-A が TAG-C より前になる値にした）。ケースの終わりに消して確かめる`);
      continue;
    }
    const t = hit[0];
    const 元 = await 略称タグを開いて読む(page, t.ID);
    if (元.アルファベット順 === フラグ) {
      issue(`略称タグ「${名}」（ID ${t.ID}）は、すでにアルファベット順ソートフラグが${フラグ ? "あり" : "なし"}だったので書き換えなかった（並び順 ${元.並び順}）`);
      continue;
    }
    書き換えを許す(`略称タグ「${名}」のアルファベット順ソートフラグ`);
    const 対象 = `略称タグ「${名}」（ID ${t.ID}）の名称・並び順・アルファベット順ソートフラグ（${seedId}）`;
    registerRestore(対象, 元,
      async () => withAdminSession(browser, SETUP_ADMIN, async (q) => { q.setDefaultTimeout(60_000); await 略称タグを書き換える(q, t.ID, 元, `${対象}を元の値へ戻す`); }),
      async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
        q.setDefaultTimeout(60_000);
        const 今 = await 略称タグを開いて読む(q, t.ID);
        return 今.名称 === 元.名称 && 今.並び順 === 元.並び順 && 今.アルファベット順 === 元.アルファベット順;
      }));
    await 略称タグを書き換える(page, t.ID, { ...元, アルファベット順: フラグ }, `${seedId}: 略称タグ「${名}」のアルファベット順ソートフラグを${フラグ ? "付ける" : "外す"}`);
    const 後 = await 略称タグを開いて読む(page, t.ID);
    if (後.アルファベット順 !== フラグ) throw new Error(`${seedId}: 略称タグ「${名}」のアルファベット順ソートフラグを書き換えて登録したが、開き直すと${後.アルファベット順 ? "あり" : "なし"}のまま`);
    issue(`略称タグ「${名}」（ID ${t.ID}・並び順 ${元.並び順}）のアルファベット順ソートフラグを${フラグ ? "付けた" : "外した"}（共有のマスタ。元の値を画面で控え、ケースの終わりに戻して確かめる）`);
  }
}

defineSeed("S-M07-01-RETURN-CONFIG", { needs: [ADM] }, async ({ browser, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 閾値をそろえる(browser, page, id, issue);
    await 色順をそろえる(browser, page, id, issue);
    await 略称タグをそろえる(browser, page, id, issue);
  });
});

// ---------------------------------------------------------------------------
// カード商品を作る共通の部品
// ---------------------------------------------------------------------------

type 言語 = "JP" | "EN" | "FR";
type 前提 = { 言語: Map<string, マスタの行>; レア: Map<string, マスタの行>; カードセット: string; カテゴリ: string };
let 前提の控え: 前提 | undefined;

async function 前提を読む(page: Page, issue: Issue): Promise<前提> {
  if (前提の控え) return 前提の控え;
  const byCode = (rows: マスタの行[]) => new Map(rows.filter((r) => r.コード).map((r) => [r.コード, r] as [string, マスタの行]));
  const 言語 = byCode(await マスタを読む(page, "言語"));
  const レア = byCode(await マスタを読む(page, "レアリティ"));
  for (const c of ["JP", "EN"]) if (!言語.get(c)) throw new Error(`MTGマスターデータの言語にコード ${c} の行が無い`);
  for (const c of ["M", "C"]) if (!レア.get(c)) throw new Error(`MTGマスターデータのレアリティにコード ${c} の行が無い`);
  const カードセット = await ensureCardset(page, rcFixed("M07-01試験カードセット"), rcFixed("M0701 Test Set"), "M0701S", issue);
  const カテゴリ = await goodsCsvCategoryId(page, issue);
  前提の控え = { 言語, レア, カードセット, カテゴリ };
  return 前提の控え;
}

export type 札 = { 英名: string; 色: "赤" | "青"; 番号: string; レア: "M" | "C"; Foil: boolean };

/** カード（英語名に実行の印）をカード新規登録で登録し、英語名（正本の値）→ カード詳細 を返す。同じ英語名は1回だけ登録する */
async function カードを用意する(page: Page, 前: 前提, 札々: 札[], seedId: string, issue: Issue): Promise<Map<string, カード詳細>> {
  const out = new Map<string, カード詳細>();
  for (const c of 札々) {
    if (out.has(c.英名)) continue;
    const r = await カードを登録する(page, {
      カード名英: rc(c.英名), カラー: c.色, 色順: c.色,
      詳細: { カードセットID: 前.カードセット, カード番号: c.番号, レアリティ名: 前.レア.get(c.レア)!.名称, Foil: c.Foil },
    }, `${seedId}: カード「${rc(c.英名)}」`, issue);
    out.set(c.英名, { カードID: r.カードID, 詳細ID: r.カード詳細ID, カード名日: "", カード名英: rc(c.英名), コレクター番号: c.番号, 色: c.色, レアリティID: 前.レア.get(c.レア)!.ID, Foil: c.Foil ? "1" : "0" });
  }
  return out;
}

/**
 * 棚番号（シード表の名称）を、あれば使い、無ければ登録する。あった行の並び順は書き換えない。
 * このシードの棚どうしの並び順の大小が、シード表の大小と同じでなければ止める（共有の行を書き換えない）。名称 → 実際の並び順 を返す。
 */
async function 棚を用意する(page: Page, 棚々: { 名称: string; 並び順: number }[], seedId: string, issue: Issue): Promise<Map<string, number>> {
  const 全 = await 棚番号の全件(page);
  const out = new Map<string, number>();
  for (const s of 棚々) {
    const hit = 全.filter((x) => x.名称 === s.名称);
    if (hit.length > 1) throw new Error(`${seedId}: 棚番号「${s.名称}」が ${hit.length} 行ある`);
    if (hit.length === 1) {
      out.set(s.名称, hit[0].並び順);
      issue(`棚番号「${s.名称}」はすでにあったので使った（並び順 ${hit[0].並び順}。シード表は ${s.並び順}。名称の形が決められていて実行の印を付けられない）`);
    } else {
      await 棚番号を新しく登録する(page, s, `${seedId}: 棚番号「${s.名称}」の登録`);
      out.set(s.名称, s.並び順);
      issue(`棚番号「${s.名称}」を並び順 ${s.並び順} で登録した（名称の形が「大文字1字-数字3桁」に決められていて実行の印を付けられないので、シード表の名称のまま。次の実行でも使う）`);
    }
  }
  for (const a of 棚々) for (const b of 棚々) {
    if (a.並び順 < b.並び順 && !(out.get(a.名称)! < out.get(b.名称)!)) {
      throw new Error(`${seedId}: 既存の棚番号「${a.名称}」（並び順 ${out.get(a.名称)}）と「${b.名称}」（${out.get(b.名称)}）の並び順の大小が、シード表（${a.並び順} < ${b.並び順}）と合わない。共有の行なので書き換えずに止めた`);
    }
  }
  return out;
}

/** 商品の作り方（グッズ商品CSVの1行 → カード指定・略称タグ → 規格） */
type 商品の作り = {
  /** 正本の商品コード（実行の印を付けて作る） */
  コード: string;
  名日: string;
  名英: string;
  言語: 言語;
  基準価格: string;
  買取価格: string;
  /** 実在庫に使う規格の状態。HP なら「新規作成」で規格を足す（商品コードは コード-HP） */
  状態: "NM" | "HP";
  棚: string;
  /** 略称タグの名称（実際の名称）。null は付けない */
  略称タグ: string | null;
  /** カードの英語名（正本の値）。null はサプライ（カードを指定しない） */
  カード: string | null;
};

/** 実在庫に使う規格の商品コード（実際の値） */
export const 規格のコード = (p: { コード: string; 状態: "NM" | "HP" }): string => (p.状態 === "HP" ? rc(`${p.コード}-HP`) : rc(p.コード));

/** 商品を作り、正本の商品コード → 商品ID を返す */
async function 商品を作る(page: Page, 前: 前提, カード: Map<string, カード詳細>, 品々: 商品の作り[], seedId: string, issue: Issue, 引いたら?: (p: 商品の作り, 商品ID: string) => void): Promise<Map<string, string>> {
  await registerGoodsCsv(page, {
    what: `${seedId}: 商品のグッズ商品CSV登録`,
    fileName: `m0701-${seedId.slice(-3).toLowerCase()}-${RUN_MARK.toLowerCase()}-${Date.now()}.csv`,
    categoryId: 前.カテゴリ,
    lines: 品々.map((p) => ({
      code: rc(p.コード), nameJp: rc(p.名日), nameEn: rc(p.名英),
      values: { "基準価格": p.基準価格, "販売価格": p.基準価格, "買取価格": p.買取価格, "言語(ID)": 前.言語.get(p.言語)!.ID },
    })),
    common: { "原価単価": "10" },
    onWarning: issue,
  });
  const ids = new Map<string, string>();
  for (const p of 品々) {
    const id = await 商品IDを画面で引く(page, rc(p.コード));
    ids.set(p.コード, id);
    引いたら?.(p, id);
    if (p.カード || p.略称タグ) {
      await 商品をカードにする(page, id, { カード: p.カード ? カード.get(p.カード) : undefined, 商品名: rc(p.名日), 商品名英: rc(p.名英), 略称タグ: p.略称タグ }, issue);
    }
    if (p.状態 === "HP") {
      await 規格を足す(page, id, { 言語名: 前.言語.get(p.言語)!.名称, 状態コード: "HP", 商品コード: 規格のコード(p), 基準価格: p.基準価格, 販売価格: p.基準価格, 買取価格: "0", 棚番号: p.棚 }, issue);
    } else {
      await 規格を整える(page, id, rc(p.コード), { 棚番号: p.棚 }, issue);
    }
  }
  return ids;
}

/**
 * 会員を作って申し込み（申し込む商品は 申込 の正本のコード）、査定内容承諾 → 実在庫に規格を1品ずつ足す → 入庫待ち にする。買取番号を返す。
 */
async function 申し込んで実在庫を足す(browser: Browser, seedId: string, 姓の正本: string, メール: string, ids: Map<string, string>, 申込: string, 足す: string[]): Promise<string> {
  const [番号] = await 申し込む(browser, seedId, { 姓: 注文者名(姓の正本), メール }, ids, [{
    品: [{ コード: 申込, 数量: "1" }],
    保存: [状況("査定内容承諾")],
    後で: async (page, n) => {
      for (const code of 足す) {
        await 一覧から編集を開く(page, n);
        await 実在庫に規格を追加する(page, code, "1", `買取番号 ${n} の実在庫に ${code} を1足す`);
      }
      const e = await 一覧から編集を開く(page, n);
      await e.買取状況を変えて保存する("入庫待ち");
    },
  }]);
  return 番号;
}

// ---------------------------------------------------------------------------
// S-M07-01-CBSORT-101〜112（2品の組合せ）
// ---------------------------------------------------------------------------

type 組の品 = { 言語: "JP" | "EN"; 状態: "NM" | "HP"; 基準価格: string; 棚: string; タグ: string; 札: 札 };
type 組合せ = {
  n: string;
  /** 注文者名（お名前の姓）の正本の値 */
  姓: string;
  棚: { 名称: string; 並び順: number }[];
  タグ: { 名称: string; 並び順: number; アルファベット順: boolean }[];
  X: 組の品;
  Y: 組の品;
};

/** 正本の商品名（ケースが確かめる値。実行の印はケースで付ける） */
export const 組の商品名 = (n: string, 枝: "X" | "Y"): string => `戻し組合せ品-M0701-CB${n}-${枝}`;

function defineComboSeed(seedId: string, v: 組合せ): void {
  if (seedId !== `S-M07-01-CBSORT-${v.n}`) throw new Error(`${seedId}: シードIDと組合せの番号 ${v.n} が合わない`);
  defineSeed(seedId, { needs: [ADM, CONFIG] }, async ({ browser, notes }) => {
    const issue: Issue = (m) => reportSeedIssue(seedId, m);
    const 作り = (枝: "X" | "Y", p: 組の品): 商品の作り => ({
      コード: `M0701-CB${v.n}-${枝}`, 名日: 組の商品名(v.n, 枝), 名英: `Return Order M0701-CB${v.n}-${枝}`,
      言語: p.言語, 基準価格: p.基準価格, 買取価格: 枝 === "Y" ? "500" : "0", 状態: p.状態, 棚: p.棚, 略称タグ: rc(p.タグ), カード: p.札.英名,
    });
    const 品々 = [作り("X", v.X), 作り("Y", v.Y)];
    const ids = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 前 = await 前提を読む(page, issue);
      await 棚を用意する(page, v.棚, seedId, issue);
      for (const t of v.タグ) await 略称タグを登録する(page, { 名称: rc(t.名称), 並び順: String(t.並び順), アルファベット順: t.アルファベット順 }, `${seedId}: 略称タグ「${rc(t.名称)}」`);
      const カード = await カードを用意する(page, 前, [v.X.札, v.Y.札], seedId, issue);
      return 商品を作る(page, 前, カード, 品々, seedId, issue);
    });
    const 番号 = await 申し込んで実在庫を足す(browser, seedId, v.姓, `cbm0701-${v.n}`, ids, `M0701-CB${v.n}-Y`, [規格のコード(品々[1]), 規格のコード(品々[0])]);
    notes.set(`〔買取番号-M0701-${v.n}〕`, 番号);
    issue(`シード作成時の問題: 略称タグ・カードの英語名・商品コード・商品名・注文者名（${注文者名(v.姓)}）・会員のメールアドレスは実行の印つきで作った（前の実行の残りと重ならないため）。` +
      "会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作り、本登録のメールは読んでいない。パスワードはM07の会員の共通の値");
    issue("シード作成時の問題: 実在庫の「商品追加」は Y → X の順に1品ずつ「追加品確定」まで行った（シード表は2品を足してから1回確定する）。" +
      "査定内容承諾の保存で、申し込んだ Y の明細からも実在庫が作られることがある（同じ規格なので戻しリストでは1行にまとまる）");
    issue("シード作成時の問題: 商品登録編集の「カード指定」のあと、商品カテゴリを単体カードにして登録した（カード商品として登録するため。シード表はサプライ・グッズのカテゴリのまま）");
  });
}

const 札 = (英名: string, 色: "赤" | "青", 番号: string, レア: "M" | "C", Foil: boolean): 札 => ({ 英名, 色, 番号, レア, Foil });
const 二つのタグ = (n: string): 組合せ["タグ"] => [
  { 名称: `TAG-M0701-CB${n}-1`, 並び順: 1, アルファベット順: false }, { 名称: `TAG-M0701-CB${n}-2`, 並び順: 2, アルファベット順: false },
];
const 一つのタグ = (n: string, アルファベット順 = false): 組合せ["タグ"] => [{ 名称: `TAG-M0701-CB${n}-1`, 並び順: 1, アルファベット順 }];
const 標準のX = (n: string, o: Partial<組の品>): 組の品 => ({ 言語: "JP", 状態: "NM", 基準価格: "500", 棚: `W-${n}`, タグ: `TAG-M0701-CB${n}-2`, 札: 札(`M0701-CB${n}-CardX`, "青", "2", "C", false), ...o });
const 標準のY = (n: string, o: Partial<組の品>): 組の品 => ({ 言語: "JP", 状態: "NM", 基準価格: "500", 棚: `W-${n}`, タグ: `TAG-M0701-CB${n}-1`, 札: 札(`M0701-CB${n}-CardY`, "赤", "1", "M", false), ...o });

// 101: 金額閾値で決まる（X 500円＝1000円未満、Y 3000円＝1000円以上5000円未満。棚・言語・状態・Foil・略称・レア・色・番号は X の方が後ろ）
defineComboSeed("S-M07-01-CBSORT-101", { n: "101", 姓: "戻組合せ甲", 棚: [{ 名称: "V-101", 並び順: 2 }, { 名称: "W-101", 並び順: 1 }], タグ: 二つのタグ("101"),
  X: 標準のX("101", { 言語: "EN", 状態: "HP", 棚: "V-101", 札: 札("M0701-CB101-CardX", "青", "2", "C", true) }),
  Y: 標準のY("101", { 基準価格: "3000" }) });
// 102: 棚番で決まる（V-102 並び順1 < W-102 並び順2）
defineComboSeed("S-M07-01-CBSORT-102", { n: "102", 姓: "戻組合せ乙", 棚: [{ 名称: "V-102", 並び順: 1 }, { 名称: "W-102", 並び順: 2 }], タグ: 二つのタグ("102"),
  X: 標準のX("102", { 言語: "EN", 状態: "HP", 棚: "V-102", 札: 札("M0701-CB102-CardX", "青", "2", "C", true) }),
  Y: 標準のY("102", {}) });
// 103: 状態で決まる（X NM < Y HP）
defineComboSeed("S-M07-01-CBSORT-103", { n: "103", 姓: "戻組合せ丙", 棚: [{ 名称: "W-103", 並び順: 1 }], タグ: 二つのタグ("103"),
  X: 標準のX("103", { 札: 札("M0701-CB103-CardX", "青", "2", "C", true) }),
  Y: 標準のY("103", { 状態: "HP" }) });
// 104: Foil で決まる（X 非Foil < Y Foil）
defineComboSeed("S-M07-01-CBSORT-104", { n: "104", 姓: "戻組合せ丁", 棚: [{ 名称: "W-104", 並び順: 1 }], タグ: 二つのタグ("104"),
  X: 標準のX("104", {}),
  Y: 標準のY("104", { 札: 札("M0701-CB104-CardY", "赤", "1", "M", true) }) });
// 105: 略称タグで決まる（X TAG-…-1 < Y TAG-…-2）
defineComboSeed("S-M07-01-CBSORT-105", { n: "105", 姓: "戻組合せ戊", 棚: [{ 名称: "W-105", 並び順: 1 }], タグ: 二つのタグ("105"),
  X: 標準のX("105", { タグ: "TAG-M0701-CB105-1" }),
  Y: 標準のY("105", { タグ: "TAG-M0701-CB105-2" }) });
// 106: レアリティで決まる（X M < Y C）
defineComboSeed("S-M07-01-CBSORT-106", { n: "106", 姓: "戻組合せ己", 棚: [{ 名称: "W-106", 並び順: 1 }], タグ: 一つのタグ("106"),
  X: 標準のX("106", { タグ: "TAG-M0701-CB106-1", 札: 札("M0701-CB106-CardX", "青", "2", "M", false) }),
  Y: 標準のY("106", { 札: 札("M0701-CB106-CardY", "赤", "1", "C", false) }) });
// 107: 色で決まる（X 赤 < Y 青。色順マスタは CONFIG で赤 < 青）
defineComboSeed("S-M07-01-CBSORT-107", { n: "107", 姓: "戻組合せ庚", 棚: [{ 名称: "W-107", 並び順: 1 }], タグ: 一つのタグ("107"),
  X: 標準のX("107", { タグ: "TAG-M0701-CB107-1", 札: 札("M0701-CB107-CardX", "赤", "2", "M", false) }),
  Y: 標準のY("107", { 札: 札("M0701-CB107-CardY", "青", "1", "M", false) }) });
// 108: コレクター番号で決まる（略称タグはアルファベット順ソートなし。X 番号1 < Y 番号2、英語名は逆）
defineComboSeed("S-M07-01-CBSORT-108", { n: "108", 姓: "戻組合せ辛", 棚: [{ 名称: "W-108", 並び順: 1 }], タグ: 一つのタグ("108"),
  X: 標準のX("108", { タグ: "TAG-M0701-CB108-1", 札: 札("M0701-CB108-Beta", "赤", "1", "M", false) }),
  Y: 標準のY("108", { 札: 札("M0701-CB108-Alpha", "赤", "2", "M", false) }) });
// 109: 英語のカード名で決まる（略称タグはアルファベット順ソートあり。X Alpha < Y Beta、番号は逆）
defineComboSeed("S-M07-01-CBSORT-109", { n: "109", 姓: "戻組合せ壬", 棚: [{ 名称: "W-109", 並び順: 1 }], タグ: 一つのタグ("109", true),
  X: 標準のX("109", { タグ: "TAG-M0701-CB109-1", 札: 札("M0701-CB109-Alpha", "赤", "2", "M", false) }),
  Y: 標準のY("109", { 札: 札("M0701-CB109-Beta", "赤", "1", "M", false) }) });
// 110: 棚番で決まる（戻しリストPDF。V-110 並び順1 < W-110 並び順2）
defineComboSeed("S-M07-01-CBSORT-110", { n: "110", 姓: "戻組合せ癸", 棚: [{ 名称: "V-110", 並び順: 1 }, { 名称: "W-110", 並び順: 2 }], タグ: 二つのタグ("110"),
  X: 標準のX("110", { 言語: "EN", 状態: "HP", 棚: "V-110", 札: 札("M0701-CB110-CardX", "青", "2", "C", true) }),
  Y: 標準のY("110", {}) });
// 111: 言語で決まる（戻しリストPDF。X 日本語 < Y 英語）
defineComboSeed("S-M07-01-CBSORT-111", { n: "111", 姓: "戻組合せ子", 棚: [{ 名称: "W-111", 並び順: 1 }], タグ: 二つのタグ("111"),
  X: 標準のX("111", { 状態: "HP", 札: 札("M0701-CB111-CardX", "青", "2", "C", true) }),
  Y: 標準のY("111", { 言語: "EN" }) });
// 112: 並び順を決める段がすべて同じ（同じカード・同じ棚・同じ略称タグ）
{
  const 同じ札 = 札("M0701-CB112-Card", "青", "2", "C", false);
  defineComboSeed("S-M07-01-CBSORT-112", { n: "112", 姓: "戻組合せ寅", 棚: [{ 名称: "W-112", 並び順: 1 }], タグ: 一つのタグ("112"),
    X: 標準のX("112", { タグ: "TAG-M0701-CB112-1", 札: 同じ札 }),
    Y: 標準のY("112", { タグ: "TAG-M0701-CB112-1", 札: 同じ札 }) });
}

// ---------------------------------------------------------------------------
// S-M07-01-RETURN-SORT-065（14件の全並び順キー）
// ---------------------------------------------------------------------------

export type 順の品 = {
  枝: string;
  /** シード表の棚 A1・A2 */
  棚: "A1" | "A2";
  言語: 言語;
  状態: "NM" | "HP";
  基準価格: string;
  /** シード表の略称タグ（TAG-Z は実行の印つきで新しく登録する） */
  タグ: "TAG-A" | "TAG-C" | "TAG-Z" | null;
  /** null はサプライ */
  札: 札 | null;
};

/** シード表の棚 A1・A2 の代わりの棚番号（名称の形が「大文字1字-数字3桁」に決められているため） */
export const 棚065 = { A1: { 名称: "A-651", 並び順: 1 }, A2: { 名称: "A-652", 並び順: 2 } } as const;

const 低 = (枝: string, o: Partial<順の品> & { 札: 札 | null }): 順の品 => ({ 枝, 棚: "A1", 言語: "JP", 状態: "NM", 基準価格: "500", タグ: "TAG-A", ...o });
const 札065 = (枝: string, 名: "Alpha" | "Beta", 色: "赤" | "青", 番号: string, レア: "M" | "C", Foil = false): 札 => 札(`M0701-065-${枝}-${名}`, 色, 番号, レア, Foil);

/**
 * 065 の実在庫14件（低額11・中額1・高額1・サプライ1）。シード表は「低額内に、棚・言語・状態・Foil・略称タグ・レアリティ・色・コレクター番号・英語名の差を順序の観点ごとに付ける」
 * とだけ定めるので、観点ごとに「それより前の段が同じで、その段だけが違い、後ろの段は逆」になる組を作った（各段の確かめは spec の注記）。
 */
export const 品065: 順の品[] = [
  低("C1", { タグ: "TAG-C", 札: 札065("C1", "Beta", "赤", "1", "M") }),
  低("C2", { タグ: "TAG-C", 札: 札065("C2", "Alpha", "赤", "2", "M") }),
  低("A1", { タグ: "TAG-A", 札: 札065("A1", "Alpha", "赤", "2", "M") }),
  低("A2", { タグ: "TAG-A", 札: 札065("A2", "Beta", "赤", "1", "M") }),
  低("CB", { タグ: "TAG-C", 札: 札065("CB", "Alpha", "青", "1", "M") }),
  低("CR", { タグ: "TAG-C", 札: 札065("CR", "Alpha", "赤", "1", "C") }),
  低("F", { タグ: "TAG-Z", 札: 札065("F", "Alpha", "赤", "1", "M", true) }),
  低("H", { 状態: "HP", 札: 札065("H", "Alpha", "赤", "1", "M") }),
  低("E", { 言語: "EN", 札: 札065("E", "Alpha", "赤", "1", "M") }),
  低("R", { 言語: "FR", 札: 札065("R", "Alpha", "赤", "1", "M") }),
  低("S2", { 棚: "A2", 札: 札065("S2", "Alpha", "赤", "1", "M") }),
  低("MID", { 基準価格: "3000", 札: 札065("MID", "Alpha", "赤", "1", "M") }),
  低("HIGH", { 基準価格: "6000", 札: 札065("HIGH", "Alpha", "赤", "1", "M") }),
  低("SUP", { タグ: null, 札: null }),
];
export const 商品名065 = (枝: string): string => `戻し順序品-M0701-065-${枝}`;
const コード065 = (枝: string): string => `M0701-065-${枝}`;

/** 065 の並びを決めるのに使う、マスタの実際の値（シードが画面で読んで控える。spec が期待の並びを組み立てる） */
export type 並びの前提 = {
  棚: Record<"A1" | "A2", number>;
  タグ: Record<"TAG-A" | "TAG-C" | "TAG-Z", { 名称: string; 並び順: number; アルファベット順: boolean }>;
  色: Record<"赤" | "青", number>;
};
export const 控え065: { 前提: 並びの前提 | null } = { 前提: null };

defineSeed("S-M07-01-RETURN-SORT-065", { needs: [ADM, CONFIG] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(seedId, m);
  控え065.前提 = null;
  const 作り: 商品の作り[] = [];
  const ids = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 前 = await 前提を読む(page, issue);
    if (!前.言語.get("FR")) throw new Error(`${seedId}: MTGマスターデータの言語にコード FR（仏）の行が無い`);
    const 棚 = await 棚を用意する(page, [棚065.A1, 棚065.A2], seedId, issue);
    // 略称タグ: TAG-A・TAG-C は CONFIG が用意した共有の行。TAG-Z は実行の印つきで、TAG-A・TAG-C より後ろの並び順で登録する
    const 全: 一覧の行[] = await 略称タグの全件(page);
    const 共有 = (名: string) => {
      const hit = 全.filter((t) => t.名称 === 名);
      if (hit.length !== 1) throw new Error(`${seedId}: 略称タグ「${名}」が ${hit.length} 行（S-M07-01-RETURN-CONFIG が用意するはず）`);
      return hit[0];
    };
    const A = 共有("TAG-A"), C = 共有("TAG-C");
    if (A.並び順 === C.並び順) throw new Error(`${seedId}: 略称タグ TAG-A と TAG-C の並び順が同じ（${A.並び順}）で、略称タグの段の順が決まらない。共有のマスタの並び順は書き換えない（シード表は並び順を定めない）ので止めた`);
    const Z並び順 = Math.max(A.並び順, C.並び順) + 1;
    if (Z並び順 > 32767) throw new Error(`${seedId}: TAG-Z の並び順を TAG-A・TAG-C より後ろにできない`);
    const Z名 = rc("TAG-Z");
    await 略称タグを登録する(page, { 名称: Z名, 並び順: String(Z並び順), アルファベット順: false }, `${seedId}: 略称タグ「${Z名}」`);
    const フラグA = (await 略称タグを開いて読む(page, A.ID)).アルファベット順;
    const フラグC = (await 略称タグを開いて読む(page, C.ID)).アルファベット順;
    if (!フラグA || フラグC) throw new Error(`${seedId}: 略称タグのアルファベット順ソートフラグが前提（TAG-A あり・TAG-C なし）と違う（TAG-A ${フラグA ? "あり" : "なし"}・TAG-C ${フラグC ? "あり" : "なし"}）`);
    const 色 = await 色順の全行(page);
    const 色の並び順 = (名: string) => {
      const r = 色.filter((x) => x.値[色順の項目(x).名称] === 名);
      if (r.length !== 1) throw new Error(`${seedId}: 色順マスタに「${名}」が ${r.length} 行`);
      return Number(r[0].値[色順の項目(r[0]).並び順]);
    };
    const 前提065: 並びの前提 = {
      棚: { A1: 棚.get(棚065.A1.名称)!, A2: 棚.get(棚065.A2.名称)! },
      タグ: { "TAG-A": { 名称: "TAG-A", 並び順: A.並び順, アルファベット順: true }, "TAG-C": { 名称: "TAG-C", 並び順: C.並び順, アルファベット順: false }, "TAG-Z": { 名称: Z名, 並び順: Z並び順, アルファベット順: false } },
      色: { 赤: 色の並び順("赤"), 青: 色の並び順("青") },
    };
    // 共有の略称タグ TAG-A・TAG-C に印つきの商品を付ける前に、ケースの終わりに外すことを登録する（商品IDは作ってから入る）
    const 付けた = new Map<string, string>();
    const 対象 = `共有の略称タグ TAG-A・TAG-C に付けた 065 の印つきの商品（${seedId}）`;
    registerRestore(対象, { 商品コード: 品065.filter((p) => p.タグ === "TAG-A" || p.タグ === "TAG-C").map((p) => rc(コード065(p.枝))) },
      async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
        q.setDefaultTimeout(60_000);
        for (const [code, id] of 付けた) await 商品の略称タグを外す(q, id, `${対象}: 商品 ${code} から略称タグを外す`);
      }),
      async () => withAdminSession(browser, SETUP_ADMIN, async (q) => {
        q.setDefaultTimeout(60_000);
        for (const id of 付けた.values()) if ((await 商品の略称タグ(q, id)) !== "") return false;
        return true;
      }));
    const カード = await カードを用意する(page, 前, 品065.flatMap((p) => (p.札 ? [p.札] : [])), seedId, issue);
    for (const p of 品065) {
      作り.push({
        コード: コード065(p.枝), 名日: 商品名065(p.枝), 名英: `Return Order M0701-065-${p.枝}`,
        言語: p.言語, 基準価格: p.基準価格, 買取価格: p.札 ? "0" : "500", 状態: p.状態, 棚: 棚065[p.棚].名称,
        略称タグ: p.タグ === null ? null : 前提065.タグ[p.タグ].名称, カード: p.札?.英名 ?? null,
      });
    }
    // 商品を作る（TAG-A・TAG-C を付ける商品は、カード指定・略称タグの登録の前に商品IDを控える。途中で止まっても外せるように）
    const 共有のタグ名 = new Set([前提065.タグ["TAG-A"].名称, 前提065.タグ["TAG-C"].名称]);
    const out = await 商品を作る(page, 前, カード, 作り, seedId, issue, (p, id) => { if (p.略称タグ && 共有のタグ名.has(p.略称タグ)) 付けた.set(rc(p.コード), id); });
    控え065.前提 = 前提065;
    issue(`シード作成時の問題: 実在庫は14件（低額11・中額1〔基準価格3000〕・高額1〔6000〕・サプライ1〔500〕）。シード表は低額の差を観点ごとに付けるとだけ定めるので、観点ごとに「前の段が同じで、その段だけ違い、後ろの段は逆」の組を作った。` +
      `棚 A1・A2 は名称の形の決まりにより ${棚065.A1.名称}・${棚065.A2.名称}。TAG-Z は実行の印つきの「${Z名}」（並び順 ${Z並び順}）。カードの英語名・商品コード・商品名は実行の印つき`);
    return out;
  });
  // サプライ（買取価格500）で申し込み、査定内容承諾 → 実在庫に14件を足す（期待の並びと逆になりやすいよう、表の下から順に足す）→ 入庫待ち
  const 足す = [...作り].reverse().map((p) => 規格のコード(p));
  const 番号 = await 申し込んで実在庫を足す(browser, seedId, "戻し順序試験", "m0701-065", ids, コード065("SUP"), 足す);
  notes.set("〔買取番号-M0701-065〕", 番号);
  issue("シード作成時の問題: 申し込みは、14件のうちのサプライ（買取価格500）で行った（シード表は「買取価格500円以上の公開中の商品」）。査定内容承諾の保存でサプライの明細からも実在庫が作られることがある（同じ規格なので戻しリストでは1行にまとまる）。" +
    "会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作り、本登録のメールは読んでいない。注文者名・メールアドレスは実行の印つき");
});
