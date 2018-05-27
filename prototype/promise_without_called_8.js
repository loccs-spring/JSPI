
function Promise(executor) {
    if (!(this instanceof Promise)) {
        return new Promise(executor);
    }

    if (typeof executor !== 'function') {
        throw new TypeError('Promise executor is not a function');
    }

    let _this = this
    _this.status = 'pending'
    _this.value = null
    _this.reason = null
    _this.onRejectedCallbacks = []
    _this.onResolvedCallbacks = []

    function resolve(value) {
        resolvePromise(_this,value,fulfill,reject)
    }

    function fulfill(value){ //只接收普通值
        if (_this.status === 'pending') {
            _this.status = 'resolved'
            _this.value = value
            _this.onResolvedCallbacks.forEach(function (fn) {
                fn()
            })
        }
    }

    function reject(reason) {
        if (_this.status === 'pending') {
            _this.status = 'rejected'
            _this.reason = reason
            _this.onRejectedCallbacks.forEach(function (fn) {
                fn()
            })
        }
    }



    try {
        executor(function (value) {
            resolve(value)
        }, function (reason) {
            reject(reason)
        })
    } catch (e) {
        console.log(e)
        reject(e)
    }

}


function resolvePromise(promise,x,resolve,reject) {

    if (promise === x) {//2.3.1
        return reject(new TypeError('循环引用了'))
    }
    //2.3.2
    if (x instanceof Promise) {
        //2.3.2.1
        if (x.status === 'pending') { //because x could resolved by a Promise Object
            x.then(function(y) {
                resolvePromise(promise, y, resolve, reject)
            }, reject)
        } else {
            //2.3.2.2     2.3.2.3
            //if it is resolved, it will never resolved by a Promise Object but a normal value;只可能是一个普通值
            x.then(resolve, reject)
        }
        return
    }
}

Promise.prototype.then = function (onFulfilled, onRejected) {

    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (value) {
        return value
    }
    onRejected = typeof onRejected === 'function' ? onRejected : function (err) {
        throw err
    }

    let _this = this
    let newPromise
    if (_this.status === 'resolved') {
        newPromise = new Promise(function (resolve, reject) {
            process.nextTick(function () {
                try {
                    let x = onFulfilled(_this.value)
                    resolve(x)
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    if (_this.status === 'rejected') {
        newPromise = new Promise(function (resolve, reject) {
            process.nextTick(function () {
                try {
                    let x = onRejected(_this.reason)
                    resolve(x)
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    if (_this.status === 'pending') {
        newPromise = new Promise(function (resolve, reject) {

            _this.onResolvedCallbacks.push(function () {
                process.nextTick(function () {
                    try {
                        let x = onFulfilled(_this.value)
                        resolve(x)
                    } catch (e) {
                        reject(e)
                    }
                })

            })


            _this.onRejectedCallbacks.push(function () {
                process.nextTick(function () {
                    try {
                        let x = onRejected(_this.reason)
                        resolve(x)
                    } catch (e) {
                        reject(e)
                    }
                })
            })

        })
    }
    return newPromise
};

//-------------test code--------------
(function (type) {

    return [() => {}, () => {
        new Promise((resolve, reject) => {
            resolve(new Promise((resolve) => {
                resolve(1)
            }))
            reject('error')
        }).then((value) => {
            console.log('success:', value)
        }, (reason) => {
            console.log('failed:', reason)
        })
    }, () => {
    }][type]

}(1)())


module.exports = Promise