# 画面遷移ルール（到達要件）

結合テストは「その画面が正しいこと」だけでなく「その画面に正規の手順で到達できること」を検証する。
単体URLを直接開いて済ませると、遷移そのものの欠陥を見逃し、直アクセス時のガード
（トップへ戻す・ログインへ誘導する等）を踏んで無関係な失敗になる。

## 1. 到達クラス

| クラス | 意味 | テストでの扱い |
|---|---|---|
| `entry-direct` | 直URLで正規に到達できる入口画面（一覧・トップ・ログイン等） | `enter()` で直接入ってよい |
| `transition-only` | 直URLでは正規表示されない画面（確認・完了・ウィザード中間・注文コンテキスト前提） | `reachVia()` で起点から遷移して到達する |
| `action-endpoint` | 送信専用エンドポイント（POST/PUT/PATCH/DELETE のみ。GET入口が設計書に無い） | 画面ではない。GETで開かず、画面上の操作で発火させる |
| `要確認` | 設計書だけでは直アクセス可否を断定できない画面 | 判定を保留する。断定して `transition-only` / `entry-direct` にしない |
| `非画面(API/バッチ)` | 画面を持たない機能 | 画面到達の対象外（APIレイヤで検証する） |

`要確認` を使う場面（実例）:

- 設計書の入口表に `GET /...` が単独入口として明記されているが、画面遷移表では遷移先でもあり、
  直アクセス時の扱いが規定されていない（例: F04-02 `/shopping/shopping_error`。md:68 と md:301）。
- 状態（ロック済みカート等）が要ることは読み取れるが、「状態が揃っていても直URLでは正規表示されない」
  「前画面経由でのみ到達できる」とは書かれていない（例: F04-02 `/shopping`。md:62 に GET 入口があり、
  md:299-301 は状態欠落時の戻し先を規定するだけ）。**状態前提と遷移必須は別物**で、前者だけでは
  `transition-only` と断定できない。対して F04-04 `/shopping/complete` は「注文確定からの
  リダイレクトで到達する」（md:70）と明示されているため `transition-only` に確定できる。
- 「購入手続き中の…画面」のような対象範囲の説明はあるが、直アクセス不可の規定もガードも無い
  （例: F04-03 `/shopping/delivery/{id}/edit`。md:19 は範囲説明であって到達規定ではない）。

こうした行を `transition-only` と断定すると、設計書に無い制約をテストに持ち込むことになる。
実機確認等で確定するまで `要確認` に置き、監査は warn として可視化する。

到達クラスの正は **`e2e/config/screen-reachability.tsv`**（根拠 file:line 付きの確定台帳）。
台帳に無いパスは判定しない。推測で `entry-direct` 扱いにしない。

## 2. 台帳の作り方（捏造ゼロ）

到達クラスは設計書（正本md）の次の3節からのみ確定する。

1. `## 利用者視点の入口` … 入口 / URLエンドポイント / 期待されるふるまい
2. `## 画面遷移` … 条件 / 遷移先
3. `### 遷移時に引き継ぐ状態` … 起点 / 遷移前の処理 / 遷移後の初期状態

手順:

```bash
# 設計書から到達事実を決定的に抽出（推測しない）
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --repo .
# → e2e/reports/screen-transitions.tsv              （事実・EVID付き）
# → e2e/reports/screen-reachability-suggested.tsv   （候補・未確定）
```

候補は**確定値ではない**。`e2e/config/screen-reachability.tsv` へ次を書いて初めて確定する。

- `到達クラス`
- `正規到達経路`（`/cart >「購入手続きへ」> /shopping >「注文する」> /shopping/complete` の形式）
- `直アクセス時の期待`（設計書がガードを定めている場合。複数あれば `;` 区切りで並記）
- `根拠(file:line)`（`;` 区切りで複数可）／`根拠要約`／`確定状態`／`確定者`／`確定日`

設計書に規定が無いものは `未確定（要実機確認）` と書く。埋めるために推測しない。

判定の注意:

- `到達クラス` は **GET（画面到達）に対する分類**。同じパスにPOST入口があっても、
  GETの入口が設計書にあるなら画面として分類する（`action-endpoint` は GET入口が無いパスのみ）。
- 母集合TSVの `テスト観点` 列（「未認証」等）は生成器由来の汎用ラベルで、
  直アクセス試験であることを意味しない。観点列で到達要件を免除しない。

## 3. ケース表（具体化TSV）の書き方

遷移必須画面を対象にする行は、**起点画面から目的画面までの遷移鎖**で書く。

- `操作手順/実行方法`: 起点画面から矢印（→）で連鎖させ、各段の操作を画面上の操作で書く。
  例: `SEED投入→買い物かご画面（/cart）を開く→「購入手続きへ」進む→ご注文方法指定画面（/shopping）で内容を確認→「注文する」で確定→購入完了画面（/shopping/complete）に到達→…`
