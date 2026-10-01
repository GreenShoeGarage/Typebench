// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
import {searchText} from './search-engine.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,matches:searchText(data)});}catch(e){self.postMessage({id:data.id,error:'Invalid expression: '+e.message});}};
