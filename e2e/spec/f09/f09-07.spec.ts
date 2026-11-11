/**
 * F09-07 デッキリスト書き出し（フロント）。正本: cases/F09-07_test_cases.tsv
 *
 * - 「開発者ツールのネットワーク表示」は、ブラウザが送った要求と応答を Playwright で見ることで代える（要求のアドレス・
 *   応答の HTTP ステータス・応答ヘッダ）。見た値は手順の注記に残す。
 * - 「ブラウザのアドレス欄に入力して開く」は、ページをそのアドレスへ移す（page.goto）。添付の応答はブラウザのダウンロードとして受け取り、
 *   テスト結果の一時の場所に保存してから中身を読む（「テキストエディタで開く」の代わり）。
 * - ファイル・テキストの「行」は、復帰と改行（または改行）で区切った1つずつ。空行も1行として数える（正本が空行の位置を定めるケースがある）。
 * - 決め打ちの値（カード名・アーキタイプ名・会員のメールアドレス）には実行の印が付く（seeds/f09-07.ts）。期待結果の行も印つきの値で読む。
 *
 * 実装していないケース（理由は e2e/review/ の記録）: 043・044（キャッシュの保存先を調べる手順。キャッシュの中身は見ない）。
 * 018・034・021・038 は、DBで配置を設定する準備・DBでの確認（参照）を使う。039・049・051・053・055・057・059 は、
 * 実行の印つきの会員・デッキに限り、デッキビルダーのAPIで一時保存を作る（seeds/f09-07.ts）。
 */
import { Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import {
  DeckExportPage, JSONとして読む, アドレスを読む, アドレス欄で開く, 入口, 共通のエラー画面, 内容の種別, 行に分ける, 識別子を差し替える, 添付か, 添付のファイル名,
  開いた結果, 送られた要求,
} from "../../pages/front/f09_07_deck_export";
import { デッキの状態を読む, デッキの状態 } from "../../db/f09_07";
import { N, アーキタイプ名008, 会員のパスワード, 会員のメール } from "../../seeds/f09-07";
import "../../seeds/f09-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 保存先 = () => test.info().outputPath("受け取ったファイル");
const 共有 = "〔デッキID-F0907-共有〕";
const デッキ = (ケース: string) => `〔デッキID-F0907-${ケース}〕`;
const L = (枚数: number, ケース: string, 名: string) => `${枚数} ${N(ケース, 名)}`;

type 確かめ = (r: 開いた結果, 行: string[], page: Page) => Promise<void>;

/** 手順1: 書き出しの入口を控える公開のデッキの詳細を開き、入口を押して送られた要求のアドレスを控える */
async function 入口を控える(page: Page, 共有ID: string, 種類: 入口): Promise<送られた要求> {
  const e = new DeckExportPage(page);
  await e.詳細を開く(共有ID);
  const r = await e.押して要求を控える(種類);
  note(`「${種類 === "MO" ? "Magic Online用テキスト" : 種類 === "アリーナ" ? "アリーナ用インポートテキスト" : "日本語テキスト"}」を押して送られた要求のアドレス: ${r.アドレス}（応答 ${r.状態}）`);
  return r;
}

/** 手順2（または3）: 控えたアドレスのデッキの識別子を書き換えて、アドレス欄で開く */
async function 書き換えて開く(page: Page, 控え: 送られた要求, 識別子: string): Promise<開いた結果> {
  const url = 識別子を差し替える(控え.アドレス, 識別子);
  const r = await アドレス欄で開く(page, url, 保存先());
  note(`アドレス欄で開いたアドレス: ${r.アドレス}。応答 ${r.状態}・内容の種別「${r.ヘッダ["content-type"] ?? ""}」・添付の指定「${r.ヘッダ["content-disposition"] ?? "なし"}」`);
  if (r.ヘッダを読み直した) note("ダウンロードになった移動の応答をブラウザが記録しなかったため、応答ヘッダは同じセッションで同じアドレスを読み直して見た");
  return r;
}

/** 受け取ったファイル（無ければ本文）の行を注記に残す */
function 行を残す(行: string[], what: string): void {
  note(`${what}の行（${行.length}行）: ${行.length ? 行.map((l) => (l === "" ? "（空行）" : `「${l}」`)).join(" / ") : "（なし）"}`);
}

/** ファイルとして受け取る経路（Magic Online用テキスト）。識別子が null なら空にする */
type 経路の追加 = {
  ログイン?: string;
  /** 手順1の前に済ませておくこと（「要求前の…を控えておく」など、事前準備の控え） */
  前?: (デッキID: string) => void | Promise<void>;
  /** 最後に足す手順（DBでの確認など） */
  最後の手順?: (デッキID: string) => Promise<void>;
};

function ファイル経路(ケース: string | null, 確かめる: 確かめ, opt: 経路の追加 = {}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    if (opt.前 && ケース !== null) await opt.前(notes.get(デッキ(ケース)));
    let 控え!: 送られた要求;
    let r!: 開いた結果;
    let 行: string[] = [];
    let n = 1;
    await step(n++, async () => { 控え = await 入口を控える(page, notes.get(共有), "MO"); });
    if (opt.ログイン) {
      await step(n++, async () => {
        const lp = new LoginPage(page);
        await lp.ログイン画面を開く();
        await lp.ログインする(opt.ログイン!, 会員のパスワード);
        if (await lp.ログイン画面である()) throw new Error(`会員 ${opt.ログイン} でログインできない（${await lp.認証エラー()}）`);
        note(`ログインID ${opt.ログイン} でログインした（ログイン後の画面 ${new URL(page.url()).pathname}）`);
      });
    }
    await step(n++, async () => { r = await 書き換えて開く(page, 控え, ケース === null ? "" : notes.get(デッキ(ケース))); });
    await step(n++, async () => {
      行 = r.ファイル ? 行に分ける(r.ファイル.中身) : [];
      if (r.ファイル) { note(`受け取ったファイル「${r.ファイル.名前}」`); 行を残す(行, "ファイル"); }
      else note(`ファイルは受け取らなかった（応答 ${r.状態}）`);
    });
    if (opt.最後の手順 && ケース !== null) await step(n++, async () => { await opt.最後の手順!(notes.get(デッキ(ケース))); });
    await expected(async () => {
      expect.soft(アドレスを読む(r.アドレス).識別子, "開いたアドレスのデッキの識別子（控えたアドレスから書き換えたもの）").toBe(ケース === null ? "" : notes.get(デッキ(ケース)));
      await 確かめる(r, 行, page);
    });
  };
}

