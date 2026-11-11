/**
 * M13-09 CSVダウンロード（イベント管理）。正本: cases/M13-09_test_cases.tsv
 *
 * 実装するのは 022・023 の2件。
 * 実装しないケース: 017（シードの支払番号・席順・DCIナンバー・終了予定時刻が DB への直接の設定で、ケースが席順・DCIナンバーの値を確かめる。
 * また共有の設定の CSV出力項目設定を書き換えて戻す）。
 *
 * - イベント名は、シードと同じく実行の印を付けた値として読む（seeds/m13-09.ts）。
 * - 店舗・検索種別・開始時間(From) は初期値のまま検索する（開催日 2030-04-01 は開始時間(From) の初期値「表示日」より後）。
 * - 022 の手順5のアドレス（https://replace-dev.hareruyamtg.com:8443/admin/event/entry/csv）は、流す環境の管理画面の同じパスとして開く。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { EntryListPage } from "../../pages/admin/m13_06_entry_list";
import { アドレスで開いてダウンロードを見る, CSVダウンロードを選ぶ, ログアウトする, 取得したCSV } from "../../pages/admin/m13_09_entry_csv";
import { M1309_ADMIN, イベント名 } from "../../seeds/m13-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 手順3: イベント名を入れ、店舗・検索種別・開始時間は初期値のまま「検索する」を押す */
async function イベント名で検索する(list: EntryListPage, 語: string): Promise<void> {
  await list.イベント名.fill(語);
  note(`店舗は初期値（${(await list.選ばれている店舗()).join("・") || "指定なし"}）、開始時間(From)は初期値「${await list.開始時間From.inputValue()}」、検索種別は初期値のまま検索した`);
  await expect(list.検索種別("イベント申込を検索"), "検索種別の初期値が「イベント申込を検索」").toBeChecked();
  await list.検索する();
}

caseTest("IT-M13-09-022", async ({ page, step, expected }) => {
  const list = new EntryListPage(page);
  let 結果!: { ファイル名: string[]; 開いた画面: string };
  await step(1, async () => { await loginAdmin(page, M1309_ADMIN); });
  await step(2, async () => { await list.開く(); });
  await step(3, async () => { await イベント名で検索する(list, イベント名("022")); });
  await step(4, async () => { await ログアウトする(page); });
  await step(5, async () => { 結果 = await アドレスで開いてダウンロードを見る(page); });
  await step(6, async () => {
    note(`アドレスを開いたあとの画面: ${結果.開いた画面}。5秒待つ間にダウンロードされたファイル: ${結果.ファイル名.join("、") || "なし"}`);
  });
  await expected(async () => {
    expect(結果.ファイル名.filter((n) => n.startsWith("event_entry_")).join("、"), "ダウンロードされた、ファイル名が「event_entry_」で始まるCSVファイル（無い）").toBe("");
  });
});

/** 正本の期待結果のヘッダ行（35項目） */
const ヘッダ023 = [
  "申込日時", "イベント申込ID", "申込状況名称", "支払番号", "支払金額", "コンビニ入金日", "ショップID", "開催日時", "イベント名(日)", "支払会員名01",
  "支払会員名02", "名前(英)", "苗字(英)", "Eメール", "デッキ登録", "デッキフォーマット(日)", "デッキフォーマット(英)", "苗字(カナ)", "名前(カナ)", "イベント詳細ID",
  "イベントID", "プレイヤーID", "申込状況ID", "支払方法ID", "終了予定時刻", "イベント名(英)", "フォーマット(英)", "ショップID", "申込状況英語名称", "フォーマット(日)",
  "確認フラグ", "支払期限", "申込プレイヤーID", "苗字(英)", "名前(英)",
];

caseTest("IT-M13-09-023", async ({ page, step, expected }) => {
  const list = new EntryListPage(page);
  let csv!: 取得したCSV;
  let ヘッダ: string[] = [];
  await step(1, async () => { await loginAdmin(page, M1309_ADMIN); });
  await step(2, async () => { await list.開く(); });
  await step(3, async () => { await イベント名で検索する(list, イベント名("023")); });
  await step(4, async () => { csv = await CSVダウンロードを選ぶ(page); });
  await step(5, async () => {
    ヘッダ = (csv.行[0] ?? []).map((v) => v.replace(/^﻿/, "").trim());
    note(`ダウンロードしたファイル「${csv.ファイル名}」（${csv.行.length}行）のヘッダ行（${ヘッダ.length}項目）: ${ヘッダ.join("・")}`);
  });
  await expected(async () => {
    expect.soft(ヘッダ.length, "ヘッダ行の項目数").toBe(35);
    expect.soft(ヘッダ.join("・"), "ヘッダ行の項目（左から順）").toBe(ヘッダ023.join("・"));
    for (const 名 of ["会場ID", "席順", "DCIナンバー", "DCI確認フラグ"]) {
      expect.soft(ヘッダ.includes(名), `ヘッダ行に「${名}」を含まない`).toBe(false);
    }
  });
});
