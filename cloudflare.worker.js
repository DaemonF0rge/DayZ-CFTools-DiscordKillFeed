addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})



const config = {
	"ShowDistance": true,
    "Killfeeds": [
        {
            "Name": "", //Leave blank if you arn't going to have mulitple server
            "Webhook": "",
            "Secret": ""
        }/*, //remove the comments to add more servers
        {
		"Name": "US1", //Add ?server={ServerName} to the end of the URL for mulitple servers
            "Webhook": "",
            "Secret": ""
        }*/
    ]
};

function GetServerData(name){
    const KillfeedsArray = config.Killfeeds;
    for (var value of KillfeedsArray) {
        if(value.Name === name){
            return value;
        }
    }
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  let data = await request.json();
  console.log(data);
  let server = ""
  if (searchParams.has("server")){
	server = searchParams.get("server");
  }
  if (data.payload !== undefined && data.invoked !== undefined ) {
    let cfg = GetServerData(server);
    if (cfg !== undefined){
      const encoder = new TextEncoder();
      const msg = encoder.encode(data.invoked+":"+cfg.Secret);
      const hashBuffer = await crypto.subtle.digest(
        {
        name: "SHA-256",
        },
        msg, // The data you want to hash as an ArrayBuffer
      )
      const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
      console.log(hash)
      if (hash == data.signature){
        if (data.event == "player_kill"){
          let eventdata = data.payload;
          let victim = eventdata.names.victim;
          let killer = eventdata.names.murderer;
          let weapon = eventdata.weapon;
            let distance = "";
            if (config.ShowDistance){
              distance = " at " + eventdata.distance + "m";
            }
			
		// ------------------------------------------------------------
		//If you want to change the message change it here
          var message = ":skull: " + killer + " killed " + victim + " with a " + weapon + distance;
		// ------------------------------------------------------------
		  
          let response = await fetch(cfg.Webhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({"content": message})
          });
        }
        return new Response('OK', {status: 200 })
      } else {
          console.log("Error");
        return new Response('BAD', {status: 401 })
      }
    } else{
        return new Response('BAD', {status: 404 })
    }
  } else {
    return new Response('BAD', {status: 404 })
  }
}
