import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

const theme = create({
  appBg: '#0a0a0a',
  barSelectedColor: '#4763f0',
  base: 'dark',
  brandTitle: 'Elemental Design v.1.0.0',
  brandUrl: '/',
  colorPrimary: '#4763f0',
  colorSecondary: '#4763f0',
});

addons.setConfig({
  theme,
});
