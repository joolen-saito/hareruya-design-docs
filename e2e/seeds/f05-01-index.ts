/**
 * F05-01 ネット買取トップページの、目玉買取商品（タグID 5）・買取特集コーナー（タグID 633〜638）に印つきの商品を出すシード。正本: cases/F05-01_seed_data.tsv
 *
 * PM の決定（2026-11-11 夜）に従う作り（共有の書き換えあり。夜の1本流し tools/run_shared_solo.sh で1件ずつ流す前提）:
 * - 共有のタグから今の商品を外すことはしない。正本の「タグの対象を〜だけに設定する」は「作った商品にタグを付け、コーナーの先頭に出す」と読み替える。
 *   コーナーは索引をタグで絞り、発売日（商品に指定したカードの詳細情報のカードセットの発売日）の新しい順に出す（目玉60件・特集はタグごとに3件）。
 *   そのため、印つきのカードセットを、カードセット登録で入れられるいちばん先の日付（とそこから数日前）で作り、そのカードセットの詳細情報を持つカードを
 *   商品に指定する。シード表の発売日（2026-04-04 など）は、並びの順を保ったまま、いちばん先の日付からの日のずれとして使う。
 * - 共有のタグに印つきの商品を「足す」前に、タグの対象商品の一覧を全件読み（商品マスターのタグの絞り込み）、registerRestore で控える。
 *   ケースの終わりに、足した印つきの商品（商品コードの頭が F0501U-）からタグを外し、対象商品の一覧が元と同じかを確かめる。
 *   最後にフィードを送り直す（公開側の索引から、外した商品を消すため。反映は待たない）。
 * - 枠の取り合い: タグに前の実行の残り（商品コードの頭が F0501U- の印つきの商品）があれば、控える前に外す（印つきのデータなので外してよい。戻さない）。
 * - 011 の優先表示商品（6つのタグの「その他の設定」の欄）も、元の値を控えて書き換え、ケースの終わりに戻して確かめる。
 * - フィードはケースごとに1回送り、ネット買取トップのコーナーに作った商品（カードの商品）が出るまで待つ。目玉は30秒の保持があるので、出たあと31秒待つ。
 *
 * 正本と違えたところ（読み替え・解釈。注記にも出す）:
 * - 状態EX: 状態のマスタに EX が無い（ニアミント・SP・MP・HP・その他）ので、NM以外の SP の規格だけを持つ商品で作る。
 * - 「カード以外」と書かれた商品はカードを指定しないグッズの商品で作る（索引の発売日が空になり、コーナーの先頭に並ぶとは限らない）。
 *   正本が商品の種類を書かない商品は、コーナーに並べるため、カードを指定した商品で作る。
 * - 商品コードは正本の値の頭に F0501U- を付け、末尾に実行の印を付ける。正本に商品コードが無い商品は「F0501U-ケース番号-記号」。商品名は正本の値に実行の印。
 * - 高額商品コードは試験用の値 F0501HP-ケース番号。
 */
import { Browser, BrowserContext, chromium } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { TagPage } from "../pages/admin/m03_13_tag";
import { 商品編集で選んで登録する } from "../pages/admin/product_edit_select";
import { フィードを送って反映を待つ, フィードを送る } from "../pages/admin/unisearch_feed";
import {
  カードセットのいちばん先の日付, 作った索引の商品, 日付の文, 日前, 発売日つきのカードセットを登録する, 索引の商品の定義, 索引の商品を作る, タグの商品IDを読む,
} from "../pages/admin/unisearch_products";
import { PurchaseTopPage } from "../pages/front/f05_01_purchase_top";
import { defineSeed } from "./current_seed";

/** 印つきの商品の商品コードの頭（前の実行の残りを見分ける） */
export const F0501U = "F0501U-";

