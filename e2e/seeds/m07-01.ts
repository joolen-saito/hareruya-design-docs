/**
 * M07-01 買取検索一覧 の画面シード。正本: cases/M07-01_seed_data.tsv
 *
 * 作るシード: 画面だけで準備できるもの（フロントの会員登録・ネット買取の申込・管理画面の買取状況の変更・削除）。
 * DBでの準備が要るシード（MASTER・MEMBER・STATUS-DATE-002/005/009/010/011 ほか）は作らない。
 * 買取番号は申込のたびに管理画面の一覧の先頭行から控える（完了画面の買取番号と同じであることを確かめている）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { 売却を設定する, 注文者名の範囲外を削除する } from "./m07-common";
import { Account } from "../lib/session";
import { 試験管理者を用意する, 会員を作る, 申込みを行う, 買取状況を設定する, 本人確認を設定する, 注文者名の残りを削除する, 試験会員 } from "./m07-common";

export const M0701_ADMIN: Account = { loginId: "m0701_admin", password: "Passw0rd!M0701" };

// 全ケースの管理画面操作の管理者（共有可）。メンバー管理で登録する
defineSeed("S-M07-01-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0701_ADMIN, "M07-01試験管理者");
});

/** 1件の買取を作る（会員登録 → 申込1回 → 番号を控える）。姓は実行の印つき */
function 単発(seedId: string, ラベル: string, 番号: string): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, rc(`M0701-${番号}-X`), 番号);
    const [n] = await 申込みを行う(browser, m, 1);
    notes.set(ラベル, n);
  });
}

単発("S-M07-01-STATUS-DATE-012", "〔買取番号-M0701-012〕", "012");
単発("S-M07-01-STATUS-DATE-024", "〔買取番号-M0701-024〕", "024");
単発("S-M07-01-STATUS-DATE-043", "〔買取番号-M0701-043〕", "043");
単発("S-M07-01-DISPLAY-045", "〔買取番号-M0701-045〕", "045");
単発("S-M07-01-DISPLAY-046", "〔買取番号-M0701-046〕", "046");
単発("S-M07-01-DISPLAY-047", "〔買取番号-M0701-047〕", "047");
単発("S-M07-01-DISPLAY-048", "〔買取番号-M0701-048〕", "048");
単発("S-M07-01-DISPLAY-053", "〔買取番号-M0701-053〕", "053");

/** 本人確認ステータスを設定した会員で1件の買取を作る */
function 本人確認つき(seedId: string, ラベル: string, 番号: string, 状態: string): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, rc(`M0701-${番号}-X`), 番号);
    await 本人確認を設定する(browser, m, 状態);
    const [n] = await 申込みを行う(browser, m, 1);
    notes.set(ラベル, n);
  });
}
本人確認つき("S-M07-01-IDLABEL-085", "〔買取番号-M0701-085〕", "085", "未確認");
本人確認つき("S-M07-01-IDLABEL-086", "〔買取番号-M0701-086〕", "086", "オンライン本人確認済み");
本人確認つき("S-M07-01-IDLABEL-087", "〔買取番号-M0701-087〕", "087", "簡易書留確認済み");

/** 注文者名が正本の値の会員で n 回申込み、控え、買取状況を設定する。前の実行の残りは先に一覧から削除する（シード表の手順） */
function 状況の組(seedId: string, 姓: string, 並び: [string, string | null][]): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes, seed }) => {
    const r = await 注文者名の残りを削除する(browser, 姓, []);
    if (r) reportSeedIssue(seed.シードID, `前の実行の残り（注文者名「${姓}」の買取 ${r} 件）を一覧から削除してから始めた`);
    const m = await 会員を作る(browser, 姓, 姓);
    const nums = await 申込みを行う(browser, m, 並び.length);
    const sets: [string, string][] = [];
    nums.forEach((n, i) => {
      notes.set(並び[i][0], n);
      const st = 並び[i][1];
      if (st) sets.push([n, st]);
    });
    await 買取状況を設定する(browser, sets, (m) => reportSeedIssue(seed.シードID, m));
  });
}
状況の組("S-M07-01-STATUS-LABEL-081", "M0701-081-X", [
  ["〔買取番号-M0701-081A〕", null], ["〔買取番号-M0701-081B〕", "商品到着"], ["〔買取番号-M0701-081C〕", "査定中●"],
  ["〔買取番号-M0701-081D〕", "査定中断●"], ["〔買取番号-M0701-081E〕", "査定再開●"], ["〔買取番号-M0701-081F〕", "MTGBuyer査定完了●"],
]);
状況の組("S-M07-01-STATUS-LABEL-083", "M0701-083-X", [
  ["〔買取番号-M0701-083A〕", "未登録在庫あり★"], ["〔買取番号-M0701-083B〕", "入庫待ち★"], ["〔買取番号-M0701-083C〕", "入庫済み（仕入れ完了）"],
]);

