import { EndBlock } from './components/EndBlock';
import { ListItemRoot } from './components/Root';
import { StartBlock } from './components/StartBlock';

type ListItemApi = typeof ListItemRoot & {
  EndBlock: typeof EndBlock;
  StartBlock: typeof StartBlock;
};

const ListItem = ListItemRoot as ListItemApi;
ListItem.StartBlock = StartBlock;
ListItem.EndBlock = EndBlock;

export { ListItem };
