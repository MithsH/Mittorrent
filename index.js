const fs=require('fs')
const bencode=require('bencode')
const tracker=require('tracker.js')

const torrent=bencode.decode(fs.readFileSync('Training Day (2001) 1080p.BluRay.torrent'))


