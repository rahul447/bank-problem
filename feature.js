var spawn = require('child_process').spawn;
var execute = spawn('npm', ['run', 'feature']);
execute.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});
execute.stderr.on('data', function (error) {
    console.log('stderr: ' + error);
});
execute.on('close', function (code) {
    console.log('child process exited with code ' + code);
});