/** テキストとして受け取る経路（アリーナ形式のテキスト）。識別子が null なら空にする */
function テキスト経路(種類: "アリーナ" | "日本語", ケース: string | null, 確かめる: (r: 開いた結果, j: ReturnType<typeof JSONとして読む>, 行: string[]) => Promise<void>, opt: 経路の追加 = {}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    if (opt.前 && ケース !== null) await opt.前(notes.get(デッキ(ケース)));
    let 控え!: 送られた要求;
    let r!: 開いた結果;
    let j: ReturnType<typeof JSONとして読む> = null;
    let 行: string[] = [];
    let n = 1;
    await step(n++, async () => {
      控え = await 入口を控える(page, notes.get(共有), 種類);
      note(`控えたアドレスの言語の指定: ${控え.言語の指定 || "（なし）"}`);
    });
    if (opt.ログイン) {
      await step(n++, async () => {
        const lp = new LoginPage(page);
        await lp.ログイン画面を開く();
        await lp.ログインする(opt.ログイン!, 会員のパスワード);
        if (await lp.ログイン画面である()) throw new Error(`会員 ${opt.ログイン} でログインできない（${await lp.認証エラー()}）`);
        note(`ログインID ${opt.ログイン} でログインした（ログイン後の画面 ${new URL(page.url()).pathname}）`);
      });
    }
    await step(n++, async () => { r = await 書き換えて開く(page, 控え, ケース === null ? "" : notes.get(デッキ(ケース))); });
    await step(n++, async () => {
      j = JSONとして読む(r.本文);
      行 = typeof j?.list === "string" ? 行に分ける(j.list) : [];
      note(`本文: ${r.本文.slice(0, 500) || "（空）"}`);
      if (typeof j?.list === "string") 行を残す(行, "デッキリストのテキスト");
    });
    if (opt.最後の手順 && ケース !== null) await step(n++, async () => { await opt.最後の手順!(notes.get(デッキ(ケース))); });
    await expected(async () => {
      expect.soft(アドレスを読む(r.アドレス).識別子, "開いたアドレスのデッキの識別子（控えたアドレスから書き換えたもの）").toBe(ケース === null ? "" : notes.get(デッキ(ケース)));
      expect.soft(アドレスを読む(r.アドレス).言語の指定, "開いたアドレスの言語の指定（控えたアドレスのまま）").toBe(控え.言語の指定);
      await 確かめる(r, j, 行);
    });
  };
}

