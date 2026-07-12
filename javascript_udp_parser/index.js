import fs from 'fs'
import bencode from 'bencode'
import { getpeers } from './tracker.js'

const torrent = bencode.decode(fs.readFileSync('Training Day (2001) 1080p.BluRay.torrent'))

getpeers(torrent, (peers) => {
  console.log(peers)
})

