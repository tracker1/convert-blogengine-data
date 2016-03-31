import path from 'path';
import fs from 'mz/fs';
import yaml from 'js-yaml';

export default async function writePost(post) {
  var content = post.content;
  var h = {...post};
  
  //if do not publush - delete publish date
  if (h.published && h.date) {
    delete h.published;
  } else {
    h.published = false;
    h.date = null;
  }
  
  //delete unused legacy bits
  //delete h.id;
  //delete h.oldSlug;
  
  //don't include content in headers
  delete h.content;
  
  //add layout
  //h.layout = 'post';
  
  var y = h.date ? h.date.getFullYear() : '_draft';
  var ymd = h.date ? h.date.toJSON().substr(0,10) : '0000';
  var fp = path.resolve(__dirname, `../output/posts/${y}/${ymd}-${h.slug}/index.md`);
  var article = [
    '---',
    yaml.safeDump(h).trim(),
    '---\n',
    content
  ].join('\n');
  
  await createPath(fp);
  await fs.writeFile(fp, article, 'utf8');
}

async function createPath(fp) {
  var top = path.resolve(__dirname,'..');
  var paths = [];
  while (fp != top) paths.push(fp = path.dirname(fp));
  
  paths.pop(); //remove base
  while (paths.length) {
    fp = paths.pop();
    var exists = await fs.exists(fp);
    if (!exists) {
      await fs.mkdir(fp);
    }
  }
}