// ---- 期待結果の型 ----

/** HTTP 404 の共通のエラー画面が返り、添付ファイルは返らない */
const 共通のエラーで添付なし: 確かめ = async (r, _行, page) => {
  expect.soft(r.状態, "応答のHTTPステータス").toBe(404);
  await expect.soft(共通のエラー画面(page), "共通のエラー画面が表示される").toBeVisible();
  expect.soft(添付か(r.ヘッダ), "応答が添付の指定でない（デッキリストの添付ファイルが返らない）").toBe(false);
  expect.soft(r.ファイル === null, "デッキリストのファイルを受け取らない").toBe(true);
};
const ファイルがある = (r: 開いた結果) => expect.soft(r.ファイル !== null, "デッキリストのファイルが添付されて受け取れた").toBe(true);

/** HTTP 404 で、本文の JSON の処理結果が失敗、内容が Not Found */
const JSONで見つからない = async (r: 開いた結果, j: ReturnType<typeof JSONとして読む>) => {
  expect.soft(r.状態, "応答のHTTPステータス").toBe(404);
  expect.soft(j !== null, "本文がJSONである").toBe(true);
  expect.soft(j?.success, "本文のJSONの処理結果（失敗）").toBe(false);
  expect.soft(j?.errors, "本文のJSONの内容（Not Found）").toEqual(["Not Found"]);
};
/** HTTP 200 で、本文の JSON の処理結果が成功 */
const JSONで成功 = (r: 開いた結果, j: ReturnType<typeof JSONとして読む>) => {
  expect.soft(r.状態, "応答のHTTPステータス").toBe(200);
  expect.soft(j?.success, "本文のJSONの処理結果（成功）").toBe(true);
};
const 行がある = (行: string[], l: string) => expect.soft(行, `「${l}」の行がある`).toContain(l);
const 行が無い = (行: string[], l: string) => expect.soft(行, `「${l}」の行が無い`).not.toContain(l);
const 含む行が無い = (行: string[], s: string) => expect.soft(行.filter((l) => l.includes(s)), `「${s}」を含む行が無い`).toEqual([]);
const 位置 = (行: string[], l: string) => 行.indexOf(l);
/** 行 a が行 b より前にある（両方ある） */
const 前にある = (行: string[], a: string, b: string) => {
  const i = 位置(行, a), k = 位置(行, b);
  expect.soft(i >= 0 && k >= 0 && i < k, `「${a}」の行が「${b}」の行より前にある（位置 ${i} と ${k}。-1 は無い）`).toBe(true);
};
/** 並びが、行の中でこの順に続いて出る */
const 続いて並ぶ = (行: string[], 並び: string[], what: string) => {
  const start = 行.findIndex((_, i) => 並び.every((l, k) => 行[i + k] === l));
  expect.soft(start >= 0, `${what}（${並び.map((l) => (l === "" ? "空行" : `「${l}」`)).join("→")}）が続いて並ぶ`).toBe(true);
};

// ---------------------------------------------------------------------------
// ファイルとして受け取る経路
// ---------------------------------------------------------------------------

caseTest("IT-F09-07-001", ファイル経路(null, 共通のエラーで添付なし));
caseTest("IT-F09-07-002", ファイル経路("002", 共通のエラーで添付なし));
caseTest("IT-F09-07-003", ファイル経路("003", 共通のエラーで添付なし));
caseTest("IT-F09-07-004", ファイル経路("004", 共通のエラーで添付なし));
caseTest("IT-F09-07-005", ファイル経路("005", 共通のエラーで添付なし));

caseTest("IT-F09-07-006", ファイル経路("006", async (r, 行) => {
  ファイルがある(r);
  行がある(行, L(4, "006", "ALPHA"));
}));

caseTest("IT-F09-07-007", ファイル経路("007", async (r) => {
  expect.soft(内容の種別(r.ヘッダ), "応答の内容の種別（文字コードの指定を除く）").toBe("text/plain");
  expect.soft(添付か(r.ヘッダ), "応答が添付の指定である").toBe(true);
  expect.soft(添付のファイル名(r.ヘッダ) !== "", "添付の指定にファイル名がある").toBe(true);
}));

