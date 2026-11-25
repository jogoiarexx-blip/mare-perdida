import './styles.css';
import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
const uiRoot = document.getElementById('ui-root');

if (canvas && uiRoot) {
  const game = new Game(canvas, uiRoot);
  void game.boot();
}
