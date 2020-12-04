export type Extension = 'png' | 'jpg';

export interface Options {
  /**
   Page background to use when image source is provided
   Same as css background property

   @default transparent
   */
  readonly background: string;

  /**
   Making screenshots to be saved with a background color
   Uses white background when background option is not provided

   @default true
   */
  readonly opaque: boolean;

  /**
   Padding to use when image source provided
   Same as css padding property

   @default "10%"
   */
  readonly padding: string;

  /**
   Scraping Apple Human Interface guidelines to fetch splash screen specs

   @default true
   */
  readonly scrape: boolean;

  /**
   Web app manifest file path to automatically update manifest file with the generated icons
   */
  readonly manifest?: string;

  /**
   Index html file path to automatically put splash screen and icon meta tags in
   */
  readonly index?: string;

  /**
   Path prefix to prepend for href links generated for meta tags

   @example "%PUBLIC_URL%"
   */
  readonly path?: string;

  /**
   Override the path of images used in href/src in Web App Manifest and HTML files

   @example "./your-custom-image-folder-path"
   */
  readonly pathOverride?: string;

  /**
   Image type

   @default jpg
   */
  readonly type: Extension;

  /**
   Image quality: 0...100
   Enabled only for jpeg image type

   @default 70
   */
  readonly quality: number;

  /**
   Only generate splash screens

   @default false
   */
  readonly splashOnly: boolean;

  /**
   Only generate icons

   @default false
   */
  readonly iconOnly: boolean;

  /**
   Only generate landscape splash screens
   Disabled when iconOnly option is provided

   @default false
   */
  readonly landscapeOnly: boolean;

  /**
   Only generate portrait splash screens
   Disabled when iconOnly option is provided

   @default false
   */
  readonly portraitOnly: boolean;

  /**
   Logs the steps of the library process

   @default true
   */
  readonly log: boolean;

  /**
   Generates HTML tags with single quotes

   @default false
   */
  readonly singleQuotes: boolean;

  /**
   Generate HTML meta tags by self-closing the tags

   @default false
   */
  readonly xhtml: boolean;

  /**
   Generate favicon images and HTML meta tags

   @default false
   */
  readonly favicon: boolean;

  /**
   Declare icons in manifest file as maskable icons

   @default true
   */
  readonly maskable: boolean;

  /**
   Generate iOS splash screen meta with (prefers-color-scheme: dark) media attr

   @default false
   */
  readonly darkMode: boolean;

  /**
   Generate Windows static tile icons and HTML meta tags

   @default false
   */
  readonly mstile: boolean;

  /**
   Disable sandbox on bundled Chromium on Linux platforms - not recommended

   @default false
   */
  readonly noSandbox: boolean;
}

export type CLIOptions = Partial<Options>;