caseTest("IT-F09-07-008", ファイル経路("008", async (r) => {
  const want = `${アーキタイプ名008().replace(/\s/g, "_")}.txt`;
  note(`アーキタイプの英語名「${アーキタイプ名008()}」（実行の印つき）。期待するファイル名は空白を _ にした「${want}」`);
  expect.soft(添付のファイル名(r.ヘッダ), "応答の添付の指定のファイル名").toBe(want);
  expect.soft(r.ファイル?.名前 ?? "", "受け取ったファイルの名前").toBe(want);
}));

caseTest("IT-F09-07-009", ファイル経路("009", async (r, 行) => {
  ファイルがある(r);
  expect.soft([...行].sort(), "ファイルの行（並びは問わない）が「4 ALPHA」「2 BETA」の2行だけ").toEqual([L(4, "009", "ALPHA"), L(2, "009", "BETA")].sort());
}));

caseTest("IT-F09-07-011", ファイル経路("011", async (r, 行) => {
  ファイルがある(r);
  expect.soft([...行].sort(), "ファイルの行が「1 COMMANDER」「4 ALPHA」だけ（空行・見出し行が無い）").toEqual([L(1, "011", "COMMANDER"), L(4, "011", "ALPHA")].sort());
  for (const h of ["Commander", "Deck", "統率者", "デッキ"]) 行が無い(行, h);
}));

caseTest("IT-F09-07-012", ファイル経路("012", async (r, 行) => {
  ファイルがある(r);
  前にある(行, L(1, "012", "COMMANDER"), L(4, "012", "ALPHA"));
  前にある(行, L(4, "012", "ALPHA"), L(2, "012", "BETA"));
  前にある(行, "Sideboard", L(2, "012", "BETA"));
}));

caseTest("IT-F09-07-017", ファイル経路("017", async (r, 行) => {
  ファイルがある(r);
  行が無い(行, "Sideboard");
  expect.soft(行, "ファイルの行が「4 ALPHA」の1行だけ").toEqual([L(4, "017", "ALPHA")]);
}));

caseTest("IT-F09-07-019", ファイル経路("019", async (r) => {
  ファイルがある(r);
  expect.soft(r.ファイル?.中身 ?? null, "ファイルの内容が空（カード行も見出し行も無い）").toBe("");
}));

caseTest("IT-F09-07-020", ファイル経路("020", async (r, 行) => {
  ファイルがある(r);
  expect.soft(行, "ファイルの行が「4 ALPHA」の1行").toEqual([L(4, "020", "ALPHA")]);
}, { ログイン: 会員のメール("f0907-020") }));

// ---------------------------------------------------------------------------
// テキストとして受け取る経路
// ---------------------------------------------------------------------------

caseTest("IT-F09-07-022", テキスト経路("アリーナ", null, JSONで見つからない));
caseTest("IT-F09-07-023", テキスト経路("アリーナ", "023", JSONで見つからない));
caseTest("IT-F09-07-024", テキスト経路("アリーナ", "024", JSONで見つからない));

caseTest("IT-F09-07-025", テキスト経路("アリーナ", "025", async (r, j, 行) => {
  expect.soft(r.状態, "応答のHTTPステータス").toBe(200);
  expect.soft(内容の種別(r.ヘッダ), "応答の内容の種別").toBe("application/json");
  expect.soft(添付か(r.ヘッダ), "応答が添付の指定でない").toBe(false);
  expect.soft(r.ファイル === null, "ファイルとして受け取らない").toBe(true);
  expect.soft(j?.success, "本文のJSONの処理結果（成功）").toBe(true);
  expect.soft(typeof j?.list === "string" && j.list !== "", "本文のJSONにデッキリストのテキストがある").toBe(true);
  行がある(行, L(4, "025", "ALPHA"));
}));

caseTest("IT-F09-07-026", テキスト経路("アリーナ", "026", async (r, j, 行) => { JSONで成功(r, j); 行がある(行, L(4, "026", "ALPHA")); }));
caseTest("IT-F09-07-027", テキスト経路("アリーナ", "027", async (r, j, 行) => { JSONで成功(r, j); 行がある(行, L(4, "027", "ALPHA")); }));

caseTest("IT-F09-07-028", テキスト経路("アリーナ", "028", async (_r, _j, 行) => {
  行がある(行, L(4, "028", "ALPHA-ARENA"));
  行が無い(行, L(4, "028", "ALPHA"));
}));

