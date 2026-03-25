import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Returns true if the app is running in the Expo Go app.
 * Returns false if it's running in a development build or production.
 */
export const isExpoGo = () => {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
};
