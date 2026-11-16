/**
 * F09-03 メタゲーム一覧 のシードの作り方（画面操作）。正本: cases/F09-03_seed_data.tsv
 *
 * - 操作する管理者: 全権限の管理者（SETUP_ADMIN）。シード表は管理者を定めない。フォーマット・アーキタイプ・デッキは店舗に属さないので、
 *   編集可能店舗を持たない全権限の管理者で足りる（F09-01・F09-02 と同じ）。
 * - フォーマット・アーキタイプ・デッキの登録は F09-01 の部品（f09_01_setup）を使う。フォーマットコードはフォーマット名から作る
 *   10文字の半角英数字（フォーマットコード()。シード表は「ほかの項目は初期表示のまま」とするが、空にすると公開側の検索条件の
 *   選択肢・アーキタイプの選択画面のタブが区別できないため、F09-01 と同じく入れる）。
 * - 「ほかの項目は初期表示のまま」: 新規登録画面の初期表示は、ランキング表示・メタ分布簡易化・デッキ検索条件に表示のどれもチェックなし
 *   （画面の初期値）。シード表が「デッキ検索条件に表示」にチェックを入れると定めるフォーマット（032 の F・CB037・CB038）だけチェックを入れる。
 * - 決め打ちの識別の値（フォーマット名・アーキタイプ名・プレイヤー名・イベント名）は、「F0903-002」のようなケースの前半に
 *   実行の印を付けて作る（例: F0903-002-F → F0903-002-<印>-F）。フォーマットは毎回新しい番号になり、メタゲーム一覧の集計結果の
 *   キャッシュ（フォーマットの番号ごと）は作られていない。前の実行の残りにも当たらないので、シード表の (1)（前回の実施分を消す）は
 *   行わない（消す対象が無い）。
 * - メタゲーム一覧の集計は、画面が受け取ったフォーマットのデッキだけを数える（設計書 L0010）。各シードはケースごとに新しいフォーマットを
 *   作るので、ほかのデッキ（ほかのケース・ほかの回のデッキ）の有無は集計に入らない。ほかのデッキを消すシードは無い。
 * - デッキの「任意の値」: プレイヤー名はシード表に無ければ空（入力欄の初期表示のまま）。順位・参加人数は空。デッキリストは公開。
 *   開催日の時刻はシード表どおり 12:00。
 * - アーキタイプの番号（024 の確かめに使う）はシード表が控えると定めないので、このファイルの中だけで持つ（番号）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { adminUrl, withAdminSession } from "../lib/session";
import { アーキタイプを登録する, デッキを登録する, フォーマットを登録する, 日付 } from "../pages/admin/f09_01_setup";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "../pages/admin/card_csv";
import { ファイルを上げる } from "../pages/admin/f01_02_layout";
import { 画像 } from "../pages/admin/m10_04_payment";

/** 正本の値「F0903-<ケース>-<名>」を、実行の印つきの値にする（印はケースの前半に付ける） */
export const N = (ケース: string, 名: string) => `${rc(`F0903-${ケース}`)}-${名}`;

/** 画面が振ったアーキタイプの番号。キーは実行の印つきのアーキタイプ名 */
const 番号 = new Map<string, string>();
export const アーキタイプの番号 = (ケース: string, 名: string): string => {
  const v = 番号.get(N(ケース, 名));
  if (!v) throw new Error(`アーキタイプ ${N(ケース, 名)} の番号を控えていない（シードが作っていない）`);
  return v;
};

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

type F = {
  /** 名前の記号（「F」「Y」「X」） */
  名: string;
  /** 控える呼び名（〔フォーマット識別子-F0903-002〕） */
  控え: string;
  メタ日数?: string;
  検索対象?: boolean;
};
type D = {
  /** アーキタイプの記号（「A」「B」） */
  アーキタイプ: string;
  /** 実行日の N 日前（負は N 日後） */
  日前: number;
  /** 件数（省略は1） */
  件数?: number;
  ユーザー?: boolean; 非公開?: boolean; リスト非公開?: boolean;
  プレイヤー?: string;
  /** イベント名の記号（省略は「EVENT」） */
  イベント?: string;
  /** フォーマットの記号（省略は先頭のフォーマット） */
  フォーマット?: string;
};
type 計画 = { ケース: string; フォーマット: F[]; アーキタイプ: { 名: string; フォーマット?: string; 代表カード?: string }[]; デッキ: D[] };

