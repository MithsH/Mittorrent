import bencode from 'bencode'
import crypto from 'crypto'
import { Buffer } from 'buffer'

export const infoHash = torrent => {
  const info = bencode.encode(torrent.info)
  return crypto.createHash('sha1').update(info).digest()
}

export const size = torrent => {
  const size = torrent.info.files ?
    torrent.info.files.map(file => file.length).reduce((a, b) => a + b) : torrent.info.length
    const mem = Buffer.alloc(8)
    mem.writeBigUInt64BE(BigInt(size))
  return mem
}