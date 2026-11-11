// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-06 デッキ登録CSV（管理画面）。ケースの正本: integration_test/casegen/cases/M15-06_test_cases.tsv
 *
 * - 取り込むCSVはシード（seeds/m15-06.ts）が正本の状態・属性どおりに作り、ケースは「ファイルを選択」で選ぶ。
 * - DB での準備の代わり（判定は条件付き）: イベント詳細ID 150601 は画面で登録した日程ID、デッキID 1506001004・1506054001・1506057001 は
 *   デッキ編集画面で登録したデッキのデッキIDとして読む（シードの注記に実際の値が出る）。
 * - 決め打ちのプレイヤー名・ケース専用のフォーマット名・アーキタイプ名・カード名は、実行の印を付けて作っている（seeds/m15-06.ts の 名()）。
 * - 画面の表示名は正本と少し違う（アプリの Twig・翻訳ファイルで確かめた）: デッキ一覧の「CSV,TSV取り込み」→「CSV登録」、
 *   「CSVファイルのアップロード」→「CSVファイルをアップロード」、アーキタイプ管理の「検索する >」→「検索する」。違いは手順の注記に残す。
 * - 開催日の保存値は日本時間で読む（CSV の「2025-09-01 10:00:00」と同じ形に直して比べる）。
 * - 実装しないケース: 038（旧デッキIDを持つデッキは画面で作れず DB での準備が要る）、052（手順に「3601秒以上待つ」があり、1件の実行の制限時間を超える）。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin, Account } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { アーキタイプ一覧 } from "../../pages/admin/m15_09_archetype_edit";
import { デッキCSV登録画面, 一覧からCSV登録を開く, CSV登録画面のパス, pathOf, 送信の結果 } from "../../pages/admin/m15_06_deck_csv";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { デッキリスト詳細を開く, 情報欄 } from "../../pages/front/m15_05_deck_show";
import {
  保存されたデッキ, プレイヤー名のデッキ, デッキ, デッキの件数, 最大のデッキID, デッキ明細, デッキのタグ, 代表画像のカード, アーキタイプの代表画像ID,
} from "../../db/m15_06_deck_csv";
import {
  M1506_ADMIN, M1506_QM, M1506_RJ, 名, 基準の日程ID, CSVファイル, 既存デッキのID, 枚数範囲外, 形式055, CB, QM, RJ,
  標準, 試験型, タグA, タグB, 統率者カード, 代表カード,
} from "../../seeds/m15-06-k";
import "../../seeds/m15-06"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

async function login(page: Page, a: Account = M1506_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, a);
}
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const アップロードの注記 = "送るボタンは、画面では「CSVファイルをアップロード」（正本の「CSVファイルのアップロード」）";
const 結果の注記 = (ファイル名: string, r: 送信の結果) => {
  if (!r.送った) { note(`${ファイル名}: 「CSVファイルをアップロード」が押せない状態だった（ファイルが選ばれていない）`); return; }
  note(`${ファイル名} を送ったあとの画面の表示: 成功「${r.成功.join(" / ") || "なし"}」・誤り「${r.エラー.join(" / ") || "なし"}」`);
};

/** 登録画面で、ファイルを選んで送る（手順「ファイルを選択」「CSVファイルのアップロード」の中身） */
async function 選んで送る(s: デッキCSV登録画面, ファイル名: string): Promise<送信の結果> {
  await s.ファイルを選ぶ(ファイル名, CSVファイル(ファイル名));
  const r = await s.アップロードを押す();
  結果の注記(ファイル名, r);
  return r;
}

/** 明細の比べやすい形 */
const 明細の文 = (rows: { ボード: string; カード名英: string; 枚数: number }[]) => rows.map((r) => `${r.ボード} ${r.カード名英} ${r.枚数}枚`);

/**
 * 型: 1. 登録画面を開く／2. ファイルを選ぶ／3. アップロードを押す／4. DB で確かめる → 期待結果。
 * 読む: 手順4で DB から読む値。確かめる: 期待結果の確かめ。前に読む: 手順3の前に読んでおく値（件数など）。
 */
function 取込のケース<T, B = undefined>(ファイル名: string, 読む: (前: B) => T, 確かめる: (v: T, 前: B) => void, 前に読む?: () => B): CaseBody {
  return async ({ page, step, expected, db }) => {
    await login(page);
    const s = new デッキCSV登録画面(page);
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.ファイルを選ぶ(ファイル名, CSVファイル(ファイル名)); });
    let 前 = undefined as B;
    let r!: 送信の結果;
    await step(3, async () => {
      if (前に読む) { void db; 前 = 前に読む(); }
      r = await s.アップロードを押す();
      結果の注記(ファイル名, r);
      note(アップロードの注記);
    });
    let v!: T;
    await step(4, async () => { void db; v = 読む(前); });
    await expected(async () => {
      expect(r.送った, `${ファイル名} を送った（「CSVファイルをアップロード」を押せた）`).toBe(true);
      確かめる(v, 前);
    });
  };
}

