module.exports = function substitute(string, substitutes) {
    return String(string).replace((/\\?\{([^{}]+)\}/g), function(match, name){
        if (match.charAt(0) === '\\') return match.slice(1);
        return (substitutes[name] != null) ? substitutes[name] : '';
    });
}