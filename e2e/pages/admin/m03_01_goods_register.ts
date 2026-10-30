/** M03-01 のグッズ商品シードで共通の、正本「各行の共通の値」によるグッズ商品 CSV 登録。 */
import { Page } from "@playwright/test";
import { Notes } from "../../lib/notes";
import { expectSaved } from "./common";
import { 公開状態の値 } from "./m03_13_product";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "./m03_01_goods_csv";

/** CSV の1行。正本が行ごとに定めた商品コード・商品名と、共通の値と違う列（言語・価格など）を書く */
export type GoodsLine = {
  code: string; nameJp: string; nameEn: string; values?: Record<string, string>;
  /** 行ごとの商品公開ステータス（省略すると共通の値＝公開）。F03-06 が非公開の商品を作るために指定する */
  productStatus?: "公開" | "非公開";
  /** 行ごとの支店の商品公開ステータス（省略すると args.branchStatus、それも無ければ公開） */
  branchStatus?: "公開" | "非公開";
}

/**
 * 「商品カテゴリ(ID)はグッズ配下の既存カテゴリのID」には、共有マスタが画面で照合して控えた「M03カテゴリA」を使う。
 * グッズ直下の並びの先頭は退避したカテゴリ（E2E退避カテゴリ720）になりうるので、並び順では選ばない。
 * 使うシードは needs に S-M03-01-MASTERS-READ を書く。
 */
export function goodsCategoryFromSharedMaster(notes: Notes, seedId: string): string {
  const id = notes.get("〔カテゴリID-M0301-共有A〕");
  if (!/^\d+$/.test(id)) throw new Error(`${seedId}: 共有カテゴリ A の採番 ID を画面から控えていない`);
  return id;
}

/**
 * 雛形を画面からダウンロードし、正本の共通の値で行を組んでアップロードする。
 * 共通の値: 商品IDは空・言語(ID)は日本語のID・商品公開ステータスと支店の商品公開ステータスは公開を表す値・サイズ1・重量1・
 * 商品カテゴリ(ID)はグッズ配下の既存カテゴリのID・購入グループ名称は既存の購入グループの名称・基準価格100・販売価格100・
 * 買取価格10・原価単価10・部門IDは空。正本がシード・行ごとに違う値を定めた列は common・line.values で上書きする。
 * 画面の警告は onWarning に渡す（握りつぶさない）。
 */
export async function registerGoodsCsv(page: Page, args: {
  what: string;
  fileName: string;
  categoryId: string;
  lines: GoodsLine[];
  common?: Record<string, string>;
  onWarning: (warning: string) => void;
  /** 取込の結果の画面へ移るまで待つ最大の時間（数千行の取込で使う） */
  uploadWaitMs?: number;
  /** 支店の商品公開ステータス。省略すると公開（F03-08 が「非公開」を指定する） */
  branchStatus?: "公開" | "非公開";
}): Promise<{ japaneseLanguageId: string }> {
  const template = await downloadGoodsCsvTemplate(page);
  const japaneseLanguageId = await readJapaneseLanguageId(page);
  const sellGroupName = await readExistingSellGroupName(page);
  const common: Record<string, string> = {
    "商品ID": "", "言語(ID)": japaneseLanguageId,
    "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
    "支店の商品公開ステータス": args.branchStatus === "非公開"
      ? 公開状態の値(template, "支店の商品公開ステータス", "非公開") : publishedValue(template, "支店の商品公開ステータス"),
    "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": args.categoryId,
    "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
    "買取価格": "10", "原価単価": "10", "部門ID": "",
    ...args.common,
  };
  const csv = buildGoodsCsv(template, args.lines.map((line) => ({
    ...common,
    "商品コード": line.code, "商品名(日)": line.nameJp, "商品名(英)": line.nameEn,
    ...(line.productStatus === "非公開" ? { "商品公開ステータス": 公開状態の値(template, "商品公開ステータス", "非公開") } : {}),
    ...(line.branchStatus ? { "支店の商品公開ステータス": 公開状態の値(template, "支店の商品公開ステータス", line.branchStatus) } : {}),
    ...line.values,
  })));
  await uploadGoodsCsv(page, csv, args.fileName, args.uploadWaitMs);
  for (const warning of await expectSaved(page, args.what)) args.onWarning(warning);
  return { japaneseLanguageId };
}
