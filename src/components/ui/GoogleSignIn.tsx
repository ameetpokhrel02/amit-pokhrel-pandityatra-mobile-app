// src/components/ui/GoogleSignIn.tsx
import React, { useEffect } from "react";
import { Button, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignIn({ onLogin }: { onLogin?: (token: string) => void }) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.expoConfig?.extra?.expoPublicGoogleClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    webClientId: Constants.expoConfig?.extra?.webClientId,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      Alert.alert("Login Successful", `Access Token: ${token}`);
      if (onLogin && token) onLogin(token);
    }
  }, [response, onLogin]);

  return (
    <Button
      disabled={!request}
      title="Login with Google"
      onPress={() => promptAsync()}
    />
  );
}