/**
 * ケースの終わりの戻し（registerRestore）で使うブラウザ。テストのブラウザが先に閉じていたら、戻すためだけのブラウザを開く
 * （2026-11-15 の 010・011 で「browser has been closed」で戻せず、共有のタグの対象商品が残って STOP になった）。
 */
let 戻し専用: Browser | null = null;
async function 戻し用のブラウザ(browser: Browser): Promise<Browser> {
  if (browser.isConnected()) return browser;
  if (!戻し専用 || !戻し専用.isConnected()) 戻し専用 = await chromium.launch();
  return 戻し専用;
}
export const 目玉 = "5";
export const 特集モダン = "633";
/** 買取特集コーナーの6つのタグ（アプリの決め打ち。画面の並び順） */
export const 特集の6タグ = ["633", "634", "635", "637", "636", "638"];

type 品 = {
  記号: string;
  /** 正本の商品名（実行の印を付けて作る） */
  名: string;
  /** 正本の商品コード（無ければ ケース番号-記号） */
  コード?: string;
  タグ: string[];
  買取: string; 販売?: string; 基準?: string;
  言語?: "日本語" | "英語" | "フランス語";
  公開?: "公開" | "非公開";
  /** false ならカードを指定しない（カード以外） */
  カード?: boolean;
  組?: string;
  SP?: boolean;
  高額?: boolean;
  /** いちばん先の日付から何日前の発売日のカードセットにするか（既定 0） */
  ずれ?: number;
};

export type F0501ケース = {
  caseNo: string; seedId: string;
  品: 品[];
  /** 反映を待つ枠（タグID）と、その枠に出るはずの商品（記号） */
  待つ: { 枠: string; 出る: string[] }[];
  控え?: { 商品?: [string, string][]; 規格?: [string, string][]; カード?: [string, string][] };
  /** 011: タグごとの優先表示商品（記号の並び） */
  優先?: { タグ: string; 並び: string[] }[];
};

const 作った = new Map<string, Map<string, 作った索引の商品>>();
/** シードが作ったケースの商品（記号 → 商品） */
export function f0501索引の商品(caseNo: string, 記号: string): 作った索引の商品 {
  const p = 作った.get(caseNo)?.get(記号);
  if (!p) throw new Error(`F05-01 ${caseNo} の商品 ${記号} をシードが作っていない`);
  return p;
}
/** 実際の商品名 */
export const f0501商品名 = (正本の名: string): string => rc(正本の名);

const 枠の商品ID = async (ctx: BrowserContext, 枠: string): Promise<string[]> => {
  const top = new PurchaseTopPage(await ctx.newPage());
  await top.開く();
  const 区画 = 枠 === 目玉 ? top.目玉の区画 : top.特集の枠(枠);
  if (!(await top.区画の描画を待つ(区画).catch(() => false))) return [];
  return (await top.カードを読む(top.カード(区画))).map((c) => c.商品ID);
};