caseTest("IT-F09-07-029", テキスト経路("アリーナ", "029", async (_r, _j, 行) => {
  前にある(行, "Commander", "Deck");
  前にある(行, "Deck", "Sideboard");
  前にある(行, "Commander", L(1, "029", "COMMANDER"));
  前にある(行, L(1, "029", "COMMANDER"), "Deck");
  前にある(行, "Sideboard", L(2, "029", "BETA"));
}));

caseTest("IT-F09-07-030", テキスト経路("日本語", "030", async (_r, _j, 行) => {
  行がある(行, L(4, "030", "ALPHAJP"));
  行が無い(行, L(4, "030", "ALPHA-ARENA"));
  行が無い(行, L(4, "030", "ALPHA"));
}));

caseTest("IT-F09-07-031", テキスト経路("日本語", "031", async (_r, _j, 行) => {
  前にある(行, "統率者", "デッキ");
  前にある(行, "デッキ", "サイドボード");
  前にある(行, "統率者", L(1, "031", "COMMANDERJP"));
  前にある(行, L(1, "031", "COMMANDERJP"), "デッキ");
  前にある(行, "サイドボード", L(2, "031", "BETAJP"));
}));

caseTest("IT-F09-07-032", テキスト経路("アリーナ", "032", async (_r, _j, 行) => {
  行が無い(行, "Commander");
  行がある(行, L(4, "032", "ALPHA"));
}));

caseTest("IT-F09-07-035", テキスト経路("アリーナ", "035", async (r, j) => { JSONで成功(r, j); }));

caseTest("IT-F09-07-036", テキスト経路("アリーナ", "036", async (_r, j) => {
  expect.soft(typeof j?.list === "string", "本文のJSONにデッキリストのテキストの項目がある").toBe(true);
  expect.soft(j?.list ?? null, "デッキリストのテキストが空（カード行も見出し行も無い）").toBe("");
}));

caseTest("IT-F09-07-037", テキスト経路("アリーナ", "037", async (r, j, 行) => {
  JSONで成功(r, j);
  行がある(行, L(4, "037", "ALPHA"));
}, { ログイン: 会員のメール("f0907-039") }));

// ---------------------------------------------------------------------------
// デッキリスト詳細の書き出しの入口
// ---------------------------------------------------------------------------

caseTest("IT-F09-07-040", async ({ page, notes, step, expected }) => {
  const e = new DeckExportPage(page);
  const id = notes.get(デッキ("040"));
  let 要求!: 送られた要求;
  let 失敗: string | null = "未確認";
  await step(1, async () => { await e.詳細を開く(id); note("ネットワーク表示の代わりに、ブラウザが送る要求を Playwright で見た"); });
  await step(2, async () => { 要求 = await e.押して要求を控える("MO"); });
  await step(3, async () => { note(`押して送られた要求: ${要求.アドレス}（デッキの識別子 ${要求.識別子}・応答 ${要求.状態}）`); });
  await step(4, async () => {
    失敗 = 要求.ダウンロード ? await 要求.ダウンロード.failure() : "ダウンロードが起きない";
    note(要求.ダウンロード ? `ダウンロードされたファイル「${要求.ダウンロード.suggestedFilename()}」（失敗: ${失敗 ?? "なし"}）` : "ダウンロードは起きなかった");
  });
  await expected(async () => {
    expect.soft(new URL(要求.アドレス).pathname, "押下で送られた要求の経路（Magic Online用テキストの書き出し）").toMatch(/\/deck\/download\/\d+$/);
    expect.soft(要求.識別子, "押下で送られた要求のデッキの識別子").toBe(id);
    expect.soft(要求.ダウンロード !== null, "ファイルがダウンロードされた").toBe(true);
    expect.soft(失敗, "ダウンロードの失敗が無い").toBeNull();
  });
});

/** 041・042: アリーナ用・日本語の入口を押して、送られた要求の識別子・言語の指定・応答を見る */
function テキストの入口(種類: "アリーナ" | "日本語", ケース: string, 言語: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const e = new DeckExportPage(page);
    const id = notes.get(デッキ(ケース));
    let 要求!: 送られた要求;
    await step(1, async () => { await e.詳細を開く(id); note("ネットワーク表示の代わりに、ブラウザが送る要求と応答を Playwright で見た"); });
    await step(2, async () => { 要求 = await e.押して要求を控える(種類); });
    await step(3, async () => { note(`押して送られた要求: ${要求.アドレス}（デッキの識別子 ${要求.識別子}・言語の指定 ${要求.言語の指定 || "なし"}・応答 ${要求.状態}）`); });
    await expected(async () => {
      expect.soft(new URL(要求.アドレス).pathname, "押下で送られた要求の経路（アリーナ形式のテキストの書き出し）").toMatch(/\/deck\/arena\/\d+$/);
      expect.soft(要求.識別子, "押下で送られた要求のデッキの識別子").toBe(id);
      expect.soft(要求.言語の指定, "押下で送られた要求の言語の指定").toBe(言語);
      expect.soft(要求.状態, "応答のHTTPステータス").toBe(200);
    });
  };
}
caseTest("IT-F09-07-041", テキストの入口("アリーナ", "041", "en"));
caseTest("IT-F09-07-042", テキストの入口("日本語", "042", "jp"));

