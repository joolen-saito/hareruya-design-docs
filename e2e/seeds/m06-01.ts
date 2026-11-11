/**
 * M06-01 買取一覧(検索入力・検索結果) の画面シード。正本: cases/M06-01_seed_data.tsv
 *
 * 作るシード（画面だけで準備できるケースが使うもの）:
 * - S-M06-01-SHOPS: 買取店舗A（本店）・買取店舗B（支店）。店舗登録画面で登録し、店舗一覧の行のIDを控える。あれば内容を確かめて使う。
 * - S-M06-01-ADM-A・ADM-ALL: メンバー管理で登録する試験管理者。管理者内部ID（860101・860102）は画面が振るので正本の値にはならない（ケースの文に出ない）。
 *   権限は正本が定めないのでシステム管理者にした。
 * - S-M06-01-CONFIG: 既定表示件数・通貨記号はアプリの設定値で、管理画面に項目が無い。書き換えられないので、いまの状態を報告に残すだけ（条件付き）。
 *   戻しリスト金額閾値も、管理画面の店舗設定に該当の項目が無い（ケースの確かめに関わらない）。
 * - S-M06-01-BROWSER: ブラウザの設定（ダウンロード・ポップアップの許可）。試験の基盤が許可している。
 * - ケース専用のシード（DATE-AMOUNT-025・RESTOCK-ERROR-057〜062・SORT-PAGE-068・SORT-COUNT-069・HITCOUNT-071）:
 *   フロントの店頭買取査定申込（会員登録なし）を行い、管理画面の買取一覧で申込者名を検索して査定IDを控え、必要なら管理画面のステータス変更で
 *   ステータスを変える。申込者名には実行ごとの印を付ける（rc）。
 *
 * DBでの準備が要るシード（SEARCH-*・PAGE-*・LIST-HISTORY-*・RESTOCK-* など）は作らない。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { 申込を行う, 査定IDを読む, 申込者の, storeInput } from "./m06-common";

export const M0601_ADMIN_A: Account = { loginId: "m0601_admin_a", password: "Passw0rd!M0601A" };
export const M0601_ADMIN_ALL: Account = { loginId: "m0601_admin_all", password: "Passw0rd!M0601All" };

export const STORE_A = storeInput("買取店舗A", "カイトリテンポエー", "Kaitori Store A", "m0601a", "K1A");
export const STORE_B = storeInput("買取店舗B", "カイトリテンポビー", "Kaitori Store B", "m0601b", "K1B", "530-0001", "大阪府", "大阪市北区梅田1-1-1", "晴ビル2F", "06-2222-2222");

const L_A = "〔店舗ID-M0601-共有A〕";
const L_B = "〔店舗ID-M0601-共有B〕";

defineSeed("S-M06-01-SHOPS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set(L_A, await ensureStore(page, STORE_A, (m) => reportSeedIssue(seed.シードID, m), "本店"));
    notes.set(L_B, await ensureStore(page, STORE_B, (m) => reportSeedIssue(seed.シードID, m), "支店"));
  });
});

/** 管理者A: デフォルト検索表示店舗=買取店舗A、編集可能店舗=買取店舗Aだけ */
defineSeed("S-M06-01-ADM-A", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-01試験管理者A", ログインID: M0601_ADMIN_A.loginId, メールアドレス: "m0601_admin_a@example.test", パスワード: M0601_ADMIN_A.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
});

/** 全店管理者: デフォルト検索表示店舗=全店（未選択）、編集可能店舗=買取店舗A・B */
defineSeed("S-M06-01-ADM-ALL", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const a = notes.get(L_A);
  const b = notes.get(L_B);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-01試験全店管理者", ログインID: M0601_ADMIN_ALL.loginId, メールアドレス: "m0601_admin_all@example.test", パスワード: M0601_ADMIN_ALL.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [a, b],
  }));
});

defineSeed("S-M06-01-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "既定表示件数（50件）・通貨記号・戻しリスト金額閾値は、管理画面に設定の項目が無い（アプリの設定値）ので書き換えられない。設定を書き換えずに流した");
});

defineSeed("S-M06-01-BROWSER", async () => {
  // ダウンロードとポップアップは、試験のブラウザが既定で許可している。ケースごとの新しいブラウザセッションで始める
});

export const 支店URL = (店: "A" | "B") => (店 === "A" ? STORE_A.支店URL : STORE_B.支店URL);

/** 買取詳細のステータス変更（全店管理者で行う。正本の作り方） */
export async function ステータスを変える(browser: Browser, 査定IDs: string[], 変更後: string): Promise<void> {
  await withAdminSession(browser, M0601_ADMIN_ALL, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const id of 査定IDs) {
      const list = new OtcListPage(page);
      await list.open();
      await list.日時を空にする();
      await list.買取店舗を選ぶ("");
      await list.査定IDを入れる(id);
      await list.検索する();
      await list.詳細を開く(id);
      await new OtcDetailPage(page).ステータスを変える(変更後);
    }
  });
}

/** 申込者名ごとに1件ずつ申込み、申込者名で検索して査定IDを返す */
export async function 一件ずつ申込む(browser: Browser, 店: "A" | "B", 姓: string, 名: string, セイ: string, メイ: string): Promise<string> {
  await 申込を行う(browser, 支店URL(店), [申込者の(姓, 名, セイ, メイ)]);
  return (await 査定IDを読む(browser, 姓, 1))[0];
}

export const 試験者 = (姓: string) => ({ 姓, 名: "一郎", セイ: "カイトリシケン", メイ: "イチロウ" });

// ---- 戻しリストのエラーを確かめるケースのシード ----

