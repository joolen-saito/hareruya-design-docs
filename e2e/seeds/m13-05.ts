/**
 * M13-05 複製新規 のシードの作り方（画面操作）。正本: cases/M13-05_seed_data.tsv
 *
 * - 店舗・フォーマット（S-M13-05-MASTER）: 店舗A・B・Cは、実行の印つきの店名（店舗A-<印>）で店舗登録画面から新しく作って使う（開発環境に同名の店舗が複数あるため。pages/admin/m13_marked_shop.ts）。手順・期待結果の「店舗A」は印つきの店名に読み替える
 *   （店名英語は入力規則が半角英字とスペースだけなので「Shop C」）。形式A・形式Bは、イベント登録画面のフォーマットの選択肢にあればその番号を使い、
 *   無ければフォーマット登録画面で登録する（フォーマット名(英)は必須で半角英数字だけなので「M1305 Format A」など）。
 *   会場A・会場B（会場ID 1350511・1350512）はシード表が「DBへ直接設定する」としていて、画面からは作れない。DB へは書かず、作らなかったことを報告に出す
 *   （そもそもイベント登録画面に会場の入力項目が無い）。ルール適用度・公開状態・イベント規模・支払方法は、マスタデータ管理画面・支払方法設定画面の代わりに、
 *   イベント登録画面の各選択肢にシード表の値があることで確かめる（M13-02 と同じ）。
 * - 管理者（S-M13-05-ADM）: m1305_admin は店舗A・店舗Bを、source_admin は店舗A・店舗Cを編集できる。複数の店舗を扱うので、権限は
 *   「店舗オーナー」（所属店舗しか見えない）でなく「モールオペレーター」にした（正本の「イベント管理を操作できる権限」の代わり）。
 *   所属店舗はどちらも店舗A。source_admin のデフォルト検索表示店舗はシード表に無いので店舗Aにした。
 * - 複製元のイベント（SOURCE-NNN）: source_admin でイベント登録画面から登録し、登録後のイベント編集画面のアドレスの番号を控える（M13-02 と同じ。
 *   一覧で検索して最も大きい番号を読むのと同じ番号）。会場A・備考は入力項目が無いので入れられず、そのことを報告に出す。
 * - イベント名(日)には実行の印を付ける（rc。依頼者決定 2026-10-28）。複製後の名前（「権限エラーイベント」など）も同じ。シード表の「あれば削除して0件」は、
 *   印の付いた名前で検索して確かめる（前の実行の分は名前が違うので当たらない）。ただし 022 の「あ」255文字は、文字数そのものを確かめるので印を付けず、
 *   シード表のとおり前の実行の分を削除して0件にする。
 * - フリー入力エリアの「ケース番号を付けた値」は、項目名(日)=フリー項目n-NNN・項目名(英)=Free Label n-NNN・内容(日)=フリー内容n-NNN・内容(英)=Free Content n-NNN にした。
 *
 * 作らないシード（DBへの直接の書き込み・削除が要る）: S-M13-05-LEGACY-PAY-008（支払方法をコンビニ決済に）・S-M13-05-RELATION-010・S-M13-05-RELATION-034
 * （申込・デッキ登録・チームプレイヤーを決め打ちの番号で）・S-M13-05-ABSENT-011（イベントID 999999 をDBで削除）。これらを使うケースと、
 * 会場の選択肢（DBで作る会場A・会場B）だけを見る012は実装しない。そのケースだけが使う SOURCE-010・SOURCE-012・SOURCE-034 も作らない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { Page } from "@playwright/test";
import { EventInput, FreeArea, ensureNoEvent, openEventCreate } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { ensureMarkedTenant, 印店名 } from "../pages/admin/m13_marked_shop";
import { ensureFormat, 複製元を登録する, 長い名前のイベントを無くす } from "../pages/admin/m13_05_copy";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";

/** S-M13-05-ADM の試験管理者（店舗A・店舗Bを編集できる。店舗Cは編集できない） */
export const M1305_ADMIN: Account = { loginId: "m1305_admin", password: "Passw0rd!M1305" };
/** S-M13-05-ADM の複製元の登録者（店舗A・店舗Cを編集できる） */
export const M1305_SOURCE_ADMIN: Account = { loginId: "source_admin", password: "Passw0rd!M1305src" };

