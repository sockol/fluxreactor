
function API (){ 
  
    const _parseParams = (url, params) => {
      if (url && url.length !== 0 && !params) 
        return url;
  
      if (!url || url.length == 0) 
        return '/invalid/api/call';
   
      const l = url.split('/').filter(i => i.length);   
      Object.keys(params).forEach(k => {
        const v = params[k];
        if(!v)
          return console.warn(`Route [${url}] has a missing parameter [${k}]`);

        const index = l.findIndex(i => i === `:${k}`);
        if(index === -1)
          return console.warn(`Route [${url}] has an extra parameter [${k}]`);
        l[index] = v; 
      });

      l.forEach(v => {
        if(!v)console.log(l, url, params)
        if(v[0] === ':')
          return console.error(`Route [${url}] has a missing parameter [${v}]`);
      });
 
      return l.join('/');
    }
  
    const _parseQuery = (url, query = {}) => {
      if (!Object.keys(query).length) return url;
  
      let str = '';
          str = Object.keys(query).map(k => {
            let v = query[k];
            v = typeof v === 'string' ? encodeURIComponent(v) : v;
            return `&${k}=${v}`;
          });
          str = str.join('');
          str = str.substring(1, str.length);
          str = '?' + str;
   
      return url + str;
    }
  
    return {
      _parseQuery,
      _parseParams
    }
  }
  
  export default API;