/** プレイヤー名（正本の値）のデッキ */
const 行 = (正本: string): 保存されたデッキ[] => プレイヤー名のデッキ(名(正本));
/** 1件に決まること（落ちたら残りは確かめない） */
function ただ1件(rows: 保存されたデッキ[], 正本: string): 保存されたデッキ {
  expect(rows.length, `プレイヤー名「${名(正本)}」のデッキの件数`).toBe(1);
  return rows[0];
}

caseTest("IT-M15-06-040", async ({ page, step, expected }) => {
  await login(page);
  const s = new デッキCSV登録画面(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.ファイルを選ぶ("full_new-040.csv", CSVファイル("full_new-040.csv")); });
  let r!: 送信の結果;
  await step(3, async () => { r = await s.アップロードを押す(); 結果の注記("full_new-040.csv", r); note(アップロードの注記); });
  await expected(async () => {
    expect(r.送った, "ファイルを送った").toBe(true);
    expect.soft(r.エラー, "誤りの表示").toEqual([]);
    expect.soft(r.成功.join(" "), "取込完了の表示").toContain("CSVファイルをアップロードしました");
    expect.soft(pathOf(page.url()), "移った画面のアドレス（デッキ登録CSVアップロード画面）").toBe(CSV登録画面のパス());
    await expect.soft(s.ファイルを選択ボタン, "デッキ登録CSVアップロード画面の「ファイルを選択」").toBeVisible();
  });
});

caseTest("IT-M15-06-047", async ({ page, step, expected }) => {
  await login(page);
  const s = new デッキCSV登録画面(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.ファイルを選ぶ("M1506-047-unknown_format.csv", CSVファイル("M1506-047-unknown_format.csv")); });
  let r!: 送信の結果;
  await step(3, async () => { r = await s.アップロードを押す(); note(アップロードの注記); });
  let 誤り: string[] = [];
  await step(4, async () => { 誤り = await s.帯(".alert-danger"); note(`表示された誤り: ${誤り.join(" / ") || "なし"}`); });
  await expected(async () => {
    expect(r.送った, "ファイルを送った").toBe(true);
    expect.soft(pathOf(page.url()), "表示された画面（デッキ登録CSVアップロード画面）").toBe(CSV登録画面のパス());
    expect.soft(誤り.length, "入力チェックエラーのメッセージの数").toBeGreaterThan(0);
    await expect.soft(page.locator(".alert-danger").first(), "入力チェックエラーのメッセージの表示").toBeVisible();
  });
});

// ---------------------------------------------------------------- 登録・更新の判定

caseTest("IT-M15-06-002", 取込のケース("full_new-002.csv", () => 行("IT完全新規-002"), (rows) => {
  const d = ただ1件(rows, "IT完全新規-002");
  expect.soft(d.プレイヤー名, "プレイヤー名").toBe(名("IT完全新規-002"));
  expect.soft(d.フォーマット英名, "フォーマット").toBe(標準);
  expect.soft(d.アーキタイプ名英, "アーキタイプ").toBe(試験型.名英);
  expect.soft(d.日程ID, "イベント詳細（150601 の代わりの日程ID）").toBe(基準の日程ID());
  expect.soft(d.デッキ名, "デッキ名").toBe("IT完全デッキ-002");
  expect.soft(d.順位, "順位").toBe("1");
  expect.soft(d.成績, "成績").toBe("優勝");
  expect.soft(d.イベント名英, "イベント名(英)").toBe("IT Event");
  expect.soft(d.イベント名日, "イベント名(日)").toBe("ITイベント");
  expect.soft(d.開催日, "開催日（日本時間）").toBe("2025-09-01 10:00:00");
  expect.soft(d.参照元, "参照元").toBe("http://example.com/deck");
  expect.soft(d.参加人数, "参加人数").toBe("10");
  expect.soft(d.表示の区分, "表示フラグ（1＝表示）").toBe("表示");
  expect.soft(d.デッキリスト非公開, "デッキリスト非公開フラグ（0＝公開）").toBe(false);
  expect.soft(d.メインリスト本文, "メインリスト本文").toBe("2 Main Card A");
  expect.soft(d.サイドリスト本文, "サイドリスト本文").toBe("1 Side Card");
}));

caseTest("IT-M15-06-003", 取込のケース("full_new-003.csv", () => 行("IT完全新規-003"), (rows, 前) => {
  const d = ただ1件(rows, "IT完全新規-003");
  expect.soft(Number(d.デッキID), `採番されたデッキID（取り込む前の最大 ${前} より大きい）`).toBeGreaterThan(前);
}, () => 最大のデッキID()));