- `入力データ/リクエスト内容`: 目的画面の単体リクエストだけを書かない。
  **起点と遷移トリガを併記**する。例: `起点 GET /{_locale}/cart →「購入手続きへ」→ POST /shopping →（成功）→ GET /{_locale}/shopping/complete`
- 直アクセスそのものが観点の行（未認証直アクセス・状態欠落時のガード・URL契約検証）は、
  手順に「直接アクセス」等の逐語を書き、期待結果を台帳の `直アクセス時の期待` と噛み合わせる。

## 4. Page Object / spec の書き方

`page.goto()` を spec / Page Object から直接呼ばない。`e2e/helpers/navigation.ts` を使う。
さらに **spec は `e2e/fixtures/reachability.fixture.ts` の `test` を import する**。
このフィクスチャが `page.goto` 自体を差し替えて台帳と照合するため、
ヘルパーを使い忘れた生の `goto` も実行時に止まる（ヘルパー経由の到達は検査済みとして素通しする）。

```ts
import { test, expect } from "../../fixtures/reachability.fixture";
import { enter, reachVia, directAccess } from "../../helpers/navigation";

// 起点画面（entry-direct）
await enter(page, `${localePrefix}/cart`);

// 遷移必須画面（transition-only）— 起点から遷移して到達する
await reachVia(
  page,
  `${localePrefix}/cart`,
  [
    { label: "「購入手続きへ」", action: () => cart.clickCheckout(), expectUrl: /\/shopping(\?|$)/ },
    { label: "「注文する」", action: () => shopping.clickOrder() },
  ],
  /\/shopping\/complete(\?|$)/
);

// 直アクセスそのものが観点のときだけ（理由必須・レポートに記録される）
await directAccess(page, `${localePrefix}/shopping/complete`, "受注IDなしでの直アクセス時にトップへ戻ることの検証");
```

- `reachVia()` / `step()` の `action` の中で `page.goto()` を呼ばない（それは遷移ではなく直アクセス）。
  実行時に封鎖されて失敗する。
- `directAccess()` は起点画面（`entry-direct`）には使えない。通常到達は `enter()`。
- Page Object は目的画面のURLを保持してよいが、**そのURLへ `goto` する到達メソッドを
  `transition-only` 画面に対して生やさない**。到達は spec 側で `reachVia()` により組む。
- どうしても spec/Page Object で `page.goto()` を書く場合（直アクセス観点）は、
  直前8行以内に `@direct-access: <理由>` を書く。書かないと静的監査で error になる。

## 5. 検査

```bash
# 抽出の回帰テスト
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --selftest

# 静的監査（コード + ケース表）。量産対象は --scope で指定し、対象内の未登録を error にする
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py \
  --repo . --scope F04 --strict

# 台帳カバレッジ100%を要求する（未判定を合格に見せない・未登録が残れば exit 2）
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py \
  --repo . --require-registry-coverage

# ハーネス自己検査（稼働中アプリ不要）
cd e2e && npx playwright test spec/_harness/navigation.selfcheck.spec.ts
```

`audit_transition_paths.py` の判定:

