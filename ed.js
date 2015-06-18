#!/usr/bin/env node

var fs = require('fs');

var main = function () {

    var modes = {
        COMMAND: 0,
        INSERT: 1
    };

    var fileName,
        buf = [],
        curMode = modes.COMMAND,
        curPos = 0,
        commandPrompt = false,
        fileSize = 0,
        afterUnknownCommand = false;

    if (process.argv.length > 2) {

        fileName = process.argv[2];

        fs.exists(fileName, function (exists) {
           if (!exists) {
               process.stdout.write(fileName + ": No such file or directory\n");
           }
           else {
               fs.readFile(fileName, 'utf8', function (err, data) {
                   if (err) {
                       // TODO: handle error
                   }
                   data.toString().split('\n').forEach(function (x) {
                       if (!x) return;
                       buf.push(x);
                       fileSize += (x.length + 1); // +1 for newline symbol
                       curPos++;
                   });
           process.stdout.write(fileSize.toString() + '\n');
               });
           }
        });

    }

  function writeFile() {
    var stream = fs.createWriteStream(fileName);
    stream.once('open', function(fd) {
      buf.forEach(function (x) {
        stream.write(x + '\n');
      });
    });
  }

    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', function() {

        var chunk = process.stdin.read();

        if ('a\n' === chunk && curMode === modes.COMMAND) {
            curMode = modes.INSERT;
        }
        else if ('.\n' === chunk && curMode === modes.INSERT) {
            curMode = modes.COMMAND;
        }
        else if ('q\n' === chunk && curMode === modes.COMMAND) {
            process.exit(0);
        }
        else if ('w\n' === chunk && curMode === modes.COMMAND) {
            writeFile();
        }
        else if ('p\n' === chunk && curMode === modes.COMMAND) {
            console.log(buf[curPos-1]);
        }
        else if ('.\n' === chunk && curMode === modes.COMMAND) {
            console.log(buf[curPos-1]);
        }
        else if ('P\n' === chunk && curMode === modes.COMMAND) {
            commandPrompt = !commandPrompt;
        }
        else if ('$\n' === chunk && curMode === modes.COMMAND) {
            curPos = buf.length - 1;
            process.stdout.write(buf[curPos] + '\n');
        }
        else if (( '^\n' === chunk || '-\n' === chunk  ) && curMode === modes.COMMAND) {
            if (curPos === 1) {
                process.stdout.write('?\n');
                afterUnknownCommand = true;
            }
            else {
                curPos--;
                process.stdout.write(buf[curPos - 1] + '\n');
            }

        }
        else if ('+\n' === chunk && curMode === modes.COMMAND) {
            if (curPos > buf.length - 1) {
                process.stdout.write('?\n');
                afterUnknownCommand = true;
            }
            else {
                curPos++;
                process.stdout.write(buf[curPos - 1] + '\n');
            }

        }
        else if (( ',p\n' === chunk || '%p\n' === chunk ) && curMode === modes.COMMAND) {
            buf.forEach(function (x) {
                process.stdout.write(x + '\n');
            });
            curPos = buf.length;
        }
        else if (chunk && curMode === modes.COMMAND) {
            afterUnknownCommand = true;
            process.stdout.write('?\n');
        }
        else {
            buf.push(chunk);
        }

        if (commandPrompt && curMode === modes.COMMAND) {
            process.stdout.write('*');
        }

    });

    process.stdin.on('end', function() {
        process.stdout.write('end');
    });

};

if (require.main === module) {
    main();
}
