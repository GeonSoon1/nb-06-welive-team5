//##############################################
//해당 파일의 대한 설명
//##############################################
// 제시해주신 types/express.d.ts 파일과 같은 구성을 Module Augmentation (모듈 보강) 또는 **Declaration Merging (선언 병합)**이라고 부릅니다.

// 구체적으로는 TypeScript에서 외부 라이브러리(여기서는 Express)가 정의해둔 타입(Request)에 사용자가 필요한 속성(user, auth)을 추가하여 **타입 정의를 확장(Extending Type Definitions)**하는 기법입니다.

// 코드 상세 설명
// 코드를 한 줄씩 분석해 드리겠습니다.
import { JwtPayload } from 'jsonwebtoken';

// 1. declare global
// 이 파일은 import 구문이 있어 '모듈'로 취급됩니다.
// 모듈 내부에서 전역 스코프(global scope)에 있는 타입을 수정하거나 추가할 때 사용합니다.
declare global {

    // 2. namespace Express
    // Express 라이브러리는 내부적으로 'Express'라는 네임스페이스를 사용해 타입을 관리합니다.
    // 이 네임스페이스 안으로 들어가서 작업을 하겠다는 의미입니다.
    namespace Express {

        // 3. interface Request
        // Express의 기본 'Request' 인터페이스와 이름이 같은 인터페이스를 선언합니다.
        // TypeScript는 같은 이름의 인터페이스가 있으면 자동으로 내용을 '병합(Merge)'합니다.
        // 즉, 기존 Express의 Request 속성들(body, params, query 등)에 아래 속성들이 추가됩니다.
        interface Request {

            // 4. user?: JwtPayload & { userId: number; };
            // req.user 속성을 추가합니다.
            // '?'는 선택적 속성(Optional)이라는 뜻으로, 토큰이 없는 요청에는 이 값이 없을 수도 있음을 의미합니다.
            // 타입은 JwtPayload(JWT 라이브러리 기본 타입)와 { userId: number }를 합친(Intersection) 형태입니다.
            user?: JwtPayload & { userId: number; };

            // 5. auth?: ...
            // req.auth 속성을 추가합니다. (express-jwt 최신 버전이나 특정 설정에서 사용됨)
            auth?: JwtPayload & { userId: number; };
        }
    }
}
// 왜 이렇게 구성하나요?
// TypeScript는 정적 타입 언어이므로, 기본적으로 Express의 req 객체에 user나 auth라는 속성이 있다는 것을 모릅니다.

// 만약 이 파일(types/express.d.ts)이 없다면, src/middlewares/auth.ts나 컨트롤러에서 req.user.userId에 접근하려고 할 때 다음과 같은 에러가 발생합니다.

// Property 'user' does not exist on type 'Request'. (Request 타입에 'user' 속성이 존재하지 않습니다.)

// 따라서, "내가 사용하는 Express의 Request 객체에는 인증 미들웨어를 거치면 user나 auth 정보가 담길 거야"라고 TypeScript 컴파일러에게 알려주기 위해 이 코드를 작성하는 것입니다.