type Build = Parameters<typeof defineSeed>[2];
const NEEDS = { needs: ["S-M06-01-SHOPS", "S-M06-01-ADM-ALL"] };

/** 057・060: 店舗A・査定前・棚戻し未完了 */
const 査定前の申込: (no: string) => Build = (no) => async ({ browser, notes }) => {
  const t = 試験者(rc(`買取試験${no}`));
  notes.set(`〔査定ID-M0601-${no}〕`, await 一件ずつ申込む(browser, "A", t.姓, t.名, t.セイ, t.メイ));
};
/** 058・061: 店舗B・入庫待ち・棚戻し未完了 */
const 店舗Bの入庫待ち: (no: string) => Build = (no) => async ({ browser, notes }) => {
  const t = 試験者(rc(`買取試験${no}`));
  const assessment = await 一件ずつ申込む(browser, "B", t.姓, t.名, t.セイ, t.メイ);
  await ステータスを変える(browser, [assessment], "入庫待ち");
  notes.set(`〔査定ID-M0601-${no}〕`, assessment);
};
/** 059・062: 店舗A・店舗Bの1件ずつ、入庫済み・棚戻し未完了 */
const 両店舗の入庫済み: (no: string) => Build = (no) => async ({ browser, notes }) => {
  const ta = 試験者(rc(`買取試験${no}A`));
  const tb = 試験者(rc(`買取試験${no}B`));
  const a = await 一件ずつ申込む(browser, "A", ta.姓, ta.名, ta.セイ, ta.メイ);
  const b = await 一件ずつ申込む(browser, "B", tb.姓, tb.名, tb.セイ, tb.メイ);
  await ステータスを変える(browser, [a, b], "入庫済み");
  notes.set(`〔査定ID-M0601-${no}A〕`, a);
  notes.set(`〔査定ID-M0601-${no}B〕`, b);
};

defineSeed("S-M06-01-RESTOCK-ERROR-057", { needs: ["S-M06-01-SHOPS"] }, 査定前の申込("057"));
defineSeed("S-M06-01-RESTOCK-ERROR-058", NEEDS, 店舗Bの入庫待ち("058"));
defineSeed("S-M06-01-RESTOCK-ERROR-059", NEEDS, 両店舗の入庫済み("059"));
defineSeed("S-M06-01-RESTOCK-ERROR-060", { needs: ["S-M06-01-SHOPS"] }, 査定前の申込("060"));
defineSeed("S-M06-01-RESTOCK-ERROR-061", NEEDS, 店舗Bの入庫待ち("061"));
defineSeed("S-M06-01-RESTOCK-ERROR-062", NEEDS, 両店舗の入庫済み("062"));

// ---- 検索・並び・件数のケースのシード ----

/** 025: 店舗A・入庫待ち。Aは棚戻し未完了、Bは戻しリストCSVを出して棚戻し済みにする */
defineSeed("S-M06-01-DATE-AMOUNT-025", { needs: ["S-M06-01-SHOPS", "S-M06-01-ADM-ALL"] }, async ({ browser, notes }) => {
  const ta = 試験者(rc("買取試験025A"));
  const tb = 試験者(rc("買取試験025B"));
  const a = await 一件ずつ申込む(browser, "A", ta.姓, ta.名, ta.セイ, ta.メイ);
  const b = await 一件ずつ申込む(browser, "A", tb.姓, tb.名, tb.セイ, tb.メイ);
  await ステータスを変える(browser, [a, b], "入庫待ち");
  await withAdminSession(browser, M0601_ADMIN_ALL, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる(b);
    await list.検索する();
    await list.対象にする(b);
    const r = await list.ダウンロードを押す("戻しリストCSV");
    if (!r.file) throw new Error(`査定ID ${b} の戻しリストCSVが出力されない（棚戻し済みにできない）`);
  });
  notes.set("〔査定ID-M0601-025A〕", a);
  notes.set("〔査定ID-M0601-025B〕", b);
});

const ALPHA = "ABCDEFGHIJK";

/** 068・069: 姓が同じ11件（店舗A・査定前）。登録の古い順に A〜K */
const 同じ姓の11件: (no: string) => Build = (no) => async ({ browser, notes }) => {
  const 姓 = rc(`M0601-${no}`);
  await 申込を行う(browser, 支店URL("A"), Array.from({ length: 11 }, () => 申込者の(姓, "太郎", "カイトリシケン", "タロウ")));
  const ids = await 査定IDを読む(browser, 姓, 11);
  ids.forEach((v, i) => notes.set(`〔査定ID-M0601-${no}${ALPHA[i]}〕`, v));
};
defineSeed("S-M06-01-SORT-PAGE-068", { needs: ["S-M06-01-SHOPS"] }, 同じ姓の11件("068"));
defineSeed("S-M06-01-SORT-COUNT-069", { needs: ["S-M06-01-SHOPS"] }, 同じ姓の11件("069"));

/** 071: 姓がM0601-071の3件と、姓が対照の1件（店舗A・査定前） */
defineSeed("S-M06-01-HITCOUNT-071", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const 姓 = rc("M0601-071");
  await 申込を行う(browser, 支店URL("A"), Array.from({ length: 3 }, () => 申込者の(姓, "太郎", "カイトリシケン", "タロウ")));
  const ids = await 査定IDを読む(browser, 姓, 3);
  ids.forEach((v, i) => notes.set(`〔査定ID-M0601-071${"ABC"[i]}〕`, v));
  const 名 = rc("買取試験071");
  await 申込を行う(browser, 支店URL("A"), [申込者の("対照", 名, "タイショウ", "イチロウ")]);
  notes.set("〔査定ID-M0601-071D〕", (await 査定IDを読む(browser, 名, 1))[0]);
});

