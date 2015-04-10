import fs = require('fs');

try {
    fs.mkdirSync('./UserData');
} catch (e) { }