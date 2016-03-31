import cheerio from 'cheerio';

//side effects
export default async function patchPostFiles(post) {
  var $ = cheerio.load(post.content);
  var files = [];
  $('[href]').each((i,el) => patchEl(el, 'href'));
  $('[src]').each((i,el) => patchEl(el, 'src'));
  
  post.files = files;
  post.content = $.html();
    
  function patchEl(el, attr) {
    var tag = el.name;
    var found = false;
    el = $(el);
    el.attr('test',"true");
    var url = el.attr(attr).replace(/\+/g,'%20');
    if (~url.indexOf('//')) return;

    if (!~url.indexOf('/image.axd?picture=')) {
      url = decodeURIComponent(url.substr(url.indexOf('=')+1));
      found = true;
    }
    
    if (!~url.indexOf('/file.axd?file=')) {
      url = decodeURIComponent(url.substr(url.indexOf('=')+1));
      found = true;
    }
    
    if (!found) {
      console.log('mismatch', post.date.toJSON().substr(0,10), post.slug, tag, url);
      return;
    }
    
    var file = url.match(/[^\\\/]+$/)[0];
    
    files.push({url,file});
    el.attr(attr,`./files/${encodeURIComponent(file)}`);
    
    //console.log(post.date.toJSON().substr(0,10),post.slug,tag, url, file);
  }
}

  