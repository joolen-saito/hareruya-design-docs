/**
 * F06-17 大会デッキ登録確認〜完了 のシードが使う操作。フォーマット（6件）・カード（画像あり7件＝カードCSV、画像なし1件＝カード新規登録画面）。
 * 会員・大会・日程は f06_16_setup.ts のものを使う。
 */
import { Page } from "@playwright/test";
import { rc } from "../../lib/run_marker";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "./card_csv";
import { findFormat } from "./m14_card";
import { フォーマットを登録する } from "./m14_10_format";

export const 店名17 = "晴れる屋テスト店";

export type フォーマット17 = { 名: string; 英名: string; コード: string; 並び順: string; メイン?: [string, string]; サイド?: [string, string] };
export const フォーマット一覧17: フォーマット17[] = [
  { 名: "スタンダード試験", 英名: "F0617StdTest", コード: "X7A", 並び順: "9701", メイン: ["1", "60"], サイド: ["0", "15"] },
  { 名: "モダン試験", 英名: "F0617ModernTest", コード: "X7B", 並び順: "9702" },
  { 名: "登録停止試験形式", 英名: "F0617StopTest", コード: "X7C", 並び順: "9703" },
  { 名: "期限超過試験形式", 英名: "F0617LateTest", コード: "X7D", 並び順: "9704" },
  { 名: "未割当試験形式", 英名: "F0617NoneTest", コード: "X7E", 並び順: "9705" },
  { 名: "エラー試験形式", 英名: "F0617ErrorTest", コード: "X7F", 並び順: "9706", メイン: ["0", "3"], サイド: ["0", "2"] },
];

/** フォーマットが無ければ登録する（あれば使う）。フォーマットIDを返す */
export async function フォーマットを用意する17(page: Page, f: フォーマット17): Promise<string> {
  const found = await findFormat(page, f.名);
  if (found) return found;
  return フォーマットを登録する(page, {
    名日: f.名, 名英: f.英名, 並び順: f.並び順, コード: f.コード, チェック: { rankingFlg: true, isShownInEvent: true },
    ...(f.メイン ? { メイン下限: f.メイン[0], メイン上限: f.メイン[1] } : {}), ...(f.サイド ? { サイド下限: f.サイド[0], サイド上限: f.サイド[1] } : {}),
  }, `F06-17 参照フォーマット ${f.名}`);
}

/** カード名（日本語。実行の印つき）。英語名は半角英数字の別名 */
export const カード名 = {
  通常A: () => rc("通常カードA"), 通常B: () => rc("通常カードB"), 旧: () => rc("旧カード"), 禁止B: () => rc("禁止カードB"),
  制限R: () => rc("制限カードR"), 範囲外O: () => rc("範囲外カードO"), 画像なし: () => rc("画像なしカード"),
};
export const 英名 = (key: string, mark: string): string => `F0617 ${key} ${mark}`;

type 行 = { 日: string; 英: string; 使用可: string[]; 制限?: string[]; 禁止?: string[] };

/** 画像ありのカードをカードCSVで取り込む。使用可能・制限・禁止フォーマットは英語名で書く */
export async function 画像ありカードを取り込む(page: Page, 行一覧: 行[], file: string, onWarning: (w: string) => void): Promise<void> {
  const base = await readExistingCardValues(page);
  const headers = await downloadCardCsvTemplate(page);
  const csv = buildCardCsv(headers, 行一覧.map((x, i) => ({
    name_jp: x.日, name_en: x.英, cmc: "2", rarity: base.rarity, layout: base.layout, promotion_type: "Non Promotion", foil: "0", frame: "Normal",
    image_en: `img/f0617/${file}-${i + 1}.jpg`, card_detail_id: String(base.nextUnusedDetailId + i), set: base.set,
    ...(x.使用可.length ? { format: x.使用可.join(",") } : {}), ...(x.制限?.length ? { restriction_format: x.制限.join(",") } : {}), ...(x.禁止?.length ? { ban_format: x.禁止.join(",") } : {}),
  })));
  await uploadCardCsv(page, csv, `${file}.csv`, `F06-17 参照カードのカードCSV登録`, onWarning);
}