function definePlanSeed(seedId: string, p: 計画): void {
  defineSeed(seedId, async ({ browser, notes }) => { await 計画を作る(browser, notes, seedId, p); });
}

async function 計画を作る(browser: Browser, notes: { set: (k: string, v: string) => void }, seedId: string, p: 計画): Promise<void> {
  {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const n = (名: string) => N(p.ケース, 名);
    await 管理画面(browser, async (page) => {
      for (const f of p.フォーマット) {
        const id = await フォーマットを登録する(page, {
          名: n(f.名), 表示順: "9000", ランキング: false, その他メタ: false, メタ日数: f.メタ日数 ?? "14", 検索対象: f.検索対象 ?? false,
        }, issue);
        notes.set(f.控え, id);
      }
      const 先頭 = p.フォーマット[0].名;
      for (const a of p.アーキタイプ) {
        番号.set(n(a.名), await アーキタイプを登録する(page, { 名: n(a.名), フォーマット: n(a.フォーマット ?? 先頭), ...(a.代表カード ? { 代表カード名英: n(a.代表カード) } : {}) }, issue));
      }
      for (const d of p.デッキ) {
        for (let i = 0; i < (d.件数 ?? 1); i++) {
          await デッキを登録する(page, {
            デッキタイプ: d.ユーザー ? "ユーザーデッキ" : "大会デッキ", 公開: !d.非公開, リスト非公開: !!d.リスト非公開,
            フォーマット: n(d.フォーマット ?? 先頭), アーキタイプ: n(d.アーキタイプ), プレイヤー名: d.プレイヤー ? n(d.プレイヤー) : "",
            イベント名日: n(d.イベント ?? "EVENT"), イベント名英: n(d.イベント ?? "EVENT"),
            開催日時: `${日付(-d.日前)}T12:00`,
          }, issue);
        }
      }
    });
  }
}

/** フォーマット1つ・アーキタイプ A に大会デッキ・公開のデッキを件数だけ持つ形 */
const 一つだけ = (ケース: string, 日前: number, 件数: number): 計画 => ({
  ケース, フォーマット: [{ 名: "F", 控え: `〔フォーマット識別子-F0903-${ケース}〕` }], アーキタイプ: [{ 名: "A" }],
  デッキ: [{ アーキタイプ: "A", 日前, 件数 }],
});

// ---------------------------------------------------------------------------
// 試験条件
// ---------------------------------------------------------------------------

defineSeed("S-F09-03-ENV", async () => { /* 試験条件。ブラウザは日本語表示（設定の locale）で、ログインしない新しいブラウザで開く */ });

// ---------------------------------------------------------------------------
// 存在しないフォーマット（001・033）
// ---------------------------------------------------------------------------

/** 識別子のフォーマットが無いことを、管理画面のフォーマットの編集画面で確かめる（001・033） */
function defineNoFormatSeed(seedId: string, 識別子: string): void {
  defineSeed(seedId, async ({ browser }) => {
    await 管理画面(browser, async (page) => {
      const res = await page.goto(adminUrl(`/format/${識別子}/edit`));
      const status = res?.status() ?? 0;
      if (status !== 404) {
        // シード表は、あればそのフォーマットのデッキ・アーキタイプ・フォーマットを消すと定める。決め打ちの番号のフォーマットは
        // この E2E では作らない（画面が振る番号は小さい）ため、あったときは消さずに止めて報告する（ほかの人のデータを消さない）
        throw new Error(`${seedId}: フォーマットの編集画面を識別子 ${識別子} で開くと、ページが見つからない表示にならない（応答 ${status}）。識別子 ${識別子} のフォーマットがある`);
      }
    });
  });
}
defineNoFormatSeed("S-F09-03-NOFORMAT-001", "903001");
defineNoFormatSeed("S-F09-03-NOFORMAT-033", "903033");

