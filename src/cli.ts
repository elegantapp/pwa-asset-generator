import meow from 'meow';
import preLogger from './helpers/logger';
import { generateImages } from './main';
import constants from './config/constants';

const cli = meow(
  `
$ pwa-asset-generator --help

  Usage
    $ pwa-asset-generator [source-file] [output-folder]

    The assets will be saved to the folder where the command is executed if no output-folder provided.

  Options
    -b --background             Page background to use when image source is provided: css value  [default: transparent]
    -o --opaque                 Shows white as canvas background and generates images without transparency  [default: true]
    -p --padding                Padding to use when image source provided: css value  [default: "10%"]
    -s --scrape                 Scraping Apple Human Interface guidelines to fetch splash screen specs  [default: true]
    -m --manifest               Web app manifest file path to automatically update manifest file with the generated icons
    -i --index                  Index HTML file path to automatically put splash screen and icon meta tags in
    -a --path                   Path prefix to prepend for href links generated for meta tags
    -h --path-override          Override the path of images used in href/src tags of manifest and HTML files
    -t --type                   Image type: png|jpg|jpeg  [default: png]
    -q --quality                Image quality: 0...100 (Only for JPEG)  [default: 100]
    -h --splash-only            Only generate splash screens  [default: false]
    -c --icon-only              Only generate icons  [default: false]
    -f --favicon                Generate favicon image and HTML meta tag  [default: false]
    -e --maskable               Declare icons in manifest file as maskable icons  [default: true]
    -l --landscape-only         Only generate landscape splash screens  [default: false]
    -r --portrait-only          Only generate portrait splash screens  [default: false]
    -d --dark-mode              Generate iOS splash screen meta with (prefers-color-scheme: dark) media attr  [default: false]
    -u --single-quotes          Generate HTML meta tags with single quotes  [default: false]
    -g --log                    Logs the steps of the library process  [default: true]

  Examples
    $ pwa-asset-generator logo.html
    $ pwa-asset-generator logo.svg -i ./index.html -m ./manifest.json
    $ pwa-asset-generator https://your-cdn-server.com/assets/logo.png ./ -t jpg -q 90 --splash-only --portrait-only
    $ pwa-asset-generator logo.svg ./assets --scrape false --icon-only --path "%PUBLIC_URL%"
    $ pwa-asset-generator logo.svg ./assets --icon-only --favicon --opaque false --maskable false
    $ pwa-asset-generator logo.svg ./assets --dark-mode --background dimgrey --splash-only --type jpeg --quality 80
    $ pwa-asset-generator logo.svg ./assets --padding "calc(50vh - 5%) calc(50vw - 10%)" --path-override "./your-custom-image-folder-path"
    $ pwa-asset-generator https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png ./temp -p "15%" -b "linear-gradient(to right, #fa709a 0%, #fee140 100%)"

  Flag examples
    --background "rgba(255, 255, 255, .5)"
    --opaque false
    --padding "10px"
    --scrape false
    --manifest ./src/manifest.json
    --index ./src/index.html
    --path "%PUBLIC_URL%"
    --path-override "./your-custom-image-folder-path"
    --type jpg
    --quality 80
    --splash-only
    --icon-only
    --favicon
    --maskable false
    --landscape-only
    --portrait-only
    --dark-mode
    --single-quotes
    --log false
`,
  // TODO: remove when inferred meow types are corrected
  /* eslint-disable */
  // @ts-ignore
  {
    flags: constants.FLAGS,
  } as meow.TypedFlags<any>,
  /* eslint-enable */
);
const logger = preLogger('cli', cli.flags);

(async (): Promise<void> => {
  try {
    await generateImages(cli.input[0], cli.input[1], cli.flags, logger);
    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