caseTest("IT-M15-06-004", 取込のケース("update_existing-004.csv", () => {
  const id = 既存デッキのID("1506001004");
  note(`デッキID 1506001004 は、画面で登録したデッキ（ID ${id}）として読む`);
  return { id, d: デッキ(id), 同名: 行("IT更新後-004") };
}, ({ id, d, 同名 }) => {
  expect(d, `デッキID ${id} のデッキ`).not.toBeNull();
  expect.soft(d!.プレイヤー名, "プレイヤー名").toBe(名("IT更新後-004"));
  expect.soft(d!.デッキ名, "デッキ名").toBe("IT更新後デッキ-004");
  expect.soft(d!.フォーマット英名, "フォーマット").toBe(標準);
  expect.soft(d!.アーキタイプ名英, "アーキタイプ").toBe(試験型.名英);
  expect.soft(d!.日程ID, "イベント詳細").toBe(基準の日程ID());
  expect.soft(d!.開催日, "開催日（日本時間）").toBe("2025-09-01 10:00:00");
  expect.soft(d!.成績, "成績").toBe("優勝");
  expect.soft(同名.map((r) => r.デッキID), `プレイヤー名「${名("IT更新後-004")}」のデッキ（新しいデッキが追加されない）`).toEqual([id]);
}));

caseTest("IT-M15-06-005", 取込のケース("nonexistent_id-005.csv", () => 行("IT未一致ID-005"), (rows) => {
  expect(rows.length, `プレイヤー名「${名("IT未一致ID-005")}」のデッキの件数（新規登録される）`).toBe(1);
}));

caseTest("IT-M15-06-006", 取込のケース("minimal_new-006.csv", () => {
  const rows = 行("IT任意空欄-006");
  return { rows, タグ: rows.length === 1 ? デッキのタグ(rows[0].デッキID) : [] };
}, ({ rows, タグ }) => {
  const d = ただ1件(rows, "IT任意空欄-006");
  expect.soft(d.日程ID, "イベント詳細").toBe("");
  expect.soft(d.デッキ名, "デッキ名").toBe("");
  expect.soft(d.順位, "順位").toBe("");
  expect.soft(d.成績, "成績").toBe("");
  expect.soft(タグ, "タグ").toEqual([]);
  expect.soft(d.参照元, "参照元").toBe("");
  expect.soft(d.参加人数, "参加人数").toBe("");
  expect.soft(d.メインリスト本文, "メインリスト").toBe("");
  expect.soft(d.サイドリスト本文, "サイドリスト").toBe("");
  expect.soft(d.統率本文, "統率者").toBe("");
  note(`代表カード名を空にしたときの代表画像は、アーキタイプの既定の代表画像になる作り（026 で確かめる）。このケースの値: ${d.代表画像ID || "なし"}`);
}));

/** プレイヤー名（正本の値）ごとのデッキ */
const 名ごと = (正本: string[]) => () => 正本.map((p) => ({ p, rows: 行(p) }));
/** どのプレイヤー名のデッキも登録されていないこと */
const 登録されない = (v: { p: string; rows: 保存されたデッキ[] }[]) => {
  for (const { p, rows } of v) expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数（登録されない）`).toBe(0);
};
caseTest("IT-M15-06-009", 取込のケース("unknown_format-009.csv", 名ごと(["IT未登録フォーマット-009"]), 登録されない));
caseTest("IT-M15-06-011", 取込のケース("mismatched_archetype-011.csv", 名ごと(["IT不一致アーキタイプ-011"]), 登録されない));
caseTest("IT-M15-06-012", 取込のケース("missing_event-012.csv", 名ごと(["IT未登録イベント-012"]), 登録されない));
caseTest("IT-M15-06-018", 取込のケース("commander_blank-018.csv", 名ごと(["IT統率者空欄-018"]), 登録されない));
caseTest("IT-M15-06-020", 取込のケース("commander_unknown-020.csv", 名ごと(["IT未登録統率者-020"]), 登録されない));
caseTest("IT-M15-06-032", 取込のケース("rollback-032.csv", 名ごと(["IT取消対象A", "IT取消対象B"]), 登録されない));

caseTest("IT-M15-06-010", 取込のケース("archetype_names-010.csv", () => ["ITアーキタイプ日名-010", "ITアーキタイプ英名-010"].map((p) => ({ p, rows: 行(p) })), (v) => {
  for (const { p, rows } of v) {
    expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数`).toBe(1);
    if (rows.length !== 1) continue;
    expect.soft(rows[0].アーキタイプ名英, `「${名(p)}」のアーキタイプ`).toBe(試験型.名英);
    expect.soft(rows[0].アーキタイプのフォーマット英名, `「${名(p)}」のアーキタイプのフォーマット（試験標準フォーマット）`).toBe(標準);
  }
}));

