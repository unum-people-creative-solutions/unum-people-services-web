import { CognitoUserPool } from "amazon-cognito-identity-js";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

// Durante o build (SSR), as variáveis podem estar ausentes.
// Criamos uma instância dummy ou nula para evitar que o processo de build trave.
export const userPool = (userPoolId && clientId) 
  ? new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId,
    })
  : null as unknown as CognitoUserPool;
