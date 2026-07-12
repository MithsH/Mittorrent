import dgram from 'dgram'
import crypto from 'crypto'
import { URL } from 'url'
import {infoHash,size} from './trackerparser.js'
import { genId } from './generateID.js'
import { Buffer } from 'buffer'






export const getpeers = (torrent, callback) => {
    const trackers = []
    
    // Add primary announce URL
    if (torrent.announce) {
        trackers.push(Buffer.from(torrent.announce).toString('utf8'))
    }
    
    // Add announce-list trackers (flatten the tiers)
    if (torrent['announce-list']) {
        torrent['announce-list'].forEach(tier => {
            tier.forEach(url => {
                const urlStr = Buffer.from(url).toString('utf8')
                if (!trackers.includes(urlStr)) {
                    trackers.push(urlStr)
                }
            })
        })
    }
    
    tryNextTracker(trackers, 0, torrent, callback)
}

function tryNextTracker(trackers, index, torrent, callback) {
    if (index >= trackers.length) {
        console.error('All trackers failed')
        return
    }
    
    const rawurl = trackers[index]
    
    const socket = dgram.createSocket('udp4')

    // Bind the socket to listen for responses
    socket.bind()

    // Set a timeout in case the tracker doesn't respond
    const timeout = setTimeout(() => {
        socket.close()
        tryNextTracker(trackers, index + 1, torrent, callback)
    }, 5000)

    udpsend(socket, buildconnectmessage(), rawurl)

    socket.on('message', response => {
        const type = restype(response)
        
        if (type === 'connect') {
            const connectresp = parseconnectrequest(response)

            const announcemessage = buildannouncemessage(connectresp.connectionID, torrent)
            udpsend(socket, announcemessage, rawurl)

        }
        if (type == 'announce') {
            const announceresp = parseannouncerequest(response)

            clearTimeout(timeout)
            socket.close()
            callback(announceresp.peers)

        }

    })

    socket.on('error', () => {
        clearTimeout(timeout)
        socket.close()
        tryNextTracker(trackers, index + 1, torrent, callback)
    })
}

function udpsend(socket, message, rawUrl, callback=()=>{}){
    const urlString = Buffer.isBuffer(rawUrl) ? rawUrl.toString('utf8') : rawUrl
    const url = new URL(urlString)
    socket.send(message, 0, message.length, url.port, url.hostname, callback)
}





function restype(resp){
    const action=resp.readUint32BE(0)
    if(action==0){return 'connect'}
    if(action==1){return 'announce'}
    return undefined
}

function buildconnectmessage(){
    const buff = Buffer.alloc(16)
    buff.writeBigUInt64BE(0x41727101980n, 0)// connectionID
    
    
    buff.writeUInt32BE(0, 8)//action 0-'connect'
    
    crypto.randomBytes(4).copy(buff, 12)//transactionID random
  

    return buff



}

function parseconnectrequest(resp){

    return {
        action: resp.readUint32BE(0),
        transactionID: resp.readUint32BE(4),
        connectionID: resp.readBigUInt64BE(8)
    }

}

function buildannouncemessage(connectionID, torrent, port=6882){
    const buff = Buffer.alloc(98)

    buff.writeBigUInt64BE(connectionID, 0)//connectionID
    
    buff.writeUInt32BE(1, 8)//action

    crypto.randomBytes(4).copy(buff, 12)//transactionID (random)

    infoHash(torrent).copy(buff, 16)

    
  
    genId().copy(buff, 36); //peer
 
    Buffer.alloc(8).copy(buff, 56);// downloaded
  
    size(torrent).copy(buff, 64);// left

    Buffer.alloc(8).copy(buff, 72);  // uploaded
  
    buff.writeUint32BE(0, 80);// event

    buff.writeUint32BE(0,84)//ip address -0 default
 


 
    crypto.randomBytes(4).copy(buff, 88);  // key

    buff.writeInt32BE(-1, 92);  // num want
 
    buff.writeUInt16BE(port, 96); // port

    return buff;
}

function parseannouncerequest(resp){
    function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).map(b => b.toString()).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }


}