| 種別 | 重大度 | 内容 |
|---|---|---|
| `A-直アクセス` | error | 遷移必須画面へ `page.goto`。`@direct-access` 宣言も無い |
| `A-送信系へGET` | error | 送信専用エンドポイントへ `page.goto` |
| `A-要確認` | warn | 到達クラス未確定の画面。確定するまで判定しない |
| `A-fixture未適用` | warn（`--scope` 対象内は error） | 画面へ遷移する spec が `reachability.fixture` を使っていない＝実行時強制の外 |
| `A-base_test併用` | warn（`--scope` 対象内は error） | fixture を import しつつ `@playwright/test` の `test` も取り込んでいる（base の test で書いたケースは強制の外） |
| `A-fixture外Page` | warn（同上） | `newContext` / `newPage` / `launchPersistentContext` / `waitForEvent("page")` で作った Page に `guardPage()` / `guardContext()` を当てていない |
| `A-guard手動適用(要目視)` | warn | Page を生成し guard も呼んでいるが、生成した対象に当たっているかは静的に確認していない |
| `A-未登録` | warn（`--scope` 対象内は error） | 到達クラスが台帳に無く判定できない |
| `B-経路欠落` | error | 手順が台帳の正規到達経路（起点・各遷移トリガ・目的画面）を順序どおり満たしていない |
| `B-TSVヘッダ不一致` | error | ケース表のヘッダが規定の列と一致しない（欠落・余分・重複） |
| `B-TSVフェンス複数` | warn | ```tsv フェンスが複数ある（検査するのは1本目のみ） |
| `B-台帳の経路未定義` | error | 遷移必須画面なのに台帳の正規到達経路が分解できない |
| `B-要確認` | warn | 到達クラス未確定の画面を対象にしている |
| `B-直アクセス免除` | warn | 手順の逐語により直アクセス試験とみなして経路要件を免除した（黙って通さない） |
| `B-入力データが単体リクエスト` | warn | 手順には経路があるが入力データ列が単体リクエストのみ |
| `B-直アクセス期待の不一致` | warn | 直アクセス試験の期待結果が台帳のガードと噛み合っていない |
| `B-TSV破損` | error | ケース表の列数がヘッダと不一致（改行を含むセルの引用符落ち等） |

実行時の強制は2層。

1. `e2e/fixtures/reachability.fixture.ts` … `context` を差し替え、その配下で生まれる**すべての Page**
   （fixture の page・`context.newPage()`・ポップアップ）の `page.goto` を台帳と照合する。
   テスト内で `browser.newContext()` を自分で作る場合は `guardContext()` / `guardPage()` を明示的に呼ぶ
   （呼び忘れは静的監査 `A-fixture外Page` で検出する）。
2. `e2e/helpers/navigation.ts` … `enter` / `reachVia` / `step` / `directAccess` の契約違反を止める
   （`step` の action 内 goto の封鎖、`enter` は entry-direct 専用、起点画面への `directAccess` の禁止、
   曖昧一致の停止を含む）

**`B-経路欠落` の性質**: これは**記述規約への適合検査**であって経路の意味検査ではない。
台帳の経路トークン（起点パス・操作ラベル・目的パス）が手順テキストに順序どおり現れるかを見るだけで、
「押さない」等の否定文や表記揺れは区別できない。ケース表に構造化列（起点URL・操作・期待到達URL）を
設けるまでは、この検査を「経路が正しいことの証明」として扱わない。

**実行時強制の限界（自己検査で明示している）**: `step()` の封鎖は action の実行区間だけ有効で、
`setTimeout` 等で区間外へ逃がした goto は止められない（フィクスチャ適用済みの page なら
区間外でもフィクスチャのガードが残るため止まるが、未適用の page では素通りする）。APIRequestContext（`request.get()` 等）は
画面到達ではないため検査対象外であり、UI到達の代替に使ってはならない。
このため実行時強制だけに頼らず、静的監査（`A-直アクセス` / `A-fixture未適用` / `A-base_test併用` /
`A-fixture外Page`）を併用する。

**静的監査の限界（AST未導入）**: 検出は正規表現と文字列一致で行っており、変数単位の追跡をしていない。
`guardPage()` が同一ファイルにあるだけでは生成した Page に当たっている保証がないため、
黙って免除せず `A-guard手動適用(要目視)` として必ず列挙する。再export経由の base test など
未対応の書き方は検出できない。量産対象を広げる前に TypeScript AST での import binding /
生成オブジェクト追跡へ置き換えることが望ましい。

`E2E_REACHABILITY_ENFORCE=warn` で移行期間中は両方を警告に落とせる。
`directAccess()` の理由は Playwright の annotation（`direct-access`）として実行結果に残る。
静的監査レポートは annotation を読まない（別レイヤ）。

## 6. 量産の前提と、いま守れていない範囲

**error 0 は「違反なし」ではない。** 台帳に登録されたパスしか判定していない。
監査レポートの「到達台帳カバレッジ」を必ず併読する。

量産の前提条件:

1. 対象機能の画面パスを台帳へ登録し、`--scope <機能ID>` で `A-未登録(対象内)` を 0 にする。
2. 対象機能の spec を `reachability.fixture` + `navigation.ts` へ移行する。
   既存specが生の `page.goto` を使っている限り、その機能の到達性は静的warnと未判定のままになる。
3. `--strict` を通す（error 0）。

未着手の債務（把握しているもの・レポートの数値で確認できる）:

- 既存 spec の大半は `reachability.fixture` を使っておらず（`A-fixture未適用`）、実行時強制の外にある。
- 台帳の登録は F04 系＋依存画面（F06-03 ログイン）のみ。残りは未登録＝未判定。
  **カバレッジの値は本書に書かない。** 判断は必ず `e2e/reports/transition-path-audit.md` の
  「到達台帳カバレッジ」行（監査実行のたびに更新される実測値）で行う。
  `error 0` は台帳に登録済みのパスについての 0 であり、未登録分は判定していない。
- 動的に組み立てられて静的解決できない `goto` は監査の死角として件数のみ計上している。
- ケース表の `B-入力データが単体リクエスト` が多数残っている（件数はレポート参照）。
- `SEED-F04-04-CHECKOUT` 等のシードはケース表の台帳にあるだけで、`e2e/seed/manifest.json` に
  実体（apply/teardown）が無い。該当ケースは `test.fixme` のままで、live 化には実シードの実装が要る。

したがって現時点は「F04 系については量産テンプレとして成立、全体としては未達」。
量産を広げるときは機能単位で `--scope` を足し、その機能について台帳100%・fixture移行・
`--strict` error 0 を満たしてから次へ進む。