// ---------------------------------------------------------------------------
// フォーマット・アーキタイプ・デッキ
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-03-NONNUMERIC-002", 一つだけ("002", 0, 1));
definePlanSeed("S-F09-03-NORANKING-003", 一つだけ("003", 1, 2));

definePlanSeed("S-F09-03-MERGE-004", {
  ケース: "004", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-004〕" }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 3 }, { アーキタイプ: "B", 日前: 2 }],
});

definePlanSeed("S-F09-03-USERDECK-005", {
  ケース: "005", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-005〕" }], アーキタイプ: [{ 名: "A" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 2 }, { アーキタイプ: "A", 日前: 1, 件数: 3, ユーザー: true }],
});

definePlanSeed("S-F09-03-NOTPUBLIC-006", {
  ケース: "006", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-006〕" }], アーキタイプ: [{ 名: "A" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 2 }, { アーキタイプ: "A", 日前: 1, 非公開: true }],
});

definePlanSeed("S-F09-03-FORMATONLY-007", {
  ケース: "007",
  フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-007A〕" }, { 名: "Y", 控え: "〔フォーマット識別子-F0903-007B〕" }],
  アーキタイプ: [{ 名: "A", フォーマット: "F" }, { 名: "Z", フォーマット: "Y" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 2, フォーマット: "F" }, { アーキタイプ: "Z", 日前: 1, 件数: 3, フォーマット: "Y" }],
});

definePlanSeed("S-F09-03-PRIVATELIST-008", {
  ケース: "008", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-008〕" }], アーキタイプ: [{ 名: "A" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1 }, { アーキタイプ: "A", 日前: 1, 件数: 2, リスト非公開: true }],
});

definePlanSeed("S-F09-03-PERIODSTART-011", {
  ケース: "011", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-011〕", メタ日数: "7" }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [{ アーキタイプ: "A", 日前: 7, 件数: 2 }, { アーキタイプ: "B", 日前: 8 }],
});

definePlanSeed("S-F09-03-PERIODEND-012", {
  ケース: "012", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-012〕" }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [{ アーキタイプ: "A", 日前: 0, 件数: 2 }, { アーキタイプ: "B", 日前: -1 }],
});

definePlanSeed("S-F09-03-DAYS30-013", {
  ケース: "013", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-013〕", メタ日数: "30" }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [{ アーキタイプ: "A", 日前: 20, 件数: 2 }, { アーキタイプ: "B", 日前: 31 }],
});

definePlanSeed("S-F09-03-NOPERIOD-014", 一つだけ("014", 15, 2));
definePlanSeed("S-F09-03-NOIMAGE-020", 一つだけ("020", 1, 2));
definePlanSeed("S-F09-03-HEADNAME-021", 一つだけ("021", 1, 1));
definePlanSeed("S-F09-03-HEADDATE-022", 一つだけ("022", 1, 1));
definePlanSeed("S-F09-03-NOUPDATE-023", 一つだけ("023", 1, 2));
definePlanSeed("S-F09-03-LINKCOND-024", 一つだけ("024", 3, 2));

definePlanSeed("S-F09-03-LINKLIST-025", {
  ケース: "025", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-025〕" }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [
    { アーキタイプ: "A", 日前: 2, プレイヤー: "P1", イベント: "T1" },
    { アーキタイプ: "A", 日前: 5, プレイヤー: "P2", イベント: "T2" },
    { アーキタイプ: "A", 日前: 20, プレイヤー: "P3", イベント: "T3" },
    { アーキタイプ: "B", 日前: 3, プレイヤー: "P4", イベント: "T4" },
  ],
});

definePlanSeed("S-F09-03-LINKFMT-027", 一つだけ("027", 1, 1));
definePlanSeed("S-F09-03-BACK-028", 一つだけ("028", 1, 1));
definePlanSeed("S-F09-03-BACKNOCARRY-029", 一つだけ("029", 1, 1));
definePlanSeed("S-F09-03-FORMINIT-030", 一つだけ("030", 1, 1));
definePlanSeed("S-F09-03-FORMSEARCH-031", 一つだけ("031", 1, 1));

