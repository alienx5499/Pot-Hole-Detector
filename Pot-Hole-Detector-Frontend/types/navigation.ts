export type RootStackParamList = {
  maps: { imageUri: string; result: any };
  camera: undefined;
  index: undefined;
  dashboard: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 