/** 複製元のイベント名(日)（印つき） */
export const 複製元の名前 = (n: string) => rc(`複製元イベント日-${n}`);
/** 複製後に入れるイベント名(日)（印つき） */
export const 名 = {
  権限エラー: rc("権限エラーイベント"), 権限外登録: rc("権限外登録イベント"), 複製登録: rc("複製登録イベント"), 任意項目空: rc("任意項目空イベント"),
  入力保持: rc("入力保持イベント"), 数値8桁: rc("数値8桁イベント"), 選択肢A: rc("選択肢イベントA"), 選択肢B: rc("選択肢イベントB"), 選択肢C: rc("選択肢イベントC"),
  新規採番: rc("新規採番イベント"), 登録者確認: rc("登録者確認イベント"), 複製元非更新: rc("複製元非更新イベント"), 新規共通仕様: rc("新規共通仕様イベント"),
  複製共通仕様: rc("複製共通仕様イベント"), 遷移確認: rc("遷移確認イベント"), メッセージ確認: rc("メッセージ確認イベント"),
  権限外店舗: rc("権限外店舗イベント-002"), QK複製元: rc("QK複製元大会-1305-001"), QK複製後: rc("QK複製後大会-1305-001"),
};
/** 022 のイベント名(日)。文字数そのものを確かめるので印を付けない */
export const あ255 = "あ".repeat(255);


defineSeed("S-M13-05-MASTER", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1305-共有A〕", await ensureMarkedTenant(page, "A", issue));
    notes.set("〔店舗ID-M1305-共有B〕", await ensureMarkedTenant(page, "B", issue));
    notes.set("〔店舗ID-M1305-共有C〕", await ensureMarkedTenant(page, "C", issue));
    notes.set("〔フォーマットID-M1305-共有A〕", await ensureFormat(page, "形式A", "M1305 Format A"));
    notes.set("〔フォーマットID-M1305-共有B〕", await ensureFormat(page, "形式B", "M1305 Format B"));
    issue("会場A（会場ID 1350511）・会場B（会場ID 1350512）は、シード表が DB への直接設定としているため作っていない（イベント登録画面にも会場の入力項目が無い）");
    const form = await openEventCreate(page);
    const 求める: [string, string[], string[]][] = [
      ["ルール適用度", ["初心者歓迎", "カジュアル対戦", "上級者向け"], await form.options(form.ルール適用度)],
      ["公開状態", ["公開", "非公開", "限定公開"], await form.options(form.公開状態)],
      ["イベント規模", ["大型イベント", "特別イベント"], await form.options(form.イベント規模)],
      ["支払方法", ["クレジットカード決済"], await form.支払方法の選択肢()],
    ];
    for (const [欄, want, have] of 求める) {
      const 無い = want.filter((x) => !have.includes(x));
      if (無い.length) issue(`イベント登録画面の${欄}に、シード表の選択肢「${無い.join("」「")}」が無い（ある選択肢: ${have.join("、")}）`);
    }
  });
});

defineSeed("S-M13-05-ADM", { needs: ["S-M13-05-MASTER"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔管理者ID-M1305-共有〕", await ensureMember(page, {
      名前: "M13-05 試験管理者", 所属店舗: 印店名.A, ログインID: M1305_ADMIN.loginId, メールアドレス: "m1305_admin@example.test",
      パスワード: M1305_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 印店名.A, 編集可能店舗: [印店名.A, 印店名.B],
    }));
    await ensureMember(page, {
      名前: "M13-05 複製元登録者", 所属店舗: 印店名.A, ログインID: M1305_SOURCE_ADMIN.loginId, メールアドレス: "m1305_source_admin@example.test",
      パスワード: M1305_SOURCE_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 印店名.A, 編集可能店舗: [印店名.A, 印店名.C],
    });
  });
});

