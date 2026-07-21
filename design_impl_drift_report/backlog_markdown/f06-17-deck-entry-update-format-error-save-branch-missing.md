/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録確認～完了
課題カテゴリ：実装漏れ
課題：書式エラー時にデッキを保存せず入力を保持して編集画面へ戻らない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. デッキ登録可能なイベントを持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` を表示する
2. メインボードまたはサイドボードに `abc ラノワールのエルフ` など「半角数字＋半角スペース＋カード名」ではない行を入力し、「デッキリストを提出する」を押下する
3. デッキ登録完了画面へ遷移せず、入力内容とエラー内容を保持した状態でデッキ編集画面へ戻るか確認する
4. 同一イベント詳細・選手・フォーマットのデッキが保存または上書きされていないことを確認する

# 期待される挙動【必須】
- 更新確定時にメイン・サイドのカードリスト文字列をアリーナ表記から実カード名へ変換する
- 変換後のメイン・サイドのカードリストを解析し、解析結果が整数のエラーコードであれば書式エラーとして扱う
- 書式エラー時は入力テキストとエラー内容をセッションに保持し、デッキ編集画面へリダイレクトする
- 書式エラー時はデッキを保存しない
- 編集画面表示時にセッションから入力とエラー内容を復元し、復元後にセッションから削除する

# 現在の挙動【必須】
- ec-cube-enterprise の `DeckEntryController::entry()` は `deckMain` / `deckSide` をリクエストから文字列として取り出して `DeckEntryInput` に渡し、そのまま `DeckEntryAction::handle()` を呼ぶ。`CardUtil::decodeCardlist` 相当の解析、整数エラーコード判定、セッションへの入力・エラー退避、編集画面へのリダイレクト分岐はこの更新処理に存在せず、処理後は常に `mypage_deckentry_check` へリダイレクトする。

ec-cube-enterprise entryはdeckMain/deckSideを生文字列で渡して即handleする: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99-154`
```php
    public function entry(Request $request, int $eventDetailId): RedirectResponse
    {
        $this->isTokenValid();

        /** @var Customer $Customer */
        $Customer = $this->getUser();
        $Player = $Customer->getPlayer();
        if ($Player === null) {
            throw new NotFoundHttpException();
        }

        $EventDetail = $this->eventDetailRepository->find($eventDetailId);
        if ($EventDetail === null || !$EventDetail->canBeRegisteredDeck()) {
            throw new NotFoundHttpException();
        }

        $Event = $EventDetail->getEvent();
        $Formats = $Event->getFormats();

        $selectableFormats = $Formats->filter(fn (MtbFormat $f) => $f->isRankingFlg() || $f->isOtherMetaFlg());

        $formatId = (int) $request->request->get('format', 0);
        $Format = null;
        if ($selectableFormats->isEmpty()) {
            $Format = $Formats->isEmpty() ? null : $Formats->first();
        } else {
            foreach ($selectableFormats as $f) {
                if ($f->getId() === $formatId) {
                    $Format = $f;
                    break;
                }
            }
        }

        if (!$Format instanceof MtbFormat) {
            throw new NotFoundHttpException();
        }

        $input = new DeckEntryInput(
            Player: $Player,
            EventDetail: $EventDetail,
            Format: $Format,
            textMain: (string) $request->request->get('deckMain', ''),
            textSide: (string) $request->request->get('deckSide', ''),
        );

        $Deck = $this->deckEntryAction->handle($input);

        try {
            $this->mailService->sendDeckEntryCompleteMail($Customer, $Deck);
        } catch (\Throwable $e) {
            log_critical('デッキ登録完了メール送信に失敗しました。deckId='.$Deck->getId().': '.$e->getMessage());
        }

        return $this->redirectToRoute('mypage_deckentry_check', ['deckId' => $Deck->getId()]);
    }
```

