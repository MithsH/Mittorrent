const dgram=require('dgram')
const crypto=require('crypto')
const torrentparser=require('.trackerparser.js')
const generateID=require('./generateID')





const Buffer=require('buffer').Buffer
const urlparse=require('url')


module.exports.getpeers=(torrent,callback)=>{
    const socket=dgram.createSocket('udp4')
    const rawurl=torrent.announce.toString('utf8')


    udpsend(socket,buildconnectmessage(),rawurl)

    socket.on('message',response=>{
        if(restype(response)==='connect'){
            const connectresp=parseconnectrequest(response)

            const announcemessage=buildannouncemessage(connectresp.connectionID)
            udpsend(socket,announcemessage,rawurl)


        }
        if(restype(response)=='announce'){
            const announceresp=parseannouncerequest(response)

            
        }

    })
    

}

   



function udpsend(socket, message, rawUrl, callback=()=>{}){
    const url=urlparse(rawUrl)
    socket.send(message, 0, message.length, url.port, url.host, callback)
    




}


function restype(resp){
    const action=resp.readUint32BE(0)
    if(action==0){return 'connect'}
    if(action==1){return 'announce'}


}

function buildconnectmessage(){
    const buff=Buffer.alloc(16)
    buff.writeUint32BE(0x417,0)// connectionID
    buff.writeUInt32BE(0x27101980,4)// second half of connection id
    
    buff.writeUInt32BE(0,8)//action 0-'connect'
    
    crypto.randomBytes(4).copy(buff,12)//transactionID random
  

    return buff



}

function parseconnectrequest(connectresp){

    return {
        action : connectresp.readUint32BE(0),
        connectionID : connectresp.readUint32BE(4),
        transactionID : connectresp.readUint32BE(8)
    }

}

function buildannouncemessage(connectionID,port=6882){
    const buff=Buffer.alloc(98)

    connectionID.copy(buff,0)//connectionID
    
    buff.writeUInt32BE(1,8)//action

    crypto.randomBytes(4).copy(buff,12)//transactionID (random)

    torrentparser.infohash(torrent).copy(buff,16)

    
  
    generateID.genId().copy(buff, 36); //peer
 
    Buffer.alloc(8).copy(buff, 56);// downloaded
  
    torrentparser.size(torrent).copy(buff, 64);// left

    Buffer.alloc(8).copy(buff, 72);  // uploaded
  
    buff.writeUInt32BE(0, 80);// event
 
    buff.writeUInt32BE(0, 80);

 
    crypto.randomBytes(4).copy(buff, 88);  // key

    buff.writeInt32BE(-1, 92);  // num want
 
    buff.writeUInt16BE(port, 96); // port

    return buff;
}

function parseannouncerequest(announceresp){
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
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }


}