/** 複製元に共通の値（店舗A・形式A・初心者歓迎・限定公開・定員32・参加費1000）。シードごとの値は over で与える。書いていない項目は初期表示のまま */
export function 複製元(n: string, over: EventInput = {}): EventInput {
  return {
    イベント名日: 複製元の名前(n), イベント名英: `Source Event-M1305-${n}`, 店舗: 印店名.A, フォーマット: ["形式A"], ルール適用度: "初心者歓迎",
    公開状態: "限定公開", 定員: "32", 参加費: "1000", ...over,
  };
}
const 形式AB = { フォーマット: ["形式A", "形式B"] };
const 大型 = { イベント規模: "大型イベント" };
const チーム戦 = { チーム戦: true };
const クレカ = { 支払方法: ["クレジットカード決済"] };
export const バナー = { バナーURL日: "https://replace-dev.hareruyamtg.com:8443/banner-jp", バナーURL英: "https://replace-dev.hareruyamtg.com:8443/banner-en" };
export const 賞品 = { 賞品日: "複製元賞品", 賞品英: "Source Prize" };
export const 備考: [string, string] = ["複製元備考", "Source Note"];
/** フリー入力エリア1〜3にケース番号を付けた値。アコーディオン表示（初期表示は閉じる）はエリア1オン・エリア2オフ・エリア3オン */
export function フリー入力エリアの値(n: string): [FreeArea, FreeArea, FreeArea] {
  const a = (i: number, 閉じる: boolean): FreeArea => ({ 項目名日: `フリー項目${i}-${n}`, 項目名英: `Free Label ${i}-${n}`, 内容日: `フリー内容${i}-${n}`, 内容英: `Free Content ${i}-${n}`, 初期表示は閉じる: 閉じる });
  return [a(1, true), a(2, false), a(3, true)];
}
const 全項目 = (n: string) => ({ ...形式AB, ...大型, ...バナー, ...チーム戦, ...クレカ, ...賞品, フリー入力エリア: フリー入力エリアの値(n) });

/**
 * source_admin でイベント登録画面から複製元を登録し、イベントIDを控える。
 * before: 登録の前に行う「あれば削除して0件」、after: 登録のあとに行う「あれば削除して0件」（シード表の投入方法の順）
 */
function defineSourceSeed(seedId: string, label: string, input: EventInput, opt: { 備考?: [string, string]; before?: (page: Page) => Promise<void>; after?: (page: Page) => Promise<void> } = {}): void {
  defineSeed(seedId, { needs: ["S-M13-05-ADM"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, M1305_SOURCE_ADMIN, async (page) => {
      if (opt.before) await opt.before(page);
      notes.set(label, await 複製元を登録する(page, input, { 会場: "会場A", 備考: opt.備考 }, (m) => reportSeedIssue(seed.シードID, m)));
      if (opt.after) await opt.after(page);
    });
  });
}
const 無くす = (...names: string[]) => async (page: Page) => { for (const x of names) await ensureNoEvent(page, x); };

