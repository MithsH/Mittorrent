const crypto=require('crypto')
const buffer=require('buffer').Buffer

const id=null

module.exports.genID=()=>{
    crypto.randomBytes(20)
    buffer.from('-MT001-').copy(id,0)

    return id

}