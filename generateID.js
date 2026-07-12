import crypto from 'crypto'
import { Buffer } from 'buffer'

export const genId=()=> {
    const id = Buffer.alloc(20)
    crypto.randomBytes(20).copy(id, 0)
    Buffer.from('-MT001-').copy(id, 0)
    return id
}