async function 用意する(browser: Browser, notes: Notes, k: F0501ケース): Promise<void> {
  const issue = (m: string) => reportSeedIssue(k.seedId, m);
  const 読み替え = (m: string) => issue(`シード作成時の問題（読み替え）: ${m}`);
  const タグたち = [...new Set([...k.品.flatMap((p) => p.タグ), ...(k.優先 ?? []).map((x) => x.タグ)])];
  // ケースの終わりに最後に動く: フィードを送り直す（登録の逆順で戻すので、いちばん先に登録する）
  registerRestore("検索サービスの索引（タグを外したあとにフィードを送り直す）", { タグ: タグたち }, async () => { await フィードを送る(await 戻し用のブラウザ(browser)); });
  let made: 作った索引の商品[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 前の実行の残り（印つきの商品）をタグから外す
    for (const t of タグたち) {
      const left = await タグの商品IDを読む(page, t, F0501U);
      for (const id of left) await 商品編集で選んで登録する(page, id, { タグを外す: [t] }, `前の実行の残りの商品（商品ID ${id}）からタグID ${t} を外す`, issue);
      if (left.length) issue(`タグID ${t} に前の実行の残りの印つきの商品 ${left.length} 件（商品ID ${left.join("・")}）があったので、タグを外した（戻さない）`);
    }
    // タグの対象商品を全件控え、戻すことを登録する
    for (const t of タグたち) {
      const before = await タグの商品IDを読む(page, t);
      registerRestore(`タグID ${t} の対象商品`, { 件数: before.length, 商品ID: before }, async () => {
        await withAdminSession(await 戻し用のブラウザ(browser), SETUP_ADMIN, async (p) => {
          p.setDefaultTimeout(60_000);
          for (const id of await タグの商品IDを読む(p, t, F0501U)) {
            if (!before.includes(id)) await 商品編集で選んで登録する(p, id, { タグを外す: [t] }, `足した印つきの商品（商品ID ${id}）からタグID ${t} を外す`, () => undefined);
          }
        });
      }, async () => withAdminSession(await 戻し用のブラウザ(browser), SETUP_ADMIN, async (p) => JSON.stringify(await タグの商品IDを読む(p, t)) === JSON.stringify(before)));
      issue(`タグID ${t} の対象商品 ${before.length} 件を控えた（ケースの終わりに、足した印つきの商品からタグを外し、元と同じかを確かめる）`);
    }
    // 発売日つきのカードセット（ずれごとに1つ）
    const base = await カードセットのいちばん先の日付(page);
    const sets = new Map<number, string>();
    for (const z of [...new Set(k.品.filter((p) => p.カード !== false).map((p) => p.ずれ ?? 0))].sort((a, b) => a - b)) {
      const 名称 = rc(`F0501U-${k.caseNo}-セット${z}`);
      sets.set(z, await 発売日つきのカードセットを登録する(page, { 名称, 略称: `F5${k.caseNo}${z}${RUN_MARK}`.slice(0, 16), 発売日: 日前(base, z) }, issue));
      issue(`カードセット「${名称}」（ID ${sets.get(z)}）を発売日 ${日付の文(日前(base, z))} で作った`);
    }
    const defs: 索引の商品の定義[] = k.品.map((p) => ({
      記号: p.記号, 商品コード: rc(`${F0501U}${p.コード ?? `${k.caseNo}-${p.記号}`}`), 商品名: rc(p.名),
      言語: p.言語 ?? "日本語", 基準価格: p.基準 ?? "1000", 販売価格: p.販売 ?? "1000", 買取価格: p.買取, 公開: p.公開 ?? "公開", タグ: p.タグ,
      カードセットID: p.カード === false ? null : sets.get(p.ずれ ?? 0)!, カードの組: p.組, NM以外の状態: p.SP ? "SP" : undefined,
      高額商品コード: p.高額 ? `F0501HP-${k.caseNo}` : undefined,
    }));
    // カードの商品のカテゴリは、グッズ商品CSV登録が受け付ける範囲から選ぶ（セットの下の「シングルカード」は「商品カテゴリ(ID)の値が異常」で止まった。2026-11-13〜14）
    made = await 索引の商品を作る(page, defs, k.seedId, `${k.seedId.toLowerCase()}-${RUN_MARK}.csv`, issue, { カードのカテゴリ: "グッズCSVが受け付ける" });
    // 優先表示商品（011）
    for (const pr of k.優先 ?? []) {
      const tag = new TagPage(page);
      await tag.openEdit(pr.タグ);
      await tag.openOtherSettings();
      const 元 = (await tag.inputValues()).優先表示商品;
      const 戻す = async () => withAdminSession(await 戻し用のブラウザ(browser), SETUP_ADMIN, async (p) => {
        const t = new TagPage(p);
        await t.openEdit(pr.タグ);
        await t.openOtherSettings();
        await t.register({ 優先表示商品: 元 }, `タグID ${pr.タグ} の優先表示商品を元に戻す`);
      });
      registerRestore(`タグID ${pr.タグ} の優先表示商品`, { 元 }, 戻す, async () => withAdminSession(await 戻し用のブラウザ(browser), SETUP_ADMIN, async (p) => {
        const t = new TagPage(p);
        await t.openEdit(pr.タグ);
        await t.openOtherSettings();
        return (await t.inputValues()).優先表示商品 === 元;
      }));
      const 並び = pr.並び.map((x) => made.find((m) => m.記号 === x)!.商品コード);
      await tag.register({ 優先表示商品: [...並び, ...(元 ? [元] : [])].join("\n") }, `タグID ${pr.タグ} の優先表示商品の先頭に ${pr.並び.join("・")} を置く`);
      issue(`タグID ${pr.タグ} の優先表示商品（元の値 ${元 ? `${元.split(/\r?\n/).length} 行` : "空"}）の先頭に、${pr.並び.join("・")} の商品規格の商品コードを置いた（元の行は後ろに残す。ケースの終わりに元の値へ戻す）`);
    }
  });
  const map = new Map(made.map((m) => [m.記号, m]));
  作った.set(k.caseNo, map);
  読み替え("正本の「タグの対象を〜だけに設定する」は、共有のタグから既存の商品を外さず、作った商品にタグを付け、印つきのカードセットの発売日をいちばん先にしてコーナーの先頭に出す形に代えた（PM 決定 2026-11-11）");
  if (k.品.some((p) => p.SP)) 読み替え("状態EXは状態のマスタに無いので、NM以外の SP の規格だけを持つ商品で作った");
  if (k.品.some((p) => p.カード === false)) 読み替え(`「カード以外」の商品（${k.品.filter((p) => p.カード === false).map((p) => rc(p.名)).join("・")}）はカードを指定しないグッズの商品で作った。索引の発売日が空になるので、コーナーの先頭に並ぶとは限らない`);
  // フィードを送り、コーナーに出るまで待つ（待つのはカードの商品だけ。カード以外は発売日が空で、先頭に並ぶとは限らない）
  const 待つ = k.待つ.map((w) => ({ 枠: w.枠, ids: w.出る.filter((x) => k.品.find((p) => p.記号 === x)?.カード !== false).map((x) => map.get(x)!.商品ID) }));
  await フィードを送って反映を待つ(browser, async (ctx) => {
    const 様子: string[] = [];
    let ok = true;
    for (const w of 待つ) {
      const ids = await 枠の商品ID(ctx, w.枠);
      if (!w.ids.every((id) => ids.includes(id))) ok = false;
      様子.push(`タグID ${w.枠} の枠: ${ids.slice(0, 10).join(",") || "なし"}（待つ ${w.ids.join(",")}）`);
    }
    return { ok, 様子: 様子.join("／") };
  }, `F05-01 ${k.caseNo} の商品のネット買取トップへの反映`);
  issue("商品管理「ユニサーチフィード作成」でフィードを送り、ネット買取トップのコーナーに作った商品が出るまで待った");
  if (k.待つ.some((w) => w.枠 === 目玉)) {
    await new Promise((r) => setTimeout(r, 31_000));
    issue("目玉買取商品の30秒の保持が終わるよう、コーナーに出たのを確かめてから31秒待った");
  }
  for (const [x, l] of k.控え?.商品 ?? []) notes.set(l, map.get(x)!.商品ID);
  for (const [x, l] of k.控え?.規格 ?? []) notes.set(l, map.get(x)!.規格ID);
  for (const [x, l] of k.控え?.カード ?? []) notes.set(l, map.get(x)!.カードID!);
}