caseTest("IT-M15-06-014", 取込のケース("display_values-014.csv", () => [行("IT表示0-014"), 行("IT表示1-014")], ([r0, r1]) => {
  expect.soft(r0.map((r) => r.表示の区分), `「${名("IT表示0-014")}」の表示の区分`).toEqual(["非表示"]);
  expect.soft(r1.map((r) => r.表示の区分), `「${名("IT表示1-014")}」の表示の区分`).toEqual(["表示"]);
}));

caseTest("IT-M15-06-016", 取込のケース("private_values-016.csv", () => [行("IT非公開0-016"), 行("IT非公開1-016")], ([r0, r1]) => {
  expect.soft(r0.map((r) => (r.デッキリスト非公開 ? "非公開" : "公開")), `「${名("IT非公開0-016")}」のデッキリスト非公開フラグ`).toEqual(["公開"]);
  expect.soft(r1.map((r) => (r.デッキリスト非公開 ? "非公開" : "公開")), `「${名("IT非公開1-016")}」のデッキリスト非公開フラグ`).toEqual(["非公開"]);
}));

caseTest("IT-M15-06-019", 取込のケース("commander_names-019.csv", () => ["IT統率者日名-019", "IT統率者英名-019"].map((p) => {
  const rows = 行(p);
  return { p, rows, 明細: rows.length === 1 ? デッキ明細(rows[0].デッキID) : [] };
}), (v) => {
  for (const { p, rows, 明細 } of v) {
    expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数`).toBe(1);
    expect.soft(明細の文(明細.filter((r) => r.ボード === "統率者ボード")), `「${名(p)}」の統率者`).toEqual([`統率者ボード ${統率者カード.名英} 1枚`]);
  }
}));

caseTest("IT-M15-06-021", 取込のケース("boundary_counts-021.csv", () => ["IT枚数境界下限-021", "IT枚数境界上限-021"].map((p) => ({ p, rows: 行(p) })), (v) => {
  for (const { p, rows } of v) expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数（登録される）`).toBe(1);
}));

caseTest("IT-M15-06-022", async ({ page, step, expected, db }) => {
  await login(page);
  const s = new デッキCSV登録画面(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    for (const d of 枚数範囲外) await 選んで送る(s, d.ファイル);
    note(アップロードの注記);
  });
  let v: { p: string; n: number }[] = [];
  await step(3, async () => { void db; v = 枚数範囲外.map((d) => ({ p: 名(d.プレイヤー), n: プレイヤー名のデッキ(名(d.プレイヤー)).length })); });
  await expected(async () => {
    for (const { p, n } of v) expect.soft(n, `プレイヤー名「${p}」のデッキの件数（登録されない）`).toBe(0);
  });
});

caseTest("IT-M15-06-023", 取込のケース("commander_duplicate-023.csv", () => 行("IT統率者重複-023"), (rows) => {
  const d = ただ1件(rows, "IT統率者重複-023");
  expect.soft(d.メインリスト本文, "メインリスト本文").not.toContain("Commander Card");
}));

caseTest("IT-M15-06-024", 取込のケース("commander_duplicate-024.csv", () => {
  const rows = 行("IT統率者明細-024");
  return { rows, 明細: rows.length === 1 ? デッキ明細(rows[0].デッキID) : [] };
}, ({ rows, 明細 }) => {
  ただ1件(rows, "IT統率者明細-024");
  expect.soft(明細の文(明細.filter((r) => r.カード名英 === 統率者カード.名英)), "「Commander Card」のデッキ明細").toEqual([`統率者ボード ${統率者カード.名英} 1枚`]);
}));

caseTest("IT-M15-06-025", 取込のケース("image_explicit-025.csv", () => {
  const rows = 行("IT代表カード指定-025");
  return { rows, カード: rows.length === 1 ? 代表画像のカード(rows[0].代表画像ID) : "" };
}, ({ rows, カード }) => {
  ただ1件(rows, "IT代表カード指定-025");
  expect.soft(カード, "デッキの代表画像のカード").toBe(代表カード);
}));

caseTest("IT-M15-06-026", 取込のケース("image_default-026.csv", () => ({ rows: 行("IT代表画像既定-026"), 既定: アーキタイプの代表画像ID(試験型.名英, 標準) }), ({ rows, 既定 }) => {
  const d = ただ1件(rows, "IT代表画像既定-026");
  expect.soft(既定, "試験アーキタイプの既定の代表画像（あること）").not.toBe("");
  expect.soft(d.代表画像ID, "デッキの代表画像（試験アーキタイプの既定の代表画像）").toBe(既定);
}));

caseTest("IT-M15-06-027", 取込のケース("tags-027.csv", () => {
  const rows = 行("ITタグ関連-027");
  return { rows, タグ: rows.length === 1 ? デッキのタグ(rows[0].デッキID) : [] };
}, ({ rows, タグ }) => {
  ただ1件(rows, "ITタグ関連-027");
  expect.soft([...タグ].sort(), "デッキに関連付いたタグ").toEqual([タグA, タグB].sort());
}));

