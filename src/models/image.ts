export type Orientation = 'landscape' | 'portrait' | null;

export interface Image {
  /**
   Name of the saved image file, without file extension
   */
  name: string;

  /**
   Image width in pixels
   */
  width: number;

  /**
   Image height in pixels
   */
  height: number;

  /**
   Device scale factor used for generating HTML meta tags for iOS splash screens
   Key defaults to undefined for icons

   */
  scaleFactor: number;

  /**
   Device orientation used for generating HTML meta tags for iOS splash screens
   Defaults to null for icons

   @default null
   */
  orientation: Orientation;
}

export interface SavedImage extends Image {
  /**
   Saved image path
   Path is relative to execution folder
   */
  path: string;
}
