// npm's `mkdir -p`/`cp -R` build step relied on Unix shell builtins; on
// Windows, `mkdir` is a cmd.exe builtin that doesn't understand `-p` and
// fails the build (GH-1280). fs.cpSync is cross-platform and needs no shell.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const copyMatching = (srcDir, destDir, pattern) => {
  mkdirSync(destDir, { recursive: true });
  for (const file of readdirSync(srcDir)) {
    if (pattern.test(file)) {
      cpSync(join(srcDir, file), join(destDir, file));
    }
  }
};

copyMatching('src/config', 'dist/config', /\.json$/);
copyMatching(
  'src/vendor/js-beautify',
  'dist/vendor/js-beautify',
  /\.cjs$|^LICENSE$/,
);
