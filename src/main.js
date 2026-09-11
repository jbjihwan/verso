// 부트스트랩: 화면·오버레이 등록 → 앱 시작
import { app, startApp, registerScreens, registerOverlays, setRunValidator, render } from './ui/app.js';
import { initTips } from './ui/tooltip.js';
import { validateRun } from './core/run.js';
import { debugFight, debugWin, debugRoom, debugGive, debugRelic, debugPotion, debugBattle } from './ui/flow.js';
import * as title from './ui/screens/title.js';
import * as charselect from './ui/screens/charselect.js';
import * as map from './ui/screens/map.js';
import * as combat from './ui/screens/combat.js';
import * as reward from './ui/screens/reward.js';
import * as rest from './ui/screens/rest.js';
import * as shop from './ui/screens/shop.js';
import * as treasure from './ui/screens/treasure.js';
import * as event from './ui/screens/event.js';
import * as bossrelic from './ui/screens/bossrelic.js';
import * as result from './ui/screens/result.js';
import * as settings from './ui/screens/settings.js';
import * as confirm from './ui/screens/confirm.js';
import * as deck from './ui/screens/deck.js';
import * as inspect from './ui/screens/inspect.js';
import * as pick from './ui/screens/pick.js';
import * as potion from './ui/screens/potion.js';

registerScreens({ title, charselect, map, combat, reward, rest, shop, treasure, event, bossRelic: bossrelic, result });
registerOverlays({ settings, confirm, deck, inspect, pick, potion });
setRunValidator(validateRun);

const stage = document.getElementById('stage');
startApp(stage);
initTips(stage);

// ?debug=1 일 때만 콘솔 도구를 연다
if (app.debug) {
  window.verso = {
    app, render, fight: debugFight, win: debugWin, room: debugRoom,
    give: debugGive, relic: debugRelic, potion: debugPotion, battle: debugBattle,
  };
}
