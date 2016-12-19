/**
 * Created by frank on 2016/12/6.
 */

const requireDir = require('../index')

requireDir('./recurse').then(function (res) {
    console.log(res)
})