definePlanSeed("S-F09-03-FORMCHOICE-032", {
  ケース: "032",
  フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-032A〕", 検索対象: true }, { 名: "X", 控え: "〔フォーマット識別子-F0903-032B〕", 検索対象: false }],
  アーキタイプ: [{ 名: "A", フォーマット: "F" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, フォーマット: "F" }],
});

definePlanSeed("S-F09-03-CBSEARCH0-037", {
  ケース: "CB037", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-CB037〕", 検索対象: true }], アーキタイプ: [], デッキ: [],
});

definePlanSeed("S-F09-03-CBSEARCH1-038", {
  ケース: "CB038", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-CB038〕", 検索対象: true }], アーキタイプ: [{ 名: "A" }, { 名: "B" }],
  デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 2 }, { アーキタイプ: "B", 日前: 1 }],
});

// ---------------------------------------------------------------------------
// 019: 代表カード画像のあるアーキタイプ
// ---------------------------------------------------------------------------
// 画像ファイルの名前・カード名には実行の印を付ける（F0903-019-A.jpg → F0903-019-<印>-A.jpg。前の実行のファイル・カードに当たらないため）。
// シード表の「前回の実施分が残っているときは消す」は、印で前の実行に当たらないので行わない（消す対象が無い）。
// カードCSVは、シード表が値を定めるカード名(英語)・レアリティ・レイアウト・画像URL(英語)に加え、カード名(日本語)にも英語と同じ名前を入れた
// （代表カード検索は日本語名と英語名を並べて表示するため。F09-04・M15-09 の取り込みと同じ形）。
defineSeed("S-F09-03-ITEMS-019", async ({ browser, notes }) => {
  const seedId = "S-F09-03-ITEMS-019";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const n = (名: string) => N("019", 名);
  await 管理画面(browser, async (page) => {
    const 画像URL: Record<string, string> = {};
    for (const a of ["A", "B"]) {
      const パス = await ファイルを上げる(page, 画像(`${n(a)}.jpg`), `${seedId}: 画像ファイル ${n(a)}.jpg`, issue);
      const url = new URL(パス, BASE_URL).href;
      if (url.length > 128) throw new Error(`${seedId}: 画像のURLが128文字を超える（${url.length}文字: ${url}）`);
      // 管理画面で上げたファイルが公開側から開けるまでに時間がかかることがある（管理画面と公開側が別のサーバー）。最大で約90秒、間をおいて開き直す
      let res = await page.request.get(url);
      for (let i = 0; i < 9 && res.status() !== 200; i++) { await page.waitForTimeout(10_000); res = await page.request.get(url); }
      if (res.status() !== 200) throw new Error(`${seedId}: 上げた画像 ${url} を開くと応答 ${res.status()}（画像が表示されない。90秒待っても開けない）`);
      画像URL[a] = url;
    }
    const 既存 = await readExistingCardValues(page);
    const headers = await downloadCardCsvTemplate(page);
    const rows = ["A", "B"].map((a) => ({
      name_jp: n(`CARD-${a}`), name_en: n(`CARD-${a}`), rarity: 既存.rarity, layout: 既存.layout, image_en: 画像URL[a], image_jp: "", card_detail_id: "",
    }));
    await uploadCardCsv(page, buildCardCsv(headers, rows), "f0903_019_cards.csv", `${seedId}: カードCSVアップロード`, (w) => issue(`カードCSVの警告「${w}」`));
    issue(`画像ファイル ${n("A")}.jpg・${n("B")}.jpg をファイル管理の最上位に上げ（中身は小さいJPEG画像）、そのURLを画像URL(英語)にしたカード ${n("CARD-A")}・${n("CARD-B")} をカードCSVで登録した（レアリティ「${既存.rarity}」・レイアウト「${既存.layout}」は既存のカードにある英語名）`);
  });
  await 計画を作る(browser, notes, seedId, {
    ケース: "019", フォーマット: [{ 名: "F", 控え: "〔フォーマット識別子-F0903-019〕" }],
    アーキタイプ: [{ 名: "A", 代表カード: "CARD-A" }, { 名: "B", 代表カード: "CARD-B" }],
    デッキ: [{ アーキタイプ: "A", 日前: 1, 件数: 3 }, { アーキタイプ: "B", 日前: 1 }],
  });
});
