/** M14-08 カードセット詳細(登録・編集・削除) のシードの作り方（画面操作）。正本: cases/M14-08_seed_data.tsv */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1408_ADMIN: Account = { loginId: "m1408_admin", password: "Passw0rd!M1408" };

defineSeed("S-M14-08-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-08試験管理者", account: M1408_ADMIN, メール: "m1408_admin@example.test" }); });
// 新規登録のケースが使う「未登録」の前提。名称に実行ごとの印を付けるので、前の実行のカードセットとは重ならない
for (const id of ["NEW-007", "NEW-025"]) defineSeed(`S-M14-08-${id}`, async () => { /* 同じ名称のカードセットは0件（印つきの名称で登録する） */ });
// 文字数の上限を確かめる値（64文字・50文字）は印を付けられない。同じ値のカードセットが既にあれば登録は重複で止まる（再実行の制約）
defineSeed("S-M14-08-NEW-011", async () => { /* 同じ名称のカードセットは前の実行が無ければ0件 */ });