ec-cube-enterprise handleは入力文字列を保存してflushする: `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83`
```php
    public function handle(DeckEntryInput $input): DtbDeck
    {
        $now = new \DateTime();

        $Deck = $this->deckRepository->findOneBy([
            'Player' => $input->Player,
            'EventDetail' => $input->EventDetail,
            'Format' => $input->Format,
        ]);

        if ($Deck !== null) {
            $Deck
                ->setTextMain($input->textMain)
                ->setTextSide($input->textSide)
                ->setUpdateDate($now);
        } else {
            /** @var MtbDisp $Disp */
            $Disp = $this->entityManager->find(MtbDisp::class, MtbDisp::DISPLAY_HIDE);
            /** @var MtbDeckType $DeckType */
            $DeckType = $this->entityManager->find(MtbDeckType::class, MtbDeckType::EVENT_ID);

            $Deck = (new DtbDeck())
                ->setPlayer($input->Player)
                ->setPlayerName($this->resolvePlayerName($input->Player))
                ->setEventDetail($input->EventDetail)
                ->setEventNameJp($input->EventDetail->getEventNameJp())
                ->setEventNameEn($input->EventDetail->getEventNameEn())
                ->setEventDate($input->EventDetail->getStartDate())
                ->setFormat($input->Format)
                ->setTextMain($input->textMain)
                ->setTextSide($input->textSide)
                ->setPrivateFlg(true)
                ->setLatestFlg(false)
                ->setRegulationViolationFlg(false)
                ->setDisp($Disp)
                ->setDeckType($DeckType)
                ->setCreateDate($now)
                ->setUpdateDate($now);
        }

        $Deck->setMember(null);

        $this->entityManager->persist($Deck);
        $this->entityManager->flush();

        return $Deck;
    }
```

ec-cube-enterprise DeckEntryInputは生文字列のみを持つ: `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ActionInput/DeckEntryInput.php:22-31`
```php
final readonly class DeckEntryInput
{
    public function __construct(
        public DtbPlayer $Player,
        public DtbEventDetail $EventDetail,
        public MtbFormat $Format,
        public string $textMain,
        public string $textSide,
    ) {
    }
```
- ベース実装 pf-eccube3 は `CardUtil::convertCardNamesFromArenaFormat()` でアリーナ表記を変換し、`CardUtil::decodeCardlist()` の結果が integer の場合に `$errorMain` / `$errorSide` を設定する。エラー時は `hareruyaec.evententry.main_text` などのセッションキーへ入力とエラーを保存し、`deckentry_edit` へ戻すため、この時点ではデッキ保存処理へ進まない。編集画面側では同じセッションキーを読み出して復元し、削除している。

ベース実装 pf-eccube3 editは書式エラー時のセッション入力を復元して削除する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:68-76`
```php
        // 書式エラーリダイレクト時入力を復元
        $textMain = $app['session']->get('hareruyaec.evententry.main_text');
        $textSide = $app['session']->get('hareruyaec.evententry.side_text');
        $errorMain = $app['session']->get('hareruyaec.evententry.error_main');
        $errorSide = $app['session']->get('hareruyaec.evententry.error_side');
        $app['session']->remove('hareruyaec.evententry.main_text');
        $app['session']->remove('hareruyaec.evententry.side_text');
        $app['session']->remove('hareruyaec.evententry.error_main');
        $app['session']->remove('hareruyaec.evententry.error_side');
```

ベース実装 pf-eccube3 updateは解析エラー時にセッション保存してeditへ戻す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:149-197`
```php
    public function update(Application $app, Request $request, $eventDetailId)
    {
        $this->checkCsrfValid($app);

        $Customer = $app['user'];

        $this->app = $app;

        $player = $app['hareruya_ec.repository.player']->findOneByCustomer($Customer);
        $eventDetail = $app['hareruya_ec.repository.event_detail']->find($eventDetailId);
        if (!$player) {
            return $app->abort(Response::HTTP_NOT_FOUND);
        }
        $format = $this->getSelectedFormat($eventDetail->getEvent()->getFormats(), $request->get('format'));
        if (!$format) {
            return $app->abort(Response::HTTP_NOT_FOUND);
        }
        if ($this->deckEntryProblems($eventDetail) != $this::NO_PROBLEMS) {
            return $app->abort(Response::HTTP_NOT_FOUND);
        }

        // アリーナカード名を実カード名に変換したカードリスト文字列を取得
        $deckMainText = CardUtil::convertCardNamesFromArenaFormat($app, $request->get('deckMain'));
        $deckSideText = CardUtil::convertCardNamesFromArenaFormat($app, $request->get('deckSide'));
        $errorMain = null;
        $errorSide = null;

        // メイン/サイドボード入力内容確認
        $main = CardUtil::decodeCardlist($app, $deckMainText);
        if (gettype($main) === 'integer') {
            $errorMain = $main;
        }
        $side = CardUtil::decodeCardlist($app, $deckSideText);
        if (gettype($side) === 'integer') {
            $errorSide = $side;
        }

        // 書式エラー時セッションに入力を保持してリダイレクト
        if ($errorMain || $errorSide) {
            $app['session']->set('hareruyaec.evententry.main_text', $deckMainText);
            $app['session']->set('hareruyaec.evententry.side_text', $deckSideText);
            $app['session']->set('hareruyaec.evententry.error_main', $errorMain);
            $app['session']->set('hareruyaec.evententry.error_side', $errorSide);

            return $app->redirect($app->path('deckentry_edit', [
                'eventDetailId' => $eventDetailId,
                'format' => $format,
            ]));
        }
```