/** 注文者名が正本の値の会員で n 回申込み、控える（番号の順に 1回目から） */
function 名前つき(seedId: string, 姓: string, ラベル: (string | null)[], 本人確認: string | null, 前に全削除: boolean, 後に残す削除: boolean): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes, seed }) => {
    if (前に全削除) {
      const n = await 注文者名の残りを削除する(browser, 姓, []);
      if (n) reportSeedIssue(seed.シードID, `前の実行の残り（注文者名「${姓}」の買取 ${n} 件）を一覧から削除してから始めた`);
    }
    const m: 試験会員 = await 会員を作る(browser, 姓, 姓);
    if (本人確認) await 本人確認を設定する(browser, m, 本人確認);
    const nums = await 申込みを行う(browser, m, ラベル.length);
    ラベル.forEach((l, i) => { if (l) notes.set(l, nums[i]); });
    if (後に残す削除) {
      const n = await 注文者名の残りを削除する(browser, 姓, [nums[nums.length - 1]]);
      if (n) reportSeedIssue(seed.シードID, `作った買取以外の注文者名「${姓}」の買取 ${n} 件を一覧から削除した`);
    }
  });
}
名前つき("S-M07-01-DISPLAY-040", "表示試験", ["〔買取番号-M0701-040〕"], null, false, true);
名前つき("S-M07-01-DISPLAY-052", "表示試験", ["〔買取番号-M0701-052〕"], null, false, true);
名前つき("S-M07-01-DISPLAY-036", "表示試験", [null, null, null, "〔買取番号-M0701-036〕"], "確認中", false, false);

/** 申込1回のあと、買取明細すべての売却を選ぶ（035: しない、084: する） */
function 売却つき(seedId: string, ラベル: string, 番号: string, 売却: string): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, rc(`M0701-${番号}-X`), 番号);
    const [n] = await 申込みを行う(browser, m, 1);
    notes.set(ラベル, n);
    await 売却を設定する(browser, n, 売却);
  });
}
売却つき("S-M07-01-DISPLAY-035", "〔買取番号-M0701-035〕", "035", "しない");
売却つき("S-M07-01-DISPLAY-NOCANCEL-084", "〔買取番号-M0701-084〕", "084", "する");

/**
 * 共有シード PAGING: 注文者名「ページ試験」の会員で申込を続けて61回行う（注文日時は買取番号の昇順と一致）。
 * 1回目と61回目の買取番号を控える。各ケースの開始時に、この範囲の外の「ページ試験」の買取（前の実行の残り）を一覧から削除する。
 */
defineSeed("S-M07-01-PAGING", { needs: ["S-M07-01-ADM"] }, async ({ browser, notes, seed }) => {
  const m = await 会員を作る(browser, "ページ試験", "paging");
  const nums = await 申込みを行う(browser, m, 61, undefined, "最初と最後だけ");
  notes.set("〔買取番号-M0701-共有ページA〕", nums[0]);
  notes.set("〔買取番号-M0701-共有ページB〕", nums[60]);
  const n = await 注文者名の範囲外を削除する(browser, "ページ試験", nums[0], nums[60]);
  if (n) reportSeedIssue(seed.シードID, `作った買取の範囲外の「ページ試験」の買取（前の実行の残り）${n} 件を一覧から削除した`);
});

/** 申込をまとめて n 回。1回目・k回目の番号を控える（削除保持・削除最終）。申込の前に同じ注文者名の残りを全部削除する（シード表の手順） */
function 削除用(seedId: string, 姓: string, 回数: number, 控え: [number, string][]): void {
  defineSeed(seedId, { needs: ["S-M07-01-ADM"] }, async ({ browser, notes, seed }) => {
    const r = await 注文者名の残りを削除する(browser, 姓, []);
    if (r) reportSeedIssue(seed.シードID, `前の実行の残り（注文者名「${姓}」の買取 ${r} 件）を一覧から削除してから始めた`);
    const m = await 会員を作る(browser, 姓, "del");
    const nums = await 申込みを行う(browser, m, 回数);
    for (const [i, label] of 控え) notes.set(label, nums[i - 1]);
  });
}
削除用("S-M07-01-DELETE-PAGE-049", "削除保持", 21, [[1, "〔買取番号-M0701-049A〕"], [11, "〔買取番号-M0701-049B〕"], [21, "〔買取番号-M0701-049C〕"]]);
削除用("S-M07-01-DELETE-LAST-050", "削除最終", 11, [[1, "〔買取番号-M0701-050A〕"], [11, "〔買取番号-M0701-050B〕"]]);
