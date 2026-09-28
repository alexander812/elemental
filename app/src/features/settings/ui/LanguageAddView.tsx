import { useMemo, useState } from 'react';

import { useUnit } from 'effector-react';

import { IconPlusBig } from '@elemental/icons';
import {
  Box,
  ButtonIcon,
  Card,
  EmptyScreen,
  Header,
  InputText,
  ListItem,
  Stack,
  Text,
} from '@elemental/ui-kit';

import { LANGUAGES_CATALOG } from '../../../lib/languages';
import { addLanguageFx, $languages } from '../../languages/store';
import { popScreen } from '../../navigation/store';

export function LanguageAddView() {
  const languages = useUnit($languages);

  const [query, setQuery] = useState('');
  const [addingCode, setAddingCode] = useState<string | null>(null);

  const available = useMemo(() => {
    const existing = new Set(languages.map((language) => language.code));
    const search = query.trim().toLowerCase();

    return LANGUAGES_CATALOG.filter(
      (language) =>
        !existing.has(language.code) &&
        (!search ||
          language.name.toLowerCase().includes(search) ||
          language.code.toLowerCase().includes(search)),
    );
  }, [languages, query]);

  const handleAdd = async (code: string) => {
    if (addingCode) return;

    setAddingCode(code);

    try {
      await addLanguageFx(code);
      popScreen();
    } catch {
      setAddingCode(null);
    }
  };

  return (
    <Box grow height="100%">
      <Header back text="Добавить язык" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack height="100%" spacing="m">
          <InputText
            fullWidth
            onClear={() => setQuery('')}
            placeholder="Название языка"
            size="m"
            value={query}
            onChange={setQuery}
          />
          {available.length === 0 ? (
            <EmptyScreen
              fullHeight
              icon={<IconPlusBig fontSize={24} />}
              text={query.trim() ? 'Ничего не найдено' : 'Все языки уже добавлены'}
            />
          ) : (
            <Card padding="0">
              {available.map((language) => (
                <ListItem
                  key={language.code}
                  data={{ code: language.code }}
                  onClick={(data) => handleAdd(data.code)}
                >
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
                        ariaLabel={`Добавить ${language.name}`}
                        icon={<IconPlusBig fontSize={24} />}
                        loading={addingCode === language.code}
                        variant="flat"
                      />
                    }
                  />
                </ListItem>
              ))}
            </Card>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
