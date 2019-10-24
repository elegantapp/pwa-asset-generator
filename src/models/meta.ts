export enum HTMLMetaNames {
  favicon = 'favicon',
  appleTouchIcon = 'appleTouchIcon',
  appleMobileWebAppCapable = 'appleMobileWebAppCapable',
  appleLaunchImage = 'appleLaunchImage',
  appleLaunchImageDarkMode = 'appleLaunchImageDarkMode',
}

export interface HTMLMeta {
  [HTMLMetaNames.favicon]?: string;
  [HTMLMetaNames.appleTouchIcon]?: string;
  [HTMLMetaNames.appleMobileWebAppCapable]: string;
  [HTMLMetaNames.appleLaunchImage]?: string;
  [HTMLMetaNames.appleLaunchImageDarkMode]?: string;
}

export interface HTMLMetaSelector {
  name: keyof HTMLMeta;
  selector: string;
}
