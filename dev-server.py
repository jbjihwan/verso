#!/usr/bin/env python3
"""로컬 개발 서버.

`python -m http.server` 로 띄우면 브라우저가 ES 모듈을 캐시해서, 코드를 고치고
새로고침해도 옛 코드가 계속 돌아가는 일이 생긴다(Coreward 2단계에서 실제로 겪음).
모든 응답에 no-store 를 붙여 원천 차단한다. 개발용이며 게임 코드와 무관하다.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass   # 요청마다 한 줄씩 찍히면 터미널이 시끄럽다


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    # 0.0.0.0 으로 열어야 같은 Wi-Fi 의 휴대폰에서도 접속할 수 있다
    print(f'http://127.0.0.1:{port}/   (Ctrl+C 로 종료)')
    ThreadingHTTPServer(('0.0.0.0', port), NoCacheHandler).serve_forever()
