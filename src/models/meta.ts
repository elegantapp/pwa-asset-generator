export enum HTMLMetaNames {
  favicon = 'favicon',
  appleTouchIcon = 'appleTouchIcon',
  appleMobileWebAppCapable = 'appleMobileWebAppCapable',
  appleLaunchImage = 'appleLaunchImage',
  appleLaunchImageDarkMode = 'appleLaunchImageDarkMode',
  msTileImage = 'msTileImage',
}

export interface HTMLMeta {
  [HTMLMetaNames.favicon]?: string;
  [HTMLMetaNames.appleTouchIcon]?: string;
  [HTMLMetaNames.appleMobileWebAppCapable]: string;
  [HTMLMetaNames.appleLaunchImage]?: string;
  [HTMLMetaNames.appleLaunchImageDarkMode]?: string;
  [HTMLMetaNames.msTileImage]?: string;
}

export interface HTMLMetaSelector {
  name: keyof HTMLMeta;
  selector: string;
}
