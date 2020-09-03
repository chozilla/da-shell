if(!Promise.prototype.finally) {
    Promise.prototype.finally = function (onResolveOrReject) {
        return this.catch((reason) => {
            onResolveOrReject();
            throw reason;
        }).then((value) => {
            onResolveOrReject();
            return value;
        });
    };
}