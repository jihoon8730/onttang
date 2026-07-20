# 실행 방법 (RUNNING)

## 터널 모드로 실행 (다른 네트워크 / 방화벽 환경)

폰과 컴퓨터가 **다른 와이파이**에 있거나, LTE·회사망 등으로 로컬 네트워크 접속이 막혔을 때 사용합니다.

```bash
npm run dev:tunnel
```

이 스크립트는 내부적으로 다음과 동일합니다:

```bash
EXPO_TUNNEL_SUBDOMAIN=onttang8730 expo start --tunnel
```

- `--tunnel` — ngrok 터널로 접속 URL을 외부에 노출합니다.
- `EXPO_TUNNEL_SUBDOMAIN=onttang8730` — 터널 서브도메인을 고정해, 매번 같은 URL(`onttang8730....`)로 접속됩니다.
- `@expo/ngrok`은 이미 `devDependencies`에 설치돼 있어 별도 설치가 필요 없습니다.

### 접속 방법

이 앱은 `expo-dev-client` + 네이버 지도 등 **네이티브 모듈**을 쓰기 때문에 **Expo Go로는 실행되지 않습니다.**
미리 빌드해 둔 **개발 클라이언트(dev client)** 앱으로 붙어야 합니다.

- **iOS**: 폰에 설치된 개발 클라이언트 앱을 열고, 터미널의 QR을 스캔하거나 URL을 직접 입력합니다.
- **Android**: 동일하게 개발 클라이언트 앱에서 QR 스캔 / URL 입력.

## 로컬(LAN) 모드로 실행 — 같은 와이파이일 때 (빠름)

폰과 컴퓨터가 **같은 와이파이**에 있으면 터널보다 훨씬 빠릅니다.

```bash
npm start
```

## iOS 시뮬레이터로 실행 (맥에서 개발할 때)

시뮬레이터는 진짜 애플 인증서는 필요 없지만, **ad-hoc 서명은 반드시 해야 합니다.**
터널도 필요 없고 `npm start`로 바로 붙습니다.

### 처음 한 번 — dev client 빌드 후 시뮬레이터에 설치

> ⚠️ **서명을 아예 끄면(`CODE_SIGNING_ALLOWED=NO`) 안 됩니다.**
> 무서명 빌드는 `expo-secure-store`가 iOS 키체인에 접근할 때
> `KeyChainException: A required entitlement isn't present` 에러를 냅니다.
> 시뮬레이터는 진짜 인증서 없이 **ad-hoc 서명(`CODE_SIGN_IDENTITY="-"`)** 만으로 해결되니,
> 아래처럼 서명을 켜서 빌드합니다. (`npx expo run:ios`는 실기기 서명을 요구해 시뮬레이터엔 부적합)

```bash
# 1) 부팅된 시뮬레이터 UDID 확인 (원하는 기기의 UUID 복사)
xcrun simctl list devices available | grep -i iphone

# 2) ad-hoc 서명으로 시뮬레이터용 빌드 (UDID는 위에서 확인한 값으로 교체)
cd ios && xcodebuild -workspace onttang.xcworkspace -scheme onttang \
  -configuration Debug -sdk iphonesimulator \
  -destination 'id=<시뮬레이터-UDID>' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=YES CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="-" && cd ..

# 3) 빌드 결과물을 시뮬레이터에 설치
xcrun simctl install <시뮬레이터-UDID> \
  ios/build/Build/Products/Debug-iphonesimulator/onttang.app

# 4) 시뮬레이터 앞으로 띄우고 앱 실행
open -a Simulator
xcrun simctl launch <시뮬레이터-UDID> com.jihoon8730.onttang
```

### 그 다음부터 — 일상 개발

한 번 설치하면 앱은 시뮬레이터에 남아 있습니다. Metro만 켜면 됩니다:

```bash
npm start
```

터미널에서 **`i`** 를 누르면 시뮬레이터에서 앱이 열립니다.
JS/화면 코드만 수정할 땐 저장하면 자동 반영(Fast Refresh)되고, **재빌드는 필요 없습니다.**

**재빌드가 필요한 경우** = 새 네이티브 패키지 추가, `app.config.ts`의 네이티브 설정 변경 등.
이때만 위 "처음 한 번" 빌드 명령을 다시 실행하세요.

## 네이티브 빌드 — 실기기 / Android

```bash
npm run ios       # expo run:ios (실기기는 애플 개발자 계정·코드 서명 필요)
npm run android   # expo run:android
```

## 참고

- 터널은 LAN보다 느립니다. 네트워크가 분리돼 있을 때만 쓰세요.
- 시뮬레이터는 같은 맥에서 도는 거라 터널이 필요 없습니다 — `npm start`가 맞습니다.
- iOS/Android 모두 서버 명령어는 동일하며, 접속 시 개발 클라이언트 앱에서 붙는 방식도 같습니다.