/** 045・046: 入口の表示を見る */
function 入口が出ない(ケース: string, 種類: 入口[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const e = new DeckExportPage(page);
    const 数: Record<string, { 表示: number; 画面の中: number }> = {};
    await step(1, async () => { await e.詳細を開く(notes.get(デッキ(ケース))); });
    await step(2, async () => {
      for (const k of ["MO", "アリーナ", "日本語"] as 入口[]) 数[k] = { 表示: await e.表示された入口(k).count(), 画面の中: await e.入口(k).count() };
      note(`書き出しの入口（表示されている数／画面の作りの中にある数）: ${Object.entries(数).map(([k, v]) => `${k} ${v.表示}／${v.画面の中}`).join("・")}`);
    });
    await expected(async () => {
      await expect.soft(e.情報欄, "デッキリスト詳細の情報欄が表示されている（画面の読み込みが済んだ）").toBeVisible();
      for (const k of 種類) expect.soft(数[k].表示, `「${k === "MO" ? "Magic Online用テキスト" : k === "アリーナ" ? "アリーナ用インポートテキスト" : "日本語テキスト"}」の入口が表示されない`).toBe(0);
    });
  };
}
caseTest("IT-F09-07-045", 入口が出ない("045", ["MO", "アリーナ", "日本語"]));
caseTest("IT-F09-07-046", 入口が出ない("046", ["アリーナ", "日本語"]));

caseTest("IT-F09-07-047", async ({ page, notes, step, expected }) => {
  const e = new DeckExportPage(page);
  let 要求!: 送られた要求;
  await step(1, async () => { await e.詳細を開く(notes.get(デッキ("047"))); note("ネットワーク表示の代わりに、ブラウザが送る要求を Playwright で見た"); });
  await step(2, async () => { 要求 = await e.押して要求を控える("日本語"); });
  await step(3, async () => {
    note(`押して送られた要求: ${要求.アドレス}。アドレスの先頭の表示言語「${要求.経路の表示言語 || "なし"}」・言語の指定「${要求.言語の指定 || "なし"}」・要求ヘッダの言語「${要求.要求ヘッダの言語 || "なし"}」`);
    note("「取得先の経路の表示言語」は、アドレスの先頭の表示言語（/ja/・/en/ の部分）として見た");
  });
  await expected(async () => {
    expect.soft(要求.経路の表示言語, "押下で送られた要求の取得先の経路の表示言語").toBe("en");
  });
});

// ---------------------------------------------------------------------------
// 要因の組合せ（一時保存の無いもの）
// ---------------------------------------------------------------------------

caseTest("IT-F09-07-050", ファイル経路("050", async (r, 行) => {
  ファイルがある(r);
  expect.soft(行, "ファイルの行が「4 ALPHA-ARENA」の1行だけ").toEqual([L(4, "050", "ALPHA-ARENA")]);
  行が無い(行, "Sideboard");
  行が無い(行, L(4, "050", "ALPHA"));
}));

caseTest("IT-F09-07-052", ファイル経路("052", async (r, 行) => {
  ファイルがある(r);
  expect.soft(行, "ファイルの行が「4 ALPHA」・空行・「Sideboard」・「2 BETA」の順").toEqual([L(4, "052", "ALPHA"), "", "Sideboard", L(2, "052", "BETA")]);
}));

caseTest("IT-F09-07-054", テキスト経路("日本語", "054", async (_r, _j, 行) => {
  続いて並ぶ(行, [`4 ${N("054", "ALPHAJP")}//${N("054", "ALPHAXJP")}`, "", "サイドボード", L(2, "054", "BETAJP")], "「4 ALPHAJP//ALPHAXJP」・空行・「サイドボード」・「2 BETAJP」");
  行が無い(行, "統率者");
  含む行が無い(行, "-ARENA");
}));

