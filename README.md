Modular Alarm
Windows 기본 알람처럼 단순한 알람 목록에 모듈 개념을 더한 독립형 웹앱 및 Windows 실행 파일입니다.

실행 방법
ModularAlarm.exe를 더블클릭하면 주소창 없는 앱 창으로 실행됩니다. UI 파일, 알람 음원, Windows 알림 연결 기능은 실행 파일 안에 포함되어 있어 실행 파일 하나만 복사해도 기본 기능을 사용할 수 있습니다.

Windows 시작 시 자동 실행
EnableModularAlarmAutostart.cmd를 한 번 실행하면 Windows 로그인 시 ModularAlarm.exe가 자동으로 실행됩니다. 해제하려면 DisableModularAlarmAutostart.cmd를 실행합니다.

주요 기능
알람 추가, 수정, 삭제 및 활성화/일시정지
하나의 알람 안에 여러 시간 모듈 추가
모듈 제목·시간 수정 및 모듈별 활성화/삭제
반복 요일 설정
실제 시간에 맞춘 알람 음원·화면 알림·Windows 알림
Windows 알림 팝업의 알람 끄기 버튼
알람을 끌 때까지 음원 반복 재생
EN / 한 언어 토글
브라우저 로컬 저장
앱 창이 완전히 종료되면 알람 스케줄러도 종료됩니다. Windows 시작 시 자동 실행하려면 위의 자동 실행 등록 파일을 한 번 실행해야 합니다.

첫 번째 알람 훈련생 시간표는 평일 기준으로 09:50, 10:50, 11:50, 12:50, 14:50, 15:50, 16:50, 17:50에 울리도록 기본 설정되어 있습니다.

알람 소리는 alarm-sound.m4a를 사용합니다. 처음 실행하면 하단의 Enable sound & notifications 버튼을 한 번 눌러 소리 재생을 허용해 주세요. 실행 파일에서는 Windows 알림 연결도 함께 준비됩니다.

다른 컴퓨터에서 사용할 때에는 Windows 사용자별로 자동 실행 등록을 다시 해야 합니다. 기존 알람 설정과 알림 권한은 컴퓨터 및 Windows 사용자별로 저장되므로 폴더를 복사해도 함께 이동되지 않습니다.

파일 구성
ModularAlarm.exe: 단일 실행 파일 런처
EnableModularAlarmAutostart.cmd: Windows 시작 프로그램 등록
DisableModularAlarmAutostart.cmd: Windows 시작 프로그램 해제
index.html, styles.css, app.js: 개발 및 브라우저 테스트용 원본 파일
alarm-sound.m4a: 기본 알람 음원
