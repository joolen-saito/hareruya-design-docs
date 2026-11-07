/**
 * F06-16・F06-17 の連携ケース用の共有の用意（連携店・連携形式・カード・店舗を編集できる管理者）を画面から作る。
 * 店舗とフォーマットは「あれば使い、無ければ作る」。カードは実行ごとに（名前に実行の印を付けて）カードCSVで取り込む。
 */
import { Page } from "@playwright/test";
import { RUN_MARK, rc } from "../../lib/run_marker";
import { Account } from "../../lib/session";
import { 試験店舗を登録する, 試験店舗の管理者を用意する } from "./f07_01_setup";
import { 画像ありカードを取り込む, フォーマット17, フォーマットを用意する17 } from "./f06_17_setup";

export type 連携の用意 = {
  店名: string; 通番: string; 管理者の通番: string;
  形式: フォーマット17;
  /** 日本語名（実行の印は付けて渡される）と英語名（印は付けて渡される） */
  カード: { 日: string; 英: string }[];
};

export async function 連携の用意を作る(page: Page, v: 連携の用意, issue: (m: string) => void): Promise<{ 管理者: Account; カード: { 日: string; 英: string }[]; 店舗ID: string; フォーマットID: string }> {
  const 店舗ID = await 試験店舗を登録する(page, v.店名, v.通番, issue);
  const 管理者 = await 試験店舗の管理者を用意する(page, v.管理者の通番, [v.店名]);
  const フォーマットID = await フォーマットを用意する17(page, v.形式);
  const カード = v.カード.map((c) => ({ 日: rc(c.日), 英: `${c.英} ${RUN_MARK}` }));
  await 画像ありカードを取り込む(page, カード.map((c) => ({ 日: c.日, 英: c.英, 使用可: [v.形式.英名] })), `${v.通番}pe-${RUN_MARK.toLowerCase()}`, issue);
  return { 管理者, カード, 店舗ID, フォーマットID };
}
