import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { useUnit } from 'effector-react';

import { IconSettings, IconViewList } from '@elemental/icons';

import { DataView } from '../features/backup/ui/DataView';
import { CardCreateView } from '../features/card-create/ui/CardCreateView';
import { CardsRestoreView } from '../features/cards/ui/CardsRestoreView';
import { CardsView } from '../features/cards/ui/CardsView';
import { goToRoot, pushScreen, transitionEnded, $screen, $stack, $transition } from '../features/navigation/store';
import type { Screen } from '../features/navigation/store';
import { SetCreateView } from '../features/set-create/ui/SetCreateView';
import { LanguageAddView } from '../features/settings/ui/LanguageAddView';
import { LanguagesListView } from '../features/settings/ui/LanguagesListView';
import { LanguagesView } from '../features/settings/ui/LanguagesView';
import { MenuView } from '../features/settings/ui/MenuView';
import { ThemeView } from '../features/settings/ui/ThemeView';
import { SetsView } from '../features/sets/ui/SetsView';
import { TextAddView } from '../features/text-add/ui/TextAddView';
import { WordsTranslateView } from '../features/text-add/ui/WordsTranslateView';

import classes from './AppLayout.module.pcss';

function renderScreen(screen: Screen): ReactNode {
  switch (screen.name) {
    case 'sets':
      return <SetsView />;
    case 'set-create':
      return <SetCreateView />;
    case 'cards':
      return <CardsView key={screen.setId} setId={screen.setId} />;
    case 'card-create':
      return <CardCreateView cardId={screen.cardId} setId={screen.setId} />;
    case 'cards-restore':
      return <CardsRestoreView key={screen.setId} setId={screen.setId} />;
    case 'text-add':
      return <TextAddView key={screen.setId} setId={screen.setId} />;
    case 'words-translate':
      return <WordsTranslateView key={screen.setId} setId={screen.setId} />;
    case 'settings':
      return <MenuView />;
    case 'theme':
      return <ThemeView />;
    case 'languages':
      return <LanguagesView />;
    case 'languages-list':
      return <LanguagesListView />;
    case 'language-add':
      return <LanguageAddView />;
    case 'data':
      return <DataView />;
  }
}

function isSettingsScreen(name: Screen['name']): boolean {
  return (
    name === 'settings' ||
    name === 'theme' ||
    name === 'languages' ||
    name === 'languages-list' ||
    name === 'language-add' ||
    name === 'data'
  );
}

function AppFooter() {
  const screen = useUnit($screen);

  const isSetsActive = screen.name === 'sets';
  const isMenuActive = isSettingsScreen(screen.name);

  const handleSets = () => {
    if (screen.name === 'sets') return;
    goToRoot();
  };

  const handleMenu = () => {
    if (isSettingsScreen(screen.name)) return;
    pushScreen({ name: 'settings' });
  };

  return (
    <div className={classes.footer}>
      <button
        className={`${classes.footerButton} ${isSetsActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleSets}
      >
        <IconViewList fontSize={24} />
        Наборы
      </button>
      <button
        className={`${classes.footerButton} ${isMenuActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleMenu}
      >
        <IconSettings fontSize={24} />
        Настройки
      </button>
    </div>
  );
}

export function AppLayout() {
  const stack = useUnit($stack);
  const screen = useUnit($screen);
  const transition = useUnit($transition);

  const mainRef = useRef<HTMLElement>(null);

  const entering = transition.kind === 'push';
  const leavingScreen = transition.kind === 'pop' ? transition.screen : null;

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    if (!leavingScreen) return;

    const timer = setTimeout(() => transitionEnded(), 400);

    return () => clearTimeout(timer);
  }, [leavingScreen]);

  return (
    <div className={classes.app}>
      <main className={classes.main} ref={mainRef}>
        <div
          key={`${stack.length}-${screen.name}`}
          className={`${classes.screen} ${entering ? classes.screenEntering : ''}`}
        >
          {renderScreen(screen)}
        </div>
        {leavingScreen && (
          <div className={classes.screenExiting} onAnimationEnd={() => transitionEnded()}>
            {renderScreen(leavingScreen)}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