caseTest("IT-M15-06-028", 取込のケース("public_details-028.csv", () => {
  const rows = 行("IT公開明細-028");
  return { rows, 明細: rows.length === 1 ? デッキ明細(rows[0].デッキID) : [] };
}, ({ rows, 明細 }) => {
  ただ1件(rows, "IT公開明細-028");
  expect.soft(明細の文(明細.filter((r) => r.ボード !== "統率者ボード")), "メイン・サイドのデッキ明細（カードと枚数）").toEqual(["メインボード Main Card A 2枚", "サイドボード Side Card 1枚"]);
}));

caseTest("IT-M15-06-029", 取込のケース("nonpublic_combinations-029.csv", () => ["ITフラグ00-029", "ITフラグ11-029", "ITフラグ01-029"].map((p) => {
  const rows = 行(p);
  return { p, rows, 明細: rows.length === 1 ? デッキ明細(rows[0].デッキID) : [] };
}), (v) => {
  for (const { p, rows, 明細 } of v) {
    expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数`).toBe(1);
    if (p === "ITフラグ00-029") expect.soft(明細.length, `「${名(p)}」（非公開フラグ0）のデッキ明細の数（作成される）`).toBeGreaterThan(0);
    else expect.soft(明細.length, `「${名(p)}」（非公開フラグ1）のデッキ明細の数（作成されない）`).toBe(0);
  }
}));

caseTest("IT-M15-06-030", 取込のケース("strict_removed-030.csv", () => 行("IT厳密処理除去-030"), (rows) => {
  expect(rows.length, `プレイヤー名「${名("IT厳密処理除去-030")}」のデッキの件数（登録される）`).toBe(1);
}));

caseTest("IT-M15-06-031", 取込のケース("multi_success-031.csv", () => ["IT一括正常A", "IT一括正常B"].map((p) => ({ p, rows: 行(p) })), (v) => {
  for (const { p, rows } of v) expect.soft(rows.length, `プレイヤー名「${名(p)}」のデッキの件数`).toBe(1);
}));

caseTest("IT-M15-06-035", 取込のケース("header_only-035.csv", () => デッキの件数(), (後, 前) => {
  expect(後, `デッキの件数（取り込む前は ${前} 件）`).toBeLessThanOrEqual(前);
}, () => デッキの件数()));

caseTest("IT-M15-06-053", 取込のケース("tag1-M1506-053.csv", () => {
  const rows = 行("M1506-053-P");
  return { rows, タグ: rows.length === 1 ? デッキのタグ(rows[0].デッキID) : [] };
}, ({ rows, タグ }) => {
  ただ1件(rows, "M1506-053-P");
  expect.soft(タグ, "デッキに関連付いたタグ（試験タグAだけ）").toEqual([タグA]);
  expect.soft(タグ.includes(タグB), "試験タグBが関連付いている").toBe(false);
}));

caseTest("IT-M15-06-055", 取込のケース("fmt-M1506-055.csv", () => {
  const rows = 行("M1506-055-P");
  return { rows, 明細: rows.length === 1 ? デッキ明細(rows[0].デッキID) : [] };
}, ({ rows, 明細 }) => {
  const d = ただ1件(rows, "M1506-055-P");
  expect.soft(d.フォーマット英名, "フォーマット").toBe(形式055().名英);
  expect.soft(明細.filter((r) => r.ボード === "メインボード").reduce((a, r) => a + r.枚数, 0), "メインリストの枚数（メインボードの明細の合計）").toBe(4);
}));

caseTest("IT-M15-06-056", 取込のケース("no-dup-M1506-056.csv", () => 行("M1506-056-P"), (rows) => {
  const d = ただ1件(rows, "M1506-056-P");
  expect.soft(d.メインリスト本文, "メインリスト本文").toBe("2 Main Card A");
}));

caseTest("IT-M15-06-057", 取込のケース("mixed-M1506-057.csv", () => {
  const id = 既存デッキのID("1506057001");
  note(`デッキID 1506057001 は、画面で登録したデッキ（ID ${id}）として読む`);
  return { id, A: 行("M1506-057-A"), B: 行("M1506-057-B"), d: デッキ(id) };
}, ({ id, A, B, d }) => {
  expect.soft(A.length, `プレイヤー名「${名("M1506-057-A")}」のデッキの件数`).toBe(1);
  expect.soft(A.map((r) => r.デッキID).filter((x) => x === id), `「${名("M1506-057-A")}」のデッキID（既存のデッキIDと違う新しいID）`).toEqual([]);
  expect.soft(d?.プレイヤー名 ?? "（デッキが無い）", `デッキID ${id} のプレイヤー名`).toBe(名("M1506-057-B"));
  expect.soft(B.map((r) => r.デッキID), `プレイヤー名「${名("M1506-057-B")}」のデッキ（1件のまま）`).toEqual([id]);
}));

caseTest("IT-M15-06-054", async ({ page, step, expected, db }) => {
  await login(page);
  const s = new デッキCSV登録画面(page);
  const f = "update-M1506-054.csv";
  const id = 既存デッキのID("1506054001");
  note(`デッキID 1506054001 は、画面で登録したデッキ（ID ${id}）として読む`);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.ファイルを選ぶ(f, CSVファイル(f)); });
  await step(3, async () => { 結果の注記(f, await s.アップロードを押す()); note(アップロードの注記); });
  let 一回目 = "";
  await step(4, async () => { void db; 一回目 = デッキ(id)?.プレイヤー名 ?? "（デッキが無い）"; });
  await step(5, async () => { await s.ファイルを選ぶ(f, CSVファイル(f)); });
  await step(6, async () => { 結果の注記(f, await s.アップロードを押す()); });
  let 二回目: { d: 保存されたデッキ | null; 同名: string[] } = { d: null, 同名: [] };
  await step(7, async () => { 二回目 = { d: デッキ(id), 同名: 行("M1506-054-P").map((r) => r.デッキID) }; });
  await expected(async () => {
    expect.soft(一回目, `1回目の取込後のデッキID ${id} のプレイヤー名`).toBe(名("M1506-054-P"));
    expect.soft(二回目.d === null ? 0 : 1, `2回目の取込後のデッキID ${id} のデッキの件数`).toBe(1);
    expect.soft(二回目.同名, `2回目の取込後のプレイヤー名「${名("M1506-054-P")}」のデッキ（1件のまま）`).toEqual([id]);
  });
});

// ---------------------------------------------------------------- 組合せ（CB059〜064）

/** 組合せの型: 既存デッキの更新（059〜061）か新規（062〜064）。1. 開く／2. 選ぶ／3. 送る／4. DB で確かめる */
function 組合せ(n: "059" | "060" | "061" | "062" | "063" | "064", 確かめる: (v: { d: 保存されたデッキ; 明細: string[]; 画像: string }) => void): CaseBody {
  return async ({ page, notes, step, expected, db }) => {
    await login(page);
    const c = CB(n);
    const 更新 = ["059", "060", "061"].includes(n);
    const id = 更新 ? notes.get(`〔デッキID-M1506-CB${n}〕`) : "";
    const f = `m1506-cb${n}-main.csv`;
    const s = new デッキCSV登録画面(page);
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.ファイルを選ぶ(f, CSVファイル(f)); });
    let r!: 送信の結果;
    await step(3, async () => { r = await s.アップロードを押す(); 結果の注記(f, r); note(アップロードの注記); });
    let v!: { d: 保存されたデッキ | null; 同名: string[]; 明細: string[]; 画像: string };
    await step(4, async () => {
      void db;
      const 同名 = プレイヤー名のデッキ(c.P);
      const d = 更新 ? デッキ(id) : (同名.length === 1 ? 同名[0] : null);
      v = { d, 同名: 同名.map((x) => x.デッキID), 明細: d ? 明細の文(デッキ明細(d.デッキID)) : [], 画像: d ? 代表画像のカード(d.代表画像ID) : "" };
    });
    await expected(async () => {
      expect(r.送った, `${f} を送った（「CSVファイルをアップロード」を押せた）`).toBe(true);
      if (更新) expect.soft(v.同名, `プレイヤー名「${c.P}」のデッキ（新しいデッキは追加されず、デッキID ${id} だけ）`).toEqual([id]);
      else expect.soft(v.同名.length, `プレイヤー名「${c.P}」のデッキの件数（新しいデッキとして1件）`).toBe(1);
      expect(v.d, 更新 ? `デッキID ${id} のデッキ` : `プレイヤー名「${c.P}」のデッキ`).not.toBeNull();
      確かめる({ d: v.d!, 明細: v.明細, 画像: v.画像 });
    });
  };
}

caseTest("IT-M15-06-059", 組合せ("059", ({ d, 明細, 画像 }) => {
  expect.soft(d.プレイヤー名, "プレイヤー名").toBe(CB("059").P);
  expect.soft(d.表示の区分, "表示の区分").toBe("表示");
  expect.soft(画像, "代表画像のカード（M1506-CB059-Pic。Feature Card ではない）").toBe(CB("059").Pic);
  expect.soft(d.メインリスト本文, "メインリスト本文（統率者は除かれる）").toBe("2 Main Card A");
  expect.soft(明細, "デッキ明細").toEqual(["メインボード Main Card A 2枚", "サイドボード Side Card 1枚", `統率者ボード ${統率者カード.名英} 1枚`]);
}));
caseTest("IT-M15-06-060", 組合せ("060", ({ d, 明細, 画像 }) => {
  expect.soft(d.プレイヤー名, "プレイヤー名").toBe(CB("060").P);
  expect.soft(d.表示の区分, "表示の区分").toBe("表示");
  expect.soft(画像, "代表画像のカード").toBe(代表カード);
  expect.soft(d.メインリスト本文, "メインリスト本文").toBe("2 Main Card A");
  expect.soft(明細, "デッキ明細（統率者ボードの行は作られない）").toEqual(["メインボード Main Card A 2枚", "サイドボード Side Card 1枚"]);
}));
caseTest("IT-M15-06-061", 組合せ("061", ({ d, 明細, 画像 }) => {
  expect.soft(d.プレイヤー名, "プレイヤー名").toBe(CB("061").P);
  expect.soft(d.表示の区分, "表示の区分").toBe("表示");
  expect.soft(画像, "代表画像のカード").toBe(代表カード);
  expect.soft(d.メインリスト本文, "メインリスト本文").toBe("2 Main Card A");
  expect.soft(明細, "デッキ明細").toEqual(["メインボード Main Card A 2枚", "サイドボード Side Card 1枚", `統率者ボード ${統率者カード.名英} 1枚`]);
}));
caseTest("IT-M15-06-062", 組合せ("062", ({ d, 画像 }) => {
  expect.soft(d.表示の区分, "表示の区分").toBe("非表示");
  expect.soft(d.デッキリスト非公開, "デッキリスト非公開フラグ（0＝公開）").toBe(false);
  expect.soft(画像, "代表画像のカード").toBe(代表カード);
  expect.soft(d.メインリスト本文, "メインリスト本文（入力した原文のまま）").toBe("2 Main Card A");
  expect.soft(d.サイドリスト本文, "サイドリスト本文（入力した原文のまま）").toBe("1 Side Card");
}));
caseTest("IT-M15-06-063", 組合せ("063", ({ d, 明細, 画像 }) => {
  expect.soft(d.表示の区分, "表示の区分").toBe("非表示");
  expect.soft(d.デッキリスト非公開, "デッキリスト非公開フラグ（1＝非公開）").toBe(true);
  expect.soft(画像, "代表画像のカード").toBe(代表カード);
  expect.soft(d.メインリスト本文, "メインリスト本文（入力した原文のまま）").toBe("2 Main Card A");
  expect.soft(d.サイドリスト本文, "サイドリスト本文（入力した原文のまま）").toBe("1 Side Card");
  expect.soft(明細, "デッキ明細（統率者ボードを含め作られない）").toEqual([]);
}));
caseTest("IT-M15-06-064", 組合せ("064", ({ d, 明細, 画像 }) => {
  expect.soft(d.表示の区分, "表示の区分").toBe("表示");
  expect.soft(d.デッキリスト非公開, "デッキリスト非公開フラグ（1＝非公開）").toBe(true);
  expect.soft(画像, "代表画像のカード").toBe(代表カード);
  expect.soft(d.メインリスト本文, "メインリスト本文（入力した原文のまま）").toBe("2 Main Card A");
  expect.soft(d.サイドリスト本文, "サイドリスト本文（入力した原文のまま）").toBe("1 Side Card");
  expect.soft(明細, "デッキ明細（統率者ボードを含め作られない）").toEqual([]);
}));

// ---------------------------------------------------------------- 連携試験（店頭のデッキ検索・デッキリスト詳細・アーキタイプ管理）

const クリアの注記 = "「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押した";

/** デッキ検索TOP→詳細検索の「クリア」→プレイヤー名→「検索」 */
async function 店頭で検索(page: Page, 選手: string): Promise<void> {
  await new DeckTopPage(page).開く();
  const m = new DeckSearchModal(page);
  await m.開く();
  await m.クリアする();
  await m.入れる("player", 選手);
  await m.検索する();
}

/** デッキ一覧の「CSV登録」でデッキ登録CSVアップロード画面を開く */
async function 一覧から開く(page: Page): Promise<デッキCSV登録画面> {
  await new デッキ一覧(page).開く();
  const 名 = await 一覧からCSV登録を開く(page);
  note(`デッキ一覧で押したボタンの表示名は「${名}」（正本の「CSV,TSV取り込み」）`);
  return new デッキCSV登録画面(page);
}

caseTest("IT-M15-06-049", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const 選手 = QM("001", "選手");
  const r = new DeckResultPage(page);
  await step(1, async () => { await 店頭で検索(page, 選手); note(クリアの注記); });
  await step(2, async () => {
    await r.読み込みを待つ();
    await expect(r.該当なしの案内, "一覧の領域の該当なしの案内").toContainText("ご指定の条件に一致するデッキが見つかりませんでした。");
  });
  await step(3, async () => { await login(page, M1506_QM); });
  let s!: デッキCSV登録画面;
  await step(4, async () => { s = await 一覧から開く(page); });
  await step(5, async () => { await 選んで送る(s, "new-qm001.csv"); note(アップロードの注記); });
  await step(6, async () => { await 店頭で検索(page, 選手); note(クリアの注記); });
  await expected(async () => {
    const rows = (await r.行()).filter((x) => x.プレイヤー === 選手);
    expect(rows.length, `一覧のプレイヤー「${選手}」の行の数`).toBe(1);
    expect.soft(rows[0].アーキタイプ, "アーキタイプ").toBe(`${QM("001", "型")}/${QM("001", "Type")}`);
    expect.soft(rows[0].大会名, "大会名").toBe("QM1506-001-大会");
    expect.soft(rows[0].成績, "成績").toBe("QM1506-001-成績");
    expect.soft(rows[0].参加人数, "参加人数").toBe("16");
    expect.soft(rows[0].開催日, "開催日").toBe("2025/03/10");
    expect.soft(rows[0].非公開の印, "デッキリストが非公開であることを示す印").toBe(true);
  });
});

caseTest("IT-M15-06-050", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const 選手 = QM("002", "選手");
  const r = new DeckResultPage(page);
  const 行を読む = async () => (await r.行()).filter((x) => x.プレイヤー === 選手);
  await step(1, async () => { await 店頭で検索(page, 選手); note(クリアの注記); });
  await step(2, async () => {
    const rows = await 行を読む();
    expect(rows.length, `プレイヤー「${選手}」の行の数`).toBe(1);
    expect(rows[0].成績, "成績").toBe("QM1506-002-成績旧");
    expect(rows[0].大会名, "大会名").toBe("QM1506-002-大会旧");
  });
  await step(3, async () => { await login(page, M1506_QM); });
  let s!: デッキCSV登録画面;
  await step(4, async () => { s = await 一覧から開く(page); });
  await step(5, async () => { await 選んで送る(s, "update-qm002.csv"); note(アップロードの注記); });
  await step(6, async () => { await 店頭で検索(page, 選手); note(クリアの注記); });
  await expected(async () => {
    const rows = await 行を読む();
    expect(rows.length, `一覧のプレイヤー「${選手}」の行の数`).toBe(1);
    expect.soft(rows[0].成績, "成績").toBe("QM1506-002-成績新");
    expect.soft(rows[0].大会名, "大会名").toBe("QM1506-002-大会新");
  });
});

caseTest("IT-M15-06-051", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const id = notes.get("〔デッキID-M1506-003〕");
  await step(1, async () => {
    expect(await デッキリスト詳細を開く(page, id), "デッキリスト詳細の応答").toBe(200);
    const 欄 = await 情報欄(page);
    expect(欄["デッキ名"] ?? "", "情報欄のデッキ名").toBe("QM1506-003-デッキ旧");
    expect(欄["大会名"] ?? "", "情報欄の大会名").toBe("QM1506-003-大会旧");
  });
  await step(2, async () => { await login(page, M1506_QM); });
  let s!: デッキCSV登録画面;
  await step(3, async () => { s = await 一覧から開く(page); });
  await step(4, async () => { await 選んで送る(s, "update-qm003.csv"); note(アップロードの注記); });
  let 欄: Record<string, string> = {};
  await step(5, async () => { await デッキリスト詳細を開く(page, id); 欄 = await 情報欄(page); });
  await expected(async () => {
    expect.soft(欄["デッキ名"] ?? "", "開き直したデッキリスト詳細の情報欄のデッキ名").toBe("QM1506-003-デッキ新");
    expect.soft(欄["大会名"] ?? "", "開き直したデッキリスト詳細の情報欄の大会名").toBe("QM1506-003-大会新");
  });
});

caseTest("IT-M15-06-058", async ({ page, step, expected }) => {
  const 型 = RJ("型");
  const l = new アーキタイプ一覧(page);
  const 行を読む = async () => (await l.行()).filter((r) => r.名日 === 型);
  const 検索の注記 = "アーキタイプ管理の検索ボタンは、画面では「検索する」（正本の「検索する >」）";
  await step(1, async () => { await login(page, M1506_RJ); });
  await step(2, async () => { await l.開く(); await l.名前で検索する(型); note(検索の注記); });
  await step(3, async () => {
    const rows = await 行を読む();
    expect(rows.length, `検索結果の「${型}」の行の数`).toBe(1);
    expect(rows[0].登録デッキ数, "登録デッキ数").toBe("0");
  });
  let s!: デッキCSV登録画面;
  await step(4, async () => { s = await 一覧から開く(page); });
  await step(5, async () => { await 選んで送る(s, "new-rj1506-001.csv"); note(アップロードの注記); });
  await step(6, async () => { await l.開く(); await l.名前で検索する(型); note(検索の注記); });
  await expected(async () => {
    const rows = await 行を読む();
    expect(rows.length, `検索結果の「${型}」の行の数`).toBe(1);
    expect.soft(rows[0].登録デッキ数, "登録デッキ数").toBe("1");
  });
});

