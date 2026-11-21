/**
 * M06-10（戻しリストCSV）・M06-11（戻しリストPDF）の追加シード（サプライ品を使うもの）に共通の作り方（2026-11-21）。
 *
 * seeds/m06-10.ts・seeds/m06-11.ts の作り方（店舗の閾値・カード商品CSV登録・申込 → 入庫待ち → 実在庫）と同じ考え方で、サプライ品を足したもの。
 * 既存のファイルは変えずに、同じ部品を呼ぶ。
 * - 店舗は作らない。使い回す E2E の店舗（本店相当・支店A）の高額商品閾値を、ケースの間だけシード表の値に書き換え、ケースの終わりに画面で戻す
 *   （pages/admin/store_setting_restore.ts の 店舗の設定をケースの間だけ書き換える。書き換えるシードなので単独の回）。
 * - カードは、カード登録 → カード商品CSV登録（カード詳細を指定）で作る（印つきの名称）。
 * - サプライ品は、グッズ商品CSV登録（サプライ品を登録する）で作る（商品コード・商品名に実行の印）。カード属性との紐づけは無い。
 * - 買取は、フロントの店頭買取査定申込 → 管理画面で入庫待ち → 実在庫情報の編集から商品（カード）を足す。
 *   サプライ品の実在庫情報は、画面の実在庫の編集では状態を選べない商品なので、実行の印つきの買取にだけ DB で足す（db/m06_01.ts の 実在庫を足す）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 実在庫を足す } from "../db/m06_01";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { M0424StoreInput } from "../pages/admin/m04_24_reuse_k";
import { 店舗の設定をケースの間だけ書き換える } from "../pages/admin/store_setting_restore";
import { カード商品CSVの公開の値, カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 単体カード配下のカテゴリID, 登録済みの割引率ID } from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { 商品をカードにする, マスタを読む } from "../pages/admin/m07_09_card";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { ensureCardset } from "../pages/admin/product_masters";
import { 規格を整える, カードを登録する, 実在庫に商品を追加する, 略称タグを登録する } from "../pages/admin/m06_11_setup";
import { 申込を行う, 査定IDを読む, 申込者の } from "./m06-common";

export type 店の定義 = { 入力: M0424StoreInput; 閾値: [string, string, string]; 支店URL: string };

export type カード = {
  種別: "カード"; 名: string; 価格: number; 販売価格?: number; 数?: number; Foil?: boolean;
  /** 略称タグ（実行の印つきの名称で登録して商品に付ける） */
  タグ?: string;
};
export type サプライ = { 種別: "サプライ"; 名: string; 価格: number; 数?: number };
export type 品 = カード | サプライ;
export type 買取 = { ラベル: string; 品: 品[] };

type 前提 = { 言語JP: string; レア: Record<string, string>; 割引率: string; カテゴリ: string; 購入グループ: string; カードセット: string };
const 前提の控え = new Map<string, 前提>();

async function 前提を読む(browser: Browser, セット: { 名: string; 英: string; コード: string }, issue: (m: string) => void): Promise<前提> {
  const hit = 前提の控え.get(セット.コード);
  if (hit) return hit;
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    const rare = await マスタを読む(page, "レアリティ");
    const C = rare.find((r) => r.コード === "C");
    if (!C) throw new Error("レアリティ C が無い");
    const cat = await 単体カード配下のカテゴリID(page);
    const disc = await 登録済みの割引率ID(page);
    const group = await readExistingSellGroupName(page);
    const set = await ensureCardset(page, セット.名, セット.英, セット.コード, issue);
    return { 言語JP: lang.日本語, レア: { C: C.名称 }, 割引率: disc.id, カテゴリ: cat.id, 購入グループ: group, カードセット: set };
  });
  前提の控え.set(セット.コード, v);
  return v;
}

let 連番 = 0;
const 番号の基 = String(Date.now()).slice(-9);
const 次の番号 = (): string => `${番号の基}${String(++連番).padStart(2, "0")}`;
let タグ並び = 9600;

export type 作り方 = {
  seedId: string;
  申込者の姓: string;
  店: 店の定義;
  管理者: Account;
  カードセット: { 名: string; 英: string; コード: string };
  買取: 買取[];
  /** 報告に残す読み替え */
  読み替え?: string[];
};

