import { useMemo, useState } from 'react';

import { useUnit } from 'effector-react';

import { IconPlusBig, IconTrash } from '@elemental/icons';
import {
  Box,
  Button,
  ButtonIcon,
  Card,
  Header,
  ListItem,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit';

import { $languages, $languagesLoading, deleteLanguageFx } from '../../languages/store';
import { popScreen, pushScreen } from '../../navigation/store';
import { $sets } from '../../sets/store';
import { $originalLang, $translationLang } from '../../theme/store';

export function LanguagesListView() {
  const languages = useUnit($languages);
  const loading = useUnit($languagesLoading);
  const sets = useUnit($sets);
  const originalLang = useUnit($originalLang);
  const translationLang = useUnit($translationLang);
  const pending = useUnit(deleteLanguageFx.pending);

  const [confirmCode, setConfirmCode] = useState<string | null>(null);

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();

    sets.forEach((set) => {
      set.cards.forEach((card) => {
        Object.keys(card.texts).forEach((code) => {
          if (card.texts[code] !== undefined) {
            counts.set(code, (counts.get(code) ?? 0) + 1);
          }
        });
      });
    });

    return counts;
  }, [sets]);

  const isInUse = (code: string) => code === originalLang || code === translationLang;
  const hasInUse = languages.some((language) => isInUse(language.code));

  const handleDelete = async (code: string) => {
    try {
      await deleteLanguageFx(code);
    } catch {
      setConfirmCode(null);
    }
  };

  if (loading) {
    return (
      <Box grow height="100%">
        <Header back text="Языки" onBackClick={() => popScreen()} />
        <Stack grow horizontalAlign="center" verticalAlign="center" height="100%">
          <Spinner size="l" />
        </Stack>
      </Box>
    );
  }

  return (
    <Box grow height="100%">
      <Header back text="Языки" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack height="100%" spacing="m">
          <Card padding="0">
            {languages.map((language) =>
              confirmCode === language.code ? (
                <ListItem key={language.code} data={{ code: language.code }}>
                  <ListItem.StartBlock
                    subtitle={
                      <Text color="contrast-secondary" variant="XS / Medium">
                        Карточки с этим языком ({cardCounts.get(language.code) ?? 0}) будут удалены
                      </Text>
                    }
                    title={<Text variant="M / Medium">Удалить «{language.name}»?</Text>}
                  />
                  <ListItem.EndBlock
                    content={
                      <Stack direction="row" spacing="s">
                        <Button
                          color="negative"
                          loading={pending}
                          size="xs"
                          onClick={() => handleDelete(language.code)}
                        >
                          Удалить
                        </Button>
                        <Button size="xs" variant="secondary" onClick={() => setConfirmCode(null)}>
                          Отмена
                        </Button>
                      </Stack>
                    }
                  />
                </ListItem>
              ) : (
                <ListItem key={language.code} data={{ code: language.code }}>
                  <ListItem.StartBlock
                    subtitle={
                      <Text color="contrast-tertiary" variant="XS / Medium">
                        {language.code.toUpperCase()}
                      </Text>
                    }
                    title={<Text variant="M / Medium">{language.name}</Text>}
                  />
                  <ListItem.EndBlock
                    content={
                      <ButtonIcon
                        ariaLabel={`Удалить ${language.name}`}
                        disabled={isInUse(language.code)}
                        icon={<IconTrash fontSize={24} />}
                        variant="flat"
                        onClick={() => setConfirmCode(language.code)}
                      />
                    }
                  />
                </ListItem>
              ),
            )}
          </Card>
          {hasInUse && (
            <Text align="center" color="contrast-tertiary" variant="XS / Medium">
              Язык, выбранный в настройках, удалить нельзя
            </Text>
          )}
          <Box grow />
          <Button
            fullWidth
            startIcon={<IconPlusBig fontSize={16} />}
            variant="secondary"
            onClick={() => pushScreen({ name: 'language-add' })}
          >
            Добавить
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
