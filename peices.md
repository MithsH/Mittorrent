ID	Message	    Length	     Payload
—	Handshake	68	    special
—	Keep-alive	0	    none
0	Choke	    1	    none
1	Unchoke	    1	    none
2	Interested	1	    none
3	Not Interested	1	none
4	Have	       5	piece index (4B)
5	Bitfield	        1+X	bitfield
6	Request	      13	index + begin + length
7	Piece	9+X	        index + begin + data
8	Cancel	13	        index + begin + length
9	Port	3	        port (2B)