caseTest("IT-F09-07-056", テキスト経路("日本語", "056", async (_r, _j, 行) => {
  行がある(行, L(4, "056", "ALPHAJP"));
  行が無い(行, "統率者");
  行が無い(行, "サイドボード");
}));

caseTest("IT-F09-07-058", テキスト経路("アリーナ", "058", async (_r, _j, 行) => {
  前にある(行, "Commander", "Deck");
  前にある(行, "Deck", "Sideboard");
  前にある(行, "Commander", L(1, "058", "CMD-ARENA"));
  前にある(行, L(1, "058", "CMD-ARENA"), "Deck");
  前にある(行, "Deck", L(4, "058", "ALPHA-ARENA"));
  前にある(行, L(4, "058", "ALPHA-ARENA"), "Sideboard");
  const i = 位置(行, L(4, "058", "ALPHA-ARENA"));
  expect.soft(i >= 0 ? 行[i + 1] : null, "「4 ALPHA-ARENA」の直後の行が空行").toBe("");
  前にある(行, "Sideboard", L(2, "058", "BETA-ARENA"));
}));

// ---------------------------------------------------------------------------
// 追加の実装（2026-11-11）
// ---------------------------------------------------------------------------

// 018・034: メイン・サイド・統率者以外の配置の採用カードは書き出さない（その配置はシードでDBに設定した）
caseTest("IT-F09-07-018", ファイル経路("018", async (r, 行) => {
  ファイルがある(r);
  expect.soft(行, "ファイルの行が「4 ALPHA」の1行だけ").toEqual([L(4, "018", "ALPHA")]);
  含む行が無い(行, N("018", "OTHER"));
}));

caseTest("IT-F09-07-034", テキスト経路("アリーナ", "034", async (r, j, 行) => {
  JSONで成功(r, j);
  行がある(行, L(4, "034", "ALPHA"));
  含む行が無い(行, N("034", "OTHER"));
}));

// 021・038: 書き出しの要求で、データが変わらない（DBの確認は参照だけ）
function 変わらない(前: () => デッキの状態, 後: () => デッキの状態): void {
  const 比べる = () => {
    expect.soft(後().印つきのデッキ件数, "今回の実行の印つきのデッキ件数（要求前と同じ）").toBe(前().印つきのデッキ件数);
    expect.soft(後().更新日時, "このデッキの更新日時（要求前と同じ）").toBe(前().更新日時);
    expect.soft(後().採用カードの件数, "採用カードの件数（2件）").toBe(2);
    expect.soft(後().採用カードの件数, "採用カードの件数（要求前と同じ）").toBe(前().採用カードの件数);
    expect.soft(後().採用カードの枚数, "採用カードの枚数（4枚と2枚）").toEqual([4, 2]);
    expect.soft(後().採用カードの枚数, "採用カードの枚数（要求前と同じ）").toEqual(前().採用カードの枚数);
  };
  比べる();
}
const 前後の注記 = "デッキ件数は、共有のデータ全体ではなく、今回の実行の印が付いたアーキタイプのデッキで数えた（ほかの人の登録で増減しないようにするため）";
{
  let 前: デッキの状態 | null = null, 後: デッキの状態 | null = null;
  caseTest("IT-F09-07-021", ファイル経路("021", async (r) => {
    ファイルがある(r);
    変わらない(() => 前!, () => 後!);
  }, {
    前: (id) => { 前 = デッキの状態を読む(id); note(`要求前（DBの参照）: ${JSON.stringify(前)}。${前後の注記}`); },
    最後の手順: async (id) => { 後 = デッキの状態を読む(id); note(`要求後（DBの参照）: ${JSON.stringify(後)}`); },
  }));
}
{
  let 前: デッキの状態 | null = null, 後: デッキの状態 | null = null;
  caseTest("IT-F09-07-038", テキスト経路("アリーナ", "038", async (r) => {
    expect.soft(r.状態, "応答のHTTPステータス").toBe(200);
    変わらない(() => 前!, () => 後!);
  }, {
    前: (id) => { 前 = デッキの状態を読む(id); note(`要求前（DBの参照）: ${JSON.stringify(前)}。${前後の注記}`); },
    最後の手順: async (id) => { 後 = デッキの状態を読む(id); note(`要求後（DBの参照）: ${JSON.stringify(後)}`); },
  }));
}

