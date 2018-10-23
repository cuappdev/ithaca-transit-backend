const mung = require('express-mung');

/* Remove any classified information from the response. */
function redact(body, req, res) {
    if (body.secret) body.secret = '****';
    // ...
    return body;
}

module.exports = [
    mung.json(redact),
];
