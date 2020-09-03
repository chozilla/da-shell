module.exports = function formatTime(format = 'short', time = undefined) {
    time = time || new Date();
    let d = time.toISOString().split('.')[0].split('T');
    switch (format) {
        case 'long':
            return d[1] + ' ' + d[0];
        default:
            return d[1];
    }
};