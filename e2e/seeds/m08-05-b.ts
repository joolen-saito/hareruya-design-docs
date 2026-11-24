/**
 * M08-05 ポイント付与のシード（014〜016）。11/23 の見直しで流せない一覧から外したケース用（2026-11-24）。正本: cases/M08-05_test_cases.tsv・M08-05_seed_data.tsv
 * 作り方の型は seeds/m08-05.ts と同じ（会員はフロントの新規会員登録・受注はフロントで1点注文・画面で作れない残高だけ E2E の会員の行に DB で書く）。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-M08-05-POINT-TYPES: ポイント種別は全員が使うマスタなので、足さない・消さない。キャンペーン・特別対応用（付与型）と返金用（購入型）が既にあることを確かめるだけ。無ければ止める。
 * - S-M08-05-SMAREGI-NORMAL: スマレジの接続は環境の設定のままで、切り替えない（画面から確かめられない）。
 * - スマレジ会員IDは、会員登録で振られた値を DB の参照で控える（画面に出ない）。スマレジ側のポイント1000は EC から作れないので、作っていない（ケースの期待結果は EC 側の DB だけを見る）。
 * - 014・015 の「注文番号の受注を無い状態にし、存在する場合は削除する」: 注文番号は注文のときに画面が振るので、作る前に同じ番号の受注は無い。消すものは無い。
 */
import { Browser } from "@playwright/test";
import { ポイント履歴, ポイント種別, ポイント残高, ポイント残高を設定する, スマレジ会員ID, 選手情報ID } from "../db/m08_05_07";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 会員が1点注文する, 会員を作る, 作った会員, 控える } from "./m08-05-07-common";

const 会員の定め = (n: string) => ({ 前半: `m0805-${n}`, 姓: "結合", 名: "花子", セイ: "ケツゴウ", メイ: "ハナコ", パスワード: `Passw0rd!M0805-${n}` });

/** 会員を作り、会員ID・選手情報ID・スマレジ会員IDを控え、ポイント残高1000・履歴0件にそろえる */
async function 残高1000の会員(browser: Browser, notes: Notes, seedId: string, n: string): Promise<作った会員> {
  const m = await 会員を作る(browser, 会員の定め(n));
  控える(notes, seedId, `〔会員ID-M0805-${n}〕`, m.会員ID);
  const pid = 選手情報ID(m.会員ID);
  if (!pid) throw new Error(`${seedId}: 会員ID ${m.会員ID} の選手情報が DB に無い（会員登録で作られるはず）`);
  控える(notes, seedId, `〔選手情報ID-M0805-${n}〕`, pid);
  const sm = スマレジ会員ID(m.会員ID);
  if (!sm) throw new Error(`${seedId}: 会員ID ${m.会員ID} のスマレジ会員IDが空（会員登録でスマレジに会員が作られていない。スマレジの接続を確かめる）`);
  控える(notes, seedId, `〔スマレジ会員ID-M0805-${n}〕`, sm);
  if (ポイント残高(m.会員ID) !== 1000) ポイント残高を設定する(`${seedId}: 会員ID ${m.会員ID} のポイント残高を 1000 にする`, m.会員ID, 1000);
  if (ポイント残高(m.会員ID) !== 1000) throw new Error(`${seedId}: 会員ID ${m.会員ID} のポイント残高を1000にできなかった`);
  const h = ポイント履歴(m.会員ID);
  if (h.length) throw new Error(`${seedId}: 会員ID ${m.会員ID} のポイント履歴が ${h.length} 件ある（0件のはず）`);
  reportSeedIssue(seedId, "ポイント残高1000は画面で指定できないので、E2E の会員の選手情報に DB で書いた（正本の作り方どおり）。会員のメールアドレスの前半に実行の印を付けた");
  reportSeedIssue(seedId, "スマレジ会員IDは会員登録で振られた値を DB の参照で控えた。スマレジ側のポイント1000は EC から作れないので作っていない（期待結果は EC 側の DB だけを見る）");
  return m;
}

for (const n of ["014", "015"]) {
  defineSeed(`S-M08-05-BASE-${n}`, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const m = await 残高1000の会員(browser, notes, id, n);
    const o = await 会員が1点注文する(browser, id, m);
    控える(notes, id, `〔注文番号-M0805-${n}〕`, o.注文番号);
    控える(notes, id, `〔受注ID-M0805-${n}〕`, o.受注ID);
    // 注文でポイントが動いていないこと（動いていれば、正本の残高1000・履歴0件にならない）
    if (ポイント残高(m.会員ID) !== 1000) ポイント残高を設定する(`${id}: 注文のあと会員ID ${m.会員ID} のポイント残高を 1000 に戻す`, m.会員ID, 1000);
    const h = ポイント履歴(m.会員ID);
    if (h.length) throw new Error(`${id}: 注文のあと会員ID ${m.会員ID} のポイント履歴が ${h.length} 件ある（0件のはず）`);
    reportSeedIssue(id, "注文番号は注文のときに画面が振るので、作る前に同じ番号の受注は無い（消すものは無かった）");
  });
}

defineSeed("S-M08-05-BASE-016", async ({ browser, notes, seed }) => {
  await 残高1000の会員(browser, notes, seed.シードID, "016");
});

defineSeed("S-M08-05-POINT-TYPES", async ({ seed }) => {
  const t = ポイント種別();
  const 無い = [["1", "キャンペーン・特別対応用（付与型）"], ["2", "返金用（購入型）"]].filter(([k]) => !t[k]).map(([, v]) => v);
  if (無い.length) throw new Error(`${seed.シードID}: ポイント種別の ${無い.join("・")} がこの環境に無い。全員が使うマスタなので、足さずに止めた`);
  reportSeedIssue(seed.シードID, `読み替え: ポイント種別は全員が使うマスタなので、登録・削除していない。キャンペーン・特別対応用と返金用が既にあることを確かめただけ（${Object.entries(t).map(([k, v]) => `${k}:${v}`).join("、")}）`);
});

defineSeed("S-M08-05-SMAREGI-NORMAL", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "読み替え: スマレジの接続は環境の設定のままで、切り替えていない（画面からも確かめられない）。保存のときのスマレジ連携の成否は、このケースの期待結果に入っていない");
});