/** 定義どおりに、店舗の閾値・カード・サプライ品・買取を作る。買取の査定IDを順に返す */
export async function 作る(browser: Browser, d: 作り方): Promise<{ ids: string[]; 店舗ID: string; カード詳細: Map<string, string> }> {
  const { seedId } = d;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const p = await 前提を読む(browser, d.カードセット, issue);
  const 全品 = d.買取.flatMap((b) => b.品);
  const カード群 = 全品.filter((x): x is カード => x.種別 === "カード");
  const サプライ群 = 全品.filter((x): x is サプライ => x.種別 === "サプライ");
  const タグ = [...new Set(カード群.map((x) => x.タグ).filter((t): t is string => !!t))];
  const コード = (x: サプライ): string => rc(`SUP-${seedId}-${x.名}`).slice(0, 60);

  const 店舗ID = d.店.入力.店舗ID ?? "";
  if (!店舗ID) throw new Error(`${seedId}: 使い回す店舗の店舗IDが無い`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 店舗の設定をケースの間だけ書き換える(page, 店舗ID, { 高額商品閾値1: d.店.閾値[0], 高額商品閾値2: d.店.閾値[1], 高額商品閾値3: d.店.閾値[2] }, `${seedId}: 店舗の高額商品閾値`, issue);
  });
  const カード詳細 = new Map<string, string>();
  issue(`店舗は作らず、使い回す試験用の店舗（店舗ID ${店舗ID}）の高額商品閾値を、ケースの間だけ ${d.店.閾値.join("・")} 円にした（終わりに戻す。共有の本店・支店Aの設定は書き換えない。読み替え）`);

  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const t of タグ) await 略称タグを登録する(page, { 名称: rc(`${t}-${seedId}`), 並び順: String(++タグ並び), アルファベット順: false }, seedId);
    if (タグ.length) issue(`略称タグ「${タグ.map((t) => rc(`${t}-${seedId}`)).join("」「")}」を、略称タグ登録で登録した（共有の略称タグには足さず、印つきの名称）`);

    if (カード群.length) {
      const 詳細 = new Map<カード, string>();
      for (const x of カード群) {
        const c = await カードを登録する(page, {
          カード名英: rc(x.名), カラー: "白",
          詳細: { カードセットID: p.カードセット, カード番号: 次の番号(), レアリティ名: p.レア.C, Foil: !!x.Foil },
        }, `${seedId}: カード ${x.名}`, issue);
        詳細.set(x, c.カード詳細ID);
        カード詳細.set(x.名, c.カード詳細ID);
      }
      const 見出し = await カード商品CSVの見出し(page);
      const 公開 = await カード商品CSVの公開の値(page);
      const row = (x: カード): Record<string, string> => ({
        "商品ID": "", "言語(ID)": p.言語JP, "商品公開ステータス": 公開.商品公開ステータス, "支店の商品公開ステータス": 公開.支店の商品公開ステータス,
        "商品名(日)": rc(x.名), "商品名(英)": rc(x.名), "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": p.カテゴリ,
        "購入グループ名称": p.購入グループ, "割引率(ID)": p.割引率, "基準価格": String(x.価格), "販売価格": String(x.販売価格 ?? x.価格), "買取価格": String(x.価格),
        "カード詳細(ID)": 詳細.get(x)!,
      });
      await カード商品CSVを登録する(page, 見出し, カード群.map(row), `${seedId}-card.csv`.toLowerCase(), `${seedId}: カード商品CSV登録`, issue);
      for (const x of カード群) {
        const id = await 商品名で商品IDを読む(page, rc(x.名));
        if (x.タグ) await 商品をカードにする(page, id, { 商品名: rc(x.名), 略称タグ: rc(`${x.タグ}-${seedId}`) }, issue);
        const 規格 = (await 商品規格一覧を読む(page, id)).filter((r) => r.状態 === "NM");
        if (規格.length !== 1) throw new Error(`${seedId}: 商品「${rc(x.名)}」の規格（NM）が ${規格.length} 件ある（1件のはず）`);
        await 規格を整える(page, id, 規格[0].商品規格ID, {}, `${seedId}: 商品「${rc(x.名)}」の規格`, issue);
      }
      issue("カード商品は、カード商品CSV登録（カード詳細を指定）で作った。商品名・カード名は実行の印つき。言語は日本語・状態はNM・カードのカラーは既存の「白」・レアリティはC。棚番号は設定しない");
    }
    if (サプライ群.length) {
      await サプライ品を登録する(page, サプライ群.map((x) => ({ コード: コード(x), 名前: rc(x.名), 基準価格: String(x.価格), 買取価格: String(Math.max(1, x.価格 - 1)) })), issue);
      issue(`サプライ品は、グッズ商品CSV登録で作った（商品名は実行の印つき: ${サプライ群.map((x) => rc(x.名)).join("・")}）。カード属性との紐づけは無い`);
    }
  });
  for (const m of d.読み替え ?? []) issue(m);

  const ids: string[] = [];
  for (const [i, b] of d.買取.entries()) {
    const 姓 = rc(`${d.申込者の姓}${d.買取.length > 1 ? String.fromCharCode(65 + i) : ""}`);
    await 申込を行う(browser, d.店.支店URL, [申込者の(姓, "一郎", "カイトリシケン", "イチロウ")]);
    const [id] = await 査定IDを読む(browser, 姓, 1);
    ids.push(id);
    await withAdminSession(browser, d.管理者, async (page) => {
      page.setDefaultTimeout(60_000);
      const open = async () => {
        const list = new OtcListPage(page);
        await list.open();
        await list.日時を空にする();
        await list.買取店舗を選ぶ("");
        await list.査定IDを入れる(id);
        await list.検索する();
        await list.詳細を開く(id);
      };
      await open();
      await new OtcDetailPage(page).ステータスを変える("入庫待ち");
      const カードだけ = b.品.filter((x): x is カード => x.種別 === "カード");
      if (カードだけ.length) {
        await open();
        await 実在庫に商品を追加する(page, カードだけ.map((x) => ({ 商品名: rc(x.名), 状態: "NM", 増減数: String(x.数 ?? 1) })), `${seedId}: 買取 ${id} の実在庫の追加`);
      }
    });
    for (const x of b.品) {
      if (x.種別 !== "サプライ") continue;
      実在庫を足す(id, コード(x), x.数 ?? 1, x.価格 * (x.数 ?? 1));
      issue(`買取 ${id} に、サプライ品「${rc(x.名)}」（数量${x.数 ?? 1}）の実在庫情報を DB で足した（実行の印つきの買取にだけ）`);
    }
  }
  return { ids, 店舗ID, カード詳細 };
}
