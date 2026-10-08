import type { ComponentProps } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Card, Stack, Text } from '@design-system/ui-kit';

const meta = {
  component: Card,
  parameters: {
    docs: { description: { component: 'Styled surface container with color variants, border, and elevation.' } },
  },
  tags: ['autodocs'],
  title: 'Data Display/Card',
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof Card>;
export const Playground: Story = (props: ComponentProps<typeof Card>) => <Card {...props} />;

Playground.args = {
  children: 'Card',
};

Playground.argTypes = {
  borderRadius: { control: 'radio', options: ['xs', 's', 'm', 'l', 'xl', 'xxl'] },
  children: { control: 'text' },
  dataTest: { control: 'text' },
  padding: { control: 'radio', options: ['xs', 's', 'm', 'l', 'xl', 'xxl'] },
};

Playground.parameters = {
  controls: { exclude: ['children'] },
};

export const BorderRadius: Story = () => (
  <Stack direction="row" spacing="l" verticalAlign="center">
    <Card borderRadius="xs">Card XS</Card>
    <Card borderRadius="s">Card S</Card>
    <Card borderRadius="m">Card M</Card>
    <Card borderRadius="l">Card l</Card>
  </Stack>
);

BorderRadius.parameters = {
  docs: {
    description: {
      story: 'Use these examples if you want to use a different `border-radius`.',
    },
  },
};

export const Paddings: Story = () => (
  <Stack direction="row" spacing="l" verticalAlign="center">
    <Card padding="xs">Card XS</Card>
    <Card padding="s">Card S</Card>
    <Card padding="m">Card M</Card>
    <Card padding="l">Card l</Card>
  </Stack>
);

Paddings.parameters = {
  docs: {
    description: {
      story: 'Use these examples if you want to use smaller or larger Cards.',
    },
  },
};

const noop = () => void 0;

export const FullWidth: Story = () => <Card width="100%">Text</Card>;
FullWidth.parameters = {};

export const Colors: Story = () => (
  <Stack direction="row" spacing="l" verticalAlign="center">
    <Stack spacing="s">
      <Card color="primary" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          Primary (Default)
        </Text>
      </Card>
      <Card color="primary" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          Primary (Default) action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="primaryBlur" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          Primary blur
        </Text>
      </Card>
      <Card color="primaryBlur" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          Primary blur action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="accent" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          Accent
        </Text>
      </Card>
      <Card color="accent" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          Accent action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="surfaceCanvas" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          surfaceCanvas
        </Text>
      </Card>
      <Card color="surfaceCanvas" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          surfaceCanvas action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="surfaceElevation1" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          surfaceElevation 1
        </Text>
      </Card>
      <Card color="surfaceElevation1" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          surfaceElevation 1 action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="surfaceElevation2" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          surfaceElevation 2
        </Text>
      </Card>
      <Card color="surfaceElevation2" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          surfaceElevation 2 action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="surfaceOverlay" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          surfaceOverlay
        </Text>
      </Card>
      <Card color="surfaceOverlay" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          surfaceOverlay action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="accentTransparent" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          accentTransparent
        </Text>
      </Card>
      <Card color="accentTransparent" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          accentTransparent action
        </Text>
      </Card>
    </Stack>
    <Stack spacing="s">
      <Card color="positiveTransparent" padding="m">
        <Text color="contrast-primary" variant="S / Medium">
          positiveTransparent
        </Text>
      </Card>
      <Card color="positiveTransparent" padding="m" onClick={noop}>
        <Text color="contrast-primary" variant="S / Medium">
          positiveTransparent action
        </Text>
      </Card>
    </Stack>
  </Stack>
);
Colors.parameters = {};

export const Ai: Story = () => (
  <Stack direction="row" spacing="l" verticalAlign="center">
    <Stack spacing="s">
      <Card color="accent" padding="m" ai>
        <Text color="contrast-primary" variant="S / Medium">
          Accent
        </Text>
      </Card>
      <Card color="primary" padding="m" ai>
        <Text color="contrast-primary" variant="S / Medium">
          Primary (Default)
        </Text>
      </Card>
    </Stack>
  </Stack>
);
Ai.parameters = {};