ベース実装 pf-eccube3 updateはエラー分岐後にだけ保存する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:199-257`
```php
        // デッキ登録済みなら更新・異なるならば新規作成
        $deck = $this->app['hareruya_ec.repository.deck']->findOneBy([
            'eventDetailId' => $eventDetailId,
            'player' => $player,
            'format' => $format,
        ]);

        if ($deck) {
            // 登録済みのデッキを上書き
            $deck->setTextMain($deckMainText)
                ->setTextSide($deckSideText)
                ->setUpdateDate(date('Y/m/d H:i:s'))
                ->setFormat($format);

            // デッキ内の登録済カード情報のリセット
            foreach ($deck->getDeckCards() as $deckCard) {
                $app['orm.em']->remove($deckCard);
            }
        } else {
            $deck = new DtbDeck();
            $playerName = $player->getLastNameEn() . ' ' . $player->getFirstNameEn();
            if (empty(str_replace(' ', '', $playerName))) {
                $playerName = (!is_null($Customer->getPref()) && $Customer->getPref()->getId() === Pref::PREF_ABROAD) ? $Customer->getName01() . ' ' . $Customer->getName02() : $Customer->getKana01() . ' ' . $Customer->getKana02();
            }
            $deck->setPlayer($player)
                ->setPlayerName($playerName)
                ->setDciNo($player->getDciNo())
                ->setEventDetail($eventDetail)
                ->setEventNameJp($eventDetail->getEventNameJp())
                ->setEventNameEn($eventDetail->getEventNameEn())
                ->setEventDate($eventDetail->getStartDate())
                ->setTextMain($deckMainText)
                ->setTextSide($deckSideText)
                ->setDisp($app['eccube.repository.master.disp']->find(Disp::DISPLAY_HIDE))
                ->setFormat($format)
                ->setDeckType($app['hareruya_ec.repository.deck_type']->find(MtbDeckType::EVENT_ID))
            ;
        }

        // カード登録
        CardUtil::setDeckCards($app, $main, $deck, MtbBoard::BOARD_ID_MAIN);
        CardUtil::setDeckCards($app, $side, $deck, MtbBoard::BOARD_ID_SIDE);

        // 編集者削除
        $deck->setMemberId(null);

        // DB更新
        $app['orm.em']->persist($deck);
        $app['orm.em']->flush($deck);


        $app['orm.em']->flush();

        $app['hareruya_ec.service.mail']->sendDeckEntryCompleteMail($deckMainText, $deckSideText, $player);

        return $app->redirect($app->url('deckentry_check', [
            'deckId' => $deck->getDeckId(),
        ]));
    }
```

# 根拠
- 設計：
  - F06-17 更新確定時の処理フロー: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4858-4861`
  - F06-17 画面遷移とエラー処理: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4901-4906`
  - F06-16 編集画面側の入力保持・復元要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4576`
- ec-cube-enterprise：
  - 更新処理は書式解析せずhandle後に完了画面へ進む: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137-153`
  - 保存サービスは入力文字列をそのまま保存する: `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/DeckEntryAction.php:47-80`
- ベース実装：
  - pf-eccube3 はCardUtil解析エラー時に保存前にeditへ戻す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:170-197`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json#f06-17_0306_sheet-14_sheet-conformance-3036c065c8ff'`
- 確認コマンド: `rg -n "書式エラー|入力テキストとエラー内容|デッキは保存しない|デッキ登録を確定する|半角数字＋半角スペース|登録せず編集画面" excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "DeckEntryInput|textMain|textSide|deckMain|deckSide|handle\(|persist\(|flush\(|redirectToRoute\('mypage_deckentry_check'|CardUtil|decodeCardlist|session" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php ec-cube-enterprise/src/Eccube/Service/Front/Mypage/DeckEntryAction.php ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ActionInput/DeckEntryInput.php`
- 確認コマンド: `rg -n "CardUtil|decodeCardlist|convertCardNamesFromArenaFormat|evententry\.main_text|error_main|deckentry_edit|setDeckCards|persist\(|flush\(" pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4856,4863p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4901,4906p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4576,4576p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '99,154p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Front/Mypage/DeckEntryAction.php | sed -n '37,83p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ActionInput/DeckEntryInput.php | sed -n '22,31p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '68,76p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '149,257p'`
