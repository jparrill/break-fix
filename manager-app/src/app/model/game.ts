import { Level } from './level';

export class Game {
  username: string;
  currentLevel: number;
  levels: Array<Level> = new Array();
  key: string;
  maxScore: number;
}
