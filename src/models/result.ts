import { SavedImage } from './image';
import { HTMLMeta } from './meta';

export interface ManifestJsonIcon {
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
  purpose?: string;

  /**
   The platform member represents the platform to which a containing object applies

   @tutorial https://github.com/w3c/manifest/wiki/Platforms
   */
  platform?: 'chrome_web_store' | 'play' | 'itunes' | 'windows';
}

export interface Result {
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
   ```javascript
   {
     favicon: '<link rel="icon" type="image/png" sizes="196x196" href="temp/favicon-196.png">\n',
     appleTouchIcon: '<link rel="apple-touch-icon" sizes="180x180" href="temp/apple-icon-180.png">\n';
     appleMobileWebAppCapable: '<meta name="apple-mobile-web-app-capable" content="yes">\n';
     appleLaunchImage: '<link rel="apple-touch-startup-image"\n    href="temp/apple-splash-2048-2732.png"\n    media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">\n';
     appleLaunchImageDarkMode: '<link rel="apple-touch-startup-image"\n    href="temp/apple-splash-dark-2048-2732.png"\n    media="(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">\n'
   }
   ```
   */
  htmlMeta: HTMLMeta;

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
