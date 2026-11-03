/**
 * F06-10 ポイント履歴の画面シード。正本: cases/F06-10_seed_data.tsv
 * 会員（CASE-011・012）: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。ポイント履歴は追加しない。
 * プレイヤーIDは画面が振り、シード表が控えると定める。イベント申込登録のプレイヤー検索の代わりに、DBの参照で読んで控える（書き込みはしない。F03-07 と同じ扱い）。
 */
import { プレイヤーID } from "../db/f03_07";
import { available } from "../lib/db";
import { defineSeed } from "../lib/seeds";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

for (const [n, 名] of [["011", "カイインゼロイチイチ"], ["012", "カイインゼロイチニ"]] as const) {
  defineSeed(`S-F06-10-CASE-${n}`, async ({ browser, notes }) => {
    const id = await 本会員を作る(browser, { 姓: "F06試験", 名: "会員", セイ: "シケン", メイ: 名, 前半: `f0610_empty-${n}`, パスワード: `F0610PwdCase${n}` });
    notes.set(`〔会員ID-F0610-${n}〕`, id);
    notes.set(`〔プレイヤーID-F0610-${n}〕`, available ? (プレイヤーID(id) ?? "") : "（DB確認なし）");
  });
}
