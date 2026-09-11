// 부트스트랩: 화면·오버레이 등록 → 앱 시작
import { startApp, registerScreens, registerOverlays } from './ui/app.js';
import * as title from './ui/screens/title.js';
import * as settings from './ui/screens/settings.js';
import * as confirm from './ui/screens/confirm.js';

registerScreens({ title });
registerOverlays({ settings, confirm });

startApp(document.getElementById('stage'));
