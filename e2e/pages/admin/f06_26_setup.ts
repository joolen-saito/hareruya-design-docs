/**
 * F06-26 店頭PC用アカウント制御のシードが使う管理画面の操作（顧客グループ管理の「あれば使い、無ければ作る」・会員の顧客グループの付け替え）。
 * 画面の操作は M08 の部品（顧客グループ管理・会員登録/編集）を使う。セレクタはそちらにある。
 */
import { Page } from "@playwright/test";
import { M08CustomerEditPage } from "./m08_customer_edit";
import { M08CustomerGroupPage } from "./m08_customer_group";

export type 顧客グループの区分 = { 店内注文専用: boolean; 支店店内注文専用: boolean };

/**
 * 顧客グループ管理で、名称の顧客グループがあれば区分を確かめて使い、無ければ登録する。
 * 名称を押して開いた編集画面のアドレスの末尾の顧客グループIDを返す。区分が違えば落とす（共有の顧客グループを書き換えない）。
 * 作ったか・あったものを使ったかを返す。
 */
export async function 顧客グループを用意する(page: Page, 名称: string, 区分: 顧客グループの区分, 還元率 = "0"): Promise<{ id: string; 作った: boolean }> {
  const g = new M08CustomerGroupPage(page);
  await g.open();
  const n = await g.rowByName(名称).count();
  if (n > 1) throw new Error(`顧客グループ管理の一覧に名称「${名称}」が ${n} 行ある（1つに定まらない）`);
  let 作った = false;
  if (n === 0) {
    await g.入れる({ 名称, 還元率, ...区分 });
    const r = await g.登録する();
    if (!r.sent) throw new Error(`顧客グループ「${名称}」の登録: ブラウザの入力チェックが送信を止めた`);
    await g.open();
    作った = true;
  }
  const id = await g.名称リンクを押してIDを読む(名称);
  const 店内 = await g.shopFront.isChecked();
  const 支店 = await g.branchFront.isChecked();
  if (店内 !== 区分.店内注文専用 || 支店 !== 区分.支店店内注文専用) {
    throw new Error(`顧客グループ「${名称}」（ID ${id}）の区分がシード表と違う（店内注文専用アカウント ${店内 ? "有" : "無"}・支店店内注文専用アカウント ${支店 ? "有" : "無"}）`);
  }
  return { id, 作った };
}

/** 会員登録/編集で顧客グループを選び（顧客グループIDで）、登録する。成功の表示にならなければ落とす */
export async function 会員の顧客グループを選ぶ(page: Page, 会員ID: string, 顧客グループID: string): Promise<void> {
  const ed = new M08CustomerEditPage(page);
  const s = await ed.open(会員ID);
  if (s !== 200) throw new Error(`会員ID ${会員ID} の会員登録/編集画面が開けない（応答 ${s}）`);
  await ed.値で選ぶ("Player][CustomerGroup", 顧客グループID);
  await ed.登録する();
  if (!(await ed.成功メッセージ())) throw new Error(`会員ID ${会員ID} の顧客グループの保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
}
