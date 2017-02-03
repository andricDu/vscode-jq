var fs = require('fs');

var isMac = /^darnwin/.test(process.platform);

if (isMac) {
  if (!fs.existsSync('/usr/local/opt/oniguruma/lib/libonig.3.dylib')) {
    fs.symlink(
      '/usr/local/opt/oniguruma/lib/libonig.4.dylib', 
      '/usr/local/opt/oniguruma/lib/libonig.3.dylib'),
      err => console.log(err || 'Finished linking libonig.3.dylib.')
  }
}