function defineF0501(k: F0501ケース): void {
  defineSeed(k.seedId, async ({ browser, notes }) => { await 用意する(browser, notes, k); });
}

// ---- 定義 ----
const 目玉品 = (記号: string, 名: string, a: Partial<品> = {}): 品 => ({ 記号, 名, タグ: [目玉], 買取: "500", ...a });
const 特集品 = (記号: string, 名: string, a: Partial<品> = {}): 品 => ({ 記号, 名, タグ: [特集モダン], 買取: "100", ...a });
const 両端 = (n: string, a: string, b: string): F0501ケース["控え"] => ({
  商品: [[a, `〔商品ID-F0501-${n}${a}〕`], [b, `〔商品ID-F0501-${n}${b}〕`]],
  規格: [[a, `〔規格ID-F0501-${n}${a}〕`], [b, `〔規格ID-F0501-${n}${b}〕`]],
});
const 一つ = (n: string): F0501ケース["控え"] => ({ 商品: [["A", `〔商品ID-F0501-${n}〕`]], 規格: [["A", `〔規格ID-F0501-${n}〕`]] });

export const F0501ケースたち: F0501ケース[] = [
  // 009: 6つのタグごとに、そのタグだけを付けた印つきの商品（カード商品）を1件作る。枠に出た商品がそのタグの対象かを、印つきの商品で確かめる
  { caseNo: "009", seedId: "S-F05-01-SPC-GROUP-009", 待つ: 特集の6タグ.map((t) => ({ 枠: t, 出る: [t] })),
    控え: { 商品: 特集の6タグ.map((t, i): [string, string] => [t, `〔商品ID-F0501-009-${String(i + 1).padStart(2, "0")}〕`]) },
    品: 特集の6タグ.map((t) => 特集品(t, `特集分類-009-${t}`, { コード: `009-${t}`, タグ: [t] })) },
  // 012: 6つのタグごとに4件（発売日の新しい順に 01〜04）。どのタグにも4件以上あるので、3件で止まるかを見られる
  {
    caseNo: "012", seedId: "S-F05-01-SPC-LIMIT-012",
    待つ: 特集の6タグ.map((t) => ({ 枠: t, 出る: [`${t}-01`, `${t}-02`, `${t}-03`] })),
    品: 特集の6タグ.flatMap((t) => ["01", "02", "03", "04"].map((j, i) => 特集品(`${t}-${j}`, `特集上限-012-${t}-${j}`, { コード: `012-${t}-${j}`, タグ: [t], ずれ: i }))),
  },
  // 030: 買取価格 499円・500円の境界（正本は「カード以外」。カード以外は索引の発売日が空で枠の先頭に並ぶとは限らないので、カードを指定した商品で作る）
  { caseNo: "030", seedId: "S-F05-01-FEAT-BOUNDARY-030", 待つ: [{ 枠: 目玉, 出る: ["A", "B"] }],
    控え: { 商品: [["A", "〔商品ID-F0501-030A〕"], ["B", "〔商品ID-F0501-030B〕"]], 規格: [["A", "〔規格ID-F0501-030A〕"], ["B", "〔規格ID-F0501-030B〕"]] }, 品: [
      目玉品("A", "目玉499円商品-030", { コード: "FTR-002-030", 買取: "499", 販売: "1000", 基準: "1000" }),
      目玉品("B", "目玉500円商品-030", { コード: "FTR-003-030", 買取: "500", 販売: "1000", 基準: "1000" }),
    ] },
  { caseNo: "010", seedId: "S-F05-01-SPC-NEG-010", 待つ: [{ 枠: 特集モダン, 出る: ["A"] }], 控え: 両端("010", "A", "E"), 品: [
    特集品("A", "表示対象-010"), 特集品("B", "特集対象外タグ", { タグ: [] }), 特集品("C", "特集非公開", { 公開: "非公開" }),
    特集品("D", "特集EX", { SP: true }), 特集品("E", "特集価格ゼロ", { 買取: "0" }),
  ] },
  (() => {
    const 品たち: 品[] = [];
    特集の6タグ.forEach((t, i) => {
      for (const [j, a] of [["01", { ずれ: 1 }], ["02", { カード: false }], ["03", { ずれ: 0 }], ["04", { ずれ: 2 }]] as const) {
        品たち.push({ 記号: `${t}-${j}`, 名: `特集並び-011-${t}-${j}`, コード: `011-${t}-${j}`, タグ: [t], 買取: "100", ...a });
      }
      void i;
    });
    return {
      caseNo: "011", seedId: "S-F05-01-SPC-SORT-011", 品: 品たち,
      待つ: 特集の6タグ.map((t) => ({ 枠: t, 出る: [`${t}-03`, `${t}-01`, `${t}-04`] })),
      優先: 特集の6タグ.map((t) => ({ タグ: t, 並び: ["03", "01", "04", "02"].map((j) => `${t}-${j}`) })),
      控え: {
        商品: [[`${特集の6タグ[0]}-01`, "〔商品ID-F0501-011-01〕"], [`${特集の6タグ[5]}-04`, "〔商品ID-F0501-011-24〕"]],
        規格: [[`${特集の6タグ[0]}-01`, "〔規格ID-F0501-011-01〕"], [`${特集の6タグ[5]}-04`, "〔規格ID-F0501-011-24〕"]],
      },
    } satisfies F0501ケース;
  })(),
  { caseNo: "022", seedId: "S-F05-01-FEAT-POS-022", 待つ: [{ 枠: 目玉, 出る: ["A", "B", "C"] }],
    控え: { ...両端("022", "A", "C"), カード: [["A", "〔カードID-F0501-022〕"]] }, 品: [
      目玉品("A", "目玉基準商品-022", { コード: "FTR-001-022", 買取: "777" }),
      目玉品("B", "目玉499円商品-022", { コード: "FTR-002-022", 買取: "499", カード: false }),
      目玉品("C", "目玉500円商品-022", { コード: "FTR-003-022", 買取: "500", カード: false }),
    ] },
  { caseNo: "023", seedId: "S-F05-01-FEAT-NEG-023", 待つ: [{ 枠: 目玉, 出る: ["A", "B", "C"] }], 控え: 両端("023", "A", "G"), 品: [
    目玉品("A", "目玉表示対象1-023"), 目玉品("B", "目玉表示対象2-023"), 目玉品("C", "目玉表示対象3-023"),
    目玉品("D", "目玉対象外タグ", { タグ: [] }), 目玉品("E", "目玉非公開", { 公開: "非公開" }), 目玉品("F", "目玉EX", { SP: true }), 目玉品("G", "目玉買取価格ゼロ", { 買取: "0" }),
  ] },
  { caseNo: "024", seedId: "S-F05-01-FEAT-LEGACY-NEG-024", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 両端("024", "A", "D"), 品: [
    目玉品("A", "目玉表示対象-024"), 目玉品("B", "目玉高額コード", { 高額: true }), 目玉品("C", "目玉フランス語", { 言語: "フランス語" }), 目玉品("D", "目玉販売価格ゼロ", { 販売: "0" }),
  ] },
  { caseNo: "028", seedId: "S-F05-01-FEAT-CACHE-028", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 一つ("028"), 品: [
    目玉品("A", "キャッシュ更新前商品-028", { コード: "FTR-CACHE-001-028", 買取: "100", 販売: "100", 基準: "100" }),
  ] },
  { caseNo: "029", seedId: "S-F05-01-FEAT-PRICE-029", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 一つ("029"), 品: [
    目玉品("A", "目玉基準商品-029", { コード: "FTR-001-029", 買取: "777" }),
  ] },
  { caseNo: "038", seedId: "S-F05-01-SAME-LINK-038", 待つ: [{ 枠: 目玉, 出る: ["A", "B"] }],
    控え: { 商品: [["A", "〔商品ID-F0501-038A〕"], ["B", "〔商品ID-F0501-038B〕"]], 規格: [["A", "〔規格ID-F0501-038A〕"], ["B", "〔規格ID-F0501-038B〕"]], カード: [["A", "〔カードID-F0501-038〕"]] }, 品: [
      目玉品("A", "目玉基準商品-038"), 目玉品("B", "目玉500円商品-038", { カード: false }),
    ] },
  { caseNo: "039", seedId: "S-F05-01-SAME-CARD-039", 待つ: [{ 枠: 目玉, 出る: ["A"] }],
    控え: { ...両端("039", "A", "C"), カード: [["A", "〔カードID-F0501-039A〕"], ["C", "〔カードID-F0501-039B〕"]] }, 品: [
      目玉品("A", "同名検索元商品-039", { 販売: "500", 組: "X" }), 目玉品("B", "同名検索対象商品-039", { 販売: "500", 組: "X" }),
      目玉品("C", "同名検索対象外商品-039", { 販売: "500", 組: "Y" }),
    ] },
  { caseNo: "042", seedId: "S-F05-01-NOIMG-042", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 品: [
    目玉品("A", "画像未登録商品F0501-042-A", { コード: "FTR-F0501-042-A" }),
  ] },
  { caseNo: "048", seedId: "S-F05-01-DP-SPC1-048", 待つ: [{ 枠: 特集モダン, 出る: ["A"] }], 控え: 一つ("048"), 品: [
    特集品("A", "特集1円商品-048", { コード: "DPF0501-SPC-048", 買取: "1" }),
  ] },
  { caseNo: "049", seedId: "S-F05-01-DP-FEAT1-049", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 一つ("049"), 品: [
    目玉品("A", "目玉1円商品-049", { コード: "DPF0501-FTR-049", 買取: "1" }),
  ] },
  { caseNo: "052", seedId: "S-F05-01-DP-FEATEN-052", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 一つ("052"), 品: [
    目玉品("A", "目玉英語商品-052", { コード: "DPF0501-CARD-052", 言語: "英語" }),
  ] },
  { caseNo: "053", seedId: "S-F05-01-DP-FEATCACHE-053", 待つ: [{ 枠: 目玉, 出る: ["A"] }], 控え: 一つ("053"), 品: [
    目玉品("A", "保持中商品-053", { コード: "DPF0501-CACHE-053", 買取: "100", 販売: "100", 基準: "100" }),
  ] },
  ...(["058", "059", "060", "061"] as const).map((n): F0501ケース => ({
    caseNo: n, seedId: `S-F05-01-CBSPC-${n}`, 待つ: [{ 枠: 特集モダン, 出る: ["A"] }], 品: [
      特集品("A", `特集基準F0501-CB${n}`, { コード: `F0501-CB${n}-A`, ...(n === "060" ? { 買取: "1" } : {}) }),
      特集品("B", `特集対象F0501-CB${n}`, { コード: `F0501-CB${n}-B`, ...{ "058": { 公開: "非公開" as const }, "059": { SP: true }, "060": { 買取: "0" }, "061": { タグ: [] } }[n] }),
    ],
  })),
  ...(["063", "064", "065", "066", "067", "068"] as const).map((n): F0501ケース => ({
    caseNo: n, seedId: `S-F05-01-CBFTR-${n}`, 待つ: [{ 枠: 目玉, 出る: ["A"] }], 品: [
      目玉品("A", `目玉基準F0501-CB${n}`, { コード: `F0501-CB${n}-A`, ...(n === "064" ? { 買取: "1" } : {}) }),
      目玉品("B", `目玉対象F0501-CB${n}`, { コード: `F0501-CB${n}-B`, ...{
        "063": { SP: true }, "064": { 買取: "0" }, "065": { 高額: true }, "066": { 言語: "フランス語" as const }, "067": { 販売: "0" }, "068": { タグ: [] },
      }[n] }),
    ],
  })),
];

for (const k of F0501ケースたち) defineF0501(k);
export const F0501ケース = (caseNo: string): F0501ケース => F0501ケースたち.find((k) => k.caseNo === caseNo)!;