// 一時保存（デッキIDを鍵にしたキャッシュ）があるデッキ。キャッシュのデッキリストから組み立て、採用カードは使わない
const 一時保存の注記 = () => note("一時保存は、シードで実行の印つきの会員がデッキビルダーのAPIで作ったもの（キャッシュの中身は見ていない。書き出しの結果で確かめる）");

caseTest("IT-F09-07-039", テキスト経路("日本語", "039", async (_r, _j, 行) => {
  一時保存の注記();
  行がある(行, L(3, "039", "CACHEDJP"));
  含む行が無い(行, N("039", "ADOPTEDJP"));
}));

caseTest("IT-F09-07-049", ファイル経路("049", async (r, 行) => {
  一時保存の注記();
  ファイルがある(r);
  続いて並ぶ(行, [L(3, "049", "CACHED-ARENA"), "", "Sideboard", L(2, "049", "CSIDE-ARENA")], "「3 CACHED-ARENA」・空行・「Sideboard」・「2 CSIDE-ARENA」");
  含む行が無い(行, N("049", "ADOPTED"));
}));

caseTest("IT-F09-07-051", ファイル経路("051", async (r, 行) => {
  一時保存の注記();
  ファイルがある(r);
  expect.soft(行, "ファイルの行が「3 CACHED」の1行だけ").toEqual([L(3, "051", "CACHED")]);
  行が無い(行, "Sideboard");
  含む行が無い(行, N("051", "ADOPTED"));
}));

caseTest("IT-F09-07-053", テキスト経路("アリーナ", "053", async (_r, _j, 行) => {
  一時保存の注記();
  前にある(行, "Commander", "Deck");
  前にある(行, "Commander", L(1, "053", "CCMD-ARENA"));
  前にある(行, L(1, "053", "CCMD-ARENA"), "Deck");
  前にある(行, "Deck", L(3, "053", "CACHED-ARENA"));
  行が無い(行, "Sideboard");
  含む行が無い(行, N("053", "ADOPTED"));
}));

caseTest("IT-F09-07-055", テキスト経路("アリーナ", "055", async (_r, _j, 行) => {
  一時保存の注記();
  const 両面 = `3 ${N("055", "CACHED")}//${N("055", "CACHEDX")}`;
  note("期待の「3 CACHED//CACHEDX」は、正本どおり空白の無い「//」で比べた（アプリは「/」を「 // 」に置き換える作り。落ちたら判定で扱う）");
  前にある(行, "Commander", "Deck");
  前にある(行, "Deck", "Sideboard");
  前にある(行, "Commander", L(1, "055", "CCMD"));
  前にある(行, L(1, "055", "CCMD"), "Deck");
  前にある(行, "Deck", 両面);
  前にある(行, 両面, "Sideboard");
  const i = 位置(行, 両面);
  expect.soft(i >= 0 ? 行[i + 1] : null, "「3 CACHED//CACHEDX」の直後の行が空行").toBe("");
  前にある(行, "Sideboard", L(2, "055", "CSIDE"));
  含む行が無い(行, N("055", "ADOPTED"));
}));

caseTest("IT-F09-07-057", テキスト経路("アリーナ", "057", async (_r, _j, 行) => {
  一時保存の注記();
  続いて並ぶ(行, [L(3, "057", "CACHED-ARENA"), "", "Sideboard", L(2, "057", "CSIDE-ARENA")], "「3 CACHED-ARENA」・空行・「Sideboard」・「2 CSIDE-ARENA」");
  行が無い(行, "Commander");
  含む行が無い(行, N("057", "ADOPTED"));
}));

caseTest("IT-F09-07-059", テキスト経路("日本語", "059", async (_r, _j, 行) => {
  一時保存の注記();
  const 両面 = `3 ${N("059", "CACHEDJP")}//${N("059", "CACHEDXJP")}`;
  note("期待の「3 CACHEDJP//CACHEDXJP」は、正本どおり空白の無い「//」で比べた（アプリは「/」を「 // 」に置き換える作り。落ちたら判定で扱う）");
  前にある(行, "統率者", "デッキ");
  前にある(行, "統率者", L(1, "059", "CCMDJP"));
  前にある(行, L(1, "059", "CCMDJP"), "デッキ");
  前にある(行, "デッキ", 両面);
  行が無い(行, "サイドボード");
  含む行が無い(行, N("059", "ADOPTEDJP"));
  含む行が無い(行, "-ARENA");
}));
