// TYPEBENCH — GPL-3.0-only.
export async function fingerprint(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function write(handle,bytes,expectedHash,allowOverwrite){
 if(expectedHash){const disk=new Uint8Array(await (await handle.getFile()).arrayBuffer());if(await fingerprint(disk)!==expectedHash&&!await allowOverwrite())return null;}
 let stream;
 try {stream=await handle.createWritable();await stream.write(bytes);await stream.close();return await fingerprint(bytes);}
 catch(e){try{await stream?.abort();}catch{}throw e;}
}

export function writeNative(handle,bytes,expectedHash,allowOverwrite){const run=()=>write(handle,bytes,expectedHash,allowOverwrite);return navigator.locks?navigator.locks.request("typebench-native:"+handle.name,run):run();}
