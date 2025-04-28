export interface Document {
  id: string;
  name: string;
  folder_id?: string | null;
  is_favorite: boolean;
  is_folder: boolean;
  path?: string;
  size?: number;
  ext?: string;
  color?: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  MainRoutes: undefined;
  Home: undefined;
  Highlights: undefined;
  HomePage: undefined;
  HighlightsPage: undefined;
  OpenFolderPage: { item: Document };
  MyAccountPage: undefined;
};