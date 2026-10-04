import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { useUnit } from 'effector-react';

import { IconScan } from '@elemental/icons';

import {
  Box,
  Button,
  FormHelperText,
  Header,
  Select,
  Stack,
  Text,
  Textarea,
} from '@elemental/ui-kit';

import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  getLanguageName,
} from '../../../lib/languages';
import { isNativeBridgeAvailable } from '../../../lib/nativeBridge';
import { $languages } from '../../languages/store';
import { popScreen, pushScreen, $transition } from '../../navigation/store';
import { $sets } from '../../sets/store';
import {
  pairsCreated,
  resetTextAdd,
  scanTextFx,
  textChanged,
  textEditRequested,
  textLangChanged,
  textParsed,
  wordToggled,
  wordsMerged,
  $scanFailed,
  $selected,
  $step,
  $text,
  $textLang,
  $words,
} from '../store';

import classes from './TextAddView.module.pcss';

const DRAG_SLOP = 8;

type ChipDrag = {
  active: boolean;
  pointerId: number;
  startWord: string;
  startX: number;
  startY: number;
  words: string[];
};

export function TextAddView({ setId }: { setId: string }) {
  const text = useUnit($text);
  const step = useUnit($step);
  const words = useUnit($words);
  const selected = useUnit($selected);
  const transition = useUnit($transition);
  const sets = useUnit($sets);
  const languages = useUnit($languages);
  const storedTextLang = useUnit($textLang);
  const set = sets.find((item) => item.id === setId);
  const originalLang = set?.originalLang ?? DEFAULT_ORIGINAL_LANG;
  const translationLang = set?.translationLang ?? DEFAULT_TRANSLATION_LANG;
  const textLang = storedTextLang ?? originalLang;
  const textField = textLang === translationLang ? 'translation' : 'original';
  const langOptions = [
    { label: `Оригинал · ${getLanguageName(originalLang, languages)}`, value: originalLang },
    { label: `Перевод · ${getLanguageName(translationLang, languages)}`, value: translationLang },
  ];
  const scanPending = useUnit(scanTextFx.pending);
  const scanFailed = useUnit($scanFailed);

  const [dragWords, setDragWords] = useState<string[]>([]);

  const dragRef = useRef<ChipDrag | null>(null);
  const suppressClickRef = useRef(false);
  const touchBlockerRef = useRef<((event: TouchEvent) => void) | null>(null);

  const scanAvailable = isNativeBridgeAvailable();

  const shouldResetRef = useRef(transition.kind === 'push');

  useEffect(() => {
    if (shouldResetRef.current) resetTextAdd();
  }, []);

  const setTouchBlocked = (blocked: boolean) => {
    if (blocked) {
      if (!touchBlockerRef.current) {
        touchBlockerRef.current = (event: TouchEvent) => {
          event.preventDefault();
        };
        document.addEventListener('touchmove', touchBlockerRef.current, { passive: false });
      }
    } else if (touchBlockerRef.current) {
      document.removeEventListener('touchmove', touchBlockerRef.current);
      touchBlockerRef.current = null;
    }
  };

  useEffect(() => {
    return () => setTouchBlocked(false);
  }, []);

  const findWordAt = (clientX: number, clientY: number): string | null => {
    const element = document.elementFromPoint(clientX, clientY);
    const word = element?.closest<HTMLElement>('[data-word]');

    return word?.dataset.word ?? null;
  };

  const handleWordPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, word: string) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    suppressClickRef.current = false;
    dragRef.current = {
      active: false,
      pointerId: event.pointerId,
      startWord: word,
      startX: event.clientX,
      startY: event.clientY,
      words: [],
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.active) {
      const moveX = event.clientX - drag.startX;
      const moveY = event.clientY - drag.startY;

      if (Math.hypot(moveX, moveY) < DRAG_SLOP) return;

      if (event.pointerType !== 'mouse' && Math.abs(moveY) > Math.abs(moveX)) {
        dragRef.current = null;
        setDragWords([]);
        suppressClickRef.current = true;
        return;
      }

      drag.active = true;
      drag.words = [drag.startWord];
      setDragWords([drag.startWord]);
      setTouchBlocked(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    const word = findWordAt(event.clientX, event.clientY);

    if (word && !drag.words.includes(word)) {
      drag.words.push(word);
      setDragWords([...drag.words]);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragWords([]);

    if (!drag.active) return;

    setTouchBlocked(false);
    suppressClickRef.current = true;

    if (drag.words.length > 1) {
      wordsMerged(drag.words);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragWords([]);
    setTouchBlocked(false);
  };

  const handleWordClick = (word: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    wordToggled(word);
  };

  const canParse = text.trim().length > 0;
  const canProcess = selected.length > 0;

  const handleProcess = () => {
    pairsCreated(textField);
    pushScreen({ name: 'words-translate', setId });
  };

  return (
    <div className={classes.root}>
      <Header back text="Добавить текст" onBackClick={() => popScreen()} />
      {step === 'input' ? (
        <Box grow padding="m">
          <Stack spacing="l">
            <Textarea
              fullWidth
              placeholder="Введите или вставьте текст"
              rows={6}
              value={text}
              onChange={textChanged}
            />
            <Stack spacing="s">
              <Text color="contrast-secondary" variant="XS / Medium">
                Язык текста
              </Text>
              <Select
                fullWidth
                options={langOptions}
                value={textLang}
                onChange={textLangChanged}
              />
            </Stack>
            {scanAvailable ? (
              <Button
                disabled={scanPending}
                fullWidth
                loading={scanPending}
                startIcon={<IconScan fontSize={24} />}
                variant="secondary"
                onClick={() => scanTextFx(textLang)}
              >
                Сканировать текст
              </Button>
            ) : null}
            {scanFailed ? (
              <FormHelperText variant="error">Не удалось распознать текст</FormHelperText>
            ) : null}
            <Button disabled={!canParse} fullWidth onClick={() => textParsed()}>
              Разобрать
            </Button>
          </Stack>
        </Box>
      ) : (
        <div className={classes.layout}>
          <div
            className={classes.wordsScroll}
            onPointerCancel={handlePointerCancel}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className={classes.words}>
              {words.map((word) => {
                const checked = selected.includes(word) || dragWords.includes(word);

                return (
                  <button
                    key={word}
                    aria-pressed={checked}
                    className={checked ? `${classes.word} ${classes.wordChecked}` : classes.word}
                    data-word={word}
                    type="button"
                    onClick={() => handleWordClick(word)}
                    onPointerDown={(event) => handleWordPointerDown(event, word)}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={classes.footer}>
            <Text color="contrast-secondary" variant="XS / Medium">
              {selected.length > 0
                ? `Выбрано слов: ${selected.length}`
                : 'Нажмите на слова или проведите пальцем по соседним, чтобы объединить их в выражение'}
            </Text>
            <Button disabled={!canProcess} fullWidth onClick={handleProcess}>
              Обработать
            </Button>
            <Button fullWidth variant="secondary" onClick={() => textEditRequested()}>
              Изменить текст
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
