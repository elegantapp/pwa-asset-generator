declare namespace PwaAssetGenerator {

  interface Options {
    /**
     Page background to use when image source is provided
     Same as css background property

     @default transparent
     */
    readonly background?: string;

    /**
     Making screenshots to be saved with a background color
     Uses white background when background option is not provided

     @default true
     */
    readonly opaque?: boolean;

    /**
     Padding to use when image source provided
     Same as css padding property

     @default "10%"
     */
    readonly padding?: string;

    /**
     Scraping Apple Human Interface guidelines to fetch splash screen specs

     @default true
     */
    readonly scrape?: boolean;

    /**
     Web app manifest file path to automatically update manifest file with the generated icons
     */
    readonly manifest?: string;

    /**
     Index html file path to automatically put splash screen and icon meta tags in
     */
    readonly index?: string;

    /**
     Image type

     @default png
     */
    readonly type?: 'png' | 'jpeg';

    /**
     Image quality: 0...100
     Enabled only for jpeg image type

     @default 100
     */
    readonly quality?: number;

    /**
     Only generate splash screens

     @default false
     */
    readonly splashOnly?: boolean;

    /**
     Only generate icons

     @default false
     */
    readonly iconOnly?: boolean;

    /**
     Only generate landscape splash screens
     Disabled when iconOnly option is provided

     @default false
     */
    readonly landscapeOnly?: boolean;

    /**
     Only generate portrait splash screens
     Disabled when iconOnly option is provided

     @default false
     */
    readonly portraitOnly?: boolean;
  }

  interface SavedImage {
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
     Defaults to null for icons

     @default null
     */
    scaleFactor: number | null;

    /**
     Saved image path
     Path is relative to execution folder
     */
    path: string;

    /**
     Device orientation used for generating HTML meta tags for iOS splash screens
     Defaults to null for icons

     @default null
     */
    orientation: 'landscape' | 'portrait' | null;
  }

  interface ManifestJsonIcon {
    /**
     A URL from which a user agent can fetch the image's data

     @tutorial https://www.w3.org/TR/appmanifest/#dom-imageresource-src
     @example //icons.example.com/lowres
     */
    src: string;

    /**
     A string consisting of an unordered set of unique space-separated tokens

     @tutorial https://www.w3.org/TR/appmanifest/#sizes-member
     @example 192x192
     */
    sizes?: string;

    /**
     Media type of the image
     The purpose of this member is to allow a user agent to ignore images of media types it does not support

     @tutorial https://www.w3.org/TR/appmanifest/#dom-imageresource-type
     @example image/png
     */
    type?: string;

    /**
     When an ImageResource is used as an icon, a developer can hint that
     the image is intended to serve some special purpose in the context of the host OS

     @tutorial https://www.w3.org/TR/appmanifest/#dfn-icon-purposes
     @default any
     */
    purpose?: 'badge' | 'maskable' | 'any';

    /**
     The platform member represents the platform to which a containing object applies

     @tutorial https://github.com/w3c/manifest/wiki/Platforms
     */
    platform?: 'chrome_web_store' | 'play' | 'itunes' | 'windows';
  }

  interface Result {
    /**
     Saved images array that keeps both splash screens and icons, with image properties

     @example
     ```javascript
     [{
       name: 'apple-splash-1136-640',
       width: 1136,
       height: 640,
       scaleFactor: 2,
       path: 'temp/apple-splash-1136-640.png',
       orientation: 'landscape'
     },
     {
       name: 'apple-icon-180',
       width: 180,
       height: 180,
       scaleFactor: null,
       path: 'temp/apple-icon-180.png',
       orientation: null
     }]
     ```
     */
    savedImages: SavedImage[];

    /**
     Meta tags to be added to index.html file

     @example
     ```html
     <link rel="apple-touch-icon" sizes="180x180" href="temp/apple-icon-180.png">
     <link rel="apple-touch-icon" sizes="167x167" href="temp/apple-icon-167.png">
     <link rel="apple-touch-icon" sizes="152x152" href="temp/apple-icon-152.png">
     <link rel="apple-touch-icon" sizes="120x120" href="temp/apple-icon-120.png">
     ```
     */
    htmlContent: string;

    /**
     Icons to be added to manifest.json's icons property

     @example
     ```json
     [{
      "src": "assets/pwa/manifest-icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
     },
     {
      "src": "assets/pwa/manifest-icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
     }]
     ```
     */
    manifestJsonContent: ManifestJsonIcon[];
  }

  /**
   Logger function to print out steps of the lib

   @param prefix - Shows the origin of the log, e.g. function name
   @param options - Option flags of the library in an object
   */
  interface Logger {
    (prefix: string, options?: Options): {
      raw(): string;
      log(): string;
      warn(): string;
      trace(): string;
      error(): string;
      success(): string;
    }
  }
}

declare const pwaAssetGenerator: {
  /**
   Generates PWA assets based on a source input and saves generated images in the output folder provided

   @param source - A local image file, a local HTML file, a remote image or remote HTML file path
   @param outputFolderPath - The path of the folder to save the images in
   @param options - Option flags of the library in an object, keeps default values
   @param logger - An optional logger function to log the output
   @returns A promise of result object that resolves when all images are generated and file updates are finalized

   @example
   ```javascript
   import pwaAssetGenerator = require('pwa-asset-generator');

   (async () => {
		const { savedImages, htmlContent, manifestJsonContent } = await pwaAssetGenerator.generateImages(
		  'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png',
		  './temp',
		   {
          scrape: false,
          background: "linear-gradient(to right, #fa709a 0%, #fee140 100%)",
          splashOnly: true,
          portraitOnly: true,
          log: false
		   });
	})();
   ```
   */
  generateImages(
    source: string,
    outputFolderPath: string,
    options?: PwaAssetGenerator.Options,
    logger?: PwaAssetGenerator.Logger,
  ): Promise<PwaAssetGenerator.Result>;
};

export = pwaAssetGenerator;
