/**
 * M08-08 手動メール通知の追加分のシード（005）。正本: cases/M08-08_seed_data.tsv
 * - S-M08-08-DATA-005: 会員は他と同じ作り（フロントで本会員を作る）。テンプレート ID 8084005「D-自動送信-005」（会員ベースの自動送信メール用）は、
 *   メールのテンプレートが全員が使うマスタなので足さず、開発環境に既にある自動送信のテンプレートで読み替える（seeds/m08-08.ts の D-自動送信と同じ）。
 */
import { Notes } from "../lib/notes";
import { getSeed } from "../lib/catalog";
import { defineSeed } from "../lib/seeds";
import { markedMail, 本会員を作る } from "./f06-member";
import { 会員の送信履歴 } from "../db/m05_06";
import { PW, 作った, テンプレの注記 } from "./m08-08";

defineSeed("S-M08-08-DATA-005", { needs: ["S-M08-08-ADM"] }, async ({ browser, notes, seed }) => {
  const 前半 = "manual808-005";
  const 会員ID = await 本会員を作る(browser, { 姓: "山田", 名: "太郎", セイ: "ヤマダ", メイ: "タロウ", 前半, パスワード: PW });
  const 履歴 = 会員の送信履歴(会員ID).length;
  if (履歴 !== 0) throw new Error(`${seed.シードID}: 作った会員 ${会員ID} の送信履歴が ${履歴} 件（0件のはず）`);
  テンプレの注記(seed.シードID, [], true);
  作った.set(seed.シードID, { 会員ID, メール: markedMail(前半), 氏名: "山田 太郎" });
  const s = getSeed(seed.シードID);
  for (const label of Notes.labelsIn(s["状態・属性"] + s.投入方法)) {
    if (label !== "〔会員ID-M0808-005〕") throw new Error(`${seed.シードID}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, 会員ID);
  }
});