defineSourceSeed("S-M13-05-SOURCE-001", "〔イベントID-M1305-001〕", 複製元("001", 全項目("001")), { 備考 });
defineSourceSeed("S-M13-05-SOURCE-NOAUTH-002", "〔イベントID-M1305-002〕", 複製元("002", { イベント名日: 名.権限外店舗, イベント名英: "Unauthorized Shop Event-M1305-002", 店舗: 印店名.C }));
defineSourceSeed("S-M13-05-SOURCE-003", "〔イベントID-M1305-003〕", 複製元("003", { ...形式AB, ...大型, ...チーム戦, ...クレカ }));
defineSourceSeed("S-M13-05-SOURCE-004", "〔イベントID-M1305-004〕", 複製元("004"), { after: 無くす(名.権限エラー) });
defineSourceSeed("S-M13-05-SOURCE-005", "〔イベントID-M1305-005〕", 複製元("005"), { after: 無くす(名.権限外登録) });
defineSourceSeed("S-M13-05-SOURCE-007", "〔イベントID-M1305-007〕", 複製元("007", 全項目("007")), { 備考 });
defineSourceSeed("S-M13-05-SOURCE-009", "〔イベントID-M1305-009〕", 複製元("009", チーム戦));
defineSourceSeed("S-M13-05-SOURCE-013", "〔イベントID-M1305-013〕", 複製元("013", 形式AB));
defineSourceSeed("S-M13-05-SOURCE-014", "〔イベントID-M1305-014〕", 複製元("014", チーム戦));
defineSourceSeed("S-M13-05-SOURCE-015", "〔イベントID-M1305-015〕", 複製元("015", { チーム戦: false }));
defineSourceSeed("S-M13-05-SOURCE-017", "〔イベントID-M1305-017〕", 複製元("017"), { before: 無くす(複製元の名前("017")) });
defineSourceSeed("S-M13-05-SOURCE-018", "〔イベントID-M1305-018〕", 複製元("018", { ...形式AB, ...大型, ...チーム戦, ...クレカ }), { after: 無くす(名.複製登録) });
// イベント規模以外の任意項目にも値を入れる（シード表: 任意の値）
defineSourceSeed("S-M13-05-SOURCE-019", "〔イベントID-M1305-019〕", 複製元("019", { ...大型, ...バナー, ...チーム戦, ...クレカ, ...賞品, フリー入力エリア: フリー入力エリアの値("019") }), { 備考, after: 無くす(名.任意項目空) });
defineSourceSeed("S-M13-05-SOURCE-021", "〔イベントID-M1305-021〕", 複製元("021"), { after: 無くす(名.入力保持) });
defineSourceSeed("S-M13-05-SOURCE-022", "〔イベントID-M1305-022〕", 複製元("022"), { after: (page) => 長い名前のイベントを無くす(page, "あ".repeat(50), あ255) });
defineSourceSeed("S-M13-05-SOURCE-024", "〔イベントID-M1305-024〕", 複製元("024"), { before: 無くす(複製元の名前("024")) });
defineSourceSeed("S-M13-05-SOURCE-028", "〔イベントID-M1305-028〕", 複製元("028"), { after: 無くす(名.数値8桁) });
defineSourceSeed("S-M13-05-SOURCE-030", "〔イベントID-M1305-030〕", 複製元("030"), { after: 無くす(名.選択肢A, 名.選択肢B, 名.選択肢C) });
defineSourceSeed("S-M13-05-SOURCE-031", "〔イベントID-M1305-031〕", 複製元("031"), { after: 無くす(名.新規採番) });
defineSourceSeed("S-M13-05-SOURCE-032", "〔イベントID-M1305-032〕", 複製元("032"), { after: 無くす(名.登録者確認) });
defineSourceSeed("S-M13-05-SOURCE-033", "〔イベントID-M1305-033〕", 複製元("033", { ...形式AB, ...大型, ...チーム戦, ...クレカ }), { after: 無くす(名.複製元非更新) });
defineSourceSeed("S-M13-05-SOURCE-035", "〔イベントID-M1305-035〕", 複製元("035"), { after: 無くす(名.新規共通仕様, 名.複製共通仕様) });
defineSourceSeed("S-M13-05-SOURCE-036", "〔イベントID-M1305-036〕", 複製元("036"), { after: 無くす(名.遷移確認) });
defineSourceSeed("S-M13-05-SOURCE-037", "〔イベントID-M1305-037〕", 複製元("037"), { after: 無くす(名.メッセージ確認) });

// QK連携（039）。QK連携店舗と qk1302admin は M13-02 の共有シード（seeds/m13-02-qk.ts）
defineSeed("S-M13-05-QK-EVENT-039", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    notes.set("〔イベントID-M1305-QK001〕", await 複製元を登録する(page, {
      イベント名日: 名.QK複製元, イベント名英: "QK Source 1305-001", 店舗: QK連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "500",
    }, {}, (m) => reportSeedIssue(seed.シードID, m)));
    await ensureNoEvent(page, 名.QK複製後);
  });
});
