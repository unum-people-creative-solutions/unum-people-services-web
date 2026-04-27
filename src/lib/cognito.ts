import { CognitoUserPool } from "amazon-cognito-identity-js";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

// Validação básica para ajudar no debug em produção
if (typeof window !== "undefined" && (!userPoolId || !clientId)) {
  console.error(
    "ERRO: Variáveis de ambiente do Cognito (User Pool ID ou Client ID) não foram encontradas.\n" +
    "Verifique se NEXT_PUBLIC_COGNITO_USER_POOL_ID e NEXT_PUBLIC_COGNITO_CLIENT_ID estão configuradas no seu ambiente de deploy (Netlify/Vercel/GitHub Secrets)."
  );
}

export const userPool = new CognitoUserPool({
  UserPoolId: userPoolId || "undefined",
  ClientId: clientId